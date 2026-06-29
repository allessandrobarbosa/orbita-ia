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
  X,
  User
} from "lucide-react";

// User Access Profile Management Schema
export interface UserProfile {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  unidade?: string;
  role: string;
  email: string;
  register: string;
  clearance: "ADMIN" | "ETHICS" | "AUDITOR" | "SRTE" | "PUBLIC" | "PENDING";
  allowedModules?: string[];
  avatarColor: string;
  pin: string;
  password?: string;
  requiresPasswordChange?: boolean;
  status?: "PENDING" | "ACTIVE" | "INACTIVE";
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
import CguModule from "./components/CguModule";
// import logoImg from "./assets/images/orbita_logo.png";

import { 
  AcordaoDemand, RolResponsavel, ComissaoEticaDemand, SuperintendenciaRegional, 
  ComunicacaoDemand, TceDemand, TceAcordaoMapping, CguDemand, CguPublishedReport,
  EticaMembro, EticaReuniao, EticaAta, EticaProcesso 
} from "./types";

export default function App() {

  // States holding backend values
  const [acordaos, setAcordaos] = useState<AcordaoDemand[]>([]);
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoDemand[]>([]);
  const [rolResponsaveis, setRolResponsaveis] = useState<RolResponsavel[]>([]);
  const [comissaoEtica, setComissaoEtica] = useState<ComissaoEticaDemand[]>([]);
  const [superintendencias, setSuperintendencias] = useState<SuperintendenciaRegional[]>([]);
  const [tces, setTces] = useState<TceDemand[]>([]);
  const [tceMappings, setTceMappings] = useState<TceAcordaoMapping[]>([]);
  const [cguDemands, setCguDemands] = useState<CguDemand[]>([]);
  const [cguPublishedReports, setCguPublishedReports] = useState<CguPublishedReport[]>([]);
  const [membrosEtica, setMembrosEtica] = useState<EticaMembro[]>([]);
  const [reunioesEtica, setReunioesEtica] = useState<EticaReuniao[]>([]);
  const [atasEtica, setAtasEtica] = useState<EticaAta[]>([]);
  const [processosEtica, setProcessosEtica] = useState<EticaProcesso[]>([]);
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
      } catch (e) { }
    }
    return USER_PROFILES;
  });

  // Active User profile and session locks
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => profiles[0] || USER_PROFILES[0]);
  const [isLocked, setIsLocked] = useState<boolean>(true); // Gated by default
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [authAlert, setAuthAlert] = useState<{ title: string; message: string; sub: string } | null>(null);
  const [authSuccessToast, setAuthSuccessToast] = useState<string | null>(null);

  const handleRegisterProfile = (newProfile: UserProfile) => {
    const updated = [...profiles, newProfile];
    setProfiles(updated);
    localStorage.setItem("orbita_user_profiles", JSON.stringify(updated));
    setCurrentUser(newProfile);
    setAuthSuccessToast(`Usuário "${newProfile.name}" cadastrado e logado!`);
  };

  const hasModulePermission = (tabId: string): boolean => {
    if (currentUser.clearance === "ADMIN") return true;
    if (tabId === "dashboard") return true; // Todos veem o Início
    
    const idToMod: Record<string, string> = {
      tcu: "TCU",
      cgu: "CGU",
      etica: "ETHICS",
      rol: "ROL",
      srte: "SRTE",
      bi: "BI"
    };

    const mod = idToMod[tabId];
    if (!mod) return true;

    if (currentUser.allowedModules) {
      return currentUser.allowedModules.includes(mod);
    }

    // Fallback de segurança: Se a sessão antiga não enviou allowedModules, tenta extrair do badgeText
    if (currentUser.badgeText && currentUser.badgeText.includes(mod)) {
      return true;
    }

    // Fallback legado
    if (currentUser.clearance === "ETHICS" && mod === "ETHICS") return true;
    if (currentUser.clearance === "SRTE" && mod === "SRTE") return true;
    return false;
  };

  // Checks privileges against active user context on actions
  const checkPermission = (module: "TCU" | "ROL" | "ETHICS" | "SRTE" | "CGU"): boolean => {
    if (currentUser.clearance === "ADMIN") return true;
    
    if (currentUser.allowedModules) {
      if (currentUser.allowedModules.includes(module)) return true;
    } else {
      // Legacy fallback
      if (currentUser.clearance === "ETHICS" && module === "ETHICS") return true;
      if (currentUser.clearance === "SRTE" && module === "SRTE") return true;
    }

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
      const [
        acRes, comRes, rolRes, eticaRes, srteRes, statsRes, tcesRes, tceMappingsRes, cguRes, cguReportsRes,
        membrosRes, reunioesRes, atasRes, processosRes
      ] = await Promise.all([
        fetch(`/api/acordaos${cb}`).then(r => r.json()),
        fetch(`/api/comunicacoes${cb}`).then(r => r.json()),
        fetch(`/api/rol-responsaveis${cb}`).then(r => r.json()),
        fetch(`/api/comissao-etica${cb}`).then(r => r.json()),
        fetch(`/api/superintendencias${cb}`).then(r => r.json()),
        fetch(`/api/dashboard-stats${cb}`).then(r => r.json()),
        fetch(`/api/tces${cb}`).then(r => r.json()),
        fetch(`/api/tce-mappings${cb}`).then(r => r.json()),
        fetch(`/api/cgu${cb}`).then(r => r.json()),
        fetch(`/api/cgu/reports${cb}`).then(r => r.json()),
        fetch(`/api/etica/membros${cb}`).then(r => r.json()),
        fetch(`/api/etica/reunioes${cb}`).then(r => r.json()),
        fetch(`/api/etica/atas${cb}`).then(r => r.json()),
        fetch(`/api/etica/processos${cb}`).then(r => r.json())
      ]);

      setAcordaos(acRes);
      setComunicacoes(comRes);
      setRolResponsaveis(rolRes);
      setComissaoEtica(eticaRes);
      setSuperintendencias(srteRes);
      setDashboardStats(statsRes);
      setTces(tcesRes || []);
      setTceMappings(tceMappingsRes || []);
      setCguDemands(cguRes || []);
      setCguPublishedReports(cguReportsRes || []);
      setMembrosEtica(membrosRes || []);
      setReunioesEtica(reunioesRes || []);
      setAtasEtica(atasRes || []);
      setProcessosEtica(processosRes || []);
    } catch (err) {
      console.error("Erro ao carregar dados do ORBITA.AECI:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!hasModulePermission(activeTab)) {
      setActiveTab("dashboard");
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        // If this is a cold start (new tab or browser restarted without sessionStorage),
        // force a logout first to destroy any persistent server session.
        if (sessionStorage.getItem("sessionActive") !== "true") {
          try {
            await fetch("/api/auth/logout", { method: "POST" });
          } catch (e) {}
          sessionStorage.setItem("sessionActive", "true");
        }

        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setIsLocked(false);
          } else {
            setIsLocked(true);
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão ativa:", err);
      }
    };
    checkActiveSession();
    fetchAllData();
  }, []);

  // Session heartbeat to keep session active and detect browser close
  useEffect(() => {
    if (isLocked) return;

    const sendHeartbeat = () => {
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    };

    // Send initially
    sendHeartbeat();

    // Send heartbeat every 10 seconds
    const interval = setInterval(sendHeartbeat, 10000);

    return () => clearInterval(interval);
  }, [isLocked]);

  // Inactivity timeout (10 minutes) to automatically check-out and lock session
  useEffect(() => {
    if (isLocked) return;

    let timeoutId: NodeJS.Timeout;

    const handleInactivityLogout = async () => {
      console.log("[Orbita Security] Logging out due to 10 minutes of inactivity.");
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch (e) {}
      sessionStorage.removeItem("sessionActive");
      setIsLocked(true);
      setAuthSuccessToast("Sessão finalizada por inatividade (10 minutos).");
    };

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleInactivityLogout, 10 * 60 * 1000); // 10 minutes
    };

    // Set up listeners for active user interactions
    const activityEvents = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
    
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Initialize timer
    resetInactivityTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isLocked]);

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
          sessionStorage.setItem("sessionActive", "true");
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

  // CGU actions
  const handleUpdateCgu = async (updated: CguDemand): Promise<boolean> => {
    if (!checkPermission("CGU")) return false;
    try {
      const res = await fetch("/api/cgu/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao salvar demanda CGU:", err);
    }
    return false;
  };

  const handleDeleteCgu = async (id: string): Promise<boolean> => {
    if (!checkPermission("CGU")) return false;
    try {
      const res = await fetch(`/api/cgu/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao remover demanda CGU:", err);
    }
    return false;
  };

  const handleImportCgu = async (items: CguDemand[]): Promise<any> => {
    if (!checkPermission("CGU")) return null;
    try {
      const res = await fetch("/api/cgu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha no lote de importação CGU:", err);
    }
    return { success: false, error: "Falha de conexão ao importar demandas CGU." };
  };

  const handleImportCguReports = async (items: CguPublishedReport[]): Promise<any> => {
    if (!checkPermission("CGU")) return null;
    try {
      const res = await fetch("/api/cgu/reports/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha no lote de importação de relatórios CGU:", err);
    }
    return { success: false, error: "Falha de conexão ao importar relatórios CGU." };
  };

  const handleSyncCguReports = async (): Promise<any> => {
    if (!checkPermission("CGU")) return null;
    try {
      const res = await fetch("/api/cgu/reports/sync", {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllData();
        return data;
      }
    } catch (err) {
      console.error("Falha ao sincronizar relatórios CGU:", err);
    }
    return { success: false, error: "Falha de conexão ao sincronizar relatórios CGU com o portal." };
  };

  const handleDeleteCguReport = async (idTarefa: string): Promise<boolean> => {
    if (!checkPermission("CGU")) return false;
    try {
      const res = await fetch(`/api/cgu/reports/${idTarefa}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error("Falha ao remover relatório CGU:", err);
    }
    return false;
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

  // Membros Comissão de Ética handlers
  const handleAddEticaMembro = async (newMembro: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch("/api/etica/membros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMembro)
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

  const handleUpdateEticaMembro = async (id: string, updated: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/membros/${id}`, {
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

  const handleDeleteEticaMembro = async (id: string): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/membros/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // Reuniões handlers
  const handleAddEticaReuniao = async (newReuniao: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch("/api/etica/reunioes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReuniao)
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

  const handleUpdateEticaReuniao = async (id: string, updated: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/reunioes/${id}`, {
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

  const handleDeleteEticaReuniao = async (id: string): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/reunioes/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAllData();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleNotifyEticaReuniao = async (id: string, type: 'agendamento' | 'lembrete'): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/reunioes/${id}/notificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
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

  // Atas handlers
  const handleSaveEticaAta = async (newAta: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch("/api/etica/atas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAta)
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

  // Processos handlers
  const handleAddEticaProcesso = async (newProcesso: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch("/api/etica/processos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProcesso)
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

  const handleUpdateEticaProcesso = async (id: string, updated: any): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/processos/${id}`, {
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

  const handleDeleteEticaProcesso = async (id: string): Promise<boolean> => {
    if (!checkPermission("ETHICS")) return false;
    try {
      const res = await fetch(`/api/etica/processos/${id}`, { method: "DELETE" });
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
      <header className="gov-header border-b-2 shadow-xs no-print shrink-0 font-sans sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex flex-col md:flex-row items-center gap-6">
          
          {/* 1. Left Side: Flat Geometric Logo (GOV.BR Style) */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-center md:justify-start">
            <svg 
              className="w-10 h-10 text-[#003366] shrink-0" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Three Orbit Rings */}
              <ellipse cx="50" cy="50" rx="38" ry="11" transform="rotate(30 50 50)" stroke="currentColor" strokeWidth="3.5" />
              <ellipse cx="50" cy="50" rx="38" ry="11" transform="rotate(90 50 50)" stroke="currentColor" strokeWidth="3.5" />
              <ellipse cx="50" cy="50" rx="38" ry="11" transform="rotate(150 50 50)" stroke="currentColor" strokeWidth="3.5" />
              {/* Central nucleus */}
              <circle cx="50" cy="50" r="7.5" fill="currentColor" />
              {/* Electron nodes on the paths */}
              <circle cx="21" cy="33.5" r="3.5" fill="currentColor" />
              <circle cx="79" cy="66.5" r="3.5" fill="currentColor" />
              <circle cx="50" cy="12" r="3.5" fill="currentColor" />
            </svg>
            <div className="text-left font-sans">
              <h1 className="text-[#003366] text-base font-black tracking-tight leading-none uppercase">
                ÓRBITA-AECI
              </h1>
              <p className="text-[#003366]/70 text-[9px] font-bold tracking-wide mt-1 leading-none uppercase">
                AECI - ASSESSORIA ESPECIAL DE CONTROLE INTERNO
              </p>
              <span className="text-[#003366]/45 text-[8px] font-extrabold tracking-widest mt-1 block leading-none">
                VERSÃO 2.6.0
              </span>
            </div>
          </div>

          {/* 2. Middle/Left: Integrated Navigation Menu (aligned next to logo on desktop, rounded pills) */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 flex-1 w-full md:w-auto">
            {[
              { id: "dashboard", label: "INÍCIO", icon: LayoutDashboard, title: "Painel de Controle e Monitoramento" },
              { id: "tcu", label: "TCU", icon: Database, title: "Tribunal de Contas da União" },
              { id: "cgu", label: "CGU", icon: ShieldCheck, title: "Controladoria-Geral da União" },
              { id: "etica", label: "ÉTICA", icon: ShieldAlert, title: "Comissão de Ética Coletiva" },
              { id: "rol", label: "ROL", icon: Users, title: "Gestão do Rol de Responsáveis" },
              { id: "srte", label: "STRES", icon: Building2, title: "Superintendências Regionais do Trabalho e Emprego" },
              { id: "bi", label: "BI & IA", icon: TrendingUp, title: "Análise BI & IA Preditiva" },
            ].filter(link => hasModulePermission(link.id)).map((moduleLink) => {
              const ModuleIcon = moduleLink.icon;
              const isSelected = activeTab === moduleLink.id;
              return (
                <button
                  key={moduleLink.id}
                  onClick={() => {
                    setActiveTab(moduleLink.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    isSelected
                      ? "nav-btn-active shadow-sm"
                      : "nav-btn-inactive hover:bg-slate-100"
                  }`}
                  title={moduleLink.title}
                >
                  <ModuleIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#003366]"}`} />
                  <span>{moduleLink.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Right Side: Interactive User Controller Dropdown (pushed to far right via md:ml-auto) */}
          <div className="relative shrink-0 w-full md:w-auto flex justify-center md:justify-end md:ml-auto">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#003366]/30 hover:border-[#003366] bg-white hover:bg-[#e6f1fe] transition cursor-pointer text-left focus:outline-hidden shadow-2xs"
              id="btn-user-dropdown-toggle"
            >
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-black block text-[#003366] tracking-tight leading-none">{currentUser.name}</span>
                <span className="text-[9px] text-[#003366]/70 font-bold block flex items-center gap-1 justify-end mt-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {currentUser.badgeText}
                </span>
              </div>

              <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] border border-[#003366] bg-[#dbeafe] text-[#003366] select-none uppercase">
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

                  {/* Trancar com senha */}
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/logout", { method: "POST" });
                      } catch (e) {}
                      sessionStorage.removeItem("sessionActive");
                      setIsLocked(true);
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-2.5 px-3 hover:bg-slate-200/55 text-slate-700 font-extrabold rounded-xl text-[10px] flex items-center gap-1.5 transition cursor-pointer border border-transparent"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Trancar Sessão sob PIN
                  </button>

                  {/* Sair do Portal (Logout) */}
                  <button
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/logout", { method: "POST" });
                      } catch (e) {}
                      sessionStorage.removeItem("sessionActive");
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
                  rolResponsaveis={rolResponsaveis}
                  comissaoEtica={comissaoEtica}
                  superintendencias={superintendencias}
                  hasModulePermission={hasModulePermission}
                  cguDemands={cguDemands}
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
                  membrosEtica={membrosEtica}
                  reunioesEtica={reunioesEtica}
                  atasEtica={atasEtica}
                  processosEtica={processosEtica}
                  onAddEticaMembro={handleAddEticaMembro}
                  onUpdateEticaMembro={handleUpdateEticaMembro}
                  onDeleteEticaMembro={handleDeleteEticaMembro}
                  onAddEticaReuniao={handleAddEticaReuniao}
                  onUpdateEticaReuniao={handleUpdateEticaReuniao}
                  onDeleteEticaReuniao={handleDeleteEticaReuniao}
                  onNotifyEticaReuniao={handleNotifyEticaReuniao}
                  onSaveEticaAta={handleSaveEticaAta}
                  onAddEticaProcesso={handleAddEticaProcesso}
                  onUpdateEticaProcesso={handleUpdateEticaProcesso}
                  onDeleteEticaProcesso={handleDeleteEticaProcesso}
                />
              )}

              {activeTab === "srte" && (
                <SrteModule
                  superintendencias={superintendencias}
                  onUpdateSrte={handleUpdateSrte}
                  acordaos={acordaos}
                  comunicacoes={comunicacoes}
                  tces={tces}
                />
              )}

              {activeTab === "cgu" && (
                <CguModule
                  cguDemands={cguDemands}
                  onUpdateCgu={handleUpdateCgu}
                  onDeleteCgu={handleDeleteCgu}
                  onImportCgu={handleImportCgu}
                  cguPublishedReports={cguPublishedReports}
                  onImportCguReports={handleImportCguReports}
                  onSyncCguReports={handleSyncCguReports}
                  onDeleteCguReport={handleDeleteCguReport}
                  isLoading={isLoading}
                />
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
  const [showSimulatedProfiles, setShowSimulatedProfiles] = useState<boolean>(false);
  
  // New auth flow state
  const [loginStep, setLoginStep] = useState<"identifier" | "password">("identifier");
  const [identifier, setIdentifier] = useState<string>("");
  const [localPassword, setLocalPassword] = useState<string>("");
  const [isRegisteringAccess, setIsRegisteringAccess] = useState<boolean>(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState<boolean>(false);
  const [showForcePasswordChange, setShowForcePasswordChange] = useState<boolean>(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  
  const [pinCode, setPinCode] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleVerify = async () => {
    if (!selectedProfile) return;
    try {
      const res = await fetch("/api/auth/login-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: selectedProfile.id, password: pinCode })
      });
      if (res.ok) {
        const data = await res.json();
        onUnlock(data.user);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Código PIN Inválido.");
        setPinCode("");
      }
    } catch (err) {
      // Offline fallback
      if (selectedProfile.pin === pinCode || selectedProfile.clearance === "PUBLIC") {
        onUnlock(selectedProfile);
      } else {
        setErrorMsg("Erro de conexão.");
        setPinCode("");
      }
    }
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (loginStep === "identifier") {
      if (!identifier.trim()) {
        setErrorMsg("Por favor, informe seu CPF, Login ou E-mail.");
        return;
      }
      setLoginStep("password");
    } else {
      if (!localPassword) {
        setErrorMsg("Por favor, informe a senha.");
        return;
      }
      try {
        const res = await fetch("/api/auth/login-local", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password: localPassword })
        });
        const data = await res.json();
        if (res.ok) {
          if (data.requiresPasswordChange) {
            setPendingUser(data.user);
            setShowForcePasswordChange(true);
          } else {
            onUnlock(data.user);
          }
        } else {
          setErrorMsg(data.error || "Credenciais inválidas.");
          setLocalPassword("");
        }
      } catch (err) {
        setErrorMsg("Erro de conexão com o servidor.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-700 font-sans antialiased select-none">

      {/* Header Gov emblem */}
      <div className="bg-white border-b border-slate-200 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between text-slate-500 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#1351b4]">gov<span className="text-[#00c010]">.</span>br</span>
            <span className="text-[10px] text-slate-400 pl-2 border-l border-slate-200 hidden sm:inline">Serviço de Autenticação Federada</span>
          </div>
          <div className="text-[10px] sm:text-xs">MINISTÉRIO DO TRABALHO E EMPREGO</div>
        </div>
      </div>

      {/* Main Lock Form Box */}
      <div className="max-w-md mx-auto w-full my-auto py-8 px-8 bg-white rounded-2xl border border-slate-200 shadow-lg flex flex-col items-center animate-fade-in">

        {/* Profile Card grid */}
        {!selectedProfile ? (
          !showSimulatedProfiles ? (
            <div className="w-full text-left">
              <label className="text-[14px] font-medium text-slate-700 block mb-2">Entrar com</label>
              
              {errorMsg && (
                <div className="mb-4 bg-rose-50 border border-rose-200 p-2.5 rounded-md text-rose-700 text-xs text-center font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleLocalLogin}>
                {loginStep === "identifier" ? (
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-300 pr-3">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Informe seu CPF, Login ou Email"
                      value={identifier}
                      onChange={e => { setIdentifier(e.target.value); setErrorMsg(""); }}
                      className="pl-12 w-full bg-white border border-slate-300 focus:border-[#1351b4] focus:ring-1 focus:ring-[#1351b4] focus:outline-none rounded-md py-2.5 text-[14px] text-slate-700"
                    />
                  </div>
                ) : (
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-slate-300 pr-3">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Senha de Acesso"
                      value={localPassword}
                      onChange={e => { setLocalPassword(e.target.value); setErrorMsg(""); }}
                      className="pl-12 w-full bg-white border border-slate-300 focus:border-[#1351b4] focus:ring-1 focus:ring-[#1351b4] focus:outline-none rounded-md py-2.5 text-[14px] text-slate-700"
                      autoFocus
                    />
                  </div>
                )}
                <div className="flex gap-2 mb-6">
                  {loginStep === "password" && (
                    <button type="button" onClick={() => setLoginStep("identifier")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[14px] py-2.5 px-4 rounded-md transition duration-150 cursor-pointer">
                      Voltar
                    </button>
                  )}
                  <button type="submit" className="flex-1 bg-[#1351b4] hover:bg-[#0c3c88] text-white font-medium text-[14px] py-2.5 rounded-md transition duration-150 cursor-pointer">
                    {loginStep === "identifier" ? "AVANÇAR" : "ENTRAR"}
                  </button>
                </div>
              </form>

              <div className="flex items-center w-full mb-6">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="px-3 text-[12px] text-slate-500 uppercase">OU</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>

              <div className="flex justify-center mb-6">
                <button
                  type="button"
                  onClick={() => window.location.href = "/api/auth/govbr/login"}
                  className="border border-[#1351b4] hover:bg-slate-50 rounded-full py-2 px-6 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span className="text-[#1351b4] text-[14px]">Entrar com</span>
                  <span className="text-xl font-black tracking-tight text-[#1351b4]">gov<span className="text-[#00c010]">.</span>br</span>
                </button>
              </div>

              <div className="text-left mb-6">
                <h3 className="text-[#1351b4] font-bold text-[14px] mb-2">Acesse utilizando o Cadastro Único do Governo Federal</h3>
                <p className="text-[13px] text-slate-700 mb-1">A conta gov.br é uma forma digital de acessar serviços públicos.</p>
                <a href="#" className="text-[13px] text-[#1351b4] hover:underline">Saiba como obter as credenciais de acesso.</a>
              </div>

              <div className="border-t border-slate-200 mb-6"></div>

              <button onClick={() => setIsRegisteringAccess(true)} className="w-full border border-[#1351b4] text-[#1351b4] hover:bg-slate-50 font-bold text-[14px] py-2.5 rounded-md transition duration-150 mb-6 cursor-pointer">
                NOVO CADASTRO
              </button>

              <div className="text-center mb-4">
                <button onClick={() => setIsRecoveringPassword(true)} className="text-[13px] text-[#1351b4] hover:underline cursor-pointer">Gerenciar usuário ou senha? Clique aqui</button>
              </div>

              <div className="flex items-center w-full mt-4">
                <div className="flex-1 border-t border-slate-200"></div>
                <button onClick={() => setShowSimulatedProfiles(true)} className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1351b4] cursor-pointer transition">
                  ou simule acesso local
                </button>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight" style={{ fontFamily: '"Outfit", sans-serif' }}>
                  Acesso Simulado
                </h2>
                <button onClick={() => setShowSimulatedProfiles(false)} className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer">Voltar</button>
              </div>

              {/* Explanatory box for simulation login */}
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                <p className="text-[10px] text-blue-900 leading-normal font-medium">
                  🔐 <strong>Ambiente de Homologação Integrado</strong>
                  <span className="block mt-0.5 text-[9.5px] text-slate-600 font-normal">
                    Selecione o seu perfil de gestor ou cidadão abaixo e forneça o PIN de assinatura local correspondente.
                  </span>
                </p>
              </div>

              <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block text-center mb-1">
                Selecione seu perfil funcional:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
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
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#1351b4]/40 hover:bg-slate-100 transition text-left flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 border uppercase text-white bg-[#1351b4] border-blue-400`}>
                    {profile.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <span className="block text-xs font-black text-slate-800 group-hover:text-[#1351b4] transition truncate">{profile.name}</span>
                    <span className="block text-[9.5px] text-slate-500 truncate leading-none mt-0.5">{profile.role}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Removed legacy registration trigger */}
          </div>
          )
        ) : (
          /* Profile PIN Form */
          <div className="mt-6 w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8.5 h-8.5 rounded-lg flex items-center justify-center font-bold text-[10px] text-white bg-[#1351b4]">
                {selectedProfile.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <span className="block text-xs font-black text-slate-800">{selectedProfile.name}</span>
                <span className="block text-[9.5px] text-slate-500 truncate mt-0.5">{selectedProfile.badgeText}</span>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-slate-500 hover:text-[#1351b4] text-[10px] py-1 px-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
              >
                Alterar
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
                Código PIN de Assinatura Eletrônica (gov.br):
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="PIN de 4 dígitos"
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
                  className="w-full bg-white border border-slate-300 focus:border-[#1351b4] focus:ring-1 focus:ring-[#1351b4] focus:outline-none rounded-xl py-3 px-4 font-mono text-center text-lg tracking-widest text-[#1351b4]"
                  autoFocus
                />
                <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 animate-pulse" />
              </div>

              {/* PIN Assist */}
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-center">
                <p className="text-[10px] text-amber-800 flex items-center justify-center gap-1 leading-tight font-medium">
                  <Fingerprint className="w-3.5 h-3.5 inline shrink-0 text-amber-600" />
                  <span>O PIN para <strong>{selectedProfile.name.split(" ")[0]}</strong> é <code className="bg-amber-100 border border-amber-300 text-amber-900 px-1 py-0.2 rounded font-black font-mono text-xs">{selectedProfile.pin}</code></span>
                </p>
              </div>

              {errorMsg && (
                <p className="text-[10.5px] text-rose-700 font-bold bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center">
                  ⚠️ {errorMsg}
                </p>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSelectedProfile(null)}
                className="flex-grow py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleVerify}
                className="flex-grow py-2.5 rounded-xl bg-[#1351b4] hover:bg-[#0c3c88] text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Unlock className="w-3.5 h-3.5 stroke-[2.5]" /> Validar e Entrar
              </button>
            </div>
          </div>
        )}
      </div>

      {isRegisteringAccess && (
        <AccessRequestModal onClose={() => setIsRegisteringAccess(false)} />
      )}
      {isRecoveringPassword && (
        <ForgotPasswordModal onClose={() => setIsRecoveringPassword(false)} />
      )}
      {showForcePasswordChange && pendingUser && (
        <ForcePasswordChangeModal 
          user={pendingUser} 
          onSuccess={(user) => {
            setShowForcePasswordChange(false);
            onUnlock(user);
          }} 
        />
      )}

      {/* Footer disclaimer */}
      <footer className="w-full text-center text-[10px] text-slate-400 py-4 border-t border-slate-200 flex flex-col sm:flex-row gap-2 justify-between items-center max-w-7xl mx-auto px-4">
        <span>© 2026 ORBITA.AECI — Ministério do Trabalho e Emprego</span>
        <span>Acesso protegido e auditado de acordo com as diretrizes do TCU.</span>
      </footer>
    </div>
  );
}

// --------------------------------------------------------------------------------
// AccessRequestModal component function
// --------------------------------------------------------------------------------
export function AccessRequestModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [unidade, setUnidade] = useState("");
  const [errorText, setErrorText] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (!name.trim() || !cpf.trim() || !email.trim()) {
      setErrorText("Nome, CPF e E-mail são obrigatórios.");
      return;
    }

    try {
      const res = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cpf, email, phone, unidade })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorText(data.error || "Erro ao solicitar acesso.");
      }
    } catch (err) {
      setErrorText("Erro de conexão com o servidor.");
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-normal">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Solicitação Enviada!</h3>
          <p className="text-sm text-slate-600 mb-6">Seus dados foram enviados para análise. O administrador será notificado via e-mail e em breve você receberá as instruções de acesso no seu e-mail cadastrado.</p>
          <button onClick={onClose} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded-xl transition hover:bg-[#0c3c88]">Concluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-normal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-blue-900 to-[#003366] text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">Solicitação de Acesso</h3>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest font-mono font-extrabold block mt-0.5">Sistema Órbita</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorText && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-bold leading-normal">
              ⚠️ {errorText}
            </div>
          )}
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Nome Completo:</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">CPF:</label>
                <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Apenas números" className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Telefone:</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">E-mail Funcional:</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Setor/Unidade:</label>
                <input type="text" value={unidade} onChange={(e) => setUnidade(e.target.value)} className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-[#1351b4] hover:bg-[#0c3c88] text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center gap-1.5">
              Solicitar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// ForgotPasswordModal component function
// --------------------------------------------------------------------------------
export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, cpf })
      });
      const data = await res.json();
      setStatus(data.success ? "success" : "error");
      setMessage(data.message || data.error);
    } catch (err) {
      setStatus("error");
      setMessage("Erro ao conectar com o servidor.");
    }
  };

  if (status === "success") {
    return (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-normal">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">E-mail Enviado</h3>
          <p className="text-sm text-slate-600 mb-6">{message}</p>
          <button onClick={onClose} className="w-full bg-[#1351b4] text-white font-bold py-3 rounded-xl transition hover:bg-[#0c3c88]">OK</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-normal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 bg-slate-100 border-b border-slate-200 text-center">
          <h3 className="text-lg font-black tracking-tight text-slate-800">Recuperação de Senha</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status === "error" && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-bold leading-normal">
              ⚠️ {message}
            </div>
          )}
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">CPF Cadastrado:</label>
              <input type="text" value={cpf} onChange={(e) => setCpf(e.target.value)} required className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">E-mail Cadastrado:</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
            </div>
          </div>
          <div className="pt-3 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer">Cancelar</button>
            <button type="submit" disabled={status === "loading"} className="flex-1 py-2.5 bg-[#1351b4] hover:bg-[#0c3c88] disabled:opacity-50 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer">
              {status === "loading" ? "Processando..." : "Recuperar Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------
// ForcePasswordChangeModal component function
// --------------------------------------------------------------------------------
export function ForcePasswordChangeModal({ user, onSuccess }: { user: UserProfile; onSuccess: (user: UserProfile) => void }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("As novas senhas não coincidem.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, oldPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(user);
      } else {
        setStatus("error");
        setMessage(data.error || "Erro ao trocar a senha.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-normal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 bg-gradient-to-r from-rose-700 to-rose-900 text-white text-center flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-black tracking-tight">Troca Obrigatória de Senha</h3>
          <p className="text-[10px] text-rose-200">Por motivos de segurança, você precisa definir uma nova senha para continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status === "error" && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs font-bold leading-normal">
              ⚠️ {message}
            </div>
          )}
          <div className="space-y-3.5">
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Senha Atual / Provisória:</label>
              <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Nova Senha:</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Confirme a Nova Senha:</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-250 focus:border-[#003366] focus:outline-none py-2 px-3 rounded-xl text-xs font-medium text-slate-800 transition" />
            </div>
          </div>
          <div className="pt-3">
            <button type="submit" disabled={status === "loading"} className="w-full py-3 bg-[#1351b4] hover:bg-[#0c3c88] disabled:opacity-50 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer">
              {status === "loading" ? "Atualizando..." : "Atualizar e Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<"database" | "users">("users");
  
  // Database states
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [adminStatusMsg, setAdminStatusMsg] = useState<string | null>(null);
  const [isAdminExecuting, setIsAdminExecuting] = useState(false);

  // Users states
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [managingPermissionsFor, setManagingPermissionsFor] = useState<UserProfile | null>(null);
  const [tempModules, setTempModules] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenPermissions = (u: UserProfile) => {
    setManagingPermissionsFor(u);
    setTempModules(u.allowedModules || []);
  };

  const handleToggleModule = (mod: string) => {
    if (tempModules.includes(mod)) {
      setTempModules(tempModules.filter(m => m !== mod));
    } else {
      setTempModules([...tempModules, mod]);
    }
  };

  const handleSavePermissions = async () => {
    if (!managingPermissionsFor) return;
    setIsAdminExecuting(true);
    try {
      const isPending = managingPermissionsFor.status === "PENDING";
      const payload = {
        role: managingPermissionsFor.role || "Usuário",
        clearance: "PUBLIC",
        badgeText: tempModules.length > 0 ? tempModules.join(" | ") : "BÁSICO",
        allowedModules: tempModules
      };
      
      const endpoint = isPending
        ? `/api/admin/users/${managingPermissionsFor.id}/approve`
        : `/api/admin/users/${managingPermissionsFor.id}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAdminStatusMsg(isPending ? "Acesso aprovado e senha provisória gerada." : "Permissões atualizadas com sucesso.");
        setManagingPermissionsFor(null);
        fetchUsers();
      }
    } catch (err) {
      setAdminStatusMsg("Erro ao salvar permissões.");
    } finally {
      setIsAdminExecuting(false);
    }
  };

  const handleInactivateUser = async (id: string) => {
    setIsAdminExecuting(true);
    try {
      const res = await fetch(`/api/admin/users/${id}/inactivate`, {
        method: "POST"
      });
      if (res.ok) {
        setAdminStatusMsg("Usuário inativado.");
        fetchUsers();
      }
    } catch (err) {
      setAdminStatusMsg("Erro ao inativar usuário.");
    } finally {
      setIsAdminExecuting(false);
    }
  };

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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-850 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 font-bold">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight font-sans">
                Painel do Administrador (AECI)
              </h3>
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-mono font-extrabold block mt-0.5">
                Gestão de Acessos e Manutenção do Banco
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

        {/* Admin context metadata box & Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => { setActiveTab("users"); setAdminStatusMsg(""); }}
              className={`py-4 text-xs font-bold border-b-2 transition ${activeTab === "users" ? "border-[#1351b4] text-[#1351b4]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Gestão de Usuários
            </button>
            <button 
              onClick={() => { setActiveTab("database"); setAdminStatusMsg(""); }}
              className={`py-4 text-xs font-bold border-b-2 transition ${activeTab === "database" ? "border-[#1351b4] text-[#1351b4]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Manutenção de Base
            </button>
          </div>
          <div className="flex items-center gap-2 py-3 sm:py-0 text-xs text-amber-950 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sessão: <strong>{currentUser.name}</strong></span>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {adminStatusMsg && (
            <div className="mb-6 p-3.5 bg-blue-50 border border-blue-150 text-blue-800 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>{adminStatusMsg}</span>
              </div>
              <button onClick={() => setAdminStatusMsg(null)} className="text-blue-600 hover:text-[#003366] font-extrabold text-[10px] uppercase tracking-wide px-1.5 cursor-pointer">
                Fechar
              </button>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Controle de Acessos</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Aprove, bloqueie e gerencie perfis e permissões dos usuários do sistema.</p>
                </div>
                <button onClick={fetchUsers} className="text-xs text-[#1351b4] bg-blue-50 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer">
                  Atualizar
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center text-xs text-slate-500 py-8">Carregando usuários...</div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                        <th className="py-3 px-4">Nome / E-mail</th>
                        <th className="py-3 px-4">CPF</th>
                        <th className="py-3 px-4">Setor/Unidade</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="text-xs font-bold text-slate-800">{u.name}</div>
                            <div className="text-[10px] text-slate-500">{u.email}</div>
                          </td>
                          <td className="py-3 px-4 text-xs font-mono text-slate-600">{u.cpf || "-"}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{u.unidade || "-"}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${
                              u.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                              u.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {u.status === "PENDING" ? "Pendente" : u.status === "ACTIVE" ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {u.status === "PENDING" && (
                                <button 
                                  onClick={() => handleOpenPermissions(u)}
                                  disabled={isAdminExecuting}
                                  className="text-[10px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  Aprovar
                                </button>
                              )}
                              {u.status === "ACTIVE" && u.id !== currentUser.id && (
                                <>
                                  <button 
                                    onClick={() => handleOpenPermissions(u)}
                                    disabled={isAdminExecuting}
                                    className="text-[10px] font-bold bg-blue-100 text-[#1351b4] hover:bg-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    Acessos
                                  </button>
                                  <button 
                                    onClick={() => handleInactivateUser(u.id)}
                                    disabled={isAdminExecuting}
                                    className="text-[10px] font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    Bloquear
                                  </button>
                                </>
                              )}
                              {u.status === "INACTIVE" && (
                                <button 
                                  onClick={() => handleOpenPermissions(u)}
                                  disabled={isAdminExecuting}
                                  className="text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 px-3 py-1.5 rounded-lg transition cursor-pointer"
                                >
                                  Reativar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Gerenciamento de Permissões Modal */}
              {managingPermissionsFor && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                        <h4 className="font-black text-slate-800 text-sm">Gerenciar Acessos</h4>
                        <span className="text-[10px] text-slate-500">{managingPermissionsFor.name}</span>
                      </div>
                      <button onClick={() => setManagingPermissionsFor(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] text-slate-500 font-medium mb-2 uppercase tracking-widest">Módulos Permitidos</p>
                      {[
                        { id: "BI", label: "BI & IA Preditiva" },
                        { id: "TCU", label: "TCU (Controle Externo)" },
                        { id: "CGU", label: "CGU (Controle Interno)" },
                        { id: "ETHICS", label: "Comissão de Ética" },
                        { id: "ROL", label: "Rol de Responsáveis" },
                        { id: "SRTE", label: "Superintendências Regionais" }
                      ].map(mod => (
                        <label key={mod.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
                          <span className="text-xs font-bold text-slate-700">{mod.label}</span>
                          <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${tempModules.includes(mod.id) ? 'bg-[#1351b4]' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${tempModules.includes(mod.id) ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <input type="checkbox" className="sr-only" checked={tempModules.includes(mod.id)} onChange={() => handleToggleModule(mod.id)} />
                        </label>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                      <button onClick={() => setManagingPermissionsFor(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer">
                        Cancelar
                      </button>
                      <button onClick={handleSavePermissions} disabled={isAdminExecuting} className="px-4 py-2 text-xs font-bold bg-[#1351b4] text-white rounded-lg hover:bg-blue-800 transition shadow-sm cursor-pointer">
                        {managingPermissionsFor.status === "PENDING" ? "Aprovar Acesso" : "Salvar Permissões"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "database" && (
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
                      <button onClick={handleClearPre2022} disabled={isAdminExecuting} className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-lg text-[10px] cursor-pointer">Sim, Deletar</button>
                      <button onClick={() => setShowClearConfirm(false)} disabled={isAdminExecuting} className="flex-1 py-1 bg-white border border-slate-200 text-slate-605 font-bold rounded-lg text-[10px] cursor-pointer">Cancelar</button>
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
                    Zera integralmente todas as tabelas (acórdãos, comunicações, comissão de ética, rol de responsáveis) de volta aos dados de semente oficiais.
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
                      <button onClick={handleResetToFactory} disabled={isAdminExecuting} className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] cursor-pointer">Sim, Resetar Tudo</button>
                      <button onClick={() => setShowResetConfirm(false)} disabled={isAdminExecuting} className="flex-1 py-1 bg-white border border-slate-200 text-slate-605 font-bold rounded-lg text-[10px] cursor-pointer">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
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
