import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-destructive/10 text-destructive shadow-lg border border-destructive/20 backdrop-blur-md">
        <FileQuestion className="h-12 w-12 text-destructive animate-bounce" />
        <div className="absolute -inset-1 rounded-3xl border border-destructive/30 animate-pulse opacity-50" />
      </div>

      <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive mb-3 border border-destructive/20">
        خطای ۴۰۴ - پیدا نشد
      </span>

      <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-2">
        آدرس درخواستی وجود ندارد
      </h1>

      <p className="text-sm text-muted-foreground max-w-md mb-8 leading-relaxed">
        صفحه یا آدرسی که وارد کرده‌اید یافت نشد. ممکن است آدرس را اشتباه تایپ کرده باشید یا این صفحه حذف و جابه‌جا شده باشد.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => navigate("/")}
          className="gap-2 px-5 py-2.5 font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Home className="h-4 w-4" />
          بازگشت به داشبورد اصلی
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2 px-5 py-2.5 font-semibold"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به صفحه قبل
        </Button>
      </div>
    </div>
  );
}
