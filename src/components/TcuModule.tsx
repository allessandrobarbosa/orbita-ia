/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import TcuMonitoramento from './TcuMonitoramento';
import TcuComunicacoes from './TcuComunicacoes';
import TcuTCE from './TcuTCE';
import TcuPainelGerencial from './TcuPainelGerencial';

import { 
  Database, 
  MessageSquare,
  FileWarning,
  Landmark,
  LayoutDashboard
} from "lucide-react";

import { AcordaoDemand, ComunicacaoDemand, TceDemand, TceAcordaoMapping } from "../types";

interface TcuModuleProps {
  acordaos: AcordaoDemand[];
  onUpdateAcordao: (updated: AcordaoDemand) => Promise<boolean>;
  onDeleteAcordao: (key: string) => Promise<boolean>;
  onImportAcordaos: (listOrItems: string[] | any[]) => Promise<any>;
  onSyncLocalAcordaos: () => Promise<any>;
  comunicacoes?: ComunicacaoDemand[];
  onUpdateComunicacao?: (updated: ComunicacaoDemand) => Promise<boolean>;
  onDeleteComunicacao?: (key: string) => Promise<boolean>;
  onImportComunicacoes?: (items: ComunicacaoDemand[]) => Promise<any>;
  tces?: TceDemand[];
  tceMappings?: TceAcordaoMapping[];
  onUpdateTce?: (updated: TceDemand) => Promise<boolean>;
  onDeleteTce?: (id: string) => Promise<boolean>;
  onImportTces?: (items: TceDemand[]) => Promise<any>;
  onImportTceMappings?: (items: TceAcordaoMapping[]) => Promise<any>;
  onAddTceMapping?: (numeroAnoTce: string, acordaoKey: string) => Promise<boolean>;
  onDeleteTceMapping?: (numeroAnoTce: string, acordaoKey: string) => Promise<boolean>;
  onClearOlderAcordaos?: () => Promise<any>;
  onResetDatabase?: () => Promise<any>;
  isLoading: boolean;
  onRefreshData?: () => Promise<void>;
  onNavigateToMonitoramento?: (searchKey: string) => void;
  initialMonitoramentoSearch?: string;
}

type TcuSection = "painel" | "monitoramento" | "comunicacoes" | "tce";

