// ─── مدیریت نقش‌ها و امضاکنندگان ماژول‌های ۶گانه سیستم ─────────────────────────────

export const SYSTEM_MODULES = [
  {
    key: "accounting",
    title: "حسابداری بخش عمومی",
    icon: "BookOpen",
    roles: [
      { id: "exec_head", title: "رئیس دستگاه اجرایی", defaultSlot: 3 },
      { id: "fin_manager_auditor", title: "مدیر مالی و ذیحساب", defaultSlot: 3 },
      { id: "fin_head", title: "رئیس امور مالی", defaultSlot: 2 },
      { id: "acct_drafter", title: "تنظیم حساب", defaultSlot: 1 },
      { id: "accountant", title: "حسابدار", defaultSlot: 1 }
    ]
  },
  {
    key: "warehouse",
    title: "سیستم انبار",
    icon: "Warehouse",
    roles: [
      { id: "exec_head", title: "رئیس دستگاه اجرایی", defaultSlot: 3 },
      { id: "fin_manager_auditor", title: "مدیرمالی و ذیحساب", defaultSlot: 3 },
      { id: "fin_head", title: "رئیس امور مالی", defaultSlot: 2 },
      { id: "acct_drafter", title: "تنظیم حساب", defaultSlot: 1 },
      { id: "storekeeper", title: "انباردار", defaultSlot: 1 }
    ]
  },
  {
    key: "assets",
    title: "سیستم اموال",
    icon: "Building2",
    roles: [
      { id: "exec_head", title: "رئیس دستگاه اجرایی", defaultSlot: 3 },
      { id: "fin_manager_auditor", title: "مدیرمالی و ذیحساب", defaultSlot: 3 },
      { id: "fin_head", title: "رئیس امور مالی", defaultSlot: 2 },
      { id: "acct_drafter", title: "تنظیم حساب", defaultSlot: 1 },
      { id: "asset_specialist", title: "کارشناس اموال", defaultSlot: 1 }
    ]
  },
  {
    key: "payroll",
    title: "حسابداری حقوق و دستمزد",
    icon: "Calculator",
    roles: [
      { id: "exec_head", title: "رئیس دستگاه اجرایی", defaultSlot: 3 },
      { id: "fin_manager_auditor", title: "مدیر مالی و ذیحساب", defaultSlot: 3 },
      { id: "fin_head", title: "رئیس امور مالی", defaultSlot: 2 },
      { id: "acct_drafter", title: "تنظیم حساب", defaultSlot: 1 },
      { id: "payroll_specialist", title: "کارشناس حقوق و دستمزد", defaultSlot: 1 }
    ]
  },
  {
    key: "current_credits",
    title: "حسابداری اعتبارات جاری",
    icon: "Coins",
    roles: [
      { id: "exec_head", title: "رئیس دستگاه اجرایی", defaultSlot: 3 },
      { id: "fin_manager_auditor", title: "مدیر مالی و ذیحساب", defaultSlot: 3 },
      { id: "fin_head", title: "رئیس امور مالی", defaultSlot: 2 },
      { id: "acct_drafter", title: "تنظیم حساب", defaultSlot: 1 },
      { id: "current_credits_specialist", title: "کارشناس اعتبارات جاری", defaultSlot: 1 }
    ]
  },
  {
    key: "capital_credits",
    title: "حسابداری اعتبارات تملک دارایی‌های سرمایه‌ای",
    icon: "Landmark",
    roles: [
      { id: "exec_head", title: "رئیس دستگاه اجرایی", defaultSlot: 3 },
      { id: "fin_manager_auditor", title: "مدیر مالی و ذیحساب", defaultSlot: 3 },
      { id: "fin_head", title: "رئیس امور مالی", defaultSlot: 2 },
      { id: "acct_drafter", title: "تنظیم حساب", defaultSlot: 1 },
      { id: "capital_credits_specialist", title: "کارشناس اعتبارات تملک دارایی‌های سرمایه‌ای", defaultSlot: 1 }
    ]
  }
];

