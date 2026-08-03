import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { CASTING_EVENT_TYPES, castingIntegrationEvent } from '@/lib/integrations/casting-events';

const START_PREFIX = 'invite_';

type TelegramIdentity = {
  userId: number;
  chatId: number;
  username?: string | null;
};

export type LinkTelegramInvitationResult =
  | { ok: true; invitationId: string; talentId: string; status: 'ready'; integrationWarning: boolean }
  | { ok: false; error: string };

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseStartPayload(payload: string) {
  if (!payload.startsWith(START_PREFIX)) return null;
  const token = payload.slice(START_PREFIX.length);
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) return null;
  return { tokenHash: hashToken(token) };
}

export async function linkTelegramInvitation(
  payload: string,
  identity: TelegramIdentity,
): Promise<LinkTelegramInvitationResult> {
  const parsed = parseStartPayload(payload);
  if (!parsed) return { ok: false, error: 'Convite inválido.' };

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: invitation, error: invitationError } = await supabase
    .from('casting_invitations')
    .select('id, talent_id, shortlist_id, casting_call_id, status, token_expires_at, casting_calls!inner(production_id)')
    .eq('token_hash', parsed.tokenHash)
    .maybeSingle();

  const castingCall = Array.isArray(invitation?.casting_calls)
    ? invitation?.casting_calls[0]
    : invitation?.casting_calls;

  if (invitationError || !invitation?.id || !invitation.talent_id || !castingCall) {
    return { ok: false, error: 'Convite não encontrado.' };
  }

  if (!['pending_link', 'ready'].includes(invitation.status)) {
    return { ok: false, error: 'Este convite não pode mais ser vinculado.' };
  }

  if (new Date(invitation.token_expires_at).getTime() <= Date.now()) {
    await supabase.from('casting_invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { ok: false, error: 'Este convite expirou.' };
  }

  const { data: conflictingLink } = await supabase
    .from('talent_telegram_links')
    .select('id, talent_id')
    .eq('telegram_user_id', identity.userId)
    .is('revoked_at', null)
    .maybeSingle();

  if (conflictingLink?.talent_id && conflictingLink.talent_id !== invitation.talent_id) {
    return { ok: false, error: 'Esta conta do Telegram já está vinculada a outro talento.' };
  }

  const { data: existingTalentLink } = await supabase
    .from('talent_telegram_links')
    .select('id')
    .eq('talent_id', invitation.talent_id)
    .is('revoked_at', null)
    .maybeSingle();

  const linkPayload = {
    talent_id: invitation.talent_id,
    telegram_user_id: identity.userId,
    telegram_chat_id: identity.chatId,
    telegram_username: identity.username ?? null,
    verified_at: now,
    revoked_at: null,
  };

  const linkQuery = existingTalentLink?.id
    ? supabase
        .from('talent_telegram_links')
        .update(linkPayload)
        .eq('id', existingTalentLink.id)
        .select('id')
        .single()
    : supabase.from('talent_telegram_links').insert(linkPayload).select('id').single();

  const { data: telegramLink, error: linkError } = await linkQuery;
  if (linkError || !telegramLink?.id) {
    return { ok: false, error: 'Não foi possível vincular o Telegram ao talento.' };
  }

  const { error: updateError } = await supabase
    .from('casting_invitations')
    .update({
      telegram_link_id: telegramLink.id,
      status: 'ready',
      token_expires_at: now,
      last_error: null,
    })
    .eq('id', invitation.id)
    .in('status', ['pending_link', 'ready']);

  if (updateError) {
    return { ok: false, error: 'Telegram vinculado, mas o convite não pôde ser liberado.' };
  }

  const { error: integrationError } = await supabase.from('integration_events').insert(
    castingIntegrationEvent(
      CASTING_EVENT_TYPES.telegramLinked,
      {
        productionId: castingCall.production_id,
        castingCallId: invitation.casting_call_id,
        shortlistId: invitation.shortlist_id,
        invitationId: invitation.id,
        talentId: invitation.talent_id,
      },
      {
        channel: 'telegram',
        status: 'ready',
        linked_at: now,
      },
    ),
  );

  return {
    ok: true,
    invitationId: invitation.id,
    talentId: invitation.talent_id,
    status: 'ready',
    integrationWarning: Boolean(integrationError),
  };
}
