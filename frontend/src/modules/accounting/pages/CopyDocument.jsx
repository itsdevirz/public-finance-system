import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy, Search, ChevronDown, FileText, AlertCircle,
  RefreshCw, X, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/api";
import { toPersianDigits } from "@/components/ui/persian-date-picker";
import { cn } from "@/lib/utils";

const STATUS_LABEL = { DRAFT: "پیش‌نویس", CONFIRMED: "تایید شده", CANCELLED: "ابطال شده" };
const STATUS_COLOR = {
  DRAFT:     "bg-orange-50 text-orange-700 border-orange-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function CopyDocument() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // دریافت لیست اسناد
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/documents");
      setDocs(res.data.data ?? []);
    } catch {
      setError("خطا در دریافت لیست اسناد.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // فیلتر جستجو
  const filtered = docs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.document_number?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      String(d.fiscal_year).includes(q)
    );
  });

  // رفتن به صدور سند دستی با داده پر شده
  const handleCopy = () => {
    if (!selectedDoc) return;
    navigate("/document-setup/manual-doc", {
      state: { docId: selectedDoc._id, copyMode: true },
    });
  };

  return (
    <PageShell>
      <PageHeader
        title="کپی سند"
        description="انتخاب یک سند موجود و صدور سند جدید با همان ساختار"
      />

      <Card className="max-w-2xl">
        <CardContent className="p-5 space-y-5" dir="rtl">

          {/* خطا */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={fetchDocs} className="flex items-center gap-1 hover:underline">
                <RefreshCw className="h-3 w-3" /> تلاش مجدد
              </button>
            </div>
          )}

          {/* dropdown انتخاب سند */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              انتخاب سند مبدا
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 text-xs rounded-lg border border-input bg-background px-3 flex items-center justify-between transition-all hover:bg-muted/10 focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                {selectedDoc ? (
                  <span className="flex items-center gap-2 text-foreground font-medium">
                    <span className="font-mono text-primary">{selectedDoc.document_number}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="truncate max-w-xs">{selectedDoc.description || "بدون شرح"}</span>
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0", STATUS_COLOR[selectedDoc.status])}>
                      {STATUS_LABEL[selectedDoc.status]}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {loading ? "در حال بارگذاری..." : "-- سند مبدا را انتخاب کنید --"}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => { setIsOpen(false); setSearch(""); }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 left-0 mt-1.5 z-30 max-h-72 overflow-y-auto rounded-lg border bg-background shadow-2xl border-primary/10"
                    >
                      {/* جستجو */}
                      <div className="sticky top-0 bg-background border-b p-2 z-10">
                        <div className="relative">
                          <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو در شماره سند، شرح، دوره مالی..."
                            className="h-8 text-xs pr-8"
                            dir="rtl"
                            autoFocus
                          />
                          <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          {search && (
                            <button
                              onClick={() => setSearch("")}
                              className="absolute left-2.5 top-2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* لیست */}
                      <div className="p-1.5 space-y-0.5">
                        {loading ? (
                          <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            در حال بارگذاری...
                          </div>
                        ) : filtered.length === 0 ? (
                          <div className="py-8 text-center text-xs text-muted-foreground">
                            سندی یافت نشد.
                          </div>
                        ) : (
                          filtered.map((doc) => (
                            <button
                              key={doc._id}
                              type="button"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setIsOpen(false);
                                setSearch("");
                              }}
                              className={cn(
                                "w-full text-right px-3 py-2.5 text-xs rounded-md transition-all flex items-start justify-between gap-2",
                                selectedDoc?._id === doc._id
                                  ? "bg-primary text-primary-foreground font-bold"
                                  : "hover:bg-muted text-foreground/80 hover:text-foreground"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-mono font-bold text-[11px]">
                                    {doc.document_number}
                                  </span>
                                  <span className="font-mono text-[10px] opacity-60">
                                    {doc.fiscal_year}
                                  </span>
                                  {doc.document_date && (
                                    <span className="text-[10px] opacity-60">
                                      {toPersianDigits(doc.document_date)}
                                    </span>
                                  )}
                                </div>
                                <span className="block truncate text-[11px] opacity-80">
                                  {doc.description || "بدون شرح"}
                                </span>
                              </div>
                              <span className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold shrink-0",
                                selectedDoc?._id === doc._id
                                  ? "bg-white/20 text-inherit border-white/30"
                                  : STATUS_COLOR[doc.status]
                              )}>
                                {STATUS_LABEL[doc.status] ?? doc.status}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* پیش‌نمایش سند انتخاب‌شده */}
            {selectedDoc && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-xl border bg-muted/20 p-3 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">جزئیات سند انتخاب‌شده</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    شماره سند:{" "}
                    <span className="font-mono font-bold text-foreground">
                      {selectedDoc.document_number}
                    </span>
                  </div>
                  <div>
                    دوره مالی:{" "}
                    <span className="font-mono text-foreground">{selectedDoc.fiscal_year}</span>
                  </div>
                  {selectedDoc.document_date && (
                    <div>
                      تاریخ:{" "}
                      <span className="text-foreground">
                        {toPersianDigits(selectedDoc.document_date)}
                      </span>
                    </div>
                  )}
                  <div>
                    تعداد ردیف:{" "}
                    <span className="text-foreground">
                      {selectedDoc.lines?.length ?? 0} ردیف
                    </span>
                  </div>
                  {selectedDoc.description && (
                    <div className="col-span-2">
                      شرح: <span className="text-foreground">{selectedDoc.description}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* راهنما */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 text-xs text-blue-700 flex items-start gap-2">
            <Copy className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              پس از انتخاب سند، به صفحه صدور سند دستی هدایت می‌شوید. تمام فیلدها از سند مبدا پر شده‌اند و می‌توانید مبالغ و سایر موارد را ویرایش کرده و سند جدید صادر کنید.
            </span>
          </div>

          {/* دکمه */}
          <div className="flex justify-end">
            <Button
              onClick={handleCopy}
              disabled={!selectedDoc}
              className="gap-2 font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              رفتن به صدور سند
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
