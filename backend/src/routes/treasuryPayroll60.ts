import { Hono } from "hono";

const router = new Hono();

// POST /api/payroll/export-treasury-60
router.post("/export-treasury-60", async (c) => {
  try {
    const body = await c.req.json();
    const { employees = [], payrollCalculations = [], options = {} } = body;

    const {
      platform = "W",
      isArrears = false,
      yearMonth = "0307",
      serial = "001",
      executiveOrgCode = "127500"
    } = options;

    const prefix = String(platform).toUpperCase() === "D" ? "D" : "W";
    const typeLetter = isArrears ? "M" : "";
    const filename = `${prefix}${typeLetter}${String(yearMonth).padStart(4, "0")}${String(serial).padStart(3, "0")}.TXT`;

    // نگاشت کدهای عددی
    const genderMap: Record<string, string> = { male: "2", female: "4", "2": "2", "4": "4" };
    const maritalMap: Record<string, string> = { single: "1", other: "2", married: "3", with_dependents: "3", "1": "1", "2": "2", "3": "3" };
    const empTypeMap: Record<string, string> = { official: "5", official_probation: "5", probationary: "6", contractual: "7", company: "7", hourly: "7", daily: "7", "5": "5", "6": "6", "7": "7" };
    const degreeMap: Record<string, string> = { phd: "1", post_phd: "1", master: "2", bachelor: "3", associate: "4", diploma: "5", under_diploma: "6", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6" };
    const pensionMap: Record<string, string> = { civil: "7", social_security: "8", other: "9", armed_forces: "9", none: "9", "7": "7", "8": "8", "9": "9" };
    const healthMap: Record<string, string> = { "1": "1", "2": "2", "3": "3" };

    const lines: string[] = [];

    for (const emp of employees) {
      const empId = emp._id || emp.id;
      const calc = payrollCalculations.find((item: any) => String(item.employeeId) === String(empId)) || {};
      const safeCalc = calc || {};

      let birthYear = "1360";
      let birthMonth = "01";
      if (emp.birthDate && String(emp.birthDate).includes("/")) {
        const parts = String(emp.birthDate).split("/");
        if (parts.length >= 2) {
          birthYear = parts[0].padStart(4, "13");
          birthMonth = parts[1].padStart(2, "0");
        }
      }

      const maritalCode = maritalMap[emp.maritalStatus] || "1";
      let children = Number(emp.childrenCount || 0);
      if (maritalCode === "1") {
        children = 0; // قانون اعتبارسنجی حیاتی بند 10
      }

      // مبالغ اقلام 15 تا 55
      const fields15to55 = new Array(41).fill(0);
      fields15to55[0] = Math.round(Number(safeCalc.baseSalary || emp.baseSalary || (Number(emp.dailyBaseSalary || 0) * 30) || 0));
      fields15to55[1] = Math.round(Number(safeCalc.experiencePay || 0));
      fields15to55[2] = Math.round(Number(safeCalc.jobAllowance || 0));
      fields15to55[3] = Math.round(Number(safeCalc.adjustmentDifference || 0));
      fields15to55[4] = Math.round(Number(safeCalc.clauseBIncrease || 0));
      fields15to55[5] = Math.round(Number(safeCalc.hardshipAllowance || 0));
      fields15to55[6] = Math.round(Number(safeCalc.badWeatherAllowance || 0));
      fields15to55[7] = Math.round(Number(safeCalc.guaranteeAmount || 0));
      fields15to55[8] = Math.round(Number(safeCalc.serviceLocationAllowance || 0));
      fields15to55[9] = Math.round(Number(safeCalc.warZoneAllowance || 0));
      fields15to55[10] = Math.round(Number(safeCalc.specialAllowance || 0));
      fields15to55[11] = Math.round(Number(safeCalc.honorAllowance || 0));
      fields15to55[12] = Math.round(Number(safeCalc.familyAllowance || 0));
      fields15to55[13] = Math.round(Number(safeCalc.childAllowance || emp.childAllowance || 0));
      fields15to55[14] = Math.round(Number(safeCalc.sacrificeAllowance || 0));
      fields15to55[15] = Math.round(Number(safeCalc.minSalaryDiff || 0));
      fields15to55[16] = Math.round(Number(safeCalc.pensionDeduction || 0));
      fields15to55[17] = Math.round(Number(safeCalc.responsibilityAllowance || emp.responsibilityAllowance || 0));
      fields15to55[18] = Math.round(Number(safeCalc.underdevelopedAllowance || 0));
      fields15to55[19] = Math.round(Number(safeCalc.boardAllowance || 0));
      fields15to55[20] = Math.round(Number(safeCalc.overseasAllowance || 0));
      fields15to55[21] = Math.round(Number(safeCalc.healthInsEmployer || 0));
      fields15to55[22] = Math.round(Number(safeCalc.adjustmentCoefficient || 0));
      fields15to55[23] = Math.round(Number(safeCalc.demotionDiff || 0));
      fields15to55[24] = Math.round(Number(safeCalc.personalRights || 0));
      fields15to55[25] = Math.round(Number(safeCalc.groceryAllowance || emp.groceryAllowance || 0) + Number(safeCalc.housingAllowance || emp.housingAllowance || 0));
      fields15to55[26] = Math.round(Number(safeCalc.degreePercentage || 0));
      fields15to55[27] = Math.round(Number(safeCalc.managementAllowance || 0));
      fields15to55[28] = Math.round(Number(safeCalc.sacrificeEmployerShare || 0));
      fields15to55[29] = Math.round(Number(safeCalc.pensionEmployerShareCivil || 0));
      fields15to55[30] = Math.round(Number(safeCalc.socialInsEmployer || safeCalc.employerInsurance || 0));
      fields15to55[31] = Math.round(Number(safeCalc.healthInsGovtShare || 0));
      fields15to55[32] = Math.round(Number(safeCalc.pensionJihadEmployerShare || 0));
      fields15to55[33] = Math.round(Number(safeCalc.otherAllowances || emp.otherAllowances || 0) + Number(safeCalc.overtimePay || 0));
      fields15to55[34] = Math.round(Number(safeCalc.tax || safeCalc.taxDeduction || 0));
      fields15to55[35] = Math.round(Number(safeCalc.pensionEmployeeShareCivil || 0));
      fields15to55[36] = Math.round(Number(safeCalc.socialInsEmployee || safeCalc.employeeInsurance || 0));
      fields15to55[37] = Math.round(Number(safeCalc.healthInsEmployee || 0));
      fields15to55[38] = Math.round(Number(safeCalc.pensionJihadEmployeeShare || 0));
      fields15to55[39] = Math.round(Number(safeCalc.firstMonthDeduction || 0));
      fields15to55[40] = Math.round(Number(safeCalc.otherDeductions || 0));

      const totalSumField56 = fields15to55.reduce((sum, val) => sum + Math.abs(val), 0);
      const cleanBankName = String(emp.bankName || "بانک سپه").replace(/[\u0640]/g, "").trim();

      const record = [
        String(emp.executiveOrgCode || executiveOrgCode || "127500"),
        String(emp.nationalId || "").trim(),
        String(emp.code || "").trim(),
        String(birthYear),
        String(birthMonth),
        String(emp.lastName || "").trim(),
        String(emp.firstName || "").trim(),
        String(genderMap[emp.gender] || "2"),
        String(maritalCode),
        String(children),
        String(empTypeMap[emp.employmentType] || "5"),
        String(degreeMap[emp.highestDegree] || "3"),
        String(pensionMap[emp.pensionFund] || "7"),
        String(healthMap[emp.healthInsuranceStatus || "1"] || "1"),
        ...fields15to55.map(v => String(v || 0)),
        String(totalSumField56),
        String(emp.shebaNo || emp.accountNo || "").replace(/\s+/g, ""),
        cleanBankName,
        String(emp.branchName || "مرکزی").trim(),
        String(emp.bankBranchCode || emp.branchCode || "101").trim()
      ];

      lines.push(record.join(","));
    }

    const fileText = lines.join("\r\n");

    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.text(fileText);
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export default router;
