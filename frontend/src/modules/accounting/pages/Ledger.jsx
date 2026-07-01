import { useEffect, useState } from "react";
import { RefreshCw, FileDown, TrendingUp, TrendingDown, Scale, Search } from "lucide-react";
import api from "../api";
import { PageShell, PageHeader, LoadingSkeleton } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function formatAmount(val) {
  if (val == null || val === 0) return "—";
  return Number(val).toLocaleString("fa-IR");
}

function BalanceCard({ label, value, icon: Icon, color }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-xl font-bold", color)}>
            {value != null ? Number(value).toLocaleString("fa-IR") + " ریال" : "—"}
          </p>
        </div>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", color === "text-emerald-600" ? "bg-emerald-50" : color === "text-destructive" ? "bg-red-50" : "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </Card>
  );
}

export default function Ledger() {
  const [data, setData]       = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      api.get("/api/ledger/"),
      api.get("/api/ledger/balance"),
    ])
      .then(([ledgerRes, balanceRes]) => {
        setData(ledgerRes.data.data ?? []);
        setBalance(balanceRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const isBalanced = balance && balance.total_debit === balance.total_credit;

  const filtered = data.filter((r) =>
    r.doc_number?.toString().includes(search) ||
    r.account_code?.toString().includes(search) ||
    r.description?.includes(search)
  );

  return (
    <PageShell>
      <PageHeader title="دفتر کل" description="گزارش کلیه رویدادهای مالی ثبت‌شده">
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          بروزرسانی
        </Button>
        <Button variant="outline" size="sm">
          <FileDown className="h-4 w-4" />
          خروجی اکسل
        </Button>
      </PageHeader>

      {/* کارت‌های تراز */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <BalanceCard label="جمع بدهکار"   value={balance?.total_debit}   icon={TrendingDown} color="text-destructive" />
        <BalanceCard label="جمع بستانکار" value={balance?.total_credit}  icon={TrendingUp}   color="text-emerald-600" />
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">وضعیت تراز</p>
              <p className={cn("mt-1 text-xl font-bold", isBalanced ? "text-emerald-600" : "text-destructive")}>
                {balance == null ? "—" : isBalanced ? "متراز" : "ناتراز"}
              </p>
            </div>
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", isBalanced ? "bg-emerald-50" : "bg-red-50")}>
              <Scale className={cn("h-5 w-5", isBalanced ? "text-emerald-600" : "text-destructive")} />
            </div>
          </div>
          {balance && !isBalanced && (
            <p className="mt-2 text-xs text-destructive">
              مغایرت: {Math.abs(balance.total_debit - balance.total_credit).toLocaleString("fa-IR")} ریال
            </p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">
              رویدادهای مالی
              {!loading && (
                <Badge variant="secondary" className="mr-2 text-xs">
                  {filtered.length.toLocaleString("fa-IR")} رکورد
                </Badge>
              )}
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو در دفتر..."
                className="pr-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><LoadingSkeleton rows={7} /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {search ? "نتیجه‌ای یافت نشد" : "رکوردی وجود ندارد"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره سند</TableHead>
                  <TableHead>کد حساب</TableHead>
                  <TableHead>شرح</TableHead>
                  <TableHead>بدهکار (ریال)</TableHead>
                  <TableHead>بستانکار (ریال)</TableHead>
                  <TableHead>تاریخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{row.doc_number}</TableCell>
                    <TableCell className="font-mono">{row.account_code}</TableCell>
                    <TableCell>{row.description ?? "—"}</TableCell>
                    <TableCell className={cn("font-medium", row.debit > 0 && "text-destructive")}>
                      {formatAmount(row.debit)}
                    </TableCell>
                    <TableCell className={cn("font-medium", row.credit > 0 && "text-emerald-600")}>
                      {formatAmount(row.credit)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.date ?? "—"}</TableCell>
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
