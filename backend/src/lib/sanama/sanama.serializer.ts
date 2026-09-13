import { SanamaHeader, SanamaReportItem, SanamaContrastAccount } from "./sanama.types";
import { SANAMA_CONSTANTS } from "./sanama.constants";

export class SanamaSerializer {
  /**
   * Escape special characters for safe XML output
   */
  public static escapeXml(str: any): string {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Serialize header, report list, and contrast accounts to official UTF-8 SANAMA XML
   */
  public static serializeToXml(
    header: SanamaHeader,
    reportItems: SanamaReportItem[],
    contrastAccounts: SanamaContrastAccount[]
  ): string {
    const pName = this.escapeXml(header.protocolName || SANAMA_CONSTANTS.PROTOCOL_NAME);
    const pVer = this.escapeXml(header.protocolVer || SANAMA_CONSTANTS.PROTOCOL_VER);
    const pType = this.escapeXml(header.protocolType || "MonthlyProtocol");
    const orgId = this.escapeXml(header.mainOrgID || "");
    const orgCode = this.escapeXml(header.mainOrgCode || "");
    const year = this.escapeXml(header.year || "1403");
    const month = this.escapeXml(header.month || "12");
    const creator = this.escapeXml(
      header.creatorInfo || `نگاران سیستم، تاریخ ایجاد فایل:${this.getPersianDateToday()}، کاربر ایجاد کننده فایل:Admin`
    );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<SanamaInfo ProtocolName="${pName}" ProtocolVer="${pVer}" ProtocolType="${pType}" MainOrgID="${orgId}" MainOrgCode="${orgCode}" Year="${year}" Month="${month}" Co="${creator}">\n`;

    // 1. Render Report_List items (Each item on a separate line)
    for (const item of reportItems) {
      xml += `  <Report_List`;
      xml += ` AccCode="${this.escapeXml(item.AccCode)}"`;
      xml += ` SummaryProgressDeptor="${item.SummaryProgressDeptor ?? 0}"`;
      xml += ` SummaryProgressCreditor="${item.SummaryProgressCreditor ?? 0}"`;

      for (const attr of SANAMA_CONSTANTS.ATTRIBUTES) {
        const val = item[attr] !== undefined ? item[attr] : "";
        xml += ` ${attr}="${this.escapeXml(val)}"`;
      }
      xml += ` />\n`;
    }

    // 2. Render ContrastAccount_List items (Bank Reconciliation)
    for (const acc of contrastAccounts) {
      const accNum = this.escapeXml(acc.accountNumber);
      const accDscp = this.escapeXml(acc.accountDscp);
      const accType = this.escapeXml(acc.accountType);
      const ledger = acc.mojoodiTebgheDaftar ?? 0;
      const bank = acc.mojoodiTebgheBank ?? 0;

      xml += `  <ContrastAccount_List AccountNumber="${accNum}" AccountDscp="${accDscp}" AccountType="${accType}" MojoodiTebgheDaftar="${ledger}" MojoodiTebgheBank="${bank}">`;
      xml += `<AccountNumberImage />`;

      const diffs = acc.diffTypes || [];
      for (let i = 1; i <= 12; i++) {
        const diff = diffs.find((d) => d.typeIndex === i);
        const val = diff ? diff.value : 0;
        const details = diff && diff.details ? diff.details : [];

        xml += `<difftype${i} Value="${val}">`;
        for (const det of details) {
          xml += `<Detail_List`;
          if (det.Date !== undefined) xml += ` Date="${this.escapeXml(det.Date)}"`;
          if (det.Description !== undefined) xml += ` Description="${this.escapeXml(det.Description)}"`;
          if (det.Expense !== undefined) xml += ` Expense="${det.Expense}"`;
          if (det.DocNo !== undefined) xml += ` DocNo="${this.escapeXml(det.DocNo)}"`;
          if (det.DocDate !== undefined) xml += ` DocDate="${this.escapeXml(det.DocDate)}"`;
          if (det.CheckNo !== undefined) xml += ` CheckNo="${this.escapeXml(det.CheckNo)}"`;
          if (det.Zinaf !== undefined) xml += ` Zinaf="${this.escapeXml(det.Zinaf)}"`;
          if (det.Documents !== undefined) xml += ` Documents="${this.escapeXml(det.Documents)}"`;
          xml += ` />`;
        }
        xml += `</difftype${i}>`;
      }

      xml += `</ContrastAccount_List>\n`;
    }

    xml += `</SanamaInfo>\n`;
    return xml;
  }

  /**
   * Helper to get current Persian date string
   */
  private static getPersianDateToday(): string {
    try {
      return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
    } catch (_) {
      return "1403/12/29";
    }
  }
}
