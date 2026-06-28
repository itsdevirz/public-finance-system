import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { StaggerContainer, StaggerItem, ScaleOnHover } from "@/components/motion/AnimatedPage";
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
  Tag, Users, BadgePercent, Sparkles,
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
  { type: "success", text: "تراز حساب‌ها متوازن می‌باشد" },
];

const QUICK_ACCESS = [
  { label: "صدور سند",        to: "/document-setup/issue-doc",              icon: FileText,       color: "bg-blue-50 text-blue-600 border-blue-200/60"     },
  { label: "تامین اعتبار",    to: "/credits/funded",                         icon: CreditCard,     color: "bg-emerald-50 text-emerald-600 border-emerald-200/60"},
  { label: "صدور چک",         to: "/check-issuance/payments/with-check",     icon: ArrowLeftRight, color: "bg-amber-50 text-amber-600 border-amber-200/60"   },
  { label: "دفتر کل",         to: "/bookkeeping/ledger-reports/general-ledger", icon: BookOpen,    color: "bg-purple-50 text-purple-600 border-purple-200/60" },
  { label: "ثبت ضمانت‌نامه",  to: "/guarantees/register/contract",           icon: Shield,         color: "bg-rose-50 text-rose-600 border-rose-200/60"     },
  { label: "ثبت سپرده",       to: "/deposits/manual-form",                   icon: PiggyBank,      color: "bg-teal-50 text-teal-600 border-teal-200/60"     },
];

const DEFINITIONS_DATA = [
  {
    key: "banks",
    title: "بانک‌ها",
    description: "تعریف بانک‌های مورد استفاده",
    icon: Landmark,
    color: "bg-blue-50 text-blue-600 border-blue-200/60",
    items: DEFAULT_BANKS,
    modalDesc: "بانک‌های مورد استفاده در سیستم را تعریف کنید",
  },
  {
    key: "guarantee_types",
    title: "انواع ضمانت",
    description: "تعریف انواع ضمانت‌نامه",
    icon: Shield,
    color: "bg-rose-50 text-rose-600 border-rose-200/60",
    items: DEFAULT_GUARANTEE_TYPES,
    modalDesc: "انواع ضمانت قابل استفاده در فرم‌ها",
  },
  {
    key: "deposit_types",
    title: "انواع سپرده",
    description: "تعریف دسته‌بندی سپرده‌ها",
    icon: PiggyBank,
    color: "bg-teal-50 text-teal-600 border-teal-200/60",
    items: DEFAULT_DEPOSIT_TYPES,
    modalDesc: "انواع سپرده قابل انتخاب در فرم ثبت",
  },
  {
    key: "insurance_types",
    title: "انواع بیمه",
    description: "شرکت‌های بیمه طرف قرارداد",
    icon: BadgePercent,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200/60",
    items: DEFAULT_INSURANCE_TYPES,
    modalDesc: "شرکت‌ها و انواع بیمه مورد استفاده",
  },
  {
    key: "payment_types",
    title: "انواع پرداخت",
    description: "روش‌های پرداخت مجاز",
    icon: CreditCard,
    color: "bg-amber-50 text-amber-600 border-amber-200/60",
    items: DEFAULT_PAYMENT_TYPES,
    modalDesc: "روش‌های پرداخت قابل انتخاب در فرم‌ها",
  },
  {
    key: "persons",
    title: "اشخاص",
    description: "تعریف اشخاص حقیقی و حقوقی",
    icon: Users,
    color: "bg-purple-50 text-purple-600 border-purple-200/60",
    items: [],
    modalDesc: "اشخاص حقیقی و حقوقی طرف معامله",
  },
];

