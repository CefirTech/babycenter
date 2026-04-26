import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, LogOut, Plus, Trash2, MapPin, Package, Heart, User as UserIcon, Save } from 'lucide-react';
import { toast } from 'sonner';
import { fcfa as formatPrice } from '@/lib/format';
import { useSEO } from '@/hooks/useSEO';
import { useWishlist } from '@/hooks/useWishlist';

interface Profile { display_name: string | null; email: string | null; telephone: string | null; }
interface Address {
  id: string; libelle: string; destinataire: string; telephone: string | null;
  adresse: string; ville: string | null; indications: string | null; par_defaut: boolean;
}
interface OrderRow {
  id: string; numero_commande: string; statut: string; total: number; created_at: string;
}

const statusLabel: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: 'En attente paiement', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  payee: { label: 'Payée', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  en_preparation: { label: 'En préparation', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  expediee: { label: 'Expédiée', color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  livree: { label: 'Livrée', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  annulee: { label: 'Annulée', color: 'bg-destructive/10 text-destructive' },
};

export default function AccountPage() {
  useSEO({ title: 'Mon compte — BabyCenter', description: 'Gérez votre profil, adresses, commandes et favoris.' });
  const { user, signOut } = useAuth();
  const { productIds: favIds, toggle } = useWishlist();
  const [profile, setProfile] = useState<Profile>({ display_name: '', email: '', telephone: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [favProducts, setFavProducts] = useState<any[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editAddress, setEditAddress] = useState<Partial<Address> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: prof }, { data: addrs }, { data: ords }] = await Promise.all([
      supabase.from('profiles').select('display_name, email, telephone').eq('user_id', user.id).maybeSingle(),
      supabase.from('customer_addresses').select('*').eq('user_id', user.id).order('par_defaut', { ascending: false }),
      supabase.from('orders').select('id, numero_commande, statut, total, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setProfile(prof ?? { display_name: user.email?.split('@')[0] ?? '', email: user.email ?? '', telephone: '' });
    setAddresses(addrs ?? []);
    setOrders(ords ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (favIds.length === 0) { setFavProducts([]); return; }
    supabase.from('products_public').select('id, nom, slug, prix_vente, prix_promo, images').in('id', favIds)
      .then(({ data }) => setFavProducts(data ?? []));
  }, [favIds]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      display_name: profile.display_name,
      email: profile.email,
      telephone: profile.telephone,
    }, { onConflict: 'user_id' });
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success('Profil mis à jour');
  };

  const saveAddress = async () => {
    if (!user || !editAddress) return;
    const payload: any = {
      user_id: user.id,
      libelle: editAddress.libelle || 'Domicile',
      destinataire: editAddress.destinataire || '',
      telephone: editAddress.telephone || null,
      adresse: editAddress.adresse || '',
      ville: editAddress.ville || null,
      indications: editAddress.indications || null,
      par_defaut: !!editAddress.par_defaut,
    };
    if (!payload.destinataire || !payload.adresse) { toast.error('Destinataire et adresse requis'); return; }

    if (payload.par_defaut) {
      await supabase.from('customer_addresses').update({ par_defaut: false }).eq('user_id', user.id);
    }

    const { error } = editAddress.id
      ? await supabase.from('customer_addresses').update(payload).eq('id', editAddress.id)
      : await supabase.from('customer_addresses').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Adresse enregistrée');
    setEditAddress(null);
    load();
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Adresse supprimée'); load(); }
  };

  if (loading) return <div className="container py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="container py-8 md:py-12 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">Bonjour {profile.display_name || 'cliente'} 👋</h1>
        <p className="text-muted-foreground text-sm">{profile.email}</p>
      </div>

      <Tabs defaultValue="commandes">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commandes"><Package className="h-4 w-4 mr-1.5" />Commandes</TabsTrigger>
          <TabsTrigger value="favoris"><Heart className="h-4 w-4 mr-1.5" />Favoris</TabsTrigger>
          <TabsTrigger value="adresses"><MapPin className="h-4 w-4 mr-1.5" />Adresses</TabsTrigger>
        </TabsList>

        {/* Commandes */}
        <TabsContent value="commandes" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-heading">Historique & suivi</CardTitle></CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune commande pour le moment</p>
                  <Link to="/boutique"><Button variant="outline" className="mt-4">Découvrir la boutique</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => {
                    const s = statusLabel[o.statut] ?? { label: o.statut, color: 'bg-muted' };
                    return (
                      <Link key={o.id} to={`/compte/commandes/${o.id}`} className="flex justify-between items-center p-4 rounded-lg border border-border hover:bg-muted/30 hover:border-primary/40 transition-colors">
                        <div>
                          <p className="font-medium">{o.numero_commande}</p>
                          <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={s.color + ' border-0'}>{s.label}</Badge>
                          <p className="font-semibold">{formatPrice(o.total)}</p>
                        </div>
                      </Link>
                      );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favoris */}
        <TabsContent value="favoris" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-heading">Mes favoris ({favProducts.length})</CardTitle></CardHeader>
            <CardContent>
              {favProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun favori. Cliquez sur le cœur d'un produit pour l'ajouter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favProducts.map(p => (
                    <div key={p.id} className="group relative">
                      <Link to={`/produit/${p.slug}`}>
                        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                          {p.images?.[0] && <img src={p.images[0]} alt={p.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                        </div>
                        <p className="text-sm font-medium mt-2 line-clamp-1">{p.nom}</p>
                        <p className="text-sm text-primary font-semibold">{formatPrice(p.prix_promo ?? p.prix_vente)}</p>
                      </Link>
                      <button onClick={() => toggle(p.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 hover:bg-destructive hover:text-destructive-foreground transition-colors" aria-label="Retirer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Adresses */}
        <TabsContent value="adresses" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center space-y-0">
              <CardTitle className="text-base font-heading">Mes adresses</CardTitle>
              <Button size="sm" onClick={() => setEditAddress({ libelle: 'Domicile', destinataire: profile.display_name ?? '', telephone: profile.telephone ?? '', par_defaut: addresses.length === 0 })}>
                <Plus className="h-4 w-4 mr-1.5" /> Nouvelle
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 && !editAddress ? (
                <p className="text-center text-muted-foreground py-8">Aucune adresse enregistrée</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map(a => (
                    <div key={a.id} className="p-4 rounded-lg border border-border flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{a.libelle}</p>
                          {a.par_defaut && <Badge variant="secondary" className="text-xs">Par défaut</Badge>}
                        </div>
                        <p className="text-sm">{a.destinataire}</p>
                        <p className="text-sm text-muted-foreground">{a.adresse}{a.ville ? `, ${a.ville}` : ''}</p>
                        {a.telephone && <p className="text-xs text-muted-foreground mt-0.5">📞 {a.telephone}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditAddress(a)}>Modifier</Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteAddress(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {editAddress && (
            <Card>
              <CardHeader><CardTitle className="text-base font-heading">{editAddress.id ? 'Modifier' : 'Nouvelle adresse'}</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Libellé</Label>
                  <Input value={editAddress.libelle ?? ''} onChange={e => setEditAddress({ ...editAddress, libelle: e.target.value })} placeholder="Domicile, Bureau..." />
                </div>
                <div>
                  <Label>Destinataire *</Label>
                  <Input value={editAddress.destinataire ?? ''} onChange={e => setEditAddress({ ...editAddress, destinataire: e.target.value })} />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input value={editAddress.telephone ?? ''} onChange={e => setEditAddress({ ...editAddress, telephone: e.target.value })} />
                </div>
                <div>
                  <Label>Ville</Label>
                  <Input value={editAddress.ville ?? ''} onChange={e => setEditAddress({ ...editAddress, ville: e.target.value })} placeholder="Abidjan" />
                </div>
                <div className="md:col-span-2">
                  <Label>Adresse *</Label>
                  <Input value={editAddress.adresse ?? ''} onChange={e => setEditAddress({ ...editAddress, adresse: e.target.value })} placeholder="Rue, quartier..." />
                </div>
                <div className="md:col-span-2">
                  <Label>Indications</Label>
                  <Textarea rows={2} value={editAddress.indications ?? ''} onChange={e => setEditAddress({ ...editAddress, indications: e.target.value })} placeholder="Repère, étage..." />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <Switch checked={!!editAddress.par_defaut} onCheckedChange={c => setEditAddress({ ...editAddress, par_defaut: c })} />
                  <Label className="cursor-pointer">Adresse par défaut</Label>
                </div>
                <div className="md:col-span-2 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditAddress(null)}>Annuler</Button>
                  <Button onClick={saveAddress}><Save className="h-4 w-4 mr-1.5" />Enregistrer</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profil */}
        <TabsContent value="profil" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base font-heading">Mes informations</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nom complet</Label>
                <Input value={profile.display_name ?? ''} onChange={e => setProfile({ ...profile, display_name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={profile.email ?? ''} disabled />
                <p className="text-xs text-muted-foreground mt-1">L'email ne peut pas être modifié ici</p>
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={profile.telephone ?? ''} onChange={e => setProfile({ ...profile, telephone: e.target.value })} placeholder="+225 ..." />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
