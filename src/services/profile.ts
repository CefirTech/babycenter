import { supabase } from '@/integrations/supabase/client';

export async function fetchProfileAndAddress(userId: string) {
  const [{ data: prof }, { data: addr }] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, telephone')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('par_defaut', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return { profile: prof, address: addr };
}

export async function updateProfile(
  userId: string,
  updates: { display_name?: string; telephone?: string; avatar_url?: string },
) {
  const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId);
  if (error) throw error;
}
