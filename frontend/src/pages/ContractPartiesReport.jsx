import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import api from "@/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

export default function ContractPartiesReport() {
  const [parties, setParties] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const partiesRes = await api.get("/api/contract-parties");
      const contractsRes = await api.get("/api/contracts");
      setParties(partiesRes.data.data || []);
      setContracts(contractsRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter parties list
  const filteredParties = parties.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.code || "").toLowerCase().includes(q) ||
      (p.nationalId || "").toLowerCase().includes(q)
    );
  });

  return (
    <PageShell>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/80 pb-4 mb-5" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">گزارش خلاصه وضعیت پیمانکاران</h1>
            <p className="text-xs text-muted-foreground">خلاصه اطلاعات هویتی طرف‌های قرارداد، تعداد پیمان‌ها و مبالغ سپرده شده</p>
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
                placeholder="جستجو بر اساس نام پیمانکار، کد ملی/ثبت..."
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
                      <TableHead className="text-center text-xs py-2">کد پیمانکار</TableHead>
                      <TableHead className="text-right text-xs py-2">نام پیمانکار / شرکت</TableHead>
                      <TableHead className="text-center text-xs py-2">کد ملی / شناسه ملی</TableHead>
                      <TableHead className="text-center text-xs py-2">تعداد قراردادها</TableHead>
                      <TableHead className="text-center text-xs py-2">مجموع مبلغ قراردادها (ریال)</TableHead>
                      <TableHead className="text-center text-xs py-2">شماره تلفن</TableHead>
                      <TableHead className="text-center text-xs py-2 w-20">وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParties.map((p, idx) => {
                      // Sum contracts and total amount for this contractor
                      const contractorContracts = contracts.filter(
                        (c) => c.contractor_name === p.name
                      );
                      const contractCount = contractorContracts.length;
                      const totalAmt = contractorContracts.reduce(
                        (sum, c) => sum + (Number(c.amount) || 0),
                        0
                      );

                      return (
                        <TableRow key={p._id}>
                          <TableCell className="font-mono text-[11px] py-2 text-center">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-bold">{p.code}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-blue-600">{p.name}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{p.nationalId}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-bold text-amber-500">{contractCount}</TableCell>
                          <TableCell className="font-mono text-xs text-center font-bold text-emerald-600">{totalAmt.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs text-center">{p.phone || p.mobile || "-"}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "فعال" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                              {p.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredParties.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs py-8 text-muted-foreground">پیمانکاری یافت نشد.</TableCell>
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
