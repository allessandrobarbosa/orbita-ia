/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  ShieldAlert, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Database,
  Menu, 
  UserCircle,
  HelpCircle,
  LogOut,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Key,
  Fingerprint,
  Check,
  AlertCircle,
  RefreshCw,
  Eye,
  Award,
  BookOpen,
  UserPlus,
  X
} from "lucide-react";

// User Access Profile Management Schema
export interface UserProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  register: string;
  clearance: "ADMIN" | "ETHICS" | "AUDITOR" | "SRTE" | "PUBLIC";
  avatarColor: string;
  pin: string;
  badgeText: string;
}

export const USER_PROFILES: UserProfile[] = [
  {
    id: "alessandro",
    name: "Alessandro Barbosa",
    role: "Analista de Controle Interno Especial",
    email: "alessandro.barbosa@mte.gov.br",
    register: "Matrícula: AECI-8409-G",
    clearance: "ADMIN",
    avatarColor: "bg-[#1351b4] text-white border-blue-400 ring-blue-500/30",
    pin: "1234",
    badgeText: "AECI - ADMIN"
  },
  {
    id: "heloisa",
    name: "Dra. Heloísa Mendes",
    role: "Membro Presidência / Corregedora Geral",
    email: "heloisa.mendes@mte.gov.br",
    register: "Matrícula: COR-4421-E",
    clearance: "ETHICS",
    avatarColor: "bg-emerald-600 text-white border-emerald-400 ring-emerald-500/30",
    pin: "2026",
    badgeText: "C. ÉTICA - CORREGEDORA"
  },
  {
    id: "tcu_auditor",
    name: "Dr. Gabriel Santos",
    role: "Auditor de Controle Externo do TCU",
    email: "gabriel.santos@tcu.gov.br",
    register: "Código Fiscal: TCU-1020",
    clearance: "AUDITOR",
    avatarColor: "bg-rose-600 text-white border-rose-400 ring-rose-500/30",
    pin: "1984",
    badgeText: "AUDITOR TCU - IN 84"
  },
  {
    id: "gestor_srte",
    name: "Dr. Marcos Oliveira",
    role: "Superintendente Regional do Trabalho (SRTE/SP)",
    email: "marcos.oliveira@mte.gov.br",
    register: "Matrícula: SRTE-1052-S",
    clearance: "SRTE",
    avatarColor: "bg-indigo-600 text-white border-indigo-400 ring-indigo-500/30",
    pin: "7777",
    badgeText: "GESTOR SRTE - REGIONAL"
  },
  {
    id: "cidadao",
    name: "Cidadão / Consulta Pública",
    role: "Fiscal Transparência Governamental",
    email: "cidadao.mte@transparencia.gov.br",
    register: "Nível: Cidadão Comum",
    clearance: "PUBLIC",
    avatarColor: "bg-slate-600 text-white border-slate-450 ring-slate-500/30",
    pin: "0000",
    badgeText: "ACESSO PÚBLICO"
  }
];

// Module Components imports -
import DashboardOverview from "./components/DashboardOverview";
import BiModule from "./components/BiModule";
import TcuModule from "./components/TcuModule";
import RolModule from "./components/RolModule";
import EticaModule from "./components/EticaModule";
import SrteModule from "./components/SrteModule";

// Domain Types
import { AcordaoDemand, RolResponsavel, ComissaoEticaDemand, SuperintendenciaRegional, ComunicacaoDemand, TceDemand, TceAcordaoMapping } from "./types";

