'use client';

export default function TalentsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[28px] border border-red-400/30 bg-red-950/30 p-8 text-white">
      <h2 className="text-2xl font-black">Não foi possível carregar o catálogo</h2>
      <p className="mt-3 text-slate-300">Tente novamente. Se o banco estiver em preparação, os perfis demonstrativos serão usados automaticamente.</p>
      <button onClick={reset} className="mt-5 rounded-full bg-white px-5 py-2.5 font-bold text-navy">Tentar novamente</button>
    </div>
  );
}

