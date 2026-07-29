import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  const query = `
    SELECT num_acordao, ano_acordao, colegiado, 
           case when length(trim(coalesce(acordao, ''))) > 10 then 'Preenchido' else 'Vazio' end as status_teor,
           coalesce(num_ata, 'Vazio') as num_ata,
           coalesce(proc, 'Vazio') as proc,
           case when length(trim(coalesce(interessados, ''))) > 0 then 'Preenchido' else 'Vazio' end as interessados
    FROM tcu_acordaos
    WHERE ano_acordao IN (2025, 2026)
    ORDER BY status_teor DESC, ano_acordao DESC, num_acordao DESC
    LIMIT 20;
  `;
  const res = await pool.query(query);
  console.table(res.rows);
  
  const queryEmpty = `
    SELECT key, num_acordao, ano_acordao, colegiado
    FROM tcu_acordaos
    WHERE length(trim(coalesce(acordao, ''))) < 10
  `;
  const resEmpty = await pool.query(queryEmpty);
  console.log("\nAcórdãos com texto vazio (os 4 casos):");
  console.table(resEmpty.rows);
  
  await pool.end();
}
run();
