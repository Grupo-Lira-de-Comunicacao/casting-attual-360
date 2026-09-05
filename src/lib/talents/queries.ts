import { demoTalents } from '@/data/demo-data';
import { createClient } from '@/lib/supabase/server';
import type { AdminTalentMedia, PublicTalent, PublicTalentVideo, TalentMediaRecord, TalentRecord } from '@/types/talent';

const publicColumns =
  'id, slug, nome, nome_artistico, categoria, subcategorias, especialidades, habilidades, idiomas, disponibilidades, cidade, estado, biografia, foto_url, foto_path, instagram, destaque_texto, destaque, ativo, ordem, criado_em, atualizado_em';
const adminColumns = `${publicColumns}, telefone, email`;
const mediaColumns = 'id, talent_id, kind, storage_path, external_url, title, sort_order, active, criado_em, atualizado_em';

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
    videos: [],
    instagram: null,
    featured: index < 3,
    order: index + 1,
    isDemo: true,
  };
}

function publicVideo(media: TalentMediaRecord): PublicTalentVideo | null {
  const raw = media.external_url?.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      if (id) return { id: media.id, url: raw, title: media.title, provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}` };
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const parts = url.pathname.split('/').filter(Boolean);
      const id = url.pathname === '/watch' ? url.searchParams.get('v') : (parts[0] === 'shorts' || parts[0] === 'embed') ? parts[1] : null;
      if (id) return { id: media.id, url: raw, title: media.title, provider: 'youtube', embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}` };
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
      if (id) return { id: media.id, url: raw, title: media.title, provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${id}` };
    }

    if (/\.(mp4|webm|ogg)$/i.test(url.pathname)) {
      return { id: media.id, url: raw, title: media.title, provider: 'direct', embedUrl: null };
    }

    return { id: media.id, url: raw, title: media.title, provider: 'link', embedUrl: null };
  } catch {
    return null;
  }
}

async function resolvePhotoUrls(records: TalentRecord[]) {
  const supabase = await createClient();
  const talentIds = records.map((record) => record.id);
  const { data: mediaData, error: mediaError } = talentIds.length
    ? await supabase
        .from('talent_media')
        .select(mediaColumns)
        .in('talent_id', talentIds)
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('criado_em', { ascending: true })
    : { data: [], error: null };
  const mediaRows = mediaError ? [] : ((mediaData ?? []) as TalentMediaRecord[]);

  const paths = unique([
    ...records.map((record) => record.foto_path ?? ''),
    ...mediaRows.filter((media) => media.kind === 'photo').map((media) => media.storage_path ?? ''),
  ]);
  const signedByPath = new Map<string, string>();

  if (paths.length > 0) {
    const { data } = await supabase.storage.from('talent-photos').createSignedUrls(paths, 60 * 60);
    data?.forEach((item, index) => {
      if (item.signedUrl) signedByPath.set(paths[index], item.signedUrl);
    });
  }

  const mediaByTalent = new Map<string, TalentMediaRecord[]>();
  mediaRows.forEach((media) => {
    const rows = mediaByTalent.get(media.talent_id) ?? [];
    rows.push(media);
    mediaByTalent.set(media.talent_id, rows);
  });

  return records.map((record): PublicTalent => {
    const categories = unique([record.categoria, ...(record.subcategorias ?? [])]);
    const specialties = record.especialidades ?? [];
    const skills = record.habilidades ?? [];
    const languages = record.idiomas ?? [];
    const availabilityOptions = record.disponibilidades ?? [];
    const primarySpecialty = specialties[0] ?? skills[0] ?? categories[1] ?? record.categoria;
    const highlightText = record.destaque_texto?.trim() || skills[0] || primarySpecialty;
    const image = (record.foto_path && signedByPath.get(record.foto_path)) || record.foto_url || null;
    const media = mediaByTalent.get(record.id) ?? [];
    const gallery = unique([
      image ?? '',
      ...media
        .filter((item) => item.kind === 'photo')
        .map((item) => (item.storage_path && signedByPath.get(item.storage_path)) || item.external_url || ''),
    ]);
    const videos = media
      .filter((item) => item.kind === 'video')
      .map(publicVideo)
      .filter((item): item is PublicTalentVideo => Boolean(item));

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
      gallery,
      videos,
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

  let media: AdminTalentMedia[] = [];
  if (talent) {
    const { data: mediaData, error: mediaError } = await supabase
      .from('talent_media')
      .select(mediaColumns)
      .eq('talent_id', talent.id)
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('criado_em', { ascending: true });

    if (!mediaError && mediaData) {
      const rows = mediaData as TalentMediaRecord[];
      const paths = unique(rows.filter((item) => item.kind === 'photo').map((item) => item.storage_path ?? ''));
      const signedByPath = new Map<string, string>();
      if (paths.length > 0) {
        const { data: signed } = await supabase.storage.from('talent-photos').createSignedUrls(paths, 60 * 60);
        signed?.forEach((item, index) => {
          if (item.signedUrl) signedByPath.set(paths[index], item.signedUrl);
        });
      }
      media = rows.map((item) => ({
        ...item,
        previewUrl: (item.storage_path && signedByPath.get(item.storage_path)) || item.external_url || null,
      }));
    }
  }

  return { talent, photoUrl, media, error };
}
