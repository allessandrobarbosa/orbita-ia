import { pool } from "../src/backend/db.js";

async function run() {
  try {
    await pool.query("ALTER TABLE mandatos DROP COLUMN IF EXISTS id_mandato_titular CASCADE");
    console.log("Coluna id_mandato_titular removida.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
