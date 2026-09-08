const fs = require('fs');
const path = require('path');

// 1. Update backend/src/lib/securityPolicy.ts
const backendPath = path.join(__dirname, '../backend/src/lib/securityPolicy.ts');
let backendContent = fs.readFileSync(backendPath, 'utf8');

const scopeValidationFunction = `
export function validateX509v3Rfc5280AuthenticationScopes(
  scopeKey: "https" | "tls" | "ssh" | "codeSigningSoftwareUpdates" | "codeSigningIntegrityVerification" | "otherUseCases",
  policy: CertificateValidationPolicy = DEFAULT_SECURITY_POLICY.certificateValidationPolicy!
): { supported: boolean; reason?: string } {
  const scopes = policy.x509v3Rfc5280AuthenticationScopes;
  if (scopes && scopes[scopeKey] === false) {
    return {
      supported: false,
      reason: \`پشتیبانی از احراز هویت با گواهی‌نامه X.509v3 (RFC 5280) برای کارکرد (\${scopeKey}) طبق الزام اجباری بند ۳ جدول ۳-۵ افتا غیرفعال می‌باشد.\`
    };
  }
  return { supported: true };
}
`;

if (!backendContent.includes('validateX509v3Rfc5280AuthenticationScopes')) {
  const insertIndex = backendContent.indexOf('export function validateSecureDataTransportPolicy');
  if (insertIndex !== -1) {
    backendContent = backendContent.slice(0, insertIndex) + scopeValidationFunction + '\n' + backendContent.slice(insertIndex);
    fs.writeFileSync(backendPath, backendContent, 'utf8');
    console.log("SUCCESS: Added validateX509v3Rfc5280AuthenticationScopes to backend securityPolicy.ts!");
  } else {
    console.error("ERROR: Could not find insert position in securityPolicy.ts");
  }
} else {
  console.log("INFO: validateX509v3Rfc5280AuthenticationScopes already present in backend securityPolicy.ts");
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

const updatedAccordion = `{/* ۴۸. 🌟 اعتبارسنجی گواهی‌نامه (الزامات رده ۳-۵ / بند ۲ و ۳ جدول ۳-۵ و بندهای ۴۴ و ۴۵ افتا) */}
                  <AftaAccordionCard
                    id="afta_certificate_validation_policy"
                    number="الزام افتا (۳-۵ - بندهای ۲ و ۳ جدول ۳-۵)"
                    title="اعتبارسنجی گواهی‌نامه، احراز هویت X509v3 RFC 5280، پذیرش CA با basicConstraints و OIDها"
                    description="الزام اجباری احراز هویت X509v3 در HTTPS, TLS, SSH و Code Signing (بند ۳ جدول ۳-۵)، پذیرش CA با CA=TRUE (بند ۲)، قوانین مسیر (بند ۴۴) و EKU Server Auth (بند ۴۵ افتا)"
                    isOpen={!!openAftaSections["afta_certificate_validation_policy"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* 🌟 اطلاعیه هوشمند انطباق بندهای ۲ و ۳ جدول ۳-۵ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق الزامات اجباری جدول ۳-۵ افتا (بند ۲ و ۳):</strong>
                          <span className="block mt-1 font-mono text-[10.5px] bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/40 space-y-1">
                            <div>🛡️ <strong>بند ۲ جدول ۳-۵:</strong> پذیرش اجباری گواهی‌نامه CA تنها با افزونه basicConstraints و پرچم CA=TRUE.</div>
                            <div>🔑 <strong>بند ۳ جدول ۳-۵:</strong> استفاده اجباری از گواهی‌نامه‌های X.509v3 تعریف‌شده در RFC 5280 برای احراز هویت در دامنه‌های HTTPS, TLS, SSH, امضای کد بروزرسانی، امضای کد یکپارچگی و سایر کارکردها.</div>
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
                                \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (جدول ۳-۵ بند ۲)» 👈 گزینه «پذیرش CA تنها با basicConstraints و CA=TRUE» [\${isChecked ? "فعال و اجبار شد" : "غیرفعال شد"}]\`,
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
                      </div>

                      {/* 🔴 بخش ۳: الزام اجباری بند ۳ جدول ۳-۵ افتا - دامنه‌های احراز هویت با گواهی‌نامه‌های X509v3 (RFC 5280) */}
                      <div className="space-y-3 bg-teal-50/60 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-300 dark:border-teal-900/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-teal-950 dark:text-teal-200 block">
                            🔴 الزام اجباری (بند ۳ جدول ۳-۵ افتا) - استفاده از گواهی‌نامه‌های X509v3 تعریف‌شده در RFC 5280 برای احراز هویت:
                          </span>
                          <span className="text-[10px] bg-teal-600 text-white font-mono px-2.5 py-0.5 rounded-full font-bold">
                            الزام اجباری (جدول ۳-۵ بند ۳)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                          {[
                            { key: "https", label: "پشتیبانی از X509v3 در پروتکل HTTPS", scopeName: "HTTPS" },
                            { key: "tls", label: "پشتیبانی از X509v3 در کارکردهای TLS", scopeName: "TLS" },
                            { key: "ssh", label: "پشتیبانی از X509v3 در پروتکل SSH", scopeName: "SSH" },
                            { key: "codeSigningSoftwareUpdates", label: "امضای کد برای بروزرسانی‌های نرم‌افزار سیستم", scopeName: "Code Signing Updates" },
                            { key: "codeSigningIntegrityVerification", label: "امضای کد برای تأیید یکپارچگی", scopeName: "Code Signing Integrity" },
                            { key: "otherUseCases", label: "سایر موارد و کارکردهای احراز هویت", scopeName: "Other Use Cases" },
                          ].map(scope => (
                            <label key={scope.key} className="p-3 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-white dark:bg-slate-900 flex items-start gap-2.5 cursor-pointer hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition-colors">
                              <input
                                type="checkbox"
                                checked={settings.certificateValidationPolicy?.x509v3Rfc5280AuthenticationScopes?.[scope.key] ?? true}
                                onChange={e => {
                                  const isChecked = e.target.checked;
                                  set("certificateValidationPolicy", {
                                    ...settings.certificateValidationPolicy,
                                    x509v3Rfc5280AuthenticationScopes: {
                                      ...settings.certificateValidationPolicy?.x509v3Rfc5280AuthenticationScopes,
                                      [scope.key]: isChecked
                                    }
                                  });
                                  showPopLine(
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (الزام اجباری بند ۳ جدول ۳-۵):\\n\` +
                                    \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (جدول ۳-۵ بند ۳)» 👈 دامنه احراز هویت «\${scope.label}» [\${isChecked ? "فعال و اجبار شد" : "غیرفعال شد"}]\`,
                                    "info"
                                  );
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-teal-600 mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {scope.label}
                                  </span>
                                  <span className="text-[9px] bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                    {scope.scopeName}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                  احراز هویت پایه گواهی‌نامه X.509v3 RFC 5280.
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* فیلد متنی سفارشی برای "سایر موارد" طبق راهنمایی جدول ۳-۵ بند ۳ */}
                        {settings.certificateValidationPolicy?.x509v3Rfc5280AuthenticationScopes?.otherUseCases && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-teal-200 dark:border-teal-900/40 space-y-1.5 mt-2">
                            <label className="text-[11px] font-bold text-teal-950 dark:text-teal-200 block">
                              📝 بیان سایر موارد کارکردهای احراز هویت (مطابق راهنمایی بند ۳ جدول ۳-۵ افتا):
                            </label>
                            <input
                              type="text"
                              value={settings.certificateValidationPolicy?.otherAuthenticationScopesDetails || "احراز هویت وب‌سرویس‌های REST/gRPC، امضای فایل‌های مالی و اسناد سیستم"}
                              onChange={e => {
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  otherAuthenticationScopesDetails: e.target.value
                                });
                              }}
                              placeholder="سایر کارکردهای احراز هویت با گواهی X509v3 را وارد نمایید..."
                              className="w-full text-xs p-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 dir-rtl text-right font-mono"
                            />
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block dir-rtl text-right">
                              * در صورت پشتیبانی از کارکردهای دیگر احراز هویت X509v3، عناوین آن‌ها در این بخش بیان می‌گردد.
                            </span>
                          </div>
                        )}
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

                      {/* کارت‌های خلاصه گواهی انطباق بندهای ۴۴ و ۴۵ و بندهای ۲ و ۳ جدول ۳-۵ افتا */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 mt-4">
                        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-amber-950 dark:text-amber-200">بند ۲ جدول ۳-۵</span>
                            <span className="text-[9px] bg-amber-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">اجباری</span>
                          </div>
                          <div className="text-[10px] text-amber-950 dark:text-amber-200 font-mono">
                            🛡️ پذیرش CA با basicConstraints و CA=TRUE.
                          </div>
                        </div>

                        <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-300 dark:border-teal-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-teal-950 dark:text-teal-200">بند ۳ جدول ۳-۵</span>
                            <span className="text-[9px] bg-teal-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">اجباری</span>
                          </div>
                          <div className="text-[10px] text-teal-950 dark:text-teal-200 font-mono">
                            🔑 احراز هویت X.509v3 در HTTPS, TLS, SSH و Code Signing.
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-blue-900 dark:text-blue-200">انطباق بند ۴۴</span>
                            <span className="text-[9px] bg-blue-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">مسیر (اجباری)</span>
                          </div>
                          <div className="text-[10px] text-blue-900 dark:text-blue-200 font-mono">
                            🔴 قوانین ۳‌گانه مسیر RFC 5280 اجباری است.
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-purple-900 dark:text-purple-200">انطباق بند ۴۴</span>
                            <span className="text-[9px] bg-purple-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">فسخ</span>
                          </div>
                          <div className="text-[10px] text-purple-900 dark:text-purple-200 font-mono">
                            ⚙️ روش‌های OCSP و CRL پیکربندی گردید.
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-200">انطباق بند ۴۵</span>
                            <span className="text-[9px] bg-emerald-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">Server Auth</span>
                          </div>
                          <div className="text-[10px] text-emerald-900 dark:text-emerald-200 font-mono">
                            ⭐ گزینه‌ی Server Auth با OID 1.3.6.1.5.5.7.3.1 انتخاب شد.
                          </div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

frontendContent = frontendContent.slice(0, startIndex) + updatedAccordion + frontendContent.slice(endIndex);
fs.writeFileSync(frontendPath, frontendContent, 'utf8');
console.log("SUCCESS: SystemSettingsForm.jsx updated for Band 3 Table 3-5 mandatory X509v3 scope rule!");
