from rest_framework import serializers
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Department, Program, Course, Resource, StudentProfile


# ============================================================
# DATA SERIALIZERS
# ============================================================

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    class Meta:
        model = Program
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    program_name = serializers.ReadOnlyField(source='program.name')
    department_name = serializers.ReadOnlyField(source='program.department.name')
    class Meta:
        model = Course
        fields = '__all__'


class ResourceSerializer(serializers.ModelSerializer):
    course_code = serializers.ReadOnlyField(source='course.code')
    course_name = serializers.ReadOnlyField(source='course.name')
    uploaded_by_username = serializers.ReadOnlyField(source='uploaded_by.username')
    class Meta:
        model = Resource
        fields = '__all__'


# ============================================================
# AUTH SERIALIZERS
# ============================================================

class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    student_id = serializers.CharField(max_length=20)
    faculty = serializers.CharField(max_length=20, required=False, allow_blank=True)
    program = serializers.CharField(max_length=50, required=False, allow_blank=True)
    year = serializers.CharField(max_length=5, required=False, allow_blank=True)
    role = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)

    # ✅ NEW: Lecturer's selected modules (list of Course IDs)
    module_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
    )

    def validate_email(self, value):
        valid_domains = [
            '@cavendish.ac.zm',
            '@students.cavendish.ac.zm',
            '@cavendish.co.zm',
            '@students.cavendish.co.zm',
        ]
        if not any(value.endswith(d) for d in valid_domains):
            raise serializers.ValidationError(
                'Please use a Cavendish University email address.'
            )
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate_student_id(self, value):
        if StudentProfile.objects.filter(student_id=value).exists():
            raise serializers.ValidationError('This ID is already registered.')
        return value

    def validate_role(self, value):
        if value not in ['student', 'lecturer', 'admin']:
            raise serializers.ValidationError(
                'Invalid role. Must be student, lecturer, or admin.'
            )
        return value

    def validate(self, attrs):
        """
        Cross-field validation:
        - Lecturers must select at least one module.
        - Module IDs must exist and belong to the lecturer's program.
        """
        role = attrs.get('role')
        module_ids = attrs.get('module_ids') or []
        program_code = attrs.get('program')

        if role == 'lecturer':
            if not program_code:
                raise serializers.ValidationError(
                    {'program': 'Lecturers must select a programme they teach.'}
                )
            if not module_ids:
                raise serializers.ValidationError(
                    {'module_ids': 'Please select at least one module you teach.'}
                )

            # Verify modules exist
            courses = Course.objects.filter(id__in=module_ids)
            if courses.count() != len(set(module_ids)):
                raise serializers.ValidationError(
                    {'module_ids': 'One or more selected modules do not exist.'}
                )

            # Verify all modules belong to the lecturer's program
            program = Program.objects.filter(code=program_code).first()
            if program:
                invalid = courses.exclude(program=program)
                if invalid.exists():
                    raise serializers.ValidationError(
                        {'module_ids': 'All selected modules must belong to your programme.'}
                    )

        return attrs

    def create(self, validated_data):
        role = validated_data['role']
        module_ids = validated_data.pop('module_ids', []) or []

        # Create the user
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
        )

        # Admins/librarians get staff access to Django admin panel
        if role == 'admin':
            user.is_staff = True
            user.save()

        # Look up department and program by code (only if provided)
        department = None
        program = None
        if validated_data.get('faculty'):
            department = Department.objects.filter(code=validated_data['faculty']).first()
        if validated_data.get('program'):
            program = Program.objects.filter(code=validated_data['program']).first()

        # Create the profile
        profile = StudentProfile.objects.create(
            user=user,
            student_id=validated_data['student_id'],
            role=role,
            department=department,
            program=program,
            current_year=int(validated_data.get('year') or 1),
        )

        # ✅ Attach taught modules if lecturer
        if role == 'lecturer' and module_ids:
            modules = Course.objects.filter(id__in=module_ids)
            profile.taught_modules.set(modules)

        # Create auth token
        Token.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    faculty = serializers.SerializerMethodField()
    program = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()
    taught_modules = serializers.SerializerMethodField()   # ✅ NEW

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'faculty', 'program', 'year', 'student_id',
            'taught_modules',   # ✅ NEW
        ]

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            return 'admin' if obj.is_staff else 'student'

    def get_faculty(self, obj):
        try:
            return obj.profile.department.code if obj.profile.department else ''
        except Exception:
            return ''

    def get_program(self, obj):
        try:
            return obj.profile.program.code if obj.profile.program else ''
        except Exception:
            return ''

    def get_year(self, obj):
        try:
            return obj.profile.current_year
        except Exception:
            return 1

    def get_student_id(self, obj):
        try:
            return obj.profile.student_id
        except Exception:
            return ''

    def get_taught_modules(self, obj):
        """Return list of modules the lecturer teaches."""
        try:
            return list(
                obj.profile.taught_modules.values('id', 'code', 'name')
            )
        except Exception:
            return []


# ============================================================
# LECTURER MODULE MANAGEMENT
# ============================================================

class LecturerModulesSerializer(serializers.Serializer):
    """Used by lecturers to update their taught modules after signup."""
    module_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        allow_empty=True,
    )

    def validate_module_ids(self, value):
        if not value:
            raise serializers.ValidationError(
                'Please select at least one module.'
            )
        courses = Course.objects.filter(id__in=value)
        if courses.count() != len(set(value)):
            raise serializers.ValidationError(
                'One or more selected modules do not exist.'
            )
        return value