import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { IntegrationEventsDashboard } from '@/components/admin/integration-events-dashboard';
import { requireAdminPage } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function AdminIntegrationEventsPage() {
  const access = await requireAdminPage('/admin/integracoes/eventos');

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">Banco ainda não preparado</p>
          <h1 className="mt-3 text-3xl font-black">Central de integrações aguardando instalação</h1>
          <p className="mt-4 max-w-3xl leading-7">Aplique as migrations de integrações, incluindo <code>003_create_integrations.sql</code> e <code>005_add_integration_event_audit.sql</code>, antes de usar esta área.</p>
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
          <p className="mt-4">A sessão é válida, mas não possui autorização para consultar eventos de integração.</p>
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
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">Integração ATTUAL ONE</p>
              <h1 className="mt-3 text-3xl font-black">Central de eventos</h1>
              <p className="mt-3 max-w-3xl text-white/80">Acompanhe a fila do Telegram e do Casting, inspecione payloads, identifique falhas e reenvie somente os eventos elegíveis.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold">Solicitações</Link>
              <Link href="/admin/talentos" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy">Talentos</Link>
            </div>
          </div>
        </section>

        <IntegrationEventsDashboard />
      </div>
    </SiteShell>
  );
}
