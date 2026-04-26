import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedClientRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
