import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message ?? "خطا در ورود. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-accent/30 to-background p-4">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-sidebar-primary/10 blur-3xl animate-float [animation-delay:2s]" />

      <Card className="relative w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-700 ease-smooth">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 hover:scale-110">
            <Landmark className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">سامانه جامع نظام مالی</CardTitle>
            <CardDescription>برای ادامه وارد شوید</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="animate-in fade-in slide-in-from-top-1 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive duration-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                disabled={loading}
                className="transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
                dir="ltr"
                className="text-left transition-all duration-300"
              />
            </div>

            <Button type="submit" className="mt-2 w-full rounded-xl" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  در حال ورود...
                </>
              ) : (
                "ورود"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
