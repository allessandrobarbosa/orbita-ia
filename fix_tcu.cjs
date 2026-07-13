const fs = require('fs');
const path = 'c:/Projetos/orbita-projeto/src/components/TcuModule.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state variable
content = content.replace(
  'const [showComImporter, setShowComImporter] = useState(false);\r\n  const [comPasteContent, setComPasteContent] = useState("");',
  'const [showComImporter, setShowComImporter] = useState(false);\r\n  const [comPasteContent, setComPasteContent] = useState("");\r\n  const [comImportType, setComImportType] = useState<"AUTO" | "PENDENTE" | "RESPONDIDA" | "NAO_EXIGIDO">("AUTO");'
);

// 2. Add importType to parser
content = content.replace(
  'const parseCommunicationsCSV = (csvText: string): ComunicacaoDemand[] => {',
  'const parseCommunicationsCSV = (csvText: string, importType: "AUTO" | "PENDENTE" | "RESPONDIDA" | "NAO_EXIGIDO" = "AUTO"): ComunicacaoDemand[] => {'
);

// 3. Re-implement the parser logic for dynamic deadline and importType
content = content.replace(
  /const processo = fields\[5\] \|\| "";\r?\n\s+const dataExpedicao = fields\[6\] \|\| "";\r?\n\s+const dataResposta = fields\[7\] \|\| "";\r?\n\s+const careceResposta = fields\[8\] \?\s+fields\[8\]\.toUpperCase\(\)\.includes\("SIM"\)\s+:\s+false;/,
  `const processo = fields[5] || "";
      const dataExpedicao = fields[6] || "";
      let dataResposta = fields[7] || "";
      let prazoDias = "";
      
      // Look for a column containing deadline (prazo) or carece based on text 
      const rowJoinedRaw = fields.join(" ").toLowerCase();
      const normRow = rowJoinedRaw.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
      
      // Dynamic column identification is harder in this old version, but we can do a simple heuristic
      let careceResposta = false;
      const parsedPrazoMatch = normRow.match(/(\\d+)\\s*dias/);
      if (parsedPrazoMatch) {
         prazoDias = parsedPrazoMatch[1];
         careceResposta = true;
      } else if (fields[8] && fields[8].toUpperCase().includes("SIM")) {
         careceResposta = true;
      }
      
      if (normRow.includes("nao exige resposta")) {
         careceResposta = false;
      }
      
      if (importType === "PENDENTE") {
        careceResposta = true;
        dataResposta = "";
      } else if (importType === "RESPONDIDA") {
        careceResposta = true;
        if (!dataResposta) dataResposta = "SANEADO NA IMPORTACAO";
      } else if (importType === "NAO_EXIGIDO") {
        careceResposta = false;
        dataResposta = "";
      }
      `
);

// update items.push
content = content.replace(
  'CARECE_RESPOSTA: careceResposta',
  'CARECE_RESPOSTA: careceResposta,\r\n        PRAZO_DIAS: prazoDias'
);

// 4. Update the parseCommunicationsCSV calls
content = content.replace(
  'const parsed = parseCommunicationsCSV(text);',
  'const parsed = parseCommunicationsCSV(text, comImportType);'
);
content = content.replace(
  'const parsed = parseCommunicationsCSV(comPasteContent);',
  'const parsed = parseCommunicationsCSV(comPasteContent, comImportType);'
);
content = content.replace(
  'const items = parseCommunicationsCSV(comPasteContent);',
  'const items = parseCommunicationsCSV(comPasteContent, comImportType);'
);

// 5. Inject the UI above the grid
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\r\n                {/* Drag zone */}',
  `{/* Import Strategy Select */}
              <div className="flex flex-col space-y-2 mb-4">
                <label className="text-xs font-extrabold text-[#003366] uppercase tracking-wider block">
                  Modo de Importação (Classificação em Lote)
                </label>
                <select
                  value={comImportType}
                  onChange={(e) => setComImportType(e.target.value as any)}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 font-bold focus:ring-2 focus:ring-[#003366] focus:border-transparent outline-none cursor-pointer shadow-sm"
                >
                  <option value="AUTO">Automático (Extrair Prazo da Planilha e checar palavras)</option>
                  <option value="PENDENTE">Forçar: Todas Pendentes (Carece resposta e Data Resposta em branco)</option>
                  <option value="RESPONDIDA">Forçar: Todas Respondidas (Carece resposta = Sim, Data = Preenchida)</option>
                  <option value="NAO_EXIGIDO">Forçar: Nenhuma Exige Resposta (Carece resposta = Não)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag zone */}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Update script executed.');
