import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Search, Pencil, FileText, CheckCircle2, Clock, Eye, Printer, Paperclip } from "lucide-react";
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

const RECEIPT_TYPES = [
  { value: "purchase", label: "خرید" },
  { value: "return", label: "برگشت از مصرف" },
  { value: "transfer-in", label: "رسید انتقال از انبار دیگر" },
  { value: "other", label: "سایر" }
];

const STATUS_STYLE = {
  draft: { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  confirmed: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 }
};

const SUPPLIERS = [
  { value: "فروشگاه اداری آریا", label: "فروشگاه اداری آریا" },
  { value: "شرکت تجهیزات رایانه‌ای پاسارگاد", label: "شرکت تجهیزات رایانه‌ای پاسارگاد" },
  { value: "تامین دیجیتال تهران", label: "تامین دیجیتال تهران" },
  { value: "صنایع چوبی البرز", label: "صنایع چوبی البرز" }
];

const INITIAL_ITEM = {
  assetCode: "",
  assetName: "",
  assetGroup: "",
  unit: "",
  quantity: "",
  unitPrice: "",
  serialNo: "",
  model: "",
  description: ""
};

const INITIAL_FORM = {
  receiptNo: "",
  receiptDate: "",
  receiptType: "purchase",
  warehouseId: "WH-001",
  supplierName: "",
  invoiceNo: "",
  invoiceDate: "",
  status: "draft",
  notes: "",
  items: []
};

