import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, FileText, CheckCircle2, Clock, Printer, AlertTriangle } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { useInventory } from "@/context/InventoryContext";
import { cn } from "@/lib/utils";

const ISSUE_REASONS = [
  { value: "consumption", label: "مصرف داخلی" },
  { value: "transfer", label: "انتقال بین انبارها" },
  { value: "scrap", label: "اسقاط" },
  { value: "other", label: "سایر" }
];

const STATUS_STYLE = {
  draft: { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 }
};

const EMPLOYEES = [
  { value: "سعید کریمی (واحد امور اداری)", label: "سعید کریمی (واحد امور اداری)" },
  { value: "مریم احمدی (واحد فناوری اطلاعات)", label: "مریم احمدی (واحد فناوری اطلاعات)" },
  { value: "حمید علوی (بخش حسابداری)", label: "حمید علوی (بخش حسابداری)" },
  { value: "امیر قاسمی (واحد پشتیبانی)", label: "امیر قاسمی (واحد پشتیبانی)" }
];

const ORG_UNITS = [
  { value: "امور اداری", label: "امور اداری" },
  { value: "فناوری اطلاعات", label: "فناوری اطلاعات" },
  { value: "حسابداری", label: "حسابداری" },
  { value: "پشتیبانی", label: "پشتیبانی" }
];

const COST_CENTERS = [
  { value: "ستاد مرکزی", label: "ستاد مرکزی" },
  { value: "دفتر غرب", label: "دفتر غرب" },
  { value: "دفتر شرق", label: "دفتر شرق" }
];

const LOCATIONS = [
  { value: "اتاق اداری - طبقه ۱", label: "اتاق اداری - طبقه ۱" },
  { value: "بخش مالی - طبقه ۲", label: "بخش مالی - طبقه ۲" },
  { value: "اتاق سرور - طبقه ۳", label: "اتاق سرور - طبقه ۳" },
  { value: "انبار مصرفی - همکف", label: "انبار مصرفی - همکف" }
];

const INITIAL_ITEM = {
  assetCode: "",
  assetName: "",
  currentStock: 0,
  quantityRequested: "",
  quantityApproved: "",
  serialNo: "",
  consumptionLocation: "اتاق اداری - طبقه ۱"
};

const INITIAL_FORM = {
  issueNo: "",
  issueDate: "",
  warehouseId: "WH-001",
  receiverName: "",
  orgUnit: "",
  costCenter: "",
  reason: "consumption",
  status: "draft",
  notes: "",
  items: []
};

