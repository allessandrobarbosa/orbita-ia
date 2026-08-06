import { pool } from "./src/backend/db.ts";

async function run() {
  try {
    await pool.query("DELETE FROM contratos WHERE id IN ('C-1', 'C-2', 'C-3', 'C-4', 'C-5')");
    console.log("Cleaned dummy contracts");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
