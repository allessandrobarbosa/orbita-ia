import { pool } from '../src/backend/db.js';

async function alterDb() {
  try {
    console.log('Adicionando novas colunas de Dossiê...');
    await pool.query(`
      ALTER TABLE scdp_viagens 
      ADD COLUMN IF NOT EXISTS cargo TEXT,
      ADD COLUMN IF NOT EXISTS situacao TEXT,
      ADD COLUMN IF NOT EXISTS viagem_urgente TEXT,
      ADD COLUMN IF NOT EXISTS justificativa_urgencia TEXT,
      ADD COLUMN IF NOT EXISTS orgao_solicitante TEXT,
      ADD COLUMN IF NOT EXISTS orgao_superior TEXT;
    `);
    console.log('Novas colunas adicionadas com sucesso.');
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    await pool.end();
  }
}

alterDb();
