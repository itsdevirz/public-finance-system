/**
 * useApiCache — hook ساده برای cache کردن API calls
 *
 * استفاده:
 *   const { data, loading } = useApiCache("/api/credits/definitions");
 *
 * - کش در حافظه مرورگر (module-level) نگه داشته می‌شود
 * - TTL قابل تنظیم (پیش‌فرض: 5 دقیقه)
 * - request های موازی یکسان dedup می‌شوند
 */

import { useState, useEffect, useRef } from "react";
import api from "@/api";

// Cache مشترک بین تمام نمونه‌های hook (module-level)
const _cache = new Map(); // url → { data, ts, promise }
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useApiCache(url, options = {}) {
  const { ttl = DEFAULT_TTL, enabled = true } = options;
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!url || !enabled) return;

    const entry = _cache.get(url);
    const now   = Date.now();

    // کش معتبر موجود است
    if (entry && entry.data && (now - entry.ts) < ttl) {
      setData(entry.data);
      return;
    }

    // request در حال اجرا است — از آن استفاده کن
    if (entry && entry.promise) {
      setLoading(true);
      entry.promise
        .then((d) => { if (mountedRef.current) { setData(d); setLoading(false); } })
        .catch((e) => { if (mountedRef.current) { setError(e); setLoading(false); } });
      return;
    }

    // request جدید
    setLoading(true);
    const promise = api.get(url).then((res) => res.data);
    _cache.set(url, { data: null, ts: now, promise });

    promise
      .then((d) => {
        _cache.set(url, { data: d, ts: Date.now(), promise: null });
        if (mountedRef.current) { setData(d); setLoading(false); }
      })
      .catch((e) => {
        _cache.delete(url);
        if (mountedRef.current) { setError(e); setLoading(false); }
      });
  }, [url, enabled, ttl]);

  return { data, loading, error };
}

/** پاک کردن کش یک URL مشخص */
export function invalidateCache(url) {
  _cache.delete(url);
}

/** پاک کردن کل کش */
export function clearAllCache() {
  _cache.clear();
}
