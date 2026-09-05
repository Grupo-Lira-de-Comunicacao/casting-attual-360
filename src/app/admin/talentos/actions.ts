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
    especialidades: input.especialidades,
    habilidades: input.habilidades,
    idiomas: input.idiomas,
    disponibilidades: input.disponibilidades,
    cidade: input.cidade,
    estado: input.estado,
    biografia: input.biografia,
    foto_url: input.foto_url || null,
    instagram: input.instagram || null,
    telefone: input.telefone || null,
    email: input.email || null,
    destaque_texto: input.destaque_texto || null,
    destaque: input.destaque,
    ativo: input.ativo,
    ordem: input.ordem,
  };
}

async function uploadPhoto(talentId: string, file: File, folder?: string) {
  if (file.size === 0) return { path: null, error: null };
  const validationError = validatePhoto(file);
  if (validationError) return { path: null, error: validationError };
  const extension = photoExtension(file);
  if (!extension) return { path: null, error: 'Formato de foto não reconhecido.' };
  const base = folder ? `${talentId}/${folder}` : talentId;
  const path = `${base}/${randomUUID()}.${extension}`;
  const fileBytes = await file.arrayBuffer();
  const supabase = await createClient();
  const { error } = await supabase.storage.from('talent-photos').upload(path, fileBytes, {
    cacheControl: '3600', contentType: file.type, upsert: false,
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

function mediaRedirect(id: string, key: 'media' | 'media_error', value: string): never {
  redirect(`/admin/talentos/${id}/editar?${key}=${encodeURIComponent(value)}`);
}

function videoUrlError(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return 'O vídeo precisa usar um endereço HTTPS.';
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    const youtube = host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be';
    const vimeo = host === 'vimeo.com' || host === 'player.vimeo.com';
    const direct = /\.(mp4|webm|ogg)$/i.test(url.pathname);
    if (!youtube && !vimeo && !direct) return 'Use um link do YouTube, Vimeo ou um arquivo MP4/WebM/OGG com HTTPS.';
    return null;
  } catch {
    return 'Informe um link de vídeo válido.';
  }
}

async function nextMediaOrder(talentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('talent_media')
    .select('sort_order')
    .eq('talent_id', talentId)
    .eq('active', true)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return Math.min(Number(data?.sort_order ?? 0) + 10, 9999);
}

export async function createTalent(_previousState: TalentActionState, formData: FormData): Promise<TalentActionState> {
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
  const { data, error } = await supabase.from('talents').insert(databasePayload(input)).select('id, slug').single();
  if (error || !data) return { ok: false, error: error?.code === '23505' ? 'Já existe um talento com esse slug.' : 'Não foi possível criar o talento.' };
  if (file instanceof File && file.size > 0) {
    const upload = await uploadPhoto(data.id, file);
    if (upload.error) return { ok: false, error: upload.error };
    if (upload.path) {
      const { error: photoUpdateError } = await supabase.from('talents').update({ foto_path: upload.path, foto_url: null }).eq('id', data.id);
      if (photoUpdateError) return { ok: false, error: `A foto foi enviada, mas não pôde ser associada ao perfil: ${photoUpdateError.message}` };
    }
  }
  revalidateTalentPages(data.slug);
  redirect(`/admin/talentos/${data.id}/editar?saved=created`);
}

export async function updateTalent(_previousState: TalentActionState, formData: FormData): Promise<TalentActionState> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };
  const id = String(formData.get('id') ?? '');
  const originalSlug = String(formData.get('original_slug') ?? '');
  if (!uuidPattern.test(id)) return { ok: false, error: 'Talento inválido.' };
  const input = parseTalentInput(formData);
  const validationError = validateTalentInput(input);
  if (validationError) return { ok: false, error: validationError };
  if (input.slug !== originalSlug && formData.get('confirm_slug_change') !== 'on') return { ok: false, error: 'Confirme explicitamente a alteração do slug antes de salvar.' };
  const file = formData.get('foto');
  if (file instanceof File) {
    const photoError = validatePhoto(file);
    if (photoError) return { ok: false, error: photoError };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from('talents').update(databasePayload(input)).eq('id', id).select('id, slug').single();
  if (error || !data) return { ok: false, error: error?.code === '23505' ? 'Já existe outro talento com esse slug.' : 'Não foi possível salvar o talento.' };
  if (file instanceof File && file.size > 0) {
    const upload = await uploadPhoto(id, file);
    if (upload.error) return { ok: false, error: upload.error };
    if (upload.path) {
      const { error: photoUpdateError } = await supabase.from('talents').update({ foto_path: upload.path, foto_url: null }).eq('id', id);
      if (photoUpdateError) return { ok: false, error: `A foto foi enviada, mas não pôde ser associada ao perfil: ${photoUpdateError.message}` };
    }
  }
  revalidatePath(`/admin/talentos/${id}/editar`);
  revalidateTalentPages(data.slug, originalSlug);
  redirect(`/admin/talentos/${id}/editar?saved=updated`);
}

export async function addTalentPhotos(formData: FormData) {
  const authorization = await requireAdminAction();
  const id = String(formData.get('talent_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!authorization.ok) mediaRedirect(id, 'media_error', authorization.error);
  if (!uuidPattern.test(id)) mediaRedirect(id, 'media_error', 'Talento inválido.');

  const files = formData
    .getAll('gallery_photos')
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length === 0) mediaRedirect(id, 'media_error', 'Selecione pelo menos uma foto.');
  if (files.length > 8) mediaRedirect(id, 'media_error', 'Envie no máximo 8 fotos por vez.');
  for (const file of files) {
    const error = validatePhoto(file);
    if (error) mediaRedirect(id, 'media_error', error);
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from('talent_media')
    .select('id', { count: 'exact', head: true })
    .eq('talent_id', id)
    .eq('kind', 'photo')
    .eq('active', true);
  if ((count ?? 0) + files.length > 12) mediaRedirect(id, 'media_error', 'O perfil pode ter até 12 fotos adicionais.');

  let sortOrder = await nextMediaOrder(id);
  for (const file of files) {
    const upload = await uploadPhoto(id, file, 'gallery');
    if (upload.error || !upload.path) mediaRedirect(id, 'media_error', upload.error ?? 'Não foi possível enviar a foto.');
    const { error } = await supabase.from('talent_media').insert({
      talent_id: id,
      kind: 'photo',
      storage_path: upload.path,
      external_url: null,
      title: null,
      sort_order: sortOrder,
      active: true,
    });
    if (error) mediaRedirect(id, 'media_error', `A foto foi enviada, mas não pôde ser adicionada à galeria: ${error.message}`);
    sortOrder = Math.min(sortOrder + 10, 9999);
  }

  revalidatePath(`/admin/talentos/${id}/editar`);
  revalidateTalentPages(slug);
  mediaRedirect(id, 'media', files.length === 1 ? 'photo_added' : 'photos_added');
}

export async function addTalentVideo(formData: FormData) {
  const authorization = await requireAdminAction();
  const id = String(formData.get('talent_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!authorization.ok) mediaRedirect(id, 'media_error', authorization.error);
  if (!uuidPattern.test(id)) mediaRedirect(id, 'media_error', 'Talento inválido.');

  const externalUrl = String(formData.get('video_url') ?? '').trim();
  const title = String(formData.get('video_title') ?? '').trim();
  if (title.length > 160) mediaRedirect(id, 'media_error', 'O título do vídeo deve ter até 160 caracteres.');
  const urlError = videoUrlError(externalUrl);
  if (urlError) mediaRedirect(id, 'media_error', urlError);

  const supabase = await createClient();
  const { count } = await supabase
    .from('talent_media')
    .select('id', { count: 'exact', head: true })
    .eq('talent_id', id)
    .eq('kind', 'video')
    .eq('active', true);
  if ((count ?? 0) >= 6) mediaRedirect(id, 'media_error', 'O perfil pode ter até 6 vídeos.');

  const { error } = await supabase.from('talent_media').insert({
    talent_id: id,
    kind: 'video',
    storage_path: null,
    external_url: externalUrl,
    title: title || null,
    sort_order: await nextMediaOrder(id),
    active: true,
  });
  if (error) mediaRedirect(id, 'media_error', `Não foi possível adicionar o vídeo: ${error.message}`);

  revalidatePath(`/admin/talentos/${id}/editar`);
  revalidateTalentPages(slug);
  mediaRedirect(id, 'media', 'video_added');
}

export async function removeTalentMedia(formData: FormData) {
  const authorization = await requireAdminAction();
  const id = String(formData.get('talent_id') ?? '');
  const mediaId = String(formData.get('media_id') ?? '');
  const slug = String(formData.get('slug') ?? '');
  if (!authorization.ok) mediaRedirect(id, 'media_error', authorization.error);
  if (!uuidPattern.test(id) || !uuidPattern.test(mediaId)) mediaRedirect(id, 'media_error', 'Mídia inválida.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('talent_media')
    .update({ active: false })
    .eq('id', mediaId)
    .eq('talent_id', id);
  if (error) mediaRedirect(id, 'media_error', `Não foi possível remover a mídia do perfil: ${error.message}`);

  revalidatePath(`/admin/talentos/${id}/editar`);
  revalidateTalentPages(slug);
  mediaRedirect(id, 'media', 'removed');
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
