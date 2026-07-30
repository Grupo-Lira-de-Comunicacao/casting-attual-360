'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type TelegramLinkCardProps = {
  talentId: string;
  talentName: string;
};

type LinkTokenResponse = {
  ok: boolean;
  code?: string;
  command?: string;
  expires_at?: string;
  error?: string;
};

export function TelegramLinkCard({ talentId, talentName }: TelegramLinkCardProps) {
  const [loading, setLoading] = useState(false);
  const [command, setCommand] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateCode() {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Sua sessão expirou. Entre novamente no painel.');
        return;
      }

      const response = await fetch('/api/admin/telegram/link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ talent_id: talentId }),
      });

      const result = (await response.json()) as LinkTokenResponse;
      if (!response.ok || !result.ok || !result.command || !result.expires_at) {
        setError(result.error || 'Não foi possível gerar o código de vínculo.');
        return;
      }

      setCommand(result.command);
      setExpiresAt(result.expires_at);
    } catch {
      setError('Falha de comunicação ao gerar o código.');
    } finally {
      setLoading(false);
    }
  }

  async function copyCommand() {
    if (!command) return;

    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setError('Não foi possível copiar automaticamente. Selecione o comando manualmente.');
    }
  }

  const expirationLabel = expiresAt
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(expiresAt))
    : null;

  return (
    <section className="rounded-[28px] border border-sky-200 bg-sky-50 p-6 text-navy shadow-soft sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue">Telegram</p>
      <h2 className="mt-3 text-2xl font-black">Vincular conta de {talentName}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Gere um código temporário e envie somente ao talento. Ele deverá abrir o bot do Casting Attual 360 e usar o comando exibido abaixo.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generateCode}
          disabled={loading}
          className="rounded-full bg-blue px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Gerando…' : command ? 'Gerar novo código' : 'Gerar código Telegram'}
        </button>
        <span className="text-sm text-slate-500">O código expira em 15 minutos e só pode ser usado uma vez.</span>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-800">{error}</p>
      )}

      {command && (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-500">Comando para enviar ao talento</p>
          <code className="mt-2 block break-all rounded-xl bg-slate-950 px-4 py-3 text-lg font-bold text-white">{command}</code>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copyCommand}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-navy transition hover:bg-slate-50"
            >
              {copied ? 'Copiado' : 'Copiar comando'}
            </button>
            {expirationLabel && <span className="text-sm font-semibold text-slate-600">Válido até {expirationLabel}</span>}
          </div>
        </div>
      )}
    </section>
  );
}
