import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, FileSpreadsheet, Filter, X, Eye, FileText, Calendar, 
  Building2, RefreshCw, Download, Plus, Edit2, Trash2, Banknote, ExternalLink
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Contrato } from "../types";

interface ContratosListProps {
  onSelectContract: (id: string) => void;
  onEditContract: (c: Contrato) => void;
  onDeleteContract: (id: string) => void;
  onSyncPncp: () => void;
  isSyncingPncp: boolean;
}

export default function ContratosList({
  onSelectContract,
  onEditContract,
  onDeleteContract,
  onSyncPncp,
  isSyncingPncp
}: ContratosListProps) {

  const [data, setData] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [availableYears, setAvailableYears] = useState<string[]>(["TODOS OS ANOS"]);
  const [localAnoFilter, setLocalAnoFilter] = useState("TODOS OS ANOS");

  const [sort, setSort] = useState("data_inicio");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");

  const [filters, setFilters] = useState({
    numeroContrato: "",
    empresa: "",
    objeto: "",
    modalidade: "",
    status: "",
    uf: "TODAS",
    origem: "TODAS",
    periodoInicio: "",
    periodoFim: "",
    numeroProcesso: "",
    categoriaProcesso: ""
  });

  const [showFilters, setShowFilters] = useState(false);

  const fetchContratos = useCallback(async () => {
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
      const res = await fetch(`/api/contratos?${query.toString()}`);
      const json = await res.json();
      
      if (Array.isArray(json)) {
        setData(json);
        setTotal(json.length);
      } else if (json.data && Array.isArray(json.data)) {
        setData(json.data);
        setTotal(json.total || 0);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("Erro ao buscar contratos", err);
    } finally {
      setLoading(false);
    }
  }, [sort, order, filters, localAnoFilter]);

  // Carrega anos do dashboard
  useEffect(() => {
    const fetchAnos = async () => {
      try {
        const res = await fetch("/api/contratos-dashboard");
        if (res.ok) {
          const json = await res.json();
          if (json.graficoAnos && Array.isArray(json.graficoAnos)) {
            const anos = json.graficoAnos.map((a: any) => `ANO ${a.ano}`);
            setAvailableYears(["TODOS OS ANOS", ...anos]);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar anos para abas:", err);
      }
    };
    fetchAnos();
  }, []);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      numeroContrato: "",
      empresa: "",
      objeto: "",
      modalidade: "",
      status: "",
      uf: "TODAS",
      origem: "TODAS",
      periodoInicio: "",
      periodoFim: "",
      numeroProcesso: "",
      categoriaProcesso: ""
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
      "Número Contrato": item.numeroContrato,
      "Empresa / Fornecedor": item.empresa,
      "CNPJ": item.cnpj || '',
      "UF / UASG": item.uf === 'DF_SEDE' ? 'DF (SEDE)' : item.uf === 'DF_SRTE' ? 'DF (SRTE)' : item.uf,
      "UASG": item.uasg || '',
      "Valor Global": item.valorGlobal,
      "Valor Mensal": item.valorMensal,
      "Data Início": item.dataInicio ? new Date(item.dataInicio).toLocaleDateString('pt-BR') : '',
      "Data Fim": item.dataFim ? new Date(item.dataFim).toLocaleDateString('pt-BR') : '',
      "Status": item.status || 'Ativo',
      "Objeto": item.objeto || '',
      "PNCP ID": item.pncpId || '',
      "Link PNCP": item.linkPncp || ''
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contratos_Gerais");
    XLSX.writeFile(wb, "Contratos_Gerais.xlsx");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="flex flex-col h-full gap-4 animate-fade-in">
      {/* Pills por Ano */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => setLocalAnoFilter(year)}
            className={`px-3.5 py-1.5 text-[11px] font-bold tracking-wide whitespace-nowrap rounded-full transition-all duration-200 cursor-pointer ${
              localAnoFilter === year
                ? "bg-[#003366] text-white shadow-sm shadow-blue-900/20"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#003366] flex items-center justify-center">
                <Building2 className="text-white" size={14} />
              </div>
              Repositório de Contratos Cadastrados
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 ml-9">
              Gestão e busca avançada de contratos integrados ao PNCP &mdash; <span className="font-semibold text-slate-700">{total} registros</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 justify-center border cursor-pointer ${
                showFilters
                  ? 'bg-[#003366]/8 border-[#003366]/20 text-[#003366]'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={14} />
              Filtros {showFilters ? '▲' : '▼'}
            </button>

            <button
              onClick={exportToExcel}
              className="px-3.5 py-2 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm cursor-pointer"
              title="Exportar dados para Excel"
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>

            <button
              onClick={onSyncPncp}
              disabled={isSyncingPncp}
              className="px-3.5 py-2 rounded-lg font-bold text-xs inline-flex items-center justify-center gap-1.5 bg-[#003366] text-white hover:bg-[#002244] transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Atualiza a base e importa dados/arquivos do PNCP"
            >
              <RefreshCw size={14} className={isSyncingPncp ? "animate-spin" : ""} />
              {isSyncingPncp ? "Sincronizando..." : "Sincronizar PNCP"}
            </button>
          </div>
        </div>


        {/* Filtros Expansíveis */}
        {showFilters && (
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número do Contrato</label>
              <input
                type="text"
                name="numeroContrato"
                value={filters.numeroContrato}
                onChange={handleFilterChange}
                placeholder="Ex: 01/2024..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número do Processo</label>
              <input
                type="text"
                name="numeroProcesso"
                value={filters.numeroProcesso}
                onChange={handleFilterChange}
                placeholder="Ex: 19821..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fornecedor / Empresa</label>
              <input
                type="text"
                name="empresa"
                value={filters.empresa}
                onChange={handleFilterChange}
                placeholder="Nome da empresa..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria do Processo</label>
              <input
                type="text"
                name="categoriaProcesso"
                value={filters.categoriaProcesso}
                onChange={handleFilterChange}
                placeholder="Ex: Locação Imóveis, TI..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objeto</label>
              <input
                type="text"
                name="objeto"
                value={filters.objeto}
                onChange={handleFilterChange}
                placeholder="Busca no objeto..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>


            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Origem do Contrato</label>
              <select
                name="origem"
                value={filters.origem}
                onChange={handleFilterChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="TODAS">Todas as Origens</option>
                <option value="MTE">MTE (Ministério do Trabalho)</option>
                <option value="MGI">MGI (Ministério da Gestão / SRAs)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Regional / UF</label>
              <select
                name="uf"
                value={filters.uf}
                onChange={handleFilterChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="TODAS">Todas as UFs</option>
                <option value="DF (SEDE)">DF (Sede Central)</option>
                <option value="DF (SRTE)">DF (Superintendência)</option>
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

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Suspenso">Suspenso</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Início a partir de</label>
              <input
                type="date"
                name="periodoInicio"
                value={filters.periodoInicio}
                onChange={handleFilterChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Início até</label>
              <input
                type="date"
                name="periodoFim"
                value={filters.periodoFim}
                onChange={handleFilterChange}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition w-full flex items-center justify-center gap-1 cursor-pointer"
              >
                <X size={14} />
                Limpar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Contratos */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span className="text-xs font-medium">Carregando contratos...</span>
            </div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-medium">Nenhum contrato encontrado para os filtros aplicados.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th 
                    onClick={() => handleSort("numero_contrato")} 
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    Número Contrato {sort === "numero_contrato" && (order === "ASC" ? "▲" : "▼")}
                  </th>
                  <th 
                    onClick={() => handleSort("uf")} 
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    UF / UASG {sort === "uf" && (order === "ASC" ? "▲" : "▼")}
                  </th>
                  <th 
                    onClick={() => handleSort("empresa")} 
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    Fornecedor {sort === "empresa" && (order === "ASC" ? "▲" : "▼")}
                  </th>
                  <th 
                    onClick={() => handleSort("valor_global")} 
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    Valor Global {sort === "valor_global" && (order === "ASC" ? "▲" : "▼")}
                  </th>
                  <th 
                    onClick={() => handleSort("data_inicio")} 
                    className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    Vigência {sort === "data_inicio" && (order === "ASC" ? "▲" : "▼")}
                  </th>
                  <th className="p-3 text-right">Ações & Dossiê</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {data.map((c) => {
                  let rawNumber = c.numeroContrato || 'Sem número';
                  let mainNumber = rawNumber;
                  let origemText = "";

                  const matchTag = rawNumber.match(/^\[(MGI|MTE)\]\s*(.*)$/i);
                  if (matchTag) {
                    const tag = matchTag[1].toUpperCase();
                    mainNumber = matchTag[2].trim();
                    if (tag === "MGI") {
                      origemText = "Origem: MGI";
                    } else if (tag === "MTE") {
                      origemText = "Origem: MTE";
                    }
                  }

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 align-top font-bold text-slate-900">
                        <div className="flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="block text-slate-900 font-bold">{mainNumber}</span>
                            {origemText && (
                              <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                                {origemText}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>


                    <td className="p-3 align-top font-bold">
                      {c.uf === 'DF_SEDE' || c.uf === 'DF' || !c.uf ? (
                        <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded uppercase">DF (SEDE)</span>
                      ) : c.uf === 'DF_SRTE' ? (
                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded uppercase">DF (SRTE)</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded uppercase">{c.uf}</span>
                      )}
                      {c.uasg && (
                        <div className="text-[9px] text-slate-500 mt-1 uppercase font-semibold truncate max-w-[120px]" title={c.uasg}>
                          {c.uasg}
                        </div>
                      )}
                    </td>
                    <td className="p-3 align-top min-w-[180px] max-w-[280px]">
                      <div className="font-semibold text-slate-800 whitespace-normal break-words">{c.empresa || '-'}</div>
                      {c.cnpj && <div className="text-[10px] text-slate-500 font-mono">CNPJ: {c.cnpj}</div>}
                    </td>
                    <td className="p-3 align-top font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(c.valorGlobal || 0)}
                      {c.valorMensal > 0 && (
                        <div className="text-[10px] font-normal text-slate-500">
                          Mensal: {formatCurrency(c.valorMensal)}
                        </div>
                      )}
                    </td>
                    <td className="p-3 align-top text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Início: {c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : '-'}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 mt-0.5">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        Fim: {c.dataFim ? new Date(c.dataFim).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td className="p-3 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectContract(c.id)}
                          className="px-2.5 py-1 bg-[#003366] hover:bg-[#002244] text-white rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Abrir Dossiê Completo do Contrato"
                        >
                          <Eye size={12} />
                          Dossiê
                        </button>

                        {c.linkPncp && (
                          <a
                            href={c.linkPncp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[11px] font-bold transition flex items-center gap-1"
                            title="Abrir no Portal PNCP"
                          >
                            <ExternalLink size={12} />
                            PNCP
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
