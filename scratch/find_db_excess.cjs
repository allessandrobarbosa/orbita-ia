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
          await onRecord(record);
        }
      }
      resolve();
    } catch (err) { reject(err); }
  });
}

async function findExcess() {
  const dbPath = path.join(__dirname, '..', 'data', 'orbita_db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const db2026 = db.acordaos.filter(x => x.ANOACORDAO === 2026);
  const dbKeys = new Set(db2026.map(x => `${x.NUMACORDAO}-${x.ANOACORDAO}-${normalizeColegiado(x.COLEGIADO)}`));

  const csvPath = path.join(__dirname, '..', 'data', 'tcu', 'Acórdãos2026.csv');
  const stream = fs.createReadStream(csvPath, { encoding: 'utf8' });

  const csvKeys = new Set();
  await parseCsvStream(stream, (record) => {
    const col = record.COLEGIADO || "Plenário";
    const normCol = normalizeColegiado(col);
    const key = `${record.NUMACORDAO}-${record.ANOACORDAO}-${normCol}`;
    csvKeys.add(key);
  });

  console.log(`DB 2026 Keys Count: ${dbKeys.size}`);
  console.log(`CSV 2026 Keys Count: ${csvKeys.size}`);

  const inDbNotCsv = [];
  db2026.forEach(x => {
    const key = `${x.NUMACORDAO}-${x.ANOACORDAO}-${normalizeColegiado(x.COLEGIADO)}`;
    if (!csvKeys.has(key)) {
      inDbNotCsv.push(x);
    }
  });

  const inCsvNotDb = [];
  for (const key of csvKeys) {
    if (!dbKeys.has(key)) {
      inCsvNotDb.push(key);
    }
  }

  console.log('--- In DB, but NOT in CSV ---');
  inDbNotCsv.forEach(x => {
    console.log(`  Key: ${x.KEY}, Colegiado: ${x.COLEGIADO}, Proc: ${x.PROC}`);
  });
  console.log(`Total: ${inDbNotCsv.length}`);

  console.log('--- In CSV, but NOT in DB ---');
  inCsvNotDb.forEach(k => {
    console.log(`  Key: ${k}`);
  });
  console.log(`Total: ${inCsvNotDb.length}`);
}

findExcess();
