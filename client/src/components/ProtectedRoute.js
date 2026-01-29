import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SystemConfigProvider } from '../contexts/SystemConfigContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to dashboard based on role
  const dashboardRoutes = {
    admin: '/admin/admin-dashboard',
    coordinator: '/coordinator/coordinator-dashboard',
    teacher: '/teacher/teacher-dashboard',
    student: '/student/student-dashboard',
    interviewer: '/interviewer/interviewer-dashboard',
  };

  // If current path is "/", redirect to role dashboard
  const currentPath = window.location.pathname;
  if (currentPath === '/') {
    return <Navigate to={dashboardRoutes[user.role] || '/login'} replace />;
  }

  return (
    <SystemConfigProvider>
      <Outlet />
    </SystemConfigProvider>
  );
};

export default ProtectedRoute;
