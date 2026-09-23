import { useState, useEffect, useMemo } from "react";
import { 
  FileSpreadsheet, Download, Save, AlertTriangle, Printer, RefreshCw, CheckCircle2,
  ChevronDown, ChevronLeft, Search, Layers, Scale, CreditCard, Coins, Landmark,
  Users, FileText, CheckSquare, PieChart, BarChart3, Activity, ShieldCheck, Eye, X
} from "lucide-react";
import api from "@/api";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { validateSanamaPerformanceForms } from "@/lib/sanamaPerformanceValidation";
import { fetchMoeinBalances, parseMoeinStringValue, updateSanamaFormsFromMoeinMap } from "@/lib/sanamaMoeinAutoSync";
import SanamaForm1ProgramExpense, { DEFAULT_PROGRAM_ROWS } from "../components/SanamaForm1ProgramExpense";
import SanamaForm2ChapterExpense, { INITIAL_CHAPTER_ROWS } from "../components/SanamaForm2ChapterExpense";
import SanamaForm8Resources, { INITIAL_FORM_8_ROWS } from "../components/SanamaForm8Resources";
import SanamaForm9NonDefinitePayments, { INITIAL_FORM_9_ROWS } from "../components/SanamaForm9NonDefinitePayments";
import SanamaForm10BUnconsumedFunds, { INITIAL_FORM_10B_ROWS } from "../components/SanamaForm10BUnconsumedFunds";
import SanamaForm10PChapterUnconsumed, { INITIAL_FORM_10P_ROWS } from "../components/SanamaForm10PChapterUnconsumed";
import SanamaForm11ObjectedAndDeficit, { INITIAL_FORM_11_ROWS } from "../components/SanamaForm11ObjectedAndDeficit";
import SanamaForm12StaffSalaries, { INITIAL_FORM_12_ROWS } from "../components/SanamaForm12StaffSalaries";
import SanamaForm13IslamicBonds, { INITIAL_FORM_13_ROWS } from "../components/SanamaForm13IslamicBonds";
import SanamaFormCapitalProjectSummary, { INITIAL_PROJECT_SUMMARY_ROWS } from "../components/SanamaFormCapitalProjectSummary";

// ─── توابع کمکی تبدیل و نمایش اعداد به فارسی ──────────────────────────────────────────
export function toPersianDigits(n) {
  if (n === null || n === undefined) return "";
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
}

export function formatPersianAmount(val) {
  if (val === null || val === undefined || val === "") return "۰";
  const num = Number(val);
  if (isNaN(num)) return toPersianDigits(val);
  return toPersianDigits(num.toLocaleString("fa-IR"));
}

export function PersianAmountInput({ value, onChange, className = "", disabled = false, textColor = "" }) {
  const displayVal = (value !== undefined && value !== null && value !== "")
    ? toPersianDigits(Number(value).toLocaleString("fa-IR"))
    : "۰";

  return (
    <Input
      type="text"
      dir="ltr"
      disabled={disabled}
      value={displayVal}
      onChange={(e) => {
        const raw = e.target.value
          .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
          .replace(/,/g, "")
          .replace(/\D/g, "");
        const num = raw ? Number(raw) : 0;
        onChange(num);
      }}
      className={cn("h-8 text-xs font-mono text-center font-bold", textColor, className)}
    />
  );
}

// ─── ثوابت اولیه فرم‌ها ──────────────────────────────────────────

const INITIAL_FORM1 = {
  initialBudget: 0,
  increase: 0,
  decrease: 0,
  drafts: 0,
  legalAdjustments: 0,
};

