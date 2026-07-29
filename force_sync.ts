import fs from 'fs';
import path from 'path';
import { pool } from './src/backend/db.ts';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

async function forceSync() {
  const TCU_DIR = path.resolve(process.cwd(), "data/tcu/acordaos");
  const files = fs.readdirSync(TCU_DIR);
  
  const csvFiles = files.filter(f => f.toLowerCase().endsWith(".csv") && !f.toLowerCase().includes("cache") && f.includes("2023"));
  
  for (const file of csvFiles) {
    console.log(`Processing ${file}`);
    const filePath = path.join(TCU_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const missingByYear = new Map<number, Set<string>>();
    const parsedRows: any[] = [];
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split('""').map(p => p.replace(/"/g, ''));
      if (parts.length < 5) continue;
      
      const acordaoStr = parts[0];
      const match = acordaoStr.match(/(\d+)\/(\d{4})/);
      if (!match) continue;
      
      const numAcordao = Number(match[1]);
      const anoAcordao = Number(match[2]);
      const key = `AC-${numAcordao}-${anoAcordao}`;
      
      const check = await pool.query('SELECT key, acordao, length(acordao) as len FROM tcu_acordaos WHERE key = $1', [key]);
      
      const teor = check.rows.length > 0 ? check.rows[0].acordao : null;
      const dbLen = check.rows.length > 0 ? check.rows[0].len : null;
      
      parsedRows.push({ numAcordao, anoAcordao, key, parts, teor, dbLen });
      
      if (!teor || String(teor).trim() === '' || String(teor) === 'null') {
        if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, new Set());
        missingByYear.get(anoAcordao)!.add(String(numAcordao));
      }
    }
    
    console.log(`Missing for 2023: ${missingByYear.get(2023)?.size || 0}`);
    
    const fetchedTeores = new Map();
    for (const [ano, numsSet] of missingByYear.entries()) {
      console.log(`Fetching from cache for ${ano}, count: ${numsSet.size}`);
      const mapForYear = await getComplementaryDataBulk(ano, numsSet);
      fetchedTeores.set(ano, mapForYear);
      console.log(`Fetched ${mapForYear.size} teores`);
    }
    
    let updated = 0;
    for (const row of parsedRows) {
      if (!row.teor || String(row.teor).trim() === '' || String(row.teor) === 'null') {
        const compData = fetchedTeores.get(row.anoAcordao)?.get(String(row.numAcordao));
        if (compData && compData.acordao && compData.acordao.trim() !== '') {
          await pool.query('UPDATE tcu_acordaos SET acordao = $1 WHERE key = $2', [compData.acordao, row.key]);
          updated++;
        }
      }
    }
    console.log(`Updated ${updated} records with inteiro teor.`);
  }
  process.exit(0);
}

forceSync();
