import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { usePersons } from "@/hooks/usePersons";
import { Users, AlertCircle, Loader2 } from "lucide-react";

/**
 * فیلد انتخاب شخص برای الزامات سناما (ردیف ۲۱ — NomineeCode).
 * اشخاص را از API می‌گیرد و به صورت dropdown نمایش می‌دهد.
 * اگر هیچ شخصی ثبت نشده باشد، پیام راهنما و لینک به صفحه تعریف اشخاص نشان می‌دهد.
 */
export function PersonSanamaField({ value, onChange, labelCls = "", required = true }) {
  const { options, loading, error } = usePersons();
  const navigate = useNavigate();

  const label = (
    <Label className={`text-[11px] font-semibold text-foreground/80 flex items-center gap-1 ${labelCls}`}>
      {required && <span className="text-rose-500">*</span>}
      <Users className="h-3 w-3 text-primary/70" />
      اشخاص (NomineeCode)
    </Label>
  );

  if (loading) {
    return (
      <div className="space-y-1">
        {label}
        <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-input bg-background/60 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          در حال بارگیری اشخاص...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-1">
        {label}
        <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="space-y-1">
        {label}
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="text-xs text-amber-800 font-medium">
              هیچ شخصی ثبت نشده — ابتدا باید یک شخص تعریف شود
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate("/basic-info/definitions/persons")}
            className="shrink-0 text-[11px] font-semibold text-primary underline underline-offset-2 hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            تعریف شخص
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label}
      <SearchableSelect
        value={value ?? ""}
        onChange={(v) => onChange(v || "")}
        options={options}
        placeholder="انتخاب شخص..."
        searchable
      />
    </div>
  );
}
