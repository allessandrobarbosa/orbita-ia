const fs = require('fs');
const path = require('path');

const DB_PATH = path.join('c:\\Projetos\\orbita-projeto', 'data', 'orbita_db.json');

if (fs.existsSync(DB_PATH)) {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  if (db.acordaos) {
    db.acordaos.forEach(ac => {
      delete ac.aiAnalysisData;
    });
    
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log('AI Analysis Data cleared successfully!');
  } else {
    console.log('No acordaos found in db.json');
  }
} else {
  console.log('db.json not found at', DB_PATH);
}
