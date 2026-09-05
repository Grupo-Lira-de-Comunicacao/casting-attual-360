import { createPublicKey, verify } from "node:crypto";

export const SIGNED_DISPATCH_PATH = "/api/integrations/dispatch-signed";
export const SIGNED_DISPATCH_MAX_SKEW_SECONDS = 120;

export function signedDispatcherPayload(timestamp: number) {
  return `${timestamp}\nPOST\n${SIGNED_DISPATCH_PATH}`;
}

type VerifySignedDispatcherRequestInput = {
  publicKeyBase64: string;
  timestampHeader: string | null;
  signatureHeader: string | null;
  nowMs?: number;
};

export function verifySignedDispatcherRequest({
  publicKeyBase64,
  timestampHeader,
  signatureHeader,
  nowMs = Date.now(),
}: VerifySignedDispatcherRequestInput) {
  if (!publicKeyBase64 || !timestampHeader || !signatureHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) return false;

  const nowSeconds = Math.floor(nowMs / 1000);
  if (Math.abs(nowSeconds - timestamp) > SIGNED_DISPATCH_MAX_SKEW_SECONDS) {
    return false;
  }

  try {
    const publicKey = createPublicKey({
      key: Buffer.from(publicKeyBase64, "base64"),
      format: "der",
      type: "spki",
    });
    const signature = Buffer.from(signatureHeader, "base64");
    if (signature.length !== 64) return false;

    return verify(
      null,
      Buffer.from(signedDispatcherPayload(timestamp), "utf8"),
      publicKey,
      signature,
    );
  } catch {
    return false;
  }
}
