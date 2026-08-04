/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  BarChart3, Activity, Database, MessageSquare, FileWarning,
  FileText, Merge, DollarSign, Download, Clock, CheckCircle2,
  AlertTriangle, Check, AlertCircle, Landmark, LayoutGrid, Scale,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { AcordaoDemand, ComunicacaoDemand, TceDemand, TceAcordaoMapping } from "../types";

interface TcuPainelGerencialProps {
  acordaos: AcordaoDemand[];
  comunicacoes?: ComunicacaoDemand[];
  tces?: TceDemand[];
  tceMappings?: TceAcordaoMapping[];
}

// ─── MetricPill ───────────────────────────────────────────────────────────────

function MetricPill({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl border ${color} shrink-0`}>
      <span className="text-base font-black leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-wider font-bold opacity-70 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── YearTabs ─────────────────────────────────────────────────────────────────

function YearTabs({ value, onChange, years }: { value: string; onChange: (y: string) => void; years: number[] }) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => onChange("TODOS")}
        className={`px-3.5 py-1.5 text-[11px] font-bold tracking-wide whitespace-nowrap rounded-full transition-all duration-200 ${
          value === "TODOS"
            ? "bg-[#003366] text-white shadow-sm shadow-blue-900/20"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        }`}
      >
        TODOS OS ANOS
      </button>
      {years.map(yr => (
        <button
          key={yr}
          onClick={() => onChange(yr.toString())}
          className={`px-3.5 py-1.5 text-[11px] font-bold tracking-wide whitespace-nowrap rounded-full transition-all duration-200 ${
            value === yr.toString()
              ? "bg-[#003366] text-white shadow-sm shadow-blue-900/20"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          }`}
        >
          ANO {yr}{yr === currentYear && <span className="bg-emerald-400/30 text-emerald-900 text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1">Ativo</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Monitoramento: normalizer & categories ───────────────────────────────────

const normalizeProcessType = (raw: string): string => {
  const norm = (raw || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes("MONITORAMENTO E OUTROS")) return "MONITORAMENTO E OUTROS";
  if (norm.includes("RELATORIO DE ACOMPANHAMENTO")) return "RELATÓRIO DE ACOMPANHAMENTO";
  if (norm.includes("RELATORIO DE AUDITORIA") || norm.includes("AUDITORIA") || norm === "RA") return "RELATÓRIO DE AUDITORIA";
  if (norm.includes("ACOMPANHAMENTO") || norm === "ACOMP") return "ACOMPANHAMENTO";
  if (norm.includes("MONITORAMENTO") || norm === "MONIT" || norm === "MON") return "MONITORAMENTO";
  if (norm.includes("TOMADA DE CONTAS ESPECIAL") || norm === "TCE" || norm.includes("TOMADA DE CONTAS")) return "TOMADA DE CONTAS ESPECIAL";
  if (norm.includes("JULGAMENTO DE TCE") || norm.includes("JULGAMENTO DE TC")) return "JULGAMENTO DE TCE";
  if (norm.includes("REPRESENTACAO") || norm === "REPR") return "REPRESENTAÇÃO";
  if (norm.includes("DENUNCIA") || norm === "DEN") return "DENÚNCIAS";
  if (norm.includes("CONGRESSO") || norm === "SCN" || norm.includes("SOLICITACOES")) return "SOLICITAÇÕES DO CONGRESSO NACIONAL";
  return "E OUTROS";
};

const standardCategories = [
  { id: "ACOMPANHAMENTO", label: "Acompanhamento", short: "ACOMP", icon: Database, colorClass: "bg-blue-50/70 border-blue-100 text-blue-800", textClass: "text-[#003366] border-l-4 border-blue-500" },
  { id: "MONITORAMENTO", label: "Monitoramento", short: "MONIT", icon: Clock, colorClass: "bg-teal-50/70 border-teal-100 text-teal-800", textClass: "text-teal-950 border-l-4 border-teal-500" },
  { id: "RELATÓRIO DE AUDITORIA", label: "Relatório de Auditoria", short: "RA / AUDIT", icon: BarChart3, colorClass: "bg-amber-50/70 border-amber-100 text-amber-800", textClass: "text-amber-950 border-l-4 border-amber-500" },
  { id: "RELATÓRIO DE ACOMPANHAMENTO", label: "Relatório de Acompanhamento", short: "REL-ACOMP", icon: FileText, colorClass: "bg-indigo-50/70 border-indigo-100 text-indigo-800", textClass: "text-indigo-950 border-l-4 border-indigo-500" },
  { id: "MONITORAMENTO E OUTROS", label: "Monitoramento e Outros", short: "MON-OUT", icon: Activity, colorClass: "bg-cyan-50/70 border-cyan-100 text-cyan-800", textClass: "text-cyan-950 border-l-4 border-cyan-500" },
  { id: "TOMADA DE CONTAS ESPECIAL", label: "Tomada de Contas Especial", short: "TCE", icon: DollarSign, colorClass: "bg-rose-50/70 border-rose-100 text-rose-800", textClass: "text-rose-950 border-l-4 border-rose-500" },
  { id: "REPRESENTAÇÃO", label: "Representação", short: "REPR", icon: FileText, colorClass: "bg-sky-50/70 border-sky-100 text-sky-800", textClass: "text-sky-950 border-l-4 border-sky-500" },
  { id: "JULGAMENTO DE TCE", label: "Julgamento de TCE", short: "JULG-TCE", icon: Scale, colorClass: "bg-violet-50/70 border-violet-100 text-violet-800", textClass: "text-violet-950 border-l-4 border-violet-500" },
  { id: "DENÚNCIAS", label: "Denúncias", short: "DEN", icon: AlertCircle, colorClass: "bg-red-50/70 border-red-100 text-red-800", textClass: "text-red-950 border-l-4 border-red-500" },
  { id: "SOLICITAÇÕES DO CONGRESSO NACIONAL", label: "Solicitações do Congresso Nacional", short: "SCN", icon: Landmark, colorClass: "bg-emerald-50/70 border-emerald-100 text-emerald-800", textClass: "text-emerald-950 border-l-4 border-emerald-500" },
  { id: "E OUTROS", label: "E Outros", short: "OUTROS", icon: LayoutGrid, colorClass: "bg-slate-50 border-slate-200 text-slate-700", textClass: "text-slate-700 border-l-4 border-slate-300" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TcuPainelGerencial({
  acordaos,
  comunicacoes = [],
  tces = [],
  tceMappings = [],
}: TcuPainelGerencialProps) {

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ monitoramento: false, comunicacoes: false, tce: false });
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const [monAnoFilter, setMonAnoFilter] = useState("TODOS");
  const [comAnoFilter, setComAnoFilter] = useState("TODOS");
  const [tceAnoFilter, setTceAnoFilter] = useState("TODOS");

  // ── Monitoramento ───────────────────────────────────────────────────────────

  const monAvailableYears = useMemo(() =>
    Array.from(new Set(acordaos.map(a => a.ANOACORDAO).filter(Boolean))).sort((a, b) => Number(b) - Number(a)) as number[],
    [acordaos]);

  const acordaosForYear = useMemo(() =>
    monAnoFilter === "TODOS" ? acordaos : acordaos.filter(a => a.ANOACORDAO?.toString() === monAnoFilter),
    [acordaos, monAnoFilter]);

  const monCumpridos = useMemo(() => acordaosForYear.filter(a => a.STATUS_MONITORAMENTO === "Cumprido").length, [acordaosForYear]);
  const monAtrasados = useMemo(() => acordaosForYear.filter(a =>
    a.STATUS_MONITORAMENTO === "Atrasado" || (a.STATUS_MONITORAMENTO !== "Cumprido" && a.PRAZO_LIMITE && new Date(a.PRAZO_LIMITE).getTime() < Date.now())
  ).length, [acordaosForYear]);
  const monEmAnalise = useMemo(() => acordaosForYear.filter(a =>
    a.STATUS_MONITORAMENTO === "Em Análise" || a.STATUS_MONITORAMENTO === "Pendente" || !a.STATUS_MONITORAMENTO
  ).length, [acordaosForYear]);

  const monCounts = useMemo(() => {
    const c: Record<string, number> = {};
    standardCategories.forEach(cat => { c[cat.id] = 0; });
    acordaosForYear.forEach(ac => { const n = normalizeProcessType(ac.TIPOPROCESSO || ""); c[n] = (c[n] || 0) + 1; });
    return c;
  }, [acordaosForYear]);

  // ── Comunicacoes ────────────────────────────────────────────────────────────

  const comAvailableYears = useMemo(() =>
    Array.from(new Set(comunicacoes.map(c => c.ANO).filter(Boolean))).sort((a, b) => Number(b) - Number(a)) as number[],
    [comunicacoes]);

  const comsForYear = useMemo(() =>
    comAnoFilter === "TODOS" ? comunicacoes : comunicacoes.filter(c => c.ANO?.toString() === comAnoFilter),
    [comunicacoes, comAnoFilter]);

  const totalComsCount = comsForYear.length;
  const comRespondidos = useMemo(() => comsForYear.filter(c => c.DATA_RESPOSTA && c.DATA_RESPOSTA.trim() !== "").length, [comsForYear]);
  const comPendentes = useMemo(() => comsForYear.filter(c => {
    const carece = c.CARECE_RESPOSTA !== false;
    return carece && !(c.DATA_RESPOSTA && c.DATA_RESPOSTA.trim() !== "");
  }).length, [comsForYear]);
  const comResponseRate = totalComsCount > 0 ? ((comRespondidos / totalComsCount) * 100).toFixed(1) : "0.0";

  const destinatarioStats = useMemo(() => {
    const statsMap: { [key: string]: { total: number; responded: number; pending: number; requireResponseTotal: number } } = {};
    comsForYear.forEach(com => {
      const dest = com.DESTINATARIO || "Geral / Não Especificado";
      if (!statsMap[dest]) statsMap[dest] = { total: 0, responded: 0, pending: 0, requireResponseTotal: 0 };
      const carece = com.CARECE_RESPOSTA !== false;
      statsMap[dest].total++;
      if (carece) {
        statsMap[dest].requireResponseTotal++;
        if (com.DATA_RESPOSTA && com.DATA_RESPOSTA.trim() !== "") statsMap[dest].responded++;
        else statsMap[dest].pending++;
      }
    });
    return Object.entries(statsMap).map(([dest, info]) => ({
      unidade: dest, total: info.total, requireResponseTotal: info.requireResponseTotal,
      responded: info.responded, pending: info.pending,
      percentage: totalComsCount > 0 ? (info.total / totalComsCount) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [comsForYear, totalComsCount]);

  // ── TCEs ────────────────────────────────────────────────────────────────────

  /** Same logic as extractYearFromTceString in TcuTCE.tsx */
  const extractTceYear = (str: string | undefined | null): number => {
    if (!str) return 0;
    const clean = str.trim();
    // 1. Year right after separator (/, |, -, \)
    const sepMatch = clean.match(/[/|\\-]\s*(\d{4})\b/);
    if (sepMatch) {
      const yr = parseInt(sepMatch[1]);
      if (yr >= 1990 && yr <= 2035) return yr;
    }
    // 2. Fallback: scan 4-digit groups right-to-left
    const all = clean.match(/\d{4}/g);
    if (all) {
      for (let i = all.length - 1; i >= 0; i--) {
        const yr = parseInt(all[i]);
        if (yr >= 1990 && yr <= 2035) return yr;
      }
    }
    return 0;
  };

  const tceAvailableYears = useMemo(() => {
    const years = new Set<number>();
    tces.forEach(t => { const yr = extractTceYear(t.NUMERO_ANO_TCE); if (yr) years.add(yr); });
    tceMappings.forEach(m => { const yr = extractTceYear(m.NUMERO_ANO_TCE); if (yr) years.add(yr); });
    return Array.from(years).sort((a, b) => b - a);
  }, [tces, tceMappings]);

  const tcesForYear = useMemo(() =>
    tceAnoFilter === "TODOS" ? tces : tces.filter(t => extractTceYear(t.NUMERO_ANO_TCE).toString() === tceAnoFilter),
    [tces, tceAnoFilter]);

  const tceMappingsForYear = useMemo(() =>
    tceAnoFilter === "TODOS" ? tceMappings : tceMappings.filter(m => extractTceYear(m.NUMERO_ANO_TCE).toString() === tceAnoFilter),
    [tceMappings, tceAnoFilter]);


  const mapeadasKeys = useMemo(() => new Set(tceMappingsForYear.map(m => m.NUMERO_ANO_TCE)), [tceMappingsForYear]);
  const tceLinkedCount = useMemo(() => tceMappingsForYear.filter(m => m.ACORDAO_KEY).length, [tceMappingsForYear]);
  const tcePendingCount = useMemo(() => tcesForYear.filter(t => !mapeadasKeys.has(t.NUMERO_ANO_TCE)).length, [tcesForYear, mapeadasKeys]);
  const formattedDebito = useMemo(() => {
    let total = 0;
    tcesForYear.forEach(t => {
      const raw = ((t as any).DEBITO_ATUALIZADO || "").replace(/[^0-9,.]/g, "").replace(/\./g, "").replace(",", ".");
      const v = parseFloat(raw); if (!isNaN(v)) total += v;
    });
    return total > 0 ? total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00";
  }, [tcesForYear]);

  // ── CSV Downloads ────────────────────────────────────────────────────────────

  const csvDownload = (csv: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleExportMonitoramento = () => {
    let csv = "Tipo de Processo;Total;Percentual\n";
    standardCategories.forEach(cat => {
      const qtd = monCounts[cat.id] || 0;
      csv += `"${cat.label}";${qtd};${acordaosForYear.length > 0 ? ((qtd / acordaosForYear.length) * 100).toFixed(1) : "0.0"}%\n`;
    });
    csv += `\nTOTAL;${acordaosForYear.length};100%\n\nStatus;Quantidade\nCumpridos;${monCumpridos}\nEm Analise;${monEmAnalise}\nEm Atraso;${monAtrasados}\n`;
    csvDownload(csv, `Painel_Monitoramento_${monAnoFilter}.csv`);
  };

  const handleExportComunicacoes = () => {
    let csv = "Destinatario;Total;Requer Resposta;Respondidos;Pendentes;% Participacao\n";
    destinatarioStats.forEach(s => {
      csv += `"${s.unidade}";${s.total};${s.requireResponseTotal};${s.responded};${s.pending};${s.percentage.toFixed(1)}%\n`;
    });
    csvDownload(csv, `Painel_Comunicacoes_${comAnoFilter}.csv`);
  };

  const handleExportTCE = () => {
    let csv = "Numero TCE;Acordao Relacionado;Debito Atualizado\n";
    tcesForYear.forEach(t => {
      const mapping = tceMappingsForYear.find(m => m.NUMERO_ANO_TCE === t.NUMERO_ANO_TCE);
      csv += `"${t.NUMERO_ANO_TCE}";"${mapping?.ACORDAO_KEY || "Sem vinculo"}";"${(t as any).DEBITO_ATUALIZADO || ""}"\n`;
    });
    csvDownload(csv, `Painel_TCE_${tceAnoFilter}.csv`);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Page header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003366] to-[#004080] flex items-center justify-center shadow-md">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">Painel Gerencial — TCU</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Volumetria e indicadores consolidados de todos os sub-modulos</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />Dados em tempo real
        </div>
      </div>

      {/* ═════════════════════════ MONITORAMENTO ═════════════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-[#003366] to-[#004080] text-white px-5 py-4 flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><Database className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-[140px]">
            <h2 className="text-sm font-black uppercase tracking-wide leading-none">Monitoramento</h2>
            <p className="text-[10px] text-white/70 mt-0.5">Acordaos e deliberacoes do TCU</p>
          </div>
          <div className="hidden md:flex items-center gap-2 mr-2">
            <MetricPill value={acordaos.length} label="Total" color="bg-white/10 border-white/20 text-white" />
            <MetricPill value={acordaos.filter(a => a.STATUS_MONITORAMENTO === "Cumprido").length} label="Cumpridos" color="bg-emerald-500/20 border-emerald-300/30 text-white" />
            <MetricPill value={acordaos.filter(a => a.STATUS_MONITORAMENTO === "Atrasado" || (a.STATUS_MONITORAMENTO !== "Cumprido" && a.PRAZO_LIMITE && new Date(a.PRAZO_LIMITE).getTime() < Date.now())).length} label="Em Atraso" color="bg-rose-500/20 border-rose-300/30 text-white" />
          </div>
          <button onClick={() => toggle("monitoramento")} className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all border border-white/20 hover:border-white/40 whitespace-nowrap">
            {expanded.monitoramento ? <><ChevronUp className="w-3.5 h-3.5" />Recolher</> : <><ChevronDown className="w-3.5 h-3.5" />Detalhamento</>}
          </button>
        </div>

        {expanded.monitoramento && (
          <div className="p-5 space-y-4 bg-white border-t border-slate-200">
            <YearTabs value={monAnoFilter} onChange={setMonAnoFilter} years={monAvailableYears} />

            {/* KPI status cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total de Acordaos", value: acordaosForYear.length, sub: monAnoFilter === "TODOS" ? "Historico completo" : `Ano ${monAnoFilter}`, color: "text-slate-900", bg: "bg-blue-50 text-[#003366]", Icon: Database },
                { label: "Cumpridos", value: monCumpridos, sub: "Status: Cumprido", color: "text-emerald-700", bg: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
                { label: "Em Analise / Pendentes", value: monEmAnalise, sub: "Aguardando resolucao", color: "text-amber-700", bg: "bg-amber-50 text-amber-700", Icon: Clock },
                { label: "Em Atraso", value: monAtrasados, sub: "Prazo vencido", color: "text-rose-700", bg: "bg-rose-50 text-rose-700", Icon: AlertTriangle },
              ].map(({ label, value, sub, color, bg, Icon }) => (
                <div key={label} className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate block">{label}</span>
                    <h4 className={`text-2xl font-black truncate ${color}`}>{value}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{sub}</p>
                  </div>
                  <div className={`p-3 rounded-xl shrink-0 ml-2 ${bg}`}><Icon className="w-5 h-5" /></div>
                </div>
              ))}
            </div>

            {/* Bento grid — exact same layout as TcuMonitoramento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Volumetria por Tipo de Processo ({monAnoFilter})</span>
                <span className="text-xs text-slate-500 font-semibold">{acordaosForYear.length} Acórdãos Filtrados</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {standardCategories.map(cat => {
                  const Icon = cat.icon;
                  const countValue = monCounts[cat.id] || 0;
                  return (
                    <div key={cat.id} className={`bg-white border rounded-xl p-3 flex flex-col justify-between shadow-3xs hover:shadow-xs transition-all duration-200 cursor-default group relative overflow-hidden ${cat.textClass}`}>
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-500 break-words whitespace-normal group-hover:text-slate-800 transition-colors">{cat.label}</span>
                          <span className="text-xs font-black tracking-wider text-slate-400 uppercase">{cat.short}</span>
                        </div>
                        <div className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-105 duration-200 ${cat.colorClass}`}><Icon className="w-4 h-4" /></div>
                      </div>
                      <div className="flex items-baseline justify-between mt-auto">
                        <h4 className="text-xl font-black text-slate-950">{countValue}</h4>
                        <span className="text-[8px] text-slate-400 font-bold">{acordaosForYear.length > 0 ? `${((countValue / acordaosForYear.length) * 100).toFixed(0)}%` : "0%"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleExportMonitoramento} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                <Download className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═════════════════════════ COMUNICACOES ═════════════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-[#1351b4] to-[#1a64df] text-white px-5 py-4 flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><MessageSquare className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-[140px]">
            <h2 className="text-sm font-black uppercase tracking-wide leading-none">Comunicacoes</h2>
            <p className="text-[10px] text-white/70 mt-0.5">Oficios e Notificacoes do TCU</p>
          </div>
          <div className="hidden md:flex items-center gap-2 mr-2">
            <MetricPill value={comunicacoes.length} label="Total" color="bg-white/10 border-white/20 text-white" />
            <MetricPill value={comunicacoes.filter(c => c.DATA_RESPOSTA && c.DATA_RESPOSTA.trim() !== "").length} label="Respondidos" color="bg-emerald-500/20 border-emerald-300/30 text-white" />
            <MetricPill value={comunicacoes.filter(c => c.CARECE_RESPOSTA !== false && !(c.DATA_RESPOSTA && c.DATA_RESPOSTA.trim() !== "")).length} label="Pendentes" color="bg-amber-400/20 border-amber-300/30 text-white" />
          </div>
          <button onClick={() => toggle("comunicacoes")} className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all border border-white/20 hover:border-white/40 whitespace-nowrap">
            {expanded.comunicacoes ? <><ChevronUp className="w-3.5 h-3.5" />Recolher</> : <><ChevronDown className="w-3.5 h-3.5" />Detalhamento</>}
          </button>
        </div>

        {expanded.comunicacoes && (
          <div className="bg-white border-t border-slate-200">

            {/* Sub-tab selector */}
            <div className="px-5 pt-4 flex items-center gap-0 border-b border-slate-200">
              <button
                onClick={() => setExpanded(prev => ({ ...prev, comTab: "volumetria" as any }))}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wide rounded-t-lg -mb-px transition ${
                  (expanded as any).comTab !== "estatisticas"
                    ? "border border-b-0 border-slate-200 bg-white text-[#1351b4]"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Volumetria
              </button>
              <button
                onClick={() => setExpanded(prev => ({ ...prev, comTab: "estatisticas" as any }))}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wide rounded-t-lg -mb-px transition ${
                  (expanded as any).comTab === "estatisticas"
                    ? "border border-b-0 border-slate-200 bg-white text-[#1351b4]"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Estatísticas por Destinatário
              </button>
            </div>

            <div className="p-5 space-y-4">
              <YearTabs value={comAnoFilter} onChange={setComAnoFilter} years={comAvailableYears} />

              {/* TAB: VOLUMETRIA */}
              {(expanded as any).comTab !== "estatisticas" && (
                <div className="space-y-4">
                  {/* KPI row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Universo de Ofícios</span><h4 className="text-2xl font-black text-slate-900">{totalComsCount}</h4><p className="text-xs text-slate-500">Mapeados {comAnoFilter === "TODOS" ? "(Histórico Total)" : `no ano ${comAnoFilter}`}</p></div>
                      <div className="p-3 bg-blue-50 text-[#003366] rounded-xl"><MessageSquare className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/30 transition">
                      <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Respondidos</span><h4 className="text-2xl font-black text-emerald-700">{comRespondidos}</h4><p className="text-xs text-emerald-600 font-semibold">Ofícios com resposta salva</p></div>
                      <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl"><Check className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs hover:border-amber-300 hover:bg-amber-50/50 transition group">
                      <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider group-hover:text-amber-700 transition">Resposta Pendente</span><h4 className="text-2xl font-black text-amber-600 inline-flex items-center gap-1.5">{comPendentes}{comPendentes > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />}</h4><p className="text-xs text-slate-500">Aguardando instrução</p></div>
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition"><Clock className="w-6 h-6" /></div>
                    </div>
                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div className="space-y-1"><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Índice de Resposta</span><h4 className="text-2xl font-black text-slate-900">{comResponseRate}%</h4><div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${comResponseRate}%` }} /></div></div>
                      <div className="p-3 bg-slate-50 text-slate-700 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleExportComunicacoes} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                      <Download className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: ESTATISTICAS */}
              {(expanded as any).comTab === "estatisticas" && (
                <div className="space-y-6">
                  {/* Grid de cards por destinatario */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider">Volume Total de Comunicações por Unidades (Destinatários)</h3>
                    <div className="max-h-[500px] overflow-y-auto pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                        {destinatarioStats.map((stat, idx) => {
                          const respRate = stat.requireResponseTotal > 0 ? ((stat.responded / stat.requireResponseTotal) * 100).toFixed(0) : (stat.total > 0 ? "100" : "0");
                          return (
                            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-3 relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center translate-x-3 -translate-y-3">
                                <span className="text-sm font-black text-slate-300">#{idx + 1}</span>
                              </div>
                              <div className="space-y-0.5 pr-4">
                                <span className="bg-slate-100 text-slate-600 text-xs font-black px-1.5 py-0.5 rounded uppercase block truncate" title={stat.unidade}>{stat.unidade}</span>
                                <h4 className="text-2xl font-black text-slate-900">{stat.total} <span className="text-xs font-normal text-slate-400">ofícios ({stat.percentage.toFixed(1)}%)</span></h4>
                              </div>
                              <div className="grid grid-cols-2 text-xs text-slate-500 border-t border-slate-100 pt-2">
                                <div className="text-emerald-700 font-bold">✓ {stat.responded} Respondidos</div>
                                <div className="border-l border-slate-100 pl-2 text-amber-700 font-bold">⚡ {stat.pending} Pendentes</div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-slate-400 font-bold uppercase"><span>Índice de Resposta</span><span>{respRate}%</span></div>
                                <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${respRate}%` }} /></div>
                              </div>
                            </div>
                          );
                        })}
                        {destinatarioStats.length === 0 && (
                          <div className="col-span-4 p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">Aguardando sincronização de dados.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pareto table */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="text-sm font-black text-[#003366] uppercase tracking-wide">Impacto por Destinatário & Participação Relativa</h4>
                        <p className="text-sm text-slate-500">Fórmula de Pareto: Ofícios Recebidos por unidade em relação ao total {comAnoFilter === "TODOS" ? "de todos os anos" : `do ano ${comAnoFilter}`} ({totalComsCount} ofícios).</p>
                      </div>
                      <span className="text-xs font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">Unidades Ativas: {destinatarioStats.length}</span>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-sm text-slate-800">
                        <thead>
                          <tr className="sticky top-0 z-10 bg-[#003366] text-white">
                            <th className="p-4 font-semibold">Unidade do Ministério do Trabalho (Destinatário)</th>
                            <th className="p-4 font-semibold w-[130px]">Ofícios Recebidos</th>
                            <th className="p-4 font-semibold w-[130px]">Demandam Resposta</th>
                            <th className="p-4 font-semibold w-[130px]">Respondidos</th>
                            <th className="p-4 font-semibold w-[130px]">Pendentes (Em Aberto)</th>
                            <th className="p-4 font-semibold w-[200px]">% de Representação no Órgão</th>
                            <th className="p-4 font-semibold w-[130px]">Índice de Conclusão</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {destinatarioStats.map((stat, idx) => {
                            const respPct = stat.requireResponseTotal > 0 ? (stat.responded / stat.requireResponseTotal) * 100 : (stat.total > 0 ? 100 : 0);
                            return (
                              <tr key={idx} className="hover:bg-[#1351b4]/5 transition-colors">
                                <td className="p-4 align-middle font-black flex items-center gap-2 text-sm">
                                  <span className="w-5 h-5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                  <span>{stat.unidade}</span>
                                </td>
                                <td className="p-4 align-middle text-center font-bold">{stat.total}</td>
                                <td className="p-4 align-middle text-center font-bold text-slate-600">{stat.requireResponseTotal}</td>
                                <td className="p-4 align-middle text-center font-bold text-emerald-700">{stat.responded}</td>
                                <td className="p-4 align-middle text-center font-bold text-amber-700">{stat.pending}</td>
                                <td className="p-4 align-middle">
                                  <div className="space-y-1 max-w-[180px] mx-auto">
                                    <div className="text-xs font-bold text-slate-700">{stat.percentage.toFixed(1)}%</div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#003366] rounded-full" style={{ width: `${stat.percentage}%` }} /></div>
                                  </div>
                                </td>
                                <td className="p-4 align-middle text-center">
                                  <span className={`px-2.5 py-1 rounded-sm font-bold text-xs ${respPct >= 90 ? "bg-emerald-100 border border-emerald-200 text-emerald-800" : respPct >= 50 ? "bg-amber-100 border border-amber-200 text-amber-800" : "bg-rose-100 border border-rose-200 text-rose-800"}`}>
                                    {respPct.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {destinatarioStats.length === 0 && (
                            <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">Sem dados acumulados para este filtro de período.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleExportComunicacoes} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                      <Download className="w-4 h-4" /> Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ═════════════════════════ TCEs ═════════════════════════ */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-rose-700 to-rose-600 text-white px-5 py-4 flex items-center gap-3 flex-wrap">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><FileWarning className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-[140px]">
            <h2 className="text-sm font-black uppercase tracking-wide leading-none">Tomadas de Contas Especiais (TCEs)</h2>
            <p className="text-[10px] text-white/70 mt-0.5">Apuracao de danos ao Erario</p>
          </div>
          <div className="hidden md:flex items-center gap-2 mr-2">
            <MetricPill value={tces.length} label="Total" color="bg-white/10 border-white/20 text-white" />
            <MetricPill value={tceMappings.filter(m => m.ACORDAO_KEY).length} label="Vinculadas" color="bg-emerald-500/20 border-emerald-300/30 text-white" />
            <MetricPill value={tces.filter(t => !new Set(tceMappings.map(m => m.NUMERO_ANO_TCE)).has(t.NUMERO_ANO_TCE)).length} label="Sem Vínculo" color="bg-red-900/30 border-red-300/30 text-white" />
          </div>
          <button onClick={() => toggle("tce")} className="flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold transition-all border border-white/20 hover:border-white/40 whitespace-nowrap">
            {expanded.tce ? <><ChevronUp className="w-3.5 h-3.5" />Recolher</> : <><ChevronDown className="w-3.5 h-3.5" />Detalhamento</>}
          </button>
        </div>

        {expanded.tce && (
          <div className="p-5 space-y-4 bg-white border-t border-slate-200">
            <YearTabs value={tceAnoFilter} onChange={setTceAnoFilter} years={tceAvailableYears} />

            {/* KPI cards — exact same style as original TcuTCE KPI block */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0"><span className="text-xs font-black uppercase text-slate-400 tracking-wider truncate block">Universo de TCE</span><h4 className="text-2xl font-black text-slate-900 truncate">{tcesForYear.length}</h4><p className="text-xs text-slate-500 truncate">Instâncias {tceAnoFilter === "TODOS" ? "(Histórico Total)" : `no ano ${tceAnoFilter}`}</p></div>
                <div className="p-3 bg-blue-50 text-[#003366] rounded-xl shrink-0 ml-2"><FileText className="w-6 h-6" /></div>
              </div>
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0"><span className="text-xs font-black uppercase text-slate-400 tracking-wider truncate block">Débito Atualizado</span><h4 className="text-xl font-black text-slate-900 truncate" title={formattedDebito}>{formattedDebito}</h4><p className="text-xs text-slate-500 truncate">Montante acumulado no período</p></div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0 ml-2"><DollarSign className="w-6 h-6" /></div>
              </div>
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0"><span className="text-xs font-black uppercase text-slate-400 tracking-wider truncate block">TCEs COM ACÓRDÃOS VINCULADOS</span><h4 className="text-2xl font-black text-emerald-700 truncate">{tceLinkedCount}</h4><p className="text-xs text-emerald-600 font-semibold truncate">Vínculo com Acórdãos bem-sucedido</p></div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0 ml-2"><Merge className="w-6 h-6" /></div>
              </div>
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0"><span className="text-xs font-black uppercase text-slate-400 tracking-wider truncate block">TCEs SEM ACÓRDÃOS VINCULADOS</span><h4 className="text-2xl font-black text-rose-700 inline-flex items-center gap-1.5 animate-pulse truncate w-full">{tcePendingCount}</h4><p className="text-xs text-rose-600 font-semibold truncate">Aguardando vínculo</p></div>
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl shrink-0 ml-2"><FileWarning className="w-6 h-6" /></div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleExportTCE} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl shadow-sm transition">
                <Download className="w-4 h-4" /> Excel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
