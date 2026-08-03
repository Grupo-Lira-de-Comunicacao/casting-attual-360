import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { linkTelegramInvitation } from "@/lib/telegram/linking";
import { respondToCastingInvitation } from "@/lib/telegram/responses";

type TelegramUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
};

type TelegramMessage = {
  message_id?: number;
  chat?: { id?: number; type?: string };
  from?: TelegramUser;
  text?: string;
};

type TelegramCallbackQuery = {
  id?: string;
  from?: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

const START_MESSAGE = [
  "Olá! Bem-vindo ao Casting Attual 360.",
  "",
  "Por aqui você poderá acompanhar seu cadastro, receber convites e confirmar oportunidades.",
  "",
  "Use /ajuda para consultar os comandos disponíveis.",
].join("\n");

const LINKED_INVITATION_MESSAGE = [
  "Telegram vinculado com sucesso ao Casting Attual 360.",
  "",
  "Seu convite está pronto para a próxima etapa. Você receberá por aqui os detalhes e as opções de resposta.",
].join("\n");

const HELP_MESSAGE = [
  "Comandos disponíveis:",
  "/start — iniciar o atendimento",
  "/ajuda — ver esta lista",
  "/status — consultar o estágio atual da integração",
  "/vincular CODIGO — conectar seu cadastro pelo fluxo legado",
].join("\n");

const STATUS_MESSAGE =
  "A integração do Casting Attual 360 com o Telegram e o ATTUAL ONE está em implantação. O catálogo e o painel administrativo continuam sendo a fonte oficial neste estágio.";

function parseCommand(text?: string) {
  if (!text) return { name: null as string | null, args: [] as string[] };
  const parts = text.trim().split(/\s+/);
  const rawCommand = parts.shift()?.toLowerCase();
  if (!rawCommand?.startsWith("/")) return { name: null as string | null, args: [] as string[] };
  return { name: rawCommand.replace(/@[a-zA-Z0-9_]+$/, ""), args: parts };
}

function hashLinkCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function createServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function registerIntegrationEvent(supabase: SupabaseClient | null, update: TelegramUpdate, command: string | null) {
  if (!supabase) return;
  const message = update.message ?? update.callback_query?.message;
  const actor = update.message?.from ?? update.callback_query?.from;
  const { error } = await supabase.from("integration_events").insert({
    event_type: update.callback_query
      ? "telegram.callback.received"
      : command
        ? "telegram.command.received"
        : "telegram.update.received",
    source_system: "telegram",
    target_system: "casting-attual-360",
    payload: {
      update_id: update.update_id,
      command,
      callback_data: update.callback_query?.data,
      message_id: message?.message_id,
      chat_id: message?.chat?.id,
      chat_type: message?.chat?.type,
      telegram_user_id: actor?.id,
      telegram_username: actor?.username,
      primeiro_nome: actor?.first_name,
      ultimo_nome: actor?.last_name,
      idioma: actor?.language_code,
    },
  });
  if (error) console.error("Unable to register Telegram integration event.", error.message);
}

async function linkTalentAccount(supabase: SupabaseClient | null, update: TelegramUpdate, code?: string): Promise<string> {
  if (!supabase) return "O vínculo ainda não está disponível porque a integração do servidor não foi configurada.";

  const message = update.message;
  const userId = message?.from?.id;
  const chatId = message?.chat?.id;
  if (!userId || !chatId) return "Não foi possível identificar sua conta do Telegram.";
  if (!code) return "Informe o código recebido pela produção. Exemplo: /vincular ABCD2345";

  const now = new Date().toISOString();
  const { data: token } = await supabase
    .from("telegram_link_tokens")
    .select("id, talent_id")
    .eq("token_hash", hashLinkCode(code))
    .is("usado_em", null)
    .is("cancelado_em", null)
    .gt("expira_em", now)
    .maybeSingle();

  if (!token) return "Código inválido, expirado ou já utilizado. Solicite um novo código à produção.";

  const { data: byTalent } = await supabase
    .from("talent_telegram_accounts")
    .select("id, telegram_user_id")
    .eq("talent_id", token.talent_id)
    .eq("ativo", true)
    .maybeSingle();
  if (byTalent && Number(byTalent.telegram_user_id) !== userId) {
    return "Este cadastro já está vinculado a outra conta. Fale com a produção para revisar o vínculo.";
  }

  const { data: byUser } = await supabase
    .from("talent_telegram_accounts")
    .select("id, talent_id")
    .eq("telegram_user_id", userId)
    .maybeSingle();
  if (byUser && byUser.talent_id !== token.talent_id) {
    return "Esta conta do Telegram já está vinculada a outro cadastro. Fale com a produção.";
  }

  const payload = {
    talent_id: token.talent_id,
    telegram_user_id: userId,
    telegram_chat_id: chatId,
    telegram_username: message?.from?.username ?? null,
    primeiro_nome: message?.from?.first_name ?? null,
    ultimo_nome: message?.from?.last_name ?? null,
    idioma: message?.from?.language_code ?? null,
    consentimento_mensagens: true,
    consentimento_em: now,
    ativo: true,
  };

  const accountId = byTalent?.id ?? byUser?.id;
  const operation = accountId
    ? supabase.from("talent_telegram_accounts").update(payload).eq("id", accountId)
    : supabase.from("talent_telegram_accounts").insert(payload);
  const { error } = await operation;
  if (error) return "Não foi possível concluir o vínculo agora. Tente novamente ou fale com a produção.";

  await supabase
    .from("telegram_link_tokens")
    .update({ usado_em: now, telegram_user_id: userId, telegram_chat_id: chatId })
    .eq("id", token.id)
    .is("usado_em", null);

  await supabase.from("integration_events").insert({
    event_type: "talent.telegram.linked.v1",
    source_system: "casting-attual-360",
    target_system: "attual-one",
    talent_id: token.talent_id,
    payload: { telegram_user_id: userId, telegram_chat_id: chatId, linked_at: now },
  });

  return "Cadastro vinculado com sucesso ao Casting Attual 360. A partir de agora você poderá receber avisos e convites por aqui.";
}

async function linkInvitationFromStart(update: TelegramUpdate, payload?: string) {
  if (!payload?.startsWith("invite_")) return null;
  const userId = update.message?.from?.id;
  const chatId = update.message?.chat?.id;
  if (!userId || !chatId) return "Não foi possível identificar sua conta do Telegram.";
  const result = await linkTelegramInvitation(payload, {
    userId,
    chatId,
    username: update.message?.from?.username ?? null,
  });
  return result.ok ? LINKED_INVITATION_MESSAGE : result.error;
}

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!response.ok) throw new Error(`Telegram API rejected the message with status ${response.status}.`);
}

