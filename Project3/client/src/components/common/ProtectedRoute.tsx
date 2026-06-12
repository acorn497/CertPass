import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  roles?: string[];
}

export function ProtectedRoute({ roles }: Props) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!token) return <Navigate to="/login" replace />;
  if (roles?.length && !roles.includes(user?.role ?? '')) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
