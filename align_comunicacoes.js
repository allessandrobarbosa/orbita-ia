import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

async function run() {
  try {
    const csvContent = fs.readFileSync('com resposta.csv', 'utf-8');
    const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
    
    const updates = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      // The file might be tab-separated or semicolon-separated or comma
      const parts = lines[i].split(/\t|;/);
      let oficio = parts[0];
      let prazoStr = parts.length > 2 ? parts[2] : (parts.length > 1 ? parts[1] : "");
      
      // If comma separated, let's try that
      if (parts.length === 1 && lines[i].includes(',')) {
        const p = lines[i].split(',');
        oficio = p[0];
        prazoStr = p.length > 2 ? p[2] : p[1];
      }
      
      if (!oficio) continue;
      
      // Extract number like "020.585/2026"
      const match = oficio.match(/(\d{3}\.\d{3}\/\d{4})/);
      if (match) {
        const num = match[1];
        // Extract prazo number
        const prazoMatch = prazoStr.match(/(\d+)/);
        const prazoDias = prazoMatch ? parseInt(prazoMatch[1], 10) : null;
        
        updates.push({
          num,
          prazoDias,
          original: oficio
        });
      }
    }
    
    console.log(`Found ${updates.length} items to update from CSV.`);
    
    // 1. Update PostgreSQL
    let pgUpdated = 0;
    for (const u of updates) {
      const searchStr = `%${u.num}%`;
      const res = await pool.query(
        'UPDATE comunicacoes SET carece_resposta = true, prazo_dias = $1 WHERE comunicacao LIKE $2 RETURNING *',
        [u.prazoDias, searchStr]
      );
      if (res.rowCount > 0) pgUpdated += res.rowCount;
    }
    console.log(`Updated ${pgUpdated} rows in PostgreSQL.`);
    
    // 2. Update orbita_db.json
    let jsonUpdated = 0;
    const dbPath = 'data/orbita_db.json';
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    for (const c of db.comunicacoes || []) {
      const isMatch = updates.some(u => c.COMUNICACAO && c.COMUNICACAO.includes(u.num));
      if (isMatch) {
        c.CARECE_RESPOSTA = true;
        const u = updates.find(u => c.COMUNICACAO.includes(u.num));
        if (u && u.prazoDias) {
          c.PRAZO_DIAS = u.prazoDias.toString();
        }
        jsonUpdated++;
      }
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log(`Updated ${jsonUpdated} rows in orbita_db.json.`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
