import React from "react";
import { Scale, Briefcase, MapPin, AlertTriangle, Building } from "lucide-react";
import { ScdpAiInsights } from "./ScdpAiInsights";

interface ViagemData {
  id: string;
  nomeViajante: string;
  cpfViajante: string;
  numeroViagem?: string;
  lotacao?: string;
  dataInicio: string;
  dataFim: string;
  destino: string;
  valorTotal: number;
  valorDiarias: number;
  valorPassagem: number;
  valorDevolucao: number;
  siafiGruDevolucaoConfirmada: boolean | null;
  statusPrestacao: string;
  dataPrestacaoContas?: string;
  inconsistenciaVinculo?: boolean;
  siafiScdpDivergencia?: boolean;
  siapePendenciaScdp?: boolean;
  sobreposicaoFerias?: boolean;
  sobreposicaoLicenca?: boolean;
  cargo?: string;
  situacao?: string;
  viagemUrgente?: string;
  justificativaUrgencia?: string;
  orgaoSolicitante?: string;
  orgaoSuperior?: string;
  motivoViagem?: string;
  siafiEmpenho?: string;
  sigepeLotacao?: string;
  scoreRiscoIa?: number;
  justificativaIa?: string;
}

interface ScdpDataTableProps {
  viagens: ViagemData[];
  onSelectViagem: (viagem: ViagemData | null) => void;
  selectedViagem: ViagemData | null;
}

