import { pool } from '../src/backend/db.js';

async function updateDb() {
  try {
    console.log('Adicionando colunas de auditoria na tabela scdp_viagens...');
    await pool.query(`
      ALTER TABLE scdp_viagens 
      ADD COLUMN IF NOT EXISTS sobreposicao_ferias BOOLEAN,
      ADD COLUMN IF NOT EXISTS sobreposicao_licenca BOOLEAN,
      ADD COLUMN IF NOT EXISTS inconsistencia_vinculo BOOLEAN;
    `);
    console.log('Tabela atualizada com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    await pool.end();
  }
}

updateDb();
