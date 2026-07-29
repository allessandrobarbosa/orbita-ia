import { pool } from '../src/backend/db.js';
import fs from 'fs';

async function main() {
  const res = await pool.query('SELECT key, ai_analysis_data FROM tcu_acordaos WHERE ai_analysis_data IS NOT NULL');
  fs.writeFileSync('backup_ai.json', JSON.stringify(res.rows, null, 2));
  console.log(`Backed up ${res.rows.length} AI analysis results.`);
  process.exit(0);
}
main();
