import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { ProductionForm } from '@/components/admin/production-form';
import { requireAdminPage } from '@/lib/admin';
import { createProduction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewProductionPage() {
  const access = await requireAdminPage('/admin/producoes/nova');

  if (!access.structureInstalled || !access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950">
          <h1 className="text-3xl font-black">Produções ainda não autorizadas</h1>
          <p className="mt-4">A estrutura do banco e a autorização administrativa precisam estar ativas antes da criação de produções.</p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="space-y-6">
        <div>
          <Link href="/admin/producoes" className="font-bold text-teal">← Voltar às produções</Link>
          <h1 className="mt-4 text-4xl font-black">Nova produção</h1>
          <p className="mt-2 text-slate-600">Crie primeiro a raiz do projeto. Convocações e seleção de talentos serão vinculadas a ela.</p>
        </div>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-navy shadow-soft sm:p-8">
          <ProductionForm action={createProduction} />
        </section>
      </div>
    </SiteShell>
  );
}
