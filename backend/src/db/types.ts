import { ObjectId } from "mongodb";

// ─── Journal ──────────────────────────────────────────────────────────────────

export interface JournalLine {
  account_code: string;
  account_name?: string;
  debit: number;
  credit: number;
  description?: string;
  is_budgetary?: boolean;
}

export interface JournalDocument {
  _id?: ObjectId;
  document_number: string;
  document_type: "PETTY_CASH_PAYMENT" | "GENERAL_PAYMENT" | "REVENUE" | "TRANSFER" | "CLOSING";
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  fiscal_year: number;
  document_date?: string;
  description?: string;
  reference_number?: string;
  lines: JournalLine[]; // embedded
  ciphertext?: string;
}

// ─── Checks ───────────────────────────────────────────────────────────────────

export interface Check {
  _id?: ObjectId;
  check_number: string;
  check_type: "payment" | "receipt" | "electronic";
  status: "pending" | "issued" | "cleared" | "cancelled" | "aggregated";
  amount: number;
  payee?: string;
  bank_name?: string;
  account_number?: string;
  issue_date?: string;
  due_date?: string;
  fiscal_year: number;
  description?: string;
  agreement_id?: ObjectId;
  cancelled_reason?: string;
  aggregated_check_id?: ObjectId;
  journal_document_id?: ObjectId;
}

// ─── Contracts ────────────────────────────────────────────────────────────────

export interface ContractDeduction {
  deduction_type?: string;
  rate?: number;
  amount?: number;
}

export interface ContractPaymentSubItem {
  payment_date?: string;
  amount?: number;
  description?: string;
  check_id?: ObjectId;
}

export interface ContractAddendum {
  addendum_number?: string;
  change_amount?: number;
  change_percent?: number;
  description?: string;
  date?: string;
}

