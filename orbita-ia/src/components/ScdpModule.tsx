import React, { useState, useEffect, useMemo } from "react";
import {
  Plane,
  Calendar,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  User,
  ArrowRightLeft,
  Eye,
  EyeOff,
  Sliders,
  HelpCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  ShieldAlert,
  Building,
  Check,
  XCircle,
  X
} from "lucide-react";
import * as XLSX from "xlsx";

interface ViagemData {
  id: number;
  numeroViagem: string;
  cpfViajante: string;
  nomeViajante: string;
  dataInicio: string; // dd/mm/yyyy
  dataFim: string; // dd/mm/yyyy
  dataPrestacaoContas: string | null;
  origem: string;
  destino: string;
  trecho: string;
  valorTotal: number;
  valorPassagens: number;
  valorOutros: number;
  valorDiarias: number;
  valorDevolucao: number;
  valorRecebido: number;
  statusPrestacao: string;
  
  // Enriched fields
  lotacao: string;
  situacaoVinculo: string;
  inconsistenciaVinculo: boolean;
  siafiConfirmado: boolean;
  siafiScdpDivergencia: boolean;
  siafiEmpenhoNumero: string;
  siafiOrdemBancariaNumero: string;
  siafiGruDevolucaoConfirmada: boolean | null;
  siafiDetalhesStatus: string;
  sobreposicaoFerias: boolean;
  sobreposicaoLicenca: boolean;
  periodoSobreposicao: string;
  siapeViajante?: string;
  emailViajante?: string;
  motivoViagem?: string;
}

