import React, { useState, useEffect } from "react";
import {
  Search, RefreshCw, FileText, FileSpreadsheet, Eye, Trash2, Edit, X, Save, CheckCircle2, AlertTriangle, ArrowRightLeft, Filter, ShieldCheck, Database, Download
} from "lucide-react";
import { CguDemand, CguPublishedReport } from "../types";
import CguDossieModal from "./CguDossieModal";
import CguDemandsTable from "./CguDemandsTable";

interface CguModuleProps {
  cguDemands: CguDemand[];
  onUpdateCgu: (updated: CguDemand) => Promise<boolean>;
  onDeleteCgu: (id: string) => Promise<boolean>;
  isLoading: boolean;
  cguPublishedReports?: CguPublishedReport[];
  onSyncCguMonitoramentos?: () => Promise<any>;
  onSyncCguReports?: () => Promise<any>;
  onDeleteCguReport?: (idTarefa: string) => Promise<boolean>;
}

export default function CguModule({
  cguDemands = [],
  onUpdateCgu,
  onDeleteCgu,
  isLoading,
  cguPublishedReports = [],
  onSyncCguMonitoramentos,
  onSyncCguReports,
  onDeleteCguReport
}: CguModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"demands" | "published">("demands");
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [anoFilter, setAnoFilter] = useState("TODOS OS ANOS");

  // Edit Modal
  const [editingItem, setEditingItem] = useState<CguDemand | null>(null);
  const [viewingItem, setViewingItem] = useState<CguDemand | null>(null);
  const [editSituacao, setEditSituacao] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSyncDemands = async () => {
    if (!onSyncCguMonitoramentos) return;
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await onSyncCguMonitoramentos();
      if (res?.success) {
        setSyncMessage({ type: 'success', text: `Sincronizado com sucesso! ${res.importedCount} registros processados.` });
      } else {
        setSyncMessage({ type: 'error', text: res?.error || "Erro ao sincronizar." });
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    const success = await onUpdateCgu({
      ...editingItem,
      situacao: editSituacao,
      estado: editEstado
    });
    setIsSavingEdit(false);
    if (success) setEditingItem(null);
  };

  const availableYears = ["TODOS OS ANOS", ...Array.from(new Set(cguDemands.map(d => d.ano).filter(Boolean))).sort((a: any, b: any) => b - a).map(y => `ANO ${y}`)];

  const filteredDemands = cguDemands.filter(d => {
    if (anoFilter !== "TODOS OS ANOS" && `ANO ${d.ano}` !== anoFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        d.idTarefa?.toLowerCase().includes(term) ||
        d.tituloTarefa?.toLowerCase().includes(term) ||
        d.unidadeAuditada?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const filteredReports = cguPublishedReports.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        r.idTarefa?.toLowerCase().includes(term) ||
        r.idAuditoria?.toLowerCase().includes(term) ||
        r.nomeUnidadeAuditada?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Volumetry counts
  const counts = {
    pendentes: filteredDemands.filter(d => d.situacao?.toLowerCase().includes('pendente')).length,
    analise: filteredDemands.filter(d => d.situacao?.toLowerCase().includes('análise') || d.situacao?.toLowerCase().includes('analise')).length,
    concluidas: filteredDemands.filter(d => d.situacao?.toLowerCase().includes('concluíd') || d.situacao?.toLowerCase().includes('concluid') || d.situacao?.toLowerCase().includes('cumprid')).length,
    outros: filteredDemands.filter(d => {
      const s = d.situacao?.toLowerCase() || '';
      return !s.includes('pendente') && !s.includes('análise') && !s.includes('analise') && !s.includes('conclu') && !s.includes('cumprid');
    }).length,
  };

  const statsCards = [
    { id: 'pendentes', label: 'Pendentes', short: 'PEND', count: counts.pendentes, icon: AlertTriangle, colorClass: 'text-amber-600 bg-amber-50', textClass: 'border-amber-200 hover:border-amber-300 shadow-sm shadow-amber-900/5' },
    { id: 'analise', label: 'Em Análise', short: 'ANALISE', count: counts.analise, icon: Search, colorClass: 'text-blue-600 bg-blue-50', textClass: 'border-blue-200 hover:border-blue-300 shadow-sm shadow-blue-900/5' },
    { id: 'concluidas', label: 'Concluídas', short: 'CONC', count: counts.concluidas, icon: CheckCircle2, colorClass: 'text-emerald-600 bg-emerald-50', textClass: 'border-emerald-200 hover:border-emerald-300 shadow-sm shadow-emerald-900/5' },
    { id: 'outros', label: 'Outros Status', short: 'OUTROS', count: counts.outros, icon: ArrowRightLeft, colorClass: 'text-slate-600 bg-slate-50', textClass: 'border-slate-200 hover:border-slate-300 shadow-sm' },
  ];

  const lastUpdateDate = React.useMemo(() => {
    if (!cguDemands || cguDemands.length === 0) return null;
    let latest = cguDemands[0]?.ultimaAtualizacao || "";
    for (const d of cguDemands) {
      if (d.ultimaAtualizacao && d.ultimaAtualizacao > latest) {
        latest = d.ultimaAtualizacao;
      }
    }
    if (!latest) return null;
    return new Date(latest).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }, [cguDemands]);

  const handleExportExcel = () => {
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #003366; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; vertical-align: top; }
        </style>
      </head>
      <body>
        <div style="font-size: 16px; font-weight: bold; color: #0f172a;">ÓRBITA-AECI — CONTROLE INTERNO CGU</div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 15px;">Relatório Geral — Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
        <table>
          <thead>
            <tr>
              <th>ID Tarefa</th>
              <th>Status</th>
              <th>Relatório de Auditoria</th>
              <th>Recomendação</th>
              <th>Situação MTE</th>
              <th>Processo SEI</th>
              <th>Vencimento</th>
            </tr>
          </thead>
          <tbody>
    `;
    filteredDemands.forEach(d => {
      excelTemplate += `
        <tr>
          <td>${d.idTarefa || ""}</td>
          <td>${d.estado || ""}</td>
          <td>${d.tituloTarefa?.split(/[-—]/)[0] || ""}</td>
          <td>${d.tituloTarefa || ""}</td>
          <td>${d.situacao || ""}</td>
          <td>${d.processoSei || ""}</td>
          <td>${d.dataLimite || ""}</td>
        </tr>
      `;
    });
    
    excelTemplate += `</tbody></table></body></html>`;
    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CGU_Demandas_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Controladoria-Geral da União — CGU</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Monitoramento de Recomendações e Relatórios de Auditoria</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleSyncDemands}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
            {lastUpdateDate && (
              <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                Atualizado em: {lastUpdateDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submodules Navigation */}
      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs mb-6">
        {[
          { id: "demands", label: "Monitoramento", desc: "Acompanhamento de Recomendações", icon: Database },
          { id: "published", label: "Relatórios Publicados", desc: "Base de Relatórios da CGU", icon: FileText }
        ].map((sub) => {
          const SubIcon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SubIcon className={`w-5 h-5 ${isActive ? "text-blue-200" : "text-slate-400"}`} />
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wide leading-none">{sub.label}</span>
                  <span className="block text-[9px] opacity-75 mt-0.5 font-normal leading-none">{sub.desc}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Year Tabs Filters */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto pb-px no-scrollbar">
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => setAnoFilter(year)}
            className={`px-4 py-2.5 text-xs font-black tracking-wide whitespace-nowrap uppercase transition-all border-b-2 ${
              anoFilter === year
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
            }`}
          >
            {year === "TODOS OS ANOS" ? year : `${year} ATIVO`}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {activeSubTab === "demands" ? (
        <div className="space-y-6">
          {/* Volumetry Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volumetria por Situação ({anoFilter.replace(' ATIVO', '')})</span>
              <span className="text-xs text-slate-500 font-semibold">{filteredDemands.length} Demandas Filtradas</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
              {statsCards.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div 
                    key={cat.id} 
                    className={`bg-white border rounded-xl p-3 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden ${cat.textClass}`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-500 truncate group-hover:text-slate-800 transition-colors">
                          {cat.label}
                        </span>
                        <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                          {cat.short}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-105 duration-200 ${cat.colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="flex items-baseline justify-between mt-auto">
                      <h4 className="text-xl font-black text-slate-900">
                        {cat.count}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold">
                        {filteredDemands.length > 0 ? `${((cat.count / filteredDemands.length) * 100).toFixed(0)}%` : "0%"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar recomendações por relatório, título ou unidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <p>Carregando dados...</p>
            </div>
          ) : (
            <div className="w-full">
              <CguDemandsTable 
                demands={filteredDemands} 
                onView={setViewingItem} 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
             <h3 className="font-bold text-slate-700">Relatórios Publicados CGU</h3>
          </div>
          <table className="w-full text-left border-collapse text-slate-700 text-sm">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs uppercase">
              <tr>
                <th className="p-3 font-semibold">Relatório</th>
                <th className="p-3 font-semibold">Auditoria</th>
                <th className="p-3 font-semibold">Data</th>
                <th className="p-3 font-semibold">Unidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((r, i) => (
                <tr key={`rep-${r.idTarefa}-${i}`} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-medium text-slate-800">{r.tituloRelatorio}</td>
                  <td className="p-3">{r.idAuditoria}</td>
                  <td className="p-3">{r.dataPublicacao}</td>
                  <td className="p-3">{r.nomeUnidadeAuditada}</td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhum relatório encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Editar Demanda</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Situação</label>
                <input
                  type="text"
                  value={editSituacao}
                  onChange={(e) => setEditSituacao(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSavingEdit ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dossier Modal */}
      {viewingItem && (
        <CguDossieModal demand={viewingItem} onClose={() => setViewingItem(null)} onUpdateCgu={onUpdateCgu} />
      )}
    </div>
  );
}
