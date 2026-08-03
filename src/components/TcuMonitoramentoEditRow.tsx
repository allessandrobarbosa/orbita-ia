import React, { useState } from "react";
import { AcordaoDemand } from "../types";
import { Check, X } from "lucide-react";

interface TcuMonitoramentoEditRowProps {
  item: AcordaoDemand;
  onSave: (updatedItem: AcordaoDemand) => Promise<boolean>;
  onCancel: () => void;
}

const TcuMonitoramentoEditRow: React.FC<TcuMonitoramentoEditRowProps> = ({ item, onSave, onCancel }) => {
  const [editStatus, setEditStatus] = useState<string>(item.STATUS_MONITORAMENTO || "Pendente");
  const [editResponsavel, setEditResponsavel] = useState(item.RESPONSAVEL_INTERNO || "");
  const [editPrazo, setEditPrazo] = useState(item.PRAZO_LIMITE || "");
  const [editObs, setEditObs] = useState(item.OBSERVACOES || "");

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const updated: AcordaoDemand = {
      ...item,
      STATUS_MONITORAMENTO: editStatus as any,
      RESPONSAVEL_INTERNO: editResponsavel,
      PRAZO_LIMITE: editPrazo,
      OBSERVACOES: editObs,
    };

    const success = await onSave(updated);
    if (success) {
      onCancel();
    } else {
      alert("Erro ao salvar alterações do monitoramento.");
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-white p-6 border-b border-slate-200">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-sm font-bold text-[#003366] font-display">
            Editar Monitoramento
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Atualize o status, responsáveis e prazos do Acórdão.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-700 transition"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Status do Monitoramento Interno
          </label>
          <select
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            <option value="Pendente">Pendente</option>
            <option value="Em Análise">Em Análise</option>
            <option value="Cumprido">Cumprido</option>
            <option value="Atrasado">Atrasado (Fora do Prazo)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Assessor Responsável (Interno)
          </label>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            placeholder="Nome do analista ou assessoria designada"
            value={editResponsavel}
            onChange={(e) => setEditResponsavel(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Prazo Limite para Atendimento
          </label>
          <input
            type="date"
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
            value={editPrazo}
            onChange={(e) => setEditPrazo(e.target.value)}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Observações, Providências ou Impedimentos
          </label>
          <textarea
            className="w-full h-28 bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold resize-y"
            placeholder="Registre as tratativas, link para processos SEI ou impedimentos técnicos para atendimento do acórdão..."
            value={editObs}
            onChange={(e) => setEditObs(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition rounded-xl text-xs font-bold cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#003366] text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-900/20"
        >
          {isSaving ? (
            "Salvando..."
          ) : (
            <>
              <Check className="w-4 h-4" /> Salvar Alterações
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default TcuMonitoramentoEditRow;
