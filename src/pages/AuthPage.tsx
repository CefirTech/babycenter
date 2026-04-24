import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/SEO';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/compte';
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);

  const onGoogle = async () => {
    setLoading(true);
    const res = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + next });
    if (res.error) {
      toast({ title: 'Connexion Google échouée', description: String(res.error), variant: 'destructive' });
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + next, data: { display_name: nom } },
        });
        if (error) throw error;
        toast({ title: 'Compte créé', description: 'Bienvenue !' });
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

  const isSignup = mode === 'signup';

  return (
    <div className="container py-12 max-w-md">
      <SEO title={isSignup ? 'Créer un compte' : 'Se connecter'} description="Accédez à votre espace BABYCENTER" />
      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{isSignup ? 'Créer un compte' : 'Se connecter'}</h1>
      <p className="text-muted-foreground mb-8">{isSignup ? 'Rejoignez la famille BABYCENTER' : 'Bienvenue, ravie de vous revoir'}</p>

      <Button type="button" variant="outline" className="w-full mb-6" onClick={onGoogle} disabled={loading}>
        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuer avec Google
      </Button>

      <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou</span></div></div>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignup && (
          <div><Label htmlFor="nom">Nom</Label><Input id="nom" value={nom} onChange={e => setNom(e.target.value)} required /></div>
        )}
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div><Label htmlFor="pwd">Mot de passe</Label><Input id="pwd" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} /></div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignup ? 'Créer mon compte' : 'Se connecter')}
        </Button>
      </form>

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
