'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type ResilienceMetrics = {
  totals: {
    dead_letters: number;
    dead_letters_reprocessed: number;
  };
  backlog: {
    events: number;
    oldest_at: string | null;
    oldest_age_seconds: number;
    sla_seconds: number;
    within_sla: boolean;
  };
  performance: {
    p50_delivery_ms: number | null;
    p95_delivery_ms: number | null;
    p99_delivery_ms: number | null;
  };
  http: {
    auth_failures_401_403: number;
    rate_limited_429: number;
    server_failures_5xx: number;
  };
  circuit: {
    state: 'closed' | 'open' | 'half_open';
    consecutive_failures: number;
    opened_at: string | null;
    retry_after_at: string | null;
  };
};

type MetricsResponse = {
  ok: boolean;
  metrics?: ResilienceMetrics;
  error?: string;
};

function duration(ms: number | null) {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function seconds(value: number) {
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const remainder = value % 60;
  return `${minutes}m ${remainder}s`;
}

export function IntegrationResilienceStatus() {
  const [metrics, setMetrics] = useState<ResilienceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sessão administrativa expirada.');

      const response = await fetch('/api/admin/integrations/metrics?window_hours=24', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const result = await response.json() as MetricsResponse;
      if (!response.ok || !result.ok || !result.metrics) {
        throw new Error(result.error || 'Não foi possível carregar a resiliência.');
      }
      setMetrics(result.metrics);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar resiliência.');
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!metrics) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft">
        <p className="font-bold text-slate-600">{error || 'Carregando indicadores de resiliência…'}</p>
      </section>
    );
  }

  const alerts: string[] = [];
  if (metrics.totals.dead_letters > 0) alerts.push(`${metrics.totals.dead_letters} evento(s) em dead-letter aguardando tratamento.`);
  if (!metrics.backlog.within_sla) alerts.push(`Evento mais antigo da fila está com ${seconds(metrics.backlog.oldest_age_seconds)}, acima do SLA de ${seconds(metrics.backlog.sla_seconds)}.`);
  if (metrics.circuit.state !== 'closed') alerts.push(`Circuit breaker está ${metrics.circuit.state === 'open' ? 'aberto' : 'em half-open'}.`);
  if (metrics.http.auth_failures_401_403 > 0) alerts.push(`${metrics.http.auth_failures_401_403} falha(s) 401/403 nas últimas 24h.`);

  return (
    <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue">Resiliência operacional</p>
          <h2 className="mt-1 text-2xl font-black text-navy">SLA, fila e proteção do ATTUAL ONE</h2>
        </div>
        <button type="button" onClick={() => void load()} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black text-navy">Atualizar</button>
      </div>

      {alerts.length > 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950">
          <p className="text-xs font-black uppercase tracking-[0.18em]">Ação necessária</p>
          <ul className="mt-2 space-y-1 text-sm font-semibold">
            {alerts.map((alert) => <li key={alert}>• {alert}</li>)}
          </ul>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
          <p className="font-black">Resiliência dentro dos limites configurados.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Backlog</p><p className="mt-1 text-2xl font-black text-navy">{metrics.backlog.events}</p><p className="text-xs text-slate-500">mais antigo: {seconds(metrics.backlog.oldest_age_seconds)}</p></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Dead-letter</p><p className="mt-1 text-2xl font-black text-navy">{metrics.totals.dead_letters}</p><p className="text-xs text-slate-500">reprocessados: {metrics.totals.dead_letters_reprocessed}</p></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Circuit breaker</p><p className="mt-1 text-2xl font-black text-navy">{metrics.circuit.state}</p><p className="text-xs text-slate-500">falhas: {metrics.circuit.consecutive_failures}</p></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Latência p95</p><p className="mt-1 text-2xl font-black text-navy">{duration(metrics.performance.p95_delivery_ms)}</p><p className="text-xs text-slate-500">p50: {duration(metrics.performance.p50_delivery_ms)}</p></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500">Latência p99</p><p className="mt-1 text-2xl font-black text-navy">{duration(metrics.performance.p99_delivery_ms)}</p><p className="text-xs text-slate-500">429: {metrics.http.rate_limited_429} · 5xx: {metrics.http.server_failures_5xx}</p></div>
      </div>
    </section>
  );
}
