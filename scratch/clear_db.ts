import { pool } from '../src/backend/db.js';

async function main() {
  await pool.query('TRUNCATE TABLE tcu_acordaos RESTART IDENTITY CASCADE');
  console.log('Tabela tcu_acordaos truncada com sucesso.');
  process.exit(0);
}
main();
