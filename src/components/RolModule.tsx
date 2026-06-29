/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Users, Calendar, Building2, FileText, ExternalLink,
  PlusCircle, Trash2, Edit3, X,
  ChevronDown, ChevronUp, Shield, Lock, Briefcase
} from "lucide-react";
import { UnidadeRol, Dirigente, DirigenteCargo, DirigenteEvento } from "../types";

const maskCpf = (cpf: string): string => {
  if (!cpf) return "";
  if (cpf.includes("X")) return cpf;
  const c = cpf.replace(/\D/g, "");
  if (c.length === 11) return `XXX.${c.substring(3, 6)}.${c.substring(6, 9)}-XX`;
  return cpf;
};

const formatDate = (d: string): string => {
  if (!d) return "";
  const p = d.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
};

const getYear = (d: string): number => d ? parseInt(d.split("-")[0], 10) : 0;

const isEventoVigente = (e: DirigenteEvento): boolean => {
  const today = new Date().toISOString().split("T")[0];
  return e.dataInicio <= today && e.dataFim >= today;
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
    <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f]">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[75vh]">{children}</div>
    </div>
  </div>
);

const inputCls = "w-full bg-[#0a1628] border border-[#1e3a5f] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors";
const labelCls = "block text-xs font-medium text-gray-400 mb-1";
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div><label className={labelCls}>{label}</label>{children}</div>
);

