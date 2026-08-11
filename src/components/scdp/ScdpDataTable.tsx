import React from "react";

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
  valorDevolucao: number;
  siafiGruDevolucaoConfirmada: boolean | null;
  statusPrestacao: string;
  dataPrestacaoContas?: string;
  inconsistenciaVinculo?: boolean;
  siafiScdpDivergencia?: boolean;
  siapePendenciaScdp?: boolean;
  sobreposicaoFerias?: boolean;
  sobreposicaoLicenca?: boolean;
}

interface ScdpDataTableProps {
  viagens: ViagemData[];
  onSelectViagem: (viagem: ViagemData) => void;
}

export const ScdpDataTable: React.FC<ScdpDataTableProps> = ({ viagens, onSelectViagem }) => {
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

              return (
                <tr 
                  key={v.id} 
                  className="hover:bg-slate-50/70 transition cursor-pointer"
                  onClick={() => onSelectViagem(v)}
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
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
