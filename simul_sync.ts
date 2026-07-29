import fs from 'fs';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';
import path from 'path';

async function simulate() {
  const file = "Acórdãos2023.csv";
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
    if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, new Set());
    missingByYear.get(anoAcordao)!.add(String(numAcordao));
  }
  
  console.log("Missing for 2023:", missingByYear.get(2023)?.size);
  
  const mapForYear = await getComplementaryDataBulk(2023, missingByYear.get(2023)!);
  console.log("Fetched teores for 2023 size:", mapForYear.size);
  
  const data13905 = mapForYear.get("13905");
  console.log("Data for 13905:", data13905?.acordao?.substring(0, 100));
}

simulate();
