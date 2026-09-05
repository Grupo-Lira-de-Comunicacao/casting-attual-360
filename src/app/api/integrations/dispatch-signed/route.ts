import { NextRequest, NextResponse } from "next/server";

import { POST as dispatchQueue } from "../dispatch/route";
import { verifySignedDispatcherRequest } from "@/lib/integrations/dispatch-signed-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const publicKeyBase64 = process.env.CASTING360_DISPATCH_PUBLIC_KEY;
  const dispatcherSecret = process.env.INTEGRATION_DISPATCH_SECRET;

  if (!publicKeyBase64 || !dispatcherSecret) {
    console.error("[signed-dispatcher] configuracao incompleta");
    return NextResponse.json({ error: "Dispatcher indisponivel." }, { status: 503 });
  }

  const authorized = verifySignedDispatcherRequest({
    publicKeyBase64,
    timestampHeader: request.headers.get("x-dispatch-timestamp"),
    signatureHeader: request.headers.get("x-dispatch-signature"),
  });

  if (!authorized) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const internalRequest = new NextRequest(
    new URL("/api/integrations/dispatch", request.url),
    {
      method: "POST",
      headers: {
        "x-integration-dispatch-secret": dispatcherSecret,
      },
    },
  );

  return dispatchQueue(internalRequest);
}
