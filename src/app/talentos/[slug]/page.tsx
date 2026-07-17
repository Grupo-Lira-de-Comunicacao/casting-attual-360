import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { demoTalents } from '@/data/demo-data';

export function generateStaticParams() {
  return demoTalents.map((talent) => ({ slug: talent.slug }));
}

export default async function TalentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const talent = demoTalents.find((item) => item.slug === slug);

  if (!talent) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Perfil do talento</p>
        <h1 className="mt-3 text-3xl font-black text-navy">{talent.name}</h1>
        <p className="mt-2 text-lg text-slate-600">{talent.role}</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
          <div className="space-y-4">
            <p className="text-slate-600">{talent.description}</p>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-navy">Especialidade</p>
              <p className="mt-2 text-slate-600">{talent.specialty}</p>
            </div>
          </div>
          <div className="rounded-[24px] bg-gradient-to-br from-navy via-blue to-teal p-6 text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Resumo</p>
            <p className="mt-3 text-lg font-semibold">{talent.highlight}</p>
            <p className="mt-4 text-sm text-white/80">{talent.availability}</p>
            <p className="mt-4 text-sm text-white/80">{talent.location}</p>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
