const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'tcu', 'Acórdãos2026.csv');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const keys = new Map();
const fullLines = new Map();

lines.forEach((line, index) => {
  if (line.includes('/') && line.includes('C')) {
    const fields = line.split('""').map(f => f.replace(/"/g, '').trim());
    const acordao = fields[0];
    if (acordao) {
      if (!keys.has(acordao)) {
        keys.set(acordao, []);
        fullLines.set(acordao, []);
      }
      keys.get(acordao).push(index + 1);
      fullLines.get(acordao).push(line);
    }
  }
});

console.log('--- Duplicate Acórdãos in CSV ---');
let duplicates = 0;
for (const [k, v] of keys.entries()) {
  if (v.length > 1) {
    duplicates++;
    console.log(`Acórdão: "${k}" on lines: ${v.join(', ')}`);
    console.log('Lines content:');
    v.forEach((lineNum, idx) => {
      console.log(`  Line ${lineNum}: ${fullLines.get(k)[idx]}`);
    });
    console.log('');
  }
}
console.log(`Total duplicate keys in file: ${duplicates}`);
