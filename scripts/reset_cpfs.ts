import { pool } from "../src/backend/db.js";

async function clearCPFs() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Atualiza todos os CPFs para um valor único temporário para não quebrar a restrição UNIQUE
    await client.query("UPDATE pessoas SET cpf = 'PENDENTE-' || id_pessoa");
    
    await client.query("COMMIT");
    console.log("CPFs apagados com sucesso.");
  } catch(e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

clearCPFs();
