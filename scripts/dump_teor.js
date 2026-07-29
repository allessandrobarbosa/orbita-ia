import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  const years = [2026, 2025, 2024, 2023, 2022];
  let markdown = `# Amostra do Inteiro Teor Salvo no Banco\n\n`;
  markdown += `Aqui estão 4 exemplos de cada ano mostrando um pequeno trecho (os primeiros 300 caracteres) do texto gigante que o sistema salvou com sucesso na coluna \`acordao\` (Inteiro Teor).\n\n`;

  for (const year of years) {
    const query = `
      SELECT num_acordao, ano_acordao, colegiado, length(acordao) as tamanho, substring(acordao from 1 for 300) as trecho
      FROM tcu_acordaos
      WHERE ano_acordao = $1 AND length(trim(coalesce(acordao, ''))) > 100
      ORDER BY num_acordao DESC
      LIMIT 4;
    `;
    const res = await pool.query(query, [year]);
    
    markdown += `## Ano ${year}\n\n`;
    if (res.rows.length === 0) {
      markdown += `*Nenhum acórdão com texto encontrado para este ano.*\n\n`;
      continue;
    }

    markdown += `| Acórdão | Colegiado | Tamanho do Texto (caracteres) | Prévia do Inteiro Teor (Início) |\n`;
    markdown += `| :--- | :--- | :--- | :--- |\n`;
    
    for (const row of res.rows) {
      // Remove quebras de linha para não quebrar a tabela markdown
      let snippet = row.trecho.replace(/\n/g, " ").replace(/\r/g, "");
      markdown += `| **${row.num_acordao}/${row.ano_acordao}** | ${row.colegiado} | ${row.tamanho.toLocaleString('pt-BR')} caracteres | _${snippet}..._ |\n`;
    }
    markdown += `\n`;
  }

  fs.writeFileSync('C:\\Users\\alessandro.lourenco\\.gemini\\antigravity-ide\\brain\\91ded105-2a63-4966-ae89-3ba94244d9d8\\amostra_teor_acordaos.md', markdown, 'utf-8');
  console.log("Artifact created.");
  
  await pool.end();
}
run();
