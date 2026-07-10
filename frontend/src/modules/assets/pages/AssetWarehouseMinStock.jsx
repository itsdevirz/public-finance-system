import { useState, useMemo } from "react";
import { Plus, Trash2, Save, Pencil, AlertCircle, CheckCircle2, ShieldAlert, Settings, ToggleLeft, ToggleRight } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useInventory } from "@/context/InventoryContext";
import { cn } from "@/lib/utils";

const INITIAL_FORM = {
  assetCode: "C001",
  warehouseId: "WH-001",
  minStock: "",
  maxStock: "",
  active: true
};

export default function AssetWarehouseMinStock() {
  const {
    alerts,
    warehouses,
    consumables,
    addAlert,
    updateAlert,
    deleteAlert,
    getSingleItemBalance
  } = useInventory();

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [savedMessage, setSavedMessage] = useState(false);

  // Set values in the alert config form
  const setVal = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setSavedMessage(false);
  };

  const handleNew = () => {
    setForm(INITIAL_FORM);
    setSelectedAlertId(null);
    setSavedMessage(false);
  };

  const handleSave = () => {
    if (!form.assetCode || !form.warehouseId || !form.minStock) return;
    const payload = {
      ...form,
      minStock: Number(form.minStock),
      maxStock: Number(form.maxStock || 0)
    };

    if (selectedAlertId) {
      updateAlert({ ...payload, id: selectedAlertId });
    } else {
      addAlert(payload);
    }
    setSavedMessage(true);
    handleNew();
  };

  const handleDelete = (id) => {
    deleteAlert(id);
    if (selectedAlertId === id) {
      handleNew();
    }
  };

  const handleEditClick = (alert) => {
    setForm(alert);
    setSelectedAlertId(alert.id);
    setSavedMessage(false);
  };

  // Toggle active state directly from table
  const handleToggleActive = (alert) => {
    updateAlert({ ...alert, active: !alert.active });
  };

  // Compute status labels dynamically based on stock calculations
  // Dashboard alerts: Shows list of active alerts and compares current stock against min stock
  const dashboardAlerts = useMemo(() => {
    return alerts.map(alert => {
      const item = consumables.find(c => c.code === alert.assetCode);
      const wh = warehouses.find(w => w.id === alert.warehouseId);
      const stock = getSingleItemBalance(alert.assetCode, alert.warehouseId);
      const current = stock.currentQty;
      const min = alert.minStock;

      let status = "normal"; // normal / warning / critical
      let statusLabel = "عادی";
      let statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";

      if (alert.active) {
        if (current === 0) {
          status = "critical";
          statusLabel = "اتمام موجودی";
          statusBadge = "bg-red-100 text-red-700 border-red-200 animate-pulse";
        } else if (current <= min) {
          status = "critical";
          statusLabel = "بحرانی (زیر حداقل)";
          statusBadge = "bg-red-50 text-red-600 border-red-200";
        } else if (current <= min * 1.5) {
          status = "warning";
          statusLabel = "کمبود (نزدیک حداقل)";
          statusBadge = "bg-amber-50 text-amber-700 border-amber-200";
        }
      } else {
        statusLabel = "غیرفعال";
        statusBadge = "bg-slate-100 text-slate-500 border-slate-200";
      }

      return {
        ...alert,
        itemName: item?.name || alert.assetCode,
        warehouseName: wh?.name || alert.warehouseId,
        currentQty: current,
        status,
        statusLabel,
        statusBadge
      };
    });
  }, [alerts, consumables, warehouses, getSingleItemBalance]);

  // Summary counts for dashboard badges
  const criticalCount = dashboardAlerts.filter(a => a.active && a.status === "critical").length;
  const warningCount = dashboardAlerts.filter(a => a.active && a.status === "warning").length;

  return (
    <PageShell>
      <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl">
        <span className="text-blue-600 hover:underline cursor-pointer">سیستم اموال</span>
        <span>/</span>
        <span className="text-blue-600 hover:underline cursor-pointer">انبار و موجودی</span>
        <span>/</span>
        <span className="text-foreground">هشدار حداقل موجودی</span>
      </div>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4" dir="rtl">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-800">داشبورد و تنظیمات حداقل موجودی</h1>
        </div>
        <p className="text-xs text-muted-foreground">کنترل و پیشگیری از اتمام موجودی اقلام مصرفی انبار</p>
      </div>

      {/* پنل‌های اطلاعاتی بحرانی */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" dir="rtl">
        <div className="rounded-xl border border-red-100 bg-red-50/40 p-4 text-right flex items-center justify-between">
          <div>
            <span className="text-2xl font-black font-mono text-red-600">{criticalCount}</span>
            <p className="text-[11px] text-red-800 font-bold mt-1">کالاهای در وضعیت بحرانی</p>
          </div>
          <AlertCircle className="h-8 w-8 text-red-500 opacity-80" />
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4 text-right flex items-center justify-between">
          <div>
            <span className="text-2xl font-black font-mono text-amber-600">{warningCount}</span>
            <p className="text-[11px] text-amber-800 font-bold mt-1">کالاهای در آستانه کمبود</p>
          </div>
          <ShieldAlert className="h-8 w-8 text-amber-500 opacity-80" />
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-right flex items-center justify-between">
          <div>
            <span className="text-2xl font-black font-mono text-emerald-600">
              {dashboardAlerts.filter(a => a.active && a.status === "normal").length}
            </span>
            <p className="text-[11px] text-emerald-800 font-bold mt-1">کالاهای با موجودی مطلوب</p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
        {/* راست: جدول داشبورد هشدارها */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">وضعیت موجودی کالاهای تحت نظارت</span>
                <span className="text-xs font-semibold text-slate-500">
                  کل هشدارهای تعریف‌شده: {alerts.length} مورد
                </span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800 text-white font-bold hover:bg-slate-800">
                      <TableHead className="text-right text-xs font-bold text-white">کالا</TableHead>
                      <TableHead className="text-right text-xs font-bold text-white">انبار</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">موجودی فعلی</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">حد اقل مجاز</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">حد اکثر مجاز</TableHead>
                      <TableHead className="text-center text-xs font-bold text-white">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardAlerts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                          هیچ هشدار موجودی برای کالایی تنظیم نشده است. از فرم روبرو اقدام کنید.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dashboardAlerts.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/40">
                          <TableCell className="font-semibold text-slate-800">
                            {row.itemName}
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{row.assetCode}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">{row.warehouseName}</TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-800 text-sm">
                            {row.currentQty}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            {row.minStock}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs text-slate-500">
                            {row.maxStock || "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-xs font-bold px-2 py-0.5", row.statusBadge)}>
                              {row.statusLabel}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* چپ: فرم ایجاد/ویرایش هشدار حداقل موجودی */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-1.5 pb-3 mb-4 border-b">
                <Settings className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-700">
                  {selectedAlertId ? "ویرایش تنظیمات هشدار" : "تنظیم هشدار حداقل موجودی"}
                </h3>
              </div>

              {savedMessage && (
                <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg text-center">
                  ✓ تنظیمات هشدار با موفقیت ذخیره شد
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">انتخاب کالا</Label>
                  <SearchableSelect
                    value={form.assetCode}
                    onChange={(val) => setVal("assetCode", val)}
                    options={consumables.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">انبار مورد نظر</Label>
                  <SearchableSelect
                    value={form.warehouseId}
                    onChange={(val) => setVal("warehouseId", val)}
                    options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">حداقل موجودی (نقطه هشدار)</Label>
                  <Input
                    type="number"
                    value={form.minStock}
                    onChange={(e) => setVal("minStock", e.target.value)}
                    placeholder="مثال: ۵"
                    className="h-9"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-slate-600">حداکثر موجودی مجاز (نقطه شارژ)</Label>
                  <Input
                    type="number"
                    value={form.maxStock}
                    onChange={(e) => setVal("maxStock", e.target.value)}
                    placeholder="مثال: ۵۰"
                    className="h-9"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-600">وضعیت فعالسازی هشدار</span>
                  <button
                    type="button"
                    onClick={() => setVal("active", !form.active)}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {form.active ? (
                      <ToggleRight className="h-8 w-8 text-blue-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={!form.assetCode || !form.minStock}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
                  >
                    ذخیره تنظیمات
                  </Button>
                  {selectedAlertId && (
                    <Button variant="outline" size="sm" onClick={handleNew} className="h-9">
                      انصراف
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* لیست هشدارهای تعریف شده برای ویرایش/حذف */}
          <Card className="shadow-sm border-slate-100">
            <CardContent className="pt-6">
              <h4 className="text-xs font-bold text-slate-700 pb-2 mb-3 border-b border-dashed border-slate-200">
                لیست قوانین تعریف شده
              </h4>

              <div className="space-y-2 max-h-[220px] overflow-y-auto scrollbar-sidebar pr-1">
                {alerts.map((alt) => {
                  const c = consumables.find(item => item.code === alt.assetCode);
                  const w = warehouses.find(wh => wh.id === alt.warehouseId);
                  return (
                    <div
                      key={alt.id}
                      className="p-2.5 rounded border border-slate-100 text-right flex items-center justify-between text-xs bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-700">{c?.name || alt.assetCode}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {w?.name || alt.warehouseId} | حداقل: {alt.minStock}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(alt)}
                          className={cn("h-6 w-6 rounded", alt.active ? "text-blue-600 hover:bg-blue-100" : "text-slate-400 hover:bg-slate-100")}
                          title={alt.active ? "غیرفعال کردن" : "فعال کردن"}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(alt)}
                          className="h-6 w-6 rounded text-slate-600 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(alt.id)}
                          className="h-6 w-6 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && (
                  <p className="text-center text-[10px] text-slate-400 py-4">قانونی ثبت نشده است.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
