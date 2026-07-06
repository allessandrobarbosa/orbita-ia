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

function stripHtmlToText(html) {
  return String(html || "").replace(/<[^>]*>/g, "").trim();
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

const dbPath = path.join(__dirname, '..', 'data', 'orbita_db.json');
const filePath = path.join(__dirname, '..', 'data', 'tcu', 'Acórdãos2026.csv');

async function debugSync() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  // Clear 2026 first to simulate fresh import
  db.acordaos = db.acordaos.filter(x => x.ANOACORDAO !== 2026);

  const localKeys = new Set();
  const localReadStream = fs.createReadStream(filePath, { encoding: "utf8" });
  await parseCsvStream(localReadStream, (record) => {
    const num = record.NUMACORDAO?.trim();
    const ano = record.ANOACORDAO?.trim();
    const col = record.COLEGIADO || "Plenário";
    if (num && ano) {
      const normCol = normalizeColegiado(col);
      localKeys.add(`${num}-${ano}-${normCol}`);
    }
    return false;
  });

  const fileStream = fs.createReadStream(filePath, { encoding: "utf8" });
  const processedKeysInCsv = new Set();
  
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let duplicatesInFile = 0;

  await parseCsvStream(fileStream, async (record) => {
    const numAcordao = Number(record.NUMACORDAO);
    const anoAcordao = Number(record.ANOACORDAO);
    const colegiado = record.COLEGIADO || "Plenário";
    const normalizedCol = normalizeColegiado(colegiado);
    
    const csvRowKey = `${numAcordao}-${anoAcordao}-${normalizedCol}`;

    if (processedKeysInCsv.has(csvRowKey)) {
      duplicatesInFile++;
      skipped++;
      console.log(`Skipped as CSV Duplicate: ${csvRowKey}`);
      return false;
    }
    processedKeysInCsv.add(csvRowKey);

    const existingIndex = db.acordaos.findIndex(
      (x) => x.NUMACORDAO === numAcordao && x.ANOACORDAO === anoAcordao && normalizeColegiado(x.COLEGIADO) === normalizedCol
    );

    if (existingIndex >= 0) {
      const current = db.acordaos[existingIndex];
      const hasFullText = current.ACORDAO && current.ACORDAO.trim().length > 100;
      if (hasFullText) {
        skipped++;
        console.log(`Skipped as already existing with full text: ${csvRowKey}`);
        return false;
      }
    }

    // Since we don't have online complete CSV in this test, it will enter the fallback else block
    if (existingIndex >= 0) {
      skipped++;
      console.log(`Skipped in fallback: ${csvRowKey}`);
    } else {
      const fallbackAcordao = {
        KEY: `AC-${numAcordao}-${anoAcordao}-${normalizedCol}`,
        NUMACORDAO: numAcordao,
        ANOACORDAO: anoAcordao,
        COLEGIADO: colegiado
      };
      db.acordaos.unshift(fallbackAcordao);
      imported++;
    }
    return false;
  });

  console.log(`Imported: ${imported}, Updated: ${updated}, Skipped: ${skipped}, Duplicates: ${duplicatesInFile}`);
}

debugSync();
