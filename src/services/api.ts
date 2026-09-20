// src/services/api.ts
const API_BASE_URL = 'http://localhost:8000/api';

// ============================================================
// TYPES
// ============================================================

export interface Resource {
  id: number;
  title: string;
  course: number;
  course_code?: string;
  course_name?: string;
  year_of_study: number;
  semester: number;
  resource_type: string;
  file_pdf: string;
  uploaded_by: number;
  uploaded_by_username?: string;
  uploaded_by_name: string;
  is_approved: boolean;
  is_shared: boolean;
  upload_date: string;
  download_count: number;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
}

export interface Program {
  id: number;
  name: string;
  code: string;
  department: number;
  department_name?: string;
}

export interface Course {
  id: number;
  code: string;
  name: string;
  program: number;
  program_name?: string;
  department_name?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'student' | 'lecturer' | 'admin';
  faculty: string;
  program: string;
  year: number;
  student_id: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface UploadResourcePayload {
  title: string;
  course: number;
  year_of_study: number;
  semester: number;
  resource_type: string;
  is_shared: boolean;
  file: File;
}


// ============================================================
// ERROR HELPER
// ============================================================

/**
 * Extracts a human-readable error message from various
 * Django DRF error shapes (dict, string, nested arrays).
 */
export function extractApiError(err: any): string {
  if (!err) return 'Something went wrong.';
  // If it's a raw string
  if (typeof err === 'string') return err;
  // If it's an Error object with a JSON message
  const raw = err.message ?? err;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([field, errors]) => {
          const msg = Array.isArray(errors) ? errors.join(', ') : String(errors);
          return field === 'non_field_errors' ? msg : `${field}: ${msg}`;
        })
        .join(' | ');
    }
    return String(parsed);
  } catch {
    return String(raw);
  }
}


// ============================================================
// DATA API (Public endpoints)
// ============================================================

export const api = {
  async getResources(): Promise<Resource[]> {
    const response = await fetch(`${API_BASE_URL}/resources/`);
    if (!response.ok) throw new Error('Failed to fetch resources');
    return response.json();
  },

  async getDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments/`);
    if (!response.ok) throw new Error('Failed to fetch departments');
    return response.json();
  },

  async getPrograms(departmentId?: number): Promise<Program[]> {
    const url = departmentId
      ? `${API_BASE_URL}/programs/?department=${departmentId}`
      : `${API_BASE_URL}/programs/`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch programs');
    return response.json();
  },

  async getCourses(programId?: number): Promise<Course[]> {
    const url = programId
      ? `${API_BASE_URL}/courses/?program=${programId}`
      : `${API_BASE_URL}/courses/`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch courses');
    return response.json();
  },

  async getResource(id: number): Promise<Resource> {
    const response = await fetch(`${API_BASE_URL}/resources/${id}/`);
    if (!response.ok) throw new Error('Failed to fetch resource');
    return response.json();
  },
};


// ============================================================
// AUTH API
// ============================================================

export const authApi = {
  async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    student_id: string;
    faculty: string;
    program: string;
    year: string;
    role: string;
    password: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(json));
    return json;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  async logout(token: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    });
  },

  async me(token: string): Promise<AuthUser> {
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) throw new Error('Not authenticated');
    return response.json();
  },
};


// ============================================================
// RESOURCE UPLOAD API (Authenticated)
// ============================================================

export const resourceApi = {
  /**
   * Upload a new resource. Requires a valid auth token.
   */
  async upload(payload: UploadResourcePayload, token: string): Promise<Resource> {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('course', String(payload.course));
    formData.append('year_of_study', String(payload.year_of_study));
    formData.append('semester', String(payload.semester));
    formData.append('resource_type', payload.resource_type);
    formData.append('is_shared', payload.is_shared ? 'true' : 'false');
    formData.append('file_pdf', payload.file);

    const response = await fetch(`${API_BASE_URL}/resources/create/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body: formData,
    });

    const json = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(json));
    return json;
  },

  /**
   * Get the current user's uploaded resources.
   */
  async getMySubmissions(token: string): Promise<Resource[]> {
    const response = await fetch(`${API_BASE_URL}/resources/my-submissions/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch submissions');
    return response.json();
  },
};

export default api;