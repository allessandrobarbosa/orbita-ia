import React, { useState, useEffect } from "react";
import { 
  Building2, Banknote, Calendar, CheckCircle2, AlertTriangle, 
  XCircle, FileText, Activity, MapPin, Award, Clock, Scale, ShieldAlert, Layers, Briefcase
} from "lucide-react";

interface DashboardData {
  total: number;
  valorGlobalAtivo: number;
  valorMensalAtivo: number;
  ativos: number;
  suspensos: number;
  encerrados: number;
  graficoAnos: { ano: string; count: string }[];
  graficoUf: { uf: string; count: string }[];
  topFornecedores: { empresa: string; count: string; total_valor: string }[];
  graficoVencimento?: { faixa_vencimento: string; count: string; total_valor: string }[];
  graficoModalidade?: { modalidade: string; count: string; total_valor: string }[];
  graficoTipoServico?: { tipo_servico: string; count: string; total_valor: string }[];
}

export default function ContratosDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/contratos-dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard de contratos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Activity className="animate-spin mb-4 text-[#003366]" size={32} />
        <p className="text-sm font-medium text-slate-600">Carregando inteligência e estatísticas gerenciais...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="mx-auto mb-2 text-amber-500" size={32} />
        <p className="text-sm">Não foi possível carregar os dados do painel.</p>
      </div>
    );
  }

  const {
    total, valorGlobalAtivo, valorMensalAtivo, ativos, suspensos, encerrados,
    graficoAnos, graficoUf, topFornecedores,
    graficoVencimento = [], graficoModalidade = [], graficoTipoServico = []
  } = data;

  const maxAnos = Math.max(...graficoAnos.map(g => parseInt(g.count, 10)), 1);
  const maxUf = Math.max(...graficoUf.map(g => parseInt(g.count, 10)), 1);
  const maxFornecedorValor = Math.max(...topFornecedores.map(f => parseFloat(f.total_valor || '0')), 1);
  const maxModalidade = Math.max(...graficoModalidade.map(m => parseInt(m.count, 10)), 1);
  const maxTipoServico = Math.max(...graficoTipoServico.map(t => parseInt(t.count, 10)), 1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatCompactCurrency = (val: number) => {
    if (val >= 1_000_000_000) {
      return `R$ ${(val / 1_000_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bi`;
    }
    if (val >= 1_000_000) {
      return `R$ ${(val / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mi`;
    }
    if (val >= 1_000) {
      return `R$ ${(val / 1_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil`;
    }
    return formatCurrency(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Registrados */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Contratos</p>
            <FileText size={18} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{total}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Base sincronizada</p>
        </div>

        {/* Valor Global Ativo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 flex flex-col justify-between border-b-4 border-b-blue-600 hover:border-slate-300 transition">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Global Ativo</p>
            <Banknote size={18} className="text-blue-600 shrink-0" />
          </div>
          <div>
            <h3 className="text-xl font-black text-blue-950 tracking-tight" title={formatCurrency(valorGlobalAtivo)}>
              {formatCompactCurrency(valorGlobalAtivo)}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5" title={formatCurrency(valorGlobalAtivo)}>
              {formatCurrency(valorGlobalAtivo)}
            </p>
          </div>
        </div>

        {/* Valor Mensal Ativo */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 flex flex-col justify-between border-b-4 border-b-indigo-500 hover:border-slate-300 transition">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Valor Mensal Ativo</p>
            <Banknote size={18} className="text-indigo-500 shrink-0" />
          </div>
          <div>
            <h3 className="text-xl font-black text-indigo-950 tracking-tight" title={formatCurrency(valorMensalAtivo)}>
              {formatCompactCurrency(valorMensalAtivo)}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500 truncate mt-0.5" title={formatCurrency(valorMensalAtivo)}>
              {formatCurrency(valorMensalAtivo)}
            </p>
          </div>
        </div>

        {/* Ativos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 flex flex-col justify-between border-b-4 border-b-emerald-500 hover:border-slate-300 transition">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ativos</p>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-800">{ativos}</h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {total > 0 ? Math.round((ativos / total) * 100) : 0}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Em execução regular</p>
        </div>

        {/* Suspensos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 flex flex-col justify-between border-b-4 border-b-amber-500 hover:border-slate-300 transition">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suspensos</p>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{suspensos}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Aguardando regularização</p>
        </div>

        {/* Encerrados */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4.5 flex flex-col justify-between border-b-4 border-b-rose-500 hover:border-slate-300 transition">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Encerrados</p>
            <XCircle size={18} className="text-rose-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{encerrados}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Vigência finalizada</p>
        </div>
      </div>

      {/* SEÇÃO 1: DECURSO DE PRAZO & AÇÕES JURÍDICO-ADMINISTRATIVAS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="text-[#003366]" size={20} />
              Decurso de Prazo & Gestão de Vencimento dos Contratos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoramento temporal de vigência e fundamentação jurídica para prorrogação (Art. 107 Lei 14.133/2021) ou apostilamento (Art. 136).
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-900">
            <Scale size={14} />
            Lei 14.133/2021 & Lei 8.666/1993
          </div>
        </div>

        {/* Grid de Faixas de Vencimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {graficoVencimento.map((item, idx) => {
            const count = parseInt(item.count, 10);
            const val = parseFloat(item.total_valor || '0');
            const isCritico = item.faixa_vencimento.includes('Crítico') || item.faixa_vencimento === 'Vencidos';
            const isAtencao = item.faixa_vencimento.includes('Atenção');
            const isPlan = item.faixa_vencimento.includes('Planejamento');

            return (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isCritico 
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300' 
                    : isAtencao 
                    ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300' 
                    : isPlan 
                    ? 'bg-blue-50/60 border-blue-200 hover:border-blue-300' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      isCritico ? 'bg-rose-100 text-rose-800' : isAtencao ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.faixa_vencimento}
                    </span>
                    <span className="text-lg font-black text-slate-800">{count}</span>
                  </div>

                  <p className="text-xs font-bold text-slate-700 mt-2">
                    Valor Representativo: <strong className="text-slate-900">{formatCompactCurrency(val)}</strong>
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-medium text-slate-600">
                  {isCritico && (
                    <span className="text-rose-700 font-bold block">
                      ⚠️ Ação recomendada: Providenciar Aditivo de Prorrogação de Vigência ou nova licitação urgente.
                    </span>
                  )}
                  {isAtencao && (
                    <span className="text-amber-800 font-bold block">
                      📌 Ação recomendada: Instaurar processo administrativo de prorrogação contratual.
                    </span>
                  )}
                  {isPlan && (
                    <span className="text-blue-800 block">
                      📋 Planejamento: Elaboração de Estudos Técnicos Preliminares (ETP).
                    </span>
                  )}
                  {!isCritico && !isAtencao && !isPlan && (
                    <span className="text-slate-500 block">
                      ✅ Execução regular.
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quadro Orientativo de Enquadramento Legal */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <h4 className="font-bold text-[#003366] flex items-center gap-1.5">
              <Scale size={14} />
              Prorrogação por Termo Aditivo (Art. 106/107 da Lei nº 14.133/2021)
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Contratos de <strong>serviços contínuos</strong> podem ser prorrogados sucessivamente até o limite de <strong>10 (dez) anos</strong>, desde que a autoridade ateste a vantajosidade econômica mantida e o fornecedor mantenha as condições de habilitação.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-[#003366] flex items-center gap-1.5">
              <FileText size={14} />
              Apostilamento x Aditivo (Art. 136 da Lei nº 14.133/2021)
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Cabe <strong>Apostilamento</strong> (sem necessidade de contrato social/termo aditivo formal) nos casos de: reajuste por índice formal (IPCA/IGP-M/FIPE), empenhamento de dotação orçamentária ou atualização de dados de cadastro.
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: MODALIDADES & TIPOS DE PRESTAÇÃO DE SERVIÇO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Modalidades de Contratação */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="text-[#003366]" size={18} />
              Separação por Modalidade de Contratação
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
              Procedimento Licitatório
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-64 pr-2">
            {graficoModalidade.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Sem modalidades registradas.</p>
            ) : (
              graficoModalidade.map((item) => {
                const count = parseInt(item.count, 10);
                const val = parseFloat(item.total_valor || '0');
                const widthPct = Math.max((count / maxModalidade) * 100, 6);
                return (
                  <div key={item.modalidade} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="font-bold text-slate-800">{item.modalidade}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">{formatCompactCurrency(val)}</span>
                        <span className="text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded">{count} contrato(s)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div 
                        className="bg-gradient-to-r from-[#003366] to-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tipo de Prestação de Serviço (Classificação por Objeto) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="text-[#003366]" size={18} />
              Tipo de Prestação de Serviço (Análise do Objeto)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
              Natureza do Objeto
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-64 pr-2">
            {graficoTipoServico.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Sem tipos de serviço categorizados.</p>
            ) : (
              graficoTipoServico.map((item) => {
                const count = parseInt(item.count, 10);
                const val = parseFloat(item.total_valor || '0');
                const widthPct = Math.max((count / maxTipoServico) * 100, 6);
                return (
                  <div key={item.tipo_servico} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="font-bold text-slate-800">{item.tipo_servico}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-normal">{formatCompactCurrency(val)}</span>
                        <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded">{count} contrato(s)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div 
                        className="bg-gradient-to-r from-emerald-700 to-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* SEÇÃO 3: EVOLUÇÃO TEMPORAL & REGIONAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Contratos por Ano */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-[#003366]" size={18} />
              Contratos por Ano de Início
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
              Evolução Temporal
            </span>
          </div>

          <div className="h-56 w-full pt-4 pb-2 px-4 flex items-end justify-around border-b border-slate-100 bg-slate-50/50 rounded-xl">
            {graficoAnos.length === 0 ? (
              <p className="text-xs text-slate-400 m-auto">Sem dados temporais registrados.</p>
            ) : (
              graficoAnos.map((item) => {
                const count = parseInt(item.count, 10);
                const heightPct = Math.max((count / maxAnos) * 100, 12);
                return (
                  <div key={item.ano} className="flex-1 max-w-[64px] h-full flex flex-col items-center justify-end group px-1">
                    {/* Rótulo com Quantidade */}
                    <span className="text-xs font-black text-[#003366] bg-white px-2 py-0.5 rounded-md shadow-2xs border border-blue-100 mb-1.5 transition-transform group-hover:scale-110">
                      {count}
                    </span>

                    {/* Barra Vertical */}
                    <div className="w-full bg-slate-200 rounded-t-lg h-full flex items-end p-0.5 overflow-hidden">
                      <div 
                        className="w-full bg-gradient-to-t from-[#003366] to-blue-600 rounded-t-md hover:to-blue-500 transition-all duration-300 shadow-sm"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    {/* Ano */}
                    <span className="text-xs font-bold text-slate-700 mt-2 tracking-tight">
                      {item.ano}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gráfico 2: Contratos por Regional / UF */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-[#003366]" size={18} />
              Distribuição por Regional / UF
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
              Por Localização
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-56 pr-2">
            {graficoUf.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Sem dados por UF registrados.</p>
            ) : (
              graficoUf.map((item) => {
                const count = parseInt(item.count, 10);
                const widthPct = Math.max((count / maxUf) * 100, 6);
                return (
                  <div key={item.uf} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span className="uppercase font-bold text-slate-800">
                        {item.uf === 'DF_SEDE' ? 'DF (Sede Central)' : item.uf === 'DF_SRTE' ? 'DF (Superintendência)' : item.uf}
                      </span>
                      <span className="text-blue-900 font-bold">{count} contrato(s)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                      <div 
                        className="bg-gradient-to-r from-[#003366] to-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Top 5 Fornecedores por Valor Global */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Award className="text-[#003366]" size={18} />
          Top 5 Maiores Empresas Fornecedoras (Por Valor Global)
        </h3>

        <div className="space-y-3">
          {topFornecedores.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Nenhum fornecedor registrado.</p>
          ) : (
            topFornecedores.map((f, idx) => {
              const val = parseFloat(f.total_valor || '0');
              const pct = Math.max((val / maxFornecedorValor) * 100, 5);
              return (
                <div key={idx} className="flex items-center gap-4 bg-slate-50/80 hover:bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 transition">
                  <div className="w-8 h-8 rounded-xl bg-[#003366] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    #{idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <p className="text-xs font-bold text-slate-800 truncate" title={f.empresa}>
                        {f.empresa}
                      </p>
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-xs font-black text-slate-900 block" title={formatCurrency(val)}>
                          {formatCompactCurrency(val)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block" title={formatCurrency(val)}>
                          {formatCurrency(val)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>{f.count} contrato(s)</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
