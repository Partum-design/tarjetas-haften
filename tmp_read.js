const xlsx = require('xlsx');
const fs = require('fs');
const workbook = xlsx.readFile('base_datos/2026 FORMATO REQUERIMIENTOS DATOS CREDENCIALIZACION.xlsx');
let out = '';
for (const sheetName of workbook.SheetNames) {
  out += 'Sheet: ' + sheetName + '\n';
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, {header: 1});
  out += 'Headers (Row 1): ' + JSON.stringify(json[0]) + '\n';
  out += 'Headers (Row 2): ' + JSON.stringify(json[1]) + '\n';
  out += 'Row 3: ' + JSON.stringify(json[2]) + '\n';
  out += 'Row 4: ' + JSON.stringify(json[3]) + '\n';
  out += 'Row 5: ' + JSON.stringify(json[4]) + '\n';
}
fs.writeFileSync('tmp_output.log', out);
