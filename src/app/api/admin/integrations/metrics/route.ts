import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

function parseBoundedInt(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(parsed, maximum));
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

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    console.error("Unable to verify integration metrics administrator.", adminError.message);
    return NextResponse.json(
      { ok: false, error: "Não foi possível validar a permissão administrativa." },
      { status: 500 },
    );
  }

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Usuário sem permissão administrativa." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const windowHours = parseBoundedInt(
    url.searchParams.get("window_hours"),
    24,
    1,
    720,
  );
  const stuckMinutes = parseBoundedInt(
    url.searchParams.get("stuck_minutes"),
    15,
    1,
    1_440,
  );

  const { data, error } = await supabase.rpc("get_integration_metrics", {
    p_window_hours: windowHours,
    p_stuck_minutes: stuckMinutes,
  });

  if (error) {
    console.error("Unable to load integration metrics.", error.message);
    return NextResponse.json(
      { ok: false, error: "Não foi possível carregar as métricas de integração." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      metrics: data,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
