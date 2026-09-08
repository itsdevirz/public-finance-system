const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const frontendFormPath = path.join(projectRoot, 'frontend', 'src', 'pages', 'SystemSettingsForm.jsx');
const backendPolicyPath = path.join(projectRoot, 'backend', 'src', 'lib', 'securityPolicy.ts');

console.log('Reading frontend file:', frontendFormPath);
let frontendContent = fs.readFileSync(frontendFormPath, 'utf8').replace(/\r\n/g, '\n');

const oldBand3Block = `                      {/* 🔴 الزام ۳: رد بسته‌های بزرگتر از مقدار مشخص (RFC 4253) */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                            بند ۳) کنار گذاشتن بسته‌های بزرگتر از حد آستانه مشخص‌شده (مطابق RFC 4253):
                          </span>
                        </div>
                        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                              حداکثر اندازه بسته مجاز SSH (Max Packet Size Limit):
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              کنار گذاشتن صریح هرگونه بسته SSH با اندازه بیشتر از آستانه مشخص‌شده (پیش‌فرض ۳۵,۰۰۰ بایت).
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={settings.sshProtocolPolicy?.packetSizeLimit?.maxPacketSizeBytes ?? 35000}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  packetSizeLimit: {
                                    ...settings.sshProtocolPolicy?.packetSizeLimit,
                                    maxPacketSizeBytes: Number(e.target.value) || 35000
                                  }
                                });
                              }}
                              className="w-28 px-3 py-1.5 border rounded-lg text-xs font-mono text-center font-bold dark:bg-slate-800 dark:border-slate-700"
                            />
                            <span className="text-xs text-slate-500 font-bold">بایت</span>
                          </div>
                        </div>
                      </div>`;

const newBand3Block = `                      {/* 🔴 الزام اجباری (بند ۳ جدول ۳-۶ و بند ۵۱ افتا) - بیشینه حجم بسته‌های SSH مطابق RFC 4253 و OpenSSH */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-300 dark:border-rose-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-950 dark:text-rose-100 flex items-center gap-1.5">
                              <span>🔴</span>
                              <span>الزام اجباری (بند ۳ جدول ۳-۶ و بند ۵۱ افتا) - تعیین بیشینه حجم بسته‌های قابل انتقال SSH (RFC 4253):</span>
                            </span>
                            <span className="text-[10px] bg-rose-600 text-white font-mono px-2.5 py-0.5 rounded-full font-bold">
                              الزام اجباری (جدول ۳-۶ بند ۳ و بند ۵۱)
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-rose-900 dark:text-rose-300">
                            مطابق RFC 4253 و بند ۵۱ ممیزی افتا، محصول باید در پیاده‌سازی سرویس SSH، بیشینه حجم بسته‌های قابل انتقال را تعیین نموده و کلیه بسته‌های فراتر از حد آستانه را صریحاً کنار بگذارد.
                          </p>
                          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-[10.5px] font-mono text-rose-950 dark:text-rose-200 space-y-1">
                            <div>📌 <strong>راهنمای صریح ممیزی افتا (بند ۵۱):</strong> در صورت استفاده از ابزار OpenSSH، بیشینه حجم بسته به صورت پیش‌فرض برابر <strong>256KB (معادل 262,144 بایت)</strong> می‌باشد (حداقل حد آستانه RFC 4253 برابر 35,000 بایت است).</div>
                          </div>
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                بیشینه حجم مجاز بسته SSH (Max Packet Size Limit):
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                کنار گذاشتن بلافاصله بسته‌های بزرگتر از این حد آستانه جهت ممانعت از حملات Buffer Overflow و DoS.
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={settings.sshProtocolPolicy?.packetSizeLimit?.maxPacketSizeBytes ?? 262144}
                                onChange={e => {
                                  const val = Number(e.target.value) || 35000;
                                  set("sshProtocolPolicy", {
                                    ...settings.sshProtocolPolicy,
                                    packetSizeLimit: {
                                      ...settings.sshProtocolPolicy?.packetSizeLimit,
                                      maxPacketSizeBytes: val
                                    }
                                  });
                                  showPopLine(
                                    \`⚡ تغییر بیشینه حجم بسته SSH (بند ۵۱ افتا): \${val.toLocaleString()} بایت (\${(val / 1024).toFixed(1)} KB) تنظیم گردید.\`,
                                    "info"
                                  );
                                }}
                                className="w-32 px-3 py-1.5 border rounded-lg text-xs font-mono text-center font-bold text-rose-700 dark:text-rose-300 dark:bg-slate-800 dark:border-slate-700"
                              />
                              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold">بایت</span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                (\${((settings.sshProtocolPolicy?.packetSizeLimit?.maxPacketSizeBytes ?? 262144) / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          </div>

                          {/* دکمه‌های پیش‌فرض سریع (Presets) */}
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold text-slate-600 dark:text-slate-400">پیش‌فرض‌های استاندارد:</span>
                            <button
                              type="button"
                              onClick={() => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  packetSizeLimit: {
                                    ...settings.sshProtocolPolicy?.packetSizeLimit,
                                    maxPacketSizeBytes: 262144
                                  }
                                });
                                showPopLine("⚡ بیشینه حجم بسته SSH بر روی پیش‌فرض استاندارد OpenSSH (256KB / 262,144 بایت) تنظیم گردید.");
                              }}
                              className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 rounded-md font-mono text-[10.5px] font-bold hover:bg-rose-200 transition-colors"
                            >
                              ⚡ پیش‌فرض OpenSSH (256 KB / 262,144 بایت)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  packetSizeLimit: {
                                    ...settings.sshProtocolPolicy?.packetSizeLimit,
                                    maxPacketSizeBytes: 35000
                                  }
                                });
                                showPopLine("⚡ بیشینه حجم بسته SSH بر روی حداقل حد آستانه RFC 4253 (35,000 بایت) تنظیم گردید.");
                              }}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-mono text-[10.5px] font-bold hover:bg-slate-200 transition-colors"
                            >
                              🛡️ حداقل RFC 4253 (35,000 بایت)
                            </button>
                          </div>

                          {/* فیلد بیان توضیحات صریح صادر شده برای ممیز طبق خواست بند ۵۱ افتا */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                            <label className="text-[11px] font-bold text-rose-950 dark:text-rose-200 block">
                              📝 بیان صریح «توضیحات بیشینه حجم بسته» (مطابق درخواست بند ۵۱ ممیزی افتا):
                            </label>
                            <input
                              type="text"
                              value={settings.sshProtocolPolicy?.packetSizeLimit?.maxPacketSizeExplanation || "بیشینه حجم بسته قابل انتقال در سرویس OpenSSH برابر 256KB (معادل 262,144 بایت) و حداقل حد آستانه RFC 4253 برابر 35,000 بایت تعیین شده است و بسته‌های بزرگتر کنار گذاشته می‌شوند."}
                              onChange={e => {
                                set("sshProtocolPolicy", {
                                  ...settings.sshProtocolPolicy,
                                  packetSizeLimit: {
                                    ...settings.sshProtocolPolicy?.packetSizeLimit,
                                    maxPacketSizeExplanation: e.target.value
                                  }
                                });
                              }}
                              className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-sans dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                              placeholder="بیان توضیحات بیشینه حجم بسته SSH برای ارائه‌دهی به ممیزان افتا..."
                            />
                          </div>
                        </div>
                      </div>`;

