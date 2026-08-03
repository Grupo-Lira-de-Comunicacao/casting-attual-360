import { createAdminClient } from '@/lib/supabase/admin';
import { CASTING_EVENT_TYPES, castingIntegrationEvent } from '@/lib/integrations/casting-events';

type TelegramCallbackIdentity = {
  userId: number;
  chatId?: number | null;
};

export type CastingInvitationResponseResult =
  | { ok: true; invitationId: string; status: 'accepted' | 'declined'; message: string; integrationWarning: boolean }
  | { ok: false; error: string };

function parseCallbackData(data: string) {
  const [action, invitationId] = data.split(':');
  if (!invitationId) return null;
  if (action === 'invitation_accept') return { invitationId, status: 'accepted' as const };
  if (action === 'invitation_decline') return { invitationId, status: 'declined' as const };
  return null;
}

export async function respondToCastingInvitation(
  callbackData: string,
  identity: TelegramCallbackIdentity,
): Promise<CastingInvitationResponseResult> {
  const parsed = parseCallbackData(callbackData);
  if (!parsed) return { ok: false, error: 'Resposta de convite inválida.' };

  const supabase = createAdminClient();
  const { data: invitation, error: invitationError } = await supabase
    .from('casting_invitations')
    .select(`
      id, status, talent_id, shortlist_id, casting_call_id,
      talent_telegram_links!inner(telegram_user_id, telegram_chat_id),
      casting_calls!inner(production_id)
    `)
    .eq('id', parsed.invitationId)
    .single();

  const telegramLink = Array.isArray(invitation?.talent_telegram_links)
    ? invitation?.talent_telegram_links[0]
    : invitation?.talent_telegram_links;
  const castingCall = Array.isArray(invitation?.casting_calls)
    ? invitation?.casting_calls[0]
    : invitation?.casting_calls;

  if (invitationError || !invitation?.id || !telegramLink || !castingCall) {
    return { ok: false, error: 'Convite não encontrado.' };
  }

  if (Number(telegramLink.telegram_user_id) !== identity.userId) {
    return { ok: false, error: 'Este convite pertence a outra conta do Telegram.' };
  }

  if (invitation.status === parsed.status) {
    return {
      ok: true,
      invitationId: invitation.id,
      status: parsed.status,
      message: parsed.status === 'accepted' ? 'Seu interesse já estava registrado. ✅' : 'Sua indisponibilidade já estava registrada.',
      integrationWarning: false,
    };
  }

  if (invitation.status !== 'sent') {
    return { ok: false, error: 'Este convite não aceita mais respostas.' };
  }

  const respondedAt = new Date().toISOString();
  const { data: updatedInvitation, error: updateError } = await supabase
    .from('casting_invitations')
    .update({
      status: parsed.status,
      responded_at: respondedAt,
      response_source: 'telegram',
      last_error: null,
    })
    .eq('id', invitation.id)
    .eq('status', 'sent')
    .select('id')
    .maybeSingle();

  if (updateError || !updatedInvitation?.id) {
    return { ok: false, error: 'Não foi possível registrar sua resposta agora.' };
  }

  await supabase
    .from('casting_shortlist')
    .update({
      selection_status: parsed.status,
      responded_at: respondedAt,
    })
    .eq('id', invitation.shortlist_id)
    .eq('selection_status', 'invited');

  const eventType = parsed.status === 'accepted'
    ? CASTING_EVENT_TYPES.invitationAccepted
    : CASTING_EVENT_TYPES.invitationDeclined;

  const { error: integrationError } = await supabase.from('integration_events').insert(
    castingIntegrationEvent(
      eventType,
      {
        productionId: castingCall.production_id,
        castingCallId: invitation.casting_call_id,
        shortlistId: invitation.shortlist_id,
        invitationId: invitation.id,
        talentId: invitation.talent_id,
      },
      {
        status: parsed.status,
        response_source: 'telegram',
        responded_at: respondedAt,
      },
    ),
  );

  return {
    ok: true,
    invitationId: invitation.id,
    status: parsed.status,
    message: parsed.status === 'accepted'
      ? 'Interesse registrado com sucesso. ✅ A produção será avisada.'
      : 'Tudo certo. Registramos que você não poderá participar desta oportunidade.',
    integrationWarning: Boolean(integrationError),
  };
}
