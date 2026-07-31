'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Metrics = {
  generated_at: string;
  window_hours: number;
  stuck_minutes: number;
  totals: {
    all: number;
    pending: number;
    processing: number;
    processed: number;
    failed: number;
    cancelled: number;
    reprocessings: number;
  };
  window: {
    events: number;
    processed: number;
    failed: number;
    success_rate: number | null;
  };
  performance: {
    average_delivery_ms: number | null;
    average_attempt_ms: number | null;
    interrupted_attempts: number;
    stuck_events: number;
  };
  top_event_types: Array<{ event_type: string; total: number }>;
  recent_failures: Array<{
    id: string;
    event_key: string;
    event_type: string;
    target_system: string;
    tentativas: number;
    ultimo_erro: string | null;
    criado_em: string;
    atualizado_em: string;
  }>;
};

type MetricsResponse = { ok: boolean; metrics?: Metrics; error?: string };
type OperationalAlert = { severity: 'critical' | 'warning'; title: string; detail: string };

const PERIODS = [
  { label: '24 horas', hours: 24 },
  { label: '7 dias', hours: 168 },
  { label: '30 dias', hours: 720 },
];

const ALERT_LIMITS = {
  minimumSuccessRate: 90,
  pendingQueue: 10,
  failedEvents: 5,
};

