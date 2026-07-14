import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  try {
    const res = await pool.query('SELECT COUNT(*) FROM comunicacoes;');
    console.log('comunicacoes count:', res.rows[0].count);
  } catch(e) {
    console.error('Error:', e.message);
  }
  pool.end();
}

run();
