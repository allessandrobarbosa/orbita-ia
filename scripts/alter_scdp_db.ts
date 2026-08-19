import { pool } from '../src/backend/db.js';

async function alterDb() {
  try {
    console.log('Alterando tipos de colunas para TEXT...');
    await pool.query(`
      ALTER TABLE scdp_viagens 
      ALTER COLUMN destino TYPE TEXT,
      ALTER COLUMN motivo_viagem TYPE TEXT,
      ALTER COLUMN nome_viajante TYPE TEXT;
    `);
    console.log('Tipos atualizados com sucesso para evitar truncation.');
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    await pool.end();
  }
}

alterDb();
