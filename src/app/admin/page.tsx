import { SiteShell } from '@/components/site-shell';
import { AdminPanel } from '@/components/admin-panel';

export default function AdminPage() {
  return (
    <SiteShell>
      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Painel básico</p>
          <h1 className="mt-3 text-3xl font-black">Painel administrativo demonstrativo</h1>
          <p className="mt-3 max-w-2xl text-white/80">
            Estrutura inicial para mostrar métricas e status do projeto, com dados provisórios identificados no código.
          </p>
        </div>
        <AdminPanel />
      </div>
    </SiteShell>
  );
}
