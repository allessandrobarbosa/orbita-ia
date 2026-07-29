import { pool } from './src/backend/db.ts';

async function test() {
  const check = await pool.query("SELECT key, titulo, length(acordao) as len, colegiado FROM tcu_acordaos WHERE num_acordao = '862' AND ano_acordao = '2026'");
  console.log("DB Rows:", check.rows);
  process.exit(0);
}

test();
