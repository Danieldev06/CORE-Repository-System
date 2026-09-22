from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from django.http import FileResponse, HttpResponseRedirect
import os
import re
import requests

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


def _can_view_resource(user, resource):
    """
    Return True if the user is allowed to view/download this resource.
    - Approved resources: public
    - Unapproved resources: uploader, admin, or lecturer of that module
    """
    if resource.is_approved:
        return True

    if not user or not user.is_authenticated:
        return False

    if resource.uploaded_by_id == user.id:
        return True

    profile = _get_user_profile(user)
    if not profile:
        return False

    if profile.role == 'admin':
        return True

    if profile.role == 'lecturer':
        return profile.taught_modules.filter(id=resource.course_id).exists()

    return False


def _build_download_filename(resource):
    """
    Build a clean downloadable filename from the resource title.
    Always ends in .pdf since all our resources are PDFs.
    """
    base = re.sub(r'[^a-zA-Z0-9_\- ]', '', resource.title or '').strip()
    base = re.sub(r'\s+', '_', base) or 'resource'
    base = base[:80]
    if not base.lower().endswith('.pdf'):
        base += '.pdf'
    return base


def _guess_content_type(filename_or_url):
    """Return a content-type based on the file extension in the filename/url."""
    lower = (filename_or_url or '').lower()
    if lower.endswith('.pdf'):
        return 'application/pdf'
    if lower.endswith('.docx'):
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if lower.endswith('.doc'):
        return 'application/msword'
    return 'application/octet-stream'


def _try_fetch_cloudinary(url):
    """
    Try to fetch a Cloudinary URL.
    Returns a requests.Response on success, or None on failure.
    """
    try:
        r = requests.get(url, stream=True, timeout=20)
        r.raise_for_status()
        return r
    except requests.RequestException:
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


# ============================================================
# RESOURCE DETAIL + DOWNLOAD
# ============================================================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_resource_detail(request, resource_id):
    """
    Return a resource.
    - Approved resources: public
    - Unapproved resources: only uploader / lecturer in that module / admin
    """
    try:
        resource = Resource.objects.select_related('course', 'uploaded_by').get(id=resource_id)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not _can_view_resource(request.user, resource):
        return Response(
            {'error': 'Not authorized to view this resource.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(ResourceSerializer(resource).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def download_resource(request, resource_id):
    """
    Download a resource file.

    Permission rules are identical to get_resource_detail.

    - Local files: streamed directly from disk with a clean filename.
    - Cloudinary files: proxied through Django so we can control the
      Content-Type and Content-Disposition headers.

    Compatibility note: files uploaded before the Cloudinary PREFIX fix
    may have a redundant `/media/` segment in their URL. We try the
    cleaned URL first, and fall back to the original if needed.
    """
    try:
        resource = Resource.objects.select_related('course', 'uploaded_by').get(id=resource_id)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not _can_view_resource(request.user, resource):
        return Response(
            {'error': 'Not authorized to download this resource.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    resource.increment_download()

    clean_filename = _build_download_filename(resource)
    content_type = _guess_content_type(clean_filename)

    file_url = resource.file_pdf.url

    # ------------------------------------------------------------
    # Cloudinary → proxy through Django to fix headers
    # ------------------------------------------------------------
    if file_url.startswith('http://') or file_url.startswith('https://'):

        # Try the cleaned URL first (strip redundant /media/ segment)
        cleaned_url = file_url.replace('/media/', '/', 1)
        upstream = _try_fetch_cloudinary(cleaned_url)

        # Fall back to the original URL if the cleaned one fails
        if upstream is None and cleaned_url != file_url:
            upstream = _try_fetch_cloudinary(file_url)

        if upstream is None:
            return Response(
                {'error': f'Failed to fetch file from storage. The file may have been removed.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        response = FileResponse(
            upstream.raw,
            as_attachment=True,
            filename=clean_filename,
            content_type=content_type,
        )
        length = upstream.headers.get('Content-Length')
        if length:
            response['Content-Length'] = length
        return response

    # ------------------------------------------------------------
    # Local file → stream from disk
    # ------------------------------------------------------------
    try:
        file_path = resource.file_pdf.path
    except Exception:
        return Response(
            {'error': 'File not found on disk.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not os.path.exists(file_path):
        return Response(
            {'error': 'File not found on disk.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    return FileResponse(
        open(file_path, 'rb'),
        as_attachment=True,
        filename=clean_filename,
        content_type=content_type,
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
    """
    title = request.data.get('title')
    course_id = request.data.get('course')
    year_of_study = request.data.get('year_of_study')
    semester = request.data.get('semester')
    resource_type = request.data.get('resource_type')
    file = request.FILES.get('file_pdf')
    is_shared = request.data.get('is_shared', 'false').lower() in ['true', '1', 'yes']

    errors = {}
    if not title:
        errors['title'] = ['Title is required.']
    if not course_id:
        errors['course'] = ['Course is required.']
    if not file:
        errors['file_pdf'] = ['File is required.']
    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        course = Course.objects.select_related('program').get(id=course_id)
    except Course.DoesNotExist:
        return Response(
            {'course': [f'Course with ID {course_id} does not exist.']},
            status=status.HTTP_400_BAD_REQUEST,
        )

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

    user_role = profile.role if profile else 'student'
    should_auto_approve = user_role in ('lecturer', 'admin')

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
    profile = _get_user_profile(request.user)
    if not profile or profile.role != 'lecturer':
        return Response(
            {'error': 'This endpoint is only for lecturers.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == 'GET':
        modules = profile.taught_modules.all().values('id', 'code', 'name')
        return Response(list(modules))

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