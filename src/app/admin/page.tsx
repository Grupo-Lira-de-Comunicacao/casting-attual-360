import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { requireAdminPage } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { getAdminTalents } from '@/lib/talents/queries';

export const dynamic = 'force-dynamic';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export default async function AdminPage() {
  const access = await requireAdminPage('/admin');

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Estrutura administrativa pendente</p>
          <h1 className="mt-3 text-3xl font-black">A migration de talentos ainda não foi instalada</h1>
          <p className="mt-4 max-w-3xl leading-7">Sua autenticação está válida, mas o painel exige também um registro correspondente em <code>public.admin_users</code>. Aplique a migration aprovada e autorize o primeiro administrador antes de usar as áreas de gestão.</p>
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
          <p className="mt-4 leading-7">O usuário está autenticado, mas não possui um registro em <code>public.admin_users</code>.</p>
        </section>
      </SiteShell>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login?next=/admin');

  const { talents, error } = await getAdminTalents();
  const total = talents.length;
  const active = talents.filter((talent) => talent.ativo).length;
  const featured = talents.filter((talent) => talent.destaque).length;
  const inactive = total - active;

  return (
    <SiteShell>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Painel administrativo</p>
              <h1 className="mt-3 text-3xl font-black">Visão geral do Casting Attual 360</h1>
              <p className="mt-3 max-w-2xl text-white/80">Acompanhe os talentos cadastrados e acesse rapidamente as áreas disponíveis da plataforma.</p>
            </div>
            <form action={signOut}><button className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Sair</button></form>
          </div>
          <p className="mt-6 text-sm text-white/70">Administrador autorizado: {user.email}</p>
        </section>

        {error ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Atenção</p>
            <h2 className="mt-2 text-2xl font-black">Não foi possível carregar os indicadores</h2>
            <p className="mt-3 leading-7">A gestão de talentos continua disponível pelo botão abaixo.</p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Talentos cadastrados', value: total },
              { label: 'Ativos', value: active },
              { label: 'Em destaque', value: featured },
              { label: 'Inativos', value: inactive },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 text-navy shadow-soft">
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.value}</p>
              </div>
            ))}
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 text-navy shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue">Talentos</p>
            <h2 className="mt-3 text-2xl font-black">Gerenciar catálogo</h2>
            <p className="mt-3 leading-7 text-slate-600">Cadastre, edite, destaque, ordene e altere a disponibilidade dos profissionais.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/talentos" className="rounded-full bg-blue px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">Gerenciar talentos</Link>
              <Link href="/admin/talentos/novo" className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-navy transition hover:bg-slate-50">Novo talento</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-teal/30 bg-teal/10 p-7 text-navy shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal">Categorias</p>
            <h2 className="mt-3 text-2xl font-black">Filtros profissionais</h2>
            <p className="mt-3 leading-7 text-slate-600">Crie, edite, ordene, ative, desative ou exclua as categorias exibidas em “Buscar profissional”.</p>
            <Link href="/admin/categorias" className="mt-6 inline-flex rounded-full bg-teal px-5 py-3 text-sm font-bold text-navy transition hover:opacity-90">Gerenciar categorias</Link>
          </div>

          <div className="rounded-[28px] border border-sky-200 bg-sky-50 p-7 text-navy shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue">Telegram + ATTUAL ONE</p>
            <h2 className="mt-3 text-2xl font-black">Integrações</h2>
            <p className="mt-3 leading-7 text-slate-600">Acompanhe a saúde da ponte, consulte a fila, veja erros e reenvie eventos falhos ou cancelados.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin/integracoes/metricas" className="inline-flex rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">Ver métricas</Link>
              <Link href="/admin/integracoes/eventos" className="inline-flex rounded-full border border-sky-300 bg-white px-5 py-3 text-sm font-bold text-navy transition hover:bg-sky-100">Abrir central</Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-7 text-navy shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Próxima fase</p>
            <h2 className="mt-3 text-2xl font-black">Solicitações públicas</h2>
            <p className="mt-3 leading-7 text-slate-600">O módulo de inscrições, análise e aprovação será ativado após a criação e validação da estrutura <code>public.requests</code>.</p>
            <span className="mt-6 inline-flex rounded-full bg-slate-200 px-4 py-2 text-sm font-bold text-slate-600">Em breve</span>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
