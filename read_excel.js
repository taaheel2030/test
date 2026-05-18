const xlsx = require('xlsx');
const wb = xlsx.readFile('../solo items.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
for (let i = 0; i < 10 && i < data.length; i++) {
    console.log(JSON.stringify(data[i]));
}
