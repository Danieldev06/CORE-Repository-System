from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q

from .models import Department, Program, Course, Resource
from .serializers import (
    DepartmentSerializer, ProgramSerializer, CourseSerializer,
    ResourceSerializer, RegisterSerializer, LoginSerializer,
    UserProfileSerializer,
)


# ============================================================
# PUBLIC API ENDPOINTS
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_departments(request):
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_programs(request):
    dept_id = request.GET.get('department')
    if dept_id:
        programs = Program.objects.filter(department_id=dept_id)
    else:
        programs = Program.objects.all()
    serializer = ProgramSerializer(programs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_courses(request):
    program_id = request.GET.get('program')
    if program_id:
        courses = Course.objects.filter(program_id=program_id)
    else:
        courses = Course.objects.all()
    serializer = CourseSerializer(courses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_resources(request):
    resources = Resource.objects.filter(is_approved=True)

    # Filter by department (ID or code)
    dept_id = request.GET.get('department')
    if dept_id:
        # Try numeric ID first, fall back to code
        if dept_id.isdigit():
            resources = resources.filter(course__program__department_id=dept_id)
        else:
            resources = resources.filter(course__program__department__code=dept_id)

    # Filter by program (ID or code)
    program_id = request.GET.get('program')
    if program_id:
        if program_id.isdigit():
            resources = resources.filter(course__program_id=program_id)
        else:
            resources = resources.filter(course__program__code=program_id)

    # Filter by course
    course_id = request.GET.get('course')
    if course_id:
        if course_id.isdigit():
            resources = resources.filter(course_id=course_id)
        else:
            resources = resources.filter(course__code=course_id)

    # Filter by year
    year = request.GET.get('year')
    if year:
        resources = resources.filter(year_of_study=year)

    # Filter by semester
    semester = request.GET.get('semester')
    if semester:
        resources = resources.filter(semester=semester)

    # Filter by type
    resource_type = request.GET.get('type')
    if resource_type:
        resources = resources.filter(resource_type=resource_type)

    # Search by keyword
    search = request.GET.get('search')
    if search:
        resources = resources.filter(
            Q(title__icontains=search) |
            Q(course__code__icontains=search) |
            Q(course__name__icontains=search)
        )

    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_resource_detail(request, resource_id):
    try:
        resource = Resource.objects.get(id=resource_id, is_approved=True)
        serializer = ResourceSerializer(resource)
        return Response(serializer.data)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND,
        )


# ============================================================
# AUTHENTICATION ENDPOINTS
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserProfileSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(username=email, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
            })
        return Response(
            {'error': 'Invalid email or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserProfileSerializer(request.user).data)


# ============================================================
# RESOURCE UPLOAD ENDPOINTS (Authenticated)
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_resource(request):
    """
    Upload a new resource.
    - Requires auth token.
    - File saves to media/resources/YYYY/MM/DD/
    - Auto-marks as is_approved=False
    """
    from .serializers import ResourceSerializer as RS

    title = request.data.get('title')
    course_id = request.data.get('course')
    year_of_study = request.data.get('year_of_study')
    semester = request.data.get('semester')
    resource_type = request.data.get('resource_type')
    file = request.FILES.get('file_pdf')
    is_shared = request.data.get('is_shared', 'false').lower() in ['true', '1', 'yes']

    # Basic validation
    errors = {}
    if not title:
        errors['title'] = ['Title is required.']
    if not course_id:
        errors['course'] = ['Course is required.']
    if not file:
        errors['file_pdf'] = ['File is required.']
    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    # Validate course exists
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {'course': [f'Course with ID {course_id} does not exist.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate file type and size
    import os
    if file.size > 50 * 1024 * 1024:
        return Response(
            {'file_pdf': ['File must be under 50MB.']},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ['.pdf', '.doc', '.docx']:
        return Response(
            {'file_pdf': ['Only PDF, DOC, and DOCX files are allowed.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create the resource
    resource = Resource.objects.create(
        title=title,
        course=course,
        year_of_study=int(year_of_study or 1),
        semester=int(semester or 1),
        resource_type=resource_type or 'NOTES',
        file_pdf=file,
        uploaded_by=request.user,
        uploaded_by_name=(
            f"{request.user.first_name} {request.user.last_name}".strip()
            or request.user.username
        ),
        is_approved=False,
        is_shared=is_shared,
    )

    return Response(RS(resource).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_submissions(request):
    """
    Return resources uploaded by the current user.
    """
    resources = Resource.objects.filter(uploaded_by=request.user).order_by('-upload_date')
    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)