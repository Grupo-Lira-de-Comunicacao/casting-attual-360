import { redirect } from 'next/navigation';
import { RequestManagement } from '@/components/admin/request-management';
import { SiteShell } from '@/components/site-shell';
import { createClient } from '@/lib/supabase/server';
import type { RequestHistoryEntry, RequestRecord, RequestStatus } from '@/types/request';

export const dynamic = 'force-dynamic';

function countByStatus(requests: RequestRecord[], status: RequestStatus) {
  return requests.filter((request) => request.status === status).length;
}

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=/admin');

  const [{ data, error }, { data: historyData, error: historyError }] = await Promise.all([
    supabase
      .from('requests')
      .select('id, created_at, updated_at, request_type, name, email, organization, message, status, is_test, assigned_to, internal_notes')
      .order('created_at', { ascending: false }),
    supabase
      .from('request_admin_history')
      .select('id, request_id, changed_at, changed_by_email, changes')
      .order('changed_at', { ascending: false })
      .limit(200),
  ]);

  const requests = (data ?? []) as RequestRecord[];
  const history = (historyData ?? []) as RequestHistoryEntry[];
  const loadError = error ?? historyError;
  const metrics = [
    { label: 'Solicitações', value: requests.length },
    { label: 'Novas', value: countByStatus(requests, 'novo') },
    { label: 'Em análise', value: countByStatus(requests, 'em_analise') },
    { label: 'Contatadas', value: countByStatus(requests, 'contatado') },
  ];

  return (
    <SiteShell>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Painel administrativo</p>
              <h1 className="mt-3 text-3xl font-black">Gestão completa de solicitações</h1>
              <p className="mt-3 max-w-2xl text-white/80">Corrija dados administrativos, atribua responsáveis e acompanhe cada alteração com auditoria.</p>
            </div>
            <form action={signOut}><button className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Sair</button></form>
          </div>
          <p className="mt-6 text-sm text-white/70">Usuário autenticado: {user.email}</p>
        </section>

        {loadError ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Estrutura da Fase 6 pendente</p>
            <h2 className="mt-2 text-2xl font-black">Não foi possível carregar a gestão completa</h2>
            <p className="mt-3 leading-7">O código está pronto, mas o SQL da Fase 6 precisa ser revisado e aprovado antes de habilitar os novos campos e o histórico.</p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-amber-100 p-4 text-sm">{loadError.message}</pre>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 text-navy shadow-soft"><p className="text-sm font-semibold text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-black">{item.value}</p></div>)}
            </section>
            {requests.length === 0 ? <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-slate-600 shadow-soft">Nenhuma solicitação encontrada.</section> : <RequestManagement requests={requests} history={history} />}
          </>
        )}
      </div>
    </SiteShell>
  );
}
