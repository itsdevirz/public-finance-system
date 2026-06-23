import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { StaggerContainer, StaggerItem, ScaleOnHover } from "@/components/motion/AnimatedPage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, ChevronLeft, ChevronDown, Layers, FolderTree,
} from "lucide-react";
import sanamaCodes from "@/data/sanamaCodes.json";

const ACCOUNT_GROUPS = sanamaCodes.groups.map((g, i) => ({
  id: i + 1,
  code: g.code,
  title: g.title,
  color: [
    "bg-blue-50 text-blue-600",
    "bg-rose-50 text-rose-600",
    "bg-emerald-50 text-emerald-600",
    "bg-amber-50 text-amber-600",
    "bg-purple-50 text-purple-600",
    "bg-red-50 text-red-600",
    "bg-teal-50 text-teal-600",
    "bg-indigo-50 text-indigo-600",
    "bg-orange-50 text-orange-600",
  ][i],
  accounts: g.accounts,
}));

function AccountRow({ account, idx }) {
  const [open, setOpen] = useState(false);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.04, duration: 0.3 }}
        onClick={() => hasChildren && setOpen(!open)}
        className={`border-b last:border-0 transition-colors ${
          hasChildren ? "cursor-pointer hover:bg-primary/5" : "hover:bg-muted/30"
        } ${open ? "bg-primary/5" : ""}`}
      >
        <td className="px-4 py-2.5">
          <Badge variant="secondary" className="font-mono text-xs">
            {account.code}
          </Badge>
        </td>
        <td className="px-4 py-2.5 font-medium text-sm">
          <div className="flex items-center justify-between">
            <span>{account.title}</span>
            {hasChildren && (
              <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </motion.div>
            )}
          </div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {open && hasChildren && account.children.map((child, childIdx) => (
          <motion.tr
            key={child.code}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ delay: childIdx * 0.05, duration: 0.25 }}
            className="border-b last:border-0 bg-muted/20 hover:bg-muted/40 transition-colors"
          >
            <td className="px-4 py-2 pr-10">
              <Badge variant="outline" className="font-mono text-xs">
                {child.code}
              </Badge>
            </td>
            <td className="px-4 py-2 text-sm text-muted-foreground">{child.title}</td>
          </motion.tr>
        ))}
      </AnimatePresence>
    </>
  );
}

export default function AccountSetup() {
  const [expandedGroup, setExpandedGroup] = useState(null);

  function toggleGroup(groupId) {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  }

  return (
    <PageShell>
      <PageHeader title="تنظیم حساب" description="مدیریت گروه حساب‌ها و ساختار کدینگ حسابداری بخش عمومی" />

      {/* گروه حساب */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              گروه حساب
            </CardTitle>
            <CardDescription>۹ گروه اصلی حساب‌ها — روی هر گروه کلیک کنید تا حساب‌های کل آن نمایش داده شود</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <StaggerContainer staggerDelay={0.05} className="space-y-2">
              {ACCOUNT_GROUPS.map((group) => {
                const isExpanded = expandedGroup === group.id;
                const accounts = group.accounts || [];

                return (
                  <StaggerItem key={group.id}>
                    <div className="rounded-xl border overflow-hidden transition-all duration-200">
                      {/* هدر گروه */}
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`flex w-full items-center gap-3 p-4 text-right transition-all duration-200 ${
                          isExpanded
                            ? "bg-primary/5 border-b"
                            : "bg-muted/30 hover:bg-accent"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${group.color} font-bold text-lg`}>
                          {group.code}
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-sm font-medium leading-tight">{group.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            گروه {group.code}
                            {accounts.length > 0 && ` — ${accounts.length} حساب کل`}
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      </button>

                      {/* لیست حساب‌های کل (dropdown) */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="overflow-hidden"
                          >
                            <div className="bg-card p-3">
                              {accounts.length > 0 ? (
                                <div className="rounded-lg border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-24">کد حساب</th>
                                        <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">شرح حساب</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {accounts.map((account, idx) => (
                                        <AccountRow key={account.code} account={account} idx={idx} />
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                                  <FolderTree className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                                  <p className="text-xs text-muted-foreground">
                                    هنوز حساب کلی برای این گروه تعریف نشده است
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </CardContent>
        </Card>
      </motion.div>
    </PageShell>
  );
}
