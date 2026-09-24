import api from "@/api";

/**
 * دریافت و محاسبه خودکار مانده تمام کدهای معین از روی اسناد حسابداری و اعتبارات
 */
export async function fetchMoeinBalances() {
  const moeinMap = {}; // { '91001': number, '91002': number, '81008': number, ... }

  const addVal = (code, val) => {
    if (!code) return;
    const num = Number(val) || 0;
    if (num === 0) return;
    const clean = String(code).trim().replace(/[^\d]/g, "");
    if (!clean) return;

    moeinMap[clean] = (moeinMap[clean] || 0) + num;

    if (clean.length > 5) {
      const moein5 = clean.slice(0, 5);
      moeinMap[moein5] = (moeinMap[moein5] || 0) + num;
    }
    if (clean.length > 3) {
      const kol3 = clean.slice(0, 3);
      moeinMap[kol3] = (moeinMap[kol3] || 0) + num;
    }
  };

  // ۰. خواندن تراز آزمایشی / تراز ۸ ستونی کل (اصلی‌ترین منبع اطلاعات مالی)
  try {
    const tbRes = await api.get("/api/ledger/trial-balance?level=moein");
    const rows = tbRes.data?.data || [];
    if (Array.isArray(rows)) {
      rows.forEach((row) => {
        const code = row.code;
        const bal = Math.max(
          Math.abs(Number(row.debit_bal) || 0),
          Math.abs(Number(row.credit_bal) || 0),
          Math.abs(Number(row.debit_net) || 0),
          Math.abs(Number(row.credit_net) || 0),
          Math.abs((Number(row.debit_turn) || 0) - (Number(row.credit_turn) || 0))
        );
        addVal(code, bal);
      });
    }
  } catch (e) {
    console.warn("خطا در دریافت تراز آزمایشی معین:", e);
  }

  // ۱. خواندن اسناد حسابداری ثبت‌شده (اسناد دفتر روزنامه / معین)
  try {
    const docRes = await api.get("/api/documents");
    const docs = docRes.data?.data || docRes.data || [];
    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        if (doc.status === "CANCELLED") return;
        (doc.lines || []).forEach((line) => {
          const code = String(line.account_code || "").trim();
          if (!code) return;
          const debit = Number(line.debit) || 0;
          const credit = Number(line.credit) || 0;
          const amount = (debit > 0 || credit > 0) ? Math.max(debit, credit) : Math.abs(debit - credit);
          addVal(code, amount);

          // تفکیک کدهای انتظامی مشترک (۸۱۰۱۰، ۸۲۰۱۰، ۸۱۰۱۷، ۸۲۰۱۷) بر اساس فصل اعتباری در تفصیلی
          if (["81010", "82010", "81017", "82017"].includes(code)) {
            const ch = String(line.chapter_code || line.chapter || line.tafsili_chapter || "").trim().replace(/^0+/, "");
            const chNum = Number(ch);
            if (chNum >= 8 || line.account_kind === "capital" || line.is_capital) {
              addVal(`${code}_capital`, amount);
            } else {
              addVal(`${code}_expense`, amount);
            }
          }
        });
      });
    }
  } catch (e) {
    console.error("خطا در دریافت اسناد حسابداری برای استخراج کدهای معین:", e);
  }

  // ۲. خواندن اعتبارات و موافقت‌نامه‌های بودجه‌ای ثبت‌شده
  try {
    const agrRes = await api.get("/api/credits/agreements");
    const agrs = agrRes.data?.data || agrRes.data || [];
    if (Array.isArray(agrs)) {
      agrs.forEach((agr) => {
        const isCapital = agr.credit_category === "capital";
        const code = isCapital ? "91002" : "91001";
        addVal(code, agr.total_amount || agr.amount || 0);

        if (agr.source_type === "resources" || agr.sourceType === "resources") {
          addVal("81008", agr.total_amount || agr.amount || 0);
        }
      });
    }
  } catch (e) {
    console.warn("موافقت‌نامه‌های اعتبارات دریافت نشد:", e);
  }

  // ۳. خواندن تخصیص‌های اعتبارات
  try {
    const allocRes = await api.get("/api/credits/allocations");
    const allocs = allocRes.data?.data || allocRes.data || [];
    if (Array.isArray(allocs)) {
      allocs.forEach((al) => {
        const isCapital = al.credit_category === "capital";
        const code = isCapital ? "92002" : "92001";
        addVal(code, al.amount || 0);
      });
    }
  } catch (e) {
    console.warn("تخصیص‌های اعتبار دریافت نشد:", e);
  }

  // ۴. خواندن دریافتی‌ها و واریزی‌های اعتبارات/منابع
  try {
    const recRes = await api.get("/api/credits/receipts");
    const recs = recRes.data?.data || recRes.data || [];
    if (Array.isArray(recs)) {
      recs.forEach((r) => {
        const isCapital = r.credit_category === "capital" || r.account_kind === "capital";
        const code = r.moein_code || (isCapital ? "41003" : "41001");
        addVal(code, r.amount || 0);

        if (["81010", "82010", "81017", "82017"].includes(String(r.moein_code || "").trim())) {
          if (isCapital) {
            addVal(`${r.moein_code}_capital`, r.amount || 0);
          } else {
            addVal(`${r.moein_code}_expense`, r.amount || 0);
          }
        }

        if (r.treasury_deposit_amount) {
          addVal("63001", r.treasury_deposit_amount);
        }
      });
    }
  } catch (e) {
    console.warn("دریافتی‌های خزانه دریافت نشد:", e);
  }

  return moeinMap;
}

/**
 * ارزیابی و محاسبه مجموع مقادیر یک فرمول/رشته کدهای معین مانند "93001 / 97001 / 98001 / -94001"
 */
