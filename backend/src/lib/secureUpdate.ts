import crypto from "crypto";

export interface UpdateManifest {
  version: string;
  hash: string;
  signature?: string;
}

export function verifyUpdateIntegrity(fileBuffer: Buffer, expectedHash: string): boolean {
  const actualHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

export function verifyUpdateSignature(
  fileBuffer: Buffer,
  signatureHex: string,
  publicKeyPem: string
): boolean {
  try {
    const verifier = crypto.createVerify("SHA256");
    verifier.update(fileBuffer);
    verifier.end();

    const signature = Buffer.from(signatureHex, "hex");
    return verifier.verify(publicKeyPem, signature);
  } catch (error) {
    console.error("خطا در بررسی امضای دیجیتال به‌روزرسانی:", error);
    return false;
  }
}
