import { getCastingCall } from '@/lib/casting-calls/queries';
import { matchTalent } from '@/lib/matching/engine';
import { createClient } from '@/lib/supabase/server';
import { getAdminTalents } from '@/lib/talents/queries';

export type GenerateShortlistResult =
  | {
      ok: true;
      totalTalents: number;
      eligible: number;
      review: number;
      ineligible: number;
      integrationWarning: boolean;
    }
  | { ok: false; error: string };

export async function generateCastingShortlist(castingCallId: string): Promise<GenerateShortlistResult> {
  const { castingCall, error: castingCallError } = await getCastingCall(castingCallId);
  if (castingCallError || !castingCall) return { ok: false, error: 'Não foi possível carregar a convocação.' };
  if (castingCall.status !== 'open') return { ok: false, error: 'O matching automático só pode ser gerado para uma convocação aberta.' };
  if (castingCall.requirements.length === 0) return { ok: false, error: 'A convocação precisa ter requisitos antes de gerar o matching.' };

  const { talents, error: talentsError } = await getAdminTalents();
  if (talentsError) return { ok: false, error: 'Não foi possível carregar os talentos.' };

  const activeTalents = talents.filter((talent) => talent.ativo);
  const matches = activeTalents.map((talent) => matchTalent(castingCall.requirements, talent));
  const supabase = await createClient();

  if (matches.length > 0) {
    const payload = matches.map((match) => ({
      casting_call_id: castingCall.id,
      talent_id: match.talent_id,
      match_score: match.match_score,
      eligibility_status: match.eligibility_status,
      matched_requirements: match.matched_requirements,
      failed_requirements: match.failed_requirements,
      score_explanation: {
        ...match.score_explanation,
        review_requirements: match.review_requirements,
      },
    }));

    const { error: shortlistError } = await supabase
      .from('casting_shortlist')
      .upsert(payload, { onConflict: 'casting_call_id,talent_id' });

    if (shortlistError) return { ok: false, error: 'Não foi possível gravar a shortlist calculada.' };
  }

  const eligible = matches.filter((match) => match.eligibility_status === 'eligible').length;
  const review = matches.filter((match) => match.eligibility_status === 'review').length;
  const ineligible = matches.filter((match) => match.eligibility_status === 'ineligible').length;

  const { error: integrationError } = await supabase.from('integration_events').insert({
    event_type: 'casting.matching.generated',
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: castingCall.production_id,
    casting_call_id: castingCall.id,
    payload: {
      casting_call_id: castingCall.id,
      production_id: castingCall.production_id,
      total_talents: matches.length,
      eligible,
      review,
      ineligible,
      generated_at: new Date().toISOString(),
    },
  });

  return {
    ok: true,
    totalTalents: matches.length,
    eligible,
    review,
    ineligible,
    integrationWarning: Boolean(integrationError),
  };
}
