import { useEffect, useState } from "react";
import api from "../api";

export default function Checks() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/checks/")
      .then((res) => setData(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>چک‌ها</h2>
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : data.length === 0 ? (
        <p>چکی وجود ندارد.</p>
      ) : (
        data.map((check) => (
          <p key={check._id}>{check.check_number} — {check.amount} ریال — {check.status}</p>
        ))
      )}
    </div>
  );
}
