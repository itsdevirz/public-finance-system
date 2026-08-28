import tls from "node:tls";
import https from "node:https";
import { URL } from "node:url";
import { DEFAULT_SECURITY_POLICY, TlsClientPolicy } from "./securityPolicy.js";

// نقشه تبدیل کلیدهای افتا به شناساننده‌های OpenSSL Cipher Suites
export const CIPHER_SUITE_OPENSSL_MAP: Record<string, string> = {
  tls_aes_256_gcm_sha384: "TLS_AES_256_GCM_SHA384",
  tls_aes_128_gcm_sha256: "TLS_AES_128_GCM_SHA256",
  tls_dhe_rsa_with_aes_256_gcm_sha384: "DHE-RSA-AES256-GCM-SHA384",
  tls_dhe_rsa_with_aes_128_gcm_sha256: "DHE-RSA-AES128-GCM-SHA256",
  tls_ecdhe_rsa_with_aes_128_gcm_sha256: "ECDHE-RSA-AES128-GCM-SHA256",
  tls_ecdhe_rsa_with_aes_256_gcm_sha384: "ECDHE-RSA-AES256-GCM-SHA384",
  tls_ecdhe_ecdsa_with_aes_256_gcm_sha384: "ECDHE-ECDSA-AES256-GCM-SHA384",
  tls_ecdhe_ecdsa_with_aes_128_gcm_sha256: "ECDHE-ECDSA-AES128-GCM-SHA256",
  tls_rsa_with_aes_256_gcm_sha384: "AES256-GCM-SHA384",
  tls_rsa_with_aes_128_gcm_sha256: "AES128-GCM-SHA256",
  tls_ecdh_ecdsa_with_aes_256_gcm_sha384: "ECDH-ECDSA-AES256-GCM-SHA384",
  tls_ecdh_ecdsa_with_aes_128_gcm_sha256: "ECDH-ECDSA-AES128-GCM-SHA256",
  tls_ecdh_rsa_with_aes_256_gcm_sha384: "ECDH-RSA-AES256-GCM-SHA384",
  tls_ecdh_rsa_with_aes_128_gcm_sha256: "ECDH-RSA-AES128-GCM-SHA256",
  tls_dh_rsa_with_aes_256_gcm_sha384: "DH-RSA-AES256-GCM-SHA384",
  tls_dh_rsa_with_aes_128_gcm_sha256: "DH-RSA-AES128-GCM-SHA256"
};

/**
 * ساخت رشته OpenSSL Cipher String بر اساس خط‌مشی فعال افتا
 */
export function buildOpenSslCipherString(policy: TlsClientPolicy = DEFAULT_SECURITY_POLICY.tlsClientPolicy!): string {
  const cipherSuites = policy.cipherSuites || {};
  const activeOpenSslCiphers: string[] = [];

  for (const [key, enabled] of Object.entries(cipherSuites)) {
    if (enabled && CIPHER_SUITE_OPENSSL_MAP[key]) {
      activeOpenSslCiphers.push(CIPHER_SUITE_OPENSSL_MAP[key]);
    }
  }

  if (activeOpenSslCiphers.length === 0) {
    return "TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256";
  }

  return activeOpenSslCiphers.join(":");
}

/**
 * اعتبارسنجی شناسه سرور مطابق استاندارد RFC 6125 (بخش 6)
 */
