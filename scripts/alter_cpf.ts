import { pool } from "../src/backend/db.js";

async function run() {
  try {
    await pool.query("ALTER TABLE pessoas ALTER COLUMN cpf TYPE VARCHAR(20)");
    console.log("Coluna CPF alterada para VARCHAR(20) para permitir formatações e anonimizações.");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
