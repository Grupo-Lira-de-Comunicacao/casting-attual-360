'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { CASTING_CALL_STATUSES, type CastingCallStatus } from '@/lib/casting-calls/types';

const STATUS_TRANSITIONS: Record<CastingCallStatus, CastingCallStatus[]> = {
  draft: ['open', 'cancelled'],
  open: ['paused', 'closed', 'cancelled'],
  paused: ['open', 'closed', 'cancelled'],
  closed: [],
  cancelled: [],
};

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value || null;
}

async function enqueueCastingCallEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventType: string,
  castingCall: { id: string; production_id: string; title: string; role_name: string; status: string; application_deadline: string | null },
  extra: Record<string, unknown> = {},
) {
  return supabase.from('integration_events').insert({
    event_type: eventType,
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: castingCall.production_id,
    casting_call_id: castingCall.id,
    payload: {
      casting_call_id: castingCall.id,
      production_id: castingCall.production_id,
      title: castingCall.title,
      role_name: castingCall.role_name,
      status: castingCall.status,
      application_deadline: castingCall.application_deadline,
      ...extra,
    },
  });
}

export async function createCastingCall(productionId: string, formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) redirect(`/admin/producoes/${productionId}/convocacoes/nova?error=unauthorized`);

  const title = text(formData, 'title');
  const roleName = text(formData, 'role_name');
  const quantity = Number(text(formData, 'quantity') ?? '1');
  if (!title || title.length < 2 || !roleName || roleName.length < 2 || !Number.isInteger(quantity) || quantity < 1) {
    redirect(`/admin/producoes/${productionId}/convocacoes/nova?error=invalid`);
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('casting_calls')
    .insert({
      production_id: productionId,
      title,
      role_name: roleName,
      description: text(formData, 'description'),
      quantity,
      application_deadline: text(formData, 'application_deadline'),
      work_starts_at: text(formData, 'work_starts_at'),
      work_ends_at: text(formData, 'work_ends_at'),
      city: text(formData, 'city'),
      state: text(formData, 'state')?.toUpperCase() ?? null,
      venue: text(formData, 'venue'),
      is_remote: formData.get('is_remote') === 'on',
      compensation_amount: text(formData, 'compensation_amount') ? Number(String(formData.get('compensation_amount')).replace(',', '.')) : null,
      currency: 'BRL',
      compensation_notes: text(formData, 'compensation_notes'),
      internal_notes: text(formData, 'internal_notes'),
      created_by: authData.user?.id ?? null,
      status: 'draft',
    })
    .select('id, production_id, title, role_name, status, application_deadline')
    .single();

  if (error || !data || !data.id || !data.production_id || !data.title || !data.role_name || !data.status) {
    redirect(`/admin/producoes/${productionId}/convocacoes/nova?error=save`);
  }

  const normalized = {
    id: data.id,
    production_id: data.production_id,
    title: data.title,
    role_name: data.role_name,
    status: data.status,
    application_deadline: data.application_deadline ?? null,
  };
  const { error: integrationError } = await enqueueCastingCallEvent(supabase, 'casting.call.created', normalized);

  revalidatePath(`/admin/producoes/${productionId}/convocacoes`);
  redirect(`/admin/producoes/${productionId}/convocacoes/${data.id}?created=1&integration=${integrationError ? 'warning' : 'queued'}`);
}

export async function changeCastingCallStatus(productionId: string, castingCallId: string, formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) redirect(`/admin/producoes/${productionId}/convocacoes/${castingCallId}?status_error=unauthorized`);

  const targetStatus = String(formData.get('target_status') ?? '') as CastingCallStatus;
  if (!CASTING_CALL_STATUSES.includes(targetStatus)) redirect(`/admin/producoes/${productionId}/convocacoes/${castingCallId}?status_error=invalid`);

  const supabase = await createClient();
  const { data: current } = await supabase.from('casting_calls').select('status').eq('id', castingCallId).eq('production_id', productionId).single();
  if (!current?.status) redirect(`/admin/producoes/${productionId}/convocacoes/${castingCallId}?status_error=load`);

  const currentStatus = current.status as CastingCallStatus;
  if (!STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus)) redirect(`/admin/producoes/${productionId}/convocacoes/${castingCallId}?status_error=transition`);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('casting_calls')
    .update({
      status: targetStatus,
      published_at: targetStatus === 'open' ? now : undefined,
      closed_at: targetStatus === 'closed' || targetStatus === 'cancelled' ? now : null,
    })
    .eq('id', castingCallId)
    .eq('production_id', productionId)
    .select('id, production_id, title, role_name, status, application_deadline')
    .single();

  if (error || !data || !data.id || !data.production_id || !data.title || !data.role_name || !data.status) {
    redirect(`/admin/producoes/${productionId}/convocacoes/${castingCallId}?status_error=save`);
  }

  const normalized = {
    id: data.id,
    production_id: data.production_id,
    title: data.title,
    role_name: data.role_name,
    status: data.status,
    application_deadline: data.application_deadline ?? null,
  };
  const eventType = targetStatus === 'open' ? 'casting.call.published' : 'casting.call.status_changed';
  const { error: integrationError } = await enqueueCastingCallEvent(supabase, eventType, normalized, {
    previous_status: currentStatus,
    current_status: targetStatus,
  });

  revalidatePath(`/admin/producoes/${productionId}/convocacoes`);
  revalidatePath(`/admin/producoes/${productionId}/convocacoes/${castingCallId}`);
  redirect(`/admin/producoes/${productionId}/convocacoes/${castingCallId}?status_changed=1&integration=${integrationError ? 'warning' : 'queued'}`);
}
