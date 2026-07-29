import fs from 'fs';

const parseCSVLine = (text: string, sep = ',') => {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuote && text[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === sep && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
};

const content = fs.readFileSync('data/tcu/acordaos/cache-acordao-completo-2026.csv', 'utf8');
const lines = content.split('\n');

let fullLine = "";
let found = false;
for (const line of lines) {
  const isNewRow = line.startsWith('"ACORDAO-COMPLETO-') || line.startsWith('"KEY"|"TIPO"');
  if (isNewRow) {
    if (found) {
      break;
    }
    if (line.includes('ACORDAO-COMPLETO-2746292')) {
      found = true;
      fullLine = line;
    }
  } else if (found) {
    fullLine += "\n" + line;
  }
}

const parts = parseCSVLine(fullLine, '|');
console.log('Parsed len:', parts.length);
for (let i = 0; i < parts.length; i++) {
  console.log(`[${i}] = ${parts[i].substring(0, 100).replace(/\n/g, '\\n')}`);
}
