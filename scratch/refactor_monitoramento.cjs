const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TcuMonitoramento.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('import TcuMonitoramentoEditRow')) {
  content = content.replace(
    'import { AcordaoDemand, TceDemand, ComunicacaoDemand } from "../types";',
    'import { AcordaoDemand, TceDemand, ComunicacaoDemand } from "../types";\nimport TcuMonitoramentoEditRow from "./TcuMonitoramentoEditRow";'
  );
}

// 2. Add editRowId state
if (!content.includes('const [editRowId, setEditRowId]')) {
  content = content.replace(
    'const [expandedRow, setExpandedRow] = useState<string | null>(null);',
    'const [expandedRow, setExpandedRow] = useState<string | null>(null);\n  const [editRowId, setEditRowId] = useState<string | null>(null);'
  );
}

// 3. Remove old modal states and functions
content = content.replace(/const \[selectedAcordao, setSelectedAcordao\] = useState<AcordaoDemand \| null>\(null\);\s*/, '');
content = content.replace(/const \[isEditing, setIsEditing\] = useState\(false\);\s*/, '');
content = content.replace(/const \[editStatus, setEditStatus\] = useState<any>\("Pendente"\);\s*/, '');
content = content.replace(/const \[editResponsavel, setEditResponsavel\] = useState\(""\);\s*/, '');
content = content.replace(/const \[editPrazo, setEditPrazo\] = useState\(""\);\s*/, '');
content = content.replace(/const \[editObs, setEditObs\] = useState\(""\);\s*/, '');

content = content.replace(/\/\/ Edit Form state\s*/, '');
content = content.replace(/\/\/ Open Edit Dialog\s*const handleOpenEdit = \(ac: AcordaoDemand\) => \{[\s\S]*?setIsEditing\(true\);\s*\};\s*/, '');
content = content.replace(/\/\/ Save Edit Dialog\s*const handleSaveEdit = async \(\) => \{[\s\S]*?setIsEditing\(false\);\s*\}\s*\}\s*/, '');

// 4. Remove the old Modal render
content = content.replace(/\{isEditing && selectedAcordao && \([\s\S]*?<div className="fixed inset-0 z-50 bg-slate-900\/60[\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*/, '');

// 5. Update the "Editar Notas e Prazos" button to toggle editRowId
content = content.replace(
  /onClick=\{.*?handleOpenEdit\(ac\)\}/g,
  'onClick={() => setEditRowId(editRowId === ac.KEY ? null : ac.KEY)}'
);

// 6. Inject the EditRow component into the detail panel
// Look for {/* Meta fields breakdown */} and inject it before it.
// Actually, let's inject it at the top of the detail panel content.
// The detail panel starts with: <div className="space-y-4">
// Let's replace <div className="space-y-4"> with <div className="space-y-4">\n {editRowId === ac.KEY && (\n <div className="mb-4 animate-slide-down border border-slate-200 rounded-xl overflow-hidden shadow-sm">\n <TcuMonitoramentoEditRow \n item={ac}\n onSave={async (updated) => { const res = await onUpdateAcordao(updated); if(res) setEditRowId(null); return res; }}\n onCancel={() => setEditRowId(null)}\n />\n </div>\n )}

content = content.replace(
  /<div className="space-y-4">/g,
  '<div className="space-y-4">\n                  {editRowId === ac.KEY && (\n                    <div className="mb-4 animate-slide-down border border-slate-200 rounded-xl overflow-hidden shadow-sm">\n                      <TcuMonitoramentoEditRow \n                        item={ac}\n                        onSave={async (updated) => { const res = await onUpdateAcordao(updated); if(res) setEditRowId(null); return res; }}\n                        onCancel={() => setEditRowId(null)}\n                      />\n                    </div>\n                  )}'
);

// 7. Make the button toggle its text based on editRowId
content = content.replace(
  /<Edit3 className="w-3\.5 h-3\.5" \/> Editar Notas e Prazos/g,
  '{editRowId === ac.KEY ? "Fechar Edição" : <><Edit3 className="w-3.5 h-3.5" /> Editar Notas e Prazos</>}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('done refactoring Monitoramento');
