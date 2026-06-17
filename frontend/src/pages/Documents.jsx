import { useEffect, useState } from "react";
import api from "../api";

export default function Documents() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/documents/")
      .then((res) => setData(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>اسناد</h2>
      {loading ? (
        <p>در حال بارگذاری...</p>
      ) : data.length === 0 ? (
        <p>سندی وجود ندارد.</p>
      ) : (
        data.map((doc) => (
          <p key={doc._id}>{doc.document_number} — {doc.document_type} — {doc.status}</p>
        ))
      )}
    </div>
  );
}
