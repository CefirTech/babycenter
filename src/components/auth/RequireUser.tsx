import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function RequireUser() {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="container py-20 text-center text-muted-foreground">Chargement...</div>;
  if (!user) return <Navigate to={`/connexion?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <Outlet />;
}
