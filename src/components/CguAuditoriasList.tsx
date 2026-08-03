import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, FileSpreadsheet, ChevronLeft, ChevronRight, 
  Filter, X, Eye, FileText, Calendar, Building2, MapPin, RefreshCw, ArrowUp, Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { CguAuditoria, CguDemand } from "../types";
import CguAuditoriaDetail from "./CguAuditoriaDetail";

export default function CguAuditoriasList({ cguDemands = [] }: { cguDemands?: CguDemand[] }) {
  const [data, setData] = useState<CguAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [total, setTotal] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<string[]>(["TODOS OS ANOS"]);
  const [localAnoFilter, setLocalAnoFilter] = useState("TODOS OS ANOS");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch logic
  const [sort, setSort] = useState("data_publicacao");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [filters, setFilters] = useState({
    idAuditoria: "",
    tituloRelatorio: "",
    tipoServico: "",
    uf: "",
    municipio: "",
    grupoAtividade: "",
    periodoInicio: "",
    periodoFim: ""
  });
  
  const [showFilters, setShowFilters] = useState(false);

  const fetchAuditorias = useCallback(async () => {
    setLoading(true);
    try {
      const paramsObj: Record<string, string> = {
        limit: "1000",
        sort,
        order,
        ...filters
      };
      
      if (localAnoFilter && localAnoFilter.startsWith("ANO ")) {
        paramsObj.ano = localAnoFilter.replace("ANO ", "");
      }

      const query = new URLSearchParams(paramsObj);
      const res = await fetch(`/api/cgu/auditorias?${query.toString()}`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Erro ao buscar auditorias", err);
    } finally {
      setLoading(false);
    }
  }, [sort, order, filters, localAnoFilter]);

  // Fetch years for tabs
  useEffect(() => {
    const fetchAnos = async () => {
      try {
        const res = await fetch("/api/cgu/auditorias-dashboard");
        if (res.ok) {
          const json = await res.json();
          if (json.graficoAnos && Array.isArray(json.graficoAnos)) {
            const anos = json.graficoAnos.map((a: any) => `ANO ${a.ano}`);
            setAvailableYears(["TODOS OS ANOS", ...anos]);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar anos", err);
      }
    };
    fetchAnos();
  }, []);

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    fetchAuditorias();
  }, [fetchAuditorias]);

  useEffect(() => {
    const handleSyncCompleted = () => fetchAuditorias();
    window.addEventListener('cgu_sync_completed', handleSyncCompleted);
    return () => window.removeEventListener('cgu_sync_completed', handleSyncCompleted);
  }, [fetchAuditorias]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      idAuditoria: "", tituloRelatorio: "", tipoServico: "", 
      uf: "", municipio: "", grupoAtividade: "", 
      periodoInicio: "", periodoFim: ""
    });
  };

  const handleSort = (col: string) => {
    if (sort === col) {
      setOrder(order === "ASC" ? "DESC" : "ASC");
    } else {
      setSort(col);
      setOrder("DESC");
    }
  };

  const exportToExcel = () => {
    const wsData = data.map(item => ({
      "Data Publicação": item.data_publicacao ? new Date(item.data_publicacao).toLocaleDateString('pt-BR') : '',
      "Id Auditoria": item.id_auditoria,
      "Id Tarefa": item.id_tarefa,
      "Título": item.titulo_relatorio,
      "Sigla Unidade Auditada": item.sigla_unidade_auditada,
      "Nome Unidade Auditada": item.nome_unidade_auditada,
      "UF": item.uf,
      "Município": item.municipio,
      "Tipo Serviço": item.tipo_servico,
      "Linha de Ação": item.linha_acao,
      "URL Original": item.origem_cgu_url_relatorio
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditorias_CGU");
    XLSX.writeFile(wb, "Auditorias_CGU.xlsx");
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/cgu/auditorias/sync", { method: "POST" });
      const json = await res.json();
      if (json.error) {
        alert("Erro na sincronia: " + json.error);
      } else {
        alert(`Sincronia concluída com sucesso!\n\nRelatórios retornados: ${json.lidos}\nNovos inseridos: ${json.inseridos}\nAtualizados: ${json.atualizados}\nIgnorados/Inválidos: ${json.ignorados}\nErros: ${json.erros}`);
        fetchAuditorias(); // recarrega a tabela
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação ao sincronizar com a CGU.");
    } finally {
      setSyncing(false);
    }
  };

  const getDemandasVinculadas = useCallback((item: any) => {
    if (!cguDemands || cguDemands.length === 0) return [];
    return cguDemands.filter(d => {
      const audId = item.id_auditoria ? item.id_auditoria.toString() : "";
      const tarId = item.id_tarefa ? item.id_tarefa.toString() : "";
      
      const matchTarId = d.idTarefa && d.idTarefa.toString() === tarId;
      const matchAudId = d.tituloTarefa && audId && d.tituloTarefa.includes(audId);
      
      return matchTarId || matchAudId;
    });
  }, [cguDemands]);

  const getRecomendacoesCount = useCallback((item: any) => {
    return getDemandasVinculadas(item).length;
  }, [getDemandasVinculadas]);

  const getSituacaoGeral = useCallback((item: any) => {
    const demandasVinculadas = getDemandasVinculadas(item);
    
    if (demandasVinculadas.length === 0) return { text: "Sem Monitoramento", color: "text-slate-500 bg-slate-100 border-slate-200" };

    const isConcluida = demandasVinculadas.every(d => {
      const sit = d.situacao?.toLowerCase() || "";
      const est = d.estado?.toLowerCase() || "";
      return sit.includes("concluid") || sit.includes("cumprid") || sit.includes("cancelad") || sit.includes("fechad") || sit.includes("atendid") ||
             est.includes("consolidada") || est.includes("concluida") || est.includes("atendida");
    });

    if (isConcluida) return { text: "Concluída", color: "text-emerald-700 bg-emerald-100 border-emerald-200" };
    return { text: "Em Monitoramento", color: "text-amber-700 bg-amber-100 border-amber-200" };
  }, [getDemandasVinculadas]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Year Tabs Filters */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px no-scrollbar">
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => setLocalAnoFilter(year)}
            className={`px-4 py-2.5 text-xs font-black tracking-wide whitespace-nowrap uppercase transition-all border-b-2 ${localAnoFilter === year
              ? "border-[#003366] text-[#003366]"
              : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
              }`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-[#1351b4]" size={24} />
            Auditorias Publicadas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Repositório institucional de relatórios publicados pela CGU. Total: {total}
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center ${
              showFilters ? 'bg-slate-100 text-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={18} />
            Filtros
          </button>
          
          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-sm cursor-pointer flex-1 sm:flex-none"
            title="Exportar dados carregados na tabela"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-[#1351b4] text-white hover:bg-[#1351b4]/90 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">
              {syncing ? "Sincronizando..." : "Sincronizar CGU"}
            </span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Auditoria</label>
            <input 
              type="text" name="idAuditoria" value={filters.idAuditoria} onChange={handleFilterChange}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1351b4]/20 focus:border-[#1351b4] outline-none"
              placeholder="Ex: 20230001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Título do Relatório</label>
            <input 
              type="text" name="tituloRelatorio" value={filters.tituloRelatorio} onChange={handleFilterChange}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1351b4]/20 focus:border-[#1351b4] outline-none"
              placeholder="Buscar título..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de Serviço</label>
            <input 
              type="text" name="tipoServico" value={filters.tipoServico} onChange={handleFilterChange}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1351b4]/20 focus:border-[#1351b4] outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Período Início</label>
              <input 
                type="date" name="periodoInicio" value={filters.periodoInicio} onChange={handleFilterChange}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1351b4]/20 outline-none"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-slate-500 mb-1">Período Fim</label>
              <input 
                type="date" name="periodoFim" value={filters.periodoFim} onChange={handleFilterChange}
                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1351b4]/20 outline-none"
              />
            </div>
          </div>
          
          <div className="lg:col-span-4 flex justify-end">
            <button 
              onClick={clearFilters}
              className="px-4 py-1.5 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              <X size={16} /> Limpar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse text-sm text-slate-800">
          <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244] sticky top-0 z-10">
            <tr>
              <th className="p-4 font-semibold whitespace-nowrap w-[100px]">
                  Auditoria
                </th>
              <th className="p-4 font-semibold">
                Título
              </th>
              <th className="p-4 font-semibold whitespace-nowrap w-[120px]">
                  Publicação
                </th>
              <th className="p-4 font-semibold text-center">
                Recomendações
              </th>
              <th className="p-4 font-semibold text-center">
                Situação Geral
              </th>
              <th className="p-4 font-semibold w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <Search className="text-slate-300" size={32} />
                    <span>Carregando auditorias...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhuma auditoria encontrada com os filtros atuais.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <React.Fragment key={item.id_tarefa}>
                  <tr className={`hover:bg-[#1351b4]/5 transition-colors group ${expandedRowId === item.id_tarefa ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-4 align-middle text-sm font-medium text-slate-700">
                      {item.id_auditoria}
                    </td>
                    <td className="p-4 align-middle text-xs text-slate-700 font-medium">
                      <div className="min-w-[200px]" title={item.titulo_relatorio}>
                        {item.titulo_relatorio}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-sm text-slate-600 whitespace-nowrap">
                      {item.data_publicacao ? new Date(item.data_publicacao).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <span className="inline-flex items-center justify-center bg-blue-100 text-[#003366] font-black text-xs px-2.5 py-1 rounded-full border border-blue-200 shadow-sm min-w-[28px]">
                        {getRecomendacoesCount(item)}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-center">
                      {(() => {
                        const sit = getSituacaoGeral(item);
                        return (
                          <span className={`inline-flex items-center justify-center font-bold text-[11px] px-2.5 py-1 rounded-full border shadow-sm whitespace-nowrap ${sit.color}`}>
                            {sit.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <button
                        onClick={() => setExpandedRowId(expandedRowId === item.id_tarefa ? null : item.id_tarefa)}
                        className={`px-3 py-1.5 text-xs font-semibold border rounded-md transition-colors whitespace-nowrap ${
                          expandedRowId === item.id_tarefa
                            ? 'bg-[#1351b4] text-white border-[#1351b4]'
                            : 'text-[#1351b4] bg-blue-50 border-blue-100 hover:bg-[#1351b4] hover:text-white'
                        }`}
                        title="Detalhes da Auditoria"
                      >
                        {expandedRowId === item.id_tarefa ? "Fechar" : "Detalhamento"}
                      </button>
                    </td>
                  </tr>
                  {expandedRowId === item.id_tarefa && (
                    <tr className=" border-b border-[#002244]">
                      <td colSpan={6} className="p-0 border-b-2 border-blue-200 shadow-inner">
                        <div className="px-6 py-4 animate-slide-down">
                          <CguAuditoriaDetail id_tarefa={item.id_tarefa} onBack={() => setExpandedRowId(null)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Control */}
      <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 no-print">
        <div>
          Exibindo todos os <strong className="text-slate-800 font-bold">{data.length}</strong> relatórios encontrados • <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Filtros ativados com rolagem vertical infinita (páginas desativadas)</span>
        </div>
      </div>
    </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#1351b4] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-800 transition-all z-50 animate-fade-in border border-blue-400"
          title="Voltar ao topo"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}
