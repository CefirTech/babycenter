import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Menu, X, Search, LogOut, CircleUser as UserCircle, ChevronDown, Sparkles, Tag, Baby, Shirt, Star, Info, Phone, Hop as Home } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

type SubItem = { label: string; href: string; icon?: React.ComponentType<{ className?: string }>; desc?: string };
type NavItem = { label: string; href: string; children?: SubItem[] };

const navItems: NavItem[] = [
  { label: 'Accueil', href: '/' },
  {
    label: 'Boutique',
    href: '/boutique',
    children: [
      { label: 'Tout voir', href: '/boutique', icon: Shirt, desc: 'Toute la collection' },
      { label: 'Filles', href: '/boutique?sexe=fille', icon: Sparkles, desc: 'Robes, jupes, ensembles' },
      { label: 'Garçons', href: '/boutique?sexe=garcon', icon: Shirt, desc: 'Pantalons, polos, shorts' },
      { label: 'Unisexe', href: '/boutique?sexe=unisexe', icon: Baby, desc: 'Pour tous les enfants' },
    ],
  },
  {
    label: 'Âges',
    href: '/tranches-age',
    children: [
      { label: '0 – 6 mois', href: '/boutique?age=0-6+mois', desc: 'Nouveau-nés & nourrissons' },
      { label: '6 – 12 mois', href: '/boutique?age=6-12+mois', desc: 'Premiers pas' },
      { label: '1 – 3 ans', href: '/boutique?age=1-3+ans', desc: 'Toddlers' },
      { label: '3 – 6 ans', href: '/boutique?age=3-6+ans', desc: 'Maternelle' },
      { label: '6 – 12 ans', href: '/boutique?age=6-12+ans', desc: 'Primaire' },
      { label: '12 – 16 ans', href: '/boutique?age=12-16+ans', desc: 'Adolescents' },
    ],
  },
  {
    label: 'Offres',
    href: '/promotions',
    children: [
      { label: 'Nouveautés', href: '/boutique?filtre=nouveau', icon: Sparkles, desc: 'Derniers arrivages' },
      { label: 'Promotions', href: '/promotions', icon: Tag, desc: "Jusqu'à -40%" },
      { label: 'Meilleures ventes', href: '/boutique?filtre=bestseller', icon: Star, desc: 'Les préférés' },
    ],
  },
  {
    label: 'Infos',
    href: '/a-propos',
    children: [
      { label: 'À propos', href: '/a-propos', icon: Info, desc: 'Notre histoire' },
      { label: 'Contact', href: '/contact', icon: Phone, desc: 'Nous écrire' },
    ],
  },
];

const mobileNavItems: NavItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Boutique — Tout voir', href: '/boutique' },
  { label: 'Filles', href: '/boutique?sexe=fille' },
  { label: 'Garçons', href: '/boutique?sexe=garcon' },
  { label: 'Nouveautés', href: '/boutique?filtre=nouveau' },
  { label: 'Promotions', href: '/promotions' },
  { label: '0–6 mois', href: '/boutique?age=0-6+mois' },
  { label: '6–12 mois', href: '/boutique?age=6-12+mois' },
  { label: '1–3 ans', href: '/boutique?age=1-3+ans' },
  { label: '3–6 ans', href: '/boutique?age=3-6+ans' },
  { label: '6–12 ans', href: '/boutique?age=6-12+ans' },
  { label: '12–16 ans', href: '/boutique?age=12-16+ans' },
  { label: 'À propos', href: '/a-propos' },
  { label: 'Contact', href: '/contact' },
];

