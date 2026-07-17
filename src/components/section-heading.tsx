export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue">{eyebrow}</p>
      <h2 className="text-2xl font-bold text-navy">{title}</h2>
      <p className="max-w-2xl text-slate-600">{description}</p>
    </div>
  );
}
