const { execSync } = require('child_process');
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function restore() {
  try {
    console.log('Extracting orbita_db.json from git...');
    // Extract raw bytes directly to file without powershell's > operator corrupting it
    execSync('git show 688ee99:data/orbita_db.json > temp_clean.json');
    
    console.log('Reading clean json...');
    const txt = fs.readFileSync('temp_clean.json', 'utf8');
    const data = JSON.parse(txt);
    
    if (!data.acordaos || !Array.isArray(data.acordaos)) {
      throw new Error("Invalid format in JSON.");
    }
    
    console.log(`Found ${data.acordaos.length} acordaos to restore.`);
    let restored = 0;
    
    for (const ac of data.acordaos) {
      if (!ac.NUMACORDAO || !ac.ANOACORDAO) continue;
      
      const res = await pool.query(`
        UPDATE tcu_acordaos 
        SET acordao = $1,
            decisao = $2,
            sumario = $3,
            assunto = $4
        WHERE num_acordao = $5 AND ano_acordao = $6
      `, [ac.ACORDAO, ac.DECISAO, ac.SUMARIO, ac.ASSUNTO, ac.NUMACORDAO, ac.ANOACORDAO]);
      
      if (res.rowCount && res.rowCount > 0) {
        restored += res.rowCount;
      }
    }
    
    console.log(`Successfully restored text fields for ${restored} acordaos!`);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

restore();
