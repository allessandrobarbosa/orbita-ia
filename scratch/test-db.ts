import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

async function checkDatabase(dbName: string) {
  const connectionString = `postgres://postgres:postgres@host.docker.internal:5432/${dbName}`;
  console.log(`\nConnecting to database: ${dbName}...`);
  
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 });
  
  try {
    const client = await pool.connect();
    console.log("Connected successfully!");
    
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log(`Tables in ${dbName}:`);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(tables.slice(0, 15), tables.length > 15 ? `...and ${tables.length - 15} more` : '');
    
    // Check columns of some tables if they exist
    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      if (tableName.includes("scdp") || tableName.includes("viage") || tableName.includes("siafi") || tableName.includes("siape") || tableName.includes("sigepe")) {
        const colsRes = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1;
        `, [tableName]);
        console.log(`\nColumns in ${tableName}:`);
        colsRes.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
      }
    }
    
    client.release();
  } catch (err) {
    console.error(`Error querying ${dbName}:`, err);
  } finally {
    await pool.end();
  }
}

async function main() {
  await checkDatabase("postgres");
  await checkDatabase("airflow");
  await checkDatabase("data_warehouse");
}

main();
