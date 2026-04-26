import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, BarChart3, Users, ShoppingCart, Receipt, Wallet, PiggyBank, Tag, Settings, Activity, Menu, X, LogOut, UserCog, User, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const baseNavItems = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Produits', href: '/admin/produits', icon: Package },
  { label: 'Catégories', href: '/admin/categories', icon: Layers },
  { label: 'Commandes', href: '/admin/commandes', icon: ShoppingCart },
  { label: 'Ventes', href: '/admin/ventes', icon: Receipt },
  { label: 'Clientes', href: '/admin/clientes', icon: Users },
  { label: 'Dépenses', href: '/admin/depenses', icon: Wallet },
  { label: 'Caisse', href: '/admin/caisse', icon: PiggyBank },
  { label: 'Promotions', href: '/admin/promotions', icon: Tag },
  { label: 'Discussion', href: '/admin/discussion', icon: MessageSquare },
  { label: 'Rapports', href: '/admin/rapports', icon: BarChart3 },
  { label: 'Paramètres', href: '/admin/parametres', icon: Settings },
  { label: 'Journal', href: '/admin/journal', icon: Activity },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user, isAdmin, roles } = useAuth();
  const isManager = roles.includes('manager');
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('display_name, avatar_url').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user, location.pathname]);

  useEffect(() => {
    if (!user) return;
    const loadCount = async () => {
      const { count } = await supabase
        .from('chat_leads')
        .select('*', { count: 'exact', head: true })
        .eq('traite', false);
      setUnreadChats(count ?? 0);
    };
    loadCount();
    const handleRefresh = () => loadCount();
    const channel = supabase
      .channel('chat_leads_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_leads' }, () => loadCount())
      .subscribe();
    window.addEventListener('chat-leads:refresh', handleRefresh);
    return () => {
      window.removeEventListener('chat-leads:refresh', handleRefresh);
      supabase.removeChannel(channel);
    };
  }, [user, location.pathname]);

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email || 'Compte';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || '';
  const initial = displayName.charAt(0).toUpperCase();

  // Filtrage des items selon le rôle
  // - admin : tout (+ Utilisateurs)
  // - manager : tout sauf Paramètres / Journal / Utilisateurs
  // - vendeur : Tableau de bord, Ventes, Caisse, Clientes, Discussion uniquement
  const adminOnlyHrefs = ['/admin/parametres', '/admin/journal'];
  const managerHrefs = ['/admin/produits', '/admin/categories', '/admin/commandes', '/admin/depenses', '/admin/promotions', '/admin/rapports'];

  let visibleBase = baseNavItems;
  if (!isAdmin) {
    visibleBase = visibleBase.filter((it) => !adminOnlyHrefs.includes(it.href));
  }
  if (!isAdmin && !isManager) {
    // vendeur : retirer aussi les items manager
    visibleBase = visibleBase.filter((it) => !managerHrefs.includes(it.href));
  }
  const navItems = isAdmin
    ? [...visibleBase.slice(0, 12), { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: UserCog }, ...visibleBase.slice(12)]
    : visibleBase;

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start lg:shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link to="/admin" className="font-heading text-xl font-bold text-sidebar-primary-foreground">
          BABY<span className="text-accent">CENTER</span>
            <span className="text-xs ml-2 text-sidebar-foreground/50 font-body">Admin</span>
          </Link>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map(item => {
            const active = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            const showBadge = item.href === '/admin/discussion' && unreadChats > 0;
            return (
              <Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-sidebar-border mt-4">
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors w-full text-left">
              <LogOut className="h-4 w-4" /> Se déconnecter
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-background border-b border-border flex items-center px-4 gap-4 sticky top-0 z-30">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex items-center hover:bg-muted rounded-full p-1 transition-colors" title="Mon compte">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">{initial}</AvatarFallback>
                </Avatar>
                {unreadChats > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold border-2 border-background">
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/profil')}><User className="h-4 w-4 mr-2" />Mon profil</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/discussion')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="flex-1">Discussion</span>
                {unreadChats > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </DropdownMenuItem>
              {isAdmin && <DropdownMenuItem onClick={() => navigate('/admin/utilisateurs')}><UserCog className="h-4 w-4 mr-2" />Utilisateurs</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
