import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Calendar, FileText, Banknote, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Contrato, ContratoConsumoMensal } from '../types';

export default function ContratosModule() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [consumos, setConsumos] = useState<ContratoConsumoMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingPncp, setIsSyncingPncp] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [filterUf, setFilterUf] = useState("TODAS");
  
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

  const [consumoContratoId, setConsumoContratoId] = useState("");
  const [consumoMesAno, setConsumoMesAno] = useState("");
  const [consumoValor, setConsumoValor] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const allContratos: Contrato[] = await fetch(`/api/contratos`).then(r => r.json());
      setContratos(allContratos);

      const consumosList: ContratoConsumoMensal[] = [];
      for (const c of allContratos) {
        const cRes = await fetch(`/api/contratos/${encodeURIComponent(c.id)}/consumo`).then(r => r.json());
        if (Array.isArray(cRes)) {
          consumosList.push(...cRes);
        }
      }
      setConsumos(consumosList);
    } catch (err) {
      console.error("Erro ao carregar contratos gerais:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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
        setSyncMessage({ type: 'success', text: `Sincronização concluída! ${data.imported} novos contratos importados.` });
        loadData();
      } else {
        setSyncMessage({ type: 'error', text: "Falha na sincronização." });
      }
    } catch (err) {
      console.error(err);
      setSyncMessage({ type: 'error', text: "Erro ao conectar com serviço de integração." });
    } finally {
      setIsSyncingPncp(false);
      setTimeout(() => setSyncMessage(null), 5000);
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
      let res;
      const method = editingContractId ? "PUT" : "POST";
      const url = editingContractId ? `/api/contratos/${encodeURIComponent(editingContractId)}` : "/api/contratos";
      res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        loadData();
        setShowContractForm(false);
      } else {
        alert("Erro ao salvar contrato.");
      }
    } catch (err) {
      console.error(err);
    }
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
          loadData();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(consumoContratoId)}/consumo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes: consumoMesAno,
          valorConsumido: parseFloat(consumoValor)
        })
      });
      if (res.ok) {
        setConsumoContratoId("");
        setConsumoMesAno("");
        setConsumoValor("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConsumo = async (id: string, cid: string) => {
    if (window.confirm("Remover este registro de consumo?")) {
      try {
        await fetch(`/api/contratos/${encodeURIComponent(cid)}/consumo/${encodeURIComponent(id)}`, { method: "DELETE" });
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando Contratos Gerais...</p>
      </div>
    );
  }

  const contratosFiltrados = contratos.filter(c => {
    if (filterUf === "TODAS") return true;
    if (filterUf === "DF (SEDE)") return c.uf === "DF_SEDE" || c.uf === "DF";
    if (filterUf === "DF (SRTE)") return c.uf === "DF_SRTE";
    return c.uf === filterUf;
  });

  const contratosAtivos = contratosFiltrados.filter(c => c.status !== "Encerrado");
  const gastoMensalEstimado = contratosAtivos.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
  const gastoTotalGlobal = contratosAtivos.reduce((acc, c) => acc + (c.valorGlobal || 0), 0);

  return (
    <div className="space-y-6">
      {syncMessage && (
        <div className={`p-4 rounded-xl border ${syncMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <p className="text-sm font-bold flex items-center gap-2">
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {syncMessage.text}
          </p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1351b4]" />
            Painel de Contratos Gerais
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Gestão centralizada de todos os contratos e integrações com PNCP.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSyncPncp}
            disabled={isSyncingPncp}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingPncp ? "animate-spin" : ""}`} /> 
            {isSyncingPncp ? "Sincronizando..." : "Sincronizar PNCP"}
          </button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contratos Ativos</p>
            <p className="text-2xl font-black text-slate-800">{contratosAtivos.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Global Ativo</p>
            <p className="text-xl font-black text-slate-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(gastoTotalGlobal)}
            </p>
          </div>
        </div>
      </div>

      {/* LISTAGEM DE CONTRATOS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-3">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">Histórico Geral de Contratos Cadastrados</h3>
          
          <select 
            value={filterUf} 
            onChange={(e) => setFilterUf(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Todas as Regionais + Sede</option>
            <option value="DF (SEDE)">Sede Central (DF)</option>
            <option value="DF (SRTE)">Superintendência DF (SRTE)</option>
            <option value="AC">AC</option><option value="AL">AL</option><option value="AM">AM</option>
            <option value="AP">AP</option><option value="BA">BA</option><option value="CE">CE</option>
            <option value="ES">ES</option><option value="GO">GO</option><option value="MA">MA</option>
            <option value="MG">MG</option><option value="MS">MS</option><option value="MT">MT</option>
            <option value="PA">PA</option><option value="PB">PB</option><option value="PE">PE</option>
            <option value="PI">PI</option><option value="PR">PR</option><option value="RJ">RJ</option>
            <option value="RN">RN</option><option value="RO">RO</option><option value="RR">RR</option>
            <option value="RS">RS</option><option value="SC">SC</option><option value="SE">SE</option>
            <option value="SP">SP</option><option value="TO">TO</option>
          </select>
        </div>
        
        {contratosFiltrados.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-12 font-medium">Nenhum contrato cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-slate-800">
              <thead>
                <tr className="font-bold border-b border-[#002244]">
                  <th className="p-4 font-semibold hover:bg-[#002244] hover:text-white transition-colors cursor-pointer">Número</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] hover:text-white transition-colors cursor-pointer">UF/UASG</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] hover:text-white transition-colors cursor-pointer">Fornecedor</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] hover:text-white transition-colors cursor-pointer">Total</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] hover:text-white transition-colors cursor-pointer">Vigência</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] hover:text-white transition-colors cursor-pointer">Status</th>
                  <th className="p-4 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {contratosFiltrados.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 align-middle font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        {c.numeroContrato || 'N/A'}
                        {c.pncpId && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-md uppercase">PNCP</span>}
                      </div>
                      <div className="text-[10px] font-normal text-slate-500 mt-1 line-clamp-3 pr-2" title={c.objeto || ""}>{c.objeto || "-"}</div>
                    </td>
                    <td className="p-4 align-middle font-bold">
                      {c.uf === 'DF' || !c.uf ? (
                        <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded uppercase">DF (SEDE)</span>
                      ) : (
                        <span className="text-slate-700">{c.uf}</span>
                      )}
                      {c.uasg && (
                        <div className="text-[9px] text-slate-500 mt-1 uppercase font-semibold truncate max-w-[120px]" title={c.uasg}>
                          {c.uasg}
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-semibold text-slate-800">{c.empresa || '-'}</div>
                      <div className="text-[10px] text-slate-500">CNPJ: {c.cnpj || '-'}</div>
                    </td>
                    <td className="p-4 align-middle font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.valorGlobal || 0)}
                    </td>
                    <td className="p-4 align-middle text-xs">
                      <div className="flex items-center gap-1 text-slate-600"><Calendar className="w-3 h-3" /> Início: {c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : '-'}</div>
                      <div className="flex items-center gap-1 text-slate-600 mt-0.5"><Calendar className="w-3 h-3 text-amber-500" /> Fim: {c.dataFim ? new Date(c.dataFim).toLocaleDateString('pt-BR') : '-'}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        c.status === "Ativo" ? "bg-emerald-100 text-emerald-800" :
                        c.status === "Suspenso" ? "bg-amber-100 text-amber-800" :
                        "bg-rose-100 text-rose-800"
                      }`}>{c.status || 'Ativo'}</span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.linkPncp && (
                          <a href={c.linkPncp} target="_blank" rel="noopener noreferrer" className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Ver no PNCP">
                            <RefreshCw className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showContractForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <div>
                <h3 className="font-black text-slate-800 text-lg">{editingContractId ? "Editar Contrato" : "Novo Contrato"}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Preencha as informações gerais do contrato.</p>
              </div>
              <button onClick={() => setShowContractForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer">
                <Trash2 className="w-4 h-4" /> {/* Replacing with basic close visual via class/style or simply text */}
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
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
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
