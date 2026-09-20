import { usePersons } from "@/hooks/usePersons";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * PersonSearchSelect — کامپوننت هوشمند انتخاب و جستجوی شخص بر اساس «نام» یا «شناسه ملی ۱۱ رقمی»
 * جهت استفاده در فرم‌های ثبت بدهی، مطالباتی، تعهدات، موافقت‌نامه‌ها و اسناد مالی.
 */
export function PersonSearchSelect({
  value = "",
  onChange,
  placeholder = "جستجوی نام شخص یا شناسه ملی ۱۱ رقمی...",
  disabled = false,
  className = "",
}) {
  const { persons, options, loading, error } = usePersons();
  const navigate = useNavigate();

  // ساخت لیست گزینه‌ها همراه با پشتیبانی از جستجوی همزمان نام و شناسه ملی ۱۱ رقمی
  const richOptions = persons.map((p) => {
    const name = p.title || `${p.firstName || ""} ${p.lastName || ""}`.trim();
    const natId = p.nationalId ? ` [شناسه ملی: ${p.nationalId}]` : "";
    return {
      value: p.nomineeCode || p._id,
      label: `${name}${natId} — ${p.nomineeCode || ""}`,
      person: p,
      name,
      nationalId: p.nationalId,
    };
  });

  const handleSelect = (selectedValue) => {
    const found = persons.find(
      (p) =>
        p.nomineeCode === selectedValue ||
        p._id === selectedValue ||
        p.nationalId === selectedValue ||
        p.title === selectedValue
    );
    if (found) {
      onChange(found);
    } else {
      onChange(selectedValue);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-input bg-background/60 text-xs text-muted-foreground" dir="rtl">
        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-primary" />
        در حال بارگذاری لیست اشخاص و شناسه‌های ملی...
      </div>
    );
  }

  if (error || richOptions.length === 0) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs" dir="rtl">
        <span className="text-amber-800 font-medium">هیچ شخصی ثبت نشده است</span>
        <button
          type="button"
          onClick={() => navigate("/basic-info/definitions/persons")}
          className="text-primary font-bold underline hover:text-primary/80 transition-colors"
        >
          ثبت شخص جدید
        </button>
      </div>
    );
  }

  // پیدا کردن رکورد منطبق برای نمایش کلید انتخابی
  const matchedPerson = persons.find(
    (p) =>
      p.title === value ||
      p.nomineeCode === value ||
      p.nationalId === value ||
      `${p.firstName || ""} ${p.lastName || ""}`.trim() === value
  );
  const currentValue = matchedPerson ? (matchedPerson.nomineeCode || matchedPerson._id) : value;

  return (
    <SearchableSelect
      value={currentValue}
      onChange={handleSelect}
      options={richOptions}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      searchable={true}
    />
  );
}

export default PersonSearchSelect;
