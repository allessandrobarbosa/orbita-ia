const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('data/orbita_db.sqlite');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) return console.error(err);
    console.log('Tables:', tables.map(t => t.name).join(', '));
    
    db.get('SELECT COUNT(*) as count FROM tcu_acordaos', (err, row) => console.log('TCU Acordaos:', err ? err.message : row?.count));
    db.get('SELECT COUNT(*) as count FROM cgu_reports', (err, row) => console.log('CGU Reports:', err ? err.message : row?.count));
    db.get('SELECT COUNT(*) as count FROM etica_processos', (err, row) => console.log('Etica Processos:', err ? err.message : row?.count));
  });
});
