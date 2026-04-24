import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Package, LogOut, User as UserIcon } from 'lucide-react';
import SEO from '@/components/SEO';
import { useWishlist } from '@/hooks/useWishlist';
import { useStorefrontData } from '@/hooks/useStorefrontData';
import ProductCard from '@/components/storefront/ProductCard';

interface Order {
  id: string; numero_commande: string; created_at: string; total: number; statut: string;
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const { ids } = useWishlist();
  const { products } = useStorefrontData();

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('id, numero_commande, created_at, total, statut').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error) setOrders(data || []); else console.error(error); });
  }, [user]);

  const wishlistProducts = products.filter(p => ids.has(p.id));

  return (
    <div className="container py-10">
      <SEO title="Mon compte" description="Gérez vos commandes et favoris" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Mon compte</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Déconnexion</Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders"><Package className="h-4 w-4 mr-2" />Commandes</TabsTrigger>
          <TabsTrigger value="wishlist"><Heart className="h-4 w-4 mr-2" />Favoris ({wishlistProducts.length})</TabsTrigger>
          <TabsTrigger value="profile"><UserIcon className="h-4 w-4 mr-2" />Profil</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground mb-4">Aucune commande pour le moment</p>
              <Link to="/boutique"><Button>Découvrir la boutique</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                  <div>
                    <p className="font-mono font-medium">{o.numero_commande}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Number(o.total).toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs capitalize text-muted-foreground">{o.statut.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Aucun favori</p>
              <Link to="/boutique"><Button>Explorer la boutique</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6 max-w-md">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{user?.email}</p></div>
            <div><p className="text-xs text-muted-foreground">Membre depuis</p><p className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</p></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
