import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { StaggerContainer, StaggerItem, ScaleOnHover } from "@/components/motion/AnimatedPage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Trash2, Pencil, FolderTree, FileText, Grid3X3,
  ChevronLeft, ChevronDown, ChevronUp,
} from "lucide-react";
import { ACC_TAG_MATRIX } from "@/data/sanamaConfig";

const ACCOUNT_SERIES = [
  { code: "100", label: "دارایی‌ها", color: "bg-blue-50 text-blue-600" },
  { code: "200", label: "بدهی‌ها", color: "bg-red-50 text-red-600" },
  { code: "300", label: "حقوق صاحبان سهام", color: "bg-purple-50 text-purple-600" },
  { code: "400", label: "درآمدها", color: "bg-emerald-50 text-emerald-600" },
  { code: "500", label: "هزینه‌ها", color: "bg-amber-50 text-amber-600" },
  { code: "800", label: "حساب‌های انتظامی", color: "bg-slate-100 text-slate-600" },
  { code: "900", label: "حساب‌های بودجه‌ای", color: "bg-teal-50 text-teal-600" },
];

export default function AccountHeads() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [expandedSeries, setExpandedSeries] = useState(null);

  const allAccounts = Object.entries(ACC_TAG_MATRIX).map(([code, data]) => ({
    code,
    ...data,
    series: code[0] + "00",
  }));

  const filtered = allAccounts.filter(
    (a) => a.label.includes(search) || a.code.includes(search)
  );

  function toggleSeries(code) {
    setExpandedSeries((prev) => (prev === code ? null : code));
  }

  return (
    <PageShell>
      <PageHeader title="تعریف سرفصل حساب‌ها" description="مدیریت ساختار درختی سرفصل‌ها بر اساس الزامات سناما">
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/basic-info/account-heads/register-document")}>
          <FileText className="h-4 w-4" />
          ثبت سند مالی
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/basic-info/account-heads/tag-matrix")}>
          <Grid3X3 className="h-4 w-4" />
          ماتریس تگ‌ها
        </Button>
      </PageHeader>

      {/* دسترسی سریع */}
      <StaggerContainer className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7" staggerDelay={0.05}>
        {ACCOUNT_SERIES.map((s) => (
          <StaggerItem key={s.code}>
            <ScaleOnHover scale={1.04}>
              <button
                onClick={() => toggleSeries(s.code)}
                className={`flex w-full flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                  expandedSeries === s.code ? "ring-2 ring-primary/30 bg-accent" : "bg-muted/30 hover:bg-accent"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${s.color}`}>
                  {s.code}
                </div>
                <span className="text-[11px] font-medium leading-tight">{s.label}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {allAccounts.filter((a) => a.series === s.code).length} حساب
                </Badge>
              </button>
            </ScaleOnHover>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* جستجو */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="جستجو بر اساس کد یا عنوان حساب معین..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* جدول سرفصل‌ها */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4" />
              لیست حساب‌های معین
            </CardTitle>
            <CardDescription>
              {expandedSeries
                ? `نمایش حساب‌های سری ${expandedSeries}`
                : "همه حساب‌های تعریف‌شده"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-20">کد</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">عنوان حساب</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground w-32">تگ‌های الزامی</th>
                    <th className="px-4 py-3 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {(expandedSeries ? filtered.filter((a) => a.series === expandedSeries) : filtered).map((account) => (
                    <tr key={account.code} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold">{account.code}</td>
                      <td className="px-4 py-3 font-medium">{account.label}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {account.tags.length} تگ
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => navigate(`/basic-info/account-heads/register-document?acc=${account.code}`)}
                            className="rounded p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="ثبت سند"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  نتیجه‌ای یافت نشد
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageShell>
  );
}