async function answerCallbackQuery(token: string, callbackId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId, text }),
  });
  if (!response.ok) console.error(`Telegram answerCallbackQuery failed with status ${response.status}.`);
}

async function handleInvitationCallback(token: string, update: TelegramUpdate) {
  const callback = update.callback_query;
  if (!callback?.id || !callback.data || !callback.from?.id) return false;
  if (!callback.data.startsWith("invitation_")) return false;

  const result = await respondToCastingInvitation(callback.data, {
    userId: callback.from.id,
    chatId: callback.message?.chat?.id ?? null,
  });
  const message = result.ok ? result.message : result.error;
  await answerCallbackQuery(token, callback.id, message);
  const chatId = callback.message?.chat?.id;
  if (chatId !== undefined) await sendTelegramMessage(token, chatId, message);
  return true;
}

export async function POST(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!token || !webhookSecret) {
      return NextResponse.json({ ok: false, error: "Webhook configuration error." }, { status: 500 });
    }

    if (request.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret) {
      return NextResponse.json({ ok: false, error: "Unauthorized webhook request." }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const command = parseCommand(update.message?.text);
    const supabase = createServerSupabase();
    await registerIntegrationEvent(supabase, update, command.name);

    if (await handleInvitationCallback(token, update)) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const chatId = update.message?.chat?.id;
    let reply: string | null = null;
    if (command.name === "/start") {
      reply = (await linkInvitationFromStart(update, command.args[0])) ?? START_MESSAGE;
    } else if (command.name === "/ajuda" || command.name === "/help") {
      reply = HELP_MESSAGE;
    } else if (command.name === "/status") {
      reply = STATUS_MESSAGE;
    } else if (command.name === "/vincular") {
      reply = await linkTalentAccount(supabase, update, command.args[0]);
    }

    if (chatId !== undefined && reply) await sendTelegramMessage(token, chatId, reply);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to process Telegram webhook update.", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Invalid webhook request." }, { status: 400 });
  }
}
