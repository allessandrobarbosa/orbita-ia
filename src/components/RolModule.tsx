/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Users, Search, PlusCircle, CheckCircle2, AlertCircle, Edit3, Trash2, X, ShieldAlert } from "lucide-react";
import { RolResponsavel } from "../types";

interface RolModuleProps {
  rol: RolResponsavel[];
  onAddRol: (newRol: any) => Promise<boolean>;
  onUpdateRol: (id: string, updated: any) => Promise<boolean>;
  onDeleteRol: (id: string) => Promise<boolean>;
}

export default function RolModule({ rol, onAddRol, onUpdateRol, onDeleteRol }: RolModuleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Form states
  const [newName, setNewName] = useState("");
  const [newCpf, setNewCpf] = useState("");
  const [newCargo, setNewCargo] = useState("");
  const [newUnidade, setNewUnidade] = useState("");
  const [newInicio, setNewInicio] = useState("");
  const [newFim, setNewFim] = useState("Vigente");
  const [newAto, setNewAto] = useState("");
  const [newStatus, setNewStatus] = useState<"Vigente" | "Encerrado">("Vigente");
  const [newObs, setNewObs] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCpf, setEditCpf] = useState("");
  const [editCargo, setEditCargo] = useState("");
  const [editUnidade, setEditUnidade] = useState("");
  const [editInicio, setEditInicio] = useState("");
  const [editFim, setEditFim] = useState("Vigente");
  const [editAto, setEditAto] = useState("");
  const [editStatus, setEditStatus] = useState<"Vigente" | "Encerrado">("Vigente");
  const [editObs, setEditObs] = useState("");

  const handleOpenEdit = (item: RolResponsavel) => {
    setEditingId(item.id);
    setEditName(item.nome);
    setEditCpf(item.cpf);
    setEditCargo(item.cargo);
    setEditUnidade(item.unidade);
    setEditInicio(item.inicioExercicio);
    setEditFim(item.fimExercicio);
    setEditAto(item.atoNomeacao);
    setEditStatus(item.status as any);
    setEditObs(item.observacoes || "");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const body = {
      nome: editName,
      cpf: editCpf,
      cargo: editCargo,
      unidade: editUnidade,
      inicioExercicio: editInicio,
      fimExercicio: editFim,
      atoNomeacao: editAto,
      status: editStatus,
      observacoes: editObs
    };
    const success = await onUpdateRol(editingId, body);
    if (success) setEditingId(null);
  };

  const handleSaveAdd = async () => {
    if (!newName || !newCpf || !newCargo) {
      alert("Por favor, preencha nome, CPF e cargo do responsável.");
      return;
    }
    const body = {
      nome: newName,
      cpf: newCpf,
      cargo: newCargo,
      unidade: newUnidade,
      inicioExercicio: newInicio || new Date().toISOString().split('T')[0],
      fimExercicio: newFim,
      atoNomeacao: newAto,
      status: newStatus,
      observacoes: newObs
    };
    const success = await onAddRol(body);
    if (success) {
      setShowAddModal(false);
      // reset form
      setNewName("");
      setNewCpf("");
      setNewCargo("");
      setNewUnidade("");
      setNewInicio("");
      setNewFim("Vigente");
      setNewAto("");
      setNewStatus("Vigente");
      setNewObs("");
    }
  };

  const filteredRol = rol.filter(r => {
    const matchesSearch = 
      r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unidade && r.unidade.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "TODOS" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 justify-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#003366] text-amber-400 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
              Conformidade IN 84/TCU
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ESTADO: COMPILADO</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-700" />
            Rol de Responsáveis: IN 84/TCU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão e acompanhamento permanente do mandato dos dirigentes e ordenadores de despesas do MTE.</p>
        </div>

        <div>
          <button 
            id="btn-add-responsavel"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Vincular Novo Dirigente
          </button>
        </div>
      </div>

      {/* Advisory Warning */}
      <div className="bg-[#f0f9f6]/80 p-5 border border-emerald-100 rounded-2xl flex items-start gap-3 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-extrabold text-emerald-900 uppercase tracking-wide text-[10px] block mb-1">Deliberação Normativa IN 84 do TCU:</span> 
          Os órgãos da administração pública federal devem manter permanente, atualizado e plenamente publicado em seus portais de transparência o <strong>quadro de dirigentes máximos</strong>, indicando datas de nomeação, exercício corrente, exonerações e eventuais impedimentos legais para apurações tempestivas pelas instâncias de fiscalização.
        </div>
      </div>

      {/* Filters HUD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="txt-search-responsavel"
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-emerald-550 focus:bg-white focus:outline-hidden transition"
            placeholder="Pesquisar por Nome, Cargo ou Unidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className="font-semibold">Filtrar Exercício:</span>
          <select
            id="select-filter-rol-status"
            className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Dirigentes</option>
            <option value="Vigente">Mandatos Vigentes</option>
            <option value="Encerrado">Mandatos Encerrados</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto text-xs">
            
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="px-4 py-3">Nome Dirigente</th>
                <th className="px-4 py-3">CPF</th>
                <th className="px-4 py-3">Cargo Executivo</th>
                <th className="px-4 py-3">Unidade do Ministério</th>
                <th className="px-4 py-3">Início Exercício</th>
                <th className="px-4 py-3">Fim Exercício</th>
                <th className="px-4 py-3">Ato Nomeação</th>
                <th className="px-4 py-3 text-center">Situação Mandato</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredRol.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-450 font-sans">
                    Nenhum dirigente cadastrado ou localizado com este critério de pesquisa.
                  </td>
                </tr>
              ) : (
                filteredRol.map((r) => {
                  const isEditingThis = editingId === r.id;
                  
                  if (isEditingThis) {
                    return (
                      <tr key={r.id} className="bg-slate-50 border-b border-slate-200">
                        <td className="p-2 border">
                          <input type="text" className="w-full border p-1 rounded text-xs" value={editName} onChange={e => setEditName(e.target.value)} />
                        </td>
                        <td className="p-2 border">
                          <input type="text" className="w-full border p-1 rounded text-xs" value={editCpf} onChange={e => setEditCpf(e.target.value)} placeholder="000.000.000-00" />
                        </td>
                        <td className="p-2 border">
                          <input type="text" className="w-full border p-1 rounded text-xs" value={editCargo} onChange={e => setEditCargo(e.target.value)} />
                        </td>
                        <td className="p-2 border">
                          <input type="text" className="w-full border p-1 rounded text-xs" value={editUnidade} onChange={e => setEditUnidade(e.target.value)} />
                        </td>
                        <td className="p-2 border">
                          <input type="date" className="w-full border p-1 rounded text-xs" value={editInicio} onChange={e => setEditInicio(e.target.value)} />
                        </td>
                        <td className="p-2 border">
                          <input type="text" className="w-full border p-1 rounded text-xs" value={editFim} onChange={e => setEditFim(e.target.value)} />
                        </td>
                        <td className="p-2 border">
                          <input type="text" className="w-full border p-1 rounded text-xs" value={editAto} onChange={e => setEditAto(e.target.value)} />
                        </td>
                        <td className="p-2 border text-center">
                          <select className="border p-1 rounded text-[11px]" value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                            <option value="Vigente">Vigente</option>
                            <option value="Encerrado">Encerrado</option>
                          </select>
                        </td>
                        <td className="p-2 border text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={handleSaveEdit} className="px-2 py-0.5 bg-emerald-700 text-white rounded font-bold text-[10px]">Salvar</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-slate-300 text-slate-800 rounded font-bold text-[10px]">X</button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{r.nome}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{r.cpf}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{r.cargo}</td>
                      <td className="px-4 py-3 text-slate-600">{r.unidade}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {r.inicioExercicio ? new Date(r.inicioExercicio + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-650 font-mono">
                        {r.fimExercicio === "Vigente" ? (
                          <span className="text-emerald-700 font-bold uppercase text-[10px]">Exercício Ativo</span>
                        ) : (
                          new Date(r.fimExercicio + "T00:00:00").toLocaleDateString("pt-BR")
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-550 italic">{r.atoNomeacao}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === "Vigente" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {r.status === "Vigente" ? "Ativo" : "Encerrado"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleOpenEdit(r)} className="p-1 hover:bg-slate-100 text-blue-700 rounded">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => {
                            if (window.confirm(`Excluir ${r.nome} do Rol de Responsáveis?`)) {
                              onDeleteRol(r.id);
                            }
                          }} className="p-1 hover:bg-rose-50 text-rose-600 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* ADD NEW DIRIGENTE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden border shadow-xl flex flex-col">
            
            <div className="bg-emerald-800 px-5 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold font-display uppercase tracking-wider">Vincular Dirigente - IN 84/TCU</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] text-slate-800">
              
              <div>
                <label className="text-xs font-bold block mb-1">Nome Completo do Dirigente:</label>
                <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded focus:outline-hidden" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Luiz Marinho" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">CPF (com máscara):</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded font-mono focus:outline-hidden" value={newCpf} onChange={e => setNewCpf(e.target.value)} placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Unidade / Secretaria:</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded focus:outline-hidden" value={newUnidade} onChange={e => setNewUnidade(e.target.value)} placeholder="Ex: Gabinete do Ministro" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Cargo Executivo Regulamentado:</label>
                <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded focus:outline-hidden" value={newCargo} onChange={e => setNewCargo(e.target.value)} placeholder="Ex: Secretário-Executivo" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1">Início do Mandato / Exercício:</label>
                  <input type="date" className="w-full bg-slate-50 border p-2 text-xs rounded font-mono focus:outline-hidden" value={newInicio} onChange={e => setNewInicio(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">Término do Exercício:</label>
                  <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded focus:outline-hidden" value={newFim} onChange={e => setNewFim(e.target.value)} placeholder="Ex: Vigente ou data de cessão" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Ato Oficial de Nomeação / Portaria:</label>
                <input type="text" className="w-full bg-slate-50 border p-2 text-xs rounded focus:outline-hidden" value={newAto} onChange={e => setNewAto(e.target.value)} placeholder="Ex: Dec. Presidencial de 01/01/2023" />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Observações Operacionais:</label>
                <textarea className="w-full h-16 bg-slate-50 border p-2 text-xs rounded focus:outline-hidden" value={newObs} onChange={e => setNewObs(e.target.value)} placeholder="Notas adicionais sobre aprovação de contas anteriores ou transições..."></textarea>
              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-1.5 text-slate-600 font-semibold">Cancelar</button>
              <button onClick={handleSaveAdd} className="px-4 py-1.5 bg-emerald-700 font-bold hover:bg-emerald-800 text-white rounded shadow-xs transition">Salvar Vincular</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
