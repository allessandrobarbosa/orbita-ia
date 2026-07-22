import { pool } from "../src/backend/db.js";

async function applySchemaChanges() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Add id_mandato_titular to mandatos if it doesn't exist
    await client.query(`
      ALTER TABLE mandatos 
      ADD COLUMN IF NOT EXISTS id_mandato_titular INTEGER REFERENCES mandatos(id_mandato)
    `);

    console.log("Schema alterado: id_mandato_titular adicionado.");
    
    await client.query("COMMIT");
  } catch(e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

applySchemaChanges();
