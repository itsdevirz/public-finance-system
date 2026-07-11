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

export interface ContractPayment {
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
  payments?: ContractPayment[];
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
  status: "draft" | "confirmed" | "allocated" | "delegated";
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
