import { useMemo } from "react";
import { useApiCache } from "@/hooks/useApiCache";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function CreditCodeSanamaField({ value, onChange, inputCls }) {
  const { data, loading } = useApiCache("/api/credits/definitions");

  const options = useMemo(() => {
    if (!data?.data) return [];
    return data.data
      .filter((c) => c.expense?.programNumber || c.capital?.projectNumber)
      .map((c) => {
        const num  = c.capital?.projectNumber || c.expense?.programNumber || "";
        const type = c.creditType === "capital" ? "تملک دارایی" : "هزینه";
        return {
          value: num,
          label: `${num}${c.capital?.projectTitle ? ` — ${c.capital.projectTitle}` : ""}${c.capital?.projectPlanTitle ? ` / ${c.capital.projectPlanTitle}` : ""} (${type})`,
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
          className={defaultInputCls}
          placeholder="عدد وارد کنید..."
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          dir="ltr"
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
        placeholder="انتخاب از اعتبارهای تعریف‌شده..."
        searchable
      />
    </div>
  );
}

export default CreditCodeSanamaField;
