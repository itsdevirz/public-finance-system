import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, RefreshCw, FileText, Eye, ChevronLeft,
  ChevronDown, ChevronUp, X, Filter, AlertTriangle,
  CheckCircle2, Clock, Ban, Hash, CalendarDays,
  Layers, ChevronsUpDown, Edit3, Trash2, GitFork,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import api from "@/api";
import { useFiscalYear } from "@/context/FiscalYearContext";
import { useAuth } from "@/context/AuthContext";
import { toPersianDigits } from "@/components/ui/persian-date-picker";
import { DocWorkflowTreeModal } from "@/modules/accounting/components/DocWorkflowTreeModal";

// ─── ثوابت و روال کارتابل ──────────────────────────────────────────────────────
const DOC_TYPE_LABEL = {
  PETTY_CASH_PAYMENT: "پرداخت تنخواه",
  GENERAL_PAYMENT: "پرداخت عمومی",
  REVENUE: "درآمد",
  TRANSFER: "انتقال",
  CLOSING: "اختتامیه",
};
const DOC_TYPE_COLOR = {
  PETTY_CASH_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  GENERAL_PAYMENT: "bg-blue-100 text-blue-700 border-blue-200",
  REVENUE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  TRANSFER: "bg-violet-100 text-violet-700 border-violet-200",
  CLOSING: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABEL = {
  DRAFT: "پیش‌نویس",
  REGISTERED: "ثبت اولیه",
  CONFIRMED: "تأییدشده",
  FINAL: "صدور سند قطعی",
  CANCELLED: "ابطال‌شده",
  "پیش‌نویس": "پیش‌نویس",
  "ثبت اولیه": "ثبت اولیه",
  "تأییدشده": "تأییدشده",
  "صدور سند قطعی": "صدور سند قطعی",
  "ابطال‌شده": "ابطال‌شده",
};

export function getCleanStatusLabel(status) {
  if (!status) return "—";
  let str = String(status).trim();
  str = str.replace(/^ابطال‌?شده\s*/i, "").trim();
  if (str.startsWith("(") && str.endsWith(")")) {
    str = str.slice(1, -1).trim();
  }
  return STATUS_LABEL[str] ?? str;
}

const STATUS_COLOR = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  REGISTERED: "bg-blue-100 text-blue-700 border-blue-200",
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  FINAL: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
  "پیش‌نویس": "bg-amber-100 text-amber-700 border-amber-200",
  "ثبت اولیه": "bg-blue-100 text-blue-700 border-blue-200",
  "تأییدشده": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "صدور سند قطعی": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "ابطال‌شده": "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_ICON = {
  DRAFT: Clock,
  REGISTERED: FileText,
  CONFIRMED: CheckCircle2,
  FINAL: CheckCircle2,
  CANCELLED: Ban,
  "پیش‌نویس": Clock,
  "ثبت اولیه": FileText,
  "تأییدشده": CheckCircle2,
  "صدور سند قطعی": CheckCircle2,
  "ابطال‌شده": Ban,
};


function getNextRoleTarget(currentStep) {
  if (currentStep === "ACCOUNTANT" || currentStep === "DRAFT" || currentStep === "REGULATOR" || !currentStep) {
    return { nextRole: "رئیس امور مالی", actionLabel: "تأیید و ارسال به رئیس امور مالی" };
  }
  if (currentStep === "FIN_HEAD") {
    return { nextRole: "مدیر مالی و ذیحساب", actionLabel: "تأیید و ارسال به مدیر مالی و ذیحساب" };
  }
  if (currentStep === "FIN_DIRECTOR") {
    return { nextRole: "رئیس دستگاه اجرایی", actionLabel: "تأیید و ارسال به رئیس دستگاه اجرایی" };
  }
  if (currentStep === "AGENCY_HEAD") {
    return { nextRole: "تکمیل شده", actionLabel: "تأیید نهایی و صدور سند قطعی" };
  }
  return { nextRole: "تکمیل شده", actionLabel: "تأیید و نهایی‌سازی" };
}

function getPrevRoleTarget(currentStep) {
  if (currentStep === "AGENCY_HEAD") {
    return "مدیر مالی و ذیحساب";
  }
  if (currentStep === "FIN_DIRECTOR") {
    return "رئیس امور مالی";
  }
  if (currentStep === "FIN_HEAD") {
    return "تنظیم حساب";
  }
  return "حسابدار";
}

