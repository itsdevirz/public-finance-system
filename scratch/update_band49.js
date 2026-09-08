const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const frontendFormPath = path.join(projectRoot, 'frontend', 'src', 'pages', 'SystemSettingsForm.jsx');
const backendPolicyPath = path.join(projectRoot, 'backend', 'src', 'lib', 'securityPolicy.ts');

console.log('Reading frontend file:', frontendFormPath);
let frontendContent = fs.readFileSync(frontendFormPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update Accordion 49 props and title
const oldAccordionHeader = `                  {/* ۴۹. 🌟 الزامات امنیتی پروتکل SSH (الزامات ۱ تا ۹ افتا - رده ۳-۶) */}
                  <AftaAccordionCard
                    id="afta_ssh_protocol"
                    number="الزام افتا (۳-۶)"
                    title="پروتکل SSH، احراز هویت، الگوریتم‌های رمزنگاری، کلید عمومی، MAC، تبادل کلید، آستانه Rekeying و اعتبارسنجی میزبان"
                    description="الزامات ۹‌گانه رده ۳-۶ افتا: استاندارد RFCها، احراز هویت، حد بسته‌ها، الگوریتم‌های Cipher/HostKey/MAC/KEX، تجدید کلید و known_hosts"
                    isOpen={!!openAftaSections["afta_ssh_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">`;

const newAccordionHeader = `                  {/* ۴۹. 🌟 الزامات امنیتی پروتکل SSH (جدول ۳-۶ - بند ۴۹ افتا) */}
                  <AftaAccordionCard
                    id="afta_ssh_protocol"
                    number="الزام افتا (جدول ۳-۶ - بند ۴۹)"
                    title="الزامات امنیتی ۹‌گانه پروتکل SSH (رده ۳-۶ افتا - محصولات مبتنی بر Gnu/Linux)"
                    description="الزامات ۹‌گانه جدول ۳-۶ افتا: استاندارد RFCها، احراز هویت کلید عمومی/گذرواژه، حد بسته‌ها، الگوریتم‌های Cipher/HostKey/MAC/KEX، تجدید کلید (۱ساعت / ۱گیگ) و دیتابیس local known_hosts"
                    isOpen={!!openAftaSections["afta_ssh_protocol"]}
                    onToggle={toggleAftaSection}
                    icon={ShieldCheck}
                  >
                    <div className="space-y-5">
                      {/* Notice Box for Clause 49 AFTA */}
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-300 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
                        <div className="font-black flex items-center gap-2 text-indigo-950 dark:text-indigo-100 text-sm">
                          <span>🛡️</span>
                          <span>اطلاعیه انطباق بند ۴۹ افتا (جدول ۳-۶ - الزامات ۹‌گانه امنیتی پروتکل SSH):</span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed text-indigo-900 dark:text-indigo-300">
                          مطابق بند ۴۹ افتا، در صورت پشتیبانی محصول از پروتکل SSH (در محصولات مبتنی بر Gnu/Linux جهت پیکربندی و مدیریت سرور)، پیاده‌سازی و رعایت تمامی ۹ بند الزامات این جدول الزامی می‌باشد.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10.5px] font-mono pt-1.5 border-t border-indigo-200 dark:border-indigo-800/60">
                          <div>✅ <strong>بندهای ۱ تا ۳:</strong> RFCها، احراز هویت کلید عمومی/گذرواژه، حد بسته‌ها</div>
                          <div>✅ <strong>بندهای ۴ تا ۷:</strong> الگوریتم‌های مجاز Cipher, HostKey, MAC و KEX</div>
                          <div>✅ <strong>بندهای ۸ و ۹:</strong> تجدید کلید (۶۰ دقیقه‌/۱۰۲۴ مگابایت) و local known_hosts</div>
                        </div>
                      </div>`;

if (frontendContent.includes(oldAccordionHeader)) {
  frontendContent = frontendContent.replace(oldAccordionHeader, newAccordionHeader);
  console.log('✅ Updated Accordion 49 header and added Notice Box for Clause 49');
} else {
  console.warn('⚠️ Could not find exact oldAccordionHeader');
}

// 2. Add summary compliance badges at the bottom of Accordion 49
const oldAccordionEnd = `                        <label className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.sshProtocolPolicy?.hostVerificationPolicy?.useLocalKnownHostsDb ?? true}
                            onChange={e => {
                              set("sshProtocolPolicy", {
                                ...settings.sshProtocolPolicy,
                                hostVerificationPolicy: {
                                  ...settings.sshProtocolPolicy?.hostVerificationPolicy,
                                  useLocalKnownHostsDb: e.target.checked
                                }
                              });
                            }}
                            className="h-4 w-4 rounded border-blue-400 text-blue-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                              محصول باید اطمینان حاصل نماید که کلاینت SSH، سرور SSH را با استفاده از پایگاه داده محلی (مخصوص نام میزبان و کلید عمومی متناظر آن RFC 4251 Sec 7.1) احراز هویت می‌نماید.
                            </span>
                            <span className="text-[11px] text-blue-800 dark:text-blue-300 block mt-1 leading-relaxed">
                              تطبیق اجباری کلید عمومی سرور با داده‌های ثبت‌شده در پایگاه داده local known_hosts جهت ممانعت از حملات Man-in-the-Middle.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

const newAccordionEnd = `                        <label className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.sshProtocolPolicy?.hostVerificationPolicy?.useLocalKnownHostsDb ?? true}
                            onChange={e => {
                              const isChecked = e.target.checked;
                              set("sshProtocolPolicy", {
                                ...settings.sshProtocolPolicy,
                                hostVerificationPolicy: {
                                  ...settings.sshProtocolPolicy?.hostVerificationPolicy,
                                  useLocalKnownHostsDb: isChecked
                                }
                              });
                              showPopLine(isChecked ? "✅ الزام ۹ جدول ۳-۶ افتا (احراز هویت سرور SSH با دیتابیس local known_hosts) فعال شد." : "⚠️ الزام ۹ جدول ۳-۶ غیرفعال شد.");
                            }}
                            className="h-4 w-4 rounded border-blue-400 text-blue-600 mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-bold text-blue-950 dark:text-blue-200 block">
                              محصول باید اطمینان حاصل نماید که کلاینت SSH، سرور SSH را با استفاده از پایگاه داده محلی (مخصوص نام میزبان و کلید عمومی متناظر آن RFC 4251 Sec 7.1) احراز هویت می‌نماید.
                            </span>
                            <span className="text-[11px] text-blue-800 dark:text-blue-300 block mt-1 leading-relaxed">
                              تطبیق اجباری کلید عمومی سرور با داده‌های ثبت‌شده در پایگاه داده local known_hosts جهت ممانعت از حملات Man-in-the-Middle.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* 🌟 کارت‌های خلاصه گواهی انطباق بند ۴۹ افتا (جدول ۳-۶) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-300 dark:border-indigo-900/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-indigo-950 dark:text-indigo-200">بندهای ۱ تا ۳ (جدول ۳-۶)</span>
                            <span className="text-[9px] bg-indigo-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">RFC & Auth</span>
                          </div>
                          <div className="text-[10px] text-indigo-950 dark:text-indigo-200 font-mono">
                            📜 انطباق کامل با RFCهای ۶گانه، کلید عمومی/گذرواژه و سقف بسته‌ها.
                          </div>
                        </div>

                        <div className="p-3 bg-purple-50/80 dark:bg-purple-950/40 rounded-xl border border-purple-300 dark:border-purple-900/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-purple-950 dark:text-purple-200">بندهای ۴ تا ۷ (جدول ۳-۶)</span>
                            <span className="text-[9px] bg-purple-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">Algorithms</span>
                          </div>
                          <div className="text-[10px] text-purple-950 dark:text-purple-200 font-mono">
                            🔑 پشتیبانی کامل از لیست الگوریتم‌های مجاز Cipher, HostKey, MAC و KEX.
                          </div>
                        </div>

                        <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-300 dark:border-teal-900/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-teal-950 dark:text-teal-200">بندهای ۸ و ۹ (جدول ۳-۶)</span>
                            <span className="text-[9px] bg-teal-600 text-white font-mono px-1.5 py-0.5 rounded font-bold">Rekey & Hosts</span>
                          </div>
                          <div className="text-[10px] text-teal-950 dark:text-teal-200 font-mono">
                            🔄 تجدید کلید در ۱‌ساعت/۱گیگابایت و احراز با local known_hosts.
                          </div>
                        </div>
                      </div>
                    </div>
                  </AftaAccordionCard>`;

if (frontendContent.includes(oldAccordionEnd)) {
  frontendContent = frontendContent.replace(oldAccordionEnd, newAccordionEnd);
  console.log('✅ Added Clause 49 summary compliance cards to bottom of Accordion 49');
} else {
  console.warn('⚠️ Could not find exact oldAccordionEnd');
}

fs.writeFileSync(frontendFormPath, frontendContent, 'utf8');
console.log('✅ Saved updated frontend file.');

// Backend updates
console.log('Reading backend file:', backendPolicyPath);
let backendContent = fs.readFileSync(backendPolicyPath, 'utf8').replace(/\r\n/g, '\n');

const backendSshFnCode = `
// 🌟 الزام افتا بند ۴۹: ارزیابی انطباق کامل الزامات ۹‌گانه پروتکل SSH (جدول ۳-۶ افتا)
export function validateClause49SshPolicy(
  policy: SecurityPolicyConfig = DEFAULT_SECURITY_POLICY
): {
  valid: boolean;
  sshEnabled: boolean;
  bandsStatus: {
    band1_rfcCompliance: boolean;
    band2_authMethods: boolean;
    band3_packetSizeLimit: boolean;
    band4_ciphers: boolean;
    band5_hostKeys: boolean;
    band6_macs: boolean;
    band7_kex: boolean;
    band8_rekeying: boolean;
    band9_hostVerification: boolean;
  };
  aftaCompliance: string;
} {
  const sshPol = policy.sshProtocolPolicy || DEFAULT_SECURITY_POLICY.sshProtocolPolicy!;

  const bandsStatus = {
    band1_rfcCompliance: !!(sshPol.rfcCompliance?.rfc4251 && sshPol.rfcCompliance?.rfc4252 && sshPol.rfcCompliance?.rfc4253 && sshPol.rfcCompliance?.rfc4254 && sshPol.rfcCompliance?.rfc5656 && sshPol.rfcCompliance?.rfc6668),
    band2_authMethods: !!(sshPol.authMethods?.publicKeyAuth || sshPol.authMethods?.passwordAuth),
    band3_packetSizeLimit: !!(sshPol.packetSizeLimit?.enableMaxPacketCheck && (sshPol.packetSizeLimit?.maxPacketSizeBytes ?? 35000) <= 35000),
    band4_ciphers: !!(sshPol.encryptionAlgorithms?.aeadAes256Gcm || sshPol.encryptionAlgorithms?.aes256Ctr),
    band5_hostKeys: !!(sshPol.hostKeyAlgorithms?.sshEd25519 || sshPol.hostKeyAlgorithms?.rsaSha2512),
    band6_macs: !!(sshPol.macAlgorithms?.aeadAes256Gcm || sshPol.macAlgorithms?.hmacSha2512),
    band7_kex: !!(sshPol.kexAlgorithms?.curve25519Sha256 || sshPol.kexAlgorithms?.dhGroupExchangeSha256),
    band8_rekeying: !!(sshPol.rekeyingPolicy?.enableRekeying && (sshPol.rekeyingPolicy?.maxDurationMinutes ?? 60) <= 60 && (sshPol.rekeyingPolicy?.maxDataTransferredMb ?? 1024) <= 1024),
    band9_hostVerification: !!(sshPol.hostVerificationPolicy?.useLocalKnownHostsDb)
  };

  const valid = Object.values(bandsStatus).every(status => status === true);

  return {
    valid,
    sshEnabled: sshPol.enable !== false,
    bandsStatus,
    aftaCompliance: valid
      ? "انطباق کامل با بند ۴۹ افتا (جدول ۳-۶ - تمامی الزامات ۹‌گانه امنیتی پروتکل SSH در سیستم‌های Gnu/Linux)"
      : "عدم انطباق با برخی الزامات ۹‌گانه جدول ۳-۶ افتا"
  };
}
`;

if (!backendContent.includes('validateClause49SshPolicy')) {
  backendContent += backendSshFnCode;
  fs.writeFileSync(backendPolicyPath, backendContent, 'utf8');
  console.log('✅ Added validateClause49SshPolicy function to backend/src/lib/securityPolicy.ts');
} else {
  console.log('ℹ️ validateClause49SshPolicy already exists in backend file.');
}

console.log('🎉 Done updating Band 49!');
