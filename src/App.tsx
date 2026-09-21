import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TestsPage from '@/pages/TestsPage';
import TestEditorPage from '@/pages/TestEditorPage';
import TestDetailPage from '@/pages/TestDetailPage';
import AttemptDetailPage from '@/pages/AttemptDetailPage';
import PublicTestStartPage from '@/pages/PublicTestStartPage';
import PublicTestTakingPage from '@/pages/PublicTestTakingPage';
import PublicTestResultPage from '@/pages/PublicTestResultPage';
import ManagerLayout from '@/layouts/ManagerLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <DashboardPage />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <TestsPage />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/new"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <TestEditorPage />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id/edit"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <TestEditorPage />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <TestDetailPage />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests/:id/attempts/:attemptId"
        element={
          <ProtectedRoute>
            <ManagerLayout>
              <AttemptDetailPage />
            </ManagerLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/t/:slug" element={<PublicTestStartPage />} />
      <Route path="/t/:slug/take" element={<PublicTestTakingPage />} />
      <Route path="/t/:slug/result" element={<PublicTestResultPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
