import { supabase } from '@/integrations/supabase/client';

export async function logActivity(action: string, ressource: string, ressource_id?: string, details?: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('activity_logs').insert({
    user_id: user?.id ?? null,
    user_nom: user?.user_metadata?.display_name || user?.email || 'inconnu',
    action,
    ressource,
    ressource_id: ressource_id ?? null,
    details: details ?? null,
  });
}
