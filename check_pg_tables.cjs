const { Client } = require('pg');

async function check() {
  const connectionString = process.env.GOVHUB_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // List tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log("Tables:");
    for (let row of tablesRes.rows) {
      console.log(`- ${row.table_name}`);
      // Get columns for each table
      const colsRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [row.table_name]);
      for (let col of colsRes.rows) {
        console.log(`    ${col.column_name} (${col.data_type})`);
      }
    }
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

check();
