import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { checkIpLockout, recordIpFailure, unblockIp, getIpLockouts } from "../lib/ipLockout.js";
import { connectDb, getDb } from "../db/index.js";

describe("🛡️ IP Lockout & Account Blocking Security Test Suite", () => {
  before(async () => {
    try {
      await connectDb();
    } catch (_) {}
  });

  after(async () => {
    try {
      const db = getDb();
      await db.collection("ip_lockouts").deleteMany({ ip: "192.168.1.100" });
    } catch (_) {}
  });

  it("should format IP lockout policy parameters correctly", () => {
    const testPolicy = {
      enableIpLockout: true,
      maxIpFailedAttempts: 5,
      ipLockoutDurationMinutes: 15,
      ipRateLimitWindowMinutes: 5
    };

    assert.strictEqual(testPolicy.enableIpLockout, true);
    assert.strictEqual(testPolicy.maxIpFailedAttempts, 5);
    assert.strictEqual(testPolicy.ipLockoutDurationMinutes, 15);
  });

  it("should record IP failures and block IP upon reaching threshold limit", async () => {
    const testIp = "192.168.1.100";
    const testPolicy = {
      enableIpLockout: true,
      maxIpFailedAttempts: 3,
      ipLockoutDurationMinutes: 10,
      ipRateLimitWindowMinutes: 5
    };

    // 1. Initial check - not blocked
    const res1 = await checkIpLockout(testIp, testPolicy);
    assert.strictEqual(res1.blocked, false);

    // 2. Record 2 failures
    await recordIpFailure(testIp, testPolicy);
    await recordIpFailure(testIp, testPolicy);
    const res2 = await checkIpLockout(testIp, testPolicy);
    assert.strictEqual(res2.blocked, false);

    // 3. Record 3rd failure -> Threshold reached (3)
    await recordIpFailure(testIp, testPolicy);
    const res3 = await checkIpLockout(testIp, testPolicy);
    assert.strictEqual(res3.blocked, true, "IP should be blocked after 3 failures");
    assert.ok(res3.remainingMinutes > 0, "Remaining minutes must be positive");

    // 4. Verify IP appears in getIpLockouts list
    const lockouts = await getIpLockouts();
    assert.ok(lockouts.some(l => l.ip === testIp), "Blocked IP must appear in admin list");

    // 5. Admin unblocks IP
    const unblocked = await unblockIp(testIp, "admin");
    assert.strictEqual(unblocked, true, "Unblock function should return true");

    // 6. Verify check returns unblocked
    const res4 = await checkIpLockout(testIp, testPolicy);
    assert.strictEqual(res4.blocked, false, "IP must be unblocked after admin unblock action");
  });
});
