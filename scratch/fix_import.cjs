const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/components/TcuMonitoramento.tsx');
let content = fs.readFileSync(filePath, 'utf8');
if (!content.includes('import TcuMonitoramentoEditRow')) {
  content = content.replace(
    'import React, { useState',
    'import TcuMonitoramentoEditRow from "./TcuMonitoramentoEditRow";\nimport React, { useState'
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed import');
}
