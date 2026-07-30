import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const TOKEN_TTL_MINUTES = 15;
const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type RequestBody = {
  talent_id?: string;
};

function createLinkCode(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (byte) => TOKEN_ALPHABET[byte % TOKEN_ALPHABET.length]).join("");
}

function hashCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice(7).trim() || null;
}

export async function POST(request: Request) {
  try {
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

    const body = (await request.json()) as RequestBody;
    if (!body.talent_id) {
      return NextResponse.json(
        { ok: false, error: "talent_id é obrigatório." },
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

    const { data: talent } = await supabase
      .from("talents")
      .select("id, nome")
      .eq("id", body.talent_id)
      .maybeSingle();

    if (!talent) {
      return NextResponse.json(
        { ok: false, error: "Talento não encontrado." },
        { status: 404 },
      );
    }

    await supabase
      .from("telegram_link_tokens")
      .update({ cancelado_em: new Date().toISOString() })
      .eq("talent_id", talent.id)
      .is("usado_em", null)
      .is("cancelado_em", null);

    const code = createLinkCode();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();

    const { error: insertError } = await supabase.from("telegram_link_tokens").insert({
      talent_id: talent.id,
      token_hash: hashCode(code),
      solicitado_por: user.id,
      expira_em: expiresAt,
    });

    if (insertError) {
      console.error("Unable to create Telegram link token.", insertError.message);
      return NextResponse.json(
        { ok: false, error: "Não foi possível gerar o código de vínculo." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      talent: { id: talent.id, nome: talent.nome },
      code,
      expires_at: expiresAt,
      command: `/vincular ${code}`,
    });
  } catch (error) {
    console.error(
      "Failed to create Telegram link token.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { ok: false, error: "Requisição inválida." },
      { status: 400 },
    );
  }
}
