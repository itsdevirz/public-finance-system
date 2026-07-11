import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContractChangesReport() {
  const [changes, setChanges] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchChanges = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-changes-25");
      if (res.data?.success) {
        setChanges(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching changes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const filteredChanges = changes.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.request_number || "").toLowerCase().includes(q) ||
      (c.contract_number || "").toLowerCase().includes(q) ||
      (c.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">گزارش ابلاغیه افزایش و کاهش ۲۵ درصد تغییرات</h1>
            <p className="text-xs text-muted-foreground">لیست درخواست‌ها و ابلاغیه‌های افزایش یا کاهش ۲۵ درصد حجم و مبلغ پیمان</p>
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
                placeholder="جستجو بر اساس شماره درخواست، قرارداد، پیمانکار..."
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
                      <TableHead className="text-center text-xs py-2">شماره درخواست</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ درخواست</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs py-2">پیمانکار</TableHead>
                      <TableHead className="text-center text-xs py-2">نوع تغییر</TableHead>
                      <TableHead className="text-center text-xs py-2">درصد تغییر</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ تغییر (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ جدید (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChanges.map((c, idx) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-mono text-[11px] py-2 text-center">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold">{c.request_number}</TableCell>
                        <TableCell className="font-mono text-xs text-center">{c.request_date}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-semibold text-blue-600">{c.contract_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{c.contractor_name}</TableCell>
                        <TableCell className="text-center text-xs">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                            c.change_type === "کاهش 25 درصد" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {c.change_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-center">%{c.change_percent}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-semibold text-emerald-600">{Number(c.change_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold text-blue-600">{Number(c.new_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500">
                            {c.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredChanges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-xs py-8 text-muted-foreground">ابلاغیه تغییراتی یافت نشد.</TableCell>
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
