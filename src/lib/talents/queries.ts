import { demoTalents } from '@/data/demo-data';
import { createClient } from '@/lib/supabase/server';
import type { PublicTalent, TalentRecord } from '@/types/talent';

const publicColumns =
  'id, slug, nome, nome_artistico, categoria, subcategorias, especialidades, habilidades, idiomas, disponibilidades, cidade, estado, biografia, foto_url, foto_path, instagram, destaque_texto, destaque, ativo, ordem, criado_em, atualizado_em';
const adminColumns = `${publicColumns}, telefone, email`;

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function demoToPublic(talent: (typeof demoTalents)[number], index: number): PublicTalent {
  return {
    id: `demo:${talent.slug}`,
    slug: talent.slug,
    name: talent.name,
    artisticName: null,
    role: talent.role,
    location: talent.location,
    specialty: talent.specialty,
    description: talent.description,
    availability: talent.availability,
    highlight: talent.highlight,
    category: talent.category,
    categories: [talent.category],
    specialties: [talent.specialty],
    skills: [talent.highlight],
    languages: [],
    availabilityOptions: [talent.availability],
    image: talent.image,
    gallery: talent.gallery,
    instagram: null,
    featured: index < 3,
    order: index + 1,
    isDemo: true,
  };
}

async function resolvePhotoUrls(records: TalentRecord[]) {
  const supabase = await createClient();
  const paths = records.map((record) => record.foto_path).filter((path): path is string => Boolean(path));
  const signedByPath = new Map<string, string>();

  if (paths.length > 0) {
    const { data } = await supabase.storage.from('talent-photos').createSignedUrls(paths, 60 * 60);
    data?.forEach((item, index) => {
      if (item.signedUrl) signedByPath.set(paths[index], item.signedUrl);
    });
  }

  return records.map((record): PublicTalent => {
    const categories = unique([record.categoria, ...(record.subcategorias ?? [])]);
    const specialties = record.especialidades ?? [];
    const skills = record.habilidades ?? [];
    const languages = record.idiomas ?? [];
    const availabilityOptions = record.disponibilidades ?? [];
    const primarySpecialty = specialties[0] ?? skills[0] ?? categories[1] ?? record.categoria;
    const highlightText = record.destaque_texto?.trim() || skills[0] || primarySpecialty;
    const image = (record.foto_path && signedByPath.get(record.foto_path)) || record.foto_url || null;

    return {
      id: record.id,
      slug: record.slug,
      name: record.nome,
      artisticName: record.nome_artistico,
      role: categories.slice(0, 3).join(' · '),
      location: `${record.cidade}, ${record.estado}`,
      specialty: primarySpecialty,
      description: record.biografia,
      availability: availabilityOptions.length > 0 ? availabilityOptions.join(' · ') : 'Disponível para oportunidades',
      highlight: highlightText,
      category: record.categoria,
      categories,
      specialties,
      skills,
      languages,
      availabilityOptions,
      image,
      gallery: image ? [image] : [],
      instagram: record.instagram,
      featured: record.destaque,
      order: record.ordem,
      isDemo: false,
    };
  });
}

export async function getPublicTalents() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('talents').select(publicColumns).eq('ativo', true).order('ordem', { ascending: true }).order('nome', { ascending: true });
    if (error || !data || data.length === 0) return { talents: demoTalents.map(demoToPublic), usingFallback: true };
    return { talents: await resolvePhotoUrls(data as TalentRecord[]), usingFallback: false };
  } catch {
    return { talents: demoTalents.map(demoToPublic), usingFallback: true };
  }
}

export async function getFeaturedTalents() {
  const result = await getPublicTalents();
  const featured = result.talents.filter((talent) => talent.featured).slice(0, 3);
  return { talents: featured.length > 0 ? featured : result.talents.slice(0, 3), usingFallback: result.usingFallback };
}

export async function getPublicTalentBySlug(slug: string) {
  const result = await getPublicTalents();
  return { talent: result.talents.find((talent) => talent.slug === slug) ?? null, usingFallback: result.usingFallback };
}

export async function getAdminTalents() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('talents').select(adminColumns).order('ordem', { ascending: true }).order('nome', { ascending: true });
  return { talents: (data ?? []) as TalentRecord[], error };
}

export async function getAdminTalent(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from('talents').select(adminColumns).eq('id', id).maybeSingle();
  const talent = data as TalentRecord | null;
  let photoUrl = talent?.foto_url ?? null;
  if (talent?.foto_path) {
    const { data: signedPhoto } = await supabase.storage.from('talent-photos').createSignedUrl(talent.foto_path, 60 * 60);
    photoUrl = signedPhoto?.signedUrl ?? photoUrl;
  }
  return { talent, photoUrl, error };
}
