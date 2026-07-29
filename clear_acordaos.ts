import { pool } from './src/backend/db.ts';

async function clearAcordaos() {
  try {
    await pool.query('TRUNCATE TABLE tcu_acordaos;');
    console.log('Tabela tcu_acordaos truncada com sucesso.');
  } catch (err) {
    console.error('Erro ao truncar a tabela tcu_acordaos:', err);
  }
  process.exit(0);
}
clearAcordaos();
