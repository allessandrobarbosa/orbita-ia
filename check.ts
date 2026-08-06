import { pool } from "./src/backend/db.ts";

async function run() {
  try {
    const r = await pool.query("SELECT id, numero_contrato, uf, data_inicio, data_fim FROM contratos WHERE uf = 'AC'");
    console.log(r.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
