import React, { useState, useEffect, useMemo } from "react";
import RolReportsModal from "./RolReportsModal";
import {
  Users, Calendar, Building2, ExternalLink,
  PlusCircle, Trash2, Edit3, X, Search,
  ChevronDown, Shield, Lock, Briefcase, ClipboardList, Plus, AlertCircle, Clock, Filter, Download, FileText
} from "lucide-react";

// ─── Design tokens (Padrão Gov/MGI) ────────────────────────────────────
const inp = "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition";
const lbl = "block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1";
const btnPrimary = "px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 bg-[#003366] text-white hover:bg-slate-900 transition shadow-sm";
const btnSecondary = "px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-slate-50 hover:border-slate-300 transition shadow-sm";

// ─── Interfaces API ────────────────────────────────────────────────────────
interface MandatoAPI { id_registro: string; is_substituto: boolean; data_inicio: string; data_fim: string | null; id_pessoa: number; nome_completo: string; cpf: string; email: string; id_cargo: number; nome_cargo: string; id_unidade: number; sigla_unidade: string; nome_unidade: string; tipo_responsabilidade: string | null; ato_nomeacao: string | null; ato_exoneracao: string | null; }
interface AfastamentoAPI { id_afastamento: number; id_mandato: number; motivo: string; data_inicio: string; data_fim: string; ato_autorizacao?: string; }
interface UnidadeAPI { id_unidade: number; id_unidade_pai: number | null; sigla: string; nome: string; ato_criacao_alteracao?: string; }
interface CargoAPI { id_cargo: number; nome: string; }

// ─── Componentes Base ──────────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const Badge = ({ children, color = "blue" }: { children: React.ReactNode, color?: "blue" | "green" | "gray" | "purple" | "red" }) => {
  const colors = { blue: "bg-blue-50 text-blue-700 border-blue-200", green: "bg-emerald-50 text-emerald-700 border-emerald-200", gray: "bg-slate-100 text-slate-600 border-slate-200", purple: "bg-purple-50 text-purple-700 border-purple-200", red: "bg-red-50 text-red-700 border-red-200" };
  return <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-md border ${colors[color]}`}>{children}</span>;
};

const Modal = ({ title, subtitle, onClose, children, footer, maxW = "max-w-3xl" }: { title: string, subtitle?: string, onClose: () => void, children: React.ReactNode, footer?: React.ReactNode, maxW?: string }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} flex flex-col relative animate-in zoom-in-95 duration-200 max-h-[95vh] overflow-hidden`}>
      <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 z-10 sticky top-0">
        <div>
          <h3 className="text-lg font-black text-[#003366] tracking-tight uppercase">{title}</h3>
          {subtitle && <p className="text-slate-500 font-semibold text-sm mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><X size={20} /></button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
        {children}
      </div>
      {footer && (
        <div className="p-6 border-t border-slate-200 bg-white rounded-b-2xl flex justify-between items-center z-10 sticky bottom-0">
          {footer}
        </div>
      )}
    </div>
  </div>
);

