import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Modal, ModalFooter } from "@/components/ui/modal";
import {
  Plus, Search, Trash2, Pencil, RefreshCw, X, CheckCircle2, XCircle,
  Settings, Hash, FileCheck, Shield, GitBranch, Printer, Link2,
  Users, Sliders, FileText, Download, Eye, Power, Info,
} from "lucide-react";
import api from "@/api";

// ─── ثابت‌ها ───────────────────────────────────────────────────────────────────
const GROUPS = ["عمومی","حسابداری","خزانه","دریافت","پرداخت","انبار","اموال","حقوق و دستمزد","فروش","خرید","تولید","قرارداد","بودجه"];
const MODULES = ["حسابداری","انبار","اموال","حقوق","دریافت و پرداخت","فروش","خرید","سیستم"];
const SYSTEMS = ["انبار","اموال","حقوق","دریافت و پرداخت","قرارداد","بودجه","سامانه مودیان","چک","فروش"];
const ROLES   = ["admin","accountant","manager","auditor","viewer","treasurer"];
const ICONS   = ["FileText","Receipt","CreditCard","Banknote","BookOpen","Archive","Wallet","TrendingUp","TrendingDown","RefreshCw","Package","Award","Layers"];

const GROUP_COLORS = {
  حسابداری: "bg-blue-100 text-blue-700",
  خزانه:    "bg-emerald-100 text-emerald-700",
  دریافت:   "bg-sky-100 text-sky-700",
  پرداخت:   "bg-rose-100 text-rose-700",
  انبار:    "bg-amber-100 text-amber-700",
  اموال:    "bg-purple-100 text-purple-700",
  "حقوق و دستمزد": "bg-orange-100 text-orange-700",
  فروش:    "bg-green-100 text-green-700",
  خرید:    "bg-pink-100 text-pink-700",
  بودجه:   "bg-indigo-100 text-indigo-700",
  قرارداد: "bg-teal-100 text-teal-700",
  عمومی:   "bg-gray-100 text-gray-700",
};

// ─── مقدار پیش‌فرض فرم ────────────────────────────────────────────────────────
const emptyForm = () => ({
  code: "", title: "", shortTitle: "", group: "عمومی", module: "حسابداری",
  color: "#6366f1", icon: "FileText", isActive: true, description: "",
  numbering: {
    method: "auto", prefix: "", startNumber: 1, digitCount: 6,
    separatePerYear: true, separatePerBranch: false, separatePerType: true, separatePerPeriod: false,
  },
  registration: {
    allowDraft: true, allowTemporary: true, allowFinal: true,
    allowEdit: true, allowDelete: false, allowReverse: true, allowCopy: true,
    allowPrint: true, allowArchive: true,
    autoGenerateAccounting: false, autoPostOnSave: false, saveDraft: true,
  },
  financialControls: {
    requireBalanced: true, allowZeroAmount: false, allowNoDescription: false,
    allowDuplicateAccount: false, allowDuplicateMoein: false, allowDuplicateCostCenter: true,
    checkAmountLimit: false, maxAmount: 0,
    checkFiscalDate: true, checkFiscalPeriod: true, checkAccountStatus: true,
  },
  workflow: {
    requireSupervisorApproval: false, requireFinanceManagerApproval: false,
    requireCEOApproval: false, approvalSteps: 1,
    allowReject: true, allowReturnForCorrection: true,
  },
  print: {
    template: "default", showLogo: true, showStamp: true, showSignature: true,
    showBarcode: false, showQRCode: true, copyCount: 2, autoPrintAfterPost: false,
  },
  systemConnections: [],
  permissions: {
    canCreate: ["admin","accountant"], canEdit: ["admin","accountant"],
    canDelete: ["admin"], canPrint: ["admin","accountant","viewer"],
    canVoid: ["admin"], canApprove: ["admin","manager"], canView: ["admin","accountant","viewer","auditor"],
  },
  advanced: {
    autoGenerateReversal: false, createCorrectionDoc: false,
    allowAttachment: true, requireAttachment: false,
    recordEffectiveDate: false, recordDueDate: false,
    recordUniqueId: true, recordTrackingCode: false,
    recordReferenceNumber: false, recordArchiveNumber: false,
  },
});

