import { useEffect, useState } from "react";
import api from "../api";

export default function Ledger() {
  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/ledger/"),
      api.get("/api/ledger/balance"),
    ])
      .then(([ledgerRes, balanceRes]) => {
        setData(ledgerRes.data.data ?? []);
        setBalance(balanceRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>دفتر کل</h2>
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : (
        <>
          {balance && (
            <div style={{ marginBottom: 16, padding: "10px 16px", background: "#f0f4f8", borderRadius: 6 }}>
              <span>مجموع بدهکار: {balance.total_debit} ریال</span>
              {" | "}
              <span>مجموع بستانکار: {balance.total_credit} ریال</span>
            </div>
          )}
          {data.length === 0 ? (
            <p>رکوردی وجود ندارد.</p>
          ) : (
            data.map((row, i) => (
              <p key={i}>{row.doc_number} — {row.account_code} — بد: {row.debit} — بس: {row.credit}</p>
            ))
          )}
        </>
      )}
    </div>
  );
}
