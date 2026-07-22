import { pool } from "./src/backend/db.js";

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mandatos';
    `);
    console.log("Mandatos columns:", res.rows);
    
    const res2 = await pool.query(`
      SELECT * FROM tipos_responsabilidade;
    `);
    console.log("Tipos responsabilidade:", res2.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
