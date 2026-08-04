import React, { useState } from "react";
import { X, Building2, Printer, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { CguDemand } from "../types";

interface CguDossieModalProps {
  demand: CguDemand;
  onClose: () => void;
  onUpdateCgu?: (updated: CguDemand) => Promise<boolean>;
}

export default function CguDossieModal({ demand, onClose, onUpdateCgu }: CguDossieModalProps) {
  const [processoSei, setProcessoSei] = useState(demand.processoSei || "");
  const [isSavingSei, setIsSavingSei] = useState(false);

  const handleSaveProcessoSei = async () => {
    if (!onUpdateCgu) return;
    setIsSavingSei(true);
    const success = await onUpdateCgu({ ...demand, processoSei });
    setIsSavingSei(false);
  };
  
  // Parse Title into Report Name and Recommendation Name
  const parseReportAndRec = (titulo: string) => {
    if (!titulo) return { reportName: "Não Informado", recName: "" };
    
    // Tenta separar por hífen ou travessão cercado de espaços primeiro
    let parts = titulo.split(/\s*[-—]\s*/);
    if (parts.length > 1) {
      const reportName = parts[0].trim() || "Não Informado";
      const recName = parts.slice(1).join(" - ").trim() || "Recomendação Única";
      return { reportName, recName };
    }

    // Tenta separar pelo espaço antes da palavra "Recomendação" ou "Recomendacao" ou "Recomendações"
    const recRegex = /\s+(?=Recomend[aã]c?[aã]o|Recomend[aã]c?[oõ]es)/i;
    parts = titulo.split(recRegex);
    if (parts.length > 1) {
      const reportName = parts[0].trim() || "Não Informado";
      const recName = parts.slice(1).join(" ").trim() || "Recomendação Única";
      return { reportName, recName };
    }

    // Fallback: se não encontrar nenhum divisor claro, tenta dividir no primeiro espaço que precede "Recomend"
    const recRegexFallback = /\s+(?=Recomend)/i;
    parts = titulo.split(recRegexFallback);
    if (parts.length > 1) {
      const reportName = parts[0].trim() || "Não Informado";
      const recName = parts.slice(1).join(" ").trim() || "Recomendação Única";
      return { reportName, recName };
    }

    // Último caso: não conseguiu separar
    return { reportName: titulo.trim(), recName: "Recomendação Única" };
  };

  // Helper function to extract report name and recommendation name with fallback grouping for simple titles (like INSS)
  const getCguReportAndRec = (d: CguDemand) => {
    let { reportName, recName } = parseReportAndRec(d.tituloTarefa);
    
    const cleanReport = reportName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const hasReportKeyword = /relatorio|auditoria|avaliacao/i.test(cleanReport);
    
    if (!hasReportKeyword && cleanReport.startsWith("recomend")) {
      recName = d.tituloTarefa;
      const unidade = d.unidadeAuditada ? d.unidadeAuditada.trim() : "Outros";
      reportName = `Recomendações da CGU — Unidade ${unidade}`;
    }
    
    return { reportName, recName };
  };

  const { reportName, recName } = getCguReportAndRec(demand);

  const handleExportPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102); // #003366
    doc.text(`Dossiê Técnico CGU - Demanda ${demand.idTarefa}`, 40, 60);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    
    let y = 90;

    const addSection = (title: string, text: string) => {
      if (y > 750) { doc.addPage(); y = 60; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(51, 65, 85);
      doc.text(title, 40, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(text || "Sem registro.", 515);
      doc.text(splitText, 40, y);
      y += splitText.length * 15 + 15;
    };

    const addKeyValue = (key: string, value: string) => {
      if (y > 770) { doc.addPage(); y = 60; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`${key}:`, 40, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value || "N/A"), 160, y);
      y += 15;
    };

    addKeyValue("Categoria", demand.categoria || "");
    addKeyValue("Ano", demand.ano ? String(demand.ano) : "");
    addKeyValue("Situação", demand.situacao || "");
    addKeyValue("Estado", demand.estado || "");
    addKeyValue("Data Início", demand.dataInicio || "");
    addKeyValue("Data Limite", demand.dataLimite || "");
    addKeyValue("Unidade Auditada", demand.unidadeAuditada || "");
    addKeyValue("Unidades CGU", demand.unidadesAuditoria || "");
    addKeyValue("Processo SEI", demand.processoSei || "");
    y += 15;

    addSection("Relatório Relacionado", reportName);
    addSection("Recomendação", recName);
    addSection("Texto do Monitoramento / Encaminhamento da CGU", demand.textoMonitoramento || "");
    addSection("Plano de Providências / Status de Cumprimento MTE", demand.providencia || "");
    
    addSection("Última Manifestação MTE", `[${demand.tipoUltimaManifestacao || "Ofício"} - ${demand.dataUltimaManifestacao || "—"}]\n${demand.textoUltimaManifestacao || ""}`);
    addSection("Último Posicionamento CGU", `[${demand.tipoUltimoPosicionamento || "Nota Técnica"} - ${demand.dataUltimoPosicionamento || "—"}]\n${demand.textoUltimoPosicionamento || ""}`);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden font-sans flex flex-col max-h-[90vh]">
        <div className="bg-[#003366] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Dossiê Técnico CGU</h3>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">Demanda: {demand.idTarefa}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-2"
              title="Exportar para PDF"
            >
              <FileText size={16} /> PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-2 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Relatório Relacionado</span>
            <h4 className="text-sm font-black text-slate-900 leading-snug">{reportName}</h4>
            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mt-4 mb-0.5">Recomendação</span>
            <p className="text-xs font-semibold text-slate-700 leading-relaxed font-sans">{recName}</p>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 font-mono">
                CAT: {demand.categoria || "N/A"}
              </span>
              <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 font-mono">
                ANO: {demand.ano || "N/A"}
              </span>
              <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 font-mono">
                SITUAÇÃO: {demand.situacao || "N/A"}
              </span>
              <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 font-mono">
                ESTADO: {demand.estado || "N/A"}
              </span>
            </div>
          </div>

          {/* Status and Dates Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border p-3 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Início</span>
              <span className="text-xs text-slate-800 font-semibold font-mono">{demand.dataInicio || "—"}</span>
            </div>
            <div className="bg-white border p-3 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Limite Inicial</span>
              <span className="text-xs text-slate-800 font-semibold font-mono">{demand.dataLimiteInicial || "—"}</span>
            </div>
            <div className="bg-white border p-3 rounded-xl shadow-sm bg-blue-50/30">
              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Limite Atual</span>
              <span className="text-xs text-slate-800 font-extrabold text-[#003366] font-mono">{demand.dataLimite || "—"}</span>
            </div>
            <div className="bg-white border p-3 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Conclusão</span>
              <span className="text-xs text-slate-800 font-semibold font-mono">{demand.dataFim || "Em aberto"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border p-3 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Unidade Auditada (MTE)</span>
              <span className="text-xs text-slate-800 font-semibold">{demand.unidadeAuditada || "MTE"}</span>
            </div>
            <div className="bg-white border p-3 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Unidades de Auditoria (CGU)</span>
              <span className="text-xs text-slate-800 font-semibold">{demand.unidadesAuditoria || "CGU"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white border border-blue-200 p-4 rounded-xl shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
               <span className="text-[9px] text-blue-600 block uppercase font-extrabold tracking-wider mb-2">Processo SEI Vinculado</span>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   value={processoSei}
                   onChange={e => setProcessoSei(e.target.value)}
                   placeholder="Ex: 19999.123456/2026-00" 
                   className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                 />
                 <button 
                   onClick={handleSaveProcessoSei}
                   disabled={isSavingSei || processoSei === (demand.processoSei || "") || !onUpdateCgu}
                   className="px-4 py-2 bg-[#003366] text-white text-xs font-bold rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
                 >
                   {isSavingSei ? "Salvando..." : "Salvar"}
                 </button>
               </div>
            </div>
          </div>

          {/* Textos de Monitoramento e Providências */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-300"></div>
              <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-2">Texto do Monitoramento / Encaminhamento da CGU</span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                {demand.textoMonitoramento || "Nenhum teor de monitoramento registrado."}
              </p>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#003366]/40"></div>
              <span className="text-[9px] text-[#003366] block uppercase font-bold tracking-wider mb-2">Plano de Providências / Status de Cumprimento MTE</span>
              <p className="text-xs text-slate-900 leading-relaxed font-sans font-semibold whitespace-pre-line">
                {demand.providencia || "Aguardando envio de relatórios setoriais."}
              </p>
            </div>
          </div>

          {/* Manifestação / Posicionamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm space-y-2">
              <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Última Manifestação MTE</span>
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 border-b border-slate-200/80 pb-1.5 mb-1.5">
                <span className="bg-slate-200/50 px-2 py-0.5 rounded">{demand.tipoUltimaManifestacao || "Ofício"}</span>
                <span>{demand.dataUltimaManifestacao || "—"}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">{demand.textoUltimaManifestacao || "Sem registro."}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm space-y-2">
              <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wider">Último Posicionamento CGU</span>
              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 border-b border-slate-200/80 pb-1.5 mb-1.5">
                <span className="bg-slate-200/50 px-2 py-0.5 rounded">{demand.tipoUltimoPosicionamento || "Nota Técnica"}</span>
                <span>{demand.dataUltimoPosicionamento || "—"}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">{demand.textoUltimoPosicionamento || "Sem registro."}</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-md cursor-pointer"
          >
            Fechar Dossiê
          </button>
        </div>
      </div>
    </div>
  );
}
