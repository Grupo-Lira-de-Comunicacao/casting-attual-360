'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { parseTalentInput, photoExtension, validatePhoto, validateTalentInput } from '@/lib/talents/validation';
import type { TalentActionState, TalentInput } from '@/types/talent';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function databasePayload(input: TalentInput) {
  return {
    slug: input.slug,
    nome: input.nome,
    nome_artistico: input.nome_artistico || null,
    categoria: input.categoria,
    subcategorias: input.subcategorias,
    cidade: input.cidade,
    estado: input.estado,
    biografia: input.biografia,
    habilidades: input.habilidades,
    foto_url: input.foto_url || null,
    instagram: input.instagram || null,
    telefone: input.telefone || null,
    email: input.email || null,
    destaque: input.destaque,
    ativo: input.ativo,
    ordem: input.ordem,
  };
}

async function uploadPhoto(talentId: string, file: File) {
  if (file.size === 0) return { path: null, error: null };

  const validationError = validatePhoto(file);
  if (validationError) return { path: null, error: validationError };

  const extension = photoExtension(file);
  if (!extension) return { path: null, error: 'Formato de foto não reconhecido.' };

  const path = `${talentId}/${randomUUID()}.${extension}`;
  const fileBytes = await file.arrayBuffer();
  const supabase = await createClient();
  const { error } = await supabase.storage.from('talent-photos').upload(path, fileBytes, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });

  if (error) return { path: null, error: `Falha no upload da foto: ${error.message}` };
  return { path, error: null };
}

function revalidateTalentPages(slug?: string, previousSlug?: string) {
  revalidatePath('/');
  revalidatePath('/talentos');
  revalidatePath('/admin');
  revalidatePath('/admin/talentos');
  if (slug) revalidatePath(`/talentos/${slug}`);
  if (previousSlug && previousSlug !== slug) revalidatePath(`/talentos/${previousSlug}`);
}

export async function createTalent(
  _previousState: TalentActionState,
  formData: FormData,
): Promise<TalentActionState> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };

  const input = parseTalentInput(formData);
  const validationError = validateTalentInput(input);
  if (validationError) return { ok: false, error: validationError };

  const file = formData.get('foto');
  if (file instanceof File) {
    const photoError = validatePhoto(file);
    if (photoError) return { ok: false, error: photoError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('talents')
    .insert(databasePayload(input))
    .select('id, slug')
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.code === '23505' ? 'Já existe um talento com esse slug.' : 'Não foi possível criar o talento.',
    };
  }

  if (file instanceof File && file.size > 0) {
    const upload = await uploadPhoto(data.id, file);
    if (upload.error) return { ok: false, error: upload.error };
    if (upload.path) {
      const { error: photoUpdateError } = await supabase
        .from('talents')
        .update({ foto_path: upload.path, foto_url: null })
        .eq('id', data.id);
      if (photoUpdateError) return { ok: false, error: `A foto foi enviada, mas não pôde ser associada ao perfil: ${photoUpdateError.message}` };
    }
  }

  revalidateTalentPages(data.slug);
  redirect(`/admin/talentos/${data.id}/editar?saved=created`);
}

export async function updateTalent(
  _previousState: TalentActionState,
  formData: FormData,
): Promise<TalentActionState> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };

  const id = String(formData.get('id') ?? '');
  const originalSlug = String(formData.get('original_slug') ?? '');
  if (!uuidPattern.test(id)) return { ok: false, error: 'Talento inválido.' };

  const input = parseTalentInput(formData);
  const validationError = validateTalentInput(input);
  if (validationError) return { ok: false, error: validationError };
  if (input.slug !== originalSlug && formData.get('confirm_slug_change') !== 'on') {
    return { ok: false, error: 'Confirme explicitamente a alteração do slug antes de salvar.' };
  }

  const file = formData.get('foto');
  if (file instanceof File) {
    const photoError = validatePhoto(file);
    if (photoError) return { ok: false, error: photoError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('talents')
    .update(databasePayload(input))
    .eq('id', id)
    .select('id, slug')
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: error?.code === '23505' ? 'Já existe outro talento com esse slug.' : 'Não foi possível salvar o talento.',
    };
  }

  if (file instanceof File && file.size > 0) {
    const upload = await uploadPhoto(id, file);
    if (upload.error) return { ok: false, error: upload.error };
    if (upload.path) {
      const { error: photoUpdateError } = await supabase
        .from('talents')
        .update({ foto_path: upload.path, foto_url: null })
        .eq('id', id);
      if (photoUpdateError) return { ok: false, error: `A foto foi enviada, mas não pôde ser associada ao perfil: ${photoUpdateError.message}` };
    }
  }

  revalidatePath(`/admin/talentos/${id}/editar`);
  revalidateTalentPages(data.slug, originalSlug);
  redirect(`/admin/talentos/${id}/editar?saved=updated`);
}

export async function setTalentActive(formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) redirect('/admin/talentos?error=unauthorized');

  const id = String(formData.get('id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  const active = String(formData.get('active') ?? '') === 'true';
  if (!uuidPattern.test(id)) redirect('/admin/talentos?error=invalid');

  const supabase = await createClient();
  const { error } = await supabase.from('talents').update({ ativo: active }).eq('id', id);
  if (error) redirect('/admin/talentos?error=save');

  revalidateTalentPages(slug);
  redirect(`/admin/talentos?status=${active ? 'activated' : 'deactivated'}`);
}