// ─── کامپوننت‌های کمکی ─────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, color = "text-primary" }) {
  return (
    <div className={`flex items-center gap-2 mb-3 pb-2 border-b font-bold text-sm ${color}`}>
      <Icon className="h-4 w-4" />{title}
    </div>
  );
}

function CheckItem({ label, checked, onChange, description }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group py-1">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary shrink-0" />
      <div>
        <span className="text-sm group-hover:text-foreground text-foreground/80">{label}</span>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

function Field({ label, children, required }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-foreground/80">
        {label}{required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Sel({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full h-9 text-sm rounded-md border border-input bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => typeof o === "string"
        ? <option key={o} value={o}>{o}</option>
        : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );
}

function MultiRoleSelect({ label, value, onChange }) {
  const toggle = (role) => onChange(
    value.includes(role) ? value.filter(r => r !== role) : [...value, role]
  );
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {ROLES.map(r => (
          <button key={r} type="button" onClick={() => toggle(r)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors
              ${value.includes(r) ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── تب ۱: اطلاعات اصلی ───────────────────────────────────────────────────────
function Tab1({ form, set }) {
  const preview = `${form.numbering.prefix}${String(form.numbering.startNumber).padStart(form.numbering.digitCount, "0")}`;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* سمت راست: اطلاعات پایه */}
      <div className="space-y-4">
        <SectionTitle icon={Info} title="اطلاعات اصلی سند" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="کد نوع سند" required>
            <Input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
              placeholder="مثال: JRN" className="h-9 font-mono tracking-widest" maxLength={6} />
          </Field>
          <Field label="وضعیت">
            <div className="flex items-center gap-2 h-9">
              <input type="checkbox" id="isActive" checked={form.isActive}
                onChange={e => set("isActive", e.target.checked)} className="h-4 w-4 rounded" />
              <Label htmlFor="isActive" className="text-sm cursor-pointer">فعال</Label>
            </div>
          </Field>
        </div>
        <Field label="عنوان نوع سند" required>
          <Input value={form.title} onChange={e => set("title", e.target.value)}
            placeholder="مثال: سند روزنامه" className="h-9" />
        </Field>
        <Field label="عنوان کوتاه">
          <Input value={form.shortTitle} onChange={e => set("shortTitle", e.target.value)}
            placeholder="مثال: روزنامه" className="h-9" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="گروه سند">
            <Sel value={form.group} onChange={v => set("group", v)} options={GROUPS} />
          </Field>
          <Field label="ماژول مربوطه">
            <Sel value={form.module} onChange={v => set("module", v)} options={MODULES} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="رنگ نمایش">
            <div className="flex items-center gap-2 h-9">
              <input type="color" value={form.color} onChange={e => set("color", e.target.value)}
                className="h-8 w-8 rounded border cursor-pointer" />
              <span className="text-xs font-mono text-muted-foreground">{form.color}</span>
            </div>
          </Field>
          <Field label="آیکون">
            <Sel value={form.icon} onChange={v => set("icon", v)} options={ICONS} />
          </Field>
        </div>
        <Field label="توضیحات">
          <textarea value={form.description} onChange={e => set("description", e.target.value)}
            rows={3} placeholder="توضیحات تکمیلی در مورد کاربرد این نوع سند..."
            className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </Field>
      </div>

      {/* سمت چپ: شماره‌گذاری */}
      <div className="space-y-4">
        <SectionTitle icon={Hash} title="شماره‌گذاری" color="text-emerald-600" />
        <Field label="روش شماره‌گذاری">
          <div className="grid grid-cols-3 gap-2">
            {[["auto","خودکار"],["manual","دستی"],["combined","ترکیبی"]].map(([v,l]) => (
              <button key={v} type="button" onClick={() => set("numbering.method", v)}
                className={`py-2 text-xs rounded-lg border transition-all font-medium
                  ${form.numbering.method === v ? "bg-primary/10 border-primary text-primary" : "border-input text-muted-foreground hover:bg-muted/50"}`}>
                {l}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="پیشوند">
            <Input value={form.numbering.prefix} onChange={e => set("numbering.prefix", e.target.value)}
              placeholder="مثال: JRN-" className="h-9 font-mono" />
          </Field>
          <Field label="شروع از شماره">
            <Input type="number" value={form.numbering.startNumber}
              onChange={e => set("numbering.startNumber", Number(e.target.value))} className="h-9" min={1} />
          </Field>
          <Field label="تعداد ارقام">
            <Input type="number" value={form.numbering.digitCount}
              onChange={e => set("numbering.digitCount", Number(e.target.value))} className="h-9" min={3} max={10} />
          </Field>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-sm">
          <span className="text-muted-foreground">نمونه شماره: </span>
          <span className="font-mono font-bold text-primary">{preview}</span>
        </div>
        <div className="space-y-1.5 pt-2">
          <Label className="text-xs font-medium text-muted-foreground block mb-2">شماره‌گذاری مستقل برای:</Label>
          {[
            ["separatePerYear",   "هر سال مالی"],
            ["separatePerBranch", "هر شعبه"],
            ["separatePerType",   "هر نوع سند"],
            ["separatePerPeriod", "هر دوره"],
          ].map(([k, l]) => (
            <CheckItem key={k} label={l} checked={form.numbering[k]}
              onChange={v => set(`numbering.${k}`, v)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── تب ۲: تنظیمات ثبت ───────────────────────────────────────────────────────
function Tab2({ form, set }) {
  const items = [
    ["allowDraft",   "ثبت پیش‌نویس مجاز باشد",       "سند در حالت Draft ذخیره شود"],
    ["allowTemporary","ثبت موقت مجاز باشد",          "سند در وضعیت DRAFT باقی بماند"],
    ["allowFinal",   "ثبت قطعی مجاز باشد",           "سند به وضعیت CONFIRMED برود"],
    ["allowEdit",    "اجازه ویرایش",                 "پس از ثبت قابل تغییر باشد"],
    ["allowDelete",  "اجازه حذف",                    "سند قابل حذف فیزیکی باشد"],
    ["allowReverse", "اجازه برگشت (Reverse)",         "سند معکوس خودکار ایجاد شود"],
    ["allowCopy",    "اجازه کپی",                    "امکان کپی از روی این نوع سند"],
    ["allowPrint",   "امکان چاپ",                    "دکمه چاپ برای این نوع فعال باشد"],
    ["allowArchive", "امکان بایگانی",                 "ارسال به آرشیو دیجیتال"],
    ["autoGenerateAccounting","تولید خودکار سند حسابداری","در صورت ایجاد از سایر ماژول‌ها"],
    ["autoPostOnSave","ثبت خودکار هنگام ذخیره",      "بدون نیاز به تأیید دستی"],
    ["saveDraft",    "ذخیره پیش‌نویس",               "امکان ذخیره موقت بدون ثبت"],
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
      <SectionTitle icon={FileCheck} title="مجوزهای ثبت و عملیات" />
      <div className="hidden sm:block" />
      {items.map(([k, l, d]) => (
        <CheckItem key={k} label={l} description={d} checked={form.registration[k]}
          onChange={v => set(`registration.${k}`, v)} />
      ))}
    </div>
  );
}

// ─── تب ۳: کنترل‌های مالی ─────────────────────────────────────────────────────
function Tab3({ form, set }) {
  const checks = [
    ["requireBalanced",        "الزام توازن بدهکار و بستانکار",   "سند ناموزون ثبت نشود"],
    ["allowZeroAmount",        "اجازه مبلغ صفر",                  "ردیف‌هایی با مبلغ صفر مجاز باشد"],
    ["allowNoDescription",     "اجازه سند بدون شرح",              "ثبت سند بدون توضیح مجاز باشد"],
    ["allowDuplicateAccount",  "اجازه سرفصل تکراری",              "یک کد حساب چند بار در سند"],
    ["allowDuplicateMoein",    "اجازه حساب معین تکراری",          "یک معین چند بار در سند"],
    ["allowDuplicateCostCenter","اجازه مرکز هزینه تکراری",        "یک مرکز هزینه چند بار"],
    ["checkFiscalDate",        "کنترل تاریخ با محدوده سال مالی",  "تاریخ باید در بازه سال مالی باشد"],
    ["checkFiscalPeriod",      "کنترل دوره مالی",                  "دوره ماهانه نباید بسته باشد"],
    ["checkAccountStatus",     "کنترل وضعیت حساب",                "حساب باید فعال باشد"],
    ["checkAmountLimit",       "کنترل سقف مبلغ",                  "مبلغ از حد مجاز بیشتر نباشد"],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
        <SectionTitle icon={Shield} title="کنترل‌های اعتبارسنجی مالی" color="text-rose-600" />
        <div className="hidden sm:block" />
        {checks.map(([k, l, d]) => (
          <CheckItem key={k} label={l} description={d} checked={form.financialControls[k]}
            onChange={v => set(`financialControls.${k}`, v)} />
        ))}
      </div>
      {form.financialControls.checkAmountLimit && (
        <div className="mt-3 max-w-xs">
          <Field label="سقف مبلغ مجاز (ریال)">
            <Input type="number" value={form.financialControls.maxAmount}
              onChange={e => set("financialControls.maxAmount", Number(e.target.value))}
              className="h-9 font-mono" placeholder="0 = بدون محدودیت" />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── تب ۴: گردش کار ───────────────────────────────────────────────────────────
function Tab4({ form, set }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <SectionTitle icon={GitBranch} title="تأییدات گردش کار (Workflow)" color="text-violet-600" />
        {[
          ["requireSupervisorApproval",    "نیاز به تأیید سرپرست"],
          ["requireFinanceManagerApproval","نیاز به تأیید مدیر مالی"],
          ["requireCEOApproval",           "نیاز به تأیید مدیرعامل"],
          ["allowReject",                  "امکان رد سند"],
          ["allowReturnForCorrection",     "امکان برگشت جهت اصلاح"],
        ].map(([k, l]) => (
          <CheckItem key={k} label={l} checked={form.workflow[k]}
            onChange={v => set(`workflow.${k}`, v)} />
        ))}
      </div>
      <div className="space-y-3">
        <SectionTitle icon={Settings} title="تنظیمات مراحل" color="text-slate-600" />
        <Field label="تعداد مراحل تأیید">
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={5} value={form.workflow.approvalSteps}
              onChange={e => set("workflow.approvalSteps", Number(e.target.value))}
              className="flex-1" />
            <span className="text-lg font-bold text-primary w-6 text-center">
              {form.workflow.approvalSteps}
            </span>
          </div>
        </Field>
        <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
          <p>مراحل فعال:</p>
          {form.workflow.requireSupervisorApproval && <p>← مرحله ۱: تأیید سرپرست</p>}
          {form.workflow.requireFinanceManagerApproval && <p>← مرحله ۲: تأیید مدیر مالی</p>}
          {form.workflow.requireCEOApproval && <p>← مرحله ۳: تأیید مدیرعامل</p>}
          {!form.workflow.requireSupervisorApproval && !form.workflow.requireFinanceManagerApproval && !form.workflow.requireCEOApproval &&
            <p className="text-amber-600">هیچ مرحله تأییدی فعال نیست — سند مستقیم ثبت می‌شود</p>}
        </div>
      </div>
    </div>
  );
}

// ─── تب ۵: تنظیمات چاپ ────────────────────────────────────────────────────────
function Tab5({ form, set }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <SectionTitle icon={Printer} title="تنظیمات قالب چاپ" color="text-cyan-600" />
        <Field label="قالب چاپ">
          <Sel value={form.print.template} onChange={v => set("print.template", v)}
            options={[["default","پیش‌فرض سیستم"],["compact","فشرده"],["detailed","تفصیلی"],["official","رسمی"]].map(([value,label]) => ({value,label}))} />
        </Field>
        {[
          ["showLogo",            "نمایش لوگو"],
          ["showStamp",           "نمایش مهر"],
          ["showSignature",       "نمایش امضا"],
          ["showBarcode",         "نمایش بارکد"],
          ["showQRCode",          "نمایش QR Code"],
          ["autoPrintAfterPost",  "چاپ خودکار بعد از ثبت"],
        ].map(([k, l]) => (
          <CheckItem key={k} label={l} checked={form.print[k]}
            onChange={v => set(`print.${k}`, v)} />
        ))}
      </div>
      <div className="space-y-3">
        <SectionTitle icon={FileText} title="نسخه‌های چاپی" color="text-slate-600" />
        <Field label="تعداد نسخه چاپ">
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={5} value={form.print.copyCount}
              onChange={e => set("print.copyCount", Number(e.target.value))} className="flex-1" />
            <span className="text-lg font-bold text-primary w-6 text-center">{form.print.copyCount}</span>
          </div>
        </Field>
        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
          {Array.from({length: form.print.copyCount}, (_, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              نسخه {i+1}: {i===0?"اصل (بایگانی)":i===1?"تحویل به ذینفع":"کپی رونوشت"}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── تب ۶: اتصال سیستم‌ها ─────────────────────────────────────────────────────
function Tab6({ form, set }) {
  const toggle = (sys) => {
    const cur = form.systemConnections;
    set("systemConnections", cur.includes(sys) ? cur.filter(s => s !== sys) : [...cur, sys]);
  };
  return (
    <div className="space-y-4">
      <SectionTitle icon={Link2} title="اتصال به سایر سیستم‌ها" color="text-teal-600" />
      <p className="text-xs text-muted-foreground">
        مشخص کنید این نوع سند می‌تواند از کدام سیستم‌ها تولید شود یا به کدام سیستم‌ها داده بدهد.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SYSTEMS.map(sys => {
          const active = form.systemConnections.includes(sys);
          return (
            <button key={sys} type="button" onClick={() => toggle(sys)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all
                ${active ? "bg-primary/10 border-primary text-primary" : "border-input text-muted-foreground hover:bg-muted/40"}`}>
              <Link2 className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
              {sys}
            </button>
          );
        })}
      </div>
      {form.systemConnections.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
          <p className="font-medium text-foreground/80">جریان داده فعال:</p>
          {form.systemConnections.map(s => (
            <p key={s} className="text-muted-foreground">← {s} → سند حسابداری → دفتر کل</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── تب ۷: دسترسی کاربران ─────────────────────────────────────────────────────
function Tab7({ form, set }) {
  const permKeys = [
    ["canCreate",  "ثبت کنند"],
    ["canEdit",    "ویرایش کنند"],
    ["canDelete",  "حذف کنند"],
    ["canPrint",   "چاپ کنند"],
    ["canVoid",    "ابطال کنند"],
    ["canApprove", "تأیید کنند"],
    ["canView",    "مشاهده کنند"],
  ];
  return (
    <div className="space-y-4">
      <SectionTitle icon={Users} title="دسترسی نقش‌های کاربری" color="text-amber-600" />
      <p className="text-xs text-muted-foreground">
        مشخص کنید هر نقش چه عملیاتی روی این نوع سند انجام دهد.
      </p>
      <div className="space-y-4">
        {permKeys.map(([k, l]) => (
          <MultiRoleSelect key={k} label={`چه نقش‌هایی می‌توانند ${l}`}
            value={form.permissions[k]}
            onChange={v => set(`permissions.${k}`, v)} />
        ))}
      </div>
    </div>
  );
}

// ─── تب ۸: تنظیمات پیشرفته ────────────────────────────────────────────────────
function Tab8({ form, set }) {
  const items = [
    ["autoGenerateReversal",  "تولید خودکار سند معکوس",      "هنگام برگشت، سند عکس ایجاد شود"],
    ["createCorrectionDoc",   "ایجاد سند اصلاحیه",            "امکان ساخت نسخه اصلاح‌شده"],
    ["allowAttachment",       "امکان پیوست فایل",             "قابلیت الصاق مدرک"],
    ["requireAttachment",     "الزام پیوست",                  "بدون پیوست ثبت نشود"],
    ["recordEffectiveDate",   "ثبت تاریخ مؤثر",              "تاریخ اعمال سند غیر از تاریخ ثبت"],
    ["recordDueDate",         "ثبت تاریخ سررسید",             "برای اسناد دارای موعد پرداخت"],
    ["recordUniqueId",        "ثبت شناسه یکتا",               "UUID خودکار سیستم"],
    ["recordTrackingCode",    "ثبت کد رهگیری",                "برای ارسال به سامانه‌های خارجی"],
    ["recordReferenceNumber", "ثبت شماره مرجع",               "شماره ارجاع به سند یا قرارداد"],
    ["recordArchiveNumber",   "ثبت شماره بایگانی",            "کد بایگانی فیزیکی"],
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
      <SectionTitle icon={Sliders} title="تنظیمات پیشرفته" color="text-gray-600" />
      <div className="hidden sm:block" />
      {items.map(([k, l, d]) => (
        <CheckItem key={k} label={l} description={d} checked={form.advanced[k]}
          onChange={v => set(`advanced.${k}`, v)} />
      ))}
    </div>
  );
}

// ─── مدال فرم اصلی ────────────────────────────────────────────────────────────
function DocumentTypeModal({ open, onClose, onSave, editData }) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  useEffect(() => {
    if (editData) {
      // merge عمیق با emptyForm تا فیلدهای جدید خالی نماند
      setForm({ ...emptyForm(), ...editData });
    } else {
      setForm(emptyForm());
    }
    setError("");
    setActiveTab("info");
  }, [editData, open]);

  // setter عمومی با پشتیبانی از nested path مثل "numbering.prefix"
  const set = (path, val) => {
    setForm(prev => {
      const keys = path.split(".");
      if (keys.length === 1) return { ...prev, [path]: val };
      const top = keys[0];
      return { ...prev, [top]: { ...prev[top], [keys[1]]: val } };
    });
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      setError("کد و عنوان نوع سند الزامی است");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: "info",        icon: Info,       label: "اطلاعات اصلی" },
    { id: "register",    icon: FileCheck,  label: "تنظیمات ثبت" },
    { id: "financial",   icon: Shield,     label: "کنترل مالی" },
    { id: "workflow",    icon: GitBranch,  label: "گردش کار" },
    { id: "print",       icon: Printer,    label: "چاپ" },
    { id: "connections", icon: Link2,      label: "سیستم‌ها" },
    { id: "access",      icon: Users,      label: "دسترسی" },
    { id: "advanced",    icon: Sliders,    label: "پیشرفته" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden border"
          >
            {/* هدر */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20 shrink-0">
              <div>
                <h2 className="font-bold text-base">{editData ? "ویرایش نوع سند" : "تعریف نوع سند جدید"}</h2>
                {editData && <p className="text-xs text-muted-foreground mt-0.5">{editData.code} — {editData.title}</p>}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* تب‌ها */}
            <div className="border-b shrink-0 overflow-x-auto">
              <div className="flex min-w-max">
                {TABS.map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap
                      ${activeTab === id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            {/* محتوا */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && <div className="mb-4 text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">{error}</div>}
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {activeTab === "info"        && <Tab1 form={form} set={set} />}
                  {activeTab === "register"    && <Tab2 form={form} set={set} />}
                  {activeTab === "financial"   && <Tab3 form={form} set={set} />}
                  {activeTab === "workflow"    && <Tab4 form={form} set={set} />}
                  {activeTab === "print"       && <Tab5 form={form} set={set} />}
                  {activeTab === "connections" && <Tab6 form={form} set={set} />}
                  {activeTab === "access"      && <Tab7 form={form} set={set} />}
                  {activeTab === "advanced"    && <Tab8 form={form} set={set} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* فوتر */}
            <div className="border-t px-6 py-4 flex items-center justify-between shrink-0 bg-muted/10">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActiveFoot" checked={form.isActive}
                  onChange={e => set("isActive", e.target.checked)} className="h-4 w-4 rounded" />
                <Label htmlFor="isActiveFoot" className="text-sm cursor-pointer">نوع سند فعال باشد</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>انصراف</Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="min-w-[100px]">
                  {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin ml-1.5" />}
                  {editData ? "ذخیره تغییرات" : "ایجاد نوع سند"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── کامپوننت اصلی صفحه ────────────────────────────────────────────────────────
export default function DocumentTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterGroup) params.append("group", filterGroup);
      const res = await api.get(`/api/document-types?${params}`);
      setTypes(res.data.data ?? []);
    } catch {
      // fallback: داده‌های پیش‌فرض محلی
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [search, filterGroup]);

  useEffect(() => { load(); }, [load]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await api.post("/api/document-types/seed");
      showToast(res.data.message ?? "انواع سند پیش‌فرض بارگذاری شد");
      load();
    } catch (e) {
      showToast(e?.response?.data?.message ?? "خطا در بارگذاری پیش‌فرض‌ها", "error");
    } finally {
      setSeeding(false);
    }
  };

  const handleSave = async (form) => {
    if (editItem?._id) {
      await api.put(`/api/document-types/${editItem._id}`, form);
      showToast("نوع سند با موفقیت ویرایش شد");
    } else {
      await api.post("/api/document-types", form);
      showToast("نوع سند جدید ایجاد شد");
    }
    load();
  };

  const handleDelete = async (item) => {
    try {
      const res = await api.delete(`/api/document-types/${item._id}`);
      if (res.data.deactivated) {
        showToast(res.data.message, "info");
      } else {
        showToast("نوع سند حذف شد");
      }
    } catch (e) {
      showToast(e?.response?.data?.message ?? "خطا در حذف", "error");
    }
    setDeleteConfirm(null);
    load();
  };

  const handleToggle = async (item) => {
    try {
      await api.patch(`/api/document-types/${item._id}/toggle`);
      showToast(item.isActive ? "غیرفعال شد" : "فعال شد");
      load();
    } catch {
      showToast("خطا در تغییر وضعیت", "error");
    }
  };

  const groupCounts = types.reduce((acc, t) => { acc[t.group] = (acc[t.group] ?? 0) + 1; return acc; }, {});

  return (
    <PageShell>
      <PageHeader
        title="تعریف انواع سند"
        description="مدیریت جامع انواع اسناد مالی، تنظیمات ثبت، گردش کار، دسترسی‌ها و کنترل‌های مالی"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" className="gap-1.5 h-8" onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> نوع سند جدید
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleSeed} disabled={seeding}>
            {seeding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            بارگذاری پیش‌فرض‌ها
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={load} title="بازخوانی">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </PageHeader>

      {/* آمار گروه‌ها */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterGroup("")}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
            ${!filterGroup ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
          همه ({types.length})
        </button>
        {Object.entries(groupCounts).map(([g, c]) => (
          <button key={g} onClick={() => setFilterGroup(filterGroup === g ? "" : g)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all
              ${filterGroup === g ? "bg-primary text-primary-foreground border-primary" : `border-input ${GROUP_COLORS[g] ?? "text-muted-foreground"} hover:border-primary/50`}`}>
            {g} ({c})
          </button>
        ))}
      </motion.div>

      {/* جستجو */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
        <div className="flex items-center gap-2 bg-background border rounded-xl px-3 h-10">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو بر اساس کد، عنوان یا گروه..."
            className="flex-1 text-sm bg-transparent focus:outline-none" />
          {search && <button onClick={() => setSearch("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
      </motion.div>

      {/* جدول */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-2">{[...Array(6)].map((_,i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}</div>
            ) : types.length === 0 ? (
              <div className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">هیچ نوع سندی تعریف نشده</p>
                <p className="text-xs text-muted-foreground mt-1">برای شروع، روی «بارگذاری پیش‌فرض‌ها» کلیک کنید</p>
                <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={handleSeed}>
                  <Download className="h-3.5 w-3.5" /> بارگذاری انواع پیش‌فرض
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-right">
                      <th className="px-4 py-3 font-medium text-muted-foreground w-8">#</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">کد</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">عنوان</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">گروه</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">ماژول</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">شماره‌گذاری</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">وضعیت</th>
                      <th className="px-4 py-3 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {types.map((t, i) => (
                      <tr key={t._id ?? t.code} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color ?? "#6366f1" }} />
                            <span className="font-mono font-bold text-xs">{t.code}</span>
                            {t.isDefault && <Badge variant="secondary" className="text-[10px] py-0 h-4">پیش‌فرض</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.title}</div>
                          {t.shortTitle && <div className="text-xs text-muted-foreground">{t.shortTitle}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GROUP_COLORS[t.group] ?? "bg-gray-100 text-gray-600"}`}>
                            {t.group}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{t.module}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground">
                            {t.numbering?.prefix}{String(t.numbering?.startNumber ?? 1).padStart(t.numbering?.digitCount ?? 6, "0")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {t.isActive
                            ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 py-0 h-5">فعال</Badge>
                            : <Badge variant="secondary" className="text-[10px] py-0 h-5">غیرفعال</Badge>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewItem(t)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title="مشاهده">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { setEditItem(t); setModalOpen(true); }} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title="ویرایش">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleToggle(t)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title={t.isActive ? "غیرفعال" : "فعال"}>
                              <Power className={`h-3.5 w-3.5 ${t.isActive ? "text-amber-500" : "text-emerald-500"}`} />
                            </button>
                            <button onClick={() => setDeleteConfirm(t)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="حذف">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* مدال فرم */}
      <DocumentTypeModal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSave={handleSave} editData={editItem} />

      {/* مدال مشاهده سریع */}
      <AnimatePresence>
        {viewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h3 className="font-bold">جزئیات نوع سند</h3>
                <button onClick={() => setViewItem(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="p-5 space-y-3 text-sm">
                {[["کد",viewItem.code],["عنوان",viewItem.title],["گروه",viewItem.group],["ماژول",viewItem.module],
                  ["روش شماره‌گذاری",viewItem.numbering?.method],["پیشوند",viewItem.numbering?.prefix||"—"],
                  ["توازن الزامی",viewItem.financialControls?.requireBalanced?"بله":"خیر"],
                  ["مراحل تأیید",viewItem.workflow?.approvalSteps],
                  ["سیستم‌های متصل",(viewItem.systemConnections??[]).join("، ")||"—"],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between border-b pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewItem(null)}>بستن</Button>
                <Button size="sm" onClick={() => { setEditItem(viewItem); setViewItem(null); setModalOpen(true); }}>ویرایش</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* دیالوگ حذف */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" dir="rtl">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 border">
              <h3 className="font-bold mb-2">تأیید حذف</h3>
              <p className="text-sm text-muted-foreground mb-4">
                آیا از حذف نوع سند <strong>«{deleteConfirm.title}»</strong> مطمئن هستید؟<br />
                اگر در اسناد مالی استفاده شده باشد، فقط غیرفعال می‌گردد.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>انصراف</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)}>حذف</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 min-w-[200px]
              ${toast.type==="error"?"bg-destructive text-destructive-foreground":toast.type==="info"?"bg-blue-600 text-white":"bg-emerald-600 text-white"}`}>
            {toast.type==="error"?<XCircle className="h-4 w-4"/>:<CheckCircle2 className="h-4 w-4"/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
