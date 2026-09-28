import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "@/api";

const FiscalYearContext = createContext(null);

export function FiscalYearProvider({ children }) {
  const { user } = useAuth();
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedFiscalYear, setSelectedFiscalYearState] = useState(() => {
    return localStorage.getItem("activeFiscalYear") || "1405";
  });
  const [loading, setLoading] = useState(true);

  const fetchFiscalYears = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/fiscal-years");
      const list = res.data?.data || [];
      setFiscalYears(list);

      const savedYear = localStorage.getItem("activeFiscalYear");
      if (list.length > 0) {
        const sortedList = [...list].sort((a, b) => b.year - a.year);
        const exists = savedYear && sortedList.some(y => String(y.year) === String(savedYear));
        if (!exists && !savedYear) {
          const latest = String(sortedList[0].year);
          setSelectedFiscalYearState(latest);
          localStorage.setItem("activeFiscalYear", latest);
        }
      }
    } catch (err) {
      console.error("Error fetching fiscal years:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFiscalYears();
    } else {
      setLoading(false);
    }
  }, [fetchFiscalYears, user]);

  const setSelectedFiscalYear = (yearStr) => {
    const strVal = String(yearStr);
    setSelectedFiscalYearState(strVal);
    localStorage.setItem("activeFiscalYear", strVal);
  };

  return (
    <FiscalYearContext.Provider
      value={{
        fiscalYears,
        selectedFiscalYear,
        setSelectedFiscalYear,
        refreshFiscalYears: fetchFiscalYears,
        loading
      }}
    >
      {children}
    </FiscalYearContext.Provider>
  );
}

export function useFiscalYear() {
  const ctx = useContext(FiscalYearContext);
  if (!ctx) {
    return {
      fiscalYears: [{ year: 1405, title: "سال مالی ۱۴۰۵" }, { year: 1404, title: "سال مالی ۱۴۰۴" }],
      selectedFiscalYear: localStorage.getItem("activeFiscalYear") || "1405",
      setSelectedFiscalYear: (y) => localStorage.setItem("activeFiscalYear", String(y)),
      refreshFiscalYears: () => {},
      loading: false
    };
  }
  return ctx;
}
