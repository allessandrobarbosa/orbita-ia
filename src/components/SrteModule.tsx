/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Building2, Search, Filter, Phone, Mail, MapPin, AlertCircle, Edit, Save, X } from "lucide-react";
import { SuperintendenciaRegional } from "../types";

interface SrteModuleProps {
  superintendencias: SuperintendenciaRegional[];
  onUpdateSrte: (uf: string, data: any) => Promise<boolean>;
}

export default function SrteModule({ superintendencias, onUpdateSrte }: SrteModuleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [editingUf, setEditingUf] = useState<string | null>(null);

  // Edit states
  const [editSuperintendent, setEditSuperintendent] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTCU, setEditTCU] = useState(0);
  const [editCGU, setEditCGU] = useState(0);
  const [editEtica, setEditEtica] = useState(0);
  const [editStatus, setEditStatus] = useState<"Regular" | "Atenção" | "Crítico">("Regular");

  const handleOpenEdit = (sr: SuperintendenciaRegional) => {
    setEditingUf(sr.uf);
    setEditSuperintendent(sr.superintendente);
    setEditAddress(sr.endereco);
    setEditContact(sr.contato);
    setEditEmail(sr.email);
    setEditTCU(sr.demandasTCU);
    setEditCGU(sr.demandasCGU);
    setEditEtica(sr.demandasEtica);
    setEditStatus(sr.statusGeral);
  };

  const handleSaveEdit = async () => {
    if (!editingUf) return;
    const updateBody = {
      superintendente: editSuperintendent,
      endereco: editAddress,
      contato: editContact,
      email: editEmail,
      demandasTCU: Number(editTCU),
      demandasCGU: Number(editCGU),
      demandasEtica: Number(editEtica),
      statusGeral: editStatus
    };

    const success = await onUpdateSrte(editingUf, updateBody);
    if (success) {
      setEditingUf(null);
    }
  };

  // Filter List
  const filteredSrtes = superintendencias.filter(s => {
    const matchesSearch = 
      s.uf.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.capital.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.superintendente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "TODOS" || s.statusGeral === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const totalCriticos = superintendencias.filter(s => s.statusGeral === "Crítico").length;
  const totalAtencao = superintendencias.filter(s => s.statusGeral === "Atenção").length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* HUD HEADER */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display flex items-center gap-2">
          <Building2 className="w-6 h-6 text-slate-700" />
          Superintendências Regionais (SRTEs)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Visão unificada das 26 Superintendências Estaduais do Trabalho e do Distrito Federal sob monitoramento de conformidade.</p>
      </div>

      {/* Aggregate Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-205 p-4 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-800 font-bold block">Unidades Críticas</span>
            <span className="text-2xl font-bold font-mono text-rose-950 mt-1 block">{totalCriticos}</span>
          </div>
          <AlertCircle className="w-8 h-8 text-rose-600 shrink-0" />
        </div>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-800 font-bold block">Em Estado de Atenção</span>
            <span className="text-2xl font-bold font-mono text-amber-950 mt-1 block">{totalAtencao}</span>
          </div>
          <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-800 font-bold block">Conformidade Regular</span>
            <span className="text-2xl font-bold font-mono text-emerald-950 mt-1 block">
              {superintendencias.length - totalCriticos - totalAtencao}
            </span>
          </div>
          <Building2 className="w-8 h-8 text-emerald-600 shrink-0" />
        </div>
      </div>

      {/* Filter HUD */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="txt-search-srte"
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:outline-hidden"
            placeholder="Pesquisar por UF, Capital ou Superintendente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <span>Risco Geral:</span>
          <select
            id="select-filter-srte"
            className="bg-slate-50 border border-slate-200 p-1.5 rounded text-xs text-slate-800 focus:outline-hidden"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos os Estados</option>
            <option value="Regular">Situação Regular</option>
            <option value="Atenção">Atenção</option>
            <option value="Crítico">Crítico</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSrtes.map((sr) => {
          const isEditing = editingUf === sr.uf;

          return (
            <div key={sr.uf} className={`bg-white rounded-lg border p-4 shadow-3xs flex flex-col justify-between hover:shadow-xs transition ${
              sr.statusGeral === "Crítico" ? "border-l-4 border-l-rose-600" :
              sr.statusGeral === "Atenção" ? "border-l-4 border-l-amber-500" : 
              "border-l-4 border-l-emerald-500"
            }`}>

              <div>
                {/* Header state meta */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                  <div>
                    <h3 className="font-bold text-xs font-mono text-slate-900 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-[11px] flex items-center justify-center font-bold text-slate-800 border">
                        {sr.uf}
                      </span>
                      SRTE / {sr.capital}
                    </h3>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    sr.statusGeral === "Crítico" ? "bg-rose-100 text-rose-800 animate-pulse" :
                    sr.statusGeral === "Atenção" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {sr.statusGeral}
                  </span>
                </div>

                {isEditing ? (
                  /* EDIT FORMS */
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Superintendente:</label>
                      <input type="text" className="w-full border p-1 rounded font-sans text-xs" value={editSuperintendent} onChange={e => setEditSuperintendent(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço:</label>
                      <input type="text" className="w-full border p-1 rounded font-sans text-xs" value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Celular/Tel:</label>
                        <input type="text" className="w-full border p-1 rounded font-sans text-xs" value={editContact} onChange={e => setEditContact(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Email:</label>
                        <input type="text" className="w-full border p-1 rounded font-sans text-xs" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                      </div>
                    </div>
                    
                    {/* Demands count */}
                    <div className="grid grid-cols-3 gap-1 border-t pt-2 mt-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500">Dem. TCU</label>
                        <input type="number" className="w-full border p-1 rounded font-mono text-xs" value={editTCU} onChange={e => setEditTCU(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500">CGU</label>
                        <input type="number" className="w-full border p-1 rounded font-mono text-xs" value={editCGU} onChange={e => setEditCGU(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500">Ética</label>
                        <input type="number" className="w-full border p-1 rounded font-mono text-xs" value={editEtica} onChange={e => setEditEtica(Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Risco Geral:</label>
                      <select className="border p-1 rounded w-full text-xs" value={editStatus} onChange={e => setEditStatus(e.target.value as any)}>
                        <option value="Regular">Regular</option>
                        <option value="Atenção">Atenção</option>
                        <option value="Crítico">Crítico</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* DISPLAY CARD DATA */
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block">Superintendente Designado</span>
                      <p className="text-slate-800 font-bold">{sr.superintendente}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sr.endereco}</span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sr.contato}</span>
                      </p>
                      <p className="text-slate-600 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-blue-800 underline">{sr.email}</span>
                      </p>
                    </div>

                    {/* Active Demands Gauge */}
                    <div className="border-t border-slate-100 pt-2.5 mt-2.5">
                      <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1.5">Demandas Ativas Internas</span>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-slate-50 p-1.5 border rounded">
                          <span className="text-slate-500 block font-sans">TCU</span>
                          <span className="text-xs font-bold font-mono text-slate-800">{sr.demandasTCU}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 border rounded">
                          <span className="text-slate-500 block font-sans">CGU</span>
                          <span className="text-xs font-bold font-mono text-slate-800">{sr.demandasCGU}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 border rounded">
                          <span className="text-slate-500 block font-sans">Ética</span>
                          <span className="text-xs font-bold font-mono text-slate-800">{sr.demandasEtica}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit command trigger */}
              <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-2.5 mt-3 text-xs">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingUf(null)} className="px-2.5 py-1 text-slate-600 font-bold hover:text-slate-800">
                      Cancelar
                    </button>
                    <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-800 text-white rounded font-bold hover:bg-blue-900 flex items-center gap-1">
                      <Save className="w-3 h-3" /> Salvar Srt
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleOpenEdit(sr)} className="px-2 py-1 text-slate-600 border rounded hover:bg-slate-50 font-medium inline-flex items-center gap-1 text-[10px]">
                    <Edit className="w-3 h-3" /> Atualizar Unidade
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
