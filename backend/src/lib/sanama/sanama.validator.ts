import {
  SanamaHeader,
  SanamaReportItem,
  SanamaContrastAccount,
  SanamaValidationResult,
  SanamaValidationError,
  SanamaValidationWarning,
  SanamaMappingGap
} from "./sanama.types";
import { SANAMA_CONSTANTS } from "./sanama.constants";
import sanamaRequirementsData from "../../data/sanamaRequirements.json";
import subAccountTitlesData from "../../data/subAccountTitles.json";

const sanamaRequirements: Record<string, { requiredRows: number[] }> = sanamaRequirementsData as any;
const validMoeinCodesSet = new Set<string>(
  Array.isArray(subAccountTitlesData) ? subAccountTitlesData.map((item: any) => String(item.code)) : []
);

export class SanamaValidator {
  /**
   * Validate Executive Org 11-digit National ID (MainOrgID)
   */
  public static validateNationalId(orgId: string): boolean {
    const clean = String(orgId || "").trim();
    return /^\d{11}$/.test(clean);
  }

  /**
   * Validate 16-character NomineeCode according to SANAMA Edition 19
   * NomineeCode structure: 1 char type + 4 chars class + 11 chars identification
   */
  public static validateNomineeCode(code: string): { isValid: boolean; reason?: string } {
    const clean = String(code || "").trim();
    if (clean === "0" || clean === "") {
      return { isValid: true }; // Allowed default if person is not applicable
    }
    if (clean.length !== 16) {
      return { isValid: false, reason: `کد اشخاص (NomineeCode) باید دقیقاً ۱۶ کاراکتر باشد. طول فعلی: ${clean.length}` };
    }
    return { isValid: true };
  }

