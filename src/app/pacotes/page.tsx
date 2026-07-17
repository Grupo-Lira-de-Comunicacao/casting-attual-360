import { SiteShell } from '@/components/site-shell';
import { SectionHeading } from '@/components/section-heading';
import { PackageCard } from '@/components/package-card';
import { demoPackages } from '@/data/demo-data';

export default function PackagesPage() {
  return (
    <SiteShell>
      <div className="space-y-8">
        <SectionHeading
          eyebrow="Pacotes"
          title="Estratégias de atuação"
          description="Pacotes demonstrativos com posicionamento premium para marcas que desejam conectar-se com talentos e campanhas.
"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {demoPackages.map((pkg) => (
            <PackageCard key={pkg.slug} pkg={pkg} />
          ))}
        </div>
      </div>
    </SiteShell>
  );
}