export function parseMoeinStringValue(moeinStr, moeinMap = {}) {
  if (!moeinStr || typeof moeinStr !== "string") return 0;
  if (moeinStr.includes("محاسباتی") || moeinStr.includes("قفل")) return 0;

  const tokens = moeinStr.split(/[\/\s,]+/);
  let total = 0;

  tokens.forEach((t) => {
    const trimmed = t.trim();
    if (!trimmed) return;
    const isNegative = trimmed.startsWith("-");
    const code = trimmed.replace("-", "").trim();

    if (/^\d{4,6}$/.test(code)) {
      const val = moeinMap[code] || 0;
      if (isNegative) {
        total -= val;
      } else {
        total += val;
      }
    }
  });

  return total;
}

/**
 * به روزرسانی تمامی فرم‌های عملکردی سناما بر اساس کدهای معین احصا شده
 */
export function updateSanamaFormsFromMoeinMap(moeinMap, initialData = {}) {
  // ۱. فرم ۱ (موافقت‌نامه هزینه‌ای)
  const initialBudgetForm1 = moeinMap["91001"] || initialData.form1Data?.initialBudget || 0;
  const draftsForm1 = moeinMap["94001"] || initialData.form1Data?.drafts || 0;

  const updatedForm1 = {
    ...initialData.form1Data,
    initialBudget: initialBudgetForm1,
    drafts: draftsForm1,
  };

  // ۲. فرم ۴-۶ (اعتبارات هزینه‌ای)
  const updatedForm46 = (initialData.form46Data || []).map((row) => {
    if (row.isCalculated) return row;
    const calcVal = parseMoeinStringValue(row.moeinCodes, moeinMap);
    return {
      ...row,
      approvedAmount: calcVal > 0 ? calcVal : row.approvedAmount
    };
  });

  // ۳. فرم ۵-۷ (اعتبارات سرمایه‌ای/تملک)
  const updatedForm75 = (initialData.form75Data || []).map((row) => {
    if (row.isCalculated) return row;
    const calcVal = parseMoeinStringValue(row.moeinCodes, moeinMap);
    return {
      ...row,
      approvedAmount: calcVal > 0 ? calcVal : row.approvedAmount
    };
  });

  // ۴. فرم ۸ (منابع و درآمدها)
  const updatedForm8 = (initialData.form8Data || []).map((row) => {
    const expVal = parseMoeinStringValue(row.expectedMoein, moeinMap);
    const recVal = parseMoeinStringValue(row.receivedMoein, moeinMap);
    const sentVal = parseMoeinStringValue(row.sentMoein, moeinMap);
    return {
      ...row,
      expectedAmount: expVal > 0 ? expVal : row.expectedAmount,
      receivedAmount: recVal > 0 ? recVal : row.receivedAmount,
      sentAmount: sentVal > 0 ? sentVal : row.sentAmount,
    };
  });

  // ۵. فرم ۹ (پیش‌پرداخت‌ها، موجودی‌ها و علی‌الحساب)
  const updatedForm9 = {
    prepayments: {
      ...initialData.form9Data?.prepayments,
      yearEndBalance: (moeinMap["98003"] || moeinMap["98001"]) || initialData.form9Data?.prepayments?.yearEndBalance || 0,
    },
    inventories: {
      ...initialData.form9Data?.inventories,
      yearEndBalance: (moeinMap["98004"] || moeinMap["98002"]) || initialData.form9Data?.inventories?.yearEndBalance || 0,
    },
    onAccounts: {
      ...initialData.form9Data?.onAccounts,
      yearEndBalance: (moeinMap["98003"] || moeinMap["98004"]) || initialData.form9Data?.onAccounts?.yearEndBalance || 0,
    },
  };

  // ۶. فرم ۱۰ (وجوه انتقالی)
  const updatedForm10 = (initialData.form10Data || []).map((row) => {
    const expDrafts = moeinMap["94003"] || row.transferredDraftsExpense || 0;
    const capDrafts = moeinMap["94004"] || row.transferredDraftsCapital || 0;
    const consumed = (moeinMap["99001"] || moeinMap["99002"]) || row.consumedTransferred || 0;
    return {
      ...row,
      transferredDraftsExpense: expDrafts,
      transferredDraftsCapital: capDrafts,
      consumedTransferred: consumed,
    };
  });

  // ۷. فرم ۱۱ (اسناد واخواهی و کسری ابواب جمعی)
  const updatedForm11 = (initialData.form11Data || []).map((row) => {
    const expVal = parseMoeinStringValue(row.moeinExpense || row.yearEndMoeinExpense, moeinMap);
    const capVal = parseMoeinStringValue(row.moeinCapital || row.yearEndMoeinCapital, moeinMap);
    return {
      ...row,
      initialBalance: expVal > 0 ? expVal : row.initialBalance,
      consumedTransferred: capVal > 0 ? capVal : row.consumedTransferred,
    };
  });

  // ۸. فرم ۱۳ (اوراق مالی)
  const updatedForm13 = (initialData.form13Data || []).map((row) => {
    const expVal = parseMoeinStringValue(row.moeinExpenseApproved, moeinMap);
    const capVal = parseMoeinStringValue(row.moeinCapitalApproved, moeinMap);
    const totalVal = expVal + capVal;
    return {
      ...row,
      amount: totalVal > 0 ? totalVal : row.amount,
    };
  });

  return {
    form1Data: updatedForm1,
    form46Data: updatedForm46,
    form75Data: updatedForm75,
    form8Data: updatedForm8,
    form9Data: updatedForm9,
    form10Data: updatedForm10,
    form11Data: updatedForm11,
    form13Data: updatedForm13,
  };
}
