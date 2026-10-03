import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAssets } from "@/context/AssetContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ShebaInput from "@/components/ui/sheba-input";
import { Badge } from "@/components/ui/badge";
import { PersianDatePicker, toPersianDigits } from "@/components/ui/persian-date-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import locationData from "@/data/provinces_cities_counties.json";

function normText(str) {
  if (!str) return "";
  return String(str)
    .replace(/[\u064A\u0649]/g, "ی")
    .replace(/\u0643/g, "ک")
    .replace(/[\u200c\u00a0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
import {
  User,
  GraduationCap,
  Building2,
  Briefcase,
  History,
  MapPin,
  Award,
  Heart,
  CreditCard,
  Save,
  Plus,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Pencil,
  PlusCircle,
  X,
  ChevronDown,
  Sparkles,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── الگوریتم اعتبارسنجی کد ملی ایران ─────────────────────────────────────────
export function validateIranianNationalId(id) {
  if (!id) return "شماره ملی الزامی است.";
  const clean = String(id).replace(/\D/g, "");
  if (clean.length !== 10) return "شماره ملی باید دقیقاً ۱۰ رقم عددی باشد.";
  if (/^(\d)\1{9}$/.test(clean)) return "شماره ملی وارد شده نامعتبر است (ارقام تکراری).";

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  const check = parseInt(clean.charAt(9), 10);
  const remainder = sum % 11;
  const isValid = remainder < 2 ? check === remainder : check === 11 - remainder;

  if (!isValid) return "کد ملی با الگوریتم اعتبارسنجی ثبت احوال مغایرت دارد.";
  return null;
}

// ─── داده‌های پایه و ساختارهای انتخابی قابل مدیریت ───────────────────────────
const INITIAL_EXECUTIVE_ORGS = [
  "قوه قضائیه",
  "وزارت امور اقتصادی و دارایی",
  "وزارت دادگستری",
  "دیوان عالی کشور",
  "سازمان ثبت اسناد و املاک کشور",
  "دیوان عدالت اداری",
  "سازمان بازرسی کل کشور",
  "دیوان محاسبات کشور",
  "دادگستری کل استان ایلام",
  "وزارت کشور"
];

const HIGHEST_DEGREE_OPTIONS = [
  { value: "بیسواد", label: "بیسواد" },
  { value: "ابتدایی", label: "ابتدایی" },
  { value: "راهنمایی / متوسطه اول", label: "راهنمایی / متوسطه اول" },
  { value: "دیپلم", label: "دیپلم" },
  { value: "فوق دیپلم", label: "فوق دیپلم" },
  { value: "کارشناسی", label: "کارشناسی" },
  { value: "کارشناسی ارشد", label: "کارشناسی ارشد" },
  { value: "دکتری", label: "دکتری" },
  { value: "فوق دکتری", label: "فوق دکتری" }
];

const INITIAL_FIELDS_OF_STUDY = [
  "مدیریت بازرگانی",
  "حسابداری",
  "حقوق",
  "مدیریت دولتی",
  "مدیریت مالی",
  "اقتصاد",
  "مهندسی کامپیوتر / نرم‌افزار",
  "علوم اداری",
  "روانشناسی",
  "جامعه‌شناسی",
  "فقه و حقوق اسلامی"
];

const INITIAL_POST_TITLES = [
  "متصدی امور دفتری",
  "مدیر دفتر کل",
  "دادرس دادگاه",
  "بازپرس",
  "حسابدار ارشد",
  "کارشناس مسئول حقوقی",
  "کارشناس فناوری اطلاعات",
  "کارشناس امور پرسنلی",
  "مسئول دبیرخانه",
  "مدیر امور مالی",
  "رئیس شعبه"
];

const ORGANIZATIONAL_UNITS_TREE = [
  {
    value: "دادسرای عمومی و انقلاب شهرستان ایلام",
    label: "دادسرای عمومی و انقلاب شهرستان ایلام (مرکزی)",
    group: "دادسرای ایلام",
  },
  {
    value: "شعبه اول دادیاری - دادسرای ایلام",
    label: "└─ شعبه اول دادیاری",
    group: "دادسرای ایلام",
  },
  {
    value: "شعبه دوم بازپرسی - دادسرای ایلام",
    label: "└─ شعبه دوم بازپرسی",
    group: "دادسرای ایلام",
  },
  {
    value: "دبیرخانه و امور دفتری دادسرای ایلام",
    label: "└─ دبیرخانه و امور دفتری دادسرا",
    group: "دادسرای ایلام",
  },
  {
    value: "دادگاه عمومی و انقلاب استان ایلام",
    label: "دادگاه عمومی و انقلاب استان ایلام (ستاد)",
    group: "دادگاه استان ایلام",
  },
  {
    value: "شعبه اول دادگاه کیفری - ایلام",
    label: "└─ شعبه اول دادگاه کیفری",
    group: "دادگاه استان ایلام",
  },
  {
    value: "شعبه دوم دادگاه حقوقی - ایلام",
    label: "└─ شعبه دوم دادگاه حقوقی",
    group: "دادگاه استان ایلام",
  },
  {
    value: "مدیریت امور مالی و ذیحسابی",
    label: "مدیریت امور مالی و ذیحسابی",
    group: "ستاد اداری و مالی",
  },
  {
    value: "اداره کارگزینی و منابع انسانی",
    label: "اداره کارگزینی و منابع انسانی",
    group: "ستاد اداری و مالی",
  }
];

const JOB_CATEGORIES = [
  { value: "اداری و مالی", label: "اداری و مالی" },
  { value: "قضایی", label: "قضایی" },
  { value: "پشتیبانی و خدمات", label: "پشتیبانی و خدمات" },
  { value: "فناوری اطلاعات و آمار", label: "فناوری اطلاعات و آمار" },
  { value: "حقوقی و نظارتی", label: "حقوقی و نظارتی" }
];

const INITIAL_JOB_FIELDS = [
  "متصدی امور دفتری",
  "حسابدار",
  "کارشناس امور قضایی",
  "تحلیل‌گر سیستم",
  "کارمند اداری",
  "کارشناس حقوقی",
  "مسئول بایگانی",
  "تحویل‌دار"
];

const JOB_GRADES = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `طبقه ${i + 1}`
}));

const INITIAL_JOB_RANKS = [
  { value: "مقدماتی", label: "مقدماتی" },
  { value: "پایه", label: "پایه" },
  { value: "ارشد", label: "ارشد" },
  { value: "خبره", label: "خبره" },
  { value: "عالی", label: "عالی" }
];



const VETERAN_RELATION_OPTIONS = [
  { value: "ندارد", label: "ندارد" },
  { value: "فرزند شهید", label: "فرزند شهید" },
  { value: "همسر شهید", label: "همسر شهید" },
  { value: "پدر شهید", label: "پدر شهید" },
  { value: "مادر شهید", label: "مادر شهید" },
  { value: "برادر شهید", label: "برادر شهید" },
  { value: "خواهر شهید", label: "خواهر شهید" },
  { value: "فرزند جانباز", label: "فرزند جانباز" },
  { value: "همسر جانباز", label: "همسر جانباز" },
  { value: "فرزند آزاده", label: "فرزند آزاده" },
  { value: "همسر آزاده", label: "همسر آزاده" },
  { value: "سایر", label: "سایر سوابق ایثارگری" }
];

const FORM_SECTIONS = [
  { id: "sec-identity", title: "۱. اطلاعات هویتی", icon: User },
  { id: "sec-education", title: "۲. اطلاعات تحصیلی", icon: GraduationCap },
  { id: "sec-post", title: "۳. اطلاعات پست سازمانی", icon: Building2 },
  { id: "sec-job", title: "۴. اطلاعات شغلی", icon: Briefcase },
  { id: "sec-service", title: "۵. سوابق خدمت", icon: History },
  { id: "sec-location", title: "۶. محل خدمت", icon: MapPin },
  { id: "sec-veteran", title: "۷. وضعیت ایثارگری", icon: Award },
  { id: "sec-relation", title: "۸. نسبت با ایثارگر", icon: Heart },
  { id: "sec-family", title: "۹. وضعیت تأهل و خانوادگی", icon: UserPlus },
  { id: "sec-financial", title: "۱۰. اطلاعات مالی و حساب بانکی", icon: CreditCard },
];

const INITIAL_FORM_STATE = {
  // ۱. اطلاعات هویتی
  executiveOrg: "قوه قضائیه",
  firstName: "",
  lastName: "",
  fatherName: "",
  nationalId: "",
  code: "",
  certificateNo: "",
  birthPlace: "ایلام",
  birthDate: "",
  gender: "مرد",

  // ۲. اطلاعات تحصیلی
  highestDegree: "کارشناسی",
  fieldOfStudy: "مدیریت بازرگانی",

  // ۳. اطلاعات پست سازمانی
  postTitle: "متصدی امور دفتری",
  postRow: "۱۰۴",
  unit: "",

  // ۴. اطلاعات شغلی
  jobCategory: "اداری و مالی",
  jobField: "متصدی امور دفتری",
  jobGrade: "8",
  jobRank: "پایه",

  // ۵. سوابق خدمت
  acceptedServiceYears: 2,
  acceptedServiceMonths: 8,
  acceptedServiceDays: 0,
  acceptedExpYears: 2,
  acceptedExpMonths: 8,
  acceptedExpDays: 0,

  // ۶. محل خدمت
  serviceProvince: "ایلام",
  serviceCounty: "چوار",
  serviceDistrict: "مرکزی",
  serviceCity: "چوار",

  // ۷. وضعیت ایثارگری
  frontMonths: 0,
  frontDays: 0,
  disabilityPercent: 0,
  captivityMonths: 0,
  captivityDays: 0,

  // ۸. نسبت با ایثارگر
  sacrificeRelation: "ندارد",

  // ۹. وضعیت تأهل
  maritalStatus: "مجرد",
  childrenCount: 0,

  // ۱۰. اطلاعات مالی و بانکی
  dailyBaseSalary: 5541850,
  housingAllowance: 30000000,
  groceryAllowance: 22000000,
  bankName: "بانک سپه",
  accountNo: "",
  cardNumber: "",
  shebaNo: "",
};

export default function EmployeeRegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addConfig, updateConfig, employees, refreshAllConfigs } = useAssets();

  // فرم و اعتبارسنجی
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [formErrorMsg, setFormErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالت‌های مدیریت گزینه‌های پویا (قابل تعریف توسط کاربر/مدیر سیستم)
  const [executiveOrgs, setExecutiveOrgs] = useState(INITIAL_EXECUTIVE_ORGS);
  const [fieldsOfStudy, setFieldsOfStudy] = useState(INITIAL_FIELDS_OF_STUDY);
  const [postTitles, setPostTitles] = useState(INITIAL_POST_TITLES);
  const [jobFields, setJobFields] = useState(INITIAL_JOB_FIELDS);
  const [jobRanks, setJobRanks] = useState(INITIAL_JOB_RANKS);

  // مپ مودال افزودن گزینه جدید
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "executiveOrg" | "postTitle" | "jobRank" | "fieldOfStudy"
  const [newOptionTitle, setNewOptionTitle] = useState("");

  const editingId = location.state?.employee?._id || location.state?.employee?.id || null;

  // بارگذاری کارمند در صورت ویرایش
  useEffect(() => {
    if (location.state?.employee) {
      const emp = location.state.employee;
      setForm(f => ({
        ...INITIAL_FORM_STATE,
        ...emp,
        serviceProvince: emp.serviceProvince || emp.province || "ایلام",
        serviceCounty: emp.serviceCounty || emp.county || "چوار",
        serviceDistrict: emp.serviceDistrict || emp.district || "مرکزی",
        serviceCity: emp.serviceCity || emp.city || "چوار",
      }));
    }
  }, [location.state]);

  // تولید خودکار پیشنهاد کد پرسنلی برای ثبت کارمند جدید
  useEffect(() => {
    if (editingId) return;
    if (employees && employees.length > 0) {
      const codes = employees
        .map(e => String(e.code || ""))
        .filter(c => c.startsWith("EMP-"))
        .map(c => Number(c.replace("EMP-", "")))
        .filter(n => !isNaN(n));
      const nextNum = codes.length > 0 ? Math.max(...codes) + 1 : employees.length + 1;
      const formattedNum = String(nextNum).padStart(3, "0");
      setForm(f => ({ ...f, code: `EMP-${formattedNum}` }));
    } else {
      setForm(f => ({ ...f, code: "EMP-001" }));
    }
  }, [employees, editingId]);

  // لیست تمام استان‌ها (بدون تکرار و مرتب‌شده)
  const allProvinces = useMemo(() => {
    const map = new Map();
    for (const item of locationData) {
      const p = normText(item.provinceName);
      if (p && !map.has(p)) {
        map.set(p, p);
      }
    }
    return Array.from(map.keys())
      .sort((a, b) => a.localeCompare(b, "fa"))
      .map(p => ({ value: p, label: p }));
  }, []);

  // محاسبه خودکار گزینه‌های وابسته محل خدمت از روی locationData
  const availableCounties = useMemo(() => {
    if (!form.serviceProvince) return [];
    const pNorm = normText(form.serviceProvince);
    const set = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm) {
        const c = normText(item.cityName);
        if (c) set.add(c);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }, [form.serviceProvince]);

  const availableDistricts = useMemo(() => {
    if (!form.serviceProvince || !form.serviceCounty) return [];
    const pNorm = normText(form.serviceProvince);
    const cNorm = normText(form.serviceCounty);
    const set = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === cNorm) {
        const d = normText(item.countyName);
        if (d) set.add(d);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }, [form.serviceProvince, form.serviceCounty]);

  const availableCities = useMemo(() => {
    if (!form.serviceProvince || !form.serviceCounty) return [];
    const pNorm = normText(form.serviceProvince);
    const cNorm = normText(form.serviceCounty);
    const dNorm = normText(form.serviceDistrict);

    const set = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === cNorm) {
        if (!dNorm || normText(item.countyName) === dNorm) {
          const cName = normText(item.cityName);
          const dName = normText(item.countyName);
          if (cName) set.add(cName);
          if (dName && dName !== "مرکزی") set.add(dName);
        }
      }
    }
    if (set.size === 0 && form.serviceCounty) {
      set.add(normText(form.serviceCounty));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fa"));
  }, [form.serviceProvince, form.serviceCounty, form.serviceDistrict]);

  // تغییرات محل خدمت به صورت وابسته (استان ← شهرستان ← بخش ← شهر)
  function handleProvinceChange(prov) {
    const pNorm = normText(prov);

    const countiesSet = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm) {
        const c = normText(item.cityName);
        if (c) countiesSet.add(c);
      }
    }
    const counties = Array.from(countiesSet).sort((a, b) => a.localeCompare(b, "fa"));
    const defaultCounty = counties[0] || "";

    const districtsSet = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === defaultCounty) {
        const d = normText(item.countyName);
        if (d) districtsSet.add(d);
      }
    }
    const districts = Array.from(districtsSet).sort((a, b) => a.localeCompare(b, "fa"));
    const defaultDist = districts[0] || "";

    const citiesSet = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === defaultCounty) {
        if (!defaultDist || normText(item.countyName) === defaultDist) {
          const cName = normText(item.cityName);
          const dName = normText(item.countyName);
          if (cName) citiesSet.add(cName);
          if (dName && dName !== "مرکزی") citiesSet.add(dName);
        }
      }
    }
    const cities = Array.from(citiesSet).sort((a, b) => a.localeCompare(b, "fa"));
    const defaultCity = cities[0] || defaultCounty || "";

    setForm(f => ({
      ...f,
      serviceProvince: pNorm,
      serviceCounty: defaultCounty,
      serviceDistrict: defaultDist,
      serviceCity: defaultCity
    }));
  }

  function handleCountyChange(county) {
    const pNorm = normText(form.serviceProvince);
    const cNorm = normText(county);

    const districtsSet = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === cNorm) {
        const d = normText(item.countyName);
        if (d) districtsSet.add(d);
      }
    }
    const districts = Array.from(districtsSet).sort((a, b) => a.localeCompare(b, "fa"));
    const defaultDist = districts[0] || "";

    const citiesSet = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === cNorm) {
        if (!defaultDist || normText(item.countyName) === defaultDist) {
          const cName = normText(item.cityName);
          const dName = normText(item.countyName);
          if (cName) citiesSet.add(cName);
          if (dName && dName !== "مرکزی") citiesSet.add(dName);
        }
      }
    }
    const cities = Array.from(citiesSet).sort((a, b) => a.localeCompare(b, "fa"));
    const defaultCity = cities[0] || cNorm || "";

    setForm(f => ({
      ...f,
      serviceCounty: cNorm,
      serviceDistrict: defaultDist,
      serviceCity: defaultCity
    }));
  }

  function handleDistrictChange(dist) {
    const pNorm = normText(form.serviceProvince);
    const cNorm = normText(form.serviceCounty);
    const dNorm = normText(dist);

    const citiesSet = new Set();
    for (const item of locationData) {
      if (normText(item.provinceName) === pNorm && normText(item.cityName) === cNorm) {
        if (!dNorm || normText(item.countyName) === dNorm) {
          const cName = normText(item.cityName);
          const dName = normText(item.countyName);
          if (cName) citiesSet.add(cName);
          if (dName && dName !== "مرکزی") citiesSet.add(dName);
        }
      }
    }
    const cities = Array.from(citiesSet).sort((a, b) => a.localeCompare(b, "fa"));
    const defaultCity = cities[0] || cNorm || "";

    setForm(f => ({
      ...f,
      serviceDistrict: dNorm,
      serviceCity: defaultCity
    }));
  }

  // به‌روزرسانی فیلدها و پاکسازی خطاهای مربوطه
  function handleChange(field, value) {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormErrorMsg("");

    // قوانین منطقی فرم
    if (field === "maritalStatus") {
      if (value === "مجرد") {
        setForm(f => ({ ...f, maritalStatus: value, childrenCount: 0 }));
      } else {
        setForm(f => ({ ...f, maritalStatus: value }));
      }
    } else if (field === "sacrificeRelation") {
      if (value === "ندارد") {
        setForm(f => ({
          ...f,
          sacrificeRelation: value,
          frontMonths: 0,
          frontDays: 0,
          disabilityPercent: 0,
          captivityMonths: 0,
          captivityDays: 0
        }));
      } else {
        setForm(f => ({ ...f, sacrificeRelation: value }));
      }
    } else {
      setForm(f => ({ ...f, [field]: value }));
    }
  }

  // اعتبارسنجی جامع فرم قبل از ثبت
  function validateAll() {
    const newErrors = {};

    if (!form.executiveOrg?.trim()) {
      newErrors.executiveOrg = "انتخاب دستگاه اجرایی الزامی است.";
    }

    if (!form.firstName?.trim()) {
      newErrors.firstName = "وارد کردن نام الزامی است.";
    }

    if (!form.lastName?.trim()) {
      newErrors.lastName = "وارد کردن نام خانوادگی الزامی است.";
    }

    // اعتبارسنجی شماره ملی ایران
    const natIdErr = validateIranianNationalId(form.nationalId);
    if (natIdErr) {
      newErrors.nationalId = natIdErr;
    }

    // شماره پرسنلی
    if (!form.code?.trim()) {
      newErrors.code = "وارد کردن شماره پرسنلی الزامی است.";
    }

    // بررسی تکراری نبودن شماره ملی و شماره پرسنلی
    if (employees && Array.isArray(employees)) {
      const cleanNatId = String(form.nationalId || "").replace(/\D/g, "");
      const cleanCode = String(form.code || "").trim().toLowerCase();

      for (const emp of employees) {
        const empId = emp._id || emp.id;
        if (editingId && String(empId) === String(editingId)) continue;

        const otherNatId = String(emp.nationalId || "").replace(/\D/g, "");
        if (cleanNatId && otherNatId && cleanNatId === otherNatId) {
          newErrors.nationalId = "این شماره ملی قبلاً برای کارمند دیگری ثبت شده است.";
        }

        const otherCode = String(emp.code || "").trim().toLowerCase();
        if (cleanCode && otherCode && cleanCode === otherCode) {
          newErrors.code = "این شماره پرسنلی قبلاً در سیستم ثبت شده است.";
        }
      }
    }

    // وضعیت ایثارگری و جانبازی
    if (Number(form.disabilityPercent || 0) < 0 || Number(form.disabilityPercent || 0) > 100) {
      newErrors.disabilityPercent = "درصد جانبازی باید بین ۰ تا ۱۰۰ باشد.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ثبت فرم در پایگاه داده
  async function saveEmployeeData(stayOnPage = false) {
    if (!validateAll()) {
      setFormErrorMsg("لطفاً خطاهای اعتبارسنجی مشخص‌شده در فرم را برطرف نمایید.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }

    try {
      setIsSubmitting(true);
      setFormErrorMsg("");
      setSuccessMsg("");

      const payload = {
        ...form,
        name: `${form.firstName} ${form.lastName}`,
        role: form.jobField || form.postTitle || "کارمند",
        salary: Number(form.dailyBaseSalary || 0) * 30 + Number(form.housingAllowance || 0) + Number(form.groceryAllowance || 0),
        updatedAt: new Date().toISOString()
      };

      let result;
      if (editingId) {
        result = await updateConfig("employees", payload);
      } else {
        result = await addConfig("employees", {
          ...payload,
          createdAt: new Date().toISOString()
        });
      }

      if (result) {
        const successText = editingId
          ? "اطلاعات پرسنلی کارمند با موفقیت بروزرسانی شد."
          : `کارمند «${form.firstName} ${form.lastName}» با شماره پرسنلی ${form.code} با موفقیت ثبت گردید.`;

        setSuccessMsg(successText);
        await refreshAllConfigs();

        if (stayOnPage) {
          // بازنشانی برای ثبت کارمند جدید
          setForm({
            ...INITIAL_FORM_STATE,
            code: `EMP-${String((employees?.length || 0) + 2).padStart(3, "0")}`
          });
          setErrors({});
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setTimeout(() => {
            navigate("/payroll/employees/list");
          }, 1200);
        }
        return true;
      } else {
        setFormErrorMsg("خطا در ثبت اطلاعات در سرور.");
      }
    } catch (err) {
      console.error(err);
      setFormErrorMsg("خطایی غیرمنتظره در ثبت کارمند رخ داد.");
    } finally {
      setIsSubmitting(false);
    }
    return false;
  }

  // افزودن گزینه جدید به صورت پویا در مدال
  function handleAddNewOption() {
    if (!newOptionTitle.trim()) return;
    const val = newOptionTitle.trim();

    if (modalType === "executiveOrg") {
      if (!executiveOrgs.includes(val)) {
        setExecutiveOrgs(prev => [...prev, val]);
      }
      handleChange("executiveOrg", val);
    } else if (modalType === "postTitle") {
      if (!postTitles.includes(val)) {
        setPostTitles(prev => [...prev, val]);
      }
      handleChange("postTitle", val);
    } else if (modalType === "jobRank") {
      if (!jobRanks.some(r => r.value === val)) {
        setJobRanks(prev => [...prev, { value: val, label: val }]);
      }
      handleChange("jobRank", val);
    } else if (modalType === "fieldOfStudy") {
      if (!fieldsOfStudy.includes(val)) {
        setFieldsOfStudy(prev => [...prev, val]);
      }
      handleChange("fieldOfStudy", val);
    }

    setNewOptionTitle("");
    setModalOpen(false);
  }

  // بازنشانی فرم
  function handleResetForm() {
    setForm(INITIAL_FORM_STATE);
    setErrors({});
    setFormErrorMsg("");
    setSuccessMsg("");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 font-sans select-none" dir="rtl">

      {/* ─── هدر اصلی فرم ─── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-indigo-900/40 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2">
                {editingId ? `ویرایش فرم پرونده پرسنلی (${form.firstName} ${form.lastName})` : "فرم ثبت اطلاعات پرسنلی کارمند جدید"}
                {editingId ? (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">در حال ویرایش</Badge>
                ) : (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">سیستم حسابداری / پرسنلی</Badge>
                )}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                ورود کامل مشخصات هویتی، تحصیلی، پست سازمانی، شغلی، سوابق خدمت، محل خدمت و وضعیت ایثارگری کارمند
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            className="gap-1.5 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            بازنشانی فرم
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate("/payroll/employees/list")}
            className="gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            لیست کارکنان
          </Button>
        </div>
      </div>

      {/* ─── پیام‌های خطا و موفقیت ─── */}
      {formErrorMsg && (
        <div className="bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <div className="flex-1 font-semibold">{formErrorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div className="flex-1 font-semibold">{successMsg}</div>
        </div>
      )}

      {/* ─── نوار دسترسی سریع به بخش‌های ۱۰ گانه ─── */}
      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {FORM_SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-indigo-100"
            >
              <sec.icon className="h-3.5 w-3.5 text-indigo-500" />
              <span>{sec.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ─── بدنه اصلی فرم ثبت ─── */}
      <form onSubmit={(e) => { e.preventDefault(); saveEmployeeData(false); }} className="space-y-6">

        {/* ━━━━━━━━━━━━━━━━━━━━ ۱. اطلاعات هویتی ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-identity" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-600" />
                ۱. اطلاعات هویتی
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200">فردی و شناسنامه‌ای</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-right">

              {/* ۱) دستگاه (Select با قابلیت افزودن دستگاه‌های جدید) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    دستگاه اجرایی <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => { setModalType("executiveOrg"); setModalOpen(true); }}
                    className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> افزودن دستگاه جدید
                  </button>
                </div>
                <SearchableSelect
                  value={form.executiveOrg}
                  onChange={(val) => handleChange("executiveOrg", val)}
                  options={executiveOrgs.map(org => ({ value: org, label: org }))}
                  placeholder="انتخاب دستگاه..."
                  className={errors.executiveOrg ? "border-rose-500 ring-1 ring-rose-500" : ""}
                />
                {errors.executiveOrg && <span className="text-[10px] text-rose-500 font-bold block mt-1">{errors.executiveOrg}</span>}
              </div>

              {/* ۲) نام */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  نام <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="مثال: علی"
                  className={cn("h-9 text-xs", errors.firstName && "border-rose-500 focus-visible:ring-rose-500")}
                  required
                />
                {errors.firstName && <span className="text-[10px] text-rose-500 font-bold block mt-1">{errors.firstName}</span>}
              </div>

              {/* ۳) نام خانوادگی */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  نام خانوادگی <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="مثال: حسینی"
                  className={cn("h-9 text-xs", errors.lastName && "border-rose-500 focus-visible:ring-rose-500")}
                  required
                />
                {errors.lastName && <span className="text-[10px] text-rose-500 font-bold block mt-1">{errors.lastName}</span>}
              </div>

              {/* ۴) نام پدر */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">نام پدر</Label>
                <Input
                  value={form.fatherName}
                  onChange={(e) => handleChange("fatherName", e.target.value)}
                  placeholder="مثال: محمد"
                  className="h-9 text-xs"
                />
              </div>

              {/* ۵) شماره ملی (با اعتبارسنجی ثبت احوال و عدم تکرار) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  شماره ملی (۱۰ رقم عددی) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.nationalId}
                  onChange={(e) => handleChange("nationalId", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="0012345678"
                  maxLength={10}
                  className={cn("h-9 text-xs font-mono text-left tracking-wider", errors.nationalId && "border-rose-500 focus-visible:ring-rose-500")}
                  required
                />
                {errors.nationalId ? (
                  <span className="text-[10px] text-rose-500 font-bold block mt-1">{errors.nationalId}</span>
                ) : (
                  <span className="text-[9.5px] text-muted-foreground block mt-1">بررسی خودکار الگوریتم ۱۰ رقمی ثبت احوال</span>
                )}
              </div>

              {/* ۶) شماره پرسنلی (شناسه یکتا) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  شماره پرسنلی (شناسه یکتا) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  placeholder="EMP-001"
                  className={cn("h-9 text-xs font-mono text-left", errors.code && "border-rose-500 focus-visible:ring-rose-500")}
                  required
                />
                {errors.code && <span className="text-[10px] text-rose-500 font-bold block mt-1">{errors.code}</span>}
              </div>

              {/* ۷) شماره شناسنامه */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">شماره شناسنامه</Label>
                <Input
                  value={form.certificateNo}
                  onChange={(e) => handleChange("certificateNo", e.target.value.replace(/\D/g, ""))}
                  placeholder="۱۲۳۴"
                  className="h-9 text-xs font-mono text-left"
                />
              </div>

              {/* ۸) محل تولد */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">محل تولد</Label>
                <SearchableSelect
                  value={form.birthPlace}
                  onChange={(val) => handleChange("birthPlace", val)}
                  options={[
                    { value: "ایلام", label: "ایلام" },
                    { value: "چوار", label: "چوار" },
                    { value: "تهران", label: "تهران" },
                    { value: "اصفهان", label: "اصفهان" },
                    { value: "شیراز", label: "شیراز" },
                    { value: "کرمانشاه", label: "کرمانشاه" },
                    { value: "تبریز", label: "تبریز" },
                    { value: "اهواز", label: "اهواز" },
                    { value: "سایر", label: "سایر شهرهای کشور" }
                  ]}
                  placeholder="انتخاب شهر محل تولد..."
                />
              </div>

              {/* ۹) تاریخ تولد (Persian Date Picker) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">تاریخ تولد (شمسی)</Label>
                <PersianDatePicker
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  placeholder="۱۳۷۰/۰۱/۰۱"
                />
              </div>

              {/* ۱۰) جنسیت */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">جنسیت</Label>
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="مرد">مرد</option>
                  <option value="زن">زن</option>
                </select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۲. اطلاعات تحصیلی ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-education" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                ۲. اطلاعات تحصیلی
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-blue-700 border-blue-200">سوابق علمی</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">

              {/* ۱۱) بالاترین مدرک تحصیلی */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">بالاترین مدرک تحصیلی</Label>
                <select
                  value={form.highestDegree}
                  onChange={(e) => handleChange("highestDegree", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm"
                >
                  {HIGHEST_DEGREE_OPTIONS.map(deg => (
                    <option key={deg.value} value={deg.value}>{deg.label}</option>
                  ))}
                </select>
              </div>

              {/* رشته تحصیلی (Searchable Select + قابلیت افزودن) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">رشته تحصیلی</Label>
                  <button
                    type="button"
                    onClick={() => { setModalType("fieldOfStudy"); setModalOpen(true); }}
                    className="text-[10.5px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> تعریف رشته جدید
                  </button>
                </div>
                <SearchableSelect
                  value={form.fieldOfStudy}
                  onChange={(val) => handleChange("fieldOfStudy", val)}
                  options={fieldsOfStudy.map(f => ({ value: f, label: f }))}
                  placeholder="انتخاب یا جستجوی رشته..."
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۳. اطلاعات پست سازمانی ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-post" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                ۳. اطلاعات پست سازمانی
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-emerald-700 border-emerald-200">جایگاه سازمانی</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">

              {/* ۱۲) عنوان پست (Searchable Select + قابلیت تعریف پست جدید) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">عنوان پست سازمانی</Label>
                  <button
                    type="button"
                    onClick={() => { setModalType("postTitle"); setModalOpen(true); }}
                    className="text-[10.5px] text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> افزودن پست
                  </button>
                </div>
                <SearchableSelect
                  value={form.postTitle}
                  onChange={(val) => handleChange("postTitle", val)}
                  options={postTitles.map(p => ({ value: p, label: p }))}
                  placeholder="انتخاب عنوان پست..."
                />
              </div>

              {/* شماره پست */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">کد / شماره پست سازمانی</Label>
                <Input
                  value={form.postRow}
                  onChange={(e) => handleChange("postRow", e.target.value)}
                  placeholder="مثال: ۱۰۴"
                  className="h-9 text-xs font-mono text-left"
                />
              </div>

              {/* ۱۳) واحد سازمانی */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">
                  واحد سازمانی
                </Label>
                <Input
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                  placeholder="عنوان واحد سازمانی را وارد نمایید..."
                  className="h-9 text-xs"
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۴. اطلاعات شغلی ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-job" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600" />
                ۴. اطلاعات شغلی
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-purple-700 border-purple-200">طبقه‌بندی و رتبه‌بندی</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-right">

              {/* ۱۴) عنوان رسته */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">عنوان رسته</Label>
                <SearchableSelect
                  value={form.jobCategory}
                  onChange={(val) => handleChange("jobCategory", val)}
                  options={JOB_CATEGORIES}
                  placeholder="انتخاب عنوان رسته..."
                />
              </div>

              {/* رشته شغلی */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">رشته شغلی</Label>
                <SearchableSelect
                  value={form.jobField}
                  onChange={(val) => handleChange("jobField", val)}
                  options={jobFields.map(j => ({ value: j, label: j }))}
                  placeholder="انتخاب رشته شغلی..."
                />
              </div>

              {/* طبقه */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">طبقه شغلی سازمان</Label>
                <SearchableSelect
                  value={form.jobGrade}
                  onChange={(val) => handleChange("jobGrade", val)}
                  options={JOB_GRADES}
                  placeholder="انتخاب طبقه..."
                />
              </div>

              {/* رتبه (با قابلیت افزودن/تعریف رتبه‌های جدید توسط مدیر سیستم) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">رتبه شغلی</Label>
                  <button
                    type="button"
                    onClick={() => { setModalType("jobRank"); setModalOpen(true); }}
                    className="text-[10.5px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="h-3 w-3" /> افزودن رتبه
                  </button>
                </div>
                <SearchableSelect
                  value={form.jobRank}
                  onChange={(val) => handleChange("jobRank", val)}
                  options={jobRanks}
                  placeholder="انتخاب رتبه..."
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۵. سوابق خدمت ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-service" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-amber-600" />
                ۵. سوابق خدمت
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-amber-700 border-amber-200">مدت زمان سوابق</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">

              {/* ۱۵) سابقه خدمت قابل قبول (سال، ماه، روز) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  ۱۵. سابقه خدمت قابل قبول
                </Label>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">سال</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={form.acceptedServiceYears}
                      onChange={(e) => handleChange("acceptedServiceYears", Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">ماه</Label>
                    <Input
                      type="number"
                      min="0"
                      max="11"
                      value={form.acceptedServiceMonths}
                      onChange={(e) => handleChange("acceptedServiceMonths", Math.min(11, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">روز</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={form.acceptedServiceDays}
                      onChange={(e) => handleChange("acceptedServiceDays", Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* ۱۶) سابقه تجربی قابل قبول (سال، ماه، روز) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  ۱۶. سابقه تجربی قابل قبول
                </Label>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">سال</Label>
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      value={form.acceptedExpYears}
                      onChange={(e) => handleChange("acceptedExpYears", Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">ماه</Label>
                    <Input
                      type="number"
                      min="0"
                      max="11"
                      value={form.acceptedExpMonths}
                      onChange={(e) => handleChange("acceptedExpMonths", Math.min(11, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">روز</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={form.acceptedExpDays}
                      onChange={(e) => handleChange("acceptedExpDays", Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۶. محل خدمت ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-location" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-600" />
                ۶. محل خدمت
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-right">

              {/* استان */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">استان</Label>
                <SearchableSelect
                  value={form.serviceProvince}
                  onChange={handleProvinceChange}
                  options={allProvinces}
                  placeholder="انتخاب استان..."
                />
              </div>

              {/* شهرستان (وابسته به استان) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">شهرستان</Label>
                <SearchableSelect
                  value={form.serviceCounty}
                  onChange={handleCountyChange}
                  options={availableCounties.map(c => ({ value: c, label: c }))}
                  placeholder="انتخاب شهرستان..."
                />
              </div>

              {/* بخش (وابسته به شهرستان) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">بخش</Label>
                <SearchableSelect
                  value={form.serviceDistrict}
                  onChange={handleDistrictChange}
                  options={availableDistricts.map(d => ({ value: d, label: d }))}
                  placeholder="انتخاب بخش..."
                />
              </div>

              {/* شهر (وابسته به بخش) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">شهر</Label>
                <SearchableSelect
                  value={form.serviceCity}
                  onChange={(val) => handleChange("serviceCity", val)}
                  options={availableCities.map(c => ({ value: c, label: c }))}
                  placeholder="انتخاب شهر..."
                />
              </div>

            </div>

          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۷. وضعیت ایثارگری ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-veteran" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4 text-cyan-600" />
                ۷. وضعیت ایثارگری
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-cyan-700 border-cyan-200">جبهه، جانبازی، اسارت</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">

              {/* الف) مدت حضور در جبهه */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border space-y-3">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">الف) مدت حضور در جبهه</Label>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">ماه</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.frontMonths}
                      onChange={(e) => handleChange("frontMonths", Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">روز</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={form.frontDays}
                      onChange={(e) => handleChange("frontDays", Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* ب) درصد جانبازی (۰ تا ۱۰۰ درصد) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border space-y-3">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">ب) درصد جانبازی (٪)</Label>
                <div className="space-y-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.disabilityPercent}
                    onChange={(e) => handleChange("disabilityPercent", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className={cn("h-9 text-xs font-mono text-center font-bold", errors.disabilityPercent && "border-rose-500")}
                  />
                  {errors.disabilityPercent && <span className="text-[10px] text-rose-500 font-bold block mt-1">{errors.disabilityPercent}</span>}
                  <span className="text-[9.5px] text-muted-foreground block text-center">بازه مجاز: ۰ تا ۱۰۰ درصد</span>
                </div>
              </div>

              {/* ج) مدت اسارت */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border space-y-3">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">ج) مدت اسارت (آزادگان)</Label>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">ماه</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.captivityMonths}
                      onChange={(e) => handleChange("captivityMonths", Math.max(0, parseInt(e.target.value) || 0))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-[10.5px] text-muted-foreground block mb-1">روز</Label>
                    <Input
                      type="number"
                      min="0"
                      max="30"
                      value={form.captivityDays}
                      onChange={(e) => handleChange("captivityDays", Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-9 text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۸. نسبت با ایثارگر ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-relation" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                ۸. نسبت با ایثارگر
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-rose-700 border-rose-200">قرابت با شهدای گرانقدر و ایثارگران</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">نسبت با ایثارگر</Label>
                <select
                  value={form.sacrificeRelation}
                  onChange={(e) => handleChange("sacrificeRelation", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm font-bold text-slate-800 dark:text-slate-200"
                >
                  {VETERAN_RELATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="text-[10px] text-muted-foreground block mt-1">
                  در صورت انتخاب «ندارد»، فیلدهای سوابق ایثارگری فوق صفر منظور می‌گردند.
                </span>
              </div>

              <div className="bg-amber-50/60 dark:bg-slate-800 p-3.5 rounded-xl border border-amber-200 dark:border-slate-700 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <span>
                  امتیازات سهمیه استخدامی و فوق‌العاده ایثارگری بر اساس نوع نسبت و تاییدیه بنیاد شهید و امور ایثارگران محاسبه خواهد شد.
                </span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۹. وضعیت تأهل و خانوادگی ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-family" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-teal-600" />
                ۹. وضعیت تأهل و خانوادگی
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-teal-700 border-teal-200">اطلاعات عائله‌مندی</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-right">

              {/* ۲۰) وضعیت تأهل */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">وضعیت تأهل</Label>
                <select
                  value={form.maritalStatus}
                  onChange={(e) => handleChange("maritalStatus", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="مجرد">مجرد</option>
                  <option value="متأهل">متأهل</option>
                </select>
              </div>

              {/* تعداد فرزندان (حداقل 0، در صورت مجرد بودن 0 پیش‌فرض) */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">تعداد فرزندان</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={form.childrenCount}
                  onChange={(e) => handleChange("childrenCount", Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={form.maritalStatus === "مجرد"}
                  className="h-9 text-xs font-mono text-center font-bold"
                />
                {form.maritalStatus === "مجرد" && (
                  <span className="text-[10px] text-amber-600 font-bold block mt-1">
                    برای افراد «مجرد»، تعداد فرزندان به صورت پیش‌فرض ۰ می‌باشد.
                  </span>
                )}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ━━━━━━━━━━━━━━━━━━━━ ۱۰. اطلاعات مالی و حساب بانکی ━━━━━━━━━━━━━━━━━━━━ */}
        <Card id="sec-financial" className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden scroll-mt-6">
          <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b py-3.5 px-6">
            <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-indigo-600" />
                ۱۰. اطلاعات مالی و حساب بانکی (تکمیلی پرونده)
              </span>
              <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200">پرداخت حقوق</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">نام بانک واریز حقوق</Label>
                <Input
                  value={form.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="بانک سپه"
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">شماره حساب بانکی</Label>
                <Input
                  value={form.accountNo}
                  onChange={(e) => handleChange("accountNo", e.target.value.replace(/\D/g, ""))}
                  placeholder="۰۱۰۲۳۴۵۶۷۸"
                  className="h-9 text-xs font-mono text-left"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">شماره کارت بانکی (۱۶ رقم)</Label>
                <Input
                  value={form.cardNumber}
                  onChange={(e) => handleChange("cardNumber", e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="6037991122223333"
                  maxLength={16}
                  className="h-9 text-xs font-mono text-left"
                />
              </div>

              <div className="md:col-span-3">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 block">شماره شبا (۲۴ رقم)</Label>
                <ShebaInput
                  value={form.shebaNo}
                  onChange={(val) => handleChange("shebaNo", val)}
                />
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ─── دکمه‌های اقدام انتهای فرم ─── */}
        <div className="sticky bottom-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetForm}
              className="text-xs h-9 border-slate-300"
            >
              <RefreshCw className="h-3.5 w-3.5 ml-1 text-slate-500" />
              بازنشانی فرم
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/payroll/employees/list")}
              className="text-xs h-9 text-slate-600 hover:text-slate-900"
            >
              انصراف
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {/* دکمه «ثبت کارمند» */}
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-9 text-xs gap-2 px-6 shadow-md shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingId ? "ذخیره تغییرات کارمند" : "ثبت کارمند"}
            </Button>
          </div>

        </div>

      </form>

      {/* ─── مدال افزودن گزینه‌های پویا (دستگاه، پست، رتبه، رشته تحصیلی) ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {modalType === "executiveOrg" && "افزودن دستگاه اجرایی جدید"}
                {modalType === "postTitle" && "افزودن عنوان پست جدید"}
                {modalType === "jobRank" && "افزودن رتبه شغلی جدید"}
                {modalType === "fieldOfStudy" && "افزودن رشته تحصیلی جدید"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">عنوان یا نام گزینه جدید</Label>
              <Input
                value={newOptionTitle}
                onChange={(e) => setNewOptionTitle(e.target.value)}
                placeholder="نام دقیق را وارد نمایید..."
                className="h-9 text-xs"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAddNewOption(); }}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="text-xs h-8">
                انصراف
              </Button>
              <Button type="button" size="sm" onClick={handleAddNewOption} className="bg-indigo-600 text-white text-xs h-8">
                افزودن به لیست
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
