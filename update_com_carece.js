import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  try {
    const res = await pool.query('UPDATE comunicacoes SET carece_resposta = false;');
    console.log(`Updated ${res.rowCount} rows in comunicacoes. carece_resposta is now false for all.`);
  } catch(e) {
    console.error('Error:', e.message);
  }
  pool.end();
}

run();
