import { useMemo } from "react";
import { useApiCache } from "@/hooks/useApiCache";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function CreditCodeSanamaField({ value, onChange, inputCls, disabled = false, hasError = false }) {
  const { data, loading } = useApiCache("/api/credits/definitions");

  const options = useMemo(() => {
    if (!data?.data) return [];
    return data.data
      .filter((c) => c.expense?.programNumber || c.capital?.projectNumber)
      .map((c) => {
        const num = c.capital?.projectNumber || c.expense?.programNumber || "";
        const title = c.capital?.projectTitle || c.expense?.programTitle || "";
        const planTitle = c.capital?.projectPlanTitle || "";
        const isNotified = c.creditKind === "notified" || c.credit_kind === "notified" || c.kind === "notified";
        const kindLabel = isNotified ? "ابلاغی" : "مصوب";
        return {
          value: num,
          label: `${num}${title ? ` — ${title}` : ""}${planTitle ? ` / ${planTitle}` : ""} (${kindLabel})`,
        };
      })
      .filter((o) => o.value);
  }, [data]);

  const defaultInputCls = inputCls || "h-8 text-xs rounded-md border border-input bg-white px-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 w-full transition-all placeholder:text-muted-foreground/40";

  if (loading) {
    return (
      <div className="w-full min-w-0">
        <input
          type="text"
          inputMode="numeric"
          className={defaultInputCls}
          placeholder="در حال بارگیری..."
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          dir="ltr"
          disabled
        />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="w-full min-w-0">
        <input
          type="text"
          inputMode="numeric"
          className={`${defaultInputCls} ${disabled ? "bg-muted cursor-not-allowed opacity-60 text-muted-foreground" : ""} ${hasError ? "border-rose-500 ring-1 ring-rose-500/50" : ""}`}
          placeholder={disabled ? "غیرفعال" : "عدد وارد کنید..."}
          value={value ?? ""}
          onChange={(e) => !disabled && onChange(e.target.value.replace(/\D/g, ""))}
          dir="ltr"
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <SearchableSelect
        value={value ?? ""}
        onChange={(v) => onChange(v || "")}
        options={options}
        placeholder={disabled ? "غیرفعال" : "انتخاب از اعتبارهای تعریف‌شده..."}
        searchable
        disabled={disabled}
        className={hasError ? "border-rose-500 ring-1 ring-rose-500/50" : ""}
      />
    </div>
  );
}

export default CreditCodeSanamaField;
