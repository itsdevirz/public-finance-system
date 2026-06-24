import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Save, Printer, RotateCcw, ChevronDown,
  FileText, CheckCircle2, Clock, Ban,
} from "lucide-react";
import sanamaCodes from "@/data/sanamaCodes.json";
import subAccountTitles from "@/data/subAccountTitles.json";
import sanamaRequirements from "@/data/sanamaRequirements.json";
import manualDocLookups from "@/data/manualDocLookups.json";

// ---- helpers ----
const allGroups = sanamaCodes.groups.map((g) => ({ code: g.code, title: g.title, accounts: g.accounts }));
const { bankAccounts, budgetRows } = manualDocLookups;

function getSubAccountTitle(rowNum) {
  return subAccountTitles.find((t) => t.row === rowNum);
}

function getRequiredRows(subAccountCode) {
  return sanamaRequirements[subAccountCode]?.requiredRows ?? [];
}

function needsSanamaFields(subAccountCode) {
  return getRequiredRows(subAccountCode).length > 0;
}

function getAccounts(groupCode) {
  const g = allGroups.find((x) => x.code === groupCode);
  return g ? g.accounts : [];
}

function getSubAccounts(groupCode, accountCode) {
  const accounts = getAccounts(groupCode);
  const a = accounts.find((x) => x.code === accountCode);
  return a ? (a.children || []) : [];
}

function formatNumber(val) {
  const n = parseInt(val?.toString().replace(/,/g, "") || "0", 10);
  if (isNaN(n)) return "";
  return n.toLocaleString("fa-IR");
}

function parseNumber(str) {
  return parseInt(str?.toString().replace(/,/g, "") || "0", 10) || 0;
}

const EMPTY_ROW = {
  id: Date.now(),
  group: "",
  account: "",
  subAccount: "",
  debit: "",
  credit: "",
  checkDate: "",
  checkNo: "",
  createYear: "",
  personFlag: false,
  checkFlag: false,
  desc: "",
  accountNumber: "",
  subBudgetCode: "",
};

