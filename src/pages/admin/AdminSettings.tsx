import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import ImageUploader from '@/components/admin/ImageUploader';
import { DEFAULT_HERO, type HeroBanner } from '@/hooks/useHeroBanner';

const KEYS = [
  { cle: 'shop_name', label: 'Nom de la boutique', type: 'text', desc: 'Nom affiché dans le header et factures' },
  { cle: 'shop_address', label: 'Adresse', type: 'text', desc: 'Adresse physique de la boutique' },
  { cle: 'shop_phone', label: 'Téléphone', type: 'text', desc: 'Numéro de contact principal' },
  { cle: 'shop_whatsapp', label: 'WhatsApp', type: 'text', desc: 'Numéro WhatsApp pour commandes' },
  { cle: 'shop_email', label: 'Email', type: 'email', desc: 'Email de contact' },
  { cle: 'currency', label: 'Devise', type: 'text', desc: 'Code devise (FCFA, EUR...)' },
  { cle: 'delivery_fee', label: 'Frais de livraison par défaut', type: 'number', desc: 'En FCFA' },
  { cle: 'free_delivery_threshold', label: 'Seuil livraison gratuite', type: 'number', desc: 'Montant min pour livraison offerte' },
  { cle: 'low_stock_threshold', label: 'Seuil stock bas', type: 'number', desc: 'Alerte sous ce stock' },
  { cle: 'about_text', label: 'À propos', type: 'textarea', desc: 'Texte de présentation' },
];

export default function AdminSettings() {
  const [values, setValues] = useState<Record<string, any>>({});
  const [hero, setHero] = useState<HeroBanner>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('*');
    if (error) toast.error(`Paramètres : ${error.message}`);
    const v: Record<string, any> = {};
    let heroLoaded: HeroBanner | null = null;
    (data ?? []).forEach((s: any) => {
      const raw = s.valeur;
      const val = raw && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
      if (s.cle === 'hero_banner' && val && typeof val === 'object') {
        heroLoaded = { ...DEFAULT_HERO, ...val };
      } else {
        v[s.cle] = val;
      }
    });
    setValues(v);
    if (heroLoaded) setHero(heroLoaded);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    for (const k of KEYS) {
      const v = values[k.cle];
      if (v === undefined) continue;
      const { error } = await supabase.from('settings').upsert({ cle: k.cle, valeur: { v }, description: k.desc }, { onConflict: 'cle' });
      if (error) { toast.error(`${k.label} : ${error.message}`); setSaving(false); return; }
    }
    const { error: heroErr } = await supabase.from('settings').upsert(
      { cle: 'hero_banner', valeur: { v: hero } as any, description: 'Bannière hero de la page d\'accueil' },
      { onConflict: 'cle' }
    );
    if (heroErr) { toast.error(`Hero : ${heroErr.message}`); setSaving(false); return; }
    await logActivity('update', 'settings', undefined, { keys: [...KEYS.map(k => k.cle), 'hero_banner'] });
    toast.success('Paramètres enregistrés');
    setSaving(false);
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground text-sm">Configuration générale de la boutique</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Enregistrer</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-heading">Informations générales</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {KEYS.map(k => (
            <div key={k.cle} className={k.type === 'textarea' ? 'md:col-span-2' : ''}>
              <Label>{k.label}</Label>
              {k.type === 'textarea' ? (
                <Textarea rows={4} value={values[k.cle] ?? ''} onChange={e => setValues({ ...values, [k.cle]: e.target.value })} />
              ) : (
                <Input type={k.type} value={values[k.cle] ?? ''} onChange={e => setValues({ ...values, [k.cle]: k.type === 'number' ? +e.target.value : e.target.value })} />
              )}
              <p className="text-xs text-muted-foreground mt-1">{k.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" /> Bannière d'accueil (Hero)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Personnalisez l'image et le message de la page d'accueil pour mettre en avant des nouveautés ou des promotions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Image de fond</Label>
            <ImageUploader
              bucket="category-images"
              folder="hero"
              value={hero.image_url ? [hero.image_url] : []}
              onChange={(urls) => setHero({ ...hero, image_url: urls[0] || '' })}
              multiple={false}
            />
            <p className="text-xs text-muted-foreground mt-1">Format paysage recommandé (1920×1080). Laissez vide pour utiliser l'image par défaut.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Sur-titre (eyebrow)</Label>
              <Input value={hero.eyebrow} onChange={e => setHero({ ...hero, eyebrow: e.target.value })} placeholder="Ex: Soldes -50%" />
            </div>
            <div>
              <Label>Texte du bouton</Label>
              <Input value={hero.cta_label} onChange={e => setHero({ ...hero, cta_label: e.target.value })} placeholder="Découvrir" />
            </div>
            <div>
              <Label>Titre principal</Label>
              <Input value={hero.title_main} onChange={e => setHero({ ...hero, title_main: e.target.value })} />
            </div>
            <div>
              <Label>Mot accentué (en couleur)</Label>
              <Input value={hero.title_accent} onChange={e => setHero({ ...hero, title_accent: e.target.value })} placeholder="petits trésors" />
            </div>
            <div className="md:col-span-2">
              <Label>Sous-titre</Label>
              <Textarea rows={2} value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Lien du bouton</Label>
              <Input value={hero.cta_href} onChange={e => setHero({ ...hero, cta_href: e.target.value })} placeholder="/boutique ou https://..." />
              <p className="text-xs text-muted-foreground mt-1">Chemin interne (/promotions) ou URL complète</p>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={hero.show_whatsapp} onCheckedChange={(c) => setHero({ ...hero, show_whatsapp: c })} />
              <Label className="cursor-pointer">Afficher le bouton WhatsApp</Label>
            </div>
          </div>

          <div className="mt-2">
            <Label className="text-xs text-muted-foreground">Aperçu</Label>
            <div className="relative h-48 rounded-lg overflow-hidden border border-border mt-1 bg-muted">
              {hero.image_url && <img src={hero.image_url} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/60" />
              <div className="relative h-full flex flex-col items-center justify-center text-center px-4 text-background">
                {hero.eyebrow && <p className="text-[10px] uppercase tracking-widest mb-1 opacity-90">{hero.eyebrow}</p>}
                <p className="font-heading text-xl font-bold leading-tight">
                  {hero.title_main} {hero.title_accent && <span className="text-accent">{hero.title_accent}</span>}
                </p>
                {hero.subtitle && <p className="text-xs opacity-80 mt-1 line-clamp-2 max-w-md">{hero.subtitle}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
