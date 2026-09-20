from cloudinary_storage.storage import RawMediaCloudinaryStorage
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ============================================================
# DEPARTMENT MODEL
# ============================================================
class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


# ============================================================
# PROGRAM MODEL
# ============================================================
class Program(models.Model):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return f"{self.code} - {self.name} ({self.department.name})"

    class Meta:
        ordering = ['department', 'name']


# ============================================================
# CHOICES
# ============================================================
RESOURCE_TYPES = [
    ('NOTES', 'Lecture Notes'),
    ('PASTPAPER', 'Past Exam Paper'),
    ('DISSERTATION', 'Approved Dissertation'),
    ('ARTICLE', 'Research Article'),
]

YEAR_CHOICES = [
    (1, 'Year 1'),
    (2, 'Year 2'),
    (3, 'Year 3'),
    (4, 'Year 4'),
    (5, 'Year 5'),
    (6, 'Year 6'),
]

SEMESTER_CHOICES = [
    (1, 'Semester 1'),
    (2, 'Semester 2'),
]

ROLE_CHOICES = [
    ('student', 'Student'),
    ('lecturer', 'Lecturer'),
    ('admin', 'Librarian / Admin'),
]


# ============================================================
# COURSE MODEL
# ============================================================
class Course(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.code} - {self.name}"

    def get_department(self):
        return self.program.department

    class Meta:
        ordering = ['code']


# ============================================================
# RESOURCE MODEL
# ============================================================
class Resource(models.Model):
    title = models.CharField(max_length=300)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='resources')
    year_of_study = models.IntegerField(choices=YEAR_CHOICES)
    semester = models.IntegerField(choices=SEMESTER_CHOICES)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)

    # ✅ Files go to Cloudinary as raw files (PDF, DOCX, etc.)
    file_pdf = models.FileField(
        upload_to='resources/%Y/%m/%d/',
        storage=RawMediaCloudinaryStorage(),
    )

    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_by_name = models.CharField(max_length=100, blank=True)
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_resources')
    approved_date = models.DateTimeField(null=True, blank=True)
    is_shared = models.BooleanField(default=False, help_text="If checked, visible to ALL faculties")
    upload_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    download_count = models.IntegerField(default=0)

    def __str__(self):
        return self.title

    def increment_download(self):
        self.download_count += 1
        self.save(update_fields=['download_count'])

    def approve(self, user):
        self.is_approved = True
        self.approved_by = user
        self.approved_date = timezone.now()
        self.save()

    class Meta:
        ordering = ['-upload_date']


# ============================================================
# STUDENT PROFILE MODEL (with role)
# ============================================================
class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    student_id = models.CharField(max_length=20, unique=True)
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student',
    )
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    current_year = models.IntegerField(choices=YEAR_CHOICES, default=1)
    phone_number = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.student_id} ({self.get_role_display()})"

    def get_faculty_name(self):
        return self.department.name if self.department else "No Faculty Assigned"

    def get_program_name(self):
        return self.program.name if self.program else "No Program Assigned"