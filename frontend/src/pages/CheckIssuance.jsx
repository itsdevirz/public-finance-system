import { useEffect, useState } from "react";
import { FileX } from "lucide-react";
import api from "../api";
import { PageShell, PageHeader, EmptyState, LoadingSkeleton } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusVariant = {
  صادر: "info",
  "پاس‌شده": "success",
  ابطالی: "destructive",
  برگشتی: "warning",
};

export default function CheckIssuance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/checks/")
      .then((res) => setData(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <PageHeader title="صدور چک" description="مدیریت و مشاهده چک‌های صادر شده" />

      <Card>
        <CardContent className="p-0 pt-6">
          {loading ? (
            <div className="px-6 pb-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : data.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState icon={FileX} title="چکی وجود ندارد" description="هنوز چکی ثبت نشده است" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره چک</TableHead>
                  <TableHead>مبلغ (ریال)</TableHead>
                  <TableHead>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((check, i) => (
                  <TableRow
                    key={check._id}
                    className="animate-in fade-in slide-in-from-bottom-1 duration-300"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <TableCell className="font-medium">{check.check_number}</TableCell>
                    <TableCell>{Number(check.amount).toLocaleString("fa-IR")}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[check.status] ?? "secondary"}>{check.status}</Badge>
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
