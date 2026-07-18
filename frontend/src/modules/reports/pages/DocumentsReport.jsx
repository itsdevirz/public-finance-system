import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageShell, PageHeader } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  List, AlignLeft, BookOpen, BookMarked, RefreshCw, Activity,
  Search, Printer, FileDown, ChevronLeft, Eye, X, Layers, AlertCircle, Loader2, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/api";
import { printTable } from "@/lib/printUtils";
import { PersianDatePicker } from "@/components/ui/persian-date-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getDefaultDateRange } from "@/lib/fiscalUtils";

// وارد کردن اطلاعات سرفصل‌ها مستقیماً از فایل JSON فرانت‌اند
import sanamaCodes from "@/data/sanamaCodes.json";

// ─── استخراج سرفصل‌های کل و معین از فایل sanamaCodes ─────────────────────────
const ALL_GENERAL_ACCTS = [];
const MOEIN_BY_GENERAL = {}; // code کل -> لیست معین‌ها
const ALL_MOEIN_ACCTS = [];

sanamaCodes.groups.forEach((group) => {
  (group.accounts ?? []).forEach((acc) => {
    const genCode = acc.code;
    ALL_GENERAL_ACCTS.push({ value: genCode, label: `${genCode} — ${acc.title}` });
    
    const children = (acc.children ?? []).map((child) => {
      const item = { value: child.code, label: `${child.code} — ${child.title}`, parentCode: genCode };
      ALL_MOEIN_ACCTS.push(item);
      return item;
    });
    
    MOEIN_BY_GENERAL[genCode] = children;
  });
});

// تابع کمکی برای پیدا کردن نام حساب کل و معین از روی کد
const getAccountNamesFromCode = (code) => {
  if (!code) return { generalName: "—", moeinName: "—" };
  const genCode = code.substring(0, 3);
  const moeCode = code.substring(0, 5);

  let generalName = "—";
  let moeinName = "—";

  for (const group of sanamaCodes.groups ?? []) {
    for (const acc of group.accounts ?? []) {
      if (acc.code === genCode) {
        generalName = acc.title;
      }
      for (const child of acc.children ?? []) {
        if (child.code === moeCode) {
          moeinName = child.title;
        }
      }
    }
  }

  return { generalName, moeinName };
};

const SIDEBAR_ITEMS = [
  { id: "list",            label: "فهرست اسناد حسابداری",               icon: List },
  { id: "journal",         label: "دفتر روزنامه",                        icon: AlignLeft },
  { id: "general-ledger",  label: "دفتر کل",                             icon: BookOpen },
  { id: "moein-ledger",    label: "دفتر معین",                           icon: BookMarked },
  { id: "turnover",        label: "گردش اسناد",                          icon: RefreshCw },
  { id: "status",          label: "وضعیت اسناد",                         icon: Activity },
];

const ROUTE_MAP = {
  "list":           "/reports/documents/list",
  "journal":        "/reports/documents/journal",
  "general-ledger": "/reports/documents/general-ledger",
  "moein-ledger":   "/reports/documents/moein-ledger",
  "turnover":       "/reports/documents/turnover",
  "status":         "/reports/documents/status",
};

// ثوابت نوع سند و وضعیت
const DOC_TYPE_LABEL = {
  PETTY_CASH_PAYMENT: "پرداخت تنخواه",
  GENERAL_PAYMENT:    "پرداخت عمومی",
  REVENUE:            "درآمد",
  TRANSFER:           "انتقال",
  CLOSING:            "اختتامیه",
};

const DOC_TYPE_COLOR = {
  PETTY_CASH_PAYMENT: "bg-amber-100 text-amber-700 border-amber-200",
  GENERAL_PAYMENT:    "bg-blue-100 text-blue-700 border-blue-200",
  REVENUE:            "bg-emerald-100 text-emerald-700 border-emerald-200",
  TRANSFER:           "bg-violet-100 text-violet-700 border-violet-200",
  CLOSING:            "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABEL = {
  DRAFT: "پیش‌نویس",
  APPROVED: "تأیید شده",
  CONFIRMED: "تأیید شده",
  POSTED: "قطعی",
  CANCELLED: "ابطال شده",
};

const STATUS_COLOR = {
  DRAFT:     "bg-orange-100 text-orange-600 border-orange-200",
  APPROVED:  "bg-blue-100 text-blue-700 border-blue-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  POSTED:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-600 border-rose-200",
};

