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

    def create(self, validated_data):
        role = validated_data['role']

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
        StudentProfile.objects.create(
            user=user,
            student_id=validated_data['student_id'],
            role=role,
            department=department,
            program=program,
            current_year=int(validated_data.get('year') or 1),
        )

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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'faculty', 'program', 'year', 'student_id',
        ]

    def get_role(self, obj):
        """Return the role stored on the profile."""
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