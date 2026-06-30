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
  HelpCircle
} from "lucide-react";

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
}

export default function ScdpModule() {
  // Local storage keys
  const STORAGE_KEY = "orbita_scdp_api_key";

  // Filter States
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Dates defaults: last 120 days
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 120);
    return d.toISOString().split("T")[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [maxPages, setMaxPages] = useState(5);

  // Data & loading states
  const [viagens, setViagens] = useState<ViagemData[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");

  // Fetch function
  const handleFetchData = async (forceApiKey?: string) => {
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
              ? "Modo Demonstração: Exibindo dados simulados. Insira a Chave API no painel para carregar os dados reais em tempo real."
              : `Sincronização concluída com sucesso! ${result.data?.length || 0} viagens carregadas.`
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

  // Process filters
  const filteredViagens = useMemo(() => {
    return viagens.filter((v) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        v.nomeViajante.toLowerCase().includes(term) ||
        v.cpfViajante.toLowerCase().includes(term) ||
        v.destino.toLowerCase().includes(term) ||
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

    return {
      totalCount,
      totalGasto,
      totalDiarias,
      totalPassagens,
      totalDevolvido,
      totalRecebido
    };
  }, [filteredViagens]);

  // Aggregate rankings (Top 10 users & Top 10 routes)
  const rankings = useMemo(() => {
    // 1. Users
    const userMap: Record<string, { name: string; cpf: string; value: number }> = {};
    // 2. Routes
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

  // Prestação de contas counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "No Prazo": 0,
      "Em Aberto - No Prazo": 0,
      "Em Aberto - Atrasado": 0,
      "Fora do Prazo (Prestado)": 0
    };
    filteredViagens.forEach((v) => {
      if (counts[v.statusPrestacao] !== undefined) {
        counts[v.statusPrestacao]++;
      }
    });
    return counts;
  }, [filteredViagens]);

  // Currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  return (
    <div className="space-y-6 font-sans select-all-normal text-slate-800">
      {/* Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print border-b border-slate-100 pb-4 border-dashed">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display flex items-center gap-2">
            <Plane className="w-6 h-6 text-[#003366] transform -rotate-45" />
            Diárias e Passagens (SCDP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento de viagens a serviço e prestação de contas do MTE (Decreto nº 5.992/2006)
          </p>
        </div>
      </div>

      {/* Control Bento Box (Chave API and Filters) */}
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
            {/* Pages slider */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Limite Páginas:</span>
              <select
                className="p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#003366]"
                value={maxPages}
                onChange={(e) => setMaxPages(Number(e.target.value))}
              >
                {[1, 2, 3, 5, 10, 15, 20].map((p) => (
                  <option key={p} value={p}>{p} páginas ({p * 15} viagens)</option>
                ))}
              </select>
            </div>
            <span className="text-[10px] font-medium text-slate-400">Filtro fixado: MTE (Órgão Superior 38000)</span>
          </div>

          <button
            onClick={() => handleFetchData()}
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#003366] hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition duration-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Consultando CGU..." : "Buscar Dados CGU"}
          </button>
        </div>
      </div>

      {/* Warning/Success Banner */}
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
            <span className="font-bold block uppercase tracking-wider text-[10px] text-blue-800">Modo Demonstração Ativo</span>
            <p className="font-normal text-[11px] leading-relaxed">
              Exibindo dados simulados realistas de viagens a serviço do MTE no período selecionado. Para sincronizar as diárias e passagens reais em tempo real, insira a sua <strong>Chave API da CGU</strong> no painel de configurações acima.
            </p>
          </div>
        </div>
      )}

      {successMessage && !isSimulated && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-fade-in no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 4. KPIs cards (Strict UI Rule: Only title and direct value, no subtitles/deltas) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Viagens", value: metrics.totalCount.toString(), color: "text-[#003366]" },
          { label: "Total Gasto", value: formatCurrency(metrics.totalGasto), color: "text-[#003366]" },
          { label: "Valor Diárias", value: formatCurrency(metrics.totalDiarias), color: "text-[#003366]" },
          { label: "Valor Passagens", value: formatCurrency(metrics.totalPassagens), color: "text-[#003366]" },
          { label: "Total Devolvido", value: formatCurrency(metrics.totalDevolvido), color: "text-emerald-700" },
          { label: "Líquido Recebido", value: formatCurrency(metrics.totalRecebido), color: "text-[#003366]" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">
              {kpi.label}
            </span>
            <span className={`text-base md:text-lg font-black tracking-tight leading-none ${kpi.color}`}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* 5. Minimalist horizontal bar charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Travelers chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
          <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-4">
            Ranking dos 10 Viajantes com Maior Recebimento
          </h3>
          <div className="space-y-3.5">
            {rankings.topUsers.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum dado de viajante disponível.</p>
            ) : (
              rankings.topUsers.map((user, idx) => {
                const maxVal = rankings.topUsers[0]?.value || 1;
                const percentage = Math.max(5, Math.min(100, (user.value / maxVal) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[320px]">
                        {idx + 1}. {user.name} <span className="text-slate-400 font-mono font-medium text-[10px]">({user.cpf})</span>
                      </span>
                      <span className="font-extrabold text-[#003366] font-mono">{formatCurrency(user.value)}</span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#003366] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Routes Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
          <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-4">
            Ranking dos Trechos Mais Utilizados
          </h3>
          <div className="space-y-3.5">
            {rankings.topRoutes.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Nenhum dado de trechos disponível.</p>
            ) : (
              rankings.topRoutes.map((route, idx) => {
                const maxVal = rankings.topRoutes[0]?.count || 1;
                const percentage = Math.max(5, Math.min(100, (route.count / maxVal) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 truncate max-w-[360px]">
                        {idx + 1}. {route.trecho}
                      </span>
                      <span className="font-extrabold text-slate-600 font-mono">{route.count} viagens</span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-slate-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 6. Compliance Status Cards and Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <div>
            <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider">
              Detalhamento de Viagens e Prestação de Contas (Decreto nº 5.992/06)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              O prazo limite legal exigido para a prestação de contas de viagens nacionais é de 5 dias corridos após o retorno.
            </p>
          </div>
        </div>

        {/* Status badges row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "No Prazo", count: statusCounts["No Prazo"], bg: "bg-emerald-50 text-emerald-800 border-emerald-100", dot: "bg-emerald-500" },
            { label: "Em Aberto - No Prazo", count: statusCounts["Em Aberto - No Prazo"], bg: "bg-sky-50 text-sky-800 border-sky-100", dot: "bg-sky-500" },
            { label: "Em Aberto - Atrasado", count: statusCounts["Em Aberto - Atrasado"], bg: "bg-rose-50 text-rose-800 border-rose-100", dot: "bg-rose-500 animate-pulse" },
            { label: "Fora do Prazo (Prestado)", count: statusCounts["Fora do Prazo (Prestado)"], bg: "bg-amber-50 text-amber-800 border-amber-100", dot: "bg-amber-500" }
          ].map((statusBadge, idx) => (
            <button
              key={idx}
              onClick={() => {
                setStatusFilter(statusFilter === statusBadge.label ? "TODOS" : statusBadge.label);
              }}
              className={`p-3 border rounded-xl flex items-center justify-between transition cursor-pointer text-left ${statusBadge.bg} ${
                statusFilter === statusBadge.label ? "ring-2 ring-[#003366]" : "hover:shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusBadge.dot}`} />
                <span className="text-[10.5px] font-black uppercase tracking-wider">{statusBadge.label}</span>
              </div>
              <span className="text-sm font-black font-mono">{statusBadge.count}</span>
            </button>
          ))}
        </div>

        {/* Search controls */}
        <div className="flex flex-wrap gap-2 mb-4 justify-between items-center">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#003366] focus:bg-white"
              placeholder="Pesquisar por Servidor, CPF, Destino ou Viagem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            {statusFilter !== "TODOS" && (
              <button
                onClick={() => setStatusFilter("TODOS")}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition cursor-pointer"
              >
                Limpar Filtro Status
              </button>
            )}
            <span className="text-xs text-slate-400 font-mono font-medium">
              {filteredViagens.length} viagens encontradas
            </span>
          </div>
        </div>

        {/* Detailed Data Table */}
        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="p-3">Nº Viagem</th>
                <th className="p-3">Viajante</th>
                <th className="p-3">Trecho (Origem ➔ Destino)</th>
                <th className="p-3">Período Ida/Retorno</th>
                <th className="p-3">Prestação de Contas</th>
                <th className="p-3 text-right">Diárias</th>
                <th className="p-3 text-right">Passagens</th>
                <th className="p-3 text-right">Total Viagem</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViagens.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 italic">
                    Nenhuma viagem corresponde aos filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredViagens.slice(0, 50).map((v) => {
                  let statusBg = "bg-slate-50 text-slate-600";
                  if (v.statusPrestacao === "No Prazo") statusBg = "bg-emerald-50 text-emerald-800 border border-emerald-100";
                  else if (v.statusPrestacao === "Em Aberto - No Prazo") statusBg = "bg-sky-50 text-sky-800 border border-sky-100";
                  else if (v.statusPrestacao === "Em Aberto - Atrasado") statusBg = "bg-rose-50 text-rose-800 border border-rose-100";
                  else if (v.statusPrestacao === "Fora do Prazo (Prestado)") statusBg = "bg-amber-50 text-amber-800 border border-amber-100";

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{v.numeroViagem || "-"}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{v.cpfViajante}</span>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{v.trecho}</td>
                      <td className="p-3 font-medium text-slate-600">
                        {v.dataInicio} ➔ {v.dataFim}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-600">
                        {v.dataPrestacaoContas || <span className="text-slate-400 font-normal italic">Pendente</span>}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(v.valorDiarias)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">{formatCurrency(v.valorPassagens)}</td>
                      <td className="p-3 text-right font-mono font-extrabold text-[#003366]">{formatCurrency(v.valorTotal)}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider leading-none inline-block ${statusBg}`}>
                          {v.statusPrestacao}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredViagens.length > 50 && (
          <p className="text-[10px] text-slate-400 text-center mt-3">
            Exibindo as primeiras 50 viagens de {filteredViagens.length}. Utilize a pesquisa para filtrar registros específicos.
          </p>
        )}
      </div>
    </div>
  );
}
