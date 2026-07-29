import { pool } from './src/backend/db.ts';

async function testInsert() {
  const teorStr = "<acordao_decisao_tcu colegiado=\"Primeira Câmara\" numero=\"13905\" ano=\"2023\">teste html</acordao_decisao_tcu>";
  await pool.query(`
    INSERT INTO tcu_acordaos (
      key, titulo, num_acordao, ano_acordao, colegiado, data_sessao,
      situacao, tipo_processo, relator, status_monitoramento, ultima_atualizacao, 
      acordao, num_ata, proc, acordaos_relacionados, interessados, 
      entidade, unidade_tecnica, assunto, sumario, decisao
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
      $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    ) ON CONFLICT (key) DO UPDATE SET acordao = $12
  `, [
    'TEST-13905-2023', 'Titulo Teste', 13905, 2023, 'Primeira Câmara', '05/12/2023',
    'OFICIALIZADO', 'APOSENTADORIA', 'JORGE OLIVEIRA', 'Pendente', new Date(),
    teorStr, null, null, null, null, null, null, null, null, null
  ]);
  
  const res = await pool.query("SELECT length(acordao) as len FROM tcu_acordaos WHERE key = 'TEST-13905-2023'");
  console.log("DB Test Length:", res.rows[0]);
  process.exit(0);
}

testInsert();
