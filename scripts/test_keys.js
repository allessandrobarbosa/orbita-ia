import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
});

async function test() {
  try {
    const r1 = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'tcu_acordaos' AND column_name = 'acordao'");
    console.log(r1.rows);
  } finally {
    pool.end();
  }
}
test();
