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
    path('api/resources/<int:resource_id>/', views.get_resource_detail, name='api_resource_detail'),

    # ============================================================
    # AUTH ENDPOINTS
    # ============================================================
    path('api/auth/register/', views.register_view, name='api_register'),
    path('api/auth/login/', views.login_view, name='api_login'),
    path('api/auth/logout/', views.logout_view, name='api_logout'),
    path('api/auth/me/', views.me_view, name='api_me'),

    # ============================================================
    # RESOURCE UPLOAD ENDPOINTS (Authenticated)
    # ============================================================
    path('api/resources/create/', views.create_resource, name='api_resource_create'),
    path('api/resources/my-submissions/', views.my_submissions, name='api_my_submissions'),
]