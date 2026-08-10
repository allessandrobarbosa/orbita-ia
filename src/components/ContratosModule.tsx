import React, { useState } from 'react';
import { 
  Building2, LayoutDashboard, FileText, RefreshCw, Plus, 
  CheckCircle2, AlertTriangle, Trash2
} from 'lucide-react';
import type { Contrato } from '../types';
import ContratosDashboard from './ContratosDashboard';
import ContratosList from './ContratosList';
import ContratoDetailModal from './ContratoDetailModal';

export default function ContratosModule() {
  const [activeSubTab, setActiveSubTab] = useState<"contratos" | "dashboard">("contratos");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [initialListFilter, setInitialListFilter] = useState<string | undefined>(undefined);

  const [isSyncingPncp, setIsSyncingPncp] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Contract Form Modal (Create / Edit)
  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [contractNumero, setContractNumero] = useState("");
  const [contractTipo, setContractTipo] = useState("Vigilância");
  const [contractFornecedor, setContractFornecedor] = useState("");
  const [contractValorTotal, setContractValorTotal] = useState("");
  const [contractValorMensal, setContractValorMensal] = useState("");
  const [contractInicio, setContractInicio] = useState("");
  const [contractFim, setContractFim] = useState("");
  const [contractObjeto, setContractObjeto] = useState("");
  const [contractStatus, setContractStatus] = useState<"Ativo" | "Encerrado" | "Suspenso">("Ativo");
  const [contractUf, setContractUf] = useState("DF");

  // Counter to trigger refreshes in subcomponents
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const handleSyncPncp = async () => {
    setIsSyncingPncp(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/contratos/sync-pncp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uf: "DF" })
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({ 
          type: 'success', 
          text: `Sincronização concluída! ${data.imported || 0} novos contratos importados e ${data.updated || 0} contratos existentes atualizados com metadados e arquivos do PNCP.` 
        });
        triggerRefresh();
      } else {
        setSyncMessage({ type: 'error', text: "Falha na sincronização." });
      }
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: "Erro ao conectar com serviço de integração." });
    } finally {
      setIsSyncingPncp(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };





  const resetContractForm = () => {
    setEditingContractId(null);
    setContractNumero("");
    setContractTipo("Vigilância");
    setContractFornecedor("");
    setContractValorTotal("");
    setContractValorMensal("");
    setContractInicio("");
    setContractFim("");
    setContractObjeto("");
    setContractStatus("Ativo");
    setContractUf("DF");
  };

  const handleNewContract = () => {
    resetContractForm();
    setShowContractForm(true);
  };

  const handleEditContract = (c: Contrato) => {
    setEditingContractId(c.id);
    setContractNumero(c.numeroContrato || "");
    setContractTipo(c.objeto?.includes("Limpeza") ? "Limpeza" : "Vigilância");
    setContractFornecedor(c.empresa || "");
    setContractValorTotal(c.valorGlobal?.toString() || "");
    setContractValorMensal(c.valorMensal?.toString() || "");
    setContractInicio(c.dataInicio || "");
    setContractFim(c.dataFim || "");
    setContractObjeto(c.objeto || "");
    setContractStatus((c.status as any) || "Ativo");
    setContractUf(c.uf || "DF");
    setShowContractForm(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este contrato e todos os seus históricos de consumo?")) {
      try {
        const res = await fetch(`/api/contratos/${encodeURIComponent(id)}`, { method: "DELETE" });
        if (res.ok) {
          triggerRefresh();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      numeroContrato: contractNumero,
      empresa: contractFornecedor,
      objeto: contractObjeto || contractTipo,
      valorGlobal: parseFloat(contractValorTotal) || 0,
      valorMensal: parseFloat(contractValorMensal) || 0,
      dataInicio: contractInicio,
      dataFim: contractFim,
      uf: contractUf,
      status: contractStatus
    };

    try {
      const method = editingContractId ? "PUT" : "POST";
      const url = editingContractId ? `/api/contratos/${encodeURIComponent(editingContractId)}` : "/api/contratos";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        triggerRefresh();
        setShowContractForm(false);
        resetContractForm();
      } else {
        alert("Erro ao salvar contrato.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Mensagem de Sincronia */}
      {syncMessage && (
        <div className={`p-4 rounded-xl border ${syncMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <p className="text-sm font-bold flex items-center gap-2">
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {syncMessage.text}
          </p>
        </div>
      )}

      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Painel de Contratos Gerais</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Gestão centralizada de contratos, fiscais e integração com PNCP</p>
            </div>
          </div>
        </div>
      </div>



      {/* Navegação por Sub-Abas — Pills Gov */}
      <div className="no-print border border-slate-200 bg-white p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm mb-6">
        {[
          { id: "contratos", label: "Contratos", desc: "Repositório Geral & Dossiês", icon: FileText },
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

      {/* RENDERIZAÇÃO CONTEÚDO SUB-ABAS */}
      <div key={refreshKey}>
        {activeSubTab === "dashboard" && (
          <ContratosDashboard 
            onFilterClick={(faixaVencimento) => {
              setInitialListFilter(faixaVencimento);
              setActiveSubTab("contratos");
            }} 
          />
        )}
        
        {activeSubTab === "contratos" && (
          <ContratosList
            onSelectContract={(id) => setSelectedContractId(id)}
            onEditContract={handleEditContract}
            onDeleteContract={handleDeleteContract}
            onSyncPncp={handleSyncPncp}
            isSyncingPncp={isSyncingPncp}
            initialFaixaVencimento={initialListFilter}
          />
        )}
      </div>

      {/* MODAL DOSSIÊ DO CONTRATO */}
      {selectedContractId && (
        <ContratoDetailModal
          contractId={selectedContractId}
          onClose={() => setSelectedContractId(null)}
          onUpdate={triggerRefresh}
        />
      )}

      {/* FORM MODAL CRIAR/EDITAR CONTRATO */}
      {showContractForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <div>
                <h3 className="font-black text-slate-800 text-lg">{editingContractId ? "Editar Contrato" : "Novo Contrato"}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Preencha as informações gerais do contrato.</p>
              </div>
              <button onClick={() => setShowContractForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer">
                X
              </button>
            </div>
            <form onSubmit={handleSaveContract} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Número</label>
                  <input type="text" required value={contractNumero} onChange={e => setContractNumero(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: 01/2024" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo / Categoria</label>
                  <select value={contractTipo} onChange={e => setContractTipo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer">
                    <option value="Vigilância">Vigilância</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Apoio Administrativo">Apoio Administrativo</option>
                    <option value="Manutenção">Manutenção Predial</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">UF (Alocação)</label>
                  <input type="text" value={contractUf} onChange={e => setContractUf(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Ex: DF, AC, SP..." />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Empresa Fornecedora</label>
                <input type="text" required value={contractFornecedor} onChange={e => setContractFornecedor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Nome da empresa..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Global (R$)</label>
                  <input type="number" step="0.01" value={contractValorTotal} onChange={e => setContractValorTotal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Mensal (R$)</label>
                  <input type="number" step="0.01" value={contractValorMensal} onChange={e => setContractValorMensal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data Início</label>
                  <input type="date" value={contractInicio} onChange={e => setContractInicio(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data Fim (Prevista)</label>
                  <input type="date" value={contractFim} onChange={e => setContractFim(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select value={contractStatus} onChange={e => setContractStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer">
                    <option value="Ativo">Ativo</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Encerrado">Encerrado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Objeto do Contrato</label>
                <textarea rows={3} value={contractObjeto} onChange={e => setContractObjeto(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none" placeholder="Descrição detalhada..."></textarea>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowContractForm(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/30 transition cursor-pointer">Salvar Contrato</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
