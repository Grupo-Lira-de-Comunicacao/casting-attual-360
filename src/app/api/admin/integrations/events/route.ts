import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const ALLOWED_STATUSES = new Set([
  "pendente",
  "processando",
  "processado",
  "falhou",
  "cancelado",
]);

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = getBearerToken(request);

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "Integração com Supabase não configurada." },
      { status: 500 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Autenticação obrigatória." },
      { status: 401 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Sessão inválida ou expirada." },
      { status: 401 },
    );
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Usuário sem permissão administrativa." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const page = parsePositiveInt(url.searchParams.get("page"), 1, 10_000);
  const limit = parsePositiveInt(url.searchParams.get("limit"), 25, 100);
  const status = url.searchParams.get("status")?.trim() || null;
  const eventType = url.searchParams.get("event_type")?.trim() || null;
  const targetSystem = url.searchParams.get("target_system")?.trim() || null;

  if (status && !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json(
      { ok: false, error: "Status de evento inválido." },
      { status: 400 },
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("integration_events")
    .select(
      "id,event_key,event_type,source_system,target_system,organization_external_id,project_external_id,talent_id,payload,status,tentativas,ultimo_erro,processado_em,criado_em,atualizado_em,reprocessamentos,ultimo_reprocessamento_em,ultimo_reprocessamento_por",
      { count: "exact" },
    )
    .order("criado_em", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (eventType) query = query.eq("event_type", eventType);
  if (targetSystem) query = query.eq("target_system", targetSystem);

  const { data, count, error } = await query;

  if (error) {
    console.error("Unable to list integration events.", error.message);
    return NextResponse.json(
      { ok: false, error: "Não foi possível carregar os eventos de integração." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    events: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
    filters: {
      status,
      event_type: eventType,
      target_system: targetSystem,
    },
  });
}
