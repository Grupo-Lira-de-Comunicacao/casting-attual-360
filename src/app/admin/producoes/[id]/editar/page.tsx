import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { ProductionForm } from '@/components/admin/production-form';
import { requireAdminPage } from '@/lib/admin';
import { getAdminProduction } from '@/lib/productions/queries';
import { updateProduction } from '../../actions';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductionPage({ params }: PageProps) {
  const { id } = await params;
  const access = await requireAdminPage(`/admin/producoes/${id}/editar`);

  if (!access.structureInstalled || !access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-red-950 shadow-soft">
          <h1 className="text-3xl font-black">Acesso indisponível</h1>
          <p className="mt-4">A estrutura de Produções precisa estar instalada e sua conta precisa ter permissão administrativa.</p>
        </section>
      </SiteShell>
    );
  }

  const { production, error } = await getAdminProduction(id);
  if (error) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-soft">
          <h1 className="text-3xl font-black">Não foi possível editar a produção</h1>
          <p className="mt-4">Verifique a conexão com o Supabase e tente novamente.</p>
        </section>
      </SiteShell>
    );
  }
  if (!production) notFound();

  const action = updateProduction.bind(null, production.id);

  return (
    <SiteShell>
      <div className="space-y-7">
        <div><Link href={`/admin/producoes/${production.id}`} className="font-bold text-teal">← Voltar à produção</Link></div>
        <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-teal">Produções</p>
          <h1 className="mt-3 text-3xl font-black text-navy">Editar {production.name}</h1>
          <p className="mt-3 max-w-3xl text-slate-600">Atualize os dados operacionais. A mudança será sincronizada com o ATTUAL ONE pela fila de integração existente.</p>
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft">
          <ProductionForm action={action} production={production} submitLabel="Salvar alterações" />
        </section>
      </div>
    </SiteShell>
  );
}
