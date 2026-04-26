import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, X, Search, LogOut, UserCircle } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique', href: '/boutique' },
  { label: 'Nouveautés', href: '/boutique?filtre=nouveau' },
  { label: 'Promotions', href: '/promotions' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const accountHref = user ? '/compte' : '/connexion';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnectée');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Mobile menu btn */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Logo */}
        <Link to="/" className="font-heading text-xl md:text-2xl font-bold tracking-tight text-primary">
          BABY<span className="text-accent">CENTER</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link key={l.href} to={l.href} className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="hidden md:flex p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </button>
          <Link to={user ? '/compte' : '/connexion'} className="p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Favoris">
            <Heart className="h-5 w-5" />
          </Link>
          <Link to="/panier" className="relative p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Panier">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {itemCount}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 text-foreground/70 hover:text-primary transition-colors focus:outline-none"
                  aria-label="Mon compte"
                >
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground">Connectée en tant que</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/compte?tab=profil')} className="cursor-pointer">
                  <UserCircle className="h-4 w-4 mr-2" /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to={accountHref} className="p-2 text-foreground/70 hover:text-primary transition-colors" aria-label="Se connecter">
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-background animate-fade-in">
          <div className="container py-4 flex flex-col gap-3">
            {navLinks.map(l => (
              <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="py-2 text-base font-medium text-foreground/80 hover:text-primary">
                {l.label}
              </Link>
            ))}
            <Link to={accountHref} onClick={() => setMobileOpen(false)} className="py-2 text-base font-medium text-foreground/80 hover:text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> {user ? 'Mon compte' : 'Connexion / Inscription'}
            </Link>
            {user && (
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="py-2 text-base font-medium text-destructive hover:text-destructive/80 flex items-center gap-2 text-left"
              >
                <LogOut className="h-4 w-4" /> Se déconnecter
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
