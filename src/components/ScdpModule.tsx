import React, { useState, useEffect, useMemo } from "react";
import { Plane, Search, RefreshCw, AlertCircle, CheckCircle2, Info, Sliders, Eye, EyeOff, Scale, Briefcase, MapPin, AlertTriangle, Building } from "lucide-react";
import { ScdpKpiCards } from "./scdp/ScdpKpiCards";
import { ScdpDataTable } from "./scdp/ScdpDataTable";
import { ScdpAiInsights } from "./scdp/ScdpAiInsights";

export default function ScdpModule() {
  const STORAGE_KEY = "orbita_scdp_api_key";

  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [dateStart, setDateStart] = useState("2026-01-01");
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [maxPages, setMaxPages] = useState(500);

  const [viagens, setViagens] = useState<any[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedViagem, setSelectedViagem] = useState<any | null>(null);

  const handleFetchData = async (forceRefresh?: boolean, silent?: boolean) => {
    setIsLoading(true);
    if (!silent) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }

    const formatDate = (isoDate: string) => {
      if (!isoDate) return "";
      const parts = isoDate.split("-");
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    try {
      const headers: Record<string, string> = {};
      if (apiKey.trim()) headers["chave-api-dados"] = apiKey.trim();

      const queryParams = new URLSearchParams({
        dataIdaDe: formatDate(dateStart),
        dataIdaAte: formatDate(dateEnd),
        maxPages: String(maxPages)
      });
      if (forceRefresh) queryParams.append("forceRefresh", "true");

      const response = await fetch(`/api/scdp/viagens?${queryParams.toString()}`, { method: "GET", headers });
      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || `Erro HTTP ${response.status}`);
        setIsSimulated(true);
      } else {
        setViagens(result.data || []);
        setIsSimulated(!!result.isSimulated);
        if (!silent) setSuccessMessage(`Sincronização concluída! ${result.data?.length || 0} viagens carregadas.`);
      }
    } catch (err: any) {
      setErrorMessage("Erro de rede ao conectar ao servidor.");
      setIsSimulated(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFetchData(false, true);
  }, []);

  const handleSaveApiKey = (val: string) => {
    setApiKey(val);
    if (val.trim()) localStorage.setItem(STORAGE_KEY, val.trim());
    else localStorage.removeItem(STORAGE_KEY);
  };

  const filteredViagens = useMemo(() => {
    return viagens.filter((v) => {
      const term = searchTerm.toLowerCase();
      return (
        v.nomeViajante?.toLowerCase().includes(term) ||
        v.cpfViajante?.toLowerCase().includes(term) ||
        v.destino?.toLowerCase().includes(term)
      );
    });
  }, [viagens, searchTerm]);

  const metrics = useMemo(() => {
    return {
      totalCount: filteredViagens.length,
      totalGasto: filteredViagens.reduce((acc, v) => acc + (v.valorTotal || 0), 0),
      totalDiarias: filteredViagens.reduce((acc, v) => acc + (v.valorDiarias || 0), 0),
      totalPassagens: filteredViagens.reduce((acc, v) => acc + (v.valorPassagem || 0), 0),
      totalDevolvido: filteredViagens.reduce((acc, v) => acc + (v.valorDevolucao || 0), 0),
      totalRecebido: 0,
      siafiDivergences: filteredViagens.filter(v => v.siafiScdpDivergencia).length,
      vinculoInconsistencies: 0,
      agendaOverlaps: 0,
      delayedAccounts: filteredViagens.filter(v => v.statusPrestacao === "Pendente" || v.statusPrestacao?.includes("Atrasado")).length
    };
  }, [filteredViagens]);

  return (
    <div className="space-y-6 font-sans text-slate-800">
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg text-white">
            <Plane size={20} className="transform -rotate-45" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Auditoria de Diárias e Passagens (SCDP)</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Conformidade Decreto nº 5.992/2006 — Integração CGU, SIAFI e SIGEPE</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
          <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Configurações de API
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col md:col-span-2">
              <label className="text-[10px] font-extrabold text-[#003366] uppercase mb-1">Chave API (Portal da Transparência)</label>
              <div className="relative flex rounded-lg">
                <input
                  type={showApiKey ? "text" : "password"}
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Insira seu Token..."
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-2 text-slate-400">
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-[#003366] uppercase mb-1">Data Início</label>
              <input type="date" className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-extrabold text-[#003366] uppercase mb-1">Data Fim</label>
              <input type="date" className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => handleFetchData(true, false)} disabled={isLoading} className="px-5 py-2.5 bg-[#003366] hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar Bases
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl text-xs flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errorMessage}</div>
      )}
      {successMessage && !isSimulated && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {successMessage}</div>
      )}
      {isSimulated && !errorMessage && (
        <div className="p-4 bg-blue-50 text-blue-900 border border-blue-200 rounded-2xl text-xs flex items-center gap-2"><Info className="w-4 h-4" /> Modo Simulação: Exibindo dados locais. Insira sua chave API para sincronizar com a CGU.</div>
      )}

      <ScdpKpiCards metrics={metrics} />

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs relative">
        <div className="mb-4">
          <input
            type="text"
            className="w-full max-w-md pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            placeholder="Pesquisar por Servidor, CPF, Destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScdpDataTable 
          viagens={filteredViagens} 
          onSelectViagem={setSelectedViagem} 
          selectedViagem={selectedViagem}
        />
      </div>
    </div>
  );
}
