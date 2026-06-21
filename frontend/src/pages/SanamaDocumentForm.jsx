import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Save, FileCheck, AlertCircle, ChevronDown, ChevronUp,
  Info, Eye, EyeOff, CheckCircle2, XCircle,
} from "lucide-react";
import {
  SANAMA_TAGS, TAG_GROUPS, ACC_TAG_MATRIX, CONDITIONAL_RULES, ACCOUNT_PROFILES,
} from "@/data/sanamaConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRequiredTags(accCode) {
  const entry = ACC_TAG_MATRIX[accCode];
  return entry ? entry.tags : [];
}

function getAccountSeries(accCode) {
  if (!accCode) return null;
  return accCode[0] + "00";
}

function evaluateConditions(formValues, requiredTags) {
  const extraShow = new Set();
  const extraRequire = new Set();

  CONDITIONAL_RULES.forEach((rule) => {
    const { when, then } = rule;
    const fieldVal = formValues[when.field];
    let matched = false;

    if (when.value && fieldVal === when.value) matched = true;
    if (when.notEqual && fieldVal && fieldVal !== when.notEqual) matched = true;
    if (when.notEmpty && fieldVal && fieldVal.trim() !== "") matched = true;

    if (matched) {
      (then.show || []).forEach((k) => extraShow.add(k));
      (then.require || []).forEach((k) => extraRequire.add(k));
    }
  });

  return { extraShow, extraRequire };
}

