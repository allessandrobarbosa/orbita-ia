const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'components', 'TcuTCE.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add onRefreshData to TcuModuleProps
content = content.replace(
  /isLoading:\s*boolean;\s*\}/,
  'isLoading: boolean;\n  onRefreshData?: () => Promise<void>;\n}'
);

content = content.replace(
  /isLoading\s*\n\}\:\s*TcuModuleProps\)/,
  'isLoading,\n  onRefreshData\n}: TcuModuleProps)'
);

// 2. Call onRefreshData in handleLocalSyncTce
const syncSuccessCode = `if (res && res.success) {
        setSyncLocalTceMessage(res.message);
        setParsedTceItems(res.report || []);
        if (onRefreshData) await onRefreshData();
      }`;
content = content.replace(
  /if\s*\(res\s*&&\s*res\.success\)\s*\{\s*setSyncLocalTceMessage\(res\.message\);\s*setParsedTceItems\(res\.report\s*\|\|\s*\[\]\);\s*\}/,
  syncSuccessCode
);

// 3. Replace the entire "Filter Row and Contextual Importer Button" block with a simplified one
const originalFilterBlockRegex = /\{\/\*\s*Filter Row and Contextual Importer Button[\s\S]*?className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 grow max-w-xl self-end">/m;

const newFilterBlock = `{/* Filter Row and Sync/Export Buttons */}
            <div className="bg-slate-100 p-2.5 rounded-2xl flex flex-col items-stretch md:flex-row md:items-center justify-between gap-3 shadow-3xs">
              <div className="flex gap-1.5 shrink-0">
                {syncLocalTceMessage && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-center">
                    {syncLocalTceMessage}
                  </span>
                )}
                
                <button
                  onClick={handleLocalSyncTce}
                  disabled={isSyncingLocalTce}
                  className={\`px-3.5 py-1.5 \${isSyncingLocalTce ? "bg-slate-800 text-white opacity-50" : "bg-[#003366] text-white hover:bg-[#002244]"} rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs\`}
                  title="Sincronizar Arquivos Locais (data/tces)"
                >
                  <RefreshCw className={\`w-4 h-4 \${isSyncingLocalTce ? "animate-spin" : ""}\`} />
                  {isSyncingLocalTce ? "Sincronizando..." : "Sincronizar Arquivos Locais"}
                </button>
              </div>

              {/* Real-time search and filter tools */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 grow max-w-xl self-end">`;

content = content.replace(originalFilterBlockRegex, newFilterBlock);

// 4. Change export button to XLSX
const oldExcelButtonRegex = /className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1\.5"[\s\S]*?Exportar Excel/m;
const newExcelButton = `className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  XLSX`;

content = content.replace(oldExcelButtonRegex, newExcelButton);


fs.writeFileSync(targetPath, content, 'utf8');
console.log("Patched TcuTCE successfully");
