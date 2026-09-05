import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";

import {
  SIGNED_DISPATCH_MAX_SKEW_SECONDS,
  signedDispatcherPayload,
  verifySignedDispatcherRequest,
} from "../src/lib/integrations/dispatch-signed-auth.ts";

function fixture() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const nowMs = Date.parse("2026-09-05T22:30:00.000Z");
  const timestamp = Math.floor(nowMs / 1000);
  const signature = sign(
    null,
    Buffer.from(signedDispatcherPayload(timestamp), "utf8"),
    privateKey,
  ).toString("base64");

  return {
    nowMs,
    timestamp,
    signature,
    publicKeyBase64: publicKey
      .export({ format: "der", type: "spki" })
      .toString("base64"),
  };
}

test("aceita assinatura Ed25519 valida dentro da janela", () => {
  const item = fixture();
  assert.equal(
    verifySignedDispatcherRequest({
      publicKeyBase64: item.publicKeyBase64,
      timestampHeader: String(item.timestamp),
      signatureHeader: item.signature,
      nowMs: item.nowMs,
    }),
    true,
  );
});

test("rejeita assinatura adulterada", () => {
  const item = fixture();
  const tampered = Buffer.from(item.signature, "base64");
  tampered[0] ^= 1;

  assert.equal(
    verifySignedDispatcherRequest({
      publicKeyBase64: item.publicKeyBase64,
      timestampHeader: String(item.timestamp),
      signatureHeader: tampered.toString("base64"),
      nowMs: item.nowMs,
    }),
    false,
  );
});

test("rejeita timestamp fora da janela anti-replay", () => {
  const item = fixture();
  assert.equal(
    verifySignedDispatcherRequest({
      publicKeyBase64: item.publicKeyBase64,
      timestampHeader: String(item.timestamp),
      signatureHeader: item.signature,
      nowMs:
        item.nowMs +
        (SIGNED_DISPATCH_MAX_SKEW_SECONDS + 1) * 1000,
    }),
    false,
  );
});