// ---- ردیف جدول ----
function DocRow({ row, idx, onChange, onDelete, isActive, onActivate }) {
  const accounts = getAccounts(row.group);
  const subAccounts = getSubAccounts(row.group, row.account);

  function set(field, val) {
    onChange({ ...row, [field]: val });
  }

  function setGroup(val) {
    onChange({ ...row, group: val, account: "", subAccount: "", accountNumber: "", subBudgetCode: "" });
  }

  function setAccount(val) {
    onChange({ ...row, account: val, subAccount: "", accountNumber: "", subBudgetCode: "" });
  }

  function setSubAccount(val) {
    onChange({ ...row, subAccount: val, accountNumber: "", subBudgetCode: "" });
  }

  const cellCls = "border-l last:border-l-0 px-1 py-0.5";
  const inputCls = "h-7 text-xs rounded border-0 bg-transparent focus:bg-white focus:border focus:border-primary w-full px-1";
  const selectCls = "h-7 text-xs rounded border-0 bg-transparent focus:bg-white focus:outline-none w-full px-1 cursor-pointer";

  return (
    <tr
      className={`border-b transition-colors text-xs ${isActive ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-blue-50/40"}`}
      onClick={onActivate}
    >
      <td className={`${cellCls} text-center text-muted-foreground w-8`}>{idx + 1}</td>

      {/* گروه */}
      <td className={`${cellCls} w-20`}>
        <select className={selectCls} value={row.group} onChange={(e) => setGroup(e.target.value)}>
          <option value="" />
          {allGroups.map((g) => (
            <option key={g.code} value={g.code}>{g.code} - {g.title}</option>
          ))}
        </select>
      </td>

      {/* کل */}
      <td className={`${cellCls} w-28`}>
        <select className={selectCls} value={row.account} onChange={(e) => setAccount(e.target.value)} disabled={!row.group}>
          <option value="" />
          {accounts.map((a) => (
            <option key={a.code} value={a.code}>{a.code} - {a.title}</option>
          ))}
        </select>
      </td>

      {/* معین */}
      <td className={`${cellCls} w-40`}>
        <select className={selectCls} value={row.subAccount} onChange={(e) => setSubAccount(e.target.value)} disabled={!row.account}>
          <option value="" />
          {subAccounts.map((s) => (
            <option key={s.code} value={s.code}>{s.code} - {s.title}</option>
          ))}
        </select>
      </td>

      {/* مبلغ بدهکار */}
      <td className={`${cellCls} w-28`}>
        <input
          className={`${inputCls} text-blue-700`}
          value={row.debit}
          onChange={(e) => set("debit", e.target.value)}
          onBlur={(e) => set("debit", formatNumber(e.target.value))}
        />
      </td>

      {/* مبلغ بستانکار */}
      <td className={`${cellCls} w-28`}>
        <input
          className={`${inputCls} text-rose-700`}
          value={row.credit}
          onChange={(e) => set("credit", e.target.value)}
          onBlur={(e) => set("credit", formatNumber(e.target.value))}
        />
      </td>

      {/* حذف */}
      <td className={`${cellCls} w-8 text-center`}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-muted-foreground hover:text-rose-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function NaturePill({ nature }) {
  if (nature === "debit")
    return <span className="rounded-full bg-blue-50 text-blue-600 px-1.5 py-0.5 text-[10px]">بدهکار</span>;
  if (nature === "credit")
    return <span className="rounded-full bg-rose-50 text-rose-600 px-1.5 py-0.5 text-[10px]">بستانکار</span>;
  if (nature === "both")
    return <span className="rounded-full bg-amber-50 text-amber-600 px-1.5 py-0.5 text-[10px]">هر دو</span>;
  return null;
}

function SanamaExtraFields({ row, onAccountNumberChange, onBudgetRowChange }) {
  const requiredRows = getRequiredRows(row.subAccount);
  if (!requiredRows.length) return null;

  const inputCls = "h-8 text-xs rounded-md border bg-white px-2 focus:border-primary focus:outline-none w-full";
  const selectCls = "h-8 text-xs rounded-md border bg-white px-2 focus:border-primary focus:outline-none w-full";
  const labelCls = "text-[11px] text-muted-foreground shrink-0";

  return (
    <div className="border-t bg-amber-50/40 px-3 py-3">
      <p className="text-xs font-medium text-amber-800 mb-2">
        الزامات سناما برای معین {row.subAccount}
      </p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {requiredRows.includes(31) && (
          <div className="flex items-center gap-2">
            <Label className={`${labelCls} w-40`}>
              {getSubAccountTitle(31)?.title ?? "مشخصات حساب (شماره شبا)"}
            </Label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={inputCls}
              placeholder="شماره شبا (فقط عدد)"
              value={row.accountNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onAccountNumberChange(val);
              }}
              dir="ltr"
            />
          </div>
        )}
        {requiredRows.includes(43) && (
          <div className="flex items-center gap-2">
            <Label className={`${labelCls} w-40`}>
              {getSubAccountTitle(43)?.title ?? "ردیف بودجه‌ای"}
            </Label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={inputCls}
              placeholder="ردیف بودجه‌ای (فقط عدد)"
              value={row.subBudgetCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                onBudgetRowChange(val);
              }}
              dir="ltr"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---- component اصلی ----
export default function ManualDocument() {
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  const [header, setHeader] = useState({
    fiscalYear: "1404",
    docNo: "",
    docDate: today,
    docType: "عادی",
    access: "عادی",
    desc: "",
    letterNo: "",
    letterDate: "",
    status: "صدور سند",
  });

  const [rows, setRows] = useState([{ ...EMPTY_ROW, id: 1 }]);
  const [activeRowId, setActiveRowId] = useState(1);
  const [notes1, setNotes1] = useState({ program: "", activity: "", subActivity: "", chapter: "", subChapter: "", partChapter: "", costCenter: "" });
  const [notes2, setNotes2] = useState({ resourceName: "", personName: "", contractParty: "", contractSubject: "", details: "", personId: "", notifReceiver: "" });
  const [activeTab, setActiveTab] = useState(1);

  const activeRow = rows.find((r) => r.id === activeRowId) ?? rows[0];
  const showSanamaFields = needsSanamaFields(activeRow?.subAccount);

  function setH(k, v) { setHeader((p) => ({ ...p, [k]: v })); }

  function addRow() {
    const id = Date.now();
    setRows((prev) => [...prev, { ...EMPTY_ROW, id }]);
    setActiveRowId(id);
  }

  function updateRow(id, updated) {
    setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  function deleteRow(id) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (activeRowId === id && next.length) setActiveRowId(next[0].id);
      return next.length ? next : [{ ...EMPTY_ROW, id: Date.now() }];
    });
  }

  function handleAccountNumberChange(rowId, val) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, accountNumber: val } : r
      )
    );
  }

  function handleBudgetRowChange(rowId, val) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, subBudgetCode: val } : r
      )
    );
  }

  const totalDebit = rows.reduce((s, r) => s + parseNumber(r.debit), 0);
  const totalCredit = rows.reduce((s, r) => s + parseNumber(r.credit), 0);
  const diff = totalDebit - totalCredit;

  const statusColors = {
    "صدور سند": "bg-green-500",
    "در جریان": "bg-amber-400",
    "رد شده": "bg-rose-500",
    "پرداخت و دریافت": "bg-blue-500",
    "دفترداری": "bg-purple-500",
    "اعتمادات": "bg-indigo-500",
    "بایگانی": "bg-gray-400",
    "حسابداری": "bg-teal-500",
  };

  const inputCls = "h-8 text-xs rounded-md border bg-white focus:border-primary";
  const labelCls = "text-xs text-muted-foreground whitespace-nowrap";

  return (
    <PageShell>
      <PageHeader title="صدور سند دستی" description="ثبت و ویرایش اسناد حسابداری" />

      {/* ===== هدر سند ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-4">
              {/* ستون ۱ */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>دوره مالی</Label>
                  <Input className={inputCls} value={header.fiscalYear} onChange={(e) => setH("fiscalYear", e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>شماره سند</Label>
                  <Input className={inputCls} value={header.docNo} onChange={(e) => setH("docNo", e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>تاریخ سند</Label>
                  <Input className={inputCls} value={header.docDate} onChange={(e) => setH("docDate", e.target.value)} />
                </div>
              </div>

              {/* ستون ۲ */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>نوع سند</Label>
                  <select
                    className="h-8 text-xs rounded-md border bg-white px-2 focus:border-primary focus:outline-none"
                    value={header.docType}
                    onChange={(e) => setH("docType", e.target.value)}
                  >
                    {["عادی", "اصلاحی", "افتتاحیه", "اختتامیه"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>دسترسی</Label>
                  <select
                    className="h-8 text-xs rounded-md border bg-white px-2 focus:border-primary focus:outline-none"
                    value={header.access}
                    onChange={(e) => setH("access", e.target.value)}
                  >
                    {["عادی", "محرمانه"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>شماره نامه</Label>
                  <Input className={inputCls} value={header.letterNo} onChange={(e) => setH("letterNo", e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className={labelCls}>تاریخ نامه</Label>
                  <Input className={inputCls} value={header.letterDate} onChange={(e) => setH("letterDate", e.target.value)} />
                </div>
              </div>

              {/* ستون ۳ - وضعیت */}
              <div className="col-span-2 flex flex-col gap-2">
                <Label className={labelCls}>شرح سند</Label>
                <Input
                  className="h-8 text-xs rounded-md border bg-white"
                  value={header.desc}
                  onChange={(e) => setH("desc", e.target.value)}
                  placeholder="شرح سند را وارد کنید..."
                />
                <div className="mt-1">
                  <Label className={`${labelCls} mb-1 block`}>وضعیت سند</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(statusColors).map((s) => (
                      <button
                        key={s}
                        onClick={() => setH("status", s)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium text-white transition-all ${
                          header.status === s ? statusColors[s] + " ring-2 ring-offset-1 ring-current" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== جدول ردیف‌های سند ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="mb-3">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[900px]" dir="rtl">
                <thead>
                  <tr className="bg-muted/60 border-b text-muted-foreground text-[11px]">
                    <th className="px-2 py-2 text-center w-8">#</th>
                    <th className="px-2 py-2 text-right w-20">گروه</th>
                    <th className="px-2 py-2 text-right w-28">کل</th>
                    <th className="px-2 py-2 text-right w-40">معین</th>
                    <th className="px-2 py-2 text-right w-28 text-blue-600">بدهکار</th>
                    <th className="px-2 py-2 text-right w-28 text-rose-600">بستانکار</th>
                    <th className="px-2 py-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <DocRow
                      key={row.id}
                      row={row}
                      idx={idx}
                      isActive={row.id === activeRowId}
                      onActivate={() => setActiveRowId(row.id)}
                      onChange={(updated) => updateRow(row.id, updated)}
                      onDelete={() => deleteRow(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {showSanamaFields && (
              <SanamaExtraFields
                row={activeRow}
                onAccountNumberChange={(code) => handleAccountNumberChange(activeRowId, code)}
                onBudgetRowChange={(code) => handleBudgetRowChange(activeRowId, code)}
              />
            )}

            {/* جمع و دکمه اضافه */}
            <div className="flex items-center justify-between border-t px-3 py-2 bg-muted/20">
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={addRow}>
                <Plus className="h-3.5 w-3.5" />
                درج سطر
              </Button>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-muted-foreground">جمع بدهکار: <span className="font-semibold text-blue-700">{totalDebit.toLocaleString("fa-IR")}</span></span>
                <span className="text-muted-foreground">جمع بستانکار: <span className="font-semibold text-rose-700">{totalCredit.toLocaleString("fa-IR")}</span></span>
                <span className={`font-semibold ${diff === 0 ? "text-green-600" : "text-red-600"}`}>
                  اختلاف: {diff.toLocaleString("fa-IR")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== پنل پایین ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* توضیحات ۱ - برنامه / اعتبارات */}
          <Card>
            <CardContent className="p-3">
              <div className="flex border-b mb-3">
                {["توضیحات ۱", "توضیحات ۲"].map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(i + 1)}
                    className={`px-4 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === i + 1 ? "border-primary text-primary" : "border-transparent text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "program", label: "برنامه" },
                    { key: "activity", label: "فعالیت" },
                    { key: "subActivity", label: "زیرفعالیت" },
                    { key: "chapter", label: "فصل" },
                    { key: "subChapter", label: "زیر فصل" },
                    { key: "partChapter", label: "جز فصل" },
                    { key: "costCenter", label: "مرکز هزینه" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground w-24 shrink-0">{label}</Label>
                      <Input
                        className="h-7 text-xs"
                        value={notes1[key]}
                        onChange={(e) => setNotes1((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 2 && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "resourceName", label: "نام منبع" },
                    { key: "personName", label: "نام بند" },
                    { key: "contractParty", label: "طرف قرارداد" },
                    { key: "contractSubject", label: "موضوع قرارداد" },
                    { key: "details", label: "مشخصات تفصیلی" },
                    { key: "personId", label: "نام شخص" },
                    { key: "notifReceiver", label: "ابلاغ گیرنده" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground w-24 shrink-0">{label}</Label>
                      <Input
                        className="h-7 text-xs"
                        value={notes2[key]}
                        onChange={(e) => setNotes2((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* پنل راست - کدینگ انتخابی */}
          <Card>
            <CardContent className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-3">اطلاعات کدینگ انتخابی</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "گروه", value: activeRow?.group ? `${activeRow.group}` : "—" },
                  { label: "کل", value: activeRow?.account ? `${activeRow.account}` : "—" },
                  { label: "معین", value: activeRow?.subAccount ? `${activeRow.subAccount}` : "—" },
                  {
                    label: "ماهیت",
                    value: (() => {
                      const row = activeRow;
                      if (!row?.subAccount) return "—";
                      const subs = getSubAccounts(row.group, row.account);
                      const nature = subs.find((s) => s.code === row.subAccount)?.nature;
                      return nature === "debit" ? "بدهکار" :
                        nature === "credit" ? "بستانکار" :
                        nature === "both" ? "هر دو" : "—";
                    })(),
                  },
                  ...(needsSanamaFields(activeRow?.subAccount)
                    ? [
                        {
                          label: getSubAccountTitle(31)?.title ?? "شماره شبا",
                          value: activeRow?.accountNumber || "—",
                        },
                        {
                          label: getSubAccountTitle(43)?.title ?? "ردیف بودجه‌ای",
                          value: activeRow?.subBudgetCode || "—",
                        },
                      ]
                    : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-16 shrink-0">{label}:</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* وضعیت سند */}
              <div className="mt-4 rounded-lg bg-muted/30 p-2">
                <p className="text-[11px] text-muted-foreground mb-1">وضعیت فعلی سند</p>
                <Badge className={`${statusColors[header.status]} text-white text-xs`}>
                  {header.status}
                </Badge>
              </div>

              {/* خروج / ورود */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="block">خروج:</span>
                  <Input className="h-7 text-xs mt-1" placeholder="—" readOnly />
                </div>
                <div>
                  <span className="block">ورود:</span>
                  <Input className="h-7 text-xs mt-1" placeholder="—" readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* ===== نوار دکمه‌ها ===== */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="mt-3">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700">
                <Save className="h-3.5 w-3.5" />
                ثبت تغییرات
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <FileText className="h-3.5 w-3.5" />
                بررسی سند
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Printer className="h-3.5 w-3.5" />
                چاپ سند
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                صدو حواله
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                جدید
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                رد
              </Button>
              <div className="flex items-center gap-1 mr-auto">
                <label className="text-xs text-muted-foreground">تجمیع ۱</label>
                <Button size="sm" variant="secondary" className="h-7 text-xs px-2">تجمیع ۲</Button>
              </div>
              <div className="flex items-center gap-1 border-r pr-2">
                <label className="text-xs text-muted-foreground">تعداد ضمائم</label>
                <Input className="h-7 w-10 text-xs text-center" defaultValue="0" />
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <FileText className="h-3.5 w-3.5" />
                بستن حساب
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 h-8 text-xs">
                <Ban className="h-3.5 w-3.5" />
                خروج
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageShell>
  );
}
