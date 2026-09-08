const fs = require('fs');
const path = require('path');

// 1. Update backend/src/lib/securityPolicy.ts
const backendPath = path.join(__dirname, '../backend/src/lib/securityPolicy.ts');
let backendContent = fs.readFileSync(backendPath, 'utf8');

const caValidationFunction = `
export function validateCaCertificateAcceptance(
  certInfo: { hasBasicConstraintsExtension?: boolean; isCaFlagTrue?: boolean },
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { valid: boolean; reason?: string } {
  if (policy.strictCaAcceptanceOnlyWithBasicConstraints) {
    if (!certInfo.hasBasicConstraintsExtension) {
      return {
        valid: false,
        reason: "گواهی‌نامه ارائه‌شده فاقد افزونه basicConstraints می‌باشد. طبق بند ۲ جدول ۳-۵ افتا، محصول از پذیرش آن به عنوان CA خودداری نمود."
      };
    }
    if (certInfo.isCaFlagTrue !== true) {
      return {
        valid: false,
        reason: "پرچم CA در افزونه basicConstraints گواهی‌نامه روی TRUE تنظیم نشده است. طبق بند ۲ جدول ۳-۵ افتا، پذیرش آن به عنوان CA رد گردید."
      };
    }
  }
  return { valid: true };
}
`;

if (!backendContent.includes('validateCaCertificateAcceptance')) {
  const insertIndex = backendContent.indexOf('export function validateSecureDataTransportPolicy');
  if (insertIndex !== -1) {
    backendContent = backendContent.slice(0, insertIndex) + caValidationFunction + '\n' + backendContent.slice(insertIndex);
    fs.writeFileSync(backendPath, backendContent, 'utf8');
    console.log("SUCCESS: Added validateCaCertificateAcceptance to backend securityPolicy.ts!");
  } else {
    console.error("ERROR: Could not find insert position in securityPolicy.ts");
  }
} else {
  console.log("INFO: validateCaCertificateAcceptance already present in backend securityPolicy.ts");
}

// 2. Update frontend/src/pages/SystemSettingsForm.jsx
const frontendPath = path.join(__dirname, '../frontend/src/pages/SystemSettingsForm.jsx');
let frontendContent = fs.readFileSync(frontendPath, 'utf8');

const startMarker = '{/* ۴۸. 🌟 اعتبارسنجی گواهی‌نامه';
const endMarker = '{/* ۴۹. 🌟 الزامات امنیتی پروتکل SSH';

const startIndex = frontendContent.indexOf(startMarker);
const endIndex = frontendContent.indexOf(endMarker, startIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error("ERROR: Could not find markers in SystemSettingsForm.jsx");
  process.exit(1);
}

