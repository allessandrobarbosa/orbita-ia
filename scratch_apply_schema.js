import fs from 'fs';
import path from 'path';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres"
});

async function run() {
  try {
    console.log("Dropping existing scdp_viagens table...");
    await pool.query("DROP TABLE IF EXISTS scdp_viagens CASCADE;");
    console.log("Table dropped.");

    const schemaPath = path.join(process.cwd(), 'src/backend/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log("Applying schema.sql...");
    await pool.query(schemaSql);
    console.log("Schema applied successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
