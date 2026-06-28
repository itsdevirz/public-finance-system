import { useState } from "react";
import { motion } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { StaggerContainer, StaggerItem } from "@/components/motion/AnimatedPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Search, Trash2, Pencil, ChevronLeft, FolderTree,
} from "lucide-react";

const SAMPLE_ACCOUNTS = [
  { id: 1, code: "1", title: "دارایی‌ها", level: "گروه", children: 4 },
  { id: 2, code: "2", title: "بدهی‌ها", level: "گروه", children: 3 },
  { id: 3, code: "3", title: "حقوق صاحبان سهام", level: "گروه", children: 2 },
  { id: 4, code: "4", title: "درآمدها", level: "گروه", children: 5 },
  { id: 5, code: "5", title: "هزینه‌ها", level: "گروه", children: 6 },
  { id: 6, code: "6", title: "حساب‌های انتظامی", level: "گروه", children: 2 },
];

export default function AccountHeads() {
  const [accounts] = useState(SAMPLE_ACCOUNTS);
  const [search, setSearch] = useState("");

  const filtered = accounts.filter(
    (a) => a.title.includes(search) || a.code.includes(search)
  );

  return (
    <PageShell>
      <PageHeader title="تعریف سرفصل حساب‌ها" description="مدیریت ساختار درختی سرفصل حساب‌ها (گروه، کل، معین، تفصیلی)">
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          سرفصل جدید
        </Button>
      </PageHeader>

      {/* جستجو */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="جستجو بر اساس کد یا عنوان سرفصل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* جدول سرفصل‌ها */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderTree className="h-4 w-4" />
              لیست سرفصل‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">کد</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">عنوان سرفصل</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">سطح</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">زیرمجموعه</th>
                    <th className="px-4 py-3 w-24" />
                  </tr>
                </thead>
                <tbody>
                  <StaggerContainer staggerDelay={0.05}>
                    {filtered.map((account) => (
                      <StaggerItem key={account.id}>
                        <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{account.code}</td>
                          <td className="px-4 py-3 font-medium">{account.title}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs">{account.level}</Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{account.children} مورد</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1 justify-end">
                              <button className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                              <button className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button className="rounded p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  نتیجه‌ای یافت نشد
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </PageShell>
  );
}
