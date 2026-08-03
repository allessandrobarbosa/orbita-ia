const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/TcuComunicacoes.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetThead = `<thead className="sticky top-0 z-10">
 <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
 <th className="p-4 text-center no-print cursor-pointer hover:bg-slate-100 transition-colors w-10"></th>
 <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">Ofício / Comunicação</th>
 <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">Destinatário MTE</th>
 <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors">Processo</th>
 <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors">Expedição</th>
 <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors">Situação</th>
 </tr>
 </thead>`;

const replaceThead = `<thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244] sticky top-0 z-10">
 <tr className="sticky top-0 z-10">
 <th className="p-4 font-semibold whitespace-nowrap w-[150px]">
 Ofício / Comunicação
 </th>
 <th className="p-4 font-semibold">
 Destinatário MTE
 </th>
 <th className="p-4 font-semibold text-center w-[180px]">
 Situação Geral
 </th>
 <th className="p-4 font-semibold w-24 no-print"></th>
 </tr>
 </thead>`;

// Let's replace thead
if (content.includes(targetThead)) {
  content = content.replace(targetThead, replaceThead);
} else {
  console.log("Could not find exact thead string. Trying regex...");
  content = content.replace(/<thead className="sticky top-0 z-10">[\s\S]*?<\/thead>/, replaceThead);
}

// Now let's fix the row!
const targetTbodyTr = `<tr className={\`hover:bg-[#1351b4]/5 transition-colors group border-b border-slate-100 \${isExpanded ? "bg-blue-50/50" : ""}\`}>
 
 {/* Expand toggle icon */}
 <td className="p-4 text-center no-print">
 <button 
 onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
 className="text-slate-400 hover:text-[#003366] hover:bg-slate-100 p-1.5 rounded-lg transition"
 >
 {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#003366] stroke-[2.5]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
 </button>
 </td>

 {/* Ofício/Comunicação */}
 <td className="p-4 font-bold text-[#003366]">
 <span 
 className="cursor-pointer hover:underline text-xs"
 onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
 >
 {item.COMUNICACAO}
 </span>
 </td>

 {/* Destinatário */}
 <td className="p-4 font-semibold text-slate-800 truncate max-w-[280px]" title={item.DESTINATARIO}>
 {item.DESTINATARIO}
 </td>

 {/* Processo */}
 <td className="p-4 text-xs text-slate-600 text-center whitespace-nowrap">
 {item.PROCESSO || <span className="text-slate-350 italic">Não associado</span>}
 </td>

 {/* Expedição */}
 <td className="p-4 text-xs text-slate-600 text-center whitespace-nowrap">
 {item.EXPEDICAO || "-"}
 </td>

 {/* Situação */}
 <td className="p-4 text-center">
 <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border \${situacaoStyle}\`}>
 <span className={\`w-1.5 h-1.5 rounded-full \${dotStyle}\`}></span>
 {situacaoText}
 </span>
 </td>
 </tr>`;

const replaceTbodyTr = `<tr className={\`hover:bg-[#1351b4]/5 transition-colors group \${isExpanded ? "border-b border-[#002244]" : "border-b border-slate-100"}\`}>
 
 {/* Ofício/Comunicação & Expedição */}
 <td className="p-4 align-middle text-sm font-medium text-[#003366] whitespace-nowrap">
 <div>{item.COMUNICACAO}</div>
 <div className="text-xs text-slate-500 font-normal mt-1">Expedição: {item.EXPEDICAO || '-'}</div>
 </td>

 {/* Destinatário & Processo */}
 <td className="p-4 align-middle text-sm text-slate-700">
 <div className="font-semibold">{item.DESTINATARIO}</div>
 <div className="text-xs text-slate-500 mt-1">Processo: {item.PROCESSO || <span className="italic">Não associado</span>}</div>
 </td>

 {/* Situação */}
 <td className="p-4 align-middle text-center">
 <span className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border \${situacaoStyle}\`}>
 <span className={\`w-1.5 h-1.5 rounded-full \${dotStyle}\`}></span>
 {situacaoText}
 </span>
 </td>

 {/* Expand Button */}
 <td className="p-4 align-middle text-center no-print">
 <button
 onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
 className={\`px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors whitespace-nowrap \${
 isExpanded ? "bg-blue-50 border-blue-200 text-blue-700 shadow-inner" : "bg-white border-slate-200 text-[#003366] hover:bg-slate-50 shadow-sm"
 }\`}
 >
 Detalhamento
 </button>
 </td>
 </tr>`;

if (content.includes(targetTbodyTr)) {
  content = content.replace(targetTbodyTr, replaceTbodyTr);
} else {
  console.log("Could not find exact TR string. Using regex");
  const trRegex = /<tr className={`hover:bg-\[#1351b4\]\/5 transition-colors group border-b border-slate-100 \${isExpanded \? "bg-blue-50\/50" : ""}`}[\s\S]*?<\/tr>/;
  content = content.replace(trRegex, replaceTbodyTr);
}

// Adjust the colspan of the expansion panel!
const colSpanRegex = /<td colSpan=\{6\} className="p-0 border-b border-slate-200 bg-slate-50\/30">/;
content = content.replace(colSpanRegex, '<td colSpan={4} className="p-0 border-b-2 border-blue-200 shadow-inner">');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script executed');
