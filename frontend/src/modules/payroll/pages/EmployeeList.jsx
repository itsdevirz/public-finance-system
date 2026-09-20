import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Search, Pencil, Trash2, UserPlus, FileText, Briefcase, RefreshCw, Award, Save, Calculator } from "lucide-react";

export default function EmployeeList() {
  const navigate = useNavigate();
  const { employees, updateConfig, deleteConfig, refreshAllConfigs } = useAssets();
  const [search, setSearch] = useState("");

  // Modal state for امتیازدهی (Scoring & Decree Points)
  const [scoringEmployee, setScoringEmployee] = useState(null);
  const [isSubmittingScores, setIsSubmittingScores] = useState(false);
  const [pointsForm, setPointsForm] = useState({
    salaryCoefficient: 4829, // ضریب ریالی سالانه (هر امتیاز)
    jobPayPoints: 8300,                  // ۱. حق شغل
    managementAllowancePoints: 2250,      // ۲. فوق العاده مدیریت
    employeePayPoints: 5900,              // ۳. حق شاغل
    adaptationDiffPoints: 0,             // ۴. ب) تفاوت تطبیق
    underdevelopedAreaAllowancePoints: 0, // ۵. ث) فوق العاده مناطق کمتر توسعه یافته
    badWeatherAllowancePoints: 0,         // ۶. ج) فوق العاده بدی آب و هوا
    sacrificeAllowancePoints: 0,          // ۷. ح) فوق العاده ایثارگری
    warZoneAllowancePoints: 0,            // ۸. خ) خدمت در مناطق جنگ زده
    hardshipAllowancePoints: 0,           // ۹. د) فوق العاده سختی شرایط کار
    familyAllowancePoints: 0,             // ۱۰. ر) کمک هزینه عائله مندی
    childAllowancePoints: 0,              // ۱۱. ز) کمک هزینه اولاد
    locationAllowancePoints: 0,           // ۱۲. س) فوق العاده محل خدمت
    specialAllowancePoints: 0,            // ۱۳. ع) فوق العاده ویژه
    eliteSpecialAllowancePoints: 0,       // ۱۴. ص) فوق العاده ویژه (نخبگان)
    band5JobAllowancePoints: 0,           // ۱۵. ش) فوق العاده شغل بند ۵
    article51ExecutionPoints: 0,          // ۱۶. غ) اجرا ماده ۵۱
    attractionAllowancePoints: 0,         // ۱۷. حق جذب
    otherAllowancesPoints: 0,             // ۱۸. سایر
  });

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

  // Open scoring modal for employee
  function openScoringModal(emp) {
    setScoringEmployee(emp);
    setPointsForm({
      salaryCoefficient: emp.salaryCoefficient || 4829,
      jobPayPoints: emp.jobPayPoints ?? 8300,
      managementAllowancePoints: emp.managementAllowancePoints ?? 2250,
      employeePayPoints: emp.employeePayPoints ?? 5900,
      adaptationDiffPoints: emp.adaptationDiffPoints ?? 0,
      underdevelopedAreaAllowancePoints: emp.underdevelopedAreaAllowancePoints ?? 0,
      badWeatherAllowancePoints: emp.badWeatherAllowancePoints ?? 0,
      sacrificeAllowancePoints: emp.sacrificeAllowancePoints ?? 0,
      warZoneAllowancePoints: emp.warZoneAllowancePoints ?? 0,
      hardshipAllowancePoints: emp.hardshipAllowancePoints ?? 0,
      familyAllowancePoints: emp.familyAllowancePoints ?? 0,
      childAllowancePoints: emp.childAllowancePoints ?? 0,
      locationAllowancePoints: emp.locationAllowancePoints ?? 0,
      specialAllowancePoints: emp.specialAllowancePoints ?? 0,
      eliteSpecialAllowancePoints: emp.eliteSpecialAllowancePoints ?? 0,
      band5JobAllowancePoints: emp.band5JobAllowancePoints ?? 0,
      article51ExecutionPoints: emp.article51ExecutionPoints ?? 0,
      attractionAllowancePoints: emp.attractionAllowancePoints ?? 0,
      otherAllowancesPoints: emp.otherAllowancesPoints ?? 0,
    });
  }

  // Calculation helper
  const fixedPayPointsA =
    Number(pointsForm.jobPayPoints || 0) +
    Number(pointsForm.managementAllowancePoints || 0) +
    Number(pointsForm.employeePayPoints || 0);

  const totalPointsSum =
    fixedPayPointsA +
    Number(pointsForm.adaptationDiffPoints || 0) +
    Number(pointsForm.underdevelopedAreaAllowancePoints || 0) +
    Number(pointsForm.badWeatherAllowancePoints || 0) +
    Number(pointsForm.sacrificeAllowancePoints || 0) +
    Number(pointsForm.warZoneAllowancePoints || 0) +
    Number(pointsForm.hardshipAllowancePoints || 0) +
    Number(pointsForm.familyAllowancePoints || 0) +
    Number(pointsForm.childAllowancePoints || 0) +
    Number(pointsForm.locationAllowancePoints || 0) +
    Number(pointsForm.specialAllowancePoints || 0) +
    Number(pointsForm.eliteSpecialAllowancePoints || 0) +
    Number(pointsForm.band5JobAllowancePoints || 0) +
    Number(pointsForm.article51ExecutionPoints || 0) +
    Number(pointsForm.attractionAllowancePoints || 0) +
    Number(pointsForm.otherAllowancesPoints || 0);

  const coef = Number(pointsForm.salaryCoefficient || 0);
  const totalRialsSum = totalPointsSum * coef;

  function handlePointChange(field, val) {
    setPointsForm(f => ({ ...f, [field]: Number(val) }));
  }

  // Save scores to employee record
  async function handleSavePoints(e) {
    e.preventDefault();
    if (!scoringEmployee) return;

    try {
      setIsSubmittingScores(true);

      // Compute rial values from points
      const updatedEmployee = {
        ...scoringEmployee,
        ...pointsForm,
        // Calculated rial values
        jobPay: pointsForm.jobPayPoints * coef,
        managementAllowance: pointsForm.managementAllowancePoints * coef,
        employeePay: pointsForm.employeePayPoints * coef,
        adaptationDiff: pointsForm.adaptationDiffPoints * coef,
        underdevelopedAreaAllowance: pointsForm.underdevelopedAreaAllowancePoints * coef,
        badWeatherAllowance: pointsForm.badWeatherAllowancePoints * coef,
        sacrificeAllowance: pointsForm.sacrificeAllowancePoints * coef,
        warZoneAllowance: pointsForm.warZoneAllowancePoints * coef,
        hardshipAllowance: pointsForm.hardshipAllowancePoints * coef,
        familyAllowance: pointsForm.familyAllowancePoints * coef,
        childAllowance: pointsForm.childAllowancePoints * coef,
        locationAllowance: pointsForm.locationAllowancePoints * coef,
        specialAllowance: pointsForm.specialAllowancePoints * coef,
        eliteSpecialAllowance: pointsForm.eliteSpecialAllowancePoints * coef,
        band5JobAllowance: pointsForm.band5JobAllowancePoints * coef,
        article51Execution: pointsForm.article51ExecutionPoints * coef,
        attractionAllowance: pointsForm.attractionAllowancePoints * coef,
        otherAllowances: pointsForm.otherAllowancesPoints * coef,
        totalPointsSum,
        salary: totalRialsSum > 0 ? totalRialsSum : scoringEmployee.salary
      };

      const result = await updateConfig("employees", updatedEmployee);
      if (result) {
        setScoringEmployee(null);
        await refreshAllConfigs();
      } else {
        alert("خطا در ذخیره امتیازات کارمند.");
      }
    } catch (err) {
      console.error(err);
      alert("خطایی در ثبت امتیازات رخ داد.");
    } finally {
      setIsSubmittingScores(false);
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
            مشاهده، جستجو، امتیازدهی، ویرایش و مدیریت احکام شغلی و مالی کلیه پرسنل ثبت شده در سیستم.
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
                  <TableHead className="text-center w-28">جمع امتیازات</TableHead>
                  <TableHead className="text-left">حقوق و مزایا (ریال)</TableHead>
                  <TableHead className="text-center">وضعیت</TableHead>
                  <TableHead className="w-32 text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-xs text-muted-foreground font-semibold">
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
                  const empPoints = row.totalPointsSum || ((row.jobPayPoints || 8300) + (row.managementAllowancePoints || 2250) + (row.employeePayPoints || 5900));

                  return (
                    <tr key={row._id || row.id} className="border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-300">{row.code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.name || `${row.firstName} ${row.lastName}`}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{row.nationalId || "—"}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{row.department || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.jobTitle || row.role || "—"}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-blue-700">{typeLabel}</td>
                      <td className="px-4 py-3 font-mono font-bold text-center text-amber-700 dark:text-amber-400 bg-amber-50/50 rounded-lg">
                        {empPoints.toLocaleString("fa-IR")} <span className="text-[10px] font-normal">امتیاز</span>
                      </td>
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
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                            onClick={() => openScoringModal(row)}
                            title="امتیازدهی و ثبت امتیازات حکم کارمند"
                          >
                            <Award className="h-3.5 w-3.5 text-amber-600" />
                            <span>امتیازدهی</span>
                          </Button>
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

      {/* مودال امتیازدهی کارگزینی و محاسبه امتیازات حکم */}
      <Modal
        open={!!scoringEmployee}
        onClose={() => setScoringEmployee(null)}
        title={`جدول امتیازدهی کارگزینی و امتیازات حکم: ${scoringEmployee ? `${scoringEmployee.firstName || ""} ${scoringEmployee.lastName || ""}` : ""}`}
        description="امتیازات هر یک از ردیف‌های حکم استخدامی را وارد کنید. مبلغ ریالی از ضرب مجموع امتیازات در ضریب حقوق محاسبه می‌شود."
        size="lg"
      >
        {scoringEmployee && (
          <form onSubmit={handleSavePoints} className="space-y-4 p-4 text-right" dir="rtl">
            
            {/* تنظیم ضریب ریالی */}
            <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">ضریب ریالی سالانه جهت تبدیل امتیاز به ریال:</span>
              </div>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  type="number"
                  value={pointsForm.salaryCoefficient}
                  onChange={e => setPointsForm(f => ({ ...f, salaryCoefficient: Number(e.target.value) }))}
                  className="h-8 text-xs font-mono text-left font-bold w-32 bg-white dark:bg-slate-900"
                />
                <span className="text-xs font-bold text-slate-600">ریال</span>
              </div>
            </div>

            {/* جدول ورود امتیازات */}
            <div className="overflow-y-auto max-h-[60vh] border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold">
                    <TableHead className="w-12 text-center">ردیف</TableHead>
                    <TableHead className="text-right">عنوان ردیف حکم</TableHead>
                    <TableHead className="w-36 text-center">امتیاز</TableHead>
                    <TableHead className="text-left w-44">برآورد مبلغ (ریال)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <tr className="border-b bg-amber-50/20">
                    <td className="text-center font-bold">۱</td>
                    <td className="font-bold text-slate-900 dark:text-white">حق شغل</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        value={pointsForm.jobPayPoints}
                        onChange={e => handlePointChange("jobPayPoints", e.target.value)}
                        className="h-8 text-xs font-mono text-center font-bold"
                      />
                    </td>
                    <td className="px-3 py-2 text-left font-mono font-bold text-emerald-700">
                      {(pointsForm.jobPayPoints * coef).toLocaleString("fa-IR")}
                    </td>
                  </tr>

                  <tr className="border-b bg-amber-50/20">
                    <td className="text-center font-bold">۲</td>
                    <td className="font-bold text-slate-900 dark:text-white">فوق العاده مدیریت</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        value={pointsForm.managementAllowancePoints}
                        onChange={e => handlePointChange("managementAllowancePoints", e.target.value)}
                        className="h-8 text-xs font-mono text-center font-bold"
                      />
                    </td>
                    <td className="px-3 py-2 text-left font-mono font-bold text-emerald-700">
                      {(pointsForm.managementAllowancePoints * coef).toLocaleString("fa-IR")}
                    </td>
                  </tr>

                  <tr className="border-b bg-amber-50/20">
                    <td className="text-center font-bold">۳</td>
                    <td className="font-bold text-slate-900 dark:text-white">حق شاغل</td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        value={pointsForm.employeePayPoints}
                        onChange={e => handlePointChange("employeePayPoints", e.target.value)}
                        className="h-8 text-xs font-mono text-center font-bold"
                      />
                    </td>
                    <td className="px-3 py-2 text-left font-mono font-bold text-emerald-700">
                      {(pointsForm.employeePayPoints * coef).toLocaleString("fa-IR")}
                    </td>
                  </tr>

                  <tr className="bg-blue-100 dark:bg-blue-950 font-extrabold border-y-2 border-blue-300">
                    <td className="text-center">—</td>
                    <td className="text-blue-900 dark:text-blue-200">- جمع حقوق ثابت (الف)</td>
                    <td className="text-center font-mono text-blue-950 dark:text-blue-100 text-sm">
                      {fixedPayPointsA.toLocaleString("fa-IR")}
                    </td>
                    <td className="text-left font-mono text-blue-950 dark:text-blue-100 text-sm">
                      {(fixedPayPointsA * coef).toLocaleString("fa-IR")}
                    </td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۴</td>
                    <td>ب) تفاوت تطبیق</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.adaptationDiffPoints} onChange={e => handlePointChange("adaptationDiffPoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.adaptationDiffPoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۵</td>
                    <td>ث) فوق العاده مناطق کمتر توسعه یافته</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.underdevelopedAreaAllowancePoints} onChange={e => handlePointChange("underdevelopedAreaAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.underdevelopedAreaAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۶</td>
                    <td>ج) فوق العاده بدی آب و هوا</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.badWeatherAllowancePoints} onChange={e => handlePointChange("badWeatherAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.badWeatherAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۷</td>
                    <td>ح) فوق العاده ایثارگری</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.sacrificeAllowancePoints} onChange={e => handlePointChange("sacrificeAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.sacrificeAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۸</td>
                    <td>خ) خدمت در مناطق جنگ زده</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.warZoneAllowancePoints} onChange={e => handlePointChange("warZoneAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.warZoneAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۹</td>
                    <td>د) فوق العاده سختی شرایط کار</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.hardshipAllowancePoints} onChange={e => handlePointChange("hardshipAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.hardshipAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۰</td>
                    <td>ر) کمک هزینه عائله مندی</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.familyAllowancePoints} onChange={e => handlePointChange("familyAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.familyAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۱</td>
                    <td>ز) کمک هزینه اولاد</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.childAllowancePoints} onChange={e => handlePointChange("childAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.childAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۲</td>
                    <td>س) فوق العاده محل خدمت</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.locationAllowancePoints} onChange={e => handlePointChange("locationAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.locationAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۳</td>
                    <td>ع) فوق العاده ویژه</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.specialAllowancePoints} onChange={e => handlePointChange("specialAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.specialAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۴</td>
                    <td>ص) فوق العاده ویژه (نخبگان)</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.eliteSpecialAllowancePoints} onChange={e => handlePointChange("eliteSpecialAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.eliteSpecialAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۵</td>
                    <td>ش) فوق العاده شغل بند 5</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.band5JobAllowancePoints} onChange={e => handlePointChange("band5JobAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.band5JobAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۶</td>
                    <td>غ) اجرا ماده 51</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.article51ExecutionPoints} onChange={e => handlePointChange("article51ExecutionPoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.article51ExecutionPoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۷</td>
                    <td>حق جذب</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.attractionAllowancePoints} onChange={e => handlePointChange("attractionAllowancePoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.attractionAllowancePoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                  <tr className="border-b">
                    <td className="text-center">۱۸</td>
                    <td>سایر</td>
                    <td className="p-2">
                      <Input type="number" min="0" value={pointsForm.otherAllowancesPoints} onChange={e => handlePointChange("otherAllowancesPoints", e.target.value)} className="h-8 text-xs font-mono text-center" />
                    </td>
                    <td className="px-3 py-2 text-left font-mono">{(pointsForm.otherAllowancesPoints * coef).toLocaleString("fa-IR")}</td>
                  </tr>

                </TableBody>
              </Table>
            </div>

            {/* جمع‌بندی نهایی */}
            <div className="bg-emerald-500/10 p-4 rounded-xl flex justify-between items-center border border-emerald-500/20">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">جمع کل امتیازات حکم: <strong className="text-amber-700 dark:text-amber-400 font-mono text-sm mr-1">{totalPointsSum.toLocaleString("fa-IR")} امتیاز</strong></span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">مبلغ کل ریالی: {totalRialsSum.toLocaleString("fa-IR")} ریال</span>
              </div>
              <div className="font-mono text-left">
                <span className="text-base font-black text-emerald-800 dark:text-emerald-400">
                  {(totalRialsSum / 10).toLocaleString("fa-IR")} <span className="text-xs font-semibold">تومان</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setScoringEmployee(null)} className="h-8 text-xs">
                انصراف
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingScores} className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-8 text-xs gap-1.5 shadow">
                <Save className="h-4 w-4" />
                {isSubmittingScores ? "در حال ذخیره..." : "ثبت امتیازات و محاسبه حکم"}
              </Button>
            </div>

          </form>
        )}
      </Modal>

    </div>
  );
}