export default function AssetWarehouseReceipt() {
  const {
    receipts,
    warehouses,
    consumables,
    addReceipt,
    updateReceipt,
    deleteReceipt
  } = useInventory();

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentItem, setCurrentItem] = useState(INITIAL_ITEM);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Generate Auto Number
  const generateAutoNo = () => {
    const nextNum = receipts.length + 1001;
    return `REC-${nextNum}`;
  };

  // Start a new receipt
  const handleNew = () => {
    setForm({
      ...INITIAL_FORM,
      receiptNo: generateAutoNo(),
      receiptDate: "1404/07/10" // Default Date
    });
    setSelectedReceiptId(null);
    setCurrentItem(INITIAL_ITEM);
  };

  // Add item from temp form to the items grid
  const handleAddItemToGrid = () => {
    if (!currentItem.assetCode || !currentItem.quantity) return;
    setForm(f => ({
      ...f,
      items: [...f.items, { ...currentItem, quantity: Number(currentItem.quantity), unitPrice: Number(currentItem.unitPrice || 0) }]
    }));
    setCurrentItem(INITIAL_ITEM);
  };

  // Remove item from the grid
  const handleRemoveItemFromGrid = (index) => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== index)
    }));
  };

  // Temporary Save (Draft status)
  const handleSaveDraft = () => {
    if (!form.receiptNo || form.items.length === 0) return;
    const payload = { ...form, status: "draft" };
    if (selectedReceiptId) {
      updateReceipt(payload);
    } else {
      payload.id = form.receiptNo;
      addReceipt(payload);
      setSelectedReceiptId(payload.id);
    }
  };

  // Final Confirmation (Confirmed status - triggers inventory increase)
  const handleConfirm = () => {
    if (!form.receiptNo || form.items.length === 0) return;
    const payload = { ...form, status: "confirmed" };
    if (selectedReceiptId) {
      updateReceipt(payload);
    } else {
      payload.id = form.receiptNo;
      addReceipt(payload);
      setSelectedReceiptId(payload.id);
    }
    setForm(payload); // update UI
  };

  // Delete whole receipt
  const handleDeleteReceipt = () => {
    if (!selectedReceiptId) return;
    deleteReceipt(selectedReceiptId);
    handleNew();
  };

  // Load a receipt when clicked in the list
  const handleRowClick = (receipt) => {
    setForm(receipt);
    setSelectedReceiptId(receipt.id);
  };

  // Calculate sum of total prices in receipt
  const receiptTotalSum = useMemo(() => {
    return form.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  }, [form.items]);

  // Format currency Helper
  const fmtCurrency = (val) => {
    return Number(val).toLocaleString("fa-IR");
  };

  // Filtered list of receipts
  const filteredReceipts = receipts.filter(r =>
    r.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.supplierName && r.supplierName.includes(searchQuery))
  );

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 hover:underline cursor-pointer">انبار و موجودی</span>
        <span>/</span>
        <span className="text-foreground">رسید انبار (اموال مصرفی)</span>
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
            <CheckCircle2 className="h-4 w-4" /> تایید نهایی رسید
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            disabled={form.items.length === 0}
            className="gap-1.5"
          >
            <Printer className="h-4 w-4 text-gray-500" /> چاپ رسید
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAttachModalOpen(true)}
            className="gap-1.5"
          >
            <Paperclip className="h-4 w-4 text-gray-500" /> پیوست فایل ({attachments.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNew}
            className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" /> جدید
          </Button>
          {selectedReceiptId && form.status !== "confirmed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteReceipt}
              className="gap-1.5 text-destructive border-red-200 hover:bg-red-50 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-800">رسید انبار (اموال مصرفی)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">ثبت ورود اقلام مصرفی و دارایی‌های تحویل نشده</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
        {/* راست: فرم اطلاعات رسید */}
        <div className="lg:col-span-2 space-y-6">
          {/* بخش اول: اطلاعات سربرگ */}
          <Card className="shadow-sm border-slate-100">
            <CardContent className="pt-6">
              <h2 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-dashed border-slate-200">اطلاعات سربرگ</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">شماره رسید</Label>
                  <Input
                    value={form.receiptNo}
                    onChange={(e) => setForm({ ...form, receiptNo: e.target.value })}
                    disabled={form.status === "confirmed"}
                    className="h-9 font-mono text-left"
                    dir="ltr"
                    placeholder="Auto generated"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">تاریخ رسید</Label>
                  <PersianDatePicker
                    value={form.receiptDate}
                    onChange={(e) => setForm({ ...form, receiptDate: e?.target?.value || e })}
                    disabled={form.status === "confirmed"}
                    className="h-9"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">نوع رسید</Label>
                  <SearchableSelect
                    value={form.receiptType}
                    onChange={(val) => setForm({ ...form, receiptType: val })}
                    options={RECEIPT_TYPES}
                    disabled={form.status === "confirmed"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">انبار مقصد</Label>
                  <SearchableSelect
                    value={form.warehouseId}
                    onChange={(val) => setForm({ ...form, warehouseId: val })}
                    options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                    disabled={form.status === "confirmed"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">تامین‌کننده</Label>
                  <SearchableSelect
                    value={form.supplierName}
                    onChange={(val) => setForm({ ...form, supplierName: val })}
                    options={SUPPLIERS}
                    disabled={form.status === "confirmed"}
                    placeholder="انتخاب تامین‌کننده"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">وضعیت</Label>
                  <div>
                    {form.status === "confirmed" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs py-1 px-3">تایید نهایی شده</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs py-1 px-3">پیش‌نویس / موقت</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">شماره فاکتور</Label>
                  <Input
                    value={form.invoiceNo}
                    onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                    disabled={form.status === "confirmed"}
                    className="h-9"
                    placeholder="مثال: ۱۲۳۴۵"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">تاریخ فاکتور</Label>
                  <PersianDatePicker
                    value={form.invoiceDate}
                    onChange={(e) => setForm({ ...form, invoiceDate: e?.target?.value || e })}
                    disabled={form.status === "confirmed"}
                    className="h-9"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-1">
                  <Label className="text-xs font-semibold text-slate-600">توضیحات سربرگ</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    disabled={form.status === "confirmed"}
                    className="h-9"
                    placeholder="توضیحات اختیاری..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* بخش دوم: افزودن اقلام به گرید */}
          {form.status !== "confirmed" && (
            <Card className="shadow-sm border-slate-100">
              <CardContent className="pt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-dashed border-slate-200">افزودن کالا به رسید</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600">انتخاب کالا</Label>
                    <SearchableSelect
                      value={currentItem.assetCode}
                      onChange={(code) => {
                        const item = consumables.find(c => c.code === code);
                        if (item) {
                          setCurrentItem(prev => ({
                            ...prev,
                            assetCode: code,
                            assetName: item.name,
                            assetGroup: item.group,
                            unit: item.unit
                          }));
                        }
                      }}
                      options={consumables.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
                      placeholder="جستجو و انتخاب کالا..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">تعداد</Label>
                    <Input
                      type="number"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                      placeholder="تعداد ورود"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">قیمت واحد (ریال)</Label>
                    <Input
                      type="number"
                      value={currentItem.unitPrice}
                      onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: e.target.value })}
                      placeholder="ریال"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">شماره سریال</Label>
                    <Input
                      value={currentItem.serialNo}
                      onChange={(e) => setCurrentItem({ ...currentItem, serialNo: e.target.value })}
                      placeholder="سریال انتخابی"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">مدل</Label>
                    <Input
                      value={currentItem.model}
                      onChange={(e) => setCurrentItem({ ...currentItem, model: e.target.value })}
                      placeholder="مثال: Dell Vostro"
                      className="h-9"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-slate-600">توضیحات ردیف</Label>
                    <Input
                      value={currentItem.description}
                      onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                      placeholder="توضیحات..."
                      className="h-9"
                    />
                  </div>

                  <Button
                    onClick={handleAddItemToGrid}
                    disabled={!currentItem.assetCode || !currentItem.quantity}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-9 gap-1"
                  >
                    <Plus className="h-4 w-4" /> افزودن
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* بخش سوم: جدول اقلام رسید */}
          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">اقلام گرید رسید انبار</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  تعداد کل ردیف‌ها: {form.items.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800 text-white font-bold hover:bg-slate-800">
                      <TableHead className="text-right text-xs font-bold text-white">کد کالا</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">شرح کالا</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">گروه</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">واحد سنجش</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">تعداد</TableHead>
                      <TableHead className="text-left text-xs font-bold text-white">قیمت واحد (ریال)</TableHead>
                      <TableHead className="text-left text-xs font-bold text-white">مبلغ کل (ریال)</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">سریال/مدل</TableHead>
                      {form.status !== "confirmed" && <TableHead className="w-10"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={form.status === "confirmed" ? 8 : 9} className="text-center text-muted-foreground text-xs py-8">
                          هیچ ردیفی به گرید اضافه نشده است.
                        </TableCell>
                      </TableRow>
                    ) : (
                      form.items.map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/40">
                          <TableCell className="font-mono text-xs text-slate-700">{row.assetCode}</TableCell>
                          <TableCell className="font-medium text-slate-800">{row.assetName}</TableCell>
                          <TableCell className="text-xs text-slate-600">{row.assetGroup}</TableCell>
                          <TableCell className="text-xs text-slate-600">{row.unit}</TableCell>
                          <TableCell className="text-center font-semibold font-mono">{row.quantity}</TableCell>
                          <TableCell className="text-left font-mono text-xs">{fmtCurrency(row.unitPrice)}</TableCell>
                          <TableCell className="text-left font-mono text-xs font-bold text-blue-600">
                            {fmtCurrency(row.quantity * row.unitPrice)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {row.serialNo && <div>سریال: {row.serialNo}</div>}
                            {row.model && <div>مدل: {row.model}</div>}
                          </TableCell>
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
              {form.items.length > 0 && (
                <div className="bg-slate-50/60 p-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-700">جمع کل رسید:</span>
                  <span className="font-extrabold text-blue-700 font-mono text-base">
                    {fmtCurrency(receiptTotalSum)} ریال
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* چپ: لیست آخرین رسیدها */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-700">آخرین رسیدهای انبار</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
                  {filteredReceipts.length} مورد
                </span>
              </div>

              <div className="relative mb-3">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در رسیدها..."
                  className="pr-8 h-8 text-xs"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-sidebar pr-1">
                {filteredReceipts.map((rec) => {
                  const style = STATUS_STYLE[rec.status] || STATUS_STYLE.draft;
                  const Icon = style.icon;
                  const total = rec.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
                  const isSel = selectedReceiptId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleRowClick(rec)}
                      className={cn(
                        "p-3 rounded-lg border text-right cursor-pointer transition-all duration-200",
                        isSel
                          ? "border-blue-500 bg-blue-50/40 shadow-sm"
                          : "border-slate-100 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700">{rec.receiptNo}</span>
                        <Badge className={cn("text-[10px] gap-1 px-2 py-0.5", style.badge)}>
                          <Icon className="h-3 w-3" />
                          {rec.status === "confirmed" ? "تایید شده" : "پیش‌نویس"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>تاریخ: {rec.receiptDate}</span>
                        <span>انبار: {warehouses.find(w => w.id === rec.warehouseId)?.name || "انبار"}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 font-semibold truncate max-w-[120px]">{rec.supplierName || "بدون تامین‌کننده"}</span>
                        <span className="font-bold text-blue-600 font-mono">{fmtCurrency(total)} ریال</span>
                      </div>
                    </div>
                  );
                })}
                {filteredReceipts.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-6">رسیدی ثبت نشده است.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* مودال شبیه‌ساز چاپ رسید */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl bg-white animate-in zoom-in-95 duration-200">
            <CardContent className="p-8 text-right" dir="rtl">
              <div className="border-2 border-slate-800 p-6 rounded-xl">
                <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">برگه رسید انبار مصرفی</h3>
                    <p className="text-xs text-slate-500 mt-1">نظام حسابداری بخش عمومی</p>
                  </div>
                  <div className="text-center font-bold text-xl border px-6 py-2 bg-slate-50">
                    رسید کالا
                  </div>
                  <div className="text-xs space-y-1 text-slate-600">
                    <div>شماره رسید: <span className="font-mono">{form.receiptNo}</span></div>
                    <div>تاریخ: <span className="font-mono">{form.receiptDate}</span></div>
                    <div>انبار: <span>{warehouses.find(w => w.id === form.warehouseId)?.name}</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-3 rounded-lg">
                  <div><strong>تامین‌کننده:</strong> {form.supplierName || "—"}</div>
                  <div><strong>نوع ورود:</strong> {RECEIPT_TYPES.find(t => t.value === form.receiptType)?.label}</div>
                  <div><strong>شماره فاکتور:</strong> {form.invoiceNo || "—"}</div>
                  <div><strong>تاریخ فاکتور:</strong> {form.invoiceDate || "—"}</div>
                  <div className="col-span-2"><strong>توضیحات:</strong> {form.notes || "—"}</div>
                </div>

                <Table className="border border-slate-300 text-xs">
                  <TableHeader>
                    <TableRow className="bg-slate-100 border-b border-slate-300">
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">ردیف</TableHead>
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">کد کالا</TableHead>
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">شرح کالا</TableHead>
                      <TableHead className="text-center font-bold text-slate-800 border-r border-slate-300">مقدار</TableHead>
                      <TableHead className="text-right font-bold text-slate-800 border-r border-slate-300">قیمت واحد (ریال)</TableHead>
                      <TableHead className="text-right font-bold text-slate-800">جمع کل (ریال)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.items.map((row, idx) => (
                      <TableRow key={idx} className="border-b border-slate-200">
                        <TableCell className="border-r border-slate-300 text-center font-mono">{idx + 1}</TableCell>
                        <TableCell className="border-r border-slate-300 font-mono">{row.assetCode}</TableCell>
                        <TableCell className="border-r border-slate-300 font-bold">{row.assetName}</TableCell>
                        <TableCell className="border-r border-slate-300 text-center font-mono">{row.quantity} {row.unit}</TableCell>
                        <TableCell className="border-r border-slate-300 text-left font-mono">{fmtCurrency(row.unitPrice)}</TableCell>
                        <TableCell className="text-left font-mono">{fmtCurrency(row.quantity * row.unitPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 text-left font-bold text-sm">
                  جمع کل رسید: {fmtCurrency(receiptTotalSum)} ریال
                </div>

                <div className="grid grid-cols-3 gap-4 text-center mt-12 text-xs pt-8 border-t border-dashed">
                  <div>
                    <p className="font-bold text-slate-700">تحویل دهنده (تامین‌کننده)</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا و اثر انگشت</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">تحویل گیرنده (انباردار)</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا و اثر انگشت</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">ذیحساب / مسئول مالی</p>
                    <div className="h-12"></div>
                    <p className="text-[10px] text-slate-400">امضا و مهر مالی</p>
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

      {/* مودال پیوست فایل */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-2xl bg-white animate-in zoom-in-95 duration-200">
            <CardContent className="p-6 text-right" dir="rtl">
              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b">پیوست مستندات رسید (فاکتور، فیش، حواله مبدا)</h3>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <Paperclip className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">فایل‌ها را به این قسمت بکشید یا کلیک کنید</p>
                  <p className="text-[10px] text-slate-400 mt-1">پسوندهای مجاز: JPG, PNG, PDF (حداکثر ۵ مگابایت)</p>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        setAttachments([...attachments, { name: file.name, size: (file.size / 1024).toFixed(1) + " KB" }]);
                      }
                    }}
                    id="file-upload"
                  />
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => document.getElementById("file-upload").click()}>
                    انتخاب فایل
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-600">لیست پیوست‌ها:</p>
                  {attachments.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-2">پیوستی ثبت نشده است</p>
                  ) : (
                    attachments.map((at, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-xs">
                        <span className="font-mono text-slate-700 truncate max-w-[200px]">{at.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{at.size}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-red-500"
                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button size="sm" onClick={() => setIsAttachModalOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  ذخیره پیوست‌ها
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
