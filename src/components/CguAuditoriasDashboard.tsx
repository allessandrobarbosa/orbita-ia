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
  
  // Encontra o max para dimensionar as barras
  const maxAnos = Math.max(...graficoAnos.map(g => parseInt(g.count, 10)), 1);
  const maxTipos = Math.max(...graficoTipos.map(g => parseInt(g.count, 10)), 1);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card Total Auditorias */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#1351b4]/5 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total de Auditorias</p>
              <h3 className="text-3xl font-bold text-slate-800">{total}</h3>
            </div>
            <div className="p-3 bg-[#1351b4]/10 rounded-xl text-[#1351b4]">
              <FileText size={24} />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              <span>{comMonitoramento}</span> monitoradas
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded">
              <span>{semMonitoramento}</span> aguardando
            </div>
          </div>
        </div>

        {/* Card Total Recomendações */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total de Itens (Demandas)</p>
              <h3 className="text-3xl font-bold text-slate-800">{recTotal}</h3>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
              <ShieldAlert size={24} />
            </div>
          </div>
        </div>

        {/* Card Concluídos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Itens Concluídos</p>
              <h3 className="text-3xl font-bold text-slate-800">{recConcluidos}</h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <div className="mt-4 text-xs font-medium text-emerald-600">
            {recTotal > 0 ? Math.round((recConcluidos / recTotal) * 100) : 0}% de taxa de atendimento
          </div>
        </div>

        {/* Card Pendências */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-8 -mt-8"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total de Pendências</p>
              <h3 className="text-3xl font-bold text-slate-800">{recPendencias}</h3>
            </div>
            <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
              <AlertCircle size={24} />
            </div>
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
