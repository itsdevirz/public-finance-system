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

  describe("4. SanamaMapper Data Aggregation & Filtering", () => {
    it("should filter documents by fiscal year and month", () => {
      const docs = [
        { doc_number: "1", doc_date: "1403/01/15", fiscal_year: "1403", month: "1", status: "CONFIRMED" },
        { doc_number: "2", doc_date: "1403/05/20", fiscal_year: "1403", month: "5", status: "CONFIRMED" },
        { doc_number: "3", doc_date: "1402/12/29", fiscal_year: "1402", month: "12", status: "CONFIRMED" }
      ];

      const filtered = SanamaMapper.filterDocuments(docs, { fiscalYear: "1403", month: "1" });
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].doc_number, "1");
    });

    it("should aggregate progress debtor and creditor amounts correctly", () => {
      const docs = [
        {
          status: "CONFIRMED",
          lines: [
            { account_code: "41001", debit: 100, credit: 0 },
            { account_code: "41001", debit: 200, credit: 0 },
            { account_code: "41001", debit: 0, credit: 50 }
          ]
        }
      ];

      const items = SanamaMapper.mapDocumentsToReportItems(docs, {});
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].AccCode, "41001");
      assert.strictEqual(items[0].SummaryProgressDeptor, 300);
      assert.strictEqual(items[0].SummaryProgressCreditor, 50);
    });
  });
});
