import Link from 'next/link';
import type { Talent } from '@/data/demo-data';

export function TalentCard({ talent }: { talent: Talent }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-blue">{talent.category}</p>
          <h3 className="mt-2 text-xl font-bold text-navy">{talent.name}</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal to-gold text-sm font-black text-white">
          {talent.name.charAt(0)}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">{talent.role}</p>
      <p className="mt-2 text-sm text-slate-500">{talent.location}</p>
      <p className="mt-4 text-sm leading-7 text-slate-600">{talent.description}</p>
      <div className="mt-6 flex items-center justify-between">
        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">{talent.highlight}</span>
        <Link href={`/talentos/${talent.slug}`} className="text-sm font-semibold text-blue">
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
