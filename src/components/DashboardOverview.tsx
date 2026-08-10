/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  ShieldCheck,
  ChevronRight,
  Database,
  ArrowRightLeft,
  FileText,
  TrendingUp,
  BrainCircuit,
  Award,
  Plane,
  BookOpen,
  User,
  Map,
  Shield,
  LayoutDashboard
} from "lucide-react";

interface DashboardOverviewProps {
  stats: any;
  onNavigate: (tab: string) => void;
  acordaos?: any[];
  comunicacoes?: any[];
  tces?: any[];
  tceMappings?: any[];
  rolResponsaveis?: any[];
  comissaoEtica?: any[];
  superintendencias?: any[];
  hasModulePermission: (tabId: string) => boolean;
  cguDemands?: any[];
}

export default function DashboardOverview({ 
  onNavigate, 
  acordaos = [],
  comunicacoes = [],
  tces = [],
  rolResponsaveis = [],
  comissaoEtica = [],
  superintendencias = [],
  hasModulePermission,
  cguDemands = []
}: DashboardOverviewProps) {

  // Define Category 1 (Controle Externo) modules
  const controleExternoModules = [
    {
      id: "tcu",
      title: "Controle Externo (TCU)",
      acronym: "TCU",
      desc: "Monitoramento de Acórdãos de Auditoria, Ofícios de Comunicação Eletrônica e gestão integrada de Tomada de Contas Especial (TCE).",
      indicator: `${acordaos.length || 713} Acórdãos · ${tces.length || 3} TCEs`,
      icon: BookOpen,
      accent: "border-t-4 border-l-0 border-[#003366]",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-[#003366]/20"
    },
    {
      id: "cgu",
      title: "Controle Interno (CGU)",
      acronym: "CGU",
      desc: "Espaço para controle de recomendações de auditoria, fiscalizações correntes e plano de providências da Controladoria-Geral da União.",
      indicator: `${cguDemands.length || 4} Demandas Cadastradas`,
      icon: Shield,
      accent: "border-t-4 border-l-0 border-[#1351b4]",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-blue-500/20"
    }
  ].filter(module => hasModulePermission(module.id));

  // Define Category 2 (Outras Funcionalidades e Serviços) modules
  const outrasFuncionalidadesModules = [
    {
      id: "rol",
      title: "Rol de Responsáveis",
      acronym: "ROL",
      desc: "Controle de vigência de delegações, mandatos de titulares e substitutos de cargos e conformidade normativa federal vigiada pela IN 84/TCU.",
      indicator: `${rolResponsaveis.length || 4} Dirigentes Ativos`,
      icon: User,
      accent: "border-t-4 border-l-0 border-emerald-600",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-emerald-500/20"
    },
    {
      id: "scdp",
      title: "Diárias e Passagens (SCDP)",
      acronym: "SCDP",
      desc: "Monitoramento de viagens a serviço, prestação de contas de diárias e passagens aéreas conforme Decreto nº 5.992/2006.",
      indicator: "Viagens · Prestação de Contas",
      icon: Plane,
      accent: "border-t-4 border-l-0 border-sky-500",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-sky-500/20"
    },
    {
      id: "srte",
      title: "Superintendências Regionais",
      acronym: "SRTE",
      desc: "Mapa estratégico e contatos estaduais das 27 representações de fiscalização e promoção do trabalho no território nacional.",
      indicator: `${superintendencias.length || 27} Regionais Cadastradas`,
      icon: Map,
      accent: "border-t-4 border-l-0 border-indigo-500",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-indigo-500/20"
    },
    {
      id: "etica",
      title: "Comissão de Ética",
      acronym: "ÉTICA",
      desc: "Trâmite preventivo e correcional de denúncias de conduta, acompanhamento de apurações preliminares e processos éticos.",
      indicator: `${comissaoEtica.length || 3} Cases Registrados`,
      icon: Shield,
      accent: "border-t-4 border-l-0 border-red-500",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-rose-500/20"
    },
    {
      id: "bi",
      title: "AECI Inteligente",
      acronym: "BI & IA",
      desc: "Painel unificado de estatísticas regulamentares governamentais, matriz de cruzamento para auditorias complexas e modelos preditivos de inteligência artificial.",
      indicator: "Cruzamentos Ativos · IA Preditiva",
      icon: TrendingUp,
      accent: "border-t-4 border-l-0 border-purple-600",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-purple-500/20"
    },
    {
      id: "contratos",
      title: "Gestão de Contratos",
      acronym: "CONTRATOS",
      desc: "Painel centralizado de contratos gerais do Ministério, integração com o PNCP e alertas de vencimento/prorrogação.",
      indicator: "Contratos Integrados",
      icon: FileText,
      accent: "border-t-4 border-l-0 border-amber-600",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-amber-500/20"
    }
  ].filter(module => hasModulePermission(module.id));

  return (
    <div className="font-sans space-y-8 animate-fade-in max-w-7xl mx-auto py-2 px-4 no-print">
      
      {/* Dashboard Title Header */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
                <LayoutDashboard size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Plataforma ÓRBITA | AECI</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Gestão de Demandas de Controle Interno do Ministério do Trabalho e Emprego</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-8">
        
        {/* Section Header */}
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#003366]" />
            Acesso Rápido aos Sistemas e Módulos do MTE
          </h2>
        </div>

        {/* Category 1: Demandas de Órgãos de Controle Externo */}
        {controleExternoModules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              DEMANDAS DE ÓRGÃOS DE CONTROLE EXTERNO
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {controleExternoModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.id}
                    whileHover={{ y: -4 }}
                    className={`flex flex-col justify-between rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 ${mod.bg} ${mod.accent} ${mod.hoverRing}`}
                  >
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-100 text-slate-700 font-extrabold text-[9px] px-2 py-0.5 rounded font-mono">
                          {mod.acronym}
                        </span>
                        <div className="p-2.5 bg-slate-50 text-[#003366] rounded-xl border border-slate-100">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-xs font-extrabold text-slate-900 tracking-tight leading-none">
                          {mod.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                          {mod.desc}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        {mod.indicator}
                      </span>
                      
                      <button
                        onClick={() => onNavigate(mod.id)}
                        className="text-[10px] font-black text-[#1351b4] hover:text-[#003366] flex items-center gap-1 group transition cursor-pointer"
                      >
                        Entrar no Painel 
                        <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 2: Outras Funcionalidades e Serviços */}
        {outrasFuncionalidadesModules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              OUTRAS FUNCIONALIDADES E SERVIÇOS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {outrasFuncionalidadesModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.id}
                    whileHover={{ y: -4 }}
                    className={`flex flex-col justify-between rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 ${mod.bg} ${mod.accent} ${mod.hoverRing}`}
                  >
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-slate-100 text-slate-700 font-extrabold text-[9px] px-2 py-0.5 rounded font-mono">
                          {mod.acronym}
                        </span>
                        <div className="p-2.5 bg-slate-50 text-[#003366] rounded-xl border border-slate-100">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-xs font-extrabold text-slate-900 tracking-tight leading-none">
                          {mod.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                          {mod.desc}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono font-bold">
                        {mod.indicator}
                      </span>
                      
                      <button
                        onClick={() => onNavigate(mod.id)}
                        className="text-[10px] font-black text-[#1351b4] hover:text-[#003366] flex items-center gap-1 group transition cursor-pointer"
                      >
                        Entrar no Painel 
                        <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Helpful Ministerial Disclaimer & Guidelines info */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center text-xs text-slate-400 max-w-3xl mx-auto space-y-1 shadow-2xs">
        <p className="font-bold text-[#003366] uppercase tracking-wide">
          PLATAFORMA ÓRBITA | Gestão de Controle Interno do MTE
        </p>
        <p className="leading-relaxed text-slate-500 font-medium">
          Esta plataforma é de uso institutional regulamentado. Alterações de status, exclusões e inserções de dados 
          devem estar respaldadas por documentos administrativos do SEI (Sistema Eletrônico de Informações) e seguir as normas federais.
        </p>
      </div>

    </div>
  );
}
