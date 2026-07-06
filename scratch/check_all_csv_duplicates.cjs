const fs = require('fs');
const path = require('path');
const readline = require('readline');

function normalizeColegiado(col) {
  const c = String(col || "").toLowerCase().trim();
  if (c.includes("plen") || c.includes("plenário") || c.includes("plenario")) return "PL";
  if (c.includes("1") || c.includes("primeira") || c.includes("1a") || c.includes("1c")) return "1C";
  if (c.includes("2") || c.includes("segunda") || c.includes("2a") || c.includes("2c")) return "2C";
  return "PL";
}

function parseCsvStream(stream, onRecord) {
  return new Promise(async (resolve, reject) => {
    try {
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
      let headers = [];
      let isHeaderParsed = false;
      for await (let line of rl) {
        if (line.charCodeAt(0) === 0xFEFF) line = line.substring(1);
        if (line.includes("Parâmetros de pesquisa:")) continue;
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
        if (acordaoVal) {
          const match = acordaoVal.match(/^(\d+)[\/\-](\d{4})/);
          if (match) {
            record.NUMACORDAO = match[1];
            record.ANOACORDAO = match[2];
          }
        }
        if (record.NUMACORDAO && record.ANOACORDAO) {
          const stop = await onRecord(record);
          if (stop) { rl.close(); resolve(); return; }
        }
      }
      resolve();
    } catch (err) { reject(err); }
  });
}

async function checkAll() {
  const years = [2022, 2023, 2024, 2025, 2026];
  for (const y of years) {
    const filePath = path.join(__dirname, '..', 'data', 'tcu', `Acórdãos${y}.csv`);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    const processedKeys = new Map();
    let total = 0;
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    await parseCsvStream(stream, (record) => {
      total++;
      const col = record.COLEGIADO || "Plenário";
      const normCol = normalizeColegiado(col);
      const key = `${record.NUMACORDAO}-${record.ANOACORDAO}-${normCol}`;
      if (!processedKeys.has(key)) {
        processedKeys.set(key, 0);
      }
      processedKeys.set(key, processedKeys.get(key) + 1);
      return false;
    });

    let duplicatesCount = 0;
    for (const [k, v] of processedKeys.entries()) {
      if (v > 1) {
        duplicatesCount += (v - 1);
        console.log(`  Duplicate key in ${y}: "${k}" appeared ${v} times`);
      }
    }
    console.log(`Year ${y}: Total parsed=${total}, Unique keys=${processedKeys.size}, Duplicates counted=${duplicatesCount}`);
  }
}

checkAll();
