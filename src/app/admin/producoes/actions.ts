'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { PRODUCTION_STATUSES, PRODUCTION_TYPES, type ProductionStatus } from '@/lib/productions/types';

export type ProductionActionState = { ok: true; message?: string } | { ok: false; error: string };

const STATUS_TRANSITIONS: Record<ProductionStatus, ProductionStatus[]> = {
  draft: ['planning', 'cancelled', 'archived'],
  planning: ['casting', 'cancelled', 'archived'],
  casting: ['pre_production', 'cancelled', 'archived'],
  pre_production: ['in_production', 'cancelled', 'archived'],
  in_production: ['post_production', 'cancelled'],
  post_production: ['completed', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  archived: [],
};

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value || null;
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function validateProductionForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const productionType = String(formData.get('production_type') ?? 'other');
  if (name.length < 2 || name.length > 160) return { error: 'Informe um nome de produção entre 2 e 160 caracteres.' } as const;
  if (!PRODUCTION_TYPES.includes(productionType as (typeof PRODUCTION_TYPES)[number])) return { error: 'Tipo de produção inválido.' } as const;

  const startsAt = text(formData, 'starts_at');
  const endsAt = text(formData, 'ends_at');
  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) return { error: 'A data final não pode ser anterior à data inicial.' } as const;

  const budgetRaw = text(formData, 'budget_casting');
  const budget = budgetRaw ? Number(budgetRaw.replace(',', '.')) : null;
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) return { error: 'Informe um orçamento de casting válido.' } as const;

  const customSlug = text(formData, 'slug');
  return {
    values: {
      name,
      slug: slugify(customSlug || name) || null,
      description: text(formData, 'description'),
      production_type: productionType,
      client_name: text(formData, 'client_name'),
      project_reference: text(formData, 'project_reference'),
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      city: text(formData, 'city'),
      state: text(formData, 'state')?.toUpperCase() ?? null,
      venue: text(formData, 'venue'),
      address: text(formData, 'address'),
      is_remote: formData.get('is_remote') === 'on',
      budget_casting: budget,
      currency: 'BRL',
      notes: text(formData, 'notes'),
    },
  } as const;
}

async function enqueueProductionEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventType: string,
  production: { id: string; name: string; production_type: string; status: string; starts_at: string | null },
  extra: Record<string, unknown> = {},
) {
  return supabase.from('integration_events').insert({
    event_type: eventType,
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: production.id,
    payload: {
      production_id: production.id,
      name: production.name,
      type: production.production_type,
      status: production.status,
      starts_at: production.starts_at,
      ...extra,
    },
  });
}

function normalizeProductionEventData(data: {
  id?: string;
  name?: string;
  production_type?: string;
  status?: string;
  starts_at?: string | null;
}) {
  if (!data.id || !data.name || !data.production_type || !data.status) return null;

  return {
    id: data.id,
    name: data.name,
    production_type: data.production_type,
    status: data.status,
    starts_at: data.starts_at ?? null,
  };
}

export async function createProduction(_previousState: ProductionActionState, formData: FormData): Promise<ProductionActionState> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };

  const parsed = validateProductionForm(formData);
  if ('error' in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;

  const { data, error } = await supabase
    .from('productions')
    .insert({ ...parsed.values, status: 'draft', responsible_user_id: userId, created_by: userId })
    .select('id, name, production_type, status, starts_at')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.code === '23505' ? 'Já existe uma produção com esse slug.' : 'Não foi possível criar a produção.' };
  }

  const eventData = normalizeProductionEventData(data);
  const integrationResult = eventData
    ? await enqueueProductionEvent(supabase, 'casting.production.created', eventData)
    : { error: new Error('Dados obrigatórios da produção ausentes para integração.') };
  const integrationError = integrationResult.error;

  revalidatePath('/admin/producoes');
  revalidatePath(`/admin/producoes/${data.id}`);
  redirect(`/admin/producoes/${data.id}?created=1${integrationError ? '&integration=warning' : '&integration=queued'}`);
}

export async function updateProduction(productionId: string, _previousState: ProductionActionState, formData: FormData): Promise<ProductionActionState> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };

  const parsed = validateProductionForm(formData);
  if ('error' in parsed) return { ok: false, error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productions')
    .update(parsed.values)
    .eq('id', productionId)
    .select('id, name, production_type, status, starts_at')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.code === '23505' ? 'Já existe uma produção com esse slug.' : 'Não foi possível salvar as alterações.' };
  }

  const eventData = normalizeProductionEventData(data);
  const integrationResult = eventData
    ? await enqueueProductionEvent(supabase, 'casting.production.updated', eventData)
    : { error: new Error('Dados obrigatórios da produção ausentes para integração.') };
  const integrationError = integrationResult.error;

  revalidatePath('/admin/producoes');
  revalidatePath(`/admin/producoes/${productionId}`);
  redirect(`/admin/producoes/${productionId}?updated=1&integration=${integrationError ? 'warning' : 'queued'}`);
}

export async function changeProductionStatus(productionId: string, formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) redirect(`/admin/producoes/${productionId}?status_error=unauthorized`);

  const targetStatus = String(formData.get('target_status') ?? '') as ProductionStatus;
  if (!PRODUCTION_STATUSES.includes(targetStatus)) redirect(`/admin/producoes/${productionId}?status_error=invalid`);

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from('productions')
    .select('id, status')
    .eq('id', productionId)
    .single();

  if (currentError || !current) redirect(`/admin/producoes/${productionId}?status_error=load`);

  const currentStatus = current.status as ProductionStatus;
  if (!STATUS_TRANSITIONS[currentStatus]?.includes(targetStatus)) redirect(`/admin/producoes/${productionId}?status_error=transition`);

  const archivedAt = targetStatus === 'archived' ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from('productions')
    .update({ status: targetStatus, archived_at: archivedAt })
    .eq('id', productionId)
    .select('id, name, production_type, status, starts_at')
    .single();

  if (error || !data) redirect(`/admin/producoes/${productionId}?status_error=save`);

  const eventType = targetStatus === 'archived' ? 'casting.production.archived' : 'casting.production.status_changed';
  const eventData = normalizeProductionEventData(data);
  const integrationResult = eventData
    ? await enqueueProductionEvent(supabase, eventType, eventData, {
        previous_status: currentStatus,
        current_status: targetStatus,
      })
    : { error: new Error('Dados obrigatórios da produção ausentes para integração.') };
  const integrationError = integrationResult.error;

  revalidatePath('/admin/producoes');
  revalidatePath(`/admin/producoes/${productionId}`);
  redirect(`/admin/producoes/${productionId}?status_changed=1&integration=${integrationError ? 'warning' : 'queued'}`);
}

export async function archiveProduction(productionId: string) {
  const formData = new FormData();
  formData.set('target_status', 'archived');
  return changeProductionStatus(productionId, formData);
}
