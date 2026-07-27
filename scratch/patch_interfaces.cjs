const fs = require('fs');
const path = require('path');

const comps = ['TcuMonitoramento.tsx', 'TcuComunicacoes.tsx', 'TcuTCE.tsx'];

for (const comp of comps) {
  const targetPath = path.join(__dirname, '..', 'src', 'components', comp);
  if (!fs.existsSync(targetPath)) continue;
  let content = fs.readFileSync(targetPath, 'utf8');

  // Add to interface
  if (!content.includes('onRefreshData?: () => Promise<void>;')) {
    content = content.replace(
      /isLoading:\s*boolean;\s*\}/,
      'isLoading: boolean;\n  onRefreshData?: () => Promise<void>;\n}'
    );
  }

  // Update Excel button in TcuMonitoramento
  if (comp === 'TcuMonitoramento.tsx') {
    const oldExcelButtonRegex = /className="px-4 py-2\.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1\.5 transition duration-200 shadow-sm"/;
    const newExcelButton = `className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition duration-200 shadow-sm"`;
    content = content.replace(oldExcelButtonRegex, newExcelButton);
    
    // Also replace "Exportar Excel" text if present
    content = content.replace(/>\s*Exportar Excel\s*<\/button>/g, `><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> XLSX</button>`);
  }

  // Simplify TcuComunicacoes
  if (comp === 'TcuComunicacoes.tsx') {
    // We already have handleLocalSyncCom, we just need to replace the toggle button with direct sync
    // and make sure handleLocalSyncCom calls onRefreshData
    const syncSuccessCode = `if (res && res.success) {
        setSyncLocalComMessage(res.message);
        setLocalSyncComReport(res.report || []);
        if (onRefreshData) await onRefreshData();
      }`;
    content = content.replace(
      /if\s*\(res\s*&&\s*res\.success\)\s*\{\s*setSyncLocalComMessage\(res\.message\);\s*setLocalSyncComReport\(res\.report\s*\|\|\s*\[\]\);\s*\}/,
      syncSuccessCode
    );

    // Remove importer toggle
    const toggleRegex = /<button[\s\S]*?setShowComImporter[\s\S]*?<\/button>/m;
    const directSyncBtn = `<button 
                onClick={handleLocalSyncCom}
                disabled={isSyncingLocalCom}
                className={\`px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 \${
                  isSyncingLocalCom 
                    ? "bg-slate-800 text-white shadow-xs opacity-50" 
                    : "bg-[#003366] text-white hover:bg-[#0f4396] shadow-sm"
                }\`}
              >
                {isSyncingLocalCom ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isSyncingLocalCom ? "Sincronizando..." : "Sincronizar Arquivos Locais"}
              </button>`;
    content = content.replace(toggleRegex, directSyncBtn);
    
    // Change export button
    const oldComExcel = /className="px-4 py-2\.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1\.5 transition duration-200 shadow-sm"[\s\S]*?Exportar para Excel \(\.xlsx\)/m;
    const newComExcel = `className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition duration-200 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                XLSX`;
    content = content.replace(oldComExcel, newComExcel);
  }

  fs.writeFileSync(targetPath, content, 'utf8');
  console.log("Patched " + comp + " successfully");
}
