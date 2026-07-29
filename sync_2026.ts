import fs from 'fs';
import path from 'path';
import { pool } from './src/backend/db.ts';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

const isTeorMissing = (teorVal: any): boolean => {
  if (!teorVal) return true;
  const str = String(teorVal).trim();
  return str === '' || str === 'null' || str === 'undefined' || str === '[]' || str === '{}';
};

async function sync2026() {
  const TCU_DIR = path.resolve(process.cwd(), "data/tcu/acordaos");
  const file = "Acórdãos2026.csv";
  const filePath = path.join(TCU_DIR, file);
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
    
    const acordaoStr = parts[0];
    const match = acordaoStr.match(/(\d+)\/(\d{4})/);
    if (!match) continue;
    
    const numAcordao = Number(match[1]);
    const anoAcordao = Number(match[2]);
    const key = `AC-${numAcordao}-${anoAcordao}`;
    
    if (seenKeysInFile.has(key)) { skippedLines++; continue; }
    seenKeysInFile.add(key);
    
    const check = await pool.query('SELECT key, acordao FROM tcu_acordaos WHERE num_acordao = $1 AND ano_acordao = $2', [numAcordao, anoAcordao]);
    let teor = check.rows.length > 0 ? check.rows[0].acordao : null;
    
    parsedRows.push({
      numAcordao, anoAcordao, key, parts, 
      hasDb: check.rows.length > 0, 
      dbKey: check.rows.length > 0 ? check.rows[0].key : null,
      teor
    });

    if (isTeorMissing(teor)) {
      if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, new Set());
      missingByYear.get(anoAcordao)!.add(String(numAcordao));
    }
  }

  const fetchedTeores = new Map();
  for (const [ano, numsSet] of missingByYear.entries()) {
    const mapForYear = await getComplementaryDataBulk(ano, numsSet);
    fetchedTeores.set(ano, mapForYear);
  }

  let imported = 0;
  let updated = 0;
  for (const row of parsedRows) {
    const updatedAt = new Date().toLocaleString("pt-BR");
    let compData = null;

    if (isTeorMissing(row.teor) && fetchedTeores.has(row.anoAcordao)) {
      compData = fetchedTeores.get(row.anoAcordao)!.get(String(row.numAcordao)) || null;
    }

    if (row.key === 'AC-1265-2026') {
      console.log("Processing AC-1265-2026. hasDb:", row.hasDb, "compData length:", compData?.acordao?.length);
    }

    if (row.hasDb) {
      if (compData) {
        await pool.query(`UPDATE tcu_acordaos SET acordao = $7 WHERE key = $1`, [
          row.dbKey, null, null, null, null, null, compData.acordao
        ]);
      } else {
        if (isTeorMissing(row.teor)) {
           await pool.query(`UPDATE tcu_acordaos SET acordao = NULL WHERE key = $1`, [row.dbKey]);
        }
      }
      updated++;
    } else {
      const fallbackTeor = compData?.acordao || row.teor || null;
      if (row.key === 'AC-1265-2026') console.log("Inserting AC-1265-2026 with fallbackTeor length:", fallbackTeor?.length);
      await pool.query(`
        INSERT INTO tcu_acordaos (
          key, titulo, num_acordao, ano_acordao, colegiado, data_sessao,
          situacao, tipo_processo, relator, status_monitoramento, ultima_atualizacao, 
          acordao, num_ata, proc, acordaos_relacionados, interessados, 
          entidade, unidade_tecnica, assunto, sumario, decisao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
          $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
      `, [
        row.key, `ACÓRDÃO ${row.numAcordao}/${row.anoAcordao} - ${row.parts[2].toUpperCase()}`, row.numAcordao, row.anoAcordao,
        row.parts[2], row.parts[1],
        compData?.situacao || "OFICIALIZADO", row.parts[4], row.parts[5],
        "Pendente", updatedAt, 
        fallbackTeor, compData?.num_ata || null, compData?.proc || null, compData?.acordaos_relacionados || null, 
        compData?.interessados || null, compData?.entidade || null, compData?.unidade_tecnica || row.parts[6] || null, 
        compData?.assunto || null, compData?.sumario || null, compData?.decisao || null
      ]);
      imported++;
    }
  }
  
  console.log(`Finished 2026. Imported: ${imported}, Updated: ${updated}`);
  
  const check = await pool.query("SELECT key, length(acordao) as len FROM tcu_acordaos WHERE key = 'AC-1265-2026'");
  console.log("DB Result for 1265:", check.rows);
  
  process.exit(0);
}

sync2026();
