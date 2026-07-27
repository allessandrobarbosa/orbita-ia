const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres' });

async function truncate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Etica
    await client.query('TRUNCATE TABLE etica_processos CASCADE');
    await client.query('TRUNCATE TABLE etica_membros CASCADE');
    await client.query('TRUNCATE TABLE etica_reunioes CASCADE');
    await client.query('TRUNCATE TABLE etica_atas CASCADE');
    await client.query('TRUNCATE TABLE etica_convidados CASCADE');
    
    // CGU
    await client.query('TRUNCATE TABLE cgu_demands CASCADE');
    await client.query('TRUNCATE TABLE cgu_reports CASCADE');
    
    // TCU
    await client.query('TRUNCATE TABLE tcu_acordaos CASCADE');
    await client.query('TRUNCATE TABLE tcu_tce CASCADE');
    await client.query('TRUNCATE TABLE tcu_tce_acordao_mapping CASCADE');

    await client.query('COMMIT');
    console.log('Tabelas zeradas com sucesso!');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

truncate();
