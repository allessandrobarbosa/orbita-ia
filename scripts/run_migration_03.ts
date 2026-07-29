import pg from "pg";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function runMigration() {
  const sql = fs.readFileSync("./db/03_tcu_import_control.sql", "utf8");
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("✅ Migration 03_tcu_import_control.sql executada com sucesso!");
  } catch (err: any) {
    console.error("❌ Erro na migration:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
