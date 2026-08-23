const SUPABASE_URL = 'https://bkohxylyxsykuwmmvnzz.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_gqF_5xaaUvB6KWhcvtCl-w_R41q5iRO';

export function getSupabaseBrowserEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;

  // The project was restored on 2026-08-23 and its modern publishable key changed.
  // Keep the current public key in code so stale Vercel environment values cannot
  // silently force the public catalogue into DEMO fallback. Supabase publishable
  // keys are intentionally safe to expose to browser clients; RLS remains the
  // authorization boundary.
  const configuredKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const publishableKey = url === SUPABASE_URL ? SUPABASE_PUBLISHABLE_KEY : configuredKey;

  if (!url || !publishableKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }

  return { url, publishableKey };
}
