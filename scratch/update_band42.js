const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/SystemSettingsForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startMarker = '{/* ۴۷. 🌟 پروتکل TLS مشترک کلاینت و سرور';
const endMarker = '</AftaAccordionCard>';

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

const newBlock = `{/* ۴۷. 🌟 پروتکل TLS مشترک کلاینت و سرور (الزامات ۱، ۲ و ۳ افتا - رده ۳-۴ / بندهای ۴۰، ۴۱ و ۴۲) */}
                  <AftaAccordionCard
                    id="afta_mutual_tls_protocol"
                    number="الزام افتا (۳-۴ - بندهای ۴۰، ۴۱ و ۴۲)"
                    title="پروتکل TLS مشترک کلاینت و سرور (mTLS)، احراز هویت دوطرفه، انطباق شناساننده و احراز هویت سیستم"
                    description="پشتیبانی از احراز هویت دوطرفه با X.509v3 (بند ۴۰)، عدم برقراری کانال امن در عدم مطابقت شناساننده (بند ۴۱)، و احراز هویت سطح سیستم کلاینت (بند ۴۲ افتا / جدول ۳-۴)"
                    isOpen={!!openAftaSections["afta_mutual_tls_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      {/* 🌟 اطلاعیه انطباق بندهای ۴۰، ۴۱ و ۴۲ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق بندهای ۴۰، ۴۱ و ۴۲ افتا (جدول ۳-۴ بندهای ۱ و ۲):</strong> در صورتی که محصول به عنوان سرور، کلاینت‌های خود را احراز هویت می‌کند یا به عنوان کلاینت در TLS مشارکت دارد، پیاده‌سازی احراز هویت دوطرفه (mTLS) بر پایه X.509v3 و نیز عدم ایجاد کانال امن در صورت عدم مطابقت Subject DN / SAN الزامی است. 💡 <em>راهنمایی بند ۴۲ افتا: احراز هویت کلاینت به معنی احراز هویت سیستم/دستگاه (System Authentication) است و نه احراز هویت کاربر.</em>
                        </div>
                      </div>

                      {/* نقش محصول در پروتکل mTLS */}
                      <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                          نقش محصول در پشتیبانی و مشارکت در پروتکل TLS مشترک (mTLS):
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                          {[
                            { key: "tlsClientAndServer", label: "هر دو نقش (TLS Client & TLS Server mTLS)" },
                            { key: "tlsClientOnly", label: "مشارکت به عنوان TLS Client در mTLS" },
                            { key: "tlsServerOnly", label: "احراز هویت کلاینت‌ها به عنوان TLS Server" },
                          ].map(role => (
                            <label key={role.key} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="radio"
                                name="mtlsProductRole"
                                checked={(settings.mutualTlsPolicy?.productRole ?? "tlsClientAndServer") === role.key}
                                onChange={() => {
                                  set("mutualTlsPolicy", {
                                    ...settings.mutualTlsPolicy,
                                    productRole: role.key
                                  });
                                  showPopLine(
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (بندهای ۴۰، ۴۱ و ۴۲):\\n\` +
                                    \`• آکاردئون: «پروتکل TLS مشترک mTLS (بندهای ۴۰، ۴۱ و ۴۲)» 👈 گزینه نقش محصول «\${role.label}» [انتخاب شد]\`,
                                    "info"
                                  );
                                }}
                                className="h-4 w-4 text-indigo-600"
                              />
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {role.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* الزامات ۱، ۲ و ۳ جدول ۳-۴ افتا (بندهای ۴۰، ۴۱ و ۴۲) */}
                      <div className="space-y-3">
                        <label className="p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.mutualTlsPolicy?.enableMutualAuthX509v3 ?? true}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              set("mutualTlsPolicy", {
                                ...settings.mutualTlsPolicy,
                                enableMutualAuthX509v3: isChecked
                              });
                              showPopLine(
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۰):\\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک mTLS (بند ۴۰ افتا)» 👈 گزینه «۱. پشتیبانی از احراز هویت دوطرفه با گواهی‌نامه‌های X509v3» [\${isChecked ? "تیک خورد / فعال شد" : "تیک برداشته شد / غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. پشتیبانی از احراز هویت دوطرفه کلاینت‌ها/سرورهای TLS با استفاده از گواهی‌نامه‌های X509v3 (الزام اصلی بند ۴۰ افتا / جدول ۳-۴ بند ۱)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              برقراری احراز هویت متقابل کلاینت و سرور (Mutual Authentication / mTLS) بر پایه گواهی‌نامه‌های دیجیتال معتبر X.509v3.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.mutualTlsPolicy?.enforceSubjectIdentityMatching ?? true}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              set("mutualTlsPolicy", {
                                ...settings.mutualTlsPolicy,
                                enforceSubjectIdentityMatching: isChecked,
                                rejectMismatchSubjectDnOrSan: isChecked
                              });
                              showPopLine(
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۱):\\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک mTLS (بند ۴۱ افتا)» 👈 گزینه «۲. ممانعت از ایجاد کانال امن در صورت عدم مطابقت Subject DN / SAN با شناساننده کلاینت» [\${isChecked ? "تیک خورد / فعال شد" : "تیک برداشته شد / غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. ممانعت از برقراری کانال امن در صورت عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل (SAN) با شناساننده کلاینت مورد انتظار (الزام اصلی بند ۴۱ افتا / جدول ۳-۴ بند ۲)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              در صورتی که محصول به عنوان سرور کلاینت‌های خود را احراز هویت می‌کند، چنانچه نام متمایز (Subject DN) یا Subject Alternative Name (SAN) موجود در گواهی‌نامه با شناساننده کلاینت مورد انتظار مطابقت نداشته باشد، محصول باید فوراً اتصال را قطع کرده و از ایجاد کانال امن جلوگیری به عمل آورد.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-teal-200/80 dark:border-teal-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.mutualTlsPolicy?.enableClientSystemAuth ?? true}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              set("mutualTlsPolicy", {
                                ...settings.mutualTlsPolicy,
                                enableClientSystemAuth: isChecked
                              });
                              showPopLine(
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۲):\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک mTLS (بند ۴۲ افتا)» 👈 گزینه «۳. احراز هویت سیستم‌های کلاینت به عنوان سرور (احراز هویت سیستم و نه کاربر)» [\${isChecked ? "تیک خورد / فعال شد" : "تیک برداشته شد / غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۳. انجام احراز هویت سیستم‌های کلاینت (System-Level Client Authentication) به عنوان TLS Server (الزام اصلی بند ۴۲ افتا / جدول ۳-۴ بند ۲)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              احراز هویت کلاینت‌ها در پروتکل TLS محصول به عنوان سرور، مطلقاً به معنی احراز هویت سیستم/دستگاه (System Authentication via Client Certificates) است و کاملاً تفکیک‌شده از احراز هویت کاربران انسانی (User Login) عمل می‌نماید (تطابق کامل با راهنمایی بند ۴۲ افتا).
                            </span>
                          </div>
                        </label>

                        {/* تنظیمات تکمیلی انطباق بند ۴۱ و ۴۲ افتا (روش اعتبارسنجی identity) */}
                        <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/40 space-y-2 mr-6">
                          <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                            ⚙️ شیوه انضباطی تطابق شناساننده کلاینت و ماهیت سیستم (System Auth Rule Validation - بندهای ۴۱ و ۴۲):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">اکشن عدم تطابق:</span>
                              <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                                Drop / Reject
                              </span>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">فیلدهای بررسی:</span>
                              <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                                Subject DN + SAN
                              </span>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-teal-100 dark:border-teal-900/30 flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">ماهیت احراز هویت:</span>
                              <span className="bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                                System / Machine Auth
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* کارت‌های خلاصه گواهی انطباق بندهای ۴۰، ۴۱ و ۴۲ افتا */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        {/* کارت بند ۴۰ */}
                        <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-900 dark:text-indigo-200">
                              <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              <span>انطباق بند ۴۰ افتا:</span>
                            </div>
                            <span className="text-[10px] bg-indigo-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                              جدول ۳-۴ بند ۱
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-mono bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 dir-rtl text-right">
                            🛡️ <strong>پشتیبانی mTLS X.509v3:</strong> احراز هویت دوطرفه کلاینت و سرور با گواهی‌نامه دیجیتال معتبر X.509v3 اجبار شده است.
                          </div>
                        </div>

                        {/* کارت بند ۴۱ */}
                        <div className="p-3.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-200">
                              <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              <span>انطباق بند ۴۱ افتا:</span>
                            </div>
                            <span className="text-[10px] bg-purple-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                              جدول ۳-۴ بند ۲
                            </span>
                          </div>
                          <div className="text-[11px] text-purple-900 dark:text-purple-200 leading-relaxed font-mono bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40 dir-rtl text-right">
                            🔍 <strong>ممانعت از ایجاد کانال امن:</strong> در صورت عدم تطابق Subject DN یا SAN با شناساننده کلاینت مورد انتظار، برقراری کانال امن مسدود می‌گردد.
                          </div>
                        </div>

                        {/* کارت بند ۴۲ */}
                        <div className="p-3.5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 rounded-xl border border-teal-200 dark:border-teal-900/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-teal-900 dark:text-teal-200">
                              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                              <span>انطباق بند ۴۲ افتا:</span>
                            </div>
                            <span className="text-[10px] bg-teal-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                              جدول ۳-۴ بند ۲
                            </span>
                          </div>
                          <div className="text-[11px] text-teal-900 dark:text-teal-200 leading-relaxed font-mono bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-teal-100 dark:border-teal-900/40 dir-rtl text-right">
                            💻 <strong>احراز هویت کلاینت/سیستم:</strong> احراز هویت کلاینت‌ها در سطح سیستم (System Authentication) با گواهی X.509v3 بوده و مستقل از کاربر می‌باشد.
                          </div>
                        </div>
                      </div>
                    </div>`;

const updated = content.slice(0, startIndex) + newBlock + content.slice(endIndex);
fs.writeFileSync(filePath, updated, 'utf8');
console.log("SUCCESS: SystemSettingsForm.jsx updated for Band 42 compliance!");
