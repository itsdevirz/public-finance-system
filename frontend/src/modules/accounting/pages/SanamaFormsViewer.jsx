import { useState, useEffect } from "react";
import {
  FileSpreadsheet, Download, Save, CheckCircle2, AlertTriangle,
  RefreshCw, Layers, Calculator, HelpCircle, Eye, Printer, Filter, ShieldCheck
} from "lucide-react";
import api from "@/api";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { validateSanamaPerformanceForms } from "@/lib/sanamaPerformanceValidation";

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

// ─── ثوابت و مقادیر اولیه فرم‌های سناما ──────────────────────────────────────────

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

export default function SanamaFormsViewer() {
  const [activeTab, setActiveTab] = useState("form1");
  const [form1Data, setForm1Data] = useState(INITIAL_FORM1);
  const [form46Data, setForm46Data] = useState(INITIAL_FORM_4_6_EXPENSE);
  const [form75Data, setForm75Data] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form8Data, setForm8Data] = useState(INITIAL_FORM_8_RESOURCES);
  const [form9Data, setForm9Data] = useState(INITIAL_FORM_9);
  const [form10Data, setForm10Data] = useState(INITIAL_FORM_10);
  const [form11Data, setForm11Data] = useState(INITIAL_FORM_11);
  const [form13Data, setForm13Data] = useState(INITIAL_FORM_13);
  const [auditErrors, setAuditErrors] = useState([]);

  // بارگذاری فرم‌های ذخیره‌شده از دیتابیس واقعی
  useEffect(() => {
    const loadSavedForms = async () => {
      try {
        const res = await api.get("/api/credits/sanama-forms");
        if (res.data?.data) {
          const d = res.data.data;
          if (d.form1Data) setForm1Data(d.form1Data);
          if (d.form46Data) setForm46Data(d.form46Data);
          if (d.form75CapData || d.form75Data) setForm75Data(d.form75CapData || d.form75Data);
          if (d.form8Data) setForm8Data(d.form8Data);
          if (d.form9Data) setForm9Data(d.form9Data);
          if (d.form10Data) setForm10Data(d.form10Data);
          if (d.form11Data) setForm11Data(d.form11Data);
          if (d.form13Data) setForm13Data(d.form13Data);
        }
      } catch (e) {
        console.error("خطا در دریافت فرم‌های سناما از دیتابیس:", e);
      }
    };
    loadSavedForms();
  }, []);

  // فرمول‌های محاسباتی فرم ۱
  const calculatedForm1Final = form1Data.initialBudget + form1Data.legalAdjustments + form1Data.increase - form1Data.decrease - form1Data.drafts;

  // فرمول‌های محاسباتی فرم ۹ (وجوه انتقالی)
  const calculateForm9Transferred = (sec) => {
    return sec.initialBalance - (sec.consumedTransferred + (sec.inventory || 0) + sec.objectionTransferred + sec.deficitTransferred + sec.sentToTreasury + sec.yearEndBalance);
  };

  // فرمول‌های محاسباتی فرم ۴-۶
  const f46Received = form46Data.find(r => r.id === 3)?.approvedAmount || 0;
  const f46Consumed = form46Data.find(r => r.id === 4)?.approvedAmount || 0;
  const f46Prepay = form46Data.find(r => r.id === 5)?.approvedAmount || 0;
  const f46PrepayLetter = form46Data.find(r => r.id === 6)?.approvedAmount || 0;
  const f46OnAccount = form46Data.find(r => r.id === 7)?.approvedAmount || 0;
  const f46Objection = form46Data.find(r => r.id === 8)?.approvedAmount || 0;
  const f46Deficit = form46Data.find(r => r.id === 9)?.approvedAmount || 0;
  const f46Bonds = form46Data.find(r => r.id === 11)?.approvedAmount || 0;
  const calculatedF46Transferred = f46Received - (f46Consumed + f46Prepay + f46PrepayLetter + f46OnAccount + f46Objection + f46Deficit + f46Bonds);

  useEffect(() => {
    const auditPayload = [
      {
        id: "FORM-1",
        form_type: 1,
        credit_type: "مصوب",
        credit_location: "استانی",
        program_number: "10101",
        final_credit_budget: calculatedForm1Final,
        initial_credit_budget: form1Data.initialBudget,
        increase: form1Data.increase,
        decrease: form1Data.decrease,
        drafts: form1Data.drafts,
        legal_adjustments: form1Data.legalAdjustments,
        allocated_credit: form46Data.find(r => r.id === 2)?.approvedAmount || 0,
        received_credit: f46Received,
        consumed_credit: f46Consumed,
      },
      {
        id: "FORM-4-6",
        form_type: 4,
        credit_type: "ابلاغی",
        credit_location: "متمرکز",
        program_number: "10102",
        notifier_budget_row: "102000",
        executive_body_budget_row: "101000",
        final_credit_budget: form46Data.find(r => r.id === 1)?.approvedAmount || 0,
        allocated_credit: form46Data.find(r => r.id === 2)?.approvedAmount || 0,
        received_credit: f46Received,
        consumed_credit: f46Consumed,
      }
    ];

    const errs = validateSanamaPerformanceForms(auditPayload);
    setAuditErrors(errs);
  }, [form1Data, form46Data, form75Data, form9Data]);

  const handleExportExcel = () => {
    let title = "";
    let headers = [];
    let rows = [];

    if (activeTab === "form1") {
      title = "فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه";
      headers = ["عنوان ستون", "نوع حساب", "حساب معین", "سطوح تفصیلی", "مبلغ (ریال)"];
      rows = [
        ["بودجه اعتبار اولیه", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.initialBudget],
        ["افزایش (+)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.increase],
        ["کاهش (-)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.decrease],
        ["حواله (-)", "هزینه", "94001", "سطوح تفصیلی مطابق الزامات سناما", form1Data.drafts],
        ["بودجه اعتبار نهایی (محاسباتی)", "هزینه", "91001 / -94001", "مطابق الزامات پروتکل تبادل الکترونیکی", calculatedForm1Final]
      ];
    } else if (activeTab === "form46") {
      title = "فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین", "مبلغ (ریال)"];
      rows = form46Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF46Transferred : r.approvedAmount]);
    } else if (activeTab === "form75") {
      title = "فرم ۵-۷ — اعتبارات سرمایه‌ای (نوع حساب t)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form75Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.approvedAmount]);
    } else if (activeTab === "form8") {
      title = "فرم ۸ — منابع و درآمدهای عمومی و اختصاصی";
      headers = ["ردیف", "ماهیت منابع", "معین پیش‌بینی", "معین وصول", "معین ارسال به خزانه", "پیش‌بینی", "وصول", "ارسال به خزانه"];
      rows = form8Data.map(r => [r.id, r.resourceKind, r.expectedMoein, r.receivedMoein, r.sentMoein, r.expectedAmount, r.receivedAmount, r.sentAmount]);
    } else if (activeTab === "form9") {
      title = "فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب";
      headers = ["عنوان", "مانده ابتدای سال", "اعتبار انتقالی مصرف شده", "وجوه ارسالی به خزانه", "وجوه انتقالی (محاسباتی)", "مانده پایان سال"];
      rows = [
        ["پیش‌پرداخت‌ها", form9Data.prepayments.initialBalance, form9Data.prepayments.consumedTransferred, form9Data.prepayments.sentToTreasury, calculateForm9Transferred(form9Data.prepayments), form9Data.prepayments.yearEndBalance],
        ["موجودی‌ها", form9Data.inventories.initialBalance, form9Data.inventories.consumedTransferred, form9Data.inventories.sentToTreasury, calculateForm9Transferred(form9Data.inventories), form9Data.inventories.yearEndBalance],
        ["علی‌الحساب", form9Data.onAccounts.initialBalance, form9Data.onAccounts.consumedTransferred, form9Data.onAccounts.sentToTreasury, calculateForm9Transferred(form9Data.onAccounts), form9Data.onAccounts.yearEndBalance],
      ];
    } else if (activeTab === "form10") {
      title = "فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها";
      headers = ["عنوان بخش", "حواله انتقالی", "دریافتی از اعتبار انتقالی", "اعتبار مصرف شده", "مانده پایان سال"];
      rows = form10Data.map(r => [r.section, r.transferredDraftsExpense || r.transferredFunds, r.receivedNotifiedBonds || "-", r.consumedTransferred || "-", r.yearEndMoeinApproved || r.yearEndBalance || "-"]);
    } else if (activeTab === "form11") {
      title = "فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی";
      headers = ["عنوان سطر", "معین هزینه‌ای", "معین سرمایه‌ای", "مانده ابتدای سال", "مصرف شده", "ارسال به خزانه"];
      rows = form11Data.map(r => [r.rowType, r.moeinExpense || r.yearEndMoeinExpense, r.moeinCapital || r.yearEndMoeinCapital, r.initialBalance, r.consumedTransferred, r.sentToTreasury]);
    } else if (activeTab === "form13") {
      title = "فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی";
      headers = ["عنوان ستون", "نوع حساب", "معین هزینه‌ای مصوب", "معین سرمایه‌ای مصوب", "مبلغ اوراق (ریال)"];
      rows = form13Data.map(r => [r.rowType, r.accountType, r.moeinExpenseApproved, r.moeinCapitalApproved, r.amount]);
    }

    let csvContent = "\uFEFF";
    csvContent += `${title}\n\n`;
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

    rows.forEach(r => {
      csvContent += r.map(c => {
        if (typeof c === "number") return `"${toPersianDigits(c.toLocaleString("fa-IR"))}"`;
        return `"${toPersianDigits(c)}"`;
      }).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Sanama_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    let title = "";
    let headers = [];
    let rows = [];

    if (activeTab === "form1") {
      title = "فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه";
      headers = ["عنوان ستون", "نوع حساب", "حساب معین", "سطوح تفصیلی", "مبلغ (ریال)"];
      rows = [
        ["بودجه اعتبار اولیه", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.initialBudget],
        ["افزایش (+)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.increase],
        ["کاهش (-)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.decrease],
        ["حواله (-)", "هزینه", "94001", "سطوح تفصیلی مطابق الزامات سناما", form1Data.drafts],
        ["بودجه اعتبار نهایی (محاسباتی)", "هزینه", "91001 / -94001", "مطابق الزامات پروتکل تبادل الکترونیکی", calculatedForm1Final]
      ];
    } else if (activeTab === "form46") {
      title = "فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین", "مبلغ (ریال)"];
      rows = form46Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF46Transferred : r.approvedAmount]);
    } else if (activeTab === "form75") {
      title = "فرم ۵-۷ — اعتبارات سرمایه‌ای (نوع حساب t)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form75Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.approvedAmount]);
    } else if (activeTab === "form8") {
      title = "فرم ۸ — منابع و درآمدهای عمومی و اختصاصی";
      headers = ["ردیف", "ماهیت منابع", "معین پیش‌بینی", "معین وصول", "معین ارسال به خزانه", "پیش‌بینی", "وصول", "ارسال به خزانه"];
      rows = form8Data.map(r => [r.id, r.resourceKind, r.expectedMoein, r.receivedMoein, r.sentMoein, r.expectedAmount, r.receivedAmount, r.sentAmount]);
    } else if (activeTab === "form9") {
      title = "فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب";
      headers = ["عنوان", "مانده ابتدای سال", "اعتبار انتقالی مصرف شده", "وجوه ارسالی به خزانه", "وجوه انتقالی (محاسباتی)", "مانده پایان سال"];
      rows = [
        ["پیش‌پرداخت‌ها", form9Data.prepayments.initialBalance, form9Data.prepayments.consumedTransferred, form9Data.prepayments.sentToTreasury, calculateForm9Transferred(form9Data.prepayments), form9Data.prepayments.yearEndBalance],
        ["موجودی‌ها", form9Data.inventories.initialBalance, form9Data.inventories.consumedTransferred, form9Data.inventories.sentToTreasury, calculateForm9Transferred(form9Data.inventories), form9Data.inventories.yearEndBalance],
        ["علی‌الحساب", form9Data.onAccounts.initialBalance, form9Data.onAccounts.consumedTransferred, form9Data.onAccounts.sentToTreasury, calculateForm9Transferred(form9Data.onAccounts), form9Data.onAccounts.yearEndBalance],
      ];
    } else if (activeTab === "form10") {
      title = "فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها";
      headers = ["عنوان بخش", "حواله انتقالی", "دریافتی از اعتبار انتقالی", "اعتبار مصرف شده", "مانده پایان سال"];
      rows = form10Data.map(r => [r.section, r.transferredDraftsExpense || r.transferredFunds, r.receivedNotifiedBonds || "-", r.consumedTransferred || "-", r.yearEndMoeinApproved || r.yearEndBalance || "-"]);
    } else if (activeTab === "form11") {
      title = "فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی";
      headers = ["عنوان سطر", "معین هزینه‌ای", "معین سرمایه‌ای", "مانده ابتدای سال", "مصرف شده", "ارسال به خزانه"];
      rows = form11Data.map(r => [r.rowType, r.moeinExpense || r.yearEndMoeinExpense, r.moeinCapital || r.yearEndMoeinCapital, r.initialBalance, r.consumedTransferred, r.sentToTreasury]);
    } else if (activeTab === "form13") {
      title = "فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی";
      headers = ["عنوان ستون", "نوع حساب", "معین هزینه‌ای مصوب", "معین سرمایه‌ای مصوب", "مبلغ اوراق (ریال)"];
      rows = form13Data.map(r => [r.rowType, r.accountType, r.moeinExpenseApproved, r.moeinCapitalApproved, r.amount]);
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const tableHeadHtml = headers.map(h => `<th>${h}</th>`).join("");
    const tableRowsHtml = rows.map(r => `<tr>${r.map(c => `<td>${typeof c === 'number' ? toPersianDigits(c.toLocaleString('fa-IR')) : toPersianDigits(c)}</td>`).join("")}</tr>`).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Tahoma, Vazir, sans-serif; font-size: 11px; direction: rtl; color: #111; padding: 15px; }
          .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
          .hdr h1 { font-size: 16px; margin: 0; color: #1e3a8a; font-weight: bold; }
          .hdr p { font-size: 10px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #94a3b8; padding: 8px 10px; text-align: right; font-size: 10px; }
          th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 25px; font-size: 9px; color: #64748b; text-align: left; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <div>
            <h1>وزارت امور اقتصادی و دارایی - خزانه‌داری کل کشور</h1>
            <p>سامانه نظارت آنی خزانه‌داری (سناما) — ${title}</p>
          </div>
          <div style="text-align: left;">
            <div>تاریخ گزارش: ${toPersianDigits(new Date().toLocaleDateString("fa-IR"))}</div>
            <div>ارز: ریال ایران</div>
          </div>
        </div>
        <table>
          <thead><tr>${tableHeadHtml}</tr></thead>
          <tbody>${tableRowsHtml}</tbody>
        </table>
        <div class="footer">ایجاد شده توسط سیستم جامع مالی و حسابداری عمومی</div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); window.close(); }, 350);
          };
        </script>
    `);
  };

  const handleSaveForms = async () => {
    try {
      const payload = {
        form1Data,
        form46Data,
        form75CapData: form75Data,
        form8Data,
        form9Data,
        form10Data,
        form11Data,
        form13Data,
      };
      await api.post("/api/credits/sanama-forms", payload);
      alert("اطلاعات فرم‌های سناما با موفقیت در پایگاه داده ذخیره شد.");
    } catch (e) {
      console.error(e);
      alert("خطا در ذخیره‌سازی اطلاعات سناما در دیتابیس");
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="فرم‌های جامع سناما (وزارت امور اقتصادی و دارایی)"
        description="مشاهده، تکمیل، محاسبه خودکار و ممیزی فرم‌های ۱، ۴-۶، ۵-۷، ۸، ۹، ۱۰، ۱۱ و ۱۳ سناما"
      />

      {/* ─── نوار ابزار ذخیره، خروجی اکسل و پی‌دی‌اف ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            عملیات خروجی و گزارش‌گیری فرم فعال سناما:
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveForms}
            className="text-xs font-bold gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white shadow"
          >
            <Save className="h-3.5 w-3.5" />
            <span>ذخیره تغییرات در دیتابیس</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs font-bold gap-1.5 h-8 border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>خروجی اکسل (Excel)</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            className="text-xs font-bold gap-1.5 h-8 border-rose-600 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>خروجی PDF / چاپ</span>
          </Button>
        </div>
      </div>

      {/* ─── هشدار ممیزی هوشمند ─── */}
      {auditErrors.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/70 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">ممیزی سناما فعال است</h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  تعداد {auditErrors.length} عدم تطابق در موازنه و کدهای معین فرم‌های سناما شناسایی شد.
                </p>
              </div>
            </div>
            <Badge variant="destructive" className="text-[11px]">
              {auditErrors.length} خطای سناما
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* ─── منوی تب‌های فرم‌های ۸‌گانه ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-1.5 bg-muted/60 p-1.5 rounded-xl mb-6 overflow-x-auto">
          <TabsTrigger value="form1" className="text-[11px] font-bold py-2">فرم ۱</TabsTrigger>
          <TabsTrigger value="form46" className="text-[11px] font-bold py-2">فرم ۴-۶</TabsTrigger>
          <TabsTrigger value="form75" className="text-[11px] font-bold py-2">فرم ۵-۷</TabsTrigger>
          <TabsTrigger value="form8" className="text-[11px] font-bold py-2">فرم ۸</TabsTrigger>
          <TabsTrigger value="form9" className="text-[11px] font-bold py-2">فرم ۹</TabsTrigger>
          <TabsTrigger value="form10" className="text-[11px] font-bold py-2">فرم ۱۰</TabsTrigger>
          <TabsTrigger value="form11" className="text-[11px] font-bold py-2">فرم ۱۱</TabsTrigger>
          <TabsTrigger value="form13" className="text-[11px] font-bold py-2">فرم ۱۳</TabsTrigger>
        </TabsList>

        {/* ════════════════════════ فرم ۱ ════════════════════════ */}
        <TabsContent value="form1">
          <Card className="border shadow-sm">
            <CardHeader className="bg-lime-50/60 dark:bg-lime-950/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-black text-lime-900 dark:text-lime-300">
                    فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    تعیین بودجه اولیه، افزایش، کاهش، حواله‌ها و محاسبه خودکار بودجه اعتبار نهایی با معین‌های ۹۱۰۰۱ و ۹۴۰۰۱-
                  </CardDescription>
                </div>
                <Badge className="bg-lime-600 text-white text-xs">معین ۹۱۰۰۱ / ۹۴۰۰۱-</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-lime-200">
                  <thead>
                    <tr className="bg-lime-100 dark:bg-lime-900/40 text-lime-900 dark:text-lime-200 font-bold border-b border-lime-300">
                      <th className="p-3 border-l border-lime-300">عنوان ستون</th>
                      <th className="p-3 border-l border-lime-300">نوع حساب</th>
                      <th className="p-3 border-l border-lime-300">حساب معین</th>
                      <th className="p-3 border-l border-lime-300">سطوح تفصیلی</th>
                      <th className="p-3">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lime-100">
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-slate-800">بودجه اعتبار اولیه</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                      <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                      <td className="p-2">
                        <PersianAmountInput
                          value={form1Data.initialBudget}
                          onChange={(val) => setForm1Data({ ...form1Data, initialBudget: val })}
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-emerald-700">افزایش (+)</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                      <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                      <td className="p-2">
                        <PersianAmountInput
                          value={form1Data.increase}
                          onChange={(val) => setForm1Data({ ...form1Data, increase: val })}
                          textColor="text-emerald-700"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-rose-700">کاهش (-)</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                      <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                      <td className="p-2">
                        <PersianAmountInput
                          value={form1Data.decrease}
                          onChange={(val) => setForm1Data({ ...form1Data, decrease: val })}
                          textColor="text-rose-700"
                        />
                      </td>
                    </tr>
                    <tr className="hover:bg-lime-50/30">
                      <td className="p-3 font-bold text-blue-700">حواله (-)</td>
                      <td className="p-3 text-slate-600">هزینه</td>
                      <td className="p-3 font-mono font-bold text-blue-800">{toPersianDigits("94001")}</td>
                      <td className="p-3 text-slate-500">سطوح تفصیلی مطابق الزامات سناما</td>
                      <td className="p-2">
                        <PersianAmountInput
                          value={form1Data.drafts}
                          onChange={(val) => setForm1Data({ ...form1Data, drafts: val })}
                          textColor="text-blue-700"
                        />
                      </td>
                    </tr>
                    <tr className="bg-lime-200/60 font-black text-slate-900">
                      <td className="p-3">بودجه اعتبار نهایی (محاسباتی)</td>
                      <td className="p-3">هزینه</td>
                      <td className="p-3 font-mono">{toPersianDigits("91001 / -94001")}</td>
                      <td className="p-3 text-slate-700">مطابق الزامات پروتکل تبادل الکترونیکی</td>
                      <td className="p-3 font-mono text-sm text-lime-900">
                        {formatPersianAmount(calculatedForm1Final)} ریال
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۴-۶ ════════════════════════ */}
        <TabsContent value="form46">
          <Card className="border shadow-sm">
            <CardHeader className="bg-amber-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-amber-900">
                فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-amber-100 text-amber-900 font-bold border-b">
                      <th className="p-3 border-l w-12 text-center">ردیف</th>
                      <th className="p-3 border-l">عنوان ستون</th>
                      <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                      <th className="p-3 border-l w-28 text-center">اعتبار</th>
                      <th className="p-3 border-l font-mono">حساب معین</th>
                      <th className="p-3 w-44">مبلغ (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form46Data.map((row) => (
                      <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-amber-100/50 font-bold")}>
                        <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                        <td className="p-3 text-center font-mono">{row.accountType}</td>
                        <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                        <td className="p-2">
                          {row.isCalculated ? (
                            <div className="p-2 font-mono font-black text-amber-900 bg-amber-200/50 rounded text-center">
                              {formatPersianAmount(calculatedF46Transferred)}
                            </div>
                          ) : (
                            <PersianAmountInput
                              value={row.approvedAmount}
                              onChange={(val) => setForm46Data(form46Data.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۵-۷ ════════════════════════ */}
        <TabsContent value="form75">
          <Card className="border shadow-sm">
            <CardHeader className="bg-emerald-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-emerald-900">
                فرم ۵-۷ — اعتبارات سرمایه‌ای (نوع حساب t)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-emerald-100 text-emerald-900 font-bold border-b">
                      <th className="p-3 border-l w-12 text-center">ردیف</th>
                      <th className="p-3 border-l">عنوان ستون</th>
                      <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                      <th className="p-3 border-l w-28 text-center">اعتبار</th>
                      <th className="p-3 border-l font-mono">حساب معین سناما</th>
                      <th className="p-3 w-44">مبلغ مصوب (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form75Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                        <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                        <td className="p-3 text-center font-mono">{row.accountType}</td>
                        <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                        <td className="p-3 font-mono text-emerald-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                        <td className="p-2">
                          <PersianAmountInput
                            value={row.approvedAmount}
                            onChange={(val) => setForm75Data(form75Data.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۸ ════════════════════════ */}
        <TabsContent value="form8">
          <Card className="border shadow-sm">
            <CardHeader className="bg-blue-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-blue-900">
                فرم ۸ — منابع و درآمدهای عمومی و اختصاصی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-blue-100 text-blue-900 font-bold border-b">
                      <th className="p-3 border-l w-12 text-center">ردیف</th>
                      <th className="p-3 border-l">ماهیت منابع</th>
                      <th className="p-3 border-l font-mono">معین پیش‌بینی</th>
                      <th className="p-3 border-l font-mono">معین وصول</th>
                      <th className="p-3 border-l font-mono">معین ارسال به خزانه</th>
                      <th className="p-3 w-32">پیش‌بینی</th>
                      <th className="p-3 w-32">وصول</th>
                      <th className="p-3 w-32">ارسال به خزانه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form8Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                        <td className="p-3 font-bold text-slate-800">{row.resourceKind}</td>
                        <td className="p-3 font-mono text-slate-600">{toPersianDigits(row.expectedMoein)}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.receivedMoein)}</td>
                        <td className="p-3 font-mono text-emerald-700 font-semibold">{toPersianDigits(row.sentMoein)}</td>
                        <td className="p-2">
                          <PersianAmountInput
                            value={row.expectedAmount}
                            onChange={(val) => setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, expectedAmount: val } : r))}
                          />
                        </td>
                        <td className="p-2">
                          <PersianAmountInput
                            value={row.receivedAmount}
                            onChange={(val) => setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, receivedAmount: val } : r))}
                            textColor="text-blue-700"
                          />
                        </td>
                        <td className="p-2">
                          <PersianAmountInput
                            value={row.sentAmount}
                            onChange={(val) => setForm8Data(form8Data.map(r => r.id === row.id ? { ...r, sentAmount: val } : r))}
                            textColor="text-emerald-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۹ ════════════════════════ */}
        <TabsContent value="form9">
          <Card className="border shadow-sm">
            <CardHeader className="bg-purple-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-purple-900">
                فرم ۹ — سطر پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">

              {/* پیش پرداخت‌ها */}
              <div className="border rounded-xl p-4 bg-purple-50/20">
                <h4 className="font-bold text-xs text-purple-900 mb-3">سطر پیش پرداخت‌ها (معین {toPersianDigits("98003 / 98004")})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                    <PersianAmountInput value={form9Data.prepayments.initialBalance} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, initialBalance: val}})} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                    <PersianAmountInput value={form9Data.prepayments.consumedTransferred} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, consumedTransferred: val}})} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                    <PersianAmountInput value={form9Data.prepayments.sentToTreasury} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, sentToTreasury: val}})} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده پایان سال (معین {toPersianDigits("98003/98004")})</label>
                    <PersianAmountInput value={form9Data.prepayments.yearEndBalance} onChange={val => setForm9Data({...form9Data, prepayments: {...form9Data.prepayments, yearEndBalance: val}})} className="mt-1" textColor="text-purple-700" />
                  </div>
                </div>
                <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                  <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                  <span>{formatPersianAmount(calculateForm9Transferred(form9Data.prepayments))} ریال</span>
                </div>
              </div>

              {/* موجودی‌ها */}
              <div className="border rounded-xl p-4 bg-purple-50/20">
                <h4 className="font-bold text-xs text-purple-900 mb-3">سطر موجودی‌ها (معین {toPersianDigits("98003 / 98004")})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                    <PersianAmountInput value={form9Data.inventories.initialBalance} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, initialBalance: val}})} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                    <PersianAmountInput value={form9Data.inventories.consumedTransferred} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, consumedTransferred: val}})} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                    <PersianAmountInput value={form9Data.inventories.sentToTreasury} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, sentToTreasury: val}})} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                    <PersianAmountInput value={form9Data.inventories.yearEndBalance} onChange={val => setForm9Data({...form9Data, inventories: {...form9Data.inventories, yearEndBalance: val}})} className="mt-1" textColor="text-purple-700" />
                  </div>
                </div>
                <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                  <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                  <span>{formatPersianAmount(calculateForm9Transferred(form9Data.inventories))} ریال</span>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۱۰ ════════════════════════ */}
        <TabsContent value="form10">
          <Card className="border shadow-sm">
            <CardHeader className="bg-teal-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-teal-900">
                فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-teal-100 text-teal-900 font-bold border-b">
                      <th className="p-3 border-l">عنوان بخش</th>
                      <th className="p-3 border-l font-mono">حواله انتقالی</th>
                      <th className="p-3 border-l font-mono">دریافتی از اعتبار انتقالی</th>
                      <th className="p-3 border-l font-mono">اعتبار مصرف شده</th>
                      <th className="p-3 border-l font-mono">مانده پایان سال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form10Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{row.section}</td>
                        <td className="p-3 font-mono text-teal-700 font-semibold">{toPersianDigits(row.transferredDraftsExpense || row.transferredFunds)}</td>
                        <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.receivedNotifiedBonds || "-")}</td>
                        <td className="p-3 font-mono font-bold">{formatPersianAmount(row.consumedTransferred)}</td>
                        <td className="p-3 font-mono text-emerald-800 font-black">{toPersianDigits(row.yearEndMoeinApproved || row.yearEndBalance || "-")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۱۱ ════════════════════════ */}
        <TabsContent value="form11">
          <Card className="border shadow-sm">
            <CardHeader className="bg-indigo-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-indigo-900">
                فرم ۱۱ — اسناد واخواهی شده و کسری ابواب جمعی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-indigo-100 text-indigo-900 font-bold border-b">
                      <th className="p-3 border-l">عنوان سطر</th>
                      <th className="p-3 border-l font-mono">معین هزینه‌ای</th>
                      <th className="p-3 border-l font-mono">معین سرمایه‌ای</th>
                      <th className="p-3 w-36">مانده ابتدای سال</th>
                      <th className="p-3 w-36">مصرف شده</th>
                      <th className="p-3 w-36">ارسال به خزانه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form11Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                        <td className="p-3 font-mono text-indigo-700 font-semibold">{toPersianDigits(row.moeinExpense || row.yearEndMoeinExpense)}</td>
                        <td className="p-3 font-mono text-indigo-700 font-semibold">{toPersianDigits(row.moeinCapital || row.yearEndMoeinCapital)}</td>
                        <td className="p-2 font-mono">{formatPersianAmount(row.initialBalance)}</td>
                        <td className="p-2 font-mono">{formatPersianAmount(row.consumedTransferred)}</td>
                        <td className="p-2 font-mono">{formatPersianAmount(row.sentToTreasury)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ فرم ۱۳ ════════════════════════ */}
        <TabsContent value="form13">
          <Card className="border shadow-sm">
            <CardHeader className="bg-cyan-50/60 border-b pb-4">
              <CardTitle className="text-base font-black text-cyan-900">
                فرم ۱۳ — اوراق مالی، واگذار شده و انتقالی
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-cyan-100 text-cyan-900 font-bold border-b">
                      <th className="p-3 border-l">عنوان ستون</th>
                      <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                      <th className="p-3 border-l font-mono">معین هزینه‌ای مصوب</th>
                      <th className="p-3 border-l font-mono">معین سرمایه‌ای مصوب</th>
                      <th className="p-3 w-40">مبلغ اوراق (ریال)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {form13Data.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                        <td className="p-3 text-center font-mono">{row.accountType}</td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{toPersianDigits(row.moeinExpenseApproved)}</td>
                        <td className="p-3 font-mono text-cyan-700 font-semibold">{toPersianDigits(row.moeinCapitalApproved)}</td>
                        <td className="p-3 font-mono font-bold text-cyan-900">{formatPersianAmount(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </PageShell>
  );
}
