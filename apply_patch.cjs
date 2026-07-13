const fs = require('fs');
let content = fs.readFileSync('src/components/TcuModule.tsx', 'utf8');

// 1. Add states
const statesSearch = 'const [showComImporter, setShowComImporter] = useState(false);\n  const [comPasteContent, setComPasteContent] = useState("");';
const statesReplace = 'const [showComImporter, setShowComImporter] = useState(false);\n  const [showComSyncPrazos, setShowComSyncPrazos] = useState(false);\n  const [comSyncMessage, setComSyncMessage] = useState<string | null>(null);\n  const [comPasteContent, setComPasteContent] = useState("");';
content = content.replace(statesSearch, statesReplace);

// 2. Add function
const funcSearch = 'const handleExecuteComImport = async () => {';
const funcReplace = `const handleSyncPrazosPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text || text.trim() === "") return;

    setIsSavingCom(true);
    setComSyncMessage("Analisando texto colado e sincronizando...");

    try {
      let updatedCount = 0;
      const updatedComunicacoes = (comunicacoes || []).map(item => {
        if (!item.COMUNICACAO) return item;
        
        const searchString = item.COMUNICACAO.trim();
        const idx = text.indexOf(searchString);
        
        if (idx !== -1) {
          const vicinity = text.substring(idx, idx + 400).toLowerCase();
          
          let newCarece = item.CARECE_RESPOSTA;
          let newPrazo = item.PRAZO_DIAS;
          let changed = false;
          
          if (vicinity.includes("não exige resposta") || vicinity.includes("nao exige resposta")) {
            newCarece = false;
            changed = true;
          } else {
            const match = vicinity.match(/prazo[:\\s]*(\\d+)\\s*dias/i) || vicinity.match(/(\\d+)\\s*dias/i);
            if (match && match[1]) {
              newPrazo = parseInt(match[1], 10);
              newCarece = true;
              changed = true;
            }
          }
          
          if (changed && (newCarece !== item.CARECE_RESPOSTA || newPrazo !== item.PRAZO_DIAS)) {
            updatedCount++;
            return { ...item, CARECE_RESPOSTA: newCarece, PRAZO_DIAS: newPrazo };
          }
        }
        return item;
      });

      if (updatedCount > 0 && onImportComunicacoes) {
        const res = await onImportComunicacoes(updatedComunicacoes);
        if (res && res.success) {
          setComSyncMessage(\`Sincronização concluída! \${updatedCount} prazos foram atualizados.\`);
          setTimeout(() => {
            setShowComSyncPrazos(false);
            setComSyncMessage(null);
          }, 4000);
        } else {
          setComSyncMessage("Erro ao tentar salvar as atualizações no servidor.");
        }
      } else {
        setComSyncMessage("Nenhum prazo novo foi encontrado no texto para as comunicações atuais.");
      }
    } catch (err) {
      setComSyncMessage("Ocorreu um erro inesperado durante a leitura.");
    } finally {
      setIsSavingCom(false);
    }
  };

  const handleExecuteComImport = async () => {`;
content = content.replace(funcSearch, funcReplace);

// 3. Add Modal UI
const uiSearch = '{showComImporter && (';
const uiReplace = `{showComSyncPrazos && (
              <div className="bg-indigo-50 border-2 border-indigo-200 border-dashed rounded-2xl p-6 shadow-sm no-print space-y-4 relative overflow-hidden animate-fade-in mb-6">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/30 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-indigo-800 uppercase tracking-wide flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600" />
                      Extração Mágica de Prazos (Zero Instalação)
                    </h3>
                    <p className="text-xs text-indigo-600/80 font-medium">
                      Na página do Conecta-TCU, pressione <b>Ctrl+A</b> e depois <b>Ctrl+C</b>. Em seguida, clique na caixa abaixo e pressione <b>Ctrl+V</b>. 
                      O sistema fará o cruzamento automático dos prazos com a tabela atual do Órbita.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowComSyncPrazos(false)}
                    className="text-indigo-400 hover:text-indigo-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="relative z-10">
                  <textarea
                    onPaste={handleSyncPrazosPaste}
                    readOnly
                    className="w-full h-32 bg-white/70 border-2 border-indigo-200/60 rounded-xl p-6 text-center text-indigo-800 font-mono text-sm placeholder:text-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none transition-all shadow-inner"
                    placeholder="Cole aqui (Ctrl + V) os dados copiados da tela do TCU..."
                  />
                  {comSyncMessage && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center border border-indigo-100 shadow-lg animate-fade-in">
                      <div className="text-center space-y-2">
                        {isSavingCom ? (
                          <div className="inline-block animate-spin w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full" />
                        ) : (
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        )}
                        <p className={\`font-bold text-sm \${isSavingCom ? 'text-indigo-700' : 'text-emerald-700'}\`}>
                          {comSyncMessage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showComImporter && (`;
content = content.replace(uiSearch, uiReplace);

// 4. Add Button
const btnSearch = `<button
                        onClick={() => setShowComImporter(!showComImporter)}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs"
                        title="Importar planilhas CSV de comunicações de qualquer ano"
                      >
                        <Upload className="w-4 h-4" />
                        {showComImporter ? "Ocultar Importador" : "Importar Comunicações"}
                      </button>`;
const btnReplace = `<button
                        onClick={() => {
                          setShowComSyncPrazos(!showComSyncPrazos);
                          if (showComImporter) setShowComImporter(false);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs"
                        title="Cruzar os prazos e exigência de resposta da tela do TCU"
                      >
                        <Zap className="w-4 h-4" />
                        Sincronizar Prazos (Ctrl+V)
                      </button>
                      <button
                        onClick={() => {
                          setShowComImporter(!showComImporter);
                          if (showComSyncPrazos) setShowComSyncPrazos(false);
                        }}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs"
                        title="Importar planilhas CSV de comunicações de qualquer ano"
                      >
                        <Upload className="w-4 h-4" />
                        {showComImporter ? "Ocultar Importador" : "Importar Comunicações"}
                      </button>`;
content = content.replace(btnSearch, btnReplace);

fs.writeFileSync('src/components/TcuModule.tsx', content, 'utf8');
console.log('Done!');
