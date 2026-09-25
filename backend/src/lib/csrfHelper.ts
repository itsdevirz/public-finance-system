import crypto from "crypto";

// Secret for HMAC-signing CSRF tokens
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || "dev-csrf-hmac-secret-key-2026";

// Map tracking consumed tokens with their consumption timestamp
const consumedCsrfTokens = new Map<string, number>();

// TTL for CSRF tokens (15 minutes)
const CSRF_TOKEN_TTL_MS = 15 * 60 * 1000;

/**
 * Periodically prune consumed tokens older than 30 seconds
 */
function cleanupConsumedTokens() {
  const now = Date.now();
  for (const [token, consumedTime] of consumedCsrfTokens.entries()) {
    if (now - consumedTime > 30 * 1000) {
      consumedCsrfTokens.delete(token);
    }
  }
}

setInterval(cleanupConsumedTokens, 60 * 1000).unref();

function computeHmac(rawBytes: string, timestamp: number): string {
  return crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(`${rawBytes}.${timestamp}`)
    .digest("hex");
}

/**
 * Generates an HMAC-signed Anti-CSRF token.
 */
export function generateCsrfToken(): string {
  const rawBytes = crypto.randomBytes(24).toString("hex");
  const timestamp = Date.now();
  const signature = computeHmac(rawBytes, timestamp);
  return `${rawBytes}.${timestamp}.${signature}`;
}

/**
 * Validates cryptographic signature and TTL of a CSRF token.
 */
export function validateCsrfToken(incomingToken: string | undefined | null): boolean {
  if (!incomingToken || typeof incomingToken !== "string") {
    return false;
  }

  const parts = incomingToken.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [rawBytes, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp) || Date.now() - timestamp > CSRF_TOKEN_TTL_MS) {
    return false; // Expired or malformed timestamp
  }

  const expectedSignature = computeHmac(rawBytes, timestamp);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Validates and consumes a CSRF token.
 * To support concurrent requests without race conditions, recently consumed
 * tokens remain valid within a short grace period (default 5 seconds, 0ms in test mode).
 */
export function validateAndConsumeCsrfToken(
  incomingToken: string | undefined | null,
  gracePeriodMs: number = process.env.NODE_ENV === "test" ? 0 : 5000
): boolean {
  if (!validateCsrfToken(incomingToken)) {
    return false;
  }

  const tokenStr = incomingToken as string;
  const now = Date.now();
  const consumedTime = consumedCsrfTokens.get(tokenStr);

  if (consumedTime !== undefined) {
    if (now - consumedTime <= gracePeriodMs) {
      // Valid within grace period for concurrent inflight requests
      return true;
    }
    // Reused token outside grace period -> reject
    return false;
  }

  // Mark token as consumed
  consumedCsrfTokens.set(tokenStr, now);
  return true;
}
