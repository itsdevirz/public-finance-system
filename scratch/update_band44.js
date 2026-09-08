const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/SystemSettingsForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '{/* ۴۸. 🌟 اعتبارسنجی گواهی‌نامه (الزامات ۱، ۲ و ۳ افتا - رده ۳-۵)';
const endMarker = '{/* ۴۹. 🌟 الزامات امنیتی پروتکل SSH';

const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  console.error("ERROR: startMarker not found!");
  process.exit(1);
}

const endIndex = content.indexOf(endMarker, startIndex);
if (endIndex === -1) {
  console.error("ERROR: endMarker not found!");
  process.exit(1);
}

const newBlock = `{/* ۴۸. 🌟 اعتبارسنجی گواهی‌نامه (الزامات ۱، ۲ و ۳ افتا - رده ۳-۵ / بند ۴۴ افتا - جدول ۳-۵ بند ۱) */}
                  <AftaAccordionCard
                    id="afta_certificate_validation_policy"
                    number="الزام افتا (۳-۵ - بند ۴۴)"
                    title="اعتبارسنجی گواهی‌نامه، قوانین مسیر، روش‌های فسخ و OIDهای extendedKeyUsage"
                    description="الزام اجباری بودن ۳ گزینه اول قوانین مسیر، انتخاب پیاده‌سازی‌محور روش‌های فسخ، و قوانین شرطی extendedKeyUsage (بند ۴۴ افتا / جدول ۳-۵ بند ۱)"
                    isOpen={!!openAftaSections["afta_certificate_validation_policy"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* 🌟 اطلاعیه هوشمند انطباق بند ۴۴ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق بند ۴۴ افتا (جدول ۳-۵ بند ۱):</strong> طبق ضوابط بند ۴۴ افتا:
                          <span className="block mt-1 font-mono text-[10.5px]">
                            • <strong>بخش ۱ (قوانین مسیر):</strong> سه گزینه اول (RFC 5280، پایان به CA مورد اعتماد، basicConstraints با CA=TRUE) <u>کاملاً اجباری</u> هستند.<br />
                            • <strong>بخش ۲ (روش‌های فسخ):</strong> روش‌های تأیید فسخ (OCSP/CRL) بسته به پیاده‌سازی محصول تعیین می‌گردند.<br />
                            • <strong>بخش ۳ (قوانین extendedKeyUsage):</strong> انتخاب OIDها بسته به شرایط محصول (Code Signing برای بروزرسانی/وصله، Server Auth برای TLS Server، Client Auth برای TLS Client، OCSP Signing برای OCSP) شرطی‌سازی شده است.
                          </span>
                        </div>
                      </div>

                      {/* 🔵 بخش ۱: الزام ۱ افتا - قوانین تأیید مسیر گواهی‌نامه (Certificate Path Validation Rules - سه گزینه اول اجباری) */}
                      <div className="space-y-3">
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

                      {/* 🔴 بخش ۲: الزام ۲ افتا - پذیرش گواهی‌نامه CA تنها با basicConstraints و پرچم CA=TRUE */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                            بخش ۲) شرط پذیرش گواهی‌نامه به عنوان CA توسط محصول:
                          </span>
                        </div>

                        <label className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-start gap-3 cursor-pointer">
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
                                \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۴):\n\` +
                                \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (بند ۴۴)» 👈 گزینه «پذیرش CA تنها با basicConstraints و CA=TRUE» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-amber-400 text-amber-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                              محصول باید تنها در صورتی که افزونه مربوط به basicConstraints از پیش تنظیم شده باشد و همچنین، پرچم CA به حالت TRUE تنظیم شده باشد، یک گواهی‌نامه را به عنوان گواهی‌نامه CA بپذیرد.
                            </span>
                            <span className="text-[11px] text-amber-800 dark:text-amber-300 block mt-1 leading-relaxed">
                              جلوگیری از سوءاستفاده و پذیرش گواهی‌نامه‌های غیر مجاز فاقد پرچم صریح CA.
                            </span>
                          </div>
                        </label>
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
                                  // همگام‌سازی هوشمند بند ۴۴ (قانون ۳-iv): در صورت انتخاب OCSP، OID مربوط به OCSP Signing خودکار فعال می‌شود
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

                      {/* 🟢 بخش ۴: قوانین تأیید بخش extendedKeyUsage (بسته به شرایط محصول - بند ۴۴ افتا) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                            بخش ۴) قوانین تأیید بخش extendedKeyUsage (بسته به شرایط محصول انتخاب می‌شود - بند ۴۴ افتا):
                          </span>
                          <span className="text-[10px] bg-emerald-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                            شرطی‌سازی محصول (بند ۴۴ - ۳)
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
                              conditionDesc: "چنانچه برای تأیید اصالت بروزرسانی یا امنیت وصله از امضای دیجیتال استفاده می‌شود، این گزینه باید انتخاب گردد (بند ۴۴-۳-i)."
                            },
                            {
                              key: "serverAuthOid",
                              ruleNum: "۳-ii",
                              title: "احراز هویت سرور (Server Authentication)",
                              purpose: "Server Authentication (id-kp1)",
                              oid: "1.3.6.1.5.5.7.3.1",
                              conditionDesc: "چنانچه محصول در حالت سرور پروتکل TLS قرار می‌گیرد، این گزینه باید انتخاب گردد (بند ۴۴-۳-ii)."
                            },
                            {
                              key: "clientAuthOid",
                              ruleNum: "۳-iii",
                              title: "احراز هویت کلاینت (Client Authentication)",
                              purpose: "Client Authentication (id-kp2)",
                              oid: "1.3.6.1.5.5.7.3.2",
                              conditionDesc: "چنانچه محصول در ارتباطی (حتا داخلی) در حالت کلاینت پروتکل TLS قرار می‌گیرد، این گزینه باید انتخاب گردد (بند ۴۴-۳-iii)."
                            },
                            {
                              key: "ocspSigningOid",
                              ruleNum: "۳-iv",
                              title: "امضای پاسخ‌دهنده فسخ (OCSP Signing)",
                              purpose: "OCSP Signing (id-pk9)",
                              oid: "1.3.6.1.5.5.7.3.9",
                              conditionDesc: "چنانچه در بخش روش‌های تأیید فسخ گواهی‌نامه، گزینه OCSP انتخاب شده است، این گزینه باید انتخاب گردد (بند ۴۴-۳-iv)."
                            },
                          ].map(eku => (
                            <label key={eku.key} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
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
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۴ - قوانین EKU):\n\` +
                                    \`• آکاردئون: «اعتبارسنجی گواهی‌نامه (بند ۴۴)» 👈 قانون EKU «\${eku.title} (\${eku.ruleNum})» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                    "info"
                                  );
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    [{eku.ruleNum}] {eku.title}
                                  </span>
                                  <span className="text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    {eku.purpose}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-1 dir-ltr text-left">
                                  OID: {eku.oid}
                                </span>
                                <span className="text-[10.5px] text-emerald-800 dark:text-emerald-300 block mt-1 leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/20 p-1.5 rounded border border-emerald-100 dark:border-emerald-900/30">
                                  💡 <strong>شرط بند ۴۴:</strong> {eku.conditionDesc}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* کارت‌های خلاصه گواهی انطباق بند ۴۴ افتا */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
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
                            ⚙️ روش‌های فسخ OCSP و CRL بر اساس پیاده‌سازی محصول تعیین و پیکربندی شده است.
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-emerald-900 dark:text-emerald-200">انطباق بند ۴۴ - OIDهای EKU</span>
                            <span className="text-[9px] bg-emerald-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۵-۳ (شرطی)</span>
                          </div>
                          <div className="text-[10px] text-emerald-900 dark:text-emerald-200 font-mono">
                            🔑 OIDهای EKU (Code Signing, Server Auth, Client Auth, OCSP) بر اساس شرایط فعال گردیدند.
                          </div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

const updated = content.slice(0, startIndex) + newBlock + content.slice(endIndex);
fs.writeFileSync(filePath, updated, 'utf8');
console.log("SUCCESS: SystemSettingsForm.jsx updated for Band 44 compliance!");
