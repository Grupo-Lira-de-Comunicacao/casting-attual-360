import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { PackageCard } from '@/components/package-card';
import { demoPackages } from '@/data/demo-data';

export default function PackagesPage() {
  return (
    <SiteShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Soluções para marcas"
          title="Da primeira presença à campanha 360°"
          description="Formatos demonstrativos pensados para empresas, profissionais e projetos culturais do Vale do Paraíba. Cada campanha será adaptada ao objetivo, ao público e ao orçamento do cliente."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {demoPackages.map((pkg) => (
            <PackageCard key={pkg.slug} pkg={pkg} />
          ))}
        </div>

        <section className="grid gap-6 rounded-[30px] border border-white/10 bg-gradient-to-br from-[#092746] to-[#041628] p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.25em] text-teal">Projeto sob medida</p>
            <h2 className="mt-3 text-3xl font-black">Sua campanha não precisa caber numa caixinha.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">A curadoria combina talentos, fotografia, vídeo, apresentação, influência e mídia regional conforme a necessidade real da marca.</p>
          </div>
          <Link href="/empresas" className="rounded-full bg-gradient-to-r from-blue to-teal px-7 py-4 text-center font-bold text-white shadow-[0_12px_32px_-16px_#19c7c5] transition hover:brightness-110">
            Solicitar proposta
          </Link>
        </section>

        <p className="text-center text-sm text-slate-500">Valores e condições exibidos nesta fase são referências demonstrativas e serão definidos após briefing.</p>
      </div>
    </SiteShell>
  );
}
