import { getDb } from "../../db/index";
import { SanamaHeader, SanamaPreviewSummary, SanamaValidationResult, SanamaReportItem, SanamaContrastAccount } from "./sanama.types";
import { SANAMA_CONSTANTS } from "./sanama.constants";
import { SanamaMapper, SanamaFilterOptions, SanamaAuxiliaryData } from "./sanama.mapper";
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
   * Helper to load all necessary auxiliary datasets from MongoDB
   */
  private static async loadAuxiliaryData(db: any): Promise<{
    auxiliary: SanamaAuxiliaryData;
    bankAccounts: any[];
    reconciliations: any[];
    customMoeinSet?: Set<string>;
  }> {
    // 1. Persons lookup map for Nominee title resolution
    const persons = await db.collection("persons").find().toArray();
    const personsMap = new Map<string, { nomineeCode: string; title: string; nationalId?: string }>();
    for (const p of persons) {
      if (p.nomineeCode) personsMap.set(String(p.nomineeCode).trim(), p);
      if (p.nationalId) personsMap.set(String(p.nationalId).trim(), p);
    }

    // 2. Bank accounts lookup map for automatic AccountNumber (sheba) resolution
    const bankAccounts = await db.collection("bank_accounts").find().toArray();
    const bankAccountsMap = new Map<string, any>();
    for (const b of bankAccounts) {
      if (b.moeinAccount) bankAccountsMap.set(String(b.moeinAccount).trim(), b);
      if (b.accountNumber) bankAccountsMap.set(String(b.accountNumber).trim(), b);
    }

    // 3. Bank reconciliations
    const reconciliations = await db.collection("bank_reconciliations").find().toArray();

    // 4. Custom Moein account heads
    const moeinHeads = await db.collection("account_heads").find({ type: "moein" }).toArray();
    const customMoeinSet = moeinHeads.length > 0
      ? new Set<string>(moeinHeads.map((h: any) => String(h.code || h.moeinCode)))
      : undefined;

    return {
      auxiliary: {
        personsMap,
        bankAccountsMap
      },
      bankAccounts,
      reconciliations,
      customMoeinSet
    };
  }

  /**
   * Run validation on SANAMA data for specified filters
   */
  public static async validateData(options: SanamaFilterOptions): Promise<SanamaValidationResult> {
    const db = getDb();
    const orgSettings = await this.getOrgSettings();
    const { auxiliary, bankAccounts, reconciliations, customMoeinSet } = await this.loadAuxiliaryData(db);

    const fullOptions: SanamaFilterOptions = {
      ...options,
      mainOrgCode: orgSettings.mainOrgCode,
      mainOrgID: orgSettings.mainOrgID
    };

    const header: SanamaHeader = {
      protocolName: SANAMA_CONSTANTS.PROTOCOL_NAME,
      protocolVer: SANAMA_CONSTANTS.PROTOCOL_VER,
      protocolType: options.exportType === "final" ? "FinalProtocol" : "MonthlyProtocol",
      mainOrgID: orgSettings.mainOrgID,
      mainOrgCode: orgSettings.mainOrgCode,
      year: options.fiscalYear || "1403",
      month: options.exportType === "final" ? "15" : options.month || "12"
    };

    const rawDocs = await db.collection("journal_documents").find().toArray();
    const reportItems = SanamaMapper.mapDocumentsToReportItems(rawDocs, fullOptions, auxiliary);
    const contrastAccounts = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations, reportItems);

    return SanamaValidator.validateAll(header, reportItems, contrastAccounts, customMoeinSet);
  }

  /**
   * Generate Preview Summary
   */
  public static async generatePreview(options: SanamaFilterOptions): Promise<SanamaPreviewSummary> {
    const db = getDb();
    const orgSettings = await this.getOrgSettings();
    const { auxiliary, bankAccounts, reconciliations, customMoeinSet } = await this.loadAuxiliaryData(db);

    const fullOptions: SanamaFilterOptions = {
      ...options,
      mainOrgCode: orgSettings.mainOrgCode,
      mainOrgID: orgSettings.mainOrgID
    };

    const header: SanamaHeader = {
      protocolName: SANAMA_CONSTANTS.PROTOCOL_NAME,
      protocolVer: SANAMA_CONSTANTS.PROTOCOL_VER,
      protocolType: options.exportType === "final" ? "FinalProtocol" : "MonthlyProtocol",
      mainOrgID: orgSettings.mainOrgID,
      mainOrgCode: orgSettings.mainOrgCode,
      year: options.fiscalYear || "1403",
      month: options.exportType === "final" ? "15" : options.month || "12"
    };

    const rawDocs = await db.collection("journal_documents").find().toArray();
    const reportItems = SanamaMapper.mapDocumentsToReportItems(rawDocs, fullOptions, auxiliary);
    const contrastAccounts = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations, reportItems);

    const validation = SanamaValidator.validateAll(header, reportItems, contrastAccounts, customMoeinSet);

    return {
      header,
      stats: validation.stats,
      validation,
      sampleItems: reportItems.slice(0, 20)
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
    const { auxiliary, bankAccounts, reconciliations, customMoeinSet } = await this.loadAuxiliaryData(db);

    const monthStr = options.exportType === "final" ? "15" : options.month || "12";
    const yearStr = options.fiscalYear || "1403";

    const fullOptions: SanamaFilterOptions = {
      ...options,
      mainOrgCode: orgSettings.mainOrgCode,
      mainOrgID: orgSettings.mainOrgID
    };

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

    const rawDocs = await db.collection("journal_documents").find().toArray();
    const reportItems = SanamaMapper.mapDocumentsToReportItems(rawDocs, fullOptions, auxiliary);
    const contrastAccounts = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations, reportItems);

    const validation = SanamaValidator.validateAll(header, reportItems, contrastAccounts, customMoeinSet);

    const xml = SanamaSerializer.serializeToXml(header, reportItems, contrastAccounts);
    const filename = `SANAMA_${header.mainOrgCode}_${yearStr}_${monthStr.padStart(2, "0")}.xml`;

    // Audit Logging
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

