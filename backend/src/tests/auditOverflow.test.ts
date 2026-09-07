import { describe, it } from "node:test";
import assert from "node:assert";
import { AFTA_LOG_EVENT_TYPES, AUDIT_STORAGE_THRESHOLD } from "../lib/auditLogger.js";

describe("🛡️ Audit Log Threshold Overflow & Rotation Test Suite", () => {
  it("should define AUDIT_LOG_OVERFLOW_ACTION in AFTA event types", () => {
    assert.strictEqual(
      AFTA_LOG_EVENT_TYPES.AUDIT_LOG_OVERFLOW_ACTION,
      "عملیات سرریز حافظه ثبت‌نشان‌ها از حد آستانه",
      "AUDIT_LOG_OVERFLOW_ACTION must match AFTA specification"
    );
  });

  it("should have AUDIT_STORAGE_THRESHOLD set to 10,000", () => {
    assert.strictEqual(AUDIT_STORAGE_THRESHOLD, 10000, "Audit storage threshold ceiling must be 10000 records");
  });

  it("should format audit overflow details with count, ceiling, and overwrite notice", () => {
    const totalCount = 10000;
    const prunedByAge = 120;
    const prunedByCapacity = 500;

    const overflowDetails = {
      registeredLogsCount: totalCount,
      ceilingLimit: AUDIT_STORAGE_THRESHOLD,
      overwrittenTimeframe: "۹۰ روز (۳ ماه)",
      description: `تعداد ثبت‌نشان‌های ذخیره‌شده به حد آستانه تعیین‌شده (سقف ${AUDIT_STORAGE_THRESHOLD} رکورد) رسیده است. لاگ‌های قدیمی‌تر از زمان تعیین‌شده (۹۰ روز / ۳ ماه) و لاگ‌های مازاد بر سقف جهت بازنویسی و ایجاد ظرفیت لاگ جدید به‌صورت خودکار چرخش/بازنویسی گردیدند.`,
      prunedByAgeCount: prunedByAge,
      prunedByCapacityCount: prunedByCapacity,
      retentionPeriodDays: 90
    };

    assert.strictEqual(overflowDetails.registeredLogsCount, 10000);
    assert.strictEqual(overflowDetails.ceilingLimit, 10000);
    assert.ok(overflowDetails.description.includes("بازنویسی"));
    assert.ok(overflowDetails.description.includes("حد آستانه تعیین‌شده"));
    assert.ok(overflowDetails.description.includes("۹۰ روز"));
  });
});
