const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Copy normalizeColegiado from server.ts
function normalizeColegiado(col) {
  const c = String(col || "").toLowerCase().trim();
  if (c.includes("plen") || c.includes("plenário") || c.includes("plenario")) return "PL";
  if (c.includes("1") || c.includes("primeira") || c.includes("1a") || c.includes("1c")) return "1C";
  if (c.includes("2") || c.includes("segunda") || c.includes("2a") || c.includes("2c")) return "2C";
  return "PL";
}

const filePath = path.join(__dirname, '..', 'data', 'tcu', 'Acórdãos2026.csv');

async function testParse() {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers = [];
  let isHeaderParsed = false;
  const processedKeys = new Map();
  let lineCount = 0;

  for await (let line of rl) {
    lineCount++;
    if (line.charCodeAt(0) === 0xFEFF) {
      line = line.substring(1);
    }
    if (line.includes("Parâmetros de pesquisa:")) {
      continue;
    }

    const rawFields = line.split('""');
    const parsedFields = rawFields.map(f => {
      let clean = f.trim();
      if (clean.startsWith('"')) clean = clean.substring(1);
      if (clean.endsWith('"')) clean = clean.substring(0, clean.length - 1);
      return clean;
    });

    if (parsedFields.length < 2) continue;

    if (!isHeaderParsed) {
      headers = parsedFields.map(h => h.trim().toUpperCase());
      isHeaderParsed = true;
      continue;
    }

    const record = {};
    headers.forEach((h, idx) => {
      record[h] = parsedFields[idx] || "";
    });

    const acordaoVal = record["ACÓRDÃO"] || record["ACORDÃO"] || record["ACORDAO"] || "";
    let numAcordao = "";
    let anoAcordao = "";
    if (acordaoVal) {
      const match = acordaoVal.match(/^(\d+)[\/\-](\d{4})/);
      if (match) {
        numAcordao = match[1];
        anoAcordao = match[2];
      }
    }

    const colegiado = record["COLEGIADO"] || "Plenário";
    const normalizedCol = normalizeColegiado(colegiado);
    const key = `${numAcordao}-${anoAcordao}-${normalizedCol}`;

    if (!processedKeys.has(key)) {
      processedKeys.set(key, []);
    }
    processedKeys.get(key).push({ lineCount, rawLine: line });
  }

  console.log('--- CSV Parsing Results ---');
  let duplicateCount = 0;
  for (const [key, occurrences] of processedKeys.entries()) {
    if (occurrences.length > 1) {
      duplicateCount++;
      console.log(`Duplicate key: "${key}" found in lines: ${occurrences.map(o => o.lineCount).join(', ')}`);
      occurrences.forEach(o => {
        console.log(`  Line ${o.lineCount}: ${o.rawLine}`);
      });
    }
  }
  console.log(`Total records processed: ${processedKeys.size}`);
  console.log(`Total duplicate keys found: ${duplicateCount}`);
}

testParse();
