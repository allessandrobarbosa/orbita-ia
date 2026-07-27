const fs = require('fs');
const path = require('path');
const dir = path.join('C:/Projetos/orbita-projeto/data/tcu/acordaos');
const unique = new Set();
let totalLines = 0;
let skippedLess5 = 0;
let skippedNoMatch = 0;

fs.readdirSync(dir).forEach(file => {
  if(file.endsWith('.csv')){
    const content = fs.readFileSync(path.join(dir, file), 'latin1');
    const lines = content.split('\n');
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      totalLines++;
      const parts = line.split('""').map(p => p.replace(/"/g, ''));
      if (parts.length < 5) {
        skippedLess5++;
        continue;
      }
      const match = parts[0].match(/(\d+)\/(\d{4})/);
      if (!match) {
        skippedNoMatch++;
        continue;
      }
      unique.add(`AC-${match[1]}-${match[2]}`);
    }
  }
});
console.log({ totalLines, skippedLess5, skippedNoMatch, uniqueCount: unique.size });
