import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import api from "@/api";
import { encrypt } from "@/lib/crypto";
import { PersianDatePicker, toPersianDigits } from "@/components/ui/persian-date-picker";
import {
  Search, Eye, CheckCircle2, AlertCircle, ArrowUpDown, ChevronLeft,
  ChevronRight, BookOpen, Layers, Trash2, X, RotateCcw, FileText, Save
} from "lucide-react";

const STATUS_LABEL = { DRAFT: "پیش‌نویس", CONFIRMED: "تایید شده", CANCELLED: "ابطال شده" };
const STATUS_COLOR = {
  DRAFT:     "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400",
};

// ۴۹ ثبت پیش‌فرض با جزئیات آرتیکل‌های مالی بر اساس کدهای ۵ رقمی استاندارد سناما
const INITIAL_TEMPLATES = [
  {
    id: 1,
    title: "ثبت شماره ۱",
    description: "ثبت اعتبار هزینه و بودجه اعتبار هزینه",
    code: "OP-01",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "92001", accountName: "اعتبار هزینه", ratio: "100%" },
      { type: "credit", accountCode: "91001", accountName: "بودجه اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 2,
    title: "ثبت شماره ۲",
    description: "دریافت تنخواه‌گردان حسابداری از خزانه (شامل اعتبار بانکی)",
    code: "OP-02",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "23001", accountName: "پیش دریافت اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 3,
    title: "ثبت شماره ۳",
    description: "پرداخت از محل تنخواه‌گردان حسابداری (ثبت قبل از پرداخت)",
    code: "OP-03",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "97001", accountName: "اعتبار هزینه تامین شده", ratio: "100%" },
      { type: "credit", accountCode: "96001", accountName: "کنترل اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 4,
    title: "ثبت شماره ۴",
    description: "به هنگام تخصیص اعتبار",
    code: "OP-04",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", ratio: "100%" },
      { type: "credit", accountCode: "92001", accountName: "اعتبار هزینه", ratio: "100%" }
    ]
  },
  {
    id: 5,
    title: "ثبت شماره ۵",
    description: "در صورت دریافت وجه نقد (شامل اعتبار بانکی) و تسویه و پا به پای تنخواه‌گردان حسابداری با اعتبار تخصیص یافته",
    code: "OP-05",
    category: "payments",
    status: "active",
    lines: [
      { type: "debit", accountCode: "96001", accountName: "کنترل اعتبار هزینه", ratio: "100%" },
      { type: "debit", accountCode: "23001", accountName: "پیش دریافت اعتبار هزینه", ratio: "100%" },
      { type: "debit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" },
      { type: "credit", accountCode: "93001", accountName: "اعتبار هزینه تخصیص یافته", ratio: "100%" },
      { type: "credit", accountCode: "41001", accountName: "دریافتی بابت عملیات جاری", ratio: "100%" }
    ]
  },
  {
    id: 6,
    title: "ثبت شماره ۶",
    description: "دریافت وجه نقد (شامل اعتبار بانکی) از محل اعتبار اختصاصی مصوب",
    code: "OP-06",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11003", accountName: "بانک پرداخت اختصاصی", ratio: "100%" },
      { type: "debit", accountCode: "81017", accountName: "حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "100%" },
      { type: "credit", accountCode: "11522", accountName: "مطالبات و خزانه", ratio: "100%" },
      { type: "credit", accountCode: "82017", accountName: "طرف حساب انتظامی - کنترل دریافتی‌ها بابت اعتبار", ratio: "100%" }
    ]
  },
  {
    id: 7,
    title: "ثبت شماره ۷",
    description: "به هنگام دریافت هدایا و کمک‌های نقدی یا محتمل شدن ورود جریان منافع اقتصادی یا توان خدمت‌رسانی آتی (در صورتی که نحوه مصرف وجوه تعیین نشده باشد)",
    code: "OP-07",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11004", accountName: "بانک وجوه سایر منابع", ratio: "100%" },
      { type: "debit", accountCode: "12001", accountName: "حساب ها و اسناد دریافتنی", ratio: "100%" },
      { type: "debit", accountCode: "13001", accountName: "موجودی ملزومات", ratio: "100%" },
      { type: "credit", accountCode: "43001", accountName: "هدایا و کمک‌ها", ratio: "100%" }
    ]
  },
  {
    id: 8,
    title: "ثبت شماره ۸",
    description: "خرید دارایی‌های ثابت مشهود (اثاثه و منصوبات)",
    code: "OP-08",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "15002", accountName: "اثاثه و منصوبات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 9,
    title: "ثبت شماره ۹",
    description: "پرداخت هزینه آب، برق و گاز مصرفی",
    code: "OP-09",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 10,
    title: "ثبت شماره ۱۰",
    description: "پرداخت هزینه تلفن و ارتباطات اداری",
    code: "OP-10",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 11,
    title: "ثبت شماره ۱۱",
    description: "پرداخت اجاره‌بهای ساختمان‌های اداری",
    code: "OP-11",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 12,
    title: "ثبت شماره ۱۲",
    description: "ثبت هزینه بیمه ساختمان و تجهیزات",
    code: "OP-12",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 13,
    title: "ثبت شماره ۱۳",
    description: "پرداخت هزینه‌های حمل و نقل و ایاب و ذهاب",
    code: "OP-13",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 14,
    title: "ثبت شماره ۱۴",
    description: "ثبت هزینه تعمیر و نگهداری ساختمان",
    code: "OP-14",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 15,
    title: "ثبت شماره ۱۵",
    description: "ثبت هزینه تعمیر و نگهداری وسایل نقلیه",
    code: "OP-15",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 16,
    title: "ثبت شماره ۱۶",
    description: "پرداخت هزینه‌های پستی و پیک",
    code: "OP-16",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 17,
    title: "ثبت شماره ۱۷",
    description: "پرداخت هزینه‌های پذیرایی و تشریفات",
    code: "OP-17",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 18,
    title: "ثبت شماره ۱۸",
    description: "ثبت هزینه تبلیغات و اطلاع‌رسانی",
    code: "OP-18",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "21001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 19,
    title: "ثبت شماره ۱۹",
    description: "پرداخت حق‌الزحمه کارشناسان و مشاوران",
    code: "OP-19",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 20,
    title: "ثبت شماره ۲۰",
    description: "ثبت هزینه آموزش و ارتقای کارکنان",
    code: "OP-20",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 21,
    title: "ثبت شماره ۲۱",
    description: "ثبت هزینه خرید کتاب، نشریات و نرم‌افزار",
    code: "OP-21",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 22,
    title: "ثبت شماره ۲۲",
    description: "پرداخت هزینه‌های قضایی و ثبتی",
    code: "OP-22",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 23,
    title: "ثبت شماره ۲۳",
    description: "ثبت هزینه شارژ ساختمان و نظافت",
    code: "OP-23",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 24,
    title: "ثبت شماره ۲۴",
    description: "پرداخت مساعده به کارکنان",
    code: "OP-24",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 25,
    title: "ثبت شماره ۲۵",
    description: "تسویه مساعده از حقوق ماهانه",
    code: "OP-25",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" }
    ]
  },
  {
    id: 26,
    title: "ثبت شماره ۲۶",
    description: "ثبت وام پرداختی به پرسنل",
    code: "OP-26",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 27,
    title: "ثبت شماره ۲۷",
    description: "دریافت اقساط وام پرسنلی",
    code: "OP-27",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" }
    ]
  },
  {
    id: 28,
    title: "ثبت شماره ۲۸",
    description: "ثبت حقوق و مزایای ناخالص کارکنان",
    code: "OP-28",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" }
    ]
  },
  {
    id: 29,
    title: "ثبت شماره ۲۹",
    description: "ثبت کسر حق بیمه سهم کارمند و کارفرما",
    code: "OP-29",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "23%" },
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "7%" },
      { type: "credit", accountCode: "24001", accountName: "بیمه پرداختنی", ratio: "30%" }
    ]
  },
  {
    id: 30,
    title: "ثبت شماره ۳۰",
    description: "ثبت کسر مالیات حقوق و دستمزد",
    code: "OP-30",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "10%" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی", ratio: "10%" }
    ]
  },
  {
    id: 31,
    title: "ثبت شماره ۳۱",
    description: "ثبت سایر کسورات قانونی حقوق",
    code: "OP-31",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "24003", accountName: "سایر کسورات پرداختنی", ratio: "100%" }
    ]
  },
  {
    id: 32,
    title: "ثبت شماره ۳۲",
    description: "پرداخت خالص حقوق و مزایای کارکنان",
    code: "OP-32",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21005", accountName: "حقوق و مزایای پرداختنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 33,
    title: "ثبت شماره ۳۳",
    description: "ثبت ذخیره سنوات خدمت پرسنل (پایان کار)",
    code: "OP-33",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "22001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات غیر مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 34,
    title: "ثبت شماره ۳۴",
    description: "ثبت ذخیره مرخصی استفاده‌نشده کارکنان",
    code: "OP-34",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "22001", accountName: "حساب‌ها و اسناد پرداختنی حاصل از عملیات غیر مبادله ای", ratio: "100%" }
    ]
  },
  {
    id: 35,
    title: "ثبت شماره ۳۵",
    description: "پرداخت علی‌الحساب عیدی و پاداش",
    code: "OP-35",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 36,
    title: "ثبت شماره ۳۶",
    description: "تسویه نهایی عیدی و سنوات پایان سال",
    code: "OP-36",
    category: "salaries",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61001", accountName: "هزینه جبران خدمت کارکنان", ratio: "100%" },
      { type: "credit", accountCode: "11501", accountName: "حساب‌ها و اسناد دریافتنی", ratio: "80%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه (مابه‌التفاوت)", ratio: "20%" }
    ]
  },
  {
    id: 37,
    title: "ثبت شماره ۳۷",
    description: "ثبت درآمد فروش خدمات آموزشی",
    code: "OP-37",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45004", accountName: "درآمدهای حاصل از فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 38,
    title: "ثبت شماره ۳۸",
    description: "ثبت درآمد فروش خدمات مشاوره‌ای",
    code: "OP-38",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45004", accountName: "درآمدهای حاصل از فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 39,
    title: "ثبت شماره ۳۹",
    description: "ثبت درآمد اجاره اماکن و تجهیزات",
    code: "OP-39",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45003", accountName: "درآمدهای حاصل از مالکیت", ratio: "100%" }
    ]
  },
  {
    id: 40,
    title: "ثبت شماره ۴۰",
    description: "دریافت سود سپرده‌های بانکی جاری",
    code: "OP-40",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45006", accountName: "سایر درآمدهای واحد", ratio: "100%" }
    ]
  },
  {
    id: 41,
    title: "ثبت شماره ۴۱",
    description: "دریافت وجوه حاصل از بازیافت اسقاط",
    code: "OP-41",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "45006", accountName: "سایر درآمدهای واحد", ratio: "100%" }
    ]
  },
  {
    id: 42,
    title: "ثبت شماره ۴۲",
    description: "ثبت کسری یا فزونی صندوق",
    code: "OP-42",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61008", accountName: "سایر هزینه‌ها", ratio: "100%" },
      { type: "credit", accountCode: "11024", accountName: "صندوق", ratio: "100%" }
    ]
  },
  {
    id: 43,
    title: "ثبت شماره ۴۳",
    description: "ثبت هزینه‌های بانکی و کارمزد تراکنش‌ها",
    code: "OP-43",
    category: "expenses",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61002", accountName: "هزینه استفاده از کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 44,
    title: "ثبت شماره ۴۴",
    description: "ثبت پیش‌دریافت درآمدها",
    code: "OP-44",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "23003", accountName: "پیش دریافت درآمد", ratio: "100%" }
    ]
  },
  {
    id: 45,
    title: "ثبت شماره ۴۵",
    description: "تسویه پیش‌دریافت با ارائه خدمت",
    code: "OP-45",
    category: "receipts",
    status: "active",
    lines: [
      { type: "debit", accountCode: "23003", accountName: "پیش دریافت درآمد", ratio: "100%" },
      { type: "credit", accountCode: "45004", accountName: "درآمدهای حاصل از فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 46,
    title: "ثبت شماره ۴۶",
    description: "ثبت مالیات بر ارزش افزوده خرید",
    code: "OP-46",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11519", accountName: "مالیات و عوارض ارزش افزوده خرید کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11001", accountName: "بانک پرداخت هزینه", ratio: "100%" }
    ]
  },
  {
    id: 47,
    title: "ثبت شماره ۴۷",
    description: "ثبت مالیات بر ارزش افزوده فروش",
    code: "OP-47",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "11007", accountName: "بانک دریافت", ratio: "100%" },
      { type: "credit", accountCode: "21010", accountName: "مالیات و عوارض ارزش افزوده فروش کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 48,
    title: "ثبت شماره ۴۸",
    description: "ثبت تهاتر مالیات ارزش افزوده خرید و فروش",
    code: "OP-48",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "21010", accountName: "مالیات و عوارض ارزش افزوده فروش کالا و خدمات", ratio: "100%" },
      { type: "credit", accountCode: "11519", accountName: "مالیات و عوارض ارزش افزوده خرید کالا و خدمات", ratio: "100%" }
    ]
  },
  {
    id: 49,
    title: "ثبت شماره ۴۹",
    description: "ثبت ذخیره مالیات بر درآمد عملکرد سالانه",
    code: "OP-49",
    category: "taxes",
    status: "active",
    lines: [
      { type: "debit", accountCode: "61008", accountName: "سایر هزینه‌ها", ratio: "100%" },
      { type: "credit", accountCode: "24004", accountName: "مالیات پرداختنی", ratio: "100%" }
    ]
  }
];

