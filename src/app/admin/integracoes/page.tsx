import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { IntegrationMetricsDashboard } from '@/components/admin/integration-metrics-dashboard';
import { IntegrationResilienceStatus } from '@/components/admin/integration-resilience-status';
import { requireAdminPage } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const FLOW = [
  {
    step: '01',
    title: 'Casting 360',
    detail: 'Gera os eventos operacionais da integração.',
    badge: 'Origem',
  },
  {
    step: '02',
    title: 'Fila de eventos',
    detail: 'Mantém pendências, tentativas, falhas e reprocessamentos auditáveis.',
    badge: 'Fila',
  },
  {
    step: '03',
    title: 'Dispatcher VPS',
    detail: 'Executa periodicamente e chama o Casting com assinatura Ed25519.',
    badge: 'Transporte',
  },
  {
    step: '04',
    title: 'ATTUAL ONE',
    detail: 'Recebe o evento, registra a inbox e atualiza a projeção do convite.',
    badge: 'Destino',
  },
];

export default async function AdminIntegrationsPage() {
  const access = await requireAdminPage('/admin/integracoes');

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">Integrações</p>
          <h1 className="mt-3 text-3xl font-black">Central aguardando preparação do banco</h1>
          <p className="mt-4 max-w-3xl leading-7">A estrutura administrativa e as migrations de integração precisam estar disponíveis antes de usar esta área.</p>
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
          <p className="mt-4">A central de integrações é restrita aos administradores do Casting Attual 360.</p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="space-y-7">
        <section className="rounded-[28px] bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">Casting Attual 360 + ATTUAL ONE</p>
              <h1 className="mt-3 text-3xl font-black">Central de integrações</h1>
              <p className="mt-3 max-w-3xl text-white/80">Uma visão única para entender o caminho dos eventos, acompanhar a saúde da ponte e chegar rapidamente à fila operacional.</p>
            </div>
            <Link href="/admin" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold">← Painel administrativo</Link>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue">Mapa da conexão</p>
              <h2 className="mt-1 text-2xl font-black text-navy">Casting 360 → fila → VPS → ATTUAL ONE</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Este mapa mostra a arquitetura operacional. O estado real da fila e das entregas aparece nos indicadores logo abaixo.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/integracoes/eventos" className="rounded-full bg-navy px-5 py-2.5 text-sm font-bold text-white">Abrir protocolo de eventos</Link>
              <Link href="/admin/integracoes/metricas" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-navy">Métricas detalhadas</Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-4">
            {FLOW.map((item, index) => (
              <div key={item.step} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Etapa {item.step}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue shadow-sm">{item.badge}</span>
                </div>
                <h3 className="mt-4 text-xl font-black text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                {index < FLOW.length - 1 && <span aria-hidden className="mt-4 inline-flex text-xl font-black text-blue lg:absolute lg:-right-3 lg:top-1/2 lg:z-10 lg:-translate-y-1/2 lg:rounded-full lg:bg-white lg:px-1">→</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
            <p className="text-xs font-black uppercase tracking-[0.18em]">Operação normal</p>
            <h3 className="mt-2 text-lg font-black">Processado</h3>
            <p className="mt-1 text-sm leading-6">O evento saiu da fila e foi aceito pelo ATTUAL ONE.</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <p className="text-xs font-black uppercase tracking-[0.18em]">Acompanhar</p>
            <h3 className="mt-2 text-lg font-black">Pendente / Processando</h3>
            <p className="mt-1 text-sm leading-6">O evento ainda está na esteira. A central mostra tentativas e tempo de espera.</p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950">
            <p className="text-xs font-black uppercase tracking-[0.18em]">Intervenção</p>
            <h3 className="mt-2 text-lg font-black">Falhou / Cancelado</h3>
            <p className="mt-1 text-sm leading-6">Abra o evento para identificar o erro e reprocessar somente quando ele for elegível.</p>
          </div>
        </section>

        <IntegrationResilienceStatus />
        <IntegrationMetricsDashboard />
      </div>
    </SiteShell>
  );
}
