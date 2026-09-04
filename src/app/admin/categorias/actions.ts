'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdminAction } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseAliases(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function parseCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const aliases = parseAliases(formData.get('aliases'));
  const order = Number.parseInt(String(formData.get('order') ?? '0'), 10);
  const active = formData.get('active') === 'on';

  if (name.length < 2 || name.length > 80) return { error: 'O nome deve ter entre 2 e 80 caracteres.' } as const;
  if (!Number.isInteger(order) || order < 0 || order > 9999) return { error: 'A ordem deve ser um número entre 0 e 9999.' } as const;
  if (aliases.some((item) => item.length > 80)) return { error: 'Cada termo associado deve ter até 80 caracteres.' } as const;

  const slug = slugify(name);
  if (!slug) return { error: 'Não foi possível gerar um identificador para a categoria.' } as const;

  return { value: { name, slug, aliases, order, active } } as const;
}

function goWithMessage(kind: 'ok' | 'error', message: string): never {
  redirect(`/admin/categorias?${kind}=${encodeURIComponent(message)}`);
}

export async function createProfessionalCategory(formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) goWithMessage('error', authorization.error);

  const parsed = parseCategory(formData);
  if ('error' in parsed) goWithMessage('error', parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from('professional_categories').insert({
    nome: parsed.value.name,
    slug: parsed.value.slug,
    aliases: parsed.value.aliases,
    ordem: parsed.value.order,
    ativo: parsed.value.active,
  });

  if (error) {
    const duplicate = error.code === '23505';
    goWithMessage('error', duplicate ? 'Já existe uma categoria com esse nome.' : 'Não foi possível criar a categoria.');
  }

  revalidatePath('/admin/categorias');
  revalidatePath('/talentos');
  goWithMessage('ok', 'Categoria criada com sucesso.');
}

export async function updateProfessionalCategory(formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) goWithMessage('error', authorization.error);

  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) goWithMessage('error', 'Categoria inválida.');

  const parsed = parseCategory(formData);
  if ('error' in parsed) goWithMessage('error', parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from('professional_categories')
    .update({
      nome: parsed.value.name,
      slug: parsed.value.slug,
      aliases: parsed.value.aliases,
      ordem: parsed.value.order,
      ativo: parsed.value.active,
    })
    .eq('id', id);

  if (error) {
    const duplicate = error.code === '23505';
    goWithMessage('error', duplicate ? 'Já existe uma categoria com esse nome.' : 'Não foi possível salvar a categoria.');
  }

  revalidatePath('/admin/categorias');
  revalidatePath('/talentos');
  goWithMessage('ok', 'Categoria atualizada.');
}

export async function deleteProfessionalCategory(formData: FormData) {
  const authorization = await requireAdminAction();
  if (!authorization.ok) goWithMessage('error', authorization.error);

  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) goWithMessage('error', 'Categoria inválida.');

  const supabase = await createClient();
  const { error } = await supabase.from('professional_categories').delete().eq('id', id);

  if (error) goWithMessage('error', 'Não foi possível excluir a categoria.');

  revalidatePath('/admin/categorias');
  revalidatePath('/talentos');
  goWithMessage('ok', 'Categoria excluída. Os talentos não foram apagados.');
}
