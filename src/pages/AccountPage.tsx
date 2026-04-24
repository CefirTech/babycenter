import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, Package, LogOut, User as UserIcon, ShoppingBag, Sparkles, MapPin, Save, Store } from 'lucide-react';
import SEO from '@/components/SEO';
import { useWishlist } from '@/hooks/useWishlist';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import ProductCard from '@/components/storefront/ProductCard';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  numero_commande: string;
  created_at: string;
  total: number;
  statut: string;
}

const statusLabel: Record<string, { label: string; tone: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  en_attente_paiement: { label: 'En attente de paiement', tone: 'outline' },
  payee: { label: 'Payée', tone: 'secondary' },
  en_preparation: { label: 'En préparation', tone: 'secondary' },
  expediee: { label: 'Expédiée', tone: 'default' },
  livree: { label: 'Livrée', tone: 'default' },
  annulee: { label: 'Annulée', tone: 'destructive' },
};

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const { ids } = useWishlist();
  const { products } = useStorefrontData();

  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('id, numero_commande, created_at, total, statut')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setOrders(data || []);
      });
    supabase
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || (user.user_metadata as any)?.display_name || '');
      });
  }, [user]);

  const wishlistProducts = useMemo(() => products.filter((p) => ids.has(p.id)), [products, ids]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return {
      orderCount: orders.length,
      wishCount: wishlistProducts.length,
      totalSpent,
    };
  }, [orders, wishlistProducts]);

  const initials = (displayName || user?.email || 'C')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—';

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('user_id', user.id);
    setSavingProfile(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
    }
  };

  return (
    <div className="bg-gradient-to-b from-secondary/30 to-background min-h-[calc(100vh-5rem)]">
      <SEO title="Mon espace" description="Gérez vos commandes, favoris et informations personnelles" />

      {/* Hero header */}
      <section className="border-b border-border/60 bg-card/50">
        <div className="container py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center font-heading text-2xl md:text-3xl font-bold shadow-lg">
                {initials || <UserIcon className="h-8 w-8" />}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-accent font-semibold mb-1">Espace personnel</p>
                <h1 className="font-heading text-2xl md:text-4xl font-bold text-foreground">
                  Bonjour, {displayName || user?.email?.split('@')[0] || 'cliente'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Cliente depuis {memberSince}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <Link to="/boutique">
                <Button className="shadow-md">
                  <Store className="h-4 w-4 mr-2" />Boutique
                </Button>
              </Link>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />Se déconnecter
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8">
            <div className="bg-background border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm mb-2">
                <ShoppingBag className="h-4 w-4" /> Commandes
              </div>
              <p className="font-heading text-2xl md:text-3xl font-bold text-foreground">{stats.orderCount}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm mb-2">
                <Heart className="h-4 w-4" /> Favoris
              </div>
              <p className="font-heading text-2xl md:text-3xl font-bold text-foreground">{stats.wishCount}</p>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm mb-2">
                <Sparkles className="h-4 w-4" /> Total dépensé
              </div>
              <p className="font-heading text-lg md:text-2xl font-bold text-foreground">
                {stats.totalSpent.toLocaleString('fr-FR')} <span className="text-xs md:text-sm font-normal text-muted-foreground">FCFA</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="container py-8 md:py-12">
        <Tabs defaultValue="orders">
          <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-grid">
            <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2 hidden sm:inline" />Commandes</TabsTrigger>
            <TabsTrigger value="wishlist"><Heart className="h-4 w-4 mr-2 hidden sm:inline" />Favoris</TabsTrigger>
            <TabsTrigger value="profile"><UserIcon className="h-4 w-4 mr-2 hidden sm:inline" />Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Aucune commande pour le moment</h3>
                <p className="text-muted-foreground mb-6 text-sm">Découvrez nos collections pour les petits.</p>
                <Link to="/boutique"><Button>Explorer la boutique</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => {
                  const s = statusLabel[o.statut] ?? { label: o.statut, tone: 'outline' as const };
                  return (
                    <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-5 bg-card border border-border rounded-xl hover:border-primary/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-mono font-semibold text-sm">{o.numero_commande}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <p className="font-heading font-bold text-lg">{Number(o.total).toLocaleString('fr-FR')} FCFA</p>
                        <Badge variant={s.tone}>{s.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="wishlist" className="mt-6">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Aucun favori</h3>
                <p className="text-muted-foreground mb-6 text-sm">Ajoutez vos coups de cœur pour les retrouver ici.</p>
                <Link to="/boutique"><Button>Explorer la boutique</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlistProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" /> Informations personnelles
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Votre nom" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={user?.email ?? ''} disabled />
                  </div>
                  <Button onClick={saveProfile} disabled={savingProfile} className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />{savingProfile ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Compte
                </h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <dt className="text-muted-foreground">Membre depuis</dt>
                    <dd className="font-medium">{memberSince}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <dt className="text-muted-foreground">Commandes</dt>
                    <dd className="font-medium">{stats.orderCount}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Favoris</dt>
                    <dd className="font-medium">{stats.wishCount}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
