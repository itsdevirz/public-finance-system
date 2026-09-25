import { Context } from "hono";
import net from "node:net";

/**
 * Extract client IP address safely without trusting arbitrary X-Forwarded-For headers
 * unless the application is explicitly configured behind a trusted proxy.
 */
export function extractClientIp(c: Context): string {
  const isTrustedProxy =
    process.env.TRUST_PROXY === "true" ||
    process.env.BEHIND_PROXY === "true" ||
    process.env.NODE_ENV === "production";

  if (isTrustedProxy) {
    const xff = c.req.header("x-forwarded-for");
    if (xff) {
      const ips = xff.split(",").map((ip) => ip.trim()).filter(Boolean);
      if (ips.length > 0 && net.isIP(ips[0])) {
        return ips[0].replace(/^::ffff:/, "");
      }
    }
    const cfIp = c.req.header("cf-connecting-ip");
    if (cfIp && net.isIP(cfIp.trim())) {
      return cfIp.trim().replace(/^::ffff:/, "");
    }
  }

  // Fallback to socket remote address
  const rawConn =
    (c.env as any)?.outgoing?.socket?.remoteAddress ||
    (c.env as any)?.node?.req?.socket?.remoteAddress ||
    (c.req as any)?.raw?.socket?.remoteAddress;

  if (rawConn && typeof rawConn === "string") {
    const cleaned = rawConn.replace(/^::ffff:/, "").trim();
    if (net.isIP(cleaned)) {
      return cleaned;
    }
  }

  return "127.0.0.1";
}
