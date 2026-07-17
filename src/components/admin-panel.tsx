import { adminMetrics } from '@/data/demo-data';

export function AdminPanel() {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Painel administrativo</p>
          <h2 className="text-2xl font-bold text-navy">Visão demo da operação</h2>
        </div>
        <span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-semibold text-teal">Dados provisórios</span>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Leads recebidos', value: adminMetrics.leads },
          { label: 'Projetos ativos', value: adminMetrics.activeProjects },
          { label: 'Talentos cadastrados', value: adminMetrics.registeredTalents },
          { label: 'Status de campanha', value: adminMetrics.campaignStatus },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-navy">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
