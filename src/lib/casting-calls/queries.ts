import { createClient } from '@/lib/supabase/server';
import type { CastingCall, CastingCallWithRequirements, CastingRequirement } from '@/lib/casting-calls/types';

export async function getCastingCallsByProduction(productionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('casting_calls')
    .select('*')
    .eq('production_id', productionId)
    .order('created_at', { ascending: false });

  return {
    castingCalls: (data ?? []) as CastingCall[],
    error,
  };
}

export async function getCastingCall(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('casting_calls')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return { castingCall: null as CastingCallWithRequirements | null, error };
  }

  const { data: requirements, error: requirementsError } = await supabase
    .from('casting_requirements')
    .select('*')
    .eq('casting_call_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return {
    castingCall: {
      ...(data as CastingCall),
      requirements: (requirements ?? []) as CastingRequirement[],
    },
    error: requirementsError,
  };
}

export async function getOpenCastingCalls(limit = 20) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('casting_calls')
    .select('*')
    .eq('status', 'open')
    .or(`application_deadline.is.null,application_deadline.gte.${now}`)
    .order('application_deadline', { ascending: true, nullsFirst: false })
    .limit(limit);

  return {
    castingCalls: (data ?? []) as CastingCall[],
    error,
  };
}
