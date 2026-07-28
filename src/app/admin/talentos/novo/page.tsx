import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { TalentForm } from '@/components/admin/talent-form';
import { requireAdminPage } from '@/lib/admin';
import { createTalent } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewTalentPage() {
  const access = await requireAdminPage('/admin/talentos/novo');
  if (!access.structureInstalled || !access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950">
          <h1 className="text-3xl font-black">Gestão ainda não autorizada</h1>
          <p className="mt-4">A estrutura do banco e a autorização administrativa precisam estar ativas antes da criação de talentos.</p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="space-y-6">
        <div>
          <Link href="/admin/talentos" className="font-bold text-teal">← Voltar aos talentos</Link>
          <h1 className="mt-4 text-4xl font-black">Criar talento</h1>
        </div>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-navy shadow-soft sm:p-8">
          <TalentForm action={createTalent} />
        </section>
      </div>
    </SiteShell>
  );
}

