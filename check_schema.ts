import { pool } from './src/backend/db.ts';

async function checkSchema() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tcu_acordaos'");
  console.log("COLUMNS:", res.rows);
  const rows = await pool.query("SELECT * FROM tcu_acordaos WHERE num_acordao = '862' AND ano_acordao = '2026'");
  console.log("ROW 862:", rows.rows[0]);
  process.exit(0);
}

checkSchema();
