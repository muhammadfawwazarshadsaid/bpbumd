const xlsx = require('xlsx');
const file = "/Users/arshad/Downloads/bpbumd/bpbumd/src/migrations/mock/Koreksi_Business Continuity Planning_PPSJ.xlsx";
const workbook = xlsx.readFile(file);
console.log(workbook.SheetNames);
for (const sheetName of workbook.SheetNames) {
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    console.log("Sheet:", sheetName, "Rows:", data.length);
    if (data.length > 5) {
        for (let i = 0; i < 5; i++) {
            console.log(data[i]);
        }
    }
}
