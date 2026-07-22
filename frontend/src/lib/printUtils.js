/**
 * printTable — یک المان خاص را با تمامی استایل‌های غنی و فونت‌های کاربر چاپ می‌کند
 * @param {string} selector — CSS selector المانی که باید چاپ شود
 * @param {string} title — عنوانی که بالای صفحه چاپ نمایش داده می‌شود
 * @param {string} orientation — 'portrait' یا 'landscape'
 */
export function printTable(selector, title = "", orientation = "portrait") {
  const el = document.querySelector(selector);
  if (!el) { window.print(); return; }

  // کلون عمیق
  const clone = el.cloneNode(true);

  // استخراج تمام لینک‌ها و styleهای موجود در Document تا استایل‌های Tailwind و فونت‌ها دقیق کپی شوند
  const headStyles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
    .map((node) => node.outerHTML)
    .join("\n");

  const content = clone.outerHTML;

  const win = window.open("", "_blank", "width=1200,height=900");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  ${headStyles}
  <style>
    @page {
      size: A4 ${orientation};
      margin: 8mm;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100%;
      background: white !important;
      color: #0f172a !important;
      direction: rtl;
      font-family: inherit;
    }
    button, .no-print {
      display: none !important;
    }
  </style>
</head>
<body class="bg-white p-4">
  ${content}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        window.close();
      }, 400);
    };
  </script>
</body>
</html>`);

  win.document.close();
  win.focus();
}
