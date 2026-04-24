import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/hooks/useWishlist';
import MiniCart from '@/components/storefront/MiniCart';
import SearchCommand from '@/components/storefront/SearchCommand';

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
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { count: wishCount } = useWishlist();

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded">Aller au contenu</a>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="font-heading text-xl md:text-2xl font-bold tracking-tight text-primary">
            BABY<span className="text-accent">CENTER</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8" aria-label="Principale">
            {navLinks.map(l => (
              <Link key={l.href} to={l.href} className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={() => setSearchOpen(true)} className="p-2 text-foreground/70 hover:text-primary" aria-label="Rechercher (Ctrl+K)"><Search className="h-5 w-5" /></button>
            <Link to={user ? '/compte' : '/connexion'} className="relative p-2 text-foreground/70 hover:text-primary" aria-label="Favoris">
              <Heart className="h-5 w-5" />
              {wishCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">{wishCount}</span>}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative p-2 text-foreground/70 hover:text-primary" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">{itemCount}</span>}
            </button>
            <Link to={user ? '/compte' : '/connexion'} className="p-2 text-foreground/70 hover:text-primary" aria-label="Compte"><User className="h-5 w-5" /></Link>
          </div>
        </div>
        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-background animate-fade-in" aria-label="Mobile">
            <div className="container py-4 flex flex-col gap-3">
              {navLinks.map(l => (
                <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="py-2 text-base font-medium text-foreground/80 hover:text-primary">{l.label}</Link>
              ))}
              <Link to={user ? '/compte' : '/connexion'} onClick={() => setMobileOpen(false)} className="py-2 text-base font-medium text-foreground/80 hover:text-primary flex items-center gap-2"><User className="h-4 w-4" /> {user ? 'Mon compte' : 'Connexion'}</Link>
              <Link to="/admin/login" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-muted-foreground">Espace admin</Link>
            </div>
          </nav>
        )}
      </header>
      <MiniCart open={cartOpen} onOpenChange={setCartOpen} />
      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
