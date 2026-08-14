const { Client } = require('pg');
const client = new Client({ connectionString: "postgres://postgres:postgres@localhost:5432/postgres" });
client.connect().then(() => {
  return client.query('SELECT nome_arquivo, status, quantidade_inseridos, quantidade_atualizados, quantidade_ignorados, quantidade_erros, quantidade_linhas_csv FROM tcu_import_control ORDER BY id DESC LIMIT 5;');
}).then(r => {
  console.table(r.rows);
  return client.query("SELECT COUNT(*) FROM tcu_acordaos WHERE ano_acordao=2026;");
}).then(r => {
  console.log("Total acordaos de 2026 no banco: ", r.rows[0].count);
  process.exit(0);
}).catch(console.error);
