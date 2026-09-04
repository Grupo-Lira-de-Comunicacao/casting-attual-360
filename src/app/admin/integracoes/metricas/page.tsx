import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { IntegrationMetricsDashboard } from '@/components/admin/integration-metrics-dashboard';
import { IntegrationResilienceStatus } from '@/components/admin/integration-resilience-status';
import { requireAdminPage } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminIntegrationMetricsPage() {
  const access = await requireAdminPage('/admin/integracoes/metricas');

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <h1 className="text-3xl font-black">Métricas aguardando preparação do banco</h1>
          <p className="mt-4">Aplique as migrations de integrações até a versão 012 antes de usar esta área.</p>
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

  return (
    <SiteShell>
      <div className="space-y-7">
        <section className="rounded-[28px] bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">Casting Attual 360 + ATTUAL ONE</p>
          <h1 className="mt-3 text-3xl font-black">Dashboard executivo de integrações</h1>
          <p className="mt-3 max-w-3xl text-white/80">Indicadores operacionais, desempenho, falhas recentes e saúde geral do fluxo entre Telegram, Casting e ATTUAL ONE.</p>
          <Link href="/admin/integracoes/eventos" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy">Abrir protocolo de eventos</Link>
        </section>

        <IntegrationResilienceStatus />
        <IntegrationMetricsDashboard />
      </div>
    </SiteShell>
  );
}
