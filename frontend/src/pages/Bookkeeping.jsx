import { useEffect, useState } from "react";
import { FileX, Scale } from "lucide-react";
import api from "../api";
import { PageShell, PageHeader, EmptyState, LoadingSkeleton } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Bookkeeping() {
  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/api/ledger/"), api.get("/api/ledger/balance")])
      .then(([l, b]) => {
        setData(l.data.data ?? []);
        setBalance(b.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isBalanced = balance && balance.total_debit === balance.total_credit;

  return (
    <PageShell>
      <PageHeader title="دفترداری و تنظیم حساب‌ها" description="دفتر کل و تراز حساب‌ها" />

      {balance && !loading && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-500">
          <Card className="rounded-xl">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مجموع بدهکار</p>
                <p className="text-lg font-bold">{Number(balance.total_debit).toLocaleString("fa-IR")} ریال</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">مجموع بستانکار</p>
                <p className="text-lg font-bold">{Number(balance.total_credit).toLocaleString("fa-IR")} ریال</p>
              </div>
            </CardContent>
          </Card>
          {isBalanced && (
            <div className="balance-box balanced sm:col-span-2 animate-in fade-in duration-500">
              تراز حساب‌ها برقرار است
            </div>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0 pt-6">
          {loading ? (
            <div className="px-6 pb-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : data.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={FileX} title="رکوردی وجود ندارد" description="هنوز سندی در دفتر کل ثبت نشده" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره سند</TableHead>
                  <TableHead>کد حساب</TableHead>
                  <TableHead>بدهکار</TableHead>
                  <TableHead>بستانکار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow
                    key={i}
                    className="animate-in fade-in duration-300"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <TableCell className="font-medium">{row.doc_number}</TableCell>
                    <TableCell>{row.account_code}</TableCell>
                    <TableCell>{Number(row.debit).toLocaleString("fa-IR")}</TableCell>
                    <TableCell>{Number(row.credit).toLocaleString("fa-IR")}</TableCell>
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
