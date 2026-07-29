import { pool } from '../src/backend/db.js';

async function main() {
  const res = await pool.query("SELECT * FROM tcu_acordaos WHERE key = 'AC-4235-2022'");
  console.log(JSON.stringify(res.rows[0], null, 2));
  process.exit(0);
}
main();
