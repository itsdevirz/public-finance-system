import { useEffect, useState } from "react";
import api from "../api";

export default function Credits() {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/credits/agreements")
      .then((res) => setAgreements(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>اعتبارات</h2>
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : agreements.length === 0 ? (
        <p>موافقتنامه‌ای وجود ندارد.</p>
      ) : (
        agreements.map((a) => (
          <p key={a._id}>{a.agreement_number} — {a.title} — {a.total_amount} ریال</p>
        ))
      )}
    </div>
  );
}
