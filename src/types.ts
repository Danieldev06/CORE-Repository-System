export type UserRole = 'student' | 'lecturer' | 'admin';

export type ViewType =
  | 'login'
  | 'signup'
  | 'student-dashboard'
  | 'repository'
  | 'resource-detail'
  | 'submit-work'
  | 'my-submissions'
  | 'bookmarks'
  | 'download-history'
  | 'lecturer-dashboard'
  | 'lecturer-resources'
  | 'lecturer-modules'
  | 'upload-resource'
  | 'review-submissions'
  | 'review-submission-detail'
  | 'admin-dashboard'
  | 'admin-resources'
  | 'admin-users'
  | 'research-repository'
  | 'admin-collections'
  | 'admin-categories'
  | 'admin-analytics'
  | 'admin-activity'
  | 'admin-settings'
  | 'notifications'
  | 'profile';

export type ResourceStatus =
  | 'draft'
  | 'submitted'
  | 'under-review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export type ResourceType =
  | 'lecture-notes'
  | 'past-paper'
  | 'dissertation'
  | 'thesis'
  | 'research-proposal'
  | 'journal-article'
  | 'research-paper'
  | 'course-material'
  | 'academic-guide'
  | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  staffId?: string;
  programme?: string;
  department?: string;
  school?: string;
  yearOfStudy?: number;
  status: 'active' | 'inactive';
  dateJoined: string;
  submissionsCount?: number;
  downloadsCount?: number;
  bookmarksCount?: number;
}

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  author: string;
  authorId: string;
  school: string;
  programme: string;
  course?: string;
  courseCode?: string;
  academicYear: string;
  dateUploaded: string;
  fileType: string;
  fileSize: string;
  description: string;
  keywords: string[];
  status: ResourceStatus;
  downloads: number;
  views: number;
  abstract?: string;
}

export interface Submission {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  programme: string;
  school: string;
  type: ResourceType;
  submittedDate: string;
  status: ResourceStatus;
  reviewerId?: string;
  reviewerName?: string;
  reviewerFeedback?: string;
  resourceId?: string;
  abstract?: string;
  keywords?: string[];
  academicYear: string;
  course?: string;
  courseCode?: string;
  fileType: string;
  fileSize: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  date: string;
  actionView?: ViewType;
  actionParams?: Record<string, string>;
}

export interface AppContextType {
  user: User | null;
  currentView: ViewType;
  params: Record<string, string>;
  navigate: (view: ViewType, params?: Record<string, string>) => void;
  login: (user: User, token?: string) => void;   // ← token now optional
  logout: () => void | Promise<void>;              // ← can be async
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  bookmarkedIds: string[];
  toggleBookmark: (id: string) => void;
  downloadedIds: string[];
  addDownload: (id: string) => void;
  toast: ToastMessage | null;
  showToast: (msg: ToastMessage) => void;
  dismissToast: () => void;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
}