function MegaMenu({ item, onClose }: { item: NavItem; onClose: () => void }) {
  if (!item.children) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-background border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden z-50 min-w-[240px]"
    >
      <div className={`grid gap-0.5 p-2 ${item.children.length >= 5 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {item.children.map((child) => (
          <Link
            key={child.href}
            to={child.href}
            onClick={onClose}
            className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors group"
          >
            {child.icon && (
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <child.icon className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">{child.label}</p>
              {child.desc && <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{child.desc}</p>}
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

function NavItemDesktop({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isActive = location.pathname === item.href || (item.children?.some(c => location.pathname + location.search === c.href));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  };

  if (!item.children) {
    return (
      <Link
        to={item.href}
        className={`text-sm font-medium transition-colors px-1 py-0.5 relative group ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}
      >
        {item.label}
        <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-sm font-medium transition-colors px-1 py-0.5 relative group ${isActive ? 'text-primary' : 'text-foreground/70 hover:text-primary'}`}
      >
        {item.label}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
        <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary rounded-full transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
      </button>
      <AnimatePresence>
        {open && <MegaMenu item={item} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const prevCount = useRef(itemCount);
  const [cartBump, setCartBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (itemCount > prevCount.current) {
      setCartBump(true);
      setTimeout(() => setCartBump(false), 600);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  const accountHref = user ? '/compte' : '/connexion';

  const handleSignOut = async () => {
    await signOut();
    toast.success('Déconnectée');
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-background/97 backdrop-blur-lg shadow-sm border-border'
          : 'bg-background/95 backdrop-blur-md border-border/60'
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20 gap-4">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -ml-2 text-foreground/70 hover:text-primary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                <Menu className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Logo */}
        <Link to="/" className="font-heading text-xl md:text-2xl font-black tracking-tight shrink-0">
          <span className="text-primary">BABY</span><span className="text-accent">CENTER</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map(item => <NavItemDesktop key={item.href} item={item} />)}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button className="hidden md:flex p-2 text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-secondary" aria-label="Rechercher">
            <Search className="h-5 w-5" />
          </button>
          <Link to={user ? '/compte' : '/connexion'} className="p-2 text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-secondary" aria-label="Favoris">
            <Heart className="h-5 w-5" />
          </Link>
          <Link to="/panier" className="relative p-2 text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-secondary" aria-label="Panier">
            <motion.div animate={cartBump ? { scale: [1, 1.35, 1], rotate: [0, -14, 14, 0] } : {}} transition={{ duration: 0.5 }}>
              <ShoppingBag className="h-5 w-5" />
            </motion.div>
            <AnimatePresence>
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-secondary focus:outline-none" aria-label="Mon compte">
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
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to={accountHref} className="p-2 text-foreground/70 hover:text-primary transition-colors rounded-lg hover:bg-secondary" aria-label="Se connecter">
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-0.5">
              {/* Group: Accueil */}
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-xl text-base font-semibold text-foreground/80 hover:text-primary hover:bg-secondary transition-all">
                <Home className="h-4 w-4 text-primary/70" /> Accueil
              </Link>

              {/* Group: Boutique */}
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-4 pb-1">Boutique</p>
              {mobileNavItems.filter(i => ['Boutique — Tout voir', 'Filles', 'Garçons', 'Nouveautés', 'Promotions'].includes(i.label)).map(l => (
                <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-xl text-sm font-medium text-foreground/75 hover:text-primary hover:bg-secondary transition-all">
                  {l.label}
                </Link>
              ))}

              {/* Group: Âges */}
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-4 pb-1">Par âge</p>
              <div className="grid grid-cols-3 gap-2 pb-2">
                {['0–6 mois', '6–12 mois', '1–3 ans', '3–6 ans', '6–12 ans', '12–16 ans'].map((label) => {
                  const match = mobileNavItems.find(i => i.label === label);
                  if (!match) return null;
                  return (
                    <Link key={match.href} to={match.href} onClick={() => setMobileOpen(false)} className="text-center py-2 px-1 rounded-xl text-xs font-semibold bg-secondary text-foreground/70 hover:text-primary hover:bg-primary/10 transition-all">
                      {label}
                    </Link>
                  );
                })}
              </div>

              {/* Group: Infos */}
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-2 pb-1">Infos</p>
              {mobileNavItems.filter(i => ['À propos', 'Contact'].includes(i.label)).map(l => (
                <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-xl text-sm font-medium text-foreground/75 hover:text-primary hover:bg-secondary transition-all">
                  {l.label}
                </Link>
              ))}

              <div className="border-t border-border mt-3 pt-3">
                <Link to={accountHref} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-medium text-foreground/80 hover:text-primary hover:bg-secondary transition-all">
                  <User className="h-4 w-4" /> {user ? 'Mon compte' : 'Connexion / Inscription'}
                </Link>
                {user && (
                  <button
                    onClick={() => { setMobileOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 py-3 px-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/8 transition-all text-left"
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </button>
                )}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
