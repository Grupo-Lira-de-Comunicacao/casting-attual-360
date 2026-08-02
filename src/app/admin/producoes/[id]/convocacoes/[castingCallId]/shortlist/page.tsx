import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdminPage } from '@/lib/admin';
import { getCastingCall } from '@/lib/casting-calls/queries';
import { getCastingShortlist } from '@/lib/matching/queries';
import { getAdminProduction } from '@/lib/productions/queries';
import { changeShortlistSelection, generateShortlistAction } from './actions';

const eligibilityLabels: Record<string, string> = {
  eligible: 'Elegível',
  ineligible: 'Inelegível',
  review: 'Revisão humana',
};

const selectionLabels: Record<string, string> = {
  suggested: 'Sugerido',
  shortlisted: 'Na shortlist',
  invited: 'Convidado',
  accepted: 'Aceitou',
  declined: 'Recusou',
  removed: 'Removido',
};

export default async function CastingShortlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; castingCallId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, castingCallId } = await params;
  await requireAdminPage(`/admin/producoes/${id}/convocacoes/${castingCallId}/shortlist`);
  const query = await searchParams;
  const [{ production }, { castingCall }, { shortlist }] = await Promise.all([
    getAdminProduction(id),
    getCastingCall(castingCallId),
    getCastingShortlist(castingCallId),
  ]);

  if (!production || !castingCall || castingCall.production_id !== id) notFound();

  const generateAction = generateShortlistAction.bind(null, id, castingCallId);
  const activeItems = shortlist.filter((item) => item.selection_status !== 'removed');
  const eligible = activeItems.filter((item) => item.eligibility_status === 'eligible').length;
  const review = activeItems.filter((item) => item.eligibility_status === 'review').length;
  const selected = activeItems.filter((item) => item.selection_status === 'shortlisted').length;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/admin/producoes/${id}/convocacoes/${castingCallId}`} className="text-sm text-slate-500 hover:text-slate-900">← Voltar para a convocação</Link>
          <h1 className="mt-2 text-3xl font-semibold">Shortlist</h1>
          <p className="mt-1 text-slate-600">{production.name} · {castingCall.title}</p>
        </div>
        <form action={generateAction}>
          <button type="submit" disabled={castingCall.status !== 'open'} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">
            {shortlist.length > 0 ? 'Recalcular matching' : 'Gerar matching'}
          </button>
        </form>
      </div>

      {query.generated === '1' && <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">Matching calculado e shortlist atualizada.</div>}
      {query.selection_changed === '1' && <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">Decisão humana registrada.</div>}
      {query.integration === 'warning' && <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">A operação foi salva, mas o evento para o ATTUAL ONE não pôde ser enfileirado.</div>}
      {query.error && <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">Não foi possível concluir a operação da shortlist.</div>}
      {castingCall.status !== 'open' && <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">O matching automático só pode ser gerado enquanto a convocação estiver aberta.</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Candidatos</p><p className="mt-2 text-2xl font-semibold">{activeItems.length}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Elegíveis</p><p className="mt-2 text-2xl font-semibold">{eligible}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Revisão</p><p className="mt-2 text-2xl font-semibold">{review}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-xs uppercase tracking-wide text-slate-500">Selecionados</p><p className="mt-2 text-2xl font-semibold">{selected}</p></div>
      </section>

      <section className="mt-8 space-y-4">
        {activeItems.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">Nenhum candidato calculado ainda. Gere o matching para montar a shortlist.</div>
        ) : activeItems.map((item) => {
          const talent = item.talent;
          const selectionAction = changeShortlistSelection.bind(null, id, castingCallId, item.id);
          const summary = typeof item.score_explanation.summary === 'string' ? item.score_explanation.summary : 'Score calculado com base nos requisitos estruturados disponíveis.';
          return (
            <article key={item.id} className="rounded-xl border bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{talent?.nome_artistico || talent?.nome || 'Talento não encontrado'}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{eligibilityLabels[item.eligibility_status] ?? item.eligibility_status}</span>
                    <span className="rounded-full border px-2 py-0.5 text-xs">{selectionLabels[item.selection_status] ?? item.selection_status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{talent ? `${talent.categoria} · ${talent.cidade}/${talent.estado}` : 'Perfil indisponível'}</p>
                </div>
                <div className="text-right"><p className="text-xs uppercase tracking-wide text-slate-500">Compatibilidade</p><p className="text-3xl font-semibold">{item.match_score.toFixed(0)}%</p></div>
              </div>

              <p className="mt-4 text-sm text-slate-600">{summary}</p>
              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4"><strong>Atendidos:</strong> {item.matched_requirements.length}</div>
                <div className="rounded-lg bg-slate-50 p-4"><strong>Não atendidos:</strong> {item.failed_requirements.length}</div>
              </div>

              {item.selection_status === 'suggested' && item.eligibility_status !== 'ineligible' && (
                <form action={selectionAction} className="mt-5">
                  <input type="hidden" name="selection_status" value="shortlisted" />
                  <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Adicionar à shortlist</button>
                </form>
              )}
              {item.selection_status === 'shortlisted' && (
                <form action={selectionAction} className="mt-5">
                  <input type="hidden" name="selection_status" value="removed" />
                  <button className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700">Remover da shortlist</button>
                </form>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
