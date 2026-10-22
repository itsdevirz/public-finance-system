import { describe, it } from "node:test";
import assert from "node:assert";
import { SANAMA_CONSTANTS } from "../lib/sanama/sanama.constants";
import { SanamaValidator } from "../lib/sanama/sanama.validator";
import { SanamaSerializer } from "../lib/sanama/sanama.serializer";
import { SanamaMapper } from "../lib/sanama/sanama.mapper";
import { SanamaHeader, SanamaReportItem, SanamaContrastAccount } from "../lib/sanama/sanama.types";

describe("🏛️ SANAMA Protocol Edition 19 Test Suite", () => {
  describe("1. Protocol Metadata & Constants Compliance", () => {
    it("should specify Protocol Name SANAMA and Protocol Version 3.2 Edition 19", () => {
      assert.strictEqual(SANAMA_CONSTANTS.PROTOCOL_NAME, "SANAMA");
      assert.strictEqual(SANAMA_CONSTANTS.PROTOCOL_VER, "3.2");
      assert.strictEqual(SANAMA_CONSTANTS.EDITION, "19");
    });

    it("should contain correct 12 months and month 15 mapping", () => {
      assert.strictEqual(SANAMA_CONSTANTS.MONTH_MAP["1"], "فروردین");
      assert.strictEqual(SANAMA_CONSTANTS.MONTH_MAP["12"], "اسفند");
      assert.strictEqual(SANAMA_CONSTANTS.MONTH_MAP["15"], "تراز نهایی سال مالی");
    });

    it("should list canonical order of Edition 19 Section 4 attributes", () => {
      assert.ok(SANAMA_CONSTANTS.ATTRIBUTES.includes("SourceType"));
      assert.ok(SANAMA_CONSTANTS.ATTRIBUTES.includes("NomineeCode"));
      assert.ok(SANAMA_CONSTANTS.ATTRIBUTES.includes("SubBudgetCode"));
    });
  });

  describe("2. SanamaValidator Rules", () => {
    it("should validate Executive Org 11-digit National ID (MainOrgID)", () => {
      assert.strictEqual(SanamaValidator.validateNationalId("10100000000"), true);
      assert.strictEqual(SanamaValidator.validateNationalId("12345678901"), true);
      assert.strictEqual(SanamaValidator.validateNationalId("123456"), false);
      assert.strictEqual(SanamaValidator.validateNationalId("ABC12345678"), false);
    });

    it("should validate NomineeCode 16-character structure", () => {
      assert.strictEqual(SanamaValidator.validateNomineeCode("0").isValid, true);
      assert.strictEqual(SanamaValidator.validateNomineeCode("A311112345678901").isValid, true);
      assert.strictEqual(SanamaValidator.validateNomineeCode("SHORT").isValid, false);
    });

    it("should detect invalid Header attributes and missing Org ID", () => {
      const invalidHeader: SanamaHeader = {
        protocolName: "SANAMA",
        protocolVer: "3.2",
        protocolType: "MonthlyProtocol",
        mainOrgID: "INVALID",
        mainOrgCode: "",
        year: "14",
        month: "99"
      };

      const result = SanamaValidator.validateAll(invalidHeader, [], []);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_ORG_ID"));
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_ORG_CODE"));
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_YEAR"));
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_MONTH"));
    });
  });

  describe("3. SanamaSerializer XML Formatting & Escaping", () => {
    it("should generate well-formed XML with UTF-8 declaration and escaped entities", () => {
      const header: SanamaHeader = {
        protocolName: "SANAMA",
        protocolVer: "3.2",
        protocolType: "MonthlyProtocol",
        mainOrgID: "10100000000",
        mainOrgCode: "400367",
        year: "1403",
        month: "03"
      };

      const reportItems: SanamaReportItem[] = [
        {
          AccCode: "41001",
          SummaryProgressDeptor: 1500000,
          SummaryProgressCreditor: 0,
          Nominee: "تست & شرکت <آزمایشی>"
        }
      ];

      const contrastAccounts: SanamaContrastAccount[] = [
        {
          accountNumber: "IR010000000040010000416701",
          accountDscp: "بانک پرداختی",
          accountType: "2",
          mojoodiTebgheDaftar: 500000,
          mojoodiTebgheBank: 500000,
          diffTypes: SanamaMapper.createEmptyDiffTypes()
        }
      ];

      const xml = SanamaSerializer.serializeToXml(header, reportItems, contrastAccounts);

      assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      assert.ok(xml.includes('SanamaInfo ProtocolName="SANAMA" ProtocolVer="3.2"'));
      assert.ok(xml.includes('MainOrgID="10100000000"'));
      assert.ok(xml.includes('MainOrgCode="400367"'));
      assert.ok(xml.includes('AccCode="41001"'));
      assert.ok(xml.includes('تست &amp; شرکت &lt;آزمایشی&gt;'));
      assert.ok(xml.includes('ContrastAccount_List AccountNumber="IR010000000040010000416701"'));
    });
  });

  describe("5. Mandatory 18 Production Scenarios (Section 8 Compliance)", () => {
    const defaultHeader: SanamaHeader = {
      protocolName: "SANAMA",
      protocolVer: "3.2",
      protocolType: "MonthlyProtocol",
      mainOrgID: "10100000000",
      mainOrgCode: "400367",
      year: "1403",
      month: "06"
    };

    // Scenario 1: Period with multiple accounts and confirmed documents
    it("Scenario 1: should generate correct report items for a period with multiple accounts and confirmed documents", () => {
      const docs = [
        {
          doc_number: "1",
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/02/10",
          lines: [
            { account_code: "11001", debit: 5000000, credit: 0 },
            { account_code: "41001", debit: 0, credit: 5000000 }
          ]
        },
        {
          doc_number: "2",
          status: "CONFIRMED",
          fiscal_year: 1403,
          document_date: "1403/05/18",
          lines: [
            { account_code: "11001", debit: 3000000, credit: 0 },
            { account_code: "61001", debit: 3000000, credit: 0 }
          ]
        }
      ];

      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "6" });
      assert.strictEqual(items.length, 3);
      const item11001 = items.find((i) => i.AccCode === "11001");
      assert.ok(item11001);
      assert.strictEqual(item11001?.SummaryProgressDeptor, 8000000);
      assert.strictEqual(item11001?.SummaryProgressCreditor, 0);
    });

    // Scenario 2: Accounts with only debit progress
    it("Scenario 2: should handle accounts with only debit progress correctly", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/03/01",
          lines: [{ account_code: "11001", debit: 12500000, credit: 0 }]
        }
      ];
      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "3" });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].SummaryProgressDeptor, 12500000);
      assert.strictEqual(items[0].SummaryProgressCreditor, 0);
    });

    // Scenario 3: Accounts with only credit progress
    it("Scenario 3: should handle accounts with only credit progress correctly", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/03/01",
          lines: [{ account_code: "41001", debit: 0, credit: 9800000 }]
        }
      ];
      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "3" });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].SummaryProgressDeptor, 0);
      assert.strictEqual(items[0].SummaryProgressCreditor, 9800000);
    });

    // Scenario 4: Accounts with both debit and credit progress
    it("Scenario 4: should handle accounts with both debit and credit progress correctly", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/04/10",
          lines: [
            { account_code: "11001", debit: 50000000, credit: 15000000 }
          ]
        }
      ];
      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "4" });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].SummaryProgressDeptor, 50000000);
      assert.strictEqual(items[0].SummaryProgressCreditor, 15000000);
    });

    // Scenario 5: Accounts with multiple details or persons
    it("Scenario 5: should emit separate rows for different persons/nominees without merging", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/04/15",
          lines: [
            {
              account_code: "11522",
              debit: 20000000,
              credit: 0,
              sanamaFields: { sanama_20: "1403", sanama_21: "A323114007592633", sanama_43: "400367" }
            },
            {
              account_code: "11522",
              debit: 35000000,
              credit: 0,
              sanamaFields: { sanama_20: "1403", sanama_21: "A323710300062917", sanama_43: "400367" }
            }
          ]
        }
      ];

      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "4" });
      assert.strictEqual(items.length, 2);
      const nomCodes = items.map((i) => i.NomineeCode);
      assert.ok(nomCodes.includes("A323114007592633"));
      assert.ok(nomCodes.includes("A323710300062917"));
    });

    // Scenario 6: Accounts related to different funding sources and credits
    it("Scenario 6: should emit separate rows for different funding sources (SourceType 1 vs 2)", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/05/01",
          lines: [
            {
              account_code: "15001",
              debit: 1000000,
              credit: 0,
              sanamaFields: { sanama_1: "1", sanama_5: "1", sanama_6: "2", sanama_8: "1502001010" }
            },
            {
              account_code: "15001",
              debit: 2000000,
              credit: 0,
              sanamaFields: { sanama_1: "2", sanama_5: "1", sanama_6: "2", sanama_8: "1502001010" }
            }
          ]
        }
      ];

      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "5" });
      assert.strictEqual(items.length, 2);
      assert.ok(items.some((i) => i.SourceType === "1"));
      assert.ok(items.some((i) => i.SourceType === "2"));
    });

    // Scenario 7: Accounts with prior-year (سنواتی) data
    it("Scenario 7: should maintain distinct prior year information (sanama_20) in separate rows", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/06/20",
          lines: [
            {
              account_code: "11522",
              debit: 7000000,
              credit: 0,
              sanamaFields: { sanama_20: "1398", sanama_21: "A323114007592633" }
            },
            {
              account_code: "11522",
              debit: 9000000,
              credit: 0,
              sanamaFields: { sanama_20: "1401", sanama_21: "A323114007592633" }
            }
          ]
        }
      ];

      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "6" });
      assert.strictEqual(items.length, 2);
      assert.ok(items.some((i) => i.Year === "1398"));
      assert.ok(items.some((i) => i.Year === "1401"));
    });

    // Scenario 8: Person info with Persian title and valid NomineeCode
    it("Scenario 8: should resolve person Persian title from auxiliary personsMap", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/07/01",
          lines: [
            {
              account_code: "11522",
              debit: 14000000,
              credit: 0,
              sanamaFields: { sanama_20: "1403", sanama_21: "A323710300062917" }
            }
          ]
        }
      ];

      const personsMap = new Map<string, any>();
      personsMap.set("A323710300062917", { nomineeCode: "A323710300062917", title: "شرکت آبنوس سازان ایلام" });

      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "7" }, { personsMap });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].NomineeCode, "A323710300062917");
      assert.strictEqual(items[0].Nominee, "شرکت آبنوس سازان ایلام");
    });

    // Scenario 9: Invalid or unmapped Moein codes
    it("Scenario 9: should report error for unmapped or invalid Moein codes", () => {
      const items: SanamaReportItem[] = [
        {
          AccCode: "99999", // Invalid Moein code not in sanamaCodes.json
          SummaryProgressDeptor: 1000,
          SummaryProgressCreditor: 0
        }
      ];

      const result = SanamaValidator.validateAll(defaultHeader, items, []);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_INVALID_MOEIN" && e.accCode === "99999"));
    });

    // Scenario 10: Missing mandatory header information
    it("Scenario 10: should reject generation when essential header info is missing or invalid", () => {
      const invalidHeader: SanamaHeader = {
        protocolName: "SANAMA",
        protocolVer: "3.2",
        protocolType: "MonthlyProtocol",
        mainOrgID: "123", // Invalid length
        mainOrgCode: "",  // Missing code
        year: "14",       // Invalid year
        month: "20"       // Invalid month
      };

      const result = SanamaValidator.validateAll(invalidHeader, [], []);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_ORG_ID"));
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_ORG_CODE"));
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_YEAR"));
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_MONTH"));
    });

    // Scenario 11: Period with no reportable data
    it("Scenario 11: should produce empty report items without error when period has no documents", () => {
      const items = SanamaMapper.mapDocumentsToReportItems([], { fiscalYear: "1403", month: "1" });
      assert.strictEqual(items.length, 0);

      const result = SanamaValidator.validateAll(defaultHeader, items, []);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(result.stats.totalReportRows, 0);
      assert.strictEqual(result.stats.totalDebitProgress, 0);
    });

    // Scenario 12: Bank reconciliation with detailed diff types
    it("Scenario 12: should map bank accounts and format difftype details properly in XML", () => {
      const bankAccounts = [
        {
          accountNumber: "4001000041670114",
          sheba: "IR010000000040010000416701",
          description: "بانک پرداخت هزینه",
          accountType: "2",
          moeinAccount: "11001",
          balance: 10000000
        }
      ];

      const reconciliations = [
        {
          accountNumber: "4001000041670114",
          sheba: "IR010000000040010000416701",
          diffTypes: [
            {
              typeIndex: 10,
              value: 500000,
              details: [
                { CheckNo: "12345", Zinaf: "پیمانکار الف", Expense: 500000, Date: "1403/05/10", DocNo: "55", DocDate: "1403/05/10" }
              ]
            }
          ]
        }
      ];

      const contrast = SanamaMapper.mapBankAccountsToContrastList(bankAccounts, reconciliations);
      assert.strictEqual(contrast.length, 1);
      assert.strictEqual(contrast[0].accountNumber, "IR010000000040010000416701");

      const xml = SanamaSerializer.serializeToXml(defaultHeader, [], contrast);
      assert.ok(xml.includes('ContrastAccount_List AccountNumber="IR010000000040010000416701"'));
      assert.ok(xml.includes('<difftype10 Value="500000">'));
      assert.ok(xml.includes('CheckNo="12345"'));
      assert.ok(xml.includes('Zinaf="پیمانکار الف"'));
    });

    // Scenario 13: Persian text containing special XML characters
    it("Scenario 13: should safely escape Persian text containing special XML characters", () => {
      const reportItems: SanamaReportItem[] = [
        {
          AccCode: "41001",
          SummaryProgressDeptor: 100,
          SummaryProgressCreditor: 0,
          Nominee: "شرکت کاوش & پیشگامان <صنعت> \"ایران\" 'سهامی خاص'"
        }
      ];

      const xml = SanamaSerializer.serializeToXml(defaultHeader, reportItems, []);
      assert.ok(xml.includes("شرکت کاوش &amp; پیشگامان &lt;صنعت&gt; &quot;ایران&quot; &apos;سهامی خاص&apos;"));
    });

    // Scenario 14: Very large financial amounts without floating-point precision loss
    it("Scenario 14: should format very large financial amounts cleanly without scientific notation", () => {
      const largeDebit = 293182759054321; // 293 trillion rials
      const largeCredit = 182115687236543;
      const formattedDebit = SanamaSerializer.formatAmount(largeDebit);
      const formattedCredit = SanamaSerializer.formatAmount(largeCredit);

      assert.strictEqual(formattedDebit, "293182759054321");
      assert.strictEqual(formattedCredit, "182115687236543");
      assert.ok(!formattedDebit.includes("e+"));
    });

    // Scenario 15: Incomplete data, invalid dates, negative amounts
    it("Scenario 15: should flag negative debit or credit amounts as accounting validation errors", () => {
      const items: SanamaReportItem[] = [
        {
          AccCode: "11001",
          SummaryProgressDeptor: -500,
          SummaryProgressCreditor: 0
        }
      ];

      const result = SanamaValidator.validateAll(defaultHeader, items, []);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some((e) => e.code === "SANAMA_ERR_NEG_DEBIT"));
    });

    // Scenario 16: Idempotent & deterministic execution for identical inputs
    it("Scenario 16: should produce deterministic and identical XML across repeated runs for identical input", () => {
      const docs = [
        {
          status: "صدور سند قطعی",
          fiscal_year: 1403,
          document_date: "1403/02/05",
          lines: [
            { account_code: "11001", debit: 1000, credit: 0 },
            { account_code: "41001", debit: 0, credit: 1000 }
          ]
        }
      ];

      const run1 = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "2" });
      const xml1 = SanamaSerializer.serializeToXml(defaultHeader, run1, []);

      const run2 = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "2" });
      const xml2 = SanamaSerializer.serializeToXml(defaultHeader, run2, []);

      assert.strictEqual(xml1, xml2);
    });

    // Scenario 17: Structural match with target Protocol v3.2 Edition 19
    it("Scenario 17: should include all target Section 4 attributes in canonical order", () => {
      const reportItems: SanamaReportItem[] = [
        {
          AccCode: "11002",
          SummaryProgressDeptor: 100000,
          SummaryProgressCreditor: 0,
          AccountNumber: "IR820100004167011444752404",
          SubBudgetCode: "400367"
        }
      ];

      const xml = SanamaSerializer.serializeToXml(defaultHeader, reportItems, []);
      assert.ok(xml.includes('ProtocolVer="3.2"'));
      assert.ok(xml.includes('AccCode="11002"'));
      assert.ok(xml.includes('SourceType="0"'));
      assert.ok(xml.includes('SubBudgetCode="400367"'));
      assert.ok(xml.includes('ExpensePart="0"'));
      assert.ok(xml.includes('Output="0"'));
    });

    // Scenario 18: Ensuring data from other years or future periods is strictly excluded
    it("Scenario 18: should strictly exclude documents from other fiscal years and future months", () => {
      const docs = [
        { doc_number: "1", status: "صدور سند قطعی", fiscal_year: 1403, document_date: "1403/03/10", lines: [{ account_code: "11001", debit: 100, credit: 0 }] },
        { doc_number: "2", status: "صدور سند قطعی", fiscal_year: 1403, document_date: "1403/08/10", lines: [{ account_code: "11001", debit: 200, credit: 0 }] }, // Future month 8
        { doc_number: "3", status: "صدور سند قطعی", fiscal_year: 1402, document_date: "1402/03/10", lines: [{ account_code: "11001", debit: 300, credit: 0 }] }, // Previous year 1402
        { doc_number: "4", status: "صدور سند قطعی", fiscal_year: 1404, document_date: "1404/01/10", lines: [{ account_code: "11001", debit: 400, credit: 0 }] }  // Next year 1404
      ];

      // Export for Year 1403, Month 5 (should only include doc #1)
      const items = SanamaMapper.mapDocumentsToReportItems(docs, { fiscalYear: "1403", month: "5" });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].SummaryProgressDeptor, 100);
    });
  });
});

