/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  Users, Calendar, Building2, ExternalLink,
  PlusCircle, Trash2, Edit3, X, Search,
  ChevronDown, Shield, Lock, Briefcase, ClipboardList, Plus
} from "lucide-react";
import { UnidadeRol, Dirigente, DirigenteCargo, DirigenteEvento } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const maskCpf = (cpf: string): string => {
  if (!cpf) return "—";
  if (cpf.includes("X")) return cpf;
  const c = cpf.replace(/\D/g, "");
  if (c.length === 11) return `XXX.${c.substring(3, 6)}.${c.substring(6, 9)}-XX`;
  return cpf;
};

const fmt = (d?: string | null): string => {
  if (!d) return "—";
  const p = d.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
};

const getYear = (d: string) => (d ? parseInt(d.split("-")[0], 10) : 0);

// ─── Design tokens (identical to TCU/CGU) ────────────────────────────────────

const inp =
  "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition";
const lbl = "block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1";
const btnPrimary =
  "px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 bg-[#003366] text-white hover:bg-slate-900 transition shadow-sm";
const btnSecondary =
  "px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className={lbl}>{label}</label>
    {children}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ title, onClose, children, wide }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
  >
    <div
      className={`bg-white rounded-2xl shadow-2xl w-full ${
        wide ? "max-w-2xl" : "max-w-lg"
      } border border-slate-200 overflow-hidden`}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide">{title}</h3>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[80vh] space-y-4">{children}</div>
    </div>
  </div>
);

// ─── VBadge ───────────────────────────────────────────────────────────────────

const VBadge: React.FC<{ tipo: DirigenteCargo["tipoVinculo"] }> = ({ tipo }) => (
  <span
    className={`inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded border ${
      tipo === "Titular"
        ? "bg-blue-50 text-[#003366] border-blue-200"
        : "bg-purple-50 text-purple-700 border-purple-200"
    }`}
  >
    {tipo}
  </span>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "afastamentos" | "dirigentes" | "unidades";
type ModalT = "unidade" | "dirigente" | "cargo" | "evento" | null;
type RowKind = "exercicio" | "afastamento" | "substituto";

interface TimelineRow {
  id: string;
  kind: RowKind;
  cargo: DirigenteCargo;
  dirigente: Dirigente;
  unidade: UnidadeRol;
  inicio: string;
  fim: string | null;
  evento?: DirigenteEvento;
  substituto?: Dirigente;
}

// ─── Row builder ─────────────────────────────────────────────────────────────

function buildRows(
  cargo: DirigenteCargo,
  dirigente: Dirigente,
  unidade: UnidadeRol,
  allEventos: DirigenteEvento[],
  allDirigentes: Dirigente[]
): TimelineRow[] {
  const rows: TimelineRow[] = [];
  const events = allEventos
    .filter((e) => e.cargoId === cargo.id)
    .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio));

  let cursor = cargo.inicioExercicio;

  for (const ev of events) {
    // Titular em exercício antes do afastamento
    if (cursor && cursor < ev.dataInicio) {
      rows.push({
        id: `ex-${cargo.id}-${cursor}`,
        kind: "exercicio",
        cargo,
        dirigente,
        unidade,
        inicio: cursor,
        fim: ev.dataInicio,
      });
    }

    // Titular afastado
    rows.push({
      id: `af-${ev.id}`,
      kind: "afastamento",
      cargo,
      dirigente,
      unidade,
      inicio: ev.dataInicio,
      fim: ev.dataFim,
      evento: ev,
    });

    // Substituto em exercício (se houver)
    if (ev.substitutoId) {
      const sub = allDirigentes.find((d) => d.id === ev.substitutoId);
      rows.push({
        id: `sub-${ev.id}`,
        kind: "substituto",
        cargo,
        dirigente,
        unidade,
        inicio: ev.dataInicio,
        fim: ev.dataFim,
        evento: ev,
        substituto: sub,
      });
    }

    cursor = ev.dataFim;
  }

  // Titular em exercício após último afastamento (ou row única se sem eventos)
  rows.push({
    id: `ex-final-${cargo.id}`,
    kind: "exercicio",
    cargo,
    dirigente,
    unidade,
    inicio: cursor || cargo.inicioExercicio,
    fim: cargo.fimExercicio || null,
  });

  return rows;
}

// ─── LinkCell ─────────────────────────────────────────────────────────────────