const updatedAccordion = `{/* ۴۸. 🌟 اعتبارسنجی گواهی‌نامه (الزامات رده ۳-۵ / بند ۲ جدول ۳-۵ و بندهای ۴۴ و ۴۵ افتا) */}
                  <AftaAccordionCard
                    id="afta_certificate_validation_policy"
                    number="الزام افتا (۳-۵ - بند ۲ جدول ۳-۵)"
                    title="اعتبارسنجی گواهی‌نامه، پذیرش CA با basicConstraints، روش‌های فسخ و OIDهای extendedKeyUsage"
                    description="الزام اجباری پذیرش گواهی‌نامه CA تنها با افزونه basicConstraints و پرچم CA=TRUE (بند ۲ جدول ۳-۵)، قوانین مسیر (بند ۴۴) و EKU Server Auth (بند ۴۵ افتا)"
                    isOpen={!!openAftaSections["afta_certificate_validation_policy"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* 🌟 اطلاعیه هوشمند انطباق بند ۲ جدول ۳-۵ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق الزام اجباری بند ۲ جدول ۳-۵ افتا (اعتبارسنجی گواهی‌نامه):</strong>
                          <span className="block mt-1 font-mono text-[10.5px] bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                            🛡️ <strong>قانون اصلی بند ۲ جدول ۳-۵:</strong> «محصول باید تنها در صورتی که افزونه مربوط به basicConstraints از پیش تنظیم شده باشد و همچنین، پرچم CA به حالت TRUE تنظیم شده باشد، یک گواهی‌نامه را به عنوان گواهی‌نامه CA بپذیرد.» این قانون به صورت اجباری در سامانه فعال گردیده است.
                          </span>
                        </div>
                      </div>

                      {/* 🔴 بخش ۲: الزام اجباری بند ۲ جدول ۳-۵ افتا - شرط پذیرش گواهی‌نامه به عنوان CA */}
                      <div className="space-y-3 bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-300 dark:border-amber-900/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-amber-950 dark:text-amber-200 block">
                            🔴 الزام اجباری (بند ۲ جدول ۳-۵ افتا) - شرط پذیرش گواهی‌نامه به عنوان CA توسط محصول:
                          </span>
                          <span className="text-[10px] bg-amber-600 text-white font-mono px-2.5 py-0.5 rounded-full font-bold">
                            الزام اجباری (جدول ۳-۵ بند ۲)
                          </span>
                        </div>

                        <label className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer shadow-sm hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.certificateValidationPolicy?.strictCaAcceptanceOnlyWithBasicConstraints ?? true}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              set("certificateValidationPolicy", {
                                ...settings.certificateValidationPolicy,
                                strictCaAcceptanceOnlyWithBasicConstraints: isChecked
                              });
                              showPopLine(
                                \`⚡ تغییر تنظیمات آکاردئون افتا (الزام اجباری بند ۲ جدول ۳-۵):\\n\` +
                                \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (جدول ۳-۵ بند ۲)» 👈 گزینه «پذیرش CA تنها با basicConstraints و CA=TRUE» [\${isChecked ? "فعال و اجبار شد" : " غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-amber-400 text-amber-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                              محصول باید تنها در صورتی که افزونه مربوط به basicConstraints از پیش تنظیم شده باشد و همچنین، پرچم CA به حالت «TRUE» تنظیم شده باشد، یک گواهی‌نامه را به عنوان گواهی‌نامه CA بپذیرد.
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-1 leading-relaxed">
                              🔒 <strong>مکانیزم امنیتی:</strong> این ضابطه از صدور غیرمجاز گواهی‌نامه‌های جعلی یا پذیرش گواهی‌نامه‌های کاربر نهایی (End-Entity) به عنوان مرجع صدور (CA) جلوگیری کامل به عمل می‌آورد.
                            </span>
                          </div>
                        </label>

                        {/* راهنمای نحوه استفاده در فرانت‌اند و موتور ارزیابی اعتبارسنجی */}
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px] space-y-1 text-slate-700 dark:text-slate-300 font-mono">
                          <div className="font-bold text-amber-900 dark:text-amber-300">⚙️ راهنمای نحوه عملکرد در فرانت‌اند (Frontend Execution & Validation):</div>
                          <div>۱. هنگام آپلود یا معرفی گواهی‌نامه CA جدید، کامپوننت فرانت‌اند ساختار ASN.1/X.509v3 را پارس می‌کند.</div>
                          <div>۲. فیلد <code className="bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200">basicConstraints</code> استخراج شده و وجود پرچم <code className="bg-amber-100 dark:bg-amber-950 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200">cA: true</code> چک می‌گردد.</div>
                          <div>۳. در صورت عدم وجود basicConstraints یا مقدار <code className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded">cA: false</code>، فرانت‌اند فوراً پیام خطای عدم پذیرش صادر کرده و مانع ذخیره‌سازی می‌شود.</div>
                        </div>
                      </div>

                      {/* 🔵 بخش ۱: الزام ۱ افتا - قوانین تأیید مسیر گواهی‌نامه (Certificate Path Validation Rules - سه گزینه اول اجباری) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block">
                            بخش ۱) قوانین تأیید مسیر گواهی‌نامه (سه گزینه زیر طبق بند ۴۴ افتا اجباری هستند):
                          </span>
                          <span className="text-[10px] bg-rose-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                            🔴 اجباری (بند ۴۴ - بند ۱)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          <label className="p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.certificateValidationPolicy?.pathValidationRules?.rfc5280PathValidation ?? true}
                              onChange={e => {
                                const isChecked = e.target.checked;
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  pathValidationRules: {
                                    ...settings.certificateValidationPolicy?.pathValidationRules,
                                    rfc5280PathValidation: isChecked
                                  }
                                });
                                showPopLine(
                                  \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۴ - قوانین مسیر اجباری):\\n\` +
                                  \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (بند ۴۴)» 👈 گزینه «۱-۱. تأیید گواهی‌نامه RFC 5280 و مسیر گواهی‌نامه» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                  "info"
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  ۱-۱. تأیید گواهی‌نامه RFC 5280 و تأیید مسیر گواهی‌نامه که از حداقل طول مسیر ۲ گواهی‌نامه پشتیبانی می‌کند
                                </span>
                                <span className="text-[9px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">اجباری</span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                بررسی ساختار و اعتبار زنجیره گواهی‌نامه مطابق ضوابط RFC 5280 (الزام بند ۴۴ افتا).
                              </span>
                            </div>
                          </label>

                          <label className="p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.certificateValidationPolicy?.pathValidationRules?.endWithTrustedCA ?? true}
                              onChange={e => {
                                const isChecked = e.target.checked;
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  pathValidationRules: {
                                    ...settings.certificateValidationPolicy?.pathValidationRules,
                                    endWithTrustedCA: isChecked
                                  }
                                });
                                showPopLine(
                                  \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۴ - قوانین مسیر اجباری):\\n\` +
                                  \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (بند ۴۴)» 👈 گزینه «۱-۲. خاتمه مسیر گواهی‌نامه به CA امن» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                  "info"
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  ۱-۲. مسیر گواهی‌نامه باید با یک گواهی‌نامه CA امن (Trusted CA Root) پایان یابد
                                </span>
                                <span className="text-[9px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">اجباری</span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                الزام انتها و تایید ریشه زنجیره توسط یک صادرکننده گواهی (CA) معتبر و تاییدشده (الزام بند ۴۴ افتا).
                              </span>
                            </div>
                          </label>

                          <label className="p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.certificateValidationPolicy?.pathValidationRules?.requireBasicConstraintsCaTrue ?? true}
                              onChange={e => {
                                const isChecked = e.target.checked;
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  pathValidationRules: {
                                    ...settings.certificateValidationPolicy?.pathValidationRules,
                                    requireBasicConstraintsCaTrue: isChecked
                                  }
                                });
                                showPopLine(
                                  \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۴ - قوانین مسیر اجباری):\\n\` +
                                  \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (بند ۴۴)» 👈 گزینه «۱-۳. وجود basicConstraints و CA=TRUE» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                  "info"
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 mt-0.5"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  ۱-۳. اطمینان از وجود افزونه basicConstraints و تنظیم پرچم CA به حالت TRUE برای تمام گواهی‌نامه‌های CA
                                </span>
                                <span className="text-[9px] bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono font-bold">اجباری</span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                حصول اطمینان از وجود افزونه basicConstraints و مقدار CA=TRUE در گواهی‌نامه‌های میانی و ریشه (الزام بند ۴۴ افتا).
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 🟣 بخش ۳: روش‌های تأیید وضعیت فسخ گواهی‌نامه (Revocation Checking Methods - انتخاب بسته به پیاده‌سازی محصول) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                            بخش ۳) روش‌های تأیید فسخ گواهی‌نامه (بسته به پیاده‌سازی محصول انتخاب می‌شود - بند ۴۴ افتا):
                          </span>
                          <span className="text-[10px] bg-purple-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                            بسته به پیاده‌سازی (بند ۴۴ - ۲)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {[
                            { key: "ocspRfc696", label: "پروتکل وضعیت آنلاین گواهی‌نامه (OCSP) مشخص‌شده در RFC 6960" },
                            { key: "crlRfc5280Section63", label: "لیست فسخ گواهی‌نامه (CRL) مشخص‌شده در RFC 5280 بخش 6.3" },
                            { key: "crlRfc5759Section5", label: "لیست فسخ گواهی‌نامه (CRL) مشخص‌شده در RFC 5759 بخش 5" },
                            { key: "disallowOtherRevocationMethods", label: "عدم استفاده از هیچ روش فسخ غیرمجاز دیگری" },
                          ].map(method => (
                            <label key={method.key} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                              <input
                                type="checkbox"
                                checked={settings.certificateValidationPolicy?.revocationCheckingMethods?.[method.key] ?? true}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  const newEku = { ...settings.certificateValidationPolicy?.extendedKeyUsageRules };
                                  if (method.key === "ocspRfc696") {
                                    newEku.ocspSigningOid = isChecked;
                                  }
                                  set("certificateValidationPolicy", {
                                    ...settings.certificateValidationPolicy,
                                    revocationCheckingMethods: {
                                      ...settings.certificateValidationPolicy?.revocationCheckingMethods,
                                      [method.key]: isChecked
                                    },
                                    extendedKeyUsageRules: newEku
                                  });
                                  showPopLine(
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۴ - روش‌های فسخ):\n\` +
                                    \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (بند ۴۴)» 👈 روش فسخ «\${method.label}» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\` +
                                    (method.key === "ocspRfc696" ? \`\\n💡 همگام‌سازی بند ۴۴ (قانون ۳-iv): گزینه OCSP Signing به صورت خودکار \${isChecked ? "فعال" : "غیرفعال"} گردید.\` : ""),
                                    "info"
                                  );
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-purple-600"
                              />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {method.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 🟢 بخش ۴: قوانین تأیید بخش extendedKeyUsage (انتخاب Server Authentication - بند ۴۵ افتا) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                            بخش ۴) قوانین تأیید بخش extendedKeyUsage (انتخاب الزامی Server Authentication طبق بند ۴۵ افتا):
                          </span>
                          <span className="text-[10px] bg-emerald-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                            بند ۴۵ افتا (انتخاب‌شده)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[
                            {
                              key: "codeSigningOid",
                              ruleNum: "۳-i",
                              title: "کدینگ امضای دیجیتال (Code Signing)",
                              purpose: "Code Signing (id-kp3)",
                              oid: "1.3.6.1.5.5.7.3.3",
                              isSpecialBand45: false,
                              conditionDesc: "چنانچه برای تأیید اصالت بروزرسانی یا امنیت وصله از امضای دیجیتال استفاده می‌شود، این گزینه باید انتخاب گردد (بند ۴۴-۳-i)."
                            },
                            {
                              key: "serverAuthOid",
                              ruleNum: "۳-ii",
                              title: "احراز هویت سرور (Server Authentication)",
                              purpose: "Server Authentication (id-kp1)",
                              oid: "1.3.6.1.5.5.7.3.1",
                              isSpecialBand45: true,
                              conditionDesc: "گواهی‌نامه‌های سرور ارائه شده برای TLS باید هدف Server Authentication (id-kp1 با OID 1.3.6.1.5.5.7.3.1) را در بخش extendedKeyUsage خود داشته باشند. این گزینه بر اساس الزام بند ۴۵ افتا انتخاب و فعال گردیده است."
                            },
                            {
                              key: "clientAuthOid",
                              ruleNum: "۳-iii",
                              title: "احراز هویت کلاینت (Client Authentication)",
                              purpose: "Client Authentication (id-kp2)",
                              oid: "1.3.6.1.5.5.7.3.2",
                              isSpecialBand45: false,
                              conditionDesc: "چنانچه محصول در ارتباطی (حتا داخلی) در حالت کلاینت پروتکل TLS قرار می‌گیرد، این گزینه باید انتخاب گردد (بند ۴۴-۳-iii)."
                            },
                            {
                              key: "ocspSigningOid",
                              ruleNum: "۳-iv",
                              title: "امضای پاسخ‌دهنده فسخ (OCSP Signing)",
                              purpose: "OCSP Signing (id-pk9)",
                              oid: "1.3.6.1.5.5.7.3.9",
                              isSpecialBand45: false,
                              conditionDesc: "چنانچه در بخش روش‌های تأیید فسخ گواهی‌نامه، گزینه OCSP انتخاب شده است، این گزینه باید انتخاب گردد (بند ۴۴-۳-iv)."
                            },
                          ].map(eku => (
                            <label key={eku.key} className={\`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors \${eku.isSpecialBand45 ? "border-emerald-500/80 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"}\`}>
                              <input
                                type="checkbox"
                                checked={settings.certificateValidationPolicy?.extendedKeyUsageRules?.[eku.key] ?? true}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  set("certificateValidationPolicy", {
                                    ...settings.certificateValidationPolicy,
                                    extendedKeyUsageRules: {
                                      ...settings.certificateValidationPolicy?.extendedKeyUsageRules,
                                      [eku.key]: isChecked
                                    }
                                  });
                                  showPopLine(
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (\${eku.isSpecialBand45 ? "انطباق بند ۴۵" : "بند ۴۴ - قوانین EKU"}):\n\` +
                                    \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (\${eku.isSpecialBand45 ? "بند ۴۵" : "بند ۴۴"})» 👈 قانون EKU «\${eku.title} (\${eku.ruleNum})» [\${isChecked ? "انتخاب گردید / فعال شد" : "غیرفعال شد"}]\`,
                                    "info"
                                  );
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    [{eku.ruleNum}] {eku.title}
                                    {eku.isSpecialBand45 && (
                                      <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
                                        انتخاب‌شده طبق بند ۴۵ افتا
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    {eku.purpose}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-1 dir-ltr text-left">
                                  OID: {eku.oid}
                                </span>
                                <span className="text-[10.5px] text-emerald-900 dark:text-emerald-200 block mt-1 leading-relaxed bg-white/80 dark:bg-slate-900/80 p-1.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                                  💡 <strong>\${eku.isSpecialBand45 ? "الزام صریح بند ۴۵ افتا" : "شرط بند ۴۴"}:</strong> {eku.conditionDesc}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* کارت‌های خلاصه گواهی انطباق بندهای ۴۴ و ۴۵ و بند ۲ جدول ۳-۵ افتا */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mt-4">
                        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-amber-950 dark:text-amber-200">بند ۲ جدول ۳-۵ (پذیرش CA)</span>
                            <span className="text-[9px] bg-amber-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">اجباری</span>
                          </div>
                          <div className="text-[10px] text-amber-950 dark:text-amber-200 font-mono">
                            🛡️ پذیرش CA صرفاً با basicConstraints و پرچم CA=TRUE.
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-blue-900 dark:text-blue-200">انطباق بند ۴۴ - قوانین مسیر</span>
                            <span className="text-[9px] bg-blue-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۵-۱ (اجباری)</span>
                          </div>
                          <div className="text-[10px] text-blue-900 dark:text-blue-200 font-mono">
                            🔴 ۳ گزینه اول قوانین مسیر (RFC 5280, Trusted CA, CA=TRUE) اجباری است.
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-purple-900 dark:text-purple-200">انطباق بند ۴۴ - روش‌های فسخ</span>
                            <span className="text-[9px] bg-purple-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۵-۲ (پیاده‌سازی)</span>
                          </div>
                          <div className="text-[10px] text-purple-900 dark:text-purple-200 font-mono">
                            ⚙️ روش‌های فسخ OCSP و CRL بر اساس پیاده‌سازی تنظیم شد.
                          </div>
                        </div>

                        <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200">انطباق بند ۴۵ افتا - Server Auth</span>
                            <span className="text-[9px] bg-teal-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۵-۱ (انتخاب‌شده)</span>
                          </div>
                          <div className="text-[10px] text-teal-900 dark:text-teal-200 font-mono">
                            ⭐ گزینه Server Authentication با OID 1.3.6.1.5.5.7.3.1 انتخاب شد.
                          </div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

frontendContent = frontendContent.slice(0, startIndex) + updatedAccordion + frontendContent.slice(endIndex);
fs.writeFileSync(frontendPath, frontendContent, 'utf8');
console.log("SUCCESS: SystemSettingsForm.jsx updated for Band 2 Table 3-5 mandatory CA acceptance rule!");
