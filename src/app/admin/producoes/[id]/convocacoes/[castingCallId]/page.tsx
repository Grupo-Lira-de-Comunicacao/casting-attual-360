import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProduction } from '@/lib/productions/queries';
import { getCastingCall } from '@/lib/casting-calls/queries';
import {
  addCastingRequirement,
  changeCastingCallStatus,
  deleteCastingRequirement,
} from '../actions';

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  paused: 'Pausada',
  closed: 'Encerrada',
  cancelled: 'Cancelada',
};

const requirementLabels: Record<string, string> = {
  category: 'Categoria',
  skill: 'Habilidade',
  specialty: 'Especialidade',
  language: 'Idioma',
  availability: 'Disponibilidade',
  location: 'Localização',
  age_range: 'Faixa etária',
  profile_attribute: 'Atributo de perfil',
  other: 'Outro',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Não definido';
}

export default async function CastingCallDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; castingCallId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const { id, castingCallId } = await params;
  const query = await searchParams;
  const [{ production }, { castingCall }] = await Promise.all([
    getAdminProduction(id),
    getCastingCall(castingCallId),
  ]);

  if (!production || !castingCall || castingCall.production_id !== id) notFound();

  const requiredCount = castingCall.requirements.filter((item) => item.is_required).length;
  const locked = castingCall.status === 'closed' || castingCall.status === 'cancelled';
  const statusError = typeof query.status_error === 'string' ? query.status_error : null;
  const requirementError = typeof query.requirement_error === 'string' ? query.requirement_error : null;

  const statusAction = changeCastingCallStatus.bind(null, id, castingCallId);
  const addRequirementAction = addCastingRequirement.bind(null, id, castingCallId);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/admin/producoes/${id}/convocacoes`} className="text-sm text-slate-500 hover:text-slate-900">← Voltar para convocações</Link>
          <h1 className="mt-2 text-3xl font-semibold">{castingCall.title}</h1>
          <p className="mt-1 text-slate-600">{production.name} · {castingCall.role_name}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium">{statusLabels[castingCall.status] ?? castingCall.status}</span>
      </div>

      {statusError === 'requirements' && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Para publicar a convocação, adicione pelo menos um requisito obrigatório.
        </div>
      )}
      {statusError && statusError !== 'requirements' && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível alterar o status da convocação. Verifique a transição e tente novamente.
        </div>
      )}
      {requirementError && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível atualizar os requisitos da convocação.
        </div>
      )}
      {query.integration === 'warning' && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          A operação foi salva, mas o evento para o ATTUAL ONE não pôde ser enfileirado.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vagas</p>
          <p className="mt-2 text-2xl font-semibold">{castingCall.quantity}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Prazo de candidatura</p>
          <p className="mt-2 text-sm font-medium">{formatDate(castingCall.application_deadline)}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Local</p>
          <p className="mt-2 text-sm font-medium">{castingCall.is_remote ? 'Remoto' : [castingCall.city, castingCall.state, castingCall.venue].filter(Boolean).join(' · ') || 'Não definido'}</p>
        </div>
      </section>

      <section className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Resumo</h2>
        <dl className="mt-5 grid gap-5 md:grid-cols-2">
          <div><dt className="text-xs uppercase text-slate-500">Descrição</dt><dd className="mt-1 text-sm text-slate-700">{castingCall.description || 'Sem descrição.'}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Remuneração</dt><dd className="mt-1 text-sm text-slate-700">{castingCall.compensation_amount !== null ? `${castingCall.currency} ${Number(castingCall.compensation_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'A combinar'}{castingCall.compensation_notes ? ` · ${castingCall.compensation_notes}` : ''}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Início do trabalho</dt><dd className="mt-1 text-sm text-slate-700">{formatDate(castingCall.work_starts_at)}</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Fim do trabalho</dt><dd className="mt-1 text-sm text-slate-700">{formatDate(castingCall.work_ends_at)}</dd></div>
        </dl>
      </section>

      <section className="mt-8 rounded-xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Requisitos</h2>
            <p className="mt-1 text-sm text-slate-500">{castingCall.requirements.length} critério(s), {requiredCount} obrigatório(s).</p>
          </div>
        </div>

        {castingCall.requirements.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed p-5 text-sm text-slate-500">Nenhum requisito cadastrado.</p>
        ) : (
          <div className="mt-5 grid gap-3">
            {castingCall.requirements.map((requirement) => {
              const removeAction = deleteCastingRequirement.bind(null, id, castingCallId, requirement.id);
              return (
                <div key={requirement.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{requirement.label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{requirementLabels[requirement.requirement_type] ?? requirement.requirement_type}</span>
                      {requirement.is_required && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">Obrigatório</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {requirement.value_text || [requirement.min_value, requirement.max_value].filter((value) => value !== null).join(' a ') || 'Sem valor complementar'} · peso {requirement.weight}
                    </p>
                  </div>
                  {!locked && (
                    <form action={removeAction}>
                      <button type="submit" className="text-sm font-medium text-red-700 hover:text-red-900">Remover</button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!locked && (
          <form action={addRequirementAction} className="mt-6 grid gap-4 rounded-lg bg-slate-50 p-5 md:grid-cols-2">
            <label className="text-sm font-medium">Tipo
              <select name="requirement_type" defaultValue="skill" className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                {Object.entries(requirementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Nome do requisito
              <input name="label" required minLength={2} maxLength={160} className="mt-1 w-full rounded-lg border bg-white px-3 py-2" placeholder="Ex.: Apresentação diante das câmeras" />
            </label>
            <label className="text-sm font-medium">Valor / observação
              <input name="value_text" className="mt-1 w-full rounded-lg border bg-white px-3 py-2" placeholder="Ex.: experiência mínima desejada" />
            </label>
            <label className="text-sm font-medium">Peso (0–100)
              <input name="weight" type="number" min="0" max="100" defaultValue="100" className="mt-1 w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Valor mínimo
              <input name="min_value" type="number" step="any" className="mt-1 w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="text-sm font-medium">Valor máximo
              <input name="max_value" type="number" step="any" className="mt-1 w-full rounded-lg border bg-white px-3 py-2" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
              <input name="is_required" type="checkbox" defaultChecked /> Requisito obrigatório
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Adicionar requisito</button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-xl border bg-white p-6">
        <h2 className="text-xl font-semibold">Fluxo da convocação</h2>
        <p className="mt-1 text-sm text-slate-500">A publicação envia o evento ao ATTUAL ONE. O Telegram continuará reservado para talentos selecionados na shortlist.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {castingCall.status === 'draft' && (
            <form action={statusAction}>
              <input type="hidden" name="target_status" value="open" />
              <button type="submit" disabled={requiredCount < 1} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Publicar convocação</button>
            </form>
          )}
          {castingCall.status === 'open' && (
            <>
              <form action={statusAction}><input type="hidden" name="target_status" value="paused" /><button className="rounded-lg border px-4 py-2 text-sm font-medium">Pausar</button></form>
              <form action={statusAction}><input type="hidden" name="target_status" value="closed" /><button className="rounded-lg border px-4 py-2 text-sm font-medium">Encerrar</button></form>
            </>
          )}
          {castingCall.status === 'paused' && (
            <>
              <form action={statusAction}><input type="hidden" name="target_status" value="open" /><button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Reabrir</button></form>
              <form action={statusAction}><input type="hidden" name="target_status" value="closed" /><button className="rounded-lg border px-4 py-2 text-sm font-medium">Encerrar</button></form>
            </>
          )}
          {(castingCall.status === 'draft' || castingCall.status === 'open' || castingCall.status === 'paused') && (
            <form action={statusAction}><input type="hidden" name="target_status" value="cancelled" /><button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700">Cancelar</button></form>
          )}
        </div>
        {castingCall.status === 'draft' && requiredCount < 1 && <p className="mt-3 text-sm text-amber-700">Adicione pelo menos um requisito obrigatório para habilitar a publicação.</p>}
      </section>
    </main>
  );
}
