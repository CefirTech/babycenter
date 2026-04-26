import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('settings').select('*');
    if (error) toast.error(`Paramètres : ${error.message}`);
    const v: Record<string, any> = {};
    (data ?? []).forEach((s: any) => { v[s.cle] = typeof s.valeur === 'object' && s.valeur !== null && 'v' in s.valeur ? s.valeur.v : s.valeur; });
    setValues(v);
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
    await logActivity('update', 'settings', undefined, { keys: KEYS.map(k => k.cle) });
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
    </div>
  );
}
