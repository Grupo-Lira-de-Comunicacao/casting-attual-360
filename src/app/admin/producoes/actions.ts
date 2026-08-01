'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { PRODUCTION_TYPES } from '@/lib/productions/types';

export type ProductionActionState = { ok: true; message?: string } | { ok: false; error: string };

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

export async function createProduction(_previousState: ProductionActionState, formData: FormData): Promise<ProductionActionState> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };

  const name = String(formData.get('name') ?? '').trim();
  const productionType = String(formData.get('production_type') ?? 'other');
  if (name.length < 2 || name.length > 160) return { ok: false, error: 'Informe um nome de produção entre 2 e 160 caracteres.' };
  if (!PRODUCTION_TYPES.includes(productionType as (typeof PRODUCTION_TYPES)[number])) return { ok: false, error: 'Tipo de produção inválido.' };

  const startsAt = text(formData, 'starts_at');
  const endsAt = text(formData, 'ends_at');
  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) return { ok: false, error: 'A data final não pode ser anterior à data inicial.' };

  const budgetRaw = text(formData, 'budget_casting');
  const budget = budgetRaw ? Number(budgetRaw.replace(',', '.')) : null;
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) return { ok: false, error: 'Informe um orçamento de casting válido.' };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id ?? null;
  const customSlug = text(formData, 'slug');
  const slug = slugify(customSlug || name);

  const { data, error } = await supabase
    .from('productions')
    .insert({
      name,
      slug: slug || null,
      description: text(formData, 'description'),
      production_type: productionType,
      client_name: text(formData, 'client_name'),
      project_reference: text(formData, 'project_reference'),
      status: 'draft',
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      city: text(formData, 'city'),
      state: text(formData, 'state')?.toUpperCase() ?? null,
      venue: text(formData, 'venue'),
      address: text(formData, 'address'),
      is_remote: formData.get('is_remote') === 'on',
      responsible_user_id: userId,
      budget_casting: budget,
      currency: 'BRL',
      notes: text(formData, 'notes'),
      created_by: userId,
    })
    .select('id, name, production_type, status, starts_at')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.code === '23505' ? 'Já existe uma produção com esse slug.' : 'Não foi possível criar a produção.' };
  }

  const { error: integrationError } = await supabase.from('integration_events').insert({
    event_type: 'casting.production.created',
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: data.id,
    payload: {
      production_id: data.id,
      name: data.name,
      type: data.production_type,
      status: data.status,
      starts_at: data.starts_at,
    },
  });

  revalidatePath('/admin/producoes');
  revalidatePath(`/admin/producoes/${data.id}`);
  redirect(`/admin/producoes/${data.id}?created=1${integrationError ? '&integration=warning' : '&integration=queued'}`);
}
