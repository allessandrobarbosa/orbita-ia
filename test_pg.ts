import { pool } from './src/backend/db.ts';

async function testPg() {
  try {
    const res = await pool.query("SELECT 1");
    console.log("PG SUCCESS:", res.rows);
  } catch (err) {
    console.error("PG ERROR:", err);
  }
  process.exit(0);
}

testPg();
