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

const normalizeHeaderName = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, '');

const content = fs.readFileSync('data/tcu/acordaos/cache-acordao-completo-2026.csv', 'utf8');
const lines = content.split('\n');
const headers = parseCSVLine(lines[0], '|');
const normHeaders = headers.map(normalizeHeaderName);

const colIndices = {
  acordao: normHeaders.indexOf("acordao"),
  relatorio: normHeaders.indexOf("relatorio"),
  voto: normHeaders.indexOf("voto"),
  decisao: normHeaders.indexOf("decisao")
};

console.log("Headers:", headers);
console.log("Norm Headers:", normHeaders);
console.log("colIndices:", colIndices);
