/**
 * printTable — فقط یک المان خاص را به صورت landscape چاپ می‌کند
 * @param {string} selector  — CSS selector المانی که باید چاپ شود
 * @param {string} title     — عنوانی که بالای صفحه چاپ نمایش داده می‌شود
 */
export function printTable(selector, title = "") {
  const el = document.querySelector(selector);
  if (!el) { window.print(); return; }

  // کلون عمیق بدون event listener
  const clone = el.cloneNode(true);

  // حذف min-width از همه المان‌ها تا جدول در صفحه جا شود
  clone.querySelectorAll("*").forEach((node) => {
    node.style.minWidth  = "";
    node.style.maxWidth  = "";
    node.style.overflow  = "visible";
    node.style.overflowX = "visible";
    node.style.overflowY = "visible";
  });

  const content = clone.outerHTML;

  const win = window.open("", "_blank", "width=1400,height=900");
  if (!win) { window.print(); return; }

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 8mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      font-family: "Tahoma", "Arial", sans-serif;
      font-size: 10px;
      color: #111;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── عنوان ── */
    .print-title {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 2px solid #333;
    }

    /* ── wrapper جدول ── */
    .table-wrap {
      width: 100%;
      overflow: visible !important;
    }

    /* ── جدول ── */
    table {
      width: 100% !important;
      min-width: unset !important;
      border-collapse: collapse;
      table-layout: auto;
    }

    th, td {
      border: 1px solid #aaa;
      padding: 4px 6px;
      white-space: nowrap;
      font-size: 10px;
      vertical-align: middle;
    }

    thead th {
      background: #e8e8e8 !important;
      font-weight: bold;
      text-align: right;
    }

    tbody tr:nth-child(even) {
      background: #f7f7f7 !important;
    }

    tfoot td {
      font-weight: bold;
      background: #ddd !important;
      border-top: 2px solid #666;
    }

    /* ── رنگ‌های متن ── */
    .text-blue-700, [class*="text-blue"] { color: #1d4ed8 !important; }
    .text-rose-700, [class*="text-rose"] { color: #be123c !important; }
    .text-left   { text-align: left  !important; }
    .text-right  { text-align: right !important; }
    .text-center { text-align: center !important; }
    .font-mono   { font-family: "Courier New", monospace; }
    .font-bold   { font-weight: bold; }
    .tabular-nums { font-variant-numeric: tabular-nums; }

    /* ── پنهان کردن دکمه‌ها و المان‌های غیر ضروری ── */
    button, .no-print { display: none !important; }

    @media print {
      html, body { width: 100%; }
      table { width: 100% !important; }
    }
  </style>
</head>
<body>
  ${title ? `<div class="print-title">${title}</div>` : ""}
  <div class="table-wrap">
    ${content}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 400);
    };
  </script>
</body>
</html>`);

  win.document.close();
  win.focus();
}
