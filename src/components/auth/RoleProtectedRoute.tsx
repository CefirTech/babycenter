import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'manager' | 'vendeur';

interface Props {
  allow: Role[];
}

export default function RoleProtectedRoute({ allow }: Props) {
  const { loading, user, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;

  const ok = roles.some((r) => allow.includes(r));
  if (!ok) return <Navigate to="/admin" replace />;

  return <Outlet />;
}
