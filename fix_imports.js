const fs = require('fs');
let text = fs.readFileSync('server.ts', 'utf-8');

const regex = /import\s*\{\s*DATA_DIR,\s*DB_PATH,\s*TCU_DIR,\s*migrateProcessTypes,\s*loadDatabase,\s*saveDatabase,\s*getSiapeAndEmail\s*\}\s*from\s*"([^"]+)";/g;

text = text.replace(regex, (match, p1) => {
    return `import { 
  DATA_DIR, 
  DB_PATH, 
  TCU_DIR, 
  migrateProcessTypes, 
  loadDatabase,
  saveDatabase,
  getSiapeAndEmail,
  pool
} from "${p1}";`;
});

fs.writeFileSync('server.ts', text, 'utf-8');
console.log('Fixed imports in server.ts');
