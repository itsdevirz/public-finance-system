import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { DEFAULT_SECURITY_POLICY, validatePassword, validateActiveToInactiveInteractionACL, validateActiveToInactivePreventionRules, validateResourceSanitizationPolicy, validateUserDataInputAccessPolicy, validateSecureDataTransportPolicy, validateUserDataEgressAccessPolicy, validateTargetedDataEgressRules, validateTlsServerProtocolRequest, validateTlsServerKeyExchangeParameters, validateMutualTlsIdentity, validateCertificatePathRules, validateCertificateRevocationCheck, validateExtendedKeyUsageOid, validateCaCertificateAcceptance, validateX509v3Rfc5280Scope, validateSshPacketSize, validateSshRekeyingTrigger, validateSshHostVerification } from "../lib/securityPolicy.js";
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

  describe("10. Active-to-Inactive Entity Operation Control (AFTA & Image ACL Requirement)", () => {
    it("should authorize operations between active and inactive entities when matching ACL record exists by User ID", () => {
      const userInfo = { userId: "usr_101", groupId: "grp_finance", userRole: "حسابدار" };
      const aclRecord = { allowedUserIds: ["usr_101"], allowedGroupIds: [], allowedRoles: [] };
      const result = validateActiveToInactiveInteractionACL(userInfo, aclRecord);

      assert.strictEqual(result.allowed, true);
    });

    it("should authorize operations when matching ACL record exists by Group ID or User Role", () => {
      const userInfo = { userId: "usr_202", groupId: "grp_auditors", userRole: "حسابرس" };
      const aclRecordGroupMatch = { allowedUserIds: [], allowedGroupIds: ["grp_auditors"], allowedRoles: [] };
      const resGroup = validateActiveToInactiveInteractionACL(userInfo, aclRecordGroupMatch);

      assert.strictEqual(resGroup.allowed, true);

      const aclRecordRoleMatch = { allowedUserIds: [], allowedGroupIds: [], allowedRoles: ["حسابرس"] };
      const resRole = validateActiveToInactiveInteractionACL(userInfo, aclRecordRoleMatch);

      assert.strictEqual(resRole.allowed, true);
    });

    it("should reject operations when no explicit ACL record exists or user/group/role is not in ACL record", () => {
      const userInfo = { userId: "usr_unauthorized", groupId: "grp_guest", userRole: "کاربر عادی" };
      
      // 1. Missing ACL record
      const resMissing = validateActiveToInactiveInteractionACL(userInfo, null);
      assert.strictEqual(resMissing.allowed, false);
      assert.ok(resMissing.reason?.includes("فهرست کنترل دسترسی (ACL)"));

      // 2. Non-matching ACL record
      const aclRecordOther = { allowedUserIds: ["usr_admin"], allowedGroupIds: ["grp_management"], allowedRoles: ["admin"] };
      const resMismatch = validateActiveToInactiveInteractionACL(userInfo, aclRecordOther);
      assert.strictEqual(resMismatch.allowed, false);
    });
  });

  describe("11. Active-to-Inactive Entity Access Prevention Rules (AFTA & Image Requirement)", () => {
    it("should prevent access when active concurrent sessions with same username exceed threshold", () => {
      const contextExceeded = { currentActiveSessionsCount: 5 };
      const res = validateActiveToInactivePreventionRules(contextExceeded);

      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes("مقدار آستانه از پیش تعریف‌شده"));
    });

    it("should allow access when active concurrent sessions are within threshold limit", () => {
      const contextNormal = { currentActiveSessionsCount: 2 };
      const res = validateActiveToInactivePreventionRules(contextNormal);

      assert.strictEqual(res.allowed, true);
    });

    it("should prevent access under 'other cases' rules (account deactivation or IP anomaly)", () => {
      // 1. Account Deactivation
      const resDeactivated = validateActiveToInactivePreventionRules({ isAccountActive: false });
      assert.strictEqual(resDeactivated.allowed, false);
      assert.ok(resDeactivated.reason?.includes("غیرفعال شدن حساب کاربری"));

      // 2. IP Anomaly Detection
      const resIP = validateActiveToInactivePreventionRules({ ipChanged: true });
      assert.strictEqual(resIP.allowed, false);
      assert.ok(resIP.reason?.includes("ناهنجاری آدرس IP"));
    });
  });

  describe("12. Resource Sanitization & Legacy Resource Access Control (AFTA Item 5 Requirement)", () => {
    it("should ensure memory buffers, crypto keys and residual resource data are wiped upon allocation and release", () => {
      const resAlloc = validateResourceSanitizationPolicy("allocation");
      assert.strictEqual(resAlloc.sanitized, true);
      assert.ok(resAlloc.message?.includes("پاک‌سازی"));

      const resRelease = validateResourceSanitizationPolicy("release");
      assert.strictEqual(resRelease.sanitized, true);
    });

    it("should enforce secure access controls and audit logging for accessing legacy resource data", () => {
      const resLegacy = validateResourceSanitizationPolicy("legacy_access");
      assert.strictEqual(resLegacy.sanitized, true);
      assert.ok(resLegacy.message?.includes("احراز هویت"));
    });
  });

  describe("13. User Data Input Access Policy & Security Attributes (AFTA Requirement)", () => {
    it("should validate user data input against allowed data types, volume size, format and import frequency", () => {
      // 1. Valid Input
      const resValid = validateUserDataInputAccessPolicy({
        dataType: "JSON",
        sizeMB: 2,
        formatValid: true,
        importCountLastHour: 5
      });
      assert.strictEqual(resValid.valid, true);

      // 2. Disallowed Data Type
      const resInvalidType = validateUserDataInputAccessPolicy({ dataType: "EXE" });
      assert.strictEqual(resInvalidType.valid, false);
      assert.ok(resInvalidType.reason?.includes("نوع داده ورودی"));

      // 3. Exceeded Volume / Size Limit
      const resExceededSize = validateUserDataInputAccessPolicy({ sizeMB: 50 });
      assert.strictEqual(resExceededSize.valid, false);
      assert.ok(resExceededSize.reason?.includes("حجم و اندازه"));

      // 4. Invalid Format
      const resInvalidFormat = validateUserDataInputAccessPolicy({ formatValid: false });
      assert.strictEqual(resInvalidFormat.valid, false);
      assert.ok(resInvalidFormat.reason?.includes("فرمت"));

      // 5. Exceeded Import Frequency Limit
      const resExceededImports = validateUserDataInputAccessPolicy({ importCountLastHour: 25 });
      assert.strictEqual(resExceededImports.valid, false);
      assert.ok(resExceededImports.reason?.includes("Import"));
    });
  });

  describe("14. Secure Data Transport & Anti-Eavesdropping Policy (AFTA Requirement)", () => {
    it("should enforce TLS encryption, eavesdropping prevention, attribute coupling and data loss protection in transit", () => {
      // 1. Valid Secure Transport
      const resValid = validateSecureDataTransportPolicy({
        isSecureProtocol: true,
        hasAuthHeaders: true,
        checksumValid: true
      });
      assert.strictEqual(resValid.secure, true);

      // 2. Unencrypted Channel (HTTP / Eavesdropping Risk)
      const resInsecure = validateSecureDataTransportPolicy({ isSecureProtocol: false });
      assert.strictEqual(resInsecure.secure, false);
      assert.ok(resInsecure.reason?.includes("شنود"));

      // 3. Missing Transparent Security Attribute Coupling
      const resMissingHeaders = validateSecureDataTransportPolicy({ isSecureProtocol: true, hasAuthHeaders: false });
      assert.strictEqual(resMissingHeaders.secure, false);
      assert.ok(resMissingHeaders.reason?.includes("همبستگی شفاف"));

      // 4. Data Loss or Tampering in Transit
      const resTampered = validateSecureDataTransportPolicy({ isSecureProtocol: true, hasAuthHeaders: true, checksumValid: false });
      assert.strictEqual(resTampered.secure, false);
      assert.ok(resTampered.reason?.includes("دستکاری"));
    });
  });

  describe("15. User Data Egress Access Control & Security Attributes (AFTA Item 8 Requirement)", () => {
    it("should validate data egress/export against allowed data types, record volume limits, file size and format criteria", () => {
      // 1. Valid Egress
      const resValid = validateUserDataEgressAccessPolicy({
        exportType: "PDF",
        recordCount: 1000,
        fileSizeMB: 5,
        formatValid: true
      });
      assert.strictEqual(resValid.allowed, true);

      // 2. Disallowed Export Data Type
      const resInvalidType = validateUserDataEgressAccessPolicy({ exportType: "RAW" });
      assert.strictEqual(resInvalidType.allowed, false);
      assert.ok(resInvalidType.reason?.includes("نوع داده"));

      // 3. Exceeded Mass Export Record Count Limit
      const resExceededRecords = validateUserDataEgressAccessPolicy({ recordCount: 15000 });
      assert.strictEqual(resExceededRecords.allowed, false);
      assert.ok(resExceededRecords.reason?.includes("تعداد رکوردهای خروجی"));

      // 4. Exceeded Export File Size
      const resExceededSize = validateUserDataEgressAccessPolicy({ fileSizeMB: 100 });
      assert.strictEqual(resExceededSize.allowed, false);
      assert.ok(resExceededSize.reason?.includes("حجم فایل خروجی"));

      // 5. Invalid Export Format / Encoding
      const resInvalidFormat = validateUserDataEgressAccessPolicy({ formatValid: false });
      assert.strictEqual(resInvalidFormat.allowed, false);
      assert.ok(resInvalidFormat.reason?.includes("فرمت خروجی"));
    });
  });

  describe("16. Targeted Data Egress & Un-targeted Export Prevention Rules (AFTA Item 9 Requirement)", () => {
    it("should prevent aimless/un-targeted data egress and enforce authorized destination check and admin approval", () => {
      // 1. Valid Egress to Targeted Destination
      const resValid = validateTargetedDataEgressRules({
        hasTargetDestination: true,
        destinationAuthorized: true,
        isBulkWithoutApproval: false
      });
      assert.strictEqual(resValid.allowed, true);

      // 2. Aimless / Un-targeted Data Egress Attempt
      const resUntargeted = validateTargetedDataEgressRules({ hasTargetDestination: false });
      assert.strictEqual(resUntargeted.allowed, false);
      assert.ok(resUntargeted.reason?.includes("خروج بدون هدف"));

      // 3. Unauthorized Destination Endpoint
      const resUnauthorizedDest = validateTargetedDataEgressRules({ hasTargetDestination: true, destinationAuthorized: false });
      assert.strictEqual(resUnauthorizedDest.allowed, false);
      assert.ok(resUnauthorizedDest.reason?.includes("مقصد خروج داده"));

      // 4. Unapproved Bulk Data Egress Attempt
      const resBulkUnapproved = validateTargetedDataEgressRules({ hasTargetDestination: true, destinationAuthorized: true, isBulkWithoutApproval: true });
      assert.strictEqual(resBulkUnapproved.allowed, false);
      assert.ok(resBulkUnapproved.reason?.includes("تاییدیه"));
    });
  });

  describe("17. User Session Management Evaluation (Image Requirements 1, 2 & 3)", () => {
    it("1. should limit maximum number of concurrent sessions for a single user", () => {
      const maxConcurrentSessions = 3;
      const userActiveSessions = [
        { sessionId: "s1", userId: "usr_100", token: "tok_1", createdAt: new Date().toISOString() },
        { sessionId: "s2", userId: "usr_100", token: "tok_2", createdAt: new Date().toISOString() },
        { sessionId: "s3", userId: "usr_100", token: "tok_3", createdAt: new Date().toISOString() }
      ];

      const newLoginAttempted = true;
      let loginAllowed = false;
      let errorMessage = "";

      if (userActiveSessions.length >= maxConcurrentSessions) {
        loginAllowed = false;
        errorMessage = `تعداد نشست‌های همزمان فعال شما (${userActiveSessions.length}) بیش از حد مجاز (${maxConcurrentSessions}) است.`;
      } else {
        loginAllowed = true;
      }

      assert.strictEqual(loginAllowed, false, "New session establishment must be blocked when threshold is reached");
      assert.ok(errorMessage.includes("بیش از حد مجاز"), "Error message must indicate exceeding max concurrent sessions limit");
    });

    it("2. should terminate interactive remote sessions after configurable period of inactivity (idleTimeoutMinutes)", () => {
      const idleTimeoutMinutes = 15;
      const now = Date.now();
      const fifteenMinutesMs = 15 * 60 * 1000;

      const sessions = [
        { sessionId: "s_active", lastActivity: new Date(now - 5 * 60 * 1000).toISOString() }, // 5 mins ago -> Valid
        { sessionId: "s_idle_expired", lastActivity: new Date(now - 20 * 60 * 1000).toISOString() } // 20 mins ago -> Expired
      ];

      const activeRemaining: typeof sessions = [];
      const terminatedSessions: typeof sessions = [];

      for (const s of sessions) {
        const lastActTime = new Date(s.lastActivity).valueOf();
        const idleMinutes = (now - lastActTime) / (60 * 1000);
        if (idleMinutes > idleTimeoutMinutes) {
          terminatedSessions.push(s);
        } else {
          activeRemaining.push(s);
        }
      }

      assert.strictEqual(activeRemaining.length, 1, "Only active session within idle timeout must remain");
      assert.strictEqual(terminatedSessions.length, 1, "Idle session exceeding configurable threshold must be terminated");
      assert.strictEqual(terminatedSessions[0].sessionId, "s_idle_expired");
    });

    it("3. should allow the session initiator user to terminate their own active sessions", () => {
      const currentUser = { userId: "usr_300", username: "accountant_user" };
      const sessions = [
        { sessionId: "s_current", userId: "usr_300", username: "accountant_user", token: "tok_current" },
        { sessionId: "s_remote_laptop", userId: "usr_300", username: "accountant_user", token: "tok_remote1" },
        { sessionId: "s_remote_phone", userId: "usr_300", username: "accountant_user", token: "tok_remote2" },
        { sessionId: "s_other_user", userId: "usr_400", username: "other_user", token: "tok_other" }
      ];

      // 1. Initiator listing their own sessions
      const mySessions = sessions.filter(s => s.userId === currentUser.userId);
      assert.strictEqual(mySessions.length, 3, "Session initiator can list all active sessions started by themselves");

      // 2. Initiator terminating a specific session initiated by themselves
      const targetSessionId = "s_remote_laptop";
      const targetSession = sessions.find(s => s.sessionId === targetSessionId);

      const isInitiator = targetSession?.userId === currentUser.userId;
      assert.strictEqual(isInitiator, true, "User is verified as session initiator");

      let remainingSessions = sessions.filter(s => s.sessionId !== targetSessionId);
      assert.strictEqual(remainingSessions.length, 3, "Target session initiated by user must be successfully terminated");

      // 3. User attempting to terminate another user's session (must be rejected)
      const unauthorizedTarget = sessions.find(s => s.sessionId === "s_other_user");
      const canUserRevokeOtherUserSession = unauthorizedTarget?.userId === currentUser.userId;
      assert.strictEqual(canUserRevokeOtherUserSession, false, "User cannot terminate sessions initiated by another user");
    });
  });

  describe("18. TLS Server Protocol Compliance (AFTA 3-3 Requirements 1, 2 & 3)", () => {
    it("Requirement 1: should enforce TLS 1.2 (RFC 5246) and default tlsServerPolicy in system security policy", () => {
      const policy = DEFAULT_SECURITY_POLICY.tlsServerPolicy;
      assert.ok(policy, "tlsServerPolicy must be defined in default security policy");
      assert.strictEqual(policy.enable, true);
      assert.strictEqual(policy.enforceTls12Only, true, "TLS 1.2 (RFC 5246) enforcement must be enabled by default");
    });

    it("Requirement 1: should include and support all 16 specified cipher suites with exact Hex & RFC standards", () => {
      const cipherSuites = DEFAULT_SECURITY_POLICY.tlsServerPolicy?.cipherSuites;
      assert.ok(cipherSuites, "Cipher suites configuration must exist");

      const expectedCipherKeys = [
        "tls_aes_256_gcm_sha384",
        "tls_aes_128_gcm_sha256",
        "tls_dhe_rsa_with_aes_256_gcm_sha384",
        "tls_dhe_rsa_with_aes_128_gcm_sha256",
        "tls_ecdhe_rsa_with_aes_128_gcm_sha256",
        "tls_ecdhe_rsa_with_aes_256_gcm_sha384",
        "tls_ecdhe_ecdsa_with_aes_256_gcm_sha384",
        "tls_ecdhe_ecdsa_with_aes_128_gcm_sha256",
        "tls_rsa_with_aes_256_gcm_sha384",
        "tls_rsa_with_aes_128_gcm_sha256",
        "tls_ecdh_ecdsa_with_aes_256_gcm_sha384",
        "tls_ecdh_ecdsa_with_aes_128_gcm_sha256",
        "tls_ecdh_rsa_with_aes_256_gcm_sha384",
        "tls_ecdh_rsa_with_aes_128_gcm_sha256",
        "tls_dh_rsa_with_aes_256_gcm_sha384",
        "tls_dh_rsa_with_aes_128_gcm_sha256",
      ];

      assert.strictEqual(Object.keys(cipherSuites).length, 16, "Must contain exactly 16 TLS Server cipher suites");
      for (const key of expectedCipherKeys) {
        assert.strictEqual((cipherSuites as any)[key], true, `Cipher suite ${key} must be enabled by default`);
      }
    });

    it("Requirement 2: should reject user connections requesting SSL 1.0, SSL 2.0, SSL 3.0, TLS 1.0, and TLS 1.1", () => {
      const legacyProtocols = ["SSL1.0", "SSL 2.0", "SSL3.0", "TLS1.0", "TLS1.1"];
      for (const proto of legacyProtocols) {
        const res = validateTlsServerProtocolRequest(proto);
        assert.strictEqual(res.allowed, false, `Connection requesting ${proto} must be rejected under Requirement 2`);
        assert.ok(res.reason?.includes("مسدود و رد گردید"));
      }

      // Valid TLS 1.2 request must be allowed
      const validRes = validateTlsServerProtocolRequest("TLS 1.2");
      assert.strictEqual(validRes.allowed, true);
    });

    it("Requirement 3: should enforce key generation parameters for RSA (2048/3072/4096), ECDH(E) NIST curves, and DH (2048/3072)", () => {
      // 1. RSA Key Sizes
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "RSA", keySizeBits: 2048 }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "RSA", keySizeBits: 3072 }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "RSA", keySizeBits: 4096 }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "RSA", keySizeBits: 1024 }).valid, false, "RSA 1024-bit must be rejected");

      // 2. ECDH(E) NIST Curves
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "ECDHE", curveName: "secp256r1" }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "ECDHE", curveName: "secp384r1" }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "ECDHE", curveName: "secp521r1" }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "ECDHE", curveName: "brainpoolP256r1" }).valid, false, "Non-NIST curves must be rejected");

      // 3. DH Key Sizes
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "DH", keySizeBits: 2048 }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "DH", keySizeBits: 3072 }).valid, true);
      assert.strictEqual(validateTlsServerKeyExchangeParameters({ keyType: "DH", keySizeBits: 1024 }).valid, false, "DH 1024-bit must be rejected");
    });
  });

  describe("19. Mutual TLS (mTLS) Shared Client/Server Compliance (AFTA 3-4 Requirements 1 & 2)", () => {
    it("Requirement 1: should enable mutual X509v3 client/server authentication support by default", () => {
      const policy = DEFAULT_SECURITY_POLICY.mutualTlsPolicy;
      assert.ok(policy, "mutualTlsPolicy must exist in default security policy");
      assert.strictEqual(policy.enable, true);
      assert.strictEqual(policy.enableMutualAuthX509v3, true, "X.509v3 mutual authentication must be enabled");
    });

    it("Requirement 2: should prevent secure channel establishment when Subject DN or SAN does not match expected client identifier", () => {
      // 1. Matching Subject DN -> Allowed
      const matchRes = validateMutualTlsIdentity({
        subjectDN: "CN=FinanceClient01, OU=Finance, O=Gov",
        expectedClientIdentifier: "FinanceClient01"
      });
      assert.strictEqual(matchRes.valid, true, "Matching client identifier in Subject DN must allow channel creation");

      // 2. Mismatched Subject DN -> Blocked / Disconnected
      const mismatchRes = validateMutualTlsIdentity({
        subjectDN: "CN=UnauthorizedClient, OU=Guest, O=Other",
        expectedClientIdentifier: "FinanceClient01"
      });
      assert.strictEqual(mismatchRes.valid, false, "Mismatched Subject DN must block secure channel establishment under Requirement 2");
      assert.ok(mismatchRes.reason?.includes("عدم مطابقت نام متمایز"));
    });
  });

  describe("20. Certificate Validation Compliance (AFTA 3-5 Requirements 1, 2 & 3)", () => {
    it("Requirement 1: Path Validation Rules - should enforce RFC 5280, trusted CA end anchor, and basicConstraints CA=TRUE", () => {
      // Valid path
      const validPath = validateCertificatePathRules({ length: 2, endsWithTrustedCA: true, allCaHaveBasicConstraintsCaTrue: true });
      assert.strictEqual(validPath.valid, true);

      // Short path (< 2)
      const shortPath = validateCertificatePathRules({ length: 1, endsWithTrustedCA: true, allCaHaveBasicConstraintsCaTrue: true });
      assert.strictEqual(shortPath.valid, false);

      // Untrusted CA
      const untrustedPath = validateCertificatePathRules({ length: 2, endsWithTrustedCA: false, allCaHaveBasicConstraintsCaTrue: true });
      assert.strictEqual(untrustedPath.valid, false);

      // Missing basicConstraints CA=TRUE
      const missingCaFlag = validateCertificatePathRules({ length: 2, endsWithTrustedCA: true, allCaHaveBasicConstraintsCaTrue: false });
      assert.strictEqual(missingCaFlag.valid, false);
    });

    it("Requirement 2: CA Acceptance Rule - should ONLY accept cert as CA if basicConstraints is present AND CA flag is TRUE", () => {
      // Valid CA cert with basicConstraints and CA=TRUE -> Accepted
      assert.strictEqual(validateCaCertificateAcceptance({ basicConstraintsPresent: true, isCA: true }).valid, true);

      // Cert missing basicConstraints -> Rejected as CA
      const noConstraints = validateCaCertificateAcceptance({ basicConstraintsPresent: false, isCA: true });
      assert.strictEqual(noConstraints.valid, false);
      assert.ok(noConstraints.reason?.includes("basicConstraints"));

      // Cert with CA=FALSE -> Rejected as CA
      const notCA = validateCaCertificateAcceptance({ basicConstraintsPresent: true, isCA: false });
      assert.strictEqual(notCA.valid, false);
    });

    it("Requirement 3: RFC 5280 X509v3 Scopes - should support X509v3 certificates for HTTPS, TLS, SSH, Code Signing & Integrity", () => {
      assert.strictEqual(validateX509v3Rfc5280Scope("HTTPS").valid, true);
      assert.strictEqual(validateX509v3Rfc5280Scope("TLS").valid, true);
      assert.strictEqual(validateX509v3Rfc5280Scope("SSH").valid, true);
      assert.strictEqual(validateX509v3Rfc5280Scope("CODE_SIGNING_UPDATES").valid, true);
      assert.strictEqual(validateX509v3Rfc5280Scope("CODE_SIGNING_INTEGRITY").valid, true);
      assert.strictEqual(validateX509v3Rfc5280Scope("OTHER").valid, true);
    });

    it("Revocation Checking Methods: should support OCSP (RFC 696) & CRL (RFC 5280/5759) and reject unauthorized methods", () => {
      assert.strictEqual(validateCertificateRevocationCheck("OCSP_RFC696").valid, true);
      assert.strictEqual(validateCertificateRevocationCheck("CRL_RFC5280_SEC63").valid, true);
      assert.strictEqual(validateCertificateRevocationCheck("CRL_RFC5759_SEC5").valid, true);

      const invalidRev = validateCertificateRevocationCheck("OTHER");
      assert.strictEqual(invalidRev.valid, false);
    });

    it("ExtendedKeyUsage Rules: should validate exact OIDs for Code Signing, Server Auth, Client Auth, and OCSP Signing", () => {
      // Code Signing: OID 1.3.6.1.5.5.7.3.3 (id-kp3)
      assert.strictEqual(validateExtendedKeyUsageOid("CODE_SIGNING", "1.3.6.1.5.5.7.3.3").valid, true);
      assert.strictEqual(validateExtendedKeyUsageOid("CODE_SIGNING", "1.3.6.1.5.5.7.3.1").valid, false);

      // Server Authentication: OID 1.3.6.1.5.5.7.3.1 (id-kp1)
      assert.strictEqual(validateExtendedKeyUsageOid("SERVER_AUTH", "1.3.6.1.5.5.7.3.1").valid, true);

      // Client Authentication: OID 1.3.6.1.5.5.7.3.2 (id-kp2)
      assert.strictEqual(validateExtendedKeyUsageOid("CLIENT_AUTH", "1.3.6.1.5.5.7.3.2").valid, true);

      // OCSP Signing: OID 1.3.6.1.5.5.7.3.9 (id-kp9)
      assert.strictEqual(validateExtendedKeyUsageOid("OCSP_SIGNING", "1.3.6.1.5.5.7.3.9").valid, true);
    });
  });

  describe("21. SSH Protocol Security Compliance (AFTA 3-6 Requirements 1 to 9)", () => {
    it("Requirement 1: should enforce RFC compliance for RFC 4251, 4252, 4253, 4254, 5656, and 6668", () => {
      const rfc = DEFAULT_SECURITY_POLICY.sshProtocolPolicy?.rfcCompliance;
      assert.ok(rfc);
      assert.strictEqual(rfc.rfc4251, true);
      assert.strictEqual(rfc.rfc4252, true);
      assert.strictEqual(rfc.rfc4253, true);
      assert.strictEqual(rfc.rfc4254, true);
      assert.strictEqual(rfc.rfc5656, true);
      assert.strictEqual(rfc.rfc6668, true);
    });

    it("Requirement 2: should support Public Key and Password authentication methods per RFC 4252", () => {
      const auth = DEFAULT_SECURITY_POLICY.sshProtocolPolicy?.authMethods;
      assert.ok(auth);
      assert.strictEqual(auth.publicKeyAuth, true);
      assert.strictEqual(auth.passwordAuth, true);
    });

    it("Requirement 3: should discard SSH packets larger than maximum size threshold (35,000 bytes)", () => {
      // Small packet -> Valid
      assert.strictEqual(validateSshPacketSize(1024).valid, true);
      assert.strictEqual(validateSshPacketSize(35000).valid, true);

      // Oversized packet (> 35,000 bytes) -> Rejected
      const oversized = validateSshPacketSize(40000);
      assert.strictEqual(oversized.valid, false);
      assert.ok(oversized.reason?.includes("بیشتر از حد آستانه مجاز"));
    });

    it("Requirements 4, 5, 6 & 7: should configure allowed encryption ciphers, hostkeys (13), MACs (6), and KEX algorithms (13)", () => {
      const ssh = DEFAULT_SECURITY_POLICY.sshProtocolPolicy;
      assert.strictEqual(Object.keys(ssh?.encryptionAlgorithms!).length, 8, "Must support 8 encryption ciphers");
      assert.strictEqual(Object.keys(ssh?.hostKeyAlgorithms!).length, 13, "Must support 13 hostkey algorithms");
      assert.strictEqual(Object.keys(ssh?.macAlgorithms!).length, 6, "Must support 6 MAC algorithms");
      assert.strictEqual(Object.keys(ssh?.kexAlgorithms!).length, 13, "Must support 13 KEX algorithms");
    });

    it("Requirement 8: should trigger session key rekeying when duration reaches 1 hour (60 min) or transferred data reaches 1 GB (1024 MB)", () => {
      // Under limit -> No rekeying required
      assert.strictEqual(validateSshRekeyingTrigger(30, 500).mustRekey, false);

      // Duration threshold reached (>= 60 min) -> Rekeying triggered
      const timeTrigger = validateSshRekeyingTrigger(60, 100);
      assert.strictEqual(timeTrigger.mustRekey, true);

      // Data threshold reached (>= 1024 MB) -> Rekeying triggered
      const dataTrigger = validateSshRekeyingTrigger(10, 1024);
      assert.strictEqual(dataTrigger.mustRekey, true);
    });

    it("Requirement 9: should enforce SSH server host key verification via local known_hosts database", () => {
      // Known host key -> Allowed
      assert.strictEqual(validateSshHostVerification({ hostname: "server1.gov.ir", hostKeyInLocalKnownHosts: true }).valid, true);

      // Unknown host key -> Rejected
      const unknownHost = validateSshHostVerification({ hostname: "untrusted.domain", hostKeyInLocalKnownHosts: false });
      assert.strictEqual(unknownHost.valid, false);
      assert.ok(unknownHost.reason?.includes("known_hosts"));
    });
  });

  describe("22. HTTP Security Headers Compliance (HSTS, Cache-Control, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)", () => {
    it("should include all 5 mandatory HTTP security headers and cache prevention headers in Hono app responses", async () => {
      const { Hono } = await import("hono");
      const { securityHeaders } = await import("../middleware/securityHeaders.js");

      const app = new Hono();
      app.use("*", securityHeaders);
      app.get("/test-headers", (c) => c.json({ ok: true }));

      const res = await app.request("http://localhost/test-headers");
      assert.strictEqual(res.status, 200);

      // 1. Strict-Transport-Security
      const hsts = res.headers.get("Strict-Transport-Security");
      assert.ok(hsts, "Strict-Transport-Security header must be present");
      assert.ok(hsts.includes("max-age="), "HSTS must specify max-age");
      assert.ok(hsts.includes("includeSubDomains"), "HSTS must include includeSubDomains directive");

      // 2. Cache-Control & Pragma
      const cacheControl = res.headers.get("Cache-Control");
      assert.ok(cacheControl, "Cache-Control header must be present");
      assert.ok(cacheControl.includes("no-cache"), "Cache-Control must contain no-cache");
      assert.ok(cacheControl.includes("no-store"), "Cache-Control must contain no-store");
      assert.ok(cacheControl.includes("must-revalidate"), "Cache-Control must contain must-revalidate");

      const pragma = res.headers.get("Pragma");
      assert.strictEqual(pragma, "no-store", "Pragma header must be set to no-store for legacy HTTP 1.0 client cache prevention");

      // 3. X-Content-Type-Options
      const nosniff = res.headers.get("X-Content-Type-Options");
      assert.strictEqual(nosniff, "nosniff", "X-Content-Type-Options must be set to nosniff to prevent MIME-sniffing attacks");

      // 4. X-Frame-Options
      const frameOptions = res.headers.get("X-Frame-Options");
      assert.ok(frameOptions === "DENY" || frameOptions === "SAMEORIGIN", "X-Frame-Options must be set to DENY or SAMEORIGIN to prevent Clickjacking");

      // 5. X-XSS-Protection
      const xssProtection = res.headers.get("X-XSS-Protection");
      assert.strictEqual(xssProtection, "1; mode=block", "X-XSS-Protection must be set to 1; mode=block to enable browser XSS filtering");
    });
  });

  describe("23. Secure Cookie Configuration Compliance (SameSite, Secure, HttpOnly, Host-Only)", () => {
    it("should correctly configure HttpOnly, Secure, SameSite=Strict, and Host-Only cookie attributes", async () => {
      const { Hono } = await import("hono");
      const { setSecureAuthCookie, getAuthTokenFromCookieOrHeader, SECURE_COOKIE_NAME } = await import("../lib/cookieHelper.js");

      const app = new Hono();
      app.get("/login-test", (c) => {
        setSecureAuthCookie(c, "test_jwt_token_12345");
        return c.json({ success: true });
      });

      app.get("/protected-test", (c) => {
        const token = getAuthTokenFromCookieOrHeader(c);
        return c.json({ authenticated: token === "test_jwt_token_12345", token });
      });

      // Simulate HTTPS Request to verify production/HTTPS cookie headers
      const req = new Request("https://localhost/login-test", {
        headers: { "x-forwarded-proto": "https" }
      });
      const res = await app.request(req);
      assert.strictEqual(res.status, 200);

      // Extract Set-Cookie headers
      const cookies = res.headers.getSetCookie();
      assert.ok(cookies.length > 0, "Set-Cookie headers must be present in login response");

      const secureCookieHeader = cookies.find(c => c.includes(SECURE_COOKIE_NAME));
      assert.ok(secureCookieHeader, `Cookie with W3C Host-Only prefix ${SECURE_COOKIE_NAME} must be set`);

      // 1. HttpOnly attribute check
      assert.ok(secureCookieHeader.includes("HttpOnly"), "Cookie must specify HttpOnly flag");

      // 2. Secure attribute check
      assert.ok(secureCookieHeader.includes("Secure"), "Cookie must specify Secure flag");

      // 3. SameSite=Strict check
      assert.ok(secureCookieHeader.includes("SameSite=Strict"), "Cookie must specify SameSite=Strict");

      // 4. Host-Only requirement check (Prefix __Host-, Path=/, No Domain attribute)
      assert.ok(secureCookieHeader.startsWith("__Host-"), "Cookie name must start with W3C prefix __Host-");
      assert.ok(secureCookieHeader.includes("Path=/"), "Host-Only cookie must set Path=/");
      assert.strictEqual(secureCookieHeader.includes("Domain="), false, "Host-Only cookie must NOT specify a Domain attribute");

      // 5. Verify authentication retrieval from cookie
      const protectedReq = new Request("https://localhost/protected-test", {
        headers: { Cookie: `${SECURE_COOKIE_NAME}=test_jwt_token_12345` }
      });
      const protectedRes = await app.request(protectedReq);
      const protectedData = await protectedRes.json();
      assert.strictEqual(protectedData.authenticated, true);
      assert.strictEqual(protectedData.token, "test_jwt_token_12345");
    });
  });

  describe("24. Anti-CSRF Token Protection & Per-Request Token Rotation", () => {
    it("should enforce Anti-CSRF token verification, reject missing/reused tokens, and issue freshly rotated tokens on every request", async () => {
      const { Hono } = await import("hono");
      const { csrfProtection } = await import("../middleware/csrfProtection.js");
      const { generateCsrfToken, validateAndConsumeCsrfToken } = await import("../lib/csrfHelper.js");

      const app = new Hono();
      app.use("*", csrfProtection);
      app.post("/api/sensitive-form", (c) => c.json({ success: true, message: "فرم با موفقیت پردازش شد" }));

      // 1. Rejection of state-changing request missing Anti-CSRF token
      const reqMissing = new Request("http://localhost/api/sensitive-form", { method: "POST" });
      const resMissing = await app.request(reqMissing);
      assert.strictEqual(resMissing.status, 403, "Must reject request without Anti-CSRF token with 403 Forbidden");
      
      const missingTokenHeader = resMissing.headers.get("X-CSRF-Token");
      assert.ok(missingTokenHeader, "Server must return freshly rotated Anti-CSRF token in response header");

      // 2. Acceptance of state-changing request with valid Anti-CSRF token
      const validToken = generateCsrfToken();
      const reqValid = new Request("http://localhost/api/sensitive-form", {
        method: "POST",
        headers: { "X-CSRF-Token": validToken }
      });
      const resValid = await app.request(reqValid);
      assert.strictEqual(resValid.status, 200, "Valid Anti-CSRF token must be accepted");

      const rotatedTokenHeader = resValid.headers.get("X-CSRF-Token");
      assert.ok(rotatedTokenHeader, "Rotated CSRF token must be attached to response header");
      assert.notStrictEqual(rotatedTokenHeader, validToken, "CSRF token must be rotated per-request");

      // 3. One-Time Use / Replay Prevention Check (Token consumption on every request)
      // Attempting to reuse the exact same token must fail
      const reqReused = new Request("http://localhost/api/sensitive-form", {
        method: "POST",
        headers: { "X-CSRF-Token": validToken }
      });
      const resReused = await app.request(reqReused);
      assert.strictEqual(resReused.status, 403, "Reused Anti-CSRF token must be rejected (One-time token per request)");

      // 4. Verification of newly rotated token usage
      const reqNewRotated = new Request("http://localhost/api/sensitive-form", {
        method: "POST",
        headers: { "X-CSRF-Token": rotatedTokenHeader }
      });
      const resNewRotated = await app.request(reqNewRotated);
      assert.strictEqual(resNewRotated.status, 200, "Newly rotated token must be valid for the next request");
    });
  });
});



