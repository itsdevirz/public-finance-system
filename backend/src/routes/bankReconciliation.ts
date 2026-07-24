import { Hono } from "hono";
import { ObjectId } from "mongodb";
import { getDb } from "../db/index.js";

const router = new Hono();

function serialize(doc: Record<string, unknown>) {
  return JSON.parse(
    JSON.stringify(doc, (_k, v) => (v instanceof ObjectId ? v.toHexString() : v))
  );
}

// ─── GET /api/bank-reconciliation/workspace ──────────────────────────────────
// بارگذاری همزمان اقلام دفترداری و تراکنش‌های صورت‌حساب بانک برای مغایرت‌گیری
router.get("/workspace", async (c) => {
  try {
    const account_number = c.req.query("account_number") || "";
    const batch_id = c.req.query("batch_id") || "";
    const fiscal_year = c.req.query("fiscal_year") || "";

    const db = getDb();

    // 1. دریافت اقلام دفاتر حسابداری (Ledger Lines) مرتبط با حساب بانک
    const docQuery: Record<string, unknown> = {};
    if (fiscal_year) docQuery.fiscal_year = fiscal_year;

    const docs = await db.collection("journal_documents").find(docQuery).toArray();

    // استخراج ردیف‌های متناظر با بانک از اسناد
    const ledgerItems: Array<Record<string, any>> = [];
    docs.forEach((doc) => {
      (doc.lines || []).forEach((line: any, idx: number) => {
        // فیلتر بر اساس کد حساب یا شماره حساب اگر مشخص شده باشد
        const accCode = String(line.account_code || "");
        if (
          !account_number ||
          accCode.includes(account_number) ||
          (line.account_name || "").includes(account_number) ||
          accCode.startsWith("1101") || accCode.startsWith("101") // حساب‌های بانکی عمومی
        ) {
          ledgerItems.push({
            id: `${doc._id}_${idx}`,
            doc_id: doc._id,
            doc_number: doc.document_number || doc.doc_number || "—",
            doc_date: doc.document_date || doc.doc_date || "—",
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
            description: line.description || doc.description || "—",
            status: line.reconciled ? "reconciled" : "unreconciled",
            match_id: line.match_id || null,
          });
        }
      });
    });

    // 2. دریافت تراکنش‌های صورت‌حساب بانک (Bank Statement)
    let bankItems: Array<Record<string, any>> = [];
    let selectedBatch: Record<string, any> | null = null;

    if (batch_id && ObjectId.isValid(batch_id)) {
      selectedBatch = await db.collection("bank_statements").findOne({ _id: new ObjectId(batch_id) });
      if (selectedBatch) {
        bankItems = (selectedBatch.transactions || []).map((t: any, idx: number) => ({
          id: `bank_${selectedBatch!._id}_${idx}`,
          row_num: t.row_num || idx + 1,
          date: t.date || "—",
          ref_number: t.ref_number || "—",
          debit: Number(t.debit || 0),
          credit: Number(t.credit || 0),
          balance: Number(t.balance || 0),
          description: t.description || "—",
          status: t.status || "unreconciled",
          match_id: t.match_id || null,
        }));
      }
    } else {
      // اگر بسته خاصی انتخاب نشده، آخرین بسته واردشده را دریافت کن
      const latestBatch = await db.collection("bank_statements").find().sort({ createdAt: -1 }).limit(1).toArray();
      if (latestBatch.length > 0) {
        selectedBatch = latestBatch[0];
        bankItems = (selectedBatch.transactions || []).map((t: any, idx: number) => ({
          id: `bank_${selectedBatch!._id}_${idx}`,
          row_num: t.row_num || idx + 1,
          date: t.date || "—",
          ref_number: t.ref_number || "—",
          debit: Number(t.debit || 0),
          credit: Number(t.credit || 0),
          balance: Number(t.balance || 0),
          description: t.description || "—",
          status: t.status || "unreconciled",
          match_id: t.match_id || null,
        }));
      }
    }

    return c.json({
      success: true,
      batch_info: selectedBatch ? serialize(selectedBatch as Record<string, unknown>) : null,
      ledger_items: ledgerItems,
      bank_items: bankItems,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── POST /api/bank-reconciliation/auto-match (تطبیق هوشمند خودکار) ──────────
router.post("/auto-match", async (c) => {
  try {
    const { ledger_items, bank_items } = await c.req.json();

    if (!Array.isArray(ledger_items) || !Array.isArray(bank_items)) {
      return c.json({ success: false, message: "لیست اقلام دفاتر و بانک الزامی است" }, 400);
    }

    const updatedLedger = [...ledger_items];
    const updatedBank = [...bank_items];
    let matchCount = 0;

    // الگوریتم تطبیق: مقایسه مبلغ بدهکار/بستانکار و شماره سند/مرجع
    for (let i = 0; i < updatedLedger.length; i++) {
      const l = updatedLedger[i];
      if (l.status === "reconciled") continue;

      for (let j = 0; j < updatedBank.length; j++) {
        const b = updatedBank[j];
        if (b.status === "reconciled") continue;

        // تطبیق: بدهکار دفتر با بدهکار بانک (یا بستانکار با بستانکار) و مبلغ یکسان غیرصفر
        const debitMatch = l.debit > 0 && l.debit === b.debit;
        const creditMatch = l.credit > 0 && l.credit === b.credit;

        // تطبیق شماره پیگیری یا شماره سند (در صورت وجود)
        const refMatch =
          String(l.doc_number).trim() === String(b.ref_number).trim() ||
          (b.description && b.description.includes(String(l.doc_number)));

        if ((debitMatch || creditMatch) && (refMatch || l.debit === b.debit && l.credit === b.credit)) {
          const matchId = `MATCH_${Date.now()}_${matchCount + 1}`;
          updatedLedger[i] = { ...l, status: "reconciled", match_id: matchId };
          updatedBank[j] = { ...b, status: "reconciled", match_id: matchId };
          matchCount++;
          break;
        }
      }
    }

    return c.json({
      success: true,
      matched_count: matchCount,
      ledger_items: updatedLedger,
      bank_items: updatedBank,
      message: `${matchCount} تراکنش همسان به صورت خودکار تطبیق داده شدند`,
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

// ─── GET /api/bank-reconciliation/statement (صورت مغایرت بانکی ۴ بخشی) ────────
router.get("/statement", async (c) => {
  try {
    const batch_id = c.req.query("batch_id") || "";
    const db = getDb();

    let bankEndingBalance = 0;
    if (batch_id && ObjectId.isValid(batch_id)) {
      const batch = await db.collection("bank_statements").findOne({ _id: new ObjectId(batch_id) });
      if (batch) bankEndingBalance = Number(batch.ending_balance || 0);
    }

    // استخراج مانده دفتر و اقلام باز
    const docs = await db.collection("journal_documents").toArray();
    let ledgerDebit = 0;
    let ledgerCredit = 0;
    const pendingChecks: any[] = [];
    const transitFunds: any[] = [];

    docs.forEach((doc) => {
      (doc.lines || []).forEach((line: any) => {
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        ledgerDebit += debit;
        ledgerCredit += credit;

        // اقلام باز غیر مغایرت‌گیری شده
        if (!line.reconciled) {
          if (credit > 0) {
            pendingChecks.push({
              doc_number: doc.document_number || doc.doc_number || "—",
              date: doc.document_date || doc.doc_date || "—",
              amount: credit,
              description: line.description || "چک صادرشده معوق",
            });
          } else if (debit > 0) {
            transitFunds.push({
              doc_number: doc.document_number || doc.doc_number || "—",
              date: doc.document_date || doc.doc_date || "—",
              amount: debit,
              description: line.description || "وجوه بین‌راهی ثبت شده",
            });
          }
        }
      });
    });

    const ledgerEndingBalance = ledgerDebit - ledgerCredit;
    const totalPendingChecks = pendingChecks.reduce((sum, c) => sum + c.amount, 0);
    const totalTransitFunds = transitFunds.reduce((sum, f) => sum + f.amount, 0);

    const calculatedBankBalance = ledgerEndingBalance + totalPendingChecks - totalTransitFunds;
    const discrepancy = Math.abs(bankEndingBalance - calculatedBankBalance);

    return c.json({
      success: true,
      statement: {
        ledger_ending_balance: ledgerEndingBalance,
        pending_checks: pendingChecks,
        total_pending_checks: totalPendingChecks,
        transit_funds: transitFunds,
        total_transit_funds: totalTransitFunds,
        bank_ending_balance: bankEndingBalance,
        calculated_bank_balance: calculatedBankBalance,
        discrepancy,
        is_balanced: discrepancy === 0,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
});

export default router;
