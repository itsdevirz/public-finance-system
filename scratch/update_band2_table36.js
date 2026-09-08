const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const frontendFormPath = path.join(projectRoot, 'frontend', 'src', 'pages', 'SystemSettingsForm.jsx');
const backendPolicyPath = path.join(projectRoot, 'backend', 'src', 'lib', 'securityPolicy.ts');

console.log('Reading frontend file:', frontendFormPath);
let frontendContent = fs.readFileSync(frontendFormPath, 'utf8').replace(/\r\n/g, '\n');

const oldBand2Block = `                      {/* 🟢 الزام ۲: روش‌های احراز هویت (RFC 4252) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                            بند ۲) روش‌های احراز هویت پروتکل SSH (مطابق RFC 4252):
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sshProtocolPolicy?.authMethods?.publicKeyAuth ?? true}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  authMethods: {
                                    ...settings.sshProtocolPolicy?.authMethods,
                                    publicKeyAuth: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              احراز هویت مبتنی بر کلید عمومی (Public Key Authentication)
                            </span>
                          </label>

                          <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.sshProtocolPolicy?.authMethods?.passwordAuth ?? true}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  authMethods: {
                                    ...settings.sshProtocolPolicy?.authMethods,
                                    passwordAuth: e.target.checked
                                  }
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              احراز هویت مبتنی بر گذرواژه (Password Authentication)
                            </span>
                          </label>
                        </div>
                      </div>`;

const newBand2Block = `                      {/* 🟢 الزام اجباری (جدول ۳-۶ بند ۲ افتا) - روش‌های احراز هویت SSH مطابق RFC 4252 */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                              <span>🔴</span>
                              <span>الزام اجباری (بند ۲ جدول ۳-۶ افتا) - پشتیبانی از روش‌های احراز هویت SSH مطابق RFC 4252:</span>
                            </span>
                            <span className="text-[10px] bg-emerald-600 text-white font-mono px-2.5 py-0.5 rounded-full font-bold">
                              الزام اجباری (جدول ۳-۶ بند ۲)
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-emerald-900 dark:text-emerald-300">
                            مطابق RFC 4252 (پروتکل احراز هویت SSH)، محصول باید در پیاده‌سازی سرویس SSH حداقل یکی یا هر دو روش احراز هویت زیر را پشتیبانی و اجبار نماید. غیرفعال‌سازی هم‌زمان هر دو روش مجاز نمی‌باشد.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <label className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-emerald-50/30 transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.sshProtocolPolicy?.authMethods?.publicKeyAuth ?? true}
                              onChange={e => {
                                const isChecked = e.target.checked;
                                const otherChecked = settings.sshProtocolPolicy?.authMethods?.passwordAuth ?? true;
                                if (!isChecked && !otherChecked) {
                                  showPopLine("⚠️ بر اساس الزام اجباری بند ۲ جدول ۳-۶ افتا (RFC 4252)، حداقل یکی از روش‌های احراز هویت SSH باید فعال باقی بماند.", "warning");
                                  return;
                                }
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  authMethods: {
                                    ...settings.sshProtocolPolicy?.authMethods,
                                    publicKeyAuth: isChecked
                                  }
                                });
                                showPopLine(
                                  \`⚡ تغییر الزام اجباری بند ۲ جدول ۳-۶ افتا (RFC 4252):\\n\` +
                                  \`• احراز هویت «مبتنی بر کلید عمومی (Public Key)» [\${isChecked ? "فعال و اجبار شد" : "غیرفعال شد"}]\`,
                                  "info"
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  ۱. احراز هویت مبتنی بر کلید عمومی (Public Key Authentication)
                                </span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                  publickey
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                                استفاده از زوج کلید عمومی/خصوصی (RSA, ECDSA, Ed25519) جهت احراز هویت کاربران و مدیران SSH مطابق RFC 4252 Section 7.
                              </span>
                            </div>
                          </label>

                          <label className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-slate-900 flex items-start gap-3 cursor-pointer hover:bg-emerald-50/30 transition-colors">
                            <input
                              type="checkbox"
                              checked={settings.sshProtocolPolicy?.authMethods?.passwordAuth ?? true}
                              onChange={e => {
                                const isChecked = e.target.checked;
                                const otherChecked = settings.sshProtocolPolicy?.authMethods?.publicKeyAuth ?? true;
                                if (!isChecked && !otherChecked) {
                                  showPopLine("⚠️ بر اساس الزام اجباری بند ۲ جدول ۳-۶ افتا (RFC 4252)، حداقل یکی از روش‌های احراز هویت SSH باید فعال باقی بماند.", "warning");
                                  return;
                                }
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  authMethods: {
                                    ...settings.sshProtocolPolicy?.authMethods,
                                    passwordAuth: isChecked
                                  }
                                });
                                showPopLine(
                                  \`⚡ تغییر الزام اجباری بند ۲ جدول ۳-۶ افتا (RFC 4252):\\n\` +
                                  \`• احراز هویت «مبتنی بر گذرواژه (Password)» [\${isChecked ? "فعال و اجبار شد" : "غیرفعال شد"}]\`,
                                  "info"
                                );
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 mt-0.5"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                  ۲. احراز هویت مبتنی بر گذرواژه (Password Authentication)
                                </span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                  password
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 leading-relaxed">
                                ارسال امن گذرواژه کاربر روی کانال رمزنگاری‌شده SSH جهت صحت‌سنجی اطلاعات ورود مطابق RFC 4252 Section 8.
                              </span>
                            </div>
                          </label>
                        </div>
                      </div>`;

