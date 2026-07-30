import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { TalentManagement } from '@/components/admin/talent-management';
import { requireAdminPage } from '@/lib/admin';
import { getAdminTalents } from '@/lib/talents/queries';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{ status?: string; error?: string }>;
};

export default async function AdminTalentsPage({ searchParams }: PageProps) {
  const access = await requireAdminPage('/admin/talentos');
  const params = (await searchParams) ?? {};

  if (!access.structureInstalled) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-700">Banco ainda não preparado</p>
          <h1 className="mt-3 text-3xl font-black">Gestão de talentos aguardando instalação</h1>
          <p className="mt-4 max-w-3xl leading-7">Aplique primeiro <code>supabase/migrations/002_create_talents.sql</code>, cadastre o administrador em <code>public.admin_users</code> e execute o seed aprovado. O catálogo público continuará usando os 16 perfis demonstrativos enquanto isso.</p>
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
          <p className="mt-4">A sessão é válida, mas não existe autorização correspondente em <code>public.admin_users</code>.</p>
        </section>
      </SiteShell>
    );
  }

  const { talents, error } = await getAdminTalents();

  if (error) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <h1 className="text-3xl font-black">Estrutura de talentos indisponível</h1>
          <p className="mt-4 leading-7">A migration ou as permissões do banco ainda não estão prontas. Nenhuma alteração foi realizada.</p>
          <p className="mt-4 text-sm font-semibold">Código da consulta: {error.code || 'indisponível'}</p>
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
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">Painel administrativo</p>
              <h1 className="mt-3 text-3xl font-black">Gestão de talentos</h1>
              <p className="mt-3 max-w-2xl text-white/80">Edite perfis, fotos, destaques, ordem e disponibilidade sem alterar o código.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-bold">Solicitações</Link>
              <Link href="/admin/talentos/novo" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy">Novo talento</Link>
            </div>
          </div>
        </section>

        {params.status && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            Perfil {params.status === 'activated' ? 'ativado' : 'desativado'} com sucesso.
          </p>
        )}
        {params.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
            Não foi possível concluir a ação solicitada.
          </p>
        )}

        {talents.length === 0 ? (
          <section className="rounded-[28px] border border-slate-200 bg-white p-8 text-navy shadow-soft">
            <h2 className="text-2xl font-black">Nenhum talento importado</h2>
            <p className="mt-3 text-slate-600">A tabela existe, mas está vazia. Execute o seed aprovado para importar os 16 perfis sem sobrescrever registros existentes.</p>
          </section>
        ) : (
          <TalentManagement talents={talents} />
        )}
      </div>
    </SiteShell>
  );
}

