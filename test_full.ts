import fs from 'fs';
import path from 'path';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

const isTeorMissing = (teorVal: any): boolean => {
  if (!teorVal) return true;
  const str = String(teorVal).trim();
  return str === '' || str === 'null' || str === 'undefined' || str === '[]' || str === '{}';
};

async function testFull() {
  const file = "Acórdãos2026.csv";
  const filePath = path.join("data/tcu/acordaos", file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let skippedLines = 0;
  const parsedRows: any[] = [];
  const missingByYear = new Map<number, Set<string>>();
  const seenKeysInFile = new Set<string>();

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { skippedLines++; continue; }
    
    const parts = line.split('""').map(p => p.replace(/"/g, ''));
    if (parts.length < 5) continue;
    
    const match = parts[0].match(/(\d+)\/(\d{4})/);
    if (!match) continue;
    
    const numAcordao = Number(match[1]);
    const anoAcordao = Number(match[2]);
    const key = `AC-${numAcordao}-${anoAcordao}`;
    
    if (seenKeysInFile.has(key)) { skippedLines++; continue; }
    seenKeysInFile.add(key);
    
    // Simulate DB check: DB is empty
    const teor = null;
    
    parsedRows.push({ numAcordao, anoAcordao, key, parts, teor });

    if (isTeorMissing(teor)) {
      if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, new Set());
      missingByYear.get(anoAcordao)!.add(String(numAcordao));
    }
  }

  const fetchedTeores = new Map();
  for (const [ano, numsSet] of missingByYear.entries()) {
    console.log(`Calling getComplementaryDataBulk for ${ano} with ${numsSet.size} items...`);
    const mapForYear = await getComplementaryDataBulk(ano, numsSet);
    fetchedTeores.set(ano, mapForYear);
  }

  for (const row of parsedRows) {
    if (row.key === 'AC-1265-2026') {
      let compData = null;
      if (isTeorMissing(row.teor) && fetchedTeores.has(row.anoAcordao)) {
        compData = fetchedTeores.get(row.anoAcordao)!.get(String(row.numAcordao)) || null;
      }
      console.log("CompData for 1265:", compData ? "FOUND" : "NOT FOUND");
      if (compData) {
        console.log("Acordao length:", compData.acordao?.length);
      }
      
      const fallbackTeor = compData?.acordao || row.teor || null;
      console.log("fallbackTeor length:", fallbackTeor?.length);
    }
  }
}

testFull();