const VinculoBadge: React.FC<{ tipo: DirigenteCargo["tipoVinculo"] }> = ({ tipo }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
    tipo === "Titular"
      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
      : "bg-purple-600/20 text-purple-300 border border-purple-500/30"
  }`}>
    {tipo === "Titular" ? <Shield size={10} /> : <Users size={10} />}
    {tipo}
  </span>
);

type ActiveTab = "timeline" | "dirigentes" | "unidades";
type ModalType = "unidade" | "dirigente" | "cargo" | "evento" | null;

export default function RolModule() {
  const [unidades, setUnidades] = useState<UnidadeRol[]>([]);
  const [dirigentes, setDirigentes] = useState<Dirigente[]>([]);
  const [cargos, setCargos] = useState<DirigenteCargo[]>([]);
  const [eventos, setEventos] = useState<DirigenteEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("timeline");
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [filterAno, setFilterAno] = useState<string>("todos");
  const [filterUnidade, setFilterUnidade] = useState<string>("todas");
  const [editingUnidade, setEditingUnidade] = useState<Partial<UnidadeRol>>({});
  const [editingDirigente, setEditingDirigente] = useState<Partial<Dirigente>>({});
  const [editingCargo, setEditingCargo] = useState<Partial<DirigenteCargo>>({});
  const [editingEvento, setEditingEvento] = useState<Partial<DirigenteEvento>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, d, c, e] = await Promise.all([
        fetch("/api/unidades-rol").then(r => r.json()),
        fetch("/api/dirigentes").then(r => r.json()),
        fetch("/api/dirigentes/cargos").then(r => r.json()),
        fetch("/api/dirigentes/eventos").then(r => r.json()),
      ]);
      setUnidades(u); setDirigentes(d); setCargos(c); setEventos(e);
    } catch { showToast("Erro ao carregar dados", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => { setActiveModal(null); setIsEditing(false); };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    cargos.forEach(c => { years.add(getYear(c.inicioExercicio)); if (c.fimExercicio) years.add(getYear(c.fimExercicio)); });
    eventos.forEach(e => { years.add(getYear(e.dataInicio)); years.add(getYear(e.dataFim)); });
    return Array.from(years).sort((a, b) => b - a);
  }, [cargos, eventos]);

  const timelineNodes = useMemo(() => {
    return cargos
      .filter(c => {
        const matchUnidade = filterUnidade === "todas" || c.unidadeId === filterUnidade;
        const year = getYear(c.inicioExercicio);
        const endYear = c.fimExercicio ? getYear(c.fimExercicio) : new Date().getFullYear();
        const matchAno = filterAno === "todos" || (year <= parseInt(filterAno) && endYear >= parseInt(filterAno));
        return matchUnidade && matchAno;
      })
      .map(cargo => ({
        cargo,
        dirigente: dirigentes.find(d => d.id === cargo.dirigenteId),
        unidade: unidades.find(u => u.id === cargo.unidadeId),
        cargoEventos: eventos.filter(e => e.cargoId === cargo.id),
      }))
      .filter(n => n.dirigente && n.unidade);
  }, [cargos, eventos, dirigentes, unidades, filterAno, filterUnidade]);

  const saveUnidade = async () => {
    setSubmitting(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/unidades-rol/${editingUnidade.id}` : "/api/unidades-rol";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingUnidade) });
      await fetchAll(); closeModal(); showToast(isEditing ? "Unidade atualizada!" : "Unidade cadastrada!");
    } catch { showToast("Erro ao salvar unidade.", "error"); }
    finally { setSubmitting(false); }
  };

  const deleteUnidade = async (id: string) => {
    if (!confirm("Excluir esta unidade?")) return;
    await fetch(`/api/unidades-rol/${id}`, { method: "DELETE" });
    fetchAll(); showToast("Unidade excluida.");
  };

  const saveDirigente = async () => {
    setSubmitting(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/dirigentes/${editingDirigente.id}` : "/api/dirigentes";
      const body = { ...editingDirigente, cpf: maskCpf(editingDirigente.cpf || "") };
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await fetchAll(); closeModal(); showToast(isEditing ? "Dirigente atualizado!" : "Dirigente cadastrado!");
    } catch { showToast("Erro ao salvar dirigente.", "error"); }
    finally { setSubmitting(false); }
  };

  const deleteDirigente = async (id: string) => {
    if (!confirm("Excluir este dirigente?")) return;
    await fetch(`/api/dirigentes/${id}`, { method: "DELETE" });
    fetchAll(); showToast("Dirigente excluido.");
  };

  const saveCargo = async () => {
    setSubmitting(true);
    try {
      const method = isEditing ? "PUT" : "POST";
      const url = isEditing ? `/api/dirigentes/cargos/${editingCargo.id}` : "/api/dirigentes/cargos";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingCargo) });
      await fetchAll(); closeModal(); showToast(isEditing ? "Cargo atualizado!" : "Vinculo criado!");
    } catch { showToast("Erro ao salvar cargo.", "error"); }
    finally { setSubmitting(false); }
  };

  const deleteCargo = async (id: string) => {
    if (!confirm("Excluir este cargo?")) return;
    await fetch(`/api/dirigentes/cargos/${id}`, { method: "DELETE" });
    fetchAll(); showToast("Cargo excluido.");
  };

  const saveEvento = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/dirigentes/eventos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editingEvento) });
      await fetchAll(); closeModal(); showToast("Evento registrado!");
    } catch { showToast("Erro ao registrar evento.", "error"); }
    finally { setSubmitting(false); }
  };

  const deleteEvento = async (id: string) => {
    if (!confirm("Excluir este evento?")) return;
    await fetch(`/api/dirigentes/eventos/${id}`, { method: "DELETE" });
    fetchAll(); showToast("Evento removido.");
  };

  return (
    <div className="relative min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>{toast.msg}</div>
      )}

      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-700/50">
          <Shield size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Rol de Responsaveis</h1>
          <p className="text-xs text-gray-400">Art. 7o - Instrucao Normativa TCU no 84/2020</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-[#0a1628] border border-[#1e3a5f] rounded-xl p-1">
        {([
          { key: "timeline", label: "Linha do Tempo", icon: Calendar },
          { key: "dirigentes", label: "Dirigentes & Cargos", icon: Users },
          { key: "unidades", label: "Unidades", icon: Building2 },
        ] as { key: ActiveTab; label: string; icon: React.FC<{ size?: number }> }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key ? "bg-[#003366] text-white shadow" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {activeTab === "timeline" && (
            <div>
              <div className="flex flex-wrap gap-3 mb-6">
                <select value={filterAno} onChange={e => setFilterAno(e.target.value)}
                  className="bg-[#0a1628] border border-[#1e3a5f] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                  <option value="todos">Todos os anos</option>
                  {availableYears.map(y => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <select value={filterUnidade} onChange={e => setFilterUnidade(e.target.value)}
                  className="bg-[#0a1628] border border-[#1e3a5f] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                  <option value="todas">Todas as unidades</option>
                  {unidades.map(u => <option key={u.id} value={u.id}>{u.sigla} - {u.nome}</option>)}
                </select>
              </div>
              {timelineNodes.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Nenhum registro encontrado.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600/60 via-blue-600/30 to-transparent" />
                  <div className="space-y-4">
                    {timelineNodes.map(({ cargo, dirigente, unidade, cargoEventos }) => {
                      const isOpen = expandedNode === cargo.id;
                      const vigente = cargo.status === "Ativo";
                      return (
                        <div key={cargo.id} className="relative pl-20">
                          <div className={`absolute left-5 top-5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                            vigente ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/50" : "bg-gray-700 border-gray-600"
                          }`}>
                            {vigente ? <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-gray-500 rounded-full" />}
                          </div>
                          <div className={`bg-[#0d1b2e] border rounded-xl overflow-hidden ${vigente ? "border-blue-700/50" : "border-[#1e3a5f]"}`}>
                            <button className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors" onClick={() => setExpandedNode(isOpen ? null : cargo.id)}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <VinculoBadge tipo={cargo.tipoVinculo} />
                                    {vigente
                                      ? <span className="text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-semibold">VIGENTE</span>
                                      : <span className="text-xs bg-gray-600/20 text-gray-400 border border-gray-500/30 px-2 py-0.5 rounded-full">Encerrado</span>}
                                  </div>
                                  <h3 className="text-white font-semibold text-base">{dirigente!.nome}</h3>
                                  <p className="text-blue-300 text-sm">{cargo.cargo}</p>
                                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Building2 size={11} />{unidade!.sigla} - {unidade!.nome}</span>
                                    <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(cargo.inicioExercicio)} - {cargo.fimExercicio ? formatDate(cargo.fimExercicio) : "presente"}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {cargoEventos.length > 0 && (
                                    <span className="text-xs text-yellow-400 bg-yellow-600/10 border border-yellow-500/20 px-2 py-1 rounded-lg">
                                      {cargoEventos.length} evento{cargoEventos.length > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </div>
                              </div>
                            </button>
                            {isOpen && (
                              <div className="border-t border-[#1e3a5f] px-5 pb-5 pt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">CPF</p>
                                    <p className="text-gray-200 flex items-center gap-1"><Lock size={11} className="text-gray-500" />{maskCpf(dirigente!.cpf)}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-xs mb-0.5">E-mail</p>
                                    <p className="text-gray-200 text-sm">{dirigente!.email}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-gray-500 text-xs mb-0.5">Ato de Nomeacao</p>
                                    <a href={cargo.atoNomeacao.startsWith("http") ? cargo.atoNomeacao : "#"} target="_blank" rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 line-clamp-2">
                                      <FileText size={11} />{cargo.atoNomeacao}
                                    </a>
                                  </div>
                                  {cargo.atoExoneracao && (
                                    <div className="col-span-2">
                                      <p className="text-gray-500 text-xs mb-0.5">Ato de Exoneracao</p>
                                      <a href={cargo.atoExoneracao.startsWith("http") ? cargo.atoExoneracao : "#"} target="_blank" rel="noopener noreferrer"
                                        className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 line-clamp-2">
                                        <FileText size={11} />{cargo.atoExoneracao}
                                      </a>
                                    </div>
                                  )}
                                </div>
                                {cargoEventos.length > 0 && (
                                  <div>
                                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Eventos de Gestao</p>
                                    <div className="space-y-2">
                                      {cargoEventos.map(ev => {
                                        const sub = dirigentes.find(d => d.id === ev.substitutoId);
                                        const vigEvento = isEventoVigente(ev);
                                        return (
                                          <div key={ev.id} className={`rounded-lg px-3 py-2 border text-xs ${vigEvento ? "bg-yellow-900/20 border-yellow-700/40" : "bg-[#0a1628] border-[#1a3050]"}`}>
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600/30 text-blue-300">{ev.motivo}</span>
                                                  {vigEvento && <span className="text-yellow-400 font-semibold">Em curso</span>}
                                                </div>
                                                <p className="text-gray-400 mt-1">{formatDate(ev.dataInicio)} - {formatDate(ev.dataFim)}</p>
                                                {sub && <p className="text-gray-300 mt-0.5"><span className="text-gray-500">Substituto: </span>{sub.nome}</p>}
                                                {ev.atoAutorizacao && (
                                                  <a href={ev.atoAutorizacao.startsWith("http") ? ev.atoAutorizacao : "#"} target="_blank" rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1">
                                                    <ExternalLink size={10} />Ato de autorizacao
                                                  </a>
                                                )}
                                              </div>
                                              <button onClick={() => deleteEvento(ev.id)} className="text-red-500 hover:text-red-300 p-1 rounded hover:bg-red-600/10 shrink-0">
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div className="flex gap-2 pt-1 border-t border-[#1e3a5f]">
                                  <button onClick={() => { setEditingEvento({ dirigenteId: dirigente!.id, cargoId: cargo.id }); setIsEditing(false); setActiveModal("evento"); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800/30 hover:bg-blue-700/40 border border-blue-700/40 rounded-lg text-blue-300 text-xs font-medium transition-colors">
                                    <PlusCircle size={12} />Registrar Afastamento
                                  </button>
                                  <button onClick={() => { setEditingCargo(cargo); setIsEditing(true); setActiveModal("cargo"); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/30 hover:bg-gray-700/40 border border-gray-600/40 rounded-lg text-gray-300 text-xs font-medium transition-colors">
                                    <Edit3 size={12} />Editar Cargo
                                  </button>
                                  <button onClick={() => deleteCargo(cargo.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-800/20 hover:bg-red-700/30 border border-red-700/30 rounded-lg text-red-400 text-xs font-medium transition-colors ml-auto">
                                    <Trash2 size={12} />Remover
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "dirigentes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-400 text-sm">{dirigentes.length} dirigente{dirigentes.length !== 1 ? "s" : ""} cadastrado{dirigentes.length !== 1 ? "s" : ""}</p>
                <button onClick={() => { setEditingDirigente({ status: "Ativo" }); setIsEditing(false); setActiveModal("dirigente"); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <PlusCircle size={15} />Novo Dirigente
                </button>
              </div>
              {dirigentes.map(d => {
                const dCargos = cargos.filter(c => c.dirigenteId === d.id);
                return (
                  <div key={d.id} className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl overflow-hidden">
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${d.status === "Ativo" ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-gray-600/20 text-gray-400 border border-gray-500/30"}`}>{d.status}</span>
                          <h3 className="text-white font-semibold mt-1">{d.nome}</h3>
                          <p className="text-gray-400 text-sm">{d.email}</p>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1"><Lock size={10} />{maskCpf(d.cpf)}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => { setEditingCargo({ dirigenteId: d.id, tipoVinculo: "Titular", status: "Ativo" }); setIsEditing(false); setActiveModal("cargo"); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-800/30 hover:bg-blue-700/40 border border-blue-700/40 rounded-lg text-blue-300 text-xs font-medium transition-colors">
                            <Briefcase size={12} />Adicionar Cargo
                          </button>
                          <button onClick={() => { setEditingDirigente(d); setIsEditing(true); setActiveModal("dirigente"); }} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                          <button onClick={() => deleteDirigente(d.id)} className="p-1.5 text-red-500 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                        </div>
                      </div>
                      {dCargos.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#1e3a5f] space-y-2">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cargos e Vinculos</p>
                          {dCargos.map(c => {
                            const u = unidades.find(u => u.id === c.unidadeId);
                            return (
                              <div key={c.id} className="flex items-center justify-between gap-3 bg-[#0a1628] rounded-lg px-3 py-2 border border-[#1a3050]">
                                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                  <VinculoBadge tipo={c.tipoVinculo} />
                                  <span className="text-sm text-white font-medium truncate">{c.cargo}</span>
                                  <span className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={10} />{u?.sigla || "?"}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${c.status === "Ativo" ? "bg-green-600/15 text-green-400" : "bg-gray-600/20 text-gray-500"}`}>{c.status}</span>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <button onClick={() => { setEditingCargo(c); setIsEditing(true); setActiveModal("cargo"); }} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded"><Edit3 size={12} /></button>
                                  <button onClick={() => deleteCargo(c.id)} className="p-1 text-red-500 hover:text-red-300 hover:bg-red-600/10 rounded"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {dCargos.length === 0 && (
                        <p className="mt-3 pt-3 border-t border-[#1e3a5f] text-xs text-gray-600 italic">Nenhum cargo vinculado. Use "Adicionar Cargo".</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {dirigentes.length === 0 && (
                <div className="text-center py-16 text-gray-500"><Users size={48} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhum dirigente cadastrado.</p></div>
              )}
            </div>
          )}

          {activeTab === "unidades" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-400 text-sm">{unidades.length} unidade{unidades.length !== 1 ? "s" : ""} cadastrada{unidades.length !== 1 ? "s" : ""}</p>
                <button onClick={() => { setEditingUnidade({}); setIsEditing(false); setActiveModal("unidade"); }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#003366] hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <PlusCircle size={15} />Nova Unidade
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unidades.map(u => {
                  const nCargos = cargos.filter(c => c.unidadeId === u.id).length;
                  return (
                    <div key={u.id} className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-5 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-900/30 rounded-lg border border-blue-800/50"><Building2 size={18} className="text-blue-400" /></div>
                        <div>
                          <p className="text-white font-semibold">{u.sigla}</p>
                          <p className="text-gray-400 text-sm">{u.nome}</p>
                          <p className="text-gray-600 text-xs">{nCargos} cargo{nCargos !== 1 ? "s" : ""} vinculado{nCargos !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => { setEditingUnidade(u); setIsEditing(true); setActiveModal("unidade"); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit3 size={15} /></button>
                        <button onClick={() => deleteUnidade(u.id)} className="p-2 text-red-500 hover:text-red-300 hover:bg-red-600/10 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {unidades.length === 0 && (
                <div className="text-center py-16 text-gray-500"><Building2 size={48} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma unidade cadastrada.</p></div>
              )}
            </div>
          )}
        </>
      )}

      {activeModal === "unidade" && (
        <Modal title={isEditing ? "Editar Unidade" : "Nova Unidade"} onClose={closeModal}>
          <div className="space-y-4">
            <Field label="Nome da Unidade">
              <input className={inputCls} placeholder="Ex: Gabinete do Ministro" value={editingUnidade.nome || ""} onChange={e => setEditingUnidade(p => ({ ...p, nome: e.target.value }))} />
            </Field>
            <Field label="Sigla">
              <input className={inputCls} placeholder="Ex: GM" value={editingUnidade.sigla || ""} onChange={e => setEditingUnidade(p => ({ ...p, sigla: e.target.value.toUpperCase() }))} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2 rounded-lg border border-[#1e3a5f] text-gray-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={saveUnidade} disabled={submitting || !editingUnidade.nome || !editingUnidade.sigla}
                className="flex-1 py-2 rounded-lg bg-[#003366] hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                {submitting ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === "dirigente" && (
        <Modal title={isEditing ? "Editar Dirigente" : "Novo Dirigente"} onClose={closeModal}>
          <div className="space-y-4">
            <Field label="Nome completo (em maiusculas)">
              <input className={inputCls} placeholder="NOME COMPLETO" value={editingDirigente.nome || ""} onChange={e => setEditingDirigente(p => ({ ...p, nome: e.target.value.toUpperCase() }))} />
            </Field>
            <Field label="CPF (sera mascarado na exibicao)">
              <input className={inputCls} placeholder="000.000.000-00" value={editingDirigente.cpf || ""} onChange={e => setEditingDirigente(p => ({ ...p, cpf: e.target.value }))} />
            </Field>
            <Field label="E-mail institucional">
              <input className={inputCls} placeholder="nome@trabalho.gov.br" type="email" value={editingDirigente.email || ""} onChange={e => setEditingDirigente(p => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={editingDirigente.status || "Ativo"} onChange={e => setEditingDirigente(p => ({ ...p, status: e.target.value as any }))}>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2 rounded-lg border border-[#1e3a5f] text-gray-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={saveDirigente} disabled={submitting || !editingDirigente.nome || !editingDirigente.cpf || !editingDirigente.email}
                className="flex-1 py-2 rounded-lg bg-[#003366] hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                {submitting ? "Salvando..." : isEditing ? "Salvar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === "cargo" && (
        <Modal title={isEditing ? "Editar Cargo / Vinculo" : "Novo Cargo / Vinculo"} onClose={closeModal}>
          <div className="space-y-4">
            <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-300">
              Um dirigente pode ter multiplos vinculos. Ex: Secretario-Executivo e Titular na SE e Substituto Legal no GM.
            </div>
            {!editingCargo.dirigenteId && (
              <Field label="Dirigente">
                <select className={inputCls} value={editingCargo.dirigenteId || ""} onChange={e => setEditingCargo(p => ({ ...p, dirigenteId: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {dirigentes.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </Field>
            )}
            <Field label="Unidade">
              <select className={inputCls} value={editingCargo.unidadeId || ""} onChange={e => setEditingCargo(p => ({ ...p, unidadeId: e.target.value }))}>
                <option value="">Selecione...</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.sigla} - {u.nome}</option>)}
              </select>
            </Field>
            <Field label="Cargo / Funcao">
              <input className={inputCls} placeholder="Ex: Ministro de Estado" value={editingCargo.cargo || ""} onChange={e => setEditingCargo(p => ({ ...p, cargo: e.target.value }))} />
            </Field>
            <Field label="Tipo de Vinculo">
              <select className={inputCls} value={editingCargo.tipoVinculo || "Titular"} onChange={e => setEditingCargo(p => ({ ...p, tipoVinculo: e.target.value as any }))}>
                <option value="Titular">Titular</option>
                <option value="Substituto Legal">Substituto Legal</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inicio do Exercicio">
                <input type="date" className={inputCls} value={editingCargo.inicioExercicio || ""} onChange={e => setEditingCargo(p => ({ ...p, inicioExercicio: e.target.value }))} />
              </Field>
              <Field label="Fim do Exercicio (opcional)">
                <input type="date" className={inputCls} value={editingCargo.fimExercicio || ""} onChange={e => setEditingCargo(p => ({ ...p, fimExercicio: e.target.value || undefined }))} />
              </Field>
            </div>
            <Field label="Ato de Nomeacao (link DOU / Portaria)">
              <input className={inputCls} placeholder="https://www.in.gov.br/..." value={editingCargo.atoNomeacao || ""} onChange={e => setEditingCargo(p => ({ ...p, atoNomeacao: e.target.value }))} />
            </Field>
            <Field label="Ato de Exoneracao (opcional - preencher ao encerrar)">
              <input className={inputCls} placeholder="https://www.in.gov.br/..." value={editingCargo.atoExoneracao || ""} onChange={e => setEditingCargo(p => ({ ...p, atoExoneracao: e.target.value || undefined }))} />
            </Field>
            <Field label="Status do Cargo">
              <select className={inputCls} value={editingCargo.status || "Ativo"} onChange={e => setEditingCargo(p => ({ ...p, status: e.target.value as any }))}>
                <option value="Ativo">Ativo</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2 rounded-lg border border-[#1e3a5f] text-gray-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={saveCargo} disabled={submitting || !editingCargo.dirigenteId || !editingCargo.unidadeId || !editingCargo.cargo || !editingCargo.inicioExercicio || !editingCargo.atoNomeacao}
                className="flex-1 py-2 rounded-lg bg-[#003366] hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                {submitting ? "Salvando..." : isEditing ? "Salvar" : "Criar Vinculo"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === "evento" && (
        <Modal title="Registrar Evento de Gestao" onClose={closeModal}>
          <div className="space-y-4">
            <Field label="Tipo de Ocorrencia">
              <select className={inputCls} value={editingEvento.motivo || ""} onChange={e => setEditingEvento(p => ({ ...p, motivo: e.target.value as any }))}>
                <option value="">Selecione...</option>
                <option value="Ferias">Ferias</option>
                <option value="Licenca Medica">Licenca Medica</option>
                <option value="Viagem Internacional">Viagem Internacional</option>
                <option value="Exoneracao">Exoneracao</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data Inicio">
                <input type="date" className={inputCls} value={editingEvento.dataInicio || ""} onChange={e => setEditingEvento(p => ({ ...p, dataInicio: e.target.value }))} />
              </Field>
              <Field label="Data Fim">
                <input type="date" className={inputCls} value={editingEvento.dataFim || ""} onChange={e => setEditingEvento(p => ({ ...p, dataFim: e.target.value }))} />
              </Field>
            </div>
            <Field label="Substituto (opcional)">
              <select className={inputCls} value={editingEvento.substitutoId || ""} onChange={e => setEditingEvento(p => ({ ...p, substitutoId: e.target.value || undefined }))}>
                <option value="">Nenhum / Nao se aplica</option>
                {dirigentes.filter(d => d.id !== editingEvento.dirigenteId).map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </Field>
            <Field label="Ato de Autorizacao (link DOU / atestado)">
              <input className={inputCls} placeholder="https://www.in.gov.br/..." value={editingEvento.atoAutorizacao || ""} onChange={e => setEditingEvento(p => ({ ...p, atoAutorizacao: e.target.value }))} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2 rounded-lg border border-[#1e3a5f] text-gray-400 hover:text-white text-sm">Cancelar</button>
              <button onClick={saveEvento} disabled={submitting || !editingEvento.motivo || !editingEvento.dataInicio || !editingEvento.dataFim}
                className="flex-1 py-2 rounded-lg bg-[#003366] hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">
                {submitting ? "Salvando..." : "Registrar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