function fmt(n) {
  if (n === null || n === undefined || n === 0) return "—";
  return Number(n).toLocaleString("fa-IR");
}

function formatDocDate(dateStr, fiscalYear) {
  if (!dateStr || dateStr === "—") return "—";
  if (!fiscalYear) return toPersianDigits(dateStr);
  const fyStr = String(fiscalYear);
  const cleanStr = String(dateStr).replace(/[۰-۹]/g, ch => "۰۱۲۳۴۵۶۷۸۹".indexOf(ch).toString());
  const parts = cleanStr.split("/");
  if (parts.length === 3) {
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return toPersianDigits(`${fyStr}/${month}/${day}`);
  }
  return toPersianDigits(dateStr);
}

function canUserApproveOrReject(user, doc) {
  if (!doc) return false;

  const status = (doc.status || "").trim();
  if (status === "CONFIRMED" || status === "صدور سند قطعی" || status === "FINAL") {
    return false;
  }

  const uStr = user
    ? `${user.position || ""} ${user.role || ""} ${user.userGroup || ""} ${user.workflowLevel || ""} ${user.username || ""}`.toLowerCase()
    : "admin";

  const isAdmin = !user || user.isAdmin === true || user.role === "admin" || uStr.includes("admin") || uStr.includes("مدیر سیستم") || uStr.includes("مدیرکل");

  const currentStep = doc.workflowStep || "REGULATOR";

  // ۱. برگشت داده‌شده به حسابدار یا پیش‌نویس
  if (currentStep === "ACCOUNTANT" || currentStep === "DRAFT") {
    const isAccountant = uStr.includes("حسابدار") || uStr.includes("accountant");
    const isRegulator = uStr.includes("تنظیم") || uStr.includes("regulator");
    return isAdmin || isAccountant || isRegulator;
  }

  // ۲. مرحله تنظیم حساب
  if (currentStep === "REGULATOR" || status === "پیش‌نویس" || status === "ثبت اولیه") {
    return isAdmin || uStr.includes("تنظیم") || uStr.includes("regulator") || uStr.includes("drafter");
  }

  // ۳. مرحله رئیس امور مالی
  if (currentStep === "FIN_HEAD") {
    return isAdmin || uStr.includes("رئیس امور مالی") || uStr.includes("fin_head");
  }

  // ۴. مرحله مدیر مالی و ذیحساب
  if (currentStep === "FIN_DIRECTOR") {
    return isAdmin || uStr.includes("مدیر مالی") || uStr.includes("ذیحساب") || uStr.includes("fin_director");
  }

  // ۵. مرحله رئیس دستگاه اجرایی
  if (currentStep === "AGENCY_HEAD") {
    return isAdmin || uStr.includes("رئیس دستگاه") || uStr.includes("agency_head");
  }

  return isAdmin;
}

function canUserEdit(user, doc) {
  if (!doc) return false;
  const status = (doc.status || "").trim();
  if (status === "CONFIRMED" || status === "صدور سند قطعی" || status === "FINAL") {
    return false;
  }

  const uStr = user
    ? `${user.position || ""} ${user.role || ""} ${user.userGroup || ""} ${user.workflowLevel || ""} ${user.username || ""}`.toLowerCase()
    : "admin";

  const isAdmin = !user || user.isAdmin === true || uStr.includes("admin") || uStr.includes("مدیر سیستم");
  if (isAdmin) return true;

  const currentStep = doc.workflowStep || "REGULATOR";

  if (currentStep === "ACCOUNTANT" || currentStep === "DRAFT" || status.includes("برگشت") || status.includes("ابطال")) {
    return true;
  }

  return false;
}

function canUserDeleteDoc(user, doc) {
  if (!user || !doc) return false;

  const uStr = `${user.position || ""} ${user.role || ""} ${user.userGroup || ""} ${user.workflowLevel || ""} ${user.username || ""}`.toLowerCase();
  const isAdmin = user.isAdmin === true || user.role === "admin" || uStr.includes("admin") || uStr.includes("مدیر سیستم") || uStr.includes("مدیرکل");

  // حذف سند فقط با دسترسی مدیر سیستم (فول اکسس) امکان‌پذیر است
  return isAdmin;
}

