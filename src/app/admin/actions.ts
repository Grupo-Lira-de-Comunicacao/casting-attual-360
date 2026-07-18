'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { RequestStatus } from '@/types/request';

const allowedStatuses: RequestStatus[] = ['novo', 'em_analise', 'contatado', 'arquivado'];

type UpdateRequestStatusResult =
  | { ok: true; status: RequestStatus }
  | { ok: false; error: string };

export async function updateRequestStatus(
  requestId: number,
  status: RequestStatus,
): Promise<UpdateRequestStatusResult> {
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return { ok: false, error: 'Solicitação inválida.' };
  }

  if (!allowedStatuses.includes(status)) {
    return { ok: false, error: 'Status inválido.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Sua sessão expirou. Entre novamente.' };
  }

  const { data, error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId)
    .select('status')
    .single();

  if (error) {
    return { ok: false, error: 'Não foi possível atualizar o status.' };
  }

  revalidatePath('/admin');

  return { ok: true, status: data.status as RequestStatus };
}
