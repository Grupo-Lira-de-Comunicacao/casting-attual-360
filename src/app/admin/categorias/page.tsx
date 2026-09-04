import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProfessionalCategories } from '@/lib/professional-categories';
import { createProfessionalCategory, deleteProfessionalCategory, updateProfessionalCategory } from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function AdminCategoriesPage({ searchParams }: PageProps) {
  const access = await requireAdminPage('/admin/categorias');
  const params = await searchParams;

  if (!access.structureInstalled || !access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-950 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-700">Acesso restrito</p>
          <h1 className="mt-3 text-3xl font-black">Área administrativa indisponível</h1>
          <p className="mt-4 leading-7">Sua conta precisa estar autorizada em <code>public.admin_users</code>.</p>
        </section>
      </SiteShell>
    );
  }

  const { categories, structureInstalled } = await getAdminProfessionalCategories();

  return (
    <SiteShell>
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-navy via-blue to-teal p-8 text-white shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Administração</p>
              <h1 className="mt-3 text-3xl font-black">Categorias profissionais</h1>
              <p className="mt-3 max-w-3xl text-white/80">Crie, edite, reordene, ative, desative ou exclua os filtros exibidos em “Buscar profissional”.</p>
            </div>
            <Link href="/admin" className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Voltar ao painel</Link>
          </div>
        </section>

        {params.ok && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-900">{params.ok}</div>}
        {params.error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-900">{params.error}</div>}

        {!structureInstalled ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Migration pendente</p>
            <h2 className="mt-2 text-2xl font-black">A tabela de categorias ainda não foi instalada</h2>
            <p className="mt-3 leading-7">O código administrativo está pronto, mas a edição será liberada após a aplicação da migration <code>013_create_professional_categories.sql</code>.</p>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-slate-200 bg-white p-7 text-navy shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue">Nova categoria</p>
              <h2 className="mt-2 text-2xl font-black">Adicionar filtro</h2>
              <form action={createProfessionalCategory} className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_2fr_120px_auto] lg:items-end">
                <label className="text-sm font-bold text-slate-700">Nome
                  <input name="name" required minLength={2} maxLength={80} placeholder="Ex.: Música" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue" />
                </label>
                <label className="text-sm font-bold text-slate-700">Termos associados
                  <input name="aliases" placeholder="música, cantor, cantora, banda" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue" />
                </label>
                <label className="text-sm font-bold text-slate-700">Ordem
                  <input name="order" type="number" min={0} max={9999} defaultValue={110} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue" />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><input name="active" type="checkbox" defaultChecked /> Ativa</label>
                  <button className="rounded-full bg-blue px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">Criar categoria</button>
                </div>
              </form>
              <p className="mt-3 text-xs text-slate-500">Separe aliases por vírgula. O próprio nome da categoria também é considerado na busca.</p>
            </section>

            <section className="space-y-4">
              {categories.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-soft">Nenhuma categoria cadastrada.</div>
              ) : categories.map((category) => (
                <div key={category.id} className="rounded-[24px] border border-slate-200 bg-white p-6 text-navy shadow-soft">
                  <form action={updateProfessionalCategory} className="grid gap-4 lg:grid-cols-[1.1fr_2fr_100px_auto] lg:items-end">
                    <input type="hidden" name="id" value={category.id} />
                    <label className="text-sm font-bold text-slate-700">Nome
                      <input name="name" required minLength={2} maxLength={80} defaultValue={category.name} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue" />
                    </label>
                    <label className="text-sm font-bold text-slate-700">Termos associados
                      <input name="aliases" defaultValue={category.aliases.join(', ')} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue" />
                    </label>
                    <label className="text-sm font-bold text-slate-700">Ordem
                      <input name="order" type="number" min={0} max={9999} defaultValue={category.order} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-medium outline-none focus:border-blue" />
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><input name="active" type="checkbox" defaultChecked={category.active} /> Ativa</label>
                      <button className="rounded-full bg-navy px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">Salvar</button>
                    </div>
                  </form>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className={`rounded-full px-3 py-1 font-bold ${category.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{category.active ? 'Ativa no site' : 'Desativada'}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold">slug: {category.slug}</span>
                    </div>
                    <form action={deleteProfessionalCategory}>
                      <input type="hidden" name="id" value={category.id} />
                      <button className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50">Excluir categoria</button>
                    </form>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </SiteShell>
  );
}
