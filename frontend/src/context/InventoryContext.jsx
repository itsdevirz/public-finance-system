import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAssets } from "@/context/AssetContext";
import api from "@/api";

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const { user } = useAuth();
  const { assets } = useAssets();

  // Dynamically pull consumables registered in Asset Management
  const consumables = useMemo(() => {
    return assets
      .filter((a) => a.assetType === "consumable" || a.assetType === "consumable-2")
      .map((a) => ({
        code: a.assetCode,
        name: a.assetName,
        group: a.assetGroup || "سایر",
        unit: a.unit || "عدد",
      }));
  }, [assets]);

  const [warehouses, setWarehouses] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load all data from backend
  const refreshAllData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [whRes, recRes, issRes, altRes] = await Promise.all([
        api.get("/api/inventory/warehouses"),
        api.get("/api/inventory/receipts"),
        api.get("/api/inventory/issues"),
        api.get("/api/inventory/alerts"),
      ]);

      if (whRes.data?.success) setWarehouses(whRes.data.data);
      if (recRes.data?.success) setReceipts(recRes.data.data);
      if (issRes.data?.success) setIssues(issRes.data.data);
      if (altRes.data?.success) setAlerts(altRes.data.data);
    } catch (err) {
      console.error("Error loading inventory data from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [user]);

  // Operations calling Hono Backend APIs
  const addReceipt = async (receipt) => {
    try {
      const res = await api.post("/api/inventory/receipts", receipt);
      if (res.data?.success) {
        setReceipts(prev => [...prev, res.data.data]);
        return res.data.data;
      }
    } catch (err) {
      console.error("Error adding receipt:", err);
    }
  };

  const updateReceipt = async (updated) => {
    try {
      const res = await api.put(`/api/inventory/receipts/${updated.id || updated._id}`, updated);
      if (res.data?.success) {
        setReceipts(prev => prev.map(r => ((r.id === updated.id || r._id === updated._id) ? { ...r, ...updated } : r)));
      }
    } catch (err) {
      console.error("Error updating receipt:", err);
    }
  };

  const deleteReceipt = async (id) => {
    try {
      const res = await api.delete(`/api/inventory/receipts/${id}`);
      if (res.data?.success) {
        setReceipts(prev => prev.filter(r => r.id !== id && r._id !== id));
      }
    } catch (err) {
      console.error("Error deleting receipt:", err);
    }
  };

  const addIssue = async (issue) => {
    try {
      const res = await api.post("/api/inventory/issues", issue);
      if (res.data?.success) {
        setIssues(prev => [...prev, res.data.data]);
        return res.data.data;
      }
    } catch (err) {
      console.error("Error adding issue:", err);
    }
  };

  const updateIssue = async (updated) => {
    try {
      const res = await api.put(`/api/inventory/issues/${updated.id || updated._id}`, updated);
      if (res.data?.success) {
        setIssues(prev => prev.map(i => ((i.id === updated.id || i._id === updated._id) ? { ...i, ...updated } : i)));
      }
    } catch (err) {
      console.error("Error updating issue:", err);
    }
  };

  const deleteIssue = async (id) => {
    try {
      const res = await api.delete(`/api/inventory/issues/${id}`);
      if (res.data?.success) {
        setIssues(prev => prev.filter(i => i.id !== id && i._id !== id));
      }
    } catch (err) {
      console.error("Error deleting issue:", err);
    }
  };

  const addAlert = async (alert) => {
    try {
      const res = await api.post("/api/inventory/alerts", alert);
      if (res.data?.success) {
        setAlerts(prev => [...prev, res.data.data]);
        return res.data.data;
      }
    } catch (err) {
      console.error("Error adding alert:", err);
    }
  };

  const updateAlert = async (updated) => {
    try {
      const res = await api.put(`/api/inventory/alerts/${updated.id || updated._id}`, updated);
      if (res.data?.success) {
        setAlerts(prev => prev.map(a => ((a.id === updated.id || a._id === updated._id) ? { ...a, ...updated } : a)));
      }
    } catch (err) {
      console.error("Error updating alert:", err);
    }
  };

  const deleteAlert = async (id) => {
    try {
      const res = await api.delete(`/api/inventory/alerts/${id}`);
      if (res.data?.success) {
        setAlerts(prev => prev.filter(a => a.id !== id && a._id !== id));
      }
    } catch (err) {
      console.error("Error deleting alert:", err);
    }
  };

  // Helper to calculate current stock balance for all items/warehouses
  const getStockBalances = (filters = {}) => {
    const balances = {};

    // Initialize balances for all consumables
    consumables.forEach((item) => {
      warehouses.forEach((wh) => {
        balances[`${item.code}_${wh.id}`] = {
          itemCode: item.code,
          itemName: item.name,
          group: item.group,
          unit: item.unit,
          warehouseId: wh.id,
          warehouseName: wh.name,
          openingStock: 0,
          inQty: 0,
          outQty: 0,
          currentQty: 0,
          reservedQty: 0,
          usableQty: 0,
        };
      });
    });

    // Sum receipts
    receipts.forEach((rec) => {
      if (rec.status !== "confirmed") return;
      rec.items.forEach((it) => {
        const key = `${it.assetCode}_${rec.warehouseId}`;
        if (!balances[key]) {
          balances[key] = {
            itemCode: it.assetCode,
            itemName: it.assetName,
            group: it.assetGroup || "سایر",
            unit: it.unit || "عدد",
            warehouseId: rec.warehouseId,
            warehouseName: warehouses.find(w => w.id === rec.warehouseId)?.name || rec.warehouseId,
            openingStock: 0,
            inQty: 0,
            outQty: 0,
            currentQty: 0,
            reservedQty: 0,
            usableQty: 0,
          };
        }
        balances[key].inQty += Number(it.quantity || 0);
      });
    });

    // Subtract issues
    issues.forEach((iss) => {
      if (iss.status !== "confirmed") return;
      iss.items.forEach((it) => {
        const key = `${it.assetCode}_${iss.warehouseId}`;
        if (!balances[key]) {
          balances[key] = {
            itemCode: it.assetCode,
            itemName: it.assetName,
            group: "سایر",
            unit: it.unit || "عدد",
            warehouseId: iss.warehouseId,
            warehouseName: warehouses.find(w => w.id === iss.warehouseId)?.name || iss.warehouseId,
            openingStock: 0,
            inQty: 0,
            outQty: 0,
            currentQty: 0,
            reservedQty: 0,
            usableQty: 0,
          };
        }
        balances[key].outQty += Number(it.quantityApproved || 0);
      });
    });

    // Sum up draft issues as reservedQty
    issues.forEach((iss) => {
      if (iss.status !== "draft") return;
      iss.items.forEach((it) => {
        const key = `${it.assetCode}_${iss.warehouseId}`;
        if (balances[key]) {
          balances[key].reservedQty += Number(it.quantityRequested || 0);
        }
      });
    });

    // Compute final properties
    Object.keys(balances).forEach((key) => {
      const b = balances[key];
      b.currentQty = b.openingStock + b.inQty - b.outQty;
      b.usableQty = Math.max(0, b.currentQty - b.reservedQty);
    });

    // Filter results
    let result = Object.values(balances);

    if (filters.warehouseId && filters.warehouseId !== "all") {
      result = result.filter((b) => b.warehouseId === filters.warehouseId);
    }
    if (filters.group && filters.group !== "all") {
      result = result.filter((b) => b.group === filters.group);
    }
    if (filters.itemCode && filters.itemCode !== "all") {
      result = result.filter((b) => b.itemCode === filters.itemCode);
    }

    return result;
  };

  const getSingleItemBalance = (itemCode, warehouseId) => {
    const list = getStockBalances({ itemCode, warehouseId });
    if (list.length > 0) return list[0];
    return { currentQty: 0, usableQty: 0 };
  };

  // Helper for Kardex Card data
  const getItemKardex = (itemCode, warehouseId) => {
    const kardex = [];
    let runningBalance = 0;

    // Collect receipts
    receipts.forEach((rec) => {
      if (rec.status !== "confirmed") return;
      if (rec.warehouseId !== warehouseId) return;
      rec.items.forEach((it) => {
        if (it.assetCode === itemCode) {
          kardex.push({
            date: rec.receiptDate,
            opType: "رسید",
            opNo: rec.receiptNo,
            inQty: Number(it.quantity),
            outQty: 0,
            notes: rec.notes || `ورود کالا بابت ${rec.receiptType === "purchase" ? "خرید" : rec.receiptType}`,
          });
        }
      });
    });

    // Collect issues
    issues.forEach((iss) => {
      if (iss.status !== "confirmed") return;
      if (iss.warehouseId !== warehouseId) return;
      iss.items.forEach((it) => {
        if (it.assetCode === itemCode) {
          kardex.push({
            date: iss.issueDate,
            opType: "حواله",
            opNo: iss.issueNo,
            inQty: 0,
            outQty: Number(it.quantityApproved),
            notes: iss.notes || `تحویل به ${iss.receiverName}`,
          });
        }
      });
    });

    // Sort chronologically
    kardex.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    kardex.forEach((row) => {
      runningBalance += row.inQty - row.outQty;
      row.balance = runningBalance;
    });

    return kardex;
  };

  return (
    <InventoryContext.Provider
      value={{
        warehouses,
        consumables,
        receipts,
        issues,
        alerts,
        loading,
        refreshAllData,
        addReceipt,
        updateReceipt,
        deleteReceipt,
        addIssue,
        updateIssue,
        deleteIssue,
        addAlert,
        updateAlert,
        deleteAlert,
        getStockBalances,
        getSingleItemBalance,
        getItemKardex,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used within InventoryProvider");
  return ctx;
}
