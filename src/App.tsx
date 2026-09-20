import Signup from './views/Signup';
import { AppProvider, useApp } from './context';
import Layout, { Toast } from './components/Layout';
import Login from './views/Login';
import StudentDashboard from './views/StudentDashboard';
import RepositoryView from './views/RepositoryView';
import ResourceDetail from './views/ResourceDetail';
import SubmitWork from './views/SubmitWork';
import MySubmissions from './views/MySubmissions';
import LecturerDashboard from './views/LecturerDashboard';
import LecturerResources from './views/LecturerResources';
import UploadResource from './views/UploadResource';
import ReviewSubmissions from './views/ReviewSubmissions';
import AdminDashboard from './views/AdminDashboard';
import AdminResources from './views/AdminResources';
import AdminUsers from './views/AdminUsers';
import ResearchRepository from './views/ResearchRepository';
import NotificationsView from './views/NotificationsView';
import ProfileView from './views/ProfileView';
import BookmarksView from './views/BookmarksView';
import DownloadHistory from './views/DownloadHistory';
import { AdminCollections, AdminCategories, AdminActivity, AdminSettings } from './views/PlaceholderViews';
import AdminAnalyticsView from './views/AdminAnalyticsView';

function AppRouter() {
  const { user, currentView } = useApp();

  // ============================================================
  //  NEW: Show Signup page when not logged in and view is 'signup'
  // ============================================================
  if (!user && currentView === 'signup') {
    return <Signup />;
  }

  // Show Login page if not logged in or view is 'login'
  if (!user || currentView === 'login') {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'student-dashboard': return <StudentDashboard />;
      case 'repository': return <RepositoryView />;
      case 'resource-detail': return <ResourceDetail />;
      case 'submit-work': return <SubmitWork />;
      case 'my-submissions': return <MySubmissions />;
      case 'bookmarks': return <BookmarksView />;
      case 'download-history': return <DownloadHistory />;
      case 'lecturer-dashboard': return <LecturerDashboard />;
      case 'lecturer-resources': return <LecturerResources />;
      case 'upload-resource': return <UploadResource />;
      case 'review-submissions': return <ReviewSubmissions />;
      case 'review-submission-detail': return <ReviewSubmissions />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-resources': return <AdminResources />;
      case 'admin-users': return <AdminUsers />;
      case 'research-repository': return <ResearchRepository />;
      case 'admin-collections': return <AdminCollections />;
      case 'admin-categories': return <AdminCategories />;
      case 'admin-analytics': return <AdminAnalyticsView />;
      case 'admin-activity': return <AdminActivity />;
      case 'admin-settings': return <AdminSettings />;
      case 'notifications': return <NotificationsView />;
      case 'profile': return <ProfileView />;
      default:
        if (user.role === 'student') return <StudentDashboard />;
        if (user.role === 'lecturer') return <LecturerDashboard />;
        return <AdminDashboard />;
    }
  };

  return (
    <Layout>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <ToastWrapper />
    </AppProvider>
  );
}

function ToastWrapper() {
  return <Toast />;
}