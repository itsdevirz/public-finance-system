import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, FileText, CreditCard, BookOpen,
  Shield, PiggyBank, ArrowLeftRight, TrendingUp,
  AlertTriangle, CheckCircle, Clock, ChevronLeft,
  Plus, Trash2, Pencil, Building2, Landmark, ListChecks,
  Tag, Users, BadgePercent,
} from "lucide-react";

// ─── داده‌های پیش‌فرض ───────────────────────────────────────────────────────
const DEFAULT_BANKS = [
  { id: 1, code: "012", name: "بانک ملت" },
  { id: 2, code: "017", name: "بانک صادرات ایران" },
  { id: 3, code: "019", name: "بانک ملی ایران" },
];
const DEFAULT_GUARANTEE_TYPES = [
  { id: 1, code: "BNK", name: "ضمانت‌نامه بانکی" },
  { id: 2, code: "INS", name: "بیمه‌نامه" },
  { id: 3, code: "CHK", name: "چک" },
  { id: 4, code: "CSH", name: "نقدی" },
  { id: 5, code: "PRO", name: "سند ملکی" },
];
const DEFAULT_DEPOSIT_TYPES = [
  { id: 1, code: "PER", name: "حسن انجام کار" },
  { id: 2, code: "GUA", name: "ضمانت" },
  { id: 3, code: "ADV", name: "پیش‌پرداخت" },
  { id: 4, code: "CSH", name: "وثیقه نقدی" },
  { id: 5, code: "OTH", name: "سایر" },
];
const DEFAULT_INSURANCE_TYPES = [
  { id: 1, code: "SOC", name: "تامین اجتماعی" },
  { id: 2, code: "IRN", name: "بیمه ایران" },
  { id: 3, code: "ASI", name: "بیمه آسیا" },
];
const DEFAULT_PAYMENT_TYPES = [
  { id: 1, code: "CHK", name: "چک" },
  { id: 2, code: "TRN", name: "حواله" },
  { id: 3, code: "CSH", name: "نقدی" },
  { id: 4, code: "EFT", name: "الکترونیکی" },
];

const ALERTS = [
  { type: "warning", text: "۳ ضمانت‌نامه در آستانه انقضا (کمتر از ۳۰ روز)" },
  { type: "info",    text: "۵ سند در انتظار تصویب" },
  { type: "success", text: "تراز حساب‌ها متراز می‌باشد" },
];

const QUICK_ACCESS = [
  { label: "صدور سند",        to: "/document-setup/issue-doc",              icon: FileText,       color: "bg-blue-50 text-blue-600"     },
  { label: "تامین اعتبار",    to: "/credits/funded",                         icon: CreditCard,     color: "bg-emerald-50 text-emerald-600"},
  { label: "صدور چک",         to: "/check-issuance/payments/with-check",     icon: ArrowLeftRight, color: "bg-amber-50 text-amber-600"   },
  { label: "دفتر کل",         to: "/bookkeeping/ledger-reports/general-ledger", icon: BookOpen,    color: "bg-purple-50 text-purple-600" },
  { label: "ثبت ضمانت‌نامه",  to: "/guarantees/register/contract",           icon: Shield,         color: "bg-rose-50 text-rose-600"     },
  { label: "ثبت سپرده",       to: "/deposits/manual-form",                   icon: PiggyBank,      color: "bg-teal-50 text-teal-600"     },
];

// ─── کامپوننت Modal تعریف آیتم‌های پایه ─────────────────────────────────────
function DefinitionModal({ open, onClose, title, description, icon: Icon, items: initItems }) {
  const [items, setItems]     = useState(initItems);
  const [editing, setEditing] = useState(null); // { id, code, name } | "new"
  const [form, setForm]       = useState({ code: "", name: "" });

  function openNew()   { setEditing("new"); setForm({ code: "", name: "" }); }
  function openEdit(i) { setEditing(i); setForm({ code: i.code, name: i.name }); }
  function cancelEdit(){ setEditing(null); }

  function save() {
    if (!form.name.trim()) return;
    if (editing === "new") {
      setItems((prev) => [...prev, { id: Date.now(), code: form.code, name: form.name }]);
    } else {
      setItems((prev) => prev.map((i) => i.id === editing.id ? { ...i, ...form } : i));
    }
    setEditing(null);
  }

  function remove(id) { setItems((prev) => prev.filter((i) => i.id !== id)); }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="md">
      {/* لیست آیتم‌ها */}
      <div className="mb-4 max-h-56 overflow-y-auto rounded-xl border">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">هیچ موردی تعریف نشده</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">کد</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">عنوان</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{item.code}</td>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(item.id)} className="rounded p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* فرم افزودن/ویرایش */}
      {editing ? (
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm font-medium">{editing === "new" ? "افزودن مورد جدید" : "ویرایش"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="def-code" className="text-xs">کد</Label>
              <Input id="def-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="مثلا: BNK" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="def-name" className="text-xs">عنوان <span className="text-destructive">*</span></Label>
              <Input id="def-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="نام را وارد کنید" className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={cancelEdit}>انصراف</Button>
            <Button size="sm" onClick={save} disabled={!form.name.trim()}>ذخیره</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={openNew} className="w-full">
          <Plus className="h-4 w-4" /> افزودن مورد جدید
        </Button>
      )}

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>بستن</Button>
        <Button onClick={onClose}>تایید و ذخیره</Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── تعاریف کارت‌های پایه ──────────────────────────────────────────────────
