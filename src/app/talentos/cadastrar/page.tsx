import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { ContactForm } from '@/components/contact-form';

export default function TalentRegisterPage() {
  return (
    <SiteShell>
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Cadastro"
          title="Cadastre seu perfil"
          description="Página inicial para talentos interessados em entrar na rede da Casting Attual 360."
        />
        <ContactForm
          title="Quero participar da rede"
          description="Envie seus dados e destaque para que possamos avaliar sua presença para campanhas futuras."
          requestType="talento"
        />
      </div>
    </SiteShell>
  );
}
