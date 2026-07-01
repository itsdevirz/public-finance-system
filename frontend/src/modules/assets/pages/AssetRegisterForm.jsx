import { useState } from "react";
import { Save, RotateCcw, QrCode, Package, MapPin, User, Calculator, BookOpen, Pencil, Trash2 } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAssets } from "@/context/AssetContext";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";

const TABS = [
  { key: "basic",        label: "اطلاعات پایه",  icon: Package    },
  { key: "label",        label: "برچسب و شناسه", icon: QrCode     },
  { key: "location",     label: "مکان و مسئول",  icon: MapPin     },
  { key: "accounting",   label: "حسابداری",       icon: BookOpen   },
  { key: "depreciation", label: "استهلاک",        icon: Calculator },
];

const ASSET_TYPES    = [{ value: "non-consumable", label: "غیرمصرفی" }, { value: "consumable", label: "مصرفی" }, { value: "consumable-2", label: "در حکم مصرفی" }];
const ASSET_NATURES  = [{ value: "movable", label: "منقول" }, { value: "immovable", label: "غیرمنقول" }];
const STATUSES       = [{ value: "active", label: "فعال" }, { value: "scrap", label: "اسقاط" }, { value: "lost", label: "مفقود" }, { value: "repair", label: "در تعمیر" }];
const DEPREC_METHODS = [{ value: "straight", label: "خط مستقیم" }, { value: "declining", label: "نزولی" }, { value: "sum_years", label: "مجموع سنوات" }, { value: "units", label: "تعداد تولید" }];
const UNITS          = [{ value: "unit", label: "عدد" }, { value: "meter", label: "متر" }, { value: "kg", label: "کیلوگرم" }, { value: "set", label: "دست" }];

// تبدیل ارقام فارسی به انگلیسی و parse
function parseNum(val) {
  if (val === null || val === undefined || val === "") return 0;
  const s = String(val)
    .replace(/[\u06F0-\u06F9]/g, (c) => c.charCodeAt(0) - 0x06F0)
    .replace(/,/g, "")
    .trim();
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}

function fmt(val) {
  const n = parseNum(val);
  if (!n && n !== 0) return "";
  return n.toLocaleString("fa-IR");
}

const INITIAL = {
  assetCode:"", assetName:"", assetGroup:"", assetSubgroup:"",
  assetType:"non-consumable", assetNature:"movable",
  serialNumber:"", brand:"", model:"",
  purchaseDate:"", purchaseAmount:"", quantity:"1", unit:"unit",
  supplier:"", status:"active",
  labelNumber:"", qrCode:"", barcode:"", labelDate:"", labelStatus:"active",
  organization:"", department:"", building:"", floor:"", room:"", location:"",
  personnelName:"", personnelCode:"", deliveryDate:"", returnDate:"", deliveryStatus:"delivered",
  mainAccount:"", subAccount:"", costCenter:"", project:"", purchaseDocNumber:"", invoiceNumber:"",
  operationDate:"", usefulLife:"", depreciationRate:"", salvageValue:"",
  bookValue:"", accumulatedDepreciation:"", monthlyDepreciation:"", netAssetValue:"",
  depreciationMethod:"straight",
};

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}{required && <span className="text-destructive mr-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

function SecTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
      <p className="text-sm font-semibold text-primary">{title}</p>
    </div>
  );
}

