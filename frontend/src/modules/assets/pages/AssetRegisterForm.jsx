import { useState, useMemo } from "react";
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

const STATUSES       = [{ value: "active", label: "فعال" }, { value: "scrap", label: "اسقاط" }, { value: "lost", label: "مفقود" }, { value: "repair", label: "در تعمیر" }];
const DEPREC_METHODS = [{ value: "straight", label: "خط مستقیم" }, { value: "declining", label: "نزولی" }, { value: "sum_years", label: "مجموع سنوات" }, { value: "units", label: "تعداد تولید" }];

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
  const {
    assets, addAsset, updateAsset, deleteAsset,
    groups, subgroups, types, natures, units, locations, suppliers
  } = useAssets();

  const [form, setForm]           = useState(INITIAL);
  const [activeTab, setActiveTab] = useState("basic");
  const [editingId, setEditingId] = useState(null);

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

  // گزینه‌های انتخابی پویا از دیتابیس
  const groupOptions = useMemo(() => {
    return (groups || []).map((g) => ({ value: g.title, label: `${g.code} — ${g.title}` }));
  }, [groups]);

  const subgroupOptions = useMemo(() => {
    return (subgroups || []).map((s) => ({ value: s.title, label: `${s.code} — ${s.title}` }));
  }, [subgroups]);

  const typeOptions = useMemo(() => {
    return (types || []).map((t) => ({ value: t.nature || t.code, label: t.title }));
  }, [types]);

  const natureOptions = useMemo(() => {
    return (natures || []).map((n) => ({ value: n.movable ? "movable" : "immovable", label: n.title }));
  }, [natures]);

  const unitOptions = useMemo(() => {
    return (units || []).map((u) => ({ value: u.symbol || u.code, label: u.title }));
  }, [units]);

  const supplierOptions = useMemo(() => {
    return (suppliers || []).map((s) => ({ value: s.title, label: `${s.code} — ${s.title}` }));
  }, [suppliers]);

  const locationOptions = useMemo(() => {
    return (locations || []).map((l) => ({ value: l.name || l.title, label: `${l.code} — ${l.title}` }));
  }, [locations]);

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
              <div className="form-grid" dir="rtl">
                <Field label="کد مال"><Input value={form.assetCode} onChange={set("assetCode")} className="h-8 text-sm font-mono text-left" /></Field>
                <Field label="نام مال" required><Input value={form.assetName} onChange={set("assetName")} className="h-8 text-sm" /></Field>
                <Field label="گروه مال"><SearchableSelect value={form.assetGroup} onChange={v => setForm(f => ({...f, assetGroup: v}))} options={groupOptions} placeholder="انتخاب گروه مال..." /></Field>
                <Field label="زیرگروه مال"><SearchableSelect value={form.assetSubgroup} onChange={v => setForm(f => ({...f, assetSubgroup: v}))} options={subgroupOptions} placeholder="انتخاب زیرگروه مال..." /></Field>
                <Field label="نوع مال" required><SearchableSelect value={form.assetType} onChange={v => setForm(f => ({...f, assetType: v}))} options={typeOptions} /></Field>
                <Field label="ماهیت مال"><SearchableSelect value={form.assetNature} onChange={v => setForm(f => ({...f, assetNature: v}))} options={natureOptions} /></Field>
                <Field label="شماره سریال"><Input value={form.serialNumber} onChange={set("serialNumber")} className="h-8 text-sm font-mono" dir="ltr" /></Field>
                <Field label="برند"><Input value={form.brand} onChange={set("brand")} className="h-8 text-sm" /></Field>
                <Field label="مدل"><Input value={form.model} onChange={set("model")} className="h-8 text-sm" /></Field>
                <Field label="تاریخ خرید"><PersianDatePicker value={form.purchaseDate} onChange={set("purchaseDate")} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8" /></Field>
                <Field label="مبلغ خرید (ریال)"><Input value={form.purchaseAmount} onChange={set("purchaseAmount")} className="h-8 text-sm" placeholder="0" /></Field>
                <Field label="تعداد"><Input value={form.quantity} onChange={set("quantity")} type="number" min="1" className="h-8 text-sm" /></Field>
                <Field label="واحد"><SearchableSelect value={form.unit} onChange={v => setForm(f => ({...f, unit: v}))} options={unitOptions} /></Field>
                <Field label="تامین‌کننده"><SearchableSelect value={form.supplier} onChange={v => setForm(f => ({...f, supplier: v}))} options={supplierOptions} placeholder="انتخاب تامین‌کننده..." /></Field>
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
                  <div className="form-grid" dir="rtl">
                    <Field label="شماره برچسب" required><Input value={form.labelNumber} onChange={set("labelNumber")} className="h-8 text-sm font-mono text-left" /></Field>
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
              <div className="form-grid" dir="rtl">
                <Field label="سازمان"><Input value={form.organization} onChange={set("organization")} className="h-8 text-sm" /></Field>
                <Field label="واحد / اداره"><Input value={form.department} onChange={set("department")} className="h-8 text-sm" /></Field>
                <Field label="محل استقرار">
                  <SearchableSelect
                    value={form.location}
                    onChange={(v) => {
                      const loc = locations.find((l) => (l.name === v || l.title === v));
                      setForm((f) => ({
                        ...f,
                        location: v,
                        building: loc?.building || f.building,
                        floor: loc?.floor || f.floor,
                        room: loc?.room || f.room,
                      }));
                    }}
                    options={locationOptions}
                    placeholder="انتخاب محل استقرار..."
                  />
                </Field>
                <Field label="ساختمان"><Input value={form.building} onChange={set("building")} className="h-8 text-sm bg-muted/30" readOnly /></Field>
                <Field label="طبقه"><Input value={form.floor} onChange={set("floor")} className="h-8 text-sm bg-muted/30" readOnly /></Field>
                <Field label="اتاق"><Input value={form.room} onChange={set("room")} className="h-8 text-sm bg-muted/30" readOnly /></Field>
              </div>
              <Separator />
              <SecTitle icon={User} title="مسئول مال" />
              <div className="form-grid" dir="rtl">
                <Field label="نام پرسنل"><Input value={form.personnelName} onChange={set("personnelName")} className="h-8 text-sm" /></Field>
                <Field label="کد پرسنلی"><Input value={form.personnelCode} onChange={set("personnelCode")} className="h-8 text-sm font-mono text-left" /></Field>
                <Field label="تاریخ تحویل"><PersianDatePicker value={form.deliveryDate} onChange={set("deliveryDate")} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8" /></Field>
                <Field label="تاریخ عودت"><PersianDatePicker value={form.returnDate} onChange={set("returnDate")} className="h-8" /></Field>
                <Field label="وضعیت تحویل"><SearchableSelect value={form.deliveryStatus} onChange={v => setForm(f => ({...f, deliveryStatus: v}))} options={[{value:"delivered",label:"تحویل داده شده"},{value:"returned",label:"عودت داده شده"},{value:"pending",label:"در انتظار"}]} /></Field>
              </div>
            </div>
          )}

          {activeTab === "accounting" && (
            <div className="space-y-4">
              <SecTitle icon={BookOpen} title="اطلاعات مالی و حسابداری" />
              <div className="form-grid" dir="rtl">
                <Field label="حساب کل"><Input value={form.mainAccount} onChange={set("mainAccount")} className="h-8 text-sm font-mono text-left" /></Field>
                <Field label="حساب معین"><Input value={form.subAccount} onChange={set("subAccount")} className="h-8 text-sm font-mono text-left" /></Field>
                <Field label="مرکز هزینه"><Input value={form.costCenter} onChange={set("costCenter")} className="h-8 text-sm" /></Field>
                <Field label="پروژه"><Input value={form.project} onChange={set("project")} className="h-8 text-sm" /></Field>
                <Field label="شماره سند خرید"><Input value={form.purchaseDocNumber} onChange={set("purchaseDocNumber")} className="h-8 text-sm font-mono text-left" /></Field>
                <Field label="شماره فاکتور"><Input value={form.invoiceNumber} onChange={set("invoiceNumber")} className="h-8 text-sm font-mono text-left" /></Field>
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
                  <div className="form-grid" dir="rtl">
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
                  <div className="form-grid" dir="rtl">
                    <Field label="نرخ استهلاک (%)"><Input value={form.depreciationRate} readOnly className="h-8 text-sm bg-muted/40 font-mono text-left" /></Field>
                    <Field label="استهلاک ماهانه (ریال)"><Input value={form.monthlyDepreciation ? fmt(form.monthlyDepreciation) : ""} readOnly className="h-8 text-sm bg-muted/40 font-mono text-left" /></Field>
                    <Field label="استهلاک انباشته (ریال)"><Input value={form.accumulatedDepreciation} onChange={set("accumulatedDepreciation")} className="h-8 text-sm font-mono text-left" /></Field>
                    <Field label="ارزش دفتری (ریال)"><Input value={form.bookValue ? fmt(form.bookValue) : ""} readOnly className="h-8 text-sm bg-muted/40 font-mono text-left" /></Field>
                    <Field label="مبلغ خالص دارایی (ریال)"><Input value={form.netAssetValue ? fmt(form.netAssetValue) : ""} readOnly className="h-8 text-sm bg-muted/40 font-mono text-left font-semibold" /></Field>
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
            <div className="flex items-center justify-between mb-3" dir="rtl">
              <p className="text-sm font-semibold">اموال ثبت‌شده</p>
              <Badge variant="secondary">{records.length} مورد</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">کد</TableHead>
                  <TableHead className="text-right">نام مال</TableHead>
                  <TableHead className="text-right">نوع</TableHead>
                  <TableHead className="text-right">گروه</TableHead>
                  <TableHead className="text-right">برند / مدل</TableHead>
                  <TableHead className="text-right">مبلغ خرید</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="w-20 text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => (
                  <TableRow key={rec.id || rec._id} className={cn(editingId === (rec.id || rec._id) && "bg-primary/5 hover:bg-primary/10")}>
                    <TableCell className="font-mono text-xs text-left">{rec.assetCode || "—"}</TableCell>
                    <TableCell className="font-medium text-right">{rec.assetName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rec.assetType === "non-consumable" ? "default" : "secondary"} className="text-xs">
                        {rec.assetType === "non-consumable" ? "غیرمصرفی" : "مصرفی"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-right">{rec.assetGroup || "—"}</TableCell>
                    <TableCell className="text-xs text-right">{[rec.brand, rec.model].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-left">{rec.purchaseAmount ? fmt(rec.purchaseAmount) + " ریال" : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={rec.status === "active" ? "outline" : "destructive"} className="text-xs">
                        {STATUSES.find((s) => s.value === rec.status)?.label ?? rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(rec)} className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="ویرایش">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(rec.id || rec._id)} className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="حذف">
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