export default function AssetWarehouseIssue() {
  const {
    issues,
    warehouses,
    consumables,
    addIssue,
    updateIssue,
    deleteIssue,
    getSingleItemBalance
  } = useInventory();

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentItem, setCurrentItem] = useState(INITIAL_ITEM);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Generate Auto Number
  const generateAutoNo = () => {
    const nextNum = issues.length + 2001;
    return `ISS-${nextNum}`;
  };

  // Start a new issue
  const handleNew = () => {
    setForm({
      ...INITIAL_FORM,
      issueNo: generateAutoNo(),
      issueDate: "1404/07/10"
    });
    setSelectedIssueId(null);
    setCurrentItem(INITIAL_ITEM);
    setErrorMessage("");
  };

  // Triggered when item is changed in the item grid entry form
  const handleItemSelect = (code) => {
    const item = consumables.find(c => c.code === code);
    if (!item) return;

    // Get current stock balance from context helper
    const bal = getSingleItemBalance(code, form.warehouseId);
    setCurrentItem(prev => ({
      ...prev,
      assetCode: code,
      assetName: item.name,
      currentStock: bal.currentQty
    }));
    setErrorMessage("");
  };

  // Add item from temp form to the items grid
  const handleAddItemToGrid = () => {
    if (!currentItem.assetCode || !currentItem.quantityRequested || !currentItem.quantityApproved) return;

    const requested = Number(currentItem.quantityRequested);
    const approved = Number(currentItem.quantityApproved);

    // Stock validation check: موجودی >= مقدار خروج
    if (currentItem.currentStock < approved) {
      setErrorMessage(`خطا: موجودی کافی نیست! موجودی انبار ${currentItem.currentStock} بسته/عدد می‌باشد.`);
      return;
    }

    setForm(f => ({
      ...f,
      items: [...f.items, { ...currentItem, quantityRequested: requested, quantityApproved: approved }]
    }));
    setCurrentItem(INITIAL_ITEM);
    setErrorMessage("");
  };

  // Remove item from the grid
  const handleRemoveItemFromGrid = (index) => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== index)
    }));
  };

  // Save Draft (Temporary Save)
  const handleSaveDraft = () => {
    if (!form.issueNo || form.items.length === 0) return;
    const payload = { ...form, status: "draft" };
    if (selectedIssueId) {
      updateIssue(payload);
    } else {
      payload.id = form.issueNo;
      addIssue(payload);
      setSelectedIssueId(payload.id);
    }
  };

  // Confirm Issue (Verifies stock again and sets confirmed, decreasing stock)
  const handleConfirm = () => {
    if (!form.issueNo || form.items.length === 0) return;

    // Double check stock validation for all items
    for (const row of form.items) {
      // Get fresh stock balance (excluding this issue itself if it was already saved as draft)
      // Note: getSingleItemBalance includes confirmed ones. If this issue is draft, it does not reduce confirmed stock yet.
      const bal = getSingleItemBalance(row.assetCode, form.warehouseId);
      if (bal.currentQty < row.quantityApproved) {
        setErrorMessage(`خطا در تایید حواله: موجودی کالا [${row.assetName}] کافی نیست. موجودی فعلی: ${bal.currentQty}`);
        return;
      }
    }

    const payload = { ...form, status: "confirmed" };
    if (selectedIssueId) {
      updateIssue(payload);
    } else {
      payload.id = form.issueNo;
      addIssue(payload);
      setSelectedIssueId(payload.id);
    }
    setForm(payload); // update UI
    setErrorMessage("");
  };

  // Delete whole issue
  const handleDeleteIssue = () => {
    if (!selectedIssueId) return;
    deleteIssue(selectedIssueId);
    handleNew();
  };

  // Load an issue when clicked in the list
  const handleRowClick = (issue) => {
    setForm(issue);
    setSelectedIssueId(issue.id);
    setErrorMessage("");
  };

  // Filtered list of issues
  const filteredIssues = issues.filter(i =>
    i.issueNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.receiverName && i.receiverName.includes(searchQuery))
  );

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 hover:underline cursor-pointer">انبار و موجودی</span>
        <span>/</span>
        <span className="text-foreground">حواله انبار</span>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveDraft}
            disabled={form.items.length === 0 || form.status === "confirmed"}
            className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-sm"
          >
            <Save className="h-4 w-4" /> ذخیره موقت
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={form.items.length === 0 || form.status === "confirmed"}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" /> تایید حواله و کاهش موجودی
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={form.items.length === 0}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4 text-gray-500" /> چاپ حواله
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" /> جدید
          </Button>
          {selectedIssueId && form.status !== "confirmed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteIssue}
              className="gap-1.5 text-destructive border-red-200 hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-800">حواله خروج انبار</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت خروج اموال مصرفی و تحویل به شخص یا واحد</p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2" dir="rtl">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 animate-bounce" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
        {/* راست: فرم اطلاعات حواله */}
        <div className="lg:col-span-2 space-y-6">
          {/* بخش اول: اطلاعات سربرگ */}
          <Card className="shadow-sm border-slate-100">
            <CardContent className="pt-6">
              <h2 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-dashed border-slate-200">اطلاعات سربرگ</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">شماره حواله</Label>
                  <Input
                    value={form.issueNo}
                    onChange={(e) => setForm({ ...form, issueNo: e.target.value })}
                    disabled={form.status === "confirmed"}
                    className="h-9 font-mono text-left"
                    dir="ltr"
                    placeholder="Auto generated"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">تاریخ خروج</Label>
                  <PersianDatePicker
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e?.target?.value || e })}
                    disabled={form.status === "confirmed"}
                    className="h-9"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">انبار مبدا</Label>
                  <SearchableSelect
                    value={form.warehouseId}
                    onChange={(val) => setForm({ ...form, warehouseId: val })}
                    options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                    disabled={form.status === "confirmed"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">تحویل گیرنده</Label>
                  <SearchableSelect
                    value={form.receiverName}
                    onChange={(val) => setForm({ ...form, receiverName: val })}
                    options={EMPLOYEES}
                    disabled={form.status === "confirmed"}
                    placeholder="انتخاب پرسنل تحویل‌گیرنده"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">واحد سازمانی</Label>
                  <SearchableSelect
                    value={form.orgUnit}
                    onChange={(val) => setForm({ ...form, orgUnit: val })}
                    options={ORG_UNITS}
                    disabled={form.status === "confirmed"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">مرکز هزینه</Label>
                  <SearchableSelect
                    value={form.costCenter}
                    onChange={(val) => setForm({ ...form, costCenter: val })}
                    options={COST_CENTERS}
                    disabled={form.status === "confirmed"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">علت خروج</Label>
                  <SearchableSelect
                    value={form.reason}
                    onChange={(val) => setForm({ ...form, reason: val })}
                    options={ISSUE_REASONS}
                    disabled={form.status === "confirmed"}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-slate-600">توضیحات حواله</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    disabled={form.status === "confirmed"}
                    className="h-9"
                    placeholder="شرح و توضیحات خروج کالا..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بخش دوم: افزودن اقلام به گرید */}
          {form.status !== "confirmed" && (
            <Card className="shadow-sm border-slate-100">
              <CardContent className="pt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-dashed border-slate-200">ثبت اقلام خروجی حواله</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600">انتخاب کالا</Label>
                    <SearchableSelect
                      value={currentItem.assetCode}
                      onChange={handleItemSelect}
                      options={consumables.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
                      placeholder="جستجو و انتخاب کالا..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">موجودی فعلی انبار</Label>
                    <Input
                      readOnly
                      value={currentItem.currentStock}
                      className="h-9 bg-slate-50 font-bold font-mono text-blue-700"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">مقدار درخواست</Label>
                    <Input
                      type="number"
                      value={currentItem.quantityRequested}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantityRequested: e.target.value })}
                      placeholder="مقدار درخواستی"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">مقدار تایید شده</Label>
                    <Input
                      type="number"
                      value={currentItem.quantityApproved}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantityApproved: e.target.value })}
                      placeholder="مقدار خروجی تایید شده"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">شماره سریال</Label>
                    <Input
                      value={currentItem.serialNo}
                      onChange={(e) => setCurrentItem({ ...currentItem, serialNo: e.target.value })}
                      placeholder="سریال قطعه"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">محل مصرف کالا</Label>
                    <SearchableSelect
                      value={currentItem.consumptionLocation}
                      onChange={(val) => setCurrentItem({ ...currentItem, consumptionLocation: val })}
                      options={LOCATIONS}
                    />
                  </div>

                  <Button
                    onClick={handleAddItemToGrid}
                    disabled={!currentItem.assetCode || !currentItem.quantityApproved}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-9 gap-1"
                  >
                    <Plus className="h-4 w-4" /> افزودن
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* بخش سوم: جدول اقلام حواله */}
          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">ردیف‌های حواله خروج</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  تعداد اقلام: {form.items.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800 text-white font-bold hover:bg-slate-800">
                      <TableHead className="text-right text-xs font-bold text-white">کد کالا</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">شرح کالا</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">مقدار درخواستی</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">مقدار تایید شده (خروجی)</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">شماره سریال</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">محل مصرف</TableHead>
                      {form.status !== "confirmed" && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={form.status === "confirmed" ? 6 : 7} className="text-center text-muted-foreground text-xs py-8">
                          هیچ ردیفی به گرید اضافه نشده است.
                        </TableCell>
                      </TableRow>
                    ) : (
                      form.items.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/40">
                          <TableCell className="font-mono text-xs text-slate-700">{row.assetCode}</TableCell>
                          <TableCell className="font-medium text-slate-800">{row.assetName}</TableCell>
                          <TableCell className="text-center font-mono">{row.quantityRequested}</TableCell>
                          <TableCell className="text-center font-bold font-mono text-emerald-600">{row.quantityApproved}</TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">{row.serialNo || "—"}</TableCell>
                          <TableCell className="text-xs text-slate-600">{row.consumptionLocation}</TableCell>
                          {form.status !== "confirmed" && (
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItemFromGrid(idx)}
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* چپ: لیست آخرین حواله‌ها */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">آخرین حواله‌های صادر شده</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
                  {filteredIssues.length} مورد
                </span>
              </div>

              <div className="relative mb-3">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در حواله‌ها..."
                  className="pr-8 h-8 text-xs"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-sidebar pr-1">
                {filteredIssues.map((iss) => {
                  const style = STATUS_STYLE[iss.status] || STATUS_STYLE.draft;
                  const Icon = style.icon;
                  const isSel = selectedIssueId === iss.id;

                  return (
                    <div
                      key={iss.id}
                      onClick={() => handleRowClick(iss)}
                      className={cn(
                        "p-3 rounded-lg border text-right cursor-pointer transition-all duration-200",
                        isSel
                          ? "border-blue-500 bg-blue-50/40 shadow-sm"
                          : "border-slate-100 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700">{iss.issueNo}</span>
                        <Badge className={cn("text-[10px] gap-1 px-2 py-0.5", style.badge)}>
                          <Icon className="h-3 w-3" />
                          {iss.status === "confirmed" ? "تایید شده" : "پیش‌نویس"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>تاریخ: {iss.issueDate}</span>
                        <span>انبار مبدا: {warehouses.find(w => w.id === iss.warehouseId)?.name || "انبار"}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200/60 text-[11px] text-slate-600 flex items-center justify-between">
                        <strong>تحویل گیرنده:</strong>
                        <span className="truncate max-w-[130px] font-semibold">{iss.receiverName || "—"}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredIssues.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-6">حواله‌ای ثبت نشده است.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مودال شبیه‌ساز چاپ حواله */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl bg-white animate-in zoom-in-95 duration-200">
            <CardContent className="p-8 text-right" dir="rtl">
              <div className="border-2 border-slate-800 p-6 rounded-xl">
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">برگه حواله خروج کالا و اموال مصرفی</h3>
                    <p className="text-xs text-slate-500 mt-1">نظام حسابداری بخش عمومی</p>
                  </div>
                  <div className="text-center font-bold text-xl border px-6 py-2 bg-slate-50">
                    حواله انبار
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div>شماره حواله: <span className="font-mono">{form.issueNo}</span></div>
                    <div>تاریخ: <span className="font-mono">{form.issueDate}</span></div>
                    <div>انبار مبدا: <span>{warehouses.find(w => w.id === form.warehouseId)?.name}</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-3 rounded-lg">
                  <div><strong>تحویل‌گیرنده:</strong> {form.receiverName || "—"}</div>
                  <div><strong>واحد سازمانی:</strong> {form.orgUnit || "—"}</div>
                  <div><strong>مرکز هزینه:</strong> {form.costCenter || "—"}</div>
                  <div><strong>علت خروج:</strong> {ISSUE_REASONS.find(r => r.value === form.reason)?.label}</div>
                  <div className="col-span-2"><strong>توضیحات:</strong> {form.notes || "—"}</div>
                </div>

                <Table className="border border-slate-300 text-xs">
                  <TableHeader>
                    <TableRow className="bg-slate-100 border-b border-slate-300">
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">ردیف</TableHead>
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">کد کالا</TableHead>
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">شرح کالا</TableHead>
                      <TableHead className="text-center font-bold text-slate-800 border-r border-slate-300">مقدار درخواستی</TableHead>
                      <TableHead className="text-center font-bold text-slate-800 border-r border-slate-300">مقدار خروجی تایید شده</TableHead>
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">سریال</TableHead>
                      <TableHead className="text-right font-bold text-slate-800">محل مصرف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.map((row, idx) => (
                      <TableRow key={idx} className="border-b border-slate-200">
                        <TableCell className="border-r border-slate-300 text-center font-mono">{idx + 1}</TableCell>
                        <TableCell className="border-r border-slate-300 font-mono">{row.assetCode}</TableCell>
                        <TableCell className="border-r border-slate-300 font-bold">{row.assetName}</TableCell>
                        <TableCell className="border-r border-slate-300 text-center font-mono">{row.quantityRequested}</TableCell>
                        <TableCell className="border-r border-slate-300 text-center font-mono font-bold text-emerald-700">{row.quantityApproved}</TableCell>
                        <TableCell className="border-r border-slate-300 font-mono text-xs">{row.serialNo || "—"}</TableCell>
                        <TableCell className="text-slate-700">{row.consumptionLocation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="grid grid-cols-4 gap-4 text-center mt-16 text-xs pt-8 border-t border-dashed">
                  <div>
                    <p className="font-bold text-slate-700">درخواست کننده</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">تایید کننده (مدیر واحد)</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">تحویل دهنده (انباردار)</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">تحویل گیرنده</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا و اثر انگشت</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                  <Printer className="h-4 w-4" /> پرینت فیزیکی
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                  بستن پیش‌نمایش
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
