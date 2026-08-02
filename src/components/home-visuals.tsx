import { TalentImage } from '@/components/talent-image';
import type { PublicTalent } from '@/types/talent';

export function MediaGlyph({ type }: { type: 'play' | 'camera' | 'signal' | 'people' }) {
  const paths = {
    play: <><path d="M8 5v14l11-7z" /><rect x="3" y="3" width="18" height="18" rx="5" /></>,
    camera: <><path d="M14.5 7 13 5H8L6.5 7H4v12h16V7z" /><circle cx="12" cy="13" r="3.5" /></>,
    signal: <><path d="M5 18v-3M10 18v-6M15 18V9M20 18V5" /></>,
    people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 19c.5-4 2.5-6 6-6s5.5 2 6 6M15 14c3 0 5 1.5 6 4.5" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">{paths[type]}</svg>;
}

export function PlatformPreview({ talents }: { talents: PublicTalent[] }) {
  const primaryTalent = talents[0];

  if (!primaryTalent) {
    return <div className="min-h-80 rounded-[30px] border border-white/15 bg-[#092746]/85 p-8 text-center text-slate-300">Novos talentos em breve.</div>;
  }

  return (
    <div className="relative mx-auto w-full max-w-[570px] lg:mr-0">
      <div className="absolute -inset-8 rounded-full bg-teal/20 blur-3xl" />
      <div className="relative rotate-[-1deg] rounded-[30px] border border-white/15 bg-[#092746]/85 p-3 shadow-[0_35px_100px_-30px_rgba(15,111,255,0.9)] backdrop-blur-xl sm:p-4">
        <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3">
          <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gold" /><span className="h-2.5 w-2.5 rounded-full bg-teal" /><span className="h-2.5 w-2.5 rounded-full bg-blue" /></div>
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">Catálogo demonstrativo</span>
        </div>
        <div className="grid grid-cols-[1.15fr_.85fr] gap-3 pt-3">
          <div className="relative min-h-64 overflow-hidden rounded-2xl sm:min-h-80">
            <TalentImage src={primaryTalent.image} alt={`Prévia de ${primaryTalent.name}`} priority sizes="420px" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4"><p className="font-bold">{primaryTalent.name}</p><p className="text-sm text-white/65">{primaryTalent.category} · {primaryTalent.location}</p></div>
          </div>
          <div className="grid gap-3">
            {talents.slice(1, 3).map((talent) => <div key={talent.slug} className="relative overflow-hidden rounded-2xl"><TalentImage src={talent.image} alt={`Prévia de ${talent.name}`} sizes="180px" /><div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" /></div>)}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-teal/30 bg-[#061b31]/95 p-3 shadow-xl backdrop-blur sm:-left-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/15 text-teal"><MediaGlyph type="signal" /></span><div><p className="text-xs text-slate-400">Alcance regional</p><p className="font-bold text-white">Visibilidade 360°</p></div>
      </div>
    </div>
  );
}

export function CapiPlaceholder() {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-gold/25 bg-gradient-to-br from-gold/15 to-transparent p-6">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/20 blur-2xl" />
      <div className="relative flex items-center gap-4"><span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-navy/60 text-4xl">🦫</span><div><p className="text-sm font-bold uppercase tracking-[.2em] text-gold">Em breve</p><h3 className="mt-1 text-xl font-black text-white">Capi 360</h3><p className="mt-1 text-sm leading-6 text-slate-300">Área preparada para a mascote oficial do ecossistema.</p></div></div>
    </div>
  );
}
