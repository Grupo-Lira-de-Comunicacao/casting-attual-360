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

export async function getUpcomingProductions(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productions')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .not('status', 'in', '(completed,cancelled,archived)')
    .order('starts_at', { ascending: true })
    .limit(limit);

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
