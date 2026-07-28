'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAction } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import type { RequestAdminUpdate, RequestRecord, RequestStatus, RequestType } from '@/types/request';

const allowedStatuses: RequestStatus[] = ['novo', 'em_analise', 'contatado', 'arquivado'];
const allowedTypes: RequestType[] = ['empresa', 'talento'];

type UpdateResult =
  | { ok: true; request: RequestRecord }
  | { ok: false; error: string };

function normalizeInput(input: RequestAdminUpdate): RequestAdminUpdate {
  return {
    request_type: input.request_type,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    organization: input.organization.trim(),
    status: input.status,
    assigned_to: input.assigned_to.trim(),
    internal_notes: input.internal_notes.trim(),
  };
}

function validateInput(input: RequestAdminUpdate): string | null {
  if (!allowedTypes.includes(input.request_type)) return 'Tipo inválido.';
  if (!allowedStatuses.includes(input.status)) return 'Status inválido.';
  if (input.name.length < 2 || input.name.length > 120) return 'Informe um nome entre 2 e 120 caracteres.';
  if (input.email.length > 180 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return 'Informe um e-mail válido com até 180 caracteres.';
  if (input.organization.length < 2 || input.organization.length > 180) return 'Empresa ou identificação deve ter entre 2 e 180 caracteres.';
  if (input.assigned_to.length > 120) return 'Responsável deve ter até 120 caracteres.';
  if (input.internal_notes.length > 2000) return 'Observações internas devem ter até 2.000 caracteres.';
  return null;
}

export async function updateRequestAdminFields(
  requestId: number,
  rawInput: RequestAdminUpdate,
): Promise<UpdateResult> {
  const authorization = await requireAdminAction();
  if (!authorization.ok) return { ok: false, error: authorization.error };

  if (!Number.isInteger(requestId) || requestId <= 0) return { ok: false, error: 'Solicitação inválida.' };

  const input = normalizeInput(rawInput);
  const validationError = validateInput(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('requests')
    .update(input)
    .eq('id', requestId)
    .select('id, created_at, updated_at, request_type, name, email, organization, message, status, is_test, assigned_to, internal_notes')
    .single();

  if (error) return { ok: false, error: 'Não foi possível salvar as alterações.' };

  revalidatePath('/admin');
  return { ok: true, request: data as RequestRecord };
}
