import { pool } from './src/backend/db.ts';

async function checkDb() {
  const check = await pool.query("SELECT key, length(acordao) as len FROM tcu_acordaos WHERE key = 'AC-1265-2026'");
  console.log("DB Result:", check.rows);
  process.exit(0);
}
checkDb();
