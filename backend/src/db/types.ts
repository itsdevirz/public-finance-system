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
