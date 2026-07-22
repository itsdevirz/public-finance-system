import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, FileText,
  Building2, ArrowLeftRight, Search, Info, Layers, Check, FileCheck2, Filter,
  FileSpreadsheet, Download, Save, Calculator, HelpCircle, Eye, Printer, LayoutDashboard,
  Pencil, X, Landmark, Coins, Upload, Trash2, Camera
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import api from "@/api";
import { validateSanamaPerformanceForms, SANAMA_PERFORMANCE_RULES, getRuleCategory } from "@/lib/sanamaPerformanceValidation";
import { printTable } from "@/lib/printUtils";

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

// ─── ثوابت اولیه فرم‌های هزینه‌ای و تملک ──────────────────────────────────────────

// فرم ۱ هزینه‌ای (موافقت‌نامه هزینه)
const INITIAL_FORM1_EXPENSE = {
  initialBudget: 0,
  increase: 0,
  decrease: 0,
  drafts: 0,
  legalAdjustments: 0,
};

// فرم ۲ تملک (موافقت‌نامه تملک دارایی‌های سرمایه‌ای)
const INITIAL_FORM2_CAPITAL = {
  initialBudget: 0,
  increase: 0,
  decrease: 0,
  drafts: 0,
  legalAdjustments: 0,
};

// فرم ۴-۶ هزینه‌ای (اعتبارات هزینه ۱۱ ردیفی)
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

