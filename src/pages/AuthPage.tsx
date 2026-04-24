import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone } from 'lucide-react';
import SEO from '@/components/SEO';

type Method = 'email' | 'phone';

function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  // Default to Côte d'Ivoire (+225) if no country code
  const cleaned = digits.replace(/^0+/, '');
  return `+225${cleaned}`;
}

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/compte';
  const { toast } = useToast();

  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state for phone signup
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const isSignup = mode === 'signup';

  const onGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + next });
    if (res.error) {
      toast({ title: 'Connexion Google échouée', description: String(res.error), variant: 'destructive' });
      setLoading(false);
    }
  };

  const onSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + next, data: { display_name: nom } },
        });
        if (error) throw error;
        toast({ title: 'Compte créé', description: 'Vérifiez votre email pour confirmer.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate(next);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message ?? 'Échec', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const phoneE164 = normalizePhone(phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneE164,
        options: isSignup ? { data: { display_name: nom } } : undefined,
      });
      if (error) throw error;
      setOtpSent(true);
      toast({ title: 'Code envoyé', description: `Un code SMS a été envoyé au ${phoneE164}` });
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message ?? 'Échec d\'envoi du code', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const phoneE164 = normalizePhone(phone);
      const { error } = await supabase.auth.verifyOtp({ phone: phoneE164, token: otpCode, type: 'sms' });
      if (error) throw error;
      toast({ title: isSignup ? 'Compte créé' : 'Connecté', description: 'Bienvenue !' });
      navigate(next);
    } catch (err: any) {
      toast({ title: 'Code invalide', description: err.message ?? 'Vérifiez le code reçu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 max-w-md">
      <SEO title={isSignup ? 'Créer un compte' : 'Se connecter'} description="Accédez à votre espace BABYCENTER" />
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
        {isSignup ? 'Créer un compte' : 'Se connecter'}
      </h1>
      <p className="text-muted-foreground mb-8">
        {isSignup ? 'Rejoignez la famille BABYCENTER' : 'Bienvenue, ravie de vous revoir'}
      </p>

      <Button type="button" variant="outline" className="w-full mb-6" onClick={onGoogle} disabled={loading}>
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">ou</span>
        </div>
      </div>

      <Tabs value={method} onValueChange={(v) => { setMethod(v as Method); setOtpSent(false); setOtpCode(''); }}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="email"><Mail className="h-4 w-4 mr-2" /> Email</TabsTrigger>
          <TabsTrigger value="phone"><Phone className="h-4 w-4 mr-2" /> Téléphone</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <form onSubmit={onSubmitEmail} className="space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={nom} onChange={e => setNom(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pwd">Mot de passe</Label>
              <Input id="pwd" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignup ? 'Créer mon compte' : 'Se connecter')}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="phone">
          {!otpSent ? (
            <form onSubmit={onSendOtp} className="space-y-4">
              {isSignup && (
                <div>
                  <Label htmlFor="nom-p">Nom</Label>
                  <Input id="nom-p" value={nom} onChange={e => setNom(e.target.value)} required />
                </div>
              )}
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" required />
                <p className="text-xs text-muted-foreground mt-1">Vous recevrez un code par SMS.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Recevoir le code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={onVerifyOtp} className="space-y-4">
              <div>
                <Label htmlFor="otp">Code de vérification</Label>
                <Input id="otp" inputMode="numeric" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="123456" required />
                <p className="text-xs text-muted-foreground mt-1">Code envoyé au {normalizePhone(phone)}.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignup ? 'Créer mon compte' : 'Se connecter')}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setOtpSent(false); setOtpCode(''); }}>
                Modifier le numéro
              </Button>
            </form>
          )}
        </TabsContent>
      </Tabs>

      <p className="text-center text-sm text-muted-foreground mt-6">
        {isSignup ? (
          <>Déjà un compte ? <Link to="/connexion" className="text-primary font-medium">Se connecter</Link></>
        ) : (
          <>Pas encore de compte ? <Link to="/inscription" className="text-primary font-medium">Créer un compte</Link></>
        )}
      </p>
    </div>
  );
}
