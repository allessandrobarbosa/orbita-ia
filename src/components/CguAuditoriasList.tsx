import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, FileSpreadsheet, ChevronLeft, ChevronRight, 
  Filter, X, Eye, FileText, Calendar, Building2, MapPin 
} from "lucide-react";
import * as XLSX from "xlsx";
import { CguAuditoria } from "../types";
import { format } from "date-fns";

interface CguAuditoriasListProps {
  onViewDetails: (id_tarefa: string) => void;
}

export default function CguAuditoriasList({ onViewDetails }: CguAuditoriasListProps) {
  const [data, setData] = useState<CguAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("data_publicacao");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");

  // Filters
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
      const query = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order,
        ...filters
      });
      const res = await fetch(\`/api/cgu/auditorias?\${query.toString()}\`);
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("Erro ao buscar auditorias", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, filters]);

  useEffect(() => {
    fetchAuditorias();
  }, [fetchAuditorias]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset page on filter change
  };

  const clearFilters = () => {
    setFilters({
      idAuditoria: "", tituloRelatorio: "", tipoServico: "", 
      uf: "", municipio: "", grupoAtividade: "", 
      periodoInicio: "", periodoFim: ""
    });
    setPage(1);
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
      "Data Publicação": item.data_publicacao ? format(new Date(item.data_publicacao), 'dd/MM/yyyy') : '',
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

  const totalPages = Math.ceil(total / limit) || 1;

  return (
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
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center \${
              showFilters ? 'bg-slate-100 text-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }\`}
          >
            <Filter size={18} />
            Filtros
          </button>
          
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-down">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">ID Auditoria</label>
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
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
              <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("data_publicacao")}>
                Data Pub {sort === "data_publicacao" && (order === "ASC" ? '↑' : '↓')}
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("id_auditoria")}>
                ID Auditoria {sort === "id_auditoria" && (order === "ASC" ? '↑' : '↓')}
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("titulo_relatorio")}>
                Título {sort === "titulo_relatorio" && (order === "ASC" ? '↑' : '↓')}
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("sigla_unidade_auditada")}>
                Unidade {sort === "sigla_unidade_auditada" && (order === "ASC" ? '↑' : '↓')}
              </th>
              <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("tipo_servico")}>
                Tipo Serviço {sort === "tipo_servico" && (order === "ASC" ? '↑' : '↓')}
              </th>
              <th className="p-4 text-center w-24">Ações</th>
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
                <tr key={item.id_tarefa} className="hover:bg-[#1351b4]/5 transition-colors group">
                  <td className="p-4 text-sm text-slate-600 whitespace-nowrap">
                    {item.data_publicacao ? format(new Date(item.data_publicacao), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700">
                    {item.id_auditoria}
                  </td>
                  <td className="p-4 text-sm text-slate-700 font-medium">
                    <div className="line-clamp-2 max-w-md" title={item.titulo_relatorio}>
                      {item.titulo_relatorio}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium">
                      {item.sigla_unidade_auditada}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {item.tipo_servico || '-'}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => onViewDetails(item.id_tarefa)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#1351b4] hover:bg-[#1351b4]/10 transition-colors tooltip-trigger relative"
                      title="Detalhes da Auditoria"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-sm">
        <div className="text-slate-500">
          Mostrando <span className="font-medium text-slate-700">{(page - 1) * limit + (data.length > 0 ? 1 : 0)}</span> a <span className="font-medium text-slate-700">{Math.min(page * limit, total)}</span> de <span className="font-medium text-slate-700">{total}</span> registros
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={limit} 
            onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
            className="border border-slate-200 rounded text-slate-600 px-2 py-1 bg-white outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>

          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 rounded text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-3 py-1 bg-white border border-slate-200 rounded font-medium text-slate-700">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1 rounded text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
