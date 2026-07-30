import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AdminAccess = {
  isAdmin: boolean;
  structureInstalled: boolean;
  userEmail: string;
};

export async function getAdminAccess(): Promise<AdminAccess | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return {
      isAdmin: false,
      structureInstalled: false,
      userEmail: user.email ?? 'usuário autenticado',
    };
  }

  return {
    isAdmin: Boolean(data),
    structureInstalled: true,
    userEmail: user.email ?? 'usuário autenticado',
  };
}

export async function requireAdminPage(nextPath: string) {
  const access = await getAdminAccess();
  if (!access) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return access;
}

export async function requireAdminAction() {
  const access = await getAdminAccess();
  if (!access) return { ok: false as const, error: 'Sua sessão expirou. Entre novamente.' };
  if (!access.structureInstalled) return { ok: false as const, error: 'A estrutura administrativa ainda não foi instalada.' };
  if (!access.isAdmin) return { ok: false as const, error: 'Sua conta não possui permissão administrativa.' };
  return { ok: true as const };
}