export interface Contract {
  _id?: ObjectId;
  contract_number: string;
  title: string;
  contractor_name: string;
  contractor_code?: string;
  status: "draft" | "active" | "suspended" | "completed" | "cancelled";
  amount: number;
  start_date?: string;
  end_date?: string;
  fiscal_year?: number;
  program_code?: string;
  activity_code?: string;
  sub_activity_code?: string;
  description?: string;
  advance_payment?: number;
  retention_rate?: number;
  purchase_power_rate?: number;
  has_addendum?: boolean;
  deductions?: ContractDeduction[];
  payments?: ContractPaymentSubItem[];
  addenda?: ContractAddendum[];
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export interface Agreement {
  _id?: ObjectId;
  agreement_number: string;
  title?: string;
  fiscal_year: number;
  total_amount: number;
  program_code?: string;
  activity_code?: string;
  chapter_code?: string;
  article_code?: string;
  moein_code?: string;
  moein_title?: string;
  status: "draft" | "confirmed" | "allocated" | "delegated";
  attachment_name?: string;
  description?: string;
}

export interface CreditAllocation {
  _id?: ObjectId;
  allocation_number: string;
  agreement_id?: ObjectId;
  fiscal_year: number;
  amount: number;
  allocation_date?: string;
  period?: string;
  description?: string;
  status: "draft" | "confirmed" | "allocated" | "delegated";
}

export interface CreditReceipt {
  _id?: ObjectId;
  receipt_number: string;
  allocation_id?: ObjectId;
  fiscal_year: number;
  amount: number;
  receipt_date?: string;
  bank_reference?: string;
  description?: string;
}

export interface CreditDelegation {
  _id?: ObjectId;
  delegation_number: string;
  fiscal_year: number;
  amount: number;
  from_unit?: string;
  to_unit?: string;
  delegation_date?: string;
  credit_type?: string;
  status?: string;
  description?: string;
  journal_document_id?: ObjectId;
}

export interface BudgetAmendment {
  _id?: ObjectId;
  amendment_number: string;
  agreement_id: ObjectId;
  fiscal_year: number;
  amendment_type: "increase" | "decrease" | "reallocation";
  amount: number;
  source_program_code?: string;
  target_program_code?: string;
  amendment_date?: string;
  status: "draft" | "approved" | "rejected";
  description?: string;
}

export interface CreditFundingRequest {
  _id?: ObjectId;
  request_number: string;
  fiscal_year: number;
  agreement_id?: ObjectId;
  allocation_id?: ObjectId;
  amount: number;
  requesting_unit: string;
  purpose: string;
  request_date?: string;
  status: "pending" | "approved" | "rejected";
  confirmation_code?: string;
  description?: string;
}

export interface CreditFundingConfirmation {
  _id?: ObjectId;
  confirmation_number: string;
  funding_request_id: ObjectId;
  fiscal_year: number;
  amount: number;
  issue_date: string;
  valid_until?: string;
  status: "active" | "utilized" | "cancelled";
  description?: string;
}

export interface CreditObligation {
  _id?: ObjectId;
  obligation_number: string;
  fiscal_year: number;
  funding_confirmation_id?: ObjectId;
  contract_id?: ObjectId;
  beneficiary_name: string;
  amount: number;
  released_amount?: number;
  obligation_date?: string;
  status: "active" | "modified" | "released" | "closed";
  description?: string;
}

export interface CreditRealization {
  _id?: ObjectId;
  realization_number: string;
  obligation_id: ObjectId;
  fiscal_year: number;
  claimed_amount: number;
  verified_amount: number;
  bill_number?: string;
  verification_date?: string;
  status: "pending" | "verified" | "rejected";
  verifier?: string;
  description?: string;
}

export interface CreditPaymentRemittance {
  _id?: ObjectId;
  remittance_number: string;
  realization_id?: ObjectId;
  fiscal_year: number;
  amount: number;
  iban?: string;
  recipient_name: string;
  recipient_bank?: string;
  issue_date?: string;
  status: "issued" | "paid" | "returned";
  description?: string;
}

export interface CreditPaymentReturn {
  _id?: ObjectId;
  return_number: string;
  remittance_id: ObjectId;
  fiscal_year: number;
  amount: number;
  return_date?: string;
  reason?: string;
  status: "processed" | "pending";
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface Review {
  _id?: ObjectId;
  review_number: string;
  review_type: "fixed_order" | "current_payment" | "current_deposit" | "warehouse";
  status: "draft" | "in_review" | "approved" | "rejected";
  fiscal_year: number;
  amount: number;
  payee?: string;
  description?: string;
  review_date?: string;
  reviewer_id?: ObjectId;
  journal_document_id?: ObjectId;
}

// ─── Persons ──────────────────────────────────────────────────────────────────
export interface Person {
  _id?: ObjectId;
  nomineeCode: string;
  personKind: string;
  personClass: string;
  subClass: string;
  detailClass: string;
  exclusiveCode?: string;
  suggestedCode?: string;
  inactive?: boolean;
  title: string;
  nationalId?: string;
  economicCode?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  birthDate?: string;
  gender?: string;
  province?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  phone?: string;
  sheba?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  taxRegStartDate?: string;
  taxRegEndDate?: string;
  vatRegistered?: boolean;
  vatBase?: string;
  paymentLimitationType?: string;
  maxPaymentAmount?: string;
  altTitle?: string;
  position?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Fiscal Years ─────────────────────────────────────────────────────────────
export interface FiscalYear {
  _id?: ObjectId;
  year: number;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Types ───────────────────────────────────────────────────────────
export interface ContractType {
  _id?: ObjectId;
  code: string;
  title: string;
  nature: string; // e.g. "پیمانکاری" | "مشاوره" | "خرید کالا/تجهیزات" | "فروش" | "خدماتی" | "مشارکت" | "سایر"
  taxRate?: number;
  insuranceRate?: number;
  hasGuarantee?: boolean;
  status: "فعال" | "غیرفعال";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Deduction Types ──────────────────────────────────────────────────────────
export interface DeductionType {
  _id?: ObjectId;
  code: string;
  title: string;
  nature: string; // e.g. "قانونی" | "قراردادی" | "سپرده" | "پیش‌پرداخت" | "سایر"
  calcMethod: "درصدی" | "مبلغ ثابت";
  rate?: number; // percentage rate
  amount?: number; // fixed amount
  moeinAccount?: string; // associated moein ledger code
  status: "فعال" | "غیرفعال";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Guarantee Types ──────────────────────────────────────────────────────────
export interface GuaranteeType {
  _id?: ObjectId;
  code: string;
  title: string;
  nature: string; // e.g. "شرکت در فرآیند" | "انجام تعهدات" | "پیش‌پرداخت" | "حسن انجام کار" | "گمرکی" | "سایر"
  allowedCollaterals: string[]; // e.g. ["ضمانت‌نامه بانکی", "ضمانت‌نامه بیمه‌ای", "سفته", "وثیقه نقدی", "سند ملکی"]
  validityDurationDays?: number; // default duration in days
  status: "فعال" | "غیرفعال";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Assignment Methods ───────────────────────────────────────────────────────
export interface AssignmentMethod {
  _id?: ObjectId;
  code: string;
  title: string;
  nature: string; // e.g. "مناقصه" | "مزایده" | "ترک تشریفات" | "استعلام" | "خرید مستقیم" | "سایر"
  hasTenderCommittee?: boolean;
  minAmount?: number;
  maxAmount?: number;
  status: "فعال" | "غیرفعال";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Purchase Power Rates ────────────────────────────────────────────────────
export interface PurchasePowerRate {
  _id?: ObjectId;
  code: string;
  fiscalYear: number;
  annualRate: number; // annual preservation rate percentage (e.g. 20.5)
  startDate: string; // Shami date string, e.g. "1403/01/01"
  endDate: string; // Shami date string, e.g. "1403/12/29"
  billTitle?: string; // associated regulation/approval/treasury bill title
  status: "فعال" | "غیرفعال";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Penalty Rates ───────────────────────────────────────────────────────────
export interface PenaltyRate {
  _id?: ObjectId;
  code: string;
  title: string;
  nature: string; // e.g. "تأخیر در تعهدات" | "کیفیت کار" | "تخلفات قراردادی" | "سایر"
  calcMethod: "روزانه درصدی" | "روزانه مبلغ ثابت" | "کل درصدی" | "کل مبلغ ثابت";
  rate?: number; // percentage
  amount?: number; // fixed amount
  status: "فعال" | "غیرفعال";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Terminations ───────────────────────────────────────────────────
export interface ContractTermination {
  _id?: ObjectId;
  contract_id: string; // references contracts collection
  contract_number: string;
  contract_title: string;
  contractor_name: string;
  termination_number: string; // notification/memo number
  termination_date: string; // shamsi date like YYYY/MM/DD
  reason: "اعمال ماده ۴۸" | "فقدان بودجه و اعتبارات" | "توافق طرفین" | "قوه قهریه" | "سایر";
  work_done_amount?: number; // amount of work done until termination
  settlement_status: "تسویه کامل" | "در حال تسویه" | "تسویه نشده";
  guarantee_refund_status: "مسترد شده" | "در جریان استرداد" | "آزاد نشده";
  status: "پیش‌نویس" | "ابلاغ شده" | "تایید نهایی";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Cancellations ──────────────────────────────────────────────────
export interface ContractCancellation {
  _id?: ObjectId;
  contract_id: string; // references contracts collection
  contract_number: string;
  contract_title: string;
  contractor_name: string;
  cancellation_number: string; // official notification/memo number
  cancellation_date: string; // shamsi date like YYYY/MM/DD
  reason: "اعمال ماده ۴۶" | "ورشکستگی پیمانکار" | "تخلفات مالی یا واگذاری" | "عدم توانایی فنی" | "سایر";
  damages_claimed_amount?: number; // estimated damages claimed by employer
  guarantee_confiscation_status: "ضبط شده" | "در جریان ضبط" | "آزاد شده" | "اقدام نشده";
  legal_case_status: "ثبت در دادگاه" | "در حال داوری" | "بدون اقدام" | "حل و فصل شده";
  status: "پیش‌نویس" | "ابلاغ شده" | "تایید نهایی";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}









// ─── Contract Parties ─────────────────────────────────────────────────────────
export interface ContractParty {
  _id?: ObjectId;
  code: string;
  personType: "حقوقی" | "حقیقی";
  name: string;
  nationalId: string;
  registrationNumber?: string;
  ceoName?: string;
  status: "فعال" | "غیرفعال";
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  bankName?: string;
  accountNumber?: string;
  sheba?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Progress Bills ───────────────────────────────────────────────────────────
export interface ProgressBill {
  _id?: ObjectId;
  contract_id: string;
  contract_number: string;
  contract_title: string;
  contractor_name: string;
  project?: string;
  executive_unit?: string;
  credit_source?: string;
  statement_number: string;
  statement_date: string;
  from_date?: string;
  to_date?: string;
  progress_percent: number;
  cumulative_progress?: number;
  status: string;
  description?: string;
  contract_amount?: number;
  prev_paid_amount?: number;
  contract_remaining?: number;
  payable_remaining?: number;
  items: {
    row_num: number;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }[];
  items_sum: number;
  adjustment_factor: number;
  total_sum: number;
  deductions: number;
  payable_amount: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Payments ────────────────────────────────────────────────────────
export interface ContractPayment {
  _id?: ObjectId;
  payment_number: string;
  payment_date: string;
  payment_method: string;
  payment_account: string;
  doc_number?: string;
  remittance_number?: string;
  status: string;

