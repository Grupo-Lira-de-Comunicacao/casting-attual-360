'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin';
import { generateCastingShortlist } from '@/lib/matching/generate';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_SELECTIONS = ['suggested', 'shortlisted', 'removed'] as const;
type AllowedSelection = (typeof ALLOWED_SELECTIONS)[number];

function shortlistPath(productionId: string, castingCallId: string) {
  return `/admin/producoes/${productionId}/convocacoes/${castingCallId}/shortlist`;
}

export async function generateShortlistAction(productionId: string, castingCallId: string) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) redirect(`${shortlistPath(productionId, castingCallId)}?error=unauthorized`);

  const result = await generateCastingShortlist(castingCallId);
  if (!result.ok) redirect(`${shortlistPath(productionId, castingCallId)}?error=generate`);

  revalidatePath(shortlistPath(productionId, castingCallId));
  redirect(`${shortlistPath(productionId, castingCallId)}?generated=1&integration=${result.integrationWarning ? 'warning' : 'queued'}`);
}

export async function changeShortlistSelection(
  productionId: string,
  castingCallId: string,
  shortlistId: string,
  formData: FormData,
) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) redirect(`${shortlistPath(productionId, castingCallId)}?error=unauthorized`);

  const target = String(formData.get('selection_status') ?? '') as AllowedSelection;
  if (!ALLOWED_SELECTIONS.includes(target)) redirect(`${shortlistPath(productionId, castingCallId)}?error=invalid`);

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const { data: current } = await supabase
    .from('casting_shortlist')
    .select('id, talent_id, selection_status, casting_calls!inner(id, production_id)')
    .eq('id', shortlistId)
    .eq('casting_call_id', castingCallId)
    .single();

  const linkedCall = Array.isArray(current?.casting_calls) ? current?.casting_calls[0] : current?.casting_calls;
  if (!current?.id || !linkedCall || linkedCall.production_id !== productionId) {
    redirect(`${shortlistPath(productionId, castingCallId)}?error=not_found`);
  }

  const previousStatus = current.selection_status;
  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('casting_shortlist')
    .update({
      selection_status: target,
      reviewed_by: authData.user?.id ?? null,
      reviewed_at: now,
    })
    .eq('id', shortlistId)
    .eq('casting_call_id', castingCallId)
    .select('id, talent_id, selection_status')
    .single();

  if (error || !updated?.id || !updated.talent_id || !updated.selection_status) {
    redirect(`${shortlistPath(productionId, castingCallId)}?error=save`);
  }

  const { error: integrationError } = await supabase.from('integration_events').insert({
    event_type: 'casting.shortlist.selection_changed',
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: productionId,
    casting_call_id: castingCallId,
    shortlist_id: updated.id,
    payload: {
      shortlist_id: updated.id,
      casting_call_id: castingCallId,
      production_id: productionId,
      talent_id: updated.talent_id,
      previous_status: previousStatus,
      current_status: updated.selection_status,
      reviewed_at: now,
    },
  });

  revalidatePath(shortlistPath(productionId, castingCallId));
  redirect(`${shortlistPath(productionId, castingCallId)}?selection_changed=1&integration=${integrationError ? 'warning' : 'queued'}`);
}