export const ScdpDataTable: React.FC<ScdpDataTableProps> = ({ viagens, onSelectViagem, selectedViagem }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(val || 0);
  };

  return (
    <div className="overflow-x-auto border border-slate-150 rounded-xl max-h-[60vh] overflow-y-auto">
      <table className="w-full text-left border-collapse text-sm text-slate-800">
        <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244]">
          <tr className="font-black border-b border-[#002244]">
            <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Servidor Viajante</th>
            <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Período Ida/Volta</th>
            <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Valores</th>
            <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Prestação de Contas</th>
            <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Auditoria / Alertas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {viagens.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                Nenhum registro encontrado nos filtros.
              </td>
            </tr>
          ) : (
            viagens.map((v) => {
              let statusBg = "bg-slate-50 text-slate-600";
              if (v.statusPrestacao === "No Prazo") statusBg = "bg-emerald-50 text-emerald-800 border border-emerald-100";
              else if (v.statusPrestacao === "Em Aberto - No Prazo") statusBg = "bg-sky-50 text-sky-800 border border-sky-100";
              else if (v.statusPrestacao === "Em Aberto - Atrasado") statusBg = "bg-rose-50 text-rose-800 border border-rose-100";
              else if (v.statusPrestacao === "Pendente") statusBg = "bg-amber-50 text-amber-800 border border-amber-100";

              const isSelected = selectedViagem?.id === v.id;
              
              return (
                <React.Fragment key={v.id}>
                  <tr 
                    className={`hover:bg-slate-50/70 transition cursor-pointer ${isSelected ? 'bg-slate-50 border-l-4 border-[#1351b4]' : 'border-l-4 border-transparent'}`}
                    onClick={() => onSelectViagem(isSelected ? null : v)}
                  >
                    <td className="p-4 align-middle">
                      <div className="font-bold text-slate-800 leading-none">{v.nomeViajante}</div>
                      <div className="text-[10px] text-slate-450 font-mono mt-1 flex flex-wrap gap-x-3 gap-y-0.5 items-center">
                        <span>CPF: {v.cpfViajante}</span>
                        <span className="text-slate-250 font-normal">|</span>
                        <span className="font-bold text-[#003366]">Nº SCDP: {v.numeroViagem || "—"}</span>
                      </div>
                      {v.lotacao && (
                        <div className="mt-1">
                          <span className="bg-slate-100/80 px-2 py-0.5 rounded-md font-semibold text-[9px] text-slate-600 block w-max max-w-full leading-normal">
                            {v.lotacao}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 align-middle text-slate-600 font-medium font-mono">
                      {v.dataInicio} ➔ {v.dataFim}<br/>
                      <span className="text-[9px]">{v.destino}</span>
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="font-extrabold text-[#003366]">{formatCurrency(v.valorTotal)}</div>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Diárias: {formatCurrency(v.valorDiarias)}</span>
                      {v.valorDevolucao > 0 && (
                        <span className={`text-[9px] font-black block mt-0.5 ${v.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                          Devolução: {formatCurrency(v.valorDevolucao)} ({v.siafiGruDevolucaoConfirmada ? "SIAFI OK" : "Pendente"})
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider inline-block ${statusBg}`}>
                        {v.statusPrestacao}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {v.inconsistenciaVinculo && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-100">Vínculo</span>}
                        {v.siafiScdpDivergencia && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-100">SIAFI</span>}
                        {(v.sobreposicaoFerias || v.sobreposicaoLicenca) && <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-100">Sobreposição</span>}
                        {!v.inconsistenciaVinculo && !v.siafiScdpDivergencia && !v.sobreposicaoFerias && !v.sobreposicaoLicenca && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100">Regular</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isSelected && (
                    <tr className="bg-slate-50 border-b-4 border-slate-200">
                      <td colSpan={5} className="p-6">
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                          <h4 className="text-[#1351b4] font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Scale className="w-5 h-5" /> 
                            Dossiê Analítico da Viagem: {v.numeroViagem}
                          </h4>
                          
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            
                            {/* Box 1: Dados do Servidor */}
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <Briefcase className="w-4 h-4" /> Dados do Viajante
                                </span>
                                {v.inconsistenciaVinculo && (
                                  <span className="bg-rose-50 text-rose-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-rose-100">
                                    Inconsistência de Vínculo
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-600">
                                <div className="col-span-2">
                                  <span className="block text-slate-400 font-bold mb-0.5">Nome / CPF</span>
                                  <strong className="text-slate-800 text-sm">{v.nomeViajante}</strong> <span className="text-slate-400">({v.cpfViajante})</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="block text-slate-400 font-bold mb-0.5">Cargo na Viagem</span>
                                  <span className="font-medium text-slate-700">{v.cargo || "Não Informado"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="block text-slate-400 font-bold mb-0.5">Lotação (SIGEPE)</span>
                                  <span className="font-medium text-slate-700">{v.sigepeLotacao || "Não localizado nas bases do SIGEPE"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="block text-slate-400 font-bold mb-0.5">Órgão Solicitante / Superior</span>
                                  <span className="font-medium text-slate-700 block">{v.orgaoSolicitante}</span>
                                  <span className="text-[10px] text-slate-400 block">{v.orgaoSuperior}</span>
                                </div>
                              </div>
                            </div>

                            {/* Box 2: Dados da Viagem */}
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
                              {v.viagemUrgente === "SIM" && (
                                <div className="absolute top-4 right-4 bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Viagem Urgente
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" /> Roteiro e Justificativa
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-y-3 text-xs text-slate-600">
                                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                  <div className="flex-1">
                                    <span className="block text-slate-400 font-bold mb-0.5">Período</span>
                                    <strong className="text-slate-700">{v.dataInicio} <span className="text-slate-400 font-normal mx-1">até</span> {v.dataFim}</strong>
                                  </div>
                                  <div className="w-px h-8 bg-slate-200"></div>
                                  <div className="flex-1">
                                    <span className="block text-slate-400 font-bold mb-0.5">Destino(s)</span>
                                    <strong className="text-slate-700">{v.destino}</strong>
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="block text-slate-400 font-bold mb-0.5">Motivo da Viagem (CGU)</span>
                                  <div className="bg-slate-50 p-3 rounded text-[11px] text-slate-700 leading-relaxed border border-slate-100 max-h-24 overflow-y-auto">
                                    {v.motivoViagem}
                                  </div>
                                </div>
                                
                                {v.viagemUrgente === "SIM" && v.justificativaUrgencia && (
                                  <div>
                                    <span className="block text-orange-600 font-bold mb-0.5">Justificativa da Urgência</span>
                                    <div className="bg-orange-50/50 p-3 rounded text-[11px] text-slate-700 leading-relaxed border border-orange-100">
                                      {v.justificativaUrgencia}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-slate-400 font-bold">Status Sistema:</span>
                                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                    {v.situacao}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Box 3: Conciliação Financeira SIAFI */}
                            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm space-y-3 xl:col-span-2">
                               <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs text-[#003366] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <Building className="w-4 h-4" /> Conciliação Financeira (SIAFI / Tesouro)
                                </span>
                                {v.siafiScdpDivergencia && (
                                   <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-rose-100">
                                    Divergência de Empenho
                                   </span>
                                )}
                              </div>
                              
                              <div className="flex gap-8 items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Passagens Estimadas</span>
                                  <span className="text-lg font-black text-slate-700">R$ {v.valorPassagem?.toFixed(2)}</span>
                                </div>
                                <div className="text-slate-300 text-2xl font-light">/</div>
                                <div>
                                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Diárias Recebidas</span>
                                  <span className="text-lg font-black text-slate-700">R$ {v.valorDiarias?.toFixed(2)}</span>
                                </div>
                                <div className="flex-1 flex justify-end">
                                   <div className="text-right">
                                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Nota de Empenho (SIAFI)</span>
                                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                        {v.siafiEmpenho || "Não localizado"}
                                      </span>
                                   </div>
                                </div>
                              </div>
                            </div>
                            
                          </div>
                          
                          <div className="mt-6">
                            <ScdpAiInsights 
                              viagemId={v.id} 
                              scoreRiscoIa={v.scoreRiscoIa}
                              justificativaIa={v.justificativaIa}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
