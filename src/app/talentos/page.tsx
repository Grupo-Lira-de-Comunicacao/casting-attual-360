import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { TalentCard } from '@/components/talent-card';
import { demoTalents } from '@/data/demo-data';

export default function TalentsPage() {
  return (
    <SiteShell>
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Catálogo"
          title="Talentos em destaque"
          description="Catálogo inicial com perfis demonstrativos, estrutura preparada para conectar marcas e talentos com facilidade."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {demoTalents.map((talent) => (
            <TalentCard key={talent.slug} talent={talent} />
          ))}
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Próximo passo</p>
          <p className="mt-3 text-slate-600">A navegação já está preparada para evoluir para uma base de dados real em Supabase.</p>
          <Link href="/talentos/cadastrar" className="mt-4 inline-flex rounded-full bg-blue px-5 py-3 font-semibold text-white">
            Cadastrar novo talento
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
