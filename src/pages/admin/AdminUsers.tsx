import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Plus, MoreVertical, Pencil, Key, Ban, CheckCircle2, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { shortDateTime } from '@/lib/format';
import { logActivity } from '@/lib/activity';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import ImageUploader from '@/components/admin/ImageUploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Role = 'admin' | 'manager' | 'vendeur';
interface StaffUser {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  roles: Role[];
}

const ALL_ROLES: { value: Role; label: string; color: string }[] = [
  { value: 'admin', label: 'Administrateur', color: 'bg-primary text-primary-foreground' },
  { value: 'manager', label: 'Manager', color: 'bg-accent text-accent-foreground' },
  { value: 'vendeur', label: 'Vendeur', color: 'bg-secondary text-secondary-foreground' },
];

const isBlocked = (u: StaffUser) => !!u.banned_until && new Date(u.banned_until) > new Date();

export default function AdminUsers() {
  const { user: me, isAdmin } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Create
  const [createOpen, setCreateOpen] = useState(false);
  const [cEmail, setCEmail] = useState('');
  const [cName, setCName] = useState('');
  const [cPwd, setCPwd] = useState('');
  const [cAvatar, setCAvatar] = useState<string[]>([]);
  const [cRoles, setCRoles] = useState<Role[]>(['vendeur']);

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [eEmail, setEEmail] = useState('');
  const [eName, setEName] = useState('');
  const [eAvatar, setEAvatar] = useState<string[]>([]);
  const [eRoles, setERoles] = useState<Role[]>([]);

  // Password
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdUser, setPwdUser] = useState<StaffUser | null>(null);
  const [newPwd, setNewPwd] = useState('');

  // Confirm
  const [confirm, setConfirm] = useState<{ open: boolean; title: string; description?: string; destructive?: boolean; onConfirm: () => void }>({ open: false, title: '', onConfirm: () => {} });

  const call = async (action: string, payload: any = {}) => {
    const { data, error } = await supabase.functions.invoke('manage-users', { body: { action, ...payload } });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await call('list');
      setUsers(data.users ?? []);
    } catch (e: any) {
      toast.error(e.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleRole = (set: Role[], r: Role, setter: (v: Role[]) => void) => {
    setter(set.includes(r) ? set.filter(x => x !== r) : [...set, r]);
  };

  const onCreate = async () => {
    if (!cEmail || cPwd.length < 6) { toast.error('Email + mot de passe (min 6) requis'); return; }
    setBusy(true);
    try {
      const r = await call('create', { email: cEmail, password: cPwd, display_name: cName, avatar_url: cAvatar[0] ?? null, roles: cRoles });
      await logActivity('create', 'user', r.user_id, { email: cEmail, roles: cRoles });
      toast.success('Utilisateur créé');
      setCreateOpen(false); setCEmail(''); setCName(''); setCPwd(''); setCAvatar([]); setCRoles(['vendeur']);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const openEdit = (u: StaffUser) => {
    setEditUser(u); setEEmail(u.email ?? ''); setEName(u.display_name ?? ''); setEAvatar(u.avatar_url ? [u.avatar_url] : []); setERoles(u.roles); setEditOpen(true);
  };
  const onEdit = async () => {
    if (!editUser) return;
    setBusy(true);
    try {
      await call('update', { user_id: editUser.id, email: eEmail, display_name: eName, avatar_url: eAvatar[0] ?? null });
      await call('set_roles', { user_id: editUser.id, roles: eRoles });
      await logActivity('update', 'user', editUser.id, { email: eEmail, roles: eRoles });
      toast.success('Utilisateur mis à jour');
      setEditOpen(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const openPwd = (u: StaffUser) => { setPwdUser(u); setNewPwd(''); setPwdOpen(true); };
  const onPwd = async () => {
    if (!pwdUser || newPwd.length < 6) { toast.error('Mot de passe min 6 caractères'); return; }
    setBusy(true);
    try {
      await call('set_password', { user_id: pwdUser.id, password: newPwd });
      await logActivity('update', 'user_password', pwdUser.id);
      toast.success('Mot de passe modifié');
      setPwdOpen(false);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const onBlock = (u: StaffUser, blocked: boolean) => {
    setConfirm({
      open: true,
      title: blocked ? 'Bloquer cet utilisateur ?' : 'Débloquer cet utilisateur ?',
      description: blocked ? `${u.email} ne pourra plus se connecter.` : `${u.email} pourra à nouveau se connecter.`,
      destructive: blocked,
      onConfirm: async () => {
        try {
          await call('set_blocked', { user_id: u.id, blocked });
          await logActivity(blocked ? 'block' : 'unblock', 'user', u.id);
          toast.success(blocked ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
          load();
        } catch (e: any) { toast.error(e.message); }
      },
    });
  };

  const onDelete = (u: StaffUser) => {
    setConfirm({
      open: true,
      title: 'Supprimer cet utilisateur ?',
      description: `${u.email} sera définitivement supprimé. Cette action est irréversible.`,
      destructive: true,
      onConfirm: async () => {
        try {
          await call('delete', { user_id: u.id });
          await logActivity('delete', 'user', u.id, { email: u.email });
          toast.success('Utilisateur supprimé');
          load();
        } catch (e: any) { toast.error(e.message); }
      },
    });
  };

  if (!isAdmin) {
    return (
      <Card><CardContent className="p-12 text-center text-muted-foreground">
        <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        Réservé aux administrateurs.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">Gérez le personnel ayant accès au back-office</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvel utilisateur</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-heading">{users.length} compte{users.length > 1 ? 's' : ''}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôles</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Dernière connexion</TableHead>
                    <TableHead className="hidden md:table-cell">Créé le</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => {
                    const blocked = isBlocked(u);
                    const isMe = u.id === me?.id;
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.display_name || ''} />}
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {(u.display_name || u.email || '?').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{u.display_name || '—'} {isMe && <Badge variant="outline" className="ml-2">moi</Badge>}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-xs text-muted-foreground">aucun</span>}
                            {u.roles.map(r => {
                              const meta = ALL_ROLES.find(x => x.value === r);
                              return <Badge key={r} className={meta?.color}>{meta?.label ?? r}</Badge>;
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {blocked
                            ? <Badge variant="destructive">Bloqué</Badge>
                            : <Badge variant="outline" className="text-primary border-primary/30">Actif</Badge>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {u.last_sign_in_at ? shortDateTime(u.last_sign_in_at) : 'jamais'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.created_at ? shortDateTime(u.created_at) : '—'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPwd(u)}><Key className="h-4 w-4 mr-2" />Réinitialiser mot de passe</DropdownMenuItem>
                              {!isMe && (
                                <DropdownMenuItem onClick={() => onBlock(u, !blocked)}>
                                  {blocked ? <><CheckCircle2 className="h-4 w-4 mr-2" />Débloquer</> : <><Ban className="h-4 w-4 mr-2" />Bloquer</>}
                                </DropdownMenuItem>
                              )}
                              {!isMe && <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(u)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                </DropdownMenuItem>
                              </>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Nouvel utilisateur</DialogTitle>
            <DialogDescription>Créez un compte staff (admin, manager ou vendeur).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Photo de profil</Label>
              <ImageUploader bucket="avatars" value={cAvatar} onChange={setCAvatar} multiple={false} shape="round" maxSizeMB={2} />
            </div>
            <div><Label>Nom affiché</Label><Input value={cName} onChange={e => setCName(e.target.value)} placeholder="Marie Diallo" /></div>
            <div><Label>Email</Label><Input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="marie@babycenter.ci" /></div>
            <div><Label>Mot de passe</Label><Input type="text" value={cPwd} onChange={e => setCPwd(e.target.value)} placeholder="min 6 caractères" /></div>
            <div>
              <Label>Rôles</Label>
              <div className="space-y-2 mt-2">
                {ALL_ROLES.map(r => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={cRoles.includes(r.value)} onCheckedChange={() => toggleRole(cRoles, r.value, setCRoles)} />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={onCreate} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Modifier l'utilisateur</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Photo de profil</Label>
              <ImageUploader bucket="avatars" value={eAvatar} onChange={setEAvatar} multiple={false} shape="round" maxSizeMB={2} />
            </div>
            <div><Label>Nom affiché</Label><Input value={eName} onChange={e => setEName(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={eEmail} onChange={e => setEEmail(e.target.value)} /></div>
            <div>
              <Label>Rôles</Label>
              <div className="space-y-2 mt-2">
                {ALL_ROLES.map(r => (
                  <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={eRoles.includes(r.value)} onCheckedChange={() => toggleRole(eRoles, r.value, setERoles)} />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={onEdit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Nouveau mot de passe</DialogTitle>
            <DialogDescription>Pour {pwdUser?.email}</DialogDescription>
          </DialogHeader>
          <div><Label>Mot de passe</Label><Input type="text" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="min 6 caractères" /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdOpen(false)}>Annuler</Button>
            <Button onClick={onPwd} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Mettre à jour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm({ ...confirm, open: o })}
        title={confirm.title}
        description={confirm.description}
        destructive={confirm.destructive}
        onConfirm={() => { confirm.onConfirm(); setConfirm({ ...confirm, open: false }); }}
      />
    </div>
  );
}
