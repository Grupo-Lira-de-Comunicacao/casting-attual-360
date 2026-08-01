import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProductions, getUpcomingProductions } from '@/lib/productions/queries';
import { PRODUCTION_STATUS_LABELS, PRODUCTION_TYPE_LABELS } from '@/lib/productions/types';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null) {
  if (!value) return 'A definir';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default async function AdminProductionsPage() {
  const access = await requireAdminPage('/admin/producoes');

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <h1 className="text-3xl font-black">Produções aguardando preparação do banco</h1>
          <p className="mt-4">Aplique a migration <code>20260802_create_productions.sql</code> antes de usar esta área.</p>
          <Link href="/admin" className="mt-6 inline-flex font-bold text-amber-800">← Voltar ao painel</Link>
        </section>
      </SiteShell>
    );
  }

  if (!access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-950 shadow-soft">
          <h1 className="text-3xl font-black">Conta sem permissão administrativa</h1>
          <p className="mt-4">Este painel é restrito aos administradores do Casting Attual 360.</p>
        </section>
      </SiteShell>
    );
  }

  const [{ productions, error }, upcomingResult] = await Promise.all([
    getAdminProductions(),
    getUpcomingProductions(),
  ]);

  if (error) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <h1 className="text-3xl font-black">Estrutura de Produções ainda não aplicada</h1>
          <p className="mt-4">A migration foi preparada no repositório, mas o banco conectado ainda precisa recebê-la.</p>
          <p className="mt-4 text-sm font-semibold">Código da consulta: {error.code || 'indisponível'}</p>
        </section>
      </SiteShell>
    );
  }

  const active = productions.filter((item) => !['completed', 'cancelled', 'archived'].includes(item.status));
  const casting = productions.filter((item) => item.status === 'casting');
  const upcoming = upcomingResult.error ? [] : upcomingResult.productions;

  return (
    <SiteShell>
      <div className="space-y-7">
        <section className="rounded-[28px] bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">Casting Attual 360</p>
              <h1 className="mt-3 text-3xl font-black">Produções</h1>
              <p className="mt-3 max-w-2xl text-white/80">A raiz operacional para convocações, shortlists, agenda, check-in e integração com o ATTUAL ONE.</p>
            </div>
            <Link href="/admin/producoes/nova" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy">Nova produção</Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm font-bold uppercase tracking-wider text-slate-500">Ativas</p><p className="mt-2 text-4xl font-black text-navy">{active.length}</p></div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm font-bold uppercase tracking-wider text-slate-500">Em casting</p><p className="mt-2 text-4xl font-black text-navy">{casting.length}</p></div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft"><p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total</p><p className="mt-2 text-4xl font-black text-navy">{productions.length}</p></div>
        </section>

        {upcoming.length > 0 && (
          <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft">
            <h2 className="text-xl font-black text-navy">Próximas produções</h2>
            <div className="mt-5 grid gap-3">
              {upcoming.map((production) => (
                <Link key={production.id} href={`/admin/producoes/${production.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 px-5 py-4 hover:border-blue/30">
                  <div><p className="font-black text-navy">{production.name}</p><p className="text-sm text-slate-500">{production.client_name || 'Projeto interno'} · {production.city || (production.is_remote ? 'Remoto' : 'Local a definir')}</p></div>
                  <span className="text-sm font-bold text-blue">{formatDate(production.starts_at)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft">
          <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-black text-navy">Todas as produções</h2><span className="text-sm font-semibold text-slate-500">{productions.length} registro(s)</span></div>
          {productions.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center"><p className="font-bold text-navy">Nenhuma produção cadastrada.</p><p className="mt-2 text-sm text-slate-500">A estrutura está pronta para receber a primeira.</p></div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Produção</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Data</th><th className="px-3 py-3">Local</th><th className="px-3 py-3">Status</th></tr></thead>
                <tbody>
                  {productions.map((production) => (
                    <tr key={production.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-4"><Link href={`/admin/producoes/${production.id}`} className="font-black text-navy hover:text-blue">{production.name}</Link><p className="mt-1 text-xs text-slate-500">{production.client_name || production.project_reference || 'Projeto interno'}</p></td>
                      <td className="px-3 py-4 font-semibold text-slate-700">{PRODUCTION_TYPE_LABELS[production.production_type]}</td>
                      <td className="px-3 py-4 text-slate-600">{formatDate(production.starts_at)}</td>
                      <td className="px-3 py-4 text-slate-600">{production.is_remote ? 'Remoto' : [production.city, production.state].filter(Boolean).join(' / ') || 'A definir'}</td>
                      <td className="px-3 py-4"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-navy">{PRODUCTION_STATUS_LABELS[production.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SiteShell>
  );
}
