import { useEffect, useState } from "react";
import { Search, Plus, FileDown, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import api from "../api";
import { PageShell, PageHeader, LoadingSkeleton } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const STATUS_MAP = {
  issued:   { label: "صادر شده",  variant: "secondary", icon: Clock },
  passed:   { label: "پاس شده",   variant: "success",   icon: CheckCircle2 },
  void:     { label: "باطل شده",  variant: "destructive", icon: XCircle },
  returned: { label: "برگشتی",    variant: "outline",   icon: XCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, variant: "outline" };
  return (
    <Badge variant={s.variant} className="gap-1 text-xs">
      {s.icon && <s.icon className="h-3 w-3" />}
      {s.label}
    </Badge>
  );
}

function formatAmount(amount) {
  if (amount == null) return "—";
  return Number(amount).toLocaleString("fa-IR") + " ریال";
}

export default function Checks() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  function load() {
    setLoading(true);
    api.get("/api/checks/")
      .then((res) => setData(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = data.filter((c) =>
    c.check_number?.toString().includes(search) ||
    c.payee?.includes(search) ||
    c.status?.includes(search)
  );

  const summary = {
    total:   data.length,
    issued:  data.filter((c) => c.status === "issued").length,
    passed:  data.filter((c) => c.status === "passed").length,
    void:    data.filter((c) => c.status === "void").length,
  };

  return (
    <PageShell>
      <PageHeader title="مدیریت چک‌ها" description="مشاهده و پیگیری وضعیت چک‌های صادره">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          بروزرسانی
        </Button>
        <Button variant="outline" size="sm">
          <FileDown className="h-4 w-4" />
          خروجی اکسل
        </Button>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          صدور چک جدید
        </Button>
      </PageHeader>

      {/* خلاصه وضعیت */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "کل چک‌ها",    value: summary.total,  color: "text-primary"     },
          { label: "صادر شده",    value: summary.issued, color: "text-amber-600"   },
          { label: "پاس شده",     value: summary.passed, color: "text-emerald-600" },
          { label: "باطل شده",    value: summary.void,   color: "text-destructive" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold ${item.color}`}>
              {item.value.toLocaleString("fa-IR")}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">لیست چک‌ها</CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو در چک‌ها..."
                className="pr-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><LoadingSkeleton rows={6} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {search ? "نتیجه‌ای یافت نشد" : "چکی وجود ندارد"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره چک</TableHead>
                  <TableHead>ذینفع</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>تاریخ صدور</TableHead>
                  <TableHead>تاریخ سررسید</TableHead>
                  <TableHead>بانک / حساب</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((check) => (
                  <TableRow key={check._id}>
                    <TableCell className="font-mono font-medium">{check.check_number}</TableCell>
                    <TableCell>{check.payee ?? "—"}</TableCell>
                    <TableCell className="font-medium">{formatAmount(check.amount)}</TableCell>
                    <TableCell>{check.issue_date ?? "—"}</TableCell>
                    <TableCell>{check.due_date ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{check.bank_account ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={check.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
