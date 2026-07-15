import { lazy } from "react";
import Placeholder from "@/pages/Placeholder";
import { getAllMenuRoutes } from "@/config/navigation";

// ─── بهینه‌سازی پرفورمنس و سرعت: بارگذاری تنبل (Code Splitting) ─────────────
const AccountHeads = lazy(() => import("@/modules/accounting/pages/AccountHeads"));
const DocumentTypes = lazy(() => import("@/modules/accounting/pages/DocumentTypes"));
const PaymentTypes = lazy(() => import("@/modules/accounting/pages/PaymentTypes"));
const AccountSetup = lazy(() => import("@/modules/accounting/pages/AccountSetup"));
const BasicInfo = lazy(() => import("@/pages/BasicInfo"));
const DocumentSetup = lazy(() => import("@/modules/accounting/pages/DocumentSetup"));
const Review = lazy(() => import("@/modules/accounting/pages/Review"));
const Credits = lazy(() => import("@/pages/Credits"));
const CheckIssuance = lazy(() => import("@/modules/treasury/pages/CheckIssuance"));
const BankForm = lazy(() => import("@/modules/treasury/pages/BankForm"));
const CreditForm = lazy(() => import("@/pages/CreditForm"));
const Bookkeeping = lazy(() => import("@/modules/accounting/pages/Bookkeeping"));
const SystemManagement = lazy(() => import("@/pages/SystemManagement"));
const Users = lazy(() => import("@/pages/Users"));
const CurrentOperations = lazy(() => import("@/modules/accounting/pages/CurrentOperations"));
const Guarantees = lazy(() => import("@/modules/treasury/pages/Guarantees"));
const Deposits = lazy(() => import("@/modules/treasury/pages/Deposits"));
const GuaranteeContractForm = lazy(() => import("@/modules/treasury/pages/GuaranteeContractForm"));
const DepositManualForm = lazy(() => import("@/modules/treasury/pages/DepositManualForm"));
const PersonsForm = lazy(() => import("@/pages/PersonsForm"));
const FiscalYearForm = lazy(() => import("@/pages/FiscalYearForm"));
const ContractPartiesForm = lazy(() => import("@/pages/ContractPartiesForm"));
const ContractTypesForm = lazy(() => import("@/pages/ContractTypesForm"));
const DeductionTypesForm = lazy(() => import("@/pages/DeductionTypesForm"));
const GuaranteeTypesForm = lazy(() => import("@/pages/GuaranteeTypesForm"));
const AssignmentMethodsForm = lazy(() => import("@/pages/AssignmentMethodsForm"));
const PurchasePowerRatesForm = lazy(() => import("@/pages/PurchasePowerRatesForm"));
const PenaltyRatesForm = lazy(() => import("@/pages/PenaltyRatesForm"));
const ContractTerminationForm = lazy(() => import("@/pages/ContractTerminationForm"));
const ContractCancellationForm = lazy(() => import("@/pages/ContractCancellationForm"));








