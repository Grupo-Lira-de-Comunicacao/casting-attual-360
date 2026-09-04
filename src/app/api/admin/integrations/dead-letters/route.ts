import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
  const state = url.searchParams.get("state")?.trim() || "dead_letter";

  if (state !== "dead_letter" && state !== "reprocessed") {
    return NextResponse.json(
      { ok: false, error: "Estado de dead-letter inválido." },
      { status: 400 },
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count, error } = await supabase
    .from("integration_event_dead_letters")
    .select(
      "id,event_id,event_key,invitation_id,event_type,payload_hash,attempt_count,first_error,last_error,first_attempt_at,last_attempt_at,last_http_status,correlation_id,reason,state,reprocess_count,last_reprocessed_at,last_reprocessed_by,created_at,updated_at",
      { count: "exact" },
    )
    .eq("state", state)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Unable to list integration dead letters.", error.message);
    return NextResponse.json(
      { ok: false, error: "Não foi possível carregar a fila de dead-letter." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    dead_letters: data ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
    filters: { state },
  });
}
