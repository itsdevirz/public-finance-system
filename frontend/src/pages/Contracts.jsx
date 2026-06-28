import { useEffect, useState } from "react";
import api from "../api";

export default function Contracts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/contracts/")
      .then((res) => setData(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>قراردادها</h2>
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : data.length === 0 ? (
        <p>قراردادی وجود ندارد.</p>
      ) : (
        data.map((c) => (
          <p key={c._id}>{c.contract_number} — {c.title} — {c.status}</p>
        ))
      )}
    </div>
  );
}
