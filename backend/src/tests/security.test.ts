import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { DEFAULT_SECURITY_POLICY, validatePassword } from "../lib/securityPolicy.js";
import { encrypt, decrypt } from "../lib/crypto.js";
import { validateRemoteCertificate } from "../lib/certValidator.js";
import { verifyUpdateIntegrity, verifyUpdateSignature } from "../lib/secureUpdate.js";
import crypto from "crypto";

describe("🛡️ Comprehensive Security Test Suite", () => {
  
  describe("1. Password Policy & Complexity Validation", () => {
    it("should reject weak passwords missing special chars, uppercase or digits", () => {
      const res1 = validatePassword("simplepass", DEFAULT_SECURITY_POLICY.passwordPolicy);
      assert.strictEqual(res1.valid, false);

      const res2 = validatePassword("Simplepass", DEFAULT_SECURITY_POLICY.passwordPolicy);
      assert.strictEqual(res2.valid, false);

      const res3 = validatePassword("Simplepass123", DEFAULT_SECURITY_POLICY.passwordPolicy);
      assert.strictEqual(res3.valid, false);
    });

    it("should accept strong passwords fulfilling all policy criteria", () => {
      const res = validatePassword("StrongP@ssw0rd!", DEFAULT_SECURITY_POLICY.passwordPolicy);
      assert.strictEqual(res.valid, true);
    });
  });

  describe("2. Cryptography & AES-256-GCM Verification", () => {
    it("should correctly encrypt and decrypt sensitive data with IV and AuthTag", () => {
      const plaintext = "اطلاعات مالی محرمانه سازمان";
      const ciphertext = encrypt(plaintext);
      
      assert.ok(ciphertext.includes(":"), "Ciphertext should contain IV:AuthTag:Payload separators");
      
      const decrypted = decrypt(ciphertext);
      assert.strictEqual(decrypted, plaintext);
    });

    it("should throw error when decrypting tampered ciphertext (Integrity Protection)", () => {
      const plaintext = "داده مالی";
      const ciphertext = encrypt(plaintext);
      const parts = ciphertext.split(":");
      const tamperedPayload = parts[0] + ":" + parts[1] + ":" + parts[2].substring(0, parts[2].length - 2) + "00";
      
      assert.throws(() => {
        decrypt(tamperedPayload);
      });
    });
  });

  describe("3. Certificate Validation & HTTPS Security", () => {
    it("should reject non-HTTPS URLs", async () => {
      const res = await validateRemoteCertificate("http://example.com");
      assert.strictEqual(res.valid, false);
      assert.ok(res.reason?.includes("HTTPS"));
    });
  });

  describe("4. Secure Update Integrity & Signature Verification", () => {
    it("should verify correct SHA-256 update bundle hash", () => {
      const dummyBuffer = Buffer.from("Update Payload v1.1");
      const expectedHash = crypto.createHash("sha256").update(dummyBuffer).digest("hex");
      
      const isIntegrityValid = verifyUpdateIntegrity(dummyBuffer, expectedHash);
      assert.strictEqual(isIntegrityValid, true);

      const isTamperedValid = verifyUpdateIntegrity(dummyBuffer, "0000000000000000000000000000000000000000000000000000000000000000");
      assert.strictEqual(isTamperedValid, false);
    });

    it("should verify digital signature of update payload", () => {
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
      const dummyBuffer = Buffer.from("Secure Update Binary");
      
      const signer = crypto.createSign("SHA256");
      signer.update(dummyBuffer);
      signer.end();
      const signatureHex = signer.sign(privateKey, "hex");

      const isValid = verifyUpdateSignature(dummyBuffer, signatureHex, publicKey.export({ type: "pkcs1", format: "pem" }).toString());
      assert.strictEqual(isValid, true);
    });
  });
});
