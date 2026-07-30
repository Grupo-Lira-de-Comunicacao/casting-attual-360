'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { setTalentActive } from '@/app/admin/talentos/actions';
import type { TalentRecord } from '@/types/talent';

export function TalentManagement({ talents }: { talents: TalentRecord[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [status, setStatus] = useState('todos');
  const categories = ['Todas', ...Array.from(new Set(talents.map((talent) => talent.categoria)))];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return talents.filter((talent) => {
      const searchable = `${talent.nome} ${talent.nome_artistico ?? ''} ${talent.slug} ${talent.cidade}`.toLocaleLowerCase('pt-BR');
      const matchesQuery = !normalized || searchable.includes(normalized);
      const matchesCategory = category === 'Todas' || talent.categoria === category;
      const matchesStatus = status === 'todos' || (status === 'ativos' ? talent.ativo : !talent.ativo);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, query, status, talents]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Pesquisar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, slug ou cidade" className="rounded-2xl border border-slate-300 px-4 py-3 text-navy outline-none focus:border-blue" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Categoria
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-navy outline-none focus:border-blue">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-600">
          Situação
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 text-navy outline-none focus:border-blue">
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </label>
      </section>

      <p className="text-sm font-semibold text-slate-500">{filtered.length} talento(s) encontrado(s).</p>

      <div className="grid gap-4">
        {filtered.map((talent) => (
          <article key={talent.id} className="grid gap-5 rounded-[24px] border border-slate-200 bg-white p-5 text-navy shadow-soft lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black">{talent.nome_artistico || talent.nome}</h2>
                {talent.destaque && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Destaque #{talent.ordem}</span>}
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${talent.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                  {talent.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{talent.categoria} · {talent.cidade}/{talent.estado} · /{talent.slug}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/talentos/${talent.slug}`} target="_blank" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold hover:border-blue">Ver perfil</Link>
              <Link href={`/admin/talentos/${talent.id}/editar`} className="rounded-full bg-blue px-4 py-2 text-sm font-bold text-white hover:bg-navy">Editar</Link>
              <form action={setTalentActive}>
                <input type="hidden" name="id" value={talent.id} />
                <input type="hidden" name="slug" value={talent.slug} />
                <input type="hidden" name="active" value={String(!talent.ativo)} />
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold hover:border-amber-500">
                  {talent.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-soft">
          Nenhum talento corresponde aos filtros selecionados.
        </section>
      )}
    </div>
  );
}

