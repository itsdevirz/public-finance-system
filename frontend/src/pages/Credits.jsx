import { useEffect, useState } from "react";
import { FileX } from "lucide-react";
import api from "../api";
import { PageShell, PageHeader, EmptyState, LoadingSkeleton } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Credits() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/credits/agreements")
      .then((res) => setAgreements(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <PageHeader title="اعتبارات" description="لیست موافقتنامه‌ها و اعتبارات" />

      <Card>
        <CardContent className="p-0 pt-6">
          {loading ? (
            <div className="px-6 pb-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : agreements.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={FileX} title="موافقتنامه‌ای وجود ندارد" description="هنوز داده‌ای ثبت نشده است" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره موافقتنامه</TableHead>
                  <TableHead>عنوان</TableHead>
                  <TableHead>مبلغ (ریال)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((a, i) => (
                  <TableRow
                    key={a._id}
                    className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <TableCell className="font-medium">{a.agreement_number}</TableCell>
                    <TableCell>{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="info">{Number(a.total_amount).toLocaleString("fa-IR")}</Badge>
                    </TableCell>
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
