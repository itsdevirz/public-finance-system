/**
 * printTable — یک المان خاص یا جدول را با تمامی استایل‌های غنی و فونت‌های کاربر چاپ می‌کند
 * @param {string} selector — CSS selector المانی که باید چاپ شود
 * @param {string} title — عنوانی که بالای صفحه چاپ نمایش داده می‌شود
 * @param {string} orientation — 'portrait' یا 'landscape'
 */
export function printTable(selector, title = "", orientation = "portrait") {
  const el = document.querySelector(selector);
  if (!el) {
    window.print();
    return;
  }

  // کلون عمیق المان
  const clone = el.cloneNode(true);

  // حذف المان‌های غیرضروری برای چاپ (دکمه‌ها، آیکون‌ها، کلاس no-print)
  clone.querySelectorAll(".no-print, button, script").forEach((node) => node.remove());

  // اگر جدول صادرشده را می‌خواهیم چاپ کنیم، ستون عملیات (آخرین ستون header و body) را حذف می‌کنیم
  const ths = clone.querySelectorAll("thead tr th");
  if (ths.length > 0) {
    const lastThIndex = ths.length - 1;
    if (ths[lastThIndex].textContent.includes("عملیات")) {
      ths[lastThIndex].remove();
      clone.querySelectorAll("tbody tr").forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length > lastThIndex) {
          tds[lastThIndex].remove();
        }
      });
    }
  }

  // استخراج تمامی استایل‌های موجود در سند (مخصوصاً استایل‌های Tailwind و فونت‌ها)
  const styleElements = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"));
  const headStyles = styleElements.map((node) => node.outerHTML).join("\n");

  // ایجاد یا بازاستفاده آی‌فریم مخفی جهت چاپ مستقیم بدون بلاک شدن توسط Popup Blocker
  let iframe = document.getElementById("app-global-print-iframe");
  if (iframe) {
    iframe.remove();
  }
  iframe = document.createElement("iframe");
  iframe.id = "app-global-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <base href="${window.location.origin}/" />
  <title>${title}</title>
  ${headStyles}
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222 47% 11%;
      --card: 0 0% 100%;
      --card-foreground: 222 47% 11%;
      --popover: 0 0% 100%;
      --popover-foreground: 222 47% 11%;
      --primary: 182 75% 28%;
      --primary-foreground: 0 0% 100%;
      --secondary: 182 25% 92%;
      --secondary-foreground: 182 75% 28%;
      --muted: 220 16% 94%;
      --muted-foreground: 220 12% 45%;
      --accent: 38 92% 52%;
      --accent-foreground: 222 47% 11%;
      --destructive: 0 80% 55%;
      --border: 220 20% 89%;
    }
    @page {
      size: A4 ${orientation};
      margin: 8mm;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      width: 100% !important;
      height: auto !important;
      background: white !important;
      color: #0f172a !important;
      direction: rtl !important;
      font-family: Vazirmatn, Tahoma, sans-serif !important;
      margin: 0 !important;
      padding: 12px !important;
      overflow: visible !important;
    }
    .no-print, button, svg.lucide-x {
      display: none !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin-top: 8px !important;
      margin-bottom: 8px !important;
    }
    th, td {
      border: 1px solid #cbd5e1 !important;
      padding: 6px 10px !important;
      text-align: right;
    }
    thead th {
      background-color: #f1f5f9 !important;
      color: #0f172a !important;
      font-weight: bold !important;
    }
  </style>
</head>
<body class="bg-white text-slate-900 p-4">
  ${title ? `<div style="text-align:center; margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 8px;"><h2 style="font-size: 18px; font-weight: bold; margin: 0; color: #0f172a;">${title}</h2></div>` : ''}
  ${clone.outerHTML}
</body>
</html>`);
  iframeDoc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error("Print error:", e);
      window.print();
    }
  }, 400);
}

