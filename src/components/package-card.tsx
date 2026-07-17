import type { Package } from '@/data/demo-data';

export function PackageCard({ pkg }: { pkg: Package }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal">{pkg.slug}</p>
      <h3 className="mt-3 text-2xl font-bold text-navy">{pkg.name}</h3>
      <p className="mt-3 text-sm text-slate-600">{pkg.audience}</p>
      <ul className="mt-5 space-y-2 text-sm text-slate-600">
        {pkg.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2">
            <span className="text-blue">•</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">Investimento</p>
        <p className="text-xl font-black text-navy">{pkg.price}</p>
      </div>
    </article>
  );
}
