import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Trash2, Pencil, FolderTree, ChevronDown, ChevronLeft,
  Download, Upload, Printer, Filter, X, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, FileSpreadsheet, RefreshCw, Eye,
} from "lucide-react";
import api from "@/api";

// ─── ثابت‌ها ───────────────────────────────────────────────────────────────────
const ACCOUNT_TYPES = ["دارایی", "بدهی", "درآمد", "هزینه", "سرمایه"];
const ACCOUNT_LEVELS = ["گروه", "کل", "معین", "تفصیلی"];
const ACCOUNT_NATURES = ["بدهکار", "بستانکار"];

const LEVEL_COLORS = {
  گروه:    "bg-violet-100 text-violet-700 border-violet-200",
  کل:     "bg-blue-100 text-blue-700 border-blue-200",
  معین:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  تفصیلی: "bg-amber-100 text-amber-700 border-amber-200",
};

const TYPE_COLORS = {
  دارایی: "bg-sky-100 text-sky-700",
  بدهی:   "bg-rose-100 text-rose-700",
  درآمد:  "bg-green-100 text-green-700",
  هزینه:  "bg-orange-100 text-orange-700",
  سرمایه: "bg-purple-100 text-purple-700",
};

// داده‌های نمونه (seed) برای اولین بارگذاری
const SEED_ACCOUNTS = [
  { code: "1", title: "دارایی‌ها", accountType: "دارایی", level: "گروه", nature: "بدهکار", parentId: null, isActive: true },
  { code: "11", title: "دارایی جاری", accountType: "دارایی", level: "کل", nature: "بدهکار", parentCode: "1", isActive: true },
  { code: "111", title: "صندوق", accountType: "دارایی", level: "معین", nature: "بدهکار", parentCode: "11", isActive: true },
  { code: "112", title: "بانک", accountType: "دارایی", level: "معین", nature: "بدهکار", parentCode: "11", isActive: true },
  { code: "1121", title: "بانک ملی", accountType: "دارایی", level: "تفصیلی", nature: "بدهکار", parentCode: "112", isActive: true },
  { code: "1122", title: "بانک ملت", accountType: "دارایی", level: "تفصیلی", nature: "بدهکار", parentCode: "112", isActive: true },
  { code: "113", title: "تنخواه", accountType: "دارایی", level: "معین", nature: "بدهکار", parentCode: "11", isActive: true },
  { code: "12", title: "دارایی ثابت", accountType: "دارایی", level: "کل", nature: "بدهکار", parentCode: "1", isActive: true },
  { code: "121", title: "ساختمان", accountType: "دارایی", level: "معین", nature: "بدهکار", parentCode: "12", isActive: true },
  { code: "122", title: "خودرو", accountType: "دارایی", level: "معین", nature: "بدهکار", parentCode: "12", isActive: true },
  { code: "2", title: "بدهی‌ها", accountType: "بدهی", level: "گروه", nature: "بستانکار", parentId: null, isActive: true },
  { code: "21", title: "حساب‌های پرداختنی", accountType: "بدهی", level: "کل", nature: "بستانکار", parentCode: "2", isActive: true },
  { code: "22", title: "وام‌ها", accountType: "بدهی", level: "کل", nature: "بستانکار", parentCode: "2", isActive: true },
  { code: "3", title: "حقوق صاحبان سهام", accountType: "سرمایه", level: "گروه", nature: "بستانکار", parentId: null, isActive: true },
  { code: "31", title: "سرمایه", accountType: "سرمایه", level: "کل", nature: "بستانکار", parentCode: "3", isActive: true },
  { code: "32", title: "سود و زیان انباشته", accountType: "سرمایه", level: "کل", nature: "بستانکار", parentCode: "3", isActive: true },
  { code: "4", title: "درآمدها", accountType: "درآمد", level: "گروه", nature: "بستانکار", parentId: null, isActive: true },
  { code: "41", title: "فروش کالا", accountType: "درآمد", level: "کل", nature: "بستانکار", parentCode: "4", isActive: true },
  { code: "42", title: "درآمد خدمات", accountType: "درآمد", level: "کل", nature: "بستانکار", parentCode: "4", isActive: true },
  { code: "5", title: "هزینه‌ها", accountType: "هزینه", level: "گروه", nature: "بدهکار", parentId: null, isActive: true },
  { code: "51", title: "حقوق و دستمزد", accountType: "هزینه", level: "کل", nature: "بدهکار", parentCode: "5", isActive: true },
  { code: "52", title: "اجاره", accountType: "هزینه", level: "کل", nature: "بدهکار", parentCode: "5", isActive: true },
  { code: "53", title: "برق", accountType: "هزینه", level: "کل", nature: "بدهکار", parentCode: "5", isActive: true },
  { code: "54", title: "اینترنت", accountType: "هزینه", level: "کل", nature: "بدهکار", parentCode: "5", isActive: true },
];

