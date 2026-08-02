'use client';

import { useActionState } from 'react';
import type { ProductionActionState } from '@/app/admin/producoes/actions';
import type { Production } from '@/lib/productions/types';
import { PRODUCTION_TYPES, PRODUCTION_TYPE_LABELS } from '@/lib/productions/types';

const initialState: ProductionActionState = { ok: true };
const fieldClass = 'rounded-2xl border border-slate-300 bg-white px-4 py-3 text-navy outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20';

function toLocalInput(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ProductionForm({
  action,
  production,
  submitLabel = 'Criar produção',
}: {
  action: (state: ProductionActionState, formData: FormData) => Promise<ProductionActionState>;
  production?: Production;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-6">
      {!state.ok && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">{state.error}</p>}

      <div className="grid gap-5 md:grid-cols-[1fr_.55fr]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Nome da produção<input className={fieldClass} name="name" minLength={2} maxLength={160} required defaultValue={production?.name ?? ''} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Tipo<select className={fieldClass} name="production_type" defaultValue={production?.production_type ?? 'tv'}>{PRODUCTION_TYPES.map((type) => <option key={type} value={type}>{PRODUCTION_TYPE_LABELS[type]}</option>)}</select></label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Cliente<input className={fieldClass} name="client_name" maxLength={160} placeholder="Opcional para projetos internos" defaultValue={production?.client_name ?? ''} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Referência do projeto<input className={fieldClass} name="project_reference" maxLength={160} placeholder="Campanha, programa, episódio..." defaultValue={production?.project_reference ?? ''} /></label>
      </div>

      <label className="grid gap-2 text-sm font-bold text-slate-700">Descrição<textarea className={fieldClass} name="description" rows={5} maxLength={5000} defaultValue={production?.description ?? ''} /></label>

      <section className="grid gap-5 rounded-[24px] border border-blue/20 bg-blue/5 p-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Início<input className={fieldClass} type="datetime-local" name="starts_at" defaultValue={toLocalInput(production?.starts_at)} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Término<input className={fieldClass} type="datetime-local" name="ends_at" defaultValue={toLocalInput(production?.ends_at)} /></label>
      </section>

      <div className="grid gap-5 md:grid-cols-[1fr_.3fr]">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Cidade<input className={fieldClass} name="city" maxLength={120} defaultValue={production?.city ?? ''} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">UF<input className={fieldClass} name="state" minLength={2} maxLength={2} defaultValue={production?.state ?? 'SP'} /></label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-slate-700">Local<input className={fieldClass} name="venue" maxLength={180} placeholder="Estúdio, teatro, empresa..." defaultValue={production?.venue ?? ''} /></label>
        <label className="grid gap-2 text-sm font-bold text-slate-700">Endereço<input className={fieldClass} name="address" maxLength={300} defaultValue={production?.address ?? ''} /></label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-bold text-slate-700"><input className="h-5 w-5" type="checkbox" name="is_remote" defaultChecked={production?.is_remote ?? false} />Produção remota</label>

      <label className="grid gap-2 text-sm font-bold text-slate-700">Orçamento previsto para casting (R$)<input className={fieldClass} name="budget_casting" type="number" min="0" step="0.01" placeholder="0,00" defaultValue={production?.budget_casting ?? ''} /></label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Observações internas<textarea className={fieldClass} name="notes" rows={4} maxLength={5000} defaultValue={production?.notes ?? ''} /></label>

      <div className="flex flex-wrap items-center gap-4">
        <button disabled={pending} className="rounded-full bg-navy px-7 py-3 font-bold text-white transition hover:bg-blue disabled:cursor-wait disabled:opacity-60">{pending ? 'Salvando…' : submitLabel}</button>
        <span className="text-sm text-slate-500">{production ? 'Alterações relevantes serão registradas para sincronização com o ATTUAL ONE.' : 'A produção nasce como rascunho. Nenhuma convocação é enviada automaticamente.'}</span>
      </div>
    </form>
  );
}