export default function AssetRegisterForm() {
  const { assets, addAsset, updateAsset, deleteAsset } = useAssets();
  const [form, setForm]           = useState(INITIAL);
  const [activeTab, setActiveTab] = useState("basic");
  const [editingId, setEditingId] = useState(null);

  // records حالا از context می‌آید
  const records = assets;

  const isConsumable = form.assetType === "consumable";

  // محاسبه زنده استهلاک
  const cost    = parseNum(form.purchaseAmount);
  const salvage = parseNum(form.salvageValue);
  const life    = parseNum(form.usefulLife);
  const canCalc = cost > 0 && life > 0;
  const annualDep  = canCalc ? (cost - salvage) / life : 0;
  const monthlyDep = canCalc ? Math.round(annualDep / 12) : 0;
  const depRate    = canCalc ? (((cost - salvage) / cost) * 100 / life).toFixed(2) : "0";

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function applyCalc() {
    if (!canCalc) return;
    setForm((f) => ({
      ...f,
      depreciationRate:        depRate,
      monthlyDepreciation:     String(monthlyDep),
      accumulatedDepreciation: "0",
      bookValue:               String(cost),
      netAssetValue:           String(cost),
    }));
  }

  function handleSave() {
    if (!form.assetName.trim()) return;
    if (editingId !== null) {
      updateAsset({ ...form, id: editingId });
      setEditingId(null);
    } else {
      addAsset({ ...form });
    }
    setForm(INITIAL);
  }

  function handleEdit(rec) {
    setForm({ ...rec });
    setEditingId(rec.id);
    setActiveTab("basic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    deleteAsset(id);
    if (editingId === id) { setForm(INITIAL); setEditingId(null); }
  }

  return (
    <PageShell>
      <PageHeader title={editingId ? "ویرایش مال" : "ثبت مال جدید"} description="اطلاعات کامل دارایی را وارد کنید">
        {editingId && <Badge variant="secondary" className="text-xs">در حال ویرایش</Badge>}
      </PageHeader>

      <div className="tabs mb-0">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn("tab-btn flex items-center gap-1.5", activeTab === t.key && "active")}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </button>
        ))}
      </div>

      <Card className="rounded-tl-none mt-0 mb-4">
        <CardContent className="pt-5">

          {activeTab === "basic" && (
            <div className="space-y-4">
              <SecTitle icon={Package} title="مشخصات کلی" />
              <div className="form-grid">
                <Field label="کد مال"><Input value={form.assetCode} onChange={set("assetCode")} className="h-8 text-sm font-mono" /></Field>
                <Field label="نام مال" required><Input value={form.assetName} onChange={set("assetName")} className="h-8 text-sm" /></Field>
                <Field label="گروه مال"><Input value={form.assetGroup} onChange={set("assetGroup")} className="h-8 text-sm" /></Field>
                <Field label="زیرگروه مال"><Input value={form.assetSubgroup} onChange={set("assetSubgroup")} className="h-8 text-sm" /></Field>
                <Field label="نوع مال" required><SearchableSelect value={form.assetType} onChange={v => setForm(f => ({...f, assetType: v}))} options={ASSET_TYPES} /></Field>
                <Field label="ماهیت مال"><SearchableSelect value={form.assetNature} onChange={v => setForm(f => ({...f, assetNature: v}))} options={ASSET_NATURES} /></Field>
                <Field label="شماره سریال"><Input value={form.serialNumber} onChange={set("serialNumber")} className="h-8 text-sm font-mono" dir="ltr" /></Field>
                <Field label="برند"><Input value={form.brand} onChange={set("brand")} className="h-8 text-sm" /></Field>
                <Field label="مدل"><Input value={form.model} onChange={set("model")} className="h-8 text-sm" /></Field>
                <Field label="تاریخ خرید"><PersianDatePicker value={form.purchaseDate} onChange={set("purchaseDate")} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8" /></Field>
                <Field label="مبلغ خرید (ریال)"><Input value={form.purchaseAmount} onChange={set("purchaseAmount")} className="h-8 text-sm" placeholder="0" /></Field>
                <Field label="تعداد"><Input value={form.quantity} onChange={set("quantity")} type="number" min="1" className="h-8 text-sm" /></Field>
                <Field label="واحد"><SearchableSelect value={form.unit} onChange={v => setForm(f => ({...f, unit: v}))} options={UNITS} /></Field>
                <Field label="تامین‌کننده"><Input value={form.supplier} onChange={set("supplier")} className="h-8 text-sm" /></Field>
                <Field label="وضعیت"><SearchableSelect value={form.status} onChange={v => setForm(f => ({...f, status: v}))} options={STATUSES} /></Field>
              </div>
            </div>
          )}

          {activeTab === "label" && (
            <div className="space-y-4">
              {isConsumable ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-amber-50 py-12 text-center">
                  <QrCode className="mb-3 h-10 w-10 text-amber-400" />
                  <p className="font-medium text-amber-700">اموال مصرفی برچسب ندارند</p>
                </div>
              ) : (
                <>
                  <SecTitle icon={QrCode} title="اطلاعات برچسب" />
                  <div className="form-grid">
                    <Field label="شماره برچسب" required><Input value={form.labelNumber} onChange={set("labelNumber")} className="h-8 text-sm font-mono" /></Field>
                    <Field label="QR Code"><Input value={form.qrCode} onChange={set("qrCode")} className="h-8 text-sm font-mono" dir="ltr" /></Field>
                    <Field label="بارکد"><Input value={form.barcode} onChange={set("barcode")} className="h-8 text-sm font-mono" dir="ltr" /></Field>
                    <Field label="تاریخ الصاق"><PersianDatePicker value={form.labelDate} onChange={set("labelDate")} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8" /></Field>
                    <Field label="وضعیت برچسب"><SearchableSelect value={form.labelStatus} onChange={v => setForm(f => ({...f, labelStatus: v}))} options={[{value:"active",label:"فعال"},{value:"damaged",label:"آسیب‌دیده"},{value:"replaced",label:"تعویض شده"}]} /></Field>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "location" && (
            <div className="space-y-5">
              <SecTitle icon={MapPin} title="اطلاعات مکانی" />
              <div className="form-grid">
                <Field label="سازمان"><Input value={form.organization} onChange={set("organization")} className="h-8 text-sm" /></Field>
                <Field label="واحد / اداره"><Input value={form.department} onChange={set("department")} className="h-8 text-sm" /></Field>
                <Field label="ساختمان"><Input value={form.building} onChange={set("building")} className="h-8 text-sm" /></Field>
                <Field label="طبقه"><Input value={form.floor} onChange={set("floor")} className="h-8 text-sm" /></Field>
                <Field label="اتاق"><Input value={form.room} onChange={set("room")} className="h-8 text-sm" /></Field>
                <Field label="محل استقرار"><Input value={form.location} onChange={set("location")} className="h-8 text-sm" /></Field>
              </div>
              <Separator />
              <SecTitle icon={User} title="مسئول مال" />
              <div className="form-grid">
                <Field label="نام پرسنل"><Input value={form.personnelName} onChange={set("personnelName")} className="h-8 text-sm" /></Field>
                <Field label="کد پرسنلی"><Input value={form.personnelCode} onChange={set("personnelCode")} className="h-8 text-sm font-mono" /></Field>
                <Field label="تاریخ تحویل"><PersianDatePicker value={form.deliveryDate} onChange={set("deliveryDate")} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8" /></Field>
                <Field label="تاریخ عودت"><PersianDatePicker value={form.returnDate} onChange={set("returnDate")} className="h-8" /></Field>
                <Field label="وضعیت تحویل"><SearchableSelect value={form.deliveryStatus} onChange={v => setForm(f => ({...f, deliveryStatus: v}))} options={[{value:"delivered",label:"تحویل داده شده"},{value:"returned",label:"عودت داده شده"},{value:"pending",label:"در انتظار"}]} /></Field>
              </div>
            </div>
          )}

          {activeTab === "accounting" && (
            <div className="space-y-4">
              <SecTitle icon={BookOpen} title="اطلاعات مالی و حسابداری" />
              <div className="form-grid">
                <Field label="حساب کل"><Input value={form.mainAccount} onChange={set("mainAccount")} className="h-8 text-sm font-mono" /></Field>
                <Field label="حساب معین"><Input value={form.subAccount} onChange={set("subAccount")} className="h-8 text-sm font-mono" /></Field>
                <Field label="مرکز هزینه"><Input value={form.costCenter} onChange={set("costCenter")} className="h-8 text-sm" /></Field>
                <Field label="پروژه"><Input value={form.project} onChange={set("project")} className="h-8 text-sm" /></Field>
                <Field label="شماره سند خرید"><Input value={form.purchaseDocNumber} onChange={set("purchaseDocNumber")} className="h-8 text-sm font-mono" /></Field>
                <Field label="شماره فاکتور"><Input value={form.invoiceNumber} onChange={set("invoiceNumber")} className="h-8 text-sm font-mono" /></Field>
              </div>
            </div>
          )}

          {activeTab === "depreciation" && (
            <div className="space-y-4">
              {isConsumable ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 py-12 text-center">
                  <Calculator className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">اموال مصرفی استهلاک ندارند</p>
                </div>
              ) : (
                <>
                  <SecTitle icon={Calculator} title="تنظیمات استهلاک" />
                  <div className="form-grid">
                    <Field label="روش استهلاک"><SearchableSelect value={form.depreciationMethod} onChange={v => setForm(f => ({...f, depreciationMethod: v}))} options={DEPREC_METHODS} /></Field>
                    <Field label="تاریخ بهره‌برداری"><PersianDatePicker value={form.operationDate} onChange={set("operationDate")} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8" /></Field>
                    <Field label="عمر مفید (سال)"><Input value={form.usefulLife} onChange={set("usefulLife")} type="number" min="1" className="h-8 text-sm" /></Field>
                    <Field label="ارزش اسقاط (ریال)"><Input value={form.salvageValue} onChange={set("salvageValue")} className="h-8 text-sm" placeholder="0" /></Field>
                  </div>

                  {canCalc ? (
                    <div className="rounded-xl border bg-emerald-50 p-4 animate-in fade-in duration-300">
                      <p className="text-sm font-medium text-emerald-700 mb-3">نتیجه محاسبه (خط مستقیم):</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "استهلاک سالانه", value: fmt(Math.round(annualDep)) + " ریال" },
                          { label: "استهلاک ماهانه", value: fmt(monthlyDep) + " ریال" },
                          { label: "نرخ استهلاک",    value: depRate + "٪" },
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg bg-white border p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                            <p className="font-mono font-semibold text-emerald-700">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button type="button" size="sm" onClick={applyCalc}>
                          <Calculator className="h-4 w-4" />
                          اعمال نتایج
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      برای محاسبه، مبلغ خرید (تب اطلاعات پایه) و عمر مفید را وارد کنید.
                    </div>
                  )}

                  <Separator />
                  <SecTitle icon={Calculator} title="نتایج اعمال‌شده" />
                  <div className="form-grid">
                    <Field label="نرخ استهلاک (%)"><Input value={form.depreciationRate} readOnly className="h-8 text-sm bg-muted/40 font-mono" /></Field>
                    <Field label="استهلاک ماهانه (ریال)"><Input value={form.monthlyDepreciation ? fmt(form.monthlyDepreciation) : ""} readOnly className="h-8 text-sm bg-muted/40 font-mono" /></Field>
                    <Field label="استهلاک انباشته (ریال)"><Input value={form.accumulatedDepreciation} onChange={set("accumulatedDepreciation")} className="h-8 text-sm font-mono" /></Field>
                    <Field label="ارزش دفتری (ریال)"><Input value={form.bookValue ? fmt(form.bookValue) : ""} readOnly className="h-8 text-sm bg-muted/40 font-mono" /></Field>
                    <Field label="مبلغ خالص دارایی (ریال)"><Input value={form.netAssetValue ? fmt(form.netAssetValue) : ""} readOnly className="h-8 text-sm bg-muted/40 font-mono font-semibold" /></Field>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="form-actions justify-end mb-8">
        <Button type="button" variant="outline" onClick={() => { setForm(INITIAL); setEditingId(null); }}>
          <RotateCcw className="h-4 w-4" /> جدید
        </Button>
        <Button onClick={handleSave} disabled={!form.assetName.trim()}>
          <Save className="h-4 w-4" />
          {editingId ? "ذخیره ویرایش" : "ثبت مال"}
        </Button>
      </div>

      {records.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">اموال ثبت‌شده</p>
              <Badge variant="secondary">{records.length} مورد</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد</TableHead>
                  <TableHead>نام مال</TableHead>
                  <TableHead>نوع</TableHead>
                  <TableHead>گروه</TableHead>
                  <TableHead>برند / مدل</TableHead>
                  <TableHead>مبلغ خرید</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="w-20">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id} className={cn(editingId === rec.id && "bg-primary/5 hover:bg-primary/10")}>
                    <TableCell className="font-mono text-xs">{rec.assetCode || "—"}</TableCell>
                    <TableCell className="font-medium">{rec.assetName}</TableCell>
                    <TableCell>
                      <Badge variant={rec.assetType === "non-consumable" ? "default" : "secondary"} className="text-xs">
                        {rec.assetType === "non-consumable" ? "غیرمصرفی" : "مصرفی"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{rec.assetGroup || "—"}</TableCell>
                    <TableCell className="text-xs">{[rec.brand, rec.model].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{rec.purchaseAmount ? fmt(rec.purchaseAmount) + " ریال" : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={rec.status === "active" ? "outline" : "destructive"} className="text-xs">
                        {STATUSES.find((s) => s.value === rec.status)?.label ?? rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(rec)} className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="ویرایش">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(rec.id)} className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="حذف">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
