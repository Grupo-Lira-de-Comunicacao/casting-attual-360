import type { Metadata } from 'next';
import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Cadastro de talentos',
  description:
    'Cadastre seu perfil para participar da curadoria do Casting Attual 360 e ser considerado em campanhas e produções futuras.',
  alternates: { canonical: '/talentos/cadastrar' },
};

const steps = [
  {
    number: '01',
    title: 'Envie seu perfil',
    text: 'Conte quem você é, sua categoria, experiência, cidade, redes e portfólio. Quanto mais completo o material, melhor a avaliação inicial.',
  },
  {
    number: '02',
    title: 'Passe pela curadoria',
    text: 'A equipe analisa aderência, apresentação, informações profissionais e possibilidades de participação no ecossistema.',
  },
  {
    number: '03',
    title: 'Entre no radar de oportunidades',
    text: 'Perfis aprovados podem ser considerados em campanhas, produções e ações compatíveis com suas características e disponibilidade.',
  },
];

export default function TalentRegisterPage() {
  return (
    <SiteShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Cadastro de talentos"
          title="Apresente seu trabalho ao Casting Attual 360"
          description="O cadastro é o primeiro passo para entrar na curadoria de talentos do Grupo Lira e ser considerado em oportunidades compatíveis com seu perfil."
        />

        <section className="grid gap-4 md:grid-cols-3" aria-label="Como funciona o cadastro de talentos">
          {steps.map((step) => (
            <article key={step.number} className="rounded-[26px] border border-white/10 bg-white/[.035] p-6">
              <span className="text-sm font-black tracking-[.22em] text-teal">{step.number}</span>
              <h2 className="mt-4 text-xl font-black text-white">{step.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{step.text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-teal/20 bg-teal/[.06] p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[.24em] text-teal">O que ajuda na avaliação</p>
          <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
            <span>✓ Foto e apresentação atualizadas</span>
            <span>✓ Cidade e disponibilidade</span>
            <span>✓ Categoria e habilidades</span>
            <span>✓ Redes sociais ou portfólio</span>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            O envio do cadastro não garante publicação no catálogo, convocação ou contratação. Cada oportunidade depende de curadoria, aderência ao briefing e disponibilidade.
          </p>
        </section>

        <ContactForm
          title="Quero participar da rede"
          description="Envie seus dados profissionais para avaliação da curadoria. Use o campo de apresentação para destacar experiência, habilidades e trabalhos relevantes."
          requestType="talento"
        />
      </div>
    </SiteShell>
  );
}