export default function ScdpModule() {
  // Local storage keys
  const STORAGE_KEY = "orbita_scdp_api_key";

  // Filter States
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Dates defaults: last 30 days (due to CGU API 1-month range limit)
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [maxPages, setMaxPages] = useState(500);

  // Tab State: "geral" | "siafi" | "malha" | "agenda"
  const [activeSubTab, setActiveSubTab] = useState<"geral" | "siafi" | "malha" | "agenda">("geral");

  // Data & loading states
  const [viagens, setViagens] = useState<ViagemData[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Accordion state (expanded viagem IDs)
  const [expandedViagemIds, setExpandedViagemIds] = useState<Record<number, boolean>>({});
  const [dossieItem, setDossieItem] = useState<ViagemData | null>(null);

  // Fetch function
  const handleFetchData = async (forceApiKey?: string, forceRefresh?: boolean) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const activeKey = forceApiKey !== undefined ? forceApiKey : apiKey;

    // Format dates from YYYY-MM-DD to DD/MM/YYYY for endpoint
    const formatDate = (isoDate: string) => {
      if (!isoDate) return "";
      const parts = isoDate.split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const dataIdaDe = formatDate(dateStart);
    const dataIdaAte = formatDate(dateEnd);

    try {
      const headers: Record<string, string> = {};
      if (activeKey.trim()) {
        headers["chave-api-dados"] = activeKey.trim();
      }

      const queryParams = new URLSearchParams({
        dataIdaDe,
        dataIdaAte,
        maxPages: String(maxPages)
      });
      if (forceRefresh) {
        queryParams.append("forceRefresh", "true");
      }

      const response = await fetch(`/api/scdp/viagens?${queryParams.toString()}`, {
        method: "GET",
        headers
      });

      const result = await response.json();

      if (response.status === 401) {
        setErrorMessage(result.error || "Chave API inválida ou expirada.");
        setIsSimulated(true);
      } else if (!response.ok) {
        setErrorMessage(result.error || `Erro de conexão com o servidor (HTTP ${response.status})`);
        setIsSimulated(true);
      } else {
        setViagens(result.data || []);
        setIsSimulated(!!result.isSimulated);
        if (result.warning) {
          setErrorMessage(result.warning);
        } else {
          setSuccessMessage(
            result.isSimulated
              ? "Modo Demonstração: Exibindo dados simulados de auditoria cruzada. Insira a Chave API no painel para carregar os dados reais."
              : (result.info || `Sincronização concluída com sucesso! ${result.data?.length || 0} viagens carregadas.`)
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Erro de rede ao conectar ao servidor.");
      setIsSimulated(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    handleFetchData();
  }, []);

  // Save API key to local storage
  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (val.trim()) {
      localStorage.setItem(STORAGE_KEY, val.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Toggle Accordion Details
  const toggleAccordion = (id: number) => {
    setExpandedViagemIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Process filters
  const filteredViagens = useMemo(() => {
    return viagens.filter((v) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        v.nomeViajante.toLowerCase().includes(term) ||
        v.cpfViajante.toLowerCase().includes(term) ||
        v.destino.toLowerCase().includes(term) ||
        v.lotacao.toLowerCase().includes(term) ||
        (v.numeroViagem && v.numeroViagem.toLowerCase().includes(term));

      const matchesStatus = statusFilter === "TODOS" || v.statusPrestacao === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [viagens, searchTerm, statusFilter]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalCount = filteredViagens.length;
    const totalGasto = filteredViagens.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const totalDiarias = filteredViagens.reduce((acc, v) => acc + (v.valorDiarias || 0), 0);
    const totalPassagens = filteredViagens.reduce((acc, v) => acc + (v.valorPassagens || 0), 0);
    const totalDevolvido = filteredViagens.reduce((acc, v) => acc + (v.valorDevolucao || 0), 0);
    const totalRecebido = filteredViagens.reduce((acc, v) => acc + (v.valorRecebido || 0), 0);

    // SIAFI and Server discrepancies
    const siafiDivergences = filteredViagens.filter(v => v.siafiScdpDivergencia).length;
    const vinculoInconsistencies = filteredViagens.filter(v => v.inconsistenciaVinculo).length;
    const agendaOverlaps = filteredViagens.filter(v => v.sobreposicaoFerias || v.sobreposicaoLicenca).length;
    const delayedAccounts = filteredViagens.filter(v => v.statusPrestacao.includes("Atrasado")).length;

    return {
      totalCount,
      totalGasto,
      totalDiarias,
      totalPassagens,
      totalDevolvido,
      totalRecebido,
      siafiDivergences,
      vinculoInconsistencies,
      agendaOverlaps,
      delayedAccounts
    };
  }, [filteredViagens]);

  // Aggregate rankings (Top 10 users & Top 10 routes)
  const rankings = useMemo(() => {
    const userMap: Record<string, { name: string; cpf: string; value: number }> = {};
    const routeMap: Record<string, number> = {};

    filteredViagens.forEach((v) => {
      const uKey = `${v.nomeViajante}-${v.cpfViajante}`;
      if (!userMap[uKey]) {
        userMap[uKey] = { name: v.nomeViajante, cpf: v.cpfViajante, value: 0 };
      }
      userMap[uKey].value += v.valorRecebido || 0;

      const rKey = v.trecho;
      routeMap[rKey] = (routeMap[rKey] || 0) + 1;
    });

    const topUsers = Object.values(userMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topRoutes = Object.entries(routeMap)
      .map(([trecho, count]) => ({ trecho, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { topUsers, topRoutes };
  }, [filteredViagens]);

  // Currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  // Quick Action Email generator (mailto:)
  const triggerNotificationMail = (viagem: ViagemData) => {
    const emailSubject = `NOTIFICAÇÃO: Regularização de Prestação de Contas SCDP (Viagem nº ${viagem.numeroViagem})`;
    
    const emailBody = `Prezado(a) ${viagem.nomeViajante},\n\n` +
      `Identificamos no Sistema de Monitoramento Órbita-AECI que a prestação de contas da viagem a serviço nº ${viagem.numeroViagem} está classificada como pendente ou fora do prazo regulamentar.\n\n` +
      `Dados do Registro:\n` +
      `- Trecho: ${viagem.trecho}\n` +
      `- Período da Viagem: ${viagem.dataInicio} a ${viagem.dataFim}\n` +
      `- Valor Total da Viagem: ${formatCurrency(viagem.valorTotal)}\n\n` +
      `Dispositivo Legal (Decreto nº 5.992/2006):\n` +
      `Conforme o art. 6º do Decreto nº 5.992/2006, o servidor é obrigado a apresentar prestação de contas de diárias e passagens no prazo máximo de 5 (cinco) dias corridos a contar do término do afastamento.\n\n` +
      `Solicitamos a regularização imediata da documentação comprobatória e do recolhimento de eventuais devoluções de valores devidos via GRU (Guia de Recolhimento da União), informando esta Assessoria Especial de Controle Interno.\n\n` +
      `Atenciosamente,\n` +
      `Assessoria Especial de Controle Interno - AECI\n` +
      `Ministério do Trabalho e Emprego - MTE`;

    const mailtoUrl = `mailto:${viagem.emailViajante || (viagem.nomeViajante.toLowerCase().replace(/ /g, ".") + "@trabalho.gov.br")}` +
      `?subject=${encodeURIComponent(emailSubject)}` +
      `&body=${encodeURIComponent(emailBody)}`;

    window.open(mailtoUrl, "_blank");
  };

  // Export to Excel using SheetJS
  const exportToExcel = (dataToExport: ViagemData[], filename: string) => {
    const preparedData = dataToExport.map((v) => ({
      "Nº Viagem": v.numeroViagem,
      "Servidor": v.nomeViajante,
      "CPF": v.cpfViajante,
      "Lotação": v.lotacao,
      "Vínculo MTE": v.situacaoVinculo,
      "Trecho": v.trecho,
      "Data Início": v.dataInicio,
      "Data Fim": v.dataFim,
      "Data Prestação": v.dataPrestacaoContas || "Pendente",
      "Status Prestação": v.statusPrestacao,
      "Diárias (R$)": v.valorDiarias,
      "Passagens (R$)": v.valorPassagens,
      "Total (R$)": v.valorTotal,
      "Devolução (R$)": v.valorDevolucao,
      "Recebido Líquido (R$)": v.valorRecebido,
      "SIAFI Empenho": v.siafiEmpenhoNumero,
      "SIAFI Ordem Bancária": v.siafiOrdemBancariaNumero,
      "SIAFI Status": v.siafiDetalhesStatus,
      "Conciliação SIAFI": v.siafiConfirmado ? "Conciliado" : "Divergente",
      "Sobreposição de Férias": v.sobreposicaoFerias ? "Sim" : "Não",
      "Sobreposição de Licença": v.sobreposicaoLicenca ? "Sim" : "Não",
      "Período Sobreposição": v.periodoSobreposicao || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(preparedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Viagens SCDP");

    // Auto-fit column widths
    const max_len = preparedData.reduce((acc, row) => {
      Object.keys(row).forEach((key, col_idx) => {
        const val = String((row as any)[key] || "");
        acc[col_idx] = Math.max(acc[col_idx] || 0, val.length, key.length);
      });
      return acc;
    }, [] as number[]);
    worksheet["!cols"] = max_len.map(len => ({ wch: len + 3 }));

    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Inadimplentes filtered list (delayed accounts, inconsistent relationship, or pending GRU returns!)
  const inadimplentesList = useMemo(() => {
    return viagens.filter(v => 
      v.statusPrestacao.includes("Atrasado") || 
      v.inconsistenciaVinculo ||
      (v.valorDevolucao > 0 && v.siafiGruDevolucaoConfirmada === false)
    );
  }, [viagens]);

  // Agenda overlap filtered list
  const overlapList = useMemo(() => {
    return viagens.filter(v => v.sobreposicaoFerias || v.sobreposicaoLicenca);
  }, [viagens]);

  // SIAFI conciliation list
  const siafiList = useMemo(() => {
    return viagens; // show all for financial checks
  }, [viagens]);

  return (
    <div className="space-y-6 font-sans select-all-normal text-slate-800">
      {/* 1. Header Oficial Gov.br */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print border-b border-slate-100 pb-4 border-dashed">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">MTE • AUDITORIA INTERNA</span>
          <h2 className="text-2xl font-black text-[#003366] font-display flex items-center gap-2 mt-0.5">
            <Plane className="w-6 h-6 transform -rotate-45" />
            Diárias e Passagens — SCDP
          </h2>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Monitoramento preventivo em conformidade com o <strong>Decreto nº 5.992/2006</strong> e cruzamento financeiro com o <strong>SIAFI</strong>.
          </p>
        </div>

        {/* Sub-tabs Navigation Gov.br Standard */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1 select-none">
          {[
            { id: "geral", label: "Visão Geral" },
            { id: "siafi", label: "Conciliação SIAFI" },
            { id: "malha", label: "Inadimplência" },
            { id: "agenda", label: "Sobreposição" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition duration-200 cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-[#003366] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Config & API Filter Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden no-print">
        <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Sliders className="w-4 h-4" /> Painel de Configurações e Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* API Key */}
          <div className="flex flex-col md:col-span-2">
            <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider mb-1 block">
              Chave API Portal da Transparência (CGU)
            </label>
            <div className="relative flex rounded-lg">
              <input
                type={showApiKey ? "text" : "password"}
                className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition"
                placeholder="Insira seu Token de Dados da Transparência..."
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Date Picker Start */}
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider mb-1 block">
              Data de Ida (De)
            </label>
            <input
              type="date"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#003366] focus:bg-white"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>

          {/* Date Picker End */}
          <div className="flex flex-col">
            <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider mb-1 block">
              Data de Ida (Até)
            </label>
            <input
              type="date"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#003366] focus:bg-white"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-[10px] font-medium text-slate-400">Órgão Superior Fixado: Ministério do Trabalho e Emprego (38000)</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleFetchData()}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#003366] hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition duration-200 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              {isLoading ? "Buscando..." : "Buscar Auditoria"}
            </button>

            <button
              onClick={() => handleFetchData(undefined, true)}
              disabled={isLoading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition duration-200 cursor-pointer"
              title="Sincronizar dados em tempo real com a API da CGU"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Sincronizar CGU
            </button>
          </div>
        </div>
      </div>

      {/* Warning/Banners */}
      {errorMessage && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in no-print">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSimulated && !errorMessage && (
        <div className="p-4 bg-blue-50 border border-blue-150 text-blue-900 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-fade-in no-print">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block uppercase tracking-wider text-[10px] text-blue-800">Modelo Integrado (Simulação de Alta Fidelidade)</span>
            <p className="font-normal text-[11px] leading-relaxed text-blue-750">
              Mostrando dados consolidados para auditoria (<strong>SCDP + Portal Transparência + SIAFI</strong>). Para usar chaves reais, adicione seu token no painel superior.
            </p>
          </div>
        </div>
      )}

      {successMessage && !isSimulated && (
        <div className="flex flex-col gap-2 p-4 bg-emerald-550/10 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-semibold animate-fade-in no-print">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <div className="text-[10px] text-slate-550 font-normal pl-7 border-t border-emerald-250/20 pt-2 mt-1 leading-relaxed">
            <strong>Informação de Auditoria:</strong> Os dados de trecho (Origem e Destino) não constam diretamente na listagem simplificada da API da CGU (a integração com essa fonte complementar ocorrerá em etapa futura). O sistema faz o batimento automático de valores a devolver identificados no SIAFI e lista os proponentes inadimplentes diretamente na aba correspondente.
          </div>
        </div>
      )}

      {/* 3. Cards de KPIs (Strict UI Gov.br Rule: Direct, No Subtitles/Deltas, No Percents) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Viagens Auditadas", value: metrics.totalCount.toString(), color: "text-[#003366]" },
          { label: "Despesa Total", value: formatCurrency(metrics.totalGasto), color: "text-[#003366]" },
          { label: "Divergências SIAFI", value: metrics.siafiDivergences.toString(), color: metrics.siafiDivergences > 0 ? "text-rose-600" : "text-emerald-700" },
          { label: "Alertas Inadimplência", value: metrics.delayedAccounts.toString(), color: metrics.delayedAccounts > 0 ? "text-rose-600" : "text-slate-800" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-center transition hover:shadow-2xs">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">
              {kpi.label}
            </span>
            <span className={`text-xl font-black tracking-tight leading-none ${kpi.color}`}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* 4. Sub-tab Content Rendering */}

      {/* TAB A: VISÃO GERAL */}
      {activeSubTab === "geral" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider">
                  Listagem Consolidada de Viagens
                </h3>
              </div>
              <button
                onClick={() => exportToExcel(filteredViagens, "Auditoria_Geral_SCDP")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer flex items-center gap-1.5 no-print"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Exportar Geral (.xlsx)
              </button>
            </div>

            {/* Search filter inside tab */}
            <div className="flex flex-wrap gap-2 mb-4 justify-between items-center">
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#003366] focus:bg-white"
                  placeholder="Pesquisar por Servidor, CPF, Destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              </div>
              
              <div className="flex gap-2">
                {["TODOS", "No Prazo", "Em Aberto - Atrasado", "Fora do Prazo (Prestado)"].map((stFilter) => (
                  <button
                    key={stFilter}
                    onClick={() => setStatusFilter(stFilter)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                      statusFilter === stFilter
                        ? "bg-[#003366] text-white"
                        : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {stFilter === "TODOS" ? "Todos Status" : stFilter}
                  </button>
                ))}
              </div>
            </div>

            {/* Table layout (Strict Gov.br Rule: Combined information cell) */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-3">Servidor Viajante</th>
                    <th className="p-3">Detalhamento Viagem</th>
                    <th className="p-3">Período Ida/Volta</th>
                    <th className="p-3 text-right">Valores</th>
                    <th className="p-3">Prestação de Contas</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredViagens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        Nenhum registro encontrado nos filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredViagens.slice(0, 50).map((v) => {
                      const isExpanded = !!expandedViagemIds[v.id];
                      let statusBg = "bg-slate-50 text-slate-600";
                      if (v.statusPrestacao === "No Prazo") statusBg = "bg-emerald-50 text-emerald-800 border border-emerald-100";
                      else if (v.statusPrestacao === "Em Aberto - No Prazo") statusBg = "bg-sky-50 text-sky-800 border border-sky-100";
                      else if (v.statusPrestacao === "Em Aberto - Atrasado") statusBg = "bg-rose-50 text-rose-800 border border-rose-100";
                      else if (v.statusPrestacao === "Fora do Prazo (Prestado)") statusBg = "bg-amber-50 text-amber-800 border border-amber-100";

                      return (
                        <React.Fragment key={v.id}>
                          <tr className="hover:bg-slate-50/50 transition">
                            {/* Combined cell 1: Servidor Name, CPF, Lotação */}
                            <td className="p-3">
                              <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                                <span>{v.cpfViajante}</span>
                                <span>•</span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm font-semibold text-[8px] max-w-[150px] truncate block" title={v.lotacao}>{v.lotacao}</span>
                              </div>
                            </td>

                            {/* Combined cell 2: Trecho + Número Viagem */}
                            <td className="p-3">
                              <div className="font-semibold text-slate-700">{v.trecho}</div>
                              <span className="text-[10px] font-mono text-slate-400 mt-1 block">Nº SCDP: {v.numeroViagem || "-"}</span>
                            </td>

                            <td className="p-3 text-slate-600 font-medium font-mono">
                              {v.dataInicio} ➔ {v.dataFim}
                            </td>

                            {/* Combined cell 3: Total value + breakdown */}
                            <td className="p-3 text-right">
                              <div className="font-extrabold text-[#003366]">{formatCurrency(v.valorTotal)}</div>
                              <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Diárias: {formatCurrency(v.valorDiarias)}</span>
                              {v.valorDevolucao > 0 && (
                                <span className={`text-[9px] font-black block mt-0.5 ${v.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                                  Devolução: {formatCurrency(v.valorDevolucao)} ({v.siafiGruDevolucaoConfirmada ? "SIAFI OK" : "Pendente"})
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block ${statusBg}`}>
                                {v.statusPrestacao}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono block mt-1">
                                {v.dataPrestacaoContas ? `Entregue em: ${v.dataPrestacaoContas}` : "Pendente de Envio"}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setDossieItem(v)}
                                  className="p-1 text-slate-500 hover:text-[#003366] hover:bg-blue-50 rounded transition cursor-pointer"
                                  title="Visualizar Dossiê Completo"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleAccordion(v.id)}
                                  className="p-1 text-slate-500 hover:text-[#003366] hover:bg-blue-50 rounded transition cursor-pointer"
                                  title="Expandir Detalhes"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                                {v.statusPrestacao.includes("Atrasado") && (
                                  <button
                                    onClick={() => triggerNotificationMail(v)}
                                    className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Notificar Servidor (Decreto 5.992/06)"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Accordion Expandible item */}
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={6} className="p-4 border-l-2 border-l-[#003366]">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                  {/* SIAFI Check */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs space-y-2">
                                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed">
                                      <span className="font-black text-[#003366] uppercase text-[10px]">Conciliação SIAFI</span>
                                      {v.siafiConfirmado ? (
                                        <span className="text-emerald-700 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> Conciliado</span>
                                      ) : (
                                        <span className="text-rose-600 font-bold flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Divergente</span>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex justify-between"><span className="text-slate-400">Nota Empenho (NE):</span> <span className="font-mono font-semibold">{v.siafiEmpenhoNumero}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400">Ordem Bancária (OB):</span> <span className="font-mono font-semibold">{v.siafiOrdemBancariaNumero}</span></div>
                                      {v.valorDevolucao > 0 && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-400">Devolução GRU:</span> 
                                          <span className={`font-semibold ${v.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                                            {v.siafiGruDevolucaoConfirmada ? "Recolhida e Confirmada" : "Pendente de Confirmação"}
                                          </span>
                                        </div>
                                      )}
                                      <div className="pt-1.5 text-[10px] text-slate-500 font-medium">Status: {v.siafiDetalhesStatus}</div>
                                    </div>
                                  </div>

                                  {/* Servidor Validation */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs space-y-2">
                                    <span className="font-black text-[#003366] uppercase text-[10px] border-b pb-1.5 border-dashed block">Validação de Vínculo MTE</span>
                                    <div className="space-y-1">
                                      <div className="flex justify-between"><span className="text-slate-400">Situação Funcional:</span> <span className="font-semibold text-slate-700">{v.situacaoVinculo}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400">Lotação Exercício:</span> <span className="font-semibold text-slate-750 text-[10px] truncate max-w-[150px]" title={v.lotacao}>{v.lotacao}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400">Matrícula SIAPE:</span> <span className="font-mono font-bold text-[#003366]">{v.siapeViajante || "—"}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-400">E-mail:</span> <span className="font-semibold text-slate-700">{v.emailViajante || "—"}</span></div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Validação Cadastral:</span> 
                                        <span className={`font-bold ${v.inconsistenciaVinculo ? "text-rose-600" : "text-emerald-700"}`}>
                                          {v.inconsistenciaVinculo ? "Inconsistente (Sem Vínculo)" : "Vínculo Regularizado"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Agenda and Vacation Overlap */}
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-3xs space-y-2">
                                    <span className="font-black text-[#003366] uppercase text-[10px] border-b pb-1.5 border-dashed block">Cruzamento de Agendas</span>
                                    <div className="space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Sobreposição de Férias:</span> 
                                        <span className={`font-semibold ${v.sobreposicaoFerias ? "text-amber-700" : "text-emerald-700"}`}>
                                          {v.sobreposicaoFerias ? "Férias Ativas no Período" : "Sem Férias no Período"}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Sobreposição de Licença:</span> 
                                        <span className={`font-semibold ${v.sobreposicaoLicenca ? "text-rose-600" : "text-emerald-700"}`}>
                                          {v.sobreposicaoLicenca ? "Licença Ativa no Período" : "Sem Licenças Ativas"}
                                        </span>
                                      </div>
                                      {v.periodoSobreposicao && (
                                        <div className="mt-1 text-[10px] bg-amber-50 text-amber-800 p-1.5 rounded-md font-medium">
                                          Período Conflitante: {v.periodoSobreposicao}
                                        </div>
                                      )}
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
            {filteredViagens.length > 50 && (
              <p className="text-[10px] text-slate-450 text-center mt-3">
                Mostrando as primeiras 50 de {filteredViagens.length} viagens. Use o filtro de pesquisa para restringir.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB B: CONCILIAÇÃO SIAFI */}
      {activeSubTab === "siafi" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider">
                  Painel de Auditoria e Conciliação Financeira (SCDP x SIAFI)
                </h3>
              </div>
              <button
                onClick={() => exportToExcel(siafiList, "Conciliacao_SIAFI_SCDP")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer flex items-center gap-1.5 no-print"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Exportar Conciliação (.xlsx)
              </button>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-4 rounded-xl text-xs font-medium text-amber-900 mb-6">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <p>
                O sistema realiza batimentos automáticos do valor liquidado no SIAFI com o valor de diárias autorizadas no SCDP, além de validar o recolhimento de GRUs para devolução em prestações com sobras de diárias.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-3">Servidor / CPF</th>
                    <th className="p-3">Nº SCDP</th>
                    <th className="p-3 text-right">Valor Diárias</th>
                    <th className="p-3">Documentos SIAFI</th>
                    <th className="p-3">Status Financeiro</th>
                    <th className="p-3">Batimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {siafiList.slice(0, 50).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">{v.cpfViajante}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{v.numeroViagem}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">{formatCurrency(v.valorTotal)}</td>
                      <td className="p-3">
                        <div className="space-y-0.5 text-[10px]">
                          <div><span className="text-slate-400 font-bold">Empenho:</span> <span className="font-mono">{v.siafiEmpenhoNumero}</span></div>
                          <div><span className="text-slate-400 font-bold">Ordem Bancária:</span> <span className="font-mono">{v.siafiOrdemBancariaNumero}</span></div>
                          {v.valorDevolucao > 0 && (
                            <div>
                              <span className="text-slate-400 font-bold">GRU Devolução:</span>{" "}
                              <span className="font-mono text-slate-700">
                                {v.siafiGruDevolucaoConfirmada ? `2026GR80${String(v.id).substring(4)}` : "Aguardando Emissão/Pagamento"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-700">{v.siafiDetalhesStatus}</span>
                        {v.valorDevolucao > 0 && (
                          <span className={`block text-[9px] font-bold ${v.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                            {v.siafiGruDevolucaoConfirmada ? "GRU de R$ " + v.valorDevolucao + " Paga" : "Aguardando GRU de R$ " + v.valorDevolucao}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {v.siafiConfirmado ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
                            Confirmado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-100">
                            Divergente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: INADIMPLÊNCIA E MALHA FINA */}
      {activeSubTab === "malha" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider">
                  Malha Fina de Inadimplência e Inconsistências de Vínculo
                </h3>
              </div>
              <button
                onClick={() => exportToExcel(inadimplentesList, "Malha_Fina_Inadimplencia")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer flex items-center gap-1.5 no-print"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Exportar Malha Fina (.xlsx)
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-3">Servidor (Nome/CPF/Lotação)</th>
                    <th className="p-3">Nº SCDP</th>
                    <th className="p-3">Trecho da Viagem</th>
                    <th className="p-3">Data Fim Viagem</th>
                    <th className="p-3">Motivo da Inconsistência</th>
                    <th className="p-3 text-center">Notificação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inadimplentesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        Nenhum servidor inadimplente ou com inconsistência cadastral identificado.
                      </td>
                    </tr>
                  ) : (
                    inadimplentesList.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                          <div className="flex gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                            <span>{v.cpfViajante}</span>
                            <span>•</span>
                            <span className="font-bold text-[#003366]">{v.lotacao}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{v.numeroViagem}</td>
                        <td className="p-3 font-medium text-slate-600">{v.trecho}</td>
                        <td className="p-3 font-mono text-slate-650 font-medium">{v.dataFim}</td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {v.statusPrestacao.includes("Atrasado") && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-100 block w-max">
                                {v.statusPrestacao}
                              </span>
                            )}
                            {v.inconsistenciaVinculo && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-100 block w-max">
                                Sem Vínculo Ativo (OR33000)
                              </span>
                            )}
                            {v.valorDevolucao > 0 && v.siafiGruDevolucaoConfirmada === false && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-red-50 text-red-800 border border-red-150 block w-max">
                                Devolução Pendente (SIAFI): {formatCurrency(v.valorDevolucao)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => triggerNotificationMail(v)}
                            className="px-3 py-1.5 bg-rose-550 hover:bg-rose-600 text-white rounded-lg transition duration-200 cursor-pointer flex items-center gap-1 mx-auto text-[10px] font-black"
                            title="Gerar e-mail mailto: de Notificação Rápida"
                          >
                            <Mail className="w-3.5 h-3.5" /> Notificar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB D: SOBREPOSIÇÃO DE AGENDAS */}
      {activeSubTab === "agenda" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider">
                  Cruzamento de Agendas (Viagens x Férias/Licenças)
                </h3>
              </div>
              <button
                onClick={() => exportToExcel(overlapList, "Sobreposicao_Agendas_SCDP")}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 transition cursor-pointer flex items-center gap-1.5 no-print"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                Exportar Conflitos (.xlsx)
              </button>
            </div>

            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 p-4 rounded-xl text-xs font-medium text-rose-900 mb-6">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <p>
                Sobreposições de diárias com afastamentos legais (férias, licenças médicas ou licença capacitação) representam pagamentos irregulares e indícios de auditoria.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <th className="p-3">Servidor Viajante</th>
                    <th className="p-3">Nº SCDP</th>
                    <th className="p-3">Período da Viagem</th>
                    <th className="p-3">Situação de Afastamento</th>
                    <th className="p-3">Período Conflitante</th>
                    <th className="p-3">Valores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overlapList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                        Nenhuma sobreposição de agenda de férias ou licenças identificada.
                      </td>
                    </tr>
                  ) : (
                    overlapList.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                          <div className="flex gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                            <span>{v.cpfViajante}</span>
                            <span>•</span>
                            <span className="font-semibold">{v.lotacao}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{v.numeroViagem}</td>
                        <td className="p-3 font-mono font-medium text-slate-600">{v.dataInicio} ➔ {v.dataFim}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-100">
                            {v.situacaoVinculo}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-rose-700 font-bold">{v.periodoSobreposicao}</td>
                        <td className="p-3 font-mono text-right font-black text-[#003366]">{formatCurrency(v.valorTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* Dossiê Detail Modal */}
      {dossieItem && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-[#003366] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plane className="w-5 h-5 text-blue-200 transform -rotate-45" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Dossiê de Viagem SCDP</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Viagem Nº: {dossieItem.numeroViagem || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => setDossieItem(null)}
                className="text-slate-350 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Motivo Viagem */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <span className="text-[9px] text-[#003366] block uppercase font-bold tracking-wider mb-1">Motivo da Viagem (SCDP)</span>
                <p className="text-xs font-semibold text-slate-700 leading-relaxed italic">
                  "{dossieItem.motivoViagem || "Motivo não detalhado na base de dados."}"
                </p>
              </div>

              {/* Servidor Info */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Identificação do Viajante (SIGEPE/SIAPE)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-400">Nome:</span> <span className="font-extrabold text-slate-800">{dossieItem.nomeViajante}</span></div>
                  <div className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-400">CPF:</span> <span className="font-mono font-bold text-slate-700">{dossieItem.cpfViajante}</span></div>
                  <div className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-400">Matrícula SIAPE:</span> <span className="font-mono font-bold text-[#003366]">{dossieItem.siapeViajante || "—"}</span></div>
                  <div className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-400">E-mail:</span> <span className="font-semibold text-slate-700">{dossieItem.emailViajante || "—"}</span></div>
                  <div className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-400">Situação Funcional:</span> <span className="font-semibold text-slate-850">{dossieItem.situacaoVinculo}</span></div>
                  <div className="flex justify-between border-b border-slate-100 py-1"><span className="text-slate-400">Lotação Exercício:</span> <span className="font-semibold text-slate-750 text-[10px] truncate max-w-[180px]" title={dossieItem.lotacao}>{dossieItem.lotacao}</span></div>
                </div>
              </div>

              {/* Financeiro conciliação */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Cruzamento Financeiro e SIAFI</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Nota de Empenho (NE):</span> <span className="font-mono font-semibold">{dossieItem.siafiEmpenhoNumero}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Ordem Bancária (OB):</span> <span className="font-mono font-semibold">{dossieItem.siafiOrdemBancariaNumero}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Diárias Recebidas:</span> <span className="font-bold font-mono">{formatCurrency(dossieItem.valorDiarias)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Passagens:</span> <span className="font-bold font-mono">{formatCurrency(dossieItem.valorPassagens)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Saldo a Devolver:</span> <span className="font-bold font-mono text-rose-600">{formatCurrency(dossieItem.valorDevolucao)}</span></div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status GRU Devolução:</span> 
                    <span className={`font-black ${dossieItem.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-605"}`}>
                      {dossieItem.valorDevolucao > 0 
                        ? (dossieItem.siafiGruDevolucaoConfirmada ? "CONFIRMADA/RECUPERADA" : "PENDENTE DE RECOLHIMENTO")
                        : "NÃO SE APLICA"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Agendas Overlap */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Conformidade de Calendário e Escalas</span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Sobreposição com Férias:</span>
                    <span className={`font-semibold ${dossieItem.sobreposicaoFerias ? "text-amber-700 bg-amber-50 px-2 py-0.5 rounded" : "text-emerald-700"}`}>
                      {dossieItem.sobreposicaoFerias ? `Sim (Período: ${dossieItem.periodoSobreposicao})` : "Sem afastamento por Férias"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Sobreposição com Licenças/Afastamentos:</span>
                    <span className={`font-semibold ${dossieItem.sobreposicaoLicenca ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded" : "text-emerald-700"}`}>
                      {dossieItem.sobreposicaoLicenca ? `Sim (Afastamento Ativo: ${dossieItem.periodoSobreposicao})` : "Sem afastamento por Licença"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t">
              <span className="text-[9px] text-slate-450 font-bold uppercase font-mono">Órbita-AECI Auditoria SCDP</span>
              <div className="flex gap-2">
                {dossieItem.statusPrestacao.includes("Atrasado") && (
                  <button
                    onClick={() => {
                      triggerNotificationMail(dossieItem);
                      setDossieItem(null);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg transition flex items-center gap-1 cursor-pointer border-0"
                  >
                    <Mail className="w-3.5 h-3.5" /> Notificar Servidor
                  </button>
                )}
                <button
                  onClick={() => setDossieItem(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 text-[10px] font-black rounded-lg transition cursor-pointer"
                >
                  Fechar Dossiê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
