import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import {
  classifyDispatchFailure,
  isRetryDue,
  isScheduledRetryDue,
  retryAfterAt,
  signedCastingHeaders,
} from "@/lib/integrations/dispatch-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 20;
const MAX_ATTEMPTS = 7;
const STALE_PROCESSING_MINUTES = 15;
const MAX_RESPONSE_LENGTH = 2_000;

type IntegrationEvent = {
  id: string;
  event_key: string;
  event_type: string;
  source_system: string;
  target_system: string;
  organization_external_id: string | null;
  project_external_id: string | null;
  talent_id: string | null;
  payload: Record<string, unknown>;
  tentativas: number;
  criado_em: string;
  atualizado_em: string;
  proxima_tentativa_em: string | null;
};

function getServerConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dispatcherSecret = process.env.INTEGRATION_DISPATCH_SECRET;
  const attualOneEventsUrl = process.env.ATTUAL_ONE_EVENTS_URL;
  const attualOneSecret = process.env.ATTUAL_ONE_INTEGRATION_SECRET;

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !dispatcherSecret ||
    !attualOneEventsUrl ||
    !attualOneSecret
  ) {
    throw new Error("Configuracao incompleta do dispatcher de integracao.");
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    dispatcherSecret,
    attualOneEventsUrl,
    attualOneSecret,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido";
}

function responsePayload(raw: string) {
  const limited = raw.slice(0, MAX_RESPONSE_LENGTH);

  if (!limited) return null;

  try {
    return JSON.parse(limited) as Record<string, unknown>;
  } catch {
    return { raw: limited };
  }
}

