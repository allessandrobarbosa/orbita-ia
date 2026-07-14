      {tcuActiveSection === "comunicacoes" && (
        <div className="space-y-6 animate-fade-in">

          {/* Importer Panel */}
          {showComSyncPrazos && (
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
                        <p className={`font-bold text-sm ${isSavingCom ? 'text-indigo-700' : 'text-emerald-700'}`}>
                          {comSyncMessage}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showComImporter && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm no-print space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                    Sincronizador Inteligente Year-over-Year
                  </h3>
                  <p className="text-xs text-slate-500 max-w-3xl">
                    Arraste ou selecione a planilha de qualquer ano (formato CSV separado por ponto e vírgula). O sistema analisará o lote, identificará o ano correspondente das expedições e unificará no banco consolidado, protegendo edições locais existentes.
                  </p>
                </div>
                <button
                  onClick={() => setShowComImporter(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOverCom(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragOverCom(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverCom(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) readComFileContent(file);
                  }}
                  onClick={() => document.getElementById("com-file-input")?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition text-center cursor-pointer ${
                    isDragOverCom
                      ? "border-[#003366] bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    id="com-file-input"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleComFileChange}
                  />
                  <div className="p-3 bg-white rounded-full shadow-2xs mb-2">
                    <Upload className="w-6 h-6 text-[#003366]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Soltar arquivo CSV aqui, ou clique para navegar
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Aceita planilha com Comunicação;Destinatário;Contato;Unidade Emitente;Processo;Data de Expedição;Data da Resposta
                  </p>
                </div>

                {/* Paste Area / Preview Area */}
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">
                    Carga Manual ou Visualização das Linhas Lido
                  </label>
                  <textarea
                    className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition"
                    placeholder="Cole as linhas separadas por ponto e vírgula aqui caso não tenha o arquivo físico no dispositivo..."
                    value={comPasteContent}
                    onChange={(e) => {
                      setComPasteContent(e.target.value);
                      setParsedComItems(null);
                    }}
                    style={{ minHeight: "120px" }}
                  ></textarea>
                </div>
              </div>

              {comImportMessage && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 text-[#003366] rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{comImportMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 text-xs">
                {comPasteContent.trim() && !parsedComItems && (
                  <button
                    onClick={() => {
                      const items = parseCommunicationsCSV(comPasteContent);
                      setParsedComItems(items);
                      setComImportMessage(`Identificados ${items.length} ofícios/comunicações na caixa de texto. Pronto para sincronizar.`);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 font-bold transition"
                  >
                    Analisar Texto
                  </button>
                )}

                {parsedComItems && parsedComItems.length > 0 && (
                  <button
                    onClick={handleExecuteComImport}
                    disabled={isSavingCom}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-55 transition inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSavingCom ? "Salvando no Banco..." : `Confirmar Sincronização (${parsedComItems.length} itens)`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Core Analytics & Filtering */}
          {(() => {
            const allComs = comunicacoes || [];
            
            // Gather statistics on the fully loaded list of communications
            const currentYearInt = parseInt(comAnoFilter);
            const totalForSelectedYear = allComs.filter(x => comAnoFilter === "TODOS" || x.ANO === currentYearInt);
            const totalComsCount = totalForSelectedYear.length;
            const respondedCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false && typeof x.DATA_RESPOSTA === 'string' && x.DATA_RESPOSTA.trim() !== "").length;
            const pendingCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false && (typeof x.DATA_RESPOSTA !== 'string' || x.DATA_RESPOSTA.trim() === "")).length;
            const totalRequiredCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false).length;
            const responseRate = totalRequiredCount > 0 ? ((respondedCount / totalRequiredCount) * 100).toFixed(1) : "100.0";

            // Unidade Emitente counts for breakdown
            const emitentes: { [key: string]: number } = {};
            totalForSelectedYear.forEach(x => {
              const u = x.UNIDADE_EMITENTE || "OUTROS";
              emitentes[u] = (emitentes[u] || 0) + 1;
            });

            // Filtered Communications list
            const finalFiltered = totalForSelectedYear.filter(item => {
              const term = (comSearchTerm || "").toLowerCase();
              const matchesSearch = 
                (item.COMUNICACAO || "").toLowerCase().includes(term) ||
                (item.PROCESSO || "").toLowerCase().includes(term) ||
                (item.DESTINATARIO && item.DESTINATARIO.toLowerCase().includes(term)) ||
                (item.CONTATO && item.CONTATO.toLowerCase().includes(term)) ||
                (item.UNIDADE_EMITENTE && item.UNIDADE_EMITENTE.toLowerCase().includes(term));

              const matchesUnidade = comUnidadeFilter === "TODOS" || item.UNIDADE_EMITENTE === comUnidadeFilter;
              
              const carece = item.CARECE_RESPOSTA !== false;
              const hasResponse = !!item.DATA_RESPOSTA && item.DATA_RESPOSTA.trim() !== "";
              const matchesRespondido = 
                comRespondidoFilter === "TODOS" || 
                (comRespondidoFilter === "RESPONDIDO" && carece && hasResponse) ||
                (comRespondidoFilter === "PENDENTE" && carece && !hasResponse) ||
                (comRespondidoFilter === "NAO_EXIGIDO" && !carece);

              return matchesSearch && matchesUnidade && matchesRespondido;
            });

            // Recipient Statistics & Percentages
            const destinatarioStats = (() => {
              const statsMap: { [key: string]: { total: number; responded: number; pending: number; requireResponseTotal: number } } = {};
              
              totalForSelectedYear.forEach(com => {
                const dest = com.DESTINATARIO || "Geral / Não Especificado";
                if (!statsMap[dest]) {
                  statsMap[dest] = { total: 0, responded: 0, pending: 0, requireResponseTotal: 0 };
                }
                const carece = com.CARECE_RESPOSTA !== false;
                statsMap[dest].total++;
                if (carece) {
                  statsMap[dest].requireResponseTotal++;
                  if (com.DATA_RESPOSTA && com.DATA_RESPOSTA.trim() !== "") {
                    statsMap[dest].responded++;
                  } else {
                    statsMap[dest].pending++;
                  }
                }
              });

              return Object.entries(statsMap).map(([dest, info]) => {
                const pct = totalComsCount > 0 ? (info.total / totalComsCount) * 105 : 0; // scaled out of total
                const realPct = totalComsCount > 0 ? (info.total / totalComsCount) * 100 : 0;
                return {
                  unidade: dest,
                  total: info.total,
                  requireResponseTotal: info.requireResponseTotal,
                  responded: info.responded,
                  pending: info.pending,
                  percentage: realPct
                };
              }).sort((a, b) => b.total - a.total);
            })();

            // Dynamic year tabs
            const distinctYears = Array.from(new Set(allComs.map(x => x.ANO).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
            const uniqueUnidades = Array.from(new Set(allComs.map(x => x.UNIDADE_EMITENTE).filter(Boolean))).sort();

            const escapeXML = (str: string) => {
              return (str || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
            };

            const handleExportToExcel = () => {
              let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#003366" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Size="15" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Italic="1" ss:Size="10" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="SaneadoRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#15803D" ss:Size="10"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="PendenteRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#B45309" ss:Size="10"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="NaoExigidoRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#475569" ss:Size="10"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="PctCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Lote de Oficios">
  <Table ss:DefaultRowHeight="19">
   <Column ss:Width="130" />
   <Column ss:Width="80" />
   <Column ss:Width="200" />
   <Column ss:Width="160" />
   <Column ss:Width="120" />
   <Column ss:Width="120" />
   <Column ss:Width="120" />
   <Column ss:Width="100" />
   <Column ss:Width="90" />
   <Column ss:Width="90" />
   <Column ss:Width="130" />
   
   <Row ss:Height="28">
    <Cell ss:MergeAcross="10" ss:StyleID="Title">
     <Data ss:Type="String">MINISTÉRIO DO TRABALHO E EMPREGO — AECI</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="10" ss:StyleID="SubTitle">
     <Data ss:Type="String">Relatório Oficial de Ofícios e Respostas TCU • Filtro: ${comAnoFilter === "TODOS" ? "Histórico Completo" : `Ano ${comAnoFilter}`} • Exportado em: ${new Date().toLocaleString('pt-BR')}</Data>
    </Cell>
   </Row>
   <Row ss:Index="4" ss:Height="25" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Comunicação TCU</Data></Cell>
    <Cell><Data ss:Type="String">Emitente TCU</Data></Cell>
    <Cell><Data ss:Type="String">Destinatário MTE</Data></Cell>
    <Cell><Data ss:Type="String">Contato MTE</Data></Cell>
    <Cell><Data ss:Type="String">Processo TCU</Data></Cell>
    <Cell><Data ss:Type="String">Unidade Executora</Data></Cell>
    <Cell><Data ss:Type="String">Processo SEI</Data></Cell>
    <Cell><Data ss:Type="String">Destinação</Data></Cell>
    <Cell><Data ss:Type="String">Expedição</Data></Cell>
    <Cell><Data ss:Type="String">Resposta</Data></Cell>
    <Cell><Data ss:Type="String">Acompanhamento</Data></Cell>
   </Row>`;

              finalFiltered.forEach(item => {
                const carece = item.CARECE_RESPOSTA !== false;
                const hasResponse = !!item.DATA_RESPOSTA && item.DATA_RESPOSTA.trim() !== "";
                
                let stateText = "Não Precisa de Resposta";
                let rowStyle = "NaoExigidoRow";

                if (carece) {
                  stateText = hasResponse ? "Respondido" : "Aguardando Resposta";
                  rowStyle = hasResponse ? "SaneadoRow" : "PendenteRow";
                }

                xml += `
   <Row ss:Height="21">
    <Cell><Data ss:Type="String">${escapeXML(item.COMUNICACAO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.UNIDADE_EMITENTE)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DESTINATARIO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.CONTATO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.PROCESSO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.UNIDADE_EXECUTORA || "-")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.PROCESSO_SEI || "-")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DESTINACAO || "-")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DATA_EXPEDICAO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DATA_RESPOSTA || "-")}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${stateText}</Data></Cell>
   </Row>`;
              });

              xml += `
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Estatísticas Analíticas">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="280" />
   <Column ss:Width="95" />
   <Column ss:Width="95" />
   <Column ss:Width="95" />
   <Column ss:Width="110" />
   
   <Row ss:Height="28">
    <Cell ss:MergeAcross="4" ss:StyleID="Title">
     <Data ss:Type="String">IMPACTO DAS DEMANDAS POR DESTINATÁRIO (PARETO)</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle">
     <Data ss:Type="String">Participação das Unidades do MTE sobre o total de comunicações expedidas (${totalComsCount} ofícios no contexto) • Filtro: ${comAnoFilter}</Data>
    </Cell>
   </Row>
   <Row ss:Index="4" ss:Height="25" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Unidade Destinatária</Data></Cell>
    <Cell><Data ss:Type="String">Ofícios Recebidos</Data></Cell>
    <Cell><Data ss:Type="String">Total Respondidos</Data></Cell>
    <Cell><Data ss:Type="String">Total Pendentes</Data></Cell>
    <Cell><Data ss:Type="String">% de Participação</Data></Cell>
   </Row>`;

              destinatarioStats.forEach(stat => {
                xml += `
   <Row ss:Height="21">
    <Cell><Data ss:Type="String">${escapeXML(stat.unidade)}</Data></Cell>
    <Cell><Data ss:Type="Number">${stat.total}</Data></Cell>
    <Cell><Data ss:Type="Number">${stat.responded}</Data></Cell>
    <Cell><Data ss:Type="Number">${stat.pending}</Data></Cell>
    <Cell ss:StyleID="PctCell"><Data ss:Type="Number">${(stat.percentage / 100).toFixed(4)}</Data></Cell>
   </Row>`;
              });

              xml += `
  </Table>
 </Worksheet>
</Workbook>`;

              const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `Relatorio_Comunicacoes_TCU_${comAnoFilter}_Formatado.xls`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            };

            return (
              <>
                {/* Statistics bento grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                  <div 
                    onClick={() => {
                      setComRespondidoFilter("TODOS");
                      setComSubTab("lista");
                    }}
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs hover:border-[#003366]/30 hover:bg-[#003366]/5 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Universo de Ofícios</span>
                      <h4 className="text-2xl font-black text-slate-900">{totalComsCount}</h4>
                     <p className="text-[10px] text-slate-500">Mapeados no ano ({comAnoFilter === "TODOS" ? "Histórico Total" : comAnoFilter})</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-[#003366] rounded-xl animate-fade-in">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setComRespondidoFilter("RESPONDIDO");
                      setComSubTab("lista");
                    }}
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Respondidos</span>
                      <h4 className="text-2xl font-black text-emerald-700">{respondedCount}</h4>
                      <p className="text-[10px] text-emerald-600 font-semibold">Ofícios com resposta salvas</p>
                    </div>
                    <div className="p-3 bg bg-emerald-50 text-emerald-700 rounded-xl animate-fade-in">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setComRespondidoFilter("PENDENTE");
                      setComSubTab("lista");
                    }}
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs hover:border-amber-300 hover:bg-amber-50/50 transition cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider group-hover:text-amber-700 transition">Resposta Pendente</span>
                      <h4 className="text-2xl font-black text-amber-600 inline-flex items-center gap-1.5">
                        {pendingCount}
                        {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />}
                      </h4>
                      <p className="text-[10px] text-slate-500 group-hover:text-amber-800 transition">Aguardando instrução da assessoria</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl animate-fade-in group-hover:bg-amber-100 transition">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Índice de Resposta</span>
                      <h4 className="text-2xl font-black text-slate-900">{responseRate}%</h4>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 animate-fade-in">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${responseRate}%` }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-700 rounded-xl animate-fade-in">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Sub-emitters distribution badge rail */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-[10px] font-black text-[#003366] uppercase tracking-wider mr-1">Unidades Emitentes TCU:</span>
                  {Object.keys(emitentes).length === 0 ? (
                    <span className="text-slate-400 text-[11px]">Nenhuma unidade registrada neste período</span>
                  ) : (
                    Object.entries(emitentes).map(([unit, count]) => (
                      <span key={unit} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-700 font-mono text-[10px] flex items-center gap-1">
                        <span>{unit}</span>
                        <span className="bg-[#003366] text-white px-1 rounded text-[9px] font-sans">{count}</span>
                      </span>
                    ))
                  )}
                </div>

                {/* Submodule View Selector: Tab Selection & Export */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-1.5 pt-1.5 no-print">
                  <div className="flex gap-1.5 bg-slate-100/60 p-0.5 rounded-xl border border-slate-200/50">
                    <button
                      onClick={() => setComSubTab("lista")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 inline-flex items-center gap-1.5 ${
                        comSubTab === "lista"
                          ? "bg-white text-[#003366] shadow-sm font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      Lote de Ofícios ({finalFiltered.length})
                    </button>
                    <button
                      onClick={() => setComSubTab("analytics")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 inline-flex items-center gap-1.5 ${
                        comSubTab === "analytics"
                          ? "bg-white text-[#003366] shadow-sm font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Estatísticas por Destinatário ({destinatarioStats.length})
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowComImporter(!showComImporter)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs"
                      title="Importar planilhas CSV de comunicações de qualquer ano"
                    >
                      <Upload className="w-4 h-4" />
                      {showComImporter ? "Ocultar Importador" : "Importar Comunicações"}
                    </button>
                    <button
                      onClick={handleExportToExcel}
                      disabled={finalFiltered.length === 0}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 disabled:opacity-50 transition duration-150 shadow-xs"
                      title="Exportar dados e estatísticas para planilha Excel formatada com duas abas"
                    >
                      <Download className="w-4 h-4" />
                      Exportar para Excel (.xlsx)
                    </button>
                  </div>
                </div>

                {/* Sub Tab View 1: SCROLLABLE LIST OF OFICIOS */}
                {comSubTab === "lista" && (
                  <div className="space-y-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs transition duration-200">
                    
                    {/* Dynamic Year tabs */}
                    <div className="flex border-b border-slate-150 no-print overflow-x-auto gap-1 pb-1">
                      <button
                        onClick={() => { setComAnoFilter("TODOS"); }}
                        className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                          comAnoFilter === "TODOS"
                            ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        Todos os Anos
                      </button>
                      {distinctYears.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => { setComAnoFilter(yr.toString()); }}
                          className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                            comAnoFilter === yr.toString()
                              ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                        >
                          Ano {yr} {yr === 2026 && <span className="bg-emerald-200 text-emerald-900 text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1">Ativo</span>}
                        </button>
                      ))}
                    </div>

                    {/* Filter Rail */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1 no-print">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar comunicação, processo, contato..."
                          value={comSearchTerm}
                          onChange={(e) => { setComSearchTerm(e.target.value); }}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white bg-slate-50/55 transition text-xs"
                        />
                      </div>

                      <div>
                        <select
                          value={comUnidadeFilter}
                          onChange={(e) => { setComUnidadeFilter(e.target.value); }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white bg-slate-50/55 transition text-xs"
                        >
                          <option value="TODOS">Todas as Unidades Emitentes</option>
                          {uniqueUnidades.map(un => (
                            <option key={un} value={un}>{un}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={comRespondidoFilter}
                          onChange={(e) => { setComRespondidoFilter(e.target.value); }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white bg-slate-50/55 transition text-xs"
                        >
                          <option value="TODOS">Todos os Status de Resposta</option>
                          <option value="RESPONDIDO">Respondidos (Concluídos)</option>
                          <option value="PENDENTE">Pendentes (Não Respondidos)</option>
                          <option value="NAO_EXIGIDO">Não Precisa de Resposta</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end text-slate-400 font-mono text-[10px] pr-2">
                        Retornou {finalFiltered.length} registros • Rolagem vertical ativa
                      </div>
                    </div>

                    {/* Highly Formatted Scrollable list table - SCROLLABLE WITHOUT PAGES */}
                    <div className="overflow-y-auto max-h-[500px] rounded-xl border border-slate-200 mt-4 bg-slate-50/20">
                      <table className="w-full text-left border-collapse text-[10.5px] table-auto">
                        <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs font-mono text-[8px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="p-2.5 font-extrabold bg-slate-100 w-10 text-center no-print"></th>
                            <th className="p-2.5 font-extrabold bg-slate-100">Ofício / Comunicação</th>
                            <th className="p-2.5 font-extrabold bg-slate-100">Destinatário MTE</th>
                            <th className="p-2.5 font-extrabold bg-slate-100 text-center">Processo</th>
                            <th className="p-2.5 font-extrabold bg-slate-100 text-center">Expedição</th>
                            <th className="p-2.5 font-extrabold bg-slate-100 text-center">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {finalFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-16 text-center text-slate-400 space-y-2">
                                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                                <p className="font-bold text-slate-700">Nenhuma comunicação localizada</p>
                                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                  Altere os termos de pesquisa ou use a barra de sincronização acima para importar dados deste ou de outros anos.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            finalFiltered.map((item) => {
                              const isExpanded = comExpandedRow === item.KEY;
                              const carece = item.CARECE_RESPOSTA !== false;
                              const hasResponse = !!item.DATA_RESPOSTA && item.DATA_RESPOSTA.trim() !== "";
                              
                              let situacaoText = "NÃO PRECISA DE RESPOSTA";
                              let situacaoStyle = "bg-slate-50 text-slate-600 border-slate-200";
                              let dotStyle = "bg-slate-450";
                              
                              if (carece) {
                                  if (hasResponse) {
                                    situacaoText = "RESPONDIDA";
                                    situacaoStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                    dotStyle = "bg-emerald-500";
                                  } else {
                                    situacaoText = "PENDENTE";
                                    situacaoStyle = "bg-amber-50 text-amber-800 border-amber-200 animate-pulse";
                                    dotStyle = "bg-amber-500";
                                  }
                              }

                              return (
                                <React.Fragment key={item.KEY || `${item.COMUNICACAO}-${item.ANO}`}>
                                  {/* Row Item */}
                                  <tr className={`hover:bg-blue-50/15 border-b border-slate-100 transition duration-100 ${isExpanded ? "bg-slate-50/50" : ""}`}>
                                    
                                    {/* Expand toggle icon */}
                                    <td className="p-2.5 text-center no-print">
                                      <button 
                                        onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
                                        className="text-slate-400 hover:text-[#003366] hover:bg-slate-100 p-1.5 rounded-lg transition"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#003366] stroke-[2.5]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                    </td>

                                    {/* Ofício/Comunicação */}
                                    <td className="p-2.5 font-bold text-[#003366]">
                                      <span 
                                        className="cursor-pointer hover:underline text-xs"
                                        onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
                                      >
                                        {item.COMUNICACAO}
                                      </span>
                                    </td>

                                    {/* Destinatário */}
                                    <td className="p-2.5 font-semibold text-slate-800 truncate max-w-[280px]" title={item.DESTINATARIO}>
                                      {item.DESTINATARIO}
                                    </td>

                                    {/* Processo */}
                                    <td className="p-2.5 font-mono text-[10px] text-slate-600 text-center whitespace-nowrap">
                                      {item.PROCESSO || <span className="text-slate-350 italic">Não associado</span>}
                                    </td>

                                    {/* Expedição */}
                                    <td className="p-2.5 text-slate-500 text-center whitespace-nowrap font-mono font-medium">
                                      {item.DATA_EXPEDICAO}
                                    </td>

                                    {/* Situação */}
                                    <td className="p-2.5 text-center whitespace-nowrap">
                                      <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${situacaoStyle}`}>
                                        <span className={`w-1 h-1 rounded-full ${dotStyle}`} />
                                        {situacaoText}
                                      </span>
                                    </td>

                                  </tr>

                                  {/* Detail panel expansion */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={6} className="bg-slate-50/30 px-6 py-4.5 border-b border-slate-200 no-print">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          
                                          {/* Emitente block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Emitente TCU</span>
                                              <span className="text-xs text-[#003366] font-bold block">{item.UNIDADE_EMITENTE}</span>
                                            </div>
                                          </div>

                                          {/* Contato block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Contato Vinculado</span>
                                              <span className="text-xs text-slate-700 font-bold block truncate max-w-[200px]" title={item.CONTATO || "Alessandro Barbosa"}>
                                                {item.CONTATO || "Alessandro Barbosa"}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Data da Resposta / Ação Responder block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                              <div className={`p-2 rounded-lg ${hasResponse ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
                                                <Check className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Data da Resposta</span>
                                                <span className="text-xs text-slate-800 font-mono font-bold block">
                                                  {hasResponse ? item.DATA_RESPOSTA : "Sem data registrada"}
                                                </span>
                                              </div>
                                            </div>

                                            <button
                                              onClick={() => triggerComEdit(item)}
                                              className="px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#003366] hover:bg-slate-900 text-white cursor-pointer transition shadow-2xs shrink-0"
                                              title="Editar resposta ou dados complementares desta comunicação"
                                            >
                                              Editar / Responder
                                            </button>
                                          </div>

                                          {/* Unidade Executora block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Unidade Executora</span>
                                              <span className="text-xs text-[#003366] font-bold block">
                                                {item.UNIDADE_EXECUTORA || <span className="text-slate-300 italic">Não informada</span>}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Processo SEI block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Processo SEI</span>
                                              <span className="text-xs text-slate-700 font-mono font-bold block">
                                                {item.PROCESSO_SEI || <span className="text-slate-300 italic">Não informado</span>}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Destinação block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              {item.DESTINACAO === "ARQUIVAMENTO" ? <Archive className="w-4 h-4 text-slate-500" /> : <ArrowLeftRight className="w-4 h-4 text-[#003366]" />}
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Destinação</span>
                                              <span className="text-xs text-slate-700 font-bold block">
                                                {item.DESTINACAO === "ARQUIVAMENTO" ? (
                                                  <span className="bg-slate-100 text-slate-700 border border-slate-200/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                                    Arquivamento
                                                  </span>
                                                ) : item.DESTINACAO === "RESPOSTA" ? (
                                                  <span className="bg-blue-50 text-blue-800 border border-blue-200/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                                    Resposta
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-300 italic">Não informada</span>
                                                )}
                                              </span>
                                            </div>
                                          </div>

                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="text-[10px] text-slate-400 italic text-right">
                      Dica: Use a rolagem lateral e vertical do próprio painel para navegar pelas linhas da tabela sem paginação.
                    </div>
                  </div>
                )}

                {/* Sub Tab View 2: RECIPIENT STATISTICS & DETAILS (PARETO) */}
                {comSubTab === "analytics" && (
                  <div className="space-y-6 animate-fade-in transition duration-200">
                    
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider block">
                        Volume Total de Comunicações por Unidades (Destinatários)
                      </h3>
                      
                      {/* Scrollable Grid representation of units with communications count */}
                      <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                          {destinatarioStats.map((stat, idx) => {
                            const respRate = stat.requireResponseTotal > 0 ? ((stat.responded / stat.requireResponseTotal) * 100).toFixed(0) : (stat.total > 0 ? "100" : "0");
                            return (
                              <div key={idx} className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-3xs space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center translate-x-3 -translate-y-3">
                                  <span className="text-[11px] font-black text-slate-300">#{idx + 1}</span>
                                </div>
                                <div className="space-y-0.5 pr-4">
                                  <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase block truncate" title={stat.unidade}>
                                    {stat.unidade}
                                  </span>
                                  <h4 className="text-2xl font-black text-slate-900">
                                    {stat.total} <span className="text-xs font-normal text-slate-400">ofícios ({stat.percentage.toFixed(1)}%)</span>
                                  </h4>
                                </div>

                                <div className="grid grid-cols-2 text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
                                  <div className="text-emerald-700 font-bold">✓ {stat.responded} Respondidos</div>
                                  <div className="border-l border-slate-100 pl-2 text-amber-700 font-bold">⚡ {stat.pending} Pendentes</div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                                    <span>Índice de Resposta</span>
                                    <span>{respRate}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${respRate}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {destinatarioStats.length === 0 && (
                            <div className="col-span-4 p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
                              Aguardando sincronização de dados para cálculo de indicadores em tempo real.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Pareto Distribution Table representation */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h4 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                            Impacto por Destinatário & Participação Relativa
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Fórmula de Pareto: Ofícios Recebidos por unidade em relação ao total de comunicações enviadas em {comAnoFilter === "TODOS" ? "todos os anos" : `no ano ${comAnoFilter}`} ({totalComsCount} ofícios).
                          </p>
                        </div>
                        <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                          Unidade Ativas: {destinatarioStats.length}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[9px] uppercase tracking-wider">
                              <th className="p-3 font-bold">Unidade do Ministério do Trabalho (Destinatário)</th>
                              <th className="p-3 font-bold text-center w-[130px]">Ofícios Recebidos</th>
                              <th className="p-3 font-bold text-center w-[130px]">Demandam Resposta</th>
                              <th className="p-3 font-bold text-center w-[130px]">Respondidos</th>
                              <th className="p-3 font-bold text-center w-[130px]">Pendentes (Em Aberto)</th>
                              <th className="p-3 font-bold text-center w-[200px]">% de Representação no Órgão</th>
                              <th className="p-3 font-bold text-center w-[130px]">Índice de Conclusão</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {destinatarioStats.map((stat, idx) => {
                              const respPct = stat.requireResponseTotal > 0 ? (stat.responded / stat.requireResponseTotal) * 100 : (stat.total > 0 ? 100 : 0);
                              return (
                                <tr key={idx} className="hover:bg-slate-55/35 transition duration-100">
                                  <td className="p-3 text-slate-800 font-black flex items-center gap-2 text-[11px]">
                                    <span className="w-5 h-5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-full flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span>{stat.unidade}</span>
                                  </td>
                                  <td className="p-3 text-center text-slate-900 font-mono font-bold text-sm">
                                    {stat.total}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-600">
                                    {stat.requireResponseTotal}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-emerald-700">
                                    {stat.responded}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-amber-700">
                                    {stat.pending}
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-1 max-w-[180px] mx-auto">
                                      <div className="flex justify-between font-mono text-[10px] font-bold text-slate-700">
                                        <span>{stat.percentage.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#003366] rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-1 rounded-sm font-bold text-[10px] font-mono ${
                                      respPct >= 90
                                        ? "bg-emerald-100 border border-emerald-200 text-emerald-800"
                                        : respPct >= 50
                                        ? "bg-amber-100 border border-amber-200 text-amber-800"
                                        : "bg-rose-100 border border-rose-200 text-rose-800"
                                    }`}>
                                      {respPct.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {destinatarioStats.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                                  Sem dados acumulados para este filtro de período.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Edit / Resposta Modal for Communication */}
          {editingComItem && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Responder / Editar Comunicação</h3>
                    <p className="text-xs text-slate-400 font-bold">{editingComItem.COMUNICACAO} • Ano {editingComItem.ANO}</p>
                  </div>
                  <button onClick={() => setEditingComItem(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Unidade Emitente</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        value={editComUnidade}
                        onChange={(e) => setEditComUnidade(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Processo Associado</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        value={editComProcesso}
                        onChange={(e) => setEditComProcesso(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Destinatário</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      value={editComDestinatario}
                      onChange={(e) => setEditComDestinatario(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Contato de Referência</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      value={editComContato}
                      onChange={(e) => setEditComContato(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Unidade Executora</label>
                    <input
                      type="text"
                      placeholder="Ex: SECI"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      value={editComUnidadeExecutora}
                      onChange={(e) => setEditComUnidadeExecutora(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Nº Processo SEI</label>
                    <input
                      type="text"
                      placeholder="Ex: 19973.100234/2026-99"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      value={editComProcessoSei}
                      onChange={(e) => setEditComProcessoSei(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Destinação da Comunicação</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditComDestinacao("RESPOSTA")}
                        className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          editComDestinacao === "RESPOSTA"
                            ? "bg-[#003366] text-white border-[#003366] shadow-2xs"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Resposta
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditComDestinacao("ARQUIVAMENTO")}
                        className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          editComDestinacao === "ARQUIVAMENTO"
                            ? "bg-slate-700 text-white border-slate-700 shadow-2xs"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Arquivamento
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Data de Expedição</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center"
                        value={editComExpedicao}
                        onChange={(e) => setEditComExpedicao(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Data da Resposta</label>
                      <input
                        type="text"
                        placeholder="DD/MM/AAAA ou em branco se pendente"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold bg-[#003366]/5 focus:bg-white text-slate-900 border-[#003366]/30"
                        value={editComResposta}
                        onChange={(e) => setEditComResposta(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="checkbox"
                      id="edit-com-carece"
                      checked={editComCarece}
                      onChange={(e) => setEditComCarece(e.target.checked)}
                      className="w-4 h-4 text-[#003366] border-slate-350 rounded-sm focus:ring-[#003366] cursor-pointer"
                    />
                    <label htmlFor="edit-com-carece" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                      Esta comunicação carece/exige resposta oficial da assessoria
                    </label>
                  </div>

                  {editComCarece && editComExpedicao && (() => {
                    const [d, m, y] = editComExpedicao.split("/");
                    if (d && m && y && d.length === 2 && m.length === 2 && y.length === 4) {
                      const dtExpedicao = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                      if (!isNaN(dtExpedicao.getTime())) {
                        let dtReferencia = new Date(); // today
                        const resolved = editComResposta && editComResposta.trim() !== "";
                        if (resolved) {
                          const [rd, rm, ry] = editComResposta.split("/");
                          if (rd && rm && ry) {
                            dtReferencia = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd));
                          }
                        }
                        
                        const diffTime = dtReferencia.getTime() - dtExpedicao.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays >= 0) {
                          return (
                            <div className={`p-3 mt-1 rounded-xl flex items-center justify-between border ${resolved ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                              <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${resolved ? 'text-emerald-600' : 'text-amber-600'}`} />
                                <span className={`text-[11px] font-black uppercase ${resolved ? 'text-emerald-700' : 'text-amber-700'}`}>
                                  {resolved ? "Comunicação Respondida" : "Contagem de Prazo / Tempo Decorrido"}
                                </span>
                              </div>
                              <span className={`text-xs font-mono font-bold ${resolved ? 'text-emerald-800' : 'text-amber-800'}`}>
                                {resolved ? `Respondido em ${diffDays} dias` : `${diffDays} dias em aberto`}
                              </span>
                            </div>
                          );
                        }
                      }
                    }
                    return null;
                  })()}

                  <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-150/70">
                    <a
                      href="https://processoeletronico.trabalho.gov.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[145px] py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[#003366] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-155 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Acessar SEI
                    </a>
                    <a
                      href="https://conecta-tcu.apps.tcu.gov.br/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[145px] py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[#003366] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-155 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Conecta TCU
                    </a>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setEditingComItem(null)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 transition text-xs font-bold"
                  >
                    Mudar Credencial & Cancelar
                  </button>
                  <button
                    onClick={saveComEdit}
                    disabled={isSavingCom}
                    className="px-4 py-2 bg-[#003366] text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition"
                  >
                    {isSavingCom ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TCE Section - Dual Fronts (Gerais / Com Acórdãos) */}
