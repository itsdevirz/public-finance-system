import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Placeholder from "./pages/Placeholder";
import { PageShell, PageHeader } from "./components/layout/PageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { LayoutDashboard, Sparkles } from "lucide-react";
import { buildLayoutRoutes } from "./config/appRoutes";

function HomePage() {
  const { user } = useAuth();

  return (
    <PageShell>
      <PageHeader
        title={`خوش آمدید، ${user?.username}`}
        description="سامانه جامع نظام مالی بخش عمومی"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
        <Card className="group">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">داشبورد</CardTitle>
            <CardDescription>از منوی کناری بخش مورد نظر را انتخاب کنید</CardDescription>
          </CardHeader>
        </Card>
        <Card className="group">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition-all duration-300 group-hover:scale-110">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">رابط کاربری جدید</CardTitle>
            <CardDescription>طراحی مدرن با shadcn/ui و انیمیشن‌های روان</CardDescription>
          </CardHeader>
        </Card>
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">راهنمای سریع</CardTitle>
            <CardDescription>برای شروع، از بخش «اطلاعات پایه» یا «تنظیم اسناد» استفاده کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              تمام صفحات با کامپوننت‌های shadcn، گوشه‌های گرد و انیمیشن‌های نرم طراحی شده‌اند.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

const layoutRoutes = buildLayoutRoutes(HomePage);

function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-muted/20 to-background">
        <Routes>
          {layoutRoutes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
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