export function validateRfc6125ServerIdentity(hostname: string, cert: tls.PeerCertificate): { valid: boolean; reason?: string } {
  if (!cert || !cert.subject) {
    return { valid: false, reason: "گواهی‌نامه سرور نامعتبر یا دریافت نشده است (مطابق RFC 6125)." };
  }

  const hostLower = hostname.toLowerCase();

  // بررسی Subject Alternative Names (SAN)
  if (cert.subjectaltname) {
    const altNames = cert.subjectaltname.split(",").map(s => s.trim().replace(/^DNS:/, "").toLowerCase());
    const matchedSan = altNames.some(alt => {
      if (alt === hostLower) return true;
      if (alt.startsWith("*.")) {
        const domainPart = alt.slice(2);
        return hostLower.endsWith(domainPart) && hostLower.split(".").length === alt.split(".").length;
      }
      return false;
    });

    if (matchedSan) {
      return { valid: true };
    }
  }

  // بررسی Common Name (CN)
  const cn = cert.subject.CN;
  if (cn) {
    const cnLower = Array.isArray(cn) ? cn[0].toLowerCase() : cn.toLowerCase();
    if (cnLower === hostLower) {
      return { valid: true };
    }
    if (cnLower.startsWith("*.")) {
      const domainPart = cnLower.slice(2);
      if (hostLower.endsWith(domainPart) && hostLower.split(".").length === cnLower.split(".").length) {
        return { valid: true };
      }
    }
  }

  return {
    valid: false,
    reason: `شناسه ارائه شده سرور در گواهی‌نامه (${cn || cert.subjectaltname || 'نامشخص'}) با شناسه مرجع آدرس (${hostname}) مطابق بخش 6 از RFC 6125 مطابقت ندارد.`
  };
}

/**
 * ساخت https.Agent واقعی با الزامات امنیتی TLS Client افتا جهت استفاده در تمامی درخواست‌های خارجی سامانه
 */
export function createSecureHttpsAgent(policy: TlsClientPolicy = DEFAULT_SECURITY_POLICY.tlsClientPolicy!): https.Agent {
  const cipherString = buildOpenSslCipherString(policy);
  const minVersion = policy.enforceTls12Only ? "TLSv1.2" : "TLSv1.2";

  return new https.Agent({
    minVersion,
    maxVersion: "TLSv1.3",
    ciphers: cipherString,
    rejectUnauthorized: policy.serverCertificateValidation?.requireValidCertificate ?? true,
    checkServerIdentity: (hostname, cert) => {
      if (policy.rfc6125IdentityValidation) {
        const check = validateRfc6125ServerIdentity(hostname, cert);
        if (!check.valid) {
          const err = new Error(check.reason);
          (err as any).code = "ERR_TLS_CERT_ALTNAME_INVALID";
          return err;
        }
      }
      return tls.checkServerIdentity(hostname, cert);
    }
  });
}

export interface RealTlsTestResult {
  success: boolean;
  targetUrl: string;
  host: string;
  port: number;
  negotiatedProtocol?: string;
  negotiatedCipherSuite?: string;
  opensslCipherName?: string;
  authorized?: boolean;
  authorizationError?: string;
  serverCertificate?: {
    subjectCN?: string;
    issuerCN?: string;
    validFrom?: string;
    validTo?: string;
    fingerprint256?: string;
    subjectAltName?: string;
  };
  rfc6125IdentityValid?: boolean;
  enabledCipherSuitesCount: number;
  aftaComplianceStatus: string;
  message: string;
  errorDetails?: string;
}

/**
 * اجرای دست‌تکانی واقعی (Real TLS Handshake) روی سوکت شبکه با سرور هدف
 */
