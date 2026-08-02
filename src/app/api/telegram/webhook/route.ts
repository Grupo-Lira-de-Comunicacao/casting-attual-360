import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { linkTelegramInvitation } from "@/lib/telegram/linking";

type TelegramUser = {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
};

type TelegramMessage = {
  message_id?: number;
  chat?: {
    id?: number;
    type?: string;
  };
  from?: TelegramUser;
  text?: string;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
};

type ParsedCommand = {
  name: string | null;
  args: string[];
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

function parseCommand(text: string | undefined): ParsedCommand {
  if (!text) return { name: null, args: [] };

  const parts = text.trim().split(/\s+/);
  const rawCommand = parts.shift()?.toLowerCase();
  if (!rawCommand?.startsWith("/")) return { name: null, args: [] };

  return {
    name: rawCommand.replace(/@[a-zA-Z0-9_]+$/, ""),
    args: parts,
  };
}

function getReply(command: string | null): string | null {
  if (command === "/start") return START_MESSAGE;
  if (command === "/ajuda" || command === "/help") return HELP_MESSAGE;
  if (command === "/status") return STATUS_MESSAGE;
  return null;
}

function hashLinkCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function createServerSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function registerIntegrationEvent(
  supabase: SupabaseClient | null,
  update: TelegramUpdate,
  command: string | null,
) {
  if (!supabase) {
    console.warn("Supabase server integration is not configured; event was not recorded.");
    return;
  }

  const message = update.message;
  const { error } = await supabase.from("integration_events").insert({
    event_type: command ? "telegram.command.received" : "telegram.update.received",
    source_system: "telegram",
    target_system: "casting-attual-360",
    payload: {
      update_id: update.update_id,
      command,
      message_id: message?.message_id,
      chat_id: message?.chat?.id,
      chat_type: message?.chat?.type,
      telegram_user_id: message?.from?.id,
      telegram_username: message?.from?.username,
      primeiro_nome: message?.from?.first_name,
      ultimo_nome: message?.from?.last_name,
      idioma: message?.from?.language_code,
    },
  });

  if (error) {
    console.error("Unable to register Telegram integration event.", error.message);
  }
}

async function linkTalentAccount(
  supabase: SupabaseClient | null,
  update: TelegramUpdate,
  code: string | undefined,
): Promise<string> {
  if (!supabase) {
    return "O vínculo ainda não está disponível porque a integração do servidor não foi configurada.";
  }

  const message = update.message;
  const telegramUserId = message?.from?.id;
  const telegramChatId = message?.chat?.id;

  if (!telegramUserId || !telegramChatId) {
    return "Não foi possível identificar sua conta do Telegram.";
  }

  if (!code) {
    return "Informe o código recebido pela produção. Exemplo: /vincular ABCD2345";
  }

  const tokenHash = hashLinkCode(code);
  const now = new Date().toISOString();

  const { data: token, error: tokenError } = await supabase
    .from("telegram_link_tokens")
    .select("id, talent_id, expira_em")
    .eq("token_hash", tokenHash)
    .is("usado_em", null)
    .is("cancelado_em", null)
    .gt("expira_em", now)
    .maybeSingle();

  if (tokenError || !token) {
    return "Código inválido, expirado ou já utilizado. Solicite um novo código à produção.";
  }

  const { data: accountByTalent } = await supabase
    .from("talent_telegram_accounts")
    .select("id, telegram_user_id")
    .eq("talent_id", token.talent_id)
    .eq("ativo", true)
    .maybeSingle();

  if (accountByTalent && accountByTalent.telegram_user_id !== telegramUserId) {
    return "Este cadastro já está vinculado a outra conta. Fale com a produção para revisar o vínculo.";
  }

  const { data: accountByUser } = await supabase
    .from("talent_telegram_accounts")
    .select("id, talent_id")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (accountByUser && accountByUser.talent_id !== token.talent_id) {
    return "Esta conta do Telegram já está vinculada a outro cadastro. Fale com a produção.";
  }

  const accountPayload = {
    talent_id: token.talent_id,
    telegram_user_id: telegramUserId,
    telegram_chat_id: telegramChatId,
    telegram_username: message?.from?.username ?? null,
    primeiro_nome: message?.from?.first_name ?? null,
    ultimo_nome: message?.from?.last_name ?? null,
    idioma: message?.from?.language_code ?? null,
    consentimento_mensagens: true,
    consentimento_em: now,
    ativo: true,
  };

  const accountId = accountByTalent?.id ?? accountByUser?.id;
  const accountOperation = accountId
    ? supabase.from("talent_telegram_accounts").update(accountPayload).eq("id", accountId)
    : supabase.from("talent_telegram_accounts").insert(accountPayload);

  const { error: accountError } = await accountOperation;
  if (accountError) {
    console.error("Unable to link Telegram account.", accountError.message);
    return "Não foi possível concluir o vínculo agora. Tente novamente ou fale com a produção.";
  }

  const { error: tokenUpdateError } = await supabase
    .from("telegram_link_tokens")
    .update({
      usado_em: now,
      telegram_user_id: telegramUserId,
      telegram_chat_id: telegramChatId,
    })
    .eq("id", token.id)
    .is("usado_em", null);

  if (tokenUpdateError) {
    console.error("Unable to mark Telegram link token as used.", tokenUpdateError.message);
  }

  const { error: eventError } = await supabase.from("integration_events").insert({
    event_type: "talent.telegram.linked.v1",
    source_system: "casting-attual-360",
    target_system: "attual-one",
    talent_id: token.talent_id,
    payload: {
      update_id: update.update_id,
      telegram_user_id: telegramUserId,
      telegram_chat_id: telegramChatId,
      telegram_username: message?.from?.username,
      linked_at: now,
    },
  });

  if (eventError) {
    console.error("Unable to register talent.telegram.linked.v1.", eventError.message);
  }

  return "Cadastro vinculado com sucesso ao Casting Attual 360. A partir de agora você poderá receber avisos e convites por aqui.";
}

async function linkInvitationFromStart(update: TelegramUpdate, payload: string | undefined) {
  if (!payload?.startsWith("invite_")) return null;

  const telegramUserId = update.message?.from?.id;
  const telegramChatId = update.message?.chat?.id;
  if (!telegramUserId || !telegramChatId) {
    return "Não foi possível identificar sua conta do Telegram.";
  }

  const result = await linkTelegramInvitation(payload, {
    userId: telegramUserId,
    chatId: telegramChatId,
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

  if (!response.ok) {
    throw new Error(`Telegram API rejected the message with status ${response.status}.`);
  }
}

export async function POST(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!token || !webhookSecret) {
      console.error("Telegram webhook configuration is missing.");
      return NextResponse.json(
        { ok: false, error: "Webhook configuration error." },
        { status: 500 },
      );
    }

    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
    if (receivedSecret !== webhookSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized webhook request." },
        { status: 401 },
      );
    }

    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat?.id;
    const command = parseCommand(update.message?.text);
    const supabase = createServerSupabase();

    await registerIntegrationEvent(supabase, update, command.name);

    let reply = getReply(command.name);
    if (command.name === "/start") {
      reply = (await linkInvitationFromStart(update, command.args[0])) ?? START_MESSAGE;
    }
    if (command.name === "/vincular") {
      reply = await linkTalentAccount(supabase, update, command.args[0]);
    }

    if (chatId !== undefined && reply) {
      await sendTelegramMessage(token, chatId, reply);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error(
      "Failed to process Telegram webhook update.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { ok: false, error: "Invalid webhook request." },
      { status: 400 },
    );
  }
}
