const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'orbita_db.json');

if (!fs.existsSync(dbPath)) {
  console.log(`Database file not found at ${dbPath}`);
  process.exit(1);
}

try {
  const fileContent = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(fileContent);

  const acordaosCount = db.acordaos ? db.acordaos.length : 0;
  const comunicacoesCount = db.comunicacoes ? db.comunicacoes.length : 0;
  const tcesCount = db.tces ? db.tces.length : 0;
  const mappingsCount = db.tceAcordaoMappings ? db.tceAcordaoMappings.length : 0;

  db.acordaos = [];
  db.comunicacoes = [];
  db.tces = [];
  db.tceAcordaoMappings = [];

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Successfully cleared TCU data:`);
  console.log(`- Removed ${acordaosCount} acórdãos`);
  console.log(`- Removed ${comunicacoesCount} comunicações`);
  console.log(`- Removed ${tcesCount} TCEs`);
  console.log(`- Removed ${mappingsCount} mappings`);
} catch (error) {
  console.error('Error clearing database:', error);
}