if (frontendContent.includes(oldBand2Block)) {
  frontendContent = frontendContent.replace(oldBand2Block, newBand2Block);
  console.log('✅ Enhanced Band 2 of Table 3-6 in frontend SystemSettingsForm.jsx');
} else {
  console.warn('⚠️ Could not find exact oldBand2Block');
}

fs.writeFileSync(frontendFormPath, frontendContent, 'utf8');
console.log('✅ Saved frontend file.');

// Backend updates
console.log('Reading backend file:', backendPolicyPath);
let backendContent = fs.readFileSync(backendPolicyPath, 'utf8').replace(/\r\n/g, '\n');

const backendFnCode = `
// 🌟 الزام اجباری بند ۲ جدول ۳-۶ افتا: روش‌های احراز هویت SSH (RFC 4252)
export function validateSshRfc4252AuthMethods(
  policy: SshProtocolPolicy = DEFAULT_SECURITY_POLICY.sshProtocolPolicy!
): {
  valid: boolean;
  publicKeyAuthEnabled: boolean;
  passwordAuthEnabled: boolean;
  reason?: string;
  aftaCompliance: string;
} {
  const publicKeyAuthEnabled = policy.authMethods?.publicKeyAuth !== false;
  const passwordAuthEnabled = policy.authMethods?.passwordAuth !== false;

  const valid = publicKeyAuthEnabled || passwordAuthEnabled;

  if (!valid) {
    return {
      valid: false,
      publicKeyAuthEnabled: false,
      passwordAuthEnabled: false,
      reason: "عدم انطباق با الزام اجباری بند ۲ جدول ۳-۶ افتا: هیچ‌یک از روش‌های احراز هویت SSH (کلید عمومی یا گذرواژه) فعال نمی‌باشد.",
      aftaCompliance: "عدم انطباق با RFC 4252 (جدول ۳-۶ بند ۲)"
    };
  }

  return {
    valid: true,
    publicKeyAuthEnabled,
    passwordAuthEnabled,
    aftaCompliance: "انطباق کامل با الزام اجباری بند ۲ جدول ۳-۶ افتا (پشتیبانی از روش‌های احراز هویت مبتنی بر کلید عمومی و گذرواژه مطابق RFC 4252)"
  };
}
`;

if (!backendContent.includes('validateSshRfc4252AuthMethods')) {
  backendContent += backendFnCode;
  fs.writeFileSync(backendPolicyPath, backendContent, 'utf8');
  console.log('✅ Added validateSshRfc4252AuthMethods to backend/src/lib/securityPolicy.ts');
} else {
  console.log('ℹ️ validateSshRfc4252AuthMethods already exists');
}

console.log('🎉 Done updating Band 2 Table 3-6!');
