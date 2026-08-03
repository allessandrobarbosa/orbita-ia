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
// Currently it renders <td colSpan={6} className="bg-slate-50/30 px-6 py-4.5 border-b border-slate-200 no-print"> ...
// We want to replace it to just <td colSpan={6} className="p-0 border-b border-slate-200"><TcuComunicacoesEditRow ... /></td>

const expandedContentRegex = /\{\/\* Detail panel expansion \*\/\}\s*\{isExpanded && \(\s*<tr>\s*<td colSpan=\{[0-9]\} className="bg-slate-50\/30 px-6 py-4.5 border-b border-slate-200 no-print">\s*<div className="grid grid-cols-1 md:grid-cols-3 gap-4">(.|\n)*?<\/td>\s*<\/tr>\s*\)\}/g;

if (expandedContentRegex.test(content)) {
  content = content.replace(expandedContentRegex, \{/* Detail panel expansion */}
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
 )}\);
} else {
  // If regex fails, let's try a simpler one.
  const simplerRegex = /\{\/\* Detail panel expansion \*\/\}(.|\n)*?<\/tr>\s*\)\}/g;
  content = content.replace(simplerRegex, \{/* Detail panel expansion */}
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
 )}\);
}

// 4. Remove the state variables related to the popup
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

content = content.replace(/const triggerComEdit =(.|\n)*?setEditComDestinacao\(.*?\);\n  };\n/g, '');
content = content.replace(/const saveComEdit = async \(\) => \{(.|\n)*?setIsSavingCom\(false\);\n  };\n/g, '');


fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed inline edit row');
