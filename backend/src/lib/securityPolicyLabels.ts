/**
 * نقشه‌برداری جامع عناوین آکاردئون‌ها و آیتم‌های تنظیمات امنیتی افتا جهت ثبت لاگ تفکیکی
 */

export interface PolicyFieldMeta {
  accordion: string;
  label: string;
  type?: "boolean" | "number" | "string" | "array";
}

export const SECURITY_POLICY_LABELS: Record<string, Record<string, PolicyFieldMeta>> = {
  passwordPolicy: {
    minLength: { accordion: "خط‌مشی رمز عبور و پیچیدگی گذرواژه‌ها", label: "حداقل طول گذرواژه", type: "number" },
    requireUppercase: { accordion: "خط‌مشی رمز عبور و پیچیدگی گذرواژه‌ها", label: "الزام وجود حروف بزرگ انگلیسی (A-Z)", type: "boolean" },
    requireLowercase: { accordion: "خط‌مشی رمز عبور و پیچیدگی گذرواژه‌ها", label: "الزام وجود حروف کوچک انگلیسی (a-z)", type: "boolean" },
    requireNumbers: { accordion: "خط‌مشی رمز عبور و پیچیدگی گذرواژه‌ها", label: "الزام وجود ارقام و اعداد (0-9)", type: "boolean" },
    requireSpecialChars: { accordion: "خط‌مشی رمز عبور و پیچیدگی گذرواژه‌ها", label: "الزام وجود نمادها و کاراکترهای خاص (!@#$%^&*)", type: "boolean" }
  },

  lockoutPolicy: {
    maxFailedAttempts: { accordion: "قوانین قفل‌شدن حساب کاربری و ممانعت از ورود", label: "حداکثر تعداد تلاش‌های ناموفق ورود مجاز", type: "number" },
    lockoutDurationMinutes: { accordion: "قوانین قفل‌شدن حساب کاربری و ممانعت از ورود", label: "مدت زمان قفل‌شدن حساب (دقیقه)", type: "number" }
  },

  sessionPolicy: {
    tokenExpiresInHours: { accordion: "مدیریت نشست‌های فعال کاربران و انقضا", label: "مدت اعتبار توکن نشست (ساعت)", type: "number" },
    maxConcurrentSessions: { accordion: "مدیریت نشست‌های فعال کاربران و انقضا", label: "حداکثر تعداد نشست‌های همزمان مجاز", type: "number" },
    idleTimeoutMinutes: { accordion: "مدیریت نشست‌های فعال کاربران و انقضا", label: "زمان خاتمه خودکار نشست در صورت عدم فعالیت (دقیقه)", type: "number" }
  },

  functionBehaviorPolicy: {
    enableLoginTimeWindow: {
      accordion: "مدیریت امنیت و تمامی تغییرات در رفتارهای توابع کارکردی محصول",
      label: "اعمال محدودیت بازه زمانی ورود",
      type: "boolean"
    },
    allowedLoginStartTime: {
      accordion: "مدیریت امنیت و تمامی تغییرات در رفتارهای توابع کارکردی محصول",
      label: "ابتدای بازه زمانی مجاز برای ورود (کلید ۱۰۰۶۶)",
      type: "string"
    },
    allowedLoginEndTime: {
      accordion: "مدیریت امنیت و تمامی تغییرات در رفتارهای توابع کارکردی محصول",
      label: "انتهای بازه زمانی مجاز برای ورود (کلید ۱۰۰۶۷)",
      type: "string"
    },
    "disabledFunctions.disableDirectDatabaseExport": {
      accordion: "مدیریت امنیت و تمامی تغییرات در رفتارهای توابع کارکردی محصول",
      label: "غیرفعال نمودن خروجی مستقیم پایگاه داده (غیرفعال نمودن کارکرد)",
      type: "boolean"
    },
    "enabledFunctions.enableMfaForAdmins": {
      accordion: "مدیریت امنیت و تمامی تغییرات در رفتارهای توابع کارکردی محصول",
      label: "فعال نمودن احراز هویت دو عاملی مدیران سیستم (فعال نمودن کارکرد)",
      type: "boolean"
    }
  },

  activeUserSecurityChangePolicy: {
    disallowChangeDuringActiveSession: { accordion: "تغییر مشخصه‌های امنیتی کاربران فعال", label: "ممانعت از تغییر مشخصه‌های امنیتی در حین نشست فعال", type: "boolean" },
    forceReAuthentication: { accordion: "تغییر مشخصه‌های امنیتی کاربران فعال", label: "الزام احراز هویت مجدد هنگام تغییر مشخصه‌های امنیتی حساس", type: "boolean" },
    revokeAllDeviceSessions: { accordion: "تغییر مشخصه‌های امنیتی کاربران فعال", label: "ابطال فوری تمامی نشست‌های فعال در تمام دستگاه‌ها", type: "boolean" },
    auditLogSecurityChanges: { accordion: "تغییر مشخصه‌های امنیتی کاربران فعال", label: "ثبت کامل تغییرات مشخصه‌های امنیتی در لاگ افتا", type: "boolean" },
    notifyUserSecurityAlert: { accordion: "تغییر مشخصه‌های امنیتی کاربران فعال", label: "ارسال هشدار امنیتی به کاربر هنگام تغییر مشخصات", type: "boolean" }
  },

  activeInactiveInteractionPolicy: {
    enableACLCheck: { accordion: "تعامل موجودیت فعال با غیرفعال (قوانین ACL)", label: "فعال‌سازی اعتبارسنجی خط‌مشی و لیست‌های کنترل دسترسی (ACL)", type: "boolean" },
    checkByUserId: { accordion: "تعامل موجودیت فعال با غیرفعال (قوانین ACL)", label: "بررسی دسترسی بر اساس شناسه کاربری (User ID)", type: "boolean" },
    checkByGroupId: { accordion: "تعامل موجودیت فعال با غیرفعال (قوانین ACL)", label: "بررسی دسترسی بر اساس شناسه گروه کاربری (Group ID)", type: "boolean" },
    checkByUserRole: { accordion: "تعامل موجودیت فعال با غیرفعال (قوانین ACL)", label: "بررسی دسترسی بر اساس نقش کاربری (User Role)", type: "boolean" },
    requireExplicitACLRecord: { accordion: "تعامل موجودیت فعال با غیرفعال (قوانین ACL)", label: "الزام وجود رکورد صریح در ACL جهت تعامل", type: "boolean" },
    auditUnauthorizedInteractions: { accordion: "تعامل موجودیت فعال با غیرفعال (قوانین ACL)", label: "ثبت تلاش‌های تعامل غیرمجاز فعال با غیرفعال در ثبت‌نشان‌ها", type: "boolean" }
  },

  activeToInactivePreventionRules: {
    preventAccessOnExceedingSessionThreshold: { accordion: "قوانین ممانعت از دسترسی به موجودیت‌های غیرفعال", label: "ممانعت از دسترسی در صورت عبور تعداد نشست‌های همزمان از آستانه مجاز", type: "boolean" },
    preventAccessOnAccountDeactivation: { accordion: "قوانین ممانعت از دسترسی به موجودیت‌های غیرفعال", label: "ممانعت از دسترسی در صورت غیرفعال‌سازی یا تعلیق حساب", type: "boolean" },
    preventAccessOnIPAnomaly: { accordion: "قوانین ممانعت از دسترسی به موجودیت‌های غیرفعال", label: "مسدودسازی دسترسی در صورت کشف ناهنجاری آدرس IP", type: "boolean" },
    preventAccessOnOtherCriteria: { accordion: "قوانین ممانعت از دسترسی به موجودیت‌های غیرفعال", label: "ممانعت از دسترسی بر اساس سایر ضوابط امنیتی", type: "boolean" }
  },

  resourceSanitizationPolicy: {
    wipeCryptoKeysOnRelease: { accordion: "پاک‌سازی داده‌های مانده و منابع", label: "امحاء و صفر کردن کلیدهای رمزنگاری نشست هنگام آزادسازی منبع", type: "boolean" },
    sanitizeTempFilesOnRelease: { accordion: "پاک‌سازی داده‌های مانده و منابع", label: "پاک‌سازی امن فایل‌های موقت پس از پایان تراکنش", type: "boolean" },
    isolateSessionMemoryBuffers: { accordion: "پاک‌سازی داده‌های مانده و منابع", label: "ایزوله‌سازی بافرهای حافظه نشست و ممانعت از بازخوانی حافظه قبلی", type: "boolean" },
    requireSecureAccessForLegacyResources: { accordion: "پاک‌سازی داده‌های مانده و منابع", label: "اعمال کنترل دسترسی امن برای منابع قبلی و قدیمی", type: "boolean" },
    auditResourceAllocationAndRelease: { accordion: "پاک‌سازی داده‌های مانده و منابع", label: "ثبت کامل رویدادهای تخصیص و پاک‌سازی منابع در لاگ امنیتی", type: "boolean" }
  },

  userDataInputAccessPolicy: {
    enableInputDataAccessControl: { accordion: "خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری", label: "فعال‌سازی کنترل دسترسی هنگام دریافت و ورود داده کاربری", type: "boolean" },
    checkDataType: { accordion: "خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری", label: "بررسی و اعتبارسنجی نوع داده ورودی (Data Type)", type: "boolean" },
    checkVolumeAndSize: { accordion: "خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری", label: "اعمال سقف حجم مجاز برای فایل‌های ورودی (۱۰ مگابایت)", type: "boolean" },
    checkFormat: { accordion: "خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری", label: "اعتبارسنجی فرمت و پسوند فایل‌های ورودی (JSON, CSV, XLSX, PDF, TXT)", type: "boolean" },
    checkImportFrequencyLimit: { accordion: "خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری", label: "اعمال محدودیت دفعات بارگذاری داده کاربری در ساعت", type: "boolean" },
    checkOtherInputCriteria: { accordion: "خط‌مشی کنترل دسترسی هنگام دریافت داده کاربری", label: "اعمال سایر ضوابط امنیتی ورودی داده", type: "boolean" }
  },

  secureDataTransportPolicy: {
    enforceTLSEncryption: { accordion: "پروتکل امن برای انتقال داده و ممانعت از شنود", label: "الزام رمزنگاری TLS v1.3/v1.2 روی تمامی اتصالات پروتکل‌های ارتباطی", type: "boolean" },
    transparentSecurityAttributeCoupling: { accordion: "پروتکل امن برای انتقال داده و ممانعت از شنود", label: "همبستگی شفاف ویژگی‌های امنیتی داده و کاربر در هدرهای شبکه", type: "boolean" },
    preventEavesdropping: { accordion: "پروتکل امن برای انتقال داده و ممانعت از شنود", label: "ممانعت از شنود (Eavesdropping) و سرقت توکن‌های ارتباطی در شبکه", type: "boolean" },
    preventDataLossAndTamperingInTransit: { accordion: "پروتکل امن برای انتقال داده و ممانعت از شنود", label: "کشف و ممانعت از دستکاری یا مخدوش شدن بسته‌های داده حین انتقال", type: "boolean" },
    auditTransportSecurityViolations: { accordion: "پروتکل امن برای انتقال داده و ممانعت از شنود", label: "ثبت تلاش‌های تخلف امنیتی در انتقال داده در لاگ افتا", type: "boolean" }
  },

  userDataEgressAccessPolicy: {
    enableEgressDataAccessControl: { accordion: "خط‌مشی کنترل دسترسی هنگام خروج داده کاربری", label: "فعال‌سازی کنترل دسترسی هنگام خروج و انتقال داده کاربری به بیرون", type: "boolean" },
    checkDataType: { accordion: "خط‌مشی کنترل دسترسی هنگام خروج داده کاربری", label: "اعتبارسنجی نوع داده هنگام استخراج و دانلود (PDF, XLSX, CSV, JSON)", type: "boolean" },
    checkVolumeAndSize: { accordion: "خط‌مشی کنترل دسترسی هنگام خروج داده کاربری", label: "اعمال محدودیت حجم و تعداد رکوردهای خروجی در هر درخواست", type: "boolean" },
    checkFormat: { accordion: "خط‌مشی کنترل دسترسی هنگام خروج داده کاربری", label: "بررسی پسوند و فرمت استاندارد فایل خروجی", type: "boolean" },
    checkOtherEgressCriteria: { accordion: "خط‌مشی کنترل دسترسی هنگام خروج داده کاربری", label: "اعمال سایر قوانین کنترل خروج داده", type: "boolean" }
  },

  targetedDataEgressRules: {
    preventUntargetedDataEgress: { accordion: "قوانین ممانعت از خروج بدون هدف داده کاربری", label: "ممانعت از خروج بدون مقصد هدفمند و کنترل‌نشده اطلاعات", type: "boolean" },
    requireExplicitEgressDestination: { accordion: "قوانین ممانعت از خروج بدون هدف داده کاربری", label: "الزام تعیین دقیق مقصد مجاز انتقال قبل از ارسال", type: "boolean" },
    requireAdminApprovalForBulkEgress: { accordion: "قوانین ممانعت از خروج بدون هدف داده کاربری", label: "الزام تأیید مدیر سیستم برای خروجی‌های حجیم و گروهی", type: "boolean" },
    preventEgressToUnauthorizedEndpoints: { accordion: "قوانین ممانعت از خروج بدون هدف داده کاربری", label: "مسدودسازی انتقال داده به آدرس‌های خارج از لیست سفید", type: "boolean" },
    auditUntargetedEgressAttempts: { accordion: "قوانین ممانعت از خروج بدون هدف داده کاربری", label: "ثبت لاگ تلاش‌های خروج بدون هدف در سامانه ممیزی", type: "boolean" }
  },

  productRolesDefinitionPolicy: {
    enableRolesDefinition: { accordion: "تعریف نقش‌های مختلف در محصول", label: "فعال‌سازی امکان تعریف نقش‌های متعدّد در محصول", type: "boolean" },
    auditLogRoleChanges: { accordion: "تعریف نقش‌های مختلف در محصول", label: "ثبت تغییرات تعریف نقش‌ها در لاگ ممیزی", type: "boolean" }
  },

  userRoleAssignmentPolicy: {
    enableRoleAssignment: { accordion: "ارتباط کاربران به نقش‌ها (۱ نقش به هر حساب)", label: "فعال‌سازی انتساب نقش‌ها به حساب‌های کاربری", type: "boolean" },
    singleRolePerAccountEnforcement: { accordion: "ارتباط کاربران به نقش‌ها (۱ نقش به هر حساب)", label: "الزام انتساب دقیقاً یک نقش اصلی به هر حساب کاربری", type: "boolean" },
    allowMultiUsersPerRole: { accordion: "ارتباط کاربران به نقش‌ها (۱ نقش به هر حساب)", label: "امکان انتساب یک نقش یکسان به چندین کاربر مختلف", type: "boolean" },
    auditRoleAssignmentChanges: { accordion: "ارتباط کاربران به نقش‌ها (۱ نقش به هر حساب)", label: "ثبت تمامی تغییرات انتساب نقش به کاربران در لاگ", type: "boolean" }
  },

  secureFailureStatePolicy: {
    enableSecureFailureState: { accordion: "حفاظت از وضعیت امن محصول هنگام خرابی/شکست", label: "فعال‌سازی خط‌مشی حفظ وضعیت امن هنگام خرابی یا شکست", type: "boolean" },
    softwareFailureProtection: { accordion: "حفاظت از وضعیت امن محصول هنگام خرابی/شکست", label: "حفاظت و عدم افشای اطلاعات هنگام خرابی‌های نرم‌افزاری", type: "boolean" },
    hardwareFailureProtection: { accordion: "حفاظت از وضعیت امن محصول هنگام خرابی/شکست", label: "حفاظت از وضعیت امن در رخدادهای سخت‌افزاری", type: "boolean" },
    preserveDataIntegrityOnCrash: { accordion: "حفاظت از وضعیت امن محصول هنگام خرابی/شکست", label: "حفظ صحت و دستکاری‌ناپذیری داده‌ها هنگام کرش سامانه", type: "boolean" },
    maintainAccessControlRulesOnFailure: { accordion: "حفاظت از وضعیت امن محصول هنگام خرابی/شکست", label: "پایداری قوانین کنترل دسترسی هنگام رخداد اشکال فنی", type: "boolean" },
    auditLogFailureEvents: { accordion: "حفاظت از وضعیت امن محصول هنگام خرابی/شکست", label: "ثبت کامل رویدادهای خرابی و شکست در ثبت‌نشان‌های افتا", type: "boolean" }
  },

  internalTransitProtectionPolicy: {
    enableInternalTransitProtection: { accordion: "حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول", label: "فعال‌سازی حفاظت از داده هنگام انتقال بین ماژول‌های داخلی", type: "boolean" },
    preventDataLeakageInTransit: { accordion: "حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول", label: "جلوگیری از افشاء و نشت داده حین انتقال بین اجزای داخلی", type: "boolean" },
    preventDataTamperingInTransit: { accordion: "حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول", label: "جلوگیری از تغییر یا دستکاری داده حین انتقال درون‌سیستمی", type: "boolean" },
    enforceInternalComponentTLS: { accordion: "حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول", label: "استفاده از بستر و کانال‌های امن (Internal Component TLS/IPC)", type: "boolean" },
    auditTransitSecurityViolations: { accordion: "حفاظت از داده هنگام انتقال بین بخش‌های مجزای محصول", label: "ثبت تخلفات و ناهنجاری‌های انتقال داخلی در لاگ ممیزی", type: "boolean" }
  },

  securityDataInteroperabilityPolicy: {
    enableSecurityDataInteroperability: { accordion: "تفسیر سازگار و یکسان داده‌های امنیتی", label: "فعال‌سازی تفسیر سازگار و تعامل‌پذیر داده‌های امنیتی", type: "boolean" },
    enforceStandardFormatInterpretation: { accordion: "تفسیر سازگار و یکسان داده‌های امنیتی", label: "الزام رعایت فرمت استانداردهای بین‌المللی در تبادل داده", type: "boolean" }
  },

  trustedTimestampPolicy: {
    enableTrustedTimestamping: { accordion: "زمان و تاریخ معتبر و مهرهای زمانی دستکاری‌ناپذیر", label: "فعال‌سازی سیستم زمان معتبر و مهرهای زمانی دستکاری‌ناپذیر", type: "boolean" },
    verifyTimestampIntegrity: { accordion: "زمان و تاریخ معتبر و مهرهای زمانی دستکاری‌ناپذیر", label: "اعتبارسنجی اصالت و صحت مهرهای زمانی لاگ‌ها", type: "boolean" }
  },

  productSoftwareUpdatePolicy: {
    enableSoftwareUpdateManagement: { accordion: "بروزرسانی نرم‌افزار و میان‌افزار محصول", label: "فعال‌سازی مدیریت بروزرسانی‌های نرم‌افزار محصول", type: "boolean" },
    requireAdminApprovalForUpdates: { accordion: "بروزرسانی نرم‌افزار و میان‌افزار محصول", label: "الزام تأیید صریح مدیر سیستم پیش از اعمال هرگونه بروزرسانی", type: "boolean" },
    auditLogUpdateEvents: { accordion: "بروزرسانی نرم‌افزار و میان‌افزار محصول", label: "ثبت کامل رویدادهای نصب و بروزرسانی نرم‌افزار در لاگ ممیزی", type: "boolean" }
  },

  coreFunctionsSoftwareFaultTolerancePolicy: {
    enableFaultTolerancePolicy: { accordion: "تحمل خطای نرم‌افزاری در کارکردهای اصلی", label: "فعال‌سازی خط‌مشی تحمل خطای نرم‌افزاری کارکردهای اصلی", type: "boolean" },
    isolationOfFaultyModules: { accordion: "تحمل خطای نرم‌افزاری در کارکردهای اصلی", label: "جداسازی ماژول‌های دچار خطا جهت عدم اختلال در سایر بخش‌ها", type: "boolean" },
    fallbackToCoreOperationalMode: { accordion: "تحمل خطای نرم‌افزاری در کارکردهای اصلی", label: "بازگشت خودکار به حالت عملیاتی پایه و فعال نگه‌داشتن وظایف اصلی", type: "boolean" },
    gracefulDegradation: { accordion: "تحمل خطای نرم‌افزاری در کارکردهای اصلی", label: "افت کیفیت کنترل‌شده بدون توقف کارکرد", type: "boolean" },
    auditLogFaultEvents: { accordion: "تحمل خطای نرم‌افزاری در کارکردهای اصلی", label: "ثبت دقیق رویدادهای خرابی و ناهنجاری در ثبت‌نشان‌های افتا", type: "boolean" }
  },

  lastSuccessfulSessionNoticePolicy: {
    enable: { accordion: "نمایش آخرین تلاش موفق برای ایجاد نشست", label: "فعال‌سازی اعلان آخرین ورود موفقیت‌آمیز هنگام ورود جدید", type: "boolean" },
    displayDate: { accordion: "نمایش آخرین تلاش موفق برای ایجاد نشست", label: "نمایش تاریخ آخرین ورود موفق", type: "boolean" },
    displayTime: { accordion: "نمایش آخرین تلاش موفق برای ایجاد نشست", label: "نمایش زمان و ساعت آخرین ورود موفق", type: "boolean" },
    displayOtherInfo: { accordion: "نمایش آخرین تلاش موفق برای ایجاد نشست", label: "نمایش آدرس IP و مشخصات دستگاه در آخرین ورود موفق", type: "boolean" }
  },

  lastFailedSessionNoticePolicy: {
    enable: { accordion: "نمایش آخرین تلاش ناموفق و تعداد تلاش‌های قبلی", label: "فعال‌سازی اعلان تلاش‌های ناموفق قبلی هنگام ورود", type: "boolean" },
    displayDate: { accordion: "نمایش آخرین تلاش ناموفق و تعداد تلاش‌های قبلی", label: "نمایش تاریخ آخرین تلاش ناموفق", type: "boolean" },
    displayTime: { accordion: "نمایش آخرین تلاش ناموفق و تعداد تلاش‌های قبلی", label: "نمایش زمان و ساعت آخرین تلاش ناموفق", type: "boolean" },
    displayOtherInfo: { accordion: "نمایش آخرین تلاش ناموفق و تعداد تلاش‌های قبلی", label: "نمایش آدرس IP و مشخصات در تلاش ناموفق", type: "boolean" },
    displayFailedAttemptsCount: { accordion: "نمایش آخرین تلاش ناموفق و تعداد تلاش‌های قبلی", label: "نمایش تعداد کل تلاش‌های ناموفق انجام‌شده تا ورود جاری", type: "boolean" }
  },

  preserveAccessRecordsPolicy: {
    preventAutoClearWithoutUserView: { accordion: "حفظ سوابق و اطلاع‌رسانی دسترسی‌ها", label: "ممانعت از پاک‌سازی خودکار سوابق دسترسی قبل از رویت کاربر", type: "boolean" },
    requireExplicitUserDismissal: { accordion: "حفظ سوابق و اطلاع‌رسانی دسترسی‌ها", label: "الزام بستن صریح پیام اطلاع‌رسانی ورود توسط کاربر", type: "boolean" }
  },

  sessionEstablishmentPreventionPolicy: {
    enable: { accordion: "ممانعت از ایجاد نشست بر اساس پارامترها", label: "فعال‌سازی خط‌مشی ممانعت از ایجاد نشست بر اساس پارامترها", type: "boolean" },
    preventByLocation: { accordion: "ممانعت از ایجاد نشست بر اساس پارامترها", label: "ممانعت از ایجاد نشست بر اساس مکان جغرافیایی / IP", type: "boolean" },
    preventByPort: { accordion: "ممانعت از ایجاد نشست بر اساس پارامترها", label: "ممانعت از برقراری نشست روی پورت‌های غیرمجاز شبکه", type: "boolean" },
    preventByDay: { accordion: "ممانعت از ایجاد نشست بر اساس پارامترها", label: "ممانعت از ورود در روزهای غیرمجاز", type: "boolean" },
    preventByTime: { accordion: "ممانعت از ایجاد نشست بر اساس پارامترها", label: "ممانعت از ورود در ساعات غیرمجاز شبانه‌روز", type: "boolean" },
    preventByOtherParams: { accordion: "ممانعت از ایجاد نشست بر اساس پارامترها", label: "ممانعت از ایجاد نشست بر اساس سایر پارامترها", type: "boolean" }
  },

  trustedChannelPolicy: {
    enable: { accordion: "کانال‌ها و مسیرهای مورد اعتماد (Trusted Channels)", label: "فعال‌سازی خط‌مشی استفاده اختصاصی از کانال‌های مورد اعتماد", type: "boolean" },
    allowRemoteConnectionOnlyViaSecureChannel: { accordion: "کانال‌ها و مسیرهای مورد اعتماد (Trusted Channels)", label: "امکان برقراری ارتباط از راه دور صرفاً از طریق کانال مورد اعتماد", type: "boolean" },
    requireSecureChannelForInitialAuth: { accordion: "کانال‌ها و مسیرهای مورد اعتماد (Trusted Channels)", label: "الزام استفاده از کانال امن برای احراز هویت اولیه", type: "boolean" }
  },

  httpsProtocolPolicy: {
    enable: { accordion: "الزامات امنیتی پروتکل HTTPS (RFC 2818)", label: "فعال‌سازی خط‌مشی پروتکل HTTPS", type: "boolean" },
    rfc2818Compliance: { accordion: "الزامات امنیتی پروتکل HTTPS (RFC 2818)", label: "انطباق کامل با استاندارد RFC 2818", type: "boolean" },
    requireTlsForHttps: { accordion: "الزامات امنیتی پروتکل HTTPS (RFC 2818)", label: "الزام استفاده از پروتکل TLS زیرساختی برای HTTPS", type: "boolean" }
  },

  tlsClientPolicy: {
    enable: { accordion: "الزامات امنیتی پروتکل TLS Client (RFC 6125)", label: "فعال‌سازی خط‌مشی پروتکل TLS Client", type: "boolean" },
    enforceTls12Only: { accordion: "الزامات امنیتی پروتکل TLS Client (RFC 6125)", label: "الزام استفاده انحصاری از TLS 1.2 / 1.3", type: "boolean" },
    rfc6125IdentityValidation: { accordion: "الزامات امنیتی پروتکل TLS Client (RFC 6125)", label: "اعتبارسنجی شناسه سرور مطابق RFC 6125", type: "boolean" }
  },

  tlsServerPolicy: {
    enable: { accordion: "الزامات امنیتی پروتکل TLS Server", label: "فعال‌سازی خط‌مشی پروتکل TLS Server", type: "boolean" },
    enforceTls12: { accordion: "الزامات امنیتی پروتکل TLS Server", label: "الزام پروتکل TLS 1.2 / 1.3", type: "boolean" },
    rejectLegacySslTls: { accordion: "الزامات امنیتی پروتکل TLS Server", label: "عدم پذیرش پروتکل‌های ناامن و قدیمی SSL/TLS", type: "boolean" }
  },

  mutualTlsPolicy: {
    enable: { accordion: "احراز هویت متقابل (mTLS) و گواهی‌نامه‌ها", label: "فعال‌سازی خط‌مشی mTLS و اعتبارسنجی گواهی‌نامه‌ها", type: "boolean" },
    requireClientCertificate: { accordion: "احراز هویت متقابل (mTLS) و گواهی‌نامه‌ها", label: "الزام گواهی‌نامه کاربری برای احراز هویت دوطرفه mTLS", type: "boolean" }
  },

  certificateValidationPolicy: {
    enforceRfc5280PathValidation: { accordion: "احراز هویت متقابل (mTLS) و گواهی‌نامه‌ها", label: "اعتبارسنجی مسیر گواهی‌نامه بر اساس RFC 5280", type: "boolean" }
  },

  sshProtocolPolicy: {
    enable: { accordion: "الزامات امنیتی پروتکل SSH (RFC 4251-4254)", label: "فعال‌سازی خط‌مشی پروتکل SSH", type: "boolean" },
    disallowPacketSizeExceedingMax: { accordion: "الزامات امنیتی پروتکل SSH (RFC 4251-4254)", label: "ممانعت از دریافت بسته‌های SSH بزرگتر از سقف مجاز (35,000 بایت)", type: "boolean" },
    enableRekeyingOnLimit: { accordion: "الزامات امنیتی پروتکل SSH (RFC 4251-4254)", label: "فعال‌سازی تعویض کلید (Rekeying) هنگام رسیدن به حد آستانه", type: "boolean" },
    verifyHostKeyAgainstKnownHosts: { accordion: "الزامات امنیتی پروتکل SSH (RFC 4251-4254)", label: "اعتبارسنجی کلید عمومی سرور SSH در known_hosts", type: "boolean" }
  }
};
