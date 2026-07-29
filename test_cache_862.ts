import fs from 'fs';

const content = fs.readFileSync('data/tcu/acordaos/cache-acordao-completo-2026.csv', 'utf8');
const lines = content.split('\n');
const line = lines.find(l => l.includes('ACORDAO-COMPLETO-2746292'));
console.log('CACHE LINE:', line);
