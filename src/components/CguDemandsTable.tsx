import React, { useState } from "react";
import { ChevronDown, ChevronRight, Eye } from "lucide-react";
import { CguDemand } from "../types";

interface Props {
  demands: CguDemand[];
  onView: (demand: CguDemand) => void;
}

interface GroupedReport {
  reportName: string;
  unidadeAuditada: string;
  categoria: string;
  demands: CguDemand[];
}

export default function CguDemandsTable({ demands, onView }: Props) {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  const parseReportAndRec = (titulo: string) => {
    if (!titulo) return { reportName: "Não Informado", recName: "" };
    let parts = titulo.split(/\s*[-—]\s*/);
    if (parts.length > 1) {
      return { reportName: parts[0].trim() || "Não Informado", recName: parts.slice(1).join(" - ").trim() || "Recomendação Única" };
    }
    const recRegex = /\s+(?=Recomend[aã]c?[aã]o|Recomend[aã]c?[oõ]es)/i;
    parts = titulo.split(recRegex);
    if (parts.length > 1) {
      return { reportName: parts[0].trim() || "Não Informado", recName: parts.slice(1).join(" ").trim() || "Recomendação Única" };
    }
    const recRegexFallback = /\s+(?=Recomend)/i;
    parts = titulo.split(recRegexFallback);
    if (parts.length > 1) {
      return { reportName: parts[0].trim() || "Não Informado", recName: parts.slice(1).join(" ").trim() || "Recomendação Única" };
    }
    return { reportName: titulo.trim(), recName: "Recomendação Única" };
  };

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

  const getDeadlineStatus = (dataLimiteStr: string, situacao: string, estado: string): "ATRASADO" | "PROXIMO" | "REGULAR" | "SEM_PRAZO" => {
    const normalize = (str: string): string => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const normSituacao = normalize(situacao);
    const normEstado = normalize(estado);
    const isSituacaoValida = normSituacao === "em analise" || normSituacao === "em execucao";
    const isEstadoExcluido = ["consolidada", "consolidado", "em analise pela unidade de auditoria", "concluida", "manifestacao enviada"].includes(normEstado);
    const isSituacaoExcluida = ["concluida", "concluido", "cumprido", "manifestacao enviada", "fechada", "fechado", "recomendacao cancelada", "aberto"].includes(normSituacao);
    
    if (!isSituacaoValida || isEstadoExcluido || isSituacaoExcluida) return "REGULAR";
    if (!dataLimiteStr) return "SEM_PRAZO";
    
    const parts = dataLimiteStr.split("/");
    if (parts.length === 3) {
      const limitDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (isNaN(limitDate.getTime())) return "SEM_PRAZO";
      const diffDays = Math.ceil((limitDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return "ATRASADO";
      if (diffDays <= 15) return "PROXIMO";
    }
    return "REGULAR";
  };

  const groupedReports: GroupedReport[] = [];
  demands.forEach(d => {
    const { reportName } = getCguReportAndRec(d);
    const getReportKey = (name: string): string => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\bn[oº°\.]+/gi, "").replace(/[^a-z0-9]/gi, " ").replace(/\s+/g, " ").trim();
    const dKey = getReportKey(reportName);
    let group = groupedReports.find(g => getReportKey(g.reportName) === dKey);
    if (!group) {
      group = { reportName, unidadeAuditada: d.unidadeAuditada || "CGU", categoria: d.categoria || "OUTROS", demands: [] };
      groupedReports.push(group);
    }
    group.demands.push(d);
  });

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-com-scroll-container bg-slate-50/20 rounded-2xl border border-slate-200">
      <table className="w-full text-left border-collapse table-auto text-xs min-w-[1000px]">
        <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs">
          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
            <th className="p-4 bg-slate-100 no-print"></th>
            <th className="p-4 bg-slate-100">Relatório de Auditoria</th>
            <th className="p-4 bg-slate-100">Unidade Auditada</th>
            <th className="p-4 bg-slate-100">Situação das Recomendações</th>
            <th className="p-4 bg-slate-100 text-center no-print">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {groupedReports.map((g, i) => {
            const isExpanded = expandedReport === g.reportName;
            let countAtrasado = 0;
            let countProximo = 0;
            g.demands.forEach(d => {
              const ds = getDeadlineStatus(d.dataLimite || "", d.situacao || "", d.estado || "");
              if (ds === "ATRASADO") countAtrasado++;
              if (ds === "PROXIMO") countProximo++;
            });

            return (
              <React.Fragment key={g.reportName + i}>
                <tr 
                  className={`hover:bg-slate-50/50 transition duration-150 cursor-pointer ${isExpanded ? "bg-slate-50/70" : "bg-white"}`}
                  onClick={() => setExpandedReport(isExpanded ? null : g.reportName)}
                >
                  <td className="p-4 no-print">
                    <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition text-left">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-450" />}
                    </button>
                  </td>

                  <td className="p-4">
                    <div>
                      <span className="font-extrabold text-[#003366] cursor-pointer hover:underline text-xs">
                        {g.reportName}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                        Recomendações: {g.demands.length} vinculadas
                      </span>
                    </div>
                  </td>

                  <td className="p-4">
                    <code className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] text-slate-750 font-medium truncate block max-w-[200px]">
                      {g.unidadeAuditada}
                    </code>
                  </td>

                  <td className="p-4">
                    <div className="flex gap-1 items-center">
                      {countAtrasado > 0 && (
                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold text-[10px]" title={`${countAtrasado} atrasadas`}>
                          {countAtrasado} ATR
                        </span>
                      )}
                      {countProximo > 0 && (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]" title={`${countProximo} próximas`}>
                          {countProximo} PRX
                        </span>
                      )}
                      {countAtrasado === 0 && countProximo === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Regular</span>
                      )}
                    </div>
                  </td>

                  <td className="p-4 text-center">
                    <button 
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold transition"
                      onClick={(e) => {
                          e.stopPropagation();
                          setExpandedReport(isExpanded ? null : g.reportName);
                      }}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50/50 p-0 border-b border-slate-200">
                      <div className="px-10 py-5 bg-slate-50/40 border-l-4 border-[#003366] space-y-3">
                        <span className="text-[10px] font-black uppercase text-[#003366] tracking-widest block">
                          Recomendações e Plano de Trabalho Vinculados
                        </span>
                        
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left text-xs bg-white">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                              <tr>
                                <th className="px-4 py-2 font-mono">ID Tarefa</th>
                                <th className="px-4 py-2">Item da Recomendação</th>
                                <th className="px-4 py-2">Prazo Limite</th>
                                <th className="px-4 py-2">Situação</th>
                                <th className="px-4 py-2">Estado</th>
                                <th className="px-4 py-2 text-center no-print w-20">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {g.demands.map(d => {
                                const { recName } = getCguReportAndRec(d);
                                const ds = getDeadlineStatus(d.dataLimite || "", d.situacao || "", d.estado || "");
                                return (
                                  <tr key={d.idTarefa} className="hover:bg-blue-50/10 transition-colors">
                                    <td
                                      onClick={() => onView(d)}
                                      className="px-4 py-3 font-mono font-bold text-[#003366] text-[11px] cursor-pointer hover:underline"
                                    >
                                      {d.idTarefa}
                                    </td>
                                    <td
                                      onClick={() => onView(d)}
                                      className="px-4 py-3 font-semibold text-slate-800 text-[11px] max-w-sm font-sans whitespace-pre-line leading-relaxed cursor-pointer hover:text-[#003366] hover:underline"
                                    >
                                      {recName}
                                    </td>
                                    <td className="px-4 py-3">
                                      {ds === "ATRASADO" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-800">
                                          {d.dataLimite || "—"}
                                        </span>
                                      ) : ds === "PROXIMO" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-800">
                                          {d.dataLimite || "—"}
                                        </span>
                                      ) : (
                                        <span className="font-mono text-slate-600 text-[11px] font-medium">{d.dataLimite || "—"}</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700 font-medium text-[11px]">{d.situacao || "—"}</td>
                                    <td className="px-4 py-3 text-slate-700 font-medium text-[11px]">{d.estado || "—"}</td>
                                    <td className="px-4 py-3 text-center no-print w-20">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button onClick={() => onView(d)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Visualizar Dossiê">
                                          <Eye className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
          {groupedReports.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-slate-500">Nenhuma demanda encontrada.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
