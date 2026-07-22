import fs from "fs";
import path from "path";
import { pool } from "../src/backend/db.js"; // Supondo que .js ou .ts funcione com tsx

async function initDb() {
  console.log("Iniciando conexão com o banco de dados PostgreSQL...");
  const client = await pool.connect();
  
  try {
    const sqlPath = path.join(process.cwd(), "db", "02_tcu_rol_responsaveis_schema.sql");
    console.log(`Lendo arquivo SQL em: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, "utf-8");
    
    console.log("Executando DDL (Criação de Tabelas e Triggers)...");
    await client.query(sql);
    console.log("✅ Banco de dados inicializado com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro ao inicializar o banco de dados:", error);
  } finally {
    client.release();
    process.exit(0);
  }
}

initDb();
