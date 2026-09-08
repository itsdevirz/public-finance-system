const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/SystemSettingsForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetOld = `                  {/* ۴۷. 🌟 پروتکل TLS مشترک کلاینت و سرور (الزامات ۱ و ۲ افتا - رده ۳-۴ / بند ۴۰) */}
                  <AftaAccordionCard
                    id="afta_mutual_tls_protocol"
                    number="الزام افتا (۳-۴)"
                    title="پروتکل TLS مشترک کلاینت و سرور (mTLS)، احراز هویت دوطرفه و مطابقت شناساننده"
                    description="پشتیبانی از احراز هویت دوطرفه با گواهی‌نامه‌های X509v3 و ممانعت از ایجاد کانال در صورت عدم مطابقت نام متمایز (Subject DN) (انطباق بند ۴۰ افتا)"
                    isOpen={!!openAftaSections["afta_mutual_tls_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      {/* 🌟 اطلاعیه انطباق بند ۴۰ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق بند ۴۰ افتا (جدول ۳-۴):</strong> در صورتی که محصول به عنوان کلاینت در پروتکل TLS مشارکت دارد یا به عنوان سرور، کلاینت‌های خود را احراز هویت می‌کند، پیاده‌سازی احراز هویت دوطرفه (mTLS) بر پایه گواهی‌نامه‌های X509v3 الزامی می‌باشد.
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
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۰):\\n\` +
                                    \`• آکاردئون: «پروتکل TLS مشترک کلاینت و سرور (mTLS - بند ۴۰)» 👈 گزینه نقش محصول «\${role.label}» [انتخاب شد]\`,
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

                      {/* الزامات ۱ و ۲ جدول ۳-۴ افتا */}
                      <div className="space-y-3">
                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
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
                                \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۰):\\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک کلاینت و سرور (mTLS - بند ۴۰)» 👈 گزینه «۱. پشتیبانی از احراز هویت دوطرفه با گواهی‌نامه‌های X509v3» [\${isChecked ? "تیک خورد / فعال شد" : "تیک برداشته شد / غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۱. پشتیبانی از احراز هویت دوطرفه کلاینت‌ها/سرورهای TLS با استفاده از گواهی‌نامه‌های X509v3 (الزام اصلی بند ۴۰)
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              برقراری احراز هویت متقابل کلاینت و سرور (Mutual Authentication / mTLS) بر پایه گواهی‌نامه‌های دیجیتال معتبر X.509v3.
                            </span>
                          </div>
                        </label>

                        <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.mutualTlsPolicy?.enforceSubjectIdentityMatching ?? true}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              set("mutualTlsPolicy", {
                                ...settings.mutualTlsPolicy,
                                enforceSubjectIdentityMatching: isChecked
                              });
                              showPopLine(
                                \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۰):\\n\` +
                                \`• آکاردئون: «پروتکل TLS مشترک کلاینت و سرور (mTLS - بند ۴۰)» 👈 گزینه «۲. ممانعت از برقراری کانال امن در صورت عدم مطابقت Subject DN» [\${isChecked ? "تیک خورد / فعال شد" : "تیک برداشته شد / غیرفعال شد"}]\`,
                                "info"
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              ۲. ممانعت از برقراری کانال امن در صورت عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل با شناساننده کلاینت مورد انتظار
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                              در صورت عدم تطابق نام متمایز (Subject DN) یا Subject Alternative Name (SAN) موجود در گواهی‌نامه با شناسه کلاینت مورد انتظار، محصول نباید کانال امن را برقرار سازد.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* خلاصه گواهی انطباق بند ۴۰ افتا */}
                      <div className="mt-4 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-black text-indigo-900 dark:text-indigo-200">
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            <span>گواهی هوشمند انطباق «بند ۴۰ افتا» (پروتکل TLS مشترک mTLS):</span>
                          </div>
                          <span className="text-[10px] bg-indigo-600 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                            الزام ۴۰ افتا (جدول ۳-۴)
                          </span>
                        </div>
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-mono bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/40 dir-rtl text-right space-y-1">
                          <div>🛡️ <strong>وضعیت اجرای mTLS:</strong> پشتیبانی کامل از احراز هویت دوطرفه بر پایه گواهی‌نامه‌های X.509v3 در هر دو نقش TLS Client و TLS Server (فعال و اجبارشده)</div>
                          <div>🔍 <strong>اعتبارسنجی شناسه:</strong> قطع فوری اتصال و عدم ایجاد کانال امن در صورت عدم تطابق Subject DN یا SAN با شناسه کلاینت/سرور مورد انتظار</div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

const replacementNew = `                  {/* ۴۷. 🌟 پروتکل TLS مشترک کلاینت و سرور (الزامات ۱ و ۲ افتا - رده ۳-۴ / بند ۴۰ و بند ۴۱) */}
                  <AftaAccordionCard
                    id="afta_mutual_tls_protocol"
                    number="الزام افتا (۳-۴ - بند ۴۰ و ۴۱)"
                    title="پروتکل TLS مشترک کلاینت و سرور (mTLS)، احراز هویت دوطرفه و انطباق شناساننده"
                    description="پشتیبانی از احراز هویت دوطرفه با گواهی‌نامه‌های X509v3 (بند ۴۰) و عدم برقراری کانال امن در صورت عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل (SAN) با شناساننده کلاینت (بند ۴۱ افتا / جدول ۳-۴ بند ۲)"
                    isOpen={!!openAftaSections["afta_mutual_tls_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      {/* 🌟 اطلاعیه انطباق بند ۴۰ و ۴۱ افتا */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-2.5">
                        <RefreshCw className="h-4 w-4 text-indigo-700 dark:text-indigo-300 shrink-0 mt-0.5 animate-spin-slow" />
                        <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">
                          <strong>اطلاعیه هوشمند انطباق بند ۴۰ و بند ۴۱ افتا (جدول ۳-۴ بندهای ۱ و ۲):</strong> در صورتی که محصول به عنوان سرور، کلاینت‌های خود را احراز هویت می‌کند یا به عنوان کلاینت در TLS مشارکت دارد، پیاده‌سازی احراز هویت دوطرفه (mTLS) بر پایه X.509v3 و نیز عدم ایجاد کانال امن در صورت عدم مطابقت نام متمایز (Subject DN) یا نام دیگر فاعل (SAN) با شناساننده کلاینت مورد انتظار، کاملاً الزامی است.
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
                                    \`⚡ تغییر تنظیمات آکاردئون افتا (بند ۴۰ و ۴۱):\n\` +
                                    \`• آکاردئون: «پروتکل TLS مشترک mTLS (بند ۴۰ و ۴۱)» 👈 گزینه نقش محصول «\${role.label}» [انتخاب شد]\`,
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

                      {/* الزامات ۱ و ۲ جدول ۳-۴ افتا */}
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
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۰):\n\` +
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
                                \`⚡ تغییر تنظیمات آکاردئون افتا (انطباق بند ۴۱):\n\` +
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

                        {/* تنظیمات تکمیلی انطباق بند ۴۱ افتا (روش اعتبارسنجی identity) */}
                        <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200/60 dark:border-purple-900/40 space-y-2 mr-6">
                          <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                            ⚙️ شیوه انضباطی تطابق شناساننده کلاینت (Subject DN & SAN Rule Validation - بند ۴۱):
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">اکشن در صورت عدم تطابق identity:</span>
                              <span className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                                Drop / Reject Connection
                              </span>
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">فیلدهای تحت بررسی:</span>
                              <span className="bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                                Subject DN + SAN (DNS/IP/Email)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* کارت‌های خلاصه گواهی انطباق بند ۴۰ و بند ۴۱ افتا */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
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
                            🔍 <strong>ممانعت از ایجاد کانال امن:</strong> در صورت عدم تطابق Subject DN یا SAN با شناساننده کلاینت مورد انتظار، برقراری کانال امن مطلقاً مسدود می‌گردد.
                          </div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTargetOld = targetOld.replace(/\r\n/g, '\n');
const normalizedReplacementNew = replacementNew.replace(/\r\n/g, '\n');

if (!normalizedContent.includes(normalizedTargetOld)) {
  console.error("ERROR: Target old block not found!");
  process.exit(1);
}

const updatedContent = normalizedContent.replace(normalizedTargetOld, normalizedReplacementNew).replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log("SUCCESS: SystemSettingsForm.jsx updated for Band 41 compliance!");
