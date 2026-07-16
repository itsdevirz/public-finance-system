import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Package, PackagePlus, PackageMinus, ArrowLeftRight, ClipboardList,
  AlertTriangle, Warehouse as StoreIcon, Users, RefreshCw, BarChart3,
  Plus, Trash2, Save, Search, Pencil, CheckCircle2, AlertCircle, Eye, ShieldCheck
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAssets } from "@/context/AssetContext";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

// ─── STYLING FOR DYNAMIC VIEWS ────────────────────────────────────────────────
const VIEW_META = {
  items:      { title: "مدیریت کالاها",      desc: "کاتالوگ کالاهای مصرفی و ملزومات انبار", icon: Package },
  stores:     { title: "مدیریت انبارها",     desc: "تعریف انبارها، سوله‌ها و مکان‌های ذخیره‌سازی", icon: StoreIcon },
  receipts:   { title: "ورود کالا (رسید)",   desc: "ثبت فاکتورهای ورودی، رسید خرید و برگشتی‌ها", icon: PackagePlus },
  issues:     { title: "خروج کالا (حواله)",  desc: "ثبت حواله‌های خروج کالا و تحویل به واحدها", icon: PackageMinus },
  requests:   { title: "درخواست کالا",       desc: "بررسی و تایید درخواست‌های ملزومات اداری پرسنل", icon: ClipboardList },
  transfers:  { title: "انتقال بین انبارها",  desc: "جابجایی و انتقال موجودی بین انبارهای مختلف", icon: ArrowLeftRight },
  inventory:  { title: "انبارگردانی",        desc: "ثبت دوره‌ای شمارش فیزیکی و مغایرت‌گیری", icon: ShieldCheck },
  suppliers:  { title: "تامین‌کنندگان انبار", desc: "مدیریت شرکای تجاری و تامین‌کنندگان کالا", icon: Users },
  employees:  { title: "تعریف کارکنان",       desc: "ثبت پرسنل، سمت‌ها و اطلاعات هویتی و پرسنلی کارکنان انبار", icon: Users },
  reports:    { title: "گزارش‌های انبار",     desc: "گزارش‌های موجودی لحظه‌ای، بحرانی، کاردکس و عملیات", icon: BarChart3 },
};

