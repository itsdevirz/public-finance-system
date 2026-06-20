import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";
import Dashboard from "./pages/Dashboard";
import GuaranteeContractForm from "./pages/GuaranteeContractForm";
import DepositManualForm from "./pages/DepositManualForm";
import { buildLayoutRoutes } from "./config/appRoutes";

const layoutRoutes = buildLayoutRoutes(Dashboard);

function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-muted/20 to-background">
        <Routes>
          {layoutRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
          <Route path="/guarantees/register/contract" element={<GuaranteeContractForm />} />
          <Route path="/deposits/manual-form" element={<DepositManualForm />} />
          <Route path="*" element={<Placeholder label="صفحه یافت نشد" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