export async function executeRealTlsHandshake(
  targetUrlStr: string,
  policy: TlsClientPolicy = DEFAULT_SECURITY_POLICY.tlsClientPolicy!
): Promise<RealTlsTestResult> {
  let parsedUrl: URL;
  try {
    const rawUrl = targetUrlStr.startsWith("http") ? targetUrlStr : `https://${targetUrlStr}`;
    parsedUrl = new URL(rawUrl);
  } catch (err: any) {
    throw new Error(`آدرس URL وارد شده معتبر نمی‌باشد: ${err.message}`);
  }

  const host = parsedUrl.hostname;
  const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
  const cipherString = buildOpenSslCipherString(policy);
  const minVersion = policy.enforceTls12Only ? "TLSv1.2" : "TLSv1.2";

  const enabledCount = Object.values(policy.cipherSuites || {}).filter(Boolean).length;

  return new Promise((resolve) => {
    const socketOptions: tls.ConnectionOptions = {
      host,
      port,
      servername: host,
      minVersion,
      maxVersion: "TLSv1.3",
      ciphers: cipherString,
      rejectUnauthorized: false,
      timeout: 10000
    };

    const socket = tls.connect(socketOptions, () => {
      try {
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();
        const cert = socket.getPeerCertificate(true);
        const authorized = socket.authorized;
        const authError = socket.authorizationError ? String(socket.authorizationError) : undefined;

        let rfc6125Valid = true;
        let rfc6125Reason: string | undefined;

        if (policy.rfc6125IdentityValidation && cert) {
          const rfcCheck = validateRfc6125ServerIdentity(host, cert);
          rfc6125Valid = rfcCheck.valid;
          rfc6125Reason = rfcCheck.reason;
        }

        const cipherName = cipher ? cipher.name : "نامشخص";
        const protoVer = protocol || "TLSv1.3";

        socket.end();

        const success = authorized && rfc6125Valid;

        resolve({
          success,
          targetUrl: parsedUrl.toString(),
          host,
          port,
          negotiatedProtocol: protoVer,
          negotiatedCipherSuite: cipherName,
          opensslCipherName: cipher ? `${cipher.name} (${cipher.standardName || cipher.version || ''})` : undefined,
          authorized,
          authorizationError: authError,
          serverCertificate: cert && cert.subject ? {
            subjectCN: Array.isArray(cert.subject.CN) ? cert.subject.CN[0] : cert.subject.CN,
            issuerCN: Array.isArray(cert.issuer?.CN) ? cert.issuer.CN[0] : cert.issuer?.CN,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            fingerprint256: cert.fingerprint256,
            subjectAltName: cert.subjectaltname
          } : undefined,
          rfc6125IdentityValid: rfc6125Valid,
          enabledCipherSuitesCount: enabledCount,
          aftaComplianceStatus: success 
            ? "دست‌تکانی واقعی TLS Client با موفقیت انجام شد - منطبق بر الزام افتا و RFC 8446/6125"
            : (rfc6125Reason || authError || "عدم تایید احراز هویت سرور در لایه TLS"),
          message: success 
            ? `اتصال سوکت TLS به میزبان ${host}:${port} با مجموعه رمز واقعی ${cipherName} و نسخه ${protoVer} برقرار گردید.`
            : `دست‌تکانی سوکت TLS با سرور ${host}:${port} انجام شد، ولی اعتبار یا شناسه سرور مورد تایید قرار نگرفت: ${rfc6125Reason || authError}`
        });
      } catch (err: any) {
        socket.destroy();
        resolve({
          success: false,
          targetUrl: parsedUrl.toString(),
          host,
          port,
          enabledCipherSuitesCount: enabledCount,
          aftaComplianceStatus: "خطا در ارزیابی سوکت TLS",
          message: `خطا در بازرسی سوکت TLS: ${err.message}`,
          errorDetails: err.stack
        });
      }
    });

    socket.on("error", (err: any) => {
      socket.destroy();
      let errMsg = err.message;
      if (err.code === "ERR_SSL_NO_CYPHER_OVERLAP" || errMsg.includes("no ciphers available")) {
        errMsg = "سرور مقصد هیچ‌یک از مجموعه‌های رمز (Cipher Suites) منتخب و مجاز در خط‌مشی افتا را پشتیبانی نمی‌کند.";
      }
      resolve({
        success: false,
        targetUrl: parsedUrl.toString(),
        host,
        port,
        enabledCipherSuitesCount: enabledCount,
        aftaComplianceStatus: "رد اتصال سوکت TLS لایه انتقال",
        message: `اتصال سوکت واقعی TLS به آدرس ${host}:${port} ناموفق بود: ${errMsg}`,
        errorDetails: err.code || err.message
      });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({
        success: false,
        targetUrl: parsedUrl.toString(),
        host,
        port,
        enabledCipherSuitesCount: enabledCount,
        aftaComplianceStatus: "خطای مهلت زمانی (Timeout)",
        message: `پاسخی از سرور ${host}:${port} در مهلت ۱۰ ثانیه‌ای دست‌تکانی TLS دریافت نشد.`,
      });
    });
  });
}
