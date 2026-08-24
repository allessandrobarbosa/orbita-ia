import React from "react";
import { Plane, Wallet, ArrowDownRight, AlertOctagon } from "lucide-react";

interface Metrics {
  totalCount: number;
  totalGasto: number;
  totalDiarias: number;
  totalPassagens: number;
  totalDevolvido: number;
  totalRecebido: number;
  siafiDivergences: number;
  vinculoInconsistencies: number;
  agendaOverlaps: number;
  delayedAccounts: number;
}

interface ScdpKpiCardsProps {
  metrics: Metrics;
}

export const ScdpKpiCards: React.FC<ScdpKpiCardsProps> = ({ metrics }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val);
  };

  const kpis = [
    { 
      label: "Total Viagens Auditadas", 
      value: metrics.totalCount.toString(), 
      color: "text-[#003366]",
      bgGradient: "from-blue-50/30 to-slate-50/20",
      icon: <Plane className="w-5 h-5 text-blue-700 transform -rotate-45" />,
      iconBg: "bg-blue-50 border-blue-100/50"
    },
    { 
      label: "Despesa Total", 
      value: formatCurrency(metrics.totalGasto), 
      color: "text-[#003366]",
      bgGradient: "from-indigo-50/20 to-slate-50/20",
      icon: <Wallet className="w-5 h-5 text-indigo-700" />,
      iconBg: "bg-indigo-50 border-indigo-100/50"
    },
    { 
      label: "Valores a Restituir (SIAFI)", 
      value: formatCurrency(metrics.totalDevolvido), 
      color: metrics.totalDevolvido > 0 ? "text-rose-600" : "text-[#003366]",
      bgGradient: metrics.totalDevolvido > 0 ? "from-rose-50/30 to-white" : "from-slate-50/30 to-white",
      icon: <ArrowDownRight className={`w-5 h-5 ${metrics.totalDevolvido > 0 ? "text-rose-600" : "text-[#003366]"}`} />,
      iconBg: metrics.totalDevolvido > 0 ? "bg-rose-50 border-rose-100/50" : "bg-slate-50 border-slate-100/50"
    },
    { 
      label: "Alertas Inadimplência", 
      value: metrics.delayedAccounts.toString(), 
      color: metrics.delayedAccounts > 0 ? "text-amber-600" : "text-slate-800",
      bgGradient: metrics.delayedAccounts > 0 ? "from-amber-50/30 to-white" : "from-slate-50/30 to-white",
      icon: <AlertOctagon className={`w-5 h-5 ${metrics.delayedAccounts > 0 ? "text-amber-600 animate-pulse" : "text-slate-500"}`} />,
      iconBg: metrics.delayedAccounts > 0 ? "bg-amber-50 border-amber-100/50" : "bg-slate-50 border-slate-100/50"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <div 
          key={idx} 
          className={`bg-white bg-gradient-to-br ${kpi.bgGradient} border border-slate-200/60 rounded-2xl p-5 shadow-3xs flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xs`}
        >
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none mb-2">
              {kpi.label}
            </span>
            <span className={`text-lg sm:text-xl font-black tracking-tight leading-none ${kpi.color}`}>
              {kpi.value}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-3xs ${kpi.iconBg}`}>
            {kpi.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