function formatDuration(value: number | null) {
  if (value === null) return '—';
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

function healthLabel(metrics: Metrics) {
  const rate = metrics.window.success_rate;
  if (metrics.performance.stuck_events > 0) return { label: 'Atenção', detail: 'Há eventos travados' };
  if (rate === null) return { label: 'Sem movimento', detail: 'Nenhum evento finalizado no período' };
  if (rate >= 98) return { label: 'Excelente', detail: 'Integração operando normalmente' };
  if (rate >= 90) return { label: 'Estável', detail: 'Acompanhar falhas recentes' };
  return { label: 'Crítica', detail: 'Taxa de falha acima do aceitável' };
}

function getOperationalAlerts(metrics: Metrics): OperationalAlert[] {
  const alerts: OperationalAlert[] = [];

  if (metrics.performance.stuck_events > 0) {
    alerts.push({
      severity: 'critical',
      title: `${metrics.performance.stuck_events} evento(s) travado(s)`,
      detail: `Há eventos em processamento há mais de ${metrics.stuck_minutes} minutos. Verifique a central e reavalie o dispatcher.`,
    });
  }

  if (metrics.window.success_rate !== null && metrics.window.success_rate < ALERT_LIMITS.minimumSuccessRate) {
    alerts.push({
      severity: 'critical',
      title: `Taxa de sucesso em ${metrics.window.success_rate}%`,
      detail: `O índice está abaixo do limite operacional de ${ALERT_LIMITS.minimumSuccessRate}% para o período selecionado.`,
    });
  }

  if (metrics.totals.pending >= ALERT_LIMITS.pendingQueue) {
    alerts.push({
      severity: 'warning',
      title: `Fila pendente com ${metrics.totals.pending} eventos`,
      detail: `A fila atingiu o limite de atenção de ${ALERT_LIMITS.pendingQueue} eventos. Confirme se o dispatcher está executando normalmente.`,
    });
  }

  if (metrics.window.failed >= ALERT_LIMITS.failedEvents) {
    alerts.push({
      severity: 'warning',
      title: `${metrics.window.failed} falhas no período`,
      detail: `O volume de falhas atingiu o limite de atenção de ${ALERT_LIMITS.failedEvents}. Analise os tipos e erros mais recorrentes.`,
    });
  }

  return alerts;
}

export function IntegrationMetricsDashboard() {
  const [windowHours, setWindowHours] = useState(24);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente no painel.');

      const response = await fetch(`/api/admin/integrations/metrics?window_hours=${windowHours}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const result = await response.json() as MetricsResponse;
      if (!response.ok || !result.ok || !result.metrics) {
        throw new Error(result.error || 'Não foi possível carregar as métricas.');
      }
      setMetrics(result.metrics);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar as métricas.');
    } finally {
      setLoading(false);
    }
  }, [windowHours]);

  useEffect(() => { void loadMetrics(); }, [loadMetrics]);

  if (loading && !metrics) {
    return <section className="rounded-[28px] border border-slate-200 bg-white p-7 text-center font-semibold text-slate-500 shadow-soft">Carregando indicadores executivos…</section>;
  }

  if (error && !metrics) {
    return <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-red-800 shadow-soft"><p className="font-bold">{error}</p><button type="button" onClick={() => void loadMetrics()} className="mt-4 rounded-full border border-red-300 px-4 py-2 text-sm font-black">Tentar novamente</button></section>;
  }

  if (!metrics) return null;
  const health = healthLabel(metrics);
  const alerts = getOperationalAlerts(metrics);

  return (
    <section className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue">Visão executiva</p>
          <h2 className="mt-1 text-2xl font-black text-navy">Saúde da integração</h2>
          <p className="mt-1 text-sm text-slate-500">Telegram → Casting Attual 360 → ATTUAL ONE</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((period) => (
            <button key={period.hours} type="button" onClick={() => setWindowHours(period.hours)} className={`rounded-full px-4 py-2 text-sm font-black ${windowHours === period.hours ? 'bg-navy text-white' : 'border border-slate-300 text-navy'}`}>
              {period.label}
            </button>
          ))}
          <button type="button" onClick={() => void loadMetrics()} disabled={loading} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-navy disabled:opacity-50">{loading ? 'Atualizando…' : 'Atualizar'}</button>
        </div>
      </div>

      {error && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{error}</p>}

      {alerts.length > 0 ? (
        <div className="space-y-3" aria-label="Alertas operacionais">
          {alerts.map((alert) => (
            <div key={`${alert.title}-${alert.detail}`} className={`rounded-2xl border px-5 py-4 ${alert.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em]">{alert.severity === 'critical' ? 'Alerta crítico' : 'Atenção operacional'}</p>
                  <h3 className="mt-1 text-lg font-black">{alert.title}</h3>
                  <p className="mt-1 text-sm leading-6 opacity-80">{alert.detail}</p>
                </div>
                <a href="/admin/integracoes/eventos" className="rounded-full border border-current px-4 py-2 text-xs font-black transition hover:bg-white/50">Abrir central</a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950">
          <p className="text-xs font-black uppercase tracking-[0.18em]">Operação normal</p>
          <p className="mt-1 text-sm font-semibold">Nenhum limite de alerta foi atingido no período selecionado.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl bg-slate-950 p-5 text-white sm:col-span-2 lg:col-span-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">Estado geral</p>
          <p className="mt-2 text-2xl font-black">{health.label}</p>
          <p className="mt-1 text-xs text-white/65">{health.detail}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Taxa de sucesso</p><p className="mt-2 text-3xl font-black text-navy">{metrics.window.success_rate === null ? '—' : `${metrics.window.success_rate}%`}</p></div>
        <div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Eventos no período</p><p className="mt-2 text-3xl font-black text-navy">{metrics.window.events}</p></div>
        <div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Entrega média</p><p className="mt-2 text-3xl font-black text-navy">{formatDuration(metrics.performance.average_delivery_ms)}</p></div>
        <div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-500">Eventos travados</p><p className="mt-2 text-3xl font-black text-navy">{metrics.performance.stuck_events}</p></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-navy">Volume operacional</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-slate-500">Total</dt><dd className="text-xl font-black text-navy">{metrics.totals.all}</dd></div>
            <div><dt className="text-slate-500">Pendentes</dt><dd className="text-xl font-black text-navy">{metrics.totals.pending}</dd></div>
            <div><dt className="text-slate-500">Processando</dt><dd className="text-xl font-black text-navy">{metrics.totals.processing}</dd></div>
            <div><dt className="text-slate-500">Processados</dt><dd className="text-xl font-black text-navy">{metrics.totals.processed}</dd></div>
            <div><dt className="text-slate-500">Falhos</dt><dd className="text-xl font-black text-navy">{metrics.totals.failed}</dd></div>
            <div><dt className="text-slate-500">Reprocessamentos</dt><dd className="text-xl font-black text-navy">{metrics.totals.reprocessings}</dd></div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <h3 className="font-black text-navy">Tipos mais ativos</h3>
          {metrics.top_event_types.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhum evento no período.</p> : (
            <div className="mt-4 space-y-3">
              {metrics.top_event_types.slice(0, 5).map((item) => (
                <div key={item.event_type} className="flex items-center justify-between gap-4 text-sm"><span className="min-w-0 truncate font-semibold text-slate-700">{item.event_type}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-black text-navy">{item.total}</span></div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="font-black text-navy">Falhas recentes</h3><span className="text-xs font-semibold text-slate-500">Últimas {metrics.recent_failures.length}</span></div>
        {metrics.recent_failures.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhuma falha registrada. O carteiro digital está em dia.</p> : (
          <div className="mt-4 divide-y divide-slate-100">
            {metrics.recent_failures.slice(0, 5).map((failure) => (
              <div key={failure.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]">
                <div className="min-w-0"><p className="truncate font-black text-navy">{failure.event_type}</p><p className="truncate text-xs text-red-700">{failure.ultimo_erro || 'Falha sem mensagem registrada'}</p></div>
                <p className="text-xs font-semibold text-slate-500">{failure.tentativas} tentativa(s)</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
