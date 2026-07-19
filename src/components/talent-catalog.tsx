'use client';

import { useMemo, useState } from 'react';
import type { Talent } from '@/data/demo-data';
import { TalentCard } from '@/components/talent-card';

export function TalentCatalog({ talents }: { talents: Talent[] }) {
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const categories = ['Todos', ...Array.from(new Set(talents.map((talent) => talent.category)))];

  const filteredTalents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return talents.filter((talent) => {
      const matchesCategory = category === 'Todos' || talent.category === category;
      const searchable = `${talent.name} ${talent.role} ${talent.location} ${talent.specialty}`.toLocaleLowerCase('pt-BR');
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query, talents]);

  return (
    <div className="space-y-8">
      <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 sm:p-6">
        <label htmlFor="talent-search" className="text-sm font-bold text-white">Buscar profissional</label>
        <input id="talent-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, função, cidade ou especialidade" className="mt-3 w-full rounded-2xl border border-white/10 bg-[#061b30] px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-teal" />
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtrar por categoria">
          {categories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`rounded-full px-4 py-2 text-sm font-bold transition ${category === item ? 'bg-teal text-navy' : 'border border-white/10 bg-white/5 text-slate-300 hover:border-teal/50'}`}>
              {item}
            </button>
          ))}
        </div>
        <p className="mt-5 text-sm text-slate-400">{filteredTalents.length} {filteredTalents.length === 1 ? 'perfil encontrado' : 'perfis encontrados'}</p>
      </div>

      {filteredTalents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTalents.map((talent) => <TalentCard key={talent.slug} talent={talent} />)}
        </div>
      ) : (
        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-10 text-center text-slate-300">Nenhum perfil demonstrativo corresponde aos filtros selecionados.</div>
      )}
    </div>
  );
}
