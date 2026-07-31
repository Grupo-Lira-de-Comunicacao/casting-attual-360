'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type IntegrationAttempt = {
  id: string;
  attempt_number: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  http_status: number | null;
  error_message: string | null;
  response_payload: string | null;
  duration_ms: number | null;
};

type AttemptsResponse = {
  ok: boolean;
  attempts?: IntegrationAttempt[];
  error?: string;
};

const STATUS_LABELS: Record<string, string> = {
  processando: 'Processando',
  processado: 'Processada',
  falhou: 'Falhou',
  interrompido: 'Interrompida',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function formatDuration(value: number | null) {
  if (value === null) return 'Sem duração registrada';
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function IntegrationEventAttempts({ eventId }: { eventId: string }) {
  const [attempts, setAttempts] = useState<IntegrationAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAttempts() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente no painel.');

        const response = await fetch(`/api/admin/integrations/events/${eventId}/attempts`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        const result = (await response.json()) as AttemptsResponse;
        if (!response.ok || !result.ok) throw new Error(result.error || 'Não foi possível carregar as tentativas.');

        if (!cancelled) setAttempts(result.attempts ?? []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Falha ao carregar o histórico.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAttempts();
    return () => { cancelled = true; };
  }, [eventId]);

  const summary = useMemo(() => {
    const completed = attempts.filter((attempt) => attempt.status === 'processado');
    const durations = attempts
      .map((attempt) => attempt.duration_ms)
      .filter((value): value is number => value !== null);

    return {
      total: attempts.length,
      successes: completed.length,
      failures: attempts.filter((attempt) => attempt.status === 'falhou').length,
      averageDuration: durations.length
        ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
        : null,
    };
  }, [attempts]);

  return (
    <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-300">Linha do tempo técnica</p>
          <p className="mt-1 text-sm text-white/60">Histórico preservado de cada tentativa de entrega.</p>
        </div>
        {!loading && !error && (
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="rounded-full bg-white/10 px-3 py-1">{summary.total} tentativa(s)</span>
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">{summary.successes} sucesso(s)</span>
            <span className="rounded-full bg-red-400/15 px-3 py-1 text-red-200">{summary.failures} falha(s)</span>
            <span className="rounded-full bg-white/10 px-3 py-1">média {formatDuration(summary.averageDuration)}</span>
          </div>
        )}
      </div>

      {loading && <p className="mt-5 text-sm font-semibold text-white/60">Carregando histórico…</p>}
      {error && <p className="mt-5 rounded-xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-100">{error}</p>}
      {!loading && !error && attempts.length === 0 && (
        <p className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/60">Nenhuma tentativa registrada para este evento.</p>
      )}

      {!loading && !error && attempts.length > 0 && (
        <ol className="mt-6 space-y-4">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">Tentativa {attempt.attempt_number} · {STATUS_LABELS[attempt.status] ?? attempt.status}</p>
                  <p className="mt-1 text-xs text-white/50">Início: {formatDate(attempt.started_at)} · Fim: {formatDate(attempt.finished_at)}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white/10 px-3 py-1">{attempt.http_status ? `HTTP ${attempt.http_status}` : 'Sem HTTP'}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">{formatDuration(attempt.duration_ms)}</span>
                </div>
              </div>

              {attempt.error_message && (
                <p className="mt-4 rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-100"><strong>Erro:</strong> {attempt.error_message}</p>
              )}

              {attempt.response_payload && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-bold text-sky-300">Ver resposta resumida do ATTUAL ONE</summary>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-black/40 p-4 text-xs leading-6 text-sky-100">{attempt.response_payload}</pre>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
