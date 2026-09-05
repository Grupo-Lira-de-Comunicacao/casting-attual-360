'use server';

import { createClient } from '@/lib/supabase/server';

export type ProfessionalCategory = {
  id: string;
  name: string;
  slug: string;
  aliases: string[];
  order: number;
  active: boolean;
};

const FALLBACK_CATEGORIES: ProfessionalCategory[] = [
  { id: 'fallback-apresentador', name: 'Apresentador', slug: 'apresentador', aliases: ['apresentador', 'apresentadora', 'apresentacao'], order: 10, active: true },
  { id: 'fallback-audiovisual', name: 'Audiovisual', slug: 'audiovisual', aliases: ['audiovisual', 'videomaker', 'cinegrafista', 'video', 'captacao'], order: 20, active: true },
  { id: 'fallback-danca', name: 'Dança', slug: 'danca', aliases: ['danca', 'coreografo', 'coreografa'], order: 30, active: true },
  { id: 'fallback-fotografia', name: 'Fotografia', slug: 'fotografia', aliases: ['fotografia', 'fotografo', 'fotografa'], order: 40, active: true },
  { id: 'fallback-imagens-aereas', name: 'Imagens Aereas', slug: 'imagens-aereas', aliases: ['imagens aereas', 'imagem aerea', 'fotografia aerea', 'filmagem aerea', 'drone', 'drones'], order: 50, active: true },
  { id: 'fallback-influencer', name: 'Influêncer', slug: 'influencer', aliases: ['influencer', 'influenciador', 'influenciadora', 'influencia'], order: 60, active: true },
  { id: 'fallback-jornalismo', name: 'Jornalismo', slug: 'jornalismo', aliases: ['jornalismo', 'jornalista'], order: 70, active: true },
  { id: 'fallback-locucao', name: 'Locução', slug: 'locucao', aliases: ['locucao', 'locutor', 'locutora'], order: 80, active: true },
  { id: 'fallback-moda', name: 'Moda', slug: 'moda', aliases: ['moda', 'modelo'], order: 90, active: true },
  { id: 'fallback-reporter', name: 'Reporter', slug: 'reporter', aliases: ['reporter', 'reportagem'], order: 100, active: true },
];

type CategoryRow = {
  id: string;
  nome: string;
  slug: string;
  aliases: string[] | null;
  ordem: number;
  ativo: boolean;
};

function mapRow(row: CategoryRow): ProfessionalCategory {
  return {
    id: row.id,
    name: row.nome,
    slug: row.slug,
    aliases: row.aliases ?? [],
    order: row.ordem,
    active: row.ativo,
  };
}

export async function getPublicProfessionalCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('professional_categories')
    .select('id, nome, slug, aliases, ordem, ativo')
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (error || !data) {
    return { categories: FALLBACK_CATEGORIES, usingFallback: true };
  }

  return { categories: (data as CategoryRow[]).map(mapRow), usingFallback: false };
}

export async function getAdminProfessionalCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('professional_categories')
    .select('id, nome, slug, aliases, ordem, ativo')
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (error || !data) {
    return { categories: [] as ProfessionalCategory[], structureInstalled: false };
  }

  return { categories: (data as CategoryRow[]).map(mapRow), structureInstalled: true };
}
