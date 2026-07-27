const fs = require('fs');
const path = require('path');
const dir = path.join('C:/Projetos/orbita-projeto/data/tcu/acordaos');
const unique = new Set();
const yearCounts = {};

fs.readdirSync(dir).forEach(file => {
  if(file.endsWith('.csv')){
    const content = fs.readFileSync(path.join(dir, file), 'latin1');
    const lines = content.split('\n');
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split('""').map(p => p.replace(/"/g, ''));
      if (parts.length < 5) continue;
      const match = parts[0].match(/(\d+)\/(\d{4})/);
      if (!match) continue;
      const key = `AC-${match[1]}-${match[2]}`;
      if (!unique.has(key)) {
        unique.add(key);
        yearCounts[match[2]] = (yearCounts[match[2]] || 0) + 1;
      }
    }
  }
});
console.log(yearCounts);
