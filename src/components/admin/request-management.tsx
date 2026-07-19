'use client';

import { useMemo, useState, useTransition } from 'react';
import { updateRequestAdminFields } from '@/app/admin/actions';
import type { RequestAdminUpdate, RequestHistoryEntry, RequestRecord, RequestStatus, RequestType } from '@/types/request';

const statusLabel: Record<RequestStatus, string> = { novo: 'Novo', em_analise: 'Em análise', contatado: 'Contatado', arquivado: 'Arquivado' };
const typeLabel: Record<RequestType, string> = { empresa: 'Empresa', talento: 'Talento' };
const fieldLabel: Record<string, string> = {
  name: 'Nome', email: 'E-mail', organization: 'Empresa ou identificação', request_type: 'Tipo', status: 'Status',
  assigned_to: 'Responsável', internal_notes: 'Observações internas',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formValue(request: RequestRecord): RequestAdminUpdate {
  return {
    request_type: request.request_type, name: request.name, email: request.email, organization: request.organization,
    status: request.status, assigned_to: request.assigned_to ?? '', internal_notes: request.internal_notes ?? '',
  };
}

type EditorProps = {
  request: RequestRecord;
  history: RequestHistoryEntry[];
  onSaved: (request: RequestRecord) => void;
};

function RequestEditor({ request, history, onSaved }: EditorProps) {
  const [draft, setDraft] = useState<RequestAdminUpdate>(() => formValue(request));
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof RequestAdminUpdate>(field: K, value: RequestAdminUpdate[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  }

  function save() {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateRequestAdminFields(request.id, draft);
      if (!result.ok) return setFeedback({ type: 'error', message: result.error });
      onSaved(result.request);
      setDraft(formValue(result.request));
      setFeedback({ type: 'success', message: 'Alterações salvas e registradas no histórico.' });
    });
  }

  return (
    <aside className="p-6 lg:sticky lg:top-4 lg:self-start">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue">Editar solicitação</p>
      <p className="mt-2 font-mono text-xs text-slate-400">#{request.id} · recebida em {formatDate(request.created_at)}</p>

      <div className="mt-6 grid gap-4">
        <label className="grid gap-1 text-sm font-bold text-slate-500">Nome
          <input value={draft.name} maxLength={120} onChange={(event) => setField('name', event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-500">E-mail
          <input type="email" value={draft.email} maxLength={254} onChange={(event) => setField('email', event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-500">Empresa ou identificação
          <input value={draft.organization} maxLength={160} onChange={(event) => setField('organization', event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-slate-500">Tipo
            <select value={draft.request_type} onChange={(event) => setField('request_type', event.target.value as RequestType)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue">{Object.entries(typeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-500">Status
            <select value={draft.status} onChange={(event) => setField('status', event.target.value as RequestStatus)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue">{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </label>
        </div>
        <label className="grid gap-1 text-sm font-bold text-slate-500">Responsável
          <input value={draft.assigned_to} maxLength={120} placeholder="Nome de quem acompanhará" onChange={(event) => setField('assigned_to', event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-500">Observações internas
          <textarea value={draft.internal_notes} maxLength={2000} rows={4} onChange={(event) => setField('internal_notes', event.target.value)} className="resize-y rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue" />
          <span className="text-right text-xs font-normal text-slate-400">{draft.internal_notes.length}/2000</span>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" disabled={isPending} onClick={save} className="rounded-2xl bg-blue px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{isPending ? 'Salvando…' : 'Salvar alterações'}</button>
        <button type="button" disabled={isPending} onClick={() => { setDraft(formValue(request)); setFeedback(null); }} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">Cancelar</button>
      </div>

      {feedback && <div role="status" className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>{feedback.message}</div>}

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-sm font-bold text-slate-500">Mensagem original — somente leitura</p>
        <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{request.message}</p>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h4 className="font-black">Histórico de alterações</h4>
        {history.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhuma alteração registrada.</p> : (
          <ol className="mt-4 grid gap-4">
            {history.map((entry) => <li key={entry.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <p className="font-bold">{entry.changed_by_email || 'Administrador'} · {formatDate(entry.changed_at)}</p>
              <ul className="mt-2 grid gap-1 text-slate-600">{Object.entries(entry.changes).map(([field, change]) => <li key={field}><span className="font-semibold">{fieldLabel[field] || field}:</span> {String(change.from ?? 'vazio')} → {String(change.to ?? 'vazio')}</li>)}</ul>
            </li>)}
          </ol>
        )}
      </div>
    </aside>
  );
}

export function RequestManagement({ requests, history }: { requests: RequestRecord[]; history: RequestHistoryEntry[] }) {
  const [items, setItems] = useState(requests);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RequestStatus | 'todos'>('todos');
  const [type, setType] = useState<RequestType | 'todos'>('todos');
  const [selectedId, setSelectedId] = useState<number | null>(requests[0]?.id ?? null);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return items.filter((request) => {
      const haystack = [request.name, request.email, request.organization, request.message, request.assigned_to].join(' ').toLocaleLowerCase('pt-BR');
      return (status === 'todos' || request.status === status) && (type === 'todos' || request.request_type === type) && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [items, query, status, type]);

  const selectedRequest = filteredRequests.find((request) => request.id === selectedId) ?? filteredRequests[0] ?? null;
  const selectedHistory = selectedRequest ? history.filter((entry) => entry.request_id === selectedRequest.id) : [];

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-navy shadow-soft">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Gestão de solicitações</p><h2 className="text-2xl font-black">Fila administrativa</h2></div><span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-semibold text-teal">{filteredRequests.length} de {items.length}</span></div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_190px_190px_auto]">
          <label className="grid gap-1 text-sm font-semibold text-slate-600">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, e-mail, empresa, responsável ou mensagem" className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy outline-none focus:border-blue" /></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">Status<select value={status} onChange={(event) => setStatus(event.target.value as RequestStatus | 'todos')} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy"><option value="todos">Todos</option>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">Tipo<select value={type} onChange={(event) => setType(event.target.value as RequestType | 'todos')} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-navy"><option value="todos">Todos</option>{Object.entries(typeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button type="button" onClick={() => { setQuery(''); setStatus('todos'); setType('todos'); }} className="self-end rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">Limpar filtros</button>
        </div>
      </div>
      {filteredRequests.length === 0 ? <div className="p-8 text-slate-600">Nenhuma solicitação corresponde aos filtros.</div> : (
        <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
          <div className="divide-y divide-slate-200 border-b border-slate-200 lg:border-b-0 lg:border-r">{filteredRequests.map((request) => <button key={request.id} type="button" onClick={() => setSelectedId(request.id)} className={`block w-full p-5 text-left transition ${selectedRequest?.id === request.id ? 'bg-blue/5' : 'hover:bg-slate-50'}`}><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue">{typeLabel[request.request_type]}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{statusLabel[request.status]}</span>{request.is_test && <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">Teste</span>}</div><div className="mt-3 flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="truncate text-lg font-black">{request.name}</h3><p className="mt-1 truncate text-sm text-slate-500">{request.email}</p></div><time className="shrink-0 text-xs text-slate-400">{formatDate(request.created_at)}</time></div><p className="mt-2 text-sm text-slate-500">Responsável: {request.assigned_to || 'Não atribuído'}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{request.message}</p></button>)}</div>
          {selectedRequest && <RequestEditor key={selectedRequest.id} request={selectedRequest} history={selectedHistory} onSaved={(saved) => setItems((current) => current.map((item) => item.id === saved.id ? saved : item))} />}
        </div>
      )}
    </section>
  );
}