function canUserViewTreeInOperations(user, doc) {
  if (!doc) return false;
  const status = (doc.status || "").trim();
  const currentStep = doc.workflowStep || "REGULATOR";
  const isFinalized = status === "CONFIRMED" || status === "صدور سند قطعی" || status === "FINAL" || currentStep === "FINAL";

  // اگر هنوز صدور قطعی نشده است، درختواره برای تمامی کاربران در تمام مراحل تایید/رد قابل مشاهده است
  if (!isFinalized) return true;

  // بعد از صدور قطعی و نهایی، فقط رئیس دستگاه اجرایی (و مدیر سیستم که فول اکسس است) مجاز به مشاهده درختواره در عملیات می‌باشند
  const uStr = user
    ? `${user.position || ""} ${user.role || ""} ${user.userGroup || ""} ${user.workflowLevel || ""} ${user.username || ""}`.toLowerCase()
    : "admin";

  const isAdmin = !user || user.isAdmin === true || uStr.includes("admin") || uStr.includes("مدیر سیستم") || uStr.includes("مدیرکل");
  const isAgencyHead = uStr.includes("رئیس دستگاه") || uStr.includes("agency_head");

  return isAdmin || isAgencyHead;
}

function isDocumentVisibleToUser(user, doc) {
  if (!doc) return false;

  const status = (doc.status || "").trim();

  // اسناد قطعی‌شده برای تمام نقش‌ها قابل مشاهده است
  if (status === "CONFIRMED" || status === "صدور سند قطعی" || status === "FINAL") {
    return true;
  }

  const uStr = user
    ? `${user.position || ""} ${user.role || ""} ${user.userGroup || ""} ${user.workflowLevel || ""} ${user.username || ""}`.toLowerCase()
    : "admin";

  const isAdmin = !user || user.isAdmin === true || uStr.includes("admin") || uStr.includes("مدیر سیستم") || uStr.includes("مدیرکل");
  if (isAdmin) return true;

  const currentStep = doc.workflowStep || "REGULATOR";
  const isAccountant = uStr.includes("حسابدار") && !uStr.includes("تنظیم") && !uStr.includes("رئیس") && !uStr.includes("مدیر");
  const isRegulator = uStr.includes("تنظیم") || uStr.includes("regulator") || uStr.includes("drafter");
  const isFinHead = uStr.includes("رئیس امور مالی") || uStr.includes("fin_head");
  const isFinDirector = uStr.includes("مدیر مالی") || uStr.includes("ذیحساب") || uStr.includes("fin_director");
  const isAgencyHead = uStr.includes("رئیس دستگاه") || uStr.includes("agency_head");

  // مرحله ۱: اسناد اولیه در انتظار تنظیم حساب
  if (currentStep === "ACCOUNTANT" || currentStep === "DRAFT" || currentStep === "REGULATOR" || status === "پیش‌نویس" || status === "ثبت اولیه") {
    return isRegulator || isAccountant;
  }

  // مرحله ۲: در انتظار رئیس امور مالی
  if (currentStep === "FIN_HEAD") {
    return isFinHead || isRegulator || isAccountant;
  }

  // مرحله ۳: در انتظار مدیر مالی و ذیحساب
  if (currentStep === "FIN_DIRECTOR") {
    return isFinDirector || isFinHead || isRegulator || isAccountant;
  }

  // مرحله ۴: در انتظار رئیس دستگاه
  if (currentStep === "AGENCY_HEAD") {
    return isAgencyHead || isFinDirector || isFinHead || isRegulator || isAccountant;
  }

  return true;
}

