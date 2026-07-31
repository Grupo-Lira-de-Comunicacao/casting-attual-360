import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const accessToken = getBearerToken(request);

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, error: "Integração com Supabase não configurada." }, { status: 500 });
  }
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Autenticação obrigatória." }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "Sessão inválida ou expirada." }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Usuário sem permissão administrativa." }, { status: 403 });
  }

  const { id } = await context.params;
  const { data: event } = await supabase
    .from("integration_events")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ ok: false, error: "Evento não encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("integration_event_attempts")
    .select("id,event_id,attempt_number,started_at,finished_at,status,http_status,error_message,response_payload,duration_ms,created_at,updated_at")
    .eq("event_id", id)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Unable to list integration event attempts.", error.message);
    return NextResponse.json({ ok: false, error: "Não foi possível carregar o histórico de tentativas." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, attempts: data ?? [] });
}
