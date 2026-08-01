import { createClient } from '@/lib/supabase/server';
import type { Production } from '@/lib/productions/types';

export async function getAdminProductions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .order('starts_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  return {
    productions: (data ?? []) as Production[],
    error,
  };
}

export async function getAdminProduction(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return {
    production: (data ?? null) as Production | null,
    error,
  };
}
