import fs from 'fs';

const content = fs.readFileSync('data/tcu/acordaos/Acórdãos2026.csv', 'utf8');
const lines = content.split('\n');
for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.includes('862')) {
    const parts = line.split('""').map(p => p.replace(/"/g, ''));
    console.log('LINE:', line);
    console.log('PARTS:', parts);
  }
}