export default function TcuModule(props: TcuModuleProps) {
  const [tcuActiveSection, setTcuActiveSection] = useState<TcuSection>("monitoramento");
  const [initialMonitoramentoSearch, setInitialMonitoramentoSearch] = useState<string>("");

  const handleNavigateToMonitoramento = (searchKey: string) => {
    setInitialMonitoramentoSearch(searchKey);
    setTcuActiveSection("monitoramento");
  };

  const navItems: { id: TcuSection; label: string; desc: string; icon: React.ElementType }[] = [
    { id: "monitoramento", label: "Monitoramento",                   desc: "Acompanhamento de Acordaos",           icon: Database        },
    { id: "comunicacoes",  label: "Comunicações",                    desc: "Recepção de Ofícios & Notificações",   icon: MessageSquare   },
    { id: "tce",           label: "Tomada de Contas Especial (TCE)", desc: "Apurar Danos ao Erario",               icon: FileWarning     },
    { id: "painel",        label: "Painel Gerencial",                desc: "Volumetria e indicadores consolidados", icon: LayoutDashboard },
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Module Title Header */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
                <Landmark size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Tribunal de Contas da Uniao - TCU</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Acompanhamento de Acordaos e Monitoramento de Processos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TCU Submodules Navigation */}
      <div className="no-print border border-slate-200 bg-white p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm mb-6">
        {navItems.map((subSection) => {
          const SubIcon = subSection.icon;
          const isActive = tcuActiveSection === subSection.id;
          return (
            <button
              key={subSection.id}
              onClick={() => setTcuActiveSection(subSection.id)}
              className={`flex-1 min-w-[160px] flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-[#003366] to-[#004080] text-white shadow-md shadow-blue-900/20"
                  : "hover:bg-slate-50 text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                isActive ? "bg-white/15" : "bg-slate-100"
              }`}>
                <SubIcon className={`w-4 h-4 ${isActive ? "text-blue-100" : "text-slate-500"}`} />
              </div>
              <div className="text-left">
                <span className="block text-xs font-black uppercase tracking-wide leading-none">{subSection.label}</span>
                <span className="block text-[9px] opacity-70 mt-0.5 font-normal leading-none">{subSection.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* PAINEL GERENCIAL */}
      <div className={tcuActiveSection === "painel" ? "block" : "hidden"}>
        <TcuPainelGerencial
          acordaos={props.acordaos}
          comunicacoes={props.comunicacoes}
          tces={props.tces}
          tceMappings={props.tceMappings}
        />
      </div>

      {/* MONITORAMENTO */}
      <div className={tcuActiveSection === "monitoramento" ? "block" : "hidden"}>
        <TcuMonitoramento 
          initialMonitoramentoSearch={initialMonitoramentoSearch}
          acordaos={props.acordaos}
          onUpdateAcordao={props.onUpdateAcordao}
          onDeleteAcordao={props.onDeleteAcordao}
          onImportAcordaos={props.onImportAcordaos}
          onSyncLocalAcordaos={props.onSyncLocalAcordaos}
          onClearOlderAcordaos={props.onClearOlderAcordaos}
          onResetDatabase={props.onResetDatabase}
          comunicacoes={props.comunicacoes}
          onUpdateComunicacao={props.onUpdateComunicacao}
          onDeleteComunicacao={props.onDeleteComunicacao}
          onImportComunicacoes={props.onImportComunicacoes}
          tces={props.tces}
          tceMappings={props.tceMappings}
          onUpdateTce={props.onUpdateTce}
          onDeleteTce={props.onDeleteTce}
          onImportTces={props.onImportTces}
          isLoading={props.isLoading}
          onRefreshData={props.onRefreshData}
        />
      </div>

      {/* COMUNICACOES */}
      <div className={tcuActiveSection === "comunicacoes" ? "block" : "hidden"}>
        <TcuComunicacoes 
          acordaos={props.acordaos}
          onUpdateAcordao={props.onUpdateAcordao}
          onDeleteAcordao={props.onDeleteAcordao}
          onImportAcordaos={props.onImportAcordaos}
          onSyncLocalAcordaos={props.onSyncLocalAcordaos}
          onClearOlderAcordaos={props.onClearOlderAcordaos}
          onResetDatabase={props.onResetDatabase}
          comunicacoes={props.comunicacoes}
          onUpdateComunicacao={props.onUpdateComunicacao}
          onDeleteComunicacao={props.onDeleteComunicacao}
          onImportComunicacoes={props.onImportComunicacoes}
          tces={props.tces}
          tceMappings={props.tceMappings}
          onUpdateTce={props.onUpdateTce}
          onDeleteTce={props.onDeleteTce}
          onImportTces={props.onImportTces}
          onImportTceMappings={props.onImportTceMappings}
          isLoading={props.isLoading}
          onRefreshData={props.onRefreshData}
        />
      </div>

      {/* TCE */}
      <div className={tcuActiveSection === "tce" ? "block" : "hidden"}>
        <TcuTCE 
          onNavigateToMonitoramento={handleNavigateToMonitoramento}
          acordaos={props.acordaos}
          onUpdateAcordao={props.onUpdateAcordao}
          onDeleteAcordao={props.onDeleteAcordao}
          onImportAcordaos={props.onImportAcordaos}
          onSyncLocalAcordaos={props.onSyncLocalAcordaos}
          onClearOlderAcordaos={props.onClearOlderAcordaos}
          onResetDatabase={props.onResetDatabase}
          comunicacoes={props.comunicacoes}
          onUpdateComunicacao={props.onUpdateComunicacao}
          onDeleteComunicacao={props.onDeleteComunicacao}
          onImportComunicacoes={props.onImportComunicacoes}
          tces={props.tces}
          tceMappings={props.tceMappings}
          onUpdateTce={props.onUpdateTce}
          onDeleteTce={props.onDeleteTce}
          onImportTces={props.onImportTces}
          onImportTceMappings={props.onImportTceMappings}
          isLoading={props.isLoading}
          onRefreshData={props.onRefreshData}
        />
      </div>
    </div>
  );
}
