import { SanamaReportItem, SanamaContrastAccount, SanamaDiffType } from "./sanama.types";
import { SANAMA_CONSTANTS } from "./sanama.constants";
import sanamaRequirementsData from "../../data/sanamaRequirements.json";

const sanamaRequirements: Record<string, { requiredRows: number[] }> = sanamaRequirementsData as any;

/**
 * Helper to convert Persian digits to English digits
 */

export function toEnglishDigits(str: any): string {
  return String(str || "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
    .trim();
}

export interface SanamaFilterOptions {
  exportType?: "monthly" | "final";
  month?: string;
  fiscalYear?: string;
  fromAccountCode?: string;
  toAccountCode?: string;
  fromDate?: string;
  toDate?: string;
  fromDocNo?: string;
  toDocNo?: string;
  sourceType?: string;
}

export class SanamaMapper {
  /**
   * Filter journal documents by year, month, date range, doc numbers
   */
  public static filterDocuments(docs: any[], options: SanamaFilterOptions): any[] {
    let filtered = [...docs];

    // Filter confirmed or valid status if status field exists
    filtered = filtered.filter((doc) => !doc.status || doc.status === "CONFIRMED" || doc.status === "APPROVED");
    if (filtered.length === 0 && docs.length > 0) {
      // Fallback to all docs if none marked confirmed
      filtered = [...docs];
    }

    const { fiscalYear, fromDate, toDate, fromDocNo, toDocNo, exportType, month } = options;

    if (fiscalYear) {
      const engYear = toEnglishDigits(fiscalYear);
      filtered = filtered.filter((doc) => {
        if (doc.fiscal_year && toEnglishDigits(doc.fiscal_year) === engYear) return true;
        const dDate = toEnglishDigits(doc.doc_date || doc.date || "");
        if (dDate.startsWith(engYear)) return true;
        return !doc.fiscal_year && !dDate;
      });
    }

    if (fromDate || toDate) {
      const engFromDate = toEnglishDigits(fromDate);
      const engToDate = toEnglishDigits(toDate);
      filtered = filtered.filter((doc) => {
        const dDate = toEnglishDigits(doc.doc_date || doc.date || "");
        if (engFromDate && dDate < engFromDate) return false;
        if (engToDate && dDate > engToDate) return false;
        return true;
      });
    }

    if (fromDocNo || toDocNo) {
      filtered = filtered.filter((doc) => {
        const dNo = Number(toEnglishDigits(doc.doc_number || doc.doc_no || 0));
        if (fromDocNo && dNo < Number(toEnglishDigits(fromDocNo))) return false;
        if (toDocNo && dNo > Number(toEnglishDigits(toDocNo))) return false;
        return true;
      });
    }

    // Monthly filter
    if (exportType !== "final" && month && !fromDate && !toDate) {
      const engMonth = toEnglishDigits(month);
      const paddedMonth = engMonth.padStart(2, "0");
      filtered = filtered.filter((doc) => {
        if (doc.month && (toEnglishDigits(doc.month) === engMonth || toEnglishDigits(doc.month).padStart(2, "0") === paddedMonth)) {
          return true;
        }
        const dDate = toEnglishDigits(doc.doc_date || doc.date || "");
        const parts = dDate.split(/[\/-]/);
        if (parts.length >= 2) {
          const mPart = parts[1].padStart(2, "0");
          return mPart === paddedMonth;
        }
        return true;
      });
    }

    return filtered;
  }

  /**
   * Aggregate journal voucher lines into SANAMA Report List
   */
  public static mapDocumentsToReportItems(docs: any[], options: SanamaFilterOptions): SanamaReportItem[] {
    const reportGroups: Record<string, SanamaReportItem> = {};
    const { fromAccountCode, toAccountCode, sourceType, fiscalYear } = options;

    const filteredDocs = this.filterDocuments(docs, options);

    for (const doc of filteredDocs) {
      const lines = doc.lines || doc.entries || [];
      for (const line of lines) {
        const accCode = String(line.account_code || line.moeinCode || "").trim();
        if (!accCode) continue;

        // Filter account code range
        if (fromAccountCode && accCode < fromAccountCode) continue;
        if (toAccountCode && accCode > toAccountCode) continue;

        // Filter source type
        if (sourceType && sourceType !== "0" && sourceType !== "all") {
          const lineSource = String(line.sanamaFields?.SourceType || line.SourceType || "0");
          if (lineSource !== sourceType && lineSource !== "0") continue;
        }

        const reqRows = sanamaRequirements[accCode]?.requiredRows;
        const resolvedFields: Record<string, string> = {};

        // Resolve each attribute per SANAMA Edition 19 Rule 1
        for (const attr of SANAMA_CONSTANTS.ATTRIBUTES) {
          const rowNum = SANAMA_CONSTANTS.ATTR_TO_ROW_MAP[attr];
          const isApplicable = reqRows ? (rowNum ? reqRows.includes(rowNum) : true) : true;

          if (isApplicable) {
            let val = "";
            if (line.sanamaFields && line.sanamaFields[attr] !== undefined && line.sanamaFields[attr] !== null && String(line.sanamaFields[attr]).trim() !== "") {
              val = String(line.sanamaFields[attr]).trim();
            } else if (line[attr] !== undefined && line[attr] !== null && String(line[attr]).trim() !== "") {
              val = String(line[attr]).trim();
            } else {
              val = attr === "Year" ? (fiscalYear || "1403") : (SANAMA_CONSTANTS.DEFAULT_VALUES[attr] ?? "0");
            }
            resolvedFields[attr] = val;
          } else {
            // Rule 1: Attribute is not applicable for this sub-account -> MUST be empty string ""
            resolvedFields[attr] = "";
          }
        }

        // Composite key for aggregation
        const compositeKey = `${accCode}_${SANAMA_CONSTANTS.ATTRIBUTES.map((a) => resolvedFields[a]).join("_")}`;

        if (!reportGroups[compositeKey]) {
          reportGroups[compositeKey] = {
            AccCode: accCode,
            SummaryProgressDeptor: 0,
            SummaryProgressCreditor: 0,
            ...resolvedFields
          };
        }

        const debit = Number(line.debit || line.debtor || 0);
        const credit = Number(line.credit || line.creditor || 0);

        reportGroups[compositeKey].SummaryProgressDeptor += isNaN(debit) ? 0 : debit;
        reportGroups[compositeKey].SummaryProgressCreditor += isNaN(credit) ? 0 : credit;
      }
    }

    return Object.values(reportGroups);
  }

  /**
   * Map real bank accounts and reconciliations to ContrastAccount_List
   */
  public static mapBankAccountsToContrastList(
    bankAccounts: any[],
    reconciliations: any[] = []
  ): SanamaContrastAccount[] {
    if (!bankAccounts || bankAccounts.length === 0) {
      // Return 6 standard default bank contrast accounts if no real bank account is configured yet
      return [
        { accountNumber: "IR820100004167011444752404", accountDscp: "بانک پرداخت سرمایه‌ای", accountType: "2", mojoodiTebgheDaftar: 0, mojoodiTebgheBank: 0, diffTypes: this.createEmptyDiffTypes() },
        { accountNumber: "IR680100004067011407760692", accountDscp: "بانک دریافت وجوه سپرده", accountType: "5", mojoodiTebgheDaftar: 0, mojoodiTebgheBank: 0, diffTypes: this.createEmptyDiffTypes() },
        { accountNumber: "IR750100004167011452752411", accountDscp: "بانک رد وجوه سپرده", accountType: "6", mojoodiTebgheDaftar: 0, mojoodiTebgheBank: 0, diffTypes: this.createEmptyDiffTypes() },
        { accountNumber: "IR530170000002171140625004", accountDscp: "بانک پرداخت سرمایه‌ای", accountType: "2", mojoodiTebgheDaftar: 0, mojoodiTebgheBank: 0, diffTypes: this.createEmptyDiffTypes() },
        { accountNumber: "IR530017000000217114072100", accountDscp: "بانک دریافت وجوه سپرده", accountType: "5", mojoodiTebgheDaftar: 0, mojoodiTebgheBank: 0, diffTypes: this.createEmptyDiffTypes() },
        { accountNumber: "IR930710000000217114076900", accountDscp: "بانک رد وجوه سپرده", accountType: "6", mojoodiTebgheDaftar: 0, mojoodiTebgheBank: 0, diffTypes: this.createEmptyDiffTypes() }
      ];
    }

    return bankAccounts.map((acc) => {
      const iban = String(acc.sheba || acc.accountNumber || "IR0").trim();
      const dscp = String(acc.description || acc.accountHolder || acc.bankName || "حساب بانکی").trim();
      const type = String(acc.accountType || acc.type || "2").trim();
      const ledgerVal = Number(acc.ledgerBalance || acc.balance || 0);
      const bankVal = Number(acc.bankBalance || acc.balance || 0);

      // Match reconciliation record if exists
      const rec = reconciliations.find((r) => r.accountNumber === acc.accountNumber || r.sheba === acc.sheba);

      return {
        accountNumber: iban.startsWith("IR") ? iban : `IR${iban}`,
        accountDscp: dscp,
        accountType: type,
        mojoodiTebgheDaftar: ledgerVal,
        mojoodiTebgheBank: bankVal,
        accountNumberImage: "",
        diffTypes: rec?.diffTypes || this.createEmptyDiffTypes()
      };
    });
  }

  /**
   * Helper to initialize empty standard difftype1..difftype12 array
   */
  public static createEmptyDiffTypes(): SanamaDiffType[] {
    const list: SanamaDiffType[] = [];
    for (let i = 1; i <= 12; i++) {
      const detail: any = { Date: "", Description: "", Expense: 0 };
      if (i === 4 || i === 5) detail.DocNo = "";
      if (i === 8) {
        detail.Documents = "";
        delete detail.Description;
      }
      if (i === 10) {
        detail.CheckNo = "0";
        detail.Zinaf = "";
        detail.DocNo = "";
        detail.DocDate = "";
      }

      list.push({
        typeIndex: i,
        value: 0,
        details: [detail]
      });
    }
    return list;
  }
}
