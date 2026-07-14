/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import TcuMonitoramento from './TcuMonitoramento';
import TcuComunicacoes from './TcuComunicacoes';
import TcuTCE from './TcuTCE';

import { 
  Database, 
  MessageSquare,
  FileWarning,
  Landmark
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
  onClearOlderAcordaos?: () => Promise<any>;
  onResetDatabase?: () => Promise<any>;
  isLoading: boolean;
}

export default function TcuModule(props: TcuModuleProps) {
  const [tcuActiveSection, setTcuActiveSection] = useState<"monitoramento" | "comunicacoes" | "tce">("monitoramento");

  return (
    <div className="space-y-6 font-sans">
      
      {/* Module Title Header - NOW STICKY */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 font-display flex items-center gap-2">
              <Landmark className="w-6 h-6 text-[#003366]" />
              Tribunal de Contas da União — TCU
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Acompanhamento de Acórdãos e Monitoramento de Processos</p>
          </div>
        </div>
      </div>

      {/* TCU Submodules Navigation */}
      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs mb-6">
        {[
          { id: "monitoramento", label: "Monitoramento", desc: "Acompanhamento de Acórdãos", icon: Database, isDev: false },
          { id: "comunicacoes", label: "Comunicações", desc: "Recepção de Ofícios & Notificações", icon: MessageSquare, isDev: false },
          { id: "tce", label: "Tomada de Contas Especial (TCE)", desc: "Apurar Danos ao Erário", icon: FileWarning, isDev: false },
        ].map((subSection) => {
          const SubIcon = subSection.icon;
          const isActive = tcuActiveSection === subSection.id;
          return (
            <button
              key={subSection.id}
              onClick={() => {
                setTcuActiveSection(subSection.id as any);
              }}
              className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SubIcon className={`w-5 h-5 ${isActive ? "text-blue-200" : "text-slate-400"}`} />
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wide leading-none">{subSection.label}</span>
                  <span className="block text-[9px] opacity-75 mt-0.5 font-normal leading-none">{subSection.desc}</span>
                </div>
              </div>
              {subSection.isDev && (
                <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide leading-none ${
                  isActive ? "bg-amber-400 text-slate-900 animate-pulse" : "bg-slate-100 text-slate-500"
                }`}>
                  Breve
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={tcuActiveSection === "monitoramento" ? "block" : "hidden"}>
        <TcuMonitoramento 
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
        />
      </div>

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
        />
      </div>

      <div className={tcuActiveSection === "tce" ? "block" : "hidden"}>
        <TcuTCE 
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
        />
      </div>
    </div>
  );
}
