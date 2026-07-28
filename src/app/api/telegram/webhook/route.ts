import { NextResponse } from "next/server";

type TelegramMessage = {
  chat?: {
    id?: number;
  };
  text?: string;
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

const START_MESSAGE =
  "Olá! Bem-vindo ao Casting Attual 360. Em breve, você poderá acompanhar oportunidades e novidades por aqui.";

function isStartCommand(text: string | undefined): boolean {
  if (!text) {
    return false;
  }

  const command = text.trim().split(/\s+/, 1)[0];
  return /^\/start(?:@[a-zA-Z0-9_]+)?$/.test(command);
}

export async function POST(request: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.error("Telegram webhook configuration is missing.");
      return NextResponse.json(
        { ok: false, error: "Webhook configuration error." },
        { status: 500 },
      );
    }

    const update = (await request.json()) as TelegramUpdate;
    const chatId = update.message?.chat?.id;

    if (chatId !== undefined && isStartCommand(update.message?.text)) {
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: START_MESSAGE,
          }),
        },
      );

      if (!telegramResponse.ok) {
        console.error("Telegram API rejected the webhook response.");
        return NextResponse.json(
          { ok: false, error: "Unable to send Telegram message." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    console.error("Failed to process Telegram webhook update.");
    return NextResponse.json(
      { ok: false, error: "Invalid webhook request." },
      { status: 400 },
    );
  }
}