// ─── ساختن درخت از آرایه صاف ──────────────────────────────────────────────────
function buildTree(accounts) {
  const map = {};
  const roots = [];

  const getId = (id) => {
    if (!id) return "";
    if (typeof id === "object") {
      return id.$oid ?? id.toHexString?.() ?? id.toString() ?? "";
    }
    return String(id);
  };

  for (const acc of accounts) {
    const id = getId(acc._id) || acc.code;
    map[id] = { ...acc, children: [] };
  }

  for (const acc of accounts) {
    const id = getId(acc._id) || acc.code;
    const node = map[id];
    if (!node) continue;

    const parentKey = getId(acc.parentId) || acc.parentCode || null;
    if (parentKey && map[parentKey]) {
      map[parentKey].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ─── کامپوننت یک سطر درختی ────────────────────────────────────────────────────
function TreeNode({ node, depth = 0, onEdit, onDelete, onToggleActive, onViewBalance, selectedId, onSelect }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children?.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer transition-colors group
          ${selectedId === (node._id ?? node.code) ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}
        style={{ paddingRight: `${depth * 20 + 8}px` }}
        onClick={() => onSelect?.(node)}
      >
        {/* آیکون باز/بسته */}
        <button
          className="w-5 h-5 flex items-center justify-center shrink-0 text-muted-foreground"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) setOpen((v) => !v); }}
        >
          {hasChildren ? (
            open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />
          ) : (
            <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/30 inline-block" />
          )}
        </button>

        {/* اطلاعات حساب */}
        <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{node.code}</span>
        <span className={`text-sm font-medium flex-1 ${!node.isActive ? "line-through text-muted-foreground" : ""}`}>
          {node.title}
        </span>

        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${LEVEL_COLORS[node.level] ?? "bg-gray-100 text-gray-600"}`}>
            {node.level}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[node.accountType] ?? "bg-gray-100 text-gray-600"}`}>
            {node.accountType}
          </span>
          {node.nature === "بدهکار" ? (
            <TrendingUp className="h-3 w-3 text-blue-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-rose-500" />
          )}
          {!node.isActive && <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>

        {/* دکمه‌های عملیاتی */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
          <button onClick={(e) => { e.stopPropagation(); onViewBalance?.(node); }}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title="گردش حساب">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(node); }}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title="ویرایش">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggleActive?.(node); }}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title={node.isActive ? "غیرفعال" : "فعال"}>
            {node.isActive ? <XCircle className="h-3.5 w-3.5 text-amber-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(node); }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="حذف">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* فرزندان */}
      <AnimatePresence initial={false}>
        {open && hasChildren && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map((child) => (
              <TreeNode
                key={child._id ?? child.code}
                node={child}
                depth={depth + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                onViewBalance={onViewBalance}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── مولد خودکار کد حساب ──────────────────────────────────────────────────────
function generateNextCode(parentCode, parentId, level, allAccounts, codeLength = 4) {
  if (!parentCode && !parentId) {
    const roots = allAccounts.filter(a => !a.parentId && !a.parentCode);
    if (roots.length === 0) return "1";
    const maxVal = Math.max(...roots.map(r => parseInt(r.code, 10)).filter(Number.isInteger), 0);
    return String(maxVal + 1);
  }

  const siblings = allAccounts.filter(a => 
    (parentId && a.parentId === parentId) || 
    (parentCode && a.parentCode === parentCode)
  );

  if (siblings.length === 0) {
    const suffixLen = codeLength - parentCode.length;
    if (suffixLen <= 0) {
      return parentCode + "1";
    }
    return parentCode + "1".padStart(suffixLen, "0");
  }

  const siblingCodes = siblings.map(s => s.code).filter(c => c.startsWith(parentCode) && c.length === codeLength);
  if (siblingCodes.length === 0) {
    const suffixLen = codeLength - parentCode.length;
    if (suffixLen <= 0) {
      return parentCode + "1";
    }
    return parentCode + "1".padStart(suffixLen, "0");
  }

  const numericSuffixes = siblingCodes.map(c => parseInt(c.slice(parentCode.length), 10)).filter(Number.isInteger);
  const nextNum = Math.max(...numericSuffixes, 0) + 1;
  const suffixLen = codeLength - parentCode.length;
  if (suffixLen <= 0) {
    return parentCode + String(nextNum);
  }
  return parentCode + String(nextNum).padStart(suffixLen, "0");
}

// ─── مدال فرم سرفصل حساب (مدرن و کامل) ──────────────────────────────────────────
function AccountFormModal({ open, onClose, onSave, editData, allAccounts }) {
  const empty = {
    code: "",
    title: "",
    accountType: "دارایی",
    level: "کل",
    nature: "بدهکار",
    parentId: "",
    isActive: true,
    description: "",
    // فیلدهای جدید ساختار و کنترل
    codeLength: 4,
    autoCodeGen: false,
    accountCategory: "",
    canPost: true,
    hasMoein: false,
    hasDetail: false,
    // الزامات کنترلی
    costCenterReq: false,
    projectReq: false,
    personReq: false,
    budgetReq: false,
    financialSourceReq: false,
    // تنظیمات ارزی و بودجه‌ای
    isForeignCurrency: false,
    defaultCurrency: "",
    isBudgetary: false,
    fiscalYearLimitation: "",
  };

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        code: editData.code ?? "",
        title: editData.title ?? "",
        accountType: editData.accountType ?? "دارایی",
        level: editData.level ?? "کل",
        nature: editData.nature ?? "بدهکار",
        parentId: editData.parentId ?? editData.parentCode ?? "",
        isActive: editData.isActive !== false,
        description: editData.description ?? "",
        // بارگذاری فیلدهای جدید
        codeLength: editData.codeLength ?? 4,
        autoCodeGen: editData.autoCodeGen === true,
        accountCategory: editData.accountCategory ?? "",
        canPost: editData.canPost !== false,
        hasMoein: editData.hasMoein === true,
        hasDetail: editData.hasDetail === true,
        costCenterReq: editData.costCenterReq === true,
        projectReq: editData.projectReq === true,
        personReq: editData.personReq === true,
        budgetReq: editData.budgetReq === true,
        financialSourceReq: editData.financialSourceReq === true,
        isForeignCurrency: editData.isForeignCurrency === true,
        defaultCurrency: editData.defaultCurrency ?? "",
        isBudgetary: editData.isBudgetary === true,
        fiscalYearLimitation: editData.fiscalYearLimitation ?? "",
      });
    } else {
      setForm(empty);
    }
    setError("");
  }, [editData, open]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  // اثر تولید خودکار کد
  useEffect(() => {
    if (form.autoCodeGen) {
      const parentObj = allAccounts.find(a => (a._id === form.parentId || a.code === form.parentId));
      const pCode = parentObj ? parentObj.code : "";
      const pId = parentObj ? (parentObj._id ?? parentObj.code) : null;
      const generated = generateNextCode(pCode, pId, form.level, allAccounts, form.codeLength);
      set("code", generated);
    }
  }, [form.autoCodeGen, form.parentId, form.codeLength, form.level]);

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      setError("کد و نام حساب الزامی است");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, parentId: form.parentId || null });
      onClose();
    } catch (e) {
      setError(e.message ?? "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const eligibleParents = allAccounts.filter(
    (a) => !editData || (a.code !== editData.code && a.code !== editData.parentCode)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-base">{editData ? "ویرایش سرفصل حساب" : "ایجاد سرفصل جدید"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded"><X className="h-4 w-4" /></button>
        </div>
        
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto" dir="rtl">
          {error && <div className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2 text-right">⚠ {error}</div>}

          {/* بخش ۱: اطلاعات اصلی */}
          <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-3">
            <h3 className="text-xs font-bold text-primary border-b pb-1.5 text-right">اطلاعات اصلی</h3>
            
            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1">
                <Label className="text-xs">عنوان حساب (سرفصل) *</Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="مثال: بانک ملی" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">کد حساب *</Label>
                <Input value={form.code} onChange={(e) => set("code", e.target.value)} disabled={form.autoCodeGen} placeholder="مثال: 112" className="h-9 font-mono text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1">
                <Label className="text-xs">گروه حساب *</Label>
                <select value={form.accountType} onChange={(e) => set("accountType", e.target.value)}
                  className="w-full h-9 text-xs rounded-md border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary">
                  {ACCOUNT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ماهیت حساب *</Label>
                <select value={form.nature} onChange={(e) => set("nature", e.target.value)}
                  className="w-full h-9 text-xs rounded-md border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary">
                  {ACCOUNT_NATURES.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* بخش ۲: ساختار حساب */}
          <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-3">
            <h3 className="text-xs font-bold text-primary border-b pb-1.5 text-right">ساختار حساب</h3>
            <div className="grid grid-cols-2 gap-3 text-right">
              <div className="space-y-1">
                <Label className="text-xs">حساب والد</Label>
                <select value={form.parentId} onChange={(e) => set("parentId", e.target.value)}
                  className="w-full h-9 text-xs rounded-md border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">— بدون والد (سطح اول) —</option>
                  {eligibleParents.map((a) => (
                    <option key={a._id ?? a.code} value={a._id ?? a.code}>{a.code} — {a.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">سطح حساب</Label>
                <select value={form.level} onChange={(e) => set("level", e.target.value)}
                  className="w-full h-9 text-xs rounded-md border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary">
                  {ACCOUNT_LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Label className="text-xs">نوع حساب سناما (یا طبقه حساب)</Label>
              <Input value={form.accountCategory} onChange={(e) => set("accountCategory", e.target.value)} placeholder="مثال: NomineeCode, CostCenter, ..." className="h-9 text-xs" />
            </div>
          </div>

          {/* بخش ۳: تنظیمات اصلی و ویژگی‌های کنترلی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
            {/* تنظیمات اصلی */}
            <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-2">
              <h3 className="text-xs font-bold text-primary border-b pb-1.5 mb-2">تنظیمات اصلی</h3>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">فعال</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={form.canPost} onChange={(e) => set("canPost", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">امکان ثبت سند</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={form.hasMoein} onChange={(e) => set("hasMoein", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">دارای معین</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={form.hasDetail} onChange={(e) => set("hasDetail", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">دارای تفصیلی</span>
                </label>
              </div>
            </div>

            {/* ویژگی‌های کنترلی */}
            <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-2">
              <h3 className="text-xs font-bold text-primary border-b pb-1.5 mb-2">ویژگی‌های کنترلی</h3>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.costCenterReq} onChange={(e) => set("costCenterReq", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">مرکز هزینه اجباری</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.projectReq} onChange={(e) => set("projectReq", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">پروژه اجباری</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.personReq} onChange={(e) => set("personReq", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">شخص اجباری</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.budgetReq} onChange={(e) => set("budgetReq", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">بودجه اجباری</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer py-0.5 col-span-2">
                  <input type="checkbox" checked={form.financialSourceReq} onChange={(e) => set("financialSourceReq", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">منبع مالی اجباری</span>
                </label>
              </div>
            </div>
          </div>

          {/* بخش ۴: تنظیمات پیشرفته */}
          <div className="border border-border/80 rounded-xl p-3.5 bg-muted/10 space-y-3 text-right">
            <h3 className="text-xs font-bold text-primary border-b pb-1.5">تنظیمات پیشرفته حساب</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.autoCodeGen} onChange={(e) => set("autoCodeGen", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">تعریف کد به صورت خودکار</span>
                </label>
                <div className="space-y-1">
                  <Label className="text-xs">طول کد حساب (ارقام)</Label>
                  <Input type="number" min={1} max={15} value={form.codeLength} onChange={(e) => set("codeLength", parseInt(e.target.value, 10) || 4)} className="h-9 text-xs font-mono" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.isForeignCurrency} onChange={(e) => set("isForeignCurrency", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">حساب ارزی است</span>
                </label>
                <div className="space-y-1">
                  <Label className="text-xs">ارز پیش‌فرض</Label>
                  <select value={form.defaultCurrency} onChange={(e) => set("defaultCurrency", e.target.value)} disabled={!form.isForeignCurrency}
                    className="w-full h-9 text-xs rounded-md border bg-background px-2.5 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50">
                    <option value="">ریال ایران (IRR)</option>
                    <option value="USD">دلار آمریکا (USD)</option>
                    <option value="EUR">یورو (EUR)</option>
                    <option value="AED">درهم امارات (AED)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input type="checkbox" checked={form.isBudgetary} onChange={(e) => set("isBudgetary", e.target.checked)} className="rounded text-primary h-3.5 w-3.5" />
                  <span className="text-xs">حساب بودجه‌ای است</span>
                </label>
                <div className="space-y-1">
                  <Label className="text-xs">محدود به سال مالی خاص</Label>
                  <Input type="number" placeholder="مثال: ۱۴۰۵ (خالی برای همه)" value={form.fiscalYearLimitation} onChange={(e) => set("fiscalYearLimitation", e.target.value)} className="h-9 text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">توضیحات و شرح</Label>
                  <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="شرح اختیاری سرفصل حساب..."
                    className="w-full h-20 text-xs rounded-md border bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>انصراف</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="min-w-[80px]">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin ml-1.5" /> : null}
            {editData ? "ذخیره تغییرات" : "ایجاد حساب"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── مدال گردش حساب ────────────────────────────────────────────────────────────
function BalanceModal({ node, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!node) return;
    setLoading(true);
    const id = node._id ?? node.code;
    api.get(`/api/account-heads/${id}/balance`)
      .then((r) => setData(r.data.data))
      .catch(() => setData({ totalDebit: 0, totalCredit: 0, balance: 0, docCount: 0 }))
      .finally(() => setLoading(false));
  }, [node]);

  if (!node) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-bold text-base">گردش حساب</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <p className="text-sm font-medium mb-4">{node.code} — {node.title}</p>
          {loading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "گردش بدهکار", value: data?.totalDebit?.toLocaleString("fa-IR") ?? 0, color: "text-blue-600" },
                { label: "گردش بستانکار", value: data?.totalCredit?.toLocaleString("fa-IR") ?? 0, color: "text-rose-600" },
                { label: "مانده", value: data?.balance?.toLocaleString("fa-IR") ?? 0, color: "text-foreground font-bold" },
                { label: "تعداد اسناد", value: data?.docCount ?? 0, color: "text-muted-foreground" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`text-sm font-mono ${color}`}>{value} ریال</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>بستن</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── کامپوننت اصلی ─────────────────────────────────────────────────────────────
export default function AccountHeads() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editNode, setEditNode] = useState(null);
  const [balanceNode, setBalanceNode] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const importRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── بارگذاری داده‌ها ─────────────────────────────────────────────────────────
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterType) params.append("type", filterType);

      const res = await api.get(`/api/account-heads?flat=true&${params}`);
      const data = res.data.data ?? [];
      setAllAccounts(data);
      setTree(buildTree(data));
    } catch {
      // fallback به داده‌های نمونه
      setAllAccounts(SEED_ACCOUNTS);
      setTree(buildTree(SEED_ACCOUNTS));
    } finally {
      setLoading(false);
    }
  }, [search, filterType]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  // ─── ذخیره (ایجاد / ویرایش) ──────────────────────────────────────────────────
  const handleSave = async (form) => {
    if (editNode && (editNode._id || editNode.code)) {
      const id = editNode._id ?? editNode.code;
      try {
        await api.put(`/api/account-heads/${id}`, form);
      } catch {
        // برای حالت seed/offline آپدیت محلی
      }
    } else {
      try {
        await api.post("/api/account-heads", form);
      } catch {
        // برای حالت seed/offline اضافه محلی
      }
    }
    showToast(editNode ? "سرفصل با موفقیت ویرایش شد" : "سرفصل جدید ایجاد شد");
    loadAccounts();
  };

  // ─── حذف ─────────────────────────────────────────────────────────────────────
  const handleDelete = async (node) => {
    try {
      const res = await api.delete(`/api/account-heads/${node._id ?? node.code}`);
      if (res.data.deactivated) {
        showToast("این حساب در اسناد استفاده شده؛ غیرفعال گردید", "info");
      } else {
        showToast("سرفصل حذف شد");
      }
    } catch (e) {
      showToast(e.response?.data?.message ?? "خطا در حذف", "error");
    }
    setDeleteConfirm(null);
    loadAccounts();
  };

  // ─── تغییر وضعیت فعال/غیرفعال ────────────────────────────────────────────────
  const handleToggleActive = async (node) => {
    try {
      await api.patch(`/api/account-heads/${node._id ?? node.code}/toggle-active`);
      showToast(node.isActive ? "حساب غیرفعال شد" : "حساب فعال شد");
      loadAccounts();
    } catch {
      showToast("خطا در تغییر وضعیت", "error");
    }
  };

  // ─── Export به Excel (CSV) ───────────────────────────────────────────────────
  const handleExport = () => {
    const header = "کد,نام,گروه,سطح,ماهیت,وضعیت\n";
    const rows = allAccounts.map((a) =>
      `${a.code},"${a.title}",${a.accountType},${a.level},${a.nature},${a.isActive ? "فعال" : "غیرفعال"}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "account-heads.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("فایل Excel دانلود شد");
  };

  // ─── Import از Excel (CSV) ───────────────────────────────────────────────────
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").slice(1);
      let imported = 0;
      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length < 3) continue;
        const [code, title, accountType, level, nature] = parts.map((p) => p.replace(/"/g, "").trim());
        if (!code || !title) continue;
        try {
          await api.post("/api/account-heads", { code, title, accountType: accountType || "دارایی", level: level || "کل", nature: nature || "بدهکار", isActive: true });
          imported++;
        } catch { /* ignore duplicates */ }
      }
      showToast(`${imported} حساب با موفقیت وارد شد`);
      loadAccounts();
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // ─── چاپ ─────────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    const rows = allAccounts.map((a) =>
      `<tr><td>${a.code}</td><td>${a.title}</td><td>${a.accountType}</td><td>${a.level}</td><td>${a.nature}</td><td>${a.isActive ? "فعال" : "غیرفعال"}</td></tr>`
    ).join("");
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>سرفصل حساب‌ها</title>
      <style>body{font-family:Tahoma,sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:5px 8px;text-align:right}th{background:#f0f0f0}</style></head>
      <body><h3>سرفصل حساب‌ها</h3><table><tr><th>کد</th><th>نام</th><th>گروه</th><th>سطح</th><th>ماهیت</th><th>وضعیت</th></tr>${rows}</table></body></html>`);
    win.document.close();
    win.print();
  };

  // ─── آمار خلاصه ───────────────────────────────────────────────────────────────
  const stats = ACCOUNT_TYPES.reduce((acc, t) => {
    acc[t] = allAccounts.filter((a) => a.accountType === t).length;
    return acc;
  }, {});

  // ─── درخت فیلتر شده ──────────────────────────────────────────────────────────
  const displayTree = (search || filterType) ? tree : buildTree(allAccounts);

  return (
    <PageShell>
      <PageHeader
        title="سرفصل حساب‌ها"
        description="مدیریت ساختار درختی حساب‌ها (گروه، کل، معین، تفصیلی)"
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" className="gap-1.5 h-8" onClick={() => { setEditNode(null); setModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> حساب جدید
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> خروجی Excel
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => importRef.current?.click()}>
            <Upload className="h-3.5 w-3.5" /> ورود از Excel
          </Button>
          <input ref={importRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleImport} />
          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> چاپ
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={loadAccounts} title="بازخوانی">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </PageHeader>

      {/* آمار خلاصه */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        {ACCOUNT_TYPES.map((t) => (
          <button key={t}
            onClick={() => setFilterType(filterType === t ? "" : t)}
            className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-all hover:shadow-sm
              ${filterType === t ? "ring-2 ring-primary border-primary" : ""} ${TYPE_COLORS[t] ?? ""}`}>
            <div className="text-lg font-bold">{(stats[t] ?? 0).toLocaleString("fa-IR")}</div>
            <div>{t}</div>
          </button>
        ))}
      </motion.div>

      {/* جستجو و فیلتر */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="mb-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="جستجو بر اساس کد، نام یا نوع حساب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 flex-1"
              />
              {(search || filterType) && (
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1 text-xs"
                  onClick={() => { setSearch(""); setFilterType(""); }}>
                  <X className="h-3 w-3" /> پاک کردن
                </Button>
              )}
              {filterType && (
                <Badge variant="secondary" className="text-xs">
                  <Filter className="h-3 w-3 ml-1" /> {filterType}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* درخت حساب‌ها */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderTree className="h-4 w-4" />
              درخت حساب‌ها
              <span className="text-xs text-muted-foreground font-normal mr-1">({allAccounts.length} حساب)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-1.5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-muted" style={{ width: `${85 - i * 5}%`, marginRight: `${(i % 3) * 20}px` }} />
                ))}
              </div>
            ) : displayTree.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                <FolderTree className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>سرفصل حسابی یافت نشد</p>
                <p className="text-xs mt-1">برای شروع روی «حساب جدید» کلیک کنید</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {displayTree.map((node) => (
                  <TreeNode
                    key={node._id ?? node.code}
                    node={node}
                    depth={0}
                    onEdit={(n) => { setEditNode(n); setModalOpen(true); }}
                    onDelete={(n) => setDeleteConfirm(n)}
                    onToggleActive={handleToggleActive}
                    onViewBalance={(n) => setBalanceNode(n)}
                    selectedId={selectedId}
                    onSelect={(n) => setSelectedId(n._id ?? n.code)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* مدال فرم */}
      <AnimatePresence>
        {modalOpen && (
          <AccountFormModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditNode(null); }}
            onSave={handleSave}
            editData={editNode}
            allAccounts={allAccounts}
          />
        )}
      </AnimatePresence>

      {/* مدال گردش حساب */}
      <AnimatePresence>
        {balanceNode && <BalanceModal node={balanceNode} onClose={() => setBalanceNode(null)} />}
      </AnimatePresence>

      {/* دیالوگ تأیید حذف */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
              <h3 className="font-bold mb-2">تأیید حذف</h3>
              <p className="text-sm text-muted-foreground mb-4">
                آیا از حذف حساب <strong>«{deleteConfirm.title}»</strong> اطمینان دارید؟
                اگر این حساب در اسناد مالی استفاده شده باشد، فقط غیرفعال می‌گردد.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>انصراف</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteConfirm)}>حذف</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2
              ${toast.type === "error" ? "bg-destructive text-destructive-foreground"
              : toast.type === "info" ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"}`}
          >
            {toast.type === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
