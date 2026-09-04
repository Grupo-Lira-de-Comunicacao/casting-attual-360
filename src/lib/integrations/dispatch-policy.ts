import { createHash, createHmac } from "node:crypto";

const RETRY_DELAYS_MS = [0, 30_000, 120_000, 600_000, 1_800_000, 7_200_000, 21_600_000];
const MAX_JITTER_RATIO = 0.2;

export function retryDelayMs(attempts: number, jitterKey?: string) {
  const baseDelay = RETRY_DELAYS_MS[
    Math.min(Math.max(attempts, 0), RETRY_DELAYS_MS.length - 1)
  ];

  if (baseDelay === 0 || !jitterKey) return baseDelay;

  const digest = createHash("sha256")
    .update(`${jitterKey}:${attempts}`)
    .digest();
  const sample = digest.readUInt32BE(0) / 0xffffffff;
  const jitter = Math.floor(baseDelay * MAX_JITTER_RATIO * sample);

  return baseDelay + jitter;
}

export function isRetryDue(
  attempts: number,
  updatedAt: string,
  now = Date.now(),
  jitterKey?: string,
) {
  return now >= Date.parse(updatedAt) + retryDelayMs(attempts, jitterKey);
}

export function classifyDispatchFailure(status: number | null) {
  if (status === 401 || status === 403 || status === 409 || status === 422) return "permanent" as const;
  return "transient" as const;
}

export function signedCastingHeaders(input: {
  body: string;
  eventKey: string;
  path: string;
  secret: string;
  timestamp?: number;
}) {
  const timestamp = String(input.timestamp ?? Math.floor(Date.now() / 1_000));
  const bodyHash = createHash("sha256").update(input.body).digest("hex");
  const canonical = `${timestamp}\nPOST\n${input.path}\n${input.eventKey}\n${bodyHash}`;
  const signature = createHmac("sha256", input.secret).update(canonical).digest("hex");

  return {
    "x-attual-timestamp": timestamp,
    "x-attual-signature": signature,
  };
}
