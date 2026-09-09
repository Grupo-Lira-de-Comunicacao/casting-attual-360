import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith('/admin') || value.startsWith('/admin/login')) {
    return '/admin';
  }

  return value;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get('code');
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'));
  const supabase = await createClient();

  let error: unknown = null;

  if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error('Link de autenticação sem token ou código.');
  }

  if (!error) {
    return NextResponse.redirect(new URL(nextPath, request.url));
  }

  return NextResponse.redirect(new URL('/admin/login?reset=invalid-link', request.url));
}