export async function POST(request: NextRequest) {
  let config: ReturnType<typeof getServerConfig>;

  try {
    config = getServerConfig();
  } catch (error) {
    console.error("[dispatcher] configuracao invalida", error);
    return NextResponse.json({ error: "Dispatcher indisponivel." }, { status: 503 });
  }

  const receivedSecret = request.headers.get("x-integration-dispatch-secret");

  if (!receivedSecret || receivedSecret !== config.dispatcherSecret) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const staleBefore = new Date(
    Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: staleEvents, error: staleQueryError } = await supabase
    .from("integration_events")
    .select("id,tentativas")
    .eq("target_system", "attual-one")
    .eq("status", "processando")
    .lt("atualizado_em", staleBefore)
    .lt("tentativas", MAX_ATTEMPTS);

  if (staleQueryError) {
    console.error("[dispatcher] falha ao localizar eventos presos", staleQueryError);
    return NextResponse.json(
      { error: "Falha ao localizar eventos interrompidos." },
      { status: 500 },
    );
  }

  for (const staleEvent of staleEvents ?? []) {
    await supabase
      .from("integration_event_attempts")
      .update({
        status: "interrompido",
        finished_at: new Date().toISOString(),
        error_message: `Processamento interrompido por mais de ${STALE_PROCESSING_MINUTES} minutos.`,
      })
      .eq("event_id", staleEvent.id)
      .eq("attempt_number", staleEvent.tentativas)
      .eq("status", "processando");
  }

  const staleIds = (staleEvents ?? []).map((event) => event.id);
  let recoveredCount = 0;

  if (staleIds.length > 0) {
    const { data: recoveredEvents, error: recoveryError } = await supabase
      .from("integration_events")
      .update({
        status: "falhou",
        proxima_tentativa_em: null,
        ultimo_erro: `Processamento interrompido por mais de ${STALE_PROCESSING_MINUTES} minutos; liberado para nova tentativa.`,
      })
      .in("id", staleIds)
      .eq("status", "processando")
      .select("id");

    if (recoveryError) {
      console.error("[dispatcher] falha ao recuperar eventos presos", recoveryError);
      return NextResponse.json(
        { error: "Falha ao recuperar eventos interrompidos." },
        { status: 500 },
      );
    }

    recoveredCount = recoveredEvents?.length ?? 0;
  }

  const { data, error } = await supabase
    .from("integration_events")
    .select(
      "id,event_key,event_type,source_system,target_system,organization_external_id,project_external_id,talent_id,payload,tentativas,criado_em,atualizado_em,proxima_tentativa_em",
    )
    .eq("target_system", "attual-one")
    .in("status", ["pendente", "falhou"])
    .lt("tentativas", MAX_ATTEMPTS)
    .order("criado_em", { ascending: true })
    .limit(MAX_BATCH_SIZE * 5);

  if (error) {
    console.error("[dispatcher] falha ao consultar fila", error);
    return NextResponse.json({ error: "Falha ao consultar fila." }, { status: 500 });
  }

  const now = Date.now();
  const events = ((data ?? []) as IntegrationEvent[])
    .filter(
      (event) =>
        isScheduledRetryDue(event.proxima_tentativa_em, now) &&
        (event.tentativas === 0 ||
          isRetryDue(
            event.tentativas,
            event.atualizado_em,
            now,
            event.event_key,
          )),
    )
    .slice(0, MAX_BATCH_SIZE);
  const results: Array<{ id: string; status: "processado" | "falhou"; error?: string }> = [];

  for (const event of events) {
    const nextAttempt = event.tentativas + 1;

    const { data: claimedEvent, error: claimError } = await supabase
      .from("integration_events")
      .update({
        status: "processando",
        tentativas: nextAttempt,
        proxima_tentativa_em: null,
        ultimo_erro: null,
      })
      .eq("id", event.id)
      .in("status", ["pendente", "falhou"])
      .select("id")
      .maybeSingle();

    if (claimError || !claimedEvent) {
      results.push({
        id: event.id,
        status: "falhou",
        error: claimError?.message ?? "Evento ja capturado por outro processo.",
      });
      continue;
    }

    const startedAt = new Date();
    const { data: attempt, error: attemptError } = await supabase
      .from("integration_event_attempts")
      .insert({
        event_id: event.id,
        attempt_number: nextAttempt,
        started_at: startedAt.toISOString(),
        status: "processando",
      })
      .select("id")
      .single();

    if (attemptError || !attempt) {
      const message = `Nao foi possivel iniciar a auditoria da tentativa: ${attemptError?.message ?? "erro desconhecido"}`;

      await supabase
        .from("integration_events")
        .update({ status: "falhou", ultimo_erro: message })
        .eq("id", event.id);

      results.push({ id: event.id, status: "falhou", error: message });
      continue;
    }

    let httpStatus: number | null = null;
    let receivedPayload: Record<string, unknown> | null = null;
    let retryAfterSchedule: string | null = null;

    try {
      const body = JSON.stringify({
        event_id: event.id,
        event_key: event.event_key,
        event_type: event.event_type,
        event_version: 1,
        source_system: event.source_system,
        target_system: event.target_system,
        organization_external_id: event.organization_external_id,
        project_external_id: event.project_external_id,
        talent_id: event.talent_id,
        occurred_at: event.criado_em,
        payload: event.payload,
      });
      const receiverPath = new URL(config.attualOneEventsUrl).pathname;

      const response = await fetch(config.attualOneEventsUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.attualOneSecret}`,
          "idempotency-key": event.event_key,
          ...signedCastingHeaders({
            body,
            eventKey: event.event_key,
            path: receiverPath,
            secret: config.attualOneSecret,
          }),
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });

      httpStatus = response.status;
      if (httpStatus === 429) {
        retryAfterSchedule = retryAfterAt(response.headers.get("retry-after"));
      }

      const responseText = await response.text();
      receivedPayload = responsePayload(responseText);

      if (!response.ok) {
        throw new Error(
          `ATTUAL ONE respondeu ${response.status}: ${responseText.slice(0, 300)}`,
        );
      }

      const { error: completeError } = await supabase
        .from("integration_events")
        .update({
          status: "processado",
          processado_em: new Date().toISOString(),
          proxima_tentativa_em: null,
          ultimo_erro: null,
        })
        .eq("id", event.id);

      if (completeError) {
        throw new Error(`Evento entregue, mas nao finalizado: ${completeError.message}`);
      }

      await supabase
        .from("integration_event_attempts")
        .update({
          status: "processado",
          finished_at: new Date().toISOString(),
          http_status: httpStatus,
          response_payload: receivedPayload,
          duration_ms: Date.now() - startedAt.getTime(),
          error_message: null,
        })
        .eq("id", attempt.id);

      results.push({ id: event.id, status: "processado" });
    } catch (dispatchError) {
      const message = errorMessage(dispatchError).slice(0, 1000);
      const finishedAt = new Date().toISOString();

      const terminal =
        classifyDispatchFailure(httpStatus) === "permanent" || nextAttempt >= MAX_ATTEMPTS;

      await Promise.all([
        supabase
          .from("integration_events")
          .update({
            status: terminal ? "cancelado" : "falhou",
            proxima_tentativa_em: terminal ? null : retryAfterSchedule,
            ultimo_erro: message,
          })
          .eq("id", event.id),
        supabase
          .from("integration_event_attempts")
          .update({
            status: "falhou",
            finished_at: finishedAt,
            http_status: httpStatus,
            response_payload: receivedPayload,
            duration_ms: Date.now() - startedAt.getTime(),
            error_message: message,
          })
          .eq("id", attempt.id),
      ]);

      results.push({ id: event.id, status: "falhou", error: message });
    }
  }

  return NextResponse.json({
    recovered: recoveredCount,
    selected: events.length,
    processed: results.filter((item) => item.status === "processado").length,
    failed: results.filter((item) => item.status === "falhou").length,
    results,
  });
}
