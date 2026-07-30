import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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

const START_MESSAGE = [
  "Olá! Bem-vindo ao Casting Attual 360.",
  "",
  "Por aqui você poderá acompanhar seu cadastro, receber convites e confirmar oportunidades.",
  "",
  "Use /ajuda para consultar os comandos disponíveis.",
].join("\n");

const HELP_MESSAGE = [
  "Comandos disponíveis:",
  "/start — iniciar o atendimento",
  "/ajuda — ver esta lista",
  "/status — consultar o estágio atual da integração",
].join("\n");

const STATUS_MESSAGE =
  "A integração do Casting Attual 360 com o Telegram e o ATTUAL ONE está em implantação. O catálogo e o painel administrativo continuam sendo a fonte oficial neste estágio.";

function getCommand(text: string | undefined): string | null {
  if (!text) return null;

  const command = text.trim().split(/\s+/, 1)[0]?.toLowerCase();
  if (!command?.startsWith("/")) return null;

  return command.replace(/@[a-zA-Z0-9_]+$/, "");
}

function getReply(command: string | null): string | null {
  if (command === "/start") return START_MESSAGE;
  if (command === "/ajuda" || command === "/help") return HELP_MESSAGE;
  if (command === "/status") return STATUS_MESSAGE;
  return null;
}

async function registerIntegrationEvent(update: TelegramUpdate, command: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Supabase server integration is not configured; event was not recorded.");
    return;
  }

  const message = update.message;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

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
    const command = getCommand(update.message?.text);
    const reply = getReply(command);

    await registerIntegrationEvent(update, command);

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