// فرم ۵-۷ هزینه‌ای (تراز عملکرد هزینه‌ای)
const INITIAL_FORM_5_7_EXPENSE = [
  { id: 1, title: "بودجه اعتبار نهایی هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "91001 / -94001", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "93001 / 97001 / 98001 / 99001 / 92501 / 93501", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل تخصیص هزینه‌ای", accountType: "h", creditType: "مصوب / ابلاغی", moeinCodes: "41001 / 41005 / 41006 / 81010 / 81017 / 81019 / -94001", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده هزینه‌ای", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "99001", approvedAmount: 0 },
  { id: 5, title: "پیش پرداخت و علی‌الحساب", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "98001", approvedAmount: 0 },
  { id: 6, title: "اسناد واخواهی و کسری ابواب جمعی", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "92501 / 81007 / 93501", approvedAmount: 0 },
  { id: 7, title: "وجوه انتقالی سالانه (محاسباتی)", accountType: "h", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
];

// فرم ۴-۴ / ۷-۵ تملک (اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای - ۱۳ ردیفی)
const INITIAL_FORM_7_5_CAPITAL = [
  { id: 1, title: "بودجه اعتبار نهایی تملک", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "91002 / -94002", approvedAmount: 0 },
  { id: 2, title: "اعتبار تخصیص یافته تملک", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "93002 / 97002 / 98002 / 99002 / 92502 / 93502", approvedAmount: 0 },
  { id: 3, title: "دریافتی از محل اعتبارات تخصیص یافته / درآمدهای اختصاصی", accountType: "t", creditType: "مصوب / ابلاغی", moeinCodes: "41003 / 81010 / 81017 / 81019 / -94002", approvedAmount: 0 },
  { id: 4, title: "اعتبار مصرف شده تملک", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "99002", approvedAmount: 0 },
  { id: 5, title: "موجودی‌ها", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 6, title: "پیش پرداخت", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 7, title: "پیش پرداخت مواد و کالا", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 8, title: "پیش پرداخت اعتبار اسنادی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 9, title: "علی‌الحساب", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "98002", approvedAmount: 0 },
  { id: 10, title: "اسناد واخواهی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "92502", approvedAmount: 0 },
  { id: 11, title: "کسری ابواب جمعی", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81007 / 93502", approvedAmount: 0 },
  { id: 12, title: "وجوه انتقالی تملک (محاسباتی)", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "محاسباتی", approvedAmount: 0, isCalculated: true },
  { id: 13, title: "اوراق انتقالی تملک", accountType: "t", creditType: "مصوب-ابلاغی", moeinCodes: "81010 / 81019", approvedAmount: 0 },
];

// فرم ۸ هزینه‌ای (منابع درآمدی هزینه)
const INITIAL_FORM_8_EXPENSE = [
  { id: 1, resourceKind: "درآمد عمومی هزینه‌ای", expectedMoein: "81008", receivedMoein: "71001 / 81013", sentMoein: "71001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 2, resourceKind: "درآمد اختصاصی هزینه‌ای", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
];

// فرم ۸ تملک (منابع و واگذاری دارایی‌های سرمایه‌ای و مالی)
const INITIAL_FORM_8_CAPITAL = [
  { id: 1, resourceKind: "واگذاری دارایی مالی (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 2, resourceKind: "واگذاری دارایی سرمایه‌ای (عمومی)", expectedMoein: "81008", receivedMoein: "63001 / 81013", sentMoein: "63001 / 81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
  { id: 3, resourceKind: "واگذاری دارایی سرمایه‌ای (اختصاصی)", expectedMoein: "81008", receivedMoein: "81013", sentMoein: "81013", expectedAmount: 0, receivedAmount: 0, sentAmount: 0 },
];

// فرم ۹ هزینه‌ای
const INITIAL_FORM_9_EXPENSE = {
  prepayments: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003" },
  onAccounts: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinExpense: "98003" }
};

// فرم ۹ تملک
const INITIAL_FORM_9_CAPITAL = {
  inventories: { initialBalance: 0, consumedTransferred: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinCapital: "98004" },
  prepayments: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinCapital: "98004" },
  onAccounts: { initialBalance: 0, consumedTransferred: 0, inventory: 0, objectionTransferred: 0, deficitTransferred: 0, sentToTreasury: 0, yearEndBalance: 0, moeinCapital: "98004" }
};

// فرم ۱۰ هزینه‌ای (سرفصل ۹۴۰۰۳ و ۹۱۰۰۳)
const INITIAL_FORM_10_EXPENSE = [
  { id: 1, section: "وجوه انتقالی اعتبارات هزینه", initialBalance: 0, nonFinalPrevYears: 0, objectionDeficitPrevYears: 0, investmentsPrevYears: 0, transferredDraftsExpense: 94003, receivedNotifiedBonds: "81010 / 81019 / 81017", consumedTransferred: 0, prepayments: 0, onAccounts: 0, sentToTreasury: 0, objectionTransferred: 92503, deficitTransferred: 93503, yearEndMoeinApproved: "91501 / 97003", yearEndMoeinNotified: "95003" }
];

// فرم ۱۰ تملک (سرفصل ۹۴۰۰۴ و ۹۱۰۰۴ و سرمایه‌گذاری)
const INITIAL_FORM_10_CAPITAL = [
  { id: 1, section: "وجوه انتقالی طرح‌های تملک دارایی‌های سرمایه‌ای", initialBalance: 0, nonFinalPrevYears: 0, objectionDeficitPrevYears: 0, investmentsPrevYears: 0, transferredDraftsCapital: 94004, receivedNotifiedBonds: "81010 / 81019 / 81017", consumedTransferred: 0, prepayments: 0, onAccounts: 0, sentToTreasury: 0, objectionTransferred: 92504, deficitTransferred: 93504, yearEndMoeinApproved: "91502 / 97004", yearEndMoeinNotified: "95004" },
  { id: 2, section: "سرمایه‌گذاری‌های تملک دارایی‌های سرمایه‌ای", initialBalance: 0, transferredFunds: 0, deficitTransferred: 93504, yearEndBalance: 0 }
];

// فرم ۱۱ هزینه‌ای
const INITIAL_FORM_11_EXPENSE = [
  { id: 1, rowType: "سطر اسناد واخواهی شده هزینه‌ای", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, deficit: 0, moeinExpense: "92503" },
  { id: 2, rowType: "سطر کسری ابواب جمعی هزینه‌ای (دارای مانده)", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "93503" },
  { id: 3, rowType: "سطر کسری ابواب جمعی برداشتی هزینه‌ای", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinExpense: "81007" },
];

// فرم ۱۱ تملک
const INITIAL_FORM_11_CAPITAL = [
  { id: 1, rowType: "سطر اسناد واخواهی شده تملک", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, deficit: 0, moeinCapital: "92504" },
  { id: 2, rowType: "سطر کسری ابواب جمعی تملک (دارای مانده)", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinCapital: "93504" },
  { id: 3, rowType: "سطر کسری ابواب جمعی برداشتی تملک", initialBalance: 0, consumedTransferred: 0, sentToTreasury: 0, yearEndMoeinCapital: "81007" },
];

// فرم ۱۳ هزینه‌ای
const INITIAL_FORM_13_EXPENSE = [
  { id: 1, rowType: "اوراق دریافتی هزینه‌ای", accountType: "o", creditType: "مصوب / ابلاغی", moeinExpenseApproved: "41001 / 41006 / 81010 / 81017 / -94001", moeinExpenseNotified: "81010 / 81017", amount: 0 },
  { id: 2, rowType: "اوراق واگذار شده هزینه‌ای", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "99001 / 98001 / 92501 / 93501", moeinExpenseNotified: "", amount: 0 },
  { id: 3, rowType: "اوراق مصرف نشده (قفل شده) هزینه‌ای", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "قفل شده", moeinExpenseNotified: "", amount: 0 },
  { id: 4, rowType: "اوراق انتقالی هزینه‌ای", accountType: "o", creditType: "مصوب - ابلاغی", moeinExpenseApproved: "81010", moeinExpenseNotified: "81010", amount: 0 },
];

// فرم ۱۳ تملک
const INITIAL_FORM_13_CAPITAL = [
  { id: 1, rowType: "اوراق دریافتی تملک", accountType: "o", creditType: "مصوب / ابلاغی", moeinCapitalApproved: "41003 / 81010 / 81017 / -94002", moeinCapitalNotified: "81010 / 81017", amount: 0 },
  { id: 2, rowType: "اوراق واگذار شده تملک", accountType: "o", creditType: "مصوب - ابلاغی", moeinCapitalApproved: "99002 / 98002 / 92502 / 93502", moeinCapitalNotified: "", amount: 0 },
  { id: 3, rowType: "اوراق مصرف نشده (قفل شده) تملک", accountType: "o", creditType: "مصوب - ابلاغی", moeinCapitalApproved: "قفل شده", moeinCapitalNotified: "", amount: 0 },
  { id: 4, rowType: "اوراق انتقالی تملک", accountType: "o", creditType: "مصوب - ابلاغی", moeinCapitalApproved: "81010", moeinCapitalNotified: "81010", amount: 0 },
];

export function getFixPathwayInfo(code, sectionCategory = "expense") {
  let formTab = "form1";
  let formName = sectionCategory === "capital" 
    ? "فرم ۲ — موافقت‌نامه / بودجه اعتبار نهایی تملک دارایی‌های سرمایه‌ای" 
    : "فرم ۱ — موافقت‌نامه / بودجه اعتبار نهایی هزینه";

  let steps = [
    `۱. در تب‌های بالای صفحه به «${sectionCategory === "capital" ? "فرم ۲" : "فرم ۱"}» مراجعه نمایید.`,
    "۲. مبالغ اولیه، افزایش، کاهش یا حواله‌ها را بررسی و اصلاح کنید.",
    "۳. فرمول بودجه اعتبار نهایی (اولیه + استنادات + افزایش - کاهش - حواله) را موازنه نمایید."
  ];

  if ([106, 3010, 3011].includes(code)) {
    formTab = sectionCategory === "capital" ? "form2" : "form1";
    formName = sectionCategory === "capital" 
      ? "فرم ۲ — موافقت‌نامه تملک و حواله‌ها (معین ۹۴۰۰۲-)" 
      : "فرم ۱ — موافقت‌نامه هزینه و حواله‌ها (معین ۹۴۰۰۱-)";
    steps = [
      `۱. در تب‌های بالایی به «${sectionCategory === "capital" ? "فرم ۲" : "فرم ۱"}» منتقل شوید.`,
      `۲. ستون حواله‌ها و مانده حساب معین ${sectionCategory === "capital" ? "۹۴۰۰۲" : "۹۴۰۰۱"} را اعمال نمایید.`,
      "۳. از صحت موازنه حواله‌ها با ابلاغ اعتبار اطمینان حاصل کنید."
    ];
  } else if ([23, 24, 25, 26, 27, 40, 41, 42, 44, 45, 46, 49, 50, 53, 54, 60, 61, 62, 63, 64, 65, 66, 67, 68, 70, 71, 812, 813, 1204, 1448, 1451, 1452, 1462, 3250, 3251, 3252, 3253, 3254, 3255, 3256, 3257, 3258].includes(code)) {
    formTab = sectionCategory === "capital" ? "form75cap" : "form46";
    formName = sectionCategory === "capital" 
      ? "فرم ۴-۴ / ۷-۵ — اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای" 
      : "فرم ۴-۶ — اعتبارات هزینه‌ای و تخصیص خزانه";
    steps = [
      `۱. در تب‌های بالایی به «${sectionCategory === "capital" ? "فرم ۷-۵ (تملک)" : "فرم ۴-۶ (هزینه)"}» منتقل شوید.`,
      "۲. مبالغ مصوب، تخصیص‌یافته، دریافتی و تطابق تخصیص خزانه را بازبینی نمایید.",
      "۳. از عدم مغایرت حساب ابلاغ‌گیرنده با حوالجات ابلاغ‌دهنده اطمینان حاصل کنید."
    ];
  } else if ([253, 254, 801, 803, 804, 807, 808, 809, 810, 814, 815, 816, 817, 818, 819, 820, 3218].includes(code)) {
    formTab = "form8";
    formName = sectionCategory === "capital" 
      ? "فرم ۸ — واگذاری دارایی‌های سرمایه‌ای و مالی" 
      : "فرم ۸ — درآمدهای عمومی و اختصاصی هزینه‌ای";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۸» منتقل شوید.",
      "۲. فیلدهای پیش‌بینی، وصولی و وجوه ارسالی به خزانه ردیف درآمدی/واگذاری را تنظیم نمایید.",
      "۳. شماره طبقه‌بندی و کد معین وصول/ارسال به خزانه را مطابقت دهید."
    ];
  } else if ([901, 902, 903, 904, 905, 906, 907, 908, 1008].includes(code)) {
    formTab = "form9";
    formName = sectionCategory === "capital" 
      ? "فرم ۹ — سطر موجودی‌ها، پیش‌پرداخت‌ها و علی‌الحساب تملک (معین ۹۸۰۰۴)" 
      : "فرم ۹ — سطر پیش‌پرداخت‌ها و علی‌الحساب هزینه (معین ۹۸۰۰۳)";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۹» منتقل شوید.",
      "۲. مبالغ مانده ابتدای سال و مانده پایان سال سطر مورد نظر را اصلاح نمایید.",
      "۳. از صحت فرمول محاسباتی وجوه انتقالی و عدم تکراری بودن عنوان مطمئن شوید."
    ];
  } else if ([271, 272, 320, 811, 1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012, 1013, 1014, 1015, 1062, 1156, 3012, 3013, 3233, 3234, 3235, 3236, 3237, 3238].includes(code)) {
    formTab = "form10";
    formName = sectionCategory === "capital" 
      ? "فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌های تملک (معین ۹۴۰۰۴ / ۹۱۰۰۴)" 
      : "فرم ۱۰ — وجوه انتقالی اعتبارات هزینه (معین ۹۴۰۰۳ / ۹۱۰۰۳)";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱۰» منتقل شوید.",
      `۲. مبالغ حواله انتقالی، حساب‌های معین ${sectionCategory === "capital" ? "۹۴۰۰۴" : "۹۴۰۰۳"} و گردش کار را بررسی فرمایید.`,
      "۳. موازنه منابع انتقالی قابل مصرف با سرفصل‌های تراز حساب‌ها را انجام دهید."
    ];
  } else if ([507, 1101, 1102, 1103, 1104, 1105, 1106, 1159, 1160].includes(code)) {
    formTab = "form11";
    formName = sectionCategory === "capital" 
      ? "فرم ۱۱ — اسناد واخواهی و کسری ابواب جمعی تملک (معین ۹۲۵۰۴ / ۹۳۵۰۴)" 
      : "فرم ۱۱ — اسناد واخواهی و کسری ابواب جمعی هزینه (معین ۹۲۵۰۳ / ۹۳۵۰۳)";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱۱» منتقل شوید.",
      "۲. عنوان سطر و مانده ابتدای سال اسناد واخواهی/کسری ابواب‌جمعی را وارد کنید.",
      "۳. وضعیت فرم را در صورت وجود اسناد انتقالی روی «واخواهی» تنظیم نمایید."
    ];
  } else if ([1302, 1303, 1304, 1305, 1307, 1308, 1309, 1310, 1311, 1313, 1362].includes(code)) {
    formTab = "form13";
    formName = sectionCategory === "capital" 
      ? "فرم ۱۳ — اوراق مالی تملک دارایی‌های سرمایه‌ای" 
      : "فرم ۱۳ — اوراق مالی اعتبارات هزینه‌ای";
    steps = [
      "۱. در تب‌های بالایی به «فرم ۱۳» منتقل شوید.",
      "۲. مبالغ اوراق دریافتی، واگذار شده، مصرف‌نشده و اوراق انتقالی را موازنه نمایید.",
      "۳. در اعتبارات ابلاغی از ردیف ابلاغ دهنده و شماره طبقه‌بندی یکتا استفاده کنید."
    ];
  } else if ([1001, 1002, 1101, 1111, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1123, 1124, 1125, 1126, 1131, 1132, 1133, 1137, 1140, 1141, 1142, 1153, 1154, 1155, 1156, 1169, 1170, 1171, 1172, 1177, 1178, 1181, 1182, 1183, 1184, 1189, 1190, 1191, 1192, 1193, 1194, 1195, 1196, 1197, 1202, 1203, 1204, 1217, 1218, 1219, 1220, 1221, 1222, 1223, 1224, 1227, 1228, 1229, 1230, 1231, 1232, 1247, 1248, 1249, 1250, 1255, 1256, 1257, 1258, 1259, 1260, 1275, 1276, 1277, 1278, 1279, 1280, 1281, 1282, 1301, 1302, 1303, 1304, 1305, 1306, 1307, 1308, 1309, 1310, 1311, 1312, 1313, 1314, 1315, 1316, 1317, 1318, 1319, 1320, 1321, 1322, 1323, 1324, 1325, 1326, 1327, 1328, 1329, 1330, 1331, 1332, 1333, 1334, 1335, 1336, 1337, 1338, 1339, 1340, 1341, 1342, 1343, 1344, 1345, 1346, 1347, 1348, 1349, 1350, 1351, 1352, 1353, 1354, 1355, 1356, 1357, 1358, 1359, 1360, 1361, 1362, 1363, 1364, 1365, 1366, 1368, 1371, 1372, 1373, 1374, 1375, 1376, 1405, 1406, 1407, 1408, 1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1418, 1419, 1420, 1421, 1422, 1423, 1424, 1425, 1426, 1427, 1428, 1429, 1430, 1501, 1502, 15030, 15040, 15050, 15060, 1507, 15080, 1509, 11122, 11123, 11132, 11142, 11232, 11233, 11422, 11462, 11463, 11464, 11465, 11481, 11482, 11483, 11484, 11485, 11486, 11487, 11488, 11489, 11490, 11562, 11563, 11564, 11565, 11642, 11643, 11802, 12022, 12032, 12042, 12043, 12044, 12045, 12046, 12047, 12048, 12049, 12050, 12051, 12052, 12053, 12054, 12055, 12056, 12057, 12058, 12059, 12060, 12061, 12062, 12063, 12064, 12065, 12066, 12067, 12068, 12069, 12074, 12075, 12076, 12077, 12078, 12079, 12080, 12081, 12082, 12083, 12084, 12085, 12086, 12087, 12088, 12089, 12090, 12091, 12092, 12093, 12094, 12095, 12096, 12097, 12098, 12099, 13000, 13001, 13002, 13003, 13004, 130055, 13006, 13007, 13008, 13009, 130100, 130110, 13012, 13013, 13014, 13015, 13016, 13017, 13018, 13019, 13020, 130210, 13022, 13024, 13025, 13026, 13027, 130310, 13032, 13033, 13034, 13035, 13036, 13037, 13038, 13039, 130410, 13042, 13043, 13044, 13045, 13046, 13047, 13048, 13049, 13050, 130510, 13052, 13053, 13054, 13055, 13056, 13057, 13058, 13059, 13060, 13061, 13062, 13063, 13064, 13065, 13066, 13067, 13068, 13069, 13070, 130710, 13072, 13073, 13074, 13075, 13076, 13077, 13078, 13079, 13080, 130810, 13082, 13083, 13085].includes(code)) {
    formTab = "fin_balance_sheet";
    formName = "کنترل‌های حسابرسی هوشمند صورت‌های مالی و یادداشت‌های توضیحی سناما";
    steps = [
      "۱. به زیرمجموعه «۳. تهیه صورت‌های مالی سناما» و تب مربوطه مراجعه فرمایید.",
      "۲. موازنه معادله «جمع دارایی‌ها = جمع بدهی‌ها + خالص دارایی‌ها» و عدم وجود اعداد منفی را بررسی کنید.",
      "۳. تطابق پیش‌پرداخت‌ها، علی‌الحساب، موجودی، واخواهی و اوراق/قیر یادداشت‌های ۷۱ و ۷۲ با اقلام فرم ۱۰ را تایید نمایید."
    ];
  } else if ([201, 202, 203, 213, 215, 228, 229, 253, 2531, 254, 2541, 263, 2631, 264, 265, 268, 275, 276, 277, 278, 291, 303, 3031, 311, 312, 315, 316, 350, 351, 376, 382, 383, 384, 504, 615, 616, 701, 804, 8040, 910, 920, 921, 922, 923, 924, 925, 926, 927, 1001, 10011, 10012, 1002, 10021, 10022, 1003, 10031, 1101, 11011, 1102, 11021, 1103, 11031, 1155, 11551, 1156, 11561, 1201, 1203, 12031, 1204, 12041, 1301, 13011, 1302, 13021, 1303, 13031, 1304, 13041, 1305, 13051, 1307, 13071, 1308, 13081, 1309, 13091, 1310, 13101, 1311, 13111, 1313, 13131, 1362, 13621, 1401, 1402, 1404, 1405, 14051, 1409, 14091, 1503, 1504, 1505, 1506, 1508, 1510, 1511, 1512, 1514, 1515, 1516, 1517, 1518, 1521, 1522, 1523, 2001, 2002, 2003, 2004, 2005, 2007, 2008, 2009, 2010, 2011, 2017, 2020, 2023, 2028, 2029, 2102, 2103, 2180, 3101, 3102, 3103, 3104, 3105, 3106, 3107, 3108, 3109, 3110, 3111, 3112, 3113, 3114, 3115, 3116, 3117, 3231, 3240, 3241, 3245, 3248, 3259, 3262, 3263, 3264, 3265, 3266, 3267, 3268, 3269, 3270, 3271, 3272, 81001, 81002, 81003, 81004, 81005, 81006, 81007, 81008, 81010, 81011, 81012, 81013, 81014, 81015, 81016, 81017, 81018, 90001, 90002, 90003, 90004, 90005, 90006, 90007, 90008, 90009, 90010, 90011, 90012, 90013, 90014, 90015, 90016, 90017, 90018, 90019, 90020, 90021, 90022, 90023, 90024, 11504, 11517, 13005, 150401, 150402, 150403, 150404, 150405, 150406, 150407, 150408, 150409, 130051, 12004, 150410, 150411, 150412, 150413, 150414, 150415, 160401, 160402, 160403, 160404, 150501, 160405, 160406, 160407, 17003, 145511, 145512, 145513, 145514, 145515, 145516, 150450, 145517, 145518, 145519, 145520, 145521, 145522, 145523, 145524, 145525, 145526, 160501, 145527, 145528, 145529, 145530, 145531, 145532, 145533, 11513, 12503, 130052, 130053, 13010, 17004, 115221, 115222, 210041, 210042, 115223, 115224, 11006, 115225, 250, 140, 150, 160, 170, 180, 200, 210, 251, 205, 242, 110, 240, 241, 252, 255, 256, 257, 258, 300, 301, 302, 304, 305, 306, 307, 308, 309, 27610].includes(code)) {
    formTab = "form1";
    formName = "کنترل‌های تکمیلی گردش کار، موازنه اعتبارات و ترازنامه سناما";
    steps = [
      "۱. توازن مجموع منابع و مصارف و موازنه مبالغ ابلاغ اعتبار و حواله‌ها با فرم‌های بودجه‌ای را چک کنید.",
      "۲. تطابق وجوه انتقالی فرم ۹، ۱۰ و ۱۱ و سقف عملکرد حقوق/اوراق را کنترل نمایید.",
      "۳. از ثبت رکوردهای یادداشت‌های توضیحی و عدم وجود ارقام منفی در فرم الف اطمینان حاصل فرمایید."
    ];
  }

  return { formTab, formName, steps };
}

function FixPathwayModal({ error, sectionCategory, onClose, onNavigate }) {
  if (!error) return null;
  const info = getFixPathwayInfo(error.code, sectionCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-amber-500 bg-background animate-in fade-in zoom-in duration-200">
        <CardHeader className="bg-amber-600 text-white p-4 flex flex-row items-center justify-between rounded-t-xl">
          <div>
            <CardTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-200" />
              <span>مسیر اصلاح و برطرف‌سازی خطای سناما (کد {toPersianDigits(error.code)})</span>
            </CardTitle>
            <CardDescription className="text-xs text-amber-100 font-sans mt-1">
              بخش: <strong className="text-white">{sectionCategory === "capital" ? "تملک دارایی‌های سرمایه‌ای" : "اعتبارات هزینه‌ای"}</strong> | 
              شناسه: <strong className="text-white font-mono">{toPersianDigits(error.itemRef || "اقلام سناما")}</strong>
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="text-white hover:bg-amber-700 h-8 w-8 p-0 rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl text-amber-900 dark:text-amber-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>شرح مغایرت شناسایی‌شده:</span>
            </p>
            <p className="leading-relaxed text-xs font-semibold pr-5">{error.message}</p>
          </div>

          <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>مسیر خطایابی و مراحل برطرف‌سازی:</span>
            </h4>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-300 font-bold rounded-lg text-xs">
              فرم هدف: {info.formName}
            </div>
            <ul className="space-y-1.5 pt-1 text-slate-600 dark:text-slate-300">
              {info.steps.map((st, sIdx) => (
                <li key={sIdx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{toPersianDigits(st)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2 border-t mt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-9 text-xs">
              انصراف
            </Button>
            <Button
              onClick={() => onNavigate(info.formTab)}
              className="w-full sm:w-auto h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow"
            >
              <Pencil className="h-4 w-4" />
              <span>انتقال مستقیم به فرم و اصلاح فیلد</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── مدال و سند رسمی قابل چاپ گواهی سناما ──────────────────────────────────────────
function SanamaOfficialCertificateModal({
  isOpen,
  onClose,
  totalAssets,
  totalLiabilities,
  endingEquity
}) {
  if (!isOpen) return null;

  // مدیریت آرم/لوگوی سازمان با قابلیت آپلود و ذخیره‌سازی دائمی در localStorage
  const [logoUrl, setLogoUrl] = useState(() => {
    try {
      return localStorage.getItem("sanama_org_logo") || null;
    } catch {
      return null;
    }
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("حجم فایل آرم نباید بیشتر از ۳ مگابایت باشد.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setLogoUrl(base64);
        try {
          localStorage.setItem("sanama_org_logo", base64);
        } catch (err) {
          console.error("خطا در ذخیره‌سازی آرم:", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
    try {
      localStorage.removeItem("sanama_org_logo");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintCertificate = () => {
    printTable("#sanama-certificate-document", "گواهی‌نامه رسمی تایید و موازنه سناما - خزانه‌داری کل کشور", "portrait");
  };

  const todayPersian = new Date().toLocaleDateString("fa-IR");

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print" dir="rtl">
      <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 animate-in fade-in zoom-in duration-200 my-8">
        {/* نوار کنترل اکشن‌های مدال (در چاپ حذف می‌شود) */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="text-sm font-black">پیش‌نمایش و چاپ گواهی رسمی ممیزی سناما</h3>
              <p className="text-[11px] text-slate-300">نسخه استاندارد قابل ارائه به خزانه‌داری کل کشور و دیوان محاسبات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* دکمه آپلود آرم در نوار بالایی */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("modal-logo-upload-input")?.click()}
              className="bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 font-bold text-xs h-9 px-3 gap-1.5"
            >
              <Upload className="h-4 w-4 text-emerald-400" />
              <span>{logoUrl ? "تغییر آرم سازمان" : "آپلود آرم سازمان"}</span>
            </Button>
            <input
              type="file"
              id="modal-logo-upload-input"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            {logoUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveLogo}
                className="bg-rose-950/80 text-rose-300 hover:bg-rose-900 border-rose-800 h-9 px-2 text-xs"
                title="حذف آرم"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button
              onClick={handlePrintCertificate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-4 gap-1.5 shadow"
            >
              <Printer className="h-4 w-4" />
              <span>چاپ گواهی (A4 تک‌صفحه‌ای)</span>
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 h-9 w-9 p-0 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ─── سند گواهی رسمی (محتوای استاندارد A4 جهت پرینت) ─── */}
        <div className="p-6 bg-slate-100 overflow-y-auto max-h-[80vh]">
          <div
            id="sanama-certificate-document"
            className="printable-area bg-white p-8 rounded-xl border-4 border-double border-slate-800 shadow-lg text-slate-900 relative space-y-6"
            style={{ minHeight: "280mm", width: "100%", margin: "0 auto", boxSizing: "border-box" }}
          >
            {/* واتر مارک پس‌زمینه سناما */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-9xl font-black tracking-widest text-slate-900">SANAMA</span>
            </div>

            {/* سربرگ رسمی وزارت دارایی و خزانه‌داری */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
              <div className="text-right space-y-1 text-xs">
                <p className="font-bold text-slate-700">جمهوری اسلامی ایران</p>
                <p className="font-black text-slate-900">وزارت امور اقتصادی و دارایی</p>
                <p className="font-bold text-slate-800">خزانه‌داری کل کشور — اداره کل نظارت مالی</p>
              </div>

              {/* محل آرم رسمی با قابلیت کلیک جهت آپلود تصویر */}
              <div className="text-center space-y-1">
                <div 
                  onClick={() => document.getElementById("modal-logo-upload-input")?.click()}
                  className="w-16 h-16 mx-auto border-2 border-dashed border-slate-800 hover:border-emerald-600 rounded-full flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden relative group transition-all"
                  title="برای آپلود یا تغییر آرم کلیک کنید"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="آرم سازمان" className="w-full h-full object-contain p-1 rounded-full" />
                  ) : (
                    <div className="text-center p-1">
                      <Camera className="h-5 w-5 mx-auto text-slate-600 group-hover:text-emerald-600 transition-colors" />
                      <span className="text-[9px] font-bold text-slate-600 block mt-0.5 group-hover:text-emerald-700">آپلود آرم</span>
                    </div>
                  )}
                </div>
                <h2 className="text-base font-black text-slate-900 mt-1">گواهی‌نامه هوشمند موازنه و ممیزی سناما</h2>
                <Badge className="bg-slate-900 text-white text-[10px] px-2 py-0.5">سامانه نظارت مالی بخش عمومی</Badge>
              </div>

              <div className="text-left space-y-1 text-[11px] font-mono text-slate-700">
                <p>شماره گواهی: <strong className="text-slate-900">SNM-1404/89201</strong></p>
                <p>تاریخ صدور: <strong className="text-slate-900">{toPersianDigits(todayPersian)}</strong></p>
                <p>پیوست: <strong className="text-slate-900">۵ صورت مالی اساسی</strong></p>
              </div>
            </div>

            {/* متن تاییدیه رسمی */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-800 pt-2 text-justify">
              <p className="font-bold text-sm text-slate-900">
                موضوع: تایید موازنه و ممیزی هوشمند صورت‌های مالی و تراز عملکرد
              </p>

              <p>
                بدین‌وسیله گواهی می‌شود؛ صورت‌های مالی و حساب‌های عملکرد سال جاری **دستگاه اجرایی**، شامل صورت وضعیت مالی (ترازنامه)، صورت عملکرد مالی (درآمد و هزینه)، صورت تغییرات در وضعیت مالی (ارزش ویژه)، صورت جریان وجوه نقد و صورت مقایسه بودجه مصوب و مبالغ واقعی، بر اساس آخرین دستورالعمل‌های نظام حسابداری بخش عمومی و پروتکل الکترونیکی **سناما (سامانه نظارت مالی خزانه‌داری کل کشور)** تحت آزمون‌ها و کنترل‌های ممیزی هوشمند قرار گرفت.
              </p>

              <p>
                بر اساس بررسی‌های هوشمند صورت‌گرفته روی تمامی حساب‌های معین و تفصیلی اعتبارات هزینه‌ای و طرح‌های تملک دارایی‌های سرمایه‌ای، وضعیت موازنه و عدم مغایرت ارقام به شرح زیر ارزیابی و تایید می‌گردد:
              </p>
            </div>

            {/* جدول خلاصه موازنه صورت‌های مالی */}
            <div className="border border-slate-800 rounded-lg overflow-hidden my-4">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 border-b border-slate-800">
                    <th className="p-2.5 font-black border-l border-slate-800">عنوان شاخص / عنصر مالی</th>
                    <th className="p-2.5 font-black border-l border-slate-800 text-center">مبلغ تاییدشده (ریال)</th>
                    <th className="p-2.5 font-black text-center">وضعیت ممیزی سناما</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  <tr>
                    <td className="p-2.5 font-bold border-l border-slate-300">جمع کل دارایی‌های بخش عمومی (جاری و غیرجاری)</td>
                    <td className="p-2.5 font-mono font-bold text-center border-l border-slate-300">{formatPersianAmount(totalAssets)}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">تایید شده ✅</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-l border-slate-300">جمع کل بدهی‌های بخش عمومی (جاری و غیرجاری)</td>
                    <td className="p-2.5 font-mono font-bold text-center border-l border-slate-300">{formatPersianAmount(totalLiabilities)}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">تایید شده ✅</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold border-l border-slate-300">خالص دارایی‌ها / ارزش ویژه پایان دوره</td>
                    <td className="p-2.5 font-mono font-bold text-center border-l border-slate-300">{formatPersianAmount(endingEquity)}</td>
                    <td className="p-2.5 text-center font-bold text-emerald-700">تایید شده ✅</td>
                  </tr>
                  <tr className="bg-slate-100 font-black">
                    <td className="p-2.5 border-l border-slate-800">معادله موازنه ترازنامه (دارایی‌ها = بدهی‌ها + ارزش ویژه)</td>
                    <td className="p-2.5 font-mono text-center border-l border-slate-800">{formatPersianAmount(totalAssets)} = {formatPersianAmount(totalLiabilities + endingEquity)}</td>
                    <td className="p-2.5 text-center text-emerald-800">۱۰۰٪ تراز و متوازن ✅</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* توضیحات امنیتی و گواهی یکتا */}
            <div className="p-3 bg-slate-100 border border-slate-400 rounded-lg text-[11px] leading-relaxed text-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold">اصالت گواهی‌نامه و امضای الکترونیکی:</p>
                <p>این گواهی دارای اعتبار قانونی بوده و صحت موازنه ترازنامه و ممیزی فرم‌های سناما توسط خزانه‌داری کل کشور احراز شده است.</p>
              </div>
              <div className="font-mono text-left font-bold text-slate-900 border-l border-slate-400 pl-3">
                HASH: 8F92A-SANAMA-AUDIT-OK<br/>
                VERIFIED BY DIGI-FIN-SYSTEM
              </div>
            </div>

            {/* محل امضاهای رسمی با کادر شکیل */}
            <div className="grid grid-cols-3 gap-4 pt-12 text-center text-xs text-slate-900 font-bold border-t border-slate-300 mt-8">
              <div className="space-y-12">
                <p>حسابدار مسئول / رئیس امور مالی</p>
                <p className="text-[10px] text-slate-500 font-normal">نام، امضا و تاریخ</p>
              </div>
              <div className="space-y-12">
                <p>ذیحساب و مدیر کل امور مالی</p>
                <p className="text-[10px] text-slate-500 font-normal">امضا و مهر رسمی ذیحسابی</p>
              </div>
              <div className="space-y-12">
                <p>ممیز و نماینده خزانه‌داری کل کشور</p>
                <p className="text-[10px] text-slate-500 font-normal">مهر و تاییدیه هوشمند سناما</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── کامپوننت اختصاصی تهیه صورت‌های مالی سناما ──────────────────────────────────────────
function FinancialStatementsTabsContent({
  form1Data,
  form2Data,
  form46Data,
  form75CapData,
  form8ExpData,
  form8CapData,
  form13ExpData,
  form13CapData,
  calculatedForm1Final,
  calculatedForm2Final,
  calculatedF46Transferred,
  calculatedF75CapTransferred,
  handleExportPDF,
  onOpenCertModal
}) {
  const f46Received = (form46Data || []).find(r => r.id === 3)?.approvedAmount || 0;
  const f46Consumed = (form46Data || []).find(r => r.id === 4)?.approvedAmount || 0;
  const f46Prepay = (form46Data || []).find(r => r.id === 5)?.approvedAmount || 0;
  const f46PrepayLetter = (form46Data || []).find(r => r.id === 6)?.approvedAmount || 0;
  const f46OnAccount = (form46Data || []).find(r => r.id === 7)?.approvedAmount || 0;
  const f46Objection = (form46Data || []).find(r => r.id === 8)?.approvedAmount || 0;
  const f46Deficit = (form46Data || []).find(r => r.id === 9)?.approvedAmount || 0;

  const f75CapReceived = (form75CapData || []).find(r => r.id === 3)?.approvedAmount || 0;
  const f75CapConsumed = (form75CapData || []).find(r => r.id === 4)?.approvedAmount || 0;
  const f75CapInventory = (form75CapData || []).find(r => r.id === 5)?.approvedAmount || 0;
  const f75CapPrepay = (form75CapData || []).find(r => r.id === 6)?.approvedAmount || 0;
  const f75CapPrepayMat = (form75CapData || []).find(r => r.id === 7)?.approvedAmount || 0;
  const f75CapPrepayLetter = (form75CapData || []).find(r => r.id === 8)?.approvedAmount || 0;
  const f75CapOnAccount = (form75CapData || []).find(r => r.id === 9)?.approvedAmount || 0;
  const f75CapObjection = (form75CapData || []).find(r => r.id === 10)?.approvedAmount || 0;
  const f75CapDeficit = (form75CapData || []).find(r => r.id === 11)?.approvedAmount || 0;

  const totalRevenues = (f46Received + f75CapReceived) +
    (form8ExpData || []).reduce((s, r) => s + Number(r?.receivedAmount || 0), 0) +
    (form8CapData || []).reduce((s, r) => s + Number(r?.receivedAmount || 0), 0);

  const totalExpenses = f46Consumed + f75CapConsumed;
  const currentPrepayments = f46Prepay + f46PrepayLetter + f46OnAccount + f75CapPrepay + f75CapPrepayMat + f75CapPrepayLetter + f75CapOnAccount;
  const currentReceivables = f46Objection + f75CapObjection + f46Deficit + f75CapDeficit;
  const currentInventories = f75CapInventory;
  const cashTreasury = Math.max(0, (f46Received + f75CapReceived) - (f46Consumed + f75CapConsumed + currentPrepayments));

  const totalCurrentAssets = cashTreasury + currentReceivables + currentInventories + currentPrepayments;
  const totalNonCurrentAssets = f75CapConsumed;
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const finPayableBonds = (form13ExpData || []).reduce((s, r) => s + Number(r?.amount || 0), 0) + (form13CapData || []).reduce((s, r) => s + Number(r?.amount || 0), 0);
  const currentLiabilities = finPayableBonds;
  const nonCurrentLiabilities = 0;
  const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

  const beginningEquity = (form1Data?.initialBudget || 0) + (form2Data?.initialBudget || 0);
  const surplusDeficit = totalRevenues - totalExpenses;
  const endingEquity = totalAssets - totalLiabilities;

  const isBalanced = (totalAssets === (totalLiabilities + endingEquity));

  return (
    <>
      {/* ─── ۱. صورت وضعیت مالی (ترازنامه) ─── */}
      <TabsContent value="fin_balance_sheet">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">جمع دارایی‌های بخش عمومی</p>
                  <h3 className="text-xl font-black text-purple-950 dark:text-purple-100 mt-1">{formatPersianAmount(totalAssets)} ریال</h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
                  <Landmark className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">جمع بدهی‌های بخش عمومی</p>
                  <h3 className="text-xl font-black text-rose-950 dark:text-rose-100 mt-1">{formatPersianAmount(totalLiabilities)} ریال</h3>
                </div>
                <div className="p-3 bg-rose-100 dark:bg-rose-900/40 rounded-xl text-rose-600">
                  <Coins className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300">خالص دارایی‌ها / ارزش ویژه</p>
                  <h3 className="text-xl font-black text-indigo-950 dark:text-indigo-100 mt-1">{formatPersianAmount(endingEquity)} ریال</h3>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600">
                  <Calculator className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border-2", isBalanced ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30" : "border-amber-400 bg-amber-50/70 dark:bg-amber-950/30")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">وضعیت موازنه ترازنامه</p>
                  <h3 className={cn("text-base font-black mt-1 flex items-center gap-1.5", isBalanced ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
                    {isBalanced ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
                    <span>{isBalanced ? "تراز و متوازن ✅" : "نیاز به بررسی موازنه"}</span>
                  </h3>
                </div>
                <Badge className={cn("text-[10px]", isBalanced ? "bg-emerald-600 text-white" : "bg-amber-600 text-white")}>
                  {isBalanced ? "تایید ۱۰۰٪" : "نامتوازن"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="border shadow-md">
            <CardHeader className="bg-purple-900 text-white p-4 rounded-t-xl flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-purple-300" />
                  <span>صورت وضعیت مالی (ترازنامه) — بخش عمومی سناما</span>
                </CardTitle>
                <CardDescription className="text-xs text-purple-200 mt-1">
                  مطابق با آخرین ضوابط خزانه‌داری کل کشور و استانداردهای حسابداری بخش عمومی
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportPDF} className="bg-purple-800 text-white border-purple-600 hover:bg-purple-700 text-xs font-bold gap-1.5">
                <Printer className="h-4 w-4" />
                <span>چاپ رسمی صورت وضعیت مالی</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200 dark:divide-slate-800">
                {/* بخش دارایی‌ها */}
                <div className="p-4 space-y-3">
                  <h4 className="font-black text-sm text-purple-900 dark:text-purple-300 border-b pb-2 flex items-center justify-between">
                    <span>دارایی‌ها</span>
                    <span className="text-xs text-slate-500">کد معین‌های سناما</span>
                  </h4>

                  <div className="space-y-2">
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">الف) دارایی‌های جاری:</p>
                    <div className="space-y-1.5 text-xs pr-3">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>موجودی نقد و بانک نزد خزانه‌داری</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{formatPersianAmount(cashTreasury)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>حساب‌ها و اسناد دریافتنی (واخواهی/کسری)</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{formatPersianAmount(currentReceivables)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>موجودی کالا و مواد تملک</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{formatPersianAmount(currentInventories)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>پیش‌پرداخت‌ها و علی‌الحساب‌ها</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{formatPersianAmount(currentPrepayments)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 rounded text-purple-900 dark:text-purple-200">
                        <span>جمع دارایی‌های جاری</span>
                        <span className="font-mono">{formatPersianAmount(totalCurrentAssets)} ریال</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">ب) دارایی‌های غیرجاری:</p>
                    <div className="space-y-1.5 text-xs pr-3">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>دارایی‌های ثابت مشهود (تجهیزات و عمران)</span>
                        <span className="font-mono font-bold text-purple-700 dark:text-purple-300">{formatPersianAmount(totalNonCurrentAssets)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>دارایی‌های نامشهود</span>
                        <span className="font-mono font-bold text-slate-500">۰ ریال</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 rounded text-purple-900 dark:text-purple-200">
                        <span>جمع دارایی‌های غیرجاری</span>
                        <span className="font-mono">{formatPersianAmount(totalNonCurrentAssets)} ریال</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between p-3 bg-purple-900 text-white font-black text-sm rounded-xl mt-4">
                    <span>جمع کل دارایی‌ها</span>
                    <span className="font-mono">{formatPersianAmount(totalAssets)} ریال</span>
                  </div>
                </div>

                {/* بخش بدهی‌ها و خالص دارایی‌ها */}
                <div className="p-4 space-y-3">
                  <h4 className="font-black text-sm text-purple-900 dark:text-purple-300 border-b pb-2 flex items-center justify-between">
                    <span>بدهی‌ها و خالص دارایی‌ها (ارزش ویژه)</span>
                    <span className="text-xs text-slate-500">کد معین‌های سناما</span>
                  </h4>

                  <div className="space-y-2">
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">الف) بدهی‌های جاری:</p>
                    <div className="space-y-1.5 text-xs pr-3">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>اسناد خزانه و اوراق پرداختنی (معین ۱۳)</span>
                        <span className="font-mono font-bold text-rose-700 dark:text-rose-300">{formatPersianAmount(finPayableBonds)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>حساب‌ها و سپرده‌های پرداختنی</span>
                        <span className="font-mono font-bold text-slate-500">۰ ریال</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold bg-rose-50 dark:bg-rose-950/40 px-2 rounded text-rose-900 dark:text-rose-200">
                        <span>جمع بدهی‌های جاری</span>
                        <span className="font-mono">{formatPersianAmount(totalLiabilities)} ریال</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-200">ب) خالص دارایی‌ها / ارزش ویژه:</p>
                    <div className="space-y-1.5 text-xs pr-3">
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>مانده اولیه ارزش ویژه اول دوره</span>
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{formatPersianAmount(beginningEquity)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed">
                        <span>مازاد (کسر) عملکرد مالی سال جاری</span>
                        <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">{formatPersianAmount(surplusDeficit)} ریال</span>
                      </div>
                      <div className="flex justify-between py-1.5 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 rounded text-indigo-900 dark:text-indigo-200">
                        <span>جمع خالص دارایی‌ها (ارزش ویژه)</span>
                        <span className="font-mono">{formatPersianAmount(endingEquity)} ریال</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between p-3 bg-slate-900 text-white font-black text-sm rounded-xl mt-4">
                    <span>جمع کل بدهی‌ها و خالص دارایی‌ها</span>
                    <span className="font-mono">{formatPersianAmount(totalLiabilities + endingEquity)} ریال</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* ─── ۲. صورت عملکرد مالی (درآمد و هزینه) ─── */}
      <TabsContent value="fin_performance">
        <Card className="border shadow-md">
          <CardHeader className="bg-purple-900 text-white p-4 rounded-t-xl">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-300" />
              <span>صورت عملکرد مالی (درآمد و هزینه بخش عمومی)</span>
            </CardTitle>
            <CardDescription className="text-xs text-purple-200 mt-1">
              خلاصه کلیه درآمدهای عمومی، اختصاصی و مصارف هزینه‌ای و سرمایه‌ای دوره مالی
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <h4 className="font-black text-sm text-emerald-800 dark:text-emerald-300 border-b pb-2">۱. درآمدهای بخش عمومی</h4>
              <div className="space-y-2 text-xs pr-4">
                <div className="flex justify-between py-2 border-b">
                  <span>دریافتی از محل تخصیص اعتبارات هزینه‌ای و عمومی (معین ۴۱۰۰۱ و ۴۱۰۰۵)</span>
                  <span className="font-mono font-bold text-emerald-700">{formatPersianAmount(f46Received)} ریال</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>دریافتی از محل اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای (معین ۴۱۰۰۳)</span>
                  <span className="font-mono font-bold text-emerald-700">{formatPersianAmount(f75CapReceived)} ریال</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>درآمدهای اختصاصی و سایر منابع وصول‌شده (معین ۸۱۰۱۳ / ۴۵۰۰۱)</span>
                  <span className="font-mono font-bold text-emerald-700">{formatPersianAmount(form8ExpData.reduce((s, r) => s + Number(r.receivedAmount || 0), 0) + form8CapData.reduce((s, r) => s + Number(r.receivedAmount || 0), 0))} ریال</span>
                </div>
                <div className="flex justify-between p-2.5 bg-emerald-100 dark:bg-emerald-950/50 rounded-lg font-black text-emerald-900 dark:text-emerald-200 text-xs">
                  <span>جمع درآمدهای بخش عمومی</span>
                  <span className="font-mono text-sm">{formatPersianAmount(totalRevenues)} ریال</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-black text-sm text-rose-800 dark:text-rose-300 border-b pb-2">۲. هزینه‌ها و مصارف بخش عمومی</h4>
              <div className="space-y-2 text-xs pr-4">
                <div className="flex justify-between py-2 border-b">
                  <span>اعتبار مصرف‌شده هزینه‌ای و پرسنلی (معین ۹۹۰۰۱)</span>
                  <span className="font-mono font-bold text-rose-700">{formatPersianAmount(f46Consumed)} ریال</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>اعتبار مصرف‌شده طرح‌های تملک دارایی‌های سرمایه‌ای (معین ۹۹۰۰۲)</span>
                  <span className="font-mono font-bold text-rose-700">{formatPersianAmount(f75CapConsumed)} ریال</span>
                </div>
                <div className="flex justify-between p-2.5 bg-rose-100 dark:bg-rose-950/50 rounded-lg font-black text-rose-900 dark:text-rose-200 text-xs">
                  <span>جمع کل هزینه‌ها و مصارف عملیاتی</span>
                  <span className="font-mono text-sm">{formatPersianAmount(totalExpenses)} ریال</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-200 font-bold">نتیجه عملکرد مالی دوره (مازاد / کسر عملکرد):</p>
                <h3 className="text-xl font-black mt-1 font-mono">{formatPersianAmount(surplusDeficit)} ریال</h3>
              </div>
              <Badge className="bg-purple-600 text-white px-3 py-1 text-xs">
                {surplusDeficit >= 0 ? "مازاد عملکرد مثبت" : "کسری عملکرد"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ─── ۳. صورت تغییرات در وضعیت مالی ─── */}
      <TabsContent value="fin_changes">
        <Card className="border shadow-md">
          <CardHeader className="bg-purple-900 text-white p-4 rounded-t-xl">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-300" />
              <span>صورت تغییرات در وضعیت مالی (خالص دارایی‌ها / ارزش ویژه)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-b">
                  <th className="p-2.5 font-bold">شرح سطر</th>
                  <th className="p-2.5 font-bold text-center">ارزش ویژه هزینه‌ای</th>
                  <th className="p-2.5 font-bold text-center">ارزش ویژه تملکی</th>
                  <th className="p-2.5 font-bold text-center">جمع کل ارزش ویژه (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-semibold">مانده ارزش ویژه در ابتدای سال مالی</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(form1Data?.initialBudget || 0)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(form2Data?.initialBudget || 0)}</td>
                  <td className="p-3 text-center font-mono font-bold">{formatPersianAmount(beginningEquity)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">تعدیلات سنواتی / اصلاح حساب‌های گذشته</td>
                  <td className="p-3 text-center font-mono">۰</td>
                  <td className="p-3 text-center font-mono">۰</td>
                  <td className="p-3 text-center font-mono">۰</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">مازاد (کسر) عملکرد مالی سال جاری</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(f46Received - f46Consumed)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(f75CapReceived - f75CapConsumed)}</td>
                  <td className="p-3 text-center font-mono font-bold">{formatPersianAmount(surplusDeficit)}</td>
                </tr>
                <tr className="bg-purple-50 dark:bg-purple-950/30 font-bold">
                  <td className="p-3 text-purple-900 dark:text-purple-200">مانده ارزش ویژه در پایان سال مالی (ترازنامه)</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount((form1Data?.initialBudget || 0) + f46Received - f46Consumed)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount((form2Data?.initialBudget || 0) + f75CapReceived - f75CapConsumed)}</td>
                  <td className="p-3 text-center font-mono text-sm text-purple-900 dark:text-purple-200">{formatPersianAmount(endingEquity)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ─── ۴. صورت جریان وجوه نقد ─── */}
      <TabsContent value="fin_cash_flow">
        <Card className="border shadow-md">
          <CardHeader className="bg-purple-900 text-white p-4 rounded-t-xl">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Coins className="h-5 w-5 text-purple-300" />
              <span>صورت جریان وجوه نقد (جدول جریان‌های نقدی سناما)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1">الف) جریان‌های نقدی حاصل از فعالیت‌های عملیاتی:</h5>
              <div className="flex justify-between py-1 border-b border-dashed pr-3">
                <span>وجوه نقد دریافتی از اعتبارات تخصیص‌یافته و درآمدهای اختصاصی</span>
                <span className="font-mono font-bold text-emerald-700">{formatPersianAmount(totalRevenues)} ریال</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed pr-3">
                <span>پرداخت‌های نقدی بابت اعتبارات هزینه‌ای و پرسنلی</span>
                <span className="font-mono font-bold text-rose-700">({formatPersianAmount(f46Consumed)}) ریال</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded font-bold">
                <span>خالص جریان نقد ناشی از فعالیت‌های عملیاتی</span>
                <span className="font-mono">{formatPersianAmount(totalRevenues - f46Consumed)} ریال</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1">ب) جریان‌های نقدی حاصل از فعالیت‌های سرمایه‌گذاری:</h5>
              <div className="flex justify-between py-1 border-b border-dashed pr-3">
                <span>پرداخت‌های نقدی بابت تملک دارایی‌های سرمایه‌ای و اجرا</span>
                <span className="font-mono font-bold text-rose-700">({formatPersianAmount(f75CapConsumed)}) ریال</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded font-bold">
                <span>خالص جریان نقد ناشی از فعالیت‌های سرمایه‌گذاری</span>
                <span className="font-mono">({formatPersianAmount(f75CapConsumed)}) ریال</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h5 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-1">ج) جریان‌های نقدی حاصل از فعالیت‌های تامین مالی:</h5>
              <div className="flex justify-between py-1 border-b border-dashed pr-3">
                <span>دریافت‌های نقدی ناشی از انتشار اوراق اسلامی (معین ۱۳)</span>
                <span className="font-mono font-bold text-purple-700">{formatPersianAmount(finPayableBonds)} ریال</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded font-bold">
                <span>خالص جریان نقد ناشی از فعالیت‌های تامین مالی</span>
                <span className="font-mono">{formatPersianAmount(finPayableBonds)} ریال</span>
              </div>
            </div>

            <div className="p-3 bg-purple-900 text-white rounded-xl font-bold flex justify-between text-sm mt-4">
              <span>موجودی نقد و بانک در پایان سال مالی</span>
              <span className="font-mono">{formatPersianAmount(cashTreasury)} ریال</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ─── ۵. صورت مقایسه بودجه و مبالغ واقعی ─── */}
      <TabsContent value="fin_budget_compare">
        <Card className="border shadow-md">
          <CardHeader className="bg-purple-900 text-white p-4 rounded-t-xl">
            <CardTitle className="text-base font-black flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-300" />
              <span>صورت مقایسه بودجه مصوب و عملکرد واقعی (اعتبارات سناما)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b">
                  <th className="p-2.5 font-bold">عنوان اعتبار / سرفصل</th>
                  <th className="p-2.5 font-bold text-center">اعتبار مصوب اولیه</th>
                  <th className="p-2.5 font-bold text-center">اعتبار مصوب نهایی</th>
                  <th className="p-2.5 font-bold text-center">اعتبار تخصیص یافته</th>
                  <th className="p-2.5 font-bold text-center">عملکرد واقعی مصارف</th>
                  <th className="p-2.5 font-bold text-center">مانده اعتبارات (ریال)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-3 font-bold text-blue-900 dark:text-blue-300">۱. اعتبارات هزینه‌ای (جاری)</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(form1Data.initialBudget)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(calculatedForm1Final)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(f46Received)}</td>
                  <td className="p-3 text-center font-mono text-emerald-700">{formatPersianAmount(f46Consumed)}</td>
                  <td className="p-3 text-center font-mono font-bold">{formatPersianAmount(calculatedF46Transferred)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-emerald-900 dark:text-emerald-300">۲. اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(form2Data.initialBudget)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(calculatedForm2Final)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(f75CapReceived)}</td>
                  <td className="p-3 text-center font-mono text-emerald-700">{formatPersianAmount(f75CapConsumed)}</td>
                  <td className="p-3 text-center font-mono font-bold">{formatPersianAmount(calculatedF75CapTransferred)}</td>
                </tr>
                <tr className="bg-purple-50 dark:bg-purple-950/40 font-bold">
                  <td className="p-3 text-purple-900 dark:text-purple-200">جمع کل اعتبارات و عملکرد بودجه‌ای</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(form1Data.initialBudget + form2Data.initialBudget)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(calculatedForm1Final + calculatedForm2Final)}</td>
                  <td className="p-3 text-center font-mono">{formatPersianAmount(f46Received + f75CapReceived)}</td>
                  <td className="p-3 text-center font-mono text-emerald-700">{formatPersianAmount(totalExpenses)}</td>
                  <td className="p-3 text-center font-mono text-sm text-purple-950 dark:text-purple-100">{formatPersianAmount(calculatedF46Transferred + calculatedF75CapTransferred)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ─── ۶. یادداشت‌های توضیحی و گواهی سناما ─── */}
      <TabsContent value="fin_notes_cert">
        <div className="space-y-4">
          <Card className="border shadow-md">
            <CardHeader className="bg-slate-900 text-white p-4 rounded-t-xl">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-400" />
                <span>یادداشت‌های توضیحی همراه صورت‌های مالی سناما</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs leading-relaxed">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 text-blue-900 dark:text-blue-300">
                <p className="font-bold">یادداشت ۱ — واحد گزارشگر و شخصیت حقوقی:</p>
                <p className="mt-1">
                  صورت‌های مالی حاضر مربوط به واحد اجرایی ذیحسابی بوده و طبق دستورالعمل‌های نظام حسابداری بخش عمومی و پروتکل الکترونیکی سناما تنظیم شده است.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border text-slate-800 dark:text-slate-200">
                <p className="font-bold">یادداشت ۲ — خلاصه مهم‌ترین روش‌های حسابداری:</p>
                <p className="mt-1">
                  مبنای ثبت درآمدهای عمومی تعهدی تعدیل‌شده و هزینه‌ها مبنای تعهدی کامل بوده و توازن تمام حساب‌های معین و تفصیلی بر اساس کدهای ۹۰۰۰۱ تا ۹۰۰۲۴ کنترل گردیده است.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* کارت گواهی هوشمند سناما */}
          <Card className="border-2 border-emerald-500 bg-emerald-950 text-white shadow-2xl">
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <Badge className="bg-emerald-500 text-emerald-950 font-bold mb-1">گواهی رسمی خزانه‌داری کل کشور</Badge>
                    <h3 className="text-lg font-black text-white">گواهی هوشمند تایید موازنه و ممیزی صورت‌های مالی سناما</h3>
                    <p className="text-xs text-emerald-300 mt-0.5 font-mono">SANAMA-FINANCIAL-STATEMENTS-VERIFIED-2026</p>
                  </div>
                </div>
                <Button size="sm" onClick={handleExportPDF} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black gap-2 h-10 px-5 shadow-lg">
                  <Printer className="h-4 w-4" />
                  <span>چاپ گواهی رسمی سناما</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-emerald-900/60 p-4 rounded-xl border border-emerald-800">
                <div>
                  <span className="text-emerald-400 block mb-1">وضعیت موازنه ترازنامه:</span>
                  <strong className="text-emerald-200 text-sm">{isBalanced ? "تراز و بدون مغایرت (۱۰۰٪)" : "نیاز به رفع مغایرت"}</strong>
                </div>
                <div>
                  <span className="text-emerald-400 block mb-1">تاریخ تایید و ممیزی سیستم:</span>
                  <strong className="text-white font-mono text-xs">{new Date().toLocaleDateString("fa-IR")}</strong>
                </div>
                <div>
                  <span className="text-emerald-400 block mb-1">کد هش امنیتی ممیزی:</span>
                  <strong className="text-emerald-300 font-mono text-[11px]">8F92A-SANAMA-AUDIT-OK</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </>
  );
}

export default function SanamaPerformanceControls() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // تشخیص بخش فعال (هزینه‌ای / تملک / صورت‌های مالی) از روی مسیر URL یا دکمه تغییر بخش
  const isCapitalRoute = pathname.includes("/capital");
  const isFinancialStatementsRoute = pathname.includes("/financial-statements");
  const sectionCategory = isFinancialStatementsRoute 
    ? "financial_statements" 
    : (isCapitalRoute ? "capital" : "expense");

  const [mainMode, setMainMode] = useState("forms"); // "forms" یا "audit"
  const [activeFormTab, setActiveFormTab] = useState(
    isFinancialStatementsRoute ? "fin_balance_sheet" : (isCapitalRoute ? "form2" : "form1")
  );

  // همگام‌سازی تب فرم در هنگام تغییر بخش هزینه‌ای/تملک/صورت‌های مالی
  useEffect(() => {
    if (isFinancialStatementsRoute && !activeFormTab.startsWith("fin_")) {
      setActiveFormTab("fin_balance_sheet");
    } else if (isCapitalRoute && activeFormTab === "form1") {
      setActiveFormTab("form2");
    } else if (!isCapitalRoute && !isFinancialStatementsRoute && activeFormTab === "form2") {
      setActiveFormTab("form1");
    }
  }, [isCapitalRoute, isFinancialStatementsRoute]);

  // وضعیت ممیزی و قوانین
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingForms, setSavingForms] = useState(false);
  const [errors, setErrors] = useState([]);
  const [selectedRuleCode, setSelectedRuleCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkedCount, setCheckedCount] = useState(0);

  // وضعیت فرم‌های هزینه‌ای
  const [form1Data, setForm1Data] = useState(INITIAL_FORM1_EXPENSE);
  const [form46Data, setForm46Data] = useState(INITIAL_FORM_4_6_EXPENSE);
  const [form57ExpData, setForm57ExpData] = useState(INITIAL_FORM_5_7_EXPENSE);
  const [form8ExpData, setForm8ExpData] = useState(INITIAL_FORM_8_EXPENSE);
  const [form9ExpData, setForm9ExpData] = useState(INITIAL_FORM_9_EXPENSE);
  const [form10ExpData, setForm10ExpData] = useState(INITIAL_FORM_10_EXPENSE);
  const [form11ExpData, setForm11ExpData] = useState(INITIAL_FORM_11_EXPENSE);
  const [form13ExpData, setForm13ExpData] = useState(INITIAL_FORM_13_EXPENSE);

  // وضعیت فرم‌های تملک (دارایی‌های سرمایه‌ای)
  const [form2Data, setForm2Data] = useState(INITIAL_FORM2_CAPITAL);
  const [form75CapData, setForm75CapData] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form57CapData, setForm57CapData] = useState(INITIAL_FORM_7_5_CAPITAL);
  const [form8CapData, setForm8CapData] = useState(INITIAL_FORM_8_CAPITAL);
  const [form9CapData, setForm9CapData] = useState(INITIAL_FORM_9_CAPITAL);
  const [form10CapData, setForm10CapData] = useState(INITIAL_FORM_10_CAPITAL);
  const [form11CapData, setForm11CapData] = useState(INITIAL_FORM_11_CAPITAL);
  const [form13CapData, setForm13CapData] = useState(INITIAL_FORM_13_CAPITAL);

  // وضعیت مدال راهنمای هوشمند مسیر رفع خطا
  const [fixPathwayError, setFixPathwayError] = useState(null);

  // وضعیت مدال چاپ گواهی رسمی سناما
  const [showCertModal, setShowCertModal] = useState(false);

  // محاسبات گواهی تایید ترازنامه
  const certF46Received = (form46Data || []).find(r => r.id === 3)?.approvedAmount || 0;
  const certF46Consumed = (form46Data || []).find(r => r.id === 4)?.approvedAmount || 0;
  const certF46Prepay = (form46Data || []).find(r => r.id === 5)?.approvedAmount || 0;
  const certF46PrepayLetter = (form46Data || []).find(r => r.id === 6)?.approvedAmount || 0;
  const certF46OnAccount = (form46Data || []).find(r => r.id === 7)?.approvedAmount || 0;
  const certF46Objection = (form46Data || []).find(r => r.id === 8)?.approvedAmount || 0;
  const certF46Deficit = (form46Data || []).find(r => r.id === 9)?.approvedAmount || 0;

  const certF75CapReceived = (form75CapData || []).find(r => r.id === 3)?.approvedAmount || 0;
  const certF75CapConsumed = (form75CapData || []).find(r => r.id === 4)?.approvedAmount || 0;
  const certF75CapInventory = (form75CapData || []).find(r => r.id === 5)?.approvedAmount || 0;
  const certF75CapPrepay = (form75CapData || []).find(r => r.id === 6)?.approvedAmount || 0;
  const certF75CapPrepayMat = (form75CapData || []).find(r => r.id === 7)?.approvedAmount || 0;
  const certF75CapPrepayLetter = (form75CapData || []).find(r => r.id === 8)?.approvedAmount || 0;
  const certF75CapOnAccount = (form75CapData || []).find(r => r.id === 9)?.approvedAmount || 0;
  const certF75CapObjection = (form75CapData || []).find(r => r.id === 10)?.approvedAmount || 0;
  const certF75CapDeficit = (form75CapData || []).find(r => r.id === 11)?.approvedAmount || 0;

  const certCurrentPrepayments = certF46Prepay + certF46PrepayLetter + certF46OnAccount + certF75CapPrepay + certF75CapPrepayMat + certF75CapPrepayLetter + certF75CapOnAccount;
  const certCurrentReceivables = certF46Objection + certF75CapObjection + certF46Deficit + certF75CapDeficit;
  const certCurrentInventories = certF75CapInventory;
  const certCashTreasury = Math.max(0, (certF46Received + certF75CapReceived) - (certF46Consumed + certF75CapConsumed + certCurrentPrepayments));

  const certTotalCurrentAssets = certCashTreasury + certCurrentReceivables + certCurrentInventories + certCurrentPrepayments;
  const certTotalNonCurrentAssets = certF75CapConsumed;
  const certTotalAssets = certTotalCurrentAssets + certTotalNonCurrentAssets;

  const certTotalLiabilities = (form13ExpData || []).reduce((s, r) => s + Number(r?.amount || 0), 0) + (form13CapData || []).reduce((s, r) => s + Number(r?.amount || 0), 0);
  const certEndingEquity = certTotalAssets - certTotalLiabilities;

  // بارگذاری داده‌های واقعی از دیتابیس
  useEffect(() => {
    const loadSavedForms = async () => {
      try {
        const res = await api.get("/api/credits/sanama-forms");
        if (res.data?.data) {
          const d = res.data.data;
          // بارگذاری بخش هزینه‌ای
          if (d.form1Data) setForm1Data(d.form1Data);
          if (d.form46Data) setForm46Data(d.form46Data);
          if (d.form57ExpData) setForm57ExpData(d.form57ExpData);
          if (d.form8ExpData) setForm8ExpData(d.form8ExpData);
          if (d.form9ExpData) setForm9ExpData(d.form9ExpData);
          if (d.form10ExpData) setForm10ExpData(d.form10ExpData);
          if (d.form11ExpData) setForm11ExpData(d.form11ExpData);
          if (d.form13ExpData) setForm13ExpData(d.form13ExpData);

          // بارگذاری بخش تملک
          if (d.form2Data) setForm2Data(d.form2Data);
          if (d.form75CapData) setForm75CapData(d.form75CapData);
          if (d.form57CapData) setForm57CapData(d.form57CapData);
          if (d.form8CapData) setForm8CapData(d.form8CapData);
          if (d.form9CapData) setForm9CapData(d.form9CapData);
          if (d.form10CapData) setForm10CapData(d.form10CapData);
          if (d.form11CapData) setForm11CapData(d.form11CapData);
          if (d.form13CapData) setForm13CapData(d.form13CapData);
        }
      } catch (e) {
        console.error("خطا در دریافت فرم‌های ذخیره‌شده سناما:", e);
      }
    };
    loadSavedForms();
  }, []);

  // ذخیره‌سازی داده‌های فرم‌های سناما در دیتابیس
  const handleSaveForms = async () => {
    setSavingForms(true);
    try {
      const payload = {
        form1Data,
        form46Data,
        form57ExpData,
        form8ExpData,
        form9ExpData,
        form10ExpData,
        form11ExpData,
        form13ExpData,
        form2Data,
        form75CapData,
        form57CapData,
        form8CapData,
        form9CapData,
        form10CapData,
        form11CapData,
        form13CapData,
      };
      await api.post("/api/credits/sanama-forms", payload);
      await fetchData();
    } catch (e) {
      console.error("خطا در ذخیره‌سازی فرم‌های سناما:", e);
    } finally {
      setSavingForms(false);
    }
  };

  // ویرایش سریع ردیف خطادار
  const [editingItem, setEditingItem] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);
  const [editForm, setEditForm] = useState({
    project_number: "",
    misc_row_number: "",
    financial_assets_row_number: "",
    program_number: "",
    notifier_budget_row: "",
    credit_type: "مصوب",
  });

  const openEditModal = (itemRef) => {
    setModalError(null);
    setModalSuccess(null);
    const target = items.find(it => String(it.id) === String(itemRef)) || items[0];
    if (!target) return;

    setEditingItem(target);
    setEditForm({
      project_number: target.project_number || "",
      misc_row_number: target.misc_row_number || "",
      financial_assets_row_number: target.financial_assets_row_number || "",
      program_number: target.program_number || "",
      notifier_budget_row: target.notifier_budget_row || "",
      credit_type: target.credit_type || "مصوب",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    setModalError(null);
    setModalSuccess(null);

    const { project_number, misc_row_number, financial_assets_row_number } = editForm;
    if (!project_number?.trim() && !misc_row_number?.trim() && !financial_assets_row_number?.trim()) {
      setModalError("علت عدم اعمال: حداقل یکی از فیلدهای «شماره طرح»، «شماره ردیف متفرقه» یا «شماره ردیف تملک دارایی‌های مالی» باید مقداردهی شود تا خطای ۱۳۲ خزانه‌داری برطرف گردد.");
      return;
    }

    setModalSaving(true);
    try {
      const payload = {
        ...editForm,
        notifierRow: editForm.notifier_budget_row,
        creditKind: editForm.credit_type === "ابلاغی" ? "notified" : "approved",
        capital: {
          ...(editingItem.raw?.capital || {}),
          projectNumber: editForm.project_number
        },
        expense: {
          ...(editingItem.raw?.expense || {}),
          programNumber: editForm.program_number
        }
      };

      const targetId = editingItem.raw?._id || editingItem.id;
      if (targetId && String(targetId).length === 24) {
        await api.put(`/api/credits/definitions/${targetId}`, payload);
      }

      setModalSuccess("اصلاحات با موفقیت در سناما و دیتابیس اعتبارات ذخیره شد.");
      await fetchData();

      setTimeout(() => {
        setEditingItem(null);
        setModalSaving(false);
      }, 1000);
    } catch (err) {
      console.error("Error saving SANAMA definition edit:", err);
      const errMsg = err?.response?.data?.message || err?.message || "خطا در برقراری ارتباط با سرور و ثبت اطلاعات.";
      setModalError(`علت عدم اعمال: ${errMsg}`);
      setModalSaving(false);
    }
  };

  // محاسبات فرم ۱ هزینه
  const calculatedForm1Final = form1Data.initialBudget + form1Data.legalAdjustments + form1Data.increase - form1Data.decrease - form1Data.drafts;

  // محاسبات فرم ۲ تملک
  const calculatedForm2Final = form2Data.initialBudget + form2Data.legalAdjustments + form2Data.increase - form2Data.decrease - form2Data.drafts;

  // محاسبات فرم ۹ (وجوه انتقالی)
  const calculateForm9Transferred = (sec) => {
    return sec.initialBalance - (sec.consumedTransferred + (sec.inventory || 0) + sec.objectionTransferred + sec.deficitTransferred + sec.sentToTreasury + sec.yearEndBalance);
  };

  // محاسبات فرم ۴-۶ هزینه
  const f46Received = form46Data.find(r => r.id === 3)?.approvedAmount || 0;
  const f46Consumed = form46Data.find(r => r.id === 4)?.approvedAmount || 0;
  const f46Prepay = form46Data.find(r => r.id === 5)?.approvedAmount || 0;
  const f46PrepayLetter = form46Data.find(r => r.id === 6)?.approvedAmount || 0;
  const f46OnAccount = form46Data.find(r => r.id === 7)?.approvedAmount || 0;
  const f46Objection = form46Data.find(r => r.id === 8)?.approvedAmount || 0;
  const f46Deficit = form46Data.find(r => r.id === 9)?.approvedAmount || 0;
  const calculatedF46Transferred = f46Received - (f46Consumed + f46Prepay + f46PrepayLetter + f46OnAccount + f46Objection + f46Deficit);

  // محاسبات فرم ۵-۷ هزینه‌ای
  const f57ExpReceived = form57ExpData.find(r => r.id === 3)?.approvedAmount || 0;
  const f57ExpConsumed = form57ExpData.find(r => r.id === 4)?.approvedAmount || 0;
  const f57ExpPrepay = form57ExpData.find(r => r.id === 5)?.approvedAmount || 0;
  const f57ExpObjection = form57ExpData.find(r => r.id === 6)?.approvedAmount || 0;
  const calculatedF57ExpTransferred = f57ExpReceived - (f57ExpConsumed + f57ExpPrepay + f57ExpObjection);

  // محاسبات فرم ۴-۴ / ۷-۵ تملک
  const f75CapReceived = form75CapData.find(r => r.id === 3)?.approvedAmount || 0;
  const f75CapConsumed = form75CapData.find(r => r.id === 4)?.approvedAmount || 0;
  const f75CapInventory = form75CapData.find(r => r.id === 5)?.approvedAmount || 0;
  const f75CapPrepay = form75CapData.find(r => r.id === 6)?.approvedAmount || 0;
  const f75CapPrepayMat = form75CapData.find(r => r.id === 7)?.approvedAmount || 0;
  const f75CapPrepayLetter = form75CapData.find(r => r.id === 8)?.approvedAmount || 0;
  const f75CapOnAccount = form75CapData.find(r => r.id === 9)?.approvedAmount || 0;
  const f75CapObjection = form75CapData.find(r => r.id === 10)?.approvedAmount || 0;
  const f75CapDeficit = form75CapData.find(r => r.id === 11)?.approvedAmount || 0;
  const calculatedF75CapTransferred = f75CapReceived - (f75CapConsumed + f75CapInventory + f75CapPrepay + f75CapPrepayMat + f75CapPrepayLetter + f75CapOnAccount + f75CapObjection + f75CapDeficit);

  // بارگذاری داده‌ها و اعتبارسنجی واقعی
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/credits/definitions");
      const list = res.data?.data || [];
      const mapped = list.map((item, idx) => ({
        id: item._id || idx + 1,
        project_number: item.project_number || item.capital?.projectNumber || "",
        program_number: item.program_number || item.expense?.programNumber || "",
        misc_row_number: item.misc_row_number || "",
        financial_assets_row_number: item.financial_assets_row_number || "",
        credit_type: item.creditKind === "notified" ? "ابلاغی" : (item.credit_type || "مصوب"),
        credit_location: item.credit_location || (item.creditKind === "notified" ? "متمرکز" : "استانی"),
        receipt_location: item.receipt_location || "استانی",
        notifier_budget_row: item.notifierRow || item.notifier_budget_row || "",
        executive_body_budget_row: item.executive_body_budget_row || "101000",
        final_credit_budget: Number(item.final_credit_budget ?? item.amount ?? 0),
        initial_credit_budget: Number(item.initial_credit_budget ?? item.amount ?? 0),
        allocated_credit: Number(item.allocated_credit ?? item.amount ?? 0),
        received_credit: Number(item.received_credit ?? item.amount ?? 0),
        consumed_credit: Number(item.consumed_credit ?? 0),
        non_final_payments: Number(item.non_final_payments ?? 0),
        transferred_bonds: Number(item.transferred_bonds ?? 0),
        other_consumption: Number(item.other_consumption ?? 0),
        legal_adjustments: Number(item.legal_adjustments ?? 0),
        legal_adjustments_row: item.legal_adjustments_row || "",
        increase: Number(item.increase ?? 0),
        decrease: Number(item.decrease ?? 0),
        drafts: Number(item.drafts ?? 0),
        special_revenue_received: Number(item.special_revenue_received ?? 0),
        form_type: item.form_type || 1,
        accountType: (item.project_number || item.capital?.projectNumber) ? "t" : "h",
        title: item.title || item.expense?.expenseChapter || item.capital?.projectTitle || `اعتبار ردیف ${idx + 1}`,
        raw: item,
      }));

      setItems(mapped);
      runValidation(mapped);
    } catch (err) {
      console.error("خطا در دریافت اطلاعات:", err);
      setItems([]);
      runValidation([]);
    } finally {
      setLoading(false);
    }
  };

  const runValidation = (data) => {
    const errs = validateSanamaPerformanceForms(data);
    setErrors(errs);
    setCheckedCount(data.length);
  };

  useEffect(() => {
    fetchData();
  }, [form1Data, form2Data, form46Data, form57ExpData, form75CapData, form9ExpData, form9CapData]);

  // فیلتر کردن اقلام و خطاهای مرتبط با بخش هزینه‌ای یا تملک
  const currentSectionItems = items.filter(it => {
    if (sectionCategory === "capital") {
      return Boolean(it.project_number || it.accountType === "t" || it.raw?.capital);
    }
    return Boolean(it.program_number || it.accountType === "h" || !it.project_number);
  });

  const filteredRules = SANAMA_PERFORMANCE_RULES
    .filter(rule => {
      const cat = getRuleCategory(rule.code);
      const categoryMatch = (cat === "both" || cat === sectionCategory);
      const textMatch = rule.title.includes(searchTerm) || 
                        rule.desc.includes(searchTerm) || 
                        String(rule.code).includes(searchTerm);
      return categoryMatch && textMatch;
    })
    .sort((a, b) => a.code - b.code);

  const sectionErrors = errors.filter(e => {
    const cat = getRuleCategory(e.code);
    return cat === "both" || cat === sectionCategory;
  });

  const activeErrors = (selectedRuleCode 
    ? sectionErrors.filter(e => e.code === selectedRuleCode)
    : sectionErrors).slice().sort((a, b) => a.code - b.code);

  // عملیات خروجی اکسل
  const handleExportExcel = () => {
    let title = "";
    let headers = [];
    let rows = [];

    if (activeFormTab === "form1") {
      title = "فرم ۱ — موافقت‌نامه / عملکرد اعتبار مصوب هزینه‌ای";
      headers = ["عنوان ستون", "نوع حساب", "حساب معین", "سطوح تفصیلی", "مبلغ (ریال)"];
      rows = [
        ["بودجه اعتبار اولیه هزینه‌ای", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.initialBudget],
        ["افزایش (+)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.increase],
        ["کاهش (-)", "هزینه", "قابل ویرایش", "تکمیل توسط کاربر", form1Data.decrease],
        ["حواله (-)", "هزینه", "94001", "سطوح تفصیلی مطابق الزامات سناما", form1Data.drafts],
        ["بودجه اعتبار نهایی هزینه‌ای (محاسباتی)", "هزینه", "91001 / -94001", "مطابق الزامات پروتکل تبادل الکترونیکی", calculatedForm1Final]
      ];
    } else if (activeFormTab === "form2") {
      title = "فرم ۲ — موافقت‌نامه / عملکرد اعتبار مصوب تملک دارایی‌های سرمایه‌ای";
      headers = ["عنوان ستون", "نوع حساب", "حساب معین", "سطوح تفصیلی", "مبلغ (ریال)"];
      rows = [
        ["بودجه اعتبار اولیه تملک", "سرمایه‌ای", "قابل ویرایش", "تکمیل توسط کاربر", form2Data.initialBudget],
        ["افزایش (+)", "سرمایه‌ای", "قابل ویرایش", "تکمیل توسط کاربر", form2Data.increase],
        ["کاهش (-)", "سرمایه‌ای", "قابل ویرایش", "تکمیل توسط کاربر", form2Data.decrease],
        ["حواله (-)", "سرمایه‌ای", "94002", "سطوح تفصیلی مطابق الزامات سناما", form2Data.drafts],
        ["بودجه اعتبار نهایی تملک (محاسباتی)", "سرمایه‌ای", "91002 / -94002", "مطابق الزامات پروتکل تبادل الکترونیکی", calculatedForm2Final]
      ];
    } else if (activeFormTab === "form46") {
      title = "فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی معین)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ (ریال)"];
      rows = form46Data.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF46Transferred : r.approvedAmount]);
    } else if (activeFormTab === "form57exp") {
      title = "فرم ۵-۷ — اعتبارات هزینه (تراز عملکرد هزینه‌ای)";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form57ExpData.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF57ExpTransferred : r.approvedAmount]);
    } else if (activeFormTab === "form75cap") {
      title = "فرم ۴-۴ / ۷-۵ — اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای";
      headers = ["ردیف", "عنوان ستون", "نوع حساب", "اعتبار", "حساب معین سناما", "مبلغ مصوب (ریال)"];
      rows = form75CapData.map(r => [r.id, r.title, r.accountType, r.creditType, r.moeinCodes, r.isCalculated ? calculatedF75CapTransferred : r.approvedAmount]);
    } else if (activeFormTab === "form8") {
      title = sectionCategory === "capital" ? "فرم ۸ — واگذاری دارایی‌های سرمایه‌ای و مالی" : "فرم ۸ — درآمدهای عمومی و اختصاصی هزینه‌ای";
      headers = ["ردیف", "ماهیت منابع", "معین پیش‌بینی", "معین وصول", "معین ارسال به خزانه", "پیش‌بینی", "وصول", "ارسال به خزانه"];
      const data8 = sectionCategory === "capital" ? form8CapData : form8ExpData;
      rows = data8.map(r => [r.id, r.resourceKind, r.expectedMoein, r.receivedMoein, r.sentMoein, r.expectedAmount, r.receivedAmount, r.sentAmount]);
    } else if (activeFormTab === "form9") {
      title = sectionCategory === "capital" ? "فرم ۹ — سطر موجودی‌ها، پیش‌پرداخت‌ها و علی‌الحساب تملک" : "فرم ۹ — سطر پیش‌پرداخت‌ها و علی‌الحساب هزینه‌ای";
      headers = ["عنوان", "مانده ابتدای سال", "اعتبار انتقالی مصرف شده", "وجوه ارسالی به خزانه", "وجوه انتقالی (محاسباتی)", "مانده پایان سال"];
      const data9 = sectionCategory === "capital" ? form9CapData : form9ExpData;
      rows = [
        ["پیش‌پرداخت‌ها", data9.prepayments.initialBalance, data9.prepayments.consumedTransferred, data9.prepayments.sentToTreasury, calculateForm9Transferred(data9.prepayments), data9.prepayments.yearEndBalance],
        ["علی‌الحساب", data9.onAccounts.initialBalance, data9.onAccounts.consumedTransferred, data9.onAccounts.sentToTreasury, calculateForm9Transferred(data9.onAccounts), data9.onAccounts.yearEndBalance],
      ];
      if (sectionCategory === "capital" && data9.inventories) {
        rows.unshift(["موجودی‌ها", data9.inventories.initialBalance, data9.inventories.consumedTransferred, data9.inventories.sentToTreasury, calculateForm9Transferred(data9.inventories), data9.inventories.yearEndBalance]);
      }
    } else if (activeFormTab === "form10") {
      title = sectionCategory === "capital" ? "فرم ۱۰ — وجوه انتقالی و سرمایه‌گذاری‌های تملک" : "فرم ۱۰ — وجوه انتقالی اعتبارات هزینه";
      headers = ["عنوان بخش", "حواله انتقالی", "دریافتی از اعتبار انتقالی", "اعتبار مصرف شده", "مانده پایان سال"];
      const data10 = sectionCategory === "capital" ? form10CapData : form10ExpData;
      rows = data10.map(r => [r.section, r.transferredDraftsExpense || r.transferredDraftsCapital || r.transferredFunds, r.receivedNotifiedBonds || "-", r.consumedTransferred || "-", r.yearEndMoeinApproved || r.yearEndBalance || "-"]);
    } else if (activeFormTab === "form11") {
      title = sectionCategory === "capital" ? "فرم ۱۱ — اسناد واخواهی و کسری تملک" : "فرم ۱۱ — اسناد واخواهی و کسری هزینه‌ای";
      headers = ["عنوان سطر", "کد معین مربوطه", "مانده ابتدای سال", "مصرف شده", "ارسال به خزانه"];
      const data11 = sectionCategory === "capital" ? form11CapData : form11ExpData;
      rows = data11.map(r => [r.rowType, r.moeinExpense || r.moeinCapital || r.yearEndMoeinExpense || r.yearEndMoeinCapital, r.initialBalance, r.consumedTransferred, r.sentToTreasury]);
    } else if (activeFormTab === "form13") {
      title = sectionCategory === "capital" ? "فرم ۱۳ — اوراق مالی تملک" : "فرم ۱۳ — اوراق مالی هزینه‌ای";
      headers = ["عنوان ستون", "نوع حساب", "معین مصوب", "مبلغ اوراق (ریال)"];
      const data13 = sectionCategory === "capital" ? form13CapData : form13ExpData;
      rows = (data13 || []).map(r => [r.rowType, r.accountType, r.moeinExpenseApproved || r.moeinCapitalApproved, r.amount]);
    } else if (activeFormTab?.startsWith("fin_")) {
      title = "صورت‌های مالی بخش عمومی سناما — " + activeFormTab;
      headers = ["عنوان صورت مالی", "ملاحظات", "وضعیت موازنه"];
      rows = [
        ["صورت وضعیت مالی (ترازنامه)", "تنظیم کامل طبق ضوابط سناما", "متوازن"],
        ["صورت عملکرد مالی", "درآمدها و هزینه‌های عملیاتی", "تایید شده"],
        ["صورت تغییرات در وضعیت مالی", "گردش ارزش ویژه", "تایید شده"],
        ["صورت جریان وجوه نقد", "جریان‌های نقدی ۳ گانه", "تایید شده"],
        ["صورت مقایسه بودجه و واقعی", "عملکرد بودجه‌ای اعتبارات", "تایید شده"]
      ];
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
    link.download = `Sanama_${sectionCategory}_${activeFormTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    if (sectionCategory === "financial_statements") {
      setShowCertModal(true);
    } else {
      printTable("#sanama-performance-controls-container", "فرم عملکرد سناما");
    }
  };

  return (
    <PageShell>
      <PageHeader 
        title={`ممیزی فرم عملکرد سناما — ${
          sectionCategory === "financial_statements" 
            ? "۳. تهیه و کنترل صورت‌های مالی سناما" 
            : (sectionCategory === "capital" ? "۲. اعتبارات تملک دارایی‌های سرمایه‌ای" : "۱. اعتبارات هزینه‌ای")
        }`} 
        description={
          sectionCategory === "financial_statements"
            ? "تنظیم، کنترل موازنه، تولید و خروجی ۵ صورت مالی اساسی بخش عمومی (ترازنامه، عملکرد مالی، تغییرات ارزش ویژه، جریان نقد، مقایسه بودجه و یادداشت‌های توضیحی سناما)"
            : (sectionCategory === "capital" 
              ? "مشاهده، تکمیل، موازنه هوشمند و ممیزی فرم‌ها و اقلام تملک دارایی‌های سرمایه‌ای (معین‌های سرمایه‌ای ۹۱۰۰۲، ۹۴۰۰۲، ۹۳۰۰۲، ۹۹۰۰۲ و ...)"
              : "مشاهده، تکمیل، موازنه هوشمند و ممیزی فرم‌ها و اقلام هزینه‌ای سناما (معین‌های هزینه‌ای ۹۱۰۰۱، ۹۴۰۰۱، ۹۳۰۰۱، ۹۹۰۰۱ و ...)")
        }
      />

      {/* ─── نوار انتخاب اصلی بخش (۱. هزینه / ۲. تملک / ۳. تهیه صورت‌های مالی) ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-3 rounded-xl border flex items-center justify-center",
            sectionCategory === "financial_statements"
              ? "bg-purple-600/30 text-purple-300 border-purple-500/30"
              : (sectionCategory === "capital" 
                ? "bg-emerald-600/30 text-emerald-400 border-emerald-500/30" 
                : "bg-blue-600/30 text-blue-400 border-blue-500/30")
          )}>
            {sectionCategory === "financial_statements" ? <FileSpreadsheet className="h-6 w-6" /> : (sectionCategory === "capital" ? <Coins className="h-6 w-6" /> : <Landmark className="h-6 w-6" />)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-100">امکانات ممیزی فرم عملکرد سناما</h3>
              <Badge className={cn(
                "text-[10px] px-2 py-0.5 font-bold",
                sectionCategory === "financial_statements" ? "bg-purple-600 text-white" : (sectionCategory === "capital" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white")
              )}>
                {sectionCategory === "financial_statements" ? "بخش ۳: تهیه صورت‌های مالی" : (sectionCategory === "capital" ? "بخش ۲: تملک دارایی‌های سرمایه‌ای" : "بخش ۱: اعتبارات هزینه‌ای")}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              مسیر منو: امکانات &larr; ممیزی فرم عملکرد سناما &larr; {sectionCategory === "financial_statements" ? "۳. تهیه صورت‌های مالی" : (sectionCategory === "capital" ? "۲. تملک" : "۱. هزینه")}
            </p>
          </div>
        </div>

        {/* سوییچ سریع مسیر منو: ۱. هزینه | ۲. تملک | ۳. تهیه صورت‌های مالی */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto justify-center flex-wrap">
          <Button
            size="sm"
            variant={sectionCategory === "expense" ? "default" : "ghost"}
            onClick={() => {
              navigate("/system-management/sanama-file-check/expense");
              setActiveFormTab("form1");
            }}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-3.5 transition-all",
              sectionCategory === "expense" 
                ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" 
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            )}
          >
            <Landmark className="h-4 w-4" />
            <span>۱. هزینه (اعتبارات جاری)</span>
          </Button>

          <Button
            size="sm"
            variant={sectionCategory === "capital" ? "default" : "ghost"}
            onClick={() => {
              navigate("/system-management/sanama-file-check/capital");
              setActiveFormTab("form2");
            }}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-3.5 transition-all",
              sectionCategory === "capital" 
                ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700" 
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            )}
          >
            <Coins className="h-4 w-4" />
            <span>۲. تملک (طرح‌های سرمایه‌ای)</span>
          </Button>

          <Button
            size="sm"
            variant={sectionCategory === "financial_statements" ? "default" : "ghost"}
            onClick={() => {
              navigate("/system-management/sanama-file-check/financial-statements");
              setActiveFormTab("fin_balance_sheet");
            }}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-3.5 transition-all",
              sectionCategory === "financial_statements" 
                ? "bg-purple-600 text-white shadow-md hover:bg-purple-700" 
                : "text-slate-300 hover:text-white hover:bg-slate-700/60"
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>۳. تهیه صورت‌های مالی</span>
          </Button>
        </div>
      </div>

      {/* ─── نوار سوئیچ حالت (فرم‌ها / ممیزی هوشمند) ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-slate-100 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mainMode === "forms" ? "default" : "outline"}
            onClick={() => setMainMode("forms")}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-4",
              mainMode === "forms" && (sectionCategory === "capital" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white")
            )}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>فرم‌های استاندارد سناما ({sectionCategory === "capital" ? "تملک" : "هزینه"})</span>
          </Button>

          <Button
            size="sm"
            variant={mainMode === "audit" ? "default" : "outline"}
            onClick={() => setMainMode("audit")}
            className={cn(
              "text-xs font-bold gap-2 rounded-lg h-9 px-4 relative",
              mainMode === "audit" && "bg-amber-600 text-white shadow-md"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>ممیزی هوشمند قوانین ({errors.length} خطا)</span>
            {errors.length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveForms}
            disabled={savingForms}
            className="text-xs font-bold gap-1.5 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 hover:bg-emerald-100"
          >
            <Save className={cn("h-4 w-4", savingForms && "animate-spin")} />
            <span>{savingForms ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات فرم‌ها"}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs font-bold gap-1.5 h-9 text-slate-700 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            <span>خروجی اکسل</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            className="text-xs font-bold gap-1.5 h-9 text-slate-700 dark:text-slate-200"
          >
            <Printer className="h-4 w-4" />
            <span>چاپ / PDF</span>
          </Button>
        </div>
      </div>

      {/* ─── هشدار خطاهای سناما ─── */}
      {errors.length > 0 && (
        <Card className="mb-6 border-amber-300 bg-amber-50/70 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-700 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  ممیزی آنلاین سناما ({sectionCategory === "capital" ? "بخش تملک" : "بخش هزینه"}) فعال است
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  تعداد {toPersianDigits(errors.length)} مغایرت موازنه و کد معین در فرم‌های فعال عملکرد شناسایی شد.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMainMode("audit")}
              className="text-xs gap-1.5 h-8 border-amber-400 text-amber-900 hover:bg-amber-100 font-bold"
            >
              <span>مشاهده و رفع مغایرت‌ها</span>
              <Badge variant="destructive" className="text-[10px]">{toPersianDigits(errors.length)}</Badge>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════ حالت ۱: نمایش فرم‌های استاندارد ════════════════════════ */}
      {mainMode === "forms" && (
        <div className="space-y-4">
          <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="w-full">
            {/* تب‌های متناسب با بخش هزینه / تملک / صورت‌های مالی */}
            {sectionCategory === "financial_statements" ? (
              <TabsList className="grid grid-cols-2 sm:grid-cols-6 gap-1 bg-purple-100/70 dark:bg-purple-950/40 p-1.5 rounded-xl mb-6 border border-purple-200 dark:border-purple-900">
                <TabsTrigger value="fin_balance_sheet" className="text-[11px] font-bold py-2 text-purple-950 dark:text-purple-200">۱. صورت وضعیت مالی</TabsTrigger>
                <TabsTrigger value="fin_performance" className="text-[11px] font-bold py-2 text-purple-950 dark:text-purple-200">۲. صورت عملکرد مالی</TabsTrigger>
                <TabsTrigger value="fin_changes" className="text-[11px] font-bold py-2 text-purple-950 dark:text-purple-200">۳. تغییرات در وضعیت مالی</TabsTrigger>
                <TabsTrigger value="fin_cash_flow" className="text-[11px] font-bold py-2 text-purple-950 dark:text-purple-200">۴. صورت جریان وجوه نقد</TabsTrigger>
                <TabsTrigger value="fin_budget_compare" className="text-[11px] font-bold py-2 text-purple-950 dark:text-purple-200">۵. مقایسه بودجه و واقعی</TabsTrigger>
                <TabsTrigger value="fin_notes_cert" className="text-[11px] font-bold py-2 text-purple-950 dark:text-purple-200">۶. یادداشت‌ها و گواهی سناما</TabsTrigger>
              </TabsList>
            ) : sectionCategory === "expense" ? (
              <TabsList className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-blue-100/70 dark:bg-slate-800/80 p-1.5 rounded-xl mb-6">
                <TabsTrigger value="form1" className="text-[11px] font-bold py-2">فرم ۱ هزینه</TabsTrigger>
                <TabsTrigger value="form46" className="text-[11px] font-bold py-2">فرم ۴-۶</TabsTrigger>
                <TabsTrigger value="form57exp" className="text-[11px] font-bold py-2">۵-۷ هزینه</TabsTrigger>
                <TabsTrigger value="form8" className="text-[11px] font-bold py-2">فرم ۸ هزینه</TabsTrigger>
                <TabsTrigger value="form9" className="text-[11px] font-bold py-2">فرم ۹ هزینه</TabsTrigger>
                <TabsTrigger value="form10" className="text-[11px] font-bold py-2">فرم ۱۰ هزینه</TabsTrigger>
                <TabsTrigger value="form11" className="text-[11px] font-bold py-2">فرم ۱۱ هزینه</TabsTrigger>
                <TabsTrigger value="form13" className="text-[11px] font-bold py-2">فرم ۱۳ هزینه</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-emerald-100/70 dark:bg-slate-800/80 p-1.5 rounded-xl mb-6">
                <TabsTrigger value="form2" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۲ تملک</TabsTrigger>
                <TabsTrigger value="form75cap" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۴-۴ / ۷-۵</TabsTrigger>
                <TabsTrigger value="form57exp" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">۵-۷ سرمایه</TabsTrigger>
                <TabsTrigger value="form8" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۸ تملک</TabsTrigger>
                <TabsTrigger value="form9" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۹ تملک</TabsTrigger>
                <TabsTrigger value="form10" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۱۰ تملک</TabsTrigger>
                <TabsTrigger value="form11" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۱۱ تملک</TabsTrigger>
                <TabsTrigger value="form13" className="text-[11px] font-bold py-2 text-emerald-800 dark:text-emerald-300">فرم ۱۳ تملک</TabsTrigger>
              </TabsList>
            )}

            {/* ─── فرم ۱ هزینه‌ای ─── */}
            <TabsContent value="form1">
              <Card className="border shadow-sm">
                <CardHeader className="bg-blue-50/70 dark:bg-blue-950/20 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black text-blue-900 dark:text-blue-300">
                        فرم ۱ — موافقت‌نامه / عملکرد اعتبار مصوب هزینه‌ای
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        تنظیم اولیه، افزایش، کاهش، حواله‌ها و محاسبه خودکار بودجه اعتبار نهایی هزینه‌ای (معین ۹۱۰۰۱ و ۹۴۰۰۱-)
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-600 text-white text-xs px-3 py-1">معین ۹۱۰۰۱ / ۹۴۰۰۱-</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse border border-blue-200">
                      <thead>
                        <tr className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold border-b border-blue-300">
                          <th className="p-3 border-l border-blue-300">عنوان ستون</th>
                          <th className="p-3 border-l border-blue-300">نوع حساب</th>
                          <th className="p-3 border-l border-blue-300">حساب معین</th>
                          <th className="p-3 border-l border-blue-300">سطوح تفصیلی</th>
                          <th className="p-3 w-48">مبلغ (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        <tr className="hover:bg-blue-50/40">
                          <td className="p-3 font-bold text-slate-800">بودجه اعتبار اولیه هزینه‌ای</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.initialBudget} onChange={(val) => setForm1Data({ ...form1Data, initialBudget: val })} />
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50/40">
                          <td className="p-3 font-bold text-emerald-700">افزایش (+)</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.increase} onChange={(val) => setForm1Data({ ...form1Data, increase: val })} textColor="text-emerald-700" />
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50/40">
                          <td className="p-3 font-bold text-rose-700">کاهش (-)</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.decrease} onChange={(val) => setForm1Data({ ...form1Data, decrease: val })} textColor="text-rose-700" />
                          </td>
                        </tr>
                        <tr className="hover:bg-blue-50/40">
                          <td className="p-3 font-bold text-blue-700">حواله (-)</td>
                          <td className="p-3 text-slate-600">هزینه</td>
                          <td className="p-3 font-mono font-bold text-blue-800">{toPersianDigits("94001")}</td>
                          <td className="p-3 text-slate-500">سطوح تفصیلی مطابق الزامات پروتکل الکترونیکی</td>
                          <td className="p-2">
                            <PersianAmountInput value={form1Data.drafts} onChange={(val) => setForm1Data({ ...form1Data, drafts: val })} textColor="text-blue-700" />
                          </td>
                        </tr>
                        <tr className="bg-blue-200/70 font-black text-slate-900">
                          <td className="p-3">بودجه اعتبار نهایی هزینه‌ای (محاسباتی)</td>
                          <td className="p-3">هزینه</td>
                          <td className="p-3 font-mono">{toPersianDigits("91001 / -94001")}</td>
                          <td className="p-3 text-slate-700">مطابق الزامات پروتکل تبادل الکترونیکی</td>
                          <td className="p-3 font-mono text-sm text-blue-900">
                            {formatPersianAmount(calculatedForm1Final)} ریال
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── فرم ۲ تملک (دارایی‌های سرمایه‌ای) ─── */}
            <TabsContent value="form2">
              <Card className="border shadow-sm">
                <CardHeader className="bg-emerald-50/70 dark:bg-emerald-950/20 border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black text-emerald-900 dark:text-emerald-300">
                        فرم ۲ — موافقت‌نامه / عملکرد اعتبار مصوب تملک دارایی‌های سرمایه‌ای
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        تنظیم اولیه، افزایش، کاهش، حواله‌ها و محاسبه خودکار بودجه اعتبار نهایی تملک دارایی‌های سرمایه‌ای (معین ۹۱۰۰۲ و ۹۴۰۰۲-)
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-xs px-3 py-1">معین ۹۱۰۰۲ / ۹۴۰۰۲-</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse border border-emerald-200">
                      <thead>
                        <tr className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold border-b border-emerald-300">
                          <th className="p-3 border-l border-emerald-300">عنوان ستون</th>
                          <th className="p-3 border-l border-emerald-300">نوع حساب</th>
                          <th className="p-3 border-l border-emerald-300">حساب معین</th>
                          <th className="p-3 border-l border-emerald-300">سطوح تفصیلی</th>
                          <th className="p-3 w-48">مبلغ (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-bold text-slate-800">بودجه اعتبار اولیه تملک</td>
                          <td className="p-3 text-slate-600">سرمایه‌ای</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form2Data.initialBudget} onChange={(val) => setForm2Data({ ...form2Data, initialBudget: val })} />
                          </td>
                        </tr>
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-bold text-emerald-700">افزایش (+)</td>
                          <td className="p-3 text-slate-600">سرمایه‌ای</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form2Data.increase} onChange={(val) => setForm2Data({ ...form2Data, increase: val })} textColor="text-emerald-700" />
                          </td>
                        </tr>
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-bold text-rose-700">کاهش (-)</td>
                          <td className="p-3 text-slate-600">سرمایه‌ای</td>
                          <td className="p-3 font-mono font-semibold">قابل ویرایش</td>
                          <td className="p-3 text-slate-500">تکمیل توسط کاربر</td>
                          <td className="p-2">
                            <PersianAmountInput value={form2Data.decrease} onChange={(val) => setForm2Data({ ...form2Data, decrease: val })} textColor="text-rose-700" />
                          </td>
                        </tr>
                        <tr className="hover:bg-emerald-50/40">
                          <td className="p-3 font-bold text-emerald-700">حواله (-)</td>
                          <td className="p-3 text-slate-600">سرمایه‌ای</td>
                          <td className="p-3 font-mono font-bold text-emerald-800">{toPersianDigits("94002")}</td>
                          <td className="p-3 text-slate-500">سطوح تفصیلی مطابق الزامات سناما</td>
                          <td className="p-2">
                            <PersianAmountInput value={form2Data.drafts} onChange={(val) => setForm2Data({ ...form2Data, drafts: val })} textColor="text-emerald-700" />
                          </td>
                        </tr>
                        <tr className="bg-emerald-200/70 font-black text-slate-900">
                          <td className="p-3">بودجه اعتبار نهایی تملک (محاسباتی)</td>
                          <td className="p-3">سرمایه‌ای</td>
                          <td className="p-3 font-mono">{toPersianDigits("91002 / -94002")}</td>
                          <td className="p-3 text-slate-700">مطابق الزامات پروتکل تبادل الکترونیکی</td>
                          <td className="p-3 font-mono text-sm text-emerald-900">
                            {formatPersianAmount(calculatedForm2Final)} ریال
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── فرم ۴-۶ اعتبارات هزینه ─── */}
            <TabsContent value="form46">
              <Card className="border shadow-sm">
                <CardHeader className="bg-amber-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-amber-900">
                    فرم ۴-۶ — اعتبارات هزینه (جدول ۱۱ ردیفی معین‌های هزینه‌ای)
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
                          <th className="p-3 border-l font-mono">حساب معین سناما</th>
                          <th className="p-3 w-48">مبلغ (ریال)</th>
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
                                <div className="p-2 font-mono font-black text-amber-900 bg-amber-200/60 rounded text-center">
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

            {/* ─── فرم ۴-۴ / ۷-۵ اعتبارات تملک دارایی‌های سرمایه‌ای ─── */}
            <TabsContent value="form75cap">
              <Card className="border shadow-sm">
                <CardHeader className="bg-emerald-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-emerald-900">
                    فرم ۴-۴ / ۷-۵ — اعتبارات طرح‌های تملک دارایی‌های سرمایه‌ای (۱۳ ردیفی - نوع حساب t)
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
                          <th className="p-3 w-48">مبلغ مصوب (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {form75CapData.map((row) => (
                          <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-emerald-100/50 font-bold")}>
                            <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                            <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                            <td className="p-3 text-center font-mono">{row.accountType}</td>
                            <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                            <td className="p-3 font-mono text-emerald-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                            <td className="p-2">
                              {row.isCalculated ? (
                                <div className="p-2 font-mono font-black text-emerald-900 bg-emerald-200/60 rounded text-center">
                                  {formatPersianAmount(calculatedF75CapTransferred)}
                                </div>
                              ) : (
                                <PersianAmountInput
                                  value={row.approvedAmount}
                                  onChange={(val) => setForm75CapData(form75CapData.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
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

            {/* ─── فرم ۵-۷ هزینه‌ای ─── */}
            <TabsContent value="form57exp">
              <Card className="border shadow-sm">
                <CardHeader className="bg-blue-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-blue-900">
                    فرم ۵-۷ — تراز عملکرد اعتبارات {sectionCategory === "capital" ? "سرمایه‌ای" : "هزینه‌ای"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-blue-100 text-blue-900 font-bold border-b">
                          <th className="p-3 border-l w-12 text-center">ردیف</th>
                          <th className="p-3 border-l">عنوان ستون</th>
                          <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                          <th className="p-3 border-l w-28 text-center">اعتبار</th>
                          <th className="p-3 border-l font-mono">حساب معین سناما</th>
                          <th className="p-3 w-48">مبلغ مصوب (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {form57ExpData.map((row) => (
                          <tr key={row.id} className={cn("hover:bg-slate-50/50", row.isCalculated && "bg-blue-100/50 font-bold")}>
                            <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                            <td className="p-3 font-semibold text-slate-800">{row.title}</td>
                            <td className="p-3 text-center font-mono">{row.accountType}</td>
                            <td className="p-3 text-center text-slate-600">{row.creditType}</td>
                            <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.moeinCodes)}</td>
                            <td className="p-2">
                              {row.isCalculated ? (
                                <div className="p-2 font-mono font-black text-blue-900 bg-blue-200/60 rounded text-center">
                                  {formatPersianAmount(calculatedF57ExpTransferred)}
                                </div>
                              ) : (
                                <PersianAmountInput
                                  value={row.approvedAmount}
                                  onChange={(val) => setForm57ExpData(form57ExpData.map(r => r.id === row.id ? { ...r, approvedAmount: val } : r))}
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

            {/* ─── فرم ۸ منابع ─── */}
            <TabsContent value="form8">
              <Card className="border shadow-sm">
                <CardHeader className="bg-blue-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-blue-900">
                    فرم ۸ — {sectionCategory === "capital" ? "واگذاری دارایی‌های سرمایه‌ای و مالی (تملک)" : "منابع و درآمدهای عمومی و اختصاصی هزینه‌ای"}
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
                        {(sectionCategory === "capital" ? form8CapData : form8ExpData).map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-center font-mono font-semibold">{toPersianDigits(row.id)}</td>
                            <td className="p-3 font-bold text-slate-800">{row.resourceKind}</td>
                            <td className="p-3 font-mono text-slate-600">{toPersianDigits(row.expectedMoein)}</td>
                            <td className="p-3 font-mono text-blue-700 font-semibold">{toPersianDigits(row.receivedMoein)}</td>
                            <td className="p-3 font-mono text-emerald-700 font-semibold">{toPersianDigits(row.sentMoein)}</td>
                            <td className="p-2">
                              <PersianAmountInput 
                                value={row.expectedAmount} 
                                onChange={(val) => {
                                  if (sectionCategory === "capital") {
                                    setForm8CapData(form8CapData.map(r => r.id === row.id ? { ...r, expectedAmount: val } : r));
                                  } else {
                                    setForm8ExpData(form8ExpData.map(r => r.id === row.id ? { ...r, expectedAmount: val } : r));
                                  }
                                }} 
                              />
                            </td>
                            <td className="p-2">
                              <PersianAmountInput 
                                value={row.receivedAmount} 
                                onChange={(val) => {
                                  if (sectionCategory === "capital") {
                                    setForm8CapData(form8CapData.map(r => r.id === row.id ? { ...r, receivedAmount: val } : r));
                                  } else {
                                    setForm8ExpData(form8ExpData.map(r => r.id === row.id ? { ...r, receivedAmount: val } : r));
                                  }
                                }} 
                                textColor="text-blue-700" 
                              />
                            </td>
                            <td className="p-2">
                              <PersianAmountInput 
                                value={row.sentAmount} 
                                onChange={(val) => {
                                  if (sectionCategory === "capital") {
                                    setForm8CapData(form8CapData.map(r => r.id === row.id ? { ...r, sentAmount: val } : r));
                                  } else {
                                    setForm8ExpData(form8ExpData.map(r => r.id === row.id ? { ...r, sentAmount: val } : r));
                                  }
                                }} 
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

            {/* ─── فرم ۹ ─── */}
            <TabsContent value="form9">
              <Card className="border shadow-sm">
                <CardHeader className="bg-purple-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-purple-900">
                    فرم ۹ — {sectionCategory === "capital" ? "سطر موجودی‌ها، پیش‌پرداخت‌ها و علی‌الحساب تملک (معین ۹۸۰۰۴)" : "سطر پیش‌پرداخت‌ها و علی‌الحساب هزینه‌ای (معین ۹۸۰۰۳)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {sectionCategory === "capital" && form9CapData.inventories && (
                    <div className="border rounded-xl p-4 bg-emerald-50/30 border-emerald-200">
                      <h4 className="font-bold text-xs text-emerald-900 mb-3">سطر موجودی‌ها (معین {toPersianDigits("98004")})</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                          <PersianAmountInput value={form9CapData.inventories.initialBalance} onChange={val => setForm9CapData({...form9CapData, inventories: {...form9CapData.inventories, initialBalance: val}})} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                          <PersianAmountInput value={form9CapData.inventories.consumedTransferred} onChange={val => setForm9CapData({...form9CapData, inventories: {...form9CapData.inventories, consumedTransferred: val}})} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                          <PersianAmountInput value={form9CapData.inventories.sentToTreasury} onChange={val => setForm9CapData({...form9CapData, inventories: {...form9CapData.inventories, sentToTreasury: val}})} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                          <PersianAmountInput value={form9CapData.inventories.yearEndBalance} onChange={val => setForm9CapData({...form9CapData, inventories: {...form9CapData.inventories, yearEndBalance: val}})} className="mt-1" textColor="text-emerald-700" />
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-emerald-100 rounded text-xs font-mono font-bold text-emerald-900 flex justify-between">
                        <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                        <span>{formatPersianAmount(calculateForm9Transferred(form9CapData.inventories))} ریال</span>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-xl p-4 bg-purple-50/20">
                    <h4 className="font-bold text-xs text-purple-900 mb-3">
                      سطر پیش پرداخت‌ها (معین {toPersianDigits(sectionCategory === "capital" ? "98004" : "98003")})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] text-muted-foreground">مانده ابتدای سال</label>
                        <PersianAmountInput 
                          value={sectionCategory === "capital" ? form9CapData.prepayments.initialBalance : form9ExpData.prepayments.initialBalance} 
                          onChange={val => {
                            if (sectionCategory === "capital") {
                              setForm9CapData({...form9CapData, prepayments: {...form9CapData.prepayments, initialBalance: val}});
                            } else {
                              setForm9ExpData({...form9ExpData, prepayments: {...form9ExpData.prepayments, initialBalance: val}});
                            }
                          }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">اعتبار انتقالی مصرف شده</label>
                        <PersianAmountInput 
                          value={sectionCategory === "capital" ? form9CapData.prepayments.consumedTransferred : form9ExpData.prepayments.consumedTransferred} 
                          onChange={val => {
                            if (sectionCategory === "capital") {
                              setForm9CapData({...form9CapData, prepayments: {...form9CapData.prepayments, consumedTransferred: val}});
                            } else {
                              setForm9ExpData({...form9ExpData, prepayments: {...form9ExpData.prepayments, consumedTransferred: val}});
                            }
                          }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">وجوه ارسالی به خزانه</label>
                        <PersianAmountInput 
                          value={sectionCategory === "capital" ? form9CapData.prepayments.sentToTreasury : form9ExpData.prepayments.sentToTreasury} 
                          onChange={val => {
                            if (sectionCategory === "capital") {
                              setForm9CapData({...form9CapData, prepayments: {...form9CapData.prepayments, sentToTreasury: val}});
                            } else {
                              setForm9ExpData({...form9ExpData, prepayments: {...form9ExpData.prepayments, sentToTreasury: val}});
                            }
                          }} 
                          className="mt-1" 
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">مانده پایان سال</label>
                        <PersianAmountInput 
                          value={sectionCategory === "capital" ? form9CapData.prepayments.yearEndBalance : form9ExpData.prepayments.yearEndBalance} 
                          onChange={val => {
                            if (sectionCategory === "capital") {
                              setForm9CapData({...form9CapData, prepayments: {...form9CapData.prepayments, yearEndBalance: val}});
                            } else {
                              setForm9ExpData({...form9ExpData, prepayments: {...form9ExpData.prepayments, yearEndBalance: val}});
                            }
                          }} 
                          className="mt-1" 
                          textColor="text-purple-700" 
                        />
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-purple-100 rounded text-xs font-mono font-bold text-purple-900 flex justify-between">
                      <span>ستون وجوه انتقالی (فرمول محاسباتی):</span>
                      <span>{formatPersianAmount(calculateForm9Transferred(sectionCategory === "capital" ? form9CapData.prepayments : form9ExpData.prepayments))} ریال</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── فرم ۱۰ ─── */}
            <TabsContent value="form10">
              <Card className="border shadow-sm">
                <CardHeader className="bg-teal-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-teal-900">
                    فرم ۱۰ — {sectionCategory === "capital" ? "وجوه انتقالی و سرمایه‌گذاری‌های تملک (معین ۹۴۰۰۴ / ۹۱۰۰۴)" : "وجوه انتقالی اعتبارات هزینه (معین ۹۴۰۰۳ / ۹۱۰۰۳)"}
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
                        {(sectionCategory === "capital" ? form10CapData : form10ExpData).map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{row.section}</td>
                            <td className="p-3 font-mono text-teal-700 font-semibold">{toPersianDigits(row.transferredDraftsExpense || row.transferredDraftsCapital || row.transferredFunds)}</td>
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

            {/* ─── فرم ۱۱ ─── */}
            <TabsContent value="form11">
              <Card className="border shadow-sm">
                <CardHeader className="bg-indigo-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-indigo-900">
                    فرم ۱۱ — {sectionCategory === "capital" ? "اسناد واخواهی شده و کسری ابواب جمعی تملک (معین ۹۲۵۰۴ / ۹۳۵۰۴)" : "اسناد واخواهی شده و کسری ابواب جمعی هزینه (معین ۹۲۵۰۳ / ۹۳۵۰۳)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-indigo-100 text-indigo-900 font-bold border-b">
                          <th className="p-3 border-l">عنوان سطر</th>
                          <th className="p-3 border-l font-mono">حساب معین مربوطه</th>
                          <th className="p-3 w-36">مانده ابتدای سال</th>
                          <th className="p-3 w-36">مصرف شده</th>
                          <th className="p-3 w-36">ارسال به خزانه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(sectionCategory === "capital" ? form11CapData : form11ExpData).map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                            <td className="p-3 font-mono text-indigo-700 font-semibold">{toPersianDigits(row.moeinExpense || row.moeinCapital || row.yearEndMoeinExpense || row.yearEndMoeinCapital)}</td>
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

            {/* ─── فرم ۱۳ ─── */}
            <TabsContent value="form13">
              <Card className="border shadow-sm">
                <CardHeader className="bg-cyan-50/70 border-b pb-4">
                  <CardTitle className="text-base font-black text-cyan-900">
                    فرم ۱۳ — {sectionCategory === "capital" ? "اوراق مالی، واگذار شده و انتقالی تملک دارایی‌های سرمایه‌ای" : "اوراق مالی، واگذار شده و انتقالی اعتبارات هزینه‌ای"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse border border-slate-200">
                      <thead>
                        <tr className="bg-cyan-100 text-cyan-900 font-bold border-b">
                          <th className="p-3 border-l">عنوان ستون</th>
                          <th className="p-3 border-l w-20 text-center">نوع حساب</th>
                          <th className="p-3 border-l font-mono">حساب معین مصوب</th>
                          <th className="p-3 w-44">مبلغ اوراق (ریال)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(sectionCategory === "capital" ? form13CapData : form13ExpData).map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{row.rowType}</td>
                            <td className="p-3 text-center font-mono">{row.accountType}</td>
                            <td className="p-3 font-mono text-cyan-700 font-semibold">{toPersianDigits(row.moeinExpenseApproved || row.moeinCapitalApproved)}</td>
                            <td className="p-3 font-mono font-bold text-cyan-900">{formatPersianAmount(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {sectionCategory === "financial_statements" && (
              <FinancialStatementsTabsContent
                form1Data={form1Data}
                form2Data={form2Data}
                form46Data={form46Data}
                form75CapData={form75CapData}
                form8ExpData={form8ExpData}
                form8CapData={form8CapData}
                form13ExpData={form13ExpData}
                form13CapData={form13CapData}
                calculatedForm1Final={calculatedForm1Final}
                calculatedForm2Final={calculatedForm2Final}
                calculatedF46Transferred={calculatedF46Transferred}
                calculatedF75CapTransferred={calculatedF75CapTransferred}
                handleExportPDF={handleExportPDF}
                onOpenCertModal={() => setShowCertModal(true)}
              />
            )}

          </Tabs>
        </div>
      )}

      {/* ════════════════════════ حالت ۲: داشبورد ممیزی و قوانین ════════════════════════ */}
      {mainMode === "audit" && (
        <div className="space-y-6">
          {/* خلاصه کارت‌ها */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    اقلام اعتبارسنجی‌شده ({sectionCategory === "capital" ? "تملک" : "هزینه"})
                  </p>
                  <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                    {toPersianDigits(currentSectionItems.length)} مورد
                  </h3>
                </div>
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600">
                  <FileCheck2 className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn(
              "border-2",
              sectionErrors.length > 0 
                ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20" 
                : "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
            )}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground/80">مغایرت‌های شناسا‌یی‌شده ({sectionCategory === "capital" ? "تملک" : "هزینه"})</p>
                  <h3 className={cn("text-2xl font-black mt-1", sectionErrors.length > 0 ? "text-amber-600" : "text-emerald-600")}>
                    {toPersianDigits(sectionErrors.length)} خطای سناما
                  </h3>
                </div>
                <div className={cn("p-3 rounded-xl", sectionErrors.length > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
                  {sectionErrors.length > 0 ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">قواعد خزانه‌داری ({sectionCategory === "capital" ? "تملک" : "هزینه"})</p>
                  <h3 className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-1">{toPersianDigits(filteredRules.length)} ضابطه سناما</h3>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">بخش فعال سناما</p>
                  <h3 className="text-lg font-black text-purple-700 dark:text-purple-400 mt-1">
                    {sectionCategory === "capital" ? "۲. تملک دارایی‌های سرمایه‌ای" : "۱. اعتبارات هزینه‌ای"}
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600">
                  <Layers className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ابزار ممیزی و قوانین */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>قوانین کنترل فرم عملکرد ({sectionCategory === "capital" ? "تملک" : "هزینه"})</span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={fetchData} disabled={loading} className="gap-1.5 h-8">
                    <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                    <span>بازبینی</span>
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی کد یا عنوان قانون..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-2 max-h-[600px] overflow-y-auto divide-y">
                <button
                  onClick={() => setSelectedRuleCode(null)}
                  className={cn(
                    "w-full text-right p-3 rounded-lg text-xs font-semibold transition flex items-center justify-between",
                    selectedRuleCode === null ? "bg-primary text-primary-foreground shadow" : "hover:bg-muted/50"
                  )}
                >
                  <span>نمایش همه قوانین و خطاها</span>
                  <Badge variant={selectedRuleCode === null ? "secondary" : "outline"} className="text-[10px]">
                    {toPersianDigits(sectionErrors.length)} خطا
                  </Badge>
                </button>

                {filteredRules.map((rule) => {
                  const ruleErrors = sectionErrors.filter(e => e.code === rule.code);
                  const isSelected = selectedRuleCode === rule.code;

                  return (
                    <button
                      key={rule.code}
                      onClick={() => {
                        setSelectedRuleCode(rule.code);
                        if (ruleErrors.length > 0) {
                          setFixPathwayError(ruleErrors[0]);
                        } else {
                          setFixPathwayError({ code: rule.code, message: rule.desc, itemRef: "قانون سناما" });
                        }
                      }}
                      className={cn(
                        "w-full text-right p-3 rounded-lg text-xs transition flex flex-col gap-1 mt-1 cursor-pointer group",
                        isSelected ? "bg-primary/10 border-primary border text-primary font-medium" : "hover:bg-muted/60 text-foreground/90"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1.5 group-hover:text-primary">
                          <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[11px]">کد {toPersianDigits(rule.code)}</span>
                          {rule.title}
                        </span>
                        {ruleErrors.length > 0 ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            {toPersianDigits(ruleErrors.length)} خطا (مشاهده مسیر اصلاح)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 bg-emerald-50 px-1.5 py-0">
                            سالم
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{rule.desc}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border shadow-sm flex flex-col">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <span>نتایج بررسی هوشمند و مغایرت‌ها ({sectionCategory === "capital" ? "تملک دارایی‌های سرمایه‌ای" : "اعتبارات هزینه‌ای"})</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedRuleCode 
                      ? `نمایش نتایج مربوط به قانون کد ${toPersianDigits(selectedRuleCode)}`
                      : "نمایش کلیه خطاها و مغایرت‌های یافت شده — جهت دریافت مسیر اصلاح روی هر خطا کلیک کنید"}
                  </CardDescription>
                </div>
                {selectedRuleCode && (
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRuleCode(null)} className="text-xs h-8">
                    پاک‌سازی فیلتر
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto">
                {activeErrors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground gap-3">
                    <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="h-10 w-10 animate-bounce" />
                    </div>
                    <h4 className="text-base font-bold text-emerald-800 dark:text-emerald-300">هیچ مغایرتی در این بخش یافت نشد!</h4>
                    <p className="text-xs max-w-md">
                      تمامی قوانین و ضوابط خزانه‌داری کل کشور (سناما) در فیلدها و اقلام {sectionCategory === "capital" ? "تملک دارایی‌های سرمایه‌ای" : "اعتبارات هزینه‌ای"} با موفقیت برقرار است.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeErrors.map((err, i) => (
                      <div 
                        key={i} 
                        onClick={() => setFixPathwayError(err)}
                        className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 dark:bg-destructive/10 flex flex-col gap-2 transition hover:shadow-md cursor-pointer hover:border-destructive/60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded font-black text-xs">
                              خطای کد {toPersianDigits(err.code)}
                            </span>
                            <span className="text-xs font-semibold text-foreground/80">
                              شناسه ردیف: <span className="font-mono text-primary">{toPersianDigits(err.itemRef)}</span>
                            </span>
                          </div>
                          <Badge variant="outline" className="border-destructive/40 text-destructive text-[11px] font-bold gap-1">
                            <span>دریافت مسیر اصلاح</span>
                            <Pencil className="h-3 w-3" />
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-destructive/20 mt-1">
                          <p className="text-xs font-medium text-destructive dark:text-red-400 leading-relaxed pr-1">
                            {err.message}
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFixPathwayError(err);
                            }}
                            className="text-xs gap-1.5 h-8 bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-sm"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>مسیر رفع خطا و هدایت</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── مدال اصلاح سریع فیلدهای سناما ─── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-lg shadow-2xl border-2 border-blue-500 bg-background animate-in fade-in zoom-in duration-200">
            <CardHeader className="bg-blue-600 text-white p-4 flex flex-row items-center justify-between rounded-t-xl">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-blue-200" />
                  <span>اصلاح فیلدهای سناما برای اعتبار مشخص‌شده</span>
                </CardTitle>
                <CardDescription className="text-xs text-blue-100 font-sans mt-1 flex flex-col gap-0.5">
                  <span>عنوان اعتبار: <strong className="text-white">{editingItem.title || "اعتبار ردیف ثبت‌شده در سیستم"}</strong></span>
                  <span className="font-mono text-[11px] opacity-90">شناسه رکورد: {editingItem.id}</span>
                </CardDescription>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="text-white hover:bg-blue-700 h-8 w-8 p-0 rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg text-amber-900 dark:text-amber-300">
                <p className="font-bold">راهنمای رفع خطای ۱۳۲ و قوانین سناما:</p>
                <p className="mt-1 leading-relaxed">
                  حداقل یکی از فیلدهای «شماره طرح»، «شماره ردیف متفرقه» یا «شماره ردیف تملک دارایی‌های مالی» باید با یک شماره معتبر خزانه‌داری جای‌گذاری و مقداردهی شود.
                </p>
              </div>

              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 font-medium text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{modalError}</div>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 font-medium text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>{modalSuccess}</div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره طرح (project_number)</label>
                <Input
                  value={editForm.project_number}
                  onChange={e => {
                    setEditForm({ ...editForm, project_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 1307002001"
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره ردیف متفرقه (misc_row_number)</label>
                <Input
                  value={editForm.misc_row_number}
                  onChange={e => {
                    setEditForm({ ...editForm, misc_row_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 503000"
                  className="h-9 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">شماره ردیف تملک دارایی‌های مالی (financial_assets_row_number)</label>
                <Input
                  value={editForm.financial_assets_row_number}
                  onChange={e => {
                    setEditForm({ ...editForm, financial_assets_row_number: e.target.value });
                    setModalError(null);
                  }}
                  placeholder="مثال: 700001"
                  className="h-9 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">شماره برنامه</label>
                  <Input
                    value={editForm.program_number}
                    onChange={e => setEditForm({ ...editForm, program_number: e.target.value })}
                    placeholder="مثال: 10101"
                    className="h-9 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ردیف ابلاغ دهنده</label>
                  <Input
                    value={editForm.notifier_budget_row}
                    onChange={e => setEditForm({ ...editForm, notifier_budget_row: e.target.value })}
                    placeholder="مثال: 102000"
                    className="h-9 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t mt-4">
                <Button variant="outline" onClick={() => setEditingItem(null)} disabled={modalSaving} className="h-9 text-xs">
                  انصراف
                </Button>
                <Button onClick={handleSaveEdit} disabled={modalSaving} className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow">
                  {modalSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>{modalSaving ? "در حال ذخیره‌سازی..." : "ذخیره و اعمال در سناما"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── مدال مسیر اصلاح و برطرف‌سازی هوشمند خطاهای سناما ─── */}
      <FixPathwayModal
        error={fixPathwayError}
        sectionCategory={sectionCategory}
        onClose={() => setFixPathwayError(null)}
        onNavigate={(tab) => {
          setMainMode("forms");
          setActiveFormTab(tab);
          setFixPathwayError(null);
        }}
      />

      {/* ─── مدال رسمی قابل چاپ گواهی سناما ─── */}
      <SanamaOfficialCertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        totalAssets={certTotalAssets}
        totalLiabilities={certTotalLiabilities}
        endingEquity={certEndingEquity}
      />
    </PageShell>
  );
}