function toPersianDigits(str) {
  if (str == null) return "";
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

function dateToNum(d) {
  if (!d) return 0;
  return parseInt(d.replace(/\D/g, ""), 10) || 0;
}

function fmtNum(n) {
  if (n === 0 || n == null) return "—";
  return toPersianDigits(Number(n).toLocaleString("fa-IR"));
}

function getDefaultId(pathname) {
  const seg = pathname.split("/").pop();
  return Object.keys(ROUTE_MAP).find((k) => ROUTE_MAP[k].endsWith(seg)) ?? "list";
}

export default function DocumentsReport() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [active, setActive] = useState(() => getDefaultId(location.pathname));

  // ── داده‌ها و فیلترها ──
  const [documents, setDocuments] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null); // modal

  const defaultRange = getDefaultDateRange();

  // فیلترهای فهرست
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [docNumber, setDocNumber] = useState("");

  // فیلترهای ژورنال و بقیه
  const [docNumFrom, setDocNumFrom] = useState("");
  const [docNumTo, setDocNumTo] = useState("");
  const [docType, setDocType] = useState("ALL");
  const [docStatus, setDocStatus] = useState("ALL");
  const [generalAcc, setGeneralAcc] = useState("ALL");
  const [moeinAcc, setMoeinAcc] = useState("ALL");
  
  // فیلترهای دفتر کل
  const [displayLevel, setDisplayLevel] = useState("general");
  const [showZeroBalance, setShowZeroBalance] = useState("خیر");

  // فیلترهای دفتر معین
  const [showTemporary, setShowTemporary] = useState("خیر");

  // فیلترهای گردش اسناد
  const [turnoverType, setTurnoverType] = useState("ALL");
  const [creatorUser, setCreatorUser] = useState("ALL");

  // گزینه‌های پویا
  const [creatorOpts, setCreatorOpts] = useState([{ value: "ALL", label: "همه" }]);
  const [docTypeOpts, setDocTypeOpts] = useState([{ value: "ALL", label: "همه" }]);

  const generalAccOpts = useMemo(() => {
    return [{ value: "ALL", label: "همه" }, ...ALL_GENERAL_ACCTS];
  }, []);

  const moeinAccOpts = useMemo(() => {
    if (!generalAcc || generalAcc === "ALL") {
      return [{ value: "ALL", label: "همه" }, ...ALL_MOEIN_ACCTS];
    }
    return [{ value: "ALL", label: "همه" }, ...(MOEIN_BY_GENERAL[generalAcc] ?? [])];
  }, [generalAcc]);

  const current = SIDEBAR_ITEMS.find((i) => i.id === active);

  function handleSelect(id) {
    setActive(id);
    navigate(ROUTE_MAP[id]);
  }

  // بارگذاری داده‌ها از سرور
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/documents");
      const list = res.data?.data ?? [];
      setDocuments(list);

      const creators = new Set();
      const types = new Set();
      list.forEach((doc) => {
        if (doc.creator) creators.add(doc.creator);
        if (doc.document_type) types.add(doc.document_type);
      });
      setCreatorOpts([
        { value: "ALL", label: "همه" },
        ...Array.from(creators).map((c) => ({ value: c, label: c })),
      ]);
      setDocTypeOpts([
        { value: "ALL", label: "همه" },
        ...Array.from(types).map((t) => ({ value: t, label: DOC_TYPE_LABEL[t] ?? t })),
      ]);
    } catch (e) {
      console.error(e);
      setError("خطا در دریافت لیست اسناد از سرور");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // اعمال فیلترها و انجام جستجو به تفکیک تب فعال
  const handleSearch = useCallback(() => {
    if (documents.length === 0) {
      setFilteredRows([]);
      return;
    }

    const fromNum = dateFrom ? dateToNum(dateFrom) : 0;
    const toNum = dateTo ? dateToNum(dateTo) : 99999999;

    if (active === "list") {
      const q = docNumber.trim().toLowerCase();
      const result = documents.filter((doc) => {
        const docDateVal = dateToNum(doc.document_date);
        if (docDateVal < fromNum || docDateVal > toNum) return false;
        if (q) {
          return (
            doc.document_number?.toLowerCase().includes(q) ||
            doc.description?.toLowerCase().includes(q)
          );
        }
        return true;
      });
      setFilteredRows(result);
    } 

    else if (active === "journal") {
      const rows = [];
      documents.forEach((doc) => {
        const docDateVal = dateToNum(doc.document_date);
        if (docDateVal < fromNum || docDateVal > toNum) return;
        if (docStatus !== "ALL" && doc.status !== docStatus) return;
        if (docType !== "ALL" && doc.document_type !== docType) return;
        
        const docNumVal = parseInt(doc.document_number?.replace(/\D/g, ""), 10) || 0;
        if (docNumFrom && docNumVal < parseInt(docNumFrom, 10)) return;
        if (docNumTo && docNumVal > parseInt(docNumTo, 10)) return;

        (doc.lines ?? []).forEach((line) => {
          const accCode = line.account_code ?? "";
          if (generalAcc !== "ALL" && !accCode.startsWith(generalAcc)) return;
          if (moeinAcc !== "ALL" && !accCode.startsWith(moeinAcc)) return;

          const { generalName, moeinName } = getAccountNamesFromCode(accCode);

          rows.push({
            id: `${doc._id}-${accCode}-${line.debit}-${line.credit}`,
            docNumber: doc.document_number,
            docDate: doc.document_date,
            docDesc: doc.description || "سند دستی",
            generalAccount: generalName,
            moeinAccount: moeinName,
            accountCode: accCode,
            accountName: line.account_name ?? "—",
            debit: line.debit ?? 0,
            credit: line.credit ?? 0,
            articleDescription: line.description || doc.description || "—",
          });
        });
      });
      setFilteredRows(rows);
      const sum = rows.reduce((acc, r) => ({
        debit: acc.debit + (r.debit ?? 0),
        credit: acc.credit + (r.credit ?? 0)
      }), { debit: 0, credit: 0 });
      setTotals(sum);
    } 

    else if (active === "general-ledger") {
      const accum = {};
      documents.forEach((doc) => {
        if (doc.status === "CANCELLED") return;
        const docDateNum = dateToNum(doc.document_date);

        (doc.lines ?? []).forEach((line) => {
          const rawCode = line.account_code ?? "";
          const digits = rawCode.replace(/\D/g, "");
          if (!digits) return;

          let code = "";
          if (displayLevel === "group") {
            code = digits.substring(0, 1);
          } else if (displayLevel === "general") {
            code = digits.substring(0, 3);
          } else if (displayLevel === "moein") {
            code = digits.substring(0, 5);
          } else {
            code = digits;
          }

          const { generalName, moeinName } = getAccountNamesFromCode(rawCode);
          let title = line.account_name ?? "";
          if (displayLevel === "group") {
            const groupOpt = sanamaCodes.groups.find(g => g.code === code);
            title = groupOpt ? groupOpt.title : "دارایی‌ها";
          } else if (displayLevel === "general") {
            title = generalName;
          } else if (displayLevel === "moein") {
            title = moeinName;
          }

          if (!accum[code]) {
            accum[code] = {
              code,
              title: title || `حساب ${code}`,
              debitBefore: 0,
              creditBefore: 0,
              debitTurn: 0,
              creditTurn: 0,
            };
          }

          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;

          if (docDateNum < fromNum) {
            accum[code].debitBefore += debit;
            accum[code].creditBefore += credit;
          } else if (docDateNum <= toNum) {
            accum[code].debitTurn += debit;
            accum[code].creditTurn += credit;
          }
        });
      });

      const rows = [];
      Object.values(accum).forEach((acc) => {
        const openNet = acc.debitBefore - acc.creditBefore;
        const finalNet = openNet + acc.debitTurn - acc.creditTurn;
        const endingDebit = finalNet > 0 ? finalNet : 0;
        const endingCredit = finalNet < 0 ? -finalNet : 0;

        if (showZeroBalance === "خیر" && acc.debitTurn === 0 && acc.creditTurn === 0 && openNet === 0) {
          return;
        }

        if (generalAcc !== "ALL" && !acc.code.startsWith(generalAcc)) return;
        if (moeinAcc !== "ALL" && !acc.code.startsWith(moeinAcc)) return;

        rows.push({
          id: acc.code,
          accountCode: acc.code,
          accountTitle: acc.title,
          openBalance: openNet,
          debitTurn: acc.debitTurn,
          creditTurn: acc.creditTurn,
          debitBalance: endingDebit,
          creditBalance: endingCredit,
        });
      });

      rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode, "en", { numeric: true }));
      setFilteredRows(rows);
      const sum = rows.reduce((acc, r) => ({
        debitTurn: acc.debitTurn + (r.debitTurn ?? 0),
        creditTurn: acc.creditTurn + (r.creditTurn ?? 0),
        debitBalance: acc.debitBalance + (r.debitBalance ?? 0),
        creditBalance: acc.creditBalance + (r.creditBalance ?? 0)
      }), { debitTurn: 0, creditTurn: 0, debitBalance: 0, creditBalance: 0 });
      setTotals(sum);
    } 

    else if (active === "moein-ledger") {
      const rows = [];
      let runningBalance = 0;

      documents.forEach((doc) => {
        if (doc.status === "CANCELLED") return;
        if (showTemporary === "خیر" && doc.status === "DRAFT") return;

        const docDateVal = dateToNum(doc.document_date);
        if (docDateVal < fromNum || docDateVal > toNum) return;

        const docNumVal = parseInt(doc.document_number?.replace(/\D/g, ""), 10) || 0;
        if (docNumTo && docNumVal > parseInt(docNumTo, 10)) return;

        (doc.lines ?? []).forEach((line) => {
          const accCode = line.account_code ?? "";
          if (moeinAcc !== "ALL" && !accCode.startsWith(moeinAcc)) return;

          const debit = line.debit ?? 0;
          const credit = line.credit ?? 0;
          runningBalance += debit - credit;

          rows.push({
            id: `${doc._id}-${accCode}-${debit}-${credit}`,
            docDate: doc.document_date || "—",
            docNumber: doc.document_number,
            docDesc: line.description || doc.description || "—",
            debit,
            credit,
            balance: runningBalance,
          });
        });
      });
      setFilteredRows(rows);
      const sum = rows.reduce((acc, r) => ({
        debit: acc.debit + (r.debit ?? 0),
        credit: acc.credit + (r.credit ?? 0)
      }), { debit: 0, credit: 0 });
      setTotals(sum);
    } 

    else if (active === "turnover") {
      const rows = [];
      documents.forEach((doc) => {
        const docDateVal = dateToNum(doc.document_date);
        if (docDateVal < fromNum || docDateVal > toNum) return;

        const docNumVal = parseInt(doc.document_number?.replace(/\D/g, ""), 10) || 0;
        if (docNumFrom && docNumVal < parseInt(docNumFrom, 10)) return;
        if (docNumTo && docNumVal > parseInt(docNumTo, 10)) return;

        if (docType !== "ALL" && doc.document_type !== docType) return;
        if (creatorUser !== "ALL" && doc.creator !== creatorUser) return;

        const baseRow = {
          docNumber: doc.document_number || "—",
          docDate: doc.document_date || "—",
          docDesc: doc.description || "—",
          creator: doc.creator || "سیستم",
          changeUser: doc.creator || "سیستم",
        };

        rows.push({
          id: `${doc._id}-step1`,
          ...baseRow,
          oldStatus: "ثبت نشده",
          newStatus: "موقت",
          changeDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("fa-IR") : doc.document_date,
          turnoverType: "ثبت اولیه",
          turnoverDesc: "ثبت سند به صورت پیش‌نویس",
        });

        if (doc.status === "APPROVED" || doc.status === "POSTED") {
          rows.push({
            id: `${doc._id}-step2`,
            ...baseRow,
            oldStatus: "موقت",
            newStatus: "تایید شده",
            changeDate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("fa-IR") : doc.document_date,
            turnoverType: "تایید سند",
            turnoverDesc: "تایید و ارسال به مدیر مالی",
          });
        }

        if (doc.status === "POSTED") {
          rows.push({
            id: `${doc._id}-step3`,
            ...baseRow,
            oldStatus: "تایید شده",
            newStatus: "قطعی",
            changeDate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("fa-IR") : doc.document_date,
            turnoverType: "قطعی کردن",
            turnoverDesc: "ثبت قطعی در دفاتر مالی",
          });
        }

        if (doc.status === "CANCELLED") {
          rows.push({
            id: `${doc._id}-step4`,
            ...baseRow,
            oldStatus: "موقت",
            newStatus: "حذف شده",
            changeDate: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString("fa-IR") : doc.document_date,
            turnoverType: "حذف سند",
            turnoverDesc: "لغو سند به دلیل اصلاحات",
          });
        }
      });

      let finalRows = rows;
      if (turnoverType !== "ALL") {
        finalRows = finalRows.filter((r) => r.turnoverType === turnoverType);
      }
      setFilteredRows(finalRows);
    } 

    else if (active === "status") {
      const summary = {
        DRAFT: { count: 0, debit: 0, credit: 0, dates: [] },
        APPROVED: { count: 0, debit: 0, credit: 0, dates: [] },
        POSTED: { count: 0, debit: 0, credit: 0, dates: [] },
      };

      documents.forEach((doc) => {
        const docDateVal = dateToNum(doc.document_date);
        if (dateFrom && docDateVal < fromNum) return;
        if (dateTo && docDateVal > toNum) return;

        const docNumVal = parseInt(doc.document_number?.replace(/\D/g, ""), 10) || 0;
        if (docNumFrom && docNumVal < parseInt(docNumFrom, 10)) return;
        if (docNumTo && docNumVal > parseInt(docNumTo, 10)) return;

        if (docType !== "ALL" && doc.document_type !== docType) return;
        if (creatorUser !== "ALL" && doc.creator !== creatorUser) return;
        if (docStatus !== "ALL" && doc.status !== docStatus) return;

        let status = doc.status || "DRAFT";
        if (status === "SENT") status = "APPROVED";
        if (status === "CANCELLED") return;

        if (!summary[status]) {
          summary[status] = { count: 0, debit: 0, credit: 0, dates: [] };
        }

        summary[status].count += 1;
        if (doc.document_date) {
          summary[status].dates.push(doc.document_date);
        }

        (doc.lines ?? []).forEach((line) => {
          summary[status].debit += Number(line.debit) || 0;
          summary[status].credit += Number(line.credit) || 0;
        });
      });

      const totalCount = Object.values(summary).reduce((sum, s) => sum + s.count, 0) || 1;

      const rows = [
        {
          statusName: "موقت",
          statusCode: "DRAFT",
          color: "bg-amber-500",
          count: summary.DRAFT.count,
          percent: Number(((summary.DRAFT.count / totalCount) * 100).toFixed(2)),
          debit: summary.DRAFT.debit,
          credit: summary.DRAFT.credit,
          diff: Math.abs(summary.DRAFT.debit - summary.DRAFT.credit),
          firstDate: summary.DRAFT.dates.length ? summary.DRAFT.dates.sort()[0] : "—",
          lastDate: summary.DRAFT.dates.length ? summary.DRAFT.dates.sort()[summary.DRAFT.dates.length - 1] : "—",
        },
        {
          statusName: "تأیید شده",
          statusCode: "APPROVED",
          color: "bg-blue-500",
          count: summary.APPROVED.count,
          percent: Number(((summary.APPROVED.count / totalCount) * 100).toFixed(2)),
          debit: summary.APPROVED.debit,
          credit: summary.APPROVED.credit,
          diff: Math.abs(summary.APPROVED.debit - summary.APPROVED.credit),
          firstDate: summary.APPROVED.dates.length ? summary.APPROVED.dates.sort()[0] : "—",
          lastDate: summary.APPROVED.dates.length ? summary.APPROVED.dates.sort()[summary.APPROVED.dates.length - 1] : "—",
        },
        {
          statusName: "قطعی",
          statusCode: "POSTED",
          color: "bg-green-500",
          count: summary.POSTED.count,
          percent: Number(((summary.POSTED.count / totalCount) * 100).toFixed(2)),
          debit: summary.POSTED.debit,
          credit: summary.POSTED.credit,
          diff: Math.abs(summary.POSTED.debit - summary.POSTED.credit),
          firstDate: summary.POSTED.dates.length ? summary.POSTED.dates.sort()[0] : "—",
          lastDate: summary.POSTED.dates.length ? summary.POSTED.dates.sort()[summary.POSTED.dates.length - 1] : "—",
        },
      ];
      setFilteredRows(rows);
    }
  }, [documents, active, dateFrom, dateTo, docNumber, docNumFrom, docNumTo, docType, docStatus, generalAcc, moeinAcc, displayLevel, showZeroBalance, showTemporary, turnoverType, creatorUser]);

  useEffect(() => {
    if (documents.length > 0) {
      handleSearch();
    }
  }, [documents, handleSearch]);

  useEffect(() => {
    setActive(getDefaultId(location.pathname));
  }, [location.pathname]);

  const reportTitle = useMemo(() => {
    if (active === "list") return `فهرست اسناد حسابداری — از ${dateFrom} تا ${dateTo}`;
    if (active === "journal") return `دفتر روزنامه اسناد حسابداری — از ${dateFrom} تا ${dateTo}`;
    if (active === "general-ledger") return `دفتر کل اسناد حسابداری — از ${dateFrom} تا ${dateTo}`;
    if (active === "moein-ledger") return `دفتر معین اسناد حسابداری — از ${dateFrom} تا ${dateTo}`;
    if (active === "turnover") return `گردش اسناد حسابداری — از ${dateFrom} تا ${dateTo}`;
    if (active === "status") return `وضعیت اسناد حسابداری — از ${dateFrom} تا ${dateTo}`;
    return "گزارش اسناد حسابداری";
  }, [active, dateFrom, dateTo]);

  // چاپ گزارش
  const handlePrint = () => {
    printTable("#documents-report-table", reportTitle);
  };

  // ریست کردن فیلترها
  const handleReset = () => {
    setDateFrom("۱۴۰۳/۰۱/۰۱");
    setDateTo("۱۴۰۳/۱۲/۲۹");
    setDocNumber("");
    setDocNumFrom("");
    setDocNumTo("");
    setDocType("ALL");
    setDocStatus("ALL");
    setGeneralAcc("ALL");
    setMoeinAcc("ALL");
    setDisplayLevel("general");
    setShowZeroBalance("خیر");
    setShowTemporary("خیر");
    setTurnoverType("ALL");
    setCreatorUser("ALL");
    handleSearch();
  };

  // خروجی اکسل
  const handleExcelExport = () => {
    if (!filteredRows || filteredRows.length === 0) return;

    let headers = [];
    let csvRows = [];

    if (active === "list") {
      headers = ["ردیف", "شماره سند", "دوره مالی", "تاریخ سند", "نوع سند", "وضعیت", "جمع بدهکار", "جمع بستانکار", "شرح"];
      csvRows = filteredRows.map((doc, idx) => {
        const totalD = doc.lines?.reduce((s, l) => s + (l.debit ?? 0), 0) ?? 0;
        const totalC = doc.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
        return [
          idx + 1,
          doc.document_number,
          doc.fiscal_year,
          doc.document_date,
          DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type,
          STATUS_LABEL[doc.status] ?? doc.status,
          totalD,
          totalC,
          doc.description ?? ""
        ];
      });
    } else if (active === "journal") {
      headers = ["شماره سند", "تاریخ سند", "کد حساب", "نام حساب", "حساب کل", "حساب معین", "بدهکار", "بستانکار", "شرح ردیف"];
      csvRows = filteredRows.map(r => [
        r.docNumber,
        r.docDate,
        r.accountCode,
        r.accountName,
        r.generalAccount,
        r.moeinAccount,
        r.debit,
        r.credit,
        r.articleDescription
      ]);
    } else if (active === "general-ledger") {
      headers = ["کد حساب", "نام حساب", "مانده اول دوره", "گردش بدهکار", "گردش بستانکار", "مانده بدهکار", "مانده بستانکار"];
      csvRows = filteredRows.map(r => [
        r.accountCode,
        r.accountTitle,
        r.openBalance,
        r.debitTurn,
        r.creditTurn,
        r.debitBalance,
        r.creditBalance
      ]);
    } else if (active === "moein-ledger") {
      headers = ["تاریخ سند", "شماره سند", "شرح سند", "بدهکار", "بستانکار", "مانده"];
      csvRows = filteredRows.map(r => [
        r.docDate,
        r.docNumber,
        r.docDesc,
        r.debit,
        r.credit,
        r.balance
      ]);
    } else if (active === "turnover") {
      headers = ["شماره سند", "تاریخ سند", "نوع گردش", "توضیح گردش", "وضعیت قبلی", "وضعیت جدید", "کاربر تغییردهنده", "تاریخ تغییر"];
      csvRows = filteredRows.map(r => [
        r.docNumber,
        r.docDate,
        r.turnoverType,
        r.turnoverDesc,
        r.oldStatus,
        r.newStatus,
        r.changeUser,
        r.changeDate
      ]);
    } else if (active === "status") {
      headers = ["وضعیت سند", "تعداد سند", "درصد از کل", "جمع بدهکار", "جمع بستانکار", "مغایرت", "تاریخ اولین سند", "تاریخ آخرین سند"];
      csvRows = filteredRows.map(r => [
        r.statusName,
        r.count,
        `${r.percent}%`,
        r.debit,
        r.credit,
        r.diff,
        r.firstDate,
        r.lastDate
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [
        headers.join(","),
        ...csvRows.map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${reportTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageShell>
      <PageHeader
        title="گزارش‌های اسناد حسابداری"
        description="فهرست اسناد، دفاتر روزنامه، کل، معین، گردش و وضعیت اسناد"
      >
        {filteredRows.length > 0 && !loading && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 ml-1" /> چاپ</Button>
            <Button variant="outline" size="sm" onClick={handleExcelExport}><FileDown className="h-4 w-4 ml-1" /> اکسل</Button>
          </div>
        )}
      </PageHeader>

      <div className="flex gap-4">
        {/* سایدبار */}
        <aside className="w-56 shrink-0">
          <Card>
            <CardContent className="p-2">
              <p className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">نوع گزارش</p>
              <nav className="space-y-0.5">
                {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                      active === id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-right">{label}</span>
                    {active === id && <ChevronLeft className="h-3 w-3 shrink-0" />}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* محتوا */}
        <main className="flex-1 min-w-0 space-y-4">
          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <p className="text-sm text-rose-700">{error}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-5">
              {/* ─── بخش فیلترهای فهرست اسناد ─── */}
              {active === "list" && (
                <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">شماره سند</label>
                    <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="جستجو..." className="h-8 text-xs" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── بخش فیلترهای دفتر روزنامه ─── */}
              {active === "journal" && (
                <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">شماره سند (از)</label>
                    <Input value={docNumFrom} onChange={(e) => setDocNumFrom(e.target.value)} placeholder="مثلاً ۱" className="h-8 text-xs font-mono" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">شماره سند (تا)</label>
                    <Input value={docNumTo} onChange={(e) => setDocNumTo(e.target.value)} placeholder="مثلاً ۹۹۹" className="h-8 text-xs font-mono" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">نوع سند</label>
                    <SearchableSelect value={docType} onChange={setDocType} options={[{ value: "ALL", label: "همه" }, ...docTypeOpts.filter(o => o.value !== "ALL")]} placeholder="نوع سند..." searchable={false} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">وضعیت سند</label>
                    <select value={docStatus} onChange={(e) => setDocStatus(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-1">
                      <option value="ALL">همه وضعیت‌ها</option>
                      <option value="DRAFT">پیش‌نویس</option>
                      <option value="CONFIRMED">تایید شده</option>
                      <option value="CANCELLED">ابطال شده</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">حساب کل</label>
                    <SearchableSelect value={generalAcc} onChange={setGeneralAcc} options={generalAccOpts} placeholder="انتخاب حساب..." searchable={true} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">حساب معین</label>
                    <SearchableSelect value={moeinAcc} onChange={setMoeinAcc} options={moeinAccOpts} placeholder="انتخاب حساب..." searchable={true} />
                  </div>
                  <div className="flex gap-2 col-span-2 justify-end">
                    <Button size="sm" className="w-32 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── بخش فیلترهای دفتر کل ─── */}
              {active === "general-ledger" && (
                <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">سطح نمایش</label>
                    <select value={displayLevel} onChange={(e) => setDisplayLevel(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none">
                      <option value="group">گروه حساب (۱ رقم)</option>
                      <option value="general">حساب کل (۳ رقم)</option>
                      <option value="moein">حساب معین (۵ رقم)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">کد حساب کل</label>
                    <SearchableSelect value={generalAcc} onChange={setGeneralAcc} options={generalAccOpts} placeholder="همه" searchable={true} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">نمایش حسابهای با مانده صفر</label>
                    <select value={showZeroBalance} onChange={(e) => setShowZeroBalance(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none">
                      <option value="خیر">خیر</option>
                      <option value="بله">بله</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" className="w-full h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── بخش فیلترهای دفتر معین ─── */}
              {active === "moein-ledger" && (
                <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">حساب معین *</label>
                    <SearchableSelect value={moeinAcc} onChange={setMoeinAcc} options={ALL_MOEIN_ACCTS} placeholder="انتخاب حساب..." searchable={true} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">نمایش اسناد موقت</label>
                    <select value={showTemporary} onChange={(e) => setShowTemporary(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none">
                      <option value="خیر">خیر</option>
                      <option value="بله">بله</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── بخش فیلترهای گردش اسناد ─── */}
              {active === "turnover" && (
                <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">نوع گردش</label>
                    <select value={turnoverType} onChange={(e) => setTurnoverType(e.target.value)} className="w-full h-8 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none">
                      <option value="ALL">همه گردش‌ها</option>
                      <option value="ثبت اولیه">ثبت اولیه</option>
                      <option value="تایید سند">تایید سند</option>
                      <option value="قطعی کردن">قطعی کردن</option>
                      <option value="حذف سند">حذف سند</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">کاربر ثبت‌کننده</label>
                    <SearchableSelect value={creatorUser} onChange={setCreatorUser} options={creatorOpts} placeholder="همه" searchable={false} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">نوع سند</label>
                    <SearchableSelect value={docType} onChange={setDocType} options={docTypeOpts} placeholder="همه" searchable={false} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" className="w-full h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── بخش فیلترهای وضعیت اسناد ─── */}
              {active === "status" && (
                <div dir="rtl" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 rounded-xl border bg-muted/20 p-4 items-end">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">از تاریخ</label>
                    <PersianDatePicker value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="۱۴۰۳/۰۱/۰۱" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">تا تاریخ</label>
                    <PersianDatePicker value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="۱۴۰۳/۱۲/۲۹" className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">کاربر ثبت‌کننده</label>
                    <SearchableSelect value={creatorUser} onChange={setCreatorUser} options={creatorOpts} placeholder="همه" searchable={false} />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs text-muted-foreground font-medium">نوع سند</label>
                    <SearchableSelect value={docType} onChange={setDocType} options={docTypeOpts} placeholder="همه" searchable={false} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-8 text-xs bg-[#004b93] hover:bg-[#003d79] text-white" onClick={handleSearch}>
                      <Search className="h-4 w-4 ml-1" /> نمایش
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset} title="ریست">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── لودینگ ─── */}
              {loading && (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm">در حال بارگذاری اطلاعات...</p>
                </div>
              )}

              {/* ─── جدول نتایج ─── */}
              {!loading && filteredRows !== null && (
                <div className="overflow-x-auto border rounded-xl bg-background" id="documents-report-table">
                  {/* فهرست اسناد حسابداری */}
                  {active === "list" && (
                    <table className="w-full text-xs" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 text-center font-bold w-12 whitespace-nowrap">ردیف</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">شماره سند</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">دوره مالی</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">تاریخ سند</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">نوع سند</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">وضعیت</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">جمع بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">جمع بستانکار (ریال)</th>
                          <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">شرح</th>
                          <th className="px-3 py-2.5 text-center font-bold w-24 whitespace-nowrap no-print">عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-16 text-center text-muted-foreground">هیچ موردی یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((doc, idx) => {
                            const totalD = doc.lines?.reduce((s, l) => s + (l.debit ?? 0), 0) ?? 0;
                            const totalC = doc.lines?.reduce((s, l) => s + (l.credit ?? 0), 0) ?? 0;
                            return (
                              <tr key={doc._id ?? idx} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                                <td className="px-3 py-2.5 font-mono font-medium">{toPersianDigits(doc.document_number)}</td>
                                <td className="px-3 py-2.5 font-mono">{toPersianDigits(doc.fiscal_year)}</td>
                                <td className="px-3 py-2.5 font-mono">{toPersianDigits(doc.document_date)}</td>
                                <td className="px-3 py-2.5">
                                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                    DOC_TYPE_COLOR[doc.document_type] ?? "bg-muted text-muted-foreground")}>
                                    {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                    STATUS_COLOR[doc.status] ?? "bg-muted text-muted-foreground")}>
                                    {STATUS_LABEL[doc.status] ?? doc.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 font-mono text-blue-700">{fmtNum(totalD)}</td>
                                <td className="px-3 py-2.5 font-mono text-rose-700">{fmtNum(totalC)}</td>
                                <td className="px-3 py-2.5 max-w-[200px] truncate" title={doc.description}>{doc.description ?? "—"}</td>
                                <td className="px-3 py-2.5 text-center no-print">
                                  <Button size="xs" variant="outline" className="h-7 text-[10px] font-bold" onClick={() => setSelectedDoc(doc)}>
                                    <Eye className="h-3 w-3 ml-1" /> مشاهده
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* دفتر روزنامه */}
                  {active === "journal" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">شماره سند</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">تاریخ</th>
                          <th className="px-3 py-2.5 w-28 font-bold">کد حساب</th>
                          <th className="px-3 py-2.5 min-w-[150px] font-bold">حساب کل</th>
                          <th className="px-3 py-2.5 min-w-[150px] font-bold">حساب معین</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">بستانکار (ریال)</th>
                          <th className="px-3 py-2.5 min-w-[180px] font-bold">شرح ردیف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-16 text-center text-muted-foreground">ردیفی یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr key={row.id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-medium">{toPersianDigits(row.docNumber)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.docDate)}</td>
                              <td className="px-3 py-2.5 font-mono font-medium text-muted-foreground">{toPersianDigits(row.accountCode)}</td>
                              <td className="px-3 py-2.5 font-medium">{row.generalAccount}</td>
                              <td className="px-3 py-2.5 font-medium">{row.moeinAccount}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit)}</td>
                              <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[200px]" title={row.articleDescription}>{row.articleDescription}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={6}>جمع کل دفتر روزنامه</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                            <td className="px-3 py-2.5"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* دفتر کل */}
                  {active === "general-ledger" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-32 font-bold">کد حساب</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold">نام حساب</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">مانده اول دوره</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">گردش بدهکار</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">گردش بستانکار</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">مانده بدهکار نهایی</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">مانده بستانکار نهایی</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-16 text-center text-muted-foreground">اطلاعاتی یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr key={row.id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 font-mono font-bold text-foreground/85">{toPersianDigits(row.accountCode)}</td>
                              <td className="px-3 py-2.5 font-medium">{row.accountTitle}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{fmtNum(row.openBalance)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debitTurn)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.creditTurn)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debitBalance)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.creditBalance)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={3}>جمع کل دفتر کل</td>
                            <td className="px-3 py-2.5 text-center font-mono"></td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debitTurn)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.creditTurn)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debitBalance)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.creditBalance)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* دفتر معین */}
                  {active === "moein-ledger" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">تاریخ سند</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">شماره سند</th>
                          <th className="px-3 py-2.5 min-w-[200px] font-bold">شرح سند</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-32 text-center font-bold">بستانکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مانده (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-muted-foreground">سندی برای حساب معین انتخابی پیدا نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr key={row.id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.docDate)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-medium">{toPersianDigits(row.docNumber)}</td>
                              <td className="px-3 py-2.5 font-medium">{row.docDesc}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-bold">{fmtNum(Math.abs(row.balance))} {row.balance > 0 ? "بد" : row.balance < 0 ? "بس" : ""}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {filteredRows.length > 0 && (
                        <tfoot>
                          <tr className="border-t bg-muted/40 font-bold">
                            <td className="px-3 py-2.5 text-center" colSpan={4}>جمع کل گردش</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(totals.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(totals.credit)}</td>
                            <td className="px-3 py-2.5"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  )}

                  {/* گردش اسناد */}
                  {active === "turnover" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">شماره سند</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">تاریخ سند</th>
                          <th className="px-3 py-2.5 min-w-[150px] font-bold">شرح سند</th>
                          <th className="px-3 py-2.5 w-32 font-bold text-center">نوع گردش</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">وضعیت قبلی</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">وضعیت جدید</th>
                          <th className="px-3 py-2.5 w-32 font-bold text-center">کاربر تغییردهنده</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">تاریخ تغییر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-16 text-center text-muted-foreground">گردشی یافت نشد.</td>
                          </tr>
                        ) : (
                          filteredRows.map((row, idx) => (
                            <tr key={row.id ?? idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                              <td className="px-3 py-2.5 text-center font-mono font-medium">{toPersianDigits(row.docNumber)}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.docDate)}</td>
                              <td className="px-3 py-2.5 font-medium text-muted-foreground truncate max-w-[200px]" title={row.docDesc}>{row.docDesc}</td>
                              <td className="px-3 py-2.5 text-center font-bold text-primary">{row.turnoverType}</td>
                              <td className="px-3 py-2.5 text-center text-muted-foreground">{row.oldStatus}</td>
                              <td className="px-3 py-2.5 text-center font-bold">{row.newStatus}</td>
                              <td className="px-3 py-2.5 text-center font-medium text-slate-700">{row.changeUser}</td>
                              <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.changeDate)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* وضعیت اسناد */}
                  {active === "status" && (
                    <table className="w-full text-xs text-right" dir="rtl">
                      <thead>
                        <tr className="bg-[#0e305d] text-white border-b border-border">
                          <th className="px-3 py-2.5 w-12 text-center font-bold">ردیف</th>
                          <th className="px-3 py-2.5 w-32 font-bold text-center">وضعیت سند</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">تعداد سند</th>
                          <th className="px-3 py-2.5 w-24 font-bold text-center">درصد از کل</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">جمع بدهکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">جمع بستانکار (ریال)</th>
                          <th className="px-3 py-2.5 w-36 text-center font-bold">مغایرت (ریال)</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">اولین تاریخ</th>
                          <th className="px-3 py-2.5 w-28 font-bold text-center">آخرین تاریخ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, idx) => (
                          <tr key={idx} className={cn("border-b hover:bg-muted/10", idx % 2 === 1 && "bg-muted/10")}>
                            <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(idx + 1)}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", row.color)} />
                                {row.statusName}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono font-medium">{toPersianDigits(row.count)}</td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-primary">{toPersianDigits(row.percent)}٪</td>
                            <td className="px-3 py-2.5 text-center font-mono text-blue-700">{fmtNum(row.debit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-rose-700">{fmtNum(row.credit)}</td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-700">{fmtNum(row.diff)}</td>
                            <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.firstDate)}</td>
                            <td className="px-3 py-2.5 text-center font-mono">{toPersianDigits(row.lastDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modal نمایش آرتیکل‌ها/ردیف‌های سند */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={() => setSelectedDoc(null)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl flex flex-col p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">ردیف‌های سند حسابداری (شماره {selectedDoc.document_number})</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-xs bg-muted/20 p-3 rounded-lg">
              <div><span className="text-muted-foreground">تاریخ سند:</span> <span className="font-mono font-bold">{selectedDoc.document_date}</span></div>
              <div><span className="text-muted-foreground">نوع سند:</span> <span className="font-bold">{DOC_TYPE_LABEL[selectedDoc.document_type] ?? selectedDoc.document_type}</span></div>
              <div><span className="text-muted-foreground">وضعیت:</span> <span className="font-bold">{STATUS_LABEL[selectedDoc.status] ?? selectedDoc.status}</span></div>
              <div><span className="text-muted-foreground">دوره مالی:</span> <span className="font-mono font-bold">{selectedDoc.fiscal_year}</span></div>
            </div>
            
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="bg-[#0e305d] text-white border-b border-border">
                    <th className="px-3 py-2.5 text-center font-bold w-12 whitespace-nowrap">ردیف</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">کد حساب</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">نام حساب</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">بدهکار (ریال)</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">بستانکار (ریال)</th>
                    <th className="px-3 py-2.5 text-right font-bold whitespace-nowrap">شرح ردیف</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedDoc.lines?.length ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        هیچ ردیفی برای این سند ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    selectedDoc.lines.map((line, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{toPersianDigits(i + 1)}</td>
                        <td className="px-3 py-2.5 font-mono">{toPersianDigits(line.account_code)}</td>
                        <td className="px-3 py-2.5">{line.account_name ?? "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-blue-700">{line.debit ? fmtNum(line.debit) : "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-rose-700">{line.credit ? fmtNum(line.credit) : "—"}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{line.description ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