const MAIN_SECTIONS = [
  { title: "تنظیم اسناد",  desc: "صدور، جستجو و انتقال اسناد مالی",    to: "/document-setup",               icon: FileText       },
  { title: "اعتبارات",      desc: "موافقت‌نامه، تخصیص و تامین اعتبار",   to: "/credits",                      icon: CreditCard     },
  { title: "دفترداری",      desc: "دفاتر، تراز و صورت‌های مالی",         to: "/bookkeeping",                  icon: BookOpen       },
  { title: "صدور چک",      desc: "مدیریت چک‌ها و پرداخت‌های بانکی",     to: "/check-issuance",               icon: ArrowLeftRight },
  { title: "تضمینات",       desc: "ثبت و پیگیری ضمانت‌نامه‌ها",          to: "/guarantees",                   icon: Shield         },
  { title: "سپرده‌ها",      desc: "ثبت و مدیریت سپرده‌های مالی",         to: "/deposits",                     icon: PiggyBank      },
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
      <div className="mb-4 max-h-60 overflow-y-auto rounded-xl border bg-background/50 shadow-inner">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground font-medium">هیچ موردی تعریف نشده است.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/80 text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-2.5 text-right font-semibold">کد</th>
                <th className="px-4 py-2.5 text-right font-semibold">عنوان</th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-muted/40 transition-colors bg-card/60">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{item.code}</td>
                  <td className="px-4 py-3 font-semibold text-foreground/90">{item.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all shadow-sm border border-transparent hover:border-border">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(item.id)} className="rounded-lg p-1.5 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-all shadow-sm border border-transparent hover:border-destructive/20">
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
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <p className="text-sm font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent" />
            {editing === "new" ? "افزودن مورد جدید" : "ویرایش مورد"}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="def-code" className="text-xs font-semibold">کد</Label>
              <Input id="def-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="مثلا: BNK" className="h-9 text-sm font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="def-name" className="text-xs font-semibold">عنوان <span className="text-destructive">*</span></Label>
              <Input id="def-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="نام را وارد کنید" className="h-9 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={cancelEdit}>انصراف</Button>
            <Button size="sm" onClick={save} disabled={!form.name.trim()}>ذخیره اطلاعات</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={openNew} className="w-full h-10 border-dashed border-2 hover:border-primary hover:bg-primary/5 font-semibold text-xs md:text-sm">
          <Plus className="h-4 w-4 mr-1.5" /> افزودن مورد جدید
        </Button>
      )}

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>بستن</Button>
        <Button onClick={onClose}>تایید و نهایی‌سازی</Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── کامپوننت اصلی ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  // بهینه‌سازی محاسبات با useMemo برای جلوگیری از رندر مجدد غیرضروری
  const now = useMemo(() => new Date().toLocaleDateString("fa-IR", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  }), []);

  const definitions = useMemo(() => DEFINITIONS_DATA, []);
  const alerts = useMemo(() => ALERTS, []);
  const quickAccess = useMemo(() => QUICK_ACCESS, []);
  const mainSections = useMemo(() => MAIN_SECTIONS, []);

  const activeDef = useMemo(() => definitions.find((d) => d.key === activeModal), [definitions, activeModal]);

  return (
    <PageShell>
      {/* بنر خوش‌آمدگویی شکیل */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 rounded-2xl bg-gradient-to-l from-primary via-primary/95 to-sidebar-background text-primary-foreground shadow-lg border border-primary/20 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-sidebar-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <div className="flex items-center gap-2 text-accent font-bold text-xs md:text-sm bg-accent/10 px-3 py-1 rounded-full w-fit border border-accent/20">
            <Sparkles className="h-4 w-4" />
            <span>سیستم جامع نظام مالی بخش عمومی</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">خوش آمدید، {user?.username}</h1>
          <p className="text-xs md:text-sm text-primary-foreground/80 font-medium">امروز {now} — کلیه سیستم‌ها در وضعیت عملیاتی قرار دارند.</p>
        </div>
        <div className="relative mt-4 sm:mt-0 flex items-center gap-3 bg-card/10 backdrop-blur-md px-5 py-3 rounded-xl border border-primary-foreground/20 shadow-inner">
          <Landmark className="h-8 w-8 text-accent animate-pulse" />
          <div>
            <p className="text-[11px] text-primary-foreground/70 font-semibold">دوره مالی فعال</p>
            <p className="text-sm font-bold text-accent">سال مالی جاری</p>
          </div>
        </div>
      </div>

      {/* هشدارها */}
      <StaggerContainer className="mb-6 space-y-3" staggerDelay={0.08}>
        {alerts.map((a, i) => (
          <StaggerItem key={i}>
            <div className="flex items-center gap-3.5 rounded-xl border bg-card px-5 py-3.5 text-sm shadow-sm transition-all hover:shadow md:text-sm text-xs">
              {a.type === "warning" ? <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 animate-bounce" />
               : a.type === "success" ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
               : <Clock className="h-5 w-5 text-blue-500 shrink-0" />}
              <span className="font-semibold text-foreground/90">{a.text}</span>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* کارت‌های آمار */}
      <StaggerContainer className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4" staggerDelay={0.1}>
        {[
          { label: "اسناد این ماه",   value: "—", icon: FileText,       color: "text-primary",     bg: "bg-primary/10 border-primary/20"  },
          { label: "چک‌های صادره",    value: "—", icon: ArrowLeftRight,  color: "text-amber-600",   bg: "bg-amber-50 border-amber-200"    },
          { label: "ضمانت‌نامه فعال", value: "—", icon: Shield,          color: "text-rose-600",    bg: "bg-rose-50 border-rose-200"     },
          { label: "عملکرد بودجه",    value: "—", icon: TrendingUp,      color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200"  },
        ].map((item, i) => (
          <StaggerItem key={i}>
            <ScaleOnHover>
              <Card className="p-5 border-border hover:border-primary/30 transition-all duration-300 group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                    <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}</p>
                  </div>
                  <motion.div
                    initial={{ rotate: -10, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 + i * 0.1 }}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.bg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}
                  >
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </motion.div>
                </div>
              </Card>
            </ScaleOnHover>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* دسترسی سریع */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="mb-6 border-border shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-3 border-b border-border/60 mb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-primary">
              <LayoutDashboard className="h-5 w-5 text-accent" />
              دسترسی سریع
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground">پرکاربردترین عملیات‌ها و فرم‌های دسترسی سامانه</CardDescription>
          </CardHeader>
          <CardContent>
            <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" staggerDelay={0.06}>
              {quickAccess.map((item) => (
                <StaggerItem key={item.to}>
                  <ScaleOnHover scale={1.04}>
                    <button onClick={() => navigate(item.to)}
                      className="group flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold leading-tight text-foreground/90 group-hover:text-primary transition-colors">{item.label}</span>
                    </button>
                  </ScaleOnHover>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* تعاریف پایه */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="mb-6 border-border shadow-sm hover:shadow-md transition-all">
          <CardHeader className="pb-3 border-b border-border/60 mb-4">
            <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-primary">
              <ListChecks className="h-5 w-5 text-accent" />
              تعاریف پایه سیستم
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground">پیش از ورود اطلاعات، جداول و نیازمندی‌های پایه را تعریف و بازبینی کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" staggerDelay={0.06}>
              {definitions.map((def) => (
                <StaggerItem key={def.key}>
                  <ScaleOnHover scale={1.04}>
                    <button onClick={() => setActiveModal(def.key)}
                      className="group flex w-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${def.color} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                        <def.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-bold leading-tight text-foreground/90 group-hover:text-primary transition-colors">{def.title}</span>
                      <Badge variant="secondary" className="text-[11px] px-2 py-0.5 bg-muted font-mono font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {def.items.length} مورد
                      </Badge>
                    </button>
                  </ScaleOnHover>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* بخش‌های اصلی */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold text-primary border-r-4 border-accent pr-3">بخش‌های اصلی و ماژول‌ها</h2>
      </div>
      <StaggerContainer className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
        {mainSections.map((item, i) => (
          <StaggerItem key={i}>
            <ScaleOnHover scale={1.02}>
              <Card className="group cursor-pointer border-border hover:border-primary/40 transition-all duration-300 hover:shadow-lg bg-card overflow-hidden" onClick={() => navigate(item.to)}>
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 12, scale: 1.08 }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm"
                    >
                      <item.icon className="h-6 w-6" />
                    </motion.div>
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent/10 text-accent opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300 shadow-sm">
                      <ChevronLeft className="h-5 w-5" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</CardDescription>
                </CardHeader>
              </Card>
            </ScaleOnHover>
          </StaggerItem>
        ))}
      </StaggerContainer>

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
