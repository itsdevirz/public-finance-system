import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";

const AssetContext = createContext(null);

export function AssetProvider({ children }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom configurations states
  const [groups, setGroups] = useState([]);
  const [subgroups, setSubgroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [natures, setNatures] = useState([]);
  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Warehouse states
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeContracts, setEmployeeContracts] = useState([]);
  const [employeeDecrees, setEmployeeDecrees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [employeeMissions, setEmployeeMissions] = useState([]);
  const [payrollCalculations, setPayrollCalculations] = useState([]);
  const [audits, setAudits] = useState([]);
  const [insuranceSettings, setInsuranceSettings] = useState([]);
  const [employeeLoans, setEmployeeLoans] = useState([]);
  const [employeeAdvances, setEmployeeAdvances] = useState([]);

  const refreshAssets = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const res = await api.get("/api/inventory/assets");
      if (res.data?.success) {
        setAssets(res.data.data);
      }
    } catch (err) {
      console.error("Error loading assets from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllConfigs = async () => {
    if (!user) return;
    try {
      const names = [
        "groups", "subgroups", "types", "natures", "units", "locations",
        "suppliers", "items", "requests", "transfers", "warehouses", "receipts", "issues",
        "employees", "employee_contracts", "employee_decrees", "attendance_records", "employee_leaves", "employee_missions", "payroll_calculations", "insurance_settings", "employee_loans", "employee_advances", "audits"
      ];
      const setters = [
        setGroups, setSubgroups, setTypes, setNatures, setUnits, setLocations,
        setSuppliers, setItems, setRequests, setTransfers, setWarehouses, setReceipts, setIssues,
        setEmployees, setEmployeeContracts, setEmployeeDecrees, setAttendanceRecords, setEmployeeLeaves, setEmployeeMissions, setPayrollCalculations, setInsuranceSettings, setEmployeeLoans, setEmployeeAdvances, setAudits
      ];
      await Promise.all(names.map(async (name, idx) => {
        const res = await api.get(`/api/inventory/${name}`);
        if (res.data?.success) {
          setters[idx](res.data.data);
        }
      }));
    } catch (err) {
      console.error("Error loading configs from backend:", err);
    }
  };

  useEffect(() => {
    refreshAssets();
    refreshAllConfigs();
  }, [user]);

  async function addAsset(asset) {
    try {
      const payload = { ...asset, id: asset.id || Date.now() };
      const res = await api.post("/api/inventory/assets", payload);
      if (res.data?.success) {
        setAssets((prev) => [...prev, res.data.data]);
        return res.data.data;
      }
    } catch (err) {
      console.error("Error saving asset to backend:", err);
    }
  }

  async function updateAsset(asset) {
    try {
      const res = await api.put(`/api/inventory/assets/${asset.id || asset._id}`, asset);
      if (res.data?.success) {
        setAssets((prev) => prev.map((a) => (a.id === asset.id || a._id === asset._id ? { ...a, ...asset } : a)));
      }
    } catch (err) {
      console.error("Error updating asset on backend:", err);
    }
  }

  async function deleteAsset(id) {
    try {
      const res = await api.delete(`/api/inventory/assets/${id}`);
      if (res.data?.success) {
        setAssets((prev) => prev.filter((a) => a.id !== id && a._id !== id));
      }
    } catch (err) {
      console.error("Error deleting asset on backend:", err);
    }
  }

  // Generic config CRUD helpers
  async function addConfig(name, item) {
    try {
      const res = await api.post(`/api/inventory/${name}`, item);
      if (res.data?.success) {
        await refreshAllConfigs();
        return res.data.data;
      }
    } catch (err) {
      console.error(`Error saving config ${name}:`, err);
    }
  }

  async function updateConfig(name, item) {
    try {
      const id = item.id || item._id;
      const res = await api.put(`/api/inventory/${name}/${id}`, item);
      if (res.data?.success) {
        await refreshAllConfigs();
        return res.data.data;
      }
    } catch (err) {
      console.error(`Error updating config ${name}:`, err);
    }
  }

  async function deleteConfig(name, id) {
    try {
      const res = await api.delete(`/api/inventory/${name}/${id}`);
      if (res.data?.success) {
        await refreshAllConfigs();
        return true;
      }
    } catch (err) {
      console.error(`Error deleting config ${name}:`, err);
    }
  }

  return (
    <AssetContext.Provider value={{
      assets, addAsset, updateAsset, deleteAsset, loading, refreshAssets,
      groups, subgroups, types, natures, units, locations, suppliers,
      items, requests, transfers, warehouses, receipts, issues, employees, employeeContracts, employeeDecrees, attendanceRecords, employeeLeaves, employeeMissions, payrollCalculations, insuranceSettings, employeeLoans, employeeAdvances, audits,
      addConfig, updateConfig, deleteConfig, refreshAllConfigs
    }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) {
    return {
      assets: [],
      refreshAssets: async () => {},
      groups: [], subgroups: [], types: [], natures: [], units: [], locations: [], suppliers: [],
      items: [], requests: [], transfers: [], warehouses: [], receipts: [], issues: [], employees: [],
      employeeContracts: [], employeeDecrees: [], attendanceRecords: [], employeeLeaves: [], employeeMissions: [],
      payrollCalculations: [], insuranceSettings: [], employeeLoans: [], employeeAdvances: [], audits: [],
      addConfig: async () => {}, updateConfig: async () => {}, deleteConfig: async () => {}, refreshAllConfigs: async () => {}
    };
  }
  return ctx;
}
