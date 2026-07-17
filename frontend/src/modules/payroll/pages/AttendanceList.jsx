import { useState, useMemo } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Search, BarChart2, Users, Calendar, Download, FileText, TrendingUp } from "lucide-react";

const MONTHS = [
  { value: "01", label: "فروردین" },
  { value: "02", label: "اردیبهشت" },
  { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },
  { value: "05", label: "مرداد" },
  { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },
  { value: "08", label: "آبان" },
  { value: "09", label: "آذر" },
  { value: "10", label: "دی" },
  { value: "11", label: "بهمن" },
  { value: "12", label: "اسفند" }
];

export default function AttendanceList() {
  const { employees, attendanceRecords, employeeLeaves, employeeMissions } = useAssets();

  const [selectedYear, setSelectedYear] = useState("1405");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [search, setSearch] = useState("");

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || "";

  // Build consolidated report per employee for selected period
  const reportRows = useMemo(() => {
    if (!employees || employees.length === 0) return [];

    return employees.map(emp => {
      const empId = emp._id || emp.id;

      // --- کارکرد ماهانه از ثبت کارکرد ---
      const attRec = (attendanceRecords || []).find(
        r => String(r.year) === String(selectedYear) &&
             String(r.month) === String(selectedMonth) &&
             (r.employeeId === empId)
      );

      // --- مرخصی‌های این دوره ---
      const leaves = (employeeLeaves || []).filter(l => {
        if (l.employeeId !== empId) return false;
        if (!l.startDate) return false;
        // Check if leave is within the selected year/month
        const dateParts = l.startDate.split("/");
        return dateParts[0] === selectedYear && dateParts[1] === selectedMonth;
      });

      const approvedLeaves = leaves.filter(l => l.status === "approved");
      const pendingLeaves  = leaves.filter(l => l.status === "pending");
      const totalLeaveDays = approvedLeaves.reduce((s, l) => s + Number(l.durationDays || 0), 0);
      const totalLeaveHours = approvedLeaves.reduce((s, l) => s + Number(l.durationHours || 0), 0);

      // --- مأموریت‌های این دوره ---
      const missions = (employeeMissions || []).filter(m => {
        if (m.employeeId !== empId) return false;
        if (!m.startDate) return false;
        const dateParts = m.startDate.split("/");
        return dateParts[0] === selectedYear && dateParts[1] === selectedMonth;
      });
      const totalMissionDays = missions.reduce((s, m) => s + Number(m.durationDays || 0), 0);

      return {
        empId,
        code: emp.code || "—",
        name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
        jobTitle: emp.jobTitle || emp.role || "—",
        department: emp.department || "—",
        // کارکرد
        workedDays: attRec ? Number(attRec.workedDays ?? 30) : null,
        overtimeHours: attRec ? Number(attRec.overtimeHours ?? 0) : null,
        absenceDays: attRec ? Number(attRec.absenceDays ?? 0) : null,
        tardinessHours: attRec ? Number(attRec.tardinessHours ?? 0) : null,
        // از رکورد کارکرد یا از جمع مرخصی‌ها
        leaveDays: attRec ? Number(attRec.leaveDays ?? 0) : totalLeaveDays,
        missionDays: attRec ? Number(attRec.missionDays ?? 0) : totalMissionDays,
        // جزئیات از ماژول مرخصی
        leaveCount: leaves.length,
        approvedLeaveCount: approvedLeaves.length,
        pendingLeaveCount: pendingLeaves.length,
        leaveHours: totalLeaveHours,
        missionCount: missions.length,
        hasRecord: !!attRec
      };
    });
  }, [employees, attendanceRecords, employeeLeaves, employeeMissions, selectedYear, selectedMonth]);

  // Search filter
  const filteredRows = useMemo(() => {
    if (!search.trim()) return reportRows;
    const q = search.toLowerCase();
    return reportRows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.jobTitle.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q)
    );
  }, [reportRows, search]);

  // Summary stats
  const stats = useMemo(() => {
    const withRecord = reportRows.filter(r => r.hasRecord);
    return {
      total: reportRows.length,
      withRecord: withRecord.length,
      avgWorkedDays: withRecord.length > 0
        ? (withRecord.reduce((s, r) => s + (r.workedDays || 0), 0) / withRecord.length).toFixed(1)
        : "—",
      totalOvertime: withRecord.reduce((s, r) => s + (r.overtimeHours || 0), 0),
      totalAbsence: withRecord.reduce((s, r) => s + (r.absenceDays || 0), 0)
    };
  }, [reportRows]);

  function printReport() {
    const orgName = localStorage.getItem("org_name") || "وزارت امور اقتصادی و دارایی";
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win) return;

    const tableRows = filteredRows.map((r, idx) => `
      <tr class="${idx % 2 === 1 ? "alt-row" : ""}">
        <td class="center">${idx + 1}</td>
        <td class="center mono">${r.code}</td>
        <td class="bold">${r.name}</td>
        <td>${r.jobTitle}</td>
        <td>${r.department}</td>
        <td class="center mono ${!r.hasRecord ? "no-data" : ""}">${r.hasRecord ? r.workedDays : "—"}</td>
        <td class="center mono">${r.hasRecord ? r.overtimeHours : "—"}</td>
        <td class="center mono">${r.hasRecord ? r.leaveDays : "—"}</td>
        <td class="center mono">${r.hasRecord ? r.absenceDays : "—"}</td>
        <td class="center mono">${r.hasRecord ? r.missionDays : "—"}</td>
        <td class="center mono">${r.hasRecord ? r.tardinessHours : "—"}</td>
        <td class="center ${r.hasRecord ? "status-ok" : "status-missing"}">${r.hasRecord ? "ثبت شده" : "ثبت نشده"}</td>
      </tr>
    `).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8"/>
  <title>لیست کارکرد ${monthLabel} ${selectedYear}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm 10mm; }
    body { font-family: Tahoma, sans-serif; font-size: 10px; color: #111; direction: rtl; }
    .page-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px; }
    .page-header h1 { font-size: 13px; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #444; padding: 5px 6px; }
    thead th { background: #e8e8e8 !important; font-weight: bold; text-align: center; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .mono { font-family: Courier, monospace; }
    .alt-row { background: #f9f9f9; }
    .no-data { color: #888; font-style: italic; }
    .status-ok { color: #166534; font-weight: bold; }
    .status-missing { color: #991b1b; font-weight: bold; }
    .footer { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; margin-top: 40px; font-weight: bold; }
    .footer-box { border-top: 1px solid #333; padding-top: 6px; }
    .summary-row td { background: #f0f4ff !important; font-weight: bold; }
  </style>
</head>
<body>
  <div class="page-header">
    <div>${orgName}</div>
    <h1>لیست کارکرد ماهانه پرسنل — ${monthLabel} ${selectedYear}</h1>
    <div>تاریخ گزارش: ${new Date().toLocaleDateString("fa-IR")}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>ردیف</th><th>کد پرسنلی</th><th>نام و نام‌خانوادگی</th>
        <th>سمت شغلی</th><th>واحد / دپارتمان</th>
        <th>روز کارکرد</th><th>اضافه‌کار (ساعت)</th>
        <th>مرخصی (روز)</th><th>غیبت (روز)</th>
        <th>مأموریت (روز)</th><th>تأخیر (ساعت)</th>
        <th>وضعیت ثبت</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr class="summary-row">
        <td colspan="5" class="center bold">جمع کل</td>
        <td class="center bold">—</td>
        <td class="center bold">${stats.totalOvertime}</td>
        <td class="center bold">—</td>
        <td class="center bold">${stats.totalAbsence}</td>
        <td class="center bold">—</td>
        <td class="center bold">—</td>
        <td class="center bold">${stats.withRecord} نفر ثبت‌شده</td>
      </tr>
    </tbody>
  </table>
  <div class="footer">
    <div class="footer-box">تنظیم‌کننده: امور اداری</div>
    <div class="footer-box">مسئول حضور و غیاب</div>
    <div class="footer-box">تأییدکننده: مدیر منابع انسانی</div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();window.close();},300);}</script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">

      {/* هدر */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-600" />
            لیست و گزارش کارکرد ماهانه پرسنل
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            نمایش یکپارچه کارکرد، مرخصی، غیبت، اضافه‌کار و مأموریت‌های پرسنل از دیتای ثبت‌شده سیستم.
          </p>
        </div>
        <Button size="sm" onClick={printReport} disabled={filteredRows.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
          <Printer className="h-4 w-4" /> چاپ گزارش (A4 Landscape)
        </Button>
      </div>

      {/* فیلترهای انتخاب دوره */}
      <Card className="border-slate-100 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-semibold">سال مالی</Label>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                <option value="1405">۱۴۰۵</option>
                <option value="1404">۱۴۰۴</option>
                <option value="1403">۱۴۰۳</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">ماه</Label>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-semibold">جستجو در لیست</Label>
              <div className="relative mt-1.5">
                <Search className="absolute right-3 top-2 h-4 w-4 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="نام، کد پرسنلی، سمت یا واحد سازمانی..."
                  className="h-9 text-xs pr-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* کارت‌های خلاصه آماری */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "کل پرسنل",             value: stats.total,           icon: Users,       color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
          { label: "ثبت کارکرد شده",        value: stats.withRecord,       icon: FileText,    color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "ثبت نشده",              value: stats.total - stats.withRecord, icon: Calendar, color: "text-rose-600",    bg: "bg-rose-50 dark:bg-rose-950/40" },
          { label: "میانگین روز کارکرد",   value: stats.avgWorkedDays,    icon: TrendingUp,  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "جمع اضافه‌کار (ساعت)", value: stats.totalOvertime,    icon: BarChart2,   color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/40" }
        ].map((s, i) => (
          <Card key={i} className={`border-0 shadow-sm ${s.bg}`}>
            <CardContent className="pt-4 pb-3 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* جدول اصلی */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="text-right border-b pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            جدول کارکرد پرسنل — {monthLabel} {selectedYear}
          </CardTitle>
          <CardDescription className="text-xs">
            داده‌های ترکیبی از ثبت کارکرد ماهانه، مرخصی‌ها و مأموریت‌های تأیید شده در این دوره.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="text-right w-10">#</TableHead>
                  <TableHead className="text-right w-20">کد</TableHead>
                  <TableHead className="text-right">نام و نام‌خانوادگی</TableHead>
                  <TableHead className="text-right">سمت</TableHead>
                  <TableHead className="text-center w-24">روز کارکرد</TableHead>
                  <TableHead className="text-center w-28">اضافه‌کار<br/><span className="font-normal text-[10px]">(ساعت)</span></TableHead>
                  <TableHead className="text-center w-24">مرخصی<br/><span className="font-normal text-[10px]">(روز)</span></TableHead>
                  <TableHead className="text-center w-24">غیبت<br/><span className="font-normal text-[10px]">(روز)</span></TableHead>
                  <TableHead className="text-center w-24">مأموریت<br/><span className="font-normal text-[10px]">(روز)</span></TableHead>
                  <TableHead className="text-center w-24">تأخیر<br/><span className="font-normal text-[10px]">(ساعت)</span></TableHead>
                  <TableHead className="text-center w-28">وضعیت ثبت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-xs text-muted-foreground font-semibold">
                      هیچ داده‌ای یافت نشد. ابتدا کارکرد پرسنل را در بخش «ثبت کارکرد ماه» وارد کنید.
                    </TableCell>
                  </TableRow>
                ) : filteredRows.map((r, idx) => (
                  <TableRow key={r.empId} className={`text-xs transition-colors ${!r.hasRecord ? "bg-rose-50/30 dark:bg-rose-950/10" : ""}`}>
                    <TableCell className="text-center text-slate-400 font-mono">{idx + 1}</TableCell>
                    <TableCell className="font-mono font-bold text-slate-600">{r.code}</TableCell>
                    <TableCell className="font-bold text-slate-900 dark:text-white">{r.name}</TableCell>
                    <TableCell className="text-slate-500">{r.jobTitle}</TableCell>

                    {/* روز کارکرد */}
                    <TableCell className="text-center">
                      {r.hasRecord ? (
                        <span className={`font-black font-mono text-sm ${r.workedDays < 20 ? "text-rose-600" : r.workedDays >= 28 ? "text-emerald-600" : "text-slate-700"}`}>
                          {r.workedDays}
                        </span>
                      ) : <span className="text-slate-300 italic text-[10px]">—</span>}
                    </TableCell>

                    {/* اضافه‌کار */}
                    <TableCell className="text-center font-mono">
                      {r.hasRecord ? (
                        <span className={r.overtimeHours > 0 ? "text-amber-600 font-bold" : "text-slate-400"}>
                          {r.overtimeHours}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </TableCell>

                    {/* مرخصی */}
                    <TableCell className="text-center font-mono">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={r.leaveDays > 0 ? "text-blue-600 font-bold" : "text-slate-400"}>
                          {r.hasRecord ? r.leaveDays : (r.leaveDays > 0 ? r.leaveDays : "—")}
                        </span>
                        {r.leaveCount > 0 && (
                          <span className="text-[9px] text-slate-400">{r.leaveCount} درخواست</span>
                        )}
                      </div>
                    </TableCell>

                    {/* غیبت */}
                    <TableCell className="text-center font-mono">
                      {r.hasRecord ? (
                        <span className={r.absenceDays > 0 ? "text-rose-600 font-bold" : "text-slate-400"}>
                          {r.absenceDays}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </TableCell>

                    {/* مأموریت */}
                    <TableCell className="text-center font-mono">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={r.missionDays > 0 ? "text-indigo-600 font-bold" : "text-slate-400"}>
                          {r.hasRecord ? r.missionDays : (r.missionDays > 0 ? r.missionDays : "—")}
                        </span>
                        {r.missionCount > 0 && (
                          <span className="text-[9px] text-slate-400">{r.missionCount} مأموریت</span>
                        )}
                      </div>
                    </TableCell>

                    {/* تأخیر */}
                    <TableCell className="text-center font-mono">
                      {r.hasRecord ? (
                        <span className={r.tardinessHours > 0 ? "text-orange-600 font-bold" : "text-slate-400"}>
                          {r.tardinessHours}
                        </span>
                      ) : <span className="text-slate-300">—</span>}
                    </TableCell>

                    {/* وضعیت */}
                    <TableCell className="text-center">
                      {r.hasRecord
                        ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px] font-bold">ثبت شده</Badge>
                        : <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[10px]">ثبت نشده</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ردیف جمع */}
          {filteredRows.length > 0 && (
            <div className="mt-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-3 flex flex-wrap gap-4 text-xs font-semibold text-right">
              <span className="text-slate-500">خلاصه {monthLabel} {selectedYear}:</span>
              <span>پرسنل ثبت‌شده: <strong className="text-emerald-600">{stats.withRecord}</strong> از {stats.total} نفر</span>
              <span>میانگین کارکرد: <strong className="text-indigo-600">{stats.avgWorkedDays} روز</strong></span>
              <span>کل اضافه‌کار: <strong className="text-amber-600">{stats.totalOvertime} ساعت</strong></span>
              <span>کل غیبت: <strong className="text-rose-600">{stats.totalAbsence} روز</strong></span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