const DEFINITIONS = [
  {
    key: "banks",
    title: "بانک‌ها",
    description: "تعریف بانک‌های مورد استفاده",
    icon: Landmark,
    color: "bg-blue-50 text-blue-600",
    items: DEFAULT_BANKS,
    modalDesc: "بانک‌های مورد استفاده در سیستم را تعریف کنید",
  },
  {
    key: "guarantee_types",
    title: "انواع ضمانت",
    description: "تعریف انواع ضمانت‌نامه",
    icon: Shield,
    color: "bg-rose-50 text-rose-600",
    items: DEFAULT_GUARANTEE_TYPES,
    modalDesc: "انواع ضمانت قابل استفاده در فرم‌ها",
  },
  {
    key: "deposit_types",
    title: "انواع سپرده",
    description: "تعریف دسته‌بندی سپرده‌ها",
    icon: PiggyBank,
    color: "bg-teal-50 text-teal-600",
    items: DEFAULT_DEPOSIT_TYPES,
    modalDesc: "انواع سپرده قابل انتخاب در فرم ثبت",
  },
  {
    key: "insurance_types",
    title: "انواع بیمه",
    description: "شرکت‌های بیمه طرف قرارداد",
    icon: BadgePercent,
    color: "bg-emerald-50 text-emerald-600",
    items: DEFAULT_INSURANCE_TYPES,
    modalDesc: "شرکت‌ها و انواع بیمه مورد استفاده",
  },
  {
    key: "payment_types",
    title: "انواع پرداخت",
    description: "روش‌های پرداخت مجاز",
    icon: CreditCard,
    color: "bg-amber-50 text-amber-600",
    items: DEFAULT_PAYMENT_TYPES,
    modalDesc: "روش‌های پرداخت قابل انتخاب در فرم‌ها",
  },
  {
    key: "persons",
    title: "اشخاص",
    description: "تعریف اشخاص حقیقی و حقوقی",
    icon: Users,
    color: "bg-purple-50 text-purple-600",
    items: [],
    modalDesc: "اشخاص حقیقی و حقوقی طرف معامله",
  },
];

// ─── کامپوننت اصلی ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  const now = new Date().toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });

  const activeDef = DEFINITIONS.find((d) => d.key === activeModal);

  return (
    <PageShell>
      <PageHeader title={`خوش آمدید ${user?.username}`} description={now} />

      {/* هشدارها */}
      <div className="mb-6 space-y-2">
        {ALERTS.map((a, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-sm animate-in fade-in duration-300" style={{ animationDelay: `${i * 60}ms` }}>
            {a.type === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
             : a.type === "success" ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
             : <Clock className="h-4 w-4 text-blue-500 shrink-0" />}
            <span>{a.text}</span>
          </div>
        ))}
      </div>

      {/* کارت‌های آمار */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "اسناد این ماه",   value: "—", icon: FileText,       color: "text-primary",     bg: "bg-primary/10"  },
          { label: "چک‌های صادره",    value: "—", icon: ArrowLeftRight,  color: "text-amber-600",   bg: "bg-amber-50"    },
          { label: "ضمانت‌نامه فعال", value: "—", icon: Shield,          color: "text-rose-600",    bg: "bg-rose-50"     },
          { label: "عملکرد بودجه",    value: "—", icon: TrendingUp,      color: "text-emerald-600", bg: "bg-emerald-50"  },
        ].map((item, i) => (
          <Card key={i} className="p-4 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* دسترسی سریع */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutDashboard className="h-4 w-4" />
            دسترسی سریع
          </CardTitle>
          <CardDescription>پرکاربردترین عملیات‌ها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACCESS.map((item) => (
              <button key={item.to} onClick={() => navigate(item.to)}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-4 text-center transition-all duration-200 hover:bg-accent hover:shadow-soft hover:-translate-y-0.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color} transition-transform duration-200 group-hover:scale-110`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* تعاریف پایه */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4" />
            تعاریف پایه سیستم
          </CardTitle>
          <CardDescription>پیش از ورود اطلاعات، این موارد را تعریف کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {DEFINITIONS.map((def) => (
              <button key={def.key} onClick={() => setActiveModal(def.key)}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-4 text-center transition-all duration-200 hover:bg-accent hover:shadow-soft hover:-translate-y-0.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${def.color} transition-transform duration-200 group-hover:scale-110`}>
                  <def.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium leading-tight">{def.title}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {def.items.length} مورد
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* بخش‌های اصلی */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "تنظیم اسناد",  desc: "صدور، جستجو و انتقال اسناد مالی",    to: "/document-setup",               icon: FileText       },
          { title: "اعتبارات",      desc: "موافقت‌نامه، تخصیص و تامین اعتبار",   to: "/credits",                      icon: CreditCard     },
          { title: "دفترداری",      desc: "دفاتر، تراز و صورت‌های مالی",         to: "/bookkeeping",                  icon: BookOpen       },
          { title: "صدور چک",      desc: "مدیریت چک‌ها و پرداخت‌های بانکی",     to: "/check-issuance",               icon: ArrowLeftRight },
          { title: "تضمینات",       desc: "ثبت و پیگیری ضمانت‌نامه‌ها",          to: "/guarantees",                   icon: Shield         },
          { title: "سپرده‌ها",      desc: "ثبت و مدیریت سپرده‌های مالی",         to: "/deposits",                     icon: PiggyBank      },
        ].map((item, i) => (
          <Card key={i} className="group cursor-pointer animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 60}ms` }} onClick={() => navigate(item.to)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-translate-x-1" />
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription className="text-xs">{item.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Modal تعاریف پایه */}
      {activeDef && (
        <DefinitionModal
          open={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={activeDef.title}
          description={activeDef.modalDesc}
          icon={activeDef.icon}
          items={activeDef.items}
        />
      )}
    </PageShell>
  );
}
