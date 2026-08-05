import React, { useState, useEffect } from "react";
import {
  Search, RefreshCw, FileText, FileSpreadsheet, Eye, Trash2, Edit, X, Save, CheckCircle2, AlertTriangle, ArrowRightLeft, Filter, ShieldCheck, Database, Download, LayoutDashboard
} from "lucide-react";
import { CguDemand, CguPublishedReport } from "../types";
import CguDossieModal from "./CguDossieModal";
import CguDemandsTable from "./CguDemandsTable";
import CguAuditoriasDashboard from "./CguAuditoriasDashboard";
import CguAuditoriasList from "./CguAuditoriasList";
import CguAuditoriaDetail from "./CguAuditoriaDetail";

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
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "auditorias" | "demands" | "published">("auditorias");
  const [selectedAuditoriaId, setSelectedAuditoriaId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Modal
  const [editingItem, setEditingItem] = useState<CguDemand | null>(null);
  const [viewingItem, setViewingItem] = useState<CguDemand | null>(null);
  const [editSituacao, setEditSituacao] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      let successCount = 0;
      let errors = [];

      // 1. Sincronizar Monitoramentos
      if (onSyncCguMonitoramentos) {
        const resMon = await onSyncCguMonitoramentos();
        if (resMon?.success) successCount++;
        else errors.push("Monitoramentos: " + (resMon?.error || "Erro"));
      }

      // 2. Sincronizar Relatórios Publicados
      if (onSyncCguReports) {
        const resRep = await onSyncCguReports();
        if (resRep?.success) successCount++;
        else errors.push("Relatórios: " + (resRep?.error || "Erro"));
      }

      // 3. Sincronizar Auditorias (Endpoint Direto)
      try {
        const resAud = await fetch("/api/cgu/auditorias/sync", { method: "POST" });
        if (resAud.ok) successCount++;
        else {
          const json = await resAud.json();
          errors.push("Auditorias: " + (json.error || "Erro"));
        }
      } catch (e) {
        errors.push("Auditorias: Falha de conexão");
      }

      if (errors.length === 0 && successCount > 0) {
        setSyncMessage({ type: 'success', text: 'Toda a base da CGU foi sincronizada com sucesso!' });
      } else if (successCount > 0) {
        setSyncMessage({ type: 'success', text: `Sincronização parcial com alertas: ${errors.join(' | ')}` });
      } else {
        setSyncMessage({ type: 'error', text: "Erro ao sincronizar: " + errors.join(' | ') });
      }

      // Recarrega a página para atualizar os dados em todos os subcomponentes de forma simples
      if (successCount > 0) {
        setTimeout(() => window.dispatchEvent(new Event('cgu_sync_completed')), 2000);
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

  const filteredDemands = cguDemands.filter(d => {
    // Para demandas, mantemos o filtro apenas de texto
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
    link.download = `CGU_Demandas_${new Date().toISOString().slice(0, 10)}.xls`;
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
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Tudo"}
            </button>
            {lastUpdateDate && (
              <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                Atualizado em: {lastUpdateDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Submodules Navigation — Pills Gov */}
      <div className="no-print border border-slate-200 bg-white p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm mb-6">
        {[
          { id: "auditorias", label: "Auditorias", desc: "Base de Relatórios da CGU", icon: FileText },
          { id: "dashboard", label: "Painel Gerencial", desc: "Indicadores e Evolução", icon: LayoutDashboard }
        ].map((sub) => {
          const SubIcon = sub.icon;
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex-1 min-w-[200px] flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-md shadow-blue-900/20"
                  : "hover:bg-slate-50 text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isActive ? "bg-white/15" : "bg-slate-100"
              }`}>
                <SubIcon className={`w-4 h-4 ${isActive ? "text-blue-100" : "text-slate-500"}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black uppercase tracking-wide leading-none">{sub.label}</span>
                <span className="block text-[9px] opacity-70 mt-0.5 font-normal leading-none">{sub.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {activeSubTab === "dashboard" ? (
        <CguAuditoriasDashboard />
      ) : (
        activeSubTab === "auditorias" && (
          selectedAuditoriaId ? (
            <CguAuditoriaDetail 
              id_tarefa={selectedAuditoriaId} 
              onBack={() => setSelectedAuditoriaId(null)}
            />
          ) : (
            <CguAuditoriasList cguDemands={cguDemands} />
          )
        )
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
