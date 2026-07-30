import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { TalentCard } from '@/components/talent-card';
import { CapiPlaceholder, MediaGlyph, PlatformPreview } from '@/components/home-visuals';
import { getFeaturedTalents } from '@/lib/talents/queries';

export const dynamic = 'force-dynamic';

const benefits = [
  { title: 'Conecte', text: 'Marcas e talentos em relações relevantes.', icon: 'people' as const },
  { title: 'Descubra', text: 'Perfis, vozes e formatos com aderência real.', icon: 'camera' as const },
  { title: 'Confiança', text: 'Curadoria, clareza e acompanhamento.', icon: 'play' as const },
  { title: 'Resultados', text: 'Presença regional que amplia o alcance.', icon: 'signal' as const },
];

const pillars = ['Foco regional', 'Parcerias reais', 'Diversidade', 'Visibilidade 360°', 'Segurança e ética'];

export default async function HomePage() {
  const { talents: featuredTalents, usingFallback } = await getFeaturedTalents();
  return (
    <SiteShell>
      <section className="relative min-h-[720px] overflow-hidden rounded-[36px] border border-white/10 bg-[#061b31] px-6 py-10 shadow-[0_40px_120px_-45px_rgba(15,111,255,.65)] sm:px-10 lg:grid lg:grid-cols-[1fr_.95fr] lg:items-center lg:gap-10 lg:px-14 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(15,111,255,.3),transparent_35%),radial-gradient(circle_at_85%_65%,rgba(25,199,197,.22),transparent_32%),radial-gradient(circle_at_65%_0%,rgba(255,179,71,.12),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-sm font-bold text-teal"><span className="h-2 w-2 rounded-full bg-teal shadow-[0_0_14px_#19c7c5]" /> Ecossistema de talentos e mídia</div>
          <p className="mt-7 text-lg font-black tracking-tight text-white sm:text-xl"><span className="bg-gradient-to-r from-blue via-teal to-gold bg-clip-text text-transparent">CASTING ATTUAL</span> 360</p>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-[-.04em] text-white sm:text-6xl lg:text-7xl">Escolha quem vai dar <span className="bg-gradient-to-r from-teal to-gold bg-clip-text text-transparent">voz, imagem e alcance</span> para sua marca</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Curadoria estratégica para campanhas que conectam relevância regional, criatividade e presença profissional.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/empresas" className="rounded-full bg-gradient-to-r from-blue to-teal px-7 py-4 text-center font-bold text-white shadow-[0_10px_35px_-12px_#19c7c5] transition hover:brightness-110">Sou empresa</Link>
            <Link href="/talentos/cadastrar" className="rounded-full border border-white/20 bg-white/5 px-7 py-4 text-center font-bold text-white backdrop-blur transition hover:border-gold/60 hover:bg-white/10">Sou talento</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400"><span>● Vídeo</span><span>● Fotografia</span><span>● Influência</span><span>● Mídia regional</span></div>
        </div>
        <div className="relative z-10 mt-16 lg:mt-0"><PlatformPreview talents={featuredTalents} /></div>
      </section>

      <section aria-labelledby="beneficios" className="py-20">
        <div className="mx-auto max-w-3xl text-center"><p className="text-sm font-bold uppercase tracking-[.28em] text-teal">Nossa plataforma</p><h2 id="beneficios" className="mt-4 text-3xl font-black sm:text-5xl">Da descoberta ao resultado.</h2><p className="mt-4 text-lg leading-8 text-slate-400">Uma experiência integrada para transformar conexões em campanhas memoráveis.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{benefits.map((item) => <article key={item.title} className="group rounded-[26px] border border-white/10 bg-white/[.035] p-6 transition hover:-translate-y-1 hover:border-teal/40 hover:bg-teal/[.06]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue/30 to-teal/20 text-teal"><MediaGlyph type={item.icon} /></span><h3 className="mt-6 text-2xl font-black">{item.title}</h3><p className="mt-3 leading-7 text-slate-400">{item.text}</p></article>)}</div>
      </section>

      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-[#092746] to-[#041628] p-7 sm:p-10 lg:p-14">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-blue/15 blur-3xl" />
        <div className="relative grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><div><p className="text-sm font-bold uppercase tracking-[.28em] text-gold">Rede de valor</p><h2 className="mt-4 text-3xl font-black sm:text-5xl">Um ecossistema que gera valor</h2><p className="mt-5 text-lg leading-8 text-slate-300">Estratégia no centro, conectando oportunidades às pessoas certas.</p></div><div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1.15fr_auto_1fr]"><div className="rounded-2xl border border-blue/30 bg-blue/10 p-5 text-center"><MediaGlyph type="signal" /><p className="mt-3 font-black">Empresas</p><p className="mt-1 text-sm text-slate-400">Briefing e objetivos</p></div><span className="rotate-90 text-2xl text-teal md:rotate-0">→</span><div className="rounded-2xl border border-teal/50 bg-teal/10 p-6 text-center shadow-[0_0_45px_-20px_#19c7c5]"><p className="font-black text-teal">CASTING ATTUAL 360</p><p className="mt-2 text-sm text-slate-300">Curadoria + estratégia</p></div><span className="rotate-90 text-2xl text-gold md:rotate-0">→</span><div className="rounded-2xl border border-gold/30 bg-gold/10 p-5 text-center"><MediaGlyph type="people" /><p className="mt-3 font-black">Talentos e mídia</p><p className="mt-1 text-sm text-slate-400">Presença e alcance</p></div></div></div>
        <div className="relative mt-10 flex flex-wrap gap-3 border-t border-white/10 pt-8">{pillars.map((pillar, index) => <span key={pillar} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200"><span className={index % 2 ? 'text-gold' : 'text-teal'}>✓</span> {pillar}</span>)}</div>
      </section>

      <section className="py-20"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.28em] text-teal">Casting em destaque</p><h2 className="mt-3 text-3xl font-black sm:text-5xl">Talentos que movem histórias.</h2><p className="mt-4 text-base text-slate-400">{usingFallback ? 'Perfis demonstrativos preservados enquanto o catálogo real é preparado.' : 'Perfis selecionados pela curadoria do Casting Attual 360.'}</p></div><Link href="/talentos" className="font-bold text-teal">Explorar catálogo <span aria-hidden="true">→</span></Link></div><div className="mt-10 grid gap-6 md:grid-cols-3">{featuredTalents.map((talent) => <TalentCard key={talent.slug} talent={talent} />)}</div></section>

      <section className="grid gap-6 pb-20 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[30px] border border-white/10 bg-gradient-to-r from-blue/25 via-teal/10 to-transparent p-7 sm:p-10"><p className="text-sm font-bold uppercase tracking-[.25em] text-teal">Próxima campanha</p><h2 className="mt-4 max-w-2xl text-3xl font-black sm:text-4xl">Sua marca pode ocupar mais espaços, com as vozes certas.</h2><div className="mt-7 flex flex-wrap gap-3"><Link href="/empresas" className="rounded-full bg-white px-6 py-3 font-bold text-navy">Solicitar curadoria</Link><Link href="/pacotes" className="rounded-full border border-white/20 px-6 py-3 font-bold">Conhecer soluções</Link></div></div><CapiPlaceholder /></section>
    </SiteShell>
  );
}