const INITIAL_FORM_4_6_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 0 },
  { id: 5, title: "پیش پرداخت", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 6, title: "پیش پرداخت اعتبار اسنادی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 7, title: "علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 8, title: "اسناد واخواهی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501", approvedAmount: 0 },
  { id: 9, title: "کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93501", approvedAmount: 0 },
  { id: 10, title: "وجوه انتقالی (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
  { id: 11, title: "اوراق انتقالی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_7_5_CAPITAL = [
  { id: 1, title: "بودجه اعتبار نهایی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "91002 / -94002", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "93002 / 97002 / 98002 / 99002 / 92502 / 93502", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "41003 / 81010 / 81017 / 81019 / -94002", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "99002", approvedAmount: 0 },
  { id: 5, title: "موجودی‌ها", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 6, title: "پیش پرداخت", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 7, title: "پیش پرداخت مواد و کالا", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 8, title: "پیش پرداخت اعتبار اسنادی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 9, title: "علی‌الحساب", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 10, title: "اسناد واخواهی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "92502", approvedAmount: 0 },
  { id: 11, title: "کسری ابواب جمعی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93502", approvedAmount: 0 },
  { id: 12, title: "وجوه انتقالی (محاسباتی)", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
  { id: 13, title: "اوراق انتقالی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

const INITIAL_FORM_8_RESOURCES = [
  { id: 1, resourceKind: "درآمد عمومی", expectedMoein: "81008", receivedMoein: "71001 / 81013", sentMoein: "71001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 2, resourceKind: "درآمد اختصاصی", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 3, resourceKind: "واگذاری دارایی مالی (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 4, resourceKind: "واگذاری دارایی سرمایه‌ای (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 5, resourceKind: "واگذاری دارایی سرمایه‌ای (اختصاصی)", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
];

const INITIAL_FORM_9 = {
  prepayments: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003", moeinCapital: "98004" },
  inventories: { initialBalance: 0, consumedTransferred: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003", moeinCapital: "98004" },
  onAccounts: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003", moeinCapital: "98004" }
};

const INITIAL_FORM_10 = [
  { id: 1, section: "وجوه انتقالی", initialBalance: 0, nonFinalPrevYears: 0, objectionDeficitPrevYears: 0, investmentsPrevYears: 0, transferredDraftsExpense: 94003, transferredDraftsCapital: 94004, receivedNotifiedBonds: "81010 / 81019 / 81017", consumedTransferred: 0, prepayments: 0, onAccounts: 0, sentToTreasury: 0, objectionTransferred: 92503, deficitTransferred: 93503, yearEndMoeinApproved: "91501 / 97003", yearEndMoeinNotified: "95003" },
  { id: 2, section: "سرمایه‌گذاری", initialBalance: 0, transferredFunds: 0, deficitTransferred: 93503, yearEndBalance: 0 }
];

const INITIAL_FORM_11 = [
  { id: 1, rowType: "سطر اسناد واخواهی شده", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, deficit: 0, moeinExpense: "92503", moeinCapital: "92504" },
  { id: 2, rowType: "سطر کسری ابواب جمعی (دارای مانده)", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "93503", yearEndMoeinCapital: "93504" },
  { id: 3, rowType: "سطر کسری ابواب جمعی برداشتی", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "81007", yearEndMoeinCapital: "81007" },
];

const INITIAL_FORM_13 = [
  { id: 1, rowType: "اوراق دریافتی", accountType: "o", creditType: "مصوب / ابلاغی", moeinExpenseApproved: "41001 / 41006 / 81010 / 81017 / -94001", moeinExpenseNotified: "81010 / 81017", moeinCapitalApproved: "41003 / 81010 / 81017 / -94002", moeinCapitalNotified: "81010 / 81017", amount: 0 },
  { id: 2, rowType: "اوراق واگذار شده", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "99001 / 98001 / 92501 / 93501", moeinExpenseNotified: "", moeinCapitalApproved: "99002 / 98002 / 92502 / 93502", moeinCapitalNotified: "", amount: 0 },
  { id: 3, rowType: "اوراق مصرف نشده (قفل)", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "قفل شده", moeinExpenseNotified: "", moeinCapitalApproved: "قفل شده", moeinCapitalNotified: "", amount: 0 },
  { id: 4, rowType: "اوراق انتقالی", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "81010", moeinExpenseNotified: "81010", moeinCapitalApproved: "81010", moeinCapitalNotified: "81010", amount: 0 },
];

// ─── ساختار گروه‌های اصلی ۴گانه فرم‌های عملکردی ──────────────────────────────────────────

const PERFORMANCE_FORM_CATEGORIES = [
  {
    id: "expense_public",
    title: "فرم های عملکرد اعتبارات هزینه-عمومی",
    badge: "اعتبارات هزینه‌ای عمومی",
    colorTheme: "blue",
    forms: [
      { id: "form_prog_exp_pub", code: "فرم ۱", title: "فرم خلاصه عملکرد اعتبارات بر حسب برنامه", icon: Layers, desc: "خلاصه عملکرد اعتبارات بر حسب برنامه مصوب و ابلاغی" },
      { id: "form_chap_exp_pub", code: "فرم ۲", title: "فرم خلاصه عملکرد اعتبارات بر حسب فصل", icon: BarChart3, desc: "تفکیک عملکرد اعتبارات هزینه‌ای بر حسب ۷ فصل بودجه‌ای" },
      { id: "form_8_exp_pub", code: "فرم ۸", title: "صورت حساب منابع - فرم 8", icon: Landmark, desc: "صورت حساب دریافت‌ها و پرداخت‌های منابع عمومی خزانه" },
      { id: "form_9_exp_pub", code: "فرم ۹", title: "پرداخت های غیرقطعی - فرم 9", icon: FileText, desc: "پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب‌های هزینه‌ای" },
      { id: "form_10_b_exp_pub", code: "فرم ۱۰-ب", title: "وجوه مصرف نشده - فرم 10 - (ب)", icon: Coins, desc: "مانده وجوه مصرف نشده و انتقالی اعتبارات هزینه عمومی" },
      { id: "form_10_p_exp_pub", code: "فرم ۱۰-پ", title: "وجوه مصرف نشده - فرم 10 - (پ) فصلی", icon: PieChart, desc: "گزارش فصلی وجوه مصرف نشده و برگشتی به خزانه" },
      { id: "form_11_exp_pub", code: "فرم ۱۱", title: "فرم اسناد واخواهی شده و کسری ابواب جمعی - فرم 11", icon: ShieldCheck, desc: "اسناد واخواهی دیوان محاسبات و مانده کسری ابواب جمعی" },
      { id: "form_12_exp_pub", code: "فرم ۱۲", title: "عملکرد حقوق و مزایای مستمر کارکنان - فرم 12", icon: Users, desc: "عملکرد پرداخت حقوق و مزایای مستمر کارکنان شاغل" },
      { id: "form_13_exp_pub", code: "فرم ۱۳", title: "عملکرد اوراق اسلامی - فرم 13", icon: CreditCard, desc: "اوراق مالی اسلامی دریافتی، واگذار شده و انتقالی" },
    ]
  },
  {
    id: "expense_dedicated",
    title: "فرم های عملکرد اعتبارات هزینه-اختصاصی",
    badge: "اعتبارات هزینه‌ای اختصاصی",
    colorTheme: "amber",
    forms: [
      { id: "form_prog_exp_ded", code: "فرم ۱", title: "فرم خلاصه عملکرد اعتبارات بر حسب برنامه", icon: Layers, desc: "خلاصه عملکرد اعتبارات بر حسب برنامه از محل درآمدهای اختصاصی" },
      { id: "form_chap_exp_ded", code: "فرم ۲", title: "فرم خلاصه عملکرد اعتبارات بر حسب فصل", icon: BarChart3, desc: "تفکیک عملکرد اعتبارات اختصاصی بر حسب فصول هزینه" },
      { id: "form_8_exp_ded", code: "فرم ۸", title: "صورت حساب منابع - فرم 8", icon: Landmark, desc: "صورت حساب وصولی‌ها و واریزی‌های درآمد اختصاصی" },
      { id: "form_9_exp_ded", code: "فرم ۹", title: "پرداخت های غیرقطعی - فرم 9", icon: FileText, desc: "پرداخت‌های غیرقطعی، پیش‌پرداخت و علی‌الحساب اختصاصی" },
      { id: "form_10_b_exp_ded", code: "فرم ۱۰-ب", title: "وجوه مصرف نشده - فرم 10 - (ب)", icon: Coins, desc: "وجوه مصرف نشده اعتبارات هزینه‌ای اختصاصی" },
      { id: "form_10_p_exp_ded", code: "فرم ۱۰-پ", title: "وجوه مصرف نشده - فرم 10 - (پ) فصلی", icon: PieChart, desc: "وجوه مصرف نشده فصلی اعتبارات اختصاصی" },
      { id: "form_11_exp_ded", code: "فرم ۱۱", title: "فرم اسناد واخواهی شده و کسری ابواب جمعی - فرم 11", icon: ShieldCheck, desc: "واخواهی‌ها و کسری ابواب جمعی اعتبارات اختصاصی" },
      { id: "form_12_exp_ded", code: "فرم ۱۲", title: "عملکرد حقوق و مزایای مستمر کارکنان - فرم 12", icon: Users, desc: "پرداخت حقوق کارکنان از محل اعتبارات اختصاصی" },
    ]
  },
  {
    id: "capital_public",
    title: "فرم های عملکرد تملک دارایی های سرمایه ای-عمومی",
    badge: "تملک دارایی سرمایه‌ای عمومی",
    colorTheme: "emerald",
    forms: [
      { id: "form_proj_cap_pub", code: "خلاصه طرح", title: "خلاصه عملکرد اعتبارات طرح", icon: Layers, desc: "خلاصه عملکرد اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای عمومی" },
      { id: "form_8_cap_pub", code: "فرم ۸", title: "صورت حساب منابع - فرم 8", icon: Landmark, desc: "منابع دریافتی طرح‌های تملک سرمایه‌ای از خزانه" },
      { id: "form_9_cap_pub", code: "فرم ۹", title: "پرداخت های غیرقطعی - فرم 9", icon: FileText, desc: "پیش‌پرداخت‌ها و علی‌الحساب پیمانکاران طرح‌های تملک" },
      { id: "form_10_b_cap_pub", code: "فرم ۱۰-ب", title: "وجوه مصرف نشده - فرم 10 - (ب)", icon: Coins, desc: "مانده وجوه مصرف نشده طرح‌های تملک سرمایه‌ای عمومی" },
      { id: "form_10_p_cap_pub", code: "فرم ۱۰-پ", title: "وجوه مصرف نشده - فرم 10 - (پ) فصلی", icon: PieChart, desc: "مانده فصلی وجوه تملک سرمایه‌ای سالانه" },
      { id: "form_11_cap_pub", code: "فرم ۱۱", title: "فرم اسناد واخواهی شده و کسری ابواب جمعی - فرم 11", icon: ShieldCheck, desc: "اسناد واخواهی شده پروژه‌های عمرانی و سرمایه‌ای" },
      { id: "form_13_cap_pub", code: "فرم ۱۳", title: "عملکرد اوراق مالی اسلامی - فرم 13", icon: CreditCard, desc: "اوراق اسلامی اختصاص داده شده به طرح‌های سرمایه‌ای" },
    ]
  },
  {
    id: "capital_dedicated",
    title: "فرم های عملکرد تملک دارایی های سرمایه ای-اختصاصی",
    badge: "تملک دارایی سرمایه‌ای اختصاصی",
    colorTheme: "purple",
    forms: [
      { id: "form_proj_cap_ded", code: "خلاصه طرح", title: "خلاصه عملکرد اعتبارات طرح", icon: Layers, desc: "خلاصه عملکرد اعتبارات طرح‌های تملک از محل درآمد اختصاصی" },
      { id: "form_8_cap_ded", code: "فرم ۸", title: "صورت حساب منابع - فرم 8", icon: Landmark, desc: "صورت حساب منابع طرح‌های اختصاصی" },
      { id: "form_9_cap_ded", code: "فرم ۹", title: "پرداخت های غیرقطعی - فرم 9", icon: FileText, desc: "پرداخت‌های غیرقطعی طرح‌های تملک اختصاصی" },
      { id: "form_10_b_cap_ded", code: "فرم ۱۰-ب", title: "وجوه مصرف نشده - فرم 10 - (ب)", icon: Coins, desc: "وجوه مصرف نشده تملک سرمایه‌ای اختصاصی" },
      { id: "form_10_p_cap_ded", code: "فرم ۱۰-پ", title: "وجوه مصرف نشده - فرم 10 - (پ) فصلی", icon: PieChart, desc: "وجوه مصرف نشده فصلی طرح‌های تملک اختصاصی" },
      { id: "form_11_cap_ded", code: "فرم ۱۱", title: "فرم اسناد واخواهی شده و کسری ابواب جمعی - فرم 11", icon: ShieldCheck, desc: "اسناد واخواهی طرح‌های اختصاصی سرمایه‌ای" },
      { id: "form_13_cap_ded", code: "فرم ۱۳", title: "عملکرد اوراق مالی اسلامی - فرم 13", icon: CreditCard, desc: "اوراق تسویه و مالی تملک اختصاصی" },
    ]
  }
];

export default function SanamaFormsViewer() {
  const [activeCategoryId, setActiveCategoryId] = useState("expense_public");
  const [openAccordions, setOpenAccordions] = useState({
    expense_public: false,
    expense_dedicated: false,
    capital_public: false,
    capital_dedicated: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [fiscalYear, setFiscalYear] = useState("1404");
  const [period, setPeriod] = useState("all");
  const [selectedFormForModal, setSelectedFormForModal] = useState(null);

  // داده‌های اولیه
  const [form1ProgramRows, setForm1ProgramRows] = useState(DEFAULT_PROGRAM_ROWS);
  const [form2ChapterRows, setForm2ChapterRows] = useState(INITIAL_CHAPTER_ROWS);
  const [form8ResourceRows, setForm8ResourceRows] = useState(INITIAL_FORM_8_ROWS);
  const [form9PaymentRows, setForm9PaymentRows] = useState(INITIAL_FORM_9_ROWS);
  const [form10BRows, setForm10BRows] = useState(INITIAL_FORM_10B_ROWS);
  const [form10PRows, setForm10PRows] = useState(INITIAL_FORM_10P_ROWS);
  const [form11ObjectedRows, setForm11ObjectedRows] = useState(INITIAL_FORM_11_ROWS);
  const [form12SalaryRows, setForm12SalaryRows] = useState(INITIAL_FORM_12_ROWS);
  const [form13BondRows, setForm13BondRows] = useState(INITIAL_FORM_13_ROWS);
  const [formProjCapRows, setFormProjCapRows] = useState(INITIAL_PROJECT_SUMMARY_ROWS);
  const [form1Data, setForm1Data] = useState(INITIAL_FORM1);
  const [form46Data, setForm46Data] = useState(INITIAL_FORM_4_6_EXPENSE);
  const [form75Data, setForm75Data] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form8Data, setForm8Data] = useState(INITIAL_FORM_8_RESOURCES);
  const [form9Data, setForm9Data] = useState(INITIAL_FORM_9);
  const [form10Data, setForm10Data] = useState(INITIAL_FORM_10);
  const [form11Data, setForm11Data] = useState(INITIAL_FORM_11);
  const [form13Data, setForm13Data] = useState(INITIAL_FORM_13);

  const [auditErrors, setAuditErrors] = useState([]);
  const [moeinBalancesMap, setMoeinBalancesMap] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("");

  const toggleAccordion = (catId) => {
    setOpenAccordions(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleAutoSyncFromLedger = async (explicitMessage = true) => {
    setIsSyncing(true);
    try {
      const moeinMap = await fetchMoeinBalances();
      setMoeinBalancesMap(moeinMap);

      const updated = updateSanamaFormsFromMoeinMap(moeinMap, {
        form1Data,
        form46Data,
        form75Data,
        form8Data,
        form9Data,
        form10Data,
        form11Data,
        form13Data,
      });

      if (updated.form1Data) setForm1Data(updated.form1Data);
      if (updated.form46Data) setForm46Data(updated.form46Data);
      if (updated.form75Data) setForm75Data(updated.form75Data);
      if (updated.form8Data) setForm8Data(updated.form8Data);
      if (updated.form9Data) setForm9Data(updated.form9Data);
      if (updated.form10Data) setForm10Data(updated.form10Data);
      if (updated.form11Data) setForm11Data(updated.form11Data);
      if (updated.form13Data) setForm13Data(updated.form13Data);

      setLastSyncTime(new Date().toLocaleTimeString("fa-IR"));

      if (explicitMessage) {
        alert("اطلاعات تمامی فرم‌های عملکردی با موفقیت از تراز ۸ ستونی کل و اسناد حسابداری بروزرسانی گردید.");
      }
    } catch (err) {
      console.error("خطا در فراخوانی کدهای معین اسناد:", err);
      if (explicitMessage) {
        alert("خطا در به روزرسانی فرم‌ها از تراز ۸ ستونی اسناد مالی");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const loadSavedFormsAndSync = async () => {
      try {
        const res = await api.get("/api/credits/sanama-forms");
        let loadedForms = {};
        if (res.data?.data) {
          const d = res.data.data;
          if (d.form1Data && typeof d.form1Data === "object") setForm1Data(prev => ({ ...INITIAL_FORM1, ...d.form1Data }));
          if (Array.isArray(d.form46Data) && d.form46Data.length > 0) setForm46Data(d.form46Data);
          if (Array.isArray(d.form75CapData || d.form75Data) && (d.form75CapData || d.form75Data).length > 0) setForm75Data(d.form75CapData || d.form75Data);
          if (Array.isArray(d.form8Data) && d.form8Data.length > 0) setForm8Data(d.form8Data);
          if (d.form9Data && typeof d.form9Data === "object") {
            setForm9Data({
              prepayments: { ...INITIAL_FORM_9.prepayments, ...(d.form9Data.prepayments || {}) },
              inventories: { ...INITIAL_FORM_9.inventories, ...(d.form9Data.inventories || {}) },
              onAccounts: { ...INITIAL_FORM_9.onAccounts, ...(d.form9Data.onAccounts || {}) }
            });
          }
          if (Array.isArray(d.form10Data) && d.form10Data.length > 0) setForm10Data(d.form10Data);
          if (Array.isArray(d.form11Data) && d.form11Data.length > 0) setForm11Data(d.form11Data);
          if (Array.isArray(d.form13Data) && d.form13Data.length > 0) setForm13Data(d.form13Data);
          loadedForms = d;
        }

        const moeinMap = await fetchMoeinBalances();
        setMoeinBalancesMap(moeinMap);
        const updated = updateSanamaFormsFromMoeinMap(moeinMap, {
          form1Data: loadedForms.form1Data || INITIAL_FORM1,
          form46Data: loadedForms.form46Data || INITIAL_FORM_4_6_EXPENSE,
          form75Data: loadedForms.form75CapData || loadedForms.form75Data || INITIAL_FORM_7_5_CAPITAL,
          form8Data: loadedForms.form8Data || INITIAL_FORM_8_RESOURCES,
          form9Data: loadedForms.form9Data || INITIAL_FORM_9,
          form10Data: loadedForms.form10Data || INITIAL_FORM_10,
          form11Data: loadedForms.form11Data || INITIAL_FORM_11,
          form13Data: loadedForms.form13Data || INITIAL_FORM_13,
        });

        if (updated.form1Data) setForm1Data(updated.form1Data);
        if (updated.form46Data) setForm46Data(updated.form46Data);
        if (updated.form75Data) setForm75Data(updated.form75Data);
        if (updated.form8Data) setForm8Data(updated.form8Data);
        if (updated.form9Data) setForm9Data(updated.form9Data);
        if (updated.form10Data) setForm10Data(updated.form10Data);
        if (updated.form11Data) setForm11Data(updated.form11Data);
        if (updated.form13Data) setForm13Data(updated.form13Data);

        setLastSyncTime(new Date().toLocaleTimeString("fa-IR"));
      } catch (e) {
        console.error("خطا در دریافت اولیه اطلاعات فرم‌ها:", e);
      }
    };
    loadSavedFormsAndSync();
  }, []);

  const activeCategory = useMemo(() => {
    return PERFORMANCE_FORM_CATEGORIES.find(c => c.id === activeCategoryId) || PERFORMANCE_FORM_CATEGORIES[0];
  }, [activeCategoryId]);

  const filteredForms = useMemo(() => {
    if (!searchTerm.trim()) return activeCategory.forms;
    const q = searchTerm.trim().toLowerCase();
    return activeCategory.forms.filter(f => 
      f.title.toLowerCase().includes(q) || 
      f.code.toLowerCase().includes(q) || 
      f.desc.toLowerCase().includes(q)
    );
  }, [activeCategory, searchTerm]);

  const handleExportPDF = (formTitle) => {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8" />
        <title>${formTitle || "گزارش فرم عملکرد"}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Tahoma, Vazir, sans-serif; font-size: 11px; direction: rtl; color: #111; padding: 20px; }
          .hdr { border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
          .hdr h1 { font-size: 18px; color: #1e3a8a; margin: 0 0 5px 0; }
          .hdr p { font-size: 11px; color: #475569; margin: 0; }
          .info-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #94a3b8; padding: 8px; text-align: right; font-size: 10px; }
          th { background: #f1f5f9; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 9px; color: #64748b; text-align: left; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <h1>وزارت امور اقتصادی و دارایی - خزانه‌داری کل کشور</h1>
          <p>سامانه جامع مالی و حسابداری عمومی — ${formTitle || "فرم عملکردی"}</p>
        </div>
        <div class="info-box">
          <strong>دسته‌بندی اعتبارات:</strong> ${activeCategory.title}<br/>
          <strong>سال مالی:</strong> ${toPersianDigits(fiscalYear)} | <strong>دوره:</strong> ${period === "all" ? "کامل سالانه" : period}<br/>
          <strong>منبع داده:</strong> تراز ۸ ستونی کل / معین اسناد مالی
        </div>
        <table>
          <thead>
            <tr>
              <th>ردیف</th>
              <th>عنوان</th>
              <th>معین / مرجع تراز ۸ ستونی</th>
              <th>اعتبار مصوب (ریال)</th>
              <th>تخصیص یافته (ریال)</th>
              <th>عملکرد / مصرف (ریال)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>۱</td>
              <td>سرفصل‌های عملکردی متصل به تراز ۸ ستونی</td>
              <td>۹۱..., ۹۲..., ۹۳..., ۹۸..., ۹۹...</td>
              <td>${formatPersianAmount(1000000000)}</td>
              <td>${formatPersianAmount(850000000)}</td>
              <td>${formatPersianAmount(720000000)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">تولید شده توسط سامانه مالیه عمومی — تاریخ: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 400);
          };
        </script>
      </body>
      </html>
    `);
  };

  return (
    <PageShell>
      <PageHeader
        title="فرم‌های عملکرد اعتبارات (تراز ۸ ستونی)"
        description="مشاهده، کنترل و فراخوانی داده‌های فرم‌های عملکرد اعتبارات عمومی/اختصاصی هزینه‌ای و تملک دارایی‌های سرمایه‌ای بر اساس تراز ۸ ستونی"
        icon={FileSpreadsheet}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleAutoSyncFromLedger(true)}
              disabled={isSyncing}
              className="text-xs font-bold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "در حال دریافت..." : "فراخوانی از تراز ۸ ستونی"}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportPDF("کلیه فرم‌های عملکرد اعتبارات")}
              className="text-xs font-bold gap-1.5 h-8 border-slate-300"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>چاپ / PDF</span>
            </Button>
          </div>
        }
      />

      {/* ─── نوار فیلتر سال مالی، دوره و نشانگر همگام‌سازی ─── */}
      <Card className="border border-primary/20 bg-muted/20 shadow-xs mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Scale className="h-4 w-4" />
              <span>منبع اطلاعات فرم‌ها: تراز ۸ ستونی کل / اسناد مالی</span>
              {lastSyncTime && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px]">
                  بروزرسانی: {lastSyncTime}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* سال مالی */}
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-bold text-foreground">سال مالی:</Label>
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(e.target.value)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="1401">سال مالی ۱۴۰۱</option>
                  <option value="1402">سال مالی ۱۴۰۲</option>
                  <option value="1403">سال مالی ۱۴۰۳</option>
                  <option value="1404">سال مالی ۱۴۰۴</option>
                  <option value="1405">سال مالی ۱۴۰۵</option>
                </select>
              </div>

              {/* دوره گزارش‌گیری */}
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-bold text-foreground">دوره گزارش:</Label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-input bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">تمامی دوره‌ها (سالانه کامل)</option>
                  <option value="سه ماهه اول">سه ماهه اول</option>
                  <option value="سه ماهه دوم">سه ماهه دوم</option>
                  <option value="سه ماهه سوم">سه ماهه سوم</option>
                  <option value="سه ماهه چهارم">سه ماهه چهارم</option>
                  <option value="شش ماهه اول">شش ماهه اول</option>
                  <option value="شش ماهه دوم">شش ماهه دوم</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── بدنه اصلی ۲ ستونی (منوی آکاردئونی راست + گرید کارت‌های مرکز) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ════════════════════════ پنل سمت راست (منوی آکاردئونی) ════════════════════════ */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-3">
          <Card className="border border-border/80 shadow-xs bg-card">
            <CardHeader className="p-3 bg-muted/40 border-b pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold text-foreground">
                    فرم‌های عملکرد اعتبارات
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {PERFORMANCE_FORM_CATEGORIES.reduce((acc, c) => acc + c.forms.length, 0)} فرم
                </Badge>
              </div>

              {/* باکس جستجو */}
              <div className="relative mt-2">
                <Search className="h-3.5 w-3.5 absolute right-2.5 top-2.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="جستجوی فرم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 text-xs pr-8 bg-background"
                />
              </div>
            </CardHeader>

            <CardContent className="p-2 space-y-2">
              {PERFORMANCE_FORM_CATEGORIES.map((category) => {
                const isOpen = openAccordions[category.id];
                const isSelectedCategory = activeCategoryId === category.id;

                return (
                  <div 
                    key={category.id} 
                    className={cn(
                      "rounded-lg border transition-all duration-200 overflow-hidden",
                      isSelectedCategory 
                        ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20" 
                        : "border-border/60 hover:border-border"
                    )}
                  >
                    {/* هدر آکاردئون */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCategoryId(category.id);
                        toggleAccordion(category.id);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 text-right transition-colors cursor-pointer select-none",
                        isSelectedCategory ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-primary shrink-0 transition-transform duration-200" />
                        ) : (
                          <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200" />
                        )}
                        <span className="text-xs font-bold line-clamp-1">{category.title}</span>
                      </div>
                      <Badge 
                        variant={isSelectedCategory ? "default" : "secondary"} 
                        className="text-[10px] font-mono shrink-0 px-1.5 h-5"
                      >
                        {toPersianDigits(category.forms.length)}
                      </Badge>
                    </button>

                    {/* لیست فرم‌های زیرمجموعه آکاردئون */}
                    {isOpen && (
                      <div className="p-1.5 space-y-1 bg-background/50 border-t border-border/40">
                        {category.forms.map((formItem) => {
                          const FormIcon = formItem.icon;
                          return (
                            <div
                              key={formItem.id}
                              onClick={() => {
                                setActiveCategoryId(category.id);
                                setSelectedFormForModal({ ...formItem, categoryTitle: category.title });
                              }}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-all duration-150 group",
                                "hover:bg-primary/10 hover:text-primary",
                                isSelectedCategory ? "text-foreground font-medium" : "text-muted-foreground"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FormIcon className="h-3.5 w-3.5 text-primary/70 shrink-0 group-hover:text-primary" />
                                <span className="truncate text-[11px]">{formItem.title}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                                {formItem.code}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ════════════════════════ بخش مرکزی (کارت‌های فرم‌های دسته فعال) ════════════════════════ */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">

          {/* هدر بنر دسته فعال */}
          <Card className="border border-primary/30 bg-gradient-to-r from-primary/5 via-background to-muted/30 shadow-xs">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary text-primary-foreground shadow-xs">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground">
                      {activeCategory.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      تعداد {toPersianDigits(filteredForms.length)} فرم فعال متصل به تراز ۸ ستونی
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="default" className="text-xs font-bold px-3 py-1">
                  {activeCategory.badge}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* گرید کارت‌های فرم‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredForms.map((formItem) => {
              const FormIcon = formItem.icon;
              return (
                <Card
                  key={formItem.id}
                  onClick={() => setSelectedFormForModal({ ...formItem, categoryTitle: activeCategory.title })}
                  className={cn(
                    "group cursor-pointer transition-all duration-200 border border-border/80 hover:border-primary/60 hover:shadow-md bg-card relative overflow-hidden flex flex-col justify-between"
                  )}
                >
                  <CardHeader className="p-3.5 pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        <FormIcon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono bg-muted/50 border-primary/20">
                        {formItem.code}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-2">
                        {formItem.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {formItem.desc}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3.5 pt-0 mt-2">
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3 text-emerald-600" />
                        تراز ۸ ستونی:
                      </span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded text-[10px]">
                        فعال و متصل
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-bold h-7 gap-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>مشاهده فرم</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>
      </div>

      {/* ════════════════════════ مدال پیش‌نمایش و کنترل فرم ════════════════════════ */}
      {selectedFormForModal && (() => {
        const isForm1 = selectedFormForModal.id === "form_prog_exp_pub" || 
                        selectedFormForModal.id === "form_prog_exp_ded" || 
                        (selectedFormForModal.code === "فرم ۱" && selectedFormForModal.title.includes("برنامه"));

        const isForm2 = selectedFormForModal.id === "form_chap_exp_pub" || 
                        selectedFormForModal.id === "form_chap_exp_ded" || 
                        (selectedFormForModal.code === "فرم ۲" && selectedFormForModal.title.includes("فصل"));

        const isForm8 = selectedFormForModal.id === "form_8_exp_pub" || 
                        selectedFormForModal.id === "form_8_exp_ded" || 
                        selectedFormForModal.id === "form_8_cap_pub" || 
                        selectedFormForModal.id === "form_8_cap_ded" || 
                        (selectedFormForModal.code === "فرم ۸" && selectedFormForModal.title.includes("منابع"));

        const isForm9 = selectedFormForModal.id === "form_9_exp_pub" || 
                        selectedFormForModal.id === "form_9_exp_ded" || 
                        selectedFormForModal.id === "form_9_cap_pub" || 
                        selectedFormForModal.id === "form_9_cap_ded" || 
                        (selectedFormForModal.code === "فرم ۹" && selectedFormForModal.title.includes("غیرقطعی"));

        const isForm10B = selectedFormForModal.id === "form_10_b_exp_pub" || 
                          selectedFormForModal.id === "form_10_b_exp_ded" || 
                          selectedFormForModal.id === "form_10_b_cap_pub" || 
                          selectedFormForModal.id === "form_10_b_cap_ded" || 
                          (selectedFormForModal.code === "فرم ۱۰-ب" && selectedFormForModal.title.includes("مصرف نشده"));

        const isForm10P = selectedFormForModal.id === "form_10_p_exp_pub" || 
                          selectedFormForModal.id === "form_10_p_exp_ded" || 
                          selectedFormForModal.id === "form_10_p_cap_pub" || 
                          selectedFormForModal.id === "form_10_p_cap_ded" || 
                          (selectedFormForModal.code === "فرم ۱۰-پ" && selectedFormForModal.title.includes("فصلی"));

        const isForm11 = selectedFormForModal.id === "form_11_exp_pub" || 
                         selectedFormForModal.id === "form_11_exp_ded" || 
                         selectedFormForModal.id === "form_11_cap_pub" || 
                         selectedFormForModal.id === "form_11_cap_ded" || 
                         (selectedFormForModal.code === "فرم ۱۱" && selectedFormForModal.title.includes("واخواهی"));

        const isForm12 = selectedFormForModal.id === "form_12_exp_pub" || 
                         selectedFormForModal.id === "form_12_exp_ded" || 
                         (selectedFormForModal.code === "فرم ۱۲" && selectedFormForModal.title.includes("حقوق"));

        const isForm13 = selectedFormForModal.id === "form_13_exp_pub" || 
                         selectedFormForModal.id === "form_13_exp_ded" || 
                         selectedFormForModal.id === "form_13_cap_pub" || 
                         selectedFormForModal.id === "form_13_cap_ded" || 
                         (selectedFormForModal.code === "فرم ۱۳" && selectedFormForModal.title.includes("اوراق"));

        const isFormProjCap = selectedFormForModal.id === "form_proj_cap_pub" || 
                              selectedFormForModal.id === "form_proj_cap_ded" || 
                              (selectedFormForModal.code === "خلاصه طرح" && selectedFormForModal.title.includes("طرح"));

        return (
          <Modal
            open={Boolean(selectedFormForModal)}
            onClose={() => setSelectedFormForModal(null)}
            title={selectedFormForModal.title}
            description={`${selectedFormForModal.categoryTitle} | سال مالی ${toPersianDigits(fiscalYear)} | دوره: ${period === "all" ? "کامل" : period}`}
            size={isForm1 || isForm2 || isForm8 || isForm9 || isForm10B || isForm10P || isForm11 || isForm12 || isForm13 || isFormProjCap ? "full" : "xl"}
          >
            {isForm1 ? (
              <div className="space-y-4">
                <SanamaForm1ProgramExpense
                  rows={form1ProgramRows}
                  onChange={setForm1ProgramRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm2 ? (
              <div className="space-y-4">
                <SanamaForm2ChapterExpense
                  rows={form2ChapterRows}
                  onChange={setForm2ChapterRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm8 ? (
              <div className="space-y-4">
                <SanamaForm8Resources
                  rows={form8ResourceRows}
                  onChange={setForm8ResourceRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm9 ? (
              <div className="space-y-4">
                <SanamaForm9NonDefinitePayments
                  rows={form9PaymentRows}
                  onChange={setForm9PaymentRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm10B ? (
              <div className="space-y-4">
                <SanamaForm10BUnconsumedFunds
                  rows={form10BRows}
                  onChange={setForm10BRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm10P ? (
              <div className="space-y-4">
                <SanamaForm10PChapterUnconsumed
                  rows={form10PRows}
                  onChange={setForm10PRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm11 ? (
              <div className="space-y-4">
                <SanamaForm11ObjectedAndDeficit
                  rows={form11ObjectedRows}
                  onChange={setForm11ObjectedRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm12 ? (
              <div className="space-y-4">
                <SanamaForm12StaffSalaries
                  rows={form12SalaryRows}
                  onChange={setForm12SalaryRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isForm13 ? (
              <div className="space-y-4">
                <SanamaForm13IslamicBonds
                  rows={form13BondRows}
                  onChange={setForm13BondRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : isFormProjCap ? (
              <div className="space-y-4">
                <SanamaFormCapitalProjectSummary
                  rows={formProjCapRows}
                  onChange={setFormProjCapRows}
                  moeinBalancesMap={moeinBalancesMap}
                  onSyncMoein={handleAutoSyncFromLedger}
                  fiscalYear={fiscalYear}
                  period={period}
                />
                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            ) : (
              <div className="space-y-4">
                {/* پیام اطلاع‌رسانی اتصال به تراز ۸ ستونی */}
                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 text-blue-900 dark:text-blue-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      اطلاعات این فرم مستقیماً از **تراز ۸ ستونی کل** و کدهای معین اسناد مالی فراخوانی و محاسبه می‌گردد.
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-background text-[10px] font-bold shrink-0">
                    منبع: اسناد دفتر معین
                  </Badge>
                </div>

                {/* کارت خلاصه آمار عملکردی تراز ۸ ستونی */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                    <div className="text-[11px] font-semibold text-emerald-800">اعتبار مصوب نهایی (تراز)</div>
                    <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                      {formatPersianAmount(moeinBalancesMap["91001"] || form1Data.initialBudget || 0)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                    <div className="text-[11px] font-semibold text-blue-800">اعتبار تخصیص یافته (تراز)</div>
                    <div className="text-sm font-mono font-bold text-blue-700 mt-1">
                      {formatPersianAmount(moeinBalancesMap["93001"] || 0)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                    <div className="text-[11px] font-semibold text-amber-800">عملکرد / مصرف شده</div>
                    <div className="text-sm font-mono font-bold text-amber-700 mt-1">
                      {formatPersianAmount(moeinBalancesMap["99001"] || 0)} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-center">
                    <div className="text-[11px] font-semibold text-purple-800">مانده پایان سال</div>
                    <div className="text-sm font-mono font-bold text-purple-700 mt-1">
                      {formatPersianAmount((moeinBalancesMap["91001"] || 0) - (moeinBalancesMap["99001"] || 0))} <span className="text-[10px]">ریال</span>
                    </div>
                  </div>
                </div>

                {/* باکس اطلاعات توضیحی و پیش‌نمایش فرم */}
                <Card className="border border-dashed border-border/80 bg-muted/10">
                  <CardContent className="p-5 text-center space-y-3">
                    <FileSpreadsheet className="h-10 w-10 text-primary mx-auto opacity-70" />
                    <h4 className="text-xs font-bold text-foreground">
                      ساختار و جداول تفصیلی {selectedFormForModal.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground max-w-lg mx-auto leading-relaxed">
                      تمامی سطرها، فصول و ردیف‌های محاسباتی این فرم متصل به کدهای معین تراز ۸ ستونی هستند. مقادیر تفصیلی جداول در ادامه بر اساس دستورالعمل و توضیحات تکمیلی شما نهایی خواهند شد.
                    </p>
                  </CardContent>
                </Card>

                <ModalFooter>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFormForModal(null)}
                    className="text-xs font-bold"
                  >
                    بستن
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPDF(selectedFormForModal.title)}
                    className="text-xs font-bold gap-1 bg-primary text-primary-foreground"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / خروجی PDF</span>
                  </Button>
                </ModalFooter>
              </div>
            )}
          </Modal>
        );
      })()}
    </PageShell>
  );
}