if (frontendContent.includes(oldBand3Block)) {
  frontendContent = frontendContent.replace(oldBand3Block, newBand3Block);
  console.log('✅ Enhanced Band 3 of Table 3-6 and Clause 51 in SystemSettingsForm.jsx');
} else {
  console.warn('⚠️ Could not find exact oldBand3Block');
}

fs.writeFileSync(frontendFormPath, frontendContent, 'utf8');
console.log('✅ Saved frontend file.');

// Backend updates
console.log('Reading backend file:', backendPolicyPath);
let backendContent = fs.readFileSync(backendPolicyPath, 'utf8').replace(/\r\n/g, '\n');

const backendClause51FnCode = `
// 🌟 الزام اجباری بند ۳ جدول ۳-۶ و بند ۵۱ افتا: بیشینه حجم بسته SSH (RFC 4253 و OpenSSH 256KB)
export function validateClause51SshPacketSize(
  packetSizeBytes: number,
  policy: SshProtocolPolicy = DEFAULT_SECURITY_POLICY.sshProtocolPolicy!
): {
  valid: boolean;
  maxAllowedBytes: number;
  maxAllowedKb: number;
  explanation: string;
  reason?: string;
  aftaCompliance: string;
} {
  const maxAllowedBytes = policy.packetSizeLimit?.maxPacketSizeBytes ?? 262144;
  const maxAllowedKb = maxAllowedBytes / 1024;
  const explanation = policy.packetSizeLimit?.maxPacketSizeExplanation || "بیشینه حجم بسته قابل انتقال در ابزار OpenSSH برابر 256KB (262,144 بایت) است.";

  const valid = packetSizeBytes <= maxAllowedBytes;

  if (!valid) {
    return {
      valid: false,
      maxAllowedBytes,
      maxAllowedKb,
      explanation,
      reason: \`بسته SSH دریافتی با حجم \${packetSizeBytes.toLocaleString()} بایت از بیشینه حجم مجاز (\${maxAllowedBytes.toLocaleString()} بایت / \${maxAllowedKb.toFixed(1)}KB) فراتر رفته و بر اساس RFC 4253 کنار گذاشته شد.\`,
      aftaCompliance: "عدم انطباق با بند ۳ جدول ۳-۶ و بند ۵۱ افتا (تخطی از حد بیشینه بسته SSH)"
    };
  }

  return {
    valid: true,
    maxAllowedBytes,
    maxAllowedKb,
    explanation,
    aftaCompliance: "انطباق کامل با بند ۳ جدول ۳-۶ و بند ۵۱ افتا (تعیین صریح بیشینه حجم بسته SSH بر اساس RFC 4253 و OpenSSH 256KB)"
  };
}
`;

if (!backendContent.includes('validateClause51SshPacketSize')) {
  backendContent += backendClause51FnCode;
  fs.writeFileSync(backendPolicyPath, backendContent, 'utf8');
  console.log('✅ Added validateClause51SshPacketSize to backend/src/lib/securityPolicy.ts');
} else {
  console.log('ℹ️ validateClause51SshPacketSize already exists');
}

console.log('🎉 Done updating Band 51!');
