from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
import os

from .models import Department, Program, Course, Resource, StudentProfile
from .serializers import (
    DepartmentSerializer, ProgramSerializer, CourseSerializer,
    ResourceSerializer, RegisterSerializer, LoginSerializer,
    UserProfileSerializer, LecturerModulesSerializer,
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def _get_user_profile(user):
    """Safely return the user's StudentProfile, or None."""
    try:
        return user.profile
    except StudentProfile.DoesNotExist:
        return None
    except Exception:
        return None


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
    """
    Return courses.
    - Public callers: all courses (or filtered by ?program=<id>).
    - Authenticated users: auto-scoped to their program.
    """
    qs = Course.objects.all()

    if request.user.is_authenticated:
        profile = _get_user_profile(request.user)
        if profile and profile.program:
            qs = qs.filter(program=profile.program)

    program_id = request.GET.get('program')
    if program_id:
        qs = qs.filter(program_id=program_id)

    serializer = CourseSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_resources(request):
    """
    List approved resources.
    - Authenticated users: auto-scoped to their program + shared resources.
    - Anonymous: all approved resources.
    """
    resources = Resource.objects.filter(is_approved=True)

    if request.user.is_authenticated:
        profile = _get_user_profile(request.user)
        if profile and profile.program:
            resources = resources.filter(
                Q(course__program=profile.program) | Q(is_shared=True)
            )

    dept_id = request.GET.get('department')
    if dept_id:
        if dept_id.isdigit():
            resources = resources.filter(course__program__department_id=dept_id)
        else:
            resources = resources.filter(course__program__department__code=dept_id)

    program_id = request.GET.get('program')
    if program_id:
        if program_id.isdigit():
            resources = resources.filter(course__program_id=program_id)
        else:
            resources = resources.filter(course__program__code=program_id)

    course_id = request.GET.get('course')
    if course_id:
        if course_id.isdigit():
            resources = resources.filter(course_id=course_id)
        else:
            resources = resources.filter(course__code=course_id)

    year = request.GET.get('year')
    if year:
        resources = resources.filter(year_of_study=year)

    semester = request.GET.get('semester')
    if semester:
        resources = resources.filter(semester=semester)

    resource_type = request.GET.get('type')
    if resource_type:
        resources = resources.filter(resource_type=resource_type)

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

    Auto-approval rules:
    - Student  → is_approved=False (waits for lecturer review)
    - Lecturer → is_approved=True  (auto-approved)
    - Admin    → is_approved=True  (auto-approved)

    Course access:
    - Student:  must belong to their programme
    - Lecturer: must be one of their taught modules
    - Admin:    unrestricted
    """
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
        course = Course.objects.select_related('program').get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {'course': [f'Course with ID {course_id} does not exist.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Access validation per role
    profile = _get_user_profile(request.user)
    if profile and profile.role != 'admin':
        if profile.role == 'student':
            if profile.program and course.program != profile.program:
                return Response(
                    {'course': ['You can only upload to courses in your programme.']},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif profile.role == 'lecturer':
            if not profile.taught_modules.filter(id=course.id).exists():
                return Response(
                    {'course': ['You can only upload to modules you teach.']},
                    status=status.HTTP_403_FORBIDDEN,
                )

    # Validate file type and size
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

    # ✅ Determine auto-approval based on role
    user_role = profile.role if profile else 'student'
    should_auto_approve = user_role in ('lecturer', 'admin')

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
        is_approved=should_auto_approve,
        approved_by=request.user if should_auto_approve else None,
        approved_date=timezone.now() if should_auto_approve else None,
        is_shared=is_shared,
    )

    return Response(ResourceSerializer(resource).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_submissions(request):
    """Return resources uploaded by the current user."""
    resources = Resource.objects.filter(uploaded_by=request.user).order_by('-upload_date')
    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)


# ============================================================
# LECTURER ENDPOINTS
# ============================================================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def lecturer_modules(request):
    """
    GET:  Return the lecturer's taught modules.
    PUT:  Replace the lecturer's taught modules (body: { module_ids: [...] }).
    """
    profile = _get_user_profile(request.user)
    if not profile or profile.role != 'lecturer':
        return Response(
            {'error': 'This endpoint is only for lecturers.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'GET':
        modules = profile.taught_modules.all().values('id', 'code', 'name')
        return Response(list(modules))

    # PUT
    serializer = LecturerModulesSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    module_ids = serializer.validated_data['module_ids']
    modules = Course.objects.filter(id__in=module_ids)

    if profile.program:
        invalid = modules.exclude(program=profile.program)
        if invalid.exists():
            return Response(
                {'module_ids': ['All modules must belong to your programme.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

    profile.taught_modules.set(modules)
    return Response({
        'message': 'Modules updated successfully.',
        'taught_modules': list(profile.taught_modules.values('id', 'code', 'name')),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lecturer_pending_submissions(request):
    """
    Return pending resources uploaded for courses the lecturer teaches.
    Excludes resources uploaded by the lecturer themselves.
    """
    profile = _get_user_profile(request.user)
    if not profile or profile.role != 'lecturer':
        return Response(
            {'error': 'This endpoint is only for lecturers.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    taught_ids = profile.get_taught_course_ids()
    if not taught_ids:
        return Response([])

    resources = Resource.objects.filter(
        course_id__in=taught_ids,
        is_approved=False,
    ).exclude(uploaded_by=request.user).order_by('-upload_date')

    serializer = ResourceSerializer(resources, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def lecturer_decide_submission(request, resource_id):
    """
    Approve or reject a submission.
    Body: { action: 'approve' | 'reject' }
    Only allowed for courses the lecturer teaches.
    """
    profile = _get_user_profile(request.user)
    if not profile or profile.role != 'lecturer':
        return Response(
            {'error': 'This endpoint is only for lecturers.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        resource = Resource.objects.get(id=resource_id)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not profile.taught_modules.filter(id=resource.course_id).exists():
        return Response(
            {'error': 'You do not teach this module.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    action = request.data.get('action', '').lower()
    if action == 'approve':
        resource.is_approved = True
        resource.approved_by = request.user
        resource.approved_date = timezone.now()
        resource.save()
        return Response({
            'message': 'Resource approved.',
            'resource': ResourceSerializer(resource).data,
        })
    elif action == 'reject':
        resource.delete()
        return Response({'message': 'Resource rejected and removed.'})
    else:
        return Response(
            {'error': "action must be 'approve' or 'reject'."},
            status=status.HTTP_400_BAD_REQUEST,
        )