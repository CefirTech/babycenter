import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type Role = 'admin' | 'manager' | 'vendeur';

interface RoleGuardProps {
  allow: Role[];
  /** Page de fallback si l'utilisateur n'a pas le rôle requis (par défaut: dashboard admin) */
  fallback?: string;
}

/**
 * Garde-fou par rôle pour les routes admin.
 * À placer DANS la route protégée par ProtectedAdminRoute.
 *
 * Hiérarchie : admin > manager > vendeur
 * - admin : tout
 * - manager : tout sauf gestion utilisateurs / paramètres / journal d'activité
 * - vendeur : caisse, ventes, clients uniquement
 */
export default function RoleGuard({ allow, fallback = '/admin' }: RoleGuardProps) {
  const { loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const allowed = roles.some((r) => allow.includes(r as Role));
  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
