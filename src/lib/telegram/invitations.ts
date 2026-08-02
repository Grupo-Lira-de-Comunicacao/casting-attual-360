import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

const INVITATION_TTL_HOURS = 24;
const START_PREFIX = 'invite_';

export type PrepareCastingInvitationResult =
  | {
      ok: true;
      invitationId: string;
      status: 'pending_link' | 'ready';
      token: string | null;
      deepLink: string | null;
      expiresAt: string;
      integrationWarning: boolean;
    }
  | { ok: false; error: string };

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function makeToken() {
  return randomBytes(32).toString('base64url');
}

function makeDeepLink(token: string) {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, '');
  if (!username) return null;
  return `https://t.me/${username}?start=${START_PREFIX}${token}`;
}

export async function prepareCastingInvitation(
  shortlistId: string,
  createdBy?: string | null,
): Promise<PrepareCastingInvitationResult> {
  const supabase = await createClient();

  const { data: shortlist, error: shortlistError } = await supabase
    .from('casting_shortlist')
    .select('id, talent_id, casting_call_id, selection_status, casting_calls!inner(id, production_id, status)')
    .eq('id', shortlistId)
    .single();

  const castingCall = Array.isArray(shortlist?.casting_calls)
    ? shortlist?.casting_calls[0]
    : shortlist?.casting_calls;

  if (shortlistError || !shortlist?.id || !shortlist.talent_id || !castingCall) {
    return { ok: false, error: 'Candidato da shortlist não encontrado.' };
  }

  if (shortlist.selection_status !== 'shortlisted') {
    return { ok: false, error: 'Somente talentos aprovados na shortlist podem receber convite.' };
  }

  if (!['open', 'paused'].includes(castingCall.status)) {
    return { ok: false, error: 'A convocação não aceita novos convites neste estado.' };
  }

  const { data: existingInvitation } = await supabase
    .from('casting_invitations')
    .select('id, status')
    .eq('shortlist_id', shortlist.id)
    .maybeSingle();

  if (existingInvitation && !['pending_link', 'ready', 'failed', 'expired'].includes(existingInvitation.status)) {
    return { ok: false, error: 'Este talento já possui um convite em estado protegido.' };
  }

  const { data: telegramLink } = await supabase
    .from('talent_telegram_links')
    .select('id, telegram_user_id, telegram_chat_id')
    .eq('talent_id', shortlist.talent_id)
    .is('revoked_at', null)
    .maybeSingle();

  const token = makeToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const status = telegramLink?.id ? 'ready' : 'pending_link';

  const invitationPayload = {
    shortlist_id: shortlist.id,
    casting_call_id: shortlist.casting_call_id,
    talent_id: shortlist.talent_id,
    status,
    token_hash: tokenHash,
    token_expires_at: expiresAt,
    telegram_link_id: telegramLink?.id ?? null,
    prepared_at: now,
    last_error: null,
    created_by: createdBy ?? null,
  };

  const invitationQuery = existingInvitation?.id
    ? supabase
        .from('casting_invitations')
        .update(invitationPayload)
        .eq('id', existingInvitation.id)
        .select('id, status')
        .single()
    : supabase
        .from('casting_invitations')
        .insert(invitationPayload)
        .select('id, status')
        .single();

  const { data: invitation, error: invitationError } = await invitationQuery;
  if (invitationError || !invitation?.id) {
    return { ok: false, error: 'Não foi possível preparar o convite.' };
  }

  const { error: integrationError } = await supabase.from('integration_events').insert({
    event_type: 'casting.invitation.prepared',
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: castingCall.production_id,
    casting_call_id: shortlist.casting_call_id,
    shortlist_id: shortlist.id,
    invitation_id: invitation.id,
    payload: {
      invitation_id: invitation.id,
      shortlist_id: shortlist.id,
      casting_call_id: shortlist.casting_call_id,
      production_id: castingCall.production_id,
      talent_id: shortlist.talent_id,
      channel: 'telegram',
      status,
      telegram_linked: Boolean(telegramLink?.id),
      token_expires_at: expiresAt,
      prepared_at: now,
    },
  });

  return {
    ok: true,
    invitationId: invitation.id,
    status,
    token: telegramLink?.id ? null : token,
    deepLink: telegramLink?.id ? null : makeDeepLink(token),
    expiresAt,
    integrationWarning: Boolean(integrationError),
  };
}

export function verifyInvitationStartPayload(payload: string) {
  if (!payload.startsWith(START_PREFIX)) return null;
  const token = payload.slice(START_PREFIX.length);
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  return { token, tokenHash: hashToken(token) };
}
