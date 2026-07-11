import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";

export default function ContractListReport() {
  const [contracts, setContracts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contracts");
      setContracts(res.data.data || []);
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.contract_number || "").toLowerCase().includes(q) ||
      (c.title || "").toLowerCase().includes(q) ||
      (c.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">گزارش قراردادها</h1>
            <p className="text-xs text-muted-foreground">لیست جامع و آخرین وضعیت مالی قراردادهای فعال و غیرفعال سازمان</p>
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
                placeholder="جستجو بر اساس شماره قرارداد، عنوان، پیمانکار..."
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
                      <TableHead className="text-center text-xs py-2">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs py-2">عنوان قرارداد</TableHead>
                      <TableHead className="text-right text-xs py-2">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ شروع</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ پایان</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ اولیه (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">تغییرات (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ کل فعلی (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((c, idx) => {
                      const initialAmt = Number(c.amount || 0);
                      const increase = Number(c.increase_amount || 0);
                      const decrease = Number(c.decrease_amount || 0);
                      const totalAdjustments = increase - decrease;
                      const currentAmt = initialAmt + totalAdjustments;

                      return (
                        <TableRow key={c._id}>
                          <TableCell className="font-mono text-[11px] py-2 text-center">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-semibold">{c.contract_number}</TableCell>
                          <TableCell className="text-right text-xs max-w-xs truncate">{c.title}</TableCell>
                          <TableCell className="text-right text-xs font-medium">{c.contractor_name}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{c.start_date || "-"}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{c.end_date || "-"}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{initialAmt.toLocaleString()}</TableCell>
                          <TableCell className={`font-mono text-xs text-center ${totalAdjustments > 0 ? "text-emerald-600" : totalAdjustments < 0 ? "text-red-500" : ""}`}>
                            {totalAdjustments > 0 ? "+" : ""}{totalAdjustments.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-center font-bold text-blue-600">{currentAmt.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                              {c.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredContracts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-xs py-8 text-muted-foreground">قراردادی یافت نشد.</TableCell>
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