export default function CurrentOperations() {
  const today = new Date().toLocaleDateString("fa-IR").replace(/\//g, "/");

  // لیست اسناد ثبت شده توسط کاربر از روی الگوها
  const [postedDocuments, setPostedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("document_number");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal جزئیات سند ثبت شده
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Modal صدور سند با الگو و ویزارد
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedWizardTemplateId, setSelectedWizardTemplateId] = useState("");
  const [postingTemplate, setPostingTemplate] = useState(null);
  const [lineAmounts, setLineAmounts] = useState({}); // ساختار: { [idx]: "1,000,000" }
  const [postFields, setPostFields] = useState({
    fiscalYear: "1405",
    documentDate: today,
    description: "",
    documentType: "GENERAL_PAYMENT"
  });
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingMessage, setPostingMessage] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]);

  // وضعیت دراپ‌داون سفارشی
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  // دریافت اسناد ثبت شده توسط الگوها از بک‌اند
  const fetchPostedDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/documents");
      if (res.data?.data) {
        // فیلتر کردن اسنادی که ویژگی is_template_derived دارند
        const list = res.data.data.filter(doc => doc.is_template_derived === true);
        setPostedDocuments(list);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("خطا در دریافت لیست اسناد صادرشده از بک‌‌اند.");
    } finally {
      setLoading(false);
    }
  }, []);

  // بارگیری دوره‌های مالی و اسناد در ابتدای لود کامپوننت
  useEffect(() => {
    async function loadFiscalYears() {
      try {
        const res = await api.get("/api/fiscal-years");
        if (res.data?.success) {
          const list = res.data.data || [];
          setFiscalYears(list);
          if (list.length > 0) {
            setPostFields(p => ({
              ...p,
              fiscalYear: String(list[0].year)
            }));
          }
        }
      } catch (err) {
        console.error("Error loading fiscal years:", err);
      }
    }
    loadFiscalYears();
    fetchPostedDocuments();
  }, [fetchPostedDocuments]);

  // مرتب‌سازی جدول
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  // حذف سند ثبت شده
  const handleDeleteDoc = async (id, docNumber) => {
    if (!window.confirm(`آیا از حذف سند صادر شده به شماره ${docNumber} مطمئن هستید؟`)) return;
    try {
      await api.delete(`/api/documents/${id}`);
      fetchPostedDocuments();
    } catch (err) {
      console.error("Delete document error:", err);
      alert("خطا در حذف سند مالی. مجدداً تلاش کنید.");
    }
  };

  // فیلتر و جستجوی اسناد ثبت شده
  const filteredDocuments = useMemo(() => {
    let result = [...postedDocuments];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        d =>
          d.document_number?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.template_title?.toLowerCase().includes(q) ||
          String(d.fiscal_year).includes(q)
      );
    }

    // مرتب‌سازی نهایی
    result.sort((a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDir === "asc" ? valA - valB : valB - valA;
      }
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB), "fa")
        : String(valB).localeCompare(String(valA), "fa");
    });

    return result;
  }, [postedDocuments, search, sortBy, sortDir]);

  // محاسبه رکوردهای صفحه جاری
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;

  // تغییر مبلغ خط بر اساس ماهیت
  const handleLineAmountChange = (idx, value) => {
    let raw = value.replace(/\D/g, "");
    let formatted = "";
    if (raw) {
      formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    setLineAmounts(prev => ({
      ...prev,
      [idx]: formatted
    }));
  };

  // محاسبه پویای جمع بدهکار، جمع بستانکار و اختلاف سند
  const totals = useMemo(() => {
    if (!postingTemplate) return { debit: 0, credit: 0, diff: 0 };
    let debit = 0;
    let credit = 0;
    postingTemplate.lines.forEach((line, idx) => {
      const valStr = lineAmounts[idx] || "";
      const val = parseFloat(valStr.replace(/,/g, "")) || 0;
      if (line.type === "debit") {
        debit += val;
      } else {
        credit += val;
      }
    });
    return {
      debit,
      credit,
      diff: debit - credit
    };
  }, [postingTemplate, lineAmounts]);

  // باز کردن مودال ثبت سند با الگو به صورت مرکزی (انتخاب الگو توسط کاربر)
  const openPostWizard = () => {
    setPostingTemplate(null);
    setSelectedWizardTemplateId("");
    setLineAmounts({});
    setPostFields({
      fiscalYear: fiscalYears.length > 0 ? String(fiscalYears[0].year) : "1405",
      documentDate: today,
      description: "",
      documentType: "GENERAL_PAYMENT"
    });
    setIsDropdownOpen(false);
    setPostingMessage(null);
    setPostingLoading(false);
    setIsPostModalOpen(true);
  };

  // هندلر تغییر انتخاب الگو در ویزارد
  const handleWizardTemplateSelect = (tpl) => {
    setSelectedWizardTemplateId(String(tpl.id));
    setPostingTemplate(tpl);
    const initialAmounts = {};
    tpl.lines.forEach((_, idx) => {
      initialAmounts[idx] = "";
    });
    setLineAmounts(initialAmounts);
    setPostFields(p => ({
      ...p,
      description: `ثبت سند بابت ${tpl.description}`
    }));
    setIsDropdownOpen(false);
    setDropdownSearch("");
  };

  // ارسال سند جدید صادر شده با الگو به دیتابیس بک‌اند
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postingTemplate) return;
    if (totals.debit <= 0 || totals.credit <= 0) {
      setPostingMessage({ type: "error", text: "لطفاً مبالغ بدهکار و بستانکار را وارد کنید." });
      return;
    }
    if (totals.diff !== 0) {
      setPostingMessage({ type: "error", text: "سند تراز نیست! اختلاف بدهکار و بستانکار باید صفر باشد." });
      return;
    }

    setPostingLoading(true);
    setPostingMessage(null);

    try {
      // ساخت ردیف‌های مالی بر اساس مبالغ ردیفی وارد شده
      const parsedLines = postingTemplate.lines.map((line, idx) => {
        const valStr = lineAmounts[idx] || "";
        const val = parseFloat(valStr.replace(/,/g, "")) || 0;

        const code = line.accountCode;
        const group = code.charAt(0);
        const account = group === "9" ? code.substring(0, 2) : code.substring(0, 3);

        return {
          id: Date.now() + Math.random(),
          group,
          account,
          subAccount: code,
          account_name: line.accountName,
          debit: line.type === "debit" ? String(val) : "0",
          credit: line.type === "credit" ? String(val) : "0",
          desc: `${line.type === "debit" ? "بدهکار" : "بستانکار"} بابت ${postingTemplate.description}`
        };
      });

      const sensitiveState = {
        header: {
          fiscalYear: String(postFields.fiscalYear),
          docNo: "",
          docDate: postFields.documentDate,
          docType: "موقت",
          access: "عادی",
          desc: postFields.description,
          letterNo: "",
          letterDate: "",
          status: "صدور سند",
        },
        rows: parsedLines
      };

      // رمزنگاری متقارن اطلاعات سند بر اساس الگوریتم کلاینت پروژه
      const encryptedHex = await encrypt(JSON.stringify(sensitiveState));

      const payload = {
        document_type: postFields.documentType,
        fiscal_year: Number(postFields.fiscalYear) || 1405,
        status: "DRAFT",
        ciphertext: encryptedHex,
        is_template_derived: true,
        template_id: postingTemplate.id,
        template_title: postingTemplate.title,
      };

      const res = await api.post("/api/documents", payload);
      const docNum = res.data?.data?.document_number || "سند صادر شده";

      setPostingMessage({
        type: "success",
        text: `سند حسابداری با شماره «${docNum}» با موفقیت در دیتابیس بک‌اند ثبت گردید.`
      });

      // بارگیری مجدد لیست اسناد ثبت شده
      fetchPostedDocuments();

      // بستن مودال پس از ۱.۵ ثانیه موفقیت
      setTimeout(() => {
        setIsPostModalOpen(false);
      }, 1500);

    } catch (err) {
      console.error("Error posting template document:", err);
      setPostingMessage({
        type: "error",
        text: err.response?.data?.message || "خطا در برقراری ارتباط با سرور یا ذخیره‌سازی اطلاعات."
      });
    } finally {
      setPostingLoading(false);
    }
  };

  return (
    <PageShell>
      {/* هدر صفحه */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            حسابداری عملیات جاری
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">لیست اسناد مالی صادر شده با استفاده از الگوهای ثبت جاری سیستم</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={openPostWizard} className="gap-1.5 h-9 text-xs bg-green-600 hover:bg-green-700 text-white font-bold">
            <FileText className="h-4 w-4" />
            ثبت الگوی سند
          </Button>
        </div>
      </div>

      {/* نوار جستجو و فیلتر */}
      <Card className="mb-4">
        <CardContent className="p-3" dir="rtl">
          <div className="flex items-center gap-3 flex-wrap">
            {/* جستجو */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder="جستجو در شماره سند، عنوان الگو، شرح سند یا دوره مالی..."
                className="h-9 text-xs pr-9"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {search && (
              <Button variant="ghost" size="sm" onClick={() => setSearch("")} className="gap-1 h-9 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" />
                پاکسازی فیلتر
              </Button>
            )}

            <span className="text-xs text-muted-foreground bg-muted rounded-full px-3 py-1 font-mono mr-auto">
              {(filteredDocuments.length).toLocaleString("fa-IR")} سند یافت شد
            </span>
          </div>
        </CardContent>
      </Card>

      {/* جدول نمایش اسناد ثبت شده */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th onClick={() => handleSort("document_number")} className="px-4 py-3 text-right text-xs font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground">
                    <div className="flex items-center gap-1">
                      <span>شماره سند</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th onClick={() => handleSort("template_title")} className="px-4 py-3 text-right text-xs font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground">
                    <div className="flex items-center gap-1">
                      <span>الگوی مرجع</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground">شرح سند</th>
                  <th onClick={() => handleSort("fiscal_year")} className="px-4 py-3 text-right text-xs font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground w-20">
                    <div className="flex items-center gap-1">
                      <span>دوره مالی</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground w-28">تاریخ سند</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-blue-600 w-32">مبلغ کل (ریال)</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground w-24">وضعیت</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground w-24">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p>در حال بارگیری اسناد از دیتابیس...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                        <p>هیچ سندی با استفاده از الگوها صادر نشده است.</p>
                        <p className="text-xs text-muted-foreground/60">جهت صدور سند جدید، روی دکمه «ثبت الگوی سند» در بالای صفحه کلیک کنید.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((doc) => {
                    const totalDebit = doc.lines?.reduce((s, l) => s + (l.debit ?? 0), 0) ?? 0;
                    return (
                      <tr key={doc._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        {/* شماره سند */}
                        <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">
                          {doc.document_number}
                        </td>

                        {/* الگوی مرجع */}
                        <td className="px-4 py-3 font-semibold text-primary">
                          {doc.template_title || "الگوی سیستمی"}
                        </td>

                        {/* شرح سند */}
                        <td className="px-4 py-3 text-sm text-foreground/80 font-medium max-w-xs truncate" title={doc.description}>
                          {doc.description}
                        </td>

                        {/* دوره مالی */}
                        <td className="px-4 py-3 font-mono text-xs text-center">
                          {doc.fiscal_year}
                        </td>

                        {/* تاریخ سند */}
                        <td className="px-4 py-3 text-xs text-foreground/80">
                          {doc.document_date ? toPersianDigits(doc.document_date) : "—"}
                        </td>

                        {/* مبلغ کل */}
                        <td className="px-4 py-3 font-mono text-xs text-blue-700 font-bold">
                          {totalDebit.toLocaleString("fa-IR")}
                        </td>

                        {/* وضعیت */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[doc.status] || "bg-muted"}`}>
                            {STATUS_LABEL[doc.status] || doc.status}
                          </span>
                        </td>

                        {/* عملیات */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                              title="مشاهده جزئیات آرتیکل‌ها"
                              onClick={() => setSelectedDocument(doc)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-600 rounded-lg"
                              title="حذف سند"
                              onClick={() => handleDeleteDoc(doc._id, doc.document_number)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* صفحه‌بندی */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="border-t p-3 flex items-center justify-between flex-wrap gap-2" dir="rtl">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}</span>
                <span>•</span>
                <span>تعداد در صفحه:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="border rounded px-1.5 py-0.5 bg-background focus:outline-none text-xs"
                >
                  {[5, 10, 15, 25, 50].map(size => (
                    <option key={size} value={size}>{size.toLocaleString("fa-IR")}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <Button
                      key={pNum}
                      variant={currentPage === pNum ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 rounded-lg text-xs"
                      onClick={() => setCurrentPage(pNum)}
                    >
                      {pNum.toLocaleString("fa-IR")}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* مودال ثبت سند با الگو (ویزارد مرکزی) */}
      <AnimatePresence>
        {isPostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => { setIsPostModalOpen(false); setIsDropdownOpen(false); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-2xl rounded-2xl border bg-background shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <form onSubmit={handlePostSubmit} className="flex flex-col overflow-hidden">
                {/* هدر مودال */}
                <div className="flex items-center justify-between border-b px-5 py-4 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-foreground">ثبت الگوی سند</h2>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                        {postingTemplate 
                          ? `${postingTemplate.title}`
                          : "انتخاب الگوی سند حسابداری و تکمیل مقادیر"
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsPostModalOpen(false); setIsDropdownOpen(false); }}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* بدنه مودال */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                  {postingMessage && (
                    <div
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${
                        postingMessage.type === "success"
                          ? "border-green-200 bg-green-50 text-green-800 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/50"
                          : "border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50"
                      }`}
                    >
                      {postingMessage.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span>{postingMessage.text}</span>
                    </div>
                  )}

                  {/* دراپ‌داون سفارشی برای انتخاب الگو */}
                  <div className="space-y-1.5 border-b pb-4 relative">
                    <Label className="text-xs font-bold text-foreground">
                      انتخاب الگوی ثبت حسابداری (ثبت‌های ۱ تا ۴۹)
                    </Label>
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full h-10 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring/30 font-semibold flex items-center justify-between transition-all hover:bg-muted/10 text-right"
                      >
                        <span className={postingTemplate ? "text-foreground" : "text-muted-foreground"}>
                          {postingTemplate 
                            ? `${postingTemplate.title} - ${postingTemplate.description}` 
                            : "-- لطفاً یک الگوی ثبت انتخاب کنید --"
                          }
                        </span>
                        <span className="text-muted-foreground mr-2 text-[10px]">▼</span>
                      </button>

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <>
                            {/* کلیک در خارج برای بستن */}
                            <div 
                              className="fixed inset-0 z-25" 
                              onClick={() => { setIsDropdownOpen(false); setDropdownSearch(""); }} 
                            />
                            
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 left-0 mt-1.5 z-30 max-h-60 overflow-y-auto rounded-lg border bg-background shadow-2xl p-1.5 space-y-0.5 border-primary/10"
                            >
                              {/* سرچ باکس دراپ‌داون */}
                              <div className="sticky top-0 bg-background pb-1.5 border-b mb-1 px-1 pt-1 z-10 flex items-center">
                                <div className="relative w-full">
                                  <Input
                                    value={dropdownSearch}
                                    onChange={(e) => setDropdownSearch(e.target.value)}
                                    placeholder="جستجو در بین الگوها..."
                                    className="h-8 text-xs pr-8"
                                    dir="rtl"
                                    autoFocus
                                  />
                                  <Search className="absolute right-2.5 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
                                </div>
                              </div>

                              {/* لیست گزینه‌ها */}
                              {INITIAL_TEMPLATES
                                .filter((t) => t.status === "active")
                                .filter((t) => {
                                  if (!dropdownSearch.trim()) return true;
                                  const q = dropdownSearch.toLowerCase();
                                  return (
                                    t.title.toLowerCase().includes(q) ||
                                    t.description.toLowerCase().includes(q)
                                  );
                                })
                                .map((t) => {
                                  const isSelected = String(t.id) === String(selectedWizardTemplateId);
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => handleWizardTemplateSelect(t)}
                                      className={`w-full text-right px-3 py-2 text-xs rounded-md transition-all flex items-center justify-between ${
                                        isSelected 
                                          ? "bg-primary text-primary-foreground font-bold" 
                                          : "hover:bg-muted text-foreground/80 hover:text-foreground"
                                      }`}
                                    >
                                      <span>{t.title} - {t.description}</span>
                                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                                    </button>
                                  );
                                })}

                              {INITIAL_TEMPLATES.filter((t) => t.status === "active").filter((t) => {
                                if (!dropdownSearch.trim()) return true;
                                const q = dropdownSearch.toLowerCase();
                                return (
                                  t.title.toLowerCase().includes(q) ||
                                  t.description.toLowerCase().includes(q)
                                );
                              }).length === 0 && (
                                <div className="py-8 text-center text-muted-foreground text-xs font-medium">
                                  الگویی با این مشخصات یافت نشد.
                                </div>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* در صورت عدم انتخاب الگو */}
                  {!postingTemplate ? (
                    <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-3">
                      <Layers className="h-10 w-10 opacity-30 text-foreground animate-pulse" />
                      <p className="font-semibold text-foreground/75">لطفاً ابتدا یک الگوی ثبت از لیست بالا انتخاب کنید تا جزئیات و ردیف‌های مالی آن بارگذاری شوند.</p>
                    </div>
                  ) : (
                    <>
                      {/* اطلاعات کلی سند */}
                      <div className="grid grid-cols-2 gap-4 border p-4 rounded-2xl bg-muted/10">
                        <div className="space-y-1">
                          <Label htmlFor="fiscalYear" className="text-xs font-semibold">دوره مالی</Label>
                          <select
                            id="fiscalYear"
                            value={postFields.fiscalYear}
                            onChange={e => setPostFields(p => ({ ...p, fiscalYear: e.target.value }))}
                            className="w-full h-9 text-xs rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring/30"
                          >
                            {fiscalYears.map((fy) => (
                              <option key={fy._id} value={String(fy.year)}>{fy.year}</option>
                            ))}
                            {fiscalYears.length === 0 && (
                              <option value="1405">۱۴۰۵</option>
                            )}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold">تاریخ سند</Label>
                          <PersianDatePicker
                            value={postFields.documentDate}
                            onChange={e => setPostFields(p => ({ ...p, documentDate: e.target.value }))}
                            className="h-9 text-xs"
                          />
                        </div>

                        <div className="col-span-2 space-y-1">
                          <Label htmlFor="postDescription" className="text-xs font-semibold">شرح سند</Label>
                          <Input
                            id="postDescription"
                            required
                            value={postFields.description}
                            onChange={e => setPostFields(p => ({ ...p, description: e.target.value }))}
                            placeholder="شرح سند را وارد کنید..."
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {/* جدول آرتیکل‌های قفل شده بدهکار/بستانکار با فیلد ورود مبلغ ردیفی بر اساس ماهیت */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ردیف‌های حسابداری سند (قفل شده)</h3>
                          <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                            مبلغ را متناسب با ماهیت حساب وارد کنید
                          </Badge>
                        </div>
                        <div className="rounded-xl border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-muted/40">
                                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground w-20">ماهیت</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground w-24">کد معین</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">نام حساب معین</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-blue-600 w-36">بدهکار (ریال)</th>
                                <th className="px-3 py-2.5 text-right font-semibold text-rose-600 w-36">بستانکار (ریال)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {postingTemplate.lines.map((line, idx) => {
                                const isDebit = line.type === "debit";
                                const value = lineAmounts[idx] || "";

                                return (
                                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                    {/* ماهیت */}
                                    <td className="px-3 py-2.5">
                                      <Badge
                                        variant="outline"
                                        className={
                                          isDebit
                                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400"
                                            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400"
                                        }
                                      >
                                        {isDebit ? "بدهکار" : "بستانکار"}
                                      </Badge>
                                    </td>

                                    {/* کد معین */}
                                    <td className="px-3 py-2.5 font-mono text-foreground font-semibold">{line.accountCode}</td>

                                    {/* نام حساب */}
                                    <td className="px-3 py-2.5 text-foreground/80 font-medium">{line.accountName}</td>

                                    {/* بدهکار */}
                                    <td className="px-3 py-2 text-right">
                                      {isDebit ? (
                                        <Input
                                          value={value}
                                          onChange={(e) => handleLineAmountChange(idx, e.target.value)}
                                          placeholder="مبلغ بدهکار..."
                                          className="h-8 text-xs font-semibold font-mono text-right text-blue-700 border-primary/20 w-full"
                                          dir="ltr"
                                        />
                                      ) : (
                                        <span className="text-muted-foreground/30 font-semibold px-2">—</span>
                                      )}
                                    </td>

                                    {/* بستانکار */}
                                    <td className="px-3 py-2 text-right">
                                      {!isDebit ? (
                                        <Input
                                          value={value}
                                          onChange={(e) => handleLineAmountChange(idx, e.target.value)}
                                          placeholder="مبلغ بستانکار..."
                                          className="h-8 text-xs font-semibold font-mono text-right text-rose-700 border-primary/20 w-full"
                                          dir="ltr"
                                        />
                                      ) : (
                                        <span className="text-muted-foreground/30 font-semibold px-2">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* خلاصه تراز سند */}
                        <div className="flex items-center justify-between border p-3 rounded-xl bg-muted/20 text-xs mt-3">
                          <div className="flex gap-4">
                            <span className="text-muted-foreground">
                              جمع بدهکار: <span className="font-bold text-blue-700">{(totals.debit).toLocaleString("fa-IR")} ریال</span>
                            </span>
                            <span className="text-muted-foreground">
                              جمع بستانکار: <span className="font-bold text-rose-700">{(totals.credit).toLocaleString("fa-IR")} ریال</span>
                            </span>
                          </div>
                          <span className={`font-bold ${totals.diff === 0 && totals.debit > 0 ? "text-green-600" : "text-rose-600"}`}>
                            {totals.diff === 0 && totals.debit > 0 ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                سند تراز است
                              </span>
                            ) : (
                              <span>اختلاف تراز: {(Math.abs(totals.diff)).toLocaleString("fa-IR")} ریال</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* فوتر مودال */}
                <div className="border-t px-5 py-3 bg-muted/20 flex justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setIsPostModalOpen(false); setIsDropdownOpen(false); }}
                    disabled={postingLoading}
                    className="text-xs"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold"
                    disabled={postingLoading || !postingTemplate || totals.debit <= 0 || totals.diff !== 0}
                  >
                    <Save className="h-3.5 w-3.5 ml-1" />
                    {postingLoading ? "در حال ثبت..." : "ثبت و ارسال به دیتابیس"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* مودال مشاهده جزئیات سند ثبت شده */}
      <AnimatePresence>
        {selectedDocument && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedDocument(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-background shadow-2xl flex flex-col"
            >
              {/* هدر مودال */}
              <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/30 rounded-t-2xl shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">جزئیات سند صادر شده از الگو</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedDocument.document_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* متادیتا */}
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-b bg-muted/10 shrink-0 text-xs">
                {[
                  { label: "شماره سند", value: selectedDocument.document_number, mono: true },
                  { label: "الگوی مرجع", value: selectedDocument.template_title || "الگوی پیش‌فرض" },
                  { label: "دوره مالی", value: selectedDocument.fiscal_year, mono: true },
                  { label: "تاریخ سند", value: selectedDocument.document_date ? toPersianDigits(selectedDocument.document_date) : "—" },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
                    <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</span>
                  </div>
                ))}
                <div className="col-span-4 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground">شرح سند</span>
                  <span className="text-sm text-foreground">{selectedDocument.description || "—"}</span>
                </div>
              </div>

              {/* ردیف‌های سند */}
              <div className="px-6 py-4 flex-1 overflow-y-auto">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  ردیف‌های آرتیکل مالی ({selectedDocument.lines?.length ?? 0} ردیف)
                </p>
                
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-xs" dir="rtl">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground w-10">#</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground w-28">کد حساب معین</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">نام حساب معین</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-blue-600 w-36">بدهکار (ریال)</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-rose-600 w-36">بستانکار (ریال)</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">شرح ردیف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedDocument.lines || []).map((line, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2.5 text-center text-muted-foreground/60">{i + 1}</td>
                          <td className="px-3 py-2.5 font-mono text-foreground font-semibold">{line.account_code || "—"}</td>
                          <td className="px-3 py-2.5 text-foreground/80 font-medium">{line.account_name || "—"}</td>
                          <td className="px-3 py-2.5 font-mono text-blue-700 font-bold">
                            {line.debit ? line.debit.toLocaleString("fa-IR") : "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-rose-700 font-bold">
                            {line.credit ? line.credit.toLocaleString("fa-IR") : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{line.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* فوتر */}
              <div className="border-t px-6 py-3 bg-muted/20 rounded-b-2xl shrink-0 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setSelectedDocument(null)} className="text-xs">
                  بستن
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
