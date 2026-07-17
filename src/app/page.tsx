import Link from 'next/link';
import { SiteShell } from '@/components/site-shell';
import { demoTalents } from '@/data/demo-data';
import { TalentCard } from '@/components/talent-card';

const steps = [
  { number: '01', title: 'Conte o seu desafio', text: 'Entendemos objetivo, público, praça, linguagem e resultado esperado.' },
  { number: '02', title: 'Receba uma curadoria', text: 'Conectamos a campanha aos perfis e formatos com maior aderência.' },
  { number: '03', title: 'Ative com estratégia', text: 'Acompanhamos contratação, presença e entregas de ponta a ponta.' },
];

const demoStats = [
  { value: '36', label: 'talentos no catálogo demo' },
  { value: '08', label: 'projetos ativos simulados' },
  { value: '03', label: 'frentes de atuação' },
];

export default function HomePage() {
  return (
    <SiteShell>
      <section className="relative grid overflow-hidden rounded-[32px] bg-navy text-white shadow-soft lg:grid-cols-[1.25fr_0.75fr]">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue/20 blur-3xl" />
        <div className="relative space-y-6 p-7 sm:p-10 lg:p-14">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-teal">
            Talentos, conexões e visibilidade.
          </span>
          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Escolha quem vai dar voz, imagem e alcance para sua marca.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
            Curadoria e gestão para conectar marcas, agências e talentos com estratégia, presença e relevância regional.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/empresas" className="rounded-full bg-teal px-6 py-3 font-semibold text-navy transition hover:bg-white">
              Encontre o talento ideal
            </Link>
            <Link href="/talentos" className="rounded-full border border-white/25 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
              Explore o casting
            </Link>
          </div>
        </div>
        <div className="relative flex min-h-80 items-end bg-gradient-to-br from-blue via-blue to-teal p-7 sm:p-10 lg:min-h-full">
          <div className="w-full rounded-[24px] border border-white/20 bg-navy/25 p-6 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/65">Visão 360º</p>
            <p className="mt-3 text-2xl font-bold">Voz, imagem e alcance trabalhando juntos.</p>
            <p className="mt-3 text-sm leading-6 text-white/75">Da seleção do perfil à presença final da campanha.</p>
          </div>
        </div>
      </section>

      <section aria-label="Indicadores demonstrativos" className="mt-6 grid gap-3 sm:grid-cols-3">
        {demoStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-3xl font-black text-blue">{stat.value}</p>
            <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
        <p className="sm:col-span-3 text-xs text-slate-500">* Indicadores exclusivamente demonstrativos da Fase 1; não representam dados operacionais reais.</p>
      </section>

      <section className="mt-16 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Como funciona</p>
          <h2 className="mt-3 text-3xl font-black text-navy">A conexão certa, sem complicar o processo.</h2>
          <p className="mt-4 leading-7 text-slate-600">Uma jornada pensada para transformar briefing em presença relevante.</p>
        </div>
        <div className="grid gap-4">
          {steps.map((step) => (
            <article key={step.number} className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <span className="text-sm font-black text-teal">{step.number}</span>
              <div><h3 className="font-bold text-navy">{step.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">Talentos em destaque</p>
            <h2 className="text-2xl font-bold text-navy">Perfis demonstrativos</h2>
          </div>
          <Link href="/talentos" className="text-sm font-semibold text-blue">Ver catálogo completo</Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {demoTalents.slice(0, 3).map((talent) => (
            <TalentCard key={talent.slug} talent={talent} />
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-5 md:grid-cols-2">
        <article className="rounded-[28px] bg-blue p-7 text-white sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/65">Para marcas e agências</p>
          <h2 className="mt-3 text-2xl font-black">Dê força à próxima campanha.</h2>
          <p className="mt-3 leading-7 text-white/75">Encontre perfis alinhados à mensagem, ao território e ao público.</p>
          <Link href="/empresas" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-blue">Solicitar curadoria</Link>
        </article>
        <article className="rounded-[28px] bg-teal p-7 text-navy sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-navy/55">Para talentos</p>
          <h2 className="mt-3 text-2xl font-black">Amplie sua visibilidade.</h2>
          <p className="mt-3 leading-7 text-navy/70">Apresente seu trabalho e entre no radar de novas oportunidades.</p>
          <Link href="/talentos/cadastrar" className="mt-6 inline-flex rounded-full bg-navy px-5 py-3 font-semibold text-white">Quero fazer parte</Link>
        </article>
      </section>
    </SiteShell>
  );
}
