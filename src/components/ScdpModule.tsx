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
  X,
  FileText
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
  siapePendenciaScdp?: boolean;
  motivoViagem?: string;
  siafiDataPagamento?: string;
  siafiGruIdentificacao?: string;
}

export default function ScdpModule() {
  // Local storage keys
  const STORAGE_KEY = "orbita_scdp_api_key";

  // Filter States
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Dates defaults: from 01/01/2026 to today to cover cached real data
  const [dateStart, setDateStart] = useState("2026-01-01");
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [maxPages, setMaxPages] = useState(500);

  // Audit filter category state
  const [auditFilter, setAuditFilter] = useState<"TODOS" | "INADIMPLENCIA" | "SIAFI" | "SOBREPOSICAO">("TODOS");
  
  // Dossiê Modal internal tab state
  const [dossieSubTab, setDossieSubTab] = useState<"vinculo" | "siafi" | "agenda">("vinculo");

  // Data & loading states
  const [viagens, setViagens] = useState<ViagemData[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Accordion state (expanded viagem IDs)
  const [expandedViagemIds, setExpandedViagemIds] = useState<Record<number, boolean>>({});
  const [dossieItem, setDossieItem] = useState<ViagemData | null>(null);

  // Fetch function
  const handleFetchData = async (forceApiKey?: string, forceRefresh?: boolean, silent?: boolean) => {
    setIsLoading(true);
    if (!silent) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }

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
        } else if (!silent) {
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

  const handleBuscarAuditoria = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      // 1. Silent local spreadsheet sync
      const response = await fetch("/api/scdp/import-local-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const importRes = await response.json();

      // 2. Load latest database records
      await handleFetchData(undefined, false, true);

      if (importRes.success) {
        if (importRes.recordsUpdated > 0) {
          setSuccessMessage(`Auditoria atualizada! ${importRes.recordsUpdated} registros saneados/atualizados a partir das planilhas.`);
        } else {
          setSuccessMessage("Busca de auditoria realizada com sucesso!");
        }
      }
    } catch (err: any) {
      console.error(err);
      await handleFetchData(undefined, false, false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLocalSpreadsheet = async () => {
    setIsImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/scdp/import-local-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const resData = await response.json();
      if (resData.success) {
        setSuccessMessage(resData.message);
        handleFetchData();
      } else {
        setErrorMessage(resData.error || "Ocorreu um erro ao importar as planilhas locais.");
      }
    } catch (err: any) {
      setErrorMessage("Erro de conexão ao servidor: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Run on mount
  useEffect(() => {
    handleFetchData(undefined, false, true);
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

      let matchesAudit = true;
      if (auditFilter === "INADIMPLENCIA") {
        matchesAudit = v.statusPrestacao.includes("Atrasado") || 
                       v.inconsistenciaVinculo || 
                       (v.valorDevolucao > 0 && v.siafiGruDevolucaoConfirmada === false);
      } else if (auditFilter === "SIAFI") {
        matchesAudit = v.siafiScdpDivergencia === true;
      } else if (auditFilter === "SOBREPOSICAO") {
        matchesAudit = v.sobreposicaoFerias || v.sobreposicaoLicenca;
      }

      return matchesSearch && matchesStatus && matchesAudit;
    });
  }, [viagens, searchTerm, statusFilter, auditFilter]);

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
      {/* 1. Sticky Header & Filter Panel */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        {/* Header Oficial Gov.br */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
                <Plane size={20} strokeWidth={2.5} className="transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Diárias e Passagens — SCDP</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Monitoramento preventivo em conformidade com o <strong>Decreto nº 5.992/2006</strong> e cruzamento financeiro com o <strong>SIAFI</strong>.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Config & API Filter Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs relative overflow-hidden">
          <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Painel de Configurações e Filtros
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
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

            {/* Page Limit Selector */}
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider mb-1 block">
                Limite de Páginas (CGU)
              </label>
              <select
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#003366] focus:bg-white cursor-pointer"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
              >
                <option value="50">50 páginas</option>
                <option value="200">200 páginas</option>
                <option value="500">500 páginas (Padrão)</option>
                <option value="1000">1.000 páginas</option>
                <option value="5000">5.000 páginas</option>
                <option value="7500">7.500 páginas (Máximo)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col gap-1 text-[10px] text-slate-400">
            <span className="font-medium">Órgão Superior Fixado: Ministério do Trabalho e Emprego (38000)</span>
            <span className="text-slate-450 italic">Dica: Adicione planilhas (.xlsx/.csv) do Painel de Viagens em <strong>data/scdp_imports/</strong>. O batimento e saneamento de destinos/status ocorrerão automaticamente ao clicar em Buscar Auditoria.</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleBuscarAuditoria()}
              disabled={isLoading}
              className="px-5 py-2.5 bg-[#003366] hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition duration-200 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              {isLoading ? "Processando..." : "Buscar Auditoria"}
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
          { label: "Valores a Restituir (SIAFI)", value: formatCurrency(metrics.totalDevolvido), color: metrics.totalDevolvido > 0 ? "text-rose-600" : "text-[#003366]" },
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
        ))
      }
      </div>
                  {/* 4. Sub-tab Content Rendering (Consolidated List) */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs relative min-h-[250px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center z-20 rounded-2xl animate-fade-in no-print">
              <RefreshCw className="w-8 h-8 text-[#003366] animate-spin mb-3" />
              <span className="text-sm font-black text-[#003366] animate-pulse">Sincronizando e Processando Auditoria...</span>
              <span className="text-[10px] text-slate-450 mt-1">Carregando dados e mapeando planilhas do Painel de Viagens</span>
            </div>
          )}
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
          <div className="flex flex-wrap gap-4 mb-4 justify-between items-center">
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

            {/* Navigation Tabs using Etica Pattern */}
            <div className="no-print w-full border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs mb-4">
              {[
                { id: "TODOS", label: "Todas as Viagens", desc: "Listagem Geral", icon: FileText },
                { id: "INADIMPLENCIA", label: "Inadimplência", desc: "Atrasos na Prestação", icon: AlertTriangle },
                { id: "SIAFI", label: "SIAFI", desc: "Divergências Físico-Financeiras", icon: Search },
                { id: "SOBREPOSICAO", label: "Sobreposições", desc: "Conflitos de Datas", icon: Calendar }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = auditFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAuditFilter(tab.id as any)}
                    className={`flex-1 min-w-[150px] flex items-center justify-between gap-4 p-4 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <div className="text-left">
                        <span className="block text-xs font-black uppercase tracking-wide leading-none">{tab.label}</span>
                        <span className="block text-[9px] opacity-75 mt-0.5 font-normal leading-none">{tab.desc}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
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

          {/* Table layout (Combined information cell) */}
          <div className="overflow-x-auto border border-slate-150 rounded-xl max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-150 shadow-3xs">
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-4">Servidor Viajante</th>
                  <th className="p-4">Período Ida/Volta</th>
                  <th className="p-4 text-right">Valores</th>
                  <th className="p-4">Prestação de Contas</th>
                  <th className="p-4">Auditoria / Alertas</th>
                  <th className="p-4 text-center">Ações</th>
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
                  filteredViagens.map((v) => {
                    let statusBg = "bg-slate-50 text-slate-600";
                    if (v.statusPrestacao === "No Prazo") statusBg = "bg-emerald-50 text-emerald-800 border border-emerald-100";
                    else if (v.statusPrestacao === "Em Aberto - No Prazo") statusBg = "bg-sky-50 text-sky-800 border border-sky-100";
                    else if (v.statusPrestacao === "Em Aberto - Atrasado") statusBg = "bg-rose-50 text-rose-800 border border-rose-100";
                    else if (v.statusPrestacao === "Fora do Prazo (Prestado)") statusBg = "bg-amber-50 text-amber-800 border border-amber-100";

                    return (
                      <tr 
                        key={v.id} 
                        className="hover:bg-slate-50/70 transition cursor-pointer"
                        onClick={() => {
                          setDossieSubTab("vinculo");
                          setDossieItem(v);
                        }}
                      >
                        {/* Combined cell 1: Servidor Name, CPF, Lotação */}
                        <td className="p-4">
                          <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                          <div className="text-[10px] text-slate-450 font-mono mt-1 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
                            <span>CPF: {v.cpfViajante}</span>
                            <span className="text-slate-250 font-normal">|</span>
                            <span className="font-bold text-[#003366]">Nº SCDP: {v.numeroViagem || "—"}</span>
                          </div>
                          <div className="mt-1">
                            <span className="bg-slate-100/80 px-2 py-0.5 rounded-md font-semibold text-[9px] text-slate-600 block w-max max-w-full leading-normal">
                              {v.lotacao}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-slate-600 font-medium font-mono">
                          {v.dataInicio} ➔ {v.dataFim}
                        </td>

                        {/* Combined cell 3: Total value + breakdown */}
                        <td className="p-4 text-right">
                          <div className="font-extrabold text-[#003366]">{formatCurrency(v.valorTotal)}</div>
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Diárias: {formatCurrency(v.valorDiarias)}</span>
                          {v.valorDevolucao > 0 && (
                            <span className={`text-[9px] font-black block mt-0.5 ${v.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                              Devolução: {formatCurrency(v.valorDevolucao)} ({v.siafiGruDevolucaoConfirmada ? "SIAFI OK" : "Pendente"})
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block ${statusBg}`}>
                            {v.statusPrestacao}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1">
                            {v.dataPrestacaoContas ? `Entregue em: ${v.dataPrestacaoContas}` : "Pendente de Envio"}
                          </span>
                        </td>

                        {/* Auditoria / Alertas */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {v.inconsistenciaVinculo && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-100">
                                Vínculo
                              </span>
                            )}
                            {v.siafiScdpDivergencia && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-100">
                                SIAFI
                              </span>
                            )}
                            {v.siapePendenciaScdp && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-250 animate-pulse">
                                Restrição
                              </span>
                            )}
                            {(v.sobreposicaoFerias || v.sobreposicaoLicenca) && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-100">
                                Sobreposição
                              </span>
                            )}
                            {!v.inconsistenciaVinculo && !v.siafiScdpDivergencia && !v.siapePendenciaScdp && !v.sobreposicaoFerias && !v.sobreposicaoLicenca && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100">
                                Regular
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setDossieSubTab("vinculo");
                                setDossieItem(v);
                              }}
                              className="p-1 text-slate-500 hover:text-[#003366] hover:bg-blue-50 rounded transition cursor-pointer"
                              title="Visualizar Dossiê Completo"
                            >
                              <Eye className="w-3.5 h-3.5" />
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dossiê Detail Modal */}
      {dossieItem && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden font-sans flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-[#003366] text-white p-5 flex items-center justify-between shrink-0">
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

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0 select-none">
              {[
                { id: "vinculo", label: "Vínculo & Identificação" },
                { id: "siafi", label: "Conciliação SIAFI" },
                { id: "agenda", label: "Escalas & Conflitos" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDossieSubTab(t.id as any)}
                  className={`pb-2.5 px-2 text-xs font-black transition border-b-2 cursor-pointer ${
                    dossieSubTab === t.id
                      ? "border-[#003366] text-[#003366]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto text-xs space-y-4">
              {/* Motivo Viagem */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150">
                <span className="text-[9px] text-[#003366] block uppercase font-bold tracking-wider mb-1">Motivo da Viagem (SCDP)</span>
                <p className="text-xs font-semibold text-slate-705 leading-relaxed italic">
                  "{dossieItem.motivoViagem || "Motivo não detalhado na base de dados."}"
                </p>
              </div>

              {dossieSubTab === "vinculo" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Servidor Info */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Identificação do Viajante (SIGEPE/SIAPE)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Nome Completo</span>
                        <span className="text-xs font-extrabold text-slate-800 block mt-1">{dossieItem.nomeViajante}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">CPF</span>
                        <span className="text-xs font-mono font-bold text-slate-700 block mt-1">{dossieItem.cpfViajante}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Matrícula SIAPE</span>
                        <span className="text-xs font-mono font-bold text-[#003366] block mt-1">{dossieItem.siapeViajante || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">E-mail Cadastrado</span>
                        <span className="text-xs font-semibold text-slate-700 block mt-1">{dossieItem.emailViajante || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Situação Funcional</span>
                        <span className="text-xs font-semibold text-slate-850 block mt-1">{dossieItem.situacaoVinculo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Lotação Exercício</span>
                        <span className="text-xs font-semibold text-slate-750 block mt-1" title={dossieItem.lotacao}>{dossieItem.lotacao}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Verificação de Restrições Cadastrais</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center border border-slate-150 p-4.5 rounded-xl bg-slate-50/50">
                        <span className="text-slate-500 font-bold">Restrição Diária (SIAPE):</span> 
                        <span className={`font-black px-2.5 py-0.5 rounded text-[10px] ${dossieItem.siapePendenciaScdp ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50"}`}>
                          {dossieItem.siapePendenciaScdp ? "Consta Pendência (Impedido)" : "Regular (Sem Impedimento)"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border border-slate-150 p-4.5 rounded-xl bg-slate-50/50">
                        <span className="text-slate-500 font-bold">Validação de Vínculo:</span> 
                        <span className={`font-black px-2.5 py-0.5 rounded text-[10px] ${dossieItem.inconsistenciaVinculo ? "text-rose-700 bg-rose-50" : "text-emerald-700 bg-emerald-50"}`}>
                          {dossieItem.inconsistenciaVinculo ? "Inconsistente (Sem Vínculo)" : "Vínculo Regularizado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dossieSubTab === "siafi" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Financeiro conciliação */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-3">
                    <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Cruzamento Financeiro e SIAFI</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Nota de Empenho (NE)</span>
                        <span className="text-xs font-mono font-semibold text-slate-800 block mt-1">{dossieItem.siafiEmpenhoNumero}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Ordem Bancária (OB)</span>
                        <span className="text-xs font-mono font-semibold text-slate-800 block mt-1">{dossieItem.siafiOrdemBancariaNumero}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status GRU Devolução</span>
                        <span className={`text-xs font-black block mt-1 ${dossieItem.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                          {dossieItem.valorDevolucao > 0 
                            ? (dossieItem.siafiGruDevolucaoConfirmada ? "CONFIRMADA/RECUPERADA" : "PENDENTE DE RECOLHIMENTO")
                            : "NÃO SE APLICA"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Data do Pagamento OB</span>
                        <span className="text-xs font-mono font-semibold text-slate-800 block mt-1">{dossieItem.siafiDataPagamento || "28/02/2026"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Número de Identificação da GRU</span>
                        <span className="text-xs font-mono font-semibold text-slate-800 block mt-1">
                          {dossieItem.valorDevolucao > 0 
                            ? (dossieItem.siafiGruIdentificacao || `2026GRU${dossieItem.id.toString().substring(0, 6)}`) 
                            : "NÃO SE APLICA"}
                        </span>
                      </div>
                      <div className="border-t border-slate-100 sm:col-span-3 pt-4 mt-2 grid grid-cols-3 gap-6">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Diárias Recebidas</span>
                          <span className="text-sm font-black text-[#003366] block mt-1">{formatCurrency(dossieItem.valorDiarias)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Passagens</span>
                          <span className="text-sm font-black text-slate-700 block mt-1">{formatCurrency(dossieItem.valorPassagens)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Saldo a Devolver</span>
                          <span className="text-sm font-black text-rose-600 block mt-1">{formatCurrency(dossieItem.valorDevolucao)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dossieSubTab === "agenda" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Agendas Overlap */}
                  <div className="bg-white p-4.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] text-[#003366] block uppercase font-black tracking-wider border-b pb-1">Conformidade de Calendário e Escalas</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
                      <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 space-y-2">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sobreposição com Férias</span>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-750">Férias Ativas:</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${dossieItem.sobreposicaoFerias ? "text-amber-800 bg-amber-50" : "text-emerald-700 bg-emerald-50"}`}>
                            {dossieItem.sobreposicaoFerias ? "Sim (Conflitante)" : "Não"}
                          </span>
                        </div>
                        {dossieItem.sobreposicaoFerias && (
                          <div className="text-[10px] text-amber-900 bg-amber-50/70 p-2 rounded-md font-medium">
                            Período: {dossieItem.periodoSobreposicao}
                          </div>
                        )}
                      </div>
                      <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 space-y-2">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Sobreposição com Licenças</span>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-750">Licença Ativa:</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${dossieItem.sobreposicaoLicenca ? "text-rose-800 bg-rose-50" : "text-emerald-700 bg-emerald-50"}`}>
                            {dossieItem.sobreposicaoLicenca ? "Sim (Conflitante)" : "Não"}
                          </span>
                        </div>
                        {dossieItem.sobreposicaoLicenca && (
                          <div className="text-[10px] text-rose-900 bg-rose-50/70 p-2 rounded-md font-medium">
                            Período: {dossieItem.periodoSobreposicao}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t shrink-0">
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
