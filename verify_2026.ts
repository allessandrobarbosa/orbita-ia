import { pool } from './src/backend/db.ts';

async function verify() {
  const res = await pool.query("SELECT key, length(acordao) as len FROM tcu_acordaos WHERE ano_acordao = 2026");
  console.log("Total 2026 records:", res.rows.length);
  
  const zeros = res.rows.filter(r => !r.len || r.len === 0);
  console.log("Records with empty/null acordao:", zeros.length);
  
  if (zeros.length > 0) {
    console.log("Some empty records:", zeros.slice(0, 5));
  }
  
  process.exit(0);
}
verify();
