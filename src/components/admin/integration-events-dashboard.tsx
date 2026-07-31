'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type IntegrationEvent = {
  id: string;
  event_key: string;
  event_type: string;
  source_system: string;
  target_system: string;
  payload: unknown;
  status: string;
  tentativas: number;
  ultimo_erro: string | null;
  criado_em: string;
  atualizado_em: string;
  processado_em: string | null;
  reprocessamentos: number;
  ultimo_reprocessamento_em: string | null;
};

type EventsResponse = {
  ok: boolean;
  events?: IntegrationEvent[];
  pagination?: { page: number; total: number; total_pages: number };
  error?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  processando: 'Processando',
  processado: 'Processado',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
};

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export function IntegrationEventsDashboard() {
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IntegrationEvent | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente no painel.');

      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (status) params.set('status', status);
      if (eventType.trim()) params.set('event_type', eventType.trim());

      const response = await fetch(`/api/admin/integrations/events?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const result = (await response.json()) as EventsResponse;
      if (!response.ok || !result.ok) throw new Error(result.error || 'Não foi possível carregar os eventos.');

      setEvents(result.events ?? []);
      setTotal(result.pagination?.total ?? 0);
      setTotalPages(Math.max(1, result.pagination?.total_pages ?? 1));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [eventType, page, status]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  async function retryEvent(event: IntegrationEvent) {
    setRetryingId(event.id);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente no painel.');

      const response = await fetch(`/api/admin/integrations/events/${event.id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || 'Não foi possível reprocessar o evento.');
      setSelected(null);
      await loadEvents();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao solicitar o reprocessamento.');
    } finally {
      setRetryingId(null);
    }
  }

  const counts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.status] = (acc[event.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['pendente', 'processando', 'processado', 'falhou'].map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">{STATUS_LABELS[item]}</p>
            <p className="mt-2 text-3xl font-black text-navy">{counts[item] ?? 0}</p>
            <p className="mt-1 text-xs text-slate-500">na página atual</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="grid gap-4 md:grid-cols-[180px_1fr_auto]">
          <label className="text-sm font-bold text-navy">Status
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-medium">
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-navy">Tipo do evento
            <input value={eventType} onChange={(e) => setEventType(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); void loadEvents(); } }} placeholder="Ex.: talent.telegram.linked.v1" className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-medium" />
          </label>
          <button type="button" onClick={() => { setPage(1); void loadEvents(); }} className="self-end rounded-full bg-blue px-5 py-2.5 text-sm font-bold text-white">Filtrar</button>
        </div>
      </section>

      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-800">{error}</p>}

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div><h2 className="text-xl font-black text-navy">Protocolo de eventos</h2><p className="text-sm text-slate-500">{total} registro(s) encontrado(s)</p></div>
          <button type="button" onClick={() => void loadEvents()} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-navy">Atualizar</button>
        </div>

        {loading ? <p className="p-8 text-center font-semibold text-slate-500">Carregando eventos…</p> : events.length === 0 ? <p className="p-8 text-center text-slate-500">Nenhum evento encontrado.</p> : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <button key={event.id} type="button" onClick={() => setSelected(event)} className="grid w-full gap-2 px-6 py-5 text-left transition hover:bg-slate-50 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto] md:items-center">
                <div><p className="font-black text-navy">{event.event_type}</p><p className="mt-1 break-all text-xs text-slate-500">{event.event_key}</p></div>
                <p className="text-sm font-semibold text-slate-600">{event.source_system} → {event.target_system}</p>
                <p className="text-sm text-slate-600">{formatDate(event.criado_em)}</p>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-navy">{STATUS_LABELS[event.status] ?? event.status}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="font-bold text-blue disabled:opacity-40">← Anterior</button>
          <span className="text-sm font-semibold text-slate-600">Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="font-bold text-blue disabled:opacity-40">Próxima →</button>
        </div>
      </section>

      {selected && (
        <section className="rounded-[28px] border border-slate-300 bg-slate-950 p-6 text-white shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">Detalhes do evento</p><h2 className="mt-2 text-2xl font-black">{selected.event_type}</h2></div>
            <button type="button" onClick={() => setSelected(null)} className="rounded-full border border-white/30 px-4 py-2 text-sm font-bold">Fechar</button>
          </div>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-white/55">Status</dt><dd className="mt-1 font-bold">{STATUS_LABELS[selected.status] ?? selected.status}</dd></div>
            <div><dt className="text-white/55">Tentativas</dt><dd className="mt-1 font-bold">{selected.tentativas}</dd></div>
            <div><dt className="text-white/55">Reprocessamentos</dt><dd className="mt-1 font-bold">{selected.reprocessamentos ?? 0}</dd></div>
            <div><dt className="text-white/55">Atualizado</dt><dd className="mt-1 font-bold">{formatDate(selected.atualizado_em)}</dd></div>
          </dl>
          {selected.ultimo_erro && <p className="mt-6 rounded-2xl border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-100"><strong>Último erro:</strong> {selected.ultimo_erro}</p>}
          <pre className="mt-6 max-h-96 overflow-auto rounded-2xl bg-black/40 p-5 text-xs leading-6 text-sky-100">{JSON.stringify(selected.payload, null, 2)}</pre>
          {(selected.status === 'falhou' || selected.status === 'cancelado') && (
            <button type="button" disabled={retryingId === selected.id} onClick={() => void retryEvent(selected)} className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-black text-navy disabled:opacity-60">
              {retryingId === selected.id ? 'Reprocessando…' : 'Reprocessar evento'}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
