import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import MyCourses from "./pages/MyCourses";
import LectureView from "./pages/LectureView";
import Quiz from "./pages/Quiz";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBatches from "./pages/admin/AdminBatches";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminStats from "./pages/admin/AdminStats";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminExams from "./pages/admin/AdminExams";
import AdminLessons from "./pages/admin/AdminLessons";
import Offers from "./pages/Offers";
import CourseDetails from "./pages/CourseDetails";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";


const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t.common.loading}</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
      <Route path="/courses/:id" element={<ProtectedRoute><CourseDetails /></ProtectedRoute>} />
      <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
      <Route path="/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
      <Route path="/lecture/:sessionId" element={<ProtectedRoute><LectureView /></ProtectedRoute>} />
      <Route path="/quiz/:courseId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute adminOnly><AdminCourses /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><AdminNotifications /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/batches" element={<ProtectedRoute adminOnly><AdminBatches /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute adminOnly><AdminAttendance /></ProtectedRoute>} />
      <Route path="/admin/offers" element={<ProtectedRoute adminOnly><AdminOffers /></ProtectedRoute>} />
      <Route path="/admin/exams" element={<ProtectedRoute adminOnly><AdminExams /></ProtectedRoute>} />
      <Route path="/admin/courses/:courseId/lessons" element={<ProtectedRoute adminOnly><AdminLessons /></ProtectedRoute>} />
      <Route path="/admin/stats" element={<ProtectedRoute adminOnly><AdminStats /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="learnhub-theme">
      <LanguageProvider>
        <TooltipProvider>

          <Toaster />
          <Sonner />
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </HashRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
