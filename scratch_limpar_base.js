import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres"
});

async function run() {
  try {
    console.log("Limpando a tabela scdp_viagens...");
    const res = await pool.query("TRUNCATE TABLE scdp_viagens;");
    console.log("Tabela limpa com sucesso.");
  } catch (e) {
    console.error("Erro ao limpar a tabela:", e);
  } finally {
    await pool.end();
  }
}

run();
