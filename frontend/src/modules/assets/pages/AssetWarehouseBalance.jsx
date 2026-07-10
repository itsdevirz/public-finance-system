import { useState, useMemo } from "react";
import { Search, Printer, Download, Eye, Table as TableIcon, Calendar, Filter, X } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { useInventory } from "@/context/InventoryContext";
import { cn } from "@/lib/utils";

const GROUPS = [
  { value: "all", label: "همه گروه‌ها" },
  { value: "ملزومات اداری", label: "ملزومات اداری" },
  { value: "تجهیزات رایانه‌ای", label: "تجهیزات رایانه‌ای" }
];

const ITEM_TYPES = [
  { value: "all", label: "همه انواع کالا" },
  { value: "consumable", label: "مصرفی" },
  { value: "non-consumable", label: "غیرمصرفی" }
];

const STATUSES = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" }
];

const COST_CENTERS = [
  { value: "all", label: "همه مراکز هزینه" },
  { value: "ستاد مرکزی", label: "ستاد مرکزی" },
  { value: "دفتر غرب", label: "دفتر غرب" }
];

export default function AssetWarehouseBalance() {
  const {
    warehouses,
    consumables,
    getStockBalances,
    getItemKardex
  } = useInventory();

  // Filters State
  const [warehouseId, setWarehouseId] = useState("all");
  const [group, setGroup] = useState("all");
  const [itemType, setItemType] = useState("all");
  const [status, setStatus] = useState("all");
  const [costCenter, setCostCenter] = useState("all");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Kardex Modal State
  const [kardexItem, setKardexItem] = useState(null);
  const [kardexWarehouseId, setKardexWarehouseId] = useState("");

  // Get stock balance list from context logic
  const stockList = useMemo(() => {
    const list = getStockBalances({ warehouseId, group });
    return list.filter(item =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [warehouseId, group, searchQuery, getStockBalances]);

  // Sum calculations for summary badges
  const totalItemsCount = stockList.length;
  const totalStockIn = stockList.reduce((sum, item) => sum + item.inQty, 0);
  const totalStockOut = stockList.reduce((sum, item) => sum + item.outQty, 0);
  const totalCurrentStock = stockList.reduce((sum, item) => sum + item.currentQty, 0);

  // Format Persian currency/number helper
  const fmtNum = (val) => {
    return Number(val).toLocaleString("fa-IR");
  };

  // Click on a row opens Kardex card
  const handleOpenKardex = (item) => {
    setKardexItem(item);
    setKardexWarehouseId(item.warehouseId);
  };

  // Get Kardex logs for the selected item
  const kardexLogs = useMemo(() => {
    if (!kardexItem) return [];
    return getItemKardex(kardexItem.itemCode, kardexWarehouseId);
  }, [kardexItem, kardexWarehouseId, getItemKardex]);

  // Simulated CSV Export
  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // BOM for UTF-8 Persian compatibility
    csvContent += "کد کالا,نام کالا,گروه,واحد,موجودی اول دوره,ورود,خروج,موجودی فعلی,رزرو شده,قابل مصرف\n";
    stockList.forEach(b => {
      csvContent += `${b.itemCode},${b.itemName},${b.group},${b.unit},${b.openingStock},${b.inQty},${b.outQty},${b.currentQty},${b.reservedQty},${b.usableQty}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mojoodi_anbar_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulated Report Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 hover:underline cursor-pointer">انبار و موجودی</span>
        <span>/</span>
        <span className="text-foreground">موجودی انبار</span>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 border-slate-200"
          >
            <Printer className="h-4 w-4 text-slate-500" /> چاپ گزارش
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 border-slate-200 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <Download className="h-4 w-4" /> خروجی اکسل (CSV)
          </Button>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-bold text-slate-800">کاردکس و موجودی انبار</h1>
          <p className="text-xs text-muted-foreground mt-0.5">گزارش لحظه‌ای موجودی و گردش اقلام مصرفی انبار</p>
        </div>
      </div>

      {/* بخش فیلترها */}
      <Card className="shadow-sm border-slate-100 mb-6" dir="rtl">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-dashed border-slate-100">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">فیلترهای گزارش</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">انبار</Label>
              <SearchableSelect
                value={warehouseId}
                onChange={setWarehouseId}
                options={[{ value: "all", label: "همه انبارها" }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">گروه اموال</Label>
              <SearchableSelect
                value={group}
                onChange={setGroup}
                options={GROUPS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">نوع کالا</Label>
              <SearchableSelect
                value={itemType}
                onChange={setItemType}
                options={ITEM_TYPES}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">وضعیت کالا</Label>
              <SearchableSelect
                value={status}
                onChange={setStatus}
                options={STATUSES}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">مرکز هزینه</Label>
              <SearchableSelect
                value={costCenter}
                onChange={setCostCenter}
                options={COST_CENTERS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-slate-500">تا تاریخ</Label>
              <PersianDatePicker
                value={date}
                onChange={(e) => setDate(e?.target?.value || e)}
                placeholder="۱۴۰۴/۰۷/۱۰"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* خلاصه‌ وضعیت */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" dir="rtl">
        {[
          { label: "تعداد اقلام فیلتر شده", value: totalItemsCount, color: "text-slate-800 bg-slate-50 border-slate-200" },
          { label: "جمع کل ورودی‌ها (رسید)", value: totalStockIn, color: "text-emerald-700 bg-emerald-50/50 border-emerald-100" },
          { label: "جمع کل خروجی‌ها (حواله)", value: totalStockOut, color: "text-amber-700 bg-amber-50/50 border-amber-100" },
          { label: "جمع کل موجودی فعلی انبار", value: totalCurrentStock, color: "text-blue-700 bg-blue-50/50 border-blue-100" }
        ].map((s, idx) => (
          <div key={idx} className={cn("rounded-xl border p-4 text-right shadow-sm", s.color)}>
            <span className="text-xl font-black font-mono">{fmtNum(s.value)}</span>
            <p className="text-[11px] text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* جدول داده‌ها */}
      <Card className="shadow-sm border-slate-100 overflow-hidden" dir="rtl">
        <CardContent className="p-0">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-700">لیست موجودی انبار</span>
            <div className="relative w-full max-w-xs">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در کد و شرح کالا..."
                className="pr-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800 text-white font-bold hover:bg-slate-800">
                  <TableHead className="text-right text-xs font-bold text-white">کد کالا</TableHead>
                  <TableHead className="text-right text-xs font-bold text-white">نام کالا</TableHead>
                  <TableHead className="text-right text-xs font-bold text-white">گروه</TableHead>
                  <TableHead className="text-right text-xs font-bold text-white">واحد</TableHead>
                  <TableHead className="text-center text-xs font-bold text-white">موجودی اول دوره</TableHead>
                  <TableHead className="text-center text-xs font-bold text-white">ورود (رسیدها)</TableHead>
                  <TableHead className="text-center text-xs font-bold text-white">خروج (حواله‌ها)</TableHead>
                  <TableHead className="text-center text-xs font-bold text-white">موجودی فعلی</TableHead>
                  <TableHead className="text-center text-xs font-bold text-white">رزرو شده</TableHead>
                  <TableHead className="text-center text-xs font-bold text-white bg-blue-900/40">قابل مصرف</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-xs text-muted-foreground">
                      موردی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : (
                  stockList.map((row) => (
                    <TableRow key={`${row.itemCode}_${row.warehouseId}`} className="hover:bg-slate-50/40">
                      <TableCell className="font-mono text-xs text-slate-700">{row.itemCode}</TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        {row.itemName}
                        <div className="text-[10px] text-slate-400 mt-0.5">{row.warehouseName}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{row.group}</TableCell>
                      <TableCell className="text-xs text-slate-600">{row.unit}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-slate-500">{fmtNum(row.openingStock)}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-emerald-600 font-bold">+{fmtNum(row.inQty)}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-amber-600 font-bold">-{fmtNum(row.outQty)}</TableCell>
                      <TableCell className="text-center font-mono text-xs font-bold text-slate-800">{fmtNum(row.currentQty)}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-amber-500">{fmtNum(row.reservedQty)}</TableCell>
                      <TableCell className="text-center font-mono text-sm font-black bg-blue-50/30 text-blue-700">{fmtNum(row.usableQty)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenKardex(row)}
                          className="h-8 gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> کاردکس کالا
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* مودال کاردکس کالا */}
      {kardexItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl shadow-2xl bg-white animate-in zoom-in-95 duration-200">
            <CardContent className="p-6 text-right" dir="rtl">
              <div className="flex items-center justify-between pb-3 mb-4 border-b">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <TableIcon className="h-4 w-4 text-blue-600" />
                    کارت کاردکس کالا
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">کد کالا: {kardexItem.itemCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setKardexItem(null)}
                  className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg mb-4">
                <div><strong>نام کالا:</strong> {kardexItem.itemName}</div>
                <div><strong>انبار:</strong> {kardexItem.warehouseName}</div>
                <div><strong>گروه:</strong> {kardexItem.group}</div>
                <div><strong>واحد اندازه‌گیری:</strong> {kardexItem.unit}</div>
              </div>

              <div className="max-h-[350px] overflow-y-auto border rounded-lg">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow className="bg-slate-50 border-b">
                      <TableHead className="text-right text-xs font-bold text-slate-700">ردیف</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-700">تاریخ</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-700">نوع سند</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-700">شماره سند</TableHead>
                      <TableHead className="text-center text-xs font-bold text-slate-700">ورود (+)</TableHead>
                      <TableHead className="text-center text-xs font-bold text-slate-700">خروج (-)</TableHead>
                      <TableHead className="text-center text-xs font-bold text-blue-800 bg-blue-50/20">مانده موجودی</TableHead>
                      <TableHead className="text-right text-xs font-bold text-slate-700">توضیحات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kardexLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-slate-400">گردش تراکنشی برای این کالا ثبت نشده است.</TableCell>
                      </TableRow>
                    ) : (
                      kardexLogs.map((log, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/30">
                          <TableCell className="font-mono text-center">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-slate-600">{log.date}</TableCell>
                          <TableCell>
                            <Badge className={cn("text-[10px] font-semibold px-2 py-0.5",
                              log.opType === "رسید" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            )}>
                              {log.opType}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-slate-600">{log.opNo}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-emerald-600">
                            {log.inQty > 0 ? `+${log.inQty}` : "—"}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-amber-600">
                            {log.outQty > 0 ? `-${log.outQty}` : "—"}
                          </TableCell>
                          <TableCell className="text-center font-mono font-black text-blue-700 bg-blue-50/10">
                            {log.balance}
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-500 max-w-[150px] truncate" title={log.notes}>
                            {log.notes}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mt-6">
                <Button size="sm" onClick={() => setKardexItem(null)} className="bg-slate-800 hover:bg-slate-900 text-white text-xs">
                  بستن کارتکس
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
