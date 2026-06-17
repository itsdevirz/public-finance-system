import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Tahoma" }}>
        <p>در حال بارگذاری...</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
