import { pool } from "../src/backend/db.js";

async function clearCguDb() {
  try {
    console.log("Deletando cgu_demands...");
    await pool.query("TRUNCATE TABLE cgu_demands RESTART IDENTITY CASCADE;");
    console.log("Deletando cgu_auditorias...");
    await pool.query("TRUNCATE TABLE cgu_auditorias RESTART IDENTITY CASCADE;");
    console.log("Banco CGU zerado com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao zerar banco:", err);
    process.exit(1);
  }
}

clearCguDb();
