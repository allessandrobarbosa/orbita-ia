import { pool } from './src/backend/db.js';
async function test() {
  try {
    const r1 = await pool.query("SELECT key, num_acordao, ano_acordao, length(acordao) FROM tcu_acordaos WHERE num_acordao IN (14068, 10472)");
    console.log(r1.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
