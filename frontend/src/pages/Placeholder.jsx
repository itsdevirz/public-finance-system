import { useLocation } from "react-router-dom";

// نام صفحه رو از آخرین بخش URL میخونه
function titleFromPath(pathname) {
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return last.replace(/-/g, " ");
}

export default function Placeholder({ label }) {
  const { pathname } = useLocation();
  const title = label ?? titleFromPath(pathname);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: 300, color: "#8899aa",
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
      <p style={{ fontSize: 15 }}>{title}</p>
      <p style={{ fontSize: 12 }}>این بخش در حال توسعه است</p>
    </div>
  );
}
