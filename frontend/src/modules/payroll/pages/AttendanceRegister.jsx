import { useState, useMemo, useEffect } from "react";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  FileText, Save, RefreshCw, Calendar, Users, Info, ShieldCheck, Printer, Check, Search, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function AttendanceRegister() {
  const {
    employees, attendanceRecords, addConfig, updateConfig, deleteConfig, refreshAllConfigs
  } = useAssets();

  const [selectedYear, setSelectedYear] = useState("1405");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [search, setSearch] = useState("");
  const [gridData, setGridData] = useState([]); // local editable records
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load attendance records for the selected Year and Month
  const currentMonthRecords = useMemo(() => {
    return (attendanceRecords || []).filter(
      r => String(r.year) === String(selectedYear) && String(r.month) === String(selectedMonth)
    );
  }, [attendanceRecords, selectedYear, selectedMonth]);

  // Sync grid data when selection or global records change
  useEffect(() => {
    if (currentMonthRecords.length > 0) {
      // Deduplicate records by employeeId to prevent duplicate rows in UI
      const uniqueRecordsMap = new Map();
      currentMonthRecords.forEach(r => {
        if (!uniqueRecordsMap.has(r.employeeId)) {
          uniqueRecordsMap.set(r.employeeId, r);
        }
      });
      const uniqueRecords = Array.from(uniqueRecordsMap.values());

      // Map existing records from backend
      const mapped = uniqueRecords.map(r => {
        const emp = (employees || []).find(e => (e._id === r.employeeId || e.id === r.employeeId));
        return {
          id: r._id || r.id,
          employeeId: r.employeeId,
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "پرسنل نامشخص",
          employeeCode: emp ? emp.code : "—",
          workedDays: r.workedDays ?? 30,
          overtimeHours: r.overtimeHours ?? 0,
          leaveDays: r.leaveDays ?? 0,
          absenceDays: r.absenceDays ?? 0,
          missionDays: r.missionDays ?? 0,
          tardinessHours: r.tardinessHours ?? 0
        };
      });
      setGridData(mapped);
    } else {
      // No records found, set empty grid
      setGridData([]);
    }
  }, [currentMonthRecords, employees, selectedYear, selectedMonth]);

  // Fill grid with defaults for all employees
  function handleInitDefaults() {
    if (!employees || employees.length === 0) {
      setErrorMsg("هیچ کارمندی در سیستم ثبت نشده است. ابتدا کارمندان را ثبت کنید.");
      return;
    }

    const defaults = employees.map(emp => {
      const empId = emp._id || emp.id;
      // Preserve existing ID if record already exists for this employee in current month
      const existing = (currentMonthRecords || []).find(r => r.employeeId === empId) ||
                       gridData.find(g => g.employeeId === empId);

      return {
        id: existing?.id || existing?._id || null,
        employeeId: empId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        employeeCode: emp.code,
        workedDays: existing?.workedDays ?? 30,
        overtimeHours: existing?.overtimeHours ?? 0,
        leaveDays: existing?.leaveDays ?? 0,
        absenceDays: existing?.absenceDays ?? 0,
        missionDays: existing?.missionDays ?? 0,
        tardinessHours: existing?.tardinessHours ?? 0
      };
    });
    setGridData(defaults);
    setErrorMsg("");
    setSuccessMsg("پیش‌فرض کارکرد ۳۰ روزه برای تمامی کارکنان در جدول لود شد.");
    setTimeout(() => setSuccessMsg(""), 3000);
  }

  // Handle cell changes inside the grid
  function handleCellChange(empId, field, value) {
    setGridData(current =>
      current.map(row => {
        if (row.employeeId === empId) {
          return { ...row, [field]: Number(value) };
        }
        return row;
      })
    );
  }

  // Save all grid entries to the backend
  async function handleSaveAll() {
    if (gridData.length === 0) {
      setErrorMsg("جدول کارکرد خالی است. ابتدا کارکردها را ایجاد یا وارد کنید.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg("");
      setSuccessMsg("");

      // Save each row (create or update)
      const savePromises = gridData.map(async row => {
        const payload = {
          year: Number(selectedYear),
          month: selectedMonth,
          employeeId: row.employeeId,
          workedDays: row.workedDays,
          overtimeHours: row.overtimeHours,
          leaveDays: row.leaveDays,
          absenceDays: row.absenceDays,
          missionDays: row.missionDays,
          tardinessHours: row.tardinessHours
        };

        // Find existing record in backend if row.id is missing
        const existingRecord = (attendanceRecords || []).find(
          r => r.employeeId === row.employeeId &&
               String(r.year) === String(selectedYear) &&
               String(r.month) === String(selectedMonth)
        );

        const targetId = row.id || existingRecord?._id || existingRecord?.id;

        if (targetId) {
          // Update existing
          return updateConfig("attendance_records", { ...payload, id: targetId, _id: targetId });
        } else {
          // Add new
          return addConfig("attendance_records", payload);
        }
      });

      await Promise.all(savePromises);

      // Clean up any pre-existing duplicate records in the backend for this period
      const currentPeriodRecords = (attendanceRecords || []).filter(
        r => String(r.year) === String(selectedYear) && String(r.month) === String(selectedMonth)
      );
      const seenEmpIds = new Set();
      const duplicatesToDelete = [];
      currentPeriodRecords.forEach(r => {
        if (seenEmpIds.has(r.employeeId)) {
          duplicatesToDelete.push(r._id || r.id);
        } else {
          seenEmpIds.add(r.employeeId);
        }
      });

      if (duplicatesToDelete.length > 0) {
        await Promise.all(duplicatesToDelete.map(id => deleteConfig("attendance_records", id)));
      }

      setSuccessMsg("اطلاعات حضور و غیاب و کارکرد ماه با موفقیت ذخیره و ثبت گردید.");
      await refreshAllConfigs();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setErrorMsg("خطایی در ذخیره‌سازی کارکرد رخ داد.");
    } finally {
      setIsSaving(false);
    }
  }

  // Filtered local grid
  const filteredGrid = useMemo(() => {
    return gridData.filter(row => {
      const searchLower = search.toLowerCase();
      return (
        !search ||
        row.employeeName.toLowerCase().includes(searchLower) ||
        row.employeeCode.toLowerCase().includes(searchLower)
      );
    });
  }, [gridData, search]);

  // Print monthly attendance summary sheet (A4 Landscape)
  function printAttendanceSummary() {
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || "";
    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) {
      alert("پنجره چاپ مسدود شد. لطفا اجازه دسترسی به پاپ‌آپ را بدهید.");
      return;
    }

    const tableRows = filteredGrid.map((row, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-family: monospace; text-align: center;">${row.employeeCode}</td>
        <td style="font-weight: bold;">${row.employeeName}</td>
        <td style="text-align: center; font-family: Courier;">${row.workedDays}</td>
        <td style="text-align: center; font-family: Courier;">${row.overtimeHours}</td>
        <td style="text-align: center; font-family: Courier;">${row.leaveDays}</td>
        <td style="text-align: center; font-family: Courier;">${row.absenceDays}</td>
        <td style="text-align: center; font-family: Courier;">${row.missionDays}</td>
        <td style="text-align: center; font-family: Courier;">${row.tardinessHours}</td>
      </tr>
    `).join("");

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>خلاصه کارکرد ماهانه - ${monthName} ${selectedYear}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 10mm;
    }
    body {
      font-family: "Tahoma", sans-serif;
      font-size: 11px;
      color: #111;
      direction: rtl;
      padding: 10px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #222;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .title {
      font-size: 14px;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: right;
    }
    thead th {
      background-color: #f2f2f2 !important;
      font-weight: bold;
      text-align: center;
    }
    .text-center { text-align: center !important; }
  </style>
</head>
<body>
  <div class="header">
    <div>سازمان / اداره: <strong>${localStorage.getItem("org_name") || "وزارت امور اقتصادی و دارایی"}</strong></div>
    <div class="title">لیست خلاصه کارکرد ماهانه پرسنل - ${monthName} ماه سال ${selectedYear}</div>
    <div>تاریخ گزارش: ${new Date().toLocaleDateString("fa-IR")}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 50px;">ردیف</th>
        <th style="width: 90px;">کد پرسنلی</th>
        <th>نام و نام خانوادگی</th>
        <th style="width: 90px;">روز کارکرد عادی</th>
        <th style="width: 90px;">اضافه‌کار (ساعت)</th>
        <th style="width: 90px;">مرخصی (روز)</th>
        <th style="width: 90px;">غیبت (روز)</th>
        <th style="width: 90px;">ماموریت (روز)</th>
        <th style="width: 90px;">تاخیر/کسر کار</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  <div style="margin-top: 50px; display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-weight: bold;">
    <div>تنظیم‌کننده: امور اداری</div>
    <div>مسئول حضور و غیاب</div>
    <div>تاییدکننده: مدیریت منابع انسانی</div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 300);
    };
  </script>
</body>
</html>`);
    win.document.close();
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">
      
      {/* بخش انتخاب دوره و فیلترها */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="text-right pb-3 border-b">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            انتخاب دوره و ثبت کارکرد ماهانه کارکنان
          </CardTitle>
          <CardDescription className="text-xs">دوره سال و ماه مالی را انتخاب کرده و کارکرد ماهانه را ثبت کنید.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-semibold">سال مالی کارکرد</Label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5"
              >
                <option value="1405">سال ۱۴۰۵</option>
                <option value="1404">سال ۱۴۰۴</option>
                <option value="1403">سال ۱۴۰۳</option>
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold">ماه کارکرد</Label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm mt-1.5"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleInitDefaults}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 text-xs px-4"
              >
                تکمیل کارکرد پیش‌فرض پرسنل
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* پیام‌های وضعیت */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* جدول ثبت کارکرد */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="text-right border-b pb-3 flex flex-row justify-between items-center space-y-0">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              جدول ورود اطلاعات کارکرد پرسنل
            </CardTitle>
            <CardDescription className="text-xs">تعداد روزها و ساعات کارکرد هر پرسنل را وارد کنید.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={printAttendanceSummary}
              disabled={filteredGrid.length === 0}
              className="text-xs h-8 gap-1.5 font-bold"
            >
              <Printer className="h-4 w-4" /> چاپ لیست کارکرد
            </Button>
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving || filteredGrid.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs gap-1.5 px-4 shadow"
            >
              <Save className="h-4 w-4" /> {isSaving ? "در حال ذخیره‌سازی..." : "ذخیره نهایی کارکرد ماه"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center gap-2 mb-4">
            <div className="flex items-center gap-2 max-w-sm flex-1">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <Input
                placeholder="جستجو پرسنل با نام یا کد پرسنلی..."
                className="h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right w-24">کد پرسنلی</TableHead>
                  <TableHead className="text-right">نام پرسنل</TableHead>
                  <TableHead className="text-center w-28">روز کارکرد عادی</TableHead>
                  <TableHead className="text-center w-28">اضافه‌کار (ساعت)</TableHead>
                  <TableHead className="text-center w-28">مرخصی استحقاقی (روز)</TableHead>
                  <TableHead className="text-center w-28">غیبت (روز)</TableHead>
                  <TableHead className="text-center w-28">ماموریت (روز)</TableHead>
                  <TableHead className="text-center w-28">تاخیر/کسر کار (ساعت)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrid.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                      کارکردی برای این ماه ثبت نشده است. دکمه «تکمیل کارکرد پیش‌فرض پرسنل» را بزنید.
                    </TableCell>
                  </TableRow>
                ) : filteredGrid.map(row => (
                  <tr key={row.employeeId} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-700">{row.employeeCode}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-white">{row.employeeName}</td>
                    <td className="px-4 py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        max="31"
                        value={row.workedDays}
                        onChange={e => handleCellChange(row.employeeId, "workedDays", e.target.value)}
                        className="h-8 text-xs font-mono text-center w-20 mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={row.overtimeHours}
                        onChange={e => handleCellChange(row.employeeId, "overtimeHours", e.target.value)}
                        className="h-8 text-xs font-mono text-center w-20 mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        max="31"
                        value={row.leaveDays}
                        onChange={e => handleCellChange(row.employeeId, "leaveDays", e.target.value)}
                        className="h-8 text-xs font-mono text-center w-20 mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        max="31"
                        value={row.absenceDays}
                        onChange={e => handleCellChange(row.employeeId, "absenceDays", e.target.value)}
                        className="h-8 text-xs font-mono text-center w-20 mx-auto animate-in fade-in"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        max="31"
                        value={row.missionDays}
                        onChange={e => handleCellChange(row.employeeId, "missionDays", e.target.value)}
                        className="h-8 text-xs font-mono text-center w-20 mx-auto"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Input
                        type="number"
                        min="0"
                        value={row.tardinessHours}
                        onChange={e => handleCellChange(row.employeeId, "tardinessHours", e.target.value)}
                        className="h-8 text-xs font-mono text-center w-20 mx-auto"
                      />
                    </td>
                  </tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
