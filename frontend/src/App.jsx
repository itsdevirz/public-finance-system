import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Landmark, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import { AssetProvider } from "./context/AssetContext";
import { InventoryProvider } from "./context/InventoryContext";
import PrivateRoute from "./components/PrivateRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";
import Dashboard from "./pages/Dashboard";
import { buildLayoutRoutes } from "./config/appRoutes";
import { Button } from "./components/ui/button";

const GuaranteeContractForm = lazy(() => import("./modules/treasury/pages/GuaranteeContractForm"));
const DepositManualForm = lazy(() => import("./modules/treasury/pages/DepositManualForm"));

const layoutRoutes = buildLayoutRoutes(Dashboard);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">خطایی در بارگذاری این صفحه رخ داده است</h2>
          <p className="text-xs text-muted-foreground mt-2 max-w-md">
            {this.state.error?.message || "مشکلی در پردازش اطلاعات رخ داد."}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="mt-5 text-xs font-bold gap-2"
          >
            <RefreshCw className="h-4 w-4" /> بازنشانی و تلاش مجدد
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 p-8 animate-in fade-in duration-300">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner border border-primary/20 backdrop-blur-sm">
        <Landmark className="h-10 w-10 animate-pulse text-primary" />
        <div className="absolute inset-0 rounded-2xl border-2 border-accent/40 animate-ping opacity-25" />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 bg-background/80 px-4 py-2 rounded-full border shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>در حال بارگذاری اطلاعات سامانه...</span>
      </div>
    </div>
  );
}

function AppRoutes({ routes }) {
  return (
    <Routes>
      {routes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
      <Route path="/guarantees/register/contract" element={<GuaranteeContractForm />} />
      <Route path="/deposits/manual-form" element={<DepositManualForm />} />
      <Route path="*" element={<Placeholder label="صفحه یافت نشد" />} />
    </Routes>
  );
}

function Layout() {
  return (
    <AssetProvider>
      <InventoryProvider>
        <div className="flex min-h-screen bg-background selection:bg-accent/20 selection:text-primary">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-2 md:px-4 transition-all duration-300">
            <Suspense fallback={<PageLoader />}>
              <AppRoutes routes={layoutRoutes} />
            </Suspense>
          </main>
        </div>
      </InventoryProvider>
    </AssetProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
