import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import ImageUploader from '@/components/admin/ImageUploader';
import { DEFAULT_SLIDE, DEFAULT_CONFIG, type HeroConfig, type HeroSlide } from '@/hooks/useHeroBanner';

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
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('*');
    if (error) toast.error(`Paramètres : ${error.message}`);
    const v: Record<string, any> = {};
    let cfgLoaded: HeroConfig | null = null;
    (data ?? []).forEach((s: any) => {
      const raw = s.valeur;
      const val = raw && typeof raw === 'object' && 'v' in raw ? raw.v : raw;
      if (s.cle === 'hero_banner' && val && typeof val === 'object') {
        if (Array.isArray(val.slides)) {
          cfgLoaded = {
            slides: val.slides.map((sl: any) => ({ ...DEFAULT_SLIDE, ...sl })),
            interval_seconds: Math.min(15, Math.max(3, Number(val.interval_seconds) || 6)),
          };
        } else {
          // legacy single object
          cfgLoaded = { slides: [{ ...DEFAULT_SLIDE, ...val }], interval_seconds: 6 };
        }
      } else {
        v[s.cle] = val;
      }
    });
    setValues(v);
    if (cfgLoaded) setConfig(cfgLoaded);
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
    const cfgToSave: HeroConfig = {
      slides: config.slides.length ? config.slides : [DEFAULT_SLIDE],
      interval_seconds: Math.min(15, Math.max(3, config.interval_seconds || 6)),
    };
    const { error: heroErr } = await supabase.from('settings').upsert(
      { cle: 'hero_banner', valeur: { v: cfgToSave } as any, description: 'Bannière hero (carrousel) de la page d\'accueil' },
      { onConflict: 'cle' }
    );
    if (heroErr) { toast.error(`Hero : ${heroErr.message}`); setSaving(false); return; }
    await logActivity('update', 'settings', undefined, { keys: [...KEYS.map(k => k.cle), 'hero_banner'], slides: cfgToSave.slides.length });
    toast.success('Paramètres enregistrés');
    setSaving(false);
  };

  const updateSlide = (idx: number, patch: Partial<HeroSlide>) => {
    setConfig(c => ({ ...c, slides: c.slides.map((s, i) => i === idx ? { ...s, ...patch } : s) }));
  };
  const addSlide = () => setConfig(c => ({ ...c, slides: [...c.slides, { ...DEFAULT_SLIDE, eyebrow: '', title_main: 'Nouvelle bannière', title_accent: '', subtitle: '' }] }));
  const removeSlide = (idx: number) => setConfig(c => ({ ...c, slides: c.slides.length > 1 ? c.slides.filter((_, i) => i !== idx) : c.slides }));
  const moveSlide = (idx: number, dir: -1 | 1) => {
    setConfig(c => {
      const j = idx + dir;
      if (j < 0 || j >= c.slides.length) return c;
      const arr = [...c.slides];
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...c, slides: arr };
    });
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
            <ImageIcon className="h-4 w-4 text-primary" /> Bannières d'accueil (Carrousel hero)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Ajoutez plusieurs bannières pour mettre en avant nouveautés, soldes ou destockage. Elles défileront automatiquement avec une transition élégante.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Durée d'affichage */}
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <Label className="font-medium">Durée d'affichage par bannière</Label>
              <span className="text-sm font-semibold text-primary">{config.interval_seconds} sec</span>
            </div>
            <Slider
              min={3}
              max={15}
              step={1}
              value={[config.interval_seconds]}
              onValueChange={([v]) => setConfig(c => ({ ...c, interval_seconds: v }))}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Temps avant passage automatique à la bannière suivante (3 à 15 secondes). Sans effet si une seule bannière.
            </p>
          </div>

          {/* Slides */}
          {config.slides.map((slide, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4 space-y-4 relative">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">Bannière {idx + 1}{config.slides.length > 1 && ` / ${config.slides.length}`}</h3>
                <div className="flex gap-1">
                  <Button type="button" size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveSlide(idx, -1)} title="Monter">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" disabled={idx === config.slides.length - 1} onClick={() => moveSlide(idx, 1)} title="Descendre">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" disabled={config.slides.length <= 1} onClick={() => removeSlide(idx)} title="Supprimer" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Image de fond</Label>
                <ImageUploader
                  bucket="category-images"
                  folder="hero"
                  value={slide.image_url ? [slide.image_url] : []}
                  onChange={(urls) => updateSlide(idx, { image_url: urls[0] || '' })}
                  multiple={false}
                />
                <p className="text-xs text-muted-foreground mt-1">Format paysage recommandé (1920×1080).</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Sur-titre (eyebrow)</Label>
                  <Input value={slide.eyebrow} onChange={e => updateSlide(idx, { eyebrow: e.target.value })} placeholder="Ex: Soldes -50%" />
                </div>
                <div>
                  <Label>Texte du bouton</Label>
                  <Input value={slide.cta_label} onChange={e => updateSlide(idx, { cta_label: e.target.value })} placeholder="Découvrir" />
                </div>
                <div>
                  <Label>Titre principal</Label>
                  <Input value={slide.title_main} onChange={e => updateSlide(idx, { title_main: e.target.value })} />
                </div>
                <div>
                  <Label>Mot accentué (en couleur)</Label>
                  <Input value={slide.title_accent} onChange={e => updateSlide(idx, { title_accent: e.target.value })} placeholder="petits trésors" />
                </div>
                <div className="md:col-span-2">
                  <Label>Sous-titre</Label>
                  <Textarea rows={2} value={slide.subtitle} onChange={e => updateSlide(idx, { subtitle: e.target.value })} />
                </div>
                <div>
                  <Label>Lien du bouton</Label>
                  <Input value={slide.cta_href} onChange={e => updateSlide(idx, { cta_href: e.target.value })} placeholder="/boutique ou https://..." />
                  <p className="text-xs text-muted-foreground mt-1">Chemin interne (/promotions) ou URL complète</p>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={slide.show_whatsapp} onCheckedChange={(c) => updateSlide(idx, { show_whatsapp: c })} />
                  <Label className="cursor-pointer">Afficher le bouton WhatsApp</Label>
                </div>
                <div className="md:col-span-2 rounded-md border border-border p-3 bg-muted/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={!!slide.show_take_button} onCheckedChange={(c) => updateSlide(idx, { show_take_button: c })} />
                    <Label className="cursor-pointer font-medium">Afficher un bouton "Je prends" (vers un produit)</Label>
                  </div>
                  {slide.show_take_button && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Texte du bouton</Label>
                        <Input value={slide.take_button_label ?? ''} onChange={e => updateSlide(idx, { take_button_label: e.target.value })} placeholder="Je prends" />
                      </div>
                      <div>
                        <Label>Lien vers l'article</Label>
                        <Input value={slide.take_button_href ?? ''} onChange={e => updateSlide(idx, { take_button_href: e.target.value })} placeholder="/produit/mon-slug" />
                        <p className="text-xs text-muted-foreground mt-1">Ex: /produit/robe-fleurie ou /boutique?promo=1</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Aperçu de la slide */}
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Aperçu</Label>
                <div className="relative h-40 rounded-lg overflow-hidden border border-border mt-1 bg-muted">
                  {slide.image_url && <img src={slide.image_url} alt="Aperçu" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/60" />
                  <div className="relative h-full flex flex-col items-center justify-center text-center px-4 text-background">
                    {slide.eyebrow && <p className="text-[10px] uppercase tracking-widest mb-1 opacity-90">{slide.eyebrow}</p>}
                    <p className="font-heading text-lg font-bold leading-tight">
                      {slide.title_main} {slide.title_accent && <span className="text-accent">{slide.title_accent}</span>}
                    </p>
                    {slide.subtitle && <p className="text-xs opacity-80 mt-1 line-clamp-2 max-w-md">{slide.subtitle}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addSlide} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Ajouter une bannière
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
