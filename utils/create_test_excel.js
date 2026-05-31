const XLSX = require('xlsx');
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ['Header1', 'Header2'],
  ['Foo', 'Bar'],
  ['Baz', 'Qux'],
]);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'test.xlsx');
console.log('test.xlsx created');