export default function App() {
  
  // States holding backend values
  const [acordaos, setAcordaos] = useState<AcordaoDemand[]>([]);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoDemand[]>([]);
  const [rolResponsaveis, setRolResponsaveis] = useState<RolResponsavel[]>([]);
  const [comissaoEtica, setComissaoEtica] = useState<ComissaoEticaDemand[]>([]);
  const [superintendencias, setSuperintendencias] = useState<SuperintendenciaRegional[]>([]);
  const [tces, setTces] = useState<TceDemand[]>([]);
  const [tceMappings, setTceMappings] = useState<TceAcordaoMapping[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Layout navigation states
  const [activeTab, setActiveTab] = useState<string>("dashboard"); // dashboard, tcu, rol, etica, srte

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeTab]);

  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [controlOrgsOpen, setControlOrgsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamic user profiles state with local persistence
  const [profiles, setProfiles] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("orbita_user_profiles");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => {
            if (p.id === "alessandro" && p.avatarColor.includes("bg-amber")) {
              return { ...p, avatarColor: "bg-[#1351b4] text-white border-blue-400 ring-blue-500/30" };
            }
            return p;
          });
        }
      } catch (e) {}
    }
    return USER_PROFILES;
  });

  // Active User profile and session locks
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => profiles[0] || USER_PROFILES[0]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [isRegisteringUser, setIsRegisteringUser] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [authAlert, setAuthAlert] = useState<{title: string; message: string; sub: string} | null>(null);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  const handleRegisterProfile = (newProfile: UserProfile) => {
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem("orbita_user_profiles", JSON.stringify(updated));
    setCurrentUser(newProfile);
    setAuthSuccessToast(`Usuário "${newProfile.name}" cadastrado e logado!`);
  };

  // Checks privileges against active user context on actions
  const checkPermission = (module: "TCU" | "ROL" | "ETHICS" | "SRTE"): boolean => {
    if (currentUser.clearance === "ADMIN") return true;
    if (currentUser.clearance === "ETHICS" && module === "ETHICS") return true;
    if (currentUser.clearance === "SRTE" && module === "SRTE") return true;
    
    // Trigger security modal feedback for unauthorized users
    setAuthAlert({
      title: "Interposição Governamental / Restrição de Acesso",
      message: `O seu perfil ativo "${currentUser.name}" possui credenciais restritas de nível [${currentUser.clearance}].`,
      sub: `Modificações em dados de ${module} exigem credenciais "AECI - ADMIN GOLD" assinadas via Token gov.br.`
    });
    return false;
  };

  // Fetch all domain datasets on mount or tab shifts
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const cb = `?cb=${Date.now()}`;
      const [acRes, comRes, rolRes, eticaRes, srteRes, statsRes, tcesRes, tceMappingsRes] = await Promise.all([
        fetch(`/api/acordaos${cb}`).then(r => r.json()),
        fetch(`/api/comunicacoes${cb}`).then(r => r.json()),
        fetch(`/api/rol-responsaveis${cb}`).then(r => r.json()),
        fetch(`/api/comissao-etica${cb}`).then(r => r.json()),
        fetch(`/api/superintendencias${cb}`).then(r => r.json()),
        fetch(`/api/dashboard-stats${cb}`).then(r => r.json()),
        fetch(`/api/tces${cb}`).then(r => r.json()),
        fetch(`/api/tce-mappings${cb}`).then(r => r.json())
      ]);

      setAcordaos(acRes);
      setComunicacoes(comRes);
      setRolResponsaveis(rolRes);
      setComissaoEtica(eticaRes);
      setSuperintendencias(srteRes);
      setDashboardStats(statsRes);
      setTces(tcesRes || []);
      setTceMappings(tceMappingsRes || []);
    } catch (err) {
      console.error("Erro ao carregar dados do ORBITA.AECI:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Automated Toast clear hook
  useEffect(() => {
    if (authSuccessToast) {
      const t = setTimeout(() => {
        setAuthSuccessToast(null);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [authSuccessToast]);

  // If session is locked, serve the secure lock face directly
  if (isLocked) {
    return (
      <LockScreen 
        profiles={profiles}
        onUnlock={(profile) => {
          setCurrentUser(profile);
          setIsLocked(false);
          setAuthSuccessToast(`Chave de acesso assinada para ${profile.name}!`);
        }} 
        onRegisterProfile={handleRegisterProfile}
      />
    );
  }

  // Sync / Update actions gated with high-security parameters:

  // TCU API actions
  const handleUpdateAcordao = async (updated: AcordaoDemand): Promise<boolean> => {
    if (!checkPermission("TCU")) return false;
    try {
      const res = await fetch("/api/acordaos/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao salvar acórdão:", err);
    }
    return false;
  };

  const handleDeleteAcordao = async (key: string): Promise<boolean> => {
    if (!checkPermission("TCU")) return false;
    try {
      const res = await fetch(`/api/acordaos/${key}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao remover acórdão:", err);
    }
    return false;
  };

  const handleImportAcordaos = async (listOrItems: string[] | any[]): Promise<any> => {
    if (!checkPermission("TCU")) return null;
    try {
      const isItemList = listOrItems.length > 0 && typeof listOrItems[0] === "object";
      const payload = isItemList ? { items: listOrItems } : { acordaosList: listOrItems };

      const res = await fetch("/api/acordaos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.updatedAcordaos) {
          setAcordaos(data.updatedAcordaos);
        }
        await fetchAllData();
        return data;
      } else {
        // Handle non-ok responses (e.g., 400, 500)
        console.error("Falha no lote de importação: resposta não-OK do servidor.");
        return { success: false, error: "O servidor retornou um erro durante a importação." };
      }
    } catch (err) {
      console.error("Falha no lote de importação:", err);
    }
    return { success: false, error: "Falha de conexão ao tentar importar os acórdãos." };
  };

  // Comunicacoes API actions
  const handleUpdateComunicacao = async (updated: ComunicacaoDemand): Promise<boolean> => {
    if (!checkPermission("TCU")) return false;
    try {
      const res = await fetch("/api/comunicacoes/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao atualizar comunicação:", err);
    }
    return false;
  };

  const handleDeleteComunicacao = async (key: string): Promise<boolean> => {
    if (!checkPermission("TCU")) return false;
    try {
      const res = await fetch(`/api/comunicacoes/${key}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao excluir comunicação:", err);
    }
    return false;
  };

  const handleImportComunicacoes = async (items: ComunicacaoDemand[]): Promise<any> => {
    if (!checkPermission("TCU")) return null;
    try {
      const res = await fetch("/api/comunicacoes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items) {
          setComunicacoes(data.items);
        }
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha na importação em lote de comunicações:", err);
    }
    return null;
  };

  // TCE API actions
  const handleUpdateTce = async (updated: TceDemand): Promise<boolean> => {
    if (!checkPermission("TCU")) return false;
    try {
      const res = await fetch("/api/tces/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao atualizar TCE:", err);
    }
    return false;
  };

  const handleDeleteTce = async (id: string): Promise<boolean> => {
    if (!checkPermission("TCU")) return false;
    try {
      const res = await fetch(`/api/tces/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao excluir TCE:", err);
    }
    return false;
  };

  const handleImportTces = async (items: TceDemand[]): Promise<any> => {
    if (!checkPermission("TCU")) return null;
    try {
      const res = await fetch("/api/tces/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items) {
          setTces(data.items);
        }
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha na importação em lote de TCEs:", err);
    }
    return null;
  };

  const handleImportTceMappings = async (items: TceAcordaoMapping[]): Promise<any> => {
    if (!checkPermission("TCU")) return null;
    try {
      const res = await fetch("/api/tce-mappings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.items) {
          setTceMappings(data.items);
        }
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha na importação de mapeamentos TCE com Acórdão:", err);
    }
    return null;
  };

  const handleClearOlderAcordaos = async (): Promise<any> => {
    if (!checkPermission("TCU")) return null;
    try {
      const res = await fetch("/api/admin/clear-older-acordaos", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha ao limpar acórdãos antigos:", err);
    }
    return null;
  };

  const handleResetDatabase = async (): Promise<any> => {
    if (!checkPermission("TCU")) return null;
    try {
      const res = await fetch("/api/admin/reset-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha ao redefinir o banco de dados:", err);
    }
    return null;
  };

  // Rol Responsáveis actions
  const handleAddRol = async (newRol: any): Promise<boolean> => {
    if (!checkPermission("ROL")) return false;
    try {
      const res = await fetch("/api/rol-responsaveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRol)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleUpdateRol = async (id: string, updated: any): Promise<boolean> => {
    if (!checkPermission("ROL")) return false;
    try {
      const res = await fetch(`/api/rol-responsaveis/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleDeleteRol = async (id: string): Promise<boolean> => {
    if (!checkPermission("ROL")) return false;
    try {
      const res = await fetch(`/api/rol-responsaveis/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Comissão de Ética actions
  const handleAddEtica = async (newEtica: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch("/api/comissao-etica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEtica)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleUpdateEtica = async (id: string, updated: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/comissao-etica/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleDeleteEtica = async (id: string): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/comissao-etica/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Superintendências actions
  const handleUpdateSrte = async (uf: string, data: any): Promise<boolean> => {
    if (!checkPermission("SRTE")) return false;
    try {
      const res = await fetch(`/api/superintendencias/${uf}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Header Federal Government Layout */}
      <header className="gov-header text-white border-b-2 gov-border-gold shadow-md no-print shrink-0">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight font-display text-white" style={{ fontFamily: '"Outfit", sans-serif' }}>
                  ÓRBITA-AECI
                </h1>
              </div>
              <p className="text-[10.5px] text-slate-300/90 tracking-wide font-sans mt-0.5">Sistema Integrado de Controle Interno e Auditoria Governamental</p>
              <p className="text-[10.5px] text-slate-300/90 tracking-wide font-sans mt-0.5">Assessoria Especial de Controle Interno - AECI</p>
            </div>
          </div>

          {/* Interactive User Controller Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-slate-800/40 border border-white/10 hover:border-blue-400/40 transition cursor-pointer text-left focus:outline-hidden"
              id="btn-user-dropdown-toggle"
            >
              <div className="text-right hidden sm:block">
                <span className="text-xs font-black block text-white tracking-tight">{currentUser.name}</span>
                <span className="text-[10px] text-blue-300 font-bold block flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {currentUser.badgeText}
                </span>
              </div>
              
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs border-2 select-none uppercase ${currentUser.avatarColor}`}>
                {currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
            </button>

            {/* Dropdown switch menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Card */}
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${currentUser.avatarColor}`}>
                      {currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">{currentUser.name}</h4>
                      <code className="text-[9px] text-slate-400 block mt-1 tracking-tight">{currentUser.register}</code>
                      <span className="inline-block mt-1.5 bg-blue-50 text-[#003366] text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        Acesso: {currentUser.clearance}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security and Privacy status */}
                <div className="p-3.5 bg-white border-b border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#003366] uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sessão Protegida gov.br</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    Seu acesso é criptografado e auditado pelos órgãos federais. Para usar outras credenciais registradas, desconecte do sistema e faça login no painel inicial.
                  </p>
                </div>

                {/* User Actions */}
                <div className="p-2 space-y-1 bg-slate-50">
                  {/* Administration and Database Maintenance Panel */}
                  {currentUser.clearance === "ADMIN" && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        setIsAdminPanelOpen(true);
                      }}
                      className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[10px] flex items-center gap-1.5 transition cursor-pointer border border-amber-300"
                    >
                      <Database className="w-3.5 h-3.5" /> Administração do Banco de Dados
                    </button>
                  )}

                  {/* Register New User */}
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setIsRegisteringUser(true);
                    }}
                    className="w-full py-2.5 px-3 border border-dashed border-[#003366]/35 hover:bg-[#003366]/5 text-[#003366] hover:text-[#001f3f] font-extrabold rounded-xl text-[10px] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Credenciar Novo Gestor (MTE)
                  </button>

                  {/* Trancar com senha */}
                  <button
                    onClick={() => {
                      setIsLocked(true);
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-2.5 px-3 hover:bg-slate-200/55 text-slate-700 font-extrabold rounded-xl text-[10px] flex items-center gap-1.5 transition cursor-pointer border border-transparent"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Trancar Sessão sob PIN
                  </button>

                  {/* Sair do Portal (Logout) */}
                  <button
                    onClick={() => {
                      setIsLocked(true);
                      setShowUserDropdown(false);
                      setAuthSuccessToast("Sessão finalizada. Faça o login autenticado para retornar.");
                    }}
                    className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100/80 text-rose-700 font-extrabold rounded-xl text-[10px] flex items-center gap-1.5 transition cursor-pointer border border-rose-250/25 animate-pulse"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sair / Mudar de Conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Primary Navigation Bar - Integrated into Header with Government Colors */}
        <div className="border-t border-white/10 bg-black/20 py-3 px-5 no-print">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-300/80 tracking-widest mr-3 hidden lg:inline">Navegação Integrada:</span>
            {[
              { id: "dashboard", label: "Início", icon: LayoutDashboard, title: "Painel de Controle e Monitoramento" },
              { id: "tcu", label: "TCU", icon: Database, title: "Tribunal de Contas da União" },
              { id: "cgu", label: "CGU", icon: ShieldCheck, title: "Controladoria-Geral da União" },
              { id: "etica", label: "Ética", icon: ShieldAlert, title: "Comissão de Ética Coletiva" },
              { id: "rol", label: "Rol", icon: Users, title: "Gestão do Rol de Responsáveis" },
              { id: "srte", label: "STRES", icon: Building2, title: "Superintendências Regionais do Trabalho e Emprego" },
              { id: "bi", label: "BI & IA", icon: TrendingUp, title: "Análise BI & IA Preditiva" },
            ].map((moduleLink) => {
              const ModuleIcon = moduleLink.icon;
              const isSelected = activeTab === moduleLink.id;
              return (
                <button
                  key={moduleLink.id}
                  onClick={() => {
                    setActiveTab(moduleLink.id);
                  }}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-[#1351b4] text-white border-[#1351b4] font-extrabold shadow-md shadow-blue-950/45 scale-102"
                      : "bg-white/5 hover:bg-white/10 text-slate-100 border-white/10 hover:border-white/20"
                  }`}
                  title={moduleLink.title}
                >
                  <ModuleIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-blue-300"}`} />
                  <span>{moduleLink.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 3. Body Container - Direct full-width main view layout for a cleaner UX */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Main content frame - Full Width */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-6 max-h-full">
          
          {/* Quick loading placeholder */}
          {isLoading && acordaos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3 font-sans h-full">
              <div className="w-10 h-10 rounded-full border-4 border-slate-300 border-t-amber-500 animate-spin" />
              <p className="text-xs text-slate-500">Iniciando base de dados ORBITA.AECI e conectando ao TCU...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto pb-12">
              
              {/* Tab selector content renderer */}
              {activeTab === "dashboard" && (
                <DashboardOverview 
                  stats={dashboardStats} 
                  onNavigate={setActiveTab} 
                  acordaos={acordaos}
                  comunicacoes={comunicacoes}
                  tces={tces}
                  tceMappings={tceMappings}
                  rolResponsaveis={rolResponsaveis}
                  comissaoEtica={comissaoEtica}
                  superintendencias={superintendencias}
                />
              )}

              {activeTab === "bi" && (
                <BiModule 
                  acordaos={acordaos}
                  comunicacoes={comunicacoes}
                  tces={tces}
                  tceMappings={tceMappings}
                  rolResponsaveis={rolResponsaveis}
                  comissaoEtica={comissaoEtica}
                  superintendencias={superintendencias}
                />
              )}

              {activeTab === "tcu" && (
                <TcuModule 
                  acordaos={acordaos}
                  onUpdateAcordao={handleUpdateAcordao}
                  onDeleteAcordao={handleDeleteAcordao}
                  onImportAcordaos={handleImportAcordaos}
                  comunicacoes={comunicacoes}
                  onUpdateComunicacao={handleUpdateComunicacao}
                  onDeleteComunicacao={handleDeleteComunicacao}
                  onImportComunicacoes={handleImportComunicacoes}
                  tces={tces}
                  tceMappings={tceMappings}
                  onUpdateTce={handleUpdateTce}
                  onDeleteTce={handleDeleteTce}
                  onImportTces={handleImportTces}
                  onImportTceMappings={handleImportTceMappings}
                  onClearOlderAcordaos={handleClearOlderAcordaos}
                  onResetDatabase={handleResetDatabase}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "rol" && (
                <RolModule 
                  rol={rolResponsaveis}
                  onAddRol={handleAddRol}
                  onUpdateRol={handleUpdateRol}
                  onDeleteRol={handleDeleteRol}
                />
              )}

              {activeTab === "etica" && (
                <EticaModule 
                  etica={comissaoEtica}
                  onAddEtica={handleAddEtica}
                  onUpdateEtica={handleUpdateEtica}
                  onDeleteEtica={handleDeleteEtica}
                />
              )}

              {activeTab === "srte" && (
                <SrteModule 
                  superintendencias={superintendencias}
                  onUpdateSrte={handleUpdateSrte}
                />
              )}

              {activeTab === "cgu" && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-8 text-center max-w-4xl mx-auto space-y-6 my-12 animate-fade-in no-print font-sans">
                  <div className="w-16 h-16 bg-blue-50 text-[#003366] rounded-full flex items-center justify-center mx-auto shadow-xs border border-blue-100/50">
                    <Building2 className="w-8 h-8 text-[#003366]" />
                  </div>
                  <div className="space-y-2">
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      Controle de Auditoria Interna
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-950 font-display">
                      Controladoria-Geral da União — CGU
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
                      Este submódulo proporcionará a gestão e acompanhamento das recomendações do Órgão de Controle Interno do Poder Executivo Federal (CGU), facilitando o controle de auditorias anuais e relatórios de avaliação de gestão.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-2xl mx-auto text-left space-y-3.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#003366] block">
                      Painéis e Workflow em Homologação:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Recomendações CGU:</strong> Sincronizador com o Sistema e-Aud da CGU para controle de providências pendentes.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Plano de Providências:</strong> Gestão de respostas da AECI instruídas pelos gestores finalísticos.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Relatórios anuais:</strong> Avaliação de eficiência de controle em conformidade com as diretrizes de prestação de contas.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Análise de Vulnerabilidade:</strong> Inteligência de auditoria preventiva nos processos de contratação e licitação.</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400">
                    Status: <span className="text-blue-600 font-bold">EM HOMOLOGAÇÃO COLETIVA</span> • Lançamento planejado para a próxima reunião técnica da AECI
                  </div>
                </div>
              )}

            </div>
          )}

        </main>

      </div>

      {/* 4. Footer System Label */}
      <footer className="bg-slate-900 border-t border-slate-850 py-3.5 px-6 text-center text-[11px] text-slate-400 no-print shrink-0">
        <p>© 2026 ORBITA.AECI — Ministério do Trabalho e Emprego — República Federativa do Brasil</p>
        <p className="opacity-60 text-[10px] mt-0.5">Ambiente Integrado de Apoio às decisões de Controle e Auditoria Governamental da IN 84/TCU.</p>
      </footer>

      {/* 1. Global User Profile Registration Modal */}
      {isRegisteringUser && (
        <UserProfileRegistrationModal 
          onClose={() => setIsRegisteringUser(false)}
          onSave={handleRegisterProfile}
        />
      )}

      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <AdminPanelModal 
          onClose={() => setIsAdminPanelOpen(false)}
          onClearOlderAcordaos={handleClearOlderAcordaos}
          onResetDatabase={handleResetDatabase}
          currentUser={currentUser}
        />
      )}

      {/* 2. Global Authorization Constraint Warning Modal (IN 84/TCU) */}
      {authAlert && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Regulatory Heading */}
            <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-rose-100/70 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-rose-900 uppercase tracking-tight">{authAlert.title}</h3>
                <span className="text-[9px] text-amber-800 font-extrabold font-mono uppercase tracking-widest block leading-none mt-0.5">Nível de Segurança Ouro</span>
              </div>
            </div>

            {/* Core Message */}
            <div className="p-6 space-y-4 text-slate-800">
              <p className="text-sm font-bold leading-normal text-slate-900">
                {authAlert.message}
              </p>
              
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                <p className="text-xs text-slate-650 flex items-start gap-2">
                  <span className="text-sm">ℹ️</span>
                  <span>{authAlert.sub}</span>
                </p>
              </div>

              {/* Action Hint detailing how to unlock */}
              <div className="bg-amber-400/10 border border-amber-400/20 p-3.5 rounded-2xl flex items-start gap-3">
                <Fingerprint className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-tight leading-none">Acesso Prático de Demonstração</h4>
                  <p className="text-[10px] text-amber-800 mt-1 leading-normal">
                    Como avaliador, você pode alternar facilmente seu perfil para <strong>Alessandro Barbosa</strong> através do menu do usuário no canto superior direito para liberar todas as permissões de edição deste módulo.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Exit Action Block */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAuthAlert(null)}
                className="px-5 py-2 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Global Authentication Success Toast */}
      {authSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white border border-white/10 p-3.5 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3 max-w-sm animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <span className="text-xs font-black block tracking-tight">Portal Homologado</span>
            <span className="text-[10px] text-slate-300 block">{authSuccessToast}</span>
          </div>
          <button 
            onClick={() => setAuthSuccessToast(null)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
}

// --------------------------------------------------------------------------------
// LockScreen component function
// --------------------------------------------------------------------------------
function LockScreen({ 
  profiles, 
  onUnlock, 
  onRegisterProfile 
}: { 
  profiles: UserProfile[]; 
  onUnlock: (profile: UserProfile) => void;
  onRegisterProfile: (profile: UserProfile) => void;
}) {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [pinCode, setPinCode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isRegisteringLock, setIsRegisteringLock] = useState<boolean>(false);

  const handleVerify = () => {
    if (!selectedProfile) return;
    if (selectedProfile.pin === pinCode || selectedProfile.clearance === "PUBLIC") {
      onUnlock(selectedProfile);
    } else {
      setErrorMsg("Código de Assinatura Eletrônica Inválido para este Dirigente.");
      setPinCode("");
    }
  };

  return (
    <div className="min-h-screen bg-[#07162c] flex flex-col justify-between p-6 text-white font-sans antialiased relative overflow-hidden select-none">
      {/* Visual background textures */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.08),transparent_50%)]" />
      
      {/* Header Gov emblem */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between opacity-80 border-b border-white/10 pb-4 relative z-10 text-[11px] tracking-wider text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-black text-white">BRASIL</span>
          <span>|</span>
          <span>CONTROLE INTERNO E AUDITORIA GOVERNAMENTAL</span>
        </div>
        <div>MINISTÉRIO DO TRABALHO E EMPREGO</div>
      </div>
 
      {/* Main Lock Form Box */}
      <div className="max-w-xl mx-auto w-full my-auto py-8 px-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl relative z-10 flex flex-col items-center animate-fade-in">
        
        {/* Dynamic Glowing Logo */}
        <div className="relative w-16 h-16 flex items-center justify-center bg-radial from-[#04244c] to-[#01142a] rounded-full border-2 border-amber-400 shadow-xl mb-6 select-none group">
          <div className="absolute inset-1 rounded-full border border-dashed border-amber-300/40 animate-[spin_25s_linear_infinite]" />
          <div className="absolute -inset-1.5 rounded-full border border-blue-500/10 animate-pulse pointer-events-none" />
          <span className="text-2xl font-black text-amber-400 font-serif leading-none">✪</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight text-center font-display" style={{ fontFamily: '"Outfit", sans-serif' }}>
          Portal ÓRBITA<span className="text-amber-400">.MTE</span>
        </h1>
        <p className="text-xs text-slate-300 text-center mt-1.5 max-w-sm leading-relaxed">
          Portal de Controle Interno e Auditoria do Ministério do Trabalho e Emprego
        </p>

        {/* Profile Card grid */}
        {!selectedProfile ? (
          <div className="mt-6 w-full space-y-4">
            {/* Explanatory box for simulation login */}
            <div className="bg-blue-500/10 border border-blue-400/20 p-3 rounded-2xl text-center">
              <p className="text-[11px] text-blue-300 leading-normal font-medium">
                🔐 <strong>Ambiente de Simulação de Auditoria (Demonstração)</strong>
                <span className="block mt-0.5 text-[10px] text-slate-300 font-normal">
                  Selecione o seu perfil de gestor ou cidadão abaixo. Insira o código PIN de assinatura correspondente na próxima tela para simular o nível de acesso.
                </span>
              </p>
            </div>

            <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase block text-center mb-1">
              Selecione o seu perfil funcional de acesso:
            </span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => {
                    setErrorMsg("");
                    setPinCode("");
                    if (profile.clearance === "PUBLIC") {
                      onUnlock(profile);
                    } else {
                      setSelectedProfile(profile);
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-slate-800/60 transition text-left flex items-start gap-3 cursor-pointer group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border uppercase ${profile.avatarColor}`}>
                    {profile.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-xs font-black text-white group-hover:text-amber-300 transition truncate">{profile.name}</span>
                    <span className="block text-[10px] text-slate-300 truncate mt-0.5 leading-none">{profile.role}</span>
                    <span className="inline-block mt-1 bg-white/10 text-slate-300 text-[8px] font-bold px-1.5 py-0.2 rounded">
                      {profile.badgeText}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Registration trigger from Lock screen */}
            <div className="pt-2 border-t border-white/10 flex justify-center">
              <button
                type="button"
                onClick={() => setIsRegisteringLock(true)}
                className="px-4 py-2 border border-dashed border-amber-400/35 hover:border-amber-400/70 hover:bg-amber-400/5 text-amber-300 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Credenciar Novo Gestor (MTE)
              </button>
            </div>
          </div>
        ) : (
          /* Profile PIN Form */
          <div className="mt-8 w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] ${selectedProfile.avatarColor}`}>
                {selectedProfile.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <div className="overflow-hidden flex-1">
                <span className="block text-xs font-black text-white">{selectedProfile.name}</span>
                <span className="block text-[9px] text-slate-400 truncate mt-0.5">{selectedProfile.badgeText}</span>
              </div>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="text-slate-400 hover:text-white text-[10px] py-1 px-2 border border-white/10 rounded-lg hover:bg-white/5 transition"
              >
                Alterar
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider block">
                Código PIN de Assinatura Eletrônica (gov.br):
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Seu código PIN de 4 dígitos"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => {
                    setErrorMsg("");
                    const val = e.target.value.replace(/\D/g, "");
                    setPinCode(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerify();
                  }}
                  className="w-full bg-slate-950/80 border border-white/15 focus:border-amber-400 focus:outline-hidden rounded-xl py-3 px-4 font-mono text-center text-lg tracking-widest text-amber-300"
                  autoFocus
                />
                <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 animate-pulse" />
              </div>
              
              {/* PIN Assist */}
              <div className="bg-amber-400/10 border border-amber-400/25 p-2 rounded-xl text-center">
                <p className="text-[10.5px] text-amber-300 flex items-center justify-center gap-1 leading-tight">
                  <Fingerprint className="w-3.5 h-3.5 inline shrink-0" />
                  <span>Código PIN para <strong> {selectedProfile.name.split(" ")[0]} </strong> é <code className="bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black font-mono text-xs">{selectedProfile.pin}</code></span>
                </p>
              </div>

              {errorMsg && (
                <p className="text-[11px] text-rose-400 font-bold bg-rose-500/10 border border-rose-550/20 p-2.5 rounded-xl text-center">
                  ⚠️ {errorMsg}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedProfile(null)}
                className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 stroke-[2.5]" /> Validar e Entrar
              </button>
            </div>
          </div>
        )}
      </div>

      {isRegisteringLock && (
        <UserProfileRegistrationModal 
          onClose={() => setIsRegisteringLock(false)}
          onSave={(newUser) => {
            onRegisterProfile(newUser);
            setIsRegisteringLock(false);
          }}
        />
      )}

      {/* Footer disclaimer */}
      <div className="max-w-7xl mx-auto w-full text-center text-[10px] text-slate-400 opacity-65 flex flex-col sm:flex-row gap-2 justify-between items-center border-t border-white/10 pt-4 relative z-10">
        <span>© 2026 ORBITA.AECI — Ministério do Trabalho e Emprego</span>
        <span>A segurança da informação federal está protegida em conformidade com as diretrizes do TCU.</span>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// UserProfileRegistrationModal component function
// --------------------------------------------------------------------------------
export function UserProfileRegistrationModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void; 
  onSave: (newUser: UserProfile) => void; 
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [registerInput, setRegisterInput] = useState(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `MTE-DEC-${rand}`;
  });
  const [clearance, setClearance] = useState<"ADMIN" | "ETHICS" | "AUDITOR" | "SRTE" | "PUBLIC">("ADMIN");
  const [pin, setPin] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!name.trim()) {
      setErrorText("Nome completo é obrigatório.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorText("Forneça um endereço de e-mail governamental válido.");
      return;
    }
    if (!role.trim()) {
      setErrorText("Cargo/Função é obrigatória.");
      return;
    }
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setErrorText("O PIN de assinatura eletrônica deve conter exatamente 4 dígitos numéricos.");
      return;
    }

    // Determine badge and color based on selected clearance
    let badgeText = "ACESSO PÚBLICO";
    let avatarColor = "bg-slate-600 text-white border-slate-450 ring-slate-500/30";

    if (clearance === "ADMIN") {
      badgeText = "AECI - ADMIN";
      avatarColor = "bg-amber-500 text-slate-950 border-amber-300 ring-amber-400/30";
    } else if (clearance === "ETHICS") {
      badgeText = "ÉTICA - CORREGEDORIA";
      avatarColor = "bg-indigo-600 text-white border-indigo-400 ring-indigo-500/30";
    } else if (clearance === "AUDITOR") {
      badgeText = "AUDITOR TCU";
      avatarColor = "bg-rose-600 text-white border-rose-400 ring-rose-500/30";
    } else if (clearance === "SRTE") {
      badgeText = "GESTOR SRTE - REGIONAL";
      avatarColor = "bg-indigo-650 text-white border-indigo-400 ring-indigo-500/30";
    }

    const newUser: UserProfile = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name,
      role,
      email,
      register: registerInput,
      clearance,
      avatarColor,
      pin,
      badgeText
    };

    onSave(newUser);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-normal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header decoration */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-[#003366] text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight" style={{ fontFamily: '"Outfit", sans-serif' }}>
              Credenciamento de Dirigente
            </h3>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-mono font-extrabold block mt-0.5">
              Identificação Funcional MTE / IN 84 TCU
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorText && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-bold leading-normal">
              <span>⚠️</span>
              <span>{errorText}</span>
            </div>
          )}

          <div className="space-y-3.5">
            {/* Field: Name */}
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                Nome Completo:
              </label>
              <input
                type="text"
                placeholder="Ex: Dra. Marianna Lima"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-hidden py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition"
              />
            </div>

            {/* Field: Email & Matrícula */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                  E-mail Funcional (.gov):
                </label>
                <input
                  type="email"
                  placeholder="marianna.lima@mte.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-hidden py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                  Matrícula Geral:
                </label>
                <input
                  type="text"
                  placeholder="MTE-DEC-xxxx"
                  value={registerInput}
                  onChange={(e) => setRegisterInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-hidden py-2 px-3 rounded-xl text-xs font-medium font-mono text-slate-800 transition"
                />
              </div>
            </div>

            {/* Field: Cargo & PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                  Cargo / Setor Relacionado:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auditor Adjunto"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-hidden py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                  Código PIN de Assinatura (4 dígitos):
                </label>
                <input
                  type="password"
                  placeholder="Defina PIN numérico"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-hidden py-2 px-3 rounded-xl text-xs font-mono text-center tracking-widest text-slate-800 transition"
                />
              </div>
            </div>

            {/* Field: Nível de Acesso */}
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">
                Perfil de Acesso (Nível de Credenciamento):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "ADMIN", label: "AECI - Admin", desc: "Acesso Total e Assinaturas" },
                  { id: "ETHICS", label: "Membro Comitê Ética", desc: "Processar Demandas Éticas" },
                  { id: "AUDITOR", label: "Auditor TCU Externo", desc: "Visualização Homologada" },
                  { id: "SRTE", label: "Gestor SRTE", desc: "Editar Superintendências" },
                  { id: "PUBLIC", label: "Cidadão / Consulta", desc: "Restrito (Apenas leitura)" }
                ].map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setClearance(level.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition select-none flex flex-col justify-between ${
                      clearance === level.id 
                        ? "bg-blue-50/70 border-[#003366] ring-2 ring-blue-900/10" 
                        : "bg-slate-50 border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    <span className="text-[11px] font-black text-slate-900 block">{level.label}</span>
                    <span className="text-[9px] text-slate-500 mt-0.5 block leading-tight">{level.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-blue-900 to-[#003366] hover:from-[#002244] hover:to-blue-900 text-white font-black rounded-xl text-xs transition shadow-md hover:shadow-lg cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Gravar e Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// Admin Panel Modal for Database Maintenance
// --------------------------------------------------------------------------------
export function AdminPanelModal({
  onClose,
  onClearOlderAcordaos,
  onResetDatabase,
  currentUser
}: {
  onClose: () => void;
  onClearOlderAcordaos: () => Promise<any>;
  onResetDatabase: () => Promise<any>;
  currentUser: UserProfile;
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminStatusMsg, setAdminStatusMsg] = useState<string | null>(null);
  const [isAdminExecuting, setIsAdminExecuting] = useState(false);

  const handleClearPre2022 = async () => {
    setIsAdminExecuting(true);
    setAdminStatusMsg(null);
    try {
      const res = await onClearOlderAcordaos();
      if (res) {
        setAdminStatusMsg(`Sucesso! Foram removidos ${res.removedCount} acórdãos anteriores ao ano de 2022. Total restante: ${res.totalRemaining} registros.`);
        setShowClearConfirm(false);
      } else {
        setAdminStatusMsg("Erro ao realizar limpeza ou você não possui as permissões necessárias.");
      }
    } catch (err) {
      setAdminStatusMsg("Houve um problema de conectividade ao realizar o expurgo.");
    } finally {
      setIsAdminExecuting(false);
    }
  };

  const handleResetToFactory = async () => {
    setIsAdminExecuting(true);
    setAdminStatusMsg(null);
    try {
      const res = await onResetDatabase();
      if (res && res.success) {
        setAdminStatusMsg(`Sucesso! O banco de dados foi redefinido integralmente para os dados originais do Ministério.`);
        setShowResetConfirm(false);
      } else {
        setAdminStatusMsg("Erro ao realizar redefinição ou você não possui as permissões necessárias.");
      }
    } catch (err) {
      setAdminStatusMsg("Houve um problema de conectividade ao realizar a redefinição.");
    } finally {
      setIsAdminExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-all-normal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-850 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 font-bold">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight font-sans">
                Painel do Administrador (AECI)
              </h3>
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-mono font-extrabold block mt-0.5">
                Manutenção Protetiva e Controle Exclusivo do Banco
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin context metadata box */}
        <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center justify-between text-xs text-amber-950 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Sessão de Administrador Ativa: <strong>{currentUser.name}</strong> ({currentUser.register})</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-100 text-amber-850 rounded-md font-bold uppercase">Nível AECI-GOLD</span>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-6">
          {adminStatusMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{adminStatusMsg}</span>
              </div>
              <button 
                onClick={() => setAdminStatusMsg(null)} 
                className="text-emerald-600 hover:text-[#003366] font-extrabold text-[10px] uppercase tracking-wide px-1.5 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Action 1: Expurgar */}
            <div className="bg-slate-50 hover:bg-slate-100/30 border border-slate-200 rounded-2xl p-5 transition flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">Filtro de Anos</span>
                <h5 className="text-xs font-bold text-slate-950 leading-tight">
                  Expurgar Acórdãos Anteriores a 2022
                </h5>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Remove do banco acórdãos de anos antigos, deixando unicamente dados de 2022 em diante. Ideal para focar nos anos vigentes e limpar dropdowns de filtros.
                </p>
              </div>

              {!showClearConfirm ? (
                <div>
                  <button
                    onClick={() => { setShowClearConfirm(true); setShowResetConfirm(false); }}
                    disabled={isAdminExecuting}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-3xs transition cursor-pointer"
                  >
                    Remover Dados &lt; 2022
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2.5 animate-fade-in text-xs">
                  <p className="font-extrabold text-amber-950 text-[10px]">
                    ⚠️ Confirmar destruição de registros anteriores a 2022? Ação irrecuperável.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearPre2022}
                      disabled={isAdminExecuting}
                      className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      {isAdminExecuting ? "Processando..." : "Sim, Deletar"}
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      disabled={isAdminExecuting}
                      className="flex-1 py-1 bg-white border border-slate-200 text-slate-605 font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action 2: Reset */}
            <div className="bg-rose-50/10 hover:bg-rose-50/20 border border-rose-100 rounded-2xl p-5 transition flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] bg-rose-100 text-rose-850 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 inline-block">Factory Reset</span>
                <h5 className="text-xs font-bold text-slate-950 leading-tight">
                  Redefinição Completa de Fábrica
                </h5>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Zera integralmente todas as tabelas (acórdãos, comunicações, comissão de ética, rol de responsáveis) de volta aos dados de semente oficiais fornecidos no Ministério.
                </p>
              </div>

              {!showResetConfirm ? (
                <div>
                  <button
                    onClick={() => { setShowResetConfirm(true); setShowClearConfirm(false); }}
                    disabled={isAdminExecuting}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-3xs transition cursor-pointer"
                  >
                    Zerar Banco de Dados
                  </button>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-2.5 animate-fade-in text-xs">
                  <p className="font-extrabold text-rose-950 text-[10px]">
                    💥 ATENÇÃO: Deseja REALMENTE apagar todo o histórico customizado do portal?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetToFactory}
                      disabled={isAdminExecuting}
                      className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] cursor-pointer"
                    >
                      {isAdminExecuting ? "Processando..." : "Sim, Resetar Tudo"}
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      disabled={isAdminExecuting}
                      className="flex-1 py-1 bg-white border border-slate-200 text-slate-605 font-bold rounded-lg text-[10px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white font-black rounded-xl text-xs transition cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
}
