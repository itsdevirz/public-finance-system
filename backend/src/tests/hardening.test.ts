import { describe, it } from "node:test";
import assert from "node:assert";
import { isPrivateOrInternalIp, validatePublicTlsTarget } from "../lib/ssrfGuard.js";
import { generateCsrfToken, validateCsrfToken, validateAndConsumeCsrfToken } from "../lib/csrfHelper.js";

describe("🛡️ Security Hardening Regression & Verification Test Suite", () => {
  describe("1. SSRF & Internal IP Guard (Item 7)", () => {
    it("should detect loopback and private IPv4/IPv6 addresses", () => {
      assert.strictEqual(isPrivateOrInternalIp("127.0.0.1"), true, "Loopback IPv4 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("10.0.0.5"), true, "Private IPv4 10.0.0.0/8 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("172.16.0.1"), true, "Private IPv4 172.16.0.0/12 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("192.168.1.1"), true, "Private IPv4 192.168.0.0/16 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("169.254.169.254"), true, "Link-local IPv4 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("224.0.0.1"), true, "Multicast IPv4 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("::1"), true, "Loopback IPv6 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("fe80::1"), true, "Link-local IPv6 must be blocked");
      assert.strictEqual(isPrivateOrInternalIp("fc00::1"), true, "Unique local IPv6 must be blocked");
    });

    it("should reject internal hostnames and allow valid public hostnames", async () => {
      const localhostCheck = await validatePublicTlsTarget("localhost", 443);
      assert.strictEqual(localhostCheck.safe, false, "localhost must be rejected");

      const localDomainCheck = await validatePublicTlsTarget("my-server.local", 443);
      assert.strictEqual(localDomainCheck.safe, false, ".local domains must be rejected");

      const publicCheck = await validatePublicTlsTarget("google.com", 443);
      assert.strictEqual(publicCheck.safe, true, "Public hostname google.com should be accepted");
    });
  });

  describe("2. HMAC Signed CSRF Protection & Concurrency Support (Item 3)", () => {
    it("should generate and validate HMAC signed CSRF tokens", () => {
      const token = generateCsrfToken();
      assert.strictEqual(typeof token, "string");
      assert.ok(token.split(".").length === 3, "Token format must be rawBytes.timestamp.signature");

      const isValid = validateCsrfToken(token);
      assert.strictEqual(isValid, true, "Generated token must be valid");

      const tampered = token.slice(0, -4) + "0000";
      assert.strictEqual(validateCsrfToken(tampered), false, "Tampered token must be rejected");
    });

    it("should support concurrent in-flight requests within grace period while rejecting replay attacks outside grace period", async () => {
      const token = generateCsrfToken();
      
      // First request consumes token
      const req1 = validateAndConsumeCsrfToken(token, 5000);
      assert.strictEqual(req1, true, "First request must consume valid token");

      // Concurrent request within 5s grace period succeeds
      const req2Concurrent = validateAndConsumeCsrfToken(token, 5000);
      assert.strictEqual(req2Concurrent, true, "Concurrent in-flight request within grace period must succeed");

      // Wait 30ms so time elapsed > gracePeriodMs (10ms)
      await new Promise((r) => setTimeout(r, 30));

      // Reused token outside grace period fails
      const req3Replay = validateAndConsumeCsrfToken(token, 10);
      assert.strictEqual(req3Replay, false, "Replayed token outside grace period must be rejected");
    });
  });
});
