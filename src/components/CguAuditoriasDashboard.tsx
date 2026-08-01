import React, { useState, useEffect } from "react";
import { 
  BarChart3, FileText, CheckCircle2, AlertCircle, 
  Clock, Calendar, Activity, Building2, ShieldAlert
} from "lucide-react";

interface DashboardData {
  total: number;
  comMonitoramento: number;
  semMonitoramento: number;
  statsDemandas: {
    total_recomendacoes: string;
    total_pendencias: string;
    total_concluidos: string;
    total_cancelados: string;
    total_analise_auditada: string;
    total_analise_auditoria: string;
  };
  graficoAnos: { ano: string; count: string }[];
  graficoTipos: { tipo_servico: string; count: string }[];
}

export default function CguAuditoriasDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/cgu/auditorias-dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Activity className="animate-spin mb-4" size={32} />
        <p>Carregando painel gerencial...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500">
        <AlertCircle className="mx-auto mb-2 text-slate-400" size={32} />
        <p>Não foi possível carregar os dados do painel.</p>
      </div>
    );
  }

  const { total, comMonitoramento, semMonitoramento, statsDemandas, graficoAnos, graficoTipos } = data;
  
  const recTotal = parseInt(statsDemandas?.total_recomendacoes || "0", 10);
  const recConcluidos = parseInt(statsDemandas?.total_concluidos || "0", 10);
  const recPendencias = parseInt(statsDemandas?.total_pendencias || "0", 10);
  const recCancelados = parseInt(statsDemandas?.total_cancelados || "0", 10);
  const recAnAuditada = parseInt(statsDemandas?.total_analise_auditada || "0", 10);
  const recAnAuditoria = parseInt(statsDemandas?.total_analise_auditoria || "0", 10);
  
  // Encontra o max para dimensionar as barras
  const maxAnos = Math.max(...graficoAnos.map(g => parseInt(g.count, 10)), 1);
  const maxTipos = Math.max(...graficoTipos.map(g => parseInt(g.count, 10)), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Card Total Recomendações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Total (Demandas)</p>
            <ShieldAlert size={16} className="text-slate-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">{recTotal}</h3>
        </div>

        {/* Card Concluídos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between border-b-4 border-b-emerald-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Concluídas</p>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800">{recConcluidos}</h3>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {recTotal > 0 ? Math.round((recConcluidos / recTotal) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Card Pendências */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between border-b-4 border-b-amber-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Pendentes</p>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800">{recPendencias}</h3>
          </div>
        </div>

        {/* Card Em Análise (Auditada) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between border-b-4 border-b-blue-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase" title="Em Análise pela Unidade Auditada">Em Análise (U.A.)</p>
            <Activity size={16} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800">{recAnAuditada}</h3>
          </div>
        </div>

        {/* Card Em Análise (Auditoria) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between border-b-4 border-b-purple-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase" title="Em Análise pela Unidade de Auditoria (CGU)">Em Análise (CGU)</p>
            <ShieldAlert size={16} className="text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800">{recAnAuditoria}</h3>
          </div>
        </div>

        {/* Card Cancelados */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 relative overflow-hidden flex flex-col justify-between border-b-4 border-b-rose-500">
          <div className="flex justify-between items-start mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">Canceladas</p>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-800">{recCancelados}</h3>
          </div>
        </div>

      </div>

      {/* Gráficos / Seções */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Evolução Anual */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-[#1351b4]" size={20} />
              Auditorias por Ano de Publicação
            </h3>
          </div>
          
          <div className="space-y-4">
            {graficoAnos.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
            ) : (
              graficoAnos.map((item, idx) => {
                const count = parseInt(item.count, 10);
                const percent = Math.round((count / maxAnos) * 100);
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{item.ano}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-[#1351b4] h-2.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gráfico 2: Top Tipos de Serviço */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="text-[#1351b4]" size={20} />
              Principais Tipos de Serviço Auditados
            </h3>
          </div>
          
          <div className="space-y-5">
            {graficoTipos.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
            ) : (
              graficoTipos.map((item, idx) => {
                const count = parseInt(item.count, 10);
                const percent = Math.round((count / maxTipos) * 100);
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-1/3 truncate text-sm font-medium text-slate-700" title={item.tipo_servico}>
                      {item.tipo_servico}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-sky-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-10 text-right text-sm text-slate-500 font-medium">
                      {count}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
