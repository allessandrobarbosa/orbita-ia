import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres"
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM scdp_viagens;");
    console.log("Records in scdp_viagens:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

run();
