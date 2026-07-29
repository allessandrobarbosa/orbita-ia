import { pool } from './src/backend/db.ts';

async function testInsert() {
  const teorStr = "<acordao_decisao_tcu colegiado=\"Primeira Câmara\" numero=\"1265\" ano=\"2026\">teste html</acordao_decisao_tcu>";
  
  try {
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
      'AC-1265-2026', 'ACÓRDÃO 1265/2026 - PRIMEIRA CÂMARA', 1265, 2026,
      'Primeira Câmara', '17/03/2026',
      "OFICIALIZADO", 'REPRESENTAÇÃO', 'BENJAMIN ZYMLER',
      "Pendente", new Date(), 
      teorStr, null, null, null, null, null, null, null, null, null
    ]);
  } catch(e) {
    console.error("Error inserting:", e);
  }
  
  const res = await pool.query("SELECT key, length(acordao) as len FROM tcu_acordaos WHERE key = 'AC-1265-2026'");
  console.log("DB Test Length:", res.rows);
  
  // Clean up
  await pool.query("DELETE FROM tcu_acordaos WHERE key = 'AC-1265-2026'");
  
  process.exit(0);
}

testInsert();
