'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'splira@gmail.com';
const PASSWORD_RESET_REDIRECT = 'https://casting360.grupolira.com/auth/callback?next=/admin/redefinir-senha';

export function ResetPasswordButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleReset() {
    if (status === 'sending') return;

    setStatus('sending');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, {
      redirectTo: PASSWORD_RESET_REDIRECT,
    });

    setStatus(error ? 'error' : 'sent');
  }

  return (
    <div>
      <button
        className="font-bold text-blue transition hover:text-teal disabled:cursor-wait disabled:opacity-60"
        type="button"
        onClick={handleReset}
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Enviando...' : status === 'sent' ? 'Reenviar link de recuperação' : 'Esqueceu a senha?'}
      </button>

      {status === 'sent' && (
        <p className="mt-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Link enviado para {ADMIN_EMAIL}. Abra o e-mail mais recente neste navegador para redefinir sua senha.
        </p>
      )}

      {status === 'error' && (
        <p className="mt-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Não foi possível enviar o link agora. Aguarde alguns instantes e tente novamente.
        </p>
      )}
    </div>
  );
}
