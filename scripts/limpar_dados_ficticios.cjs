const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function limparDados() {
  try {
    console.log("Conectando ao banco de dados...");
    
    console.log("Limpando tcu_tce_acordao_mapping...");
    await pool.query('DELETE FROM tcu_tce_acordao_mapping');

    console.log("Limpando tcu_tce...");
    await pool.query('DELETE FROM tcu_tce');

    console.log("Limpando tcu_comunicacoes...");
    await pool.query('DELETE FROM tcu_comunicacoes');

    console.log("✅ Dados fictícios de Comunicações e TCE limpos com sucesso!");
    console.log("Agora você pode fazer a reimportação desses módulos através da interface.");
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
  } finally {
    pool.end();
  }
}

limparDados();
