import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Email invalide' }).max(255),
  password: z.string().min(6, { message: 'Mot de passe trop court (6 caractères min)' }).max(100),
});

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: 'Champs invalides',
        description: parsed.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setLoading(false);

    if (error) {
      const lower = error.toLowerCase();
      const isBanned = lower.includes('banned') || lower.includes('blocked') || lower.includes('user_banned') || lower.includes('disabled');
      toast({
        title: isBanned ? 'Compte bloqué' : 'Erreur de connexion',
        description: isBanned
          ? 'Veuillez contacter votre administrateur.'
          : (lower.includes('invalid') ? 'Email ou mot de passe incorrect.' : error),
        variant: 'destructive',
      });
      return;
    }

    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-primary">
            BABY<span className="text-accent">CENTER</span>
          </h1>
          <p className="text-muted-foreground mt-2">Espace Administration</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-6">
            <Lock className="h-6 w-6 text-primary" />
          </div>

          <h2 className="text-xl font-heading font-semibold text-center mb-6 text-card-foreground">Connexion</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@babycenter.ci"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connexion…</>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <Link to="/" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Store className="h-4 w-4" /> Retour au Site Web
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