// ─── Tag Field Renderer ───────────────────────────────────────────────────────
function TagField({ tag, value, onChange, required, error }) {
  const baseClass = `h-9 text-sm ${error ? "border-destructive ring-1 ring-destructive/30" : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-1.5">
        <Label className="text-xs font-medium">
          {tag.label}
          {required && <span className="text-destructive mr-0.5">*</span>}
        </Label>
        {tag.tooltip && (
          <span className="group relative">
            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
            <span className="absolute bottom-full right-0 mb-1 hidden w-48 rounded-lg bg-popover p-2 text-[10px] text-popover-foreground shadow-lg border group-hover:block z-50">
              {tag.tooltip}
            </span>
          </span>
        )}
      </div>

      {tag.type === "dropdown" && (
        <select
          value={value || ""}
          onChange={(e) => onChange(tag.key, e.target.value)}
          className={`w-full rounded-lg border bg-background px-3 ${baseClass}`}
        >
          <option value="">انتخاب کنید...</option>
          {tag.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {tag.type === "input" && (
        <Input
          value={value || ""}
          onChange={(e) => onChange(tag.key, e.target.value)}
          maxLength={tag.maxLength}
          placeholder={tag.tooltip}
          className={baseClass}
        />
      )}

      {tag.type === "number" && (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(tag.key, e.target.value)}
          placeholder={tag.tooltip}
          className={baseClass}
        />
      )}

      {tag.type === "date" && (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(tag.key, e.target.value)}
          className={baseClass}
        />
      )}

      {tag.type === "textarea" && (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(tag.key, e.target.value)}
          placeholder={tag.tooltip}
          rows={2}
          className={`w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none ${error ? "border-destructive ring-1 ring-destructive/30" : ""}`}
        />
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] text-destructive flex items-center gap-1"
        >
          <XCircle className="h-3 w-3" />
          {tag.label} الزامی است
        </motion.p>
      )}
    </motion.div>
  );
}

// ─── Tag Group Section ────────────────────────────────────────────────────────
function TagGroupSection({ group, tags, values, onChange, errors, requiredKeys }) {
  const [collapsed, setCollapsed] = useState(false);
  const requiredCount = tags.filter((t) => requiredKeys.has(t.key)).length;

  const groupColors = {
    emerald: "border-emerald-200 bg-emerald-50/30",
    blue: "border-blue-200 bg-blue-50/30",
    purple: "border-purple-200 bg-purple-50/30",
    yellow: "border-yellow-200 bg-yellow-50/30",
    orange: "border-orange-200 bg-orange-50/30",
    red: "border-red-200 bg-red-50/30",
    slate: "border-slate-200 bg-slate-50/30",
    amber: "border-amber-200 bg-amber-50/30",
    gray: "border-gray-200 bg-gray-50/30",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${groupColors[group.color] || "bg-muted/20"}`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between text-right"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{group.label}</span>
          <Badge variant="secondary" className="text-[10px]">
            {tags.length} فیلد
          </Badge>
          {requiredCount > 0 && (
            <Badge className="text-[10px] bg-destructive/10 text-destructive border-0">
              {requiredCount} الزامی
            </Badge>
          )}
        </div>
        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <TagField
                  key={tag.key}
                  tag={tag}
                  value={values[tag.key]}
                  onChange={onChange}
                  required={requiredKeys.has(tag.key)}
                  error={errors.has(tag.key)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Journal Item Row ─────────────────────────────────────────────────────────
function JournalItemRow({ item, index, onUpdate, onRemove, onSelectForTags }) {
  const accOptions = Object.entries(ACC_TAG_MATRIX).map(([code, data]) => ({
    code,
    label: data.label,
  }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        item.selected ? "ring-2 ring-primary/40 bg-primary/5" : "bg-muted/20 hover:bg-muted/40"
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
        {index + 1}
      </span>

      <div className="flex-1 grid grid-cols-1 gap-2 sm:grid-cols-4">
        <select
          value={item.accCode || ""}
          onChange={(e) => onUpdate(index, "accCode", e.target.value)}
          className="rounded-lg border bg-background px-2 h-9 text-sm sm:col-span-2"
        >
          <option value="">انتخاب حساب معین...</option>
          {accOptions.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.code} - {opt.label}
            </option>
          ))}
        </select>

        <Input
          type="number"
          placeholder="بدهکار"
          value={item.debit || ""}
          onChange={(e) => onUpdate(index, "debit", e.target.value)}
          className="h-9 text-sm"
        />

        <Input
          type="number"
          placeholder="بستانکار"
          value={item.credit || ""}
          onChange={(e) => onUpdate(index, "credit", e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      <div className="flex gap-1 shrink-0">
        {item.accCode && (
          <Button
            size="sm"
            variant={item.selected ? "default" : "outline"}
            className="h-8 w-8 p-0"
            onClick={() => onSelectForTags(index)}
            title="تنظیم تگ‌های سناما"
          >
            <FileCheck className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SanamaDocumentForm() {
  const [searchParams] = useSearchParams();
  const initialAcc = searchParams.get("acc") || "";

  // بخش ۱: اطلاعات پایه
  const [docInfo, setDocInfo] = useState({ date: "", description: "", month: "", year: "" });

  // بخش ۲: آیتم‌های سند
  const [items, setItems] = useState([
    { accCode: initialAcc, debit: "", credit: "", selected: !!initialAcc, tagValues: {} },
  ]);
  const [activeItemIndex, setActiveItemIndex] = useState(initialAcc ? 0 : null);

  // بخش ۳: حالت پیشرفته
  const [expertMode, setExpertMode] = useState(false);

  // Validation
  const [errors, setErrors] = useState(new Set());
  const [formSubmitted, setFormSubmitted] = useState(false);

  // ─── Computed values ────────────────────────────────────────────
  const activeItem = activeItemIndex !== null ? items[activeItemIndex] : null;
  const activeAccCode = activeItem?.accCode || "";
  const requiredTagKeys = useMemo(() => new Set(getRequiredTags(activeAccCode)), [activeAccCode]);
  const accountSeries = getAccountSeries(activeAccCode);
  const profile = accountSeries ? ACCOUNT_PROFILES[accountSeries] : null;

  const tagValues = activeItem?.tagValues || {};
  const { extraShow, extraRequire } = useMemo(
    () => evaluateConditions(tagValues, requiredTagKeys),
    [tagValues, requiredTagKeys]
  );

  const allRequiredKeys = useMemo(() => {
    const s = new Set(requiredTagKeys);
    extraRequire.forEach((k) => s.add(k));
    return s;
  }, [requiredTagKeys, extraRequire]);

  const visibleTags = useMemo(() => {
    if (expertMode) return SANAMA_TAGS;
    if (!activeAccCode) return [];

    const visibleKeys = new Set([...requiredTagKeys, ...extraShow]);
    return SANAMA_TAGS.filter((t) => visibleKeys.has(t.key));
  }, [activeAccCode, requiredTagKeys, extraShow, expertMode]);

  const groupedTags = useMemo(() => {
    const grouped = {};
    visibleTags.forEach((tag) => {
      if (!grouped[tag.group]) grouped[tag.group] = [];
      grouped[tag.group].push(tag);
    });

    // فیلتر بر اساس پروفایل
    if (profile && !expertMode) {
      const hidden = new Set(profile.hideGroups || []);
      Object.keys(grouped).forEach((key) => {
        if (hidden.has(key) && !grouped[key].some((t) => allRequiredKeys.has(t.key))) {
          delete grouped[key];
        }
      });
    }

    return grouped;
  }, [visibleTags, profile, expertMode, allRequiredKeys]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleTagChange = useCallback((key, value) => {
    setItems((prev) => {
      const updated = [...prev];
      if (activeItemIndex !== null) {
        updated[activeItemIndex] = {
          ...updated[activeItemIndex],
          tagValues: { ...updated[activeItemIndex].tagValues, [key]: value },
        };
      }
      return updated;
    });
    setErrors((prev) => { const n = new Set(prev); n.delete(key); return n; });
  }, [activeItemIndex]);

  function addItem() {
    setItems((prev) => [...prev, { accCode: "", debit: "", credit: "", selected: false, tagValues: {} }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    if (activeItemIndex === index) setActiveItemIndex(null);
    else if (activeItemIndex > index) setActiveItemIndex(activeItemIndex - 1);
  }

  function updateItem(index, field, value) {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "accCode") updated[index].tagValues = {};
      return updated;
    });
  }

  function selectForTags(index) {
    setItems((prev) => prev.map((item, i) => ({ ...item, selected: i === index })));
    setActiveItemIndex(index);
    setErrors(new Set());
  }

  function validateForm() {
    const errs = new Set();

    if (!docInfo.date) errs.add("doc-date");
    if (!docInfo.description) errs.add("doc-desc");

    if (activeItem && activeAccCode) {
      allRequiredKeys.forEach((key) => {
        const val = activeItem.tagValues[key];
        if (!val || val.trim() === "") errs.add(key);
      });
    }

    setErrors(errs);
    setFormSubmitted(true);
    return errs.size === 0;
  }

  function handleSave(draft = false) {
    if (!draft && !validateForm()) return;
    // TODO: ارسال به سرور
    alert(draft ? "پیش‌نویس ذخیره شد" : "سند با موفقیت ثبت شد");
  }

  // ─── Balance check ─────────────────────────────────────────────
  const totalDebit = items.reduce((sum, i) => sum + (parseFloat(i.debit) || 0), 0);
  const totalCredit = items.reduce((sum, i) => sum + (parseFloat(i.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  return (
    <PageShell>
      <PageHeader title="ثبت سند مالی (سناما)" description="فرم داینامیک بر اساس الزامات اطلاعاتی سناما">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setExpertMode(!expertMode)}>
            {expertMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {expertMode ? "حالت ساده" : "حالت پیشرفته"}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleSave(true)}>
            <Save className="h-3.5 w-3.5" />
            ذخیره پیش‌نویس
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => handleSave(false)}>
            <FileCheck className="h-3.5 w-3.5" />
            ثبت نهایی
          </Button>
        </div>
      </PageHeader>

      {/* ═══════ بخش ۱: اطلاعات پایه سند ═══════ */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">۱</Badge>
              اطلاعات پایه سند
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">تاریخ سند <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={docInfo.date}
                  onChange={(e) => setDocInfo({ ...docInfo, date: e.target.value })}
                  className={`h-9 text-sm ${formSubmitted && !docInfo.date ? "border-destructive" : ""}`}
                />
                {formSubmitted && !docInfo.date && (
                  <p className="text-[11px] text-destructive">تاریخ الزامی است</p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">شرح سند <span className="text-destructive">*</span></Label>
                <Input
                  value={docInfo.description}
                  onChange={(e) => setDocInfo({ ...docInfo, description: e.target.value })}
                  placeholder="شرح سند مالی..."
                  className={`h-9 text-sm ${formSubmitted && !docInfo.description ? "border-destructive" : ""}`}
                />
                {formSubmitted && !docInfo.description && (
                  <p className="text-[11px] text-destructive">شرح سند الزامی است</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">سال مالی</Label>
                <Input
                  value={docInfo.year}
                  onChange={(e) => setDocInfo({ ...docInfo, year: e.target.value })}
                  placeholder="۱۴۰۳"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════ بخش ۲: آیتم‌های سند ═══════ */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">۲</Badge>
                آیتم‌های سند (ردیف‌ها)
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 text-xs ${isBalanced ? "text-emerald-600" : "text-amber-600"}`}>
                  {isBalanced ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  <span>بدهکار: {totalDebit.toLocaleString()}</span>
                  <span>|</span>
                  <span>بستانکار: {totalCredit.toLocaleString()}</span>
                </div>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" />
                  ردیف جدید
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item, i) => (
                  <JournalItemRow
                    key={i}
                    item={item}
                    index={i}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onSelectForTags={selectForTags}
                  />
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══════ بخش ۳: فرم داینامیک تگ‌های سناما ═══════ */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">۳</Badge>
                  تگ‌های سناما
                  {activeAccCode && (
                    <Badge variant="outline" className="text-[10px] mr-2">
                      حساب {activeAccCode} - {ACC_TAG_MATRIX[activeAccCode]?.label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {activeAccCode
                    ? `${allRequiredKeys.size} فیلد الزامی برای این حساب`
                    : "ابتدا یک ردیف با حساب معین انتخاب و دکمه تنظیم تگ را بزنید"}
                </CardDescription>
              </div>
              {profile && (
                <Badge className="text-[10px]" variant="secondary">
                  پروفایل: {profile.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!activeAccCode ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <AlertCircle className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">حساب معین انتخاب نشده است</p>
                <p className="text-xs mt-1">از بخش ردیف‌ها، حساب معین را انتخاب کرده و دکمه تنظیم تگ را بزنید</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {TAG_GROUPS.filter((g) => groupedTags[g.key]).map((group) => (
                    <TagGroupSection
                      key={group.key}
                      group={group}
                      tags={groupedTags[group.key]}
                      values={tagValues}
                      onChange={handleTagChange}
                      errors={errors}
                      requiredKeys={allRequiredKeys}
                    />
                  ))}
                </AnimatePresence>

                {Object.keys(groupedTags).length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    هیچ تگی برای این حساب تعریف نشده است
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageShell>
  );
}
