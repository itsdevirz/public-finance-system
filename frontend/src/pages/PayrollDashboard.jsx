import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, Calculator, FileText, CreditCard,
  TrendingUp, AlertTriangle, Clock, ChevronLeft,
  Printer, BarChart3,
} from "lucide-react";

const STATS = [
  { label: "کل کارکنان",      value: "۴۸",           icon: Users,       color: "text-primary",     bg: "bg-primary/10"  },
  { label: "حقوق این ماه",    value: "۸۵۰ م ت",     icon: CreditCard,  color: "text-emerald-600", bg: "bg-emerald-50"  },
  { label: "بیمه این ماه",    value: "۵۹ م ت",      icon: TrendingUp,  color: "text-blue-600",    bg: "bg-blue-50"     },
  { label: "مالیات این ماه",  value: "۳۸ م ت",      icon: BarChart3,   color: "text-amber-600",   bg: "bg-amber-50"    },
  { label: "وام فعال",         value: "۱۲",           icon: FileText,    color: "text-purple-600",  bg: "bg-purple-50"   },
  { label: "فیش صادر نشده",   value: "۳",            icon: AlertTriangle, color: "text-rose-600",  bg: "bg-rose-50"     },
];

const QUICK = [
  { label: "محاسبه ماهانه",  to: "/payroll/calculate/monthly", icon: Calculator, color: "bg-primary/10 text-primary"     },
  { label: "کارمند جدید",    to: "/payroll/employees/new",      icon: Users,      color: "bg-emerald-50 text-emerald-600" },
  { label: "ثبت کارکرد",     to: "/payroll/attendance/register",icon: Clock,      color: "bg-blue-50 text-blue-600"       },
  { label: "فیش حقوقی",      to: "/payroll/payslip/view",       icon: Printer,    color: "bg-amber-50 text-amber-600"     },
  { label: "لیست بیمه",      to: "/payroll/reports/insurance",  icon: FileText,   color: "bg-purple-50 text-purple-600"   },
  { label: "لیست مالیات",    to: "/payroll/reports/tax",        icon: BarChart3,  color: "bg-rose-50 text-rose-600"       },
];

const RECENT_PAYSLIPS = [
  { code: "P001", name: "علی احمدی",   dept: "IT",    net: 19_300_000, month: "خرداد ۱۴۰۳", status: "paid" },
  { code: "P002", name: "مریم حسینی",  dept: "مالی",  net: 15_800_000, month: "خرداد ۱۴۰۳", status: "paid" },
  { code: "P003", name: "رضا کریمی",   dept: "اداری", net: 28_500_000, month: "خرداد ۱۴۰۳", status: "pending" },
];

export default function PayrollDashboard() {
  const navigate = useNavigate();

  return (
    <PageShell>
      <PageHeader title="داشبورد حقوق و دستمزد" description="نمای کلی وضعیت حقوق سازمان">
        <Button size="sm" onClick={() => navigate("/payroll/calculate/monthly")}>
          <Calculator className="h-4 w-4" /> محاسبه ماه جاری
        </Button>
      </PageHeader>

      {/* آمار */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STATS.map((s, i) => (
          <Card key={i} className="p-4 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* دسترسی سریع */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">عملیات سریع</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map((item) => (
                <button key={item.to} onClick={() => navigate(item.to)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 p-3 text-center transition-all duration-200 hover:bg-accent hover:-translate-y-0.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color} transition-transform duration-200 group-hover:scale-110`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* آخرین فیش‌ها */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">آخرین فیش‌های حقوقی</CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/payroll/payslip/view")}>
                همه فیش‌ها <ChevronLeft className="h-3 w-3 mr-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">کد</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">نام</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">واحد</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">خالص پرداختی</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">ماه</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_PAYSLIPS.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate("/payroll/payslip/view")}>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.code}</td>
                    <td className="px-4 py-2.5 font-medium text-xs">{r.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.dept}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{r.net.toLocaleString("fa-IR")} ریال</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.month}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={r.status === "paid" ? "outline" : "secondary"} className="text-[10px]">
                        {r.status === "paid" ? "پرداخت شده" : "در انتظار"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
