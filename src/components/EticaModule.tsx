/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  FileText,
  CheckCircle,
  Users,
  Calendar,
  Printer,
  Download,
  Scale,
  FileSignature,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  Eye,
  Clock,
  Check,
  PlusCircle,
  BarChart3,
  TrendingUp,
  Mail,
  UserCheck,
  UserX,
  AlertOctagon,
  FileSpreadsheet
} from "lucide-react";
import {
  ComissaoEticaDemand,
  EticaMembro,
  EticaReuniao,
  EticaAta,
  EticaProcesso,
  EticaConvidado
} from "../types";
import * as XLSX from "xlsx";

interface EticaModuleProps {
  etica: ComissaoEticaDemand[];
  onAddEtica: (newEtica: any) => Promise<boolean>;
  onUpdateEtica: (id: string, updated: any) => Promise<boolean>;
  onDeleteEtica: (id: string) => Promise<boolean>;

  // Newly structured props
  membrosEtica: EticaMembro[];
  reunioesEtica: EticaReuniao[];
  atasEtica: EticaAta[];
  processosEtica: EticaProcesso[];
  onAddEticaMembro: (newMembro: any) => Promise<boolean>;
  onUpdateEticaMembro: (id: string, updated: any) => Promise<boolean>;
  onDeleteEticaMembro: (id: string) => Promise<boolean>;
  onAddEticaReuniao: (newReuniao: any) => Promise<boolean>;
  onUpdateEticaReuniao: (id: string, updated: any) => Promise<boolean>;
  onDeleteEticaReuniao: (id: string) => Promise<boolean>;
  onNotifyEticaReuniao: (id: string, type: 'agendamento' | 'lembrete') => Promise<boolean>;
  onSaveEticaAta: (newAta: any) => Promise<boolean>;
  onAddEticaProcesso: (newProcesso: any) => Promise<boolean>;
  onUpdateEticaProcesso: (id: string, updated: any) => Promise<boolean>;
  onDeleteEticaProcesso: (id: string) => Promise<boolean>;
}

