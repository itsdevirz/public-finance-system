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

const newBlock = `{/* ۴۷. 🌟 پروتکل TLS مشترک کلاینت و سرور (الزامات رده ۳-۴ / بندهای ۴۰، ۴۱، ۴۲ و ۴۳ افتا) */}
                  <AftaAccordionCard
                    id="afta_mutual_tls_protocol"
                    number="الزام افتا (۳-۴ - بندهای ۴۰ تا ۴۳)"
                    title="پروتکل TLS مشترک کلاینت و سرور (mTLS) و اعتبارسنجی شناساننده"
                    description="پشتیبانی از احراز هویت دوطرفه با X.509v3 (بند ۴۰)، عدم برقراری کانال امن در عدم مطابقت شناساننده (بند ۴۱)، احراز هویت سطح سیستم (بند ۴۲)، و حذف توضیحات اضافی غیرالزامی (بند ۴۳ افتا)"
                    isOpen={!!openAftaSections["afta_mutual_tls_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      {/* 🌟 اطلاعیه شفاف‌سازی طبق بند ۴۳ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق بندهای ۴۰ تا ۴۳ افتا (جدول ۳-۴):</strong> در صورت فعال‌سازی احراز هویت کلاینت‌ها توسط سرور، عدم برقراری کانال امن در صورت عدم مطابقت Subject DN / SAN اجرا می‌گردد. 💡 <em>انطباق بند ۴۳ افتا: با توجه به عدم اجباری بودن عمومی احراز هویت دوطرفه کلاینت، توضیحات اضافی غیرضروری حذف گردید.</em>
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
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (بندهای ۴۰ تا ۴۳):\n\` +
                                    \`• آکاردئون: «پروتکل TLS مشترک mTLS» 👈 گزینه نقش محصول «\${role.label}» [انتخاب شد]\`,
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

                      {/* الزامات جدول ۳-۴ افتا */}
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
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۰ و ۴۳):\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک mTLS» 👈 گزینه «۱. پشتیبانی اختیاری/پیکربندی‌پذیر از احراز هویت دوطرفه با X509v3» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. پشتیبانی از احراز هویت دوطرفه کلاینت‌ها/سرورهای TLS با استفاده از گواهی‌نامه‌های X509v3 (الزام بند ۴۰ افتا / جدول ۳-۴ بند ۱)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              قابلیت برقراری احراز هویت متقابل کلاینت و سرور بر پایه گواهی‌نامه‌های دیجیتال X.509v3.
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
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۱):\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک mTLS» 👈 گزینه «۲. ممانعت از ایجاد کانال امن در عدم مطابقت Subject DN / SAN» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. ممانعت از برقراری کانال امن در صورت عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل (SAN) با شناساننده کلاینت مورد انتظار (الزام بند ۴۱ افتا / جدول ۳-۴ بند ۲)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              در صورت عدم تطابق Subject DN یا SAN موجود در گواهی‌نامه با شناساننده کلاینت مورد انتظار، کانال امن برقرار نمی‌گردد.
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
                                \`• آکاردئون: «پروتکل TLS مشترک mTLS» 👈 گزینه «۳. احراز هویت سیستم‌های کلاینت به عنوان سرور (احراز هویت سیستم و نه کاربر)» [\${isChecked ? "فعال شد" : "غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۳. انجام احراز هویت سیستم‌های کلاینت به عنوان TLS Server (الزام بند ۴۲ افتا / جدول ۳-۴ بند ۲)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              احراز هویت کلاینت‌ها به معنی احراز هویت سیستم/دستگاه با گواهی‌نامه دیجیتال است و نه احراز هویت کاربر.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* کارت‌های خلاصه گواهی انطباق بندهای ۴۰ تا ۴۳ افتا */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mt-4">
                        {/* کارت بند ۴۰ */}
                        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200">انطباق بند ۴۰ افتا</span>
                            <span className="text-[9px] bg-indigo-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۴-۱</span>
                          </div>
                          <div className="text-[10px] text-indigo-900 dark:text-indigo-200 font-mono">
                            🛡️ پشتیبانی mTLS X.509v3
                          </div>
                        </div>

                        {/* کارت بند ۴۱ */}
                        <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-purple-900 dark:text-purple-200">انطباق بند ۴۱ افتا</span>
                            <span className="text-[9px] bg-purple-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۴-۲</span>
                          </div>
                          <div className="text-[10px] text-purple-900 dark:text-purple-200 font-mono">
                            🔍 قطع کانال در عدم تطابق شناساننده
                          </div>
                        </div>

                        {/* کارت بند ۴۲ */}
                        <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-teal-900 dark:text-teal-200">انطباق بند ۴۲ افتا</span>
                            <span className="text-[9px] bg-teal-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۴-۲</span>
                          </div>
                          <div className="text-[10px] text-teal-900 dark:text-teal-200 font-mono">
                            💻 احراز هویت سیستم (نه کاربر)
                          </div>
                        </div>

                        {/* کارت بند ۴۳ */}
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-amber-900 dark:text-amber-200">انطباق بند ۴۳ افتا</span>
                            <span className="text-[9px] bg-amber-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">۳-۴-۲</span>
                          </div>
                          <div className="text-[10px] text-amber-900 dark:text-amber-200 font-mono">
                            ✂️ حذف توضیحات اضافی غیرضروری
                          </div>
                        </div>
                      </div>
                    </div>`;

const updated = content.slice(0, startIndex) + newBlock + content.slice(endIndex);
fs.writeFileSync(filePath, updated, 'utf8');
console.log("SUCCESS: SystemSettingsForm.jsx updated for Band 43 compliance (removed extra mandatory explanation)!");
