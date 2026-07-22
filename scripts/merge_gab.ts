import { pool } from "../src/backend/db.js";

async function mergeGAB() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Find GM and GAB
    const gm = await client.query("SELECT id_unidade FROM unidades WHERE sigla = 'GM'");
    const gab = await client.query("SELECT id_unidade FROM unidades WHERE sigla = 'GAB'");
    
    if (gm.rows.length > 0 && gab.rows.length > 0) {
      const idGM = gm.rows[0].id_unidade;
      const idGAB = gab.rows[0].id_unidade;
      
      // Update funcoes_responsabilidade pointing to GAB to point to GM
      await client.query("UPDATE funcoes_responsabilidade SET id_unidade = $1 WHERE id_unidade = $2", [idGM, idGAB]);
      
      // Update any children of GAB to point to GM
      await client.query("UPDATE unidades SET id_unidade_pai = $1 WHERE id_unidade_pai = $2", [idGM, idGAB]);
      
      // Delete GAB
      await client.query("DELETE FROM unidades WHERE id_unidade = $1", [idGAB]);
      
      console.log("Mesclagem concluída: GAB movido para GM.");
    } else {
      console.log("GAB ou GM não encontrados, ou já resolvidos.");
    }
    
    await client.query("COMMIT");
  } catch(e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

mergeGAB();
