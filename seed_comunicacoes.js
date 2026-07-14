import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'orbita_db.json');
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const comunicacoes = dbData.comunicacoes || [];
    
    console.log("Found comunicacoes:", comunicacoes.length);

    for (const item of comunicacoes) {
      const key = item.KEY || (item.COMUNICACAO + "-" + item.ANO);
      const updatedAt = new Date().toLocaleString('pt-BR');
      
      await pool.query(`
        INSERT INTO comunicacoes (
          key, comunicacao, destinatario, contato, unidade_emitente,
          processo, data_expedicao, data_resposta, ano, carece_resposta,
          prazo_dias, resposta_enviada_internamente, unidade_executora,
          processo_sei, destinacao, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (key) DO UPDATE SET carece_resposta = false
      `, [
        key, item.COMUNICACAO, item.DESTINATARIO, item.CONTATO,
        item.UNIDADE_EMITENTE, item.PROCESSO, item.DATA_EXPEDICAO,
        item.DATA_RESPOSTA, item.ANO, false,
        item.PRAZO_DIAS, item.RESPOSTA_ENVIADA_INTERNAMENTE,
        item.UNIDADE_EXECUTORA, item.PROCESSO_SEI, item.DESTINACAO,
        updatedAt
      ]);
    }
    
    const count = await pool.query('SELECT COUNT(*) FROM comunicacoes');
    console.log("Migration complete. Postgres comunicacoes count:", count.rows[0].count);
    
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

run();
