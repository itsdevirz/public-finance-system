const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const frontendFormPath = path.join(projectRoot, 'frontend', 'src', 'pages', 'SystemSettingsForm.jsx');

console.log('Reading frontend file:', frontendFormPath);
let frontendContent = fs.readFileSync(frontendFormPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update onChange handler for TLS in Accordion afta_trusted_channel_protocols (Table 2-9 Band 1)
const oldTlsChannelBlock = `                          <label className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedChannelPolicy?.protocols?.tls ?? true}
                              onChange={e => {
                                set("trustedChannelPolicy", {
                                  ...settings.trustedChannelPolicy,
                                  protocols: {
                                    ...settings.trustedChannelPolicy?.protocols,
                                    tls: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                ۲. TLS (پروتکل امنیت لایه انتقال)
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                برقراری رمزنگاری لایه انتقال در تبادلات داده بین اجزا و موجودیت‌های IT.
                              </span>
                            </div>
                          </label>`;

const newTlsChannelBlock = `                          <label className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.trustedChannelPolicy?.protocols?.tls ?? true}
                              onChange={e => {
                                const isChecked = e.target.checked;
                                set("trustedChannelPolicy", {
                                  ...settings.trustedChannelPolicy,
                                  protocols: {
                                    ...settings.trustedChannelPolicy?.protocols,
                                    tls: isChecked
                                  }
                                });
                                // 🌟 همگام‌سازی بند ۴۸ افتا با جدول ۳-۵ بند ۳
                                set("certificateValidationPolicy", {
                                  ...settings.certificateValidationPolicy,
                                  x509v3Rfc5280AuthenticationScopes: {
                                    ...settings.certificateValidationPolicy?.x509v3Rfc5280AuthenticationScopes,
                                    tls: isChecked
                                  }
                                });
                                showPopLine(
                                  isChecked
                                    ? "⚡ همگام‌سازی انطباق بند ۴۸ افتا: پروتکل TLS در «کانال‌های مورد اعتماد (جدول ۲-۹)» و «اعتبارسنجی گواهی‌نامه (جدول ۳-۵)» فعال و منطبق گردید."
                                    : "⚠️ همگام‌سازی انطباق بند ۴۸ افتا: پروتکل TLS در هر دو جدول ۲-۹ و جدول ۳-۵ غیرفعال و منطبق گردید (رفع عدم انطباق بند ۴۸)."
                                );
                              }}
                              className="h-4 w-4 rounded border-amber-400 text-amber-600 mt-0.5"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  ۲. TLS (پروتکل امنیت لایه انتقال)
                                </span>
                                <span className="text-[9px] bg-amber-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">
                                  بند ۴۸ افتا
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-relaxed">
                                برقراری رمزنگاری لایه انتقال (همگام‌سازی خودکار با دامنه TLS جدول ۳-۵ جهت رفع عدم انطباق).
                              </span>
                            </div>
                          </label>`;

if (frontendContent.includes(oldTlsChannelBlock)) {
  frontendContent = frontendContent.replace(oldTlsChannelBlock, newTlsChannelBlock);
  console.log('✅ Updated TLS protocol checkbox in Table 2-9 Band 1 (trusted channels)');
} else {
  console.warn('⚠️ Could not find exact oldTlsChannelBlock matching string in frontendContent');
}

// 2. Add Notice box and sub-text for Table 2-9 Band 1
const oldHeaderInTrustedChannels = `<h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 border-b pb-2">
                          پروتوکل‌های مورد استفاده برای ایجاد کانال امن:
                        </h4>`;

const newHeaderInTrustedChannels = `<!-- Notice Box for Clause 48 AFTA -->
                        <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                          <div className="font-black flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                            <span>⚡</span>
                            <span>انطباق بند ۴۸ افتا (رفع عدم مغایرت TLS بین جدول ۲-۹ و جدول ۳-۵):</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-300">
                            مطابق بند ۴۸ ممیزی افتا، انتخاب پروتکل TLS در جدول ۲-۹ (کانال‌ها/مسیرهای مورد اعتماد) و دامنه احراز هویت TLS در جدول ۳-۵ (اعتبارسنجی گواهی‌نامه X.509v3) با یکدیگر ارتباط مستقیم دارند. تغییر در هر کدام به صورت خودکار با جدول دیگر همگام‌سازی می‌شود تا مانع از بروز عدم انطباق ممیزی گردد.
                          </p>
                          <div className="text-[10.5px] font-mono text-amber-900 dark:text-amber-300 pt-0.5 border-t border-amber-200 dark:border-amber-800/60">
                            📌 <strong>متن الزامات راهنمای جدول ۲-۹ بند ۱:</strong> «در صورت انتخاب مورد HTTPS، رعایت الزامات ۳-۱-۱ و ۳-۳-۳ و در صورت انتخاب TLS، رعایت الزامات ۳-۲-۱ تا ۳-۴-۳ در بخش ۳ الزامی است.»
                          </div>
                        </div>

                        <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-300 border-b pb-2">
                          پروتوکل‌های مورد استفاده برای ایجاد کانال امن (جدول ۲-۹ بند ۱):
                        </h4>`;

if (frontendContent.includes(oldHeaderInTrustedChannels)) {
  frontendContent = frontendContent.replace(oldHeaderInTrustedChannels, newHeaderInTrustedChannels);
  console.log('✅ Added Clause 48 Notice box to Table 2-9 Band 1');
} else {
  console.warn('⚠️ Could not find exact oldHeaderInTrustedChannels matching string');
}

fs.writeFileSync(frontendFormPath, frontendContent, 'utf8');
console.log('✅ Saved updated frontend file.');
