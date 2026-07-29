import fs from 'fs';
import path from 'path';
import { pool } from './src/backend/db.ts';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.ts';

async function update1265() {
  const mapForYear = await getComplementaryDataBulk(2026, new Set(["1265"]));
  const compData = mapForYear.get("1265");
  
  if (!compData) {
    console.log("NOT FOUND IN CACHE");
    process.exit(0);
  }
  
  console.log("Found in cache, length:", compData.acordao?.length);
  
  await pool.query(`
    UPDATE tcu_acordaos SET
      colegiado = $2, data_sessao = $3,
      tipo_processo = $4, relator = $5,
      ultima_atualizacao = $6, acordao = $7,
      num_ata = $8, situacao = $9, proc = $10,
      acordaos_relacionados = $11, interessados = $12,
      entidade = $13, unidade_tecnica = $14,
      assunto = $15, sumario = $16, decisao = $17
    WHERE key = $1
  `, [
    'AC-1265-2026', 
    'Primeira Câmara', '17/03/2026', 'REPRESENTAÇÃO', 'BENJAMIN ZYMLER', 'Agora', 
    compData.acordao, compData.num_ata, compData.situacao, compData.proc,
    compData.acordaos_relacionados, compData.interessados, compData.entidade,
    compData.unidade_tecnica, compData.assunto, compData.sumario, compData.decisao
  ]);
  
  console.log("Updated via query!");
  
  const check = await pool.query("SELECT length(acordao) as len FROM tcu_acordaos WHERE key = 'AC-1265-2026'");
  console.log("DB Length:", check.rows[0]);
  process.exit(0);
}

update1265();
