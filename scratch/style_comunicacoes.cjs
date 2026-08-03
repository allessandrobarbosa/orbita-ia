const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/components/TcuComunicacoesEditRow.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the outer container to match the auditorias/monitoramento edit row style (full width, no floating margins)
content = content.replace(
  '<div className="bg-white border border-[#1351b4]/20 rounded-2xl shadow-sm overflow-hidden animate-fade-in relative max-w-4xl mx-auto my-4">',
  '<div className="bg-white p-6 border-b border-slate-200 animate-fade-in">'
);

// 2. Fix Header to match
content = content.replace(
  '<div className="flex justify-between items-center border-b border-slate-100 p-5 shrink-0 bg-blue-50/50">',
  '<div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">'
);
// Fix the close button
content = content.replace(
  '<button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition bg-white rounded-full p-1.5 shadow-sm border border-slate-200">',
  '<button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition" title="Fechar">'
);

// 3. Remove the extra body padding wrapper since outer already has p-6
content = content.replace(
  '<div className="p-6">\\n        <div className="space-y-4 text-xs text-slate-700">',
  '<div className="space-y-4 text-xs text-slate-700">'
);

// 4. Update Inputs to match Monitoramento styling
// from: className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
// to: className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
content = content.replace(
  /className="w-full p-2\.5 bg-slate-50 border border-slate-200 rounded-xl(.*?)"/g,
  'className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"'
);
content = content.replace(
  /className="w-full p-2\.5 border border-slate-200 rounded-xl text-center font-bold bg-\[#003366\]\/5 focus:bg-white text-slate-900 border-\[#003366\]\/30 transition-colors"/g,
  'className="w-full border border-blue-200 bg-blue-50/30 rounded-lg p-2.5 text-xs text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"'
);

// 5. Update Labels
content = content.replace(
  /className="text-xs font-semibold text-slate-700 uppercase tracking-wider block"/g,
  'className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2"'
);

// 6. Update grid to 3 cols for better distribution
content = content.replace(
  /<div className="grid grid-cols-2 gap-4">/g,
  '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">'
);

// 7. Update Footer
content = content.replace(
  /<div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-5 shrink-0">/,
  '<div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">'
);
content = content.replace(
  /className="px-5 py-2\.5 text-slate-500 hover:text-slate-800 transition text-sm font-bold rounded-xl hover:bg-slate-200\/50"/,
  'className="px-5 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition rounded-xl text-xs font-bold cursor-pointer"'
);
content = content.replace(
  /className="px-5 py-2\.5 bg-\[#003366\] hover:bg-\[#002244\] text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"/,
  'className="px-6 py-2.5 bg-[#003366] text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-900/20"'
);

// Remove the closing tag of the removed body div
// The body div was <div className="p-6">
// It ends just before {/* Footer */}
content = content.replace(
  /<\/div>\s*\{\/\* Footer \*\/\}/,
  '{/* Footer */}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('styled comunicacoes');
