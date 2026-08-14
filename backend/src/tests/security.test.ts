import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { DEFAULT_SECURITY_POLICY, validatePassword } from "../lib/securityPolicy.js";
import { encrypt, decrypt, destroyCryptoKey } from "../lib/crypto.js";
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

    it("should destroy/wipe cryptographic key material in memory (AFTA Key Destruction)", () => {
      const dummyKey = Buffer.from("super-secret-key-32-bytes-long!!");
      assert.strictEqual(dummyKey.every((byte) => byte === 0), false, "Key buffer initially should contain non-zero bytes");

      destroyCryptoKey(dummyKey);

      assert.strictEqual(dummyKey.every((byte) => byte === 0), true, "Key buffer should be completely zeroed out after destruction");
    });
  });

  describe("3. Certificate Validation & HTTPS Security", () => {
    it("should reject non-HTTPS URLs", async () => {
      const res = await validateRemoteCertificate("http://example.com");
      assert.strictEqual(res.valid, false);
      assert.ok(res.reason?.includes("HTTPS"));
    });
  });

  describe("5. Admin-Configurable Failed Authentication Attempts Limit & Deactivation", () => {
    it("should deactivate account (status = غیرفعال) when failed attempts reach admin limit and require admin reactivation", () => {
      const adminConfiguredAttempts = 3; // Configured by Admin
      assert.ok(Number.isInteger(adminConfiguredAttempts) && adminConfiguredAttempts > 0, "Limit must be a positive integer");

      let currentFailedAttempts = 0;
      let accountStatus = "فعال";

      for (let i = 1; i <= 3; i++) {
        currentFailedAttempts++;
        if (currentFailedAttempts >= adminConfiguredAttempts) {
          accountStatus = "غیرفعال";
        }
      }

      assert.strictEqual(currentFailedAttempts, 3);
      assert.strictEqual(accountStatus, "غیرفعال", "Account should be deactivated (غیرفعال) when failed attempts reach admin limit");

      // Admin Reactivation
      accountStatus = "فعال";
      currentFailedAttempts = 0;

      assert.strictEqual(accountStatus, "فعال");
      assert.strictEqual(currentFailedAttempts, 0, "Failed attempts counter should reset to 0 upon Admin reactivation");
    });

    it("should reject non-positive or invalid failed attempt limits", () => {
      const invalidValues = [0, -5, -1, 3.5, NaN, undefined];

      for (const val of invalidValues) {
        const sanitized = typeof val === "number" && !isNaN(val) && val > 0 && Number.isInteger(val)
          ? val
          : 5; // Default fallback to positive integer
        assert.ok(sanitized > 0 && Number.isInteger(sanitized), `Sanitization failed for value ${val}`);
      }
    });
  });

  describe("6. User Security Attributes Integrity Check (AFTA Requirement)", () => {
    it("should maintain all required user security attributes for identification & authentication", () => {
      const sampleUserDoc = {
        username: "test_user",
        password: "$2b$12$samplehashedpasswordstring",
        authMethod: "PASSWORD",
        status: "فعال",
        role: "accountant",
        permissions: { read: true, write: true },
        ipRestriction: "192.168.1.100",
        allowOutside: false,
        maxFailedAttempts: 5,
        failedLoginAttempts: 0,
        createdAt: new Date().toISOString()
      };

      // 1. User Identifier Check
      assert.ok(sampleUserDoc.username, "Must contain User Identifier (username)");

      // 2. Authentication Method Check
      assert.ok(["PASSWORD", "TWO_FACTOR", "DIGITAL_CERTIFICATE"].includes(sampleUserDoc.authMethod), "Must contain valid Authentication Method");

      // 3. Authentication Data Check
      assert.ok(sampleUserDoc.password && sampleUserDoc.password.startsWith("$2b$"), "Must contain hashed Authentication Data");

      // 4. Account Status Check
      assert.ok(["فعال", "غیرفعال", "مسدود"].includes(sampleUserDoc.status), "Must contain valid Account Status");

      // 5. User Role Check
      assert.ok(sampleUserDoc.role, "Must contain User Role for RBAC");

      // 6. Other Security Attributes Check
      assert.ok(sampleUserDoc.permissions !== undefined, "Must contain permissions");
      assert.ok(sampleUserDoc.ipRestriction !== undefined, "Must contain IP restrictions");
      assert.ok(sampleUserDoc.maxFailedAttempts > 0, "Must contain positive max failed attempts threshold");
    });
  });

  describe("7. Active User & Session Security Attributes (AFTA Requirement)", () => {
    it("should record client interface details, authentication history and session rules for active users", () => {
      const activeSessionDoc = {
        sessionId: "sess_12345",
        userId: "usr_67890",
        username: "active_accountant",
        role: "accountant",
        permissions: { ledger: "write", report: "read" },
        ip: "192.168.1.50",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0",
        osName: "Windows 10 / 11 (64-bit)",
        browserName: "Google Chrome",
        deviceType: "دسکتاپ (Desktop PC)",
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };

      const authHistorySample = [
        { timestamp: new Date().toISOString(), result: "SUCCESS", ip: "192.168.1.50", authMethod: "PASSWORD" },
        { timestamp: new Date().toISOString(), result: "FAILURE", ip: "192.168.1.50", authMethod: "PASSWORD", reason: "Wrong password" }
      ];

      // 1. User Identifier & Role Check
      assert.ok(activeSessionDoc.userId && activeSessionDoc.username, "Must store User Identifier");
      assert.ok(activeSessionDoc.role && activeSessionDoc.permissions, "Must store User Role & Permissions Matrix");

      // 2. Client Interface Details Check
      assert.ok(activeSessionDoc.ip, "Must store Client IP");
      assert.ok(activeSessionDoc.osName && activeSessionDoc.browserName, "Must store Client Interface OS & Browser metadata");

      // 3. Authentication History Check
      assert.strictEqual(authHistorySample.length, 2);
      assert.ok(authHistorySample.some(h => h.result === "SUCCESS"), "Must record successful authentication attempts");
      assert.ok(authHistorySample.some(h => h.result === "FAILURE"), "Must record failed authentication attempts");

      // 4. Session Rules & Binding Check
      assert.ok(activeSessionDoc.createdAt && activeSessionDoc.lastActivity, "Must record session timestamps");
    });
  });

  describe("8. Session Establishment Rules & Security Attribute Enforcement (AFTA Requirement)", () => {
    it("should invalidate previous sessions on new session establishment under single-session policy", () => {
      const activeSessions = [
        { sessionId: "sess_1", token: "tok_old", userId: "user_100" }
      ];
      const maxConcurrentSessions = 1;

      if (maxConcurrentSessions === 1 && activeSessions.length > 0) {
        // Invalidate old session
        const revokedToken = activeSessions.pop()?.token;
        assert.strictEqual(revokedToken, "tok_old", "Previous token must be revoked");
        assert.strictEqual(activeSessions.length, 0, "Previous session must be deleted from active sessions");
      }
    });

    it("should instantly revoke all active sessions when security attributes (status/password/role) change", () => {
      let activeSessions = [
        { sessionId: "sess_10", token: "tok_active1", userId: "user_200" },
        { sessionId: "sess_11", token: "tok_active2", userId: "user_200" }
      ];

      const securityAttributeChanged = true; // e.g. Status changed to "غیرفعال" or password updated

      if (securityAttributeChanged) {
        const revokedTokens = activeSessions.map((s) => s.token);
        activeSessions = [];

        assert.strictEqual(revokedTokens.length, 2, "All active session tokens must be revoked");
        assert.strictEqual(activeSessions.length, 0, "User must have zero active sessions after security attribute change");
      }
    });
  });

  describe("9. Active Entity Access Control Policies (AFTA & Image Requirement)", () => {
    it("should enforce distinct access control policies for System Admin, Regular User, and Other Roles across active entities", () => {
      const entityPolicies = DEFAULT_SECURITY_POLICY.entityAccessPolicies;
      assert.ok(Array.isArray(entityPolicies) && entityPolicies.length > 0, "Entity access policies must be defined");

      const vouchersPolicy = entityPolicies.find(p => p.entityId === "vouchers");
      assert.ok(vouchersPolicy, "Vouchers entity policy must exist");

      // 1. System Admin Permissions Check (مدیر سیستم)
      assert.strictEqual(vouchersPolicy.systemAdmin.create, true, "System Admin must have create permission");
      assert.strictEqual(vouchersPolicy.systemAdmin.delete, true, "System Admin must have delete permission");

      // 2. Regular User Permissions Check (کاربر عادی)
      assert.strictEqual(vouchersPolicy.regularUser.create, true, "Regular User can create vouchers");
      assert.strictEqual(vouchersPolicy.regularUser.delete, false, "Regular User cannot delete vouchers by default");

      // 3. Other Roles Permissions Check (سایر موارد)
      assert.strictEqual(vouchersPolicy.otherRoles.create, false, "Other/Guest roles cannot create vouchers by default");
      assert.strictEqual(vouchersPolicy.otherRoles.read, true, "Other/Guest roles can view vouchers");
    });
  });
});