export default function Warehouse() {
  const { pathname } = useLocation();
  const {
    items, requests, transfers, warehouses, receipts, issues, suppliers, employees, audits,
    addConfig, updateConfig, deleteConfig, refreshAllConfigs
  } = useAssets();

  // Determine current active sub-page based on URL pathname
  const activeView = useMemo(() => {
    if (pathname.includes("/items")) return "items";
    if (pathname.includes("/stores")) return "stores";
    if (pathname.includes("/receipts")) return "receipts";
    if (pathname.includes("/issues")) return "issues";
    if (pathname.includes("/requests")) return "requests";
    if (pathname.includes("/transfers")) return "transfers";
    if (pathname.includes("/inventory")) return "inventory";
    if (pathname.includes("/suppliers")) return "suppliers";
    if (pathname.includes("/employees")) return "employees";
    if (pathname.includes("/reports")) return "reports";
    return "items"; // fallback default
  }, [pathname]);

  const meta = VIEW_META[activeView];
  const ViewIcon = meta.icon;

  // Search/Filters states
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [saved, setSaved] = useState(false);

  // Unified Form States for all subpages
  const [form, setForm] = useState({});

  function setField(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setSaved(false);
  }

  function handleNew() {
    setForm({});
    setSelectedId(null);
    setSaved(false);
  }

  // Generic Save for all configurations
  async function handleSaveConfig(collectionName, formPayload) {
    if (selectedId) {
      await updateConfig(collectionName, { ...formPayload, _id: selectedId, id: selectedId });
    } else {
      await addConfig(collectionName, formPayload);
    }
    setSaved(true);
    handleNew();
  }

  // Generic Delete for configurations
  async function handleDeleteConfig(collectionName) {
    if (selectedId) {
      await deleteConfig(collectionName, selectedId);
      handleNew();
    }
  }

  // Shared options mappings
  const itemsList = items || [];
  const storesList = warehouses || [];
  const itemsOptions = useMemo(() => itemsList.map(i => ({ value: i.code, label: `${i.code} — ${i.name}` })), [itemsList]);
  const storesOptions = useMemo(() => storesList.map(s => ({ value: s.code, label: `${s.code} — ${s.name}` })), [storesList]);
  const supplierOptions = useMemo(() => (suppliers || []).map(s => ({ value: s.name || s.title, label: s.name || s.title })), [suppliers]);
  const employeeOptions = useMemo(() => (employees || []).map(e => ({ value: e.code, label: `${e.code} — ${e.name} (${e.department})` })), [employees]);

  // ─── 1. ITEMS VIEW ─────────────────────────────────────────────────────────
  const filteredItems = itemsList.filter(i => !search || i.name?.includes(search) || i.code?.includes(search) || i.category?.includes(search));

  const itemsContent = (
    <div className="space-y-4">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleSaveConfig("items", form)} disabled={!form.code || !form.name} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره کالا
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1"><Plus className="h-4 w-4" /> کالا جدید</Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("items")} disabled={!selectedId} className="text-destructive gap-1"><Trash2 className="h-4 w-4" /> حذف کالا</Button>
        </div>
        {saved && <span className="text-xs text-emerald-600">✓ با موفقیت ذخیره شد</span>}
      </div>

      <Card>
        <CardContent className="pt-4 grid grid-cols-2 gap-4 md:grid-cols-4 text-right" dir="rtl">
          <div>
            <Label className="text-xs font-semibold">کد کالا</Label>
            <Input value={form.code || ""} onChange={e => setField("code", e.target.value)} className="h-8 text-sm mt-1 font-mono" placeholder="IT-101" />
          </div>
          <div>
            <Label className="text-xs font-semibold">نام کالا</Label>
            <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} className="h-8 text-sm mt-1" placeholder="کیبورد فراسو" />
          </div>
          <div>
            <Label className="text-xs font-semibold">دسته‌بندی</Label>
            <Input value={form.category || ""} onChange={e => setField("category", e.target.value)} className="h-8 text-sm mt-1" placeholder="قطعات رایانه" />
          </div>
          <div>
            <Label className="text-xs font-semibold">واحد اندازه‌گیری</Label>
            <Input value={form.unit || ""} onChange={e => setField("unit", e.target.value)} className="h-8 text-sm mt-1" placeholder="عدد" />
          </div>
          <div>
            <Label className="text-xs font-semibold">موجودی فعلی انبار</Label>
            <Input type="number" value={form.currentStock || ""} onChange={e => setField("currentStock", Number(e.target.value))} className="h-8 text-sm mt-1 font-mono" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs font-semibold">نقطه بحرانی (حداقل موجودی)</Label>
            <Input type="number" value={form.minStock || ""} onChange={e => setField("minStock", Number(e.target.value))} className="h-8 text-sm mt-1 font-mono" placeholder="5" />
          </div>
          <div>
            <Label className="text-xs font-semibold">فی خرید (ریال)</Label>
            <Input type="number" value={form.price || ""} onChange={e => setField("price", Number(e.target.value))} className="h-8 text-sm mt-1 font-mono" placeholder="0" />
          </div>
          <div>
            <Label className="text-xs font-semibold">توضیحات کالا</Label>
            <Input value={form.description || ""} onChange={e => setField("description", e.target.value)} className="h-8 text-sm mt-1" placeholder="..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-3 flex items-center gap-2" dir="rtl">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="جستجو در کالاها..." className="max-w-xs h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">کد کالا</TableHead>
                <TableHead className="text-right">نام کالا</TableHead>
                <TableHead className="text-right">دسته</TableHead>
                <TableHead className="text-right">موجودی</TableHead>
                <TableHead className="text-right">حداقل</TableHead>
                <TableHead className="text-left">قیمت خرید (ریال)</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(row => (
                <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                  <TableCell className="font-mono text-xs font-semibold">{row.code}</TableCell>
                  <TableCell className="font-medium text-sm">{row.name}</TableCell>
                  <TableCell className="text-xs">{row.category || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">
                    <span className={cn(row.currentStock <= row.minStock ? "text-rose-600 font-bold" : "text-emerald-700")}>{row.currentStock} {row.unit}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.minStock}</TableCell>
                  <TableCell className="font-mono text-xs text-left font-semibold">{row.price?.toLocaleString("fa-IR") || "۰"}</TableCell>
                  <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── 2. STORES VIEW ────────────────────────────────────────────────────────
  const filteredStores = storesList.filter(s => !search || s.name?.includes(search) || s.code?.includes(search));

  const storesContent = (
    <div className="space-y-4">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleSaveConfig("warehouses", form)} disabled={!form.code || !form.name} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره انبار
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1"><Plus className="h-4 w-4" /> انبار جدید</Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("warehouses")} disabled={!selectedId} className="text-destructive gap-1"><Trash2 className="h-4 w-4" /> حذف انبار</Button>
        </div>
        {saved && <span className="text-xs text-emerald-600">✓ با موفقیت ذخیره شد</span>}
      </div>

      <Card>
        <CardContent className="pt-4 grid grid-cols-2 gap-4 md:grid-cols-4 text-right" dir="rtl">
          <div>
            <Label className="text-xs font-semibold">کد انبار</Label>
            <Input value={form.code || ""} onChange={e => setField("code", e.target.value)} className="h-8 text-sm mt-1 font-mono" placeholder="WH-01" />
          </div>
          <div>
            <Label className="text-xs font-semibold">نام انبار</Label>
            <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} className="h-8 text-sm mt-1" placeholder="انبار مرکزی ملزومات" />
          </div>
          <div>
            <Label className="text-xs font-semibold">مکان انبار</Label>
            <Input value={form.location || ""} onChange={e => setField("location", e.target.value)} className="h-8 text-sm mt-1" placeholder="ساختمان اداری، همکف" />
          </div>
          <div>
            <Label className="text-xs font-semibold">مسئول انبار</Label>
            <Input value={form.manager || ""} onChange={e => setField("manager", e.target.value)} className="h-8 text-sm mt-1" placeholder="رضایی" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">کد انبار</TableHead>
                <TableHead className="text-right">نام انبار</TableHead>
                <TableHead className="text-right">محل استقرار</TableHead>
                <TableHead className="text-right">مسئول انبار</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map(row => (
                <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                  <TableCell className="font-mono text-xs font-semibold">{row.code}</TableCell>
                  <TableCell className="font-semibold text-sm">{row.name}</TableCell>
                  <TableCell className="text-xs">{row.location || "—"}</TableCell>
                  <TableCell className="text-xs">{row.manager || "—"}</TableCell>
                  <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── 3. RECEIPTS VIEW (ورود کالا) ──────────────────────────────────────────
  const receiptsList = receipts || [];
  const [receiptFilter, setReceiptFilter] = useState("all");

  async function handleSaveReceipt() {
    if (!form.receiptCode || !form.itemCode || !form.quantity) return;
    
    // Auto increment stock when receipt is registered!
    const targetItem = itemsList.find(i => i.code === form.itemCode);
    if (targetItem) {
      const nextStock = (targetItem.currentStock || 0) + Number(form.quantity);
      await updateConfig("items", { ...targetItem, currentStock: nextStock });
    }

    const payload = {
      ...form,
      type: form.type || "purchase"
    };

    await handleSaveConfig("receipts", payload);
  }

  const filteredReceipts = useMemo(() => {
    return receiptsList.filter(r => {
      const matchesSearch = !search ||
        r.receiptCode?.includes(search) ||
        r.itemCode?.includes(search) ||
        r.supplier?.includes(search) ||
        r.returningDept?.includes(search);
      
      const rType = r.type || "purchase";
      const matchesType = receiptFilter === "all" || rType === receiptFilter;

      return matchesSearch && matchesType;
    });
  }, [receiptsList, search, receiptFilter]);

  const receiptsContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveReceipt} disabled={!form.receiptCode || !form.itemCode || !form.quantity} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره رسید
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" /> رسید جدید
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("receipts")} disabled={!selectedId} className="text-destructive gap-1">
            <Trash2 className="h-4 w-4" /> حذف رسید
          </Button>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">✓ با موفقیت ذخیره شد</span>}
      </div>

      <Card>
        <CardContent className="pt-5 px-6 pb-5 space-y-4" dir="rtl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-right">
            <div>
              <Label className="text-xs font-semibold">نوع رسید ورود کالا</Label>
              <select
                value={form.type || "purchase"}
                onChange={e => setField("type", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
              >
                <option value="purchase">رسید خرید (فاکتور خرید)</option>
                <option value="return">برگشت از مصرف داخلی</option>
                <option value="transfer-in">رسید انتقال از انبار دیگر</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">شماره رسید انبار</Label>
              <Input value={form.receiptCode || ""} onChange={e => setField("receiptCode", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="REC-1403-01" />
            </div>

            <div>
              <Label className="text-xs font-semibold">تاریخ ورود کالا</Label>
              <PersianDatePicker value={form.date || ""} onChange={e => setField("date", e.target.value)} placeholder="۱۴۰۳/۰۴/۰۱" />
            </div>

            <div>
              <Label className="text-xs font-semibold">انبار مقصد دریافت‌کننده</Label>
              <SearchableSelect value={form.storeCode} onChange={v => setField("storeCode", v)} options={storesOptions} placeholder="انتخاب انبار..." />
            </div>

            <div>
              <Label className="text-xs font-semibold">انتخاب کالا</Label>
              <SearchableSelect value={form.itemCode} onChange={v => setField("itemCode", v)} options={itemsOptions} placeholder="کد یا نام کالا..." />
            </div>

            <div>
              <Label className="text-xs font-semibold">تعداد ورود کالا</Label>
              <Input type="number" value={form.quantity || ""} onChange={e => setField("quantity", Number(e.target.value))} className="h-9 text-sm mt-1 font-mono text-left" placeholder="0" />
            </div>

            <div>
              <Label className="text-xs font-semibold">قیمت واحد (ریال)</Label>
              <Input type="number" value={form.unitPrice || ""} onChange={e => setField("unitPrice", Number(e.target.value))} className="h-9 text-sm mt-1 font-mono text-left" placeholder="0" />
            </div>

            {/* فیلد داینامیک بر اساس نوع رسید */}
            {(form.type === "purchase" || !form.type) && (
              <div>
                <Label className="text-xs font-semibold text-emerald-700">تامین‌کننده کالا (خرید)</Label>
                <SearchableSelect value={form.supplier} onChange={v => setField("supplier", v)} options={supplierOptions} placeholder="انتخاب تامین‌کننده..." />
              </div>
            )}

            {form.type === "return" && (
              <div>
                <Label className="text-xs font-semibold text-blue-700">واحد سازمانی برگشت‌دهنده</Label>
                <Input value={form.returningDept || ""} onChange={e => setField("returningDept", e.target.value)} className="h-9 text-sm mt-1" placeholder="مثال: کارگزینی" />
              </div>
            )}

            {form.type === "transfer-in" && (
              <div>
                <Label className="text-xs font-semibold text-amber-700">انبار مبدا (انتقال دهنده)</Label>
                <SearchableSelect value={form.sourceStoreCode} onChange={v => setField("sourceStoreCode", v)} options={storesOptions} placeholder="از کدام انبار..." />
              </div>
            )}

            <div className="col-span-full">
              <Label className="text-xs font-semibold">توضیحات رسید</Label>
              <Input value={form.note || ""} onChange={e => setField("note", e.target.value)} className="h-9 text-sm mt-1" placeholder="توضیحات تکمیلی..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-b pb-3" dir="rtl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="جستجو در رسیدها..." className="max-w-xs h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {[
                { key: "all", label: "همه رسیدها" },
                { key: "purchase", label: "رسید خرید" },
                { key: "return", label: "برگشت از مصرف" },
                { key: "transfer-in", label: "انتقال از انبار دیگر" },
              ].map(tab => (
                <Button key={tab.key} variant={receiptFilter === tab.key ? "secondary" : "ghost"} size="sm" onClick={() => setReceiptFilter(tab.key)} className="h-7 text-xs px-2.5">
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">شماره رسید</TableHead>
                <TableHead className="text-right">نوع رسید</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">کالا</TableHead>
                <TableHead className="text-right">تعداد ورودی</TableHead>
                <TableHead className="text-right">انبار مقصد</TableHead>
                <TableHead className="text-right">جزئیات فرستنده</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">رسیدی یافت نشد</TableCell>
                </TableRow>
              ) : filteredReceipts.map(row => {
                const itm = itemsList.find(i => i.code === row.itemCode);
                const str = storesList.find(s => s.code === row.storeCode);
                const rType = row.type || "purchase";

                let detailsLabel = "—";
                if (rType === "purchase") detailsLabel = `تامین‌کننده: ${row.supplier || "—"}`;
                else if (rType === "return") detailsLabel = `واحد: ${row.returningDept || "—"}`;
                else if (rType === "transfer-in") {
                  const srcStr = storesList.find(s => s.code === row.sourceStoreCode);
                  detailsLabel = `از انبار: ${srcStr ? srcStr.name : row.sourceStoreCode || "—"}`;
                }

                return (
                  <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                    <TableCell className="font-mono text-xs font-semibold">{row.receiptCode}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium",
                        rType === "purchase" && "bg-emerald-100 text-emerald-700 border-emerald-300",
                        rType === "return" && "bg-blue-100 text-blue-700 border-blue-300",
                        rType === "transfer-in" && "bg-amber-100 text-amber-700 border-amber-300"
                      )}>
                        {rType === "purchase" && "خرید"}
                        {rType === "return" && "برگشت از مصرف"}
                        {rType === "transfer-in" && "انتقال"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {itm ? itm.name : row.itemCode}
                      <span className="block text-[10px] text-muted-foreground font-mono">{row.itemCode}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-emerald-700 font-bold">+{row.quantity}</TableCell>
                    <TableCell className="text-xs">{str ? str.name : row.storeCode}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{detailsLabel}</TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── 4. ISSUES VIEW (خروج کالا) ───────────────────────────────────────
  const issuesList = issues || [];
  const [issueFilter, setIssueFilter] = useState("all");

  async function handleSaveIssue() {
    if (!form.issueCode || !form.itemCode || !form.quantity) return;

    // Auto decrement stock when issue is registered!
    const targetItem = itemsList.find(i => i.code === form.itemCode);
    if (targetItem) {
      const nextStock = Math.max(0, (targetItem.currentStock || 0) - Number(form.quantity));
      await updateConfig("items", { ...targetItem, currentStock: nextStock });
    }

    const payload = {
      ...form,
      type: form.type || "consumption"
    };

    await handleSaveConfig("issues", payload);
  }

  const filteredIssues = useMemo(() => {
    return issuesList.filter(i => {
      const matchesSearch = !search ||
        i.issueCode?.includes(search) ||
        i.itemCode?.includes(search) ||
        i.department?.includes(search) ||
        i.recipient?.includes(search) ||
        i.scrapReason?.includes(search);
      
      const iType = i.type || "consumption";
      const matchesType = issueFilter === "all" || iType === issueFilter;

      return matchesSearch && matchesType;
    });
  }, [issuesList, search, issueFilter]);

  const issuesContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveIssue} disabled={!form.issueCode || !form.itemCode || !form.quantity} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره حواله
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" /> حواله جدید
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("issues")} disabled={!selectedId} className="text-destructive gap-1">
            <Trash2 className="h-4 w-4" /> حذف حواله
          </Button>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">✓ با موفقیت ذخیره شد</span>}
      </div>

      <Card>
        <CardContent className="pt-5 px-6 pb-5 space-y-4" dir="rtl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-right">
            <div>
              <Label className="text-xs font-semibold">نوع حواله خروج کالا</Label>
              <select
                value={form.type || "consumption"}
                onChange={e => setField("type", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
              >
                <option value="consumption">حواله مصرف داخلی</option>
                <option value="delivery">تحویل به پرسنل</option>
                <option value="scrap">حواله اسقاط و ضایعات کالا</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold">شماره حواله انبار</Label>
              <Input value={form.issueCode || ""} onChange={e => setField("issueCode", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="ISS-1403-01" />
            </div>

            <div>
              <Label className="text-xs font-semibold">تاریخ خروج کالا</Label>
              <PersianDatePicker value={form.date || ""} onChange={e => setField("date", e.target.value)} placeholder="۱۴۰۳/۰۴/۰۱" />
            </div>

            <div>
              <Label className="text-xs font-semibold">انبار مبدا فرستنده</Label>
              <SearchableSelect value={form.storeCode} onChange={v => setField("storeCode", v)} options={storesOptions} placeholder="انتخاب انبار..." />
            </div>

            <div>
              <Label className="text-xs font-semibold">کالا</Label>
              <SearchableSelect value={form.itemCode} onChange={v => setField("itemCode", v)} options={itemsOptions} placeholder="انتخاب کالا..." />
            </div>

            <div>
              <Label className="text-xs font-semibold">تعداد خروجی</Label>
              <Input type="number" value={form.quantity || ""} onChange={e => setField("quantity", Number(e.target.value))} className="h-9 text-sm mt-1 font-mono text-left" placeholder="0" />
            </div>

            {(form.type === "consumption" || !form.type) && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-blue-700">واحد متقاضی مصرف</Label>
                  <Input value={form.department || ""} onChange={e => setField("department", e.target.value)} className="h-9 text-sm mt-1" placeholder="امور مالی" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-blue-700">مرکز هزینه</Label>
                  <Input value={form.costCenter || ""} onChange={e => setField("costCenter", e.target.value)} className="h-9 text-sm mt-1" placeholder="مرکز اداری" />
                </div>
              </>
            )}

            {form.type === "delivery" && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-emerald-700">پرسنل تحویل‌گیرنده</Label>
                  <SearchableSelect
                    value={form.employeeCode}
                    onChange={v => {
                      const emp = employees.find(e => e.code === v);
                      setField("employeeCode", v);
                      if (emp) {
                        setField("recipient", emp.name);
                        setField("department", emp.department);
                      }
                    }}
                    options={employeeOptions}
                    placeholder="انتخاب پرسنل..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-emerald-700">نام تحویل‌گیرنده</Label>
                  <Input value={form.recipient || ""} onChange={e => setField("recipient", e.target.value)} className="h-9 text-sm mt-1" placeholder="نام پرسنل" />
                </div>
              </>
            )}

            {form.type === "scrap" && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-rose-700">علت اسقاط کالا</Label>
                  <Input value={form.scrapReason || ""} onChange={e => setField("scrapReason", e.target.value)} className="h-9 text-sm mt-1" placeholder="علت فرسودگی" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-rose-700">شماره مجوز اسقاط</Label>
                  <Input value={form.scrapLicense || ""} onChange={e => setField("scrapLicense", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="SC-1403" />
                </div>
              </>
            )}

            <div className="col-span-full">
              <Label className="text-xs font-semibold">توضیحات حواله</Label>
              <Input value={form.note || ""} onChange={e => setField("note", e.target.value)} className="h-9 text-sm mt-1" placeholder="توضیحات اختیاری..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-b pb-3" dir="rtl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="جستجو در حواله‌ها..." className="max-w-xs h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {[
                { key: "all", label: "همه حواله‌ها" },
                { key: "consumption", label: "مصرف داخلی" },
                { key: "delivery", label: "تحویل به پرسنل" },
                { key: "scrap", label: "اسقاط کالا" },
              ].map(tab => (
                <Button key={tab.key} variant={issueFilter === tab.key ? "secondary" : "ghost"} size="sm" onClick={() => setIssueFilter(tab.key)} className="h-7 text-xs px-2.5">
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">شماره حواله</TableHead>
                <TableHead className="text-right">نوع حواله</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">کالا</TableHead>
                <TableHead className="text-right">تعداد خروجی</TableHead>
                <TableHead className="text-right">انبار مبدا</TableHead>
                <TableHead className="text-right">جزئیات گیرنده / علت</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">حواله‌ای یافت نشد</TableCell>
                </TableRow>
              ) : filteredIssues.map(row => {
                const itm = itemsList.find(i => i.code === row.itemCode);
                const str = storesList.find(s => s.code === row.storeCode);
                const iType = row.type || "consumption";

                let detailsLabel = "—";
                if (iType === "consumption") detailsLabel = `واحد: ${row.department || "—"}`;
                else if (iType === "delivery") detailsLabel = `تحویل به: ${row.recipient || "—"}`;
                else if (iType === "scrap") detailsLabel = `علت: ${row.scrapReason || "—"}`;

                return (
                  <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                    <TableCell className="font-mono text-xs font-semibold">{row.issueCode}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium",
                        iType === "consumption" && "bg-blue-100 text-blue-700 border-blue-300",
                        iType === "delivery" && "bg-emerald-100 text-emerald-700 border-emerald-300",
                        iType === "scrap" && "bg-rose-100 text-rose-700 border-rose-300"
                      )}>
                        {iType === "consumption" && "مصرف داخلی"}
                        {iType === "delivery" && "تحویل به پرسنل"}
                        {iType === "scrap" && "اسقاط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {itm ? itm.name : row.itemCode}
                      <span className="block text-[10px] text-muted-foreground font-mono">{row.itemCode}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-rose-600 font-bold">-{row.quantity}</TableCell>
                    <TableCell className="text-xs">{str ? str.name : row.storeCode}</TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">{detailsLabel}</TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );


  // ─── 5. REQUESTS VIEW (درخواست کالا) ────────────────────────────────────────
  const requestsList = requests || [];
  const [requestFilter, setRequestFilter] = useState("all");

  async function handleSaveRequest() {
    if (!form.requestCode || !form.itemCode || !form.quantity) return;

    const payload = {
      ...form,
      status: form.status || "pending"
    };

    await handleSaveConfig("requests", payload);
  }

  async function handleApproveRequest(reqRow) {
    const targetItem = itemsList.find(i => i.code === reqRow.itemCode);
    if (targetItem) {
      const nextStock = Math.max(0, (targetItem.currentStock || 0) - Number(reqRow.quantity));
      await updateConfig("items", { ...targetItem, currentStock: nextStock });
    }

    await updateConfig("requests", { ...reqRow, status: "approved" });
    refreshAllConfigs();
    handleNew();
  }

  // Filter requests by status
  const filteredRequests = useMemo(() => {
    return requestsList.filter(r => {
      const matchesSearch = !search ||
        r.requestCode?.includes(search) ||
        r.requesterName?.includes(search) ||
        r.department?.includes(search);
      
      const rStatus = r.status || "pending";
      const matchesStatus = requestFilter === "all" ||
        (requestFilter === "pending" && rStatus === "pending") ||
        (requestFilter === "approved" && rStatus === "approved");

      return matchesSearch && matchesStatus;
    });
  }, [requestsList, search, requestFilter]);

  const requestsContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveRequest} disabled={!form.requestCode || !form.itemCode || !form.quantity} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره درخواست
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" /> درخواست جدید
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("requests")} disabled={!selectedId} className="text-destructive gap-1">
            <Trash2 className="h-4 w-4" /> حذف درخواست
          </Button>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">✓ با موفقیت ذخیره شد</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-3" dir="rtl">
        {/* فرم ثبت درخواست */}
        <Card className="md:col-span-2 text-right">
          <CardContent className="pt-5 px-6 pb-5 space-y-4">
            <h3 className="text-sm font-bold text-primary mb-2">ثبت تقاضای جدید کالا</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">کد درخواست</Label>
                <Input value={form.requestCode || ""} onChange={e => setField("requestCode", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="REQ-003" />
              </div>

              <div>
                <Label className="text-xs font-semibold">انتخاب پرسنل متقاضی</Label>
                <SearchableSelect
                  value={form.employeeCode}
                  onChange={v => {
                    const emp = employees.find(e => e.code === v);
                    setField("employeeCode", v);
                    if (emp) {
                      setField("requesterName", emp.name);
                      setField("department", emp.department);
                    }
                  }}
                  options={employeeOptions}
                  placeholder="جستجو و انتخاب پرسنل..."
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">نام درخواست‌کننده</Label>
                <Input value={form.requesterName || ""} onChange={e => setField("requesterName", e.target.value)} className="h-9 text-sm mt-1" placeholder="نام پرسنل" />
              </div>

              <div>
                <Label className="text-xs font-semibold">واحد سازمانی</Label>
                <Input value={form.department || ""} onChange={e => setField("department", e.target.value)} className="h-9 text-sm mt-1" placeholder="مثال: حسابداری" />
              </div>

              <div>
                <Label className="text-xs font-semibold font-bold text-emerald-700">انتخاب کالا</Label>
                <SearchableSelect value={form.itemCode} onChange={v => setField("itemCode", v)} options={itemsOptions} placeholder="کد یا نام کالا..." />
              </div>

              <div>
                <Label className="text-xs font-semibold font-bold text-emerald-700">تعداد مورد نیاز</Label>
                <Input type="number" value={form.quantity || ""} onChange={e => setField("quantity", Number(e.target.value))} className="h-9 text-sm mt-1 font-mono text-left" placeholder="0" />
              </div>

              <div>
                <Label className="text-xs font-semibold">تاریخ درخواست</Label>
                <PersianDatePicker value={form.date || ""} onChange={e => setField("date", e.target.value)} placeholder="۱۴۰۳/۰۴/۰۱" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* پنل تایید نهایی درخواست‌ها (جای جدا در فرم) */}
        <Card className="text-right border-l-4 border-l-emerald-500">
          <CardContent className="pt-5 px-6 pb-5 space-y-4">
            <h3 className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 justify-end">
              پنل تایید نهایی درخواست‌ها
              <CheckCircle2 className="h-4 w-4" />
            </h3>
            {form.requestCode && form.status !== "approved" ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="rounded-lg bg-emerald-50/50 p-3 border border-emerald-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">کد درخواست:</span>
                    <span className="font-mono font-bold text-foreground">{form.requestCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">متقاضی:</span>
                    <span className="font-semibold text-foreground">{form.requesterName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">کالا:</span>
                    <span className="font-semibold text-foreground">
                      {itemsList.find(i => i.code === form.itemCode)?.name || form.itemCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تعداد تقاضا:</span>
                    <span className="font-bold text-emerald-700">{form.quantity} عدد</span>
                  </div>
                </div>
                <Button onClick={() => handleApproveRequest(form)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 h-10 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" /> تایید نهایی و خروج از انبار
                </Button>
              </div>
            ) : form.requestCode && form.status === "approved" ? (
              <div className="py-6 text-center text-xs text-emerald-600 font-semibold space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mx-auto text-emerald-600">✓</div>
                <p>این درخواست قبلاً تایید نهایی شده است</p>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                یک درخواست از لیست زیر انتخاب کنید تا دکمه تایید نهایی ظاهر شود
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* لیست درخواست‌ها با قابلیت فیلترینگ */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-b pb-3" dir="rtl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="جستجو در درخواست‌ها..." className="max-w-xs h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {[
                { key: "all", label: "همه درخواست‌ها" },
                { key: "pending", label: "در انتظار تایید" },
                { key: "approved", label: "تایید شده" },
              ].map(tab => (
                <Button key={tab.key} variant={requestFilter === tab.key ? "secondary" : "ghost"} size="sm" onClick={() => setRequestFilter(tab.key)} className="h-7 text-xs px-2.5">
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">کد درخواست</TableHead>
                <TableHead className="text-right">درخواست‌کننده</TableHead>
                <TableHead className="text-right">واحد سازمانی</TableHead>
                <TableHead className="text-right">کالا</TableHead>
                <TableHead className="text-right">تعداد کالا</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">وضعیت تایید</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">درخواستی یافت نشد</TableCell>
                </TableRow>
              ) : filteredRequests.map(row => {
                const itm = itemsList.find(i => i.code === row.itemCode);
                const rStatus = row.status || "pending";
                return (
                  <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                    <TableCell className="font-mono text-xs font-semibold">{row.requestCode}</TableCell>
                    <TableCell className="text-sm font-semibold">{row.requesterName}</TableCell>
                    <TableCell className="text-xs">{row.department || "—"}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {itm ? itm.name : row.itemCode}
                      <span className="block text-[10px] text-muted-foreground font-mono">{row.itemCode}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-600">{row.quantity}</TableCell>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium",
                        rStatus === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-amber-100 text-amber-700 border-amber-300"
                      )}>
                        {rStatus === "approved" ? "تایید نهایی شده" : "در انتظار تایید"}
                      </Badge>
                    </TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── 6. TRANSFERS VIEW (انتقال بین انبارها) ────────────────────────────────
  const transfersList = transfers || [];
  const [transferFilter, setTransferFilter] = useState("all");

  async function handleSaveTransfer() {
    if (!form.transferCode || !form.itemCode || !form.quantity || !form.fromStoreCode || !form.toStoreCode) return;

    const payload = {
      ...form,
      status: form.status || "pending"
    };

    await handleSaveConfig("transfers", payload);
  }

  async function handleConfirmTransfer(trRow) {
    // Optional: Adjust stock levels if origin/destination stocks are fully managed
    await updateConfig("transfers", { ...trRow, status: "confirmed" });
    refreshAllConfigs();
    handleNew();
  }

  // Filter transfers by status
  const filteredTransfers = useMemo(() => {
    return transfersList.filter(t => {
      const matchesSearch = !search ||
        t.transferCode?.includes(search) ||
        t.itemCode?.includes(search) ||
        t.fromStoreCode?.includes(search) ||
        t.toStoreCode?.includes(search);
      
      const tStatus = t.status || "pending";
      const matchesStatus = transferFilter === "all" ||
        (transferFilter === "pending" && tStatus === "pending") ||
        (transferFilter === "confirmed" && tStatus === "confirmed");

      return matchesSearch && matchesStatus;
    });
  }, [transfersList, search, transferFilter]);

  const transfersContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSaveTransfer} disabled={!form.transferCode || !form.itemCode || !form.quantity || !form.fromStoreCode || !form.toStoreCode} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ثبت انتقال
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" /> انتقال جدید
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("transfers")} disabled={!selectedId} className="text-destructive gap-1">
            <Trash2 className="h-4 w-4" /> لغو انتقال
          </Button>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">✓ با موفقیت ذخیره شد</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-3" dir="rtl">
        {/* فرم ثبت جابجایی بین انبارها */}
        <Card className="md:col-span-2 text-right">
          <CardContent className="pt-5 px-6 pb-5 space-y-4">
            <h3 className="text-sm font-bold text-primary mb-2">ثبت حواله انتقال جدید</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">کد سند انتقال</Label>
                <Input value={form.transferCode || ""} onChange={e => setField("transferCode", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="TR-002" />
              </div>

              <div>
                <Label className="text-xs font-semibold font-bold text-emerald-700">انتخاب کالا</Label>
                <SearchableSelect value={form.itemCode} onChange={v => setField("itemCode", v)} options={itemsOptions} placeholder="کد یا نام کالا..." />
              </div>

              <div>
                <Label className="text-xs font-semibold text-blue-700">انبار مبدا (فرستنده)</Label>
                <SearchableSelect value={form.fromStoreCode} onChange={v => setField("fromStoreCode", v)} options={storesOptions} placeholder="از کدام انبار..." />
              </div>

              <div>
                <Label className="text-xs font-semibold text-blue-700">انبار مقصد (گیرنده)</Label>
                <SearchableSelect value={form.toStoreCode} onChange={v => setField("toStoreCode", v)} options={storesOptions} placeholder="به کدام انبار..." />
              </div>

              <div>
                <Label className="text-xs font-semibold font-bold text-emerald-700">تعداد انتقال</Label>
                <Input type="number" value={form.quantity || ""} onChange={e => setField("quantity", Number(e.target.value))} className="h-9 text-sm mt-1 font-mono text-left" placeholder="0" />
              </div>

              <div>
                <Label className="text-xs font-semibold">تاریخ انتقال</Label>
                <PersianDatePicker value={form.date || ""} onChange={e => setField("date", e.target.value)} placeholder="۱۴۰۳/۰۴/۰۱" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* پنل تایید دریافت انتقالات (جای جدا در فرم) */}
        <Card className="text-right border-l-4 border-l-blue-500">
          <CardContent className="pt-5 px-6 pb-5 space-y-4">
            <h3 className="text-sm font-bold text-blue-700 flex items-center gap-1.5 justify-end">
              پنل تایید دریافت کالا
              <ArrowLeftRight className="h-4 w-4" />
            </h3>
            {form.transferCode && form.status !== "confirmed" ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="rounded-lg bg-blue-50/50 p-3 border border-blue-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">کد انتقال:</span>
                    <span className="font-mono font-bold text-foreground">{form.transferCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">کالا:</span>
                    <span className="font-semibold text-foreground">
                      {itemsList.find(i => i.code === form.itemCode)?.name || form.itemCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تعداد انتقالی:</span>
                    <span className="font-bold text-blue-700">{form.quantity} عدد</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">از انبار مبدا:</span>
                    <span className="font-semibold text-foreground">
                      {storesList.find(s => s.code === form.fromStoreCode)?.name || form.fromStoreCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">به انبار مقصد:</span>
                    <span className="font-bold text-emerald-700">
                      {storesList.find(s => s.code === form.toStoreCode)?.name || form.toStoreCode}
                    </span>
                  </div>
                </div>
                <Button onClick={() => handleConfirmTransfer(form)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 h-10 shadow-sm">
                  <CheckCircle2 className="h-4 w-4" /> تایید نهایی دریافت کالا در انبار مقصد
                </Button>
              </div>
            ) : form.transferCode && form.status === "confirmed" ? (
              <div className="py-6 text-center text-xs text-emerald-600 font-semibold space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mx-auto text-emerald-600">✓</div>
                <p>دریافت این انتقال قبلاً تایید و ثبت نهایی شده است</p>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                یک انتقال را از لیست زیر انتخاب کنید تا دکمه تایید نهایی ظاهر شود
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* لیست انتقالات با قابلیت فیلترینگ */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-b pb-3" dir="rtl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="جستجو در انتقالات..." className="max-w-xs h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-1.5">
              {[
                { key: "all", label: "همه جابجایی‌ها" },
                { key: "pending", label: "در حال انتقال" },
                { key: "confirmed", label: "تایید دریافت شده" },
              ].map(tab => (
                <Button key={tab.key} variant={transferFilter === tab.key ? "secondary" : "ghost"} size="sm" onClick={() => setTransferFilter(tab.key)} className="h-7 text-xs px-2.5">
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">کد انتقال</TableHead>
                <TableHead className="text-right">کالا</TableHead>
                <TableHead className="text-right">انبار مبدا</TableHead>
                <TableHead className="text-right">انبار مقصد</TableHead>
                <TableHead className="text-right">تعداد انتقالی</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
                <TableHead className="text-right">وضعیت دریافت</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">سند انتقالی یافت نشد</TableCell>
                </TableRow>
              ) : filteredTransfers.map(row => {
                const itm = itemsList.find(i => i.code === row.itemCode);
                const sourceStr = storesList.find(s => s.code === row.fromStoreCode);
                const targetStr = storesList.find(s => s.code === row.toStoreCode);
                const tStatus = row.status || "pending";
                return (
                  <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                    <TableCell className="font-mono text-xs font-semibold">{row.transferCode}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {itm ? itm.name : row.itemCode}
                      <span className="block text-[10px] text-muted-foreground font-mono">{row.itemCode}</span>
                    </TableCell>
                    <TableCell className="text-xs">{sourceStr ? sourceStr.name : row.fromStoreCode}</TableCell>
                    <TableCell className="text-xs text-blue-600 font-semibold">{targetStr ? targetStr.name : row.toStoreCode}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{row.quantity}</TableCell>
                    <TableCell className="font-mono text-xs">{row.date}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs font-medium",
                        tStatus === "confirmed" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : "bg-amber-100 text-amber-700 border-amber-300"
                      )}>
                        {tStatus === "confirmed" ? "دریافت شده" : "در حال انتقال"}
                      </Badge>
                    </TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── 7. INVENTORY VIEW (انبارگردانی و شمارش) ────────────────────────────────
  const auditsList = audits || [];
  const activeAudit = useMemo(() => auditsList.find(a => a.status === "pending"), [auditsList]);
  const [invSubTab, setInvSubTab] = useState("active");
  
  // Forms states
  const [newAudit, setNewAudit] = useState({ auditCode: "", title: "", storeCode: "", date: "" });
  const [countForm, setCountForm] = useState({ itemCode: "", countedQty: 0, auditor: "" });
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const selectedHistoryAudit = useMemo(() => {
    return auditsList.find(a => (a._id || a.id) === selectedHistoryId);
  }, [auditsList, selectedHistoryId]);

  async function handleStartAudit() {
    if (!newAudit.auditCode || !newAudit.title || !newAudit.storeCode) return;
    const payload = {
      ...newAudit,
      status: "pending",
      counts: []
    };
    await handleSaveConfig("audits", payload);
    setNewAudit({ auditCode: "", title: "", storeCode: "", date: "" });
  }

  async function handleAddCount() {
    if (!activeAudit || !countForm.itemCode || countForm.countedQty === undefined) return;
    const targetItem = itemsList.find(i => i.code === countForm.itemCode);
    const systemQty = targetItem ? targetItem.currentStock : 0;
    const discrepancy = Number(countForm.countedQty) - systemQty;

    const newCountRecord = {
      itemCode: countForm.itemCode,
      itemName: targetItem ? targetItem.name : countForm.itemCode,
      systemQty,
      countedQty: Number(countForm.countedQty),
      discrepancy,
      // Resolve the employee name from the code for storage/display in table
      auditorCode: countForm.auditor,
      auditor: (() => { const emp = (employees || []).find(e => e.code === countForm.auditor); return emp ? emp.name : (countForm.auditor || "مسئول سیستم"); })()
    };

    const updatedCounts = [...(activeAudit.counts || [])];
    const existingIdx = updatedCounts.findIndex(c => c.itemCode === countForm.itemCode);
    if (existingIdx > -1) {
      updatedCounts[existingIdx] = newCountRecord;
    } else {
      updatedCounts.push(newCountRecord);
    }

    const payload = {
      ...activeAudit,
      counts: updatedCounts
    };

    await updateConfig("audits", payload);
    refreshAllConfigs();
    setCountForm({ itemCode: "", countedQty: 0, auditor: "" });
  }

  async function handleCloseAudit() {
    if (!activeAudit) return;
    
    // Auto adjust stock (تعدیل کاردکس انبار)
    const auditCounts = activeAudit.counts || [];
    for (const c of auditCounts) {
      const targetItem = itemsList.find(i => i.code === c.itemCode);
      if (targetItem) {
        await updateConfig("items", {
          ...targetItem,
          currentStock: c.countedQty
        });
      }
    }

    const payload = {
      ...activeAudit,
      status: "completed",
      closedDate: activeAudit.date || "۱۴۰۳/۰۴/۱۸"
    };

    await updateConfig("audits", payload);
    refreshAllConfigs();
    handleNew();
  }

  const inventoryContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ساب‌تب‌های انبارگردانی */}
      <div className="flex gap-2 border-b pb-2 justify-end" dir="rtl">
        <Button variant={invSubTab === "active" ? "secondary" : "ghost"} size="sm" onClick={() => setInvSubTab("active")} className="text-xs">
          دوره فعال انبارگردانی
        </Button>
        <Button variant={invSubTab === "history" ? "secondary" : "ghost"} size="sm" onClick={() => setInvSubTab("history")} className="text-xs">
          تاریخچه دوره‌های قبلی (آرشیو)
        </Button>
      </div>

      {invSubTab === "active" ? (
        activeAudit ? (
          /* اگر انبارگردانی فعال وجود دارد */
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3" dir="rtl">
              {/* فرم ثبت شمارش اقلام */}
              <Card className="md:col-span-2 text-right">
                <CardContent className="pt-5 px-6 pb-5 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-sm font-bold text-purple-700">ثبت شمارش کالای فیزیکی در دوره فعال</h3>
                    <Badge className="bg-amber-100 text-amber-700 font-mono text-xs">{activeAudit.title}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">انتخاب کالا</Label>
                      <SearchableSelect
                        value={countForm.itemCode}
                        onChange={v => setCountForm(cf => ({ ...cf, itemCode: v }))}
                        options={itemsOptions}
                        placeholder="کالا را انتخاب کنید..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">تعداد شمارش شده فیزیکی</Label>
                      <Input
                        type="number"
                        value={countForm.countedQty || ""}
                        onChange={e => setCountForm(cf => ({ ...cf, countedQty: Number(e.target.value) }))}
                        className="h-9 text-sm mt-1 font-mono text-left"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">نام شمارش‌کننده (مغایرت‌گیر)</Label>
                      <SearchableSelect
                        value={countForm.auditor}
                        onChange={v => {
                          // Store the employee code so the dropdown can find it in options
                          setCountForm(cf => ({ ...cf, auditor: v }));
                        }}
                        options={employeeOptions}
                        placeholder="انتخاب پرسنل..."
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddCount} disabled={!countForm.itemCode || countForm.countedQty === undefined} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 gap-1">
                        <Plus className="h-4 w-4" /> ثبت شمارش کالا
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* پنل بستن و تعدیل کاردکس */}
              <Card className="text-right border-l-4 border-l-purple-500">
                <CardContent className="pt-5 px-6 pb-5 space-y-4">
                  <h3 className="text-sm font-bold text-purple-700 flex items-center gap-1.5 justify-end">
                    تعدیل موجودی و بستن دوره
                    <ShieldCheck className="h-4 w-4" />
                  </h3>
                  <div className="rounded-lg bg-purple-50/50 p-3 border border-purple-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">کد دوره:</span>
                      <span className="font-mono font-bold">{activeAudit.auditCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">انبار مورد بررسی:</span>
                      <span className="font-semibold">{storesList.find(s => s.code === activeAudit.storeCode)?.name || activeAudit.storeCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">تعداد ردیف‌های شمارش شده:</span>
                      <span className="font-bold text-purple-700">{activeAudit.counts?.length || 0} کالا</span>
                    </div>
                  </div>
                  <Button onClick={handleCloseAudit} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 shadow-sm">
                    ثبت نهایی و تعدیل خودکار کاردکس انبار
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* گزارش مغایرت انبارگردانی فعال */}
            <Card>
              <CardContent className="pt-4 text-right">
                <h3 className="text-sm font-bold text-primary mb-3">گزارش مغایرت و شمارش اقلام (دوره فعال)</h3>
                <Table dir="rtl">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right">کد کالا</TableHead>
                      <TableHead className="text-right">نام کالا</TableHead>
                      <TableHead className="text-right font-mono">موجودی کاردکس (سیستم)</TableHead>
                      <TableHead className="text-right font-mono">موجودی شمارش شده فیزیکی</TableHead>
                      <TableHead className="text-right font-mono">مغایرت (تفاضل)</TableHead>
                      <TableHead className="text-right">وضعیت مغایرت</TableHead>
                      <TableHead className="text-right">شمارش‌کننده</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(activeAudit.counts || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground text-sm">هیچ کالایی شمارش نشده است. از فرم بالا برای ثبت اولین مورد استفاده کنید.</TableCell>
                      </TableRow>
                    ) : activeAudit.counts.map(row => (
                      <TableRow key={row.itemCode}>
                        <TableCell className="font-mono text-xs font-semibold">{row.itemCode}</TableCell>
                        <TableCell className="text-sm font-medium">{row.itemName}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.systemQty}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-purple-700">{row.countedQty}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold">
                          <span className={row.discrepancy < 0 ? "text-rose-600" : row.discrepancy > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                            {row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs",
                            row.discrepancy === 0 && "bg-emerald-100 text-emerald-700 border-emerald-300",
                            row.discrepancy < 0 && "bg-rose-100 text-rose-700 border-rose-300",
                            row.discrepancy > 0 && "bg-blue-100 text-blue-700 border-blue-300"
                          )}>
                            {row.discrepancy === 0 ? "منطبق" : row.discrepancy < 0 ? "کسری انبار" : "مازاد انبار"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.auditor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* شروع دوره جدید انبارگردانی */
          <Card className="text-right">
            <CardContent className="pt-5 px-6 pb-5 space-y-4">
              <h3 className="text-sm font-bold text-primary mb-2">شروع دوره جدید انبارگردانی</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label className="text-xs font-semibold">کد دوره انبارگردانی</Label>
                  <Input
                    value={newAudit.auditCode}
                    onChange={e => setNewAudit(na => ({ ...na, auditCode: e.target.value }))}
                    className="h-9 text-sm mt-1 font-mono text-left"
                    placeholder="AUD-1403-01"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold font-bold text-emerald-700">عنوان دوره انبارگردانی</Label>
                  <Input
                    value={newAudit.title}
                    onChange={e => setNewAudit(na => ({ ...na, title: e.target.value }))}
                    className="h-9 text-sm mt-1"
                    placeholder="انبارگردانی پایان سال ۱۴۰۳"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold font-bold text-emerald-700">انبار مورد نظر</Label>
                  <SearchableSelect
                    value={newAudit.storeCode}
                    onChange={v => setNewAudit(na => ({ ...na, storeCode: v }))}
                    options={storesOptions}
                    placeholder="انتخاب انبار..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">تاریخ شروع</Label>
                  <PersianDatePicker
                    value={newAudit.date}
                    onChange={e => setNewAudit(na => ({ ...na, date: e.target.value }))}
                    placeholder="۱۴۰۳/۱۲/۲۹"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleStartAudit} disabled={!newAudit.auditCode || !newAudit.title || !newAudit.storeCode} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9">
                  ایجاد و شروع دوره انبارگردانی
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        /* آرشیو و تاریخچه دوره‌های قبلی */
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3" dir="rtl">
            <Card className="md:col-span-1 text-right">
              <CardContent className="pt-4">
                <h3 className="text-xs font-bold text-primary mb-3">لیست دوره‌های پایان‌یافته</h3>
                <div className="space-y-2">
                  {auditsList.filter(a => a.status === "completed").length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">هیچ دوره‌ای در آرشیو یافت نشد</p>
                  ) : auditsList.filter(a => a.status === "completed").map(a => (
                    <div
                      key={a._id || a.id}
                      onClick={() => setSelectedHistoryId(a._id || a.id)}
                      className={cn("p-3 rounded-lg border cursor-pointer transition-colors text-xs text-right",
                        selectedHistoryId === (a._id || a.id) ? "bg-primary/5 border-primary font-semibold" : "hover:bg-muted/50 border-input"
                      )}
                    >
                      <div className="flex justify-between font-semibold mb-1">
                        <span>{a.title}</span>
                        <span className="font-mono text-muted-foreground">{a.auditCode}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>انبار: {storesList.find(s => s.code === a.storeCode)?.name || a.storeCode}</span>
                        <span>تاریخ بستن: {a.closedDate || a.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 text-right">
              <CardContent className="pt-4">
                <h3 className="text-xs font-bold text-primary mb-3">جزئیات شمارش و مغایرت‌های دوره انتخاب شده</h3>
                {selectedHistoryAudit ? (
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-right">کد کالا</TableHead>
                        <TableHead className="text-right">نام کالا</TableHead>
                        <TableHead className="text-right font-mono">سیستم (قبل تعدیل)</TableHead>
                        <TableHead className="text-right font-mono">فیزیکی (تعدیل شده)</TableHead>
                        <TableHead className="text-right font-mono">مغایرت</TableHead>
                        <TableHead className="text-right">شمارش‌کننده</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedHistoryAudit.counts || []).map(row => (
                        <TableRow key={row.itemCode}>
                          <TableCell className="font-mono text-xs font-semibold">{row.itemCode}</TableCell>
                          <TableCell className="text-xs font-medium">{row.itemName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{row.systemQty}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-purple-700">{row.countedQty}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">
                            <span className={row.discrepancy < 0 ? "text-rose-600" : row.discrepancy > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                              {row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                            </span>
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{row.auditor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-xs text-muted-foreground py-12 text-center">یک دوره از لیست سمت راست انتخاب کنید تا مغایرت‌های آرشیوی آن نمایش داده شود.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  // ─── 8. SUPPLIERS VIEW ─────────────────────────────────────────────────────
  const suppliersList = suppliers || [];
  const filteredSuppliers = suppliersList.filter(s => !search || s.name?.includes(search) || s.code?.includes(search));

  const suppliersContent = (
    <div className="space-y-4">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleSaveConfig("suppliers", form)} disabled={!form.code || !form.name} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره تامین‌کننده
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1"><Plus className="h-4 w-4" /> تامین‌کننده جدید</Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("suppliers")} disabled={!selectedId} className="text-destructive gap-1"><Trash2 className="h-4 w-4" /> حذف</Button>
        </div>
        {saved && <span className="text-xs text-emerald-600">✓ با موفقیت ذخیره شد</span>}
      </div>

      <Card>
        <CardContent className="pt-4 grid grid-cols-2 gap-4 md:grid-cols-4 text-right" dir="rtl">
          <div>
            <Label className="text-xs font-semibold">کد تامین‌کننده</Label>
            <Input value={form.code || ""} onChange={e => setField("code", e.target.value)} className="h-8 text-sm mt-1 font-mono" placeholder="S-03" />
          </div>
          <div>
            <Label className="text-xs font-semibold">نام تامین‌کننده</Label>
            <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} className="h-8 text-sm mt-1" placeholder="..." />
          </div>
          <div>
            <Label className="text-xs font-semibold">شماره تماس</Label>
            <Input value={form.tel || ""} onChange={e => setField("tel", e.target.value)} className="h-8 text-sm mt-1 font-mono" placeholder="۰۲۱..." />
          </div>
          <div>
            <Label className="text-xs font-semibold">مدیر مسئول</Label>
            <Input value={form.manager || ""} onChange={e => setField("manager", e.target.value)} className="h-8 text-sm mt-1" placeholder="..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">کد</TableHead>
                <TableHead className="text-right">نام تامین‌کننده</TableHead>
                <TableHead className="text-right">تلفن</TableHead>
                <TableHead className="text-right">مدیر مسئول</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map(row => (
                <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell className="font-semibold text-sm">{row.name}</TableCell>
                  <TableCell className="font-mono text-xs">{row.tel || "—"}</TableCell>
                  <TableCell className="text-xs">{row.manager || "—"}</TableCell>
                  <TableCell><Pencil className="h-3 w-3 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  // ─── 9. REPORTS VIEW (گزارش‌های انبار) ─────────────────────────────────────
  const [reportType, setReportType] = useState("stock");

  const reportTitle = useMemo(() => {
    if (reportType === "stock") return "گزارش موجودی لحظه‌ای انبارها";
    if (reportType === "critical") return "گزارش کالاهای کمتر از نقطه سفارش (بحرانی)";
    if (reportType === "turnover") return "گزارش گردش کالا (کاردکس انبار)";
    if (reportType === "transfers") return "گزارش جابجایی بین انبارها";
    return "گزارش انبار";
  }, [reportType]);

  const reportContent = (
    <div className="space-y-4">
      <div className="flex gap-2 border-b pb-2 mb-2 justify-end" dir="rtl">
        {[
          { key: "stock", label: "موجودی لحظه‌ای", icon: Package },
          { key: "critical", label: "کالاهای بحرانی (نقطه سفارش)", icon: AlertTriangle },
          { key: "turnover", label: "گردش ورود و خروج", icon: ClipboardList },
          { key: "transfers", label: "جابجایی بین انبارها", icon: ArrowLeftRight },
        ].map(btn => (
          <Button key={btn.key} variant={reportType === btn.key ? "default" : "outline"} size="sm" onClick={() => setReportType(btn.key)} className="gap-1 text-xs">
            <btn.icon className="h-3.5 w-3.5" /> {btn.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-4">
          <h2 className="text-sm font-bold text-right text-primary mb-4" dir="rtl">{reportTitle}</h2>
          
          {reportType === "stock" && (
            <Table dir="rtl">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right">کد کالا</TableHead>
                  <TableHead className="text-right">نام کالا</TableHead>
                  <TableHead className="text-right">دسته‌بندی</TableHead>
                  <TableHead className="text-right">موجودی فعلی</TableHead>
                  <TableHead className="text-right">واحد</TableHead>
                  <TableHead className="text-left">قیمت خرید (ریال)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsList.map(row => (
                  <TableRow key={row._id || row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-semibold text-sm">{row.name}</TableCell>
                    <TableCell className="text-xs">{row.category || "—"}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-700">{row.currentStock}</TableCell>
                    <TableCell className="text-xs">{row.unit || "عدد"}</TableCell>
                    <TableCell className="font-mono text-xs text-left">{row.price?.toLocaleString("fa-IR") || "۰"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportType === "critical" && (
            <Table dir="rtl">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right">کد کالا</TableHead>
                  <TableHead className="text-right">نام کالا</TableHead>
                  <TableHead className="text-right">موجودی فعلی</TableHead>
                  <TableHead className="text-right">حداقل مورد نیاز (نقطه بحران)</TableHead>
                  <TableHead className="text-right">کسری انبار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsList.filter(i => i.currentStock <= i.minStock).map(row => (
                  <TableRow key={row._id || row.id}>
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell className="font-semibold text-sm text-rose-600">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-rose-700">{row.currentStock}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{row.minStock}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-rose-600">
                      {Math.max(0, row.minStock - row.currentStock)} {row.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {reportType === "turnover" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-right text-emerald-700" dir="rtl">تاریخچه رسیدها (ورود کالا)</h3>
              <Table dir="rtl">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">رسید</TableHead>
                    <TableHead className="text-right">نوع رسید</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">کالا</TableHead>
                    <TableHead className="text-right">تعداد</TableHead>
                    <TableHead className="text-right">فرستنده</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiptsList.map(row => {
                    const itm = itemsList.find(i => i.code === row.itemCode);
                    const rType = row.type || "purchase";
                    return (
                      <TableRow key={row._id || row.id}>
                        <TableCell className="font-mono text-xs">{row.receiptCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{rType === "purchase" ? "خرید" : rType === "return" ? "برگشت" : "انتقال"}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.date}</TableCell>
                        <TableCell className="text-xs font-semibold">{itm ? itm.name : row.itemCode}</TableCell>
                        <TableCell className="font-mono text-xs text-emerald-700 font-bold">+{row.quantity}</TableCell>
                        <TableCell className="text-xs">{row.supplier || row.returningDept || row.sourceStoreCode || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <h3 className="text-xs font-bold text-right text-rose-700 mt-6" dir="rtl">تاریخچه حواله‌ها (خروج کالا)</h3>
              <Table dir="rtl">
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">حواله</TableHead>
                    <TableHead className="text-right">نوع حواله</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">کالا</TableHead>
                    <TableHead className="text-right">تعداد</TableHead>
                    <TableHead className="text-right">گیرنده</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issuesList.map(row => {
                    const itm = itemsList.find(i => i.code === row.itemCode);
                    const iType = row.type || "consumption";
                    return (
                      <TableRow key={row._id || row.id}>
                        <TableCell className="font-mono text-xs">{row.issueCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{iType === "consumption" ? "مصرف" : iType === "delivery" ? "تحویل" : "اسقاط"}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.date}</TableCell>
                        <TableCell className="text-xs font-semibold">{itm ? itm.name : row.itemCode}</TableCell>
                        <TableCell className="font-mono text-xs text-rose-600 font-bold">-{row.quantity}</TableCell>
                        <TableCell className="text-xs">{row.recipient || row.department || row.scrapReason || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {reportType === "transfers" && (
            <Table dir="rtl">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right">کد انتقال</TableHead>
                  <TableHead className="text-right">تاریخ جابجایی</TableHead>
                  <TableHead className="text-right">کالا</TableHead>
                  <TableHead className="text-right">انبار مبدا</TableHead>
                  <TableHead className="text-right">انبار مقصد</TableHead>
                  <TableHead className="text-right">تعداد</TableHead>
                  <TableHead className="text-right">وضعیت تایید</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfersList.map(row => {
                  const itm = itemsList.find(i => i.code === row.itemCode);
                  const sourceStr = storesList.find(s => s.code === row.fromStoreCode);
                  const targetStr = storesList.find(s => s.code === row.toStoreCode);
                  return (
                    <TableRow key={row._id || row.id}>
                      <TableCell className="font-mono text-xs">{row.transferCode}</TableCell>
                      <TableCell className="font-mono text-xs">{row.date}</TableCell>
                      <TableCell className="text-sm font-semibold">{itm ? itm.name : row.itemCode}</TableCell>
                      <TableCell className="text-xs">{sourceStr ? sourceStr.name : row.fromStoreCode}</TableCell>
                      <TableCell className="text-xs text-blue-600 font-semibold">{targetStr ? targetStr.name : row.toStoreCode}</TableCell>
                      <TableCell className="font-mono text-xs">{row.quantity}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", row.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                          {row.status === "confirmed" ? "تایید شده" : "در حال انتقال"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── 8. EMPLOYEES VIEW (تعریف کارکنان) ──────────────────────────────────────
  const filteredEmployees = (employees || []).filter(e => !search || e.name?.includes(search) || e.code?.includes(search) || e.role?.includes(search) || e.department?.includes(search));

  const employeesContent = (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex gap-2 justify-between items-center" dir="rtl">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleSaveConfig("employees", form)} disabled={!form.code || !form.name} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Save className="h-4 w-4" /> ذخیره کارمند
          </Button>
          <Button variant="outline" size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" /> کارمند جدید
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDeleteConfig("employees")} disabled={!selectedId} className="text-destructive gap-1">
            <Trash2 className="h-4 w-4" /> حذف کارمند
          </Button>
        </div>
        {saved && <span className="text-xs text-emerald-600 font-medium">✓ با موفقیت ذخیره شد</span>}
      </div>

      <Card>
        <CardContent className="pt-5 px-6 pb-5 space-y-4 text-right" dir="rtl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label className="text-xs font-semibold font-bold text-emerald-700">کد پرسنلی</Label>
              <Input value={form.code || ""} onChange={e => setField("code", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="EMP-004" />
            </div>
            <div>
              <Label className="text-xs font-semibold font-bold text-emerald-700">نام و نام خانوادگی</Label>
              <Input value={form.name || ""} onChange={e => setField("name", e.target.value)} className="h-9 text-sm mt-1" placeholder="زهرا علوی" />
            </div>
            <div>
              <Label className="text-xs font-semibold font-bold text-emerald-700">سمت / شغل</Label>
              <Input value={form.role || ""} onChange={e => setField("role", e.target.value)} className="h-9 text-sm mt-1" placeholder="انباردار" />
            </div>
            <div>
              <Label className="text-xs font-semibold font-bold text-emerald-700">واحد سازمانی</Label>
              <Input value={form.department || ""} onChange={e => setField("department", e.target.value)} className="h-9 text-sm mt-1" placeholder="پشتیبانی" />
            </div>
            <div>
              <Label className="text-xs font-semibold">کد ملی</Label>
              <Input value={form.nationalId || ""} onChange={e => setField("nationalId", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="0012345678" />
            </div>
            <div>
              <Label className="text-xs font-semibold">شماره همراه</Label>
              <Input value={form.phone || ""} onChange={e => setField("phone", e.target.value)} className="h-9 text-sm mt-1 font-mono text-left" placeholder="09123456789" />
            </div>
            <div>
              <Label className="text-xs font-semibold">وضعیت اشتغال</Label>
              <select
                value={form.status || "active"}
                onChange={e => setField("status", e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
              >
                <option value="active">شاغل (فعال)</option>
                <option value="inactive">غیرفعال / قطع همکاری</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">توضیحات</Label>
              <Input value={form.note || ""} onChange={e => setField("note", e.target.value)} className="h-9 text-sm mt-1" placeholder="توضیحات اختیاری..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex justify-between items-center gap-3 border-b pb-3" dir="rtl">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="جستجو در پرسنل..." className="max-w-xs h-8 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <Table dir="rtl">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right">کد پرسنلی</TableHead>
                <TableHead className="text-right">نام و نام خانوادگی</TableHead>
                <TableHead className="text-right">سمت / شغل</TableHead>
                <TableHead className="text-right">واحد سازمانی</TableHead>
                <TableHead className="text-right">کد ملی</TableHead>
                <TableHead className="text-right">شماره همراه</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground text-sm">کارمندی یافت نشد</TableCell>
                </TableRow>
              ) : filteredEmployees.map(row => (
                <TableRow key={row._id || row.id} onClick={() => { setSelectedId(row._id || row.id); setForm(row); }} className={cn("cursor-pointer hover:bg-muted/40", selectedId === (row._id || row.id) && "bg-primary/10")}>
                  <TableCell className="font-mono text-xs font-semibold">{row.code}</TableCell>
                  <TableCell className="text-sm font-semibold">{row.name}</TableCell>
                  <TableCell className="text-xs font-semibold text-blue-700">{row.role || "—"}</TableCell>
                  <TableCell className="text-xs">{row.department || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.nationalId || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{row.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "inactive" ? "destructive" : "success"}>
                      {row.status === "inactive" ? "غیرفعال" : "فعال"}
                    </Badge>
                  </TableCell>
                  <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PageShell>
      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline">سیستم انبار</span>
        <span>/</span>
        <span>{meta.title}</span>
      </div>

      <div className="mb-4 flex items-center justify-between" dir="rtl">
        <div className="text-right">
          <h1 className="text-xl font-bold flex items-center gap-2 justify-end">
            {meta.title}
            <ViewIcon className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
        </div>
      </div>

      {activeView === "items" && itemsContent}
      {activeView === "stores" && storesContent}
      {activeView === "receipts" && receiptsContent}
      {activeView === "issues" && issuesContent}
      {activeView === "requests" && requestsContent}
      {activeView === "transfers" && transfersContent}
      {activeView === "inventory" && inventoryContent}
      {activeView === "suppliers" && suppliersContent}
      {activeView === "employees" && employeesContent}
      {activeView === "reports" && reportContent}
    </PageShell>
  );
}
