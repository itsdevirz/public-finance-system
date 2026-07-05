/**
 * printTable — فقط یک المان خاص را به صورت landscape چاپ می‌کند
 * @param {string} selector  — CSS selector المانی که باید چاپ شود (مثلاً "#print-area")
 * @param {string} title     — عنوانی که بالای صفحه چاپ نمایش داده می‌شود
 */
export function printTable(selector, title = "") {
  const el = document.querySelector(selector);
  if (!el) {
    window.print();   // fallback
    return;
  }

  const content = el.innerHTML;
  const win = window.open("", "_blank", "width=1200,height=800");
  if (!win) {
    window.print();
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 10mm; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: "Vazirmatn", "Tahoma", "Arial", sans-serif;
      font-size: 11px;
      color: #111;
      direction: rtl;
    }

    .print-title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid #333;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }

    th {
      background: #f0f0f0;
      border: 1px solid #bbb;
      padding: 5px 8px;
      font-weight: bold;
      white-space: nowrap;
    }

    td {
      border: 1px solid #ccc;
      padding: 4px 8px;
      white-space: nowrap;
    }

    tbody tr:nth-child(even) { background: #fafafa; }

    tfoot td {
      font-weight: bold;
      background: #e8e8e8;
      border-top: 2px solid #888;
    }

    .text-blue-700  { color: #1d4ed8; }
    .text-rose-700  { color: #be123c; }
    .text-left      { text-align: left; }
    .text-right     { text-align: right; }
    .text-center    { text-align: center; }
    .font-mono      { font-family: monospace; }
    .font-bold      { font-weight: bold; }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${title ? `<div class="print-title">${title}</div>` : ""}
  ${content}
</body>
</html>`);

  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}
