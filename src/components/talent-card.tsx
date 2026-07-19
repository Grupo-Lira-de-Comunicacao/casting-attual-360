import Image from 'next/image';
import Link from 'next/link';
import type { Talent } from '@/data/demo-data';

export function TalentCard({ talent }: { talent: Talent }) {
  const profileHref = `/talentos/${talent.slug}`;

  return (
    <article className="group relative overflow-hidden rounded-[26px] border border-white/10 bg-[#0b2948] shadow-[0_22px_70px_-35px_rgba(25,199,197,0.7)] transition duration-300 hover:-translate-y-1 hover:border-teal/50">
      <Link href={profileHref} aria-label={`Abrir perfil demonstrativo de ${talent.name}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image src={talent.image} alt={`Retrato demonstrativo de ${talent.name}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#041628] via-[#041628]/10 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-navy/70 px-3 py-1 text-sm font-semibold text-teal backdrop-blur">{talent.category}</span>
          <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-navy">DEMO</span>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h3 className="text-2xl font-black text-white">{talent.name}</h3>
            <p className="mt-1 text-base text-white/75">{talent.location}</p>
          </div>
        </div>
      </Link>
      <div className="p-5 sm:p-6">
        <p className="font-semibold text-white">{talent.specialty}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{talent.description}</p>
        <Link href={profileHref} className="mt-5 inline-flex items-center gap-2 font-semibold text-teal transition hover:text-white">
          Ver perfil <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