export const SYSTEM_ROLE_PRESETS = {
  "admin": { label: "مدیر سیستم (فول اکسس)", isFullAccess: true, excludeFromPrint: true },
  "مدیر سیستم": { label: "مدیر سیستم (فول اکسس)", isFullAccess: true, excludeFromPrint: true },
  "رئیس دستگاه اجرایی": { label: "رئیس دستگاه اجرایی", isFullAccess: false, excludeFromPrint: false },
  "مدیر مالی و ذیحساب": { label: "مدیر مالی و ذیحساب", isFullAccess: false, excludeFromPrint: false },
  "رئیس امور مالی": { label: "رئیس امور مالی", isFullAccess: false, excludeFromPrint: false },
  "تنظیم حساب": { label: "تنظیم حساب", isFullAccess: false, excludeFromPrint: false },
  "حسابدار": { label: "حسابدار", isFullAccess: false, excludeFromPrint: false },
  "انباردار": { label: "انباردار", isFullAccess: false, excludeFromPrint: false },
  "کارشناس اموال": { label: "کارشناس اموال", isFullAccess: false, excludeFromPrint: false },
  "کارشناس حقوق و دستمزد": { label: "کارشناس حقوق و دستمزد", isFullAccess: false, excludeFromPrint: false },
  "کارشناس اعتبارات جاری": { label: "کارشناس اعتبارات جاری", isFullAccess: false, excludeFromPrint: false },
  "کارشناس اعتبارات تملک دارایی‌های سرمایه‌ای": { label: "کارشناس اعتبارات تملک دارایی‌های سرمایه‌ای", isFullAccess: false, excludeFromPrint: false },
  "پشتیبانی / کاربر پیشرفته": { label: "پشتیبانی / کاربر پیشرفته", isFullAccess: false, excludeFromPrint: false },
  "کاربر عادی": { label: "کاربر عادی", isFullAccess: false, excludeFromPrint: false }
};

/**
 * آیا کاربر مدیر سیستم است؟ (دارای دسترسی فول اکسس به تمام بخش‌ها)
 */
export function isUserSystemAdmin(user) {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  const username = (user.username || "").toLowerCase();
  return role === "admin" || role === "مدیر سیستم" || username === "admin";
}

/**
 * دریافت تنظیمات امضاکنندگان و کاربران مسئول یک ماژول
 * تضمین می‌کند که مدیر سیستم به طور خودکار در امضاها درج نشود.
 */
export function getModuleSignatures(moduleKey) {
  try {
    const raw = localStorage.getItem(`module_signatures_${moduleKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // فیلتر کردن امضاکنندگانی که نقش مدیر سیستم دارند و نباید در چاپ بیایند مگر آنکه صراحتاً تخصیص یافته باشند
      return parsed.filter(sig => !sig.isSystemAdmin || sig.userId);
    }
  } catch (e) {
    console.error("Error reading module signatures:", e);
  }

  // در صورت عدم وجود تنظیم اختصاصی، لیست نقش‌های پیش‌فرض همان ماژول برمی‌گردد
  const moduleDef = SYSTEM_MODULES.find(m => m.key === moduleKey);
  if (!moduleDef) return [];

  return moduleDef.roles.map(r => ({
    roleId: r.id,
    roleTitle: r.title,
    userName: "",
    signatureImage: null,
    stampImage: null,
    slot: r.defaultSlot || 1,
    isActive: true
  }));
}

/**
 * ذخیره تنظیمات امضاکنندگان یک ماژول
 */
export function saveModuleSignatures(moduleKey, signatures) {
  try {
    localStorage.setItem(`module_signatures_${moduleKey}`, JSON.stringify(signatures));
  } catch (e) {
    console.error("Error saving module signatures:", e);
  }
}

/**
 * تولید HTML امضاها جهت درج پای خروجی چاپی اسناد و گزارشات یک ماژول
 */
export function renderModuleSignatureBlockHTML(moduleKey) {
  const sigs = getModuleSignatures(moduleKey).filter(s => s.isActive && s.userName);
  if (!sigs || sigs.length === 0) return "";

  const slot1 = sigs.filter(s => (s.slot || 1) === 1);
  const slot2 = sigs.filter(s => s.slot === 2);
  const slot3 = sigs.filter(s => s.slot === 3);

  const renderSlotItems = (items) => {
    if (!items || items.length === 0) return "<div></div>";
    return items.map(item => `
      <div style="text-align: center; font-size: 11px; font-family: Tahoma, sans-serif; min-width: 140px;">
        <div style="font-weight: bold; color: #1e293b; margin-bottom: 2px;">${item.roleTitle}</div>
        <div style="color: #334155; font-size: 10px;">${item.userName}</div>
        <div style="min-height: 45px; display: flex; align-items: center; justify-content: center; margin-top: 4px;">
          ${item.signatureImage ? `<img src="${item.signatureImage}" style="max-height: 40px; max-width: 120px; object-fit: contain;" alt="امضا"/>` : ''}
          ${item.stampImage ? `<img src="${item.stampImage}" style="max-height: 35px; max-width: 60px; object-fit: contain; margin-right: 4px;" alt="مهر"/>` : ''}
        </div>
      </div>
    `).join('');
  };

  return `
    <div style="margin-top: 25px; padding-top: 12px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; direction: rtl;" class="module-signature-block">
      <div style="display: flex; gap: 15px;">${renderSlotItems(slot1)}</div>
      <div style="display: flex; gap: 15px;">${renderSlotItems(slot2)}</div>
      <div style="display: flex; gap: 15px;">${renderSlotItems(slot3)}</div>
    </div>
  `;
}
