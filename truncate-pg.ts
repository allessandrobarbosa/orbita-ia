import { pool } from "./src/backend/db.js";

async function run() {
  await pool.query("DELETE FROM contratos");
  console.log("Banco de contratos zerado (Postgres)!");
  process.exit(0);
}
run();
