import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import api from "@/api";

const DepartmentContext = createContext(null);

export function DepartmentProvider({ children }) {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentIdState] = useState(() => {
    return localStorage.getItem("activeDepartmentId") || "";
  });
  const [loading, setLoading] = useState(true);

  const fetchDepartments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/departments");
      const list = res.data?.data || [];
      setDepartments(list);

      const savedDeptId = localStorage.getItem("activeDepartmentId");
      if (list.length > 0) {
        const exists = savedDeptId && list.some(d => String(d._id) === String(savedDeptId) || String(d.code) === String(savedDeptId));
        if (!exists) {
          // اگر پیدا نشد، اداره پیش‌فرض یا اولین اداره انتخاب شود
          const defaultDept = list.find(d => d.isDefault) || list[0];
          const newId = String(defaultDept._id || defaultDept.code);
          setSelectedDepartmentIdState(newId);
          localStorage.setItem("activeDepartmentId", newId);
        }
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDepartments();
    } else {
      setLoading(false);
    }
  }, [fetchDepartments, user]);

  const setSelectedDepartmentId = useCallback((deptId) => {
    const strVal = String(deptId || "");
    setSelectedDepartmentIdState(strVal);
    if (strVal) {
      localStorage.setItem("activeDepartmentId", strVal);
    } else {
      localStorage.removeItem("activeDepartmentId");
    }
  }, []);

  const selectedDepartment = useMemo(() => {
    if (!departments || departments.length === 0) return null;
    return departments.find(d => String(d._id) === String(selectedDepartmentId) || String(d.code) === String(selectedDepartmentId)) || departments[0] || null;
  }, [departments, selectedDepartmentId]);

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        selectedDepartmentId,
        selectedDepartment,
        setSelectedDepartmentId,
        refreshDepartments: fetchDepartments,
        loading,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  const ctx = useContext(DepartmentContext);
  if (!ctx) {
    return {
      departments: [{ _id: "default", code: "01", name: "اداره کل مرکزی", isDefault: true }],
      selectedDepartmentId: localStorage.getItem("activeDepartmentId") || "default",
      selectedDepartment: { _id: "default", code: "01", name: "اداره کل مرکزی", isDefault: true },
      setSelectedDepartmentId: (id) => localStorage.setItem("activeDepartmentId", String(id)),
      refreshDepartments: () => {},
      loading: false,
    };
  }
  return ctx;
}
