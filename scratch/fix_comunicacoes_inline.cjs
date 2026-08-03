const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/components/TcuComunicacoes.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove the modal popup
const modalRegex = /\{\/\* Edit \/ Resposta Modal for Communication \*\/\}\s*\{editingComItem && \((.|\n)*?\}\)\}\s*<\/div>\s*\{\/\* Full Acórdão/g;
if (modalRegex.test(content)) {
  content = content.replace(modalRegex, '{/* Full Acórdão');
}

// 2. Import TcuComunicacoesEditRow if not present
if (!content.includes('TcuComunicacoesEditRow')) {
  content = content.replace(
    /import React, \{ useState, useMemo, useEffect, useRef \} from "react";/,
    'import React, { useState, useMemo, useEffect, useRef } from "react";\nimport { TcuComunicacoesEditRow } from "./TcuComunicacoesEditRow";'
  );
}

// 3. Replace the inner expanded row content
const simplerRegex = /\{\/\* Detail panel expansion \*\/\}(.|\n)*?<\/tr>\s*\)\}/g;
content = content.replace(simplerRegex, `{/* Detail panel expansion */}
 {isExpanded && (
 <tr>
 <td colSpan={6} className="p-0 border-b border-slate-200 bg-slate-50/30">
 <TcuComunicacoesEditRow
 item={item}
 onUpdate={async (updated) => {
 const res = await onUpdateComunicacao(updated);
 if (res) setComExpandedRow(null);
 return res;
 }}
 onCancel={() => setComExpandedRow(null)}
 />
 </td>
 </tr>
 )}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed inline edit row');
