import fs from 'fs';
import path from 'path';

const backendDir = path.resolve('./backend/src/data');
const frontendDir = path.resolve('./frontend/src/data');

const targetDirs = [backendDir, frontendDir];

for (const dir of targetDirs) {
  console.log(`Processing directory: ${dir}`);

  // 1. Update sanamaCodes.json
  const sanamaCodesPath = path.join(dir, 'sanamaCodes.json');
  if (fs.existsSync(sanamaCodesPath)) {
    const codesData = JSON.parse(fs.readFileSync(sanamaCodesPath, 'utf8'));

    function updateTitles(node) {
      if (node.code === "15008") {
        node.title = "دارایی‌های زیستی مولد";
      }
      if (node.code === "45001") {
        node.title = "درآمدهای مالیاتی";
      }
      if (node.code === "51001") {
        node.title = "درآمدهای مالیاتی";
      }
      if (Array.isArray(node.groups)) node.groups.forEach(updateTitles);
      if (Array.isArray(node.accounts)) node.accounts.forEach(updateTitles);
      if (Array.isArray(node.children)) node.children.forEach(updateTitles);
    }

    updateTitles(codesData);
    fs.writeFileSync(sanamaCodesPath, JSON.stringify(codesData, null, 2), 'utf8');
    console.log(`Updated sanamaCodes.json in ${dir}`);
  }

  // 2. Update subAccountTitles.json
  const subAccountTitlesPath = path.join(dir, 'subAccountTitles.json');
  if (fs.existsSync(subAccountTitlesPath)) {
    let titlesData = JSON.parse(fs.readFileSync(subAccountTitlesPath, 'utf8'));

    const rowMap = new Map();
    titlesData.forEach(item => rowMap.set(item.row, item));

    // Ensure rows 45, 46, 47, 48 exist alongside 49, 50, 51, 52
    if (!rowMap.has(45)) titlesData.push({ row: 45, title: "قسمت هزینه", xmlCode: "ExpensePart", default: "0" });
    if (!rowMap.has(46)) titlesData.push({ row: 46, title: "قلم هزینه", xmlCode: "ExpenseKind", default: "0" });
    if (!rowMap.has(47)) titlesData.push({ row: 47, title: "واحد مجری", xmlCode: "ExecutiveUnit", default: "0" });
    if (!rowMap.has(48)) titlesData.push({ row: 48, title: "خروجی", xmlCode: "Output", default: "0" });

    // Also ensure titles for 49, 50, 51, 52 match if present
    titlesData.forEach(item => {
      if (item.row === 45 || item.row === 49) item.title = "قسمت هزینه";
      if (item.row === 46 || item.row === 50) item.title = "قلم هزینه";
      if (item.row === 47 || item.row === 51) item.title = "واحد مجری";
      if (item.row === 48 || item.row === 52) item.title = "خروجی";
    });

    titlesData.sort((a, b) => a.row - b.row);
    fs.writeFileSync(subAccountTitlesPath, JSON.stringify(titlesData, null, 2), 'utf8');
    console.log(`Updated subAccountTitles.json in ${dir}`);
  }

  // 3. Update sanamaRequirements.json
  const sanamaReqPath = path.join(dir, 'sanamaRequirements.json');
  if (fs.existsSync(sanamaReqPath)) {
    const reqData = JSON.parse(fs.readFileSync(sanamaReqPath, 'utf8'));

    const expenseDetailRows = [45, 46, 47, 48, 49, 50, 51, 52];

    for (const [code, obj] of Object.entries(reqData)) {
      let rows = obj.requiredRows || [];

      // Rule: Codes starting with 91 to 99 must NOT have any expense detail rows
      const first2 = code.substring(0, 2);
      if (["91", "92", "93", "94", "95", "96", "97", "98", "99"].includes(first2)) {
        rows = rows.filter(r => !expenseDetailRows.includes(r));
      }

      // Rule: 13001-13004 -> replace output (48/52) with executive unit (47/51)
      if (["13001", "13002", "13003", "13004"].includes(code)) {
        rows = rows.filter(r => r !== 48 && r !== 52);
        if (!rows.includes(47) && !rows.includes(51)) {
          rows.push(51); // unit exec
        }
      }

      // Rule: 14001 -> replace output (48/52) with executive unit (47/51)
      if (code === "14001") {
        rows = rows.filter(r => r !== 48 && r !== 52);
        if (!rows.includes(47) && !rows.includes(51)) {
          rows.push(51); // unit exec
        }
      }

      // Rule: 45001 to 45007 -> replace output (48/52) with executive unit (47/51)
      if (["45001", "45002", "45003", "45004", "45005", "45006", "45007"].includes(code)) {
        rows = rows.filter(r => r !== 48 && r !== 52);
        if (!rows.includes(47) && !rows.includes(51)) {
          rows.push(51); // unit exec
        }
      }

      obj.requiredRows = [...new Set(rows)].sort((a, b) => a - b);
    }

    fs.writeFileSync(sanamaReqPath, JSON.stringify(reqData, null, 2), 'utf8');
    console.log(`Updated sanamaRequirements.json in ${dir}`);
  }
}

console.log('All rules applied successfully!');
