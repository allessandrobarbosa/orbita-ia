import fs from 'fs';
import path from 'path';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

async function test2026() {
  const file = "Acórdãos2026.csv";
  const filePath = path.join("data/tcu/acordaos", file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const missingByYear = new Map<number, Set<string>>();
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('""').map(p => p.replace(/"/g, ''));
    if (parts.length < 5) continue;
    const match = parts[0].match(/(\d+)\/(\d{4})/);
    if (!match) continue;
    const numAcordao = Number(match[1]);
    const anoAcordao = Number(match[2]);
    if (numAcordao === 1265 && anoAcordao === 2026) {
      if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, new Set());
      missingByYear.get(anoAcordao)!.add(String(numAcordao));
    }
  }
  
  console.log("Missing for 2026:", missingByYear.get(2026)?.size);
  
  if (missingByYear.has(2026)) {
    const mapForYear = await getComplementaryDataBulk(2026, missingByYear.get(2026)!);
    console.log("Fetched teores for 2026 size:", mapForYear.size);
    
    const data1265 = mapForYear.get("1265");
    console.log("Data for 1265:", data1265 ? "FOUND" : "NOT FOUND");
    if (data1265) {
      console.log("Inteiro Teor Length:", data1265.acordao?.length);
    }
  }
}

test2026();
