import { useState } from "react";
import { motion } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, Circle } from "lucide-react";
import { SANAMA_TAGS, TAG_GROUPS, ACC_TAG_MATRIX } from "@/data/sanamaConfig";

export default function SanamaTagMatrix() {
  const [search, setSearch] = useState("");

  const accounts = Object.entries(ACC_TAG_MATRIX).map(([code, data]) => ({
    code,
    ...data,
  }));

  const filteredAccounts = accounts.filter(
    (a) => a.label.includes(search) || a.code.includes(search)
  );

  const filteredTags = SANAMA_TAGS.filter(
    (t) => !search || t.label.includes(search) || t.key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageShell>
      <PageHeader title="ماتریس تگ‌های سناما" description="نمایش تگ‌های الزامی هر حساب معین بر اساس استاندارد سناما" />

      {/* جستجو */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="جستجو بر اساس نام تگ یا کد حساب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* راهنمای گروه‌ها */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4 flex flex-wrap gap-2"
      >
        {TAG_GROUPS.map((g) => (
          <Badge key={g.key} variant="outline" className="text-[10px]">
            {g.label}
          </Badge>
        ))}
      </motion.div>

      {/* ماتریس */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ماتریس الزامات</CardTitle>
            <CardDescription className="text-xs">
              ✓ = تگ الزامی | خالی = غیرالزامی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-[11px] border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky right-0 z-10 bg-muted/80 backdrop-blur px-3 py-2 text-right font-medium border-l min-w-[140px]">
                      حساب معین
                    </th>
                    {filteredTags.slice(0, 20).map((tag) => (
                      <th
                        key={tag.key}
                        className="px-1.5 py-2 text-center font-medium whitespace-nowrap border-l"
                        title={tag.tooltip}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[9px] text-muted-foreground">{tag.key}</span>
                          <span>{tag.label.slice(0, 8)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <tr key={account.code} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="sticky right-0 z-10 bg-card/90 backdrop-blur px-3 py-2 font-medium border-l">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{account.code}</span>
                          <span>{account.label}</span>
                        </div>
                      </td>
                      {filteredTags.slice(0, 20).map((tag) => (
                        <td key={tag.key} className="px-1.5 py-2 text-center border-l">
                          {account.tags.includes(tag.key) ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground/20 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTags.length > 20 && (
              <p className="mt-3 text-xs text-muted-foreground text-center">
                نمایش ۲۰ تگ اول از {filteredTags.length} تگ — برای دیدن بقیه اسکرول کنید
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageShell>
  );
}
