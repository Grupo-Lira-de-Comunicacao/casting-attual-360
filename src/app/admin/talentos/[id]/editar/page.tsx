import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { TalentForm } from '@/components/admin/talent-form';
import { TelegramLinkCard } from '@/components/admin/telegram-link-card';
import { requireAdminPage } from '@/lib/admin';
import { getAdminTalent } from '@/lib/talents/queries';
import { updateTalent } from '../../actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string }>;
};

export default async function EditTalentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = (await searchParams) ?? {};
  const access = await requireAdminPage(`/admin/talentos/${id}/editar`);

  if (!access.structureInstalled || !access.isAdmin) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950">
          <h1 className="text-3xl font-black">Gestão ainda não autorizada</h1>
          <p className="mt-4">A estrutura do banco e a autorização administrativa precisam estar ativas.</p>
        </section>
      </SiteShell>
    );
  }

  const { talent, photoUrl, error } = await getAdminTalent(id);
  if (error) {
    return (
      <SiteShell>
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950">
          <h1 className="text-3xl font-black">Não foi possível carregar o talento</h1>
          <p className="mt-4">Verifique se a migration e as políticas administrativas foram aplicadas.</p>
        </section>
      </SiteShell>
    );
  }
  if (!talent) notFound();

  const talentName = talent.nome_artistico || talent.nome;

  return (
    <SiteShell>
      <div className="space-y-6">
        <div>
          <Link href="/admin/talentos" className="font-bold text-teal">← Voltar aos talentos</Link>
          <h1 className="mt-4 text-4xl font-black">Editar {talentName}</h1>
        </div>
        {query.saved && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800">
            {query.saved === 'created' ? 'Talento criado' : 'Alterações salvas'} com sucesso.
          </p>
        )}
        <TelegramLinkCard talentId={talent.id} talentName={talentName} />
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 text-navy shadow-soft sm:p-8">
          <TalentForm action={updateTalent} talent={talent} currentPhotoUrl={photoUrl} />
        </section>
      </div>
    </SiteShell>
  );
}
