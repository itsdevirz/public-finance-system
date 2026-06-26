import { createContext, useContext, useState } from "react";

// ─── داده نمونه اولیه اموال ثبت‌شده ─────────────────────────────────────────
const INITIAL_ASSETS = [
  {
    id: 1, assetCode: "A001", assetName: "لپ‌تاپ Dell Latitude 5520",
    assetGroup: "تجهیزات رایانه‌ای", assetSubgroup: "رایانه قابل‌حمل",
    assetType: "non-consumable", assetNature: "movable",
    brand: "Dell", model: "Latitude 5520", serialNumber: "DL-5520-001",
    purchaseDate: "1402/05/10", purchaseAmount: "85000000",
    quantity: "1", unit: "unit", supplier: "شرکت تجهیزات اداری ایران",
    status: "active",
  },
  {
    id: 2, assetCode: "A002", assetName: "پرینتر HP LaserJet Pro",
    assetGroup: "تجهیزات اداری", assetSubgroup: "چاپگر",
    assetType: "non-consumable", assetNature: "movable",
    brand: "HP", model: "LaserJet Pro M404", serialNumber: "HP-LJ-002",
    purchaseDate: "1402/08/20", purchaseAmount: "22000000",
    quantity: "1", unit: "unit", supplier: "شرکت تجهیزات اداری ایران",
    status: "active",
  },
  {
    id: 3, assetCode: "A003", assetName: "میز کار اداری",
    assetGroup: "اثاثیه و مبلمان", assetSubgroup: "میز",
    assetType: "non-consumable", assetNature: "movable",
    brand: "", model: "", serialNumber: "",
    purchaseDate: "1401/03/15", purchaseAmount: "8500000",
    quantity: "1", unit: "unit", supplier: "سازمان اموال دولتی",
    status: "active",
  },
  {
    id: 4, assetCode: "A004", assetName: "صندلی مدیریتی",
    assetGroup: "اثاثیه و مبلمان", assetSubgroup: "صندلی",
    assetType: "non-consumable", assetNature: "movable",
    brand: "", model: "", serialNumber: "",
    purchaseDate: "1401/03/15", purchaseAmount: "6200000",
    quantity: "1", unit: "unit", supplier: "سازمان اموال دولتی",
    status: "active",
  },
  {
    id: 5, assetCode: "A005", assetName: "دوربین مداربسته IP",
    assetGroup: "تجهیزات امنیتی", assetSubgroup: "دوربین",
    assetType: "non-consumable", assetNature: "movable",
    brand: "Hikvision", model: "DS-2CD2143G2-I", serialNumber: "HK-2CD-005",
    purchaseDate: "1402/11/01", purchaseAmount: "15000000",
    quantity: "1", unit: "unit", supplier: "شرکت تجهیزات اداری ایران",
    status: "active",
  },
  {
    id: 6, assetCode: "A006", assetName: "پروژکتور Epson EB-X51",
    assetGroup: "تجهیزات اداری", assetSubgroup: "پروژکتور",
    assetType: "non-consumable", assetNature: "movable",
    brand: "Epson", model: "EB-X51", serialNumber: "EP-X51-006",
    purchaseDate: "1403/01/05", purchaseAmount: "34000000",
    quantity: "1", unit: "unit", supplier: "شرکت تجهیزات اداری ایران",
    status: "active",
  },
];

const AssetContext = createContext(null);

export function AssetProvider({ children }) {
  const [assets, setAssets] = useState(INITIAL_ASSETS);

  function addAsset(asset) {
    setAssets((prev) => [...prev, { ...asset, id: Date.now() }]);
  }

  function updateAsset(asset) {
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? asset : a)));
  }

  function deleteAsset(id) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, deleteAsset }}>
      {children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const ctx = useContext(AssetContext);
  if (!ctx) throw new Error("useAssets must be used within AssetProvider");
  return ctx;
}
