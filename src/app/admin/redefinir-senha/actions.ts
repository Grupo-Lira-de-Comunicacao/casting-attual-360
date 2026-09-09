'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'splira@gmail.com';

function isStrongEnough(password: string) {
  return password.length >= 10;
}

export async function updateAdminPassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!password || !confirmPassword) {
    redirect('/admin/redefinir-senha?error=missing');
  }

  if (password !== confirmPassword) {
    redirect('/admin/redefinir-senha?error=mismatch');
  }

  if (!isStrongEnough(password)) {
    redirect('/admin/redefinir-senha?error=weak');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    redirect('/admin/login?reset=expired');
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect('/admin/redefinir-senha?error=update');
  }

  await supabase.auth.signOut();
  redirect('/admin/login?reset=changed');
}
