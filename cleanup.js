import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  const res = await pool.query('DELETE FROM tce_mappings WHERE acordao_key IS NULL;');
  console.log('Deleted bad mappings:', res.rowCount);
  pool.end();
}

run();
