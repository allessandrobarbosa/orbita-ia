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
  Award
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
}

export default function DashboardOverview({ 
  onNavigate, 
  acordaos = [],
  comunicacoes = [],
  tces = [],
  rolResponsaveis = [],
  comissaoEtica = [],
  superintendencias = [],
  hasModulePermission
}: DashboardOverviewProps) {

  // Modules information list to render as beautiful, interactive portal cards
  const portalModules = [
    {
      id: "bi",
      title: "AECI Inteligente",
      acronym: "BI & IA",
      desc: "Painel unificado de estatísticas regulamentares governamentais, matriz de cruzamento para auditorias complexas e modelos preditivos de inteligência artificial.",
      indicator: "Cruzamentos Ativos • IA Preditiva",
      icon: BrainCircuit,
      accent: "border-t-4 border-l-0 border-purple-600",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-purple-500/20"
    },
    {
      id: "tcu",
      title: "Controle Externo (TCU)",
      acronym: "TCU",
      desc: "Monitoramento de Acórdãos de Auditoria, Ofícios de Comunicação Eletrônica e gestão integrada de Tomada de Contas Especial (TCE).",
      indicator: `${acordaos.length} Acórdãos • ${tces.length} TCEs`,
      icon: Database,
      accent: "border-t-4 border-l-0 border-[#003366]",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-[#003366]/20"
    },
    {
      id: "cgu",
      title: "Controle Interno (CGU)",
      acronym: "CGU",
      desc: "Espaço para controle de recomendações de auditoria, fiscalizações correntes e plano de providências da Controladoria-Geral da União.",
      indicator: "Fase de Homologação",
      icon: ShieldCheck,
      accent: "border-t-4 border-l-0 border-[#1351b4]",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-blue-500/20"
    },
    {
      id: "rol",
      title: "Rol de Responsáveis",
      acronym: "IN 84",
      desc: "Controle de vigência de delegações, mandatos de titulares e substitutos de cargos e conformidade normativa federal vigiada pela IN 84/TCU.",
      indicator: `${rolResponsaveis.length} Dirigentes Ativos`,
      icon: Users,
      accent: "border-t-4 border-l-0 border-emerald-600",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-emerald-500/20"
    },
    {
      id: "etica",
      title: "Comissão de Ética",
      acronym: "ÉTICA",
      desc: "Trâmite preventivo e correcional de denúncias de conduta, acompanhamento de apurações preliminares e processos éticos.",
      indicator: `${comissaoEtica.length} Casos Registrados`,
      icon: ShieldAlert,
      accent: "border-t-4 border-l-0 border-red-500",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-rose-500/20"
    },
    {
      id: "srte",
      title: "Superintendências Regionais",
      acronym: "SRTE",
      desc: "Mapa estratégico e contatos estaduais das 27 representações de fiscalização e promoção do trabalho no território nacional.",
      indicator: `${superintendencias.length} Regionais Cadastradas`,
      icon: Building2,
      accent: "border-t-4 border-l-0 border-indigo-500",
      bg: "bg-white",
      hoverRing: "hover:ring-2 hover:ring-indigo-500/20"
    }
  ].filter(module => hasModulePermission(module.id));

  return (
    <div className="font-sans space-y-8 animate-fade-in max-w-7xl mx-auto py-2 px-4 no-print">
      
      {/* AECI Welcome Header & Banner Block */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1351b4]/20 rounded-full -mr-32 -mt-32 pointer-events-none filter blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-400/5 rounded-full -ml-32 -mb-32 pointer-events-none filter blur-xl"></div>

        <div className="relative z-10 space-y-4 md:max-w-4xl">
          <div className="flex gap-2 items-center">
            <span className="bg-[#1351b4]/90 text-white font-extrabold text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-md">
              MINISTÉRIO DO TRABALHO E EMPREGO
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-amber-400 uppercase">
              Sistema Integrado de Controle Interno e Auditoria Governamental
            </h1>
            <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wide font-sans">
              Assessoria Especial de Controle Interno — AECI • Versão 2.6.0
            </p>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Bem-vindo ao centro de operações ÓRBITA. Esta ferramenta reúne de forma integrada os módulos regulamentares 
            exigidos pelo Tribunal de Contas da União e pela Controladoria-Geral da União, garantindo eficiência, transparência 
            e rigorosa rastreabilidade processual na esfera do Ministério do Trabalho e Emprego.
          </p>
        </div>
      </div>

      {/* Grid of Standard Portal Modules */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#003366]" />
            Acesso Rápido aos Sistemas e Módulos do MTE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {portalModules.map((mod) => {
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

      {/* Helpful Ministerial Disclaimer & Guidelines info */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 text-center text-xs text-slate-400 max-w-3xl mx-auto space-y-1">
        <p className="font-bold text-slate-500">Assessoria Especial de Controle Interno — AECI/MTE</p>
        <p className="leading-relaxed">
          Esta plataforma é de uso institucional regulamentado. Alterações de status, exclusões e inserções de dados 
          devem estar respaldadas por documentos administrativos do SEI (Sistema Eletrônico de Informações) e seguir as normas federais.
        </p>
      </div>

    </div>
  );
}
