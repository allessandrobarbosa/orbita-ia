import { pool } from "./src/backend/db.js";

async function run() {
  try {
    await pool.query("DELETE FROM contratos_consumo_mensal");
    await pool.query("DELETE FROM contratos_fiscais");
    await pool.query("DELETE FROM contratos_aditivos");
    await pool.query("DELETE FROM contratos_empenhos");
    await pool.query("DELETE FROM contratos");
    console.log("Banco de contratos e vinculações zerado (Postgres)!");
  } catch (error) {
    console.error("Erro ao zerar banco:", error);
  }
  process.exit(0);
}
run();