  contract_id: string;
  contract_number: string;
  contractor_name: string;
  statement_id?: string;
  statement_number?: string;
  statement_date?: string;
  gross_amount: number;
  progress_percent?: number;
  description?: string;

  deductions_list: {
    row_num: number;
    deduction_type: string;
    calc_method: "درصدی" | "مبلغ ثابت";
    percent?: number;
    amount: number;
    ceiling?: number;
    calculated_amount: number;
  }[];
  total_deductions: number;
  payable_amount: number;
  due_date?: string;

  voucher_number?: string;
  voucher_date?: string;
  voucher_type?: string;
  voucher_status?: string;
  voucher_ref?: string;
  create_voucher?: boolean;
  send_to_accounting?: boolean;

  // New financial and accounting integration fields
  accounting_moein_code?: string;
  contractor_detail_code?: string;
  budget_line_code?: string;
  funding_source?: string;
  prepayment_amortization?: number;
  imprest_amortization?: number;
  other_additions?: number;
  approved_gross_amount?: number;
  vat_acceptable?: number;
  supplement_id?: string;

  // New documents/attachments and log fields
  attachments?: {
    row_num: number;
    name: string;
    type: string;
    size: string;
    date: string;
  }[];
  related_vouchers?: {
    voucher_number: string;
    voucher_date: string;
    voucher_type: string;
    voucher_status: string;
    amount: number;
    description?: string;
  }[];
  history_logs?: {
    row_num: number;
    user: string;
    date: string;
    action: string;
    comment?: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Guarantees ──────────────────────────────────────────────────────
export interface ContractGuarantee {
  _id?: ObjectId;
  guarantee_number: string;
  guarantee_type: string;
  contract_id: string;
  contract_number: string;
  contractor_name: string;
  contract_title: string;
  amount: number;
  percent_of_contract: number;
  status: string;

  issuer_guarantee_number?: string;
  issuing_bank?: string;
  branch?: string;
  issue_date: string;
  expiry_date: string;
  duration_days?: number;
  credit_type?: string;
  renewal_status?: string;
  description?: string;
  remarks?: string;

  renewals?: {
    row_num: number;
    renewal_number: string;
    renewal_date: string;
    new_expiry_date: string;
    duration_days: number;
    status: string;
  }[];

  attachments?: {
    row_num: number;
    name: string;
    type: string;
    size: string;
    date: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Supplements ─────────────────────────────────────────────────────
export interface ContractSupplement {
  _id?: ObjectId;
  supplement_number: string;
  contract_id: string;
  contract_number: string;
  contract_title: string;
  employer_name: string;
  contractor_name: string;
  supplement_type: string;
  supplement_date: string;
  approval_number?: string;
  approval_date?: string;
  status: string;

  supplement_subject: string;
  supplement_reason?: string;
  description?: string;
  remarks?: string;

  initial_amount: number;
  prev_supplements_amount: number;
  supplement_amount: number;
  new_total_amount: number;

  initial_duration: number;
  prev_duration_extensions: number;
  supplement_duration: number;
  new_total_duration: number;

  financial_items: {
    row_num: number;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }[];

  time_adjustments: {
    row_num: number;
    description: string;
    from_date: string;
    to_date: string;
    duration_days: number;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Addenda ─────────────────────────────────────────────────────────
export interface ContractAddendumDocument {
  _id?: ObjectId;
  addendum_number: string;
  contract_id: string;
  contract_number: string;
  contract_title: string;
  contractor_name: string;
  addendum_subject: string;
  addendum_type: string;
  addendum_date: string;
  approval_number?: string;
  approval_date?: string;
  status: string;

  description?: string;
  addendum_base?: string;
  amount_change_percent?: number;
  duration_change_percent?: number;

  initial_amount: number;
  prev_addenda_amount: number;
  addendum_amount: number;
  new_total_amount: number;

  initial_duration: number;
  prev_duration_extensions: number;
  addendum_duration: number;
  new_total_duration: number;

  financial_items: {
    row_num: number;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }[];

  time_adjustments: {
    row_num: number;
    description: string;
    from_date: string;
    to_date: string;
    duration_days: number;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract Cards ───────────────────────────────────────────────────────────
export interface ContractCardDocument {
  _id?: ObjectId;
  card_number: string;
  contract_id: string;
  contract_number: string;
  contract_title: string;
  contractor_name: string;
  contract_type: string;
  contract_subject: string;
  contract_amount: number;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;

  project_name: string;
  executive_unit: string;
  execution_location: string;
  project_code?: string;
  credit_source: string;
  budget_code?: string;
  contract_expert: string;
  registration_date: string;
  registered_by: string;
  remarks?: string;

  financial_progress_percent?: number;
  remaining_amount?: number;
  total_paid?: number;

  latest_statement_number?: string;
  latest_statement_date?: string;
  latest_statement_amount?: number;
  latest_statement_progress_percent?: number;

  createdAt?: string;
  updatedAt?: string;
}

// ─── Contract 25% Changes ─────────────────────────────────────────────────────
export interface ContractChange25Document {
  _id?: ObjectId;
  request_number: string;
  request_date: string;
  contract_id: string;
  contract_number: string;
  contract_title: string;
  employer_name: string;
  contractor_name: string;
  execution_location?: string;
  project_name?: string;

  change_type: "افزایش 25 درصد" | "کاهش 25 درصد";
  calculation_base: string;
  change_percent: number;
  base_amount: number;
  change_amount: number;
  new_amount: number;
  description?: string;

  items: {
    row_num: number;
    description: string;
    unit: string;
    initial_quantity: number;
    change_percent: number;
    change_quantity: number;
    new_quantity: number;
    change_amount: number;
  }[];

  approval_opinion?: string;
  approval_date?: string;
  license_number?: string;
  license_date?: string;
  status: string;
  approval_remarks?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ─── Depreciation Setup ────────────────────────────────────────────────────────
export interface DepreciationSetup {
  _id?: ObjectId;
  setup_code: string;
  title: string;
  status: "فعال" | "غیرفعال";
  fiscal_year: number;
  start_date: string;
  end_date?: string;

  scope: {
    asset_group?: string;
    asset_subgroup?: string;
    cost_center?: string;
    project?: string;
    location?: string;
    org_unit?: string;
    ownership_type?: string;
    company?: string;
  };

  calc_method: {
    method: "خط مستقیم" | "نزولی" | "نزولی مضاعف" | "مجموع سنوات" | "بر اساس کارکرد" | "بر اساس تولید" | "سفارشی";
    period: "ماهانه" | "فصلی" | "سالانه";
    basis: "ارزش خرید" | "ارزش دفتری" | "ارزش جایگزینی";
    salvage_value: number;
    useful_life: number;
    useful_life_unit: "سال" | "ماه";
    rounding: "بدون گرد کردن" | "گرد به ریال" | "گرد به هزار" | "گرد به میلیون";
  };

  accounting: {
    expense_account_code?: string;
    expense_account_name?: string;
    accumulated_depr_account_code?: string;
    accumulated_depr_account_name?: string;
    default_cost_center?: string;
    default_project?: string;
    voucher_desc_template?: string;
    voucher_numbering?: "خودکار" | "دستی";
  };

  calc_settings: {
    calc_from_utilization?: boolean;
    calc_from_purchase?: boolean;
    first_month_depr?: "کامل" | "نصف" | "بر اساس روز";
    calc_last_month?: boolean;
    stop_after_useful_life?: boolean;
    skip_scrapped_assets?: boolean;
    skip_sold_assets?: boolean;
    auto_calc_on_close_month?: boolean;
    auto_issue_voucher?: boolean;
  };

  notes?: string;
  creator?: string;
  attachments?: {
    row_num: number;
    name: string;
    size: string;
    date: string;
  }[];
  audit_logs?: {
    row_num: number;
    user: string;
    date: string;
    action: string;
    comment?: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

// ─── Monthly Depreciation Calculation ──────────────────────────────────────────
export interface MonthlyDepreciationCalculation {
  _id?: ObjectId;
  fiscal_year: number;
  month: string;
  calc_date: string;
  voucher_date: string;
  status: "پیش‌نویس" | "تأیید نهایی" | "سند صادر شده";

  filters: {
    asset_group?: string;
    asset_subgroup?: string;
    cost_center?: string;
    project?: string;
    location?: string;
    org_unit?: string;
    asset_status?: string;
  };

  summary: {
    total_assets: number;
    calculated_assets: number;
    rejected_assets: number;
    total_depreciation_amount: number;
    total_book_value: number;
  };

  voucher?: {
    voucher_number?: string;
    voucher_status?: string;
    expense_account_code?: string;
    accumulated_depr_account_code?: string;
  };

  items: {
    row_num: number;
    asset_code: string;
    asset_name: string;
    asset_group: string;
    utilization_date: string;
    original_value: number;
    useful_life: number;
    accumulated_before: number;
    amount: number;
    accumulated_after: number;
    book_value: number;
    status: string;
    error_msg?: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
}
