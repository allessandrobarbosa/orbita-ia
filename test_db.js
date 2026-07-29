const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
pool.query("SELECT acordao FROM tcu_acordaos WHERE key = 'AC-8733-2022'").then(r => console.log('Length:', r.rows[0]?.acordao?.length, 'Preview:', r.rows[0]?.acordao?.slice(0, 100))).catch(console.error).finally(() => pool.end());