const ContractRegistrationForm = lazy(() => import("@/pages/ContractRegistrationForm"));
const ProgressBillingForm = lazy(() => import("@/pages/ProgressBillingForm"));
const ContractPaymentForm = lazy(() => import("@/pages/ContractPaymentForm"));
const ContractGuaranteeForm = lazy(() => import("@/pages/ContractGuaranteeForm"));
const ContractSupplementForm = lazy(() => import("@/pages/ContractSupplementForm"));
const ContractAddendumForm = lazy(() => import("@/pages/ContractAddendumForm"));
const ContractCard = lazy(() => import("@/pages/ContractCard"));
const ContractChanges25Form = lazy(() => import("@/pages/ContractChanges25Form"));
const Assets = lazy(() => import("@/modules/assets/pages/Assets"));
const AssetGroupForm = lazy(() => import("@/modules/assets/pages/AssetGroupForm"));
const AssetSubGroupForm = lazy(() => import("@/modules/assets/pages/AssetSubGroupForm"));
const AssetTypeForm = lazy(() => import("@/modules/assets/pages/AssetTypeForm"));
const AssetNatureForm = lazy(() => import("@/modules/assets/pages/AssetNatureForm"));
const AssetUnitForm = lazy(() => import("@/modules/assets/pages/AssetUnitForm"));
const AssetLocationForm = lazy(() => import("@/modules/assets/pages/AssetLocationForm"));
const AssetSupplierForm = lazy(() => import("@/modules/assets/pages/AssetSupplierForm"));
const DepreciationMethodForm = lazy(() => import("@/modules/assets/pages/DepreciationMethodForm"));
const AssetDeliveryForm = lazy(() => import("@/modules/assets/pages/AssetDeliveryForm"));
const AssetScrapForm = lazy(() => import("@/modules/assets/pages/AssetScrapForm"));
const AssetSaleForm = lazy(() => import("@/modules/assets/pages/AssetSaleForm"));
const AssetLostForm = lazy(() => import("@/modules/assets/pages/AssetLostForm"));
const AssetRegisterForm = lazy(() => import("@/modules/assets/pages/AssetRegisterForm"));
const AssetWarehouseReceipt = lazy(() => import("@/modules/assets/pages/AssetWarehouseReceipt"));
const AssetWarehouseIssue = lazy(() => import("@/modules/assets/pages/AssetWarehouseIssue"));
const AssetWarehouseBalance = lazy(() => import("@/modules/assets/pages/AssetWarehouseBalance"));
const AssetWarehouseMinStock = lazy(() => import("@/modules/assets/pages/AssetWarehouseMinStock"));
const Warehouse = lazy(() => import("@/modules/warehouse/pages/Warehouse"));
const WarehouseDashboard = lazy(() => import("@/modules/warehouse/pages/WarehouseDashboard"));
const Payroll = lazy(() => import("@/modules/payroll/pages/Payroll"));
const PayrollDashboard = lazy(() => import("@/modules/payroll/pages/PayrollDashboard"));
const PayrollCalculate = lazy(() => import("@/modules/payroll/pages/PayrollCalculate"));
const ManualDocument = lazy(() => import("@/modules/accounting/pages/ManualDocument"));
const DocumentsList = lazy(() => import("@/modules/accounting/pages/DocumentsList"));
const PayrollOperations = lazy(() => import("@/modules/accounting/pages/PayrollOperations"));
const CapitalOperations = lazy(() => import("@/modules/accounting/pages/CapitalOperations"));
const AutoDocument = lazy(() => import("@/modules/accounting/pages/AutoDocument"));
const CopyDocument = lazy(() => import("@/modules/accounting/pages/CopyDocument"));
const BalanceSheet = lazy(() => import("@/modules/accounting/pages/BalanceSheet"));
const AccountReview = lazy(() => import("@/modules/accounting/pages/AccountReview"));
const AiChat = lazy(() => import("@/pages/AiChat"));
// ─── گزارشات ──────────────────────────────────────────────────────────────
const DocumentsReport  = lazy(() => import("@/modules/reports/pages/DocumentsReport"));
const AccountsReport   = lazy(() => import("@/modules/reports/pages/AccountsReport"));
const BudgetReport     = lazy(() => import("@/modules/reports/pages/BudgetReport"));
const PaymentsReport   = lazy(() => import("@/modules/reports/pages/PaymentsReport"));
const FinancialReport  = lazy(() => import("@/modules/reports/pages/FinancialReport"));
const ManagementReport = lazy(() => import("@/modules/reports/pages/ManagementReport"));
const TrialBalance     = lazy(() => import("@/modules/reports/pages/TrialBalance"));
const GeneralLedger    = lazy(() => import("@/modules/reports/pages/GeneralLedger"));
const JournalReport    = lazy(() => import("@/modules/reports/pages/JournalReport"));
const MoeinLedger      = lazy(() => import("@/modules/reports/pages/MoeinLedger"));
const AccountTurnover  = lazy(() => import("@/modules/reports/pages/AccountTurnover"));
const DocumentTurnover = lazy(() => import("@/modules/reports/pages/DocumentTurnover"));
const DocumentStatus   = lazy(() => import("@/modules/reports/pages/DocumentStatus"));
const SanamaExport     = lazy(() => import("@/modules/reports/pages/SanamaExport"));

// Contract Reports
const ContractDashboardReport = lazy(() => import("@/pages/ContractDashboardReport"));
const ContractListReport = lazy(() => import("@/pages/ContractListReport"));
const ContractPaymentsReport = lazy(() => import("@/pages/ContractPaymentsReport"));
const ContractGuaranteesReport = lazy(() => import("@/pages/ContractGuaranteesReport"));
const ContractDeductionsReport = lazy(() => import("@/pages/ContractDeductionsReport"));
const ContractChangesReport = lazy(() => import("@/pages/ContractChangesReport"));
const ContractPartiesReport = lazy(() => import("@/pages/ContractPartiesReport"));

