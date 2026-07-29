import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function clearAcordaos() {
  const client = await pool.connect();
  try {
    await client.query("TRUNCATE TABLE tcu_acordaos RESTART IDENTITY CASCADE;");
    await client.query("DELETE FROM tcu_import_control WHERE modulo = 'TCU_ACORDAOS';");
    console.log("✅ Base de acórdãos e controles de importação do TCU zerados com sucesso!");
  } catch (err: any) {
    console.error("❌ Erro ao limpar base:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clearAcordaos();