// ─── Módulo Principal ──────────────────────────────────────────────────────
export default function RolModule() {
  const [mandatos, setMandatos] = useState<MandatoAPI[]>([]);
  const [afastamentos, setAfastamentos] = useState<AfastamentoAPI[]>([]);
  const [unidades, setUnidades] = useState<UnidadeAPI[]>([]);
  const [cargos, setCargos] = useState<CargoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [mainTab, setMainTab] = useState<"geral" | "dirigentes" | "unidades" | "cargos" | "afastamentos">("geral");
  
  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "vigentes" | "historico">("todos");
  const [unidadeFilter, setUnidadeFilter] = useState<string>("TODAS");
  const [anoFilter, setAnoFilter] = useState<string>("TODOS");

  // Modal State
  const [modalType, setModalType] = useState<"dirigente" | "unidade" | "cargo" | "afastamento" | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resM, resA, resU, resC] = await Promise.all([
        fetch("/api/rol/mandatos"),
        fetch("/api/rol/afastamentos"),
        fetch("/api/rol/unidades"),
        fetch("/api/rol/cargos")
      ]);
      setMandatos(await resM.json());
      setAfastamentos(await resA.json());
      setUnidades(await resU.json());
      setCargos(await resC.json());
    } catch (e) {
      console.error("Failed to fetch Rol data", e);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = (type: any) => {
    setIsEdit(false);
    setFormData({});
    setModalType(type);
  };

  const toYMD = (d: string) => {
    if (d.includes("/")) {
      const [day, month, year] = d.split("/");
      if (year && month && day) return `${year}-${month}-${day}`;
    }
    return d.split("T")[0];
  };

  const openEditModal = (type: any, data: any) => {
    setIsEdit(true);
    const parsedData = { ...data };
    if (parsedData.data_inicio) parsedData.data_inicio = toYMD(parsedData.data_inicio);
    if (parsedData.data_fim) parsedData.data_fim = toYMD(parsedData.data_fim);
    
    setFormData(parsedData);
    setModalType(type);
  };

  const handleDelete = async (type: string, id: number | string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      let endpoint = "";
      if (type === "unidade") endpoint = `/api/rol/unidades/${id}`;
      if (type === "cargo") endpoint = `/api/rol/cargos/${id}`;
      if (type === "dirigente") endpoint = `/api/rol/dirigentes/${id}`;
      if (type === "afastamento") endpoint = `/api/rol/afastamentos/${id}`;
      
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao excluir o registro");
      }
      
      fetchData(); // Recarrega os dados
    } catch(e: any) {
      alert(`Falha ao excluir: ${e.message}`);
    }
  };

  const handleSubmit = async () => {
    let endpoint = "";
    let id = null;
    if (modalType === "unidade") { endpoint = "/api/rol/unidades"; id = formData.id_unidade; }
    if (modalType === "cargo") { endpoint = "/api/rol/cargos"; id = formData.id_cargo; }
    if (modalType === "dirigente") { endpoint = "/api/rol/dirigentes"; id = formData.id_registro; }
    if (modalType === "afastamento") { endpoint = "/api/rol/afastamentos"; id = formData.id_afastamento; }

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${endpoint}/${id}` : endpoint;

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro desconhecido ao salvar");
      }

      setModalType(null);
      setFormData({});
      setIsEdit(false);
      fetchData(); // Recarrega os dados
    } catch(e: any) {
      alert(`Falha ao salvar: ${e.message}`);
    }
  };

  const fmtDate = (dStr: string | null) => {
    if (!dStr) return "Em Exercício";
    if (dStr.includes("/")) return dStr; // already formatted!
    const [year, month, day] = dStr.split("T")[0].split("-");
    if (!month || !day) return dStr;
    return `${day}/${month}/${year}`;
  };

  const isVigente = (m: MandatoAPI) => {
    if (!m.data_fim) return true;
    const fim = new Date(m.data_fim);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return fim >= hoje;
  };

  const siglasUnidades = useMemo(() => Array.from(new Set(mandatos.map(m => m.sigla_unidade))).sort(), [mandatos]);
  const anosAfastamentos = useMemo(() => {
    const anos = new Set<string>(afastamentos.map(a => a.data_inicio ? a.data_inicio.substring(0, 4) : ""));
    return Array.from(anos).filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [afastamentos]);

  const filteredMandatos = useMemo(() => {
    let list = mandatos;
    if (statusFilter === "vigentes") list = list.filter(isVigente);
    if (statusFilter === "historico") list = list.filter(m => !isVigente(m));
    if (unidadeFilter !== "TODAS") list = list.filter(m => m.sigla_unidade === unidadeFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(m => m.nome_completo.toLowerCase().includes(s) || m.sigla_unidade.toLowerCase().includes(s) || m.nome_cargo.toLowerCase().includes(s));
    }
    return list;
  }, [mandatos, search, statusFilter, unidadeFilter]);

  const filteredAfastamentos = useMemo(() => {
    let list = afastamentos;
    if (anoFilter !== "TODOS") list = list.filter(a => a.data_inicio.startsWith(anoFilter));
    return list;
  }, [afastamentos, anoFilter]);

  const getPessoaName = (id_registro: string) => {
    const m = mandatos.find(m => m.id_registro === id_registro);
    return m ? m.nome_completo : "Desconhecido";
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white">
              <Shield size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Rol de Responsáveis</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">IN TCU 84/2020 - Gestão de Estrutura Administrativa</p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setModalType("relatorios")}
          className="bg-white hover:bg-slate-50 text-[#003366] font-extrabold text-xs px-4 py-2.5 border border-slate-200 rounded-xl flex items-center gap-2 transition active:scale-95 shadow-sm"
        >
          <FileText size={16} /> Relatórios
        </button>
      </div>

      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs mb-6 mt-4">
        {[
          { id: "geral", label: "Visão Geral", desc: "Indicadores e Resumo", icon: ClipboardList },
          { id: "dirigentes", label: "Dirigentes (Cadastro)", desc: "Gestão de Responsáveis", icon: Users },
          { id: "unidades", label: "Unidades", desc: "Estrutura do Órgão", icon: Building2 },
          { id: "cargos", label: "Cargos", desc: "Cargos e Funções", icon: Briefcase },
          { id: "afastamentos", label: "Afastamentos", desc: "Controle de Férias/Licenças", icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id as any)}
              className={`flex-1 min-w-[150px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wide leading-none">{tab.label}</span>
                  <span className="block text-[9px] opacity-75 mt-0.5 font-normal leading-none">{tab.desc}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-[#003366] rounded-full animate-spin mb-4"></div>
          <p className="font-semibold">Sincronizando com PostgreSQL...</p>
        </div>
      ) : (
        <>
          {/* Visão Geral exibe tudo sem os modais de edição pesada (apenas leitura rápida) */}
          {mainTab === "geral" && (
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 border-slate-200">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full overflow-x-auto no-scrollbar flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-2 flex-shrink-0">Unidades:</span>
                    <button onClick={() => setUnidadeFilter("TODAS")} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${unidadeFilter === "TODAS" ? "bg-[#003366] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>TODAS</button>
                    {siglasUnidades.map(sigla => {
                      const u = unidades.find(un => un.id_unidade === sigla || un.nome === sigla);
                      const displaySigla = u ? u.sigla : sigla;
                      return (
                        <button key={sigla} onClick={() => setUnidadeFilter(sigla)} title={sigla} className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${unidadeFilter === sigla ? "bg-[#003366] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>{displaySigla}</button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 w-full lg:w-auto">
                    <select className={`${inp} py-1.5 h-auto text-xs font-bold w-36`} value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                      <option value="todos">Status: Todos</option>
                      <option value="vigentes">Vigentes (Atuais)</option>
                      <option value="historico">Histórico (Exonerados)</option>
                    </select>
                    <div className="relative w-full lg:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Buscar pessoa ou cargo..." className={`${inp} pl-9 py-1.5 h-auto text-xs`} value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                        <th className="p-4">Responsável (Dirigente)</th><th className="p-4">Cargo / Função</th><th className="p-4">Unidade</th><th className="p-4">Início Exercício</th><th className="p-4">Fim Exercício</th><th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredMandatos.map(m => (
                        <tr key={m.id_registro} className={`hover:bg-slate-50/50 transition-colors ${m.is_substituto ? 'bg-purple-50/20' : ''}`}>
                          <td className="p-4">
                            <div>
                              <div className="font-bold text-slate-800">{m.nome_completo}</div>
                              <div className="text-[11px] text-slate-500 font-medium">CPF: {m.cpf}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-700">{m.nome_cargo}</div>
                              {m.is_substituto ? (
                                <div className="mt-1"><Badge color="purple">Substituto</Badge></div>
                              ) : (
                                <div className="mt-1 flex gap-1 items-center">
                                  {m.tipo_responsabilidade && <Badge color={m.tipo_responsabilidade === 'Titular' ? 'blue' : 'gray'}>{m.tipo_responsabilidade}</Badge>}
                                </div>
                              )}
                          </td>
                          <td className="p-4"><div className="font-bold text-[#003366]">{m.sigla_unidade}</div><div className="text-[10px] text-slate-500 truncate max-w-[150px]" title={m.nome_unidade}>{m.nome_unidade}</div></td>
                          <td className="p-4 font-medium text-slate-600">{fmtDate(m.data_inicio)}</td>
                          <td className="p-4 font-medium text-slate-600">{fmtDate(m.data_fim)}</td>
                          <td className="p-4">{isVigente(m) ? <Badge color="green">Vigente</Badge> : <Badge color="gray">Histórico</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Dirigentes Tab agora é a Central de Gestão (Cadastro Unificado) */}
          {mainTab === "dirigentes" && (
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2"><Users size={18}/> Gestão de Dirigentes e Mandatos</h3>
                <button className={btnPrimary} onClick={() => openNewModal("dirigente")}><PlusCircle size={14} /> Novo Cadastro Completo</button>
              </Card>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                        <th className="p-4">Dados Pessoais</th><th className="p-4">Lotação / Cargo Atual</th><th className="p-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredMandatos.map(m => (
                        <tr key={m.id_registro} className={`hover:bg-slate-50/50 transition-colors ${m.is_substituto ? 'bg-purple-50/20' : ''}`}>
                          <td className="p-4">
                            <div>
                              <div className="font-bold text-slate-800">{m.nome_completo}</div>
                              <div className="text-[11px] text-slate-500 font-medium">CPF: {m.cpf} • {m.email}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-[#003366]">{m.sigla_unidade} - {m.nome_cargo}</div>
                            <div className="text-[10px] text-slate-500">
                              Desde: {fmtDate(m.data_inicio)} 
                              {m.is_substituto ? ` (Substituto)` : ' (Titular)'}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEditModal("dirigente", m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete("dirigente", m.id_registro)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {mainTab === "afastamentos" && (
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Filtrar por Ano:</span>
                  <select className={`${inp} py-1.5 h-auto text-xs font-bold w-32`} value={anoFilter} onChange={e => setAnoFilter(e.target.value)}>
                    <option value="TODOS">Todos os Anos</option>
                    {anosAfastamentos.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                  </select>
                </div>
                <button className={btnPrimary} onClick={() => openNewModal("afastamento")}>
                  <PlusCircle size={14} /> Lançar Afastamento
                </button>
              </Card>
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                        <th className="p-4">Titular Afastado</th><th className="p-4">Substituto que Assumiu</th><th className="p-4">Motivo / Tipo</th><th className="p-4">Data Início</th><th className="p-4">Data Final</th><th className="p-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredAfastamentos.map(a => (
                        <tr key={a.id_afastamento} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">{getPessoaName(`T_${a.id_mandato}`)}</td>
                          <td className="p-4 font-bold text-purple-700">{a.id_designacao ? getPessoaName(`S_${a.id_designacao}`) : '-'}</td>
                          <td className="p-4 text-slate-600 font-medium">{a.motivo}</td>
                          <td className="p-4 text-amber-700 font-bold">{fmtDate(a.data_inicio)}</td>
                          <td className="p-4 text-amber-700 font-bold">
                            {a.data_fim ? fmtDate(a.data_fim) : (a.motivo === "Vacância" ? "Aguardando nomeação do Titular" : "Em Exercício")}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => openEditModal("afastamento", a)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit3 size={16} /></button>
                              <button onClick={() => handleDelete("afastamento", a.id_afastamento)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {mainTab === "unidades" && (
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2"><Building2 size={18}/> Unidades Administrativas</h3>
                <button className={btnPrimary} onClick={() => openNewModal("unidade")}><PlusCircle size={14} /> Cadastrar Unidade</button>
              </Card>
              <Card>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                      <th className="p-4">Sigla</th><th className="p-4">Nome da Unidade</th><th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {unidades.map(u => (
                      <tr key={u.id_unidade} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-black text-[#003366]">{u.sigla}</td><td className="p-4 font-bold text-slate-800">{u.nome}</td>
                        <td className="p-4 text-center"><button onClick={() => openEditModal("unidade", u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          {mainTab === "cargos" && (
            <div className="space-y-4">
              <Card className="p-4 bg-slate-50 border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2"><Briefcase size={18}/> Cargos & Funções</h3>
                <button className={btnPrimary} onClick={() => openNewModal("cargo")}><PlusCircle size={14} /> Cadastrar Cargo</button>
              </Card>
              <Card>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                      <th className="p-4">Nomenclatura do Cargo</th><th className="p-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {cargos.map(c => (
                      <tr key={c.id_cargo} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{c.nome}</td>
                        <td className="p-4 text-center"><button onClick={() => openEditModal("cargo", c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </>
      )}

      {/* MODAL UNIFICADO: DIRIGENTE + MANDATO */}
      {modalType === "dirigente" && (
        <Modal 
          title={isEdit ? "Editar Cadastro de Dirigente" : "Novo Cadastro de Dirigente"} 
          maxW="max-w-2xl" 
          onClose={() => setModalType(null)}
          footer={<>
            <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors">Cancelar</button>
            <button className={`${btnPrimary} py-2.5 px-6`} onClick={handleSubmit}>{isEdit ? "Salvar Alterações" : "Salvar Cadastro"}</button>
          </>}
        >
          <div className="space-y-4">
            
            <div className="mb-4 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.is_substituto || false}
                  onClick={() => setFormData({...formData, is_substituto: !formData.is_substituto})}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#003366] focus:ring-offset-2 ${formData.is_substituto ? 'bg-[#003366]' : 'bg-slate-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_substituto ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <label className="text-sm font-semibold text-slate-700 cursor-pointer" onClick={() => setFormData({...formData, is_substituto: !formData.is_substituto})}>
                  Este Dirigente é um Substituto (Designação)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className={lbl}>Nome Completo</label><input className={inp} value={formData.nome_completo || ""} onChange={e => setFormData({...formData, nome_completo: e.target.value})} /></div>
              <div><label className={lbl}>CPF</label><input className={inp} value={formData.cpf || ""} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
              <div><label className={lbl}>Email Institucional</label><input type="email" className={inp} value={formData.email || ""} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
              <div>
                <label className={lbl}>Unidade</label>
                <select className={inp} value={formData.id_unidade || ""} onChange={e => setFormData({...formData, id_unidade: e.target.value})}>
                  <option value="">Selecione...</option>
                  {unidades.map(u => <option key={u.id_unidade} value={u.id_unidade}>{u.sigla} - {u.nome}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Cargo</label>
                <select className={inp} value={formData.id_cargo || ""} onChange={e => setFormData({...formData, id_cargo: e.target.value})}>
                  <option value="">Selecione...</option>
                  {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nome}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Data Início Exercício</label><input type="date" className={inp} value={formData.data_inicio || ""} onChange={e => setFormData({...formData, data_inicio: e.target.value})} /></div>
              <div><label className={lbl}>Data Fim (Exoneração)</label><input type="date" className={inp} value={formData.data_fim || ""} onChange={e => setFormData({...formData, data_fim: e.target.value})} /></div>
              <div><label className={lbl}>Ato de Nomeação</label><input type="text" placeholder="Ex: Portaria Nº 100/2026" className={inp} value={formData.ato_nomeacao || ""} onChange={e => setFormData({...formData, ato_nomeacao: e.target.value})} /></div>
              <div><label className={lbl}>Ato de Exoneração</label><input type="text" placeholder="Ex: Portaria Nº 150/2026" className={inp} value={formData.ato_exoneracao || ""} onChange={e => setFormData({...formData, ato_exoneracao: e.target.value})} /></div>
            </div>
          </div>
        </Modal>
      )}
      
      {modalType === "unidade" && (
        <Modal 
          title={isEdit ? "Editar Unidade" : "Cadastrar Unidade"} 
          maxW="max-w-xl" 
          onClose={() => setModalType(null)}
          footer={<>
            <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors">Cancelar</button>
            <button className={`${btnPrimary} py-2.5 px-6`} onClick={handleSubmit}>{isEdit ? "Salvar Alterações" : "Salvar Cadastro"}</button>
          </>}
        >
          <div className="space-y-4">
            <div><label className={lbl}>Sigla</label><input className={inp} placeholder="Ex: GM" value={formData.sigla || ""} onChange={e => setFormData({...formData, sigla: e.target.value})} /></div>
            <div><label className={lbl}>Nome Completo da Unidade</label><input className={inp} value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
            <div><label className={lbl}>Ato de criação ou alteração (Opcional)</label><input className={inp} placeholder="Ex: Decreto Nº 11.000/2023" value={formData.ato_criacao_alteracao || ""} onChange={e => setFormData({...formData, ato_criacao_alteracao: e.target.value})} /></div>
            
          </div>
        </Modal>
      )}

      {modalType === "cargo" && (
        <Modal 
          title={isEdit ? "Editar Cargo" : "Cadastrar Cargo"} 
          maxW="max-w-xl" 
          onClose={() => setModalType(null)}
          footer={<>
            <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors">Cancelar</button>
            <button className={`${btnPrimary} py-2.5 px-6`} onClick={handleSubmit}>{isEdit ? "Salvar Alterações" : "Salvar Cadastro"}</button>
          </>}
        >
          <div className="space-y-4">
            <div><label className={lbl}>Nome do Cargo / Função</label><input className={inp} placeholder="Ex: Diretor de Finanças" value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} /></div>
            
          </div>
        </Modal>
      )}

      {modalType === "afastamento" && (
        <Modal 
          title={isEdit ? "Editar Afastamento" : "Registrar Afastamento"} 
          maxW="max-w-xl" 
          onClose={() => setModalType(null)}
          footer={<>
            <button onClick={() => setModalType(null)} className="text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors">Cancelar</button>
            <button className={`${btnPrimary} py-2.5 px-6`} onClick={handleSubmit}>{isEdit ? "Salvar Alterações" : "Gravar"}</button>
          </>}
        >
          <div className="space-y-4">
            <div><label className={lbl}>Mandato / Titular Afastado</label>
              <select className={inp} value={formData.id_mandato || ""} onChange={e => setFormData({...formData, id_mandato: e.target.value})}>
                <option value="">Selecione o Titular...</option>
                <optgroup label="Vigentes">
                  {mandatos.filter(m => !m.is_substituto && isVigente(m)).map(m => (
                    <option key={m.id_registro} value={m.id_registro}>{m.nome_completo} ({m.nome_cargo} - {m.sigla_unidade})</option>
                  ))}
                </optgroup>
                <optgroup label="Histórico (Exonerados)">
                  {mandatos.filter(m => !m.is_substituto && !isVigente(m)).map(m => (
                    <option key={m.id_registro} value={m.id_registro}>{m.nome_completo} ({m.nome_cargo} - {m.sigla_unidade})</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div><label className={lbl}>Substituto que Assumiu a Vaga (Obrigatório)*</label>
              <select className={inp} value={formData.id_designacao || ""} onChange={e => setFormData({...formData, id_designacao: e.target.value})}>
                <option value="">Selecione o Substituto...</option>
                {mandatos
                  .filter(m => {
                    if (!m.is_substituto || !isVigente(m)) return false;
                    if (formData.id_mandato) {
                      const titular = mandatos.find(t => t.id_registro === formData.id_mandato);
                      if (titular) {
                        return String(m.id_unidade) === String(titular.id_unidade);
                      }
                    }
                    return true;
                  })
                  .map(m => (
                  <option key={m.id_registro} value={m.id_registro}>{m.nome_completo} ({m.nome_cargo} - {m.sigla_unidade})</option>
                ))}
              </select>
            </div>
            <div><label className={lbl}>Motivo</label>
              <select className={inp} value={formData.motivo || ""} onChange={e => setFormData({...formData, motivo: e.target.value})}>
                <option value="">Selecione o Motivo...</option>
                <option value="Viagem Oficial">Viagem Oficial</option>
                <option value="Férias">Férias</option>
                <option value="Licença para Tratamento de Saúde">Licença para Tratamento de Saúde</option>
                <option value="Vacância">Vacância</option>
              </select>
            </div>
            <div><label className={lbl}>Ato que autorizou o afastamento</label><input className={inp} placeholder="Ex: Portaria Nº 15/2026" value={formData.ato_autorizacao || ""} onChange={e => setFormData({...formData, ato_autorizacao: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Data Início</label><input type="date" className={inp} value={formData.data_inicio || ""} onChange={e => setFormData({...formData, data_inicio: e.target.value})} /></div>
              <div>
                <label className={lbl}>Data Fim {formData.motivo === "Vacância" ? "(Ficará em aberto)" : "(Opcional)"}</label>
                <input type="date" className={inp} value={formData.data_fim || ""} onChange={e => setFormData({...formData, data_fim: e.target.value})} title={formData.motivo === "Vacância" ? "Em caso de vacância, a data fim costuma ficar em branco até a nomeação do novo titular." : ""} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modalType === "relatorios" && (
        <RolReportsModal 
          onClose={() => setModalType(null)} 
          mandatos={mandatos} 
          afastamentos={afastamentos} 
          unidades={unidades} 
        />
      )}

    </div>
  );
}
