import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { TalentCatalog } from '@/components/talent-catalog';
import { getPublicProfessionalCategories } from '@/lib/professional-categories';
import { getPublicTalents } from '@/lib/talents/queries';

export const dynamic = 'force-dynamic';

export default async function TalentsPage() {
  const [{ talents, usingFallback }, { categories }] = await Promise.all([
    getPublicTalents(),
    getPublicProfessionalCategories(),
  ]);

  return (
    <SiteShell>
      <div className="space-y-8">
        <SectionHeading eyebrow="Catálogo 360" title="Profissionais para diferentes histórias" description="Explore perfis demonstrativos por área de atuação e encontre referências para campanhas, eventos, conteúdo e produção audiovisual." />
        {usingFallback && <div className="rounded-2xl border border-gold/20 bg-gold/10 px-5 py-4 text-sm text-slate-200"><strong className="text-gold">Catálogo demonstrativo:</strong> os 16 perfis atuais permanecem disponíveis enquanto a estrutura real é preparada.</div>}
        {talents.length === 0 ? (
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-10 text-center text-slate-300">Nenhum talento ativo disponível no momento.</div>
        ) : (
          <TalentCatalog talents={talents} categories={categories} />
        )}
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Faça parte</p>
          <p className="mt-3 text-slate-300">A estrutura está preparada para receber cadastros reais de novos profissionais.</p>
          <Link href="/talentos/cadastrar" className="mt-4 inline-flex rounded-full bg-blue px-5 py-3 font-semibold text-white">Cadastrar novo talento</Link>
        </div>
      </div>
    </SiteShell>
  );
}
