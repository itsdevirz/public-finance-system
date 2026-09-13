import { getDb } from "../../db/index";
import { SanamaHeader, SanamaPreviewSummary, SanamaValidationResult } from "./sanama.types";
import { SANAMA_CONSTANTS } from "./sanama.constants";
import { SanamaMapper, SanamaFilterOptions } from "./sanama.mapper";
import { SanamaValidator } from "./sanama.validator";
import { SanamaSerializer } from "./sanama.serializer";

export class SanamaService {
  /**
   * Get Executive Org settings (MainOrgID and MainOrgCode) from system_settings
   */
  public static async getOrgSettings(): Promise<{ mainOrgID: string; mainOrgCode: string }> {
    const db = getDb();
    const config = await db.collection("system_settings").findOne({ key: "org_settings" });
    return {
      mainOrgID: config?.mainOrgID || "10100000000",
      mainOrgCode: config?.mainOrgCode || "400367"
    };
  }

  /**
   * Save Executive Org settings
   */
  public static async saveOrgSettings(mainOrgID: string, mainOrgCode: string): Promise<boolean> {
    const db = getDb();
    await db.collection("system_settings").updateOne(
      { key: "org_settings" },
      {
        $set: {
          key: "org_settings",
          mainOrgID: String(mainOrgID || "").trim(),
          mainOrgCode: String(mainOrgCode || "").trim(),
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    return true;
  }

  /**
   * Run validation on SANAMA data for specified filters
   */
  public static async validateData(options: SanamaFilterOptions): Promise<SanamaValidationResult> {
    const db = getDb();
    const orgSettings = await this.getOrgSettings();

    const header: SanamaHeader = {
      protocolName: SANAMA_CONSTANTS.PROTOCOL_NAME,
      protocolVer: SANAMA_CONSTANTS.PROTOCOL_VER,
      protocolType: options.exportType === "final" ? "FinalProtocol" : "MonthlyProtocol",
      mainOrgID: orgSettings.mainOrgID,
      mainOrgCode: orgSettings.mainOrgCode,
      year: options.fiscalYear || "1403",
      month: options.exportType === "final" ? "15" : options.month || "12"
    };

    const docs = await db.collection("journal_documents").find().toArray();
    const reportItems = SanamaMapper.mapDocumentsToReportItems(docs, options);

    const bankAccounts = await db.collection("bank_accounts").find().toArray();
    const reconciliations = await db.collection("bank_reconciliations").find().toArray();
    const contrastAccounts = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations);

    const moeinHeads = await db.collection("account_heads").find({ type: "moein" }).toArray();
    const customMoeinSet = moeinHeads.length > 0
      ? new Set(moeinHeads.map((h) => String(h.code || h.moeinCode)))
      : undefined;

    return SanamaValidator.validateAll(header, reportItems, contrastAccounts, customMoeinSet);
  }

  /**
   * Generate Preview Summary
   */
  public static async generatePreview(options: SanamaFilterOptions): Promise<SanamaPreviewSummary> {
    const db = getDb();
    const orgSettings = await this.getOrgSettings();

    const header: SanamaHeader = {
      protocolName: SANAMA_CONSTANTS.PROTOCOL_NAME,
      protocolVer: SANAMA_CONSTANTS.PROTOCOL_VER,
      protocolType: options.exportType === "final" ? "FinalProtocol" : "MonthlyProtocol",
      mainOrgID: orgSettings.mainOrgID,
      mainOrgCode: orgSettings.mainOrgCode,
      year: options.fiscalYear || "1403",
      month: options.exportType === "final" ? "15" : options.month || "12"
    };

    const docs = await db.collection("journal_documents").find().toArray();
    const reportItems = SanamaMapper.mapDocumentsToReportItems(docs, options);

    const bankAccounts = await db.collection("bank_accounts").find().toArray();
    const reconciliations = await db.collection("bank_reconciliations").find().toArray();
    const contrastAccounts = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations);

    const validation = await this.validateData(options);

    return {
      header,
      stats: validation.stats,
      validation,
      sampleItems: reportItems.slice(0, 10)
    };
  }

  /**
   * Generate official XML string and record audit log
   */
  public static async generateXml(
    options: SanamaFilterOptions,
    userInfo: { username?: string; ip?: string } = {}
  ): Promise<{ xml: string; filename: string; validation: SanamaValidationResult }> {
    const db = getDb();
    const orgSettings = await this.getOrgSettings();

    const monthStr = options.exportType === "final" ? "15" : options.month || "12";
    const yearStr = options.fiscalYear || "1403";

    const header: SanamaHeader = {
      protocolName: SANAMA_CONSTANTS.PROTOCOL_NAME,
      protocolVer: SANAMA_CONSTANTS.PROTOCOL_VER,
      protocolType: options.exportType === "final" ? "FinalProtocol" : "MonthlyProtocol",
      mainOrgID: orgSettings.mainOrgID,
      mainOrgCode: orgSettings.mainOrgCode,
      year: yearStr,
      month: monthStr,
      creatorInfo: `نگاران سیستم، تاریخ ایجاد فایل:${new Date().toISOString()}، کاربر:${userInfo.username || "System"}`
    };

    const docs = await db.collection("journal_documents").find().toArray();
    const reportItems = SanamaMapper.mapDocumentsToReportItems(docs, options);

    const bankAccounts = await db.collection("bank_accounts").find().toArray();
    const reconciliations = await db.collection("bank_reconciliations").find().toArray();
    const contrastAccounts = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations);

    const validation = await this.validateData(options);

    const xml = SanamaSerializer.serializeToXml(header, reportItems, contrastAccounts);
    const filename = `SANAMA_${header.mainOrgCode}_${yearStr}_${monthStr.padStart(2, "0")}.xml`;

    // Audit Logging (Rule 24: Record event without sensitive secrets)
    try {
      await db.collection("audit_logs").insertOne({
        eventType: "SANAMA_XML_GENERATED",
        username: userInfo.username || "system",
        ip: userInfo.ip || "127.0.0.1",
        filename,
        mainOrgID: header.mainOrgID,
        mainOrgCode: header.mainOrgCode,
        year: yearStr,
        month: monthStr,
        recordCount: reportItems.length,
        isValid: validation.isValid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        timestamp: new Date().toISOString()
      });
    } catch (_) {
      // Ignore audit log error if fallback file logger handles it
    }

    return {
      xml,
      filename,
      validation
    };
  }
}
