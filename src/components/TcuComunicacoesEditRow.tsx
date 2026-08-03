import React, { useState } from "react";
import { X, ArrowLeftRight, Archive, Clock, ExternalLink, Save } from "lucide-react";
import { ComunicacaoDemand } from "../types";

interface TcuComunicacoesEditRowProps {
  item: ComunicacaoDemand;
  onSave: (updatedItem: ComunicacaoDemand) => Promise<boolean>;
  onCancel: () => void;
}

export default function TcuComunicacoesEditRow({ item, onSave, onCancel }: TcuComunicacoesEditRowProps) {
  const [editComDestinatario, setEditComDestinatario] = useState(item.DESTINATARIO || "");
  const [editComContato, setEditComContato] = useState(item.CONTATO || "");
  const [editComUnidade, setEditComUnidade] = useState(item.UNIDADE_EMITENTE || "");
  const [editComProcesso, setEditComProcesso] = useState(item.PROCESSO || "");
  const [editComExpedicao, setEditComExpedicao] = useState(item.DATA_EXPEDICAO || "");
  const [editComResposta, setEditComResposta] = useState(item.DATA_RESPOSTA || "");
  const [editComCarece, setEditComCarece] = useState(item.CARECE_RESPOSTA !== false);
  const [editComUnidadeExecutora, setEditComUnidadeExecutora] = useState(item.UNIDADE_EXECUTORA || "");
  const [editComProcessoSei, setEditComProcessoSei] = useState(item.PROCESSO_SEI || "");
  const [editComDestinacao, setEditComDestinacao] = useState(item.DESTINACAO || "RESPOSTA");
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const updated: ComunicacaoDemand = {
      ...item,
      DESTINATARIO: editComDestinatario,
      CONTATO: editComContato,
      UNIDADE_EMITENTE: editComUnidade,
      PROCESSO: editComProcesso,
      DATA_EXPEDICAO: editComExpedicao,
      DATA_RESPOSTA: editComResposta,
      CARECE_RESPOSTA: editComCarece,
      UNIDADE_EXECUTORA: editComUnidadeExecutora,
      PROCESSO_SEI: editComProcessoSei,
      DESTINACAO: editComDestinacao
    };

    const success = await onSave(updated);
    if (success) {
      onCancel(); // Close row on success
    } else {
      alert("Erro ao salvar alterações da comunicação.");
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 border-b border-slate-200 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Responder / Editar Comunicação</h3>
          <p className="text-xs text-slate-500 font-bold">{item.COMUNICACAO} • Ano {item.ANO}</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 transition" title="Fechar">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-4 text-xs text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Unidade Emitente</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComUnidade}
                onChange={(e) => setEditComUnidade(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Processo Associado</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComProcesso}
                onChange={(e) => setEditComProcesso(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Destinatário</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComDestinatario}
                onChange={(e) => setEditComDestinatario(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Contato de Referência</label>
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComContato}
                onChange={(e) => setEditComContato(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Unidade Executora</label>
              <input
                type="text"
                placeholder="Ex: SECI"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComUnidadeExecutora}
                onChange={(e) => setEditComUnidadeExecutora(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Nº Processo SEI</label>
              <input
                type="text"
                placeholder="Ex: 19973.100234/2026-99"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComProcessoSei}
                onChange={(e) => setEditComProcessoSei(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Destinação da Comunicação</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditComDestinacao("RESPOSTA")}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  editComDestinacao === "RESPOSTA"
                    ? "bg-[#003366] text-white border-[#003366] shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Resposta
              </button>
              <button
                type="button"
                onClick={() => setEditComDestinacao("ARQUIVAMENTO")}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  editComDestinacao === "ARQUIVAMENTO"
                    ? "bg-slate-700 text-white border-slate-700 shadow-sm"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <Archive className="w-4 h-4" />
                Arquivamento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Data de Expedição</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                value={editComExpedicao}
                onChange={(e) => setEditComExpedicao(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Data da Resposta</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA ou branco se pendente"
                className="w-full border border-blue-200 bg-blue-50/30 rounded-lg p-2.5 text-xs text-blue-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                value={editComResposta}
                onChange={(e) => setEditComResposta(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <input
              type="checkbox"
              id={`edit-com-carece-${item.KEY}`}
              checked={editComCarece}
              onChange={(e) => setEditComCarece(e.target.checked)}
              className="w-4 h-4 text-[#003366] border-slate-350 rounded-md focus:ring-[#003366] cursor-pointer"
            />
            <label htmlFor={`edit-com-carece-${item.KEY}`} className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              Esta comunicação carece/exige resposta oficial da assessoria
            </label>
          </div>

          {editComCarece && editComExpedicao && (() => {
            const [d, m, y] = editComExpedicao.split("/");
            if (d && m && y && d.length === 2 && m.length === 2 && y.length === 4) {
              const dtExpedicao = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
              if (!isNaN(dtExpedicao.getTime())) {
                let dtReferencia = new Date(); // today
                const resolved = editComResposta && editComResposta.trim() !== "";
                if (resolved) {
                  const [rd, rm, ry] = editComResposta.split("/");
                  if (rd && rm && ry) {
                    dtReferencia = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd));
                  }
                }
                
                const diffTime = dtReferencia.getTime() - dtExpedicao.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays >= 0) {
                  return (
                    <div className={`p-4 mt-2 rounded-xl flex items-center justify-between border ${resolved ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-center gap-2.5">
                        <Clock className={`w-5 h-5 ${resolved ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span className={`text-sm font-black uppercase tracking-wider ${resolved ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {resolved ? "Comunicação Respondida" : "Tempo Decorrido"}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${resolved ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {resolved ? `Em ${diffDays} dias` : `${diffDays} dias em aberto`}
                      </span>
                    </div>
                  );
                }
              }
            }
            return null;
          })()}

          {/* External Links */}
          <div className="flex flex-wrap gap-3 pt-4 mt-4 border-t border-slate-150/70">
            <a
              href="https://processoeletronico.trabalho.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 border border-slate-200 hover:border-[#003366]/30 hover:bg-[#003366]/5 text-[#003366] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Acessar SEI
            </a>
            <a
              href="https://conecta-tcu.apps.tcu.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 border border-slate-200 hover:border-[#003366]/30 hover:bg-[#003366]/5 text-[#003366] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Conecta TCU
            </a>
          </div>
        </div>
      {/* Footer */}
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
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}
