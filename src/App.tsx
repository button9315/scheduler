import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AuthPage from './pages/AuthPage';
import AppLayout from './components/AppLayout';
import CalendarPage from './pages/CalendarPage';
import ProjectSchedulesPage from './pages/ProjectSchedulesPage';
import BookmarksPage from './pages/BookmarksPage';
import MemosPage from './pages/MemosPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectFormPage from './pages/ProjectFormPage';
import MembersPage from './pages/MembersPage';
import MyProfilePage from './pages/MyProfilePage';
import SettingsPage from './pages/SettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import NotFoundPage from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[hsl(var(--primary))] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[hsl(var(--muted-foreground))]">로딩 중...</span>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<CalendarPage />} />
        <Route path="project-schedules" element={<ProjectSchedulesPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="memos" element={<MemosPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<ProjectFormPage />} />
        <Route path="projects/:id/edit" element={<ProjectFormPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="my-profile" element={<MyProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