  /**
   * Run complete validation pass over SANAMA header, report list, and contrast accounts
   */
  public static validateAll(
    header: SanamaHeader,
    reportItems: SanamaReportItem[],
    contrastAccounts: SanamaContrastAccount[],
    customMoeinSet?: Set<string>
  ): SanamaValidationResult {
    const errors: SanamaValidationError[] = [];
    const warnings: SanamaValidationWarning[] = [];
    const gaps: SanamaMappingGap[] = [];

    // ── 1. Header Validation ──
    if (!header.mainOrgID || !this.validateNationalId(header.mainOrgID)) {
      errors.push({
        code: "SANAMA_ERR_ORG_ID",
        category: "Structural",
        field: "MainOrgID",
        message: "شناسه ملی دستگاه اجرایی (MainOrgID) نامعتبر است. باید دقیقاً ۱۱ رقم عددی باشد."
      });
    }

    if (!header.mainOrgCode || String(header.mainOrgCode).trim() === "") {
      errors.push({
        code: "SANAMA_ERR_ORG_CODE",
        category: "Structural",
        field: "MainOrgCode",
        message: "ردیف بودجه‌ای دستگاه اجرایی (MainOrgCode) تکمیل نشده است."
      });
    }

    if (!header.year || !/^\d{4}$/.test(String(header.year).trim())) {
      errors.push({
        code: "SANAMA_ERR_YEAR",
        category: "Structural",
        field: "Year",
        message: "سال گزارش (Year) نامعتبر است. باید ۴ رقم عددی باشد (مثلاً ۱۴۰۳)."
      });
    }

    const validMonths = Object.keys(SANAMA_CONSTANTS.MONTH_MAP);
    if (!header.month || !validMonths.includes(String(header.month).trim())) {
      errors.push({
        code: "SANAMA_ERR_MONTH",
        category: "Structural",
        field: "Month",
        message: `کد ماه (${header.month}) نامعتبر است. کدهای مجاز: ۱ تا ۱۲ یا ۱۵ (تراز نهایی).`
      });
    }

    // ── 2. Report Items Accounting & Structural Validation ──
    let totalDebit = 0;
    let totalCredit = 0;
    let validAccountsCount = 0;
    let invalidAccountsCount = 0;

    const moeinSet = customMoeinSet || validMoeinCodesSet;

    reportItems.forEach((item, index) => {
      const accCode = String(item.AccCode || "").trim();

      if (!accCode) {
        errors.push({
          code: "SANAMA_ERR_ACC_MISSING",
          category: "Accounting",
          message: `ردیف ${index + 1}: کد حساب معین (AccCode) مشخص نشده است.`
        });
        invalidAccountsCount++;
        return;
      }

      // Check if accCode exists in standard Moein coding
      if (moeinSet.size > 0 && !moeinSet.has(accCode)) {
        errors.push({
          code: "SANAMA_ERR_INVALID_MOEIN",
          category: "Accounting",
          accCode,
          message: `کد معین (${accCode}) در کدینگ حساب‌های معین سناما تعریف نشده است.`
        });
        invalidAccountsCount++;
      } else {
        validAccountsCount++;
      }

      // Check Debtor and Creditor progress amounts
      const debit = Number(item.SummaryProgressDeptor || 0);
      const credit = Number(item.SummaryProgressCreditor || 0);

      if (debit < 0) {
        errors.push({
          code: "SANAMA_ERR_NEG_DEBIT",
          category: "Accounting",
          accCode,
          message: `گردش بدهکار (SummaryProgressDeptor) در حساب ${accCode} نباید منفی باشد.`
        });
      }

      if (credit < 0) {
        errors.push({
          code: "SANAMA_ERR_NEG_CREDIT",
          category: "Accounting",
          accCode,
          message: `گردش بستانکار (SummaryProgressCreditor) در حساب ${accCode} نباید منفی باشد.`
        });
      }

      totalDebit += debit;
      totalCredit += credit;

      // Validate NomineeCode if provided
      if (item.NomineeCode && item.NomineeCode !== "0") {
        const nomCheck = this.validateNomineeCode(item.NomineeCode);
        if (!nomCheck.isValid) {
          warnings.push({
            code: "SANAMA_WARN_NOMINEE",
            category: "DataQuality",
            accCode,
            field: "NomineeCode",
            message: `در حساب ${accCode}: ${nomCheck.reason}`
          });
        }
      }

      // Check missing required attributes per sanamaRequirements.json
      const reqConfig = sanamaRequirements[accCode];
      if (reqConfig && reqConfig.requiredRows) {
        const missingAttrs: string[] = [];
        reqConfig.requiredRows.forEach((rowNum) => {
          // Find matching attribute name
          const attrName = Object.keys(SANAMA_CONSTANTS.ATTR_TO_ROW_MAP).find(
            (k) => SANAMA_CONSTANTS.ATTR_TO_ROW_MAP[k] === rowNum
          );
          if (attrName) {
            const val = item[attrName];
            if (val === undefined || val === null || String(val).trim() === "") {
              missingAttrs.push(attrName);
            }
          }
        });

        if (missingAttrs.length > 0) {
          gaps.push({
            accCode,
            missingAttributes: missingAttrs,
            description: `حساب ${accCode} نیازمند ویژگی‌های ${missingAttrs.join(", ")} است اما مقدار آن‌ها خالی است.`
          });
          warnings.push({
            code: "SANAMA_WARN_GAP",
            category: "MappingGap",
            accCode,
            message: `حساب ${accCode}: ویژگی‌های موردنیاز سناما (${missingAttrs.join(", ")}) در اسناد مالی مقداردهی نشده‌اند.`
          });
        }
      }
    });

    // ── 3. Contrast Accounts (Bank Reconciliation) Validation ──
    contrastAccounts.forEach((acc, i) => {
      const iban = String(acc.accountNumber || "").trim();
      if (!iban) {
        warnings.push({
          code: "SANAMA_WARN_BANK_IBAN",
          category: "DataQuality",
          message: `حساب بانکی ردیف ${i + 1} فاقد شماره حساب / شبا (AccountNumber) است.`
        });
      }
    });

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      gaps,
      stats: {
        totalReportRows: reportItems.length,
        totalDebitProgress: totalDebit,
        totalCreditProgress: totalCredit,
        totalContrastAccounts: contrastAccounts.length,
        validAccountsCount,
        invalidAccountsCount
      }
    };
  }
}
