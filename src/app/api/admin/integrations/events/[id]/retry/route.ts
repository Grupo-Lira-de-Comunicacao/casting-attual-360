import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Identificador do evento é obrigatório." },
      { status: 400 },
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

  const { data: event, error } = await supabase.rpc("retry_integration_event", {
    p_event_id: id,
    p_admin_user_id: user.id,
  });

  if (error) {
    const notEligible = error.message.includes("não elegível");
    console.error("Unable to retry integration event.", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: notEligible
          ? "Evento inexistente ou não elegível para reprocessamento."
          : "Não foi possível reenviar o evento para a fila.",
      },
      { status: notEligible ? 409 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    event,
    message: "Evento devolvido à fila de integração.",
  });
}
