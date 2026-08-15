import api from "@/api";

/**
 * Validates data egress / export permissions against backend security policy (AFTA Items 8 & 9).
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function validateEgressPermission(options = {}) {
  const { exportType = "CSV", recordCount = 1, fileSizeMB = 1, destination = null } = options;
  try {
    const res = await api.post("/api/security/validate-egress", {
      exportType,
      recordCount,
      fileSizeMB,
      destination
    });

    if (res.data?.success && res.data?.allowed) {
      return { allowed: true };
    } else {
      const msg = res.data?.message || "خروج داده‌ها طبق خط‌مشی‌های امنیتی سامانه مجاز نمی‌باشد.";
      return { allowed: false, reason: msg };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || "خروج داده‌ها طبق خط‌مشی امنیتی بند ۹ افتا محدود گردیده است.";
    return { allowed: false, reason: errorMsg };
  }
}
