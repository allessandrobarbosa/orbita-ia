import { pool } from "./src/backend/db";
import { getInteiroTeorFromCache } from "./src/backend/utils/tcuCsvParser";

async function fixTeores() {
  try {
    const res = await pool.query(`SELECT key, num_acordao, ano_acordao FROM tcu_acordaos WHERE acordao IS NULL OR acordao = ''`);
    console.log(`Found ${res.rows.length} acordaos missing Inteiro Teor.`);
    
    for (const row of res.rows) {
      console.log(`Fetching Inteiro Teor for ${row.key}...`);
      const teor = await getInteiroTeorFromCache(row.num_acordao, row.ano_acordao);
      if (teor) {
        await pool.query(`UPDATE tcu_acordaos SET acordao = $1 WHERE key = $2`, [teor, row.key]);
        console.log(`Successfully updated ${row.key}. Length: ${teor.length}`);
      } else {
        console.log(`Could not find Inteiro Teor for ${row.key} in cache.`);
      }
    }
  } catch (e) {
    console.error("Error fixing teores:", e);
  } finally {
    pool.end();
  }
}

fixTeores();
