import { redirect } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { createClient } from '@/lib/supabase/server';
import type { RequestRecord, RequestStatus, RequestType } from '@/types/request';

export const dynamic = 'force-dynamic';

const statusLabel: Record<RequestStatus, string> = {
  novo: 'Novo',
  em_analise: 'Em análise',
  contatado: 'Contatado',
  arquivado: 'Arquivado',
};

const typeLabel: Record<RequestType, string> = {
  empresa: 'Empresa',
  talento: 'Talento',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login?next=/admin');
  }

  const { data, error } = await supabase
    .from('requests')
    .select('id, created_at, request_type, name, email, organization, message, status, is_test')
    .order('created_at', { ascending: false });

  const requests = (data ?? []) as RequestRecord[];
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
              <h1 className="mt-3 text-3xl font-black">Solicitações recebidas</h1>
              <p className="mt-3 max-w-2xl text-white/80">
                Listagem protegida por Supabase Auth com registros reais da tabela public.requests.
              </p>
            </div>
            <form action={signOut}>
              <button className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">
                Sair
              </button>
            </form>
          </div>
          <p className="mt-6 text-sm text-white/70">Usuário autenticado: {user.email}</p>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Acesso ao banco bloqueado</p>
            <h2 className="mt-2 text-2xl font-black">Não foi possível listar public.requests</h2>
            <p className="mt-3 leading-7">
              O login funcionou, mas o Supabase negou a consulta. Como solicitado, nenhuma política foi alterada
              automaticamente. Revise as policies/grants de SELECT para usuários administrativos autenticados antes de
              liberar a listagem.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-amber-100 p-4 text-sm">{error.message}</pre>
          </section>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => (
                <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 text-navy shadow-soft">
                  <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-black">{item.value}</p>
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white text-navy shadow-soft">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">public.requests</p>
                  <h2 className="text-2xl font-black">Registros reais</h2>
                </div>
                <span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-semibold text-teal">
                  {requests.length} registro{requests.length === 1 ? '' : 's'}
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="p-8 text-slate-600">
                  Nenhuma solicitação encontrada no Supabase para a sessão autenticada atual.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {requests.map((request) => (
                    <article key={request.id} className="grid gap-4 p-6 xl:grid-cols-[1fr_.8fr_.65fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-blue">
                            {typeLabel[request.request_type]}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {statusLabel[request.status]}
                          </span>
                          {request.is_test && (
                            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-navy">
                              Teste
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 text-xl font-black">{request.name}</h3>
                        <p className="mt-2 line-clamp-3 text-slate-600">{request.message}</p>
                      </div>

                      <div className="grid content-start gap-2 text-sm text-slate-600">
                        <p>
                          <span className="font-bold text-navy">Email:</span> {request.email}
                        </p>
                        <p>
                          <span className="font-bold text-navy">Empresa/talento:</span> {request.organization}
                        </p>
                      </div>

                      <div className="text-sm text-slate-500 xl:text-right">
                        <p className="font-mono">#{request.id}</p>
                        <p className="mt-2">{formatDate(request.created_at)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </SiteShell>
  );
}
