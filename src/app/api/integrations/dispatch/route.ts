import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 20;
const MAX_ATTEMPTS = 10;

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

  const { data, error } = await supabase
    .from("integration_events")
    .select(
      "id,event_key,event_type,source_system,target_system,organization_external_id,project_external_id,talent_id,payload,tentativas,criado_em",
    )
    .eq("target_system", "attual-one")
    .in("status", ["pendente", "falhou"])
    .lt("tentativas", MAX_ATTEMPTS)
    .order("criado_em", { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (error) {
    console.error("[dispatcher] falha ao consultar fila", error);
    return NextResponse.json({ error: "Falha ao consultar fila." }, { status: 500 });
  }

  const events = (data ?? []) as IntegrationEvent[];
  const results: Array<{ id: string; status: "processado" | "falhou"; error?: string }> = [];

  for (const event of events) {
    const nextAttempt = event.tentativas + 1;

    const { data: claimedEvent, error: claimError } = await supabase
      .from("integration_events")
      .update({
        status: "processando",
        tentativas: nextAttempt,
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

    try {
      const response = await fetch(config.attualOneEventsUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${config.attualOneSecret}`,
          "idempotency-key": event.event_key,
        },
        body: JSON.stringify({
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
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          `ATTUAL ONE respondeu ${response.status}: ${responseText.slice(0, 300)}`,
        );
      }

      const { error: completeError } = await supabase
        .from("integration_events")
        .update({
          status: "processado",
          processado_em: new Date().toISOString(),
          ultimo_erro: null,
        })
        .eq("id", event.id);

      if (completeError) {
        throw new Error(`Evento entregue, mas nao finalizado: ${completeError.message}`);
      }

      results.push({ id: event.id, status: "processado" });
    } catch (dispatchError) {
      const message = errorMessage(dispatchError).slice(0, 1000);

      await supabase
        .from("integration_events")
        .update({ status: "falhou", ultimo_erro: message })
        .eq("id", event.id);

      results.push({ id: event.id, status: "falhou", error: message });
    }
  }

  return NextResponse.json({
    selected: events.length,
    processed: results.filter((item) => item.status === "processado").length,
    failed: results.filter((item) => item.status === "falhou").length,
    results,
  });
}
