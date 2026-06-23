/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldAlert, Search, Plus, Filter, Edit3, Trash2, X, AlertTriangle, FileText, CheckCircle } from "lucide-react";
import { ComissaoEticaDemand } from "../types";

interface EticaModuleProps {
  etica: ComissaoEticaDemand[];
  onAddEtica: (newEtica: any) => Promise<boolean>;
  onUpdateEtica: (id: string, updated: any) => Promise<boolean>;
  onDeleteEtica: (id: string) => Promise<boolean>;
}

export default function EticaModule({ etica, onAddEtica, onUpdateEtica, onDeleteEtica }: EticaModuleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Form states
  const [protocolo, setProtocolo] = useState("");
  const [dataClassificacao, setDataClassificacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [envolvidos, setEnvolvidos] = useState("");
  const [orgaoOrigem, setOrgaoOrigem] = useState("");
  const [relator, setRelator] = useState("");
  const [status, setStatus] = useState<'Triagem' | 'Apuração Preliminar' | 'Processo Ético' | 'Concluído' | 'Arquivado'>("Triagem");
  const [recomendacoes, setRecomendacoes] = useState("");

  // Edit Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProtocol, setEditProtocol] = useState("");
  const [editData, setEditData] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEnvolvidos, setEditEnvolvidos] = useState("");
  const [editOrigem, setEditOrigem] = useState("");
  const [editRelator, setEditRelator] = useState("");
  const [editStatus, setEditStatus] = useState<any>("Triagem");
  const [editRecomenda, setEditRecomenda] = useState("");

  const handleOpenEdit = (item: ComissaoEticaDemand) => {
    setEditingId(item.id);
    setEditProtocol(item.protocolo);
    setEditData(item.dataClassificacao);
    setEditDesc(item.descricao);
    setEditEnvolvidos(item.envolvidos);
    setEditOrigem(item.orgaoOrigem);
    setEditRelator(item.relator);
    setEditStatus(item.status);
    setEditRecomenda(item.recomendacoes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const body = {
      protocolo: editProtocol,
      dataClassificacao: editData,
      descricao: editDesc,
      envolvidos: editEnvolvidos,
      orgaoOrigem: editOrigem,
      relator: editRelator,
      status: editStatus,
      recomendacoes: editRecomenda
    };
    const success = await onUpdateEtica(editingId, body);
    if (success) setEditingId(null);
  };

  const handleSaveAdd = async () => {
    if (!descricao || !envolvidos || !relator) {
      alert("Por favor, informe a descrição dos fatos, envolvidos e relator designado.");
      return;
    }

    const genProtocolo = protocolo || `MTE-ETI-2026-${String(Math.floor(Math.random() * 900) + 100)}`;
    const body = {
      protocolo: genProtocolo,
      dataClassificacao: dataClassificacao || new Date().toISOString().split('T')[0],
      descricao,
      envolvidos,
      orgaoOrigem: orgaoOrigem || "Ouvidoria Fala.BR",
      relator,
      status,
      recomendacoes
    };

    const success = await onAddEtica(body);
    if (success) {
      setShowAddModal(false);
      // Reset form
      setProtocolo("");
      setDataClassificacao("");
      setDescricao("");
      setEnvolvidos("");
      setOrgaoOrigem("");
      setRelator("");
      setStatus("Triagem");
      setRecomendacoes("");
    }
  };

  const filteredEtica = etica.filter(item => {
    const matchesSearch = 
      item.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.envolvidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.relator.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "TODOS" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 justify-start">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Comissão de Ética: Demandas Autuadas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de protocolos éticos e representações no âmbito da autarquia.</p>
        </div>

        <div>
          <button 
            id="btn-add-protocolo-etica"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs inline-flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            Autuar Novo Protocolo Ético
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
        
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="txt-search-etica"
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            placeholder="Pesquisar por Protocolo, Descrição ou Relator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>Filtro de Processamento:</span>
          <select
            id="select-filter-etica-status"
            className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs text-slate-800 focus:outline-hidden"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Casos</option>
            <option value="Triagem">Em Triagem</option>
            <option value="Apuração Preliminar">Apuração Preliminar</option>
            <option value="Processo Ético">Processo Ético Ativo</option>
            <option value="Concluído">Concluídos</option>
            <option value="Arquivado">Arquivados</option>
          </select>
        </div>

      </div>

      {/* Grid of Bento-style Complaint Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEtica.length === 0 ? (
          <div className="md:col-span-2 text-center py-12 bg-white rounded-lg border text-slate-400 text-xs">
            Nenhuma demanda de comissão de ética cadastrada ou localizada.
          </div>
        ) : (
          filteredEtica.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-amber-300 transition-all">
              
              <div>
                {/* Header card metadata */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      {item.protocolo}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                      Classificação: {new Date(item.dataClassificacao + "T00:00:00").toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === "Concluído" ? "bg-emerald-100 text-emerald-800" :
                    item.status === "Processo Ético" ? "bg-amber-100 text-amber-800 animate-pulse" :
                    item.status === "Apuração Preliminar" ? "bg-blue-100 text-blue-800" :
                    item.status === "Arquivado" ? "bg-slate-100 text-slate-600" :
                    "bg-purple-100 text-purple-800"
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Complaint Body */}
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Fatos Denunciados / Objeto</span>
                    <p className="text-xs text-slate-800 mt-0.5 leading-relaxed line-clamp-3 font-medium">
                      {item.descricao}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Envolvidos apurados</span>
                      <p className="text-slate-700 font-medium truncate mt-0.5">{item.envolvidos}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Canal de Origem</span>
                      <p className="text-slate-700 truncate mt-0.5">{item.orgaoOrigem}</p>
                    </div>
                  </div>

                  <div className="border-t pt-2 mt-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Relator Responsável</span>
                    <p className="text-xs text-slate-800 flex items-center gap-1 mt-0.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      {item.relator}
                    </p>
                  </div>

                  {item.recomendacoes && (
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-150 text-[11px] text-slate-600">
                      <span className="font-bold text-[10px] uppercase text-slate-500 block">Parecer / Recomendações AECI:</span>
                      <p className="mt-0.5 italic leading-relaxed">“{item.recomendacoes}”</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Operations */}
              <div className="flex md:items-center justify-between border-t border-slate-100 pt-3 mt-4 text-xs">
                <span className="text-slate-400 text-[10px]">Identificador: {item.id}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1 px-2 border hover:bg-slate-100 text-blue-700 rounded inline-flex items-center gap-1 font-bold text-[10px]"
                  >
                    <Edit3 className="w-3 h-3" /> Editar Demanda
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir o protocolo ${item.protocolo} permanentemente do Orbita?`)) {
                        onDeleteEtica(item.id);
                      }
                    }}
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* ADD/EDIT ETHICS DIALOG */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg border overflow-hidden flex flex-col">
            
            <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-amber-500">Autuar Protocolo Ético</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] text-slate-800">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Cód. Protocolo (Opcional):</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded font-mono" placeholder="Deixe em branco p/ gerar" value={protocolo} onChange={e => setProtocolo(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Data da Autuação:</label>
                  <input type="date" className="w-full bg-slate-50 border p-2 text-xs rounded font-mono" value={dataClassificacao} onChange={e => setDataClassificacao(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Descrição Detalhada do Fato / Fato Gerador:</label>
                <textarea className="w-full h-24 bg-slate-50 border p-2 text-xs rounded" placeholder="Insira o resumo da representação de conduta, assédio, reclamações ou conflito de interesse..." value={descricao} onChange={e => setDescricao(e.target.value)}></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans">
                <div>
                  <label className="text-xs font-bold block mb-1">Servidores Envolvidos / Apurados:</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded" placeholder="Nome ou cargo" value={envolvidos} onChange={e => setEnvolvidos(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Canal Origem:</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded" placeholder="Ex: Ouvidoria Fala.BR" value={orgaoOrigem} onChange={e => setOrgaoOrigem(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans">
                <div>
                  <label className="text-xs font-bold block mb-1">Relator Técnico Designado:</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded" placeholder="Ex: Dra. Carla Antunes" value={relator} onChange={e => setRelator(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Status de Processamento:</label>
                  <select className="w-full bg-slate-50 border p-2 text-xs rounded" value={status} onChange={e => setStatus(e.target.value as any)}>
                    <option value="Triagem">Triagem</option>
                    <option value="Apuração Preliminar">Apuração Preliminar</option>
                    <option value="Processo Ético">Processo Ético</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Arquivado">Arquivado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Recomendações e Medidas Proferidas:</label>
                <textarea className="w-full h-16 bg-slate-50 border p-2 text-xs rounded" placeholder="Insira as determinações da comissão e encaminhamentos operacionais..." value={recomendacoes} onChange={e => setRecomendacoes(e.target.value)}></textarea>
              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-1.5 text-slate-600 font-semibold">Cancelar</button>
              <button onClick={handleSaveAdd} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded shadow-xs">Concluir Autuação</button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg border overflow-hidden flex flex-col">
            
            <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold font-display text-amber-500 uppercase tracking-wider">Editar Protocolo {editProtocol}</h3>
              <button onClick={() => setEditingId(null)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] text-slate-800">
              
              <div>
                <label className="text-xs font-bold block mb-1">Descrição do Fato:</label>
                <textarea className="w-full h-24 bg-slate-50 border p-2 text-xs rounded" value={editDesc} onChange={e => setEditDesc(e.target.value)}></textarea>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Envolvidos Apurados:</label>
                <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded" value={editEnvolvidos} onChange={e => setEditEnvolvidos(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Relator Responsável:</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded" value={editRelator} onChange={e => setEditRelator(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Situação Processual:</label>
                  <select className="w-full bg-slate-50 border p-2 text-xs rounded" value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                    <option value="Triagem">Triagem</option>
                    <option value="Apuração Preliminar">Apuração Preliminar</option>
                    <option value="Processo Ético">Processo Ético</option>
                    <option value="Concluído">Concluído</option>
                    <option value="Arquivado">Arquivado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Parecer / Conclusão e Recomendações:</label>
                <textarea className="w-full h-20 bg-slate-50 border p-2 text-xs rounded" value={editRecomenda} onChange={e => setEditRecomenda(e.target.value)}></textarea>
              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-slate-600 font-semibold">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-4 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded shadow-xs">Salvar Alterações</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
