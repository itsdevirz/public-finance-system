import { useState, useEffect } from "react";
import api from "@/api";

/**
 * Hook: لیست اشخاص را از API لود می‌کند و به فرمت option برای SearchableSelect برمی‌گرداند.
 * هر option: { value: nomineeCode, label: "عنوان — NomineeCode" }
 */
export function usePersons() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get("/api/persons")
      .then((res) => {
        if (!mounted) return;
        if (res.data?.success) {
          setPersons(res.data.data || []);
        } else {
          setError("خطا در دریافت اشخاص");
        }
      })
      .catch(() => {
        if (mounted) setError("خطا در ارتباط با سرور");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // ساخت options برای SearchableSelect
  const options = persons.map((p) => ({
    value: p.nomineeCode || p._id,
    label: `${p.title || `${p.firstName || ""} ${p.lastName || ""}`.trim()} — ${p.nomineeCode || ""}`,
    person: p,
  }));

  return { persons, options, loading, error };
}