/** صفحاتی که پیاده‌سازی شده‌اند — بقیه خودکار Placeholder می‌شوند */
export const PAGE_COMPONENTS = {
  "/ai/chat": AiChat,
  // ─── گزارشات ─────────────────────────────────────────────────────────────
  "/reports": DocumentsReport,
  // گزارش‌های اسناد حسابداری
  "/reports/documents":                DocumentsReport,
  "/reports/documents/list":           DocumentsReport,
  "/reports/documents/journal":        JournalReport,
  "/reports/documents/general-ledger": GeneralLedger,
  "/reports/documents/moein-ledger":   MoeinLedger,
  "/reports/documents/turnover":       DocumentTurnover,
  "/reports/documents/status":         DocumentStatus,
  // گزارش‌های حساب‌ها
  "/reports/accounts":                 AccountsReport,
  "/reports/accounts/trial-balance":   TrialBalance,
  "/reports/accounts/turnover":        AccountTurnover,
  "/reports/accounts/balance":         AccountsReport,
  "/reports/accounts/detail-turnover": AccountsReport,
  "/reports/accounts/no-turnover":     AccountsReport,
  // گزارش‌های بودجه
  "/reports/budget":                   BudgetReport,
  "/reports/budget/performance":       BudgetReport,
  "/reports/budget/comparison":        BudgetReport,
  "/reports/budget/remaining":         BudgetReport,
  "/reports/budget/allocation":        BudgetReport,
  // گزارش‌های دریافت و پرداخت
  "/reports/payments":                 PaymentsReport,
  "/reports/payments/receipts":        PaymentsReport,
  "/reports/payments/payments":        PaymentsReport,
  "/reports/payments/cash-turnover":   PaymentsReport,
  "/reports/payments/bank-turnover":   PaymentsReport,
  "/reports/payments/bank-reconcile":  PaymentsReport,
  "/reports/payments/checks":          PaymentsReport,
  // گزارش‌های مالی
  "/reports/financial":                        FinancialReport,
  "/reports/financial/balance-sheet":          FinancialReport,
  "/reports/financial/income-statement":       FinancialReport,
  "/reports/financial/revenue-expense":        FinancialReport,
  "/reports/financial/cash-flow":              FinancialReport,
  // گزارش‌های مدیریتی
  "/reports/management":                       ManagementReport,
  "/reports/management/dashboard":             ManagementReport,
  "/reports/management/analytical":            ManagementReport,
  "/reports/management/period-compare":        ManagementReport,
  "/reports/management/cost-analysis":         ManagementReport,
  "/reports/sanama-export":                    SanamaExport,
  
  // Contract Reports
  "/reports/contracts/dashboard":              ContractDashboardReport,
  "/reports/contracts/list":                   ContractListReport,
  "/reports/contracts/payments":               ContractPaymentsReport,
  "/reports/contracts/guarantees":             ContractGuaranteesReport,
  "/reports/contracts/deductions":             ContractDeductionsReport,
  "/reports/contracts/change-25":              ContractChangesReport,
  "/reports/contracts/by-party":               ContractPartiesReport,

  "/basic-info": BasicInfo,
  "/basic-info/account-heads": AccountHeads,
  "/basic-info/document-setup/document-types": DocumentTypes,
  "/basic-info/document-setup/payment-types": PaymentTypes,
  "/basic-info/credits": Credits,
  "/basic-info/document-setup": DocumentSetup,
  "/basic-info/check-issuance": CheckIssuance,
  "/basic-info/definitions": BasicInfo,
  "/basic-info/definitions/fiscal-year": FiscalYearForm,
  "/basic-info/definitions/persons": PersonsForm,
  "/basic-info/definitions/parties": ContractPartiesForm,
  "/basic-info/definitions/contract-types": ContractTypesForm,
  "/basic-info/definitions/deduction-types": DeductionTypesForm,
  "/basic-info/definitions/guarantee-types": GuaranteeTypesForm,
  "/basic-info/definitions/assignment-methods": AssignmentMethodsForm,
  "/basic-info/definitions/purchase-power-rate": PurchasePowerRatesForm,
  "/basic-info/definitions/penalty-rate": PenaltyRatesForm,






  "/basic-info/contracts/register": ContractRegistrationForm,
  "/basic-info/contracts/supplement": ContractSupplementForm,
  "/basic-info/contracts/card": ContractCard,
  "/basic-info/contracts/addendum": ContractAddendumForm,
  "/basic-info/contracts/change-25": ContractChanges25Form,
  "/basic-info/contracts/progress-billing": ProgressBillingForm,
  "/basic-info/contracts/payment": ContractPaymentForm,
  "/basic-info/contracts/guarantee": ContractGuaranteeForm,
  "/basic-info/contracts/termination": ContractTerminationForm,
  "/basic-info/contracts/cancellation": ContractCancellationForm,


  "/basic-info/definitions/bank": BankForm,
  "/basic-info/definitions/credit": CreditForm,
  "/basic-info/definitions/check": CheckIssuance,
  "/basic-info/bookkeeping": Bookkeeping,
  "/document-setup": DocumentSetup,
  "/document-setup/calc-form":  DocumentSetup,
  "/document-setup/manual-doc": ManualDocument,
  "/document-setup/auto-doc":   AutoDocument,
  "/document-setup/copy-doc":   CopyDocument,
  "/document-setup/docs-list":  DocumentsList,
  "/review": Review,
  "/credits": Credits,
  "/credits/agreements": Credits,
  "/credits/requests": Credits,
  "/credits/allocation-no-doc": Credits,
  "/credits/search": Credits,
  "/credits/receipt-no-doc": Credits,
  "/credits/funded": Credits,
  "/credits/funded-search": Credits,
  "/credits/funded-copy": Credits,
  "/credits/funded-merge": Credits,
  "/credits/payroll-from-excel": Credits,
  "/credits/payroll-funding": Credits,
  "/credits/payment-request-no-doc": Credits,
  "/credits/notification": Credits,
  "/credits/notification/request": Credits,
  "/credits/notification/bank-report": Credits,
  "/credits/notification/court-form": Credits,
  "/credits/notification/recipients-report": Credits,
  "/credits/notification/request-report": Credits,
  "/credits/notification/recipients-detail-report": Credits,
  "/credits/notification/fund-confirmation": Credits,
  "/credits/notification/request-report-2": Credits,
  "/credits/notification/supplementary-report": Credits,
  "/credits/notification/copy-request": Credits,
  "/credits/reports": Credits,
  "/credits/reports/budget": Credits,
  "/credits/reports/budget/all-programs": Credits,
  "/credits/reports/budget/program-activities": Credits,
  "/credits/reports/budget/funded-programs": Credits,
  "/credits/reports/budget/dept-by-deputy": Credits,
  "/credits/reports/budget/deputy-activities": Credits,
  "/credits/reports/budget/program-agents": Credits,
  "/credits/reports/budget/program-notif-receivers": Credits,
  "/credits/reports/budget/activity-notif-receivers": Credits,
  "/credits/reports/budget/misc-payments": Credits,
  "/credits/reports/budget/contracts-by-program": Credits,
  "/credits/reports/budget/contract-programs": Credits,
  "/credits/reports/budget/contract-activities": Credits,
  "/credits/reports/budget/contract-sub-activities": Credits,
  "/credits/reports/performance": Credits,
  "/credits/reports/performance/program-stats": Credits,
  "/credits/reports/performance/by-program": Credits,
  "/credits/reports/performance/by-chapter-program": Credits,
  "/credits/reports/performance/by-deputy": Credits,
  "/credits/reports/performance/summary": Credits,
  "/credits/reports/performance/funding": Credits,
  "/credits/reports/performance/by-agent": Credits,
  "/credits/reports/performance/by-notif-receiver": Credits,
  "/credits/reports/ledgers": Credits,
  "/credits/reports/ledgers/program-level": Credits,
  "/credits/reports/ledgers/contract-level": Credits,
  "/credits/reports/ledgers/agent-level": Credits,
  "/credits/reports/ledgers/notif-receiver-level": Credits,
  "/credits/reports/ledgers/misc-level": Credits,
  "/credits/reports/ledgers/interim-docs": Credits,
  "/credits/reports/ledgers/documentary": Credits,
  "/credits/reports/ledgers/petty-cash": Credits,
  "/credits/reports/ledgers/overall": Credits,
  "/credits/reports/agreements": Credits,
  "/credits/reports/agreements/by-detail": Credits,
  "/credits/reports/agreements/by-detail/program": Credits,
  "/credits/reports/agreements/by-detail/activity": Credits,
  "/credits/reports/agreements/by-detail/clause": Credits,
  "/credits/reports/agreements/by-detail/investment-chapters": Credits,
  "/credits/reports/agreements/by-detail/expense-resources": Credits,
  "/credits/reports/agreements/expense-resources": Credits,
  "/credits/reports/agreements/expense-resources/form-2a": Credits,
  "/credits/reports/agreements/expense-resources/form-4-chapters": Credits,
  "/credits/reports/agreements/expense-resources/form-4-personnel": Credits,
  "/credits/reports/agreements/expense-resources/form-5-income": Credits,
  "/credits/reports/agreements/expense-resources/form-1-summary": Credits,
  "/credits/reports/agreements/expense-resources/form-6-manpower": Credits,
  "/credits/reports/agreements/expense-resources/form-4b-non-personnel": Credits,
  "/credits/reports/agreements/expense-resources/form-3-program-activity": Credits,
  "/credits/reports/agreements/expense-resources/form-2b-annual-plan": Credits,
  "/credits/reports/agreements/expense-resources/form-7-provincial": Credits,
  "/credits/reports/agreements/expense-resources/form-2-expense-program": Credits,
  "/credits/reports/agreements/form-four": Credits,
  "/credits/reports/agreements/detailed-budget": Credits,
  "/credits/reports/agreements/payment-control": Credits,
  "/credits/reports/allocation": Credits,
  "/credits/reports/allocation/by-program": Credits,
  "/credits/reports/allocation/all": Credits,
  "/credits/reports/allocation/program-chapter": Credits,
  "/credits/reports/receipts": Credits,
  "/credits/reports/receipts/all": Credits,
  "/credits/reports/receipts/no-program": Credits,
  "/credits/reports/credits-1": Credits,
  "/credits/reports/payment-request-no-doc": Credits,
  "/credits/reports/comprehensive": Credits,
  "/credits/reports/commercial": Credits,
  "/credits/reports/by-detail": Credits,
  "/credits/sub-accountant-agent": Credits,
  "/credits/sub-accountant-agent/version-1": Credits,
  "/credits/sub-accountant-agent/version-1/total-credit-form": Credits,
  "/credits/sub-accountant-agent/version-1/agent-requests": Credits,
  "/credits/sub-accountant-agent/version-1/agent-expenses": Credits,
  "/credits/sub-accountant-agent/version-1/fund-from-expense": Credits,
  "/credits/sub-accountant-agent/version-2": Credits,
  "/credits/sub-accountant-agent/version-2/send-credit": Credits,
  "/credits/sub-accountant-agent/version-2/confirm-issue": Credits,
  "/credits/sub-accountant-agent/view-confirm-credit": Credits,
  "/credits/sub-accountant-agent/view-confirm-request": Credits,
  "/credits/sub-accountant-agent/view-confirm-expense": Credits,
  "/credits/sub-accountant-agent/plan-program-percent": Credits,
  "/credits/sub-accountant-agent/cost-center-relation": Credits,
  "/credits/sub-accountant-agent/agents-relation": Credits,
  "/credits/read-from-file": Credits,
  "/credits/warehouse-receipt-reg": Credits,
  "/credits/fund-from-doc": Credits,
  "/credits/warehouse-fund-template": Credits,
  "/check-issuance": CheckIssuance,
  "/bookkeeping": Bookkeeping,
  "/bookkeeping/operations-balance": Bookkeeping,
  "/bookkeeping/operations-balance/4-column": BalanceSheet,
  "/bookkeeping/operations-balance/6-column": BalanceSheet,
  "/bookkeeping/operations-balance/8-column": BalanceSheet,
  "/bookkeeping/misc-accounts": Bookkeeping,
  "/bookkeeping/misc-accounts/account-groups": Bookkeeping,
  "/bookkeeping/misc-accounts/main-accounts": Bookkeeping,
  "/bookkeeping/misc-accounts/moein-accounts": Bookkeeping,
  "/bookkeeping/misc-accounts/detail-accounts": Bookkeeping,
  "/bookkeeping/misc-accounts/detailed-report": Bookkeeping,
  "/bookkeeping/bank-reconciliation": Bookkeeping,
  "/bookkeeping/bank-reconciliation/account-format-setup": Bookkeeping,
  "/bookkeeping/bank-reconciliation/account-info-read": Bookkeeping,
  "/bookkeeping/bank-reconciliation/account-reconciliation": Bookkeeping,
  "/bookkeeping/ledger-reports": Bookkeeping,
  "/bookkeeping/ledger-reports/account-review":        AccountReview,
  "/bookkeeping/ledger-reports/account-review-main":   AccountReview,
  "/bookkeeping/ledger-reports/account-review-group":  AccountReview,
  "/bookkeeping/ledger-reports/account-review-person": AccountReview,
  "/bookkeeping/ledger-reports/general-ledger":        Bookkeeping,
  "/bookkeeping/final-documents/finalize-doc": Bookkeeping,
  "/bookkeeping/final-documents/unfinalize-doc": Bookkeeping,
  "/bookkeeping/budget-execution": Bookkeeping,
  "/bookkeeping/budget-execution/budget-allocation-setup": Bookkeeping,
  "/bookkeeping/budget-execution/budget-allocation": Bookkeeping,
  "/bookkeeping/misc-persons/persons-balance": Bookkeeping,
  "/bookkeeping/financial-statements": Bookkeeping,
  "/bookkeeping/financial-statements/balance-sheet": Bookkeeping,
  "/bookkeeping/financial-statements/change-in-financial-position": Bookkeeping,
  "/bookkeeping/financial-statements/comparison-budget-performance": Bookkeeping,
  "/bookkeeping/financial-statements/parametric-balance-sheet": Bookkeeping,
  "/bookkeeping/financial-statements/notes": Bookkeeping,
  "/bookkeeping/financial-statements/reports-settings": Bookkeeping,
  "/bookkeeping/accountant-agents": Bookkeeping,
  "/bookkeeping/document-notification": Bookkeeping,
  "/bookkeeping/smart-control": Bookkeeping,
  "/bookkeeping/petty-cash": Bookkeeping,
  "/bookkeeping/open-items": Bookkeeping,
  "/bookkeeping/resource-forms": Bookkeeping,
  "/bookkeeping/resource-forms/deposit-expense-confirmation": Bookkeeping,
  "/bookkeeping/account-setup": AccountSetup,
  "/system-management": SystemManagement,
  "/system-management/automatic-doc-types": SystemManagement,
  "/system-management/non-calc-doc-types": SystemManagement,
  "/system-management/credit-payroll-template": SystemManagement,
  "/system-management/payroll-doc-template": SystemManagement,
  "/system-management/assets-doc-template": SystemManagement,
  "/system-management/calc-formulas": SystemManagement,
  "/system-management/balance-control": SystemManagement,
  "/system-management/credit-control": SystemManagement,
  "/system-management/program-details": SystemManagement,
  "/system-management/user-groups": SystemManagement,
  "/system-management/users": Users,
  "/system-management/permissions": SystemManagement,
  "/system-management/change-password": SystemManagement,
  "/system-management/user-performance": SystemManagement,
  "/system-management/financial-details": SystemManagement,
  "/system-management/approve-docs": SystemManagement,
  "/system-management/close-account-chapters": SystemManagement,
  "/system-management/settings": SystemManagement,
  "/system-management/document-templates": SystemManagement,
  "/system-management/document-templates/current-operations": CurrentOperations,
  "/system-management/document-templates/payroll": PayrollOperations,
  "/system-management/document-templates/capital-operations": CapitalOperations,
  "/system-management/document-templates/revenues": SystemManagement,
  "/system-management/document-templates/deposits": SystemManagement,
  "/system-management/document-templates/special-cases": SystemManagement,
  "/system-management/update-manager": SystemManagement,
  "/system-management/backup": SystemManagement,
  "/system-management/report-signature": SystemManagement,
  "/system-management/report-generator": SystemManagement,
  "/system-management/report-generator/define": SystemManagement,
  "/system-management/report-generator/settings": SystemManagement,
  "/system-management/report-generator/generate": SystemManagement,
  "/system-management/report-generator/generate-2": SystemManagement,
  "/system-management/report-generator/generate-3": SystemManagement,
  "/system-management/person-chapters": SystemManagement,
  "/system-management/revoke-reconciliation": SystemManagement,
  "/system-management/user-circle": SystemManagement,
  "/system-management/revoke-sanama": SystemManagement,
  "/system-management/signature-group": SystemManagement,
  "/system-management/convert-chapter95": SystemManagement,
  "/system-management/convert-chapter94": SystemManagement,
  "/system-management/common-settings": SystemManagement,
  "/system-management/change-moein-doc": SystemManagement,
  "/system-management/cartable": SystemManagement,
  "/system-management/credit-settings": SystemManagement,
  "/system-management/revoke-e-transfer": SystemManagement,
  "/system-management/sanama-file-check": SystemManagement,
  "/system-management/doc-requirements": SystemManagement,
  "/guarantees": Guarantees,
  "/guarantees/types": Guarantees,
  "/guarantees/causes": Guarantees,
  "/guarantees/guarantee-type": Guarantees,
  "/guarantees/subject": Guarantees,
  "/guarantees/register": Guarantees,
  "/guarantees/register/contract": GuaranteeContractForm,
  "/guarantees/register/person": Guarantees,
  "/guarantees/auto-doc": Guarantees,
  "/guarantees/extension-request": Guarantees,
  "/guarantees/report": Guarantees,
  "/guarantees/status-report": Guarantees,
  "/guarantees/status-report/status": Guarantees,
  "/guarantees/date-report": Guarantees,
  "/deposits": Deposits,
  "/deposits/auto-register": Deposits,
  "/deposits/manual-form": DepositManualForm,
  "/deposits/treasury": Deposits,
  "/deposits/search": Deposits,
  "/assets": Assets,
  "/assets/basic-info": Assets,
  "/assets/basic-info/asset-groups": AssetGroupForm,
  "/assets/basic-info/asset-subgroups": AssetSubGroupForm,
  "/assets/basic-info/asset-types": AssetTypeForm,
  "/assets/basic-info/asset-nature": AssetNatureForm,
  "/assets/basic-info/units": AssetUnitForm,
  "/assets/basic-info/locations": AssetLocationForm,
  "/assets/basic-info/suppliers": AssetSupplierForm,
  "/assets/basic-info/depreciation-methods": DepreciationMethodForm,
  "/assets/register": Assets,
  "/assets/register/new": AssetRegisterForm,
  "/assets/register/delivery": AssetDeliveryForm,
  "/assets/register/scrap": AssetScrapForm,
  "/assets/register/sale": AssetSaleForm,
  "/assets/register/lost": AssetLostForm,
  "/assets/depreciation": Assets,
  "/assets/depreciation/setup": Assets,
  "/assets/depreciation/monthly": Assets,
  "/assets/depreciation/annual": Assets,
  "/assets/depreciation/document": Assets,
  "/assets/warehouse": Assets,
  "/assets/warehouse/receipt": AssetWarehouseReceipt,
  "/assets/warehouse/issue": AssetWarehouseIssue,
  "/assets/warehouse/balance": AssetWarehouseBalance,
  "/assets/warehouse/min-stock": AssetWarehouseMinStock,
  "/assets/reports": Assets,
  "/assets/reports/all": Assets,
  "/assets/reports/by-unit": Assets,
  "/assets/reports/by-employee": Assets,
  "/assets/reports/labeled": Assets,
  "/assets/reports/unlabeled": Assets,
  "/assets/reports/depreciation-monthly": Assets,
  "/assets/reports/depreciation-annual": Assets,
  "/assets/reports/depreciation-cumulative": Assets,
  "/assets/reports/book-value": Assets,
  "/assets/reports/lost": Assets,
  "/assets/reports/scrapped": Assets,
  "/assets/reports/in-repair": Assets,
  "/assets/reports/transferred": Assets,
  "/warehouse": Warehouse,
  "/warehouse/dashboard": WarehouseDashboard,
  "/warehouse/items": Warehouse,
  "/warehouse/items/list": Warehouse,
  "/warehouse/items/new": Warehouse,
  "/warehouse/items/categories": Warehouse,
  "/warehouse/items/barcodes": Warehouse,
  "/warehouse/stores": Warehouse,
  "/warehouse/stores/list": Warehouse,
  "/warehouse/stores/new": Warehouse,
  "/warehouse/stores/stock": Warehouse,
  "/warehouse/receipts": Warehouse,
  "/warehouse/receipts/new": Warehouse,
  "/warehouse/receipts/list": Warehouse,
  "/warehouse/receipts/purchase": Warehouse,
  "/warehouse/receipts/return": Warehouse,
  "/warehouse/receipts/transfer-in": Warehouse,
  "/warehouse/issues": Warehouse,
  "/warehouse/issues/new": Warehouse,
  "/warehouse/issues/list": Warehouse,
  "/warehouse/issues/consumption": Warehouse,
  "/warehouse/issues/delivery": Warehouse,
  "/warehouse/issues/scrap": Warehouse,
  "/warehouse/requests": Warehouse,
  "/warehouse/requests/new": Warehouse,
  "/warehouse/requests/list": Warehouse,
  "/warehouse/requests/pending": Warehouse,
  "/warehouse/requests/approve": Warehouse,
  "/warehouse/transfers": Warehouse,
  "/warehouse/transfers/new": Warehouse,
  "/warehouse/transfers/list": Warehouse,
  "/warehouse/transfers/confirm": Warehouse,
  "/warehouse/inventory": Warehouse,
  "/warehouse/inventory/new": Warehouse,
  "/warehouse/inventory/count": Warehouse,
  "/warehouse/inventory/discrepancy": Warehouse,
  "/warehouse/inventory/history": Warehouse,
  "/warehouse/suppliers": Warehouse,
  "/warehouse/suppliers/list": Warehouse,
  "/warehouse/suppliers/new": Warehouse,
  "/warehouse/reports": Warehouse,
  "/warehouse/reports/stock": Warehouse,
  "/warehouse/reports/stock-by-store": Warehouse,
  "/warehouse/reports/stock-by-group": Warehouse,
  "/warehouse/reports/turnover": Warehouse,
  "/warehouse/reports/transfers": Warehouse,
  "/warehouse/reports/shortage": Warehouse,
  "/warehouse/reports/discrepancy": Warehouse,
  "/warehouse/reports/audit": Warehouse,
  "/payroll": Payroll,
  "/payroll/dashboard": PayrollDashboard,
  "/payroll/employees": Payroll,
  "/payroll/employees/list": Payroll,
  "/payroll/employees/new": Payroll,
  "/payroll/employees/contracts": Payroll,
  "/payroll/employees/decrees": Payroll,
  "/payroll/attendance": Payroll,
  "/payroll/attendance/register": Payroll,
  "/payroll/attendance/list": Payroll,
  "/payroll/attendance/leave": Payroll,
  "/payroll/attendance/mission": Payroll,
  "/payroll/calculate": Payroll,
  "/payroll/calculate/monthly": PayrollCalculate,
  "/payroll/calculate/settings": Payroll,
  "/payroll/calculate/tax-table": Payroll,
  "/payroll/calculate/insurance": Payroll,
  "/payroll/payslip": Payroll,
  "/payroll/payslip/view": Payroll,
  "/payroll/payslip/print": Payroll,
  "/payroll/payslip/bulk": Payroll,
  "/payroll/loans": Payroll,
  "/payroll/loans/new": Payroll,
  "/payroll/loans/list": Payroll,
  "/payroll/loans/advance": Payroll,
  "/payroll/loans/balance": Payroll,
  "/payroll/reports": Payroll,
  "/payroll/reports/list": Payroll,
  "/payroll/reports/insurance": Payroll,
  "/payroll/reports/tax": Payroll,
  "/payroll/reports/overtime": Payroll,
  "/payroll/reports/absence": Payroll,
  "/payroll/reports/leave": Payroll,
  "/payroll/reports/unit-cost": Payroll,
  "/payroll/reports/annual": Payroll,
  "/payroll/reports/eid": Payroll,
};

export function buildLayoutRoutes(HomePage) {
  const menuRoutes = getAllMenuRoutes();
  const routes = [{ path: "/", element: <HomePage /> }];

  for (const { path, label } of menuRoutes) {
    const Component = PAGE_COMPONENTS[path];
    routes.push({
      path,
      element: Component ? <Component /> : <Placeholder label={label} />,
    });
  }

  return routes;
}
