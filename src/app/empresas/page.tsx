import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { ContactForm } from '@/components/contact-form';

export default function CompaniesPage() {
  return (
    <SiteShell>
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Empresas"
          title="Solicite uma estratégia personalizada"
          description="Este formulário representa o ponto de entrada para marcas e agências interessadas em criar campanhas com talentos e visibilidade."
        />
        <ContactForm
          title="Quero contratar talentos"
          description="Descreva sua campanha, o público-alvo e o tipo de presença desejada."
          requestType="empresa"
        />
      </div>
    </SiteShell>
  );
}