export default function EticaModule({
  etica,
  onAddEtica,
  onUpdateEtica,
  onDeleteEtica,
  membrosEtica,
  reunioesEtica,
  atasEtica,
  processosEtica,
  onAddEticaMembro,
  onUpdateEticaMembro,
  onDeleteEticaMembro,
  onAddEticaReuniao,
  onUpdateEticaReuniao,
  onDeleteEticaReuniao,
  onNotifyEticaReuniao,
  onSaveEticaAta,
  onAddEticaProcesso,
  onUpdateEticaProcesso,
  onDeleteEticaProcesso
}: EticaModuleProps) {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "membros" | "reunioes" | "atas" | "processos" | "bi">("dashboard");

  // Search & Filter states
  const [membroSearch, setMembroSearch] = useState("");
  const [membroStatusFilter, setMembroStatusFilter] = useState("TODOS"); // TODOS, ATIVOS, INATIVOS
  const [membroAtribFilter, setMembroAtribFilter] = useState("TODOS");

  const [reuniaoSearch, setReuniaoSearch] = useState("");
  const [processoSearch, setProcessoSearch] = useState("");
  const [processoTipoSubTab, setProcessoTipoSubTab] = useState<"SECI" | "Consulta" | "Ético">("SECI");
  const [processoSituacaoFilter, setProcessoSituacaoFilter] = useState("TODOS");

  // Modals showing states
  const [showAddMembroModal, setShowAddMembroModal] = useState(false);
  const [editingMembro, setEditingMembro] = useState<EticaMembro | null>(null);

  const [showAddReuniaoModal, setShowAddReuniaoModal] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<EticaReuniao | null>(null);
  const [meetingGuestsList, setMeetingGuestsList] = useState<EticaConvidado[]>([]);

  // Redigir Ata state
  const [activeAtaForm, setActiveAtaForm] = useState<{
    reuniaoId: string;
    relatos: string;
    decisoes: string;
    dataGeracao: string;
  } | null>(null);

  // Print Preview state
  const [printingAtaId, setPrintingAtaId] = useState<string | null>(null);

  // Process modal state
  const [showAddProcessoModal, setShowAddProcessoModal] = useState(false);
  const [editingProcesso, setEditingProcesso] = useState<EticaProcesso | null>(null);

  // Form Fields - Members
  const [mFormNome, setMFormNome] = useState("");
  const [mFormCPF, setMFormCPF] = useState("");
  const [mFormAtrib, setMFormAtrib] = useState<"Presidente" | "Membro" | "Secretária-Executiva">("Membro");
  const [mFormEncargo, setMFormEncargo] = useState<"Titular" | "Suplente">("Titular");
  const [mFormDispositivo, setMFormDispositivo] = useState("");
  const [mFormPub, setMFormPub] = useState("");
  const [mFormInicio, setMFormInicio] = useState("");
  const [mFormFim, setMFormFim] = useState("");
  const [mFormMandato, setMFormMandato] = useState("");
  const [mFormMatricula, setMFormMatricula] = useState("");
  const [mFormTel, setMFormTel] = useState("");
  const [mFormEmail, setMFormEmail] = useState("");

  // Form Fields - Reuniões
  const [rFormTipo, setRFormTipo] = useState<"Ordinária" | "Extraordinária">("Ordinária");
  const [rFormDataHora, setRFormDataHora] = useState("");
  const [rFormPauta, setRFormPauta] = useState("");
  // Guest Add line fields
  const [gFormNome, setGFormNome] = useState("");
  const [gFormEncargo, setGFormEncargo] = useState("");
  const [gFormEmail, setGFormEmail] = useState("");
  const [gFormTel, setGFormTel] = useState("");

  // Form Fields - Processos
  const [pFormTipo, setPFormTipo] = useState<"SECI" | "Consulta" | "Ético">("SECI");
  const [pFormSei, setPFormSei] = useState("");
  const [pFormDataInicio, setPFormDataInicio] = useState("");
  const [pFormDataFim, setPFormDataFim] = useState("");
  const [pFormResumo, setPFormResumo] = useState("");
  const [pFormResponsavel, setPFormResponsavel] = useState("");
  const [pFormSituacao, setPFormSituacao] = useState("Em Análise");
  const [pFormSolicitante, setPFormSolicitante] = useState("");
  const [pFormAssunto, setPFormAssunto] = useState("");

  // BI state
  const [biYearFilter, setBiYearFilter] = useState("2026");

  // Notifications display log
  const [notifLog, setNotifLog] = useState<{ id: string; text: string; time: string }[]>([]);

  // Helpers
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const maskCPF = (cpfStr?: string) => {
    if (!cpfStr) return "-";
    if (cpfStr.includes('*')) return cpfStr;
    const clean = cpfStr.replace(/\D/g, "");
    if (clean.length === 11) {
      return `***.***.${clean.substring(6, 9)}-${clean.substring(9)}`;
    }
    return cpfStr;
  };

  const addLog = (text: string) => {
    const now = new Date();
    setNotifLog(prev => [
      {
        id: "LOG-" + Date.now() + Math.random().toString(36).substr(2, 5),
        text,
        time: now.toLocaleTimeString("pt-BR")
      },
      ...prev
    ]);
  };

  // Timeline / Mandato Calculators
  const calculateMandateInfo = (membro: EticaMembro) => {
    if (!membro.dataInicioMandato || !membro.dataFimMandato) {
      return { elapsedDays: 0, totalDays: 1, remainingDays: 0, percent: 0, expired: false };
    }
    const start = new Date(membro.dataInicioMandato + "T00:00:00");
    const end = new Date(membro.dataFimMandato + "T23:59:59");
    const today = new Date();

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = today.getTime() - start.getTime();

    const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
    let elapsedDays = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));

    if (elapsedDays < 0) elapsedDays = 0;
    if (elapsedDays > totalDays) elapsedDays = totalDays;

    const remainingDays = totalDays - elapsedDays;
    const percent = parseFloat(((elapsedDays / totalDays) * 100).toFixed(1));
    const expired = today.getTime() > end.getTime();

    return {
      elapsedDays,
      totalDays,
      remainingDays,
      percent,
      expired
    };
  };

  // SECI SLA (20 days) calculator
  const calculateSeciSLA = (processo: EticaProcesso) => {
    if (processo.tipo !== "SECI" || !processo.dataInicio) {
      return { elapsedDays: 0, remainingDays: 20, alertLevel: "success", expired: false };
    }
    // Completed processes do not tick down SLA
    const isCompleted = ["Deferido", "Indeferido", "Concluído", "Arquivado"].includes(processo.situacao) || !!processo.dataFim;

    const start = new Date(processo.dataInicio + "T00:00:00");
    const today = processo.dataFim ? new Date(processo.dataFim + "T23:59:59") : new Date();

    const elapsedMs = today.getTime() - start.getTime();
    const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
    const remainingDays = 20 - elapsedDays;
    const expired = elapsedDays > 20;

    let alertLevel: "success" | "warning" | "danger" = "success";
    if (!isCompleted) {
      if (expired || remainingDays <= 3) {
        alertLevel = "danger";
      } else if (remainingDays <= 5) {
        alertLevel = "warning";
      }
    }

    return {
      elapsedDays,
      remainingDays,
      alertLevel,
      expired,
      isCompleted
    };
  };

  // Populate form with member for editing
  const openEditMembro = (membro: EticaMembro) => {
    setEditingMembro(membro);
    setMFormNome(membro.nome);
    setMFormCPF(membro.cpf);
    setMFormAtrib(membro.atribuicao);
    setMFormEncargo(membro.encargo);
    setMFormDispositivo(membro.dispositivoLegal);
    setMFormPub(membro.dataPublicacao || "");
    setMFormInicio(membro.dataInicioMandato || "");
    setMFormFim(membro.dataFimMandato || "");
    setMFormMandato(membro.mandato);
    setMFormMatricula(membro.matricula);
    setMFormTel(membro.telefone);
    setMFormEmail(membro.email);
    setShowAddMembroModal(true);
  };

  const handleSaveMembro = async () => {
    if (!mFormNome || !mFormCPF || !mFormEmail || !mFormDispositivo) {
      alert("Por favor, preencha os campos obrigatórios (Nome, CPF, E-mail, Portaria/Dispositivo e Datas).");
      return;
    }

    const data = {
      nome: mFormNome,
      cpf: mFormCPF,
      atribuicao: mFormAtrib,
      encargo: mFormEncargo,
      dispositivoLegal: mFormDispositivo,
      dataPublicacao: mFormPub || new Date().toISOString().split('T')[0],
      dataInicioMandato: mFormInicio || new Date().toISOString().split('T')[0],
      dataFimMandato: mFormFim,
      mandato: mFormMandato || "3 anos",
      matricula: mFormMatricula,
      telefone: mFormTel,
      email: mFormEmail
    };

    let success = false;
    if (editingMembro) {
      success = await onUpdateEticaMembro(editingMembro.id, data);
    } else {
      success = await onAddEticaMembro(data);
    }

    if (success) {
      setShowAddMembroModal(false);
      setEditingMembro(null);
      resetMembroForm();
      addLog(`Membro ${data.nome} ${editingMembro ? 'atualizado' : 'cadastrado'} com sucesso.`);
    } else {
      alert("Erro ao salvar cadastro do membro.");
    }
  };

  const resetMembroForm = () => {
    setMFormNome("");
    setMFormCPF("");
    setMFormAtrib("Membro");
    setMFormEncargo("Titular");
    setMFormDispositivo("");
    setMFormPub("");
    setMFormInicio("");
    setMFormFim("");
    setMFormMandato("");
    setMFormMatricula("");
    setMFormTel("");
    setMFormEmail("");
  };

  // Reuniões CRUD
  const openEditReuniao = (reu: EticaReuniao) => {
    setEditingReuniao(reu);
    setRFormTipo(reu.tipo);
    setRFormDataHora(reu.dataHora);
    setRFormPauta(reu.pauta);
    setMeetingGuestsList(reu.convidados || []);
    setShowAddReuniaoModal(true);
  };

  const handleSaveReuniao = async () => {
    if (!rFormDataHora || !rFormPauta) {
      alert("Por favor, informe a Data/Hora e os Assuntos da Pauta.");
      return;
    }

    const data = {
      tipo: rFormTipo,
      dataHora: rFormDataHora,
      pauta: rFormPauta,
      convidados: meetingGuestsList
    };

    let success = false;
    if (editingReuniao) {
      success = await onUpdateEticaReuniao(editingReuniao.id, data);
    } else {
      success = await onAddEticaReuniao(data);
    }

    if (success) {
      setShowAddReuniaoModal(false);
      setEditingReuniao(null);
      resetReuniaoForm();
      addLog(`Reunião ${rFormTipo} do dia ${formatDate(rFormDataHora.split('T')[0])} salva com sucesso.`);
    } else {
      alert("Erro ao agendar reunião.");
    }
  };

  const resetReuniaoForm = () => {
    setRFormTipo("Ordinária");
    setRFormDataHora("");
    setRFormPauta("");
    setMeetingGuestsList([]);
    setGFormNome("");
    setGFormEncargo("");
    setGFormEmail("");
    setGFormTel("");
  };

  const importActiveMembersToGuests = () => {
    const activeMembers = membrosEtica.filter(m => m.ativo);
    const mapped = activeMembers.map(m => ({
      nome: m.nome,
      encargo: `${m.atribuicao} (${m.encargo})`,
      email: m.email,
      telefone: m.telefone
    }));

    // Merge keeping unique emails
    setMeetingGuestsList(prev => {
      const existingEmails = new Set(prev.map(g => g.email));
      const filteredNew = mapped.filter(g => !existingEmails.has(g.email));
      return [...prev, ...filteredNew];
    });
    addLog(`${mapped.length} membros ativos da comissão importados para a pauta de convidados.`);
  };

  const addGuestToDraft = () => {
    if (!gFormNome || !gFormEmail) {
      alert("Informe pelo menos Nome e E-mail do convidado.");
      return;
    }
    const newGuest: EticaConvidado = {
      nome: gFormNome,
      encargo: gFormEncargo || "Convidado",
      email: gFormEmail,
      telefone: gFormTel
    };
    setMeetingGuestsList(prev => [...prev, newGuest]);
    setGFormNome("");
    setGFormEncargo("");
    setGFormEmail("");
    setGFormTel("");
  };

  const removeGuestFromDraft = (index: number) => {
    setMeetingGuestsList(prev => prev.filter((_, idx) => idx !== index));
  };

  const triggerNotification = async (reuniaoId: string, type: 'agendamento' | 'lembrete') => {
    const success = await onNotifyEticaReuniao(reuniaoId, type);
    if (success) {
      const r = reunioesEtica.find(x => x.id === reuniaoId);
      const title = type === 'agendamento' ? 'Agendamento Inicial' : 'Lembrete de Agenda';
      addLog(`[E-mail simulado] Convites de ${title} enviados para convidados da reunião ${r?.tipo} (${formatDate(r?.dataHora.split('T')[0])}).`);
      addLog(`[Resposta simulada] Recebida atualização de presenças de convidados no portal.`);
    } else {
      alert("Falha no simulador de disparo de notificações.");
    }
  };

  // Atas CRUD
  const startAtaRedactor = (reu: EticaReuniao) => {
    const existing = atasEtica.find(a => a.reuniaoId === reu.id);
    setActiveAtaForm({
      reuniaoId: reu.id,
      relatos: existing ? existing.relatos : "",
      decisoes: existing ? existing.decisoes : "",
      dataGeracao: existing ? existing.dataGeracao : new Date().toISOString().split('T')[0]
    });
    setActiveSubTab("atas");
  };

  const handleSaveAta = async () => {
    if (!activeAtaForm) return;
    if (!activeAtaForm.relatos || !activeAtaForm.decisoes) {
      alert("Redija o relato dos fatos e as deliberações oficiais antes de fechar a ata.");
      return;
    }

    const success = await onSaveEticaAta(activeAtaForm);
    if (success) {
      setActiveAtaForm(null);
      addLog(`Ata da reunião arquivada e registrada no Órbita.`);
    } else {
      alert("Falha ao salvar a ata.");
    }
  };

  // Processos CRUD
  const openEditProcesso = (proc: EticaProcesso) => {
    setEditingProcesso(proc);
    setPFormTipo(proc.tipo);
    setPFormSei(proc.processoSei);
    setPFormDataInicio(proc.dataInicio);
    setPFormDataFim(proc.dataFim || "");
    setPFormResumo(proc.resumo || "");
    setPFormResponsavel(proc.responsavel || "");
    setPFormSituacao(proc.situacao);
    setPFormSolicitante(proc.solicitante || "");
    setPFormAssunto(proc.assunto || "");
    setShowAddProcessoModal(true);
  };

  const handleSaveProcesso = async () => {
    if (!pFormSei || !pFormDataInicio) {
      alert("Preencha o Número SEI e a Data de Início.");
      return;
    }

    const data: any = {
      tipo: pFormTipo,
      processoSei: pFormSei,
      dataInicio: pFormDataInicio,
      situacao: pFormSituacao
    };

    if (pFormDataFim) data.dataFim = pFormDataFim;

    if (pFormTipo === "SECI") {
      data.resumo = pFormResumo;
      data.responsavel = pFormResponsavel;
    } else if (pFormTipo === "Consulta") {
      data.solicitante = pFormSolicitante;
      data.assunto = pFormAssunto;
    } else {
      // Etico
      // No extra fields required
    }

    let success = false;
    if (editingProcesso) {
      success = await onUpdateEticaProcesso(editingProcesso.id, data);
    } else {
      success = await onAddEticaProcesso(data);
    }

    if (success) {
      setShowAddProcessoModal(false);
      setEditingProcesso(null);
      resetProcessoForm();
      addLog(`Processo ${pFormTipo} nº ${data.processoSei} ${editingProcesso ? 'atualizado' : 'cadastrado'} com sucesso.`);
    } else {
      alert("Erro ao salvar processo.");
    }
  };

  const resetProcessoForm = () => {
    setPFormSei("");
    setPFormDataInicio("");
    setPFormDataFim("");
    setPFormResumo("");
    setPFormResponsavel("");
    setPFormSituacao("Em Análise");
    setPFormSolicitante("");
    setPFormAssunto("");
  };

  // SheetJS Excel native export
  const handleExportExcel = () => {
    try {
      // 1. Membros
      const sheetMembros = membrosEtica.map(m => {
        const calc = calculateMandateInfo(m);
        return {
          "ID": m.id,
          "Nome": m.nome,
          "CPF": maskCPF(m.cpf),
          "Matrícula": m.matricula,
          "Atribuição": m.atribuicao,
          "Encargo": m.encargo,
          "E-mail": m.email,
          "Telefone": m.telefone,
          "Dispositivo Legal": m.dispositivoLegal,
          "Publicação Portaria": formatDate(m.dataPublicacao),
          "Início Mandato": formatDate(m.dataInicioMandato),
          "Fim Mandato": formatDate(m.dataFimMandato),
          "Mandato": m.mandato,
          "Dias Decorridos": calc.elapsedDays,
          "Dias Restantes": calc.remainingDays,
          "Progresso Mandato %": calc.percent,
          "Status Mandato": calc.expired ? "Expirado" : "Regular",
          "Membro Ativo no Sistema": m.ativo ? "Sim" : "Inabilitado"
        };
      });

      // 2. Processos
      const sheetProcessos = processosEtica.map(p => {
        let extraInfo = {};
        let slaInfo = {};
        if (p.tipo === "SECI") {
          const sla = calculateSeciSLA(p);
          slaInfo = {
            "SLA Decorrido (Dias)": sla.elapsedDays,
            "SLA Restante (Dias)": sla.remainingDays,
            "SLA Status": sla.expired ? "Atrasado" : "Regular",
            "Relator Responsável": p.responsavel || ""
          };
          extraInfo = { "Resumo Fatos": p.resumo || "" };
        } else if (p.tipo === "Consulta") {
          extraInfo = {
            "Solicitante": p.solicitante || "",
            "Assunto": p.assunto || ""
          };
        }
        return {
          "ID": p.id,
          "Tipo": p.tipo,
          "Número SEI": p.processoSei,
          "Data Início": formatDate(p.dataInicio),
          "Data Conclusão": p.dataFim ? formatDate(p.dataFim) : "-",
          "Situação Atual": p.situacao,
          ...slaInfo,
          ...extraInfo,
          "Última Atualização": p.ultimaAtualizacao || "-"
        };
      });

      // 3. Reuniões
      const sheetReunioes = reunioesEtica.map(r => {
        const total = r.convidados?.length || 0;
        const confs = Object.values(r.confirmacoes || {});
        const confirmados = confs.filter(s => s === "Confirmado").length;
        const recusados = confs.filter(s => s === "Recusado").length;
        const pendentes = confs.filter(s => s === "Pendente").length;
        const hasAta = atasEtica.some(a => a.reuniaoId === r.id);

        return {
          "ID Reunião": r.id,
          "Tipo": r.tipo,
          "Data/Hora": r.dataHora.replace("T", " "),
          "Pauta da Reunião": r.pauta,
          "Convidados Cadastrados": total,
          "Presença Confirmada": confirmados,
          "Presença Recusada": recusados,
          "Pendente Resposta": pendentes,
          "Notificação Agendamento": r.notificadoAgendamento ? "Disparado" : "Pendente",
          "Notificação Lembrete": r.notificadoLembrete ? "Disparado" : "Pendente",
          "Ata Oficial Redigida": hasAta ? "Sim" : "Não"
        };
      });

      const wb = XLSX.utils.book_new();

      const wsMembros = XLSX.utils.json_to_sheet(sheetMembros);
      XLSX.utils.book_append_sheet(wb, wsMembros, "Membros da Comissão");

      const wsProcessos = XLSX.utils.json_to_sheet(sheetProcessos);
      XLSX.utils.book_append_sheet(wb, wsProcessos, "Processos");

      const wsReunioes = XLSX.utils.json_to_sheet(sheetReunioes);
      XLSX.utils.book_append_sheet(wb, wsReunioes, "Reuniões & Presenças");

      XLSX.writeFile(wb, `AECI_COMISSAO_ETICA_RELATORIO_${new Date().toISOString().split("T")[0]}.xlsx`);
      addLog("Planilha Excel compilada gerada para download com sucesso.");
    } catch (err) {
      console.error(err);
      alert("Ocorreu uma falha ao gerar a planilha Excel.");
    }
  };

  // Filter members list
  const filteredMembros = membrosEtica.filter(m => {
    const matchesSearch =
      m.nome.toLowerCase().includes(membroSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(membroSearch.toLowerCase()) ||
      m.dispositivoLegal.toLowerCase().includes(membroSearch.toLowerCase());

    const matchesStatus =
      membroStatusFilter === "TODOS" ||
      (membroStatusFilter === "ATIVOS" && m.ativo) ||
      (membroStatusFilter === "INATIVOS" && !m.ativo);

    const matchesAtrib =
      membroAtribFilter === "TODOS" || m.atribuicao === membroAtribFilter;

    return matchesSearch && matchesStatus && matchesAtrib;
  });

  // Filter meetings list
  const filteredReunioes = reunioesEtica.filter(r => {
    return r.pauta.toLowerCase().includes(reuniaoSearch.toLowerCase()) ||
      r.tipo.toLowerCase().includes(reuniaoSearch.toLowerCase()) ||
      r.dataHora.includes(reuniaoSearch);
  });

  // Filter processes list
  const filteredProcessos = processosEtica.filter(p => {
    const matchesTipo = p.tipo === processoTipoSubTab;
    const matchesSearch =
      p.processoSei.toLowerCase().includes(processoSearch.toLowerCase()) ||
      (p.responsavel && p.responsavel.toLowerCase().includes(processoSearch.toLowerCase())) ||
      (p.solicitante && p.solicitante.toLowerCase().includes(processoSearch.toLowerCase())) ||
      (p.resumo && p.resumo.toLowerCase().includes(processoSearch.toLowerCase()));

    const matchesSituacao =
      processoSituacaoFilter === "TODOS" || p.situacao === processoSituacaoFilter;

    return matchesTipo && matchesSearch && matchesSituacao;
  });

  // BI Metrics data calculations
  const seciCount = processosEtica.filter(p => p.tipo === "SECI").length;
  const seciDeferidos = processosEtica.filter(p => p.tipo === "SECI" && p.situacao === "Deferido").length;
  const seciIndeferidos = processosEtica.filter(p => p.tipo === "SECI" && p.situacao === "Indeferido").length;
  const seciAnalise = processosEtica.filter(p => p.tipo === "SECI" && p.situacao === "Em Análise").length;

  const consultasCount = processosEtica.filter(p => p.tipo === "Consulta").length;
  const consultasRespondidas = processosEtica.filter(p => p.tipo === "Consulta" && p.situacao === "Respondida").length;
  const consultasPendente = processosEtica.filter(p => p.tipo === "Consulta" && p.situacao !== "Respondida").length;

  const eticosCount = processosEtica.filter(p => p.tipo === "Ético").length;
  const eticosAtivos = processosEtica.filter(p => p.tipo === "Ético" && p.situacao === "Em Andamento").length;
  const eticosArquivados = processosEtica.filter(p => p.tipo === "Ético" && p.situacao === "Arquivado").length;

  const totalMembrosAtivos = membrosEtica.filter(m => m.ativo).length;
  const totalMembrosInativos = membrosEtica.filter(m => !m.ativo).length;

  // Find SECIs with SLA < 5 days or expired
  const criticalSeis = processosEtica.filter(p => {
    if (p.tipo !== "SECI") return false;
    const sla = calculateSeciSLA(p);
    return !sla.isCompleted && (sla.expired || sla.remainingDays <= 5);
  });

  // Sub-tabs list helper
  const tabs = [
    { id: "dashboard", label: "Dashboard & Visão Geral", desc: "Indicadores e Alertas de SLA", icon: BarChart3 },
    { id: "membros", label: "Gestão de Membros", desc: "Membros Ativos e Mandatos", icon: Users },
    { id: "reunioes", label: "Agenda & Presença", desc: "Reuniões, Pautas e Presenças", icon: Calendar },
    { id: "atas", label: "Atas Oficiais", desc: "Atas da Comissão e Deliberações", icon: FileSignature },
    { id: "processos", label: "Controle de Processos", desc: "Demandas e Processos SECI", icon: Scale },
    { id: "bi", label: "BI e Relatórios", desc: "Relatórios e Analytics da Ética", icon: TrendingUp }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Module Title Header - NOW STICKY */}
      <div className="sticky top-0 z-40 bg-slate-100 pt-6 pb-4 -mx-6 px-6 mb-4 rounded-b-xl border-b border-slate-200/50 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#003366] to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white shrink-0">
                <ShieldAlert size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Comissão de Ética — ÉTICA</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Gerenciamento ágil de membros, mandatos, reuniões de pauta, atas oficiais e SLAs de conduta pública</p>
              </div>
            </div>
          </div>
        </div>

      {/* 2. Sub Navigation Tabs */}
      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
                setActiveAtaForm(null); // Clear active redactor when switching tabs
              }}
              className={`flex-1 min-w-[150px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${isActive
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
      </div>

      {/* 3. SUB TAB CONTENT VIEWPORT */}

      {/* --- DASHBOARD TAB --- */}
      {activeSubTab === "dashboard" && (
        <div className="no-print space-y-6 animate-fade-in">
          {/* Top Bento Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Membros Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Composição do Colegiado</span>
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 font-display mt-2">{totalMembrosAtivos}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Membros ativos em mandato portariado.</p>
              </div>
              <div className="border-t border-slate-100 pt-2.5 mt-3 flex justify-between text-[10px] text-slate-500">
                <span>Presidente + Executiva</span>
                <span className="font-bold text-slate-700">2 Cargos</span>
              </div>
            </div>

            {/* Reuniões Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Agenda de Colegiados</span>
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 font-display mt-2">
                  {reunioesEtica.filter(r => new Date(r.dataHora) >= new Date()).length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Reuniões agendadas/próximas no mês.</p>
              </div>
              <div className="border-t border-slate-100 pt-2.5 mt-3 flex justify-between text-[10px] text-slate-500">
                <span>Próxima em:</span>
                <span className="font-bold text-slate-700">
                  {reunioesEtica.length > 0
                    ? formatDate(reunioesEtica[0].dataHora.split('T')[0])
                    : "Sem agendamentos"
                  }
                </span>
              </div>
            </div>

            {/* SECI SLA Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Critério SLA SECI</span>
                  <Clock className="w-5 h-5 text-rose-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 font-display mt-2">
                  {criticalSeis.length}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Processos SECI com prazo &lt; 5 dias ou atrasados.</p>
              </div>
              <div className="border-t border-slate-100 pt-2.5 mt-3 flex justify-between text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                <span>Atraso/Crítico pendente</span>
                <span className="animate-pulse">Alerta Ativo</span>
              </div>
            </div>

            {/* Éticos Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Processos Éticos Ativos</span>
                  <Scale className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 font-display mt-2">{eticosAtivos}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Representações éticas em andamento.</p>
              </div>
              <div className="border-t border-slate-100 pt-2.5 mt-3 flex justify-between text-[10px] text-slate-500">
                <span>Concluídos / Arquivados:</span>
                <span className="font-bold text-slate-700">{eticosArquivados} casos</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Critical SLA SECI processes block */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
              <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                Alertas de SLA / Prazos de Análise Críticos (20 dias corridos)
              </h4>

              <div className="space-y-3">
                {criticalSeis.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-xl">
                    Nenhum processo SECI possui SLA estourado ou crítico no momento. Operação regular.
                  </div>
                ) : (
                  criticalSeis.map(p => {
                    const sla = calculateSeciSLA(p);
                    return (
                      <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between text-xs transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded text-[10px]">
                              {p.processoSei}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Início: {formatDate(p.dataInicio)}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-1 max-w-md font-medium">{p.resumo}</p>
                          <p className="text-[10px] text-slate-400">Responsável: <span className="font-bold">{p.responsavel}</span></p>
                        </div>
                        <div className="flex items-center gap-3">
                          {sla.expired ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[9px] uppercase tracking-wider animate-pulse flex items-center gap-1 border border-red-200">
                              <AlertTriangle className="w-3 h-3" /> Excedido {-sla.remainingDays} dias
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 font-bold rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                              Crítico ({sla.remainingDays}d restantes)
                            </span>
                          )}
                          <a
                            href="https://processoeletronico.trabalho.gov.br"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-200/80 hover:bg-slate-300 rounded-lg text-slate-600 transition"
                            title="Abrir no SEI"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Activity Logs & Simulations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col">
              <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-amber-500" />
                Simulador de Correio & Logs
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                Atividades de envio de convites e respostas simuladas em tempo de demonstração.
              </p>

              <div className="flex-1 bg-slate-955 bg-slate-50 border rounded-xl p-3 h-64 overflow-y-auto font-mono text-[10px] text-slate-600 space-y-2">
                {notifLog.length === 0 ? (
                  <div className="text-slate-400 text-center py-20 italic">
                    Sem registros de disparos de e-mail na sessão ativa.
                  </div>
                ) : (
                  notifLog.map(log => (
                    <div key={log.id} className="pb-1.5 border-b border-slate-200/50">
                      <span className="text-[9px] text-amber-600 font-bold">[{log.time}]</span> {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MEMBROS SUB TAB --- */}
      {activeSubTab === "membros" && (
        <div className="no-print space-y-6 animate-fade-in">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">

            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="txt-search-membros-etica"
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                placeholder="Pesquisar por Nome, Portaria ou E-mail..."
                value={membroSearch}
                onChange={(e) => setMembroSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-4 items-center text-xs text-slate-600 w-full md:w-auto md:justify-end">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Atribuição:</span>
                <select
                  className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs focus:outline-hidden"
                  value={membroAtribFilter}
                  onChange={(e) => setMembroAtribFilter(e.target.value)}
                >
                  <option value="TODOS">Todos</option>
                  <option value="Presidente">Presidente</option>
                  <option value="Membro">Membro</option>
                  <option value="Secretária-Executiva">Secretária-Executiva</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Situação:</span>
                <select
                  className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs focus:outline-hidden"
                  value={membroStatusFilter}
                  onChange={(e) => setMembroStatusFilter(e.target.value)}
                >
                  <option value="TODOS">Todos (Ativos/Inativos)</option>
                  <option value="ATIVOS">Apenas Ativos</option>
                  <option value="INATIVOS">Apenas Inativos</option>
                </select>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-1">
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-700 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
                  title="Exportar todos os dados da Ética para Excel"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Dados
                </button>

                <button
                  onClick={() => {
                    resetMembroForm();
                    setEditingMembro(null);
                    setShowAddMembroModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Cadastrar Membro
                </button>
              </div>
            </div>
          </div>

          {/* Bento-style members cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMembros.length === 0 ? (
              <div className="md:col-span-2 text-center py-16 bg-white border border-dashed rounded-2xl text-slate-400 text-xs">
                Nenhum membro da comissão localizado com os filtros selecionados.
              </div>
            ) : (
              filteredMembros.map(membro => {
                const calc = calculateMandateInfo(membro);
                return (
                  <div
                    key={membro.id}
                    className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs ${!membro.ativo
                      ? "border-slate-100 bg-slate-50 opacity-60"
                      : calc.expired
                        ? "border-rose-300 hover:border-rose-400"
                        : "border-slate-200 hover:border-amber-300"
                      }`}
                  >
                    <div>
                      {/* Card Header metadata */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono tracking-wide ${membro.atribuicao === "Presidente"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : membro.atribuicao === "Secretária-Executiva"
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                            }`}>
                            {membro.atribuicao}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold font-mono">
                            {membro.encargo}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {calc.expired && membro.ativo && (
                            <span className="px-2 py-0.5 bg-rose-100 border border-rose-200 text-rose-700 text-[9px] font-bold rounded-full flex items-center gap-1 animate-pulse">
                              <AlertCircle className="w-2.5 h-2.5" /> Mandato Vencido
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${membro.ativo ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-200 text-slate-500"
                            }`}>
                            {membro.ativo ? "Ativo" : "Inabilitado"}
                          </span>
                        </div>
                      </div>

                      {/* Member Info Block */}
                      <div className="flex gap-4">
                        {/* Avatar placeholder with initials */}
                        <div className="w-12 h-12 bg-slate-100 border border-slate-250 flex items-center justify-center rounded-xl text-slate-500 font-bold font-display text-sm shrink-0">
                          {membro.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="space-y-1 w-full min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 leading-tight truncate">{membro.nome}</h4>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500">
                            <span className="truncate">CPF: <span className="font-semibold">{maskCPF(membro.cpf)}</span></span>
                            <span className="truncate">SIAPE: <span className="font-semibold">{membro.matricula || "-"}</span></span>
                            <span className="truncate col-span-2">E-mail: <span className="font-semibold text-slate-700 truncate">{membro.email}</span></span>
                            <span className="truncate col-span-2">Tel: <span className="font-semibold text-slate-700">{membro.telefone || "-"}</span></span>
                          </div>
                        </div>
                      </div>

                      {/* Portaria/Ato designação */}
                      <div className="mt-3.5 bg-slate-50 border border-slate-150 p-2.5 rounded-xl text-[11px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Instrumento Legal de Designação</span>
                        <p className="font-semibold text-slate-700 mt-0.5">{membro.dispositivoLegal}</p>
                        <div className="flex justify-between mt-1 text-slate-400 text-[10px]">
                          <span>Publicação: {formatDate(membro.dataPublicacao)}</span>
                          <span>Período: {membro.mandato}</span>
                        </div>
                      </div>

                      {/* Mandate Timeline Progress Bar */}
                      {membro.ativo && (
                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="font-medium text-slate-500">Decurso de Mandato:</span>
                            <span className={`font-bold ${calc.expired ? "text-rose-600" : "text-slate-700"}`}>
                              {calc.percent}% decorrido
                            </span>
                          </div>

                          <div className="w-full bg-slate-100 border border-slate-200 h-2.5 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full transition-all ${calc.expired ? "bg-rose-500" : calc.percent > 85 ? "bg-amber-500" : "bg-blue-600"
                                }`}
                              style={{ width: `${calc.percent}%` }}
                            />
                          </div>

                          <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-medium">
                            <span>Início: {formatDate(membro.dataInicioMandato)}</span>
                            {calc.expired ? (
                              <span className="text-rose-600 font-bold">Vencido há {calc.elapsedDays - calc.totalDays} dias</span>
                            ) : (
                              <span>{calc.remainingDays} dias restantes (Fim: {formatDate(membro.dataFimMandato)})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 text-[11px]">
                      <span className="text-slate-400 font-mono text-[9px]">ID: {membro.id}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditMembro(membro)}
                          className="p-1 px-2.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg inline-flex items-center gap-1 font-bold text-[10px] transition"
                        >
                          <Edit3 className="w-3 h-3 text-indigo-500" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            const action = membro.ativo ? "inabilitar" : "habilitar";
                            if (window.confirm(`Deseja realmente ${action} o membro ${membro.nome}?`)) {
                              onDeleteEticaMembro(membro.id);
                              addLog(`Solicitada alteração de status do membro ${membro.nome} para ${membro.ativo ? 'Inativo' : 'Ativo'}.`);
                            }
                          }}
                          className={`p-1 px-2.5 rounded-lg border font-bold text-[10px] inline-flex items-center gap-1 transition ${membro.ativo
                            ? "border-rose-100 text-rose-600 hover:bg-rose-50"
                            : "border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                            }`}
                        >
                          {membro.ativo ? (
                            <>
                              <UserX className="w-3.5 h-3.5" /> Inabilitar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5" /> Habilitar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- AGENDA & REUNIOES SUB TAB --- */}
      {activeSubTab === "reunioes" && (
        <div className="no-print space-y-6 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">

            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                placeholder="Pesquisar por pautas da comissão..."
                value={reuniaoSearch}
                onChange={(e) => setReuniaoSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-700 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
                title="Exportar todos os dados da Ética para Excel"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Dados
              </button>

              <button
                onClick={() => {
                  resetReuniaoForm();
                  setEditingReuniao(null);
                  setShowAddReuniaoModal(true);
                }}
                className="px-3.5 py-1.5 bg-[#003366] text-white hover:bg-[#002244] font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Agendar Nova Reunião
              </button>
            </div>
          </div>

          {/* List of Meetings */}
          <div className="space-y-4">
            {filteredReunioes.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed rounded-2xl text-slate-400 text-xs">
                Nenhuma reunião cadastrada ou agendada.
              </div>
            ) : (
              filteredReunioes.map(r => {
                const meetingDate = r.dataHora.split('T')[0];
                const meetingTime = r.dataHora.split('T')[1];
                const hasAta = atasEtica.some(a => a.reuniaoId === r.id);

                const confs = Object.values(r.confirmacoes || {});
                const totalConv = r.convidados?.length || 0;
                const confirmados = confs.filter(s => s === "Confirmado").length;
                const recusados = confs.filter(s => s === "Recusado").length;
                const pendentes = confs.filter(s => s === "Pendente").length;

                return (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-350 transition flex flex-col md:flex-row gap-5 justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Title / Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${r.tipo === "Ordinária"
                          ? "bg-slate-100 text-slate-800 border-slate-200"
                          : "bg-amber-100 text-amber-800 border-amber-250 animate-pulse"
                          }`}>
                          Reunião {r.tipo}
                        </span>

                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(meetingDate)} às {meetingTime}
                        </span>

                        {hasAta && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-bold rounded-lg inline-flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Ata Oficial Concluída
                          </span>
                        )}
                      </div>

                      {/* Pauta */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assuntos da Pauta (Ordem do Dia)</span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-3xl">
                          {r.pauta}
                        </p>
                      </div>

                      {/* Guests & Attendance Tracker */}
                      <div className="border-t border-slate-100 pt-3 mt-3">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Lista de Confirmação de Presença ({confirmados} Confirmados, {recusados} Recusados, {pendentes} Pendentes)
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {r.convidados?.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">Nenhum convidado adicionado à reunião.</span>
                          ) : (
                            r.convidados.map((conv, idx) => {
                              const status = r.confirmacoes[conv.email] || "Pendente";
                              return (
                                <div
                                  key={idx}
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-medium border flex items-center gap-1.5 ${status === "Confirmado"
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                                    : status === "Recusado"
                                      ? "bg-rose-50/70 border-rose-200 text-rose-800"
                                      : "bg-slate-50 border-slate-200 text-slate-600"
                                    }`}
                                  title={`${conv.email} | ${conv.telefone}`}
                                >
                                  <span className="font-bold">{conv.nome}</span>
                                  <span className="text-[9px] opacity-70">({conv.encargo})</span>
                                  <span className={`w-1.5 h-1.5 rounded-full ${status === "Confirmado"
                                    ? "bg-emerald-500"
                                    : status === "Recusado"
                                      ? "bg-rose-500"
                                      : "bg-slate-400"
                                    }`} />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operations box */}
                    <div className="flex flex-col justify-between md:items-end gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 shrink-0 md:w-52">
                      <div className="space-y-1.5 w-full">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block md:text-right">Notificações e Disparos</span>

                        <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
                          <button
                            onClick={() => triggerNotification(r.id, 'agendamento')}
                            className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 ${r.notificadoAgendamento
                              ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-700 hover:bg-amber-500/20"
                              }`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {r.notificadoAgendamento ? "Reenviar Convite" : "Disparar Convite"}
                          </button>

                          <button
                            onClick={() => triggerNotification(r.id, 'lembrete')}
                            className="w-full px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition flex items-center justify-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Disparar Lembrete
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap md:flex-col gap-2 w-full">
                        <button
                          onClick={() => startAtaRedactor(r)}
                          className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                        >
                          <FileSignature className="w-3.5 h-3.5" />
                          {hasAta ? "Editar Ata" : "Redigir Ata"}
                        </button>

                        <div className="flex gap-1.5 w-full">
                          <button
                            onClick={() => openEditReuniao(r)}
                            className="flex-1 py-1.5 border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-[10px] transition"
                          >
                            Editar
                          </button>

                          <button
                            onClick={async () => {
                              if (window.confirm("Excluir agendamento permanentemente do sistema?")) {
                                const success = await onDeleteEticaReuniao(r.id);
                                if (success) {
                                  addLog(`Reunião ${r.id} excluída do banco de dados.`);
                                }
                              }
                            }}
                            className="p-1.5 px-2.5 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- ATAS TAB --- */}
      {activeSubTab === "atas" && (
        <div className="no-print space-y-6 animate-fade-in">
          {/* Active Redactor section if a meeting was selected */}
          {activeAtaForm ? (
            <div className="bg-white border border-slate-250 rounded-2xl shadow-sm p-6 space-y-5">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Redator Oficial de Atas</span>
                  <h3 className="text-base font-bold text-slate-900">
                    Redigir Ata: Reunião {reunioesEtica.find(x => x.id === activeAtaForm.reuniaoId)?.tipo} - {formatDate(reunioesEtica.find(x => x.id === activeAtaForm.reuniaoId)?.dataHora.split('T')[0])}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveAtaForm(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg bg-slate-50 border transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Data da Geração Oficial:</label>
                    <input
                      type="date"
                      className="w-full bg-slate-50 border p-2 text-xs rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      value={activeAtaForm.dataGeracao}
                      onChange={e => setActiveAtaForm(prev => prev ? ({ ...prev, dataGeracao: e.target.value }) : null)}
                    />
                  </div>
                  <div className="flex items-end text-xs text-slate-400">
                    <span>* A ata listará automaticamente os convidados marcados como "Confirmado" para fins de assinaturas.</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">1. Relato dos Fatos e Discussões Realizadas:</label>
                  <textarea
                    className="w-full h-40 bg-slate-50 border p-3 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    placeholder="Insira a transcrição sintética dos fatos expostos, discussões da mesa, manifestações de relatores..."
                    value={activeAtaForm.relatos}
                    onChange={e => setActiveAtaForm(prev => prev ? ({ ...prev, relatos: e.target.value }) : null)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">2. Decisões, Votos Proferidos e Encaminhamentos:</label>
                  <textarea
                    className="w-full h-32 bg-slate-50 border p-3 text-xs rounded-lg focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    placeholder="Detalhamento das deliberações oficiais, homologação de consultas, instauração de representações e encaminhamentos..."
                    value={activeAtaForm.decisoes}
                    onChange={e => setActiveAtaForm(prev => prev ? ({ ...prev, decisoes: e.target.value }) : null)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  onClick={() => setActiveAtaForm(null)}
                  className="px-4 py-2 border rounded-lg text-xs font-bold hover:bg-slate-50 transition text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAta}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  Homologar e Salvar Ata
                </button>
              </div>
            </div>
          ) : (
            /* Meeting list for Atas */
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">Registrar/Gerar Documento de Ata de Reuniões</h3>

              <div className="grid grid-cols-1 gap-3">
                {reunioesEtica.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed rounded-2xl text-slate-400 text-xs">
                    Nenhuma reunião disponível no histórico para redigir ata.
                  </div>
                ) : (
                  reunioesEtica.map(r => {
                    const ata = atasEtica.find(a => a.reuniaoId === r.id);
                    return (
                      <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs hover:border-slate-300 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 font-display">
                              Reunião {r.tipo} - {formatDate(r.dataHora.split('T')[0])}
                            </span>
                            {ata ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-150 rounded-lg text-[9px] font-bold">
                                Ata Registrada
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[9px] font-bold">
                                Sem Ata Oficial
                              </span>
                            )}
                          </div>
                          <p className="text-slate-500 line-clamp-1 max-w-xl">{r.pauta}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => startAtaRedactor(r)}
                            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 font-bold rounded-lg text-[10px] text-slate-700 flex items-center gap-1 transition"
                          >
                            <FileSignature className="w-3.5 h-3.5 text-indigo-500" />
                            {ata ? "Editar Redação" : "Redigir Ata"}
                          </button>

                          {ata && (
                            <button
                              onClick={() => setPrintingAtaId(ata.reuniaoId)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 transition shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Visualizar PDF
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- PROCESSOS TAB (SECI / CONSULTAS / ETICOS) --- */}
      {activeSubTab === "processos" && (
        <div className="no-print space-y-6 animate-fade-in">
          {/* Sub Navbar for Process types */}
          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
            <div className="flex gap-1">
              {(["SECI", "Consulta", "Ético"] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => {
                    setProcessoTipoSubTab(tipo);
                    setProcessoSituacaoFilter("TODOS");
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${processoTipoSubTab === tipo
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {tipo === "SECI" ? "SECI (Conflito de Interesses)" : tipo === "Consulta" ? "Consultas Técnicas" : "Processos Éticos"}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                resetProcessoForm();
                setPFormTipo(processoTipoSubTab);
                setEditingProcesso(null);
                setShowAddProcessoModal(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Cadastrar Processo
            </button>
          </div>

          {/* Filtering row */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden"
                placeholder="Pesquisar processos por número SEI, assunto ou envolvidos..."
                value={processoSearch}
                onChange={e => setProcessoSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Situação:</span>
              <select
                className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs focus:outline-hidden"
                value={processoSituacaoFilter}
                onChange={e => setProcessoSituacaoFilter(e.target.value)}
              >
                <option value="TODOS">Todos os status</option>
                {processoTipoSubTab === "SECI" && (
                  <>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Deferido">Deferidos (Aprovados)</option>
                    <option value="Indeferido">Indeferidos (Rejeitados)</option>
                  </>
                )}
                {processoTipoSubTab === "Consulta" && (
                  <>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Respondida">Respondidas</option>
                  </>
                )}
                {processoTipoSubTab === "Ético" && (
                  <>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Arquivado">Arquivados</option>
                    <option value="Suspenso">Suspenso</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Processes Grid or Table depending on subtab */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-sm text-slate-800">
              <thead className="bg-[#003366] text-white font-semibold text-sm border-b border-[#002244] sticky top-0 z-10">
            <tr className="font-semibold backdrop-blur-sm border-b border-[#002244]">
                  <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">Processo SEI</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">Início</th>
                  {processoTipoSubTab === "SECI" && <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">SLA (20 dias)</th>}
                  {processoTipoSubTab === "Consulta" && <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">Solicitante</th>}
                  <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">
                    {processoTipoSubTab === "SECI" ? "Responsável/Relator" : "Assunto / Resumo"}
                  </th>
                  <th className="p-4 font-semibold hover:bg-[#002244] transition-colors cursor-pointer hover: transition-colors">Situação</th>
                  <th className="p-4 font-semibold hover:bg-[#002244] transition-colors">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredProcessos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 text-xs italic">
                      Nenhum processo localizado para os filtros informados.
                    </td>
                  </tr>
                ) : (
                  filteredProcessos.map(p => {
                    const sla = calculateSeciSLA(p);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 align-middle">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {p.processoSei}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-slate-500 font-mono">
                          {formatDate(p.dataInicio)}
                        </td>

                        {/* SECI SLA Column */}
                        {processoTipoSubTab === "SECI" && (
                          <td className="p-4 align-middle">
                            {sla.isCompleted ? (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-bold border">
                                Concluído
                              </span>
                            ) : sla.expired ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-[9px] font-extrabold animate-pulse border border-red-200 uppercase tracking-wide">
                                Atrasado ({-sla.remainingDays}d)
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${sla.alertLevel === "danger"
                                ? "bg-red-50 text-red-700 border-red-150 animate-pulse"
                                : sla.alertLevel === "warning"
                                  ? "bg-amber-50 text-amber-700 border-amber-150"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-150"
                                }`}>
                                {sla.remainingDays} dias restantes
                              </span>
                            )}
                          </td>
                        )}

                        {/* Consultas Solicitante Column */}
                        {processoTipoSubTab === "Consulta" && (
                          <td className="p-4 align-middle text-slate-700 font-semibold truncate max-w-[200px]">
                            {p.solicitante || "-"}
                          </td>
                        )}

                        {/* Dynamic Description / Relator Column */}
                        <td className="p-4 align-middle max-w-[320px] truncate text-slate-600">
                          {p.tipo === "SECI" ? (
                            <span className="font-bold text-slate-800">{p.responsavel || "Não designado"}</span>
                          ) : (
                            <span>{p.assunto || p.resumo || "-"}</span>
                          )}
                        </td>

                        {/* Situação status */}
                        <td className="p-4 align-middle px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${p.situacao === "Deferido" || p.situacao === "Respondida" || p.situacao === "Arquivado"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-250"
                            : p.situacao === "Indeferido"
                              ? "bg-red-100 text-red-800 border border-red-250"
                              : "bg-amber-100 text-amber-800 border border-amber-250"
                            }`}>
                            {p.situacao}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="p-4 align-middle px-4 py-3.5 text-center">
                          <div className="flex justify-center gap-1.5">
                            <a
                              href="https://processoeletronico.trabalho.gov.br"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-lg font-bold text-[10px] inline-flex items-center gap-1 transition"
                            >
                              <ExternalLink className="w-3 h-3" /> SEI
                            </a>

                            <button
                              onClick={() => openEditProcesso(p)}
                              className="p-1 hover:bg-slate-150 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                            </button>

                            <button
                              onClick={async () => {
                                if (window.confirm("Remover este processo do Órbita definitivamente?")) {
                                  const success = await onDeleteEticaProcesso(p.id);
                                  if (success) {
                                    addLog(`Processo ${p.processoSei} excluído.`);
                                  }
                                }
                              }}
                              className="p-1 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
      )}

      {/* --- BI E RELATORIOS TAB --- */}
      {activeSubTab === "bi" && (
        <div className="no-print space-y-6 animate-fade-in">
          {/* Top BI Header controls */}
          <div className="bg-white rounded-2xl border border-slate-250 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">BI Consolidado – Comissão de Ética</h3>
              <p className="text-[11px] text-slate-500">Métricas analíticas do colegiado de integridade pública do MTE.</p>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span>Filtrar Ano:</span>
                <select
                  className="bg-slate-100 border p-1.5 rounded-lg text-xs font-bold"
                  value={biYearFilter}
                  onChange={e => setBiYearFilter(e.target.value)}
                >
                  <option value="TODOS">Todos os anos</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <button
                onClick={handleExportExcel}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-4 h-4" /> Exportar Planilha Relatório (.xlsx)
              </button>
            </div>
          </div>

          {/* Analytical Charts and Meters Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chart 1: SECI Conflito de Interesses */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demandas SECI (Conflito de Interesse)</span>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-800 font-display">{seciCount}</span>
                <span className="text-xs text-slate-400 font-medium">Casos cadastrados</span>
              </div>

              {/* Pure CSS Stacked Percentage Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-150 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${seciCount > 0 ? (seciDeferidos / seciCount) * 100 : 0}%` }}
                    title={`Deferidos: ${seciDeferidos}`}
                  />
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${seciCount > 0 ? (seciIndeferidos / seciCount) * 100 : 0}%` }}
                    title={`Indeferidos: ${seciIndeferidos}`}
                  />
                  <div
                    className="h-full bg-amber-500 animate-pulse"
                    style={{ width: `${seciCount > 0 ? (seciAnalise / seciCount) * 100 : 0}%` }}
                    title={`Em Análise: ${seciAnalise}`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1 justify-start">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Def: {seciDeferidos}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span>Ind: {seciIndeferidos}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span>Anál: {seciAnalise}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Consultas Respondidas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultas Técnicas e Pareceres</span>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-800 font-display">{consultasCount}</span>
                <span className="text-xs text-slate-400 font-medium">Consultas autuadas</span>
              </div>

              {/* Progress completion bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Índice de Resposta:</span>
                  <span className="font-bold">
                    {consultasCount > 0 ? ((consultasRespondidas / consultasCount) * 100).toFixed(0) : 0}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{ width: `${consultasCount > 0 ? (consultasRespondidas / consultasCount) * 100 : 0}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 pt-1">
                  <span>Respondidas: {consultasRespondidas}</span>
                  <span>Em Análise: {consultasPendente}</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Processos Éticos */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Processos Éticos Disciplinares</span>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-slate-800 font-display">{eticosCount}</span>
                <span className="text-xs text-slate-400 font-medium">Protocolos autuados</span>
              </div>

              {/* Radial or pure SVG representation indicator */}
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-normal uppercase">Ativos</span>
                  <span className="text-base font-bold text-amber-600">{eticosAtivos}</span>
                </div>
                <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[9px] text-slate-400 block font-normal uppercase">Arquivados</span>
                  <span className="text-base font-bold text-slate-500">{eticosArquivados}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* --- ADD/EDIT MEMBER DIALOG --- */}
      {showAddMembroModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-250 overflow-hidden flex flex-col shadow-2xl">

            <div className="bg-[#003366] px-5 py-4 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                {editingMembro ? "Editar Cadastro de Membro" : "Cadastrar Membro na Comissão"}
              </h3>
              <button
                onClick={() => {
                  setShowAddMembroModal(false);
                  setEditingMembro(null);
                }}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-slate-800 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold block mb-1">Nome Completo (Obrigatorio):</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                    placeholder="Ex: Alessandro Barbosa Lourenço"
                    value={mFormNome}
                    onChange={e => setMFormNome(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1">CPF (Obrigatorio):</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    placeholder="Ex: 000.000.000-00"
                    value={mFormCPF}
                    onChange={e => setMFormCPF(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Matrícula SIAPE/MTE:</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    placeholder="Ex: AECI-8409-G"
                    value={mFormMatricula}
                    onChange={e => setMFormMatricula(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1">Atribuição na Comissão:</label>
                  <select
                    className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                    value={mFormAtrib}
                    onChange={e => setMFormAtrib(e.target.value as any)}
                  >
                    <option value="Membro">Membro</option>
                    <option value="Presidente">Presidente</option>
                    <option value="Secretária-Executiva">Secretária-Executiva</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Encargo:</label>
                  <select
                    className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                    value={mFormEncargo}
                    onChange={e => setMFormEncargo(e.target.value as any)}
                  >
                    <option value="Titular">Titular</option>
                    <option value="Suplente">Suplente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold block mb-1">Portaria / Instrumento Designador:</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                    placeholder="Ex: Portaria MTE nº 104/2024"
                    value={mFormDispositivo}
                    onChange={e => setMFormDispositivo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold block mb-1">Pub. Portaria:</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    value={mFormPub}
                    onChange={e => setMFormPub(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1">Início Mandato:</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    value={mFormInicio}
                    onChange={e => setMFormInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold block mb-1">Fim Mandato:</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    value={mFormFim}
                    onChange={e => setMFormFim(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[11px] font-bold block mb-1">Mandato (Texto):</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2 rounded-lg"
                    placeholder="Ex: 3 anos"
                    value={mFormMandato}
                    onChange={e => setMFormMandato(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold block mb-1">E-mail Institucional:</label>
                  <input
                    type="email"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    placeholder="nome.sobrenome@trabalho.gov.br"
                    value={mFormEmail}
                    onChange={e => setMFormEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">Telefone / Ramal Contato:</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border p-2 rounded-lg"
                  placeholder="(61) 99999-9999"
                  value={mFormTel}
                  onChange={e => setMFormTel(e.target.value)}
                />
              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button
                onClick={() => {
                  setShowAddMembroModal(false);
                  setEditingMembro(null);
                }}
                className="px-4 py-1.5 text-slate-600 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMembro}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                {editingMembro ? "Salvar Alterações" : "Homologar Membro"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD/EDIT REUNIAO DIALOG --- */}
      {showAddReuniaoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-250 overflow-hidden flex flex-col shadow-2xl">

            <div className="bg-[#003366] px-5 py-4 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                {editingReuniao ? "Editar Agendamento de Colegiado" : "Agendar Reunião de Colegiado"}
              </h3>
              <button
                onClick={() => {
                  setShowAddReuniaoModal(false);
                  setEditingReuniao(null);
                }}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-slate-800 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1">Tipo de Reunião:</label>
                  <select
                    className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                    value={rFormTipo}
                    onChange={e => setRFormTipo(e.target.value as any)}
                  >
                    <option value="Ordinária">Ordinária</option>
                    <option value="Extraordinária">Extraordinária</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Data e Hora de Início:</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono focus:outline-hidden"
                    value={rFormDataHora}
                    onChange={e => setRFormDataHora(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1">Assuntos e Deliberações da Pauta:</label>
                <textarea
                  className="w-full h-20 bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                  placeholder="Insira os principais processos e assuntos a serem debatidos..."
                  value={rFormPauta}
                  onChange={e => setRFormPauta(e.target.value)}
                />
              </div>

              {/* Guest Adding Section */}
              <div className="border-t pt-3 mt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Convidados e Lista de Participantes</span>
                  <button
                    type="button"
                    onClick={importActiveMembersToGuests}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-350 text-[10px] text-slate-700 font-bold rounded-lg transition"
                  >
                    Importar Membros Ativos da Comissão
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 border rounded-xl items-end">
                  <div>
                    <label className="text-[10px] font-bold block mb-1">Nome:</label>
                    <input
                      type="text"
                      placeholder="Ex: Dr. Roberto"
                      className="w-full bg-white border p-1.5 text-[10.5px] rounded-lg"
                      value={gFormNome}
                      onChange={e => setGFormNome(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold block mb-1">Encargo:</label>
                    <input
                      type="text"
                      placeholder="Ex: Assessor CGU"
                      className="w-full bg-white border p-1.5 text-[10.5px] rounded-lg"
                      value={gFormEncargo}
                      onChange={e => setGFormEncargo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold block mb-1">E-mail:</label>
                    <input
                      type="email"
                      placeholder="email@dominio.com"
                      className="w-full bg-white border p-1.5 text-[10.5px] rounded-lg font-mono"
                      value={gFormEmail}
                      onChange={e => setGFormEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold block mb-1">Telefone:</label>
                      <input
                        type="text"
                        placeholder="(61) 999..."
                        className="w-full bg-white border p-1.5 text-[10.5px] rounded-lg"
                        value={gFormTel}
                        onChange={e => setGFormTel(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addGuestToDraft}
                      className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10.5px] font-bold transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Draft list of guests added */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto border rounded-xl divide-y">
                  {meetingGuestsList.length === 0 ? (
                    <div className="text-center py-4 text-slate-400 italic text-[11px]">
                      Nenhum convidado adicionado à pauta.
                    </div>
                  ) : (
                    meetingGuestsList.map((guest, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between text-[11px] hover:bg-slate-50">
                        <div className="truncate">
                          <span className="font-bold text-slate-700">{guest.nome}</span>
                          <span className="text-slate-400 font-mono ml-2">({guest.encargo}) — {guest.email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGuestFromDraft(idx)}
                          className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button
                onClick={() => {
                  setShowAddReuniaoModal(false);
                  setEditingReuniao(null);
                }}
                className="px-4 py-1.5 text-slate-600 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReuniao}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                {editingReuniao ? "Salvar Agendamento" : "Concluir Agendamento"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADD/EDIT PROCESS DIALOG --- */}
      {showAddProcessoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-slate-250 overflow-hidden flex flex-col shadow-2xl">

            <div className="bg-[#003366] px-5 py-4 text-white flex justify-between items-center">
              <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">
                {editingProcesso ? `Editar Processo ${pFormTipo}` : `Novo Registro de Processo (${pFormTipo})`}
              </h3>
              <button
                onClick={() => {
                  setShowAddProcessoModal(false);
                  setEditingProcesso(null);
                }}
                className="text-white hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-slate-800 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1">Tipo do Processo:</label>
                  <select
                    className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                    value={pFormTipo}
                    onChange={e => {
                      setPFormTipo(e.target.value as any);
                      if (e.target.value === "SECI") setPFormSituacao("Em Análise");
                      else if (e.target.value === "Consulta") setPFormSituacao("Pendente");
                      else setPFormSituacao("Em Andamento");
                    }}
                    disabled={!!editingProcesso}
                  >
                    <option value="SECI">SECI (Conflito de Interesses)</option>
                    <option value="Consulta">Consulta Técnica</option>
                    <option value="Ético">Processo Ético Disciplinar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Número do Processo SEI:</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    placeholder="Ex: 19973.102345/2026-88"
                    value={pFormSei}
                    onChange={e => setPFormSei(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold block mb-1">Data de Instauração/Início:</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    value={pFormDataInicio}
                    onChange={e => setPFormDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold block mb-1">Data Fim/Conclusão (Opcional):</label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border p-2 rounded-lg font-mono"
                    value={pFormDataFim}
                    onChange={e => setPFormDataFim(e.target.value)}
                  />
                </div>
              </div>

              {/* Conditional fields based on selected process type */}
              {pFormTipo === "SECI" && (
                <>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Relator Responsável Designado:</label>
                    <select
                      className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                      value={pFormResponsavel}
                      onChange={e => setPFormResponsavel(e.target.value)}
                    >
                      <option value="">Selecione um relator...</option>
                      {membrosEtica.filter(m => m.ativo).map(m => (
                        <option key={m.id} value={m.nome}>{m.nome} ({m.atribuicao})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Resumo das Atividades Denunciadas / Conflito:</label>
                    <textarea
                      className="w-full h-20 bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                      placeholder="Descreva suscintamente o objeto da solicitação de conflito de interesses..."
                      value={pFormResumo}
                      onChange={e => setPFormResumo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Situação / Decisão SECI:</label>
                    <select
                      className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                      value={pFormSituacao}
                      onChange={e => setPFormSituacao(e.target.value)}
                    >
                      <option value="Em Análise">Em Análise</option>
                      <option value="Deferido">Deferido</option>
                      <option value="Indeferido">Indeferido</option>
                    </select>
                  </div>
                </>
              )}

              {pFormTipo === "Consulta" && (
                <>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Unidade Solicitante:</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border p-2 rounded-lg"
                      placeholder="Ex: Superintendência Regional da Bahia"
                      value={pFormSolicitante}
                      onChange={e => setPFormSolicitante(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Assunto / Descrição da Dúvida:</label>
                    <textarea
                      className="w-full h-20 bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                      placeholder="Assunto da consulta formulada pela unidade..."
                      value={pFormAssunto}
                      onChange={e => setPFormAssunto(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold block mb-1">Status da Consulta:</label>
                    <select
                      className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                      value={pFormSituacao}
                      onChange={e => setPFormSituacao(e.target.value)}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Respondida">Respondida</option>
                    </select>
                  </div>
                </>
              )}

              {pFormTipo === "Ético" && (
                <div>
                  <label className="text-[11px] font-bold block mb-1">Status do Processo Ético:</label>
                  <select
                    className="w-full bg-slate-50 border p-2 rounded-lg focus:outline-hidden"
                    value={pFormSituacao}
                    onChange={e => setPFormSituacao(e.target.value)}
                  >
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Arquivado">Arquivado</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              )}

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button
                onClick={() => {
                  setShowAddProcessoModal(false);
                  setEditingProcesso(null);
                }}
                className="px-4 py-1.5 text-slate-600 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProcesso}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                {editingProcesso ? "Salvar Alterações" : "Cadastrar Processo"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- 4. PRINT PREVIEW AND PRINT VIEW OVERLAY --- */}
      {printingAtaId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-xs">

          {/* Main print preview panel (hidden on paper due to @media print in index.css) */}
          <div className="bg-white border rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl my-8 no-print">
            {/* Header controls bar */}
            <div className="bg-[#003366] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-200 font-mono tracking-wider">Ata da Reunião - Pré-visualização</span>
                <h4 className="text-sm font-bold font-display">Ata nº {reunioesEtica.find(x => x.id === printingAtaId)?.id}</h4>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#1351b4] hover:bg-[#003366] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Salvar PDF
                </button>

                <button
                  onClick={() => setPrintingAtaId(null)}
                  className="p-1 bg-slate-800 hover:bg-slate-700 border rounded-lg text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable document container */}
            <div className="p-8 bg-slate-100 overflow-y-auto max-h-[70vh] flex justify-center">
              <div className="w-full max-w-[21cm] min-h-[29.7cm] bg-white shadow-lg p-12 text-slate-800 font-serif leading-relaxed text-xs border border-slate-350 select-text">
                {/* Official Header */}
                <div className="text-center space-y-1.5 pb-6 border-b border-slate-400 mb-8 font-sans">
                  {/* Stylized Federal Coat of Arms SVG */}
                  <svg className="w-14 h-14 mx-auto mb-2 text-slate-800" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="50" cy="50" r="38" strokeDasharray="3 3" />
                    <polygon points="50,15 57,32 75,32 60,42 66,60 50,49 34,60 40,42 25,32 43,32" fill="currentColor" opacity="0.8" />
                    <line x1="50" y1="12" x2="50" y2="88" strokeWidth="1.5" />
                    <line x1="12" y1="50" x2="88" y2="50" strokeWidth="1.5" />
                    <circle cx="50" cy="50" r="16" fill="white" stroke="currentColor" strokeWidth="2" />
                    <path d="M45,50 A5,5 0 0,1 55,50" strokeWidth="2.5" />
                  </svg>

                  <span className="text-[10px] font-bold uppercase tracking-wider block">Presidência da República</span>
                  <span className="text-xs font-bold uppercase tracking-wider block">Ministério do Trabalho e Emprego</span>
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">AECI - Assessoria Especial de Controle Interno</span>
                  <span className="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-widest block">Comissão de Ética Coletiva</span>
                </div>

                {/* Document Title */}
                <div className="text-center font-sans space-y-2 mb-6">
                  <h2 className="text-sm font-extrabold uppercase tracking-wide">
                    ATA DA {reunioesEtica.find(x => x.id === printingAtaId)?.tipo === "Ordinária" ? "ORDINÁRIA" : "EXTRAORDINÁRIA"} REUNIÃO DE COLEGIADO
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Registrada sob o código de Autuação: {reunioesEtica.find(x => x.id === printingAtaId)?.id}
                  </p>
                </div>

                {/* Meta details */}
                <div className="space-y-4 text-[11.5px] leading-relaxed">
                  <p>
                    Aos {new Date(reunioesEtica.find(x => x.id === printingAtaId)?.dataHora + "").toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })} às {reunioesEtica.find(x => x.id === printingAtaId)?.dataHora.split('T')[1]} horas, reuniu-se de forma ordinária a Comissão de Ética do Ministério do Trabalho e Emprego, com a pauta de deliberações transcrita abaixo.
                  </p>

                  <div>
                    <h5 className="font-bold uppercase font-sans text-[10px] tracking-wider text-slate-600 block mb-1">1. Pauta da Reunião:</h5>
                    <p className="pl-4 italic border-l-2 border-slate-350 py-1 bg-slate-50 text-[11px] text-slate-700 leading-normal">
                      "{reunioesEtica.find(x => x.id === printingAtaId)?.pauta}"
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold uppercase font-sans text-[10px] tracking-wider text-slate-600 block mb-1">2. Relato dos Fatos e Discussões:</h5>
                    <p className="text-justify whitespace-pre-line text-slate-700">
                      {atasEtica.find(a => a.reuniaoId === printingAtaId)?.relatos}
                    </p>
                  </div>

                  <div>
                    <h5 className="font-bold uppercase font-sans text-[10px] tracking-wider text-slate-600 block mb-1">3. Decisões, Votos e Deliberações:</h5>
                    <p className="text-justify whitespace-pre-line text-slate-700">
                      {atasEtica.find(a => a.reuniaoId === printingAtaId)?.decisoes}
                    </p>
                  </div>

                  {/* Signatures block of confirmed attendees */}
                  <div className="border-t border-slate-300 pt-6 mt-8 space-y-4">
                    <h5 className="font-bold uppercase font-sans text-[10px] tracking-wider text-slate-600 block">Membros e Convidados Confirmados (Presentes na Sessão):</h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-6 pt-4 font-sans text-[10px] text-slate-600">
                      {reunioesEtica.find(x => x.id === printingAtaId)?.convidados
                        .filter(c => (reunioesEtica.find(x => x.id === printingAtaId)?.confirmacoes[c.email] === "Confirmado"))
                        .map((c, i) => (
                          <div key={i} className="text-center space-y-1">
                            <div className="border-t border-slate-400 w-4/5 mx-auto pt-1">
                              <p className="font-bold text-slate-800">{c.nome}</p>
                              <p className="text-[9px] opacity-75">{c.encargo}</p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>

                  {/* Document date marker */}
                  <div className="text-right pt-8 font-mono text-[9px] text-slate-400">
                    Gerado pelo Órbita-AECI em {formatDate(atasEtica.find(a => a.reuniaoId === printingAtaId)?.dataGeracao)}
                  </div>

                </div>

              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t flex justify-end no-print">
              <button
                onClick={() => setPrintingAtaId(null)}
                className="px-4 py-1.5 border rounded-lg text-xs font-bold hover:bg-slate-100 text-slate-700 transition"
              >
                Fechar Visualização
              </button>
            </div>
          </div>

          {/* PAPER-ONLY DISPLAY SECTION (Only printed due to GFM / styles) */}
          <div className="print-only hidden select-text font-serif leading-relaxed text-xs max-w-[21cm] mx-auto p-12 bg-white text-slate-900">
            {/* Header copy */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-400 mb-8 font-sans">
              <span className="text-[10px] font-bold uppercase tracking-wider block">Presidência da República</span>
              <span className="text-xs font-bold uppercase tracking-wider block">Ministério do Trabalho e Emprego</span>
              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">AECI - Assessoria Especial de Controle Interno</span>
              <span className="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-widest block">Comissão de Ética Coletiva</span>
            </div>

            <div className="text-center font-sans space-y-1 mb-6">
              <h2 className="text-sm font-extrabold uppercase tracking-wide">
                ATA DA {reunioesEtica.find(x => x.id === printingAtaId)?.tipo === "Ordinária" ? "ORDINÁRIA" : "EXTRAORDINÁRIA"} REUNIÃO DE COLEGIADO
              </h2>
              <p className="text-[9px] text-slate-500 font-mono">
                Autuação: {reunioesEtica.find(x => x.id === printingAtaId)?.id}
              </p>
            </div>

            <div className="space-y-4 text-[11.5px] leading-relaxed text-justify">
              <p>
                Aos {new Date(reunioesEtica.find(x => x.id === printingAtaId)?.dataHora + "").toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })} às {reunioesEtica.find(x => x.id === printingAtaId)?.dataHora.split('T')[1]} horas, reuniu-se a Comissão de Ética do Ministério do Trabalho e Emprego, com a pauta de deliberações transcrita abaixo.
              </p>

              <div>
                <h5 className="font-bold uppercase font-sans text-[10px] block mb-1">1. Pauta da Reunião:</h5>
                <p className="pl-4 border-l-2 border-slate-350 py-1 bg-slate-50 text-[11px] leading-normal italic text-slate-800">
                  "{reunioesEtica.find(x => x.id === printingAtaId)?.pauta}"
                </p>
              </div>

              <div>
                <h5 className="font-bold uppercase font-sans text-[10px] block mb-1">2. Relato dos Fatos e Discussões:</h5>
                <p className="whitespace-pre-line text-slate-800">
                  {atasEtica.find(a => a.reuniaoId === printingAtaId)?.relatos}
                </p>
              </div>

              <div>
                <h5 className="font-bold uppercase font-sans text-[10px] block mb-1">3. Decisões, Votos e Deliberações:</h5>
                <p className="whitespace-pre-line text-slate-800">
                  {atasEtica.find(a => a.reuniaoId === printingAtaId)?.decisoes}
                </p>
              </div>

              <div className="border-t border-slate-300 pt-6 mt-8 space-y-4">
                <h5 className="font-bold uppercase font-sans text-[10px] block">Membros e Convidados Presentes (Assinaturas):</h5>

                <div className="grid grid-cols-2 gap-y-12 gap-x-6 pt-4 font-sans text-[10px] text-slate-700">
                  {reunioesEtica.find(x => x.id === printingAtaId)?.convidados
                    .filter(c => (reunioesEtica.find(x => x.id === printingAtaId)?.confirmacoes[c.email] === "Confirmado"))
                    .map((c, i) => (
                      <div key={i} className="text-center space-y-1">
                        <div className="border-t border-slate-400 w-4/5 mx-auto pt-1">
                          <p className="font-bold">{c.nome}</p>
                          <p className="text-[9px] opacity-75">{c.encargo}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="text-right pt-8 font-mono text-[9px] text-slate-400">
                Homologada digitalmente pelo Órbita-AECI em {formatDate(atasEtica.find(a => a.reuniaoId === printingAtaId)?.dataGeracao)}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
