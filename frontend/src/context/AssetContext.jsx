import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/api";

const AssetContext = createContext(null);

export function AssetProvider({ children }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    refreshAssets();
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

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset, loading, refreshAssets }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error("useAssets must be used within AssetProvider");
  return ctx;
}
