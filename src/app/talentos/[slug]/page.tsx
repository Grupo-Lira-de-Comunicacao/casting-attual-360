import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/site-shell';
import { TalentImage } from '@/components/talent-image';
import { getPublicTalentBySlug } from '@/lib/talents/queries';

export const dynamic = 'force-dynamic';

export default async function TalentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { talent } = await getPublicTalentBySlug(slug);

  if (!talent) notFound();

  return (
    <SiteShell>
      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[#061b30] shadow-[0_28px_90px_-45px_rgba(25,199,197,0.65)]">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[430px] lg:min-h-[620px]">
            <TalentImage src={talent.image} alt={`Retrato de ${talent.name}`} priority sizes="(min-width: 1024px) 46vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061b30] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#061b30]/25" />
            {talent.isDemo && <span className="absolute left-5 top-5 rounded-full bg-gold px-4 py-2 text-xs font-black text-navy">PERFIL DEMONSTRATIVO</span>}
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <Link href="/talentos" className="text-sm font-semibold text-teal transition hover:text-white">← Voltar ao catálogo</Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-blue">{talent.category}</p>
            <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">{talent.name}</h1>
            <p className="mt-3 text-xl text-white/75">{talent.role}</p>
            <p className="mt-2 text-sm font-semibold text-teal">{talent.location}</p>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300">{talent.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Especialidade</p>
                <p className="mt-2 font-semibold text-white">{talent.specialty}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Destaque</p>
                <p className="mt-2 font-semibold text-white">{talent.highlight}</p>
              </div>
            </div>
            <p className="mt-6 rounded-2xl border border-teal/25 bg-teal/10 px-5 py-4 font-semibold text-teal">{talent.availability}</p>
          </div>
        </div>

        <section className="border-t border-white/10 p-7 sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Portfólio visual</p>
              <h2 className="mt-2 text-3xl font-black text-white">Galeria de apresentação</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">{talent.isDemo ? 'Conteúdo e imagens fictícios, criados exclusivamente para demonstrar a experiência do catálogo.' : 'Imagem disponibilizada e controlada pela equipe do Casting Attual 360.'}</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {talent.gallery.map((image, index) => (
              <div key={image} className="relative aspect-[4/5] overflow-hidden rounded-[22px] border border-white/10 bg-white/5">
                <TalentImage src={image} alt={`Foto ${index + 1} de ${talent.name}`} sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition duration-500 hover:scale-[1.03]" />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 border-t border-white/10 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:p-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Vídeo demonstrativo</p>
            <h2 className="mt-2 text-2xl font-black text-white">Apresentação em vídeo em breve</h2>
            <p className="mt-2 text-slate-400">O espaço está preparado para receber o material real do profissional sem usar vídeos de terceiros.</p>
          </div>
          <Link href="/para-empresas" className="inline-flex rounded-full bg-gradient-to-r from-blue to-teal px-6 py-3 font-bold text-white transition hover:brightness-110">Quero criar uma campanha</Link>
        </section>
      </article>
    </SiteShell>
  );
}
