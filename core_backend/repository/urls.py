from django.urls import path
from . import views

urlpatterns = [
    # ============================================================
    # DATA ENDPOINTS (Public)
    # ============================================================
    path('api/departments/', views.get_departments, name='api_departments'),
    path('api/programs/', views.get_programs, name='api_programs'),
    path('api/courses/', views.get_courses, name='api_courses'),
    path('api/resources/', views.get_resources, name='api_resources'),

    # ============================================================
    # RESOURCE ROUTES
    # Order matters: literal paths first, dynamic routes last.
    # ============================================================
    path('api/resources/create/', views.create_resource, name='api_resource_create'),
    path('api/resources/my-submissions/', views.my_submissions, name='api_my_submissions'),

    # ✅ Preview must come BEFORE the generic detail route
    path('api/resources/<int:resource_id>/preview/', views.preview_resource, name='api_resource_preview'),
    path('api/resources/<int:resource_id>/download/', views.download_resource, name='api_resource_download'),

    # Generic detail route goes LAST
    path('api/resources/<int:resource_id>/', views.get_resource_detail, name='api_resource_detail'),

    # ============================================================
    # AUTH ENDPOINTS
    # ============================================================
    path('api/auth/register/', views.register_view, name='api_register'),
    path('api/auth/login/', views.login_view, name='api_login'),
    path('api/auth/logout/', views.logout_view, name='api_logout'),
    path('api/auth/me/', views.me_view, name='api_me'),

    # ============================================================
    # LECTURER ENDPOINTS
    # ============================================================
    path('api/lecturer/modules/', views.lecturer_modules, name='api_lecturer_modules'),
    path('api/lecturer/pending-submissions/', views.lecturer_pending_submissions, name='api_lecturer_pending'),
    path('api/lecturer/decide/<int:resource_id>/', views.lecturer_decide_submission, name='api_lecturer_decide'),

    # ============================================================
    # ADMIN ENDPOINTS
    # Order matters: literal paths first, dynamic routes last.
    # ============================================================

    # Stats
    path('api/admin/stats/', views.admin_stats, name='api_admin_stats'),
    path('api/admin/analytics/', views.admin_analytics, name='api_admin_analytics'),

    # Resources
    path('api/admin/resources/', views.admin_resources, name='api_admin_resources'),
    path('api/admin/resources/bulk/', views.admin_bulk_action, name='api_admin_bulk_action'),
    path('api/admin/resources/<int:resource_id>/action/', views.admin_resource_action, name='api_admin_resource_action'),

    # Users
    path('api/admin/users/', views.admin_users, name='api_admin_users'),
    path('api/admin/users/<int:user_id>/toggle/', views.admin_user_toggle, name='api_admin_user_toggle'),
]