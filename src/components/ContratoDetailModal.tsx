import React, { useState, useEffect, useCallback } from "react";
import { 
  X, Building2, Banknote, Calendar, FileText, UserCheck, 
  FileSpreadsheet, ExternalLink, Plus, Trash2, CheckCircle2, 
  AlertCircle, RefreshCw, Shield, ArrowUpRight, Download, Link2, ShieldAlert, History
} from "lucide-react";
import type { Contrato, ContratoConsumoMensal, ContratoArquivo } from "../types";

interface ContratoDetailModalProps {
  contractId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface DossieData {
  contrato: Contrato;
  fiscais: {
    id: string;
    contratoId: string;
    nome: string;
    cpf: string;
    tipo: string;
    portariaDesignacao: string;
    dataInicio: string;
    dataFim: string;
    status: string;
  }[];
  aditivos: {
    id: string;
    contratoId: string;
    numero: string;
    tipo: string;
    valorAdicionado: number;
    novaDataFim: string;
    justificativa: string;
    dataAssinatura: string;
  }[];
  empenhos: {
    id: string;
    contratoId: string;
    numeroEmpenho: string;
    valorEmpenhado: number;
    dataEmissao: string;
    ptres: string;
    fonteRecurso: string;
    indicadorEmenda?: boolean;
    situacao?: string;
  }[];
  consumos: ContratoConsumoMensal[];
  arquivos?: ContratoArquivo[];
  historico?: {
    id: string;
    evento: string;
    nome: string;
    dataHora: string;
    justificativa: string;
  }[];
}

export default function ContratoDetailModal({
  contractId,
  onClose,
  onUpdate
}: ContratoDetailModalProps) {
  const [data, setData] = useState<DossieData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"geral" | "fiscais" | "aditivos_empenhos" | "consumo" | "arquivos" | "historico">("geral");

  // Forms state
  const [showAddFiscal, setShowAddFiscal] = useState(false);
  const [fiscalNome, setFiscalNome] = useState("");
  const [fiscalCpf, setFiscalCpf] = useState("");
  const [fiscalTipo, setFiscalTipo] = useState("Fiscal Técnico");
  const [fiscalPortaria, setFiscalPortaria] = useState("");

  const [showAddAditivo, setShowAddAditivo] = useState(false);
  const [aditivoNumero, setAditivoNumero] = useState("");
  const [aditivoTipo, setAditivoTipo] = useState("Prorrogação de Vigência");
  const [aditivoValor, setAditivoValor] = useState("");
  const [aditivoNovaDataFim, setAditivoNovaDataFim] = useState("");
  const [aditivoJustificativa, setAditivoJustificativa] = useState("");

  const [showAddEmpenho, setShowAddEmpenho] = useState(false);
  const [empenhoNumero, setEmpenhoNumero] = useState("");
  const [empenhoValor, setEmpenhoValor] = useState("");
  const [empenhoData, setEmpenhoData] = useState("");
  const [empenhoPtres, setEmpenhoPtres] = useState("");

  const [showAddConsumo, setShowAddConsumo] = useState(false);
  const [consumoMes, setConsumoMes] = useState("");
  const [consumoValor, setConsumoValor] = useState("");

  const [showAddArquivo, setShowAddArquivo] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");
  const [arquivoTipo, setArquivoTipo] = useState("Contrato Assinado");
  const [arquivoUrl, setArquivoUrl] = useState("");

  const loadDossie = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(contractId)}/dossie`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error("Erro ao carregar dossiê:", err);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadDossie();
  }, [loadDossie]);

  const handleAddFiscal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(contractId)}/fiscais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: fiscalNome,
          cpf: fiscalCpf,
          tipo: fiscalTipo,
          portariaDesignacao: fiscalPortaria
        })
      });
      if (res.ok) {
        setFiscalNome("");
        setFiscalCpf("");
        setFiscalPortaria("");
        setShowAddFiscal(false);
        loadDossie();
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFiscal = async (id: string) => {
    if (window.confirm("Remover este fiscal?")) {
      try {
        await fetch(`/api/contratos/fiscais/${encodeURIComponent(id)}`, { method: "DELETE" });
        loadDossie();
        onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddAditivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(contractId)}/aditivos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: aditivoNumero,
          tipo: aditivoTipo,
          valorAdicionado: parseFloat(aditivoValor) || 0,
          novaDataFim: aditivoNovaDataFim,
          justificativa: aditivoJustificativa
        })
      });
      if (res.ok) {
        setAditivoNumero("");
        setAditivoValor("");
        setAditivoNovaDataFim("");
        setAditivoJustificativa("");
        setShowAddAditivo(false);
        loadDossie();
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAditivo = async (id: string) => {
    if (window.confirm("Remover este aditivo?")) {
      try {
        await fetch(`/api/contratos/aditivos/${encodeURIComponent(id)}`, { method: "DELETE" });
        loadDossie();
        onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddEmpenho = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(contractId)}/empenhos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numeroEmpenho: empenhoNumero,
          valorEmpenhado: parseFloat(empenhoValor) || 0,
          dataEmissao: empenhoData,
          ptres: empenhoPtres
        })
      });
      if (res.ok) {
        setEmpenhoNumero("");
        setEmpenhoValor("");
        setEmpenhoData("");
        setEmpenhoPtres("");
        setShowAddEmpenho(false);
        loadDossie();
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEmpenho = async (id: string) => {
    if (window.confirm("Remover este empenho?")) {
      try {
        await fetch(`/api/contratos/empenhos/${encodeURIComponent(id)}`, { method: "DELETE" });
        loadDossie();
        onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(contractId)}/consumo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes: consumoMes,
          valorConsumido: parseFloat(consumoValor) || 0
        })
      });
      if (res.ok) {
        setConsumoMes("");
        setConsumoValor("");
        setShowAddConsumo(false);
        loadDossie();
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConsumo = async (id: string) => {
    if (window.confirm("Remover este registro de consumo?")) {
      try {
        await fetch(`/api/contratos/consumo/${encodeURIComponent(id)}`, { method: "DELETE" });
        loadDossie();
        onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddArquivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/contratos/${encodeURIComponent(contractId)}/arquivos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeArquivo: arquivoNome,
          tipoDocumento: arquivoTipo,
          urlDownload: arquivoUrl,
          dataPublicacao: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setArquivoNome("");
        setArquivoUrl("");
        setShowAddArquivo(false);
        loadDossie();
        onUpdate();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArquivo = async (id: string) => {
    if (window.confirm("Remover este arquivo anexo?")) {
      try {
        await fetch(`/api/contratos/arquivos/${encodeURIComponent(id)}`, { method: "DELETE" });
        loadDossie();
        onUpdate();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#003366]" />
          <p className="text-sm font-semibold text-slate-700">Carregando dossiê do contrato...</p>
        </div>
      </div>
    );
  }

  const { contrato, fiscais, aditivos, empenhos, consumos, arquivos = [], historico = [] } = data;
  const totalConsumido = consumos.reduce((acc, c) => acc + (c.valorConsumido || 0), 0);
  const totalEmpenhado = empenhos.reduce((acc, e) => acc + (e.valorEmpenhado || 0), 0);

  const pctEmpenhado = contrato.valorGlobal ? Math.min(100, Math.round((totalEmpenhado / contrato.valorGlobal) * 100)) : 0;
  const pctConsumido = contrato.valorGlobal ? Math.min(100, Math.round((totalConsumido / contrato.valorGlobal) * 100)) : 0;

  const sancoesUrl = `https://portaldatransparencia.gov.br/sancoes/consulta?termo=${encodeURIComponent(contrato.cnpj || contrato.empresa || '')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabeçalho */}
        <div className="bg-[#003366] text-white p-5 flex items-start justify-between shrink-0">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-blue-500/30 text-blue-100 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Contrato {contrato.numeroContrato}
              </span>
              {contrato.pncpId && (
                <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase">
                  Integrado ao PNCP
                </span>
              )}
              {contrato.tipoFornecedor && (
                <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {contrato.tipoFornecedor}
                </span>
              )}
              {contrato.tipoContrato && (
                <span className="bg-slate-200/20 text-slate-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {contrato.tipoContrato}
                </span>
              )}
            </div>

            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              {contrato.empresa || 'Fornecedor Não Informado'}
            </h2>

            <div className="flex items-center gap-3 text-xs text-blue-200 flex-wrap">
              {contrato.cnpj && <span className="font-mono">CNPJ/CPF: {contrato.cnpj}</span>}
              {contrato.numeroProcesso && <span>Processo: <strong>{contrato.numeroProcesso}</strong></span>}

              {/* Botão de Consulta a Sanções */}
              <a
                href={sancoesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded text-[11px] font-bold transition"
                title="Consultar sanções e penalidades (CEIS, CNEP, TCU)"
              >
                <ShieldAlert size={12} />
                Consultar Sanções
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {contrato.linkPncp && (
              <a
                href={contrato.linkPncp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-xs font-bold flex items-center gap-1.5"
                title="Abrir página oficial do contrato no PNCP"
              >
                <ExternalLink size={14} />
                PNCP
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Abas Internas */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("geral")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === "geral"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Visão Geral & Valores
          </button>
          <button
            onClick={() => setActiveTab("fiscais")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "fiscais"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Fiscais ({fiscais.length})
          </button>
          <button
            onClick={() => setActiveTab("aditivos_empenhos")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "aditivos_empenhos"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Aditivos ({aditivos.length}) & Empenhos ({empenhos.length})
          </button>
          <button
            onClick={() => setActiveTab("consumo")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "consumo"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Consumo Mensal ({consumos.length})
          </button>
          <button
            onClick={() => setActiveTab("arquivos")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "arquivos"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Arquivos PNCP ({arquivos.length})
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "historico"
                ? "border-[#003366] text-[#003366]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <History size={13} />
            Histórico PNCP ({historico.length})
          </button>
        </div>

        {/* Conteúdo do Dossiê */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "geral" && (
            <div className="space-y-6">
              {/* Cards Financeiros Estruturados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Global do Contrato</p>
                  <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(contrato.valorGlobal || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Valor total contratado</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Mensal Estimado</p>
                  <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(contrato.valorMensal || 0)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Parcela mensal de referência</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Empenhado</p>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">{pctEmpenhado}%</span>
                  </div>
                  <p className="text-xl font-black text-blue-800 mt-1">{formatCurrency(totalEmpenhado)}</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pctEmpenhado}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Executado (Consumido)</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">{pctConsumido}%</span>
                  </div>
                  <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(totalConsumido)}</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${pctConsumido}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Informações Básicas & Metadados do PNCP */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                  Metadados e Informações Estruturadas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Objeto */}
                  <div>
                    <span className="font-bold text-slate-500 block mb-1">Objeto do Contrato:</span>
                    <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs leading-relaxed font-normal">
                      {contrato.objeto || "Não informado"}
                    </p>
                  </div>

                  {/* Detalhes do Processo & Locais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-500 block">Número do Processo:</span>
                      <span className="font-semibold text-slate-900">{contrato.numeroProcesso || '-'}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Categoria do Processo:</span>
                      <span className="font-semibold text-slate-900">{contrato.categoriaProcesso || '-'}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Tipo de Contrato:</span>
                      <span className="font-semibold text-slate-900">{contrato.tipoContrato || 'Contrato (termo inicial)'}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Natureza:</span>
                      <span className="font-semibold text-slate-900">{contrato.receitaDespesa || 'Despesa'}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Unidade Gestora / UASG:</span>
                      <span className="font-semibold text-slate-900">{contrato.uasg || '-'}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Localização:</span>
                      <span className="font-semibold text-slate-900">
                        {contrato.municipio ? `${contrato.municipio}/${contrato.uf}` : (contrato.uf === 'DF_SEDE' ? 'DF (Sede Central)' : contrato.uf === 'DF_SRTE' ? 'DF (Superintendência)' : contrato.uf || '-')}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Data Assinatura:</span>
                      <span className="font-semibold text-slate-900">{formatDate(contrato.dataAssinatura)}</span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Vigência:</span>
                      <span className="font-semibold text-slate-900">
                        {formatDate(contrato.dataInicio)} até {formatDate(contrato.dataFim)}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-500 block">Divulgação no PNCP:</span>
                      <span className="font-semibold text-slate-900">{formatDate(contrato.dataDivulgacaoPncp)}</span>
                    </div>
                  </div>
                </div>

                {/* Badges de Regra Orçamentária & Licitação de Origem */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    contrato.frutoAdesao ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Fruto de Adesão (Carona): {contrato.frutoAdesao ? 'SIM' : 'NÃO'}
                  </span>

                  <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase ${
                    contrato.temRemanejamento ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    Remanejamento: {contrato.temRemanejamento ? 'SIM' : 'NÃO'}
                  </span>

                  {contrato.fonteDados && (
                    <span className="px-2.5 py-1 rounded-md font-bold text-[10px] uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Fonte: {contrato.fonteDados}
                    </span>
                  )}

                  {contrato.pncpContratacaoId && (
                    <a
                      href={`https://pncp.gov.br/app/editais/${contrato.pncpContratacaoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md font-bold text-[10px] uppercase bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition flex items-center gap-1"
                    >
                      <Link2 size={12} />
                      Licitação de Origem (PNCP)
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FISCAIS */}
          {activeTab === "fiscais" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Equipe de Fiscalização e Gestão</h3>
                <button
                  onClick={() => setShowAddFiscal(!showAddFiscal)}
                  className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  Adicionar Fiscal
                </button>
              </div>

              {showAddFiscal && (
                <form onSubmit={handleAddFiscal} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input type="text" required value={fiscalNome} onChange={e => setFiscalNome(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800" placeholder="Nome do servidor..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">CPF</label>
                      <input type="text" value={fiscalCpf} onChange={e => setFiscalCpf(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800" placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Papel / Tipo</label>
                      <select value={fiscalTipo} onChange={e => setFiscalTipo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800">
                        <option value="Gestor do Contrato">Gestor do Contrato</option>
                        <option value="Fiscal Técnico">Fiscal Técnico</option>
                        <option value="Fiscal Administrativo">Fiscal Administrativo</option>
                        <option value="Fiscal Setorial">Fiscal Setorial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Portaria de Designação</label>
                      <input type="text" value={fiscalPortaria} onChange={e => setFiscalPortaria(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800" placeholder="Ex: Portaria MTE nº 123/2024" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddFiscal(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs">Salvar Fiscal</button>
                  </div>
                </form>
              )}

              {fiscais.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum fiscal designado para este contrato.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {fiscais.map(f => (
                    <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                          {f.tipo}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-1">{f.nome}</h4>
                        {f.cpf && <p className="text-[10px] text-slate-500">CPF: {f.cpf}</p>}
                        {f.portariaDesignacao && (
                          <p className="text-[10px] text-slate-500 font-medium">Portaria: {f.portariaDesignacao}</p>
                        )}
                      </div>
                      <button onClick={() => handleDeleteFiscal(f.id)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADITIVOS & EMPENHOS */}
          {activeTab === "aditivos_empenhos" && (
            <div className="space-y-6">
              {/* Aditivos */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Termos Aditivos ({aditivos.length})</h3>
                  <button
                    onClick={() => setShowAddAditivo(!showAddAditivo)}
                    className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    Novo Aditivo
                  </button>
                </div>

                {showAddAditivo && (
                  <form onSubmit={handleAddAditivo} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número do Aditivo</label>
                        <input type="text" required value={aditivoNumero} onChange={e => setAditivoNumero(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="1º TA" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</label>
                        <input type="text" value={aditivoTipo} onChange={e => setAditivoTipo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="Prorrogação / Valor" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Adicionado (R$)</label>
                        <input type="number" step="0.01" value={aditivoValor} onChange={e => setAditivoValor(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddAditivo(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                      <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Salvar Aditivo</button>
                    </div>
                  </form>
                )}

                {aditivos.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhum termo aditivo registrado.</p>
                ) : (
                  <div className="space-y-2">
                    {aditivos.map(a => (
                      <div key={a.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{a.numero}</span> &mdash; <span className="text-slate-600">{a.tipo}</span>
                          {a.valorAdicionado > 0 && <span className="ml-2 font-bold text-emerald-700">+{formatCurrency(a.valorAdicionado)}</span>}
                        </div>
                        <button onClick={() => handleDeleteAditivo(a.id)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Empenhos (Tabela Estilo PNCP) */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Notas de Empenho ({empenhos.length}) &mdash; Total: {formatCurrency(totalEmpenhado)}</h3>
                  <button
                    onClick={() => setShowAddEmpenho(!showAddEmpenho)}
                    className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    Novo Empenho
                  </button>
                </div>

                {showAddEmpenho && (
                  <form onSubmit={handleAddEmpenho} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número do Empenho</label>
                        <input type="text" required value={empenhoNumero} onChange={e => setEmpenhoNumero(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="2026NE000123" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Empenhado (R$)</label>
                        <input type="number" step="0.01" required value={empenhoValor} onChange={e => setEmpenhoValor(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="0.00" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data Emissão</label>
                        <input type="date" value={empenhoData} onChange={e => setEmpenhoData(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddEmpenho(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                      <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Salvar Empenho</button>
                    </div>
                  </form>
                )}

                {empenhos.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhum empenho cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                          <th className="p-2.5 text-center">Seq.</th>
                          <th className="p-2.5">Número do Empenho</th>
                          <th className="p-2.5">Valor Total</th>
                          <th className="p-2.5 text-center">Emenda</th>
                          <th className="p-2.5">Data de Emissão</th>
                          <th className="p-2.5">Plano Interno (PTRES)</th>
                          <th className="p-2.5">Situação</th>
                          <th className="p-2.5 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {empenhos.map((e, idx) => (
                          <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-2.5 text-center text-slate-500 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-blue-900 font-mono">{e.numeroEmpenho}</td>
                            <td className="p-2.5 font-bold text-emerald-700">{formatCurrency(e.valorEmpenhado)}</td>
                            <td className="p-2.5 text-center">
                              {e.indicadorEmenda ? (
                                <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold">SIM</span>
                              ) : (
                                <span className="text-slate-400">Não</span>
                              )}
                            </td>
                            <td className="p-2.5 text-slate-700">{formatDate(e.dataEmissao)}</td>
                            <td className="p-2.5 text-slate-600 font-mono text-[11px]">{e.ptres || "-"}</td>
                            <td className="p-2.5">
                              <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {e.situacao || "Empenhado"}
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button onClick={() => handleDeleteEmpenho(e.id)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CONSUMO MENSAL */}
          {activeTab === "consumo" && (
            <div className="space-y-4">
              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-blue-950 block text-sm">Valor Mensal Estimado de Referência</span>
                  <span className="text-slate-600 mt-0.5 block">
                    Calculado contratualmente com base no valor global vigente (Valor Global ÷ 12).
                  </span>
                </div>
                <span className="text-base font-black text-[#003366] bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs shrink-0">
                  {formatCurrency(contrato.valorMensal || 0)} /mês
                </span>
              </div>

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Histórico de Execução Financeira (Faturamento Real)</h3>
                <button
                  onClick={() => setShowAddConsumo(!showAddConsumo)}
                  className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  Registrar Consumo
                </button>
              </div>

              {showAddConsumo && (
                <form onSubmit={handleAddConsumo} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mês / Ano</label>
                      <input type="text" required value={consumoMes} onChange={e => setConsumoMes(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="Ex: 01/2024 ou Jan/2024" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Executado (R$)</label>
                      <input type="number" step="0.01" required value={consumoValor} onChange={e => setConsumoValor(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddConsumo(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Salvar Consumo</button>
                  </div>
                </form>
              )}

              {consumos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum consumo mensal cadastrado.</p>
              ) : (
                <div className="space-y-2">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="p-2.5">Mês / Competência</th>
                        <th className="p-2.5">Valor Executado</th>
                        <th className="p-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consumos.map(c => (
                        <tr key={c.id}>
                          <td className="p-2.5 font-bold text-slate-800">{c.mes}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{formatCurrency(c.valorConsumido)}</td>
                          <td className="p-2.5 text-right">
                            <button onClick={() => handleDeleteConsumo(c.id)} className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ARQUIVOS (PNCP) */}
          {activeTab === "arquivos" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Documentos e Anexos Publicados ({arquivos.length})</h3>
                <button
                  onClick={() => setShowAddArquivo(!showAddArquivo)}
                  className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  Adicionar Anexo
                </button>
              </div>

              {showAddArquivo && (
                <form onSubmit={handleAddArquivo} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título do Documento</label>
                      <input type="text" required value={arquivoNome} onChange={e => setArquivoNome(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="Ex: Contrato Assinado.pdf" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Documento</label>
                      <input type="text" value={arquivoTipo} onChange={e => setArquivoTipo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="Termo Aditivo / Edital" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">URL de Download</label>
                      <input type="text" value={arquivoUrl} onChange={e => setArquivoUrl(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs" placeholder="https://..." />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddArquivo(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">Cancelar</button>
                    <button type="submit" className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Salvar Anexo</button>
                  </div>
                </form>
              )}

              {arquivos.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Nenhum documento ou PDF anexado ao contrato no momento.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {arquivos.map(arq => (
                    <div key={arq.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 hover:border-slate-300 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 truncate" title={arq.nomeArquivo}>
                            {arq.nomeArquivo}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-semibold text-slate-600">{arq.tipoDocumento || 'Documento'}</span>
                            {arq.dataPublicacao && <span>Publicado em: {formatDate(arq.dataPublicacao)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {arq.urlDownload && (
                          <a
                            href={arq.urlDownload}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                          >
                            <Download size={13} />
                            Download PDF
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteArquivo(arq.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remover anexo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HISTÓRICO OFICIAL (PNCP) */}
          {activeTab === "historico" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Trilha de Eventos e Auditoria Oficial (PNCP)</h3>

              {historico.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Nenhum evento registrado no histórico do PNCP para este contrato.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                        <th className="p-2.5">Evento</th>
                        <th className="p-2.5">Nome / Sistema</th>
                        <th className="p-2.5">Data/Hora do Evento</th>
                        <th className="p-2.5">Justificativa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {historico.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-2.5 font-bold text-blue-950">{item.evento}</td>
                          <td className="p-2.5 text-slate-700">{item.nome}</td>
                          <td className="p-2.5 text-slate-600 font-mono text-[11px]">{formatDate(item.dataHora)}</td>
                          <td className="p-2.5 text-slate-500">{item.justificativa}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
