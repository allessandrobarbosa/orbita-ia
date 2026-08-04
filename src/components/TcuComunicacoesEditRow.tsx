import React, { useState } from "react";
import { X, ArrowLeftRight, Archive, Clock, ExternalLink, Save, CheckCircle2, AlertCircle } from "lucide-react";
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
      onCancel();
    } else {
      alert("Erro ao salvar alterações da comunicação.");
      setIsSaving(false);
    }
  };

  // Compute elapsed/resolved time
  const tempoInfo = (() => {
    if (!editComCarece || !editComExpedicao) return null;
    const [d, m, y] = editComExpedicao.split("/");
    if (!d || !m || !y || d.length !== 2 || m.length !== 2 || y.length !== 4) return null;
    const dtExpedicao = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (isNaN(dtExpedicao.getTime())) return null;

    let dtReferencia = new Date();
    const resolved = editComResposta && editComResposta.trim() !== "";
    if (resolved) {
      const [rd, rm, ry] = editComResposta.split("/");
      if (rd && rm && ry) dtReferencia = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd));
    }
    const diffDays = Math.ceil((dtReferencia.getTime() - dtExpedicao.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    return { resolved, diffDays };
  })();

  const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5";
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1351b4] transition-all font-medium";

  return (
    <div className="bg-white border-b border-slate-200 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-[#003366]/5 to-transparent">
        <div>
          <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Responder / Editar Comunicação
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {item.COMUNICACAO} · Ano {item.ANO}
          </p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition" title="Fechar">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-6 text-xs text-slate-700">

        {/* ── BLOCO 1: Decisão do Analista (TOPO — ação principal) ───────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          <p className="text-[10px] font-black text-[#003366] uppercase tracking-widest">
            ① Classificação da Comunicação — Ação do Analista
          </p>

          {/* Destinação */}
          <div>
            <label className={labelClass}>Destinação da Comunicação</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditComDestinacao("RESPOSTA")}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  editComDestinacao === "RESPOSTA"
                    ? "bg-[#003366] text-white border-[#003366] shadow-md shadow-blue-900/20"
                    : "bg-white text-slate-500 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Requer Resposta
              </button>
              <button
                type="button"
                onClick={() => setEditComDestinacao("ARQUIVAMENTO")}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  editComDestinacao === "ARQUIVAMENTO"
                    ? "bg-slate-700 text-white border-slate-700 shadow-md"
                    : "bg-white text-slate-500 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <Archive className="w-4 h-4" />
                Para Arquivamento
              </button>
            </div>
          </div>

          {/* Carece de Resposta */}
          <div
            onClick={() => setEditComCarece(!editComCarece)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
              editComCarece
                ? "bg-amber-50 border-amber-200"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              editComCarece ? "bg-amber-500 border-amber-500" : "bg-white border-slate-300"
            }`}>
              {editComCarece && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <div>
              <span className={`text-xs font-bold ${editComCarece ? "text-amber-800" : "text-slate-600"}`}>
                Esta comunicação carece / exige resposta oficial da assessoria
              </span>
              {editComCarece && (
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  O prazo de resposta será monitorado e contabilizado.
                </p>
              )}
            </div>
          </div>

          {/* Timer de tempo decorrido */}
          {tempoInfo && (
            <div className={`p-3 rounded-xl flex items-center justify-between border ${tempoInfo.resolved ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${tempoInfo.resolved ? "text-emerald-600" : "text-amber-600"}`} />
                <span className={`text-xs font-black uppercase tracking-wider ${tempoInfo.resolved ? "text-emerald-700" : "text-amber-700"}`}>
                  {tempoInfo.resolved ? "Comunicação Respondida" : "Tempo Decorrido sem Resposta"}
                </span>
              </div>
              <span className={`text-sm font-bold tabular-nums ${tempoInfo.resolved ? "text-emerald-800" : "text-amber-800"}`}>
                {tempoInfo.resolved ? `Em ${tempoInfo.diffDays} dia(s)` : `${tempoInfo.diffDays} dia(s) em aberto`}
              </span>
            </div>
          )}
        </div>

        {/* ── BLOCO 2: Datas ─────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            ② Datas
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data de Expedição</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                className={inputClass}
                value={editComExpedicao}
                onChange={(e) => setEditComExpedicao(e.target.value)}
              />
            </div>
            <div>
              <label className={`${labelClass} text-[#1351b4]`}>Data da Resposta</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA — deixar em branco se pendente"
                className="w-full border border-blue-200 bg-blue-50/30 rounded-lg p-2.5 text-xs text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#1351b4] transition-all font-bold"
                value={editComResposta}
                onChange={(e) => setEditComResposta(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── BLOCO 3: Identificação ─────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            ③ Identificação e Origem
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Unidade Emitente</label>
              <input type="text" className={inputClass} value={editComUnidade} onChange={(e) => setEditComUnidade(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Processo Associado</label>
              <input type="text" className={inputClass} value={editComProcesso} onChange={(e) => setEditComProcesso(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Nº Processo SEI</label>
              <input
                type="text"
                placeholder="Ex: 19973.100234/2026-99"
                className={inputClass}
                value={editComProcessoSei}
                onChange={(e) => setEditComProcessoSei(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── BLOCO 4: Destinatário ──────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            ④ Destinatário e Responsável
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Destinatário</label>
              <input type="text" className={inputClass} value={editComDestinatario} onChange={(e) => setEditComDestinatario(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Contato de Referência</label>
              <input type="text" className={inputClass} value={editComContato} onChange={(e) => setEditComContato(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Unidade Executora</label>
              <input
                type="text"
                placeholder="Ex: SECI"
                className={inputClass}
                value={editComUnidadeExecutora}
                onChange={(e) => setEditComUnidadeExecutora(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Links rápidos ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
          <a
            href="https://processoeletronico.trabalho.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 border border-slate-200 hover:border-[#003366]/30 hover:bg-[#003366]/5 text-[#003366] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Acessar SEI
          </a>
          <a
            href="https://conecta-tcu.apps.tcu.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 border border-slate-200 hover:border-[#003366]/30 hover:bg-[#003366]/5 text-[#003366] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Conecta TCU
          </a>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition rounded-xl text-xs font-bold cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#003366] text-white rounded-xl text-xs font-bold hover:bg-[#0f4396] disabled:opacity-50 transition cursor-pointer flex items-center gap-2 shadow-md shadow-blue-900/20"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}
