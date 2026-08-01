import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProduction } from '@/lib/productions/queries';
import { PRODUCTION_STATUS_LABELS, PRODUCTION_TYPE_LABELS, type ProductionStatus } from '@/lib/productions/types';
import { changeProductionStatus } from '../actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string; updated?: string; integration?: string; status_changed?: string; status_error?: string }>;
};

const NEXT_STATUSES: Partial<Record<ProductionStatus, ProductionStatus[]>> = {
  draft: ['planning', 'cancelled', 'archived'],
  planning: ['casting', 'cancelled', 'archived'],
  casting: ['pre_production', 'cancelled', 'archived'],
  pre_production: ['in_production', 'cancelled', 'archived'],
  in_production: ['post_production', 'cancelled'],
  post_production: ['completed', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
};

function formatDate(value: string | null) {
  if (!value) return 'A definir';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));
}

export default async function AdminProductionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const access = await requireAdminPage(`/admin/producoes/${id}`);

  if (!access.structureInstalled || !access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-950 shadow-soft">
          <h1 className="text-3xl font-black">Acesso indisponível</h1>
          <p className="mt-4">A estrutura de Produções precisa estar instalada e sua conta precisa ter permissão administrativa.</p>
        </section>
      </SiteShell>
    );
  }

  const { production, error } = await getAdminProduction(id);
  if (error) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <h1 className="text-3xl font-black">Não foi possível abrir a produção</h1>
          <p className="mt-4">Verifique se a migration de Produções já foi aplicada ao Supabase.</p>
        </section>
      </SiteShell>
    );
  }
  if (!production) notFound();

  const location = production.is_remote ? 'Remoto' : [production.venue, production.city, production.state].filter(Boolean).join(' · ') || 'A definir';
  const nextStatuses = NEXT_STATUSES[production.status] ?? [];
  const statusAction = changeProductionStatus.bind(null, production.id);

  return (
    <SiteShell>
      <div className="space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin/producoes" className="font-bold text-teal">← Voltar às produções</Link>
          {production.status !== 'archived' && <Link href={`/admin/producoes/${production.id}/editar`} className="rounded-full border border-blue/20 bg-white px-5 py-2.5 font-bold text-navy shadow-soft transition hover:border-blue/40">Editar produção</Link>}
        </div>

        {query.created === '1' && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">Produção criada com sucesso.</p>}
        {query.updated === '1' && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">Produção atualizada com sucesso.</p>}
        {query.status_changed === '1' && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">Status da produção atualizado.</p>}
        {query.status_error && <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-800">A mudança de status não pôde ser concluída. Atualize a página e verifique se a transição ainda é válida.</p>}
        {query.integration === 'queued' && <p className="rounded-2xl border border-blue/20 bg-blue/5 px-5 py-4 font-semibold text-navy">Evento da produção registrado para o ATTUAL ONE.</p>}
        {query.integration === 'warning' && <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-semibold text-amber-900">A alteração foi salva, mas o evento de integração não pôde ser enfileirado. O dado operacional não foi desfeito.</p>}

        <section className="rounded-[28px] bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">{PRODUCTION_TYPE_LABELS[production.production_type]}</p>
              <h1 className="mt-3 text-3xl font-black">{production.name}</h1>
              <p className="mt-3 text-white/80">{production.client_name || production.project_reference || 'Projeto interno'}</p>
            </div>
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-navy">{PRODUCTION_STATUS_LABELS[production.status]}</span>
          </div>
        </section>

        {nextStatuses.length > 0 && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft">
            <h2 className="text-xl font-black text-navy">Fluxo da produção</h2>
            <p className="mt-2 text-sm text-slate-600">Somente transições válidas para o estágio atual são exibidas. Cancelamento e arquivamento ficam registrados como mudança de estado, sem exclusão física.</p>
            <form action={statusAction} className="mt-5 flex flex-wrap gap-3">
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  name="target_status"
                  value={status}
                  className={`rounded-full px-5 py-2.5 font-bold transition ${status === 'cancelled' || status === 'archived' ? 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100' : 'bg-navy text-white hover:bg-blue'}`}
                >
                  {PRODUCTION_STATUS_LABELS[status]}
                </button>
              ))}
            </form>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Início</p><p className="mt-2 font-black text-navy">{formatDate(production.starts_at)}</p></article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Local</p><p className="mt-2 font-black text-navy">{location}</p></article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Orçamento Casting</p><p className="mt-2 font-black text-navy">{production.budget_casting === null ? 'A definir' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: production.currency }).format(production.budget_casting)}</p></article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Convocações</p><p className="mt-2 text-3xl font-black text-navy">0</p><p className="mt-1 text-xs text-slate-500">Próxima missão</p></article>
        </section>

        {(production.description || production.notes) && (
          <section className="grid gap-5 md:grid-cols-2">
            {production.description && <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-black text-navy">Resumo</h2><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{production.description}</p></article>}
            {production.notes && <article className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft"><h2 className="text-xl font-black text-navy">Observações internas</h2><p className="mt-4 whitespace-pre-wrap leading-7 text-slate-600">{production.notes}</p></article>}
          </section>
        )}

        <section className="rounded-[28px] border border-dashed border-blue/30 bg-blue/5 p-7">
          <h2 className="text-xl font-black text-navy">Próxima camada: Convocações</h2>
          <p className="mt-3 max-w-3xl text-slate-600">Esta produção agora tem identidade, edição e ciclo de status controlado. A próxima missão ligará necessidades de elenco, requisitos, shortlist e convites Telegram a este ID.</p>
        </section>
      </div>
    </SiteShell>
  );
}
