import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Save, Key } from 'lucide-react';
import { toast } from 'sonner';
import { logActivity } from '@/lib/activity';
import ImageUploader from '@/components/admin/ImageUploader';

export default function AdminProfile() {
  const { user, roles } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('display_name, email, avatar_url').eq('user_id', user.id).maybeSingle();
      setDisplayName(data?.display_name ?? user.user_metadata?.display_name ?? '');
      setEmail(data?.email ?? user.email ?? '');
      setAvatarUrl(data?.avatar_url ?? user.user_metadata?.avatar_url ?? '');
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updates: any = { data: { display_name: displayName, avatar_url: avatarUrl } };
      if (email && email !== user.email) updates.email = email;
      const { error: authErr } = await supabase.auth.updateUser(updates);
      if (authErr) throw authErr;
      await supabase.from('profiles').update({ display_name: displayName, email, avatar_url: avatarUrl }).eq('user_id', user.id);
      await logActivity('update', 'own_profile', user.id);
      toast.success(email !== user.email ? 'Profil mis à jour. Vérifiez votre email.' : 'Profil mis à jour');
    } catch (e: any) { toast.error(e.message || 'Erreur'); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (newPwd.length < 6) { toast.error('Mot de passe min 6 caractères'); return; }
    if (newPwd !== confirmPwd) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (!user?.email) { toast.error('Email manquant'); return; }
    setPwdSaving(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPwd });
      if (signErr) { toast.error('Mot de passe actuel incorrect'); setPwdSaving(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      await logActivity('update', 'own_password', user.id);
      toast.success('Mot de passe modifié');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) { toast.error(e.message || 'Erreur'); } finally { setPwdSaving(false); }
  };

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const initial = (displayName || email || 'A').charAt(0).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Mon profil</h1>
        <p className="text-muted-foreground text-sm">Gérez vos informations personnelles et votre mot de passe</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-heading">Informations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label>Photo de profil</Label>
              <div className="mt-2">
                <ImageUploader
                  bucket="avatars"
                  folder={user?.id}
                  value={avatarUrl ? [avatarUrl] : []}
                  onChange={(urls) => setAvatarUrl(urls[0] || '')}
                  multiple={false}
                  shape="round"
                  maxSizeMB={2}
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Rôles</Label>
            <div className="flex flex-wrap gap-1 mt-2">
              {roles.length === 0 ? <span className="text-sm text-muted-foreground">aucun</span> :
                roles.map(r => <Badge key={r}>{r}</Badge>)}
            </div>
          </div>
          <div><Label>Nom affiché</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Le changement d'email demande une confirmation.</p>
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base font-heading">Changer le mot de passe</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Mot de passe actuel</Label><Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} /></div>
          <div><Label>Nouveau mot de passe</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} /></div>
          <div><Label>Confirmer</Label><Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} /></div>
          <Button onClick={changePassword} disabled={pwdSaving}>
            {pwdSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}Changer le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
