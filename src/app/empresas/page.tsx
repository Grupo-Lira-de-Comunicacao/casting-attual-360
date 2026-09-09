import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Para empresas',
  description:
    'Solicite curadoria de talentos, audiovisual e presença regional para campanhas no Vale do Paraíba.',
  alternates: { canonical: '/empresas' },
};

const steps = [
  {
    number: '01',
    title: 'Conte o projeto',
    text: 'Informe objetivo, formato, local, período, público e o perfil de talento ou presença que imagina para a campanha.',
  },
  {
    number: '02',
    title: 'Receba curadoria',
    text: 'O Casting Attual 360 organiza a necessidade e cruza o briefing com talentos, formatos audiovisuais e possibilidades de mídia regional.',
  },
  {
    number: '03',
    title: 'Alinhe os próximos passos',
    text: 'A equipe entra em contato para validar disponibilidade, escopo, produção, veiculação e demais condições antes da execução.',
  },
];

export default function CompaniesPage() {
  return (
    <SiteShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Para empresas"
          title="Encontre as pessoas e os formatos certos para sua campanha"
          description="Marcas, agências e produtores podem usar o Casting Attual 360 como ponto único para talentos, audiovisual e presença regional."
        />

        <section className="grid gap-4 md:grid-cols-3" aria-label="Como funciona para empresas">
          {steps.map((step) => (
            <article key={step.number} className="rounded-[26px] border border-white/10 bg-white/[.035] p-6">
              <span className="text-sm font-black tracking-[.22em] text-teal">{step.number}</span>
              <h2 className="mt-4 text-xl font-black text-white">{step.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{step.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-gold/20 bg-gold/[.06] p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[.24em] text-gold">Um briefing melhor acelera a curadoria</p>
          <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
            <span>✓ Objetivo da campanha</span>
            <span>✓ Cidade e datas</span>
            <span>✓ Perfil ou categoria desejada</span>
            <span>✓ Canais e formatos de divulgação</span>
          </div>
        </section>

        <ContactForm
          title="Quero contratar talentos"
          description="Descreva sua campanha, o público-alvo e o tipo de presença desejada. Quanto mais contexto você enviar, melhor será a curadoria inicial."
          requestType="empresa"
        />
      </div>
    </SiteShell>
  );
}
