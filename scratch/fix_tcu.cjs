const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TcuComunicacoes.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Ensure import is there
if (!content.includes('import TcuComunicacoesEditRow')) {
  content = content.replace(
    'import React, { useState',
    'import TcuComunicacoesEditRow from "./TcuComunicacoesEditRow";\nimport React, { useState'
  );
}

// 2. Erase the residual triggerComEdit and saveComEdit which apparently didn't match the regex completely
// The error says it's around line 1206. Let's just remove anything from const triggerComEdit = (item: ComunicacaoDemand) => { down to the end of saveComEdit.
content = content.replace(/const triggerComEdit = \(item: ComunicacaoDemand\) => \{[\s\S]*?alert\("Erro ao salvar altera[^\"]*"\);\s*\}\s*};/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed TcuComunicacoes.tsx');
