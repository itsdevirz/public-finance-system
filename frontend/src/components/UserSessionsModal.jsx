import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Laptop, LogOut, RefreshCw, X, ShieldCheck, Clock, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function UserSessionsModal({ isOpen, onClose }) {
  const { user: currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/security/active-sessions");
      if (res.data?.success) {
        setSessions(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "خطا در دریافت لیست نشست‌های فعال کاربران");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
      setMessage(null);
    }
  }, [isOpen]);

  const handleRevokeSession = async (sessionId, token, username) => {
    setRevokingId(sessionId);
    setMessage(null);
    setError(null);
    try {
      const res = await api.post("/api/security/revoke-session", { sessionId, token });
      if (res.data?.success) {
        setMessage(`نشست کاربر '${username || "منتخب"}' با موفقیت باطل و خاتمه یافت.`);
        fetchSessions();
      }
    } catch (err) {
      setError(err.response?.data?.message || "خطا در ابطال نشست کاربر");
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  const currentToken = sessionStorage.getItem("token");

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                مدیریت نشست‌های فعال کاربران (Active Sessions)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مشاهده تمام کاربران آنلاین و ابطال بلافصل نشست‌های فعال سایر پرسنل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action bar & Stats */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3" dir="rtl">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-1 font-bold">
              تعداد کل نشست‌های فعال: {sessions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              disabled={loading}
              className="h-8 text-xs gap-1.5 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              بروزرسانی لیست
            </Button>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2" dir="rtl">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2" dir="rtl">
            <LogOut className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Table Content */}
        <div className="p-4 overflow-y-auto flex-1" dir="rtl">
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b">
                <tr>
                  <th className="p-3">کاربر و نقش دسترسی</th>
                  <th className="p-3">دستگاه و مرورگر</th>
                  <th className="p-3">آدرس IP</th>
                  <th className="p-3">آخرین فعالیت</th>
                  <th className="p-3 text-center">عملیات نشست</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                      {loading ? "در حال دریافت لیست نشست‌های فعال..." : "هیچ نشست فعالی در سامانه یافت نشد."}
                    </td>
                  </tr>
                ) : (
                  sessions.map((session, idx) => {
                    const isSelf = session.isCurrent ||
                      (session.token && session.token === currentToken) ||
                      (session.username && currentUser?.username && session.username.toLowerCase() === currentUser.username.toLowerCase());

                    return (
                      <tr key={session._id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {session.username?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                {session.username}
                                {isSelf && (
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0 border-none font-semibold">
                                    نشست شما
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-primary font-semibold">
                                {session.role || "کاربر سیستم"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                            <Monitor className="h-4 w-4 text-blue-500 shrink-0" />
                            <div>
                              <div className="font-bold">
                                {session.browserName || session.userAgent || "مرورگر"} ({session.osName || "ویندوز"})
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ایجاد شده: {session.createdAt ? new Date(session.createdAt).toLocaleString("fa-IR") : "نامشخص"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono dir-ltr text-right text-slate-600 dark:text-slate-400 font-semibold">
                          {session.ip || "127.0.0.1"}
                        </td>
                        <td className="p-3 text-slate-500 font-mono">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>
                              {session.lastActivity ? new Date(session.lastActivity).toLocaleTimeString("fa-IR") : "هم‌اکنون"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {isSelf ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] px-2.5 py-1 font-bold">
                              نشست فعلی شما (استفاده از گزینه خروج)
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={revokingId === session._id}
                              onClick={() => handleRevokeSession(session._id, session.token, session.username)}
                              className="h-7 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 font-bold gap-1 cursor-pointer"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              خاتمه نشست
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end" dir="rtl">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs px-5 font-bold cursor-pointer">
            بستن
          </Button>
        </div>
      </div>
    </div>
  );
}
