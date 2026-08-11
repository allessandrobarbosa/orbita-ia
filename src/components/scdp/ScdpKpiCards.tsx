import React from "react";

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
    { label: "Total Viagens Auditadas", value: metrics.totalCount.toString(), color: "text-[#003366]" },
    { label: "Despesa Total", value: formatCurrency(metrics.totalGasto), color: "text-[#003366]" },
    { label: "Valores a Restituir (SIAFI)", value: formatCurrency(metrics.totalDevolvido), color: metrics.totalDevolvido > 0 ? "text-rose-600" : "text-[#003366]" },
    { label: "Alertas Inadimplência", value: metrics.delayedAccounts.toString(), color: metrics.delayedAccounts > 0 ? "text-rose-600" : "text-slate-800" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-center transition hover:shadow-2xs">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">
            {kpi.label}
          </span>
          <span className={`text-xl font-black tracking-tight leading-none ${kpi.color}`}>
            {kpi.value}
          </span>
        </div>
      ))}
    </div>
  );
};
