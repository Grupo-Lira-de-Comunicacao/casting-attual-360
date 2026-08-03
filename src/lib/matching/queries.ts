import { createClient } from '@/lib/supabase/server';
import type { TalentRecord } from '@/types/talent';

export type CastingShortlistItem = {
  id: string;
  casting_call_id: string;
  talent_id: string;
  match_score: number;
  eligibility_status: 'eligible' | 'ineligible' | 'review';
  selection_status: 'suggested' | 'shortlisted' | 'invited' | 'accepted' | 'declined' | 'removed';
  matched_requirements: unknown[];
  failed_requirements: unknown[];
  score_explanation: Record<string, unknown>;
  reviewed_at: string | null;
  talent: TalentRecord | null;
};

export async function getCastingShortlist(castingCallId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('casting_shortlist')
    .select('id, casting_call_id, talent_id, match_score, eligibility_status, selection_status, matched_requirements, failed_requirements, score_explanation, reviewed_at')
    .eq('casting_call_id', castingCallId)
    .order('match_score', { ascending: false });

  if (error || !data) return { shortlist: [] as CastingShortlistItem[], error };

  const talentIds = data.map((item) => item.talent_id).filter(Boolean);
  const talentsById = new Map<string, TalentRecord>();

  if (talentIds.length > 0) {
    const { data: talents } = await supabase
      .from('talents')
      .select('id, slug, nome, nome_artistico, categoria, subcategorias, especialidades, habilidades, idiomas, disponibilidades, cidade, estado, biografia, foto_url, foto_path, instagram, destaque, ativo, ordem, criado_em, atualizado_em, telefone, email')
      .in('id', talentIds);

    (talents ?? []).forEach((talent) => talentsById.set(talent.id, talent as TalentRecord));
  }

  const shortlist = data.map((item) => ({
    ...item,
    match_score: Number(item.match_score ?? 0),
    matched_requirements: Array.isArray(item.matched_requirements) ? item.matched_requirements : [],
    failed_requirements: Array.isArray(item.failed_requirements) ? item.failed_requirements : [],
    score_explanation: item.score_explanation && typeof item.score_explanation === 'object' && !Array.isArray(item.score_explanation)
      ? (item.score_explanation as Record<string, unknown>)
      : {},
    reviewed_at: item.reviewed_at ?? null,
    talent: talentsById.get(item.talent_id) ?? null,
  })) as CastingShortlistItem[];

  return { shortlist, error: null };
}
