import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { RequestManagement } from '@/components/admin/request-management';
import { requireAdminPage } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import type { RequestHistoryEntry, RequestRecord } from '@/types/request';

export const dynamic = 'force-dynamic';

export default async function RequestsAdminPage() {
  const access = await requireAdminPage('/admin/solicitacoes');

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Estrutura administrativa pendente</p>
          <h1 className="mt-3 text-3xl font-black">A área de solicitações ainda não está disponível</h1>
          <p className="mt-4 max-w-3xl leading-7">A autenticação está válida, mas a estrutura administrativa do Casting 360 ainda precisa estar instalada no banco.</p>
        </section>
      </SiteShell>
    );
  }

  if (!access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-950 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-700">Acesso restrito</p>
          <h1 className="mt-3 text-3xl font-black">Conta sem permissão administrativa</h1>
          <p className="mt-4 leading-7">Esta área é exclusiva para administradores autorizados do Casting Attual 360.</p>
        </section>
      </SiteShell>
    );
  }

  const supabase = await createClient();
  const { data: requests, error: requestsError } = await supabase
    .from('requests')
    .select('id, created_at, updated_at, request_type, name, email, organization, message, status, is_test, assigned_to, internal_notes')
    .order('created_at', { ascending: false });

  if (requestsError) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Banco ainda não homologado</p>
          <h1 className="mt-3 text-3xl font-black">A migration de gestão de solicitações precisa ser aplicada</h1>
          <p className="mt-4 max-w-3xl leading-7">O painel está preparado, mas os campos administrativos e o histórico ainda não foram encontrados no banco conectado.</p>
          <Link href="/admin" className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 text-sm font-bold text-white">Voltar ao painel</Link>
        </section>
      </SiteShell>
    );
  }

  const { data: history, error: historyError } = await supabase
    .from('request_history')
    .select('id, request_id, changed_at, changed_by_email, changes')
    .order('changed_at', { ascending: false });

  return (
    <SiteShell>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Casting Attual 360</p>
              <h1 className="mt-3 text-3xl font-black">Solicitações de talentos e empresas</h1>
              <p className="mt-3 max-w-3xl text-white/80">Acompanhe cadastros, briefings, responsáveis, status e histórico de atendimento em uma única fila.</p>
            </div>
            <Link href="/admin" className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20">Voltar ao painel</Link>
          </div>
        </section>

        {historyError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            A fila está disponível, mas o histórico de alterações não pôde ser carregado neste momento.
          </div>
        )}

        <RequestManagement
          requests={(requests ?? []) as RequestRecord[]}
          history={(history ?? []) as RequestHistoryEntry[]}
        />
      </div>
    </SiteShell>
  );
}