const LinkCell: React.FC<{ url?: string | null }> = ({ url }) => {
  if (!url) return <span className="text-slate-300 text-[11px]">—</span>;
  return (
    <a
      href={url.startsWith("http") ? url : "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1 text-[#003366] hover:underline text-[11px] leading-tight"
      title={url}
    >
      <ExternalLink size={9} className="shrink-0 mt-0.5" />
      <span className="line-clamp-2 max-w-[130px]">{url}</span>
    </a>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RolModule() {
  const [unidades, setUnidades] = useState<UnidadeRol[]>([]);
  const [dirigentes, setDirigentes] = useState<Dirigente[]>([]);
  const [cargos, setCargos] = useState<DirigenteCargo[]>([]);
  const [eventos, setEventos] = useState<DirigenteEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("afastamentos");
  const [modal, setModal] = useState<ModalT>(null);
  const [filterAno, setFilterAno] = useState("todos");
  const [filterUnidade, setFilterUnidade] = useState("todas");
  const [search, setSearch] = useState("");
  const [editU, setEditU] = useState<Partial<UnidadeRol>>({});
  const [editD, setEditD] = useState<Partial<Dirigente>>({});
  const [editC, setEditC] = useState<Partial<DirigenteCargo>>({});
  const [editE, setEditE] = useState<Partial<DirigenteEvento>>({});
  const [isEdit, setIsEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, d, c, e] = await Promise.all([
        fetch("/api/unidades-rol").then((r) => r.json()),
        fetch("/api/dirigentes").then((r) => r.json()),
        fetch("/api/dirigentes/cargos").then((r) => r.json()),
        fetch("/api/dirigentes/eventos").then((r) => r.json()),
      ]);
      setUnidades(u);
      setDirigentes(d);
      setCargos(c);
      setEventos(e);
    } catch {
      showToast("Erro ao carregar dados", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => {
    setModal(null);
    setIsEdit(false);
  };

  const years = useMemo(() => {
    const s = new Set<number>();
    cargos.forEach((c) => {
      s.add(getYear(c.inicioExercicio));
      if (c.fimExercicio) s.add(getYear(c.fimExercicio));
    });
    eventos.forEach((e) => {
      s.add(getYear(e.dataInicio));
      if (e.dataFim) s.add(getYear(e.dataFim));
    });
    return Array.from(s).sort((a, b) => b - a);
  }, [cargos, eventos]);

  // Build chronological timeline rows
  const timelineRows = useMemo((): TimelineRow[] => {
    const allRows: TimelineRow[] = [];
    for (const cargo of cargos) {
      const dirigente = dirigentes.find((d) => d.id === cargo.dirigenteId);
      const unidade = unidades.find((u) => u.id === cargo.unidadeId);
      if (!dirigente || !unidade) continue;

      // Apply filters
      if (filterUnidade !== "todas" && cargo.unidadeId !== filterUnidade) continue;
      if (filterAno !== "todos") {
        const yr = parseInt(filterAno);
        const s = getYear(cargo.inicioExercicio);
        const e = cargo.fimExercicio
          ? getYear(cargo.fimExercicio)
          : new Date().getFullYear();
        if (!(s <= yr && e >= yr)) continue;
      }

      const rows = buildRows(cargo, dirigente, unidade, eventos, dirigentes);
      allRows.push(...rows);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      return allRows.filter(
        (r) =>
          r.dirigente.nome.toLowerCase().includes(q) ||
          r.cargo.cargo.toLowerCase().includes(q) ||
          r.unidade.sigla.toLowerCase().includes(q) ||
          (r.substituto?.nome ?? "").toLowerCase().includes(q)
      );
    }

    // Sort globally by: cargo start, then row inicio
    return allRows.sort((a, b) => {
      const cargoSort = a.cargo.inicioExercicio.localeCompare(b.cargo.inicioExercicio);
      if (cargoSort !== 0) return cargoSort;
      return a.inicio.localeCompare(b.inicio);
    });
  }, [cargos, eventos, dirigentes, unidades, filterAno, filterUnidade, search]);

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const apiFetch = async (method: string, url: string, body?: any) => {
    const opts: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts);
  };

  const saveUnidade = async () => {
    setBusy(true);
    try {
      await apiFetch(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/unidades-rol/${editU.id}` : "/api/unidades-rol",
        editU
      );
      await fetchAll();
      closeModal();
      showToast(isEdit ? "Unidade atualizada!" : "Unidade cadastrada!");
    } catch {
      showToast("Erro ao salvar.", false);
    } finally {
      setBusy(false);
    }
  };

  const delUnidade = async (id: string) => {
    if (!confirm("Excluir esta unidade?")) return;
    await apiFetch("DELETE", `/api/unidades-rol/${id}`);
    fetchAll();
    showToast("Unidade excluída.");
  };

  const saveDirigente = async () => {
    setBusy(true);
    try {
      await apiFetch(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/dirigentes/${editD.id}` : "/api/dirigentes",
        editD
      );
      await fetchAll();
      closeModal();
      showToast(isEdit ? "Dirigente atualizado!" : "Dirigente cadastrado!");
    } catch {
      showToast("Erro ao salvar.", false);
    } finally {
      setBusy(false);
    }
  };

  const delDirigente = async (id: string) => {
    if (!confirm("Excluir este dirigente?")) return;
    await apiFetch("DELETE", `/api/dirigentes/${id}`);
    fetchAll();
    showToast("Dirigente excluído.");
  };

  const saveCargo = async () => {
    setBusy(true);
    try {
      await apiFetch(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/dirigentes/cargos/${editC.id}` : "/api/dirigentes/cargos",
        editC
      );
      await fetchAll();
      closeModal();
      showToast(isEdit ? "Cargo atualizado!" : "Vínculo criado!");
    } catch {
      showToast("Erro ao salvar.", false);
    } finally {
      setBusy(false);
    }
  };

  const delCargo = async (id: string) => {
    if (!confirm("Excluir este cargo?")) return;
    await apiFetch("DELETE", `/api/dirigentes/cargos/${id}`);
    fetchAll();
    showToast("Cargo excluído.");
  };

  const saveEvento = async () => {
    setBusy(true);
    try {
      await apiFetch(
        isEdit ? "PUT" : "POST",
        isEdit ? `/api/dirigentes/eventos/${editE.id}` : "/api/dirigentes/eventos",
        editE
      );
      await fetchAll();
      closeModal();
      showToast(isEdit ? "Afastamento atualizado!" : "Afastamento registrado!");
    } catch {
      showToast("Erro ao registrar.", false);
    } finally {
      setBusy(false);
    }
  };

  const delEvento = async (id: string) => {
    if (!confirm("Excluir este afastamento?")) return;
    await apiFetch("DELETE", `/api/dirigentes/eventos/${id}`);
    fetchAll();
    showToast("Afastamento removido.");
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const navTabs = [
    {
      id: "afastamentos" as Tab,
      label: "Cadastro de Afastamentos",
      desc: "Linha do tempo e eventos de gestão",
      icon: ClipboardList,
      actions: [
        {
          label: "Registrar Afastamento",
          icon: Plus,
          onClick: () => {
            setEditE({});
            setIsEdit(false);
            setModal("evento");
          },
        },
        {
          label: "Novo Vínculo",
          icon: Plus,
          onClick: () => {
            setEditC({ tipoVinculo: "Titular", status: "Ativo" });
            setIsEdit(false);
            setModal("cargo");
          },
        },
      ],
    },
    {
      id: "dirigentes" as Tab,
      label: "Cadastro de Dirigentes",
      desc: "Dirigentes, cargos e vínculos",
      icon: Users,
      actions: [
        {
          label: "Novo Dirigente",
          icon: Plus,
          onClick: () => {
            setEditD({ status: "Ativo" });
            setIsEdit(false);
            setModal("dirigente");
          },
        },
        {
          label: "Novo Vínculo",
          icon: Plus,
          onClick: () => {
            setEditC({ tipoVinculo: "Titular", status: "Ativo" });
            setIsEdit(false);
            setModal("cargo");
          },
        },
      ],
    },
    {
      id: "unidades" as Tab,
      label: "Cadastro de Unidades",
      desc: "Gerenciar unidades do rol",
      icon: Building2,
      actions: [
        {
          label: "Nova Unidade",
          icon: Plus,
          onClick: () => {
            setEditU({});
            setIsEdit(false);
            setModal("unidade");
          },
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-bold shadow-2xl border ${
            toast.ok
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col gap-1 pb-4">
          <h2 className="text-2xl font-black text-slate-900 font-display flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#003366]" />
            Rol de Responsáveis
          </h2>
          <p className="text-xs text-slate-500">
            Art. 7º — Instrução Normativa TCU nº 84/2020 ·{" "}
            {cargos.length} vínculo{cargos.length !== 1 ? "s" : ""} cadastrado
            {cargos.length !== 1 ? "s" : ""}
          </p>
        </div>

      {/* ── Navigation Tabs ─────────────────────── */}
      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                active
                  ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <Icon className={`w-5 h-5 shrink-0 ${active ? "text-blue-200" : "text-slate-400"}`} />
                <div>
                  <span className="block text-xs font-black uppercase tracking-wide leading-none">
                    {t.label}
                  </span>
                  <span className="block text-[9px] mt-0.5 opacity-75 font-normal leading-none">
                    {t.desc}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* ═══════════════════════════════════════════════════════
              CADASTRO DE AFASTAMENTOS — Linha do Tempo + Gerenciar
          ═══════════════════════════════════════════════════════ */}
          {tab === "afastamentos" && (
            <div className="space-y-4">
              {/* ── Tabela Cronológica ─────────────────────────────── */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Linha do Tempo — Ordem Cronológica
                  </h3>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[140px] max-w-xs">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Buscar dirigente, cargo..."
                          className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366]"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={filterAno}
                          onChange={(e) => setFilterAno(e.target.value)}
                          className="pl-3 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none appearance-none"
                        >
                          <option value="todos">Todos os anos</option>
                          {years.map((y) => (
                            <option key={y} value={String(y)}>{y}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      <div className="relative">
                        <select
                          value={filterUnidade}
                          onChange={(e) => setFilterUnidade(e.target.value)}
                          className="pl-3 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white focus:outline-none appearance-none"
                        >
                          <option value="todas">Todas as unidades</option>
                          {unidades.map((u) => (
                            <option key={u.id} value={u.id}>{u.sigla} — {u.nome}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      <span className="text-[11px] text-slate-400 ml-2">
                        {timelineRows.length} linha{timelineRows.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditE({});
                          setIsEdit(false);
                          setModal("afastamento");
                        }}
                        className={btnPrimary}
                      >
                        <PlusCircle size={13} />
                        Novo Afastamento
                      </button>
                      <button
                        onClick={() => {
                          setEditC({ tipoVinculo: "Substituto", status: "Ativo" });
                          setIsEdit(false);
                          setModal("cargo");
                        }}
                        className={btnSecondary}
                      >
                        <Briefcase size={13} />
                        Novo Vínculo
                      </button>
                    </div>
                  </div>
                </div>

                {timelineRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Calendar size={36} className="mb-3 opacity-30" />
                    <p className="text-sm font-semibold">Nenhum registro.</p>
                    <p className="text-xs mt-1">Cadastre dirigentes, vínculos e afastamentos.</p>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-[11px]" style={{ minWidth: "860px" }}>
                      <thead>
                        <tr className="bg-[#003366] text-white">
                          {[
                            ["Dirigente", "w-[17%]"],
                            ["Natureza da Responsabilidade", "w-[17%]"],
                            ["Início", "w-[8%]"],
                            ["Fim", "w-[8%]"],
                            ["Motivo / Período", "w-[18%]"],
                            ["Nomeação", "w-[16%]"],
                            ["Exoneração", "w-[16%]"],
                          ].map(([h, w]) => (
                            <th
                              key={h}
                              className={`${w} px-3 py-2.5 text-left font-black text-[10px] uppercase tracking-wide whitespace-nowrap border-r border-white/10 last:border-r-0`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timelineRows.map((row, idx) => {
                          const isAfastamento = row.kind === "afastamento";
                          const isSubstituto = row.kind === "substituto";
                          const isExercicio = row.kind === "exercicio";
                          const vigente = row.cargo.status === "Ativo" && !row.cargo.fimExercicio;

                          // Row background
                          const bg = isAfastamento
                            ? "bg-amber-50/60"
                            : isSubstituto
                            ? "bg-blue-50/40"
                            : idx % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/40";

                          // Who is in this row
                          const pessoa = isSubstituto ? row.substituto : row.dirigente;
                          const nomePessoa = pessoa?.nome ?? "Sem substituto";

                          // Badge for this row
                          const badge = isAfastamento ? (
                            <span className="mt-1 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-300">
                              ● AFASTADO
                            </span>
                          ) : isSubstituto ? (
                            <span className="mt-1 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded border bg-blue-100 text-blue-700 border-blue-200">
                              ↔ SUBSTITUINDO
                            </span>
                          ) : vigente ? (
                            <span className="mt-1 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                              ● VIGENTE
                            </span>
                          ) : (
                            <span className="mt-1 inline-flex text-[9px] font-black px-1.5 py-0.5 rounded border bg-slate-100 text-slate-500 border-slate-200">
                              ● ENCERRADO
                            </span>
                          );

                          // Left border accent
                          const leftBorder = isAfastamento
                            ? "border-l-4 border-l-amber-400"
                            : isSubstituto
                            ? "border-l-4 border-l-blue-400"
                            : "";

                          // Motivo / Período cell content
                          let motivoCell: React.ReactNode = (
                            <span className="text-slate-300">—</span>
                          );
                          if (isAfastamento && row.evento) {
                            motivoCell = (
                              <div>
                                <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[9px]">
                                  {row.evento.motivo}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {fmt(row.evento.dataInicio)} a {fmt(row.evento.dataFim)}
                                </div>
                              </div>
                            );
                          } else if (isSubstituto && row.evento) {
                            motivoCell = (
                              <div className="text-[10px] text-blue-700 font-semibold leading-tight">
                                {row.evento.motivo} do Titular
                              </div>
                            );
                          }

                          // Nomeação/Exoneração: only for exercicio and afastamento of titular
                          const showAtos = !isSubstituto;

                          return (
                            <tr
                              key={row.id}
                              className={`${bg} ${leftBorder} border-b border-slate-100 align-top hover:brightness-95 transition-all`}
                            >
                              {/* Dirigente */}
                              <td className="px-3 py-2.5 border-r border-slate-100">
                                <div className="font-black text-slate-800 leading-tight text-[11px]">
                                  {nomePessoa}
                                </div>
                                <div className="flex flex-col items-start">{badge}</div>
                              </td>
                              {/* Natureza */}
                              <td className="px-3 py-2.5 border-r border-slate-100">
                                <div className="text-slate-700 text-[11px] leading-tight">
                                  {row.cargo.cargo}
                                </div>
                                <div className="mt-0.5">
                                  {isSubstituto ? (
                                    <span className="inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-200">
                                      Substituto Legal
                                    </span>
                                  ) : (
                                    <VBadge tipo={row.cargo.tipoVinculo} />
                                  )}
                                </div>
                              </td>
                              {/* Início */}
                              <td className="px-3 py-2.5 border-r border-slate-100 whitespace-nowrap text-slate-600 text-[11px]">
                                {fmt(row.inicio)}
                              </td>
                              {/* Fim */}
                              <td
                                className={`px-3 py-2.5 border-r border-slate-100 whitespace-nowrap text-[11px] ${
                                  !row.fim ? "text-slate-400 italic" : "text-slate-600"
                                }`}
                              >
                                {fmt(row.fim)}
                              </td>
                              {/* Motivo / Período */}
                              <td className="px-3 py-2.5 border-r border-slate-100">
                                {motivoCell}
                              </td>
                              {/* Nomeação */}
                              <td className="px-3 py-2.5 border-r border-slate-100">
                                {showAtos ? <LinkCell url={row.cargo.atoNomeacao} /> : <span className="text-slate-300 text-[11px]">—</span>}
                              </td>
                              {/* Exoneração */}
                              <td className="px-3 py-2.5">
                                {showAtos ? <LinkCell url={row.cargo.atoExoneracao} /> : <span className="text-slate-300 text-[11px]">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Afastamentos Cadastrados (gerenciar) ──────────────── */}
              {eventos.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Afastamentos Cadastrados ({eventos.length})
                    </p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {eventos.map((ev) => {
                      const d = dirigentes.find((x) => x.id === ev.dirigenteId);
                      const c = cargos.find((x) => x.id === ev.cargoId);
                      const sub = dirigentes.find((x) => x.id === ev.substitutoId);
                      return (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-amber-50/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-800">
                                {d?.nome ?? "—"}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 font-bold">
                                {ev.motivo}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {c?.cargo} · {fmt(ev.dataInicio)} a {fmt(ev.dataFim)}
                              {sub && (
                                <span className="ml-2 text-blue-600">
                                  Substituto: {sub.nome}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditE(ev);
                                setIsEdit(true);
                                setModal("evento");
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => delEvento(ev.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CADASTRO DE DIRIGENTES
          ═══════════════════════════════════════════════════════ */}
          {tab === "dirigentes" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {dirigentes.length} dirigente{dirigentes.length !== 1 ? "s" : ""} cadastrado
                  {dirigentes.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditD({ status: "Ativo" });
                      setIsEdit(false);
                      setModal("dirigente");
                    }}
                    className={btnPrimary}
                  >
                    <PlusCircle size={13} />
                    Novo Dirigente
                  </button>
                  <button
                    onClick={() => {
                      setEditC({ tipoVinculo: "Titular", status: "Ativo" });
                      setIsEdit(false);
                      setModal("cargo");
                    }}
                    className={btnSecondary}
                  >
                    <Briefcase size={13} />
                    Novo Vínculo
                  </button>
                </div>
              </div>
              {dirigentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Users size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">Nenhum dirigente cadastrado.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dirigentes.map((d) => {
                    const dc = cargos.filter((c) => c.dirigenteId === d.id);
                    return (
                      <div key={d.id} className="px-5 py-4 hover:bg-slate-50/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded border font-black ${
                                d.status === "Ativo"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-slate-100 text-slate-400 border-slate-200"
                              }`}
                            >
                              {d.status}
                            </span>
                            <h3 className="text-sm font-black text-slate-800 mt-1">{d.nome}</h3>
                            <p className="text-xs text-slate-500">{d.email}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Lock size={9} />
                              {maskCpf(d.cpf)}
                            </p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditC({
                                  dirigenteId: d.id,
                                  tipoVinculo: "Titular",
                                  status: "Ativo",
                                });
                                setIsEdit(false);
                                setModal("cargo");
                              }}
                              className={btnSecondary + " py-1.5 px-2.5 text-[11px]"}
                            >
                              <Briefcase size={11} />
                              Vínculo
                            </button>
                            <button
                              onClick={() => {
                                setEditD(d);
                                setIsEdit(true);
                                setModal("dirigente");
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => delDirigente(d.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {dc.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                              Cargos e Vínculos
                            </p>
                            {dc.map((c) => {
                              const u = unidades.find((u) => u.id === c.unidadeId);
                              return (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200"
                                >
                                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                                    <VBadge tipo={c.tipoVinculo} />
                                    <span className="text-xs font-semibold text-slate-700 truncate">
                                      {c.cargo}
                                    </span>
                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Building2 size={9} />
                                      {u?.sigla || "?"}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded border font-black ${
                                        c.status === "Ativo"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-slate-100 text-slate-400 border-slate-200"
                                      }`}
                                    >
                                      {c.status}
                                    </span>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={() => {
                                        setEditC(c);
                                        setIsEdit(true);
                                        setModal("cargo");
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                    <button
                                      onClick={() => delCargo(c.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {dc.length === 0 && (
                          <p className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                            Sem cargos vinculados. Use o botão "Vínculo".
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              CADASTRO DE UNIDADES
          ═══════════════════════════════════════════════════════ */}
          {tab === "unidades" && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {unidades.length} unidade{unidades.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => {
                    setEditU({});
                    setIsEdit(false);
                    setModal("unidade");
                  }}
                  className={btnPrimary}
                >
                  <PlusCircle size={13} />
                  Nova Unidade
                </button>
              </div>
              {unidades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Building2 size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">Nenhuma unidade cadastrada.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
                  {unidades.map((u) => {
                    const nc = cargos.filter((c) => c.unidadeId === u.id).length;
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:border-[#003366]/20 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#003366]/10 rounded-lg border border-[#003366]/10">
                            <Building2 size={15} className="text-[#003366]" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">{u.sigla}</p>
                            <p className="text-xs text-slate-500">{u.nome}</p>
                            <p className="text-[10px] text-slate-400">
                              {nc} cargo{nc !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditU(u);
                              setIsEdit(true);
                              setModal("unidade");
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => delUnidade(u.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════════ */}

      {modal === "unidade" && (
        <Modal title={isEdit ? "Editar Unidade" : "Nova Unidade"} onClose={closeModal}>
          <Field label="Nome da Unidade">
            <input
              className={inp}
              placeholder="Ex: Gabinete do Ministro"
              value={editU.nome || ""}
              onChange={(e) => setEditU((p) => ({ ...p, nome: e.target.value }))}
            />
          </Field>
          <Field label="Sigla">
            <input
              className={inp}
              placeholder="Ex: GM"
              value={editU.sigla || ""}
              onChange={(e) =>
                setEditU((p) => ({ ...p, sigla: e.target.value.toUpperCase() }))
              }
            />
          </Field>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={closeModal}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveUnidade}
              disabled={busy || !editU.nome || !editU.sigla}
              className="flex-1 py-2 rounded-xl text-sm font-black text-white bg-[#003366] hover:bg-slate-900 disabled:opacity-50"
            >
              {busy ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "dirigente" && (
        <Modal
          title={isEdit ? "Editar Dirigente" : "Novo Dirigente"}
          onClose={closeModal}
        >
          <Field label="Nome completo (maiúsculas)">
            <input
              className={inp}
              placeholder="NOME COMPLETO"
              value={editD.nome || ""}
              onChange={(e) =>
                setEditD((p) => ({ ...p, nome: e.target.value.toUpperCase() }))
              }
            />
          </Field>
          <Field label="CPF">
            <input
              className={inp}
              placeholder="000.000.000-00"
              value={editD.cpf || ""}
              onChange={(e) => setEditD((p) => ({ ...p, cpf: e.target.value }))}
            />
          </Field>
          <Field label="E-mail institucional">
            <input
              className={inp}
              placeholder="nome@trabalho.gov.br"
              type="email"
              value={editD.email || ""}
              onChange={(e) => setEditD((p) => ({ ...p, email: e.target.value }))}
            />
          </Field>
          <Field label="Status">
            <select
              className={inp}
              value={editD.status || "Ativo"}
              onChange={(e) =>
                setEditD((p) => ({ ...p, status: e.target.value as any }))
              }
            >
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </Field>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={closeModal}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveDirigente}
              disabled={busy || !editD.nome || !editD.cpf || !editD.email}
              className="flex-1 py-2 rounded-xl text-sm font-black text-white bg-[#003366] hover:bg-slate-900 disabled:opacity-50"
            >
              {busy ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "cargo" && (
        <Modal
          title={isEdit ? "Editar Cargo / Vínculo" : "Novo Cargo / Vínculo"}
          onClose={closeModal}
          wide
        >
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
            Um dirigente pode ter múltiplos vínculos (ex: Titular na SE e Substituto Legal no GM).
          </div>
          {!editC.dirigenteId && (
            <Field label="Dirigente">
              <select
                className={inp}
                value={editC.dirigenteId || ""}
                onChange={(e) =>
                  setEditC((p) => ({ ...p, dirigenteId: e.target.value }))
                }
              >
                <option value="">Selecione...</option>
                {dirigentes.map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Unidade">
            <select
              className={inp}
              value={editC.unidadeId || ""}
              onChange={(e) =>
                setEditC((p) => ({ ...p, unidadeId: e.target.value }))
              }
            >
              <option value="">Selecione...</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.sigla} — {u.nome}</option>
              ))}
            </select>
          </Field>
          <Field label="Cargo / Função">
            <input
              className={inp}
              placeholder="Ex: Ministro de Estado"
              value={editC.cargo || ""}
              onChange={(e) => setEditC((p) => ({ ...p, cargo: e.target.value }))}
            />
          </Field>
          <Field label="Tipo de Vínculo">
            <select
              className={inp}
              value={editC.tipoVinculo || "Titular"}
              onChange={(e) =>
                setEditC((p) => ({ ...p, tipoVinculo: e.target.value as any }))
              }
            >
              <option value="Titular">Titular</option>
              <option value="Substituto Legal">Substituto Legal</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início do Exercício">
              <input
                type="date"
                className={inp}
                value={editC.inicioExercicio || ""}
                onChange={(e) =>
                  setEditC((p) => ({ ...p, inicioExercicio: e.target.value }))
                }
              />
            </Field>
            <Field label="Fim do Exercício (opcional)">
              <input
                type="date"
                className={inp}
                value={editC.fimExercicio || ""}
                onChange={(e) =>
                  setEditC((p) => ({
                    ...p,
                    fimExercicio: e.target.value || undefined,
                  }))
                }
              />
            </Field>
          </div>
          <Field label="Ato de Nomeação (link DOU)">
            <input
              className={inp}
              placeholder="https://www.in.gov.br/..."
              value={editC.atoNomeacao || ""}
              onChange={(e) =>
                setEditC((p) => ({ ...p, atoNomeacao: e.target.value }))
              }
            />
          </Field>
          <Field label="Ato de Exoneração (opcional)">
            <input
              className={inp}
              placeholder="https://www.in.gov.br/..."
              value={editC.atoExoneracao || ""}
              onChange={(e) =>
                setEditC((p) => ({
                  ...p,
                  atoExoneracao: e.target.value || undefined,
                }))
              }
            />
          </Field>
          <Field label="Status">
            <select
              className={inp}
              value={editC.status || "Ativo"}
              onChange={(e) =>
                setEditC((p) => ({ ...p, status: e.target.value as any }))
              }
            >
              <option value="Ativo">Ativo</option>
              <option value="Encerrado">Encerrado</option>
            </select>
          </Field>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={closeModal}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveCargo}
              disabled={
                busy ||
                !editC.dirigenteId ||
                !editC.unidadeId ||
                !editC.cargo ||
                !editC.inicioExercicio ||
                !editC.atoNomeacao
              }
              className="flex-1 py-2 rounded-xl text-sm font-black text-white bg-[#003366] hover:bg-slate-900 disabled:opacity-50"
            >
              {busy ? "Salvando..." : isEdit ? "Salvar" : "Criar Vínculo"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "evento" && (
        <Modal
          title={isEdit ? "Editar Afastamento" : "Registrar Afastamento / Evento de Gestão"}
          onClose={closeModal}
        >
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            O afastamento gera automaticamente as linhas cronológicas na Linha do Tempo. Informe o
            substituto para que sua linha de exercício apareça na tabela.
          </div>
          <Field label="Dirigente">
            <select
              className={inp}
              value={editE.dirigenteId || ""}
              onChange={(e) =>
                setEditE((p) => ({
                  ...p,
                  dirigenteId: e.target.value,
                  cargoId: undefined,
                }))
              }
            >
              <option value="">Selecione o dirigente...</option>
              {dirigentes.map((d) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </Field>
          {editE.dirigenteId && (
            <Field label="Cargo / Vínculo">
              <select
                className={inp}
                value={editE.cargoId || ""}
                onChange={(e) =>
                  setEditE((p) => ({ ...p, cargoId: e.target.value }))
                }
              >
                <option value="">Selecione o cargo...</option>
                {cargos
                  .filter((c) => c.dirigenteId === editE.dirigenteId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.cargo}</option>
                  ))}
              </select>
            </Field>
          )}
          <Field label="Tipo de Ocorrência (Motivo do Afastamento)">
            <select
              className={inp}
              value={editE.motivo || ""}
              onChange={(e) =>
                setEditE((p) => ({ ...p, motivo: e.target.value as any }))
              }
            >
              <option value="">Selecione...</option>
              <option value="Férias">Férias</option>
              <option value="Licença Médica">Licença Médica</option>
              <option value="Viagem Internacional">Viagem Internacional</option>
              <option value="Exoneração">Exoneração</option>
              <option value="Outros">Outros</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de Início">
              <input
                type="date"
                className={inp}
                value={editE.dataInicio || ""}
                onChange={(e) =>
                  setEditE((p) => ({ ...p, dataInicio: e.target.value }))
                }
              />
            </Field>
            <Field label="Data de Fim">
              <input
                type="date"
                className={inp}
                value={editE.dataFim || ""}
                onChange={(e) =>
                  setEditE((p) => ({ ...p, dataFim: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Substituto (gera linha de exercício automática)">
            <select
              className={inp}
              value={editE.substitutoId || ""}
              onChange={(e) =>
                setEditE((p) => ({
                  ...p,
                  substitutoId: e.target.value || undefined,
                }))
              }
            >
              <option value="">Nenhum / Não se aplica</option>
              {dirigentes
                .filter((d) => d.id !== editE.dirigenteId)
                .map((d) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
            </select>
          </Field>
          {editE.substitutoId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-700">
              A tabela exibirá: linha do titular afastado + linha do substituto em exercício com o
              motivo "<strong>{editE.motivo || "..."} do Titular</strong>".
            </div>
          )}
          <Field label="Ato de Autorização (link DOU / atestado)">
            <input
              className={inp}
              placeholder="https://www.in.gov.br/..."
              value={editE.atoAutorizacao || ""}
              onChange={(e) =>
                setEditE((p) => ({ ...p, atoAutorizacao: e.target.value }))
              }
            />
          </Field>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              onClick={closeModal}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveEvento}
              disabled={
                busy ||
                !editE.dirigenteId ||
                !editE.cargoId ||
                !editE.motivo ||
                !editE.dataInicio ||
                !editE.dataFim
              }
              className="flex-1 py-2 rounded-xl text-sm font-black text-white bg-[#003366] hover:bg-slate-900 disabled:opacity-50"
            >
              {busy ? "Salvando..." : isEdit ? "Atualizar" : "Registrar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
