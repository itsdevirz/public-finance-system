export interface SanamaHeader {
  protocolName: string;
  protocolVer: string;
  protocolType: "MonthlyProtocol" | "FinalProtocol";
  mainOrgID: string; // 11-digit National ID
  mainOrgCode: string; // Budget Row Code
  year: string; // 4-digit Persian Year
  month: string; // 1..12 or 15
  creatorInfo?: string;
}

export interface SanamaReportItem {
  AccCode: string;
  SummaryProgressDeptor: number;
  SummaryProgressCreditor: number;
  SourceType?: string;
  SourceEssence?: string;
  OtherSourceType?: string;
  CreditType?: string;
  TransferalType?: string;
  CreditInfo?: string;
  RankNumber?: string;
  CreditCode?: string;
  ExpenseArticle?: string;
  ConstructArticle?: string;
  ExpenseDetailArticle?: string;
  IncomeCode?: string;
  IncomeSubject?: string;
  IncomesSubject?: string;
  Governmental?: string;
  TaxSeason?: string;
  DebentureSenderRank?: string;
  DebentureReceiverRank?: string;
  CostCenter?: string;
  AwardArticle?: string;
  SecuritiesType?: string;
  GuaranteeEssence?: string;
  Year?: string;
  NomineeCode?: string;
  Nominee?: string;
  DemandStatus?: string;
  TempPaymentType?: string;
  LeakageSubject?: string;
  AssuranceType?: string;
  AssuranceSubject?: string;
  CurrencyType?: string;
  AccountNumber?: string;
  InsuranceType?: string;
  DebitSubject?: string;
  FixedAssetType?: string;
  InventoryType?: string;
  Quantity?: string;
  DueDate?: string;
  SecuritiesProperties?: string;
  ContractProperties?: string;
  InvestmentType?: string;
  AnnualAdjustmentsSubject?: string;
  AnnualAdjustmentSubject?: string;
  TransferItems?: string;
  ReceivablesSubject?: string;
  SubBudgetCode?: string;
  AllocationSource?: string;
  AllocationsSource?: string;
  ExpensePart?: string;
  ExpenseKind?: string;
  ExecutiveUnit?: string;
  Output?: string;
  [key: string]: string | number | undefined;
}

export interface SanamaDiffDetail {
  Date?: string;
  Description?: string;
  Expense?: number | string;
  DocNo?: string;
  DocDate?: string;
  CheckNo?: string | number;
  Zinaf?: string;
  Documents?: string;
}

export interface SanamaDiffType {
  typeIndex: number; // 1..12
  value: number | string;
  details: SanamaDiffDetail[];
}

export interface SanamaContrastAccount {
  accountNumber: string;
  accountDscp: string;
  accountType: string;
  mojoodiTebgheDaftar: number | string;
  mojoodiTebgheBank: number | string;
  accountNumberImage?: string;
  diffTypes: SanamaDiffType[];
}

export interface SanamaValidationError {
  code: string;
  category: "Structural" | "Data" | "Accounting" | "Referential";
  field?: string;
  message: string;
  accCode?: string;
}

export interface SanamaValidationWarning {
  code: string;
  category: "MappingGap" | "Recommendation" | "DataQuality";
  field?: string;
  message: string;
  accCode?: string;
}

export interface SanamaMappingGap {
  accCode: string;
  missingAttributes: string[];
  description: string;
}

export interface SanamaValidationResult {
  isValid: boolean;
  errors: SanamaValidationError[];
  warnings: SanamaValidationWarning[];
  gaps: SanamaMappingGap[];
  stats: {
    totalReportRows: number;
    totalDebitProgress: number;
    totalCreditProgress: number;
    totalContrastAccounts: number;
    validAccountsCount: number;
    invalidAccountsCount: number;
  };
}

export interface SanamaPreviewSummary {
  header: SanamaHeader;
  stats: SanamaValidationResult["stats"];
  validation: SanamaValidationResult;
  sampleItems: SanamaReportItem[];
}
