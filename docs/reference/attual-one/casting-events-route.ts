// ATTUAL ONE — implementação de referência
// Destino sugerido: src/app/api/integrations/casting/events/route.ts

import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CastingEvent = {
  event_id: string;
  event_key: string;
  event_type: string;
  event_version: number;
  source_system: string;
  target_system: string;
  organization_external_id: string | null;
  project_external_id: string | null;
  talent_id: string | null;
  occurred_at: string;
  payload: Record<string, unknown>;
};

function secureEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const integrationSecret = process.env.ATTUAL_ONE_INTEGRATION_SECRET;

  if (!supabaseUrl || !serviceRoleKey || !integrationSecret) {
    throw new Error("Configuração incompleta do receptor do Casting.");
  }

  return { supabaseUrl, serviceRoleKey, integrationSecret };
}

function isValidEvent(event: Partial<CastingEvent>): event is CastingEvent {
  return Boolean(
    event.event_id &&
      event.event_key &&
      event.event_type &&
      event.event_version &&
      event.source_system === "casting-attual-360" &&
      event.target_system === "attual-one" &&
      event.occurred_at &&
      event.payload &&
      typeof event.payload === "object",
  );
}

export async function POST(request: NextRequest) {
  let config: ReturnType<typeof getConfig>;

  try {
    config = getConfig();
  } catch (error) {
    console.error("[casting-receiver] configuração inválida", error);
    return NextResponse.json({ error: "Receptor indisponível." }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  const receivedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!receivedSecret || !secureEquals(receivedSecret, config.integrationSecret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  const body = (await request.json()) as Partial<CastingEvent>;

  if (!isValidEvent(body) || idempotencyKey !== body.event_key) {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: lookupError } = await supabase
    .from("received_integration_events")
    .select("id,status")
    .eq("event_key", body.event_key)
    .maybeSingle();

  if (lookupError) {
    console.error("[casting-receiver] falha na consulta idempotente", lookupError);
    return NextResponse.json({ error: "Falha ao consultar evento." }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      event_key: body.event_key,
      status: existing.status,
    });
  }

  const { data: inboxEvent, error: insertError } = await supabase
    .from("received_integration_events")
    .insert({
      event_key: body.event_key,
      event_type: body.event_type,
      event_version: body.event_version,
      source_system: body.source_system,
      destination_system: body.target_system,
      organization_external_id: body.organization_external_id,
      project_external_id: body.project_external_id,
      subject_external_id: body.talent_id,
      payload: body.payload,
      headers: { idempotency_key: idempotencyKey },
      status: "processing",
      attempts: 1,
    })
    .select("id")
    .single();

  if (insertError || !inboxEvent) {
    // Uma corrida de concorrência pode gerar unique violation. Trate como duplicado.
    if (insertError?.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true, event_key: body.event_key });
    }

    console.error("[casting-receiver] falha ao registrar evento", insertError);
    return NextResponse.json({ error: "Falha ao registrar evento." }, { status: 500 });
  }

  try {
    if (body.event_type === "talent.telegram.linked.v1") {
      const telegramUserId = body.payload.telegram_user_id;
      const telegramChatId = body.payload.telegram_chat_id;
      const linkedAt = body.payload.linked_at;

      if (!body.talent_id || !telegramUserId || !telegramChatId || !linkedAt) {
        throw new Error("Payload incompleto para talent.telegram.linked.v1.");
      }

      const { error: syncError } = await supabase
        .from("casting_talent_integrations")
        .upsert(
          {
            source_system: "casting-attual-360",
            talent_external_id: body.talent_id,
            organization_external_id: body.organization_external_id,
            project_external_id: body.project_external_id,
            telegram_user_id: String(telegramUserId),
            telegram_chat_id: String(telegramChatId),
            telegram_linked_at: String(linkedAt),
            sync_status: "active",
            last_event_key: body.event_key,
            last_event_type: body.event_type,
            last_sync_at: new Date().toISOString(),
            metadata: {
              telegram_username: body.payload.telegram_username ?? null,
            },
          },
          { onConflict: "source_system,talent_external_id" },
        );

      if (syncError) throw syncError;
    } else {
      await supabase
        .from("received_integration_events")
        .update({ status: "ignored", processed_at: new Date().toISOString() })
        .eq("id", inboxEvent.id);

      return NextResponse.json({ ok: true, ignored: true, event_key: body.event_key });
    }

    const { error: completeError } = await supabase
      .from("received_integration_events")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", inboxEvent.id);

    if (completeError) throw completeError;

    return NextResponse.json({ ok: true, duplicate: false, event_key: body.event_key });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";

    await supabase
      .from("received_integration_events")
      .update({ status: "failed", last_error: message.slice(0, 1000) })
      .eq("id", inboxEvent.id);

    console.error("[casting-receiver] falha no processamento", message);
    return NextResponse.json({ error: "Evento registrado, mas não processado." }, { status: 500 });
  }
}
