import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

export default function AuthPage() {
  useSEO({ title: 'Connexion / Inscription — BabyCenter', description: 'Accédez à votre compte client BabyCenter pour suivre vos commandes, gérer vos favoris et adresses.' });
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from || '/compte';

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (user) { navigate(from, { replace: true }); return null; }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast.error(error);
    else { toast.success('Connexion réussie'); navigate(from, { replace: true }); }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, displayName);
    setLoading(false);
    if (error) toast.error(error);
    else toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { toast.error(error); setLoading(false); }
  };

  return (
    <div className="container max-w-md py-12 md:py-20">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-2xl">Espace client</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Suivez vos commandes et gérez vos favoris</p>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <Label htmlFor="si-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="si-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-9" placeholder="vous@email.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="si-pass">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="si-pass" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <Label htmlFor="su-name">Nom complet</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="su-name" required value={displayName} onChange={e => setDisplayName(e.target.value)} className="pl-9" placeholder="Marie Kouassi" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="su-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="pl-9" placeholder="vous@email.com" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="su-pass">Mot de passe (min. 6)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="su-pass" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer mon compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
          </div>

          <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleGoogle}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .55 4.1 1.6l3-3C17.2 1.7 14.8.7 12 .7 7.3.7 3.3 3.4 1.4 7.3l3.5 2.7C5.9 7.1 8.7 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/><path fill="#FBBC05" d="M4.9 14.1c-.2-.6-.3-1.4-.3-2.1s.1-1.5.3-2.1L1.4 7.2C.5 8.9 0 10.9 0 13s.5 4.1 1.4 5.8l3.5-2.7z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.3 0-6.1-2.1-7.1-5l-3.5 2.7C3.3 20.6 7.3 24 12 24z"/></svg>
            Continuer avec Google
          </Button>

          <div className="mt-5 pt-4 border-t border-border">
            <Button asChild type="button" variant="ghost" className="w-full text-muted-foreground hover:text-primary">
              <Link to="/admin/login">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Se connecter en admin
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-4">
            En continuant, vous acceptez nos <Link to="/a-propos" className="underline">conditions</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
