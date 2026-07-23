import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Pencil, Trash2, UserPlus, FileText, Briefcase, Landmark, RefreshCw
} from "lucide-react";

export default function EmployeeList() {
  const navigate = useNavigate();
  const { employees, deleteConfig, refreshAllConfigs } = useAssets();
  const [search, setSearch] = useState("");

  const employeesList = useMemo(() => employees || [], [employees]);

  const filteredEmployees = useMemo(() => {
    return employeesList.filter(e => {
      const searchLower = search.toLowerCase();
      return (
        !search ||
        e.name?.toLowerCase().includes(searchLower) ||
        e.code?.toLowerCase().includes(searchLower) ||
        e.nationalId?.toLowerCase().includes(searchLower) ||
        e.department?.toLowerCase().includes(searchLower) ||
        e.jobTitle?.toLowerCase().includes(searchLower)
      );
    });
  }, [employeesList, search]);

  const handleRefresh = async () => {
    await refreshAllConfigs();
  };

  async function handleDelete(id) {
    if (window.confirm("آیا از حذف اطلاعات این کارمند مطمئن هستید؟")) {
      const success = await deleteConfig("employees", id);
      if (success) {
        await refreshAllConfigs();
      }
    }
  }

  return (
    <div className="space-y-4" dir="rtl">
      
      {/* هدر صفحه و دکمه جدید */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="text-right">
          <h2 className="text-md font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            لیست و مدیریت اطلاعات کارکنان
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            مشاهده، جستجو، ویرایش و مدیریت احکام شغلی و مالی کلیه پرسنل ثبت شده در سیستم.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-9 gap-1.5 text-xs">
            <RefreshCw className="h-4 w-4" /> بروزرسانی
          </Button>
          <Button size="sm" onClick={() => navigate("/payroll/employees/new")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-1.5 shadow">
            <UserPlus className="h-4 w-4" /> ثبت کارمند جدید
          </Button>
        </div>
      </div>

      {/* بخش جستجو و لیست جدول */}
      <Card className="border-slate-100">
        <CardContent className="pt-4">
          
          <div className="mb-4 flex items-center gap-2 max-w-sm" dir="rtl">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <Input
              placeholder="جستجو بر اساس نام، کد پرسنلی، کد ملی، سمت..."
              className="h-8 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <Table dir="rtl">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-right w-24">کد پرسنلی</TableHead>
                  <TableHead className="text-right">نام و نام خانوادگی</TableHead>
                  <TableHead className="text-right">کد ملی</TableHead>
                  <TableHead className="text-right">واحد سازمانی</TableHead>
                  <TableHead className="text-right">سمت شغلی</TableHead>
                  <TableHead className="text-right">نوع استخدام</TableHead>
                  <TableHead className="text-left">حقوق و مزایا (ریال)</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                  <TableHead className="w-24 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground font-semibold">
                      کارمندی یافت نشد.
                    </TableCell>
                  </TableRow>
                ) : filteredEmployees.map((row) => {
                  const typeLabel =
                    row.employmentType === "official" ? "رسمی" :
                    row.employmentType === "probationary" ? "پیمانی" :
                    row.employmentType === "contractual" ? "قراردادی" :
                    row.employmentType === "hourly" ? "ساعتی" :
                    row.employmentType === "daily" ? "روزمزد" : "سایر";

                  const statusBadge =
                    row.status === "active" ? <Badge variant="success">شاغل</Badge> :
                    row.status === "leave" ? <Badge variant="warning">مرخصی</Badge> :
                    row.status === "suspended" ? <Badge variant="secondary">معلق</Badge> :
                    <Badge variant="destructive">قطع همکاری</Badge>;

                  const salaryDisplay = row.salary || row.baseSalary || 0;

                  return (
                    <tr key={row._id || row.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-300">{row.code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.name || `${row.firstName} ${row.lastName}`}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{row.nationalId || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{row.department || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.jobTitle || row.role || "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-blue-700">{typeLabel}</td>
                      <td className="px-4 py-3 font-mono font-bold text-left text-emerald-700 dark:text-emerald-400">
                        {Number(salaryDisplay).toLocaleString("fa-IR")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {statusBadge}
                          {row.taxStatus === "exempt" && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[9px] py-0 px-1 font-sans">
                              معاف (ماده ۹۱)
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => navigate("/payroll/employees/new", { state: { employee: row } })}
                            title="ویرایش اطلاعات کارمند"
                          >
                            <Pencil className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => navigate("/payroll/employees/decrees", { state: { employee: row } })}
                            title="تعریف/مشاهده احکام حقوقی"
                          >
                            <FileText className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleDelete(row._id || row.id)}
                            title="حذف پرونده کارمند"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
