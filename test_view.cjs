const { Client } = require('pg');

async function testView() {
  const connectionString = process.env.GOVHUB_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    const res = await client.query('SELECT * FROM vw_srte_dashboard_metrics');
    console.table(res.rows);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

testView();
