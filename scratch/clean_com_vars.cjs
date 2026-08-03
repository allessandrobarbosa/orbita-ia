const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/components/TcuComunicacoes.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The state variables like setEditingComItem etc.
content = content.replace(/const \[editingComItem.*?\n/g, '');
content = content.replace(/const \[editComDestinatario.*?\n/g, '');
content = content.replace(/const \[editComContato.*?\n/g, '');
content = content.replace(/const \[editComUnidade,.*?\n/g, '');
content = content.replace(/const \[editComProcesso,.*?\n/g, '');
content = content.replace(/const \[editComExpedicao,.*?\n/g, '');
content = content.replace(/const \[editComResposta,.*?\n/g, '');
content = content.replace(/const \[editComCarece,.*?\n/g, '');
content = content.replace(/const \[editComUnidadeExecutora,.*?\n/g, '');
content = content.replace(/const \[editComProcessoSei,.*?\n/g, '');
content = content.replace(/const \[editComDestinacao,.*?\n/g, '');

fs.writeFileSync(filePath, content, 'utf8');
