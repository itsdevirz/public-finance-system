import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Shield } from "lucide-react";

export default function ContractGuaranteesReport() {
  const [guarantees, setGuarantees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchGuarantees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/contract-guarantees");
      if (res.data?.success) {
        setGuarantees(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching guarantees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuarantees();
  }, []);

  const filteredGuarantees = guarantees.filter((g) => {
    const q = searchQuery.toLowerCase();
    return (
      (g.guarantee_number || "").toLowerCase().includes(q) ||
      (g.contract_number || "").toLowerCase().includes(q) ||
      (g.contractor_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">گزارش ضمانت‌نامه‌های قرارداد</h1>
            <p className="text-xs text-muted-foreground">مشاهده آخرین وضعیت سررسید، مبالغ و بانک‌های صادرکننده ضمانت‌نامه‌ها</p>
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
                placeholder="جستجو بر اساس شماره ضمانت، قرارداد، پیمانکار..."
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
                      <TableHead className="text-center text-xs py-2">شماره ضمانت‌نامه</TableHead>
                      <TableHead className="text-right text-xs py-2">نوع ضمانت‌نامه</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره قرارداد</TableHead>
                      <TableHead className="text-right text-xs py-2">پیمانکار</TableHead>
                      <TableHead className="text-right text-xs py-2">بانک صادرکننده</TableHead>
                      <TableHead className="text-center text-xs py-2">مبلغ ضمانت‌نامه (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">تاریخ سررسید</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuarantees.map((g, idx) => (
                      <TableRow key={g._id}>
                        <TableCell className="font-mono text-[11px] py-2 text-center">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-bold">{g.guarantee_number}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{g.guarantee_type}</TableCell>
                        <TableCell className="font-mono text-xs text-center font-semibold text-blue-600">{g.contract_number}</TableCell>
                        <TableCell className="text-right text-xs">{g.contractor_name}</TableCell>
                        <TableCell className="text-right text-xs">{g.issuing_bank} (شعبه {g.branch || "-"})</TableCell>
                        <TableCell className="font-mono text-xs text-center font-semibold">{Number(g.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs text-center text-rose-600 font-bold">{g.expiry_date}</TableCell>
                        <TableCell className="text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${g.status === "فعال" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {g.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredGuarantees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-xs py-8 text-muted-foreground">ضمانت‌نامه‌ای یافت نشد.</TableCell>
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
