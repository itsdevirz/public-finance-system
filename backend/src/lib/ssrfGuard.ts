import dns from "node:dns/promises";
import net from "node:net";

/**
 * Checks if an IP string is a private, loopback, link-local, multicast, or internal address.
 */
export function isPrivateOrInternalIp(ipStr: string): boolean {
  if (!net.isIP(ipStr)) {
    return true; // Invalid IP format considered unsafe
  }

  if (net.isIPv4(ipStr)) {
    const parts = ipStr.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }
    const [a, b] = parts;

    // 0.0.0.0/8
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local)
    if (a === 169 && b === 254) return true;
    // 224.0.0.0/4 (Multicast)
    if (a >= 224 && a <= 239) return true;
    // 240.0.0.0/4 (Reserved)
    if (a >= 240) return true;

    return false;
  }

  if (net.isIPv6(ipStr)) {
    const normalized = ipStr.toLowerCase();
    // Loopback ::1
    if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;
    // Unspecified ::
    if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;
    // Link-local fe80::/10
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    // Unique local fc00::/7 (fc00:: and fd00::)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // Multicast ff00::/8
    if (normalized.startsWith("ff")) return true;
    // IPv4-mapped IPv6 e.g. ::ffff:127.0.0.1
    if (normalized.includes("::ffff:")) {
      const v4Part = normalized.split("::ffff:")[1];
      if (v4Part && net.isIPv4(v4Part)) {
        return isPrivateOrInternalIp(v4Part);
      }
    }

    return false;
  }

  return true;
}

/**
 * Validates a hostname and port, resolving DNS to ensure it does not point to internal IP ranges.
 * Protects against SSRF and DNS Rebinding.
 */
export async function validatePublicTlsTarget(
  hostname: string,
  port: number
): Promise<{ safe: boolean; reason?: string; resolvedIp?: string }> {
  const hostLower = (hostname || "").trim().toLowerCase();

  // Basic sanity & internal domain checks
  if (
    !hostLower ||
    hostLower === "localhost" ||
    hostLower.endsWith(".local") ||
    hostLower.endsWith(".internal") ||
    hostLower.endsWith(".lan") ||
    hostLower.endsWith(".home") ||
    hostLower.endsWith(".invalid")
  ) {
    return { safe: false, reason: "دسترسی به آدرس‌های داخلی و شبکه محلی مجاز نمی‌باشد (SSRF Prevention)." };
  }

  if (isNaN(port) || port < 1 || port > 65535) {
    return { safe: false, reason: "شماره پورت نامعتبر است." };
  }

  // Direct IP check
  if (net.isIP(hostLower)) {
    if (isPrivateOrInternalIp(hostLower)) {
      return { safe: false, reason: "دسترسی به آدرس‌های IP داخلی و رزروشده غیرمجاز است." };
    }
    return { safe: true, resolvedIp: hostLower };
  }

  // DNS Resolution to prevent DNS Rebinding to internal IPs
  try {
    const addresses = await dns.lookup(hostLower, { all: true });
    if (!addresses || addresses.length === 0) {
      return { safe: false, reason: "عدم امکان تحلیل آدرس دامنه (DNS Lookup Failed)." };
    }

    for (const addr of addresses) {
      if (isPrivateOrInternalIp(addr.address)) {
        return { safe: false, reason: `دامنه ${hostLower} به آدرس IP داخلی (${addr.address}) اشاره می‌کند که غیرمجاز است.` };
      }
    }

    return { safe: true, resolvedIp: addresses[0].address };
  } catch (err: any) {
    return { safe: false, reason: `خطا در استعلام DNS برای دامنه: ${err.message}` };
  }
}