// ─── Modal جزئیات سند ─────────────────────────────────────────────────────────
function DocDetailModal({ doc, onClose, onDelete, onWorkflowApprove, onWorkflowReject, onOpenTree, currentUser }) {
  const totalDebit = doc.lines?.reduce((s, l) => s + (l.debit ?? 0), 0) ?? 0;
  const totalCredit = doc.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
  const balanced = totalDebit === totalCredit;
  const StatusIcon = STATUS_ICON[doc.status] ?? Clock;
  const canApprove = canUserApproveOrReject(currentUser, doc);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl flex flex-col">

        {/* header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">جزئیات سند</h2>
              <p className="text-xs text-muted-foreground font-mono">{doc.document_number}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* meta */}
        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b bg-muted/10 shrink-0">
          {[
            { label: "شماره سند", value: doc.document_number, mono: true },
            { label: "دوره مالی", value: doc.fiscal_year, mono: true },
            { label: "تاریخ سند", value: formatDocDate(doc.document_date, doc.fiscal_year) },
            { label: "مرجع", value: doc.reference_number ?? "—", mono: true },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
              <span className={cn("text-sm text-foreground", mono && "font-mono")}>{value}</span>
            </div>
          ))}
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">نوع سند</span>
            <span className={cn("inline-flex items-center w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold", DOC_TYPE_COLOR[doc.document_type] ?? "bg-muted")}>
              {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">وضعیت</span>
            <span className={cn("inline-flex items-center gap-1 w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              doc.status?.includes("برگشت") ? "bg-amber-100 text-amber-700 border-amber-200" : (STATUS_COLOR[doc.status] ?? "bg-muted"))}>
              <StatusIcon className="h-2.5 w-2.5" />
              {getCleanStatusLabel(doc.status)}
            </span>
          </div>
          {doc.description && (
            <div className="col-span-2 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">شرح</span>
              <span className="text-sm text-foreground">{doc.description}</span>
            </div>
          )}
        </div>

        {/* lines table */}
        <div className="px-6 py-4 flex-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />ردیف‌های سند ({doc.lines?.length ?? 0} ردیف)
          </p>
          {!doc.lines?.length ? (
            <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground/60">
              ردیفی ثبت نشده
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground w-10">#</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">کد کل</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">کد معین</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">نام حساب</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground text-blue-600">بدهکار (ریال)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground text-rose-600">بستانکار (ریال)</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">شرح</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.lines.map((line, i) => {
                    const generalCode = line.account_code ? line.account_code.substring(0, 4) : "—";
                    const detailCode = line.account_code || "—";
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 text-center text-muted-foreground/60">{i + 1}</td>
                        <td className="px-3 py-2 font-mono text-foreground/70">{generalCode}</td>
                        <td className="px-3 py-2 font-mono text-foreground/85">{detailCode}</td>
                        <td className="px-3 py-2 text-foreground/80">{line.account_name ?? "—"}</td>
                        <td className="px-3 py-2 font-mono text-blue-700 font-medium">{line.debit ? line.debit.toLocaleString("fa-IR") : "—"}</td>
                        <td className="px-3 py-2 font-mono text-rose-700 font-medium">{line.credit ? line.credit.toLocaleString("fa-IR") : "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{line.description ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/30">
                    <td colSpan={4} className="px-3 py-2 text-xs font-bold text-right text-muted-foreground">جمع</td>
                    <td className="px-3 py-2 font-mono font-bold text-blue-700">{totalDebit.toLocaleString("fa-IR")}</td>
                    <td className="px-3 py-2 font-mono font-bold text-rose-700">{totalCredit.toLocaleString("fa-IR")}</td>
                    <td className="px-3 py-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        balanced ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200")}>
                        {balanced ? <CheckCircle2 className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                        {balanced ? "متوازن" : "ناموزون"}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="border-t px-6 py-3 bg-muted/20 rounded-b-2xl shrink-0 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {canUserDeleteDoc(currentUser, doc) && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(doc._id, doc.document_number)} className="gap-1.5 text-xs font-bold">
                <Trash2 className="h-3.5 w-3.5" />حذف سند
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  size="sm"
                  onClick={() => onWorkflowApprove(doc)}
                  className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  title={getNextRoleTarget(doc.workflowStep).actionLabel}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {getNextRoleTarget(doc.workflowStep).actionLabel}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onWorkflowReject(doc)}
                  className="gap-1.5 text-xs font-bold bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer"
                  title={`رد سند و برگشت به ${getPrevRoleTarget(doc.workflowStep)}`}
                >
                  <Ban className="h-3.5 w-3.5 text-rose-600" />
                  رد سند و ارجاع
                </Button>
              </>
            )}

            {canUserViewTreeInOperations(currentUser, doc) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { onClose(); onOpenTree(doc); }}
                className="gap-1.5 text-xs font-bold bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 cursor-pointer"
                title="مشاهده درختواره و سوابق گردش کاری سند"
              >
                <GitFork className="h-3.5 w-3.5 text-blue-600" />
                درختواره گردش کار
              </Button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5 text-xs">
            <X className="h-3.5 w-3.5" />بستن
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── هدر ستون با قابلیت مرتب‌سازی ────────────────────────────────────────────
function SortHeader({ label, field, sortBy, sortDir, onSort }) {
  const active = sortBy === field;
  return (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active
          ? sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
          : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );
}

// ─── صفحه اصلی ────────────────────────────────────────────────────────────────
export default function DocumentsList() {
  const navigate = useNavigate();
  const { selectedFiscalYear } = useFiscalYear();
  const { user: currentUser } = useAuth();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);   // modal
  const [treeDoc, setTreeDoc] = useState(null);     // tree modal

  // مدال رد سند
  const [rejectingDoc, setRejectingDoc] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingWorkflow, setSubmittingWorkflow] = useState(false);

  const handleWorkflowApprove = async (doc) => {
    const stepInfo = getNextRoleTarget(doc.workflowStep);
    if (!window.confirm(`آیا از «${stepInfo.actionLabel}» برای سند شماره ${doc.document_number || ""} مطمئن هستید؟`)) return;
    setSubmittingWorkflow(true);
    try {
      const res = await api.post(`/api/documents/${doc._id}/workflow/approve`);
      if (res.data?.success) {
        fetchDocs();
        if (selected && selected._id === doc._id) setSelected(null);
      }
    } catch (err) {
      console.error("Workflow approve error:", err);
      alert(err?.response?.data?.message || "خطا در تایید سند.");
    } finally {
      setSubmittingWorkflow(false);
    }
  };

  const handleWorkflowRejectSubmit = async () => {
    if (!rejectingDoc) return;
    if (!rejectionReason.trim()) {
      alert("لطفاً دلیل رد سند را وارد نمایید.");
      return;
    }
    setSubmittingWorkflow(true);
    try {
      const res = await api.post(`/api/documents/${rejectingDoc._id}/workflow/reject`, {
        reason: rejectionReason.trim(),
      });
      if (res.data?.success) {
        setRejectingDoc(null);
        setRejectionReason("");
        fetchDocs();
        if (selected && selected._id === rejectingDoc._id) setSelected(null);
      }
    } catch (err) {
      console.error("Workflow reject error:", err);
      alert(err?.response?.data?.message || "خطا در رد سند.");
    } finally {
      setSubmittingWorkflow(false);
    }
  };

  // فیلترها
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterYear, setFilterYear] = useState(selectedFiscalYear || "");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (selectedFiscalYear) {
      setFilterYear(selectedFiscalYear);
    }
  }, [selectedFiscalYear]);

  // مرتب‌سازی
  const [sortBy, setSortBy] = useState("document_number");
  const [sortDir, setSortDir] = useState("desc");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/documents");
      setDocs(res.data.data ?? []);
    } catch {
      setError("خطا در دریافت لیست اسناد. اتصال به سرور را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (id, docNumber) => {
    if (!window.confirm(`آیا از حذف سند شماره ${docNumber} مطمئن هستید؟`)) return;
    try {
      await api.delete(`/api/documents/${id}`);
      setDocs(prev => prev.filter(d => d._id !== id));
      setSelected(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError("خطا در حذف سند. مجددا تلاش کنید.");
    }
  };

  const handleConfirm = async (id, docNumber) => {
    const targetDoc = docs.find(d => d._id === id);
    if (targetDoc?.status === "DRAFT") {
      alert(`سند شماره ${docNumber || ""} در وضعیت «پیش‌نویس» قرار دارد و هنوز تکمیل و آماده تأیید نشده است. لطفاً ابتدا آن را ویرایش و ثبت نهایی نمایید.`);
      return;
    }
    if (!window.confirm(`آیا از تأیید و نهایی‌سازی سند شماره ${docNumber} مطمئن هستید؟`)) return;
    try {
      const res = await api.patch(`/api/documents/${id}/confirm`);
      if (res.data?.data) {
        setDocs(prev => prev.map(d => d._id === id ? { ...d, status: "CONFIRMED" } : d));
        setSelected(null);
      }
    } catch (err) {
      console.error("Confirm error:", err);
      setError(err?.response?.data?.message || "خطا در تایید سند. دسترسی کاربر را بررسی کنید.");
    }
  };

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  function handleSort(field) {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("asc"); }
  }

  // اسناد مربوط به دوره مالی انتخابی/فعال و فیلتر شده بر اساس روال کارتابل نقش کاربر
  const yearDocs = useMemo(() => {
    let list = docs;
    if (filterYear) {
      list = list.filter(d => {
        const dYear = String(d.fiscal_year || d.fiscalYear || d.document_date?.slice(0, 4) || "");
        return dYear.includes(filterYear);
      });
    }
    return list.filter(d => isDocumentVisibleToUser(currentUser, d));
  }, [docs, filterYear, currentUser]);

  // خلاصه آماری (بر اساس اسناد دوره مالی فعال)
  const stats = useMemo(() => ({
    total: yearDocs.length,
    draft: yearDocs.filter(d => d.status === "DRAFT").length,
    confirmed: yearDocs.filter(d => d.status === "CONFIRMED").length,
    cancelled: yearDocs.filter(d => d.status === "CANCELLED").length,
  }), [yearDocs]);

  // فیلتر + جستجو + مرتب‌سازی
  const filtered = useMemo(() => {
    let list = [...yearDocs];

    if (filterStatus !== "ALL") list = list.filter(d => d.status === filterStatus);
    if (filterType !== "ALL") list = list.filter(d => d.document_type === filterType);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d =>
        d.document_number?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.reference_number?.toLowerCase().includes(q) ||
        String(d.fiscal_year || d.fiscalYear || "").includes(q) ||
        d.lines?.some(l =>
          l.account_code?.toLowerCase().includes(q) ||
          l.account_name?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q)
        )
      );
    }

    list.sort((a, b) => {
      let av = a[sortBy] ?? "";
      let bv = b[sortBy] ?? "";
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv), "fa")
        : String(bv).localeCompare(String(av), "fa");
    });

    return list;
  }, [yearDocs, search, filterStatus, filterType, sortBy, sortDir]);

  const hasFilters = filterStatus !== "ALL" || filterType !== "ALL" || search.trim() !== "" || (filterYear !== (selectedFiscalYear || ""));

  function clearFilters() {
    setFilterStatus("ALL");
    setFilterType("ALL");
    setFilterYear(selectedFiscalYear || "");
    setSearch("");
  }

  const handleCreateManualDoc = () => {
    const targetFY = filterYear || selectedFiscalYear;
    const draftDoc = docs.find((d) => {
      if (d.status !== "DRAFT") return false;
      if (!targetFY) return true;
      const dYear = String(d.fiscal_year || d.fiscalYear || d.document_date?.slice(0, 4) || "");
      return dYear.includes(String(targetFY));
    });
    if (draftDoc) {
      alert(`خطا: شما یک سند پیش‌نویس (شماره سند: ${draftDoc.document_number || "نامشخص"}) در دوره مالی انتخابی دارید. لطفاً ابتدا آن را تکمیل یا حذف نمایید تا مجاز به ثبت سند جدید شوید.`);
      navigate(`/document-setup/manual-doc?id=${draftDoc._id}`);
    } else {
      navigate("/document-setup/manual-doc");
    }
  };

  return (
    <PageShell>
      {/* Breadcrumb */}
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <ChevronLeft className="h-3 w-3 rotate-180" />
        <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate("/document-setup")}>تنظیم اسناد</span>
        <ChevronLeft className="h-3 w-3" />
        <span>لیست اسناد</span>
      </div>

      {/* هدر */}
      <div className="mb-5 flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground">لیست اسناد حسابداری</h1>
          <p className="text-xs text-muted-foreground mt-0.5">مشاهده و جستجوی تمام اسناد ثبت‌شده در سیستم</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDocs} className="gap-1.5 h-9 text-xs" disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            بروزرسانی
          </Button>
          <Button size="sm" onClick={handleCreateManualDoc} className="gap-1.5 h-9 text-xs">
            <FileText className="h-3.5 w-3.5" />صدور سند دستی
          </Button>
        </div>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5" dir="rtl">
        {[
          { label: "کل اسناد", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
          { label: "پیش‌نویس", value: stats.draft, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "تایید شده", value: stats.confirmed, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "ابطال شده", value: stats.cancelled, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", bg)}>
            <span className={cn("text-2xl font-extrabold font-mono", color)}>{value}</span>
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* نوار جستجو و فیلتر */}
      <Card className="mb-4">
        <CardContent className="p-3" dir="rtl">
          <div className="flex items-center gap-2 flex-wrap">
            {/* جستجو */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="جستجو در شماره سند، شرح، کد حساب، ردیف‌ها..."
                className="h-9 text-xs pr-9"
                dir="rtl"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* دکمه فیلترها */}
            <Button variant={showFilters || hasFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(s => !s)}
              className={cn("gap-1.5 h-9 text-xs", hasFilters && "bg-primary text-primary-foreground")}>
              <Filter className="h-3.5 w-3.5" />
              فیلترها {hasFilters && `(فعال)`}
            </Button>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 text-xs text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />پاک کردن
              </Button>
            )}

            {/* تعداد نتایج */}
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">
              {filtered.length} نتیجه از {yearDocs.length}
            </span>
          </div>

          {/* پنل فیلترها */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">وضعیت</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="ALL">همه</option>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">نوع سند</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="h-8 text-xs rounded-lg border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring/30">
                  <option value="ALL">همه</option>
                  {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">دوره مالی</label>
                <Input value={filterYear} onChange={e => setFilterYear(e.target.value)}
                  placeholder="مثال: 1403" className="h-8 text-xs" dir="ltr" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* خطا */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" dir="rtl">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          <button onClick={() => setError(null)} className="mr-auto text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* جدول */}
      <Card>
        <CardHeader className="pb-3 border-b" dir="rtl">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            اسناد حسابداری
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm" dir="rtl">
              <RefreshCw className="h-4 w-4 animate-spin" />در حال بارگذاری...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" dir="rtl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground/40">
                <FileText className="h-7 w-7" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground/70">
                  {docs.length === 0 ? "هیچ سندی ثبت نشده" : "نتیجه‌ای یافت نشد"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {docs.length === 0
                    ? "با کلیک روی «صدور سند دستی» اولین سند را ثبت کنید."
                    : "فیلترها یا عبارت جستجو را تغییر دهید."}
                </p>
              </div>
              {docs.length === 0 && (
                <Button size="sm" onClick={handleCreateManualDoc} className="gap-1.5 mt-1 text-xs">
                  <FileText className="h-3.5 w-3.5" />صدور سند دستی
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <SortHeader label="شماره سند" field="document_number" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="دوره مالی" field="fiscal_year" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader label="تاریخ سند" field="document_date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">نوع سند</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">وضعیت</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">کدهای حساب</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600">جمع بدهکار</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-rose-600">جمع بستانکار</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">شرح</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground whitespace-nowrap">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc, idx) => {
                    const totalD = doc.lines?.reduce((s, l) => s + (l.debit ?? 0), 0) ?? 0;
                    const totalC = doc.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
                    const balanced = totalD === totalC;
                    const StatusIcon = STATUS_ICON[doc.status] ?? Clock;
                    const accountCodes = [...new Set(doc.lines?.map(l => l.account_code).filter(Boolean) ?? [])];

                    return (
                      <tr key={doc._id ?? idx}
                        onClick={() => setSelected(doc)}
                        className="border-b last:border-0 hover:bg-primary/[0.03] cursor-pointer transition-colors group"
                      >
                        {/* شماره سند */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs font-bold text-foreground">{doc.document_number ?? "—"}</span>
                        </td>

                        {/* دوره مالی */}
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono text-xs text-foreground/80">{doc.fiscal_year}</span>
                        </td>

                        {/* تاریخ */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            {formatDocDate(doc.document_date, doc.fiscal_year)}
                          </span>
                        </td>

                        {/* نوع سند */}
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                            DOC_TYPE_COLOR[doc.document_type] ?? "bg-muted text-muted-foreground border-border")}>
                            {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type ?? "—"}
                          </span>
                        </td>

                        {/* وضعیت */}
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
                            doc.status?.includes("برگشت") ? "bg-amber-100 text-amber-700 border-amber-200" : (STATUS_COLOR[doc.status] ?? "bg-muted text-muted-foreground border-border"))}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {getCleanStatusLabel(doc.status)}
                          </span>
                        </td>

                        {/* کدهای حساب */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {accountCodes.slice(0, 3).map(code => (
                              <span key={code} className="font-mono text-[10px] bg-muted rounded px-1.5 py-0.5 text-foreground/70">{code}</span>
                            ))}
                            {accountCodes.length > 3 && (
                              <span className="text-[10px] text-muted-foreground/60">+{accountCodes.length - 3}</span>
                            )}
                            {accountCodes.length === 0 && <span className="text-muted-foreground/40 text-xs">—</span>}
                          </div>
                        </td>

                        {/* جمع بدهکار */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-blue-700 font-medium">{fmt(totalD)}</span>
                        </td>

                        {/* جمع بستانکار */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-rose-700 font-medium">{fmt(totalC)}</span>
                        </td>

                        {/* شرح */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <span className="text-xs text-muted-foreground truncate block" title={doc.description}>
                            {doc.description ?? "—"}
                          </span>
                          {doc.rejectionReason && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5 mt-1 font-semibold" title={`علت رد: ${doc.rejectionReason}`}>
                              <AlertTriangle className="h-2.5 w-2.5 text-rose-600 shrink-0" />
                              علت رد: {doc.rejectionReason}
                            </span>
                          )}
                        </td>

                        {/* عملیات */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {canUserApproveOrReject(currentUser, doc) && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleWorkflowApprove(doc); }}
                                  className="rounded-lg p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 transition-all border border-emerald-200 cursor-pointer"
                                  title={getNextRoleTarget(doc.workflowStep).actionLabel}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>

                                <button
                                  onClick={(e) => { e.stopPropagation(); setRejectingDoc(doc); setRejectionReason(""); }}
                                  className="rounded-lg p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-all border border-rose-200 cursor-pointer"
                                  title={`رد سند و برگشت به ${getPrevRoleTarget(doc.workflowStep)}`}
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* ۱. چشمی - مشاهده جزئیات سند */}
                            <button onClick={() => setSelected(doc)}
                              className="rounded-lg p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                              title="مشاهده جزئیات (چشمی)">
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* ۲. دکمه ویرایش برای ورود به خود سند در صدور سند دستی (فقط‌خواندنی بعد از قطعی شدن) */}
                            <button onClick={() => navigate(`/document-setup/manual-doc?id=${doc._id}`)}
                              className="rounded-lg p-1 text-muted-foreground hover:bg-amber-100 hover:text-amber-700 transition-all"
                              title={doc.status === "CONFIRMED" || doc.status === "صدور سند قطعی" ? "مشاهده سند در صدور سند دستی (فقط‌خواندنی)" : "ویرایش سند"}>
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* ۳. علامت درختواره - کل عملیات طی شده و سوابق هر گام */}
                            {canUserViewTreeInOperations(currentUser, doc) && (
                              <button onClick={() => setTreeDoc(doc)}
                                className="rounded-lg p-1 text-primary/80 hover:bg-primary/10 hover:text-primary transition-all"
                                title="درختواره گردش و سوابق سند">
                                <GitFork className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* حذف - فقط با دسترسی مدیر سیستم (فول اکسس) */}
                            {canUserDeleteDoc(currentUser, doc) && (
                              <button onClick={() => handleDelete(doc._id, doc.document_number)}
                                className="rounded-lg p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 transition-all"
                                title="حذف سند (مدیر سیستم)">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* مدال تایید دلیل رد سند */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectingDoc(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <Ban className="h-5 w-5" />
                <h3>رد و برگشت سند شماره {rejectingDoc.document_number}</h3>
              </div>
              <button onClick={() => setRejectingDoc(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-900">• ارجاع به مرحله قبل: کاربر <strong>«{getPrevRoleTarget(rejectingDoc.workflowStep)}»</strong></p>
              <p>• ثبت علت رد جهت درج در سوابق سند الزامی است.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">دلیل رد سند (الزامی):</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="علت رد سند را در این باکس بنویسید..."
                className="w-full text-xs p-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setRejectingDoc(null)} disabled={submittingWorkflow}>
                انصراف
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleWorkflowRejectSubmit}
                disabled={submittingWorkflow || !rejectionReason.trim()}
                className="gap-1.5 bg-rose-600 hover:bg-rose-700 font-bold"
              >
                {submittingWorkflow ? "در حال ثبت..." : "ثبت رد سند و برگشت"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal جزئیات */}
      {selected && (
        <DocDetailModal
          doc={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onWorkflowApprove={handleWorkflowApprove}
          onWorkflowReject={(doc) => {
            setRejectingDoc(doc);
            setRejectionReason("");
          }}
          onOpenTree={(doc) => setTreeDoc(doc)}
          currentUser={currentUser}
        />
      )}
      {/* Modal درختواره گردش کار */}
      {treeDoc && (
        <DocWorkflowTreeModal
          doc={treeDoc}
          onClose={() => setTreeDoc(null)}
        />
      )}
    </PageShell>
  );
}
