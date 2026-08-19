import { pool } from '../src/backend/db.js';

async function clearDB() {
  try {
    console.log('Truncando tabela scdp_viagens...');
    await pool.query('TRUNCATE TABLE scdp_viagens');
    console.log('Tabela truncada com sucesso!');
  } catch (err) {
    console.error('Erro ao truncar a tabela:', err);
  } finally {
    process.exit(0);
  }
}

clearDB();
