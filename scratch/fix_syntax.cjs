const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/components/TcuComunicacoesEditRow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /{[^}]*Body[^}]*}\s*<div className="p-6">\s*/,
  '{/* Body */}\n      '
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed syntax in TcuComunicacoesEditRow.tsx');
