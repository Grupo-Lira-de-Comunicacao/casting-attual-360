'use client';

import { useMemo, useState, useTransition } from 'react';
import { updateRequestStatus } from '@/app/admin/actions';
import type { RequestRecord, RequestStatus, RequestType } from '@/types/request';

const statusLabel: Record<RequestStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em análise',
  contatado: 'Contatado',
  arquivado: 'Arquivado',
};

const typeLabel: Record<RequestType, string> = {
  empresa: 'Empresa',
  talento: 'Talento',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

type RequestManagementProps = {
  requests: RequestRecord[];
};

export function RequestManagement({ requests }: RequestManagementProps) {
  const [items, setItems] = useState(requests);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RequestStatus | 'todos'>('todos');
  const [type, setType] = useState<RequestType | 'todos'>('todos');
  const [selectedId, setSelectedId] = useState<number | null>(requests[0]?.id ?? null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    return items.filter((request) => {
      const matchesStatus = status === 'todos' || request.status === status;
      const matchesType = type === 'todos' || request.request_type === type;
      const haystack = [request.name, request.email, request.organization, request.message]
        .join(' ')
        .toLocaleLowerCase('pt-BR');
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesStatus && matchesType && matchesQuery;
    });
  }, [items, query, status, type]);

  const selectedRequest =
    filteredRequests.find((request) => request.id === selectedId) ?? filteredRequests[0] ?? null;

  function clearFilters() {
    setQuery('');
    setStatus('todos');
    setType('todos');
  }

  function handleStatusChange(requestId: number, nextStatus: RequestStatus) {
    setFeedback(null);

    startTransition(async () => {
      const result = await updateRequestStatus(requestId, nextStatus);

      if (!result.ok) {
        setFeedback({ type: 'error', message: result.error });
        return;
      }

      setItems((current) =>
        current.map((request) => (request.id === requestId ? { ...request, status: result.status } : request)),
      );
      setFeedback({ type: 'success', message: `Status alterado para ${statusLabel[result.status]}.` });
    });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-navy shadow-soft">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Gestão de solicitações</p>
            <h2 className="text-2xl font-black">Fila administrativa</h2>
          </div>
          <span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-semibold text-teal">
            {filteredRequests.length} de {items.length}
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]">
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Buscar
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, e-mail, empresa ou mensagem"
              className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            />
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as RequestStatus | 'todos')}
              className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            >
              <option value="todos">Todos</option>
              {Object.entries(statusLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Tipo
            <select
              value={type}
              onChange={(event) => setType(event.target.value as RequestType | 'todos')}
              className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15"
            >
              <option value="todos">Todos</option>
              {Object.entries(typeLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={clearFilters}
            className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue hover:text-blue"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="p-8 text-slate-600">Nenhuma solicitação corresponde aos filtros selecionados.</div>
      ) : (
        <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
          <div className="divide-y divide-slate-200 border-b border-slate-200 lg:border-b-0 lg:border-r">
            {filteredRequests.map((request) => {
              const active = selectedRequest?.id === request.id;

              return (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(request.id);
                    setFeedback(null);
                  }}
                  className={`block w-full p-5 text-left transition ${active ? 'bg-blue/5' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue">
                      {typeLabel[request.request_type]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {statusLabel[request.status]}
                    </span>
                    {request.is_test && (
                      <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">Teste</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black">{request.name}</h3>
                      <p className="mt-1 truncate text-sm text-slate-500">{request.email}</p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-400">{formatDate(request.created_at)}</time>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{request.message}</p>
                </button>
              );
            })}
          </div>

          {selectedRequest && (
            <aside className="p-6 lg:sticky lg:top-4 lg:self-start">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue">Detalhes da solicitação</p>
              <h3 className="mt-3 text-2xl font-black">{selectedRequest.name}</h3>
              <p className="mt-1 font-mono text-xs text-slate-400">#{selectedRequest.id}</p>

              <dl className="mt-6 grid gap-4 text-sm">
                <div>
                  <dt className="font-bold text-slate-500">Tipo</dt>
                  <dd className="mt-1 text-navy">{typeLabel[selectedRequest.request_type]}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Status</dt>
                  <dd className="mt-2">
                    <select
                      value={selectedRequest.status}
                      disabled={isPending}
                      onChange={(event) =>
                        handleStatusChange(selectedRequest.id, event.target.value as RequestStatus)
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15 disabled:cursor-wait disabled:opacity-60"
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">E-mail</dt>
                  <dd className="mt-1 break-all text-navy">
                    <a className="underline decoration-slate-300 underline-offset-4" href={`mailto:${selectedRequest.email}`}>
                      {selectedRequest.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Empresa ou identificação</dt>
                  <dd className="mt-1 text-navy">{selectedRequest.organization || 'Não informado'}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Recebida em</dt>
                  <dd className="mt-1 text-navy">{formatDate(selectedRequest.created_at)}</dd>
                </div>
              </dl>

              {feedback && (
                <div
                  role="status"
                  className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
                    feedback.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-red-200 bg-red-50 text-red-900'
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-500">Mensagem</p>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{selectedRequest.message}</p>
              </div>

              <div className="mt-5 rounded-2xl border border-blue/20 bg-blue/5 p-4 text-sm leading-6 text-slate-700">
                O status pode ser atualizado por administradores autorizados. Responsável, observações internas e histórico continuam bloqueados até uma próxima evolução segura do banco.
              </div>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
