import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Percent } from "lucide-react";

export default function ContractDeductionsReport() {
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-payments");
      if (res.data?.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.payment_number || "").toLowerCase().includes(q) ||
      (p.contract_number || "").toLowerCase().includes(q) ||
      (p.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">گزارش کسورات قانونی قراردادها</h1>
            <p className="text-xs text-muted-foreground">خلاصه مبالغ سپرده حسن انجام کار، مالیات، بیمه و سایر کسورات کسر شده</p>
          </div>
        </div>
      </div>

      <div className="space-y-6" dir="rtl">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-4 bg-muted/10">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس شماره پرداخت، قرارداد، پیمانکار..."
                className="h-9 pr-9 text-xs text-right w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">در حال بارگذاری اطلاعات گزارش...</div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="text-right text-xs py-2 w-10">ردیف</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره پرداخت</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs py-2">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ ناخالص (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">سپرده حسن انجام کار (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">مالیات (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">بیمه (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">سایر کسورات (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">جمع کل کسورات (ریال)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((p, idx) => {
                      // Sum by deduction category
                      let retention = 0;
                      let tax = 0;
                      let insurance = 0;
                      let others = 0;

                      (p.deductions_list || []).forEach((d) => {
                        const type = d.deduction_type || "";
                        if (type.includes("سپرده حسن") || type.includes("حسن انجام")) {
                          retention += Number(d.calculated_amount || d.amount || 0);
                        } else if (type.includes("مالیات")) {
                          tax += Number(d.calculated_amount || d.amount || 0);
                        } else if (type.includes("بیمه")) {
                          insurance += Number(d.calculated_amount || d.amount || 0);
                        } else {
                          others += Number(d.calculated_amount || d.amount || 0);
                        }
                      });

                      return (
                        <TableRow key={p._id}>
                          <TableCell className="font-mono text-[11px] py-2 text-center">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-bold">{p.payment_number}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-semibold text-blue-600">{p.contract_number}</TableCell>
                          <TableCell className="text-right text-xs">{p.contractor_name}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-semibold">{Number(p.gross_amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs text-center text-amber-600">{retention.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs text-center text-purple-600">{tax.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs text-center text-indigo-600">{insurance.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs text-center text-muted-foreground">{others.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-bold text-red-500">-{Number(p.total_deductions || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-xs py-8 text-muted-foreground">اطلاعات کسوراتی یافت نشد.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
