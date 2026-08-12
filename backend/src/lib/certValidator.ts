import tls from "tls";
import { URL } from "url";

export interface CertValidationResult {
  valid: boolean;
  reason?: string;
  subject?: tls.PeerCertificate["subject"];
  issuer?: tls.PeerCertificate["issuer"];
  validTo?: string;
}

export async function validateRemoteCertificate(urlString: string): Promise<CertValidationResult> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlString);
      if (parsedUrl.protocol !== "https:") {
        return resolve({ valid: false, reason: "ارتباط از پروتکل امن HTTPS استفاده نمی‌کند" });
      }

      const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 443;
      const hostname = parsedUrl.hostname;

      const socket = tls.connect(
        {
          host: hostname,
          port: port,
          servername: hostname,
          rejectUnauthorized: true, // Fail-Secure: Reject invalid certificates
        },
        () => {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const authError = socket.authorizationError;

          socket.end();

          if (!authorized) {
            return resolve({
              valid: false,
              reason: `اعتبارسنجی گواهی ناموفق بود: ${authError || "گواهی ناگفتنی/نامعتبر"}`,
            });
          }

          const validTo = new Date(cert.valid_to).valueOf();
          const now = Date.now();

          if (now > validTo) {
            return resolve({ valid: false, reason: "گواهی‌نامه TLS منقضی شده است." });
          }

          return resolve({
            valid: true,
            subject: cert.subject,
            issuer: cert.issuer,
            validTo: cert.valid_to,
          });
        }
      );

      socket.on("error", (err) => {
        resolve({ valid: false, reason: `خطای ارتباط TLS: ${err.message}` });
      });

      socket.setTimeout(10000, () => {
        socket.destroy();
        resolve({ valid: false, reason: "مهلت زمانی ارتباط با گواهی‌نامه به پایان رسید (Timeout)" });
      });
    } catch (err: any) {
      resolve({ valid: false, reason: `آدرس نامعتبر: ${err.message}` });
    }
  });
}
