import React from "react";
import { Scale, Briefcase, MapPin, AlertTriangle, Building, User, Calendar, DollarSign, FileText } from "lucide-react";
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
  scoreRiscoIa?: string;
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const cleanDate = dateStr.split("T")[0];
    const parts = cleanDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-[65vh] overflow-y-auto shadow-3xs">
      <table className="w-full text-left border-collapse text-xs text-slate-800">
        <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-xs text-slate-650 font-bold uppercase tracking-wider border-b border-slate-100">
          <tr>
            <th className="p-4 font-extrabold select-none">Servidor Viajante</th>
            <th className="p-4 font-extrabold select-none">Período / Roteiro</th>
            <th className="p-4 font-extrabold select-none text-right">Valores</th>
            <th className="p-4 font-extrabold select-none">Status Prestação</th>
            <th className="p-4 font-extrabold select-none">Alertas / Auditoria</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {viagens.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                Nenhuma viagem localizada com os filtros informados.
              </td>
            </tr>
          ) : (
            viagens.map((v) => {
              let statusClass = "bg-slate-50 text-slate-600 border-slate-100";
              if (v.statusPrestacao === "No Prazo") statusClass = "bg-emerald-50 text-emerald-700 border-emerald-100/60";
              else if (v.statusPrestacao === "Em Aberto - No Prazo") statusClass = "bg-sky-50 text-sky-700 border-sky-100/60";
              else if (v.statusPrestacao === "Em Aberto - Atrasado") statusClass = "bg-rose-50 text-rose-700 border-rose-100/60";
              else if (v.statusPrestacao === "Pendente") statusClass = "bg-amber-50 text-amber-700 border-amber-100/60";

              const isSelected = selectedViagem?.id === v.id;
              
              return (
                <React.Fragment key={v.id}>
                  <tr 
                    className={`hover:bg-slate-50/50 transition duration-150 cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-50/80 border-l-4 border-[#003366]' 
                        : 'border-l-4 border-transparent'
                    }`}
                    onClick={() => onSelectViagem(isSelected ? null : v)}
                  >
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#003366] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <User size={13} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-snug">{v.nomeViajante}</div>
                          <div className="text-[10px] text-slate-450 font-mono mt-0.5 flex items-center gap-2">
                            <span>CPF: {v.cpfViajante}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-bold text-[#003366]">Nº SCDP: {v.numeroViagem || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-slate-650 font-mono">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar size={12} className="text-slate-400" />
                        {formatDate(v.dataInicio)} ➔ {formatDate(v.dataFim)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5 font-medium">{v.destino}</div>
                    </td>
                    <td className="p-4 align-middle text-right font-mono">
                      <div className="font-extrabold text-[#003366]">{formatCurrency(v.valorTotal)}</div>
                      <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">Diárias: {formatCurrency(v.valorDiarias)}</span>
                      {v.valorDevolucao > 0 && (
                        <span className={`text-[9px] font-black block mt-0.5 ${v.siafiGruDevolucaoConfirmada ? "text-emerald-700" : "text-rose-600"}`}>
                          Devolução: {formatCurrency(v.valorDevolucao)} ({v.siafiGruDevolucaoConfirmada ? "SIAFI OK" : "Pendente"})
                        </span>
                      )}
                    </td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${statusClass}`}>
                        {v.statusPrestacao}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {v.inconsistenciaVinculo && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-100">
                            Vínculo
                          </span>
                        )}
                        {v.siafiScdpDivergencia && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-rose-50 text-rose-800 border border-rose-100">
                            SIAFI
                          </span>
                        )}
                        {(v.sobreposicaoFerias || v.sobreposicaoLicenca) && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-100">
                            Sobreposição
                          </span>
                        )}
                        {!v.inconsistenciaVinculo && !v.siafiScdpDivergencia && !v.sobreposicaoFerias && !v.sobreposicaoLicenca && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 text-emerald-800 border border-emerald-100/60">
                            Regular
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isSelected && (
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <td colSpan={5} className="p-6">
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-5">
                          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                            <Scale className="w-5 h-5 text-[#003366]" />
                            <h4 className="text-[#003366] text-sm font-black uppercase tracking-wider">
                              Dossiê de Viagem &bull; PCDP {v.numeroViagem || v.id}
                            </h4>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            
                            {/* Card 1: Dados do Viajante */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                  <span className="text-xs text-[#003366] font-extrabold uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" /> Cadastro do Servidor
                                  </span>
                                  {v.inconsistenciaVinculo && (
                                    <span className="bg-rose-50 text-rose-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-rose-100">
                                      Vínculo Inativo
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-3 text-xs">
                                  <div>
                                    <span className="block text-slate-400 font-extrabold mb-0.5 uppercase text-[9px] tracking-wider">Nome do Beneficiário</span>
                                    <strong className="text-slate-800 text-sm">{v.nomeViajante}</strong> <span className="text-slate-400 font-mono">({v.cpfViajante})</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 font-extrabold mb-0.5 uppercase text-[9px] tracking-wider">Cargo Ocupado</span>
                                    <span className="font-semibold text-slate-700">{v.cargo || "Não Informado / Sem Cargo cadastrado no PCDP"}</span>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 font-extrabold mb-0.5 uppercase text-[9px] tracking-wider">Lotação de Exercício (SIGEPE)</span>
                                    <span className="font-semibold text-slate-700">{v.sigepeLotacao || "Não localizado nas bases sincronizadas do SIGEPE"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400">
                                Unidade Solicitante: <strong className="text-slate-600">{v.orgaoSolicitante || "MTE"}</strong>
                              </div>
                            </div>

                            {/* Card 2: Dados da Viagem */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                                  <span className="text-xs text-[#003366] font-extrabold uppercase tracking-wider flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Informações de Rota
                                  </span>
                                  {v.viagemUrgente === "SIM" && (
                                    <span className="bg-amber-50 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-100/60 flex items-center gap-1">
                                      <AlertTriangle className="w-3" /> Urgente
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-3 text-xs">
                                  <div className="flex gap-4 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100/60">
                                    <div className="flex-1">
                                      <span className="block text-slate-400 font-bold mb-0.5 text-[9px] uppercase tracking-wider">Período</span>
                                      <strong className="text-slate-700 font-mono">{formatDate(v.dataInicio)} a {formatDate(v.dataFim)}</strong>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200"></div>
                                    <div className="flex-1">
                                      <span className="block text-slate-400 font-bold mb-0.5 text-[9px] uppercase tracking-wider">Destino</span>
                                      <strong className="text-slate-700">{v.destino}</strong>
                                    </div>
                                  </div>
                                  <div>
                                    <span className="block text-slate-400 font-extrabold mb-1 uppercase text-[9px] tracking-wider">Motivo da Viagem (SCDP)</span>
                                    <div className="bg-slate-50/50 p-3 rounded-xl text-slate-700 leading-relaxed border border-slate-100 max-h-24 overflow-y-auto text-[11px] font-medium">
                                      {v.motivoViagem || "Não cadastrado"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="border-t border-slate-100 pt-3 mt-4 flex justify-between items-center text-[10px] text-slate-450">
                                <span>Situação SCDP: <strong className="text-[#003366] uppercase">{v.situacao}</strong></span>
                                {v.viagemUrgente === "SIM" && v.justificativaUrgencia && (
                                  <span className="text-amber-700 font-semibold cursor-pointer underline" title={v.justificativaUrgencia}>Ver urgência</span>
                                )}
                              </div>
                            </div>

                            {/* Card 3: Conciliação Financeira SIAFI */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-3xs lg:col-span-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                                <span className="text-xs text-[#003366] font-extrabold uppercase tracking-wider flex items-center gap-2">
                                  <Building className="w-4 h-4" /> Conciliação Financeira (SIAFI / Tesouro)
                                </span>
                                {v.siafiScdpDivergencia && (
                                  <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-rose-100 flex items-center gap-1">
                                    <AlertTriangle className="w-3" /> Divergência
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100/60">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center">
                                    <DollarSign size={14} />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Passagens</span>
                                    <span className="text-sm font-black text-slate-750 font-mono">{formatCurrency(v.valorPassagem)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center">
                                    <DollarSign size={14} />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Diárias</span>
                                    <span className="text-sm font-black text-slate-750 font-mono">{formatCurrency(v.valorDiarias)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5 border-t md:border-t-0 md:border-l border-slate-200 md:pl-4 pt-3 md:pt-0">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                                    <DollarSign size={14} />
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider">Total Concedido</span>
                                    <span className="text-sm font-black text-emerald-800 font-mono">{formatCurrency(v.valorTotal)}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
                                  <span className="block text-[9px] text-slate-400 font-black uppercase tracking-wider mb-1">Empenho SIAFI</span>
                                  <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg font-mono shadow-4xs">
                                    {v.siafiEmpenho || "Não localizado"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                          </div>
                          
                          <div className="mt-3">
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
