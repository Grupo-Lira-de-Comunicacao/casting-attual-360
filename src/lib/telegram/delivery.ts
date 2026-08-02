import { createAdminClient } from '@/lib/supabase/admin';

type TelegramSendMessageResponse = {
  ok?: boolean;
  result?: { message_id?: number };
  description?: string;
};

export type SendCastingInvitationResult =
  | { ok: true; invitationId: string; messageId: number; integrationWarning: boolean }
  | { ok: false; error: string };

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function formatMoney(value: number | string | null | undefined, currency: string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
  }).format(numeric);
}

export async function sendCastingInvitation(invitationId: string): Promise<SendCastingInvitationResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { ok: false, error: 'TELEGRAM_BOT_TOKEN não configurado.' };

  const supabase = createAdminClient();
  const { data: invitation, error: invitationError } = await supabase
    .from('casting_invitations')
    .select(`
      id, status, talent_id, shortlist_id, casting_call_id,
      talent_telegram_links!inner(telegram_chat_id, telegram_user_id),
      casting_calls!inner(
        title, role_name, work_starts_at, city, state, venue,
        compensation_amount, currency, compensation_notes, production_id
      )
    `)
    .eq('id', invitationId)
    .single();

  const telegramLink = Array.isArray(invitation?.talent_telegram_links)
    ? invitation?.talent_telegram_links[0]
    : invitation?.talent_telegram_links;
  const castingCall = Array.isArray(invitation?.casting_calls)
    ? invitation?.casting_calls[0]
    : invitation?.casting_calls;

  if (invitationError || !invitation?.id || !telegramLink?.telegram_chat_id || !castingCall) {
    return { ok: false, error: 'Convite pronto para envio não encontrado.' };
  }

  if (invitation.status !== 'ready') {
    return { ok: false, error: 'Somente convites prontos podem ser enviados.' };
  }

  const date = formatDate(castingCall.work_starts_at);
  const compensation = formatMoney(castingCall.compensation_amount, castingCall.currency);
  const location = [castingCall.venue, castingCall.city, castingCall.state].filter(Boolean).join(' — ');

  const lines = [
    '🎬 Convite — Casting Attual 360',
    '',
    `Projeto: ${castingCall.title}`,
    `Função: ${castingCall.role_name}`,
    date ? `Data: ${date}` : null,
    location ? `Local: ${location}` : null,
    compensation ? `Cachê: ${compensation}` : null,
    castingCall.compensation_notes ? `Condição: ${castingCall.compensation_notes}` : null,
    '',
    'Você tem interesse em participar desta oportunidade?',
  ].filter((line): line is string => Boolean(line));

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramLink.telegram_chat_id,
      text: lines.join('\n'),
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Tenho interesse', callback_data: `invitation_accept:${invitation.id}` },
          { text: '❌ Não posso', callback_data: `invitation_decline:${invitation.id}` },
        ]],
      },
    }),
  });

  const body = (await response.json().catch(() => ({}))) as TelegramSendMessageResponse;
  const messageId = body.result?.message_id;

  if (!response.ok || !body.ok || !messageId) {
    const errorMessage = body.description || `Telegram respondeu HTTP ${response.status}.`;
    await supabase
      .from('casting_invitations')
      .update({ status: 'failed', last_error: errorMessage })
      .eq('id', invitation.id)
      .eq('status', 'ready');
    return { ok: false, error: errorMessage };
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('casting_invitations')
    .update({
      status: 'sent',
      telegram_message_id: messageId,
      sent_at: sentAt,
      last_error: null,
    })
    .eq('id', invitation.id)
    .eq('status', 'ready');

  if (updateError) {
    return { ok: false, error: 'Mensagem enviada, mas o status do convite não pôde ser atualizado.' };
  }

  await supabase
    .from('casting_shortlist')
    .update({ selection_status: 'invited', invited_at: sentAt })
    .eq('id', invitation.shortlist_id)
    .eq('selection_status', 'shortlisted');

  const { error: integrationError } = await supabase.from('integration_events').insert({
    event_type: 'casting.invitation.sent',
    source_system: 'casting-attual-360',
    target_system: 'attual-one',
    production_id: castingCall.production_id,
    casting_call_id: invitation.casting_call_id,
    shortlist_id: invitation.shortlist_id,
    invitation_id: invitation.id,
    payload: {
      invitation_id: invitation.id,
      talent_id: invitation.talent_id,
      casting_call_id: invitation.casting_call_id,
      production_id: castingCall.production_id,
      channel: 'telegram',
      telegram_message_id: messageId,
      sent_at: sentAt,
    },
  });

  return {
    ok: true,
    invitationId: invitation.id,
    messageId,
    integrationWarning: Boolean(integrationError),
  };
}
