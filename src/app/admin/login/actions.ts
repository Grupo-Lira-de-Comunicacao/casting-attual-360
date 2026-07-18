'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function getSafeNextPath(value: FormDataEntryValue | null) {
  const nextPath = String(value ?? '/admin');

  if (!nextPath.startsWith('/admin') || nextPath.startsWith('/admin/login')) {
    return '/admin';
  }

  return nextPath;
}

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = getSafeNextPath(formData.get('next'));

  if (!email || !password) {
    redirect('/admin/login?error=missing');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect('/admin/login?error=invalid');
  }

  redirect(nextPath);
}
