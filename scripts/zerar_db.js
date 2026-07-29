import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
});

async function test() {
  try {
    await pool.query("TRUNCATE TABLE tcu_acordaos");
    console.log("Banco de dados de acórdãos zerado com sucesso!");
  } finally {
    pool.end();
  }
}
test();
