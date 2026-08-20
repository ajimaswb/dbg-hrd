import fs from 'fs';
const data = JSON.parse(fs.readFileSync('employees.json', 'utf8'));
const fixed = data.filter(e => e.nik && !e.nik.includes('/') && !e.nik.includes('NOTE') && e.nik.length < 20);
fs.writeFileSync('employees_fixed.json', JSON.stringify(fixed, null, 2));
console.log(`Filtered out ${data.length - fixed.length} invalid entries.`);
