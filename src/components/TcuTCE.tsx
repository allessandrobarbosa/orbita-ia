/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Plus,
  Search,
  Download,
  Printer,
  Database,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  Check,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  Upload,
  FileUp,
  MessageSquare,
  FileWarning,
  BarChart3,
  FileCheck,
  LayoutGrid,
  Merge,
  Mail,
  DollarSign,
  Scale,
  Landmark,
  Activity,
  Users,
  Building2,
  ArrowLeftRight,
  Archive,
  Sparkles,
  Bot,
  RefreshCw,
  Brain,
  Edit
} from "lucide-react";
import { AcordaoDemand, ComunicacaoDemand, TceDemand, TceAcordaoMapping } from "../types";

interface TcuModuleProps {
  acordaos: AcordaoDemand[];
  onUpdateAcordao: (updated: AcordaoDemand) => Promise<boolean>;
  onDeleteAcordao: (key: string) => Promise<boolean>;
  onImportAcordaos: (listOrItems: string[] | any[]) => Promise<any>;
  onSyncLocalAcordaos: () => Promise<any>;
  comunicacoes?: ComunicacaoDemand[];
  onUpdateComunicacao?: (updated: ComunicacaoDemand) => Promise<boolean>;
  onDeleteComunicacao?: (key: string) => Promise<boolean>;
  onImportComunicacoes?: (items: ComunicacaoDemand[]) => Promise<any>;
  tces?: TceDemand[];
  tceMappings?: TceAcordaoMapping[];
  onUpdateTce?: (updated: TceDemand) => Promise<boolean>;
  onDeleteTce?: (id: string) => Promise<boolean>;
  onImportTces?: (items: TceDemand[]) => Promise<any>;
  onImportTceMappings?: (items: TceAcordaoMapping[]) => Promise<any>;
  onAddTceMapping?: (tceId: string, acordaoKey: string) => Promise<boolean>;
  onDeleteTceMapping?: (tceId: string, acordaoKey: string) => Promise<boolean>;
  onClearOlderAcordaos?: () => Promise<any>;
  onResetDatabase?: () => Promise<any>;
  isLoading: boolean;
  onRefreshData?: () => Promise<void>;
  onNavigateToMonitoramento?: (searchKey: string) => void;
}

export default function TcuTCE({
  acordaos: rawAcordaos,
  onUpdateAcordao,
  onDeleteAcordao,
  onImportAcordaos,
  onSyncLocalAcordaos,
  comunicacoes: rawComunicacoes = [],
  onUpdateComunicacao,
  onDeleteComunicacao,
  onImportComunicacoes,
  tces: rawTces = [],
  tceMappings = [],
  onUpdateTce,
  onDeleteTce,
  onImportTces,
  onImportTceMappings,
  onAddTceMapping,
  onDeleteTceMapping,
  onClearOlderAcordaos,
  onResetDatabase,
  isLoading,
  onRefreshData,
  onNavigateToMonitoramento
}: TcuModuleProps) {

  // Robust Portuguese Text Repair function
  const sanitizePortugueseText = (text: string | undefined | null): string => {
    if (!text) return "";
    let clean = text;

    // Strip HTML tags if present (detect by looking for < and >)
    if (clean.includes("<") && clean.includes(">")) {
      clean = clean.replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<p\b[^>]*>/gi, "")
        .replace(/<\/li>/gi, "\n")
        .replace(/<li\b[^>]*>/gi, "  • ")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<td>|<\/td>|<th>|<\/th>/gi, " | ")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"');
    }

    // Convert standard Unicode Replacement Character and other weird placeholder characters to '?'
    // to normalize all encodings before passing through the targeted repairs
    clean = clean.replace(/[\uFFFD\u009d]/g, "?");

    // Repair "Órgão" and "Órgãos" when starting/ending letters are corrupted to '?' or similar
    clean = clean.replace(/[?\uFFFD]*rg[?\uFFFD]*os?/gi, (match) => {
      const isPlural = match.toLowerCase().endsWith("s");
      const isCap = match.startsWith("Ó") || match.startsWith("O") || match.startsWith("?") || match.startsWith("\uFFFD");
      const base = isCap ? "Órgão" : "órgão";
      return isPlural ? base + "s" : base;
    });

    // Special repair: Match Omissão / Omissao followed by corrupted/uncorrupt preposition patterns
    clean = clean.replace(/\bOmis[s]?o\s+(?:n[\uFFFD\?]+o|não?|no)\b/gi, (match) => {
      return match.startsWith("O") ? "Omissão no" : "omissão no";
    });

    // Direct words with clean accents
    clean = clean.replace(/minsist\?rio/gi, "ministério")
      .replace(/minist\?rio/gi, "ministério")
      .replace(/minsistério/gi, "ministério")
      .replace(/ministerio/gi, "ministério")
      .replace(/omiss\?o/gi, "omissão")
      .replace(/omis\?o/gi, "omissão")
      // Avoid generic /No/g inside words, use word bounds and check for standard corrupted shapes only
      .replace(/\bN(?:[?\uFFFD]|[\s])o\b/g, "Não")
      .replace(/\bn(?:[?\uFFFD]|[\s])o\b/g, "não")
      .replace(/comprovao/g, "comprovação")
      .replace(/comprovaao/g, "comprovação")
      .replace(/aplicao/g, "aplicação")
      .replace(/aplicaao/g, "aplicação")
      .replace(/regulao/g, "regulação")
      .replace(/regulaao/g, "regulação")
      .replace(/Instaurao/g, "Instauração")
      .replace(/instaurao/g, "instauração")
      .replace(/Acrdo/g, "Acórdão")
      .replace(/acrdo/g, "acórdão")
      .replace(/consecuo/g, "consecução")
      .replace(/consecuao/g, "consecução")
      .replace(/Ministrio/g, "Ministério")
      .replace(/Omisso/g, "Omissão")
      .replace(/omisso/g, "omissão")
      .replace(/Impugnao/g, "Impugnação")
      .replace(/impugnao/g, "impugnação")
      .replace(/Atribuio/g, "Atribuição")
      .replace(/atribuio/g, "atribuição")
      .replace(/Sesso/g, "Sessão")
      .replace(/sesso/g, "sessão")
      .replace(/Mnimo/g, "Mínimo")
      .replace(/mnimo/g, "mínimo")
      .replace(/Deciso/g, "Decisão")
      .replace(/deciso/g, "decisão")
      .replace(/Informao/g, "Informação")
      .replace(/informao/g, "informação")
      .replace(/Situao/g, "Situação")
      .replace(/situao/g, "situação")
      .replace(/Ateno/g, "Atenção")
      .replace(/ateno/g, "atenção")
      .replace(/pblicos/g, "públicos")
      .replace(/pblico/g, "público")
      .replace(/Pblico/g, "Público")
      .replace(/relatrio/g, "relatório")
      .replace(/Relatrio/g, "Relatório")
      .replace(/orgo/g, "órgão")
      .replace(/Orgo/g, "Órgão")
      .replace(/rgo/g, "órgão")
      .replace(/rgos/g, "órgãos")
      .replace(/reunio/g, "reunião");

    // Common double UTF-8 decoding / Latin-1 corruptions
    clean = clean
      .replace(/Ã¡/g, "á")
      .replace(/Ã¢/g, "â")
      .replace(/Ã£/g, "ã")
      .replace(/Ã§/g, "ç")
      .replace(/Ã©/g, "é")
      .replace(/Ãª/g, "ê")
      .replace(/Ã\u00ad/g, "í")
      .replace(/Ã­/g, "í")
      .replace(/Ã³/g, "ó")
      .replace(/Ã´/g, "ô")
      .replace(/Ãµ/g, "õ")
      .replace(/Ãº/g, "ú")
      .replace(/Ã\u0081/g, "Á")
      .replace(/Ã\u0082/g, "Â")
      .replace(/Ã\u0083/g, "Ã")
      .replace(/Ã\u0087/g, "Ç")
      .replace(/Ã\u0089/g, "É")
      .replace(/Ã\u008a/g, "Ê")
      .replace(/Ã\u008d/g, "Í")
      .replace(/Ã\u0093/g, "Ó")
      .replace(/Ã\u0094/g, "Ô")
      .replace(/Ã\u0095/g, "Õ")
      .replace(/Ã\u009a/g, "Ú");

    // Repair corruptions from bad import encodings
    clean = clean
      .replace(/minsist\?rio/gi, "ministério")
      .replace(/minist\?rio/gi, "ministério")
      .replace(/omiss\?o/gi, "omissão")
      .replace(/omis\?o/gi, "omissão")
      .replace(/N\?o/gi, "Não")
      .replace(/comprova\?o/gi, "comprovação")
      .replace(/aplica\?o/gi, "aplicação")
      .replace(/regula\?o/gi, "regulação")
      .replace(/consecu\?o/gi, "consecução")
      .replace(/Insta\?o/gi, "Instauração")
      .replace(/Ac\?rd\?o/gi, "Acórdão")
      .replace(/acr\?rd\?o/gi, "acórdão")
      .replace(/ac\?rd\?o/gi, "acórdão")
      .replace(/Acr\?do/gi, "Acórdão")
      .replace(/Aco\?rda\?o/gi, "Acórdão")
      .replace(/aco\?rda\?o/gi, "acórdão")
      .replace(/Omis\?o/gi, "Omissão")
      .replace(/omis\?o/gi, "omissão")
      .replace(/Impugna\?o/gi, "Impugnação")
      .replace(/impugna\?o/gi, "impugnação")
      .replace(/Atribui\?o/gi, "Atribuição")
      .replace(/atribui\?o/gi, "atribuição")
      .replace(/Sess\?o/gi, "Sessão")
      .replace(/sess\?o/gi, "sessão")
      .replace(/M\?nimo/gi, "Mínimo")
      .replace(/m\?nimo/gi, "mínimo")
      .replace(/Decis\?o/gi, "Decisão")
      .replace(/decis\?o/gi, "decisão")
      .replace(/Informa\?o/gi, "Informação")
      .replace(/informa\?o/gi, "informação")
      .replace(/Situa\?o/gi, "Situação")
      .replace(/situa\?o/gi, "situação")
      .replace(/Aten\?o/gi, "Atenção")
      .replace(/aten\?o/gi, "atenção")
      .replace(/p\?blico/gi, "público")
      .replace(/Relat\?rio/gi, "Relatório")
      .replace(/relat\?rio/gi, "relatório")
      .replace(/org\?o/gi, "órgão")
      .replace(/Org\?o/gi, "Órgão");

    // Contextual regex repair for non-alphanumeric replacement sequences
    clean = clean
      .replace(/N[^a-zA-Z0-9\s]o /g, "Não ")
      .replace(/N[^a-zA-Z0-9\s]o/g, "Não")
      .replace(/comprova[^a-zA-Z0-9\s]+o/g, "comprovação")
      .replace(/aplica[^a-zA-Z0-9\s]+o/g, "aplicação")
      .replace(/regula[^a-zA-Z0-9\s]+o/g, "regulação")
      .replace(/consecu[^a-zA-Z0-9\s]+o/g, "consecução")
      .replace(/omis[^a-zA-Z0-9\s]+o/g, "omissão")
      .replace(/Omis[^a-zA-Z0-9\s]+o/g, "Omissão")
      .replace(/Impugna[^a-zA-Z0-9\s]+o/g, "Impugnação")
      .replace(/impugna[^a-zA-Z0-9\s]+o/g, "impugnação")
      .replace(/Ac[^a-zA-Z0-9\s]+rd[^a-zA-Z0-9\s]+o/g, "Acórdão")
      .replace(/ac[^a-zA-Z0-9\s]+rd[^a-zA-Z0-9\s]+o/g, "acórdão")
      .replace(/Atribui[^a-zA-Z0-9\s]+o/g, "Atribuição")
      .replace(/atribui[^a-zA-Z0-9\s]+o/g, "atribuição")
      .replace(/Situa[^a-zA-Z0-9\s]+o/g, "Situação")
      .replace(/situa[^a-zA-Z0-9\s]+o/g, "situação")
      .replace(/Informa[^a-zA-Z0-9\s]+o/g, "Informação")
      .replace(/informa[^a-zA-Z0-9\s]+o/g, "informação")
      .replace(/Sess[^a-zA-Z0-9\s]+o/g, "Sessão")
      .replace(/sess[^a-zA-Z0-9\s]+o/g, "sessão")
      .replace(/Relat[^a-zA-Z0-9\s]+rio/g, "Relatório")
      .replace(/relat[^a-zA-Z0-9\s]+rio/g, "relatório")
      .replace(/org[^a-zA-Z0-9\s]+o/g, "órgão")
      .replace(/Org[^a-zA-Z0-9\s]+o/g, "Órgão");

    return clean;
  };

  // Robust function to extract correct 4-digit year from TCE designation, avoiding matching sequence number
  const extractYearFromTceString = (str: string | undefined | null): number => {
    if (!str) return 0;
    const cleanStr = str.trim();

    // 1. Match a year right after a separator: slash (/), pipe (|), hyphen (-), or backslash (\)
    const separatorMatch = cleanStr.match(/[/|\\-]\s*(\d{4})\b/);
    if (separatorMatch) {
      const yr = parseInt(separatorMatch[1]);
      if (yr >= 1990 && yr <= 2035) return yr;
    }

    // 2. Fallback: match any four digits but traverse from right to left (last to first),
    // because the year is always on the right side, avoiding sequence numbers on the left (e.g. "2035/2023" -> 2023)
    const anyFourDigits = cleanStr.match(/\d{4}/g);
    if (anyFourDigits && anyFourDigits.length > 0) {
      for (let i = anyFourDigits.length - 1; i >= 0; i--) {
        const yr = parseInt(anyFourDigits[i]);
        if (yr >= 1990 && yr <= 2035) {
          return yr;
        }
      }
    }

    return 0; // Return 0 for invalid year, which will be filtered out
  };

  // UI states
  const [processErrors, setProcessErrors] = useState<{ id: string; error: string }[]>([]);

  // Pure sanitized memory collections to auto-repair previous session corruptions transparently
  const acordaos = React.useMemo(() => {
    const errors: { id: string; error: string }[] = [];

    const processed = (rawAcordaos || [])
      .filter(ac => ac && (ac.NUMACORDAO || ac.TITULO || ac.KEY || ac.PROC))
      .map(ac => {
        try {
          const tituloSanitizado = sanitizePortugueseText(ac.TITULO);
          const assuntoSanitizado = sanitizePortugueseText(ac.ASSUNTO);
          const sumarioSanitizado = sanitizePortugueseText(ac.SUMARIO);
          const acordaoSanitizado = sanitizePortugueseText(ac.ACORDAO);

          const recs = sanitizePortugueseText(ac.RECOMENDACOES || "");
          const dets = sanitizePortugueseText(ac.DETERMINACOES || "");

          let unificado = "";
          if (recs && dets) {
            unificado = `**Recomendações:**\n${recs}\n\n**Determinações:**\n${dets}`;
          } else if (recs) {
            unificado = `**Recomendações:**\n${recs}`;
          } else if (dets) {
            unificado = `**Determinações:**\n${dets}`;
          } else {
            unificado = "Nenhuma recomendação ou determinação registrada.";
          }

          return {
            ...ac,
            TITULO: tituloSanitizado,
            ASSUNTO: assuntoSanitizado,
            SUMARIO: sumarioSanitizado,
            ACORDAO: acordaoSanitizado,
            RECOMENDACOES_DETERMINACOES_UNIFICADO: unificado
          };
        } catch (error: any) {
          console.error(`Erro ao processar Acórdão ${ac.KEY || ac.NUMACORDAO}:`, error);
          errors.push({ id: ac.KEY || String(ac.NUMACORDAO), error: error.message });

          return {
            ...ac,
            RECOMENDACOES_DETERMINACOES_UNIFICADO: "Erro ao processar recomendações/determinações."
          };
        }
      });

    setTimeout(() => setProcessErrors(errors), 0);
    return processed;
  }, [rawAcordaos]);

  // Format any input value into standard BRL currency format (R$ XX.XXX,XX)
  const formatCurrencyBRL = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null) return "R$ 0,00";
    if (typeof value === "number") {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    }

    const str = value.trim();
    if (!str) return "R$ 0,00";

    const hasComma = str.includes(",");
    const hasDot = str.includes(".");

    let numericValue = 0;
    if (hasComma && hasDot) {
      if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
        const cleaned = str.replace(/\./g, "").replace(",", ".");
        numericValue = parseFloat(cleaned.replace(/[^\d.-]/g, ""));
      } else {
        const cleaned = str.replace(/,/g, "");
        numericValue = parseFloat(cleaned.replace(/[^\d.-]/g, ""));
      }
    } else if (hasComma) {
      const cleaned = str.replace(",", ".");
      numericValue = parseFloat(cleaned.replace(/[^\d.-]/g, ""));
    } else {
      numericValue = parseFloat(str.replace(/[^\d.-]/g, ""));
    }

    if (isNaN(numericValue)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numericValue);
  };

  const tces = React.useMemo(() => {
    return (Array.isArray(rawTces) ? rawTces : []).map(t => ({
      ...t,
      MOTIVO_INSTAURACAO: sanitizePortugueseText(t.MOTIVO_INSTAURACAO),
      SUBMOTIVO_INSTAURACAO: sanitizePortugueseText(t.SUBMOTIVO_INSTAURACAO),
      ULTIMO_POSICIONAMENTO: sanitizePortugueseText(t.ULTIMO_POSICIONAMENTO),
      DEBITO_ORIGINAL: formatCurrencyBRL(t.DEBITO_ORIGINAL),
      DEBITO_ATUALIZADO: formatCurrencyBRL(t.DEBITO_ATUALIZADO)
    }));
  }, [rawTces]);

  const comunicacoes = React.useMemo(() => {
    return (Array.isArray(rawComunicacoes) ? rawComunicacoes : []).map(c => ({
      ...c,
      DESTINATARIO: sanitizePortugueseText(c.DESTINATARIO),
      CONTATO: sanitizePortugueseText(c.CONTATO),
      UNIDADE_EMITENTE: sanitizePortugueseText(c.UNIDADE_EMITENTE)
    }));
  }, [rawComunicacoes]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [colegiadoFilter, setColegiadoFilter] = useState("TODOS");
  const [anoFilter, setAnoFilter] = useState("TODOS");
  const [prazoFilter, setPrazoFilter] = useState("TODOS");
  const [tipoProcessoFilter, setTipoProcessoFilter] = useState("TODOS");
  const [ressarcimentoFilter, setRessarcimentoFilter] = useState("TODOS");
  const [recomendacaoFilter, setRecomendacaoFilter] = useState("TODOS");
  const [selectedAcordao, setSelectedAcordao] = useState<AcordaoDemand | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit Form state
  const [editStatus, setEditStatus] = useState<any>("Pendente");
  const [editResponsavel, setEditResponsavel] = useState("");
  const [editPrazo, setEditPrazo] = useState("");
  const [editObs, setEditObs] = useState("");

  // Importer states
  const [showImporter, setShowImporter] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copySuccessAlert, setCopySuccessAlert] = useState(false);
  const [fullTextAcordao, setFullTextAcordao] = useState<AcordaoDemand | null>(null);

  const handleViewFullText = async (ac: AcordaoDemand) => {
    setFullTextAcordao(ac);
    if (!ac.ACORDAO) {
      try {
        const res = await fetch(`/api/acordaos/${ac.KEY}/teor`);
        if (res.ok) {
          const data = await res.json();
          if (data.acordao) {
            setFullTextAcordao({ ...ac, ACORDAO: data.acordao });
          }
        }
      } catch (e) {
        console.error("Failed to fetch full text", e);
      }
    }
  };
  const [copySuccessFullText, setCopySuccessFullText] = useState(false);

  // Trace / Sync audit logs states
  const [showSyncLogModal, setShowSyncLogModal] = useState(false);

  // Local Sync states
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [syncLocalMessage, setSyncLocalMessage] = useState<string | null>(null);
  const [localSyncReport, setLocalSyncReport] = useState<any[] | null>(null);

  // Portal da Transparência verification states
  const [docVerifyInput, setDocVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [favorecidoInput, setFavorecidoInput] = useState("");
  const [favorecidoDocsResult, setFavorecidoDocsResult] = useState<any[] | null>(null);
  const [isSearchingFavorecido, setIsSearchingFavorecido] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<Record<string, boolean>>({});
  const [searchMode, setSearchMode] = useState<"documento" | "favorecido">("documento");

  // Communications module states
  const [comSearchTerm, setComSearchTerm] = useState("");
  const [comAnoFilter, setComAnoFilter] = useState("2026"); // Current Active Year defaults to 2026 as current year
  const [comUnidadeFilter, setComUnidadeFilter] = useState("TODOS");
  const [comRespondidoFilter, setComRespondidoFilter] = useState("TODOS");
  const [showComImporter, setShowComImporter] = useState(false);
  const [comPasteContent, setComPasteContent] = useState("");
  const [isDragOverCom, setIsDragOverCom] = useState(false);
  const [parsedComItems, setParsedComItems] = useState<ComunicacaoDemand[] | null>(null);
  const [editingComItem, setEditingComItem] = useState<ComunicacaoDemand | null>(null);
  const [isSavingCom, setIsSavingCom] = useState(false);
  const [comImportMessage, setComImportMessage] = useState<string | null>(null);
  const [comSubTab, setComSubTab] = useState<"lista" | "analytics">("lista");
  const [comCurrentPage, setComCurrentPage] = useState(1);
  const [comExpandedRow, setComExpandedRow] = useState<string | null>(null);
  const comItemsPerPage = 15;

  // Temporary Edit Form state for Communications
  const [editComDestinatario, setEditComDestinatario] = useState("");
  const [editComContato, setEditComContato] = useState("");
  const [editComUnidade, setEditComUnidade] = useState("");
  const [editComProcesso, setEditComProcesso] = useState("");
  const [editComExpedicao, setEditComExpedicao] = useState("");
  const [editComResposta, setEditComResposta] = useState("");
  const [editComCarece, setEditComCarece] = useState(true);
  const [editComUnidadeExecutora, setEditComUnidadeExecutora] = useState("");
  const [editComProcessoSei, setEditComProcessoSei] = useState("");
  const [editComDestinacao, setEditComDestinacao] = useState("RESPOSTA");

  // TCE module states
  const [tceActiveSubTab, setTceActiveSubTab] = useState<"geral" | "com-acordaos">("geral");
  const [tceSelectedYear, setTceSelectedYear] = useState("TODOS");
  const [tceSearchTerm, setTceSearchTerm] = useState("");
  const [tceFilterStatus, setTceFilterStatus] = useState("TODOS");
  const [tceFilterVinculacao, setTceFilterVinculacao] = useState("TODOS");
  const [showTceImporter, setShowTceImporter] = useState(false);
  const [tcePasteContent, setTcePasteContent] = useState("");
  const [isDragOverTce, setIsDragOverTce] = useState(false);
  const [parsedTceItems, setParsedTceItems] = useState<TceDemand[] | null>(null);
  const [parsedTceMappingItems, setParsedTceMappingItems] = useState<TceAcordaoMapping[] | null>(null);
  const [isSavingTce, setIsSavingTce] = useState(false);
  const [tceImportMessage, setTceImportMessage] = useState<string | null>(null);
  const [isSyncingLocalTce, setIsSyncingLocalTce] = useState(false);
  const [syncLocalTceMessage, setSyncLocalTceMessage] = useState<string | null>(null);
  const [tceExpandedId, setTceExpandedId] = useState<string | null>(null);
  const [tceCurrentPage, setTceCurrentPage] = useState(1);
  const tceItemsPerPage = 15;

  const [editingTceItem, setEditingTceItem] = useState<TceDemand | null>(null);
  const [editTcePosicionamento, setEditTcePosicionamento] = useState("");
  const [editTceSiafi, setEditTceSiafi] = useState(false);
  const [editTceAcordaoKey, setEditTceAcordaoKey] = useState("");

  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);

  const fetchLastUpdateDate = async () => {
    try {
      const res = await fetch("/api/files/last-updates");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.tces) setLastUpdateDate(data.data.tces);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchLastUpdateDate();
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
    setCurrentPage(1);
    setTceCurrentPage(1);
    setComCurrentPage(1);
  }, []);



  // Robust and auto-detecting file decoding function that works with Windows-1252/ISO-8859-1 (standard for Brazilian gov exports) and UTF-8
  const readAndDecodeFile = (file: File, callback: (text: string) => void, onFinish?: () => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        // Robust detection of UTF-8 vs Latin-1 (Windows-1252)
        let isUtf8 = true;
        let i = 0;
        while (i < uint8Array.length) {
          const byte = uint8Array[i];
          if (byte < 0x80) {
            i++;
          } else if ((byte & 0xE0) === 0xC0) {
            if (i + 1 >= uint8Array.length || (uint8Array[i + 1] & 0xC0) !== 0x80) {
              isUtf8 = false;
              break;
            }
            i += 2;
          } else if ((byte & 0xF0) === 0xE0) {
            if (i + 2 >= uint8Array.length || (uint8Array[i + 1] & 0xC0) !== 0x80 || (uint8Array[i + 2] & 0xC0) !== 0x80) {
              isUtf8 = false;
              break;
            }
            i += 3;
          } else if ((byte & 0xF8) === 0xF0) {
            if (i + 3 >= uint8Array.length || (uint8Array[i + 1] & 0xC0) !== 0x80 || (uint8Array[i + 2] & 0xC0) !== 0x80 || (uint8Array[i + 3] & 0xC0) !== 0x80) {
              isUtf8 = false;
              break;
            }
            i += 4;
          } else {
            isUtf8 = false;
            break;
          }
        }

        const encoding = isUtf8 ? "utf-8" : "windows-1252";
        const decoder = new TextDecoder(encoding);
        const text = decoder.decode(uint8Array);
        callback(text);
      } catch (err) {
        console.error("Error reading and decoding file:", err);
      } finally {
        if (onFinish) onFinish();
      }
    };
    reader.onerror = () => {
      if (onFinish) onFinish();
    };
    reader.readAsArrayBuffer(file);
  };



  // Communications parser and handlers
  const parseCommunicationsCSV = (csvText: string): ComunicacaoDemand[] => {
    if (!csvText || csvText.trim().length < 10) return [];

    // Detect delimiter from the first line
    const firstLineEnd = csvText.indexOf('\n');
    const headerLine = firstLineEnd > 0 ? csvText.substring(0, firstLineEnd) : csvText;
    const semiCount = (headerLine.match(/;/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    const tabCount = (headerLine.match(/\t/g) || []).length;
    let delimiter = ",";
    if (semiCount > commaCount && semiCount > tabCount) {
      delimiter = ";";
    } else if (tabCount > commaCount && tabCount > semiCount) {
      delimiter = "\t";
    };

    const allRows = parseCSVRobust(csvText, delimiter);
    const items: ComunicacaoDemand[] = [];

    for (let i = 0; i < allRows.length; i++) {
      const fields = allRows[i];
      if (fields.length < 5) continue;

      const comunicacao = fields[0] || "";
      const destinatario = fields[1] || "";
      const contato = fields[2] || "";
      const unidadeEmitente = fields[3] || "";
      const processo = fields[4] || "";
      const dataExpedicao = fields[5] || "";
      const dataResposta = fields[6] || "";

      // Skip header lines
      if (
        comunicacao.toLowerCase().includes("comunicac") ||
        destinatario.toLowerCase().includes("destinat") ||
        unidadeEmitente.toLowerCase().includes("unidade emitente")
      ) {
        continue;
      }

      // Extract year
      let ano = 2026;
      const dateMatch = dataExpedicao.match(/\/(\d{4})/);
      if (dateMatch) {
        ano = parseInt(dateMatch[1]);
      } else {
        const nameMatch = comunicacao.match(/\/(\d{4})/);
        if (nameMatch) {
          ano = parseInt(nameMatch[1]);
        }
      }

      // Generate key based on communication code
      const numOnly = (comunicacao.match(/\d+[\.\d]*/) || [""])[0].replace(/\D/g, "");
      const key = `COM-${numOnly || Math.floor(Math.random() * 1000000)}-${ano}`;

      items.push({
        KEY: key,
        COMUNICACAO: comunicacao,
        DESTINATARIO: destinatario,
        CONTATO: contato,
        UNIDADE_EMITENTE: unidadeEmitente,
        PROCESSO: processo,
        DATA_EXPEDICAO: dataExpedicao,
        DATA_RESPOSTA: dataResposta,
        ANO: ano
      });
    }
    return items;
  };

  // TCE module parsers and helper functions
  const parseTcesCSV = (csvText: string): TceDemand[] => {
    if (!csvText || csvText.trim().length < 10) return [];

    // Split lines just for header/delimiter detection
    const tempLines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (tempLines.length === 0) return [];
    let headerText = tempLines[0];
    for (let i = 0; i < Math.min(tempLines.length, 5); i++) {
      const lineLower = tempLines[i].toLowerCase();
      if (lineLower.includes("processo") || lineLower.includes("tce") || lineLower.includes("motivo") || lineLower.includes("debito") || lineLower.includes("dbito") || lineLower.includes("instaur")) {
        headerText = tempLines[i];
        break;
      }
    }
    const semicolonCount = (headerText.match(/;/g) || []).length;
    const commaCount = (headerText.match(/,/g) || []).length;
    const tabCount = (headerText.match(/\t/g) || []).length;
    let delimiter = ",";
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ";";
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = "\t";
    };

    const allRows = parseCSVRobust(csvText, delimiter);
    const items: TceDemand[] = [];
    if (allRows.length < 2) return [];

    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(allRows.length, 5); i++) {
      const rowJoined = allRows[i].join(" ").toLowerCase();
      if (rowJoined.includes("processo") || rowJoined.includes("tce") || rowJoined.includes("motivo") || rowJoined.includes("debito") || rowJoined.includes("dbito") || rowJoined.includes("instaur")) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = allRows[headerRowIdx];
    const normalizedHeaders = headers.map(normalizeHeaderName);

    const findIndexRobust = (keywords: string[], excludes?: string[]): number => {
      for (const kw of keywords) {
        const cleanKw = normalizeHeaderName(kw);
        const idx = normalizedHeaders.findIndex(ch => {
          if (!ch.includes(cleanKw)) return false;
          if (excludes) {
            return !excludes.some(ex => ch.includes(normalizeHeaderName(ex)));
          }
          return true;
        });
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const colNumeroAno = findIndexRobust(["nmero/ano (tce)", "numero/ano(tce)", "numero/ano", "ano(tce)", "numeroano"], ["situacao", "inicio", "fim", "ciencia", "revisor", "supervisor", "processo", "dano", "instrumento", "recebedor", "codigo"]);
    const colPA = findIndexRobust(["processo administrativo", "processoadministrativo", "pa", "processoadm"], ["tcu"]);
    const colMotivo = findIndexRobust(["motivo da instauracao", "motivo da instauração", "motivodainstauracao", "motivo"]);
    const colSubmotivo = findIndexRobust(["submotivo da instauracao", "submotivo da instauração", "submotivodainstauracao", "submotivo"]);
    const colDebitoOrig = findIndexRobust(["debito original", "débito original", "debito_original", "debitoorig"], ["atualizado"]);
    const colDebitoAtual = findIndexRobust(["debito atualizado com juros", "débito updated com juros", "débito atualizado com juros", "debito atualizado", "débito atualizado", "debitoatualizado"], ["data"]);
    const colDataAtual = findIndexRobust(["data atualizacao debito", "data da atualizacao do debito", "dataatualizacao", "data_atualizacao"]);
    const colPosicionamento = findIndexRobust(["ultimo posicionamento supervisor", "ultimo posicionamento", "último posicionamento", "posicionamento"]);
    const colTC = normalizedHeaders.indexOf("tc");
    const colEstado = findIndexRobust(["estado do processo", "estadoprocesso", "estado"]);
    const colSituacao = findIndexRobust(["situacao do processo", "situação do processo", "situacaoprocesso", "situacao", "situação"], ["inicio", "dano", "tce"]);
    const colJulgamento = findIndexRobust(["primeiro julgamento", "primeirojulgamento", "julgamento"]);
    const colEncerramento = normalizedHeaders.indexOf("encerramento");

    const startRowIdx = headerRowIdx + 1;

    for (let i = startRowIdx; i < allRows.length; i++) {
      const fields = allRows[i];
      if (fields.length < 5) continue;

      const getFieldValue = (colIdx: number, fallback: string = ""): string => {
        if (colIdx !== -1 && colIdx < fields.length) {
          return fields[colIdx] || fallback;
        }
        return fallback;
      };

      const numeroAnoTce = getFieldValue(colNumeroAno !== -1 ? colNumeroAno : 0, `TCE ${i}`);
      const pa = getFieldValue(colPA !== -1 ? colPA : 6);
      const motivo = getFieldValue(colMotivo !== -1 ? colMotivo : 7);
      const submotivo = getFieldValue(colSubmotivo !== -1 ? colSubmotivo : 8);
      const debitoOrig = getFieldValue(colDebitoOrig !== -1 ? colDebitoOrig : 12);
      const debitoAtual = getFieldValue(colDebitoAtual !== -1 ? colDebitoAtual : 13);
      const dataAtual = getFieldValue(colDataAtual !== -1 ? colDataAtual : 14);
      const posicionamento = getFieldValue(colPosicionamento !== -1 ? colPosicionamento : 33);
      const tc = getFieldValue(colTC !== -1 ? colTC : 46);
      const estado = getFieldValue(colEstado !== -1 ? colEstado : 59);
      const situacao = getFieldValue(colSituacao !== -1 ? colSituacao : 60);
      const julgamento = getFieldValue(colJulgamento !== -1 ? colJulgamento : 71);
      const encerramento = getFieldValue(colEncerramento !== -1 ? colEncerramento : 72);

      let ano = extractYearFromTceString(numeroAnoTce);

      items.push({
        id: numeroAnoTce,
        NUMERO_ANO_TCE: numeroAnoTce,
        PROCESSO_ADMINISTRATIVO: pa,
        MOTIVO_INSTAURACAO: motivo,
        SUBMOTIVO_INSTAURACAO: submotivo,
        DEBITO_ORIGINAL: debitoOrig,
        DEBITO_ATUALIZADO: debitoAtual,
        DATA_ATUALIZACAO_DEBITO: dataAtual,
        ULTIMO_POSICIONAMENTO: posicionamento,
        TC: tc,
        ESTADO_PROCESSO: estado,
        SITUACAO_PROCESSO: situacao,
        PRIMEIRO_JULGAMENTO: julgamento,
        ENCERRAMENTO: encerramento,
        ANO: ano
      });
    }

    return items;
  };

  const parseTceAcordaoMappingsCSV = (csvText: string): TceAcordaoMapping[] => {
    if (!csvText || csvText.trim().length < 10) return [];

    // Split lines just for header/delimiter detection
    const tempLines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (tempLines.length === 0) return [];
    let headerText = tempLines[0];
    for (let i = 0; i < Math.min(tempLines.length, 5); i++) {
      const lineLower = tempLines[i].toLowerCase();
      if (lineLower.includes("acordao") || lineLower.includes("acrdo") || lineLower.includes("tce") || lineLower.includes("sess") || lineLower.includes("descr")) {
        headerText = tempLines[i];
        break;
      }
    }
    const semicolonCount = (headerText.match(/;/g) || []).length;
    const commaCount = (headerText.match(/,/g) || []).length;
    const tabCount = (headerText.match(/\t/g) || []).length;
    let delimiter = ",";
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ";";
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = "\t";
    };

    const allRows = parseCSVRobust(csvText, delimiter);
    const items: TceAcordaoMapping[] = [];
    if (allRows.length < 2) return [];

    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(allRows.length, 5); i++) {
      const rowJoined = allRows[i].join(" ").toLowerCase();
      if (rowJoined.includes("acordao") || rowJoined.includes("acrdo") || rowJoined.includes("tce") || rowJoined.includes("sess") || rowJoined.includes("descr")) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = allRows[headerRowIdx];
    const normalizedHeaders = headers.map(normalizeHeaderName);

    let colTCE = -1;
    let colAcordao = -1;

    for (let i = 0; i < normalizedHeaders.length; i++) {
      const ch = normalizedHeaders[i];
      if (ch === "TCE" || ch.includes("TCE") || ch.includes("NUMERO") || ch.includes("NUMEROANO") || ch.includes("PROCESSO")) {
        colTCE = i;
      }
      if (ch.includes("ACORD") || ch.includes("ACR") || ch.includes("DESC") || ch.includes("DEPOIMENT")) {
        colAcordao = i;
      }
    }

    // Fuzzy matching helpers
    if (colTCE === -1) {
      colTCE = findHeaderIdx(normalizedHeaders, "TCE", "NUMERO_ANO_TCE", "NUMERO_ANO", "PROCESSO");
    }
    if (colAcordao === -1) {
      colAcordao = findHeaderIdx(normalizedHeaders, "ACORDAO", "ACORDAOREF", "REFERENCIA", "DESCRICAO");
    }

    if (colTCE === -1) colTCE = normalizedHeaders.length - 1; // Fallback to last column (standard)
    if (colAcordao === -1) colAcordao = Math.min(2, normalizedHeaders.length - 1); // Fallback

    const startRowIdx = headerRowIdx + 1;

    for (let i = startRowIdx; i < allRows.length; i++) {
      const fields = allRows[i];
      if (fields.length < 2) continue;

      let tceVal = fields[colTCE]?.trim();
      let acordaoVal = fields[colAcordao]?.trim();

      if (tceVal && acordaoVal) {
        // Normalize TCE Value: e.g. "3225|2025" -> "3225/2025"
        tceVal = tceVal.replace(/\|/g, "/");

        items.push({
          NUMERO_ANO_TCE: tceVal,
          ACORDAO_KEY: acordaoVal
        });
      }
    }

    return items;
  };

  const handleTceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readTceFileContent(file);
  };

  const readTceFileContent = (file: File) => {
    setTceImportMessage(null);
    const fileName = file.name.toLowerCase();

    // Check if filename contains acordao, acórdão or mapping to identify mappings file
    const isMapping = fileName.includes("acordao") || fileName.includes("acórdão") || fileName.includes("mapping");

    if (!fileName.startsWith("tce")) {
      setTceImportMessage(`Arquivo rejeitado! Para dados de TCE, o nome do arquivo deve obrigatoriamente começar com "tce" (ex: "tce_geral.csv" ou "tce_acordao.csv"). Você enviou: "${file.name}".`);
      return;
    }

    readAndDecodeFile(file, (text) => {
      if (text) {
        setTcePasteContent(text);
        if (isMapping) {
          const parsed = parseTceAcordaoMappingsCSV(text);
          setParsedTceMappingItems(parsed);
          setParsedTceItems(null);
          setTceImportMessage(`Arquivo de mapeamento lido com sucesso. Identificados ${parsed.length} vínculos TCE <=> Acórdão.`);
        } else {
          const parsed = parseTcesCSV(text);
          setParsedTceItems(parsed);
          setParsedTceMappingItems(null);
          setTceImportMessage(`Arquivo geral de TCE lido com sucesso. Identificadas ${parsed.length} instâncias de TCE.`);
        }
      }
    });
  };

  const handleExecuteTceImport = async () => {
    if (parsedTceItems && parsedTceItems.length > 0) {
      setIsSavingTce(true);
      if (onImportTces) {
        const res = await onImportTces(parsedTceItems);
        if (res && res.success) {
          setTceImportMessage(`Carga finalizada com sucesso! ${res.importedCount} novas TCEs inseridas e ${res.updatedCount} atualizadas.`);
          setParsedTceItems(null);
          setTcePasteContent("");
          if (onRefreshData) onRefreshData();
          setTimeout(() => {
            setShowTceImporter(false);
            setTceImportMessage(null);
          }, 3000);
        } else {
          alert("Ocorreu um erro ao importar dados de TCE.");
        }
      }
      setIsSavingTce(false);
    }
    else if (parsedTceMappingItems && parsedTceMappingItems.length > 0) {
      setIsSavingTce(true);
      if (onImportTceMappings) {
        const res = await onImportTceMappings(parsedTceMappingItems);
        if (res && res.success) {
          setTceImportMessage(`Gravação bem-sucedida de mapeamentos! ${res.importedCount} novos registros relacionados e ${res.updatedCount} vinculados retroativamente.`);
          setParsedTceMappingItems(null);
          setTcePasteContent("");
          if (onRefreshData) onRefreshData();
          setTimeout(() => {
            setShowTceImporter(false);
            setTceImportMessage(null);
          }, 3000);
        } else {
          alert("Ocorreu um erro ao importar mapeamentos de TCE.");
        }
      }
      setIsSavingTce(false);
    } else {
      setTceImportMessage("Nenhum dado pronto para sincronização. Por favor, carregue um arquivo válido começado com 'tce'.");
    }
  };

  const handleLocalSyncTce = async () => {
    setIsSyncingLocalTce(true);
    setSyncLocalTceMessage("Sincronizando arquivos de TCEs locais...");
    try {
      const response = await fetch('/api/tces/sync-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const res = await response.json();
      if (res && res.success) {
        setSyncLocalTceMessage(res.message);
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSyncLocalTceMessage(null), 4000);
      } else {
        setSyncLocalTceMessage(res?.message || "Erro na sincronização local de TCEs.");
        setTimeout(() => setSyncLocalTceMessage(null), 4000);
      }
    } catch (err: any) {
      setSyncLocalTceMessage(`Falha na sincronização local: ${err.message || "Erro de rede"}`);
      setTimeout(() => setSyncLocalTceMessage(null), 4000);
    } finally {
      setIsSyncingLocalTce(false);
    }
  };

  const handleExportTcesExcel = (filteredTcesList: TceDemand[]) => {
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #003366; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; vertical-align: top; }
          .even { background-color: #f8fafc; }
          .system-title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .system-subtitle { font-size: 11px; color: #64748b; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="system-title">ÓRBITA-AECI — SISTEMA DE CONTROLE INTERNO</div>
        <div class="system-subtitle">Relatório Geral de Tomadas de Contas Especiais (TCE) — Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
        <table>
          <thead>
            <tr>
              <th>NÚMERO/ANO (TCE)</th>
              <th>PROCESSO ADMINISTRATIVO</th>
              <th>MOTIVO DA INSTAURAÇÃO</th>
              <th>SUBMOTIVO DA INSTAURAÇÃO</th>
              <th>DÉBITO ORIGINAL</th>
              <th>DÉBITO ATUALIZADO COM JUROS</th>
              <th>DATA DA ATUALIZAÇÃO DO DÉBITO</th>
              <th>ÚLTIMO POSICIONAMENTO SUPERVISOR</th>
              <th>TC (PROCESSO TCU)</th>
              <th>ESTADO DO PROCESSO</th>
              <th>SITUAÇÃO DO PROCESSO</th>
              <th>PRIMEIRO JULGAMENTO</th>
              <th>ENCERRAMENTO</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredTcesList.forEach((tce, idx) => {
      const rowClass = idx % 2 === 0 ? "even" : "";
      excelTemplate += `
        <tr class="${rowClass}">
          <td style="mso-number-format:'\\@'; font-weight: bold; color: #1e293b;">${tce.NUMERO_ANO_TCE || ""}</td>
          <td style="mso-number-format:'\\@';">${tce.PROCESSO_ADMINISTRATIVO || ""}</td>
          <td>${tce.MOTIVO_INSTAURACAO || ""}</td>
          <td>${tce.SUBMOTIVO_INSTAURACAO || ""}</td>
          <td>${tce.DEBITO_ORIGINAL || ""}</td>
          <td>${tce.DEBITO_ATUALIZADO || ""}</td>
          <td>${tce.DATA_ATUALIZACAO_DEBITO || ""}</td>
          <td>${tce.ULTIMO_POSICIONAMENTO || ""}</td>
          <td style="mso-number-format:'\\@';">${tce.TC || ""}</td>
          <td>${tce.ESTADO_PROCESSO || ""}</td>
          <td>${tce.SITUACAO_PROCESSO || ""}</td>
          <td>${tce.PRIMEIRO_JULGAMENTO || ""}</td>
          <td>${tce.ENCERRAMENTO || ""}</td>
        </tr>
      `;
    });

    excelTemplate += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORBITA_AECI_TCE_GERAL_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const findMatchedAcordao = (ref: string) => {
    if (!ref) return null;
    const cleanedRef = ref.trim().toLowerCase();

    let matched = acordaos.find(ac => ac.KEY.toLowerCase() === cleanedRef);
    if (matched) return matched;

    const numYearRegex = /(\d+)[\/\-](\d{4})/;
    const match = ref.match(numYearRegex);
    if (match) {
      const num = parseInt(match[1]);
      const year = parseInt(match[2]);
      matched = acordaos.find(ac => ac.NUMACORDAO === num && ac.ANOACORDAO === year);
      if (matched) return matched;
    }

    matched = acordaos.find(ac =>
      ac.KEY.toLowerCase().includes(cleanedRef) ||
      ac.TITULO.toLowerCase().includes(cleanedRef) ||
      ac.NUMACORDAO.toString() === cleanedRef
    );
    return matched;
  };

  const handleExportTcesAcordaosExcel = (list: any[]) => {
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #1351b4; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; vertical-align: top; }
          .even { background-color: #f8fafc; }
          .system-title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .system-subtitle { font-size: 11px; color: #64748b; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="system-title">ÓRBITA-AECI — SISTEMA DE CONTROLE INTERNO</div>
        <div class="system-subtitle">Mapeamento de TCEs com Acórdãos do TCU — Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
        <table>
          <thead>
            <tr>
              <th>NÚMERO/ANO (TCE)</th>
              <th>PROCESSO ADMINISTRATIVO (PA)</th>
              <th>DÉBITO ATUALIZADO</th>
              <th>MOTIVO DA INSTAURAÇÃO</th>
              <th>TC (PROCESSO TCU)</th>
              <th>ACÓRDÃO VINCULADO (REFERÊNCIA)</th>
              <th>CHAVE ACÓRDÃO (REPOSITÓRIO)</th>
              <th>TÍTULO DO ACÓRDÃO</th>
              <th>COLEGIADO</th>
              <th>DATA SESSÃO</th>
            </tr>
          </thead>
          <tbody>
    `;

    list.forEach((item, idx) => {
      const rowClass = idx % 2 === 0 ? "even" : "";
      const tceNum = item.tce?.NUMERO_ANO_TCE || item.mapping.NUMERO_ANO_TCE;
      const tcePA = item.tce?.PROCESSO_ADMINISTRATIVO || "";
      const tceDebito = item.tce?.DEBITO_ATUALIZADO || "";
      const tceMotivo = item.tce?.MOTIVO_INSTAURACAO || "";
      const tceTC = item.tce?.TC || "";
      const mappingRef = item.mapping.ACORDAO_KEY;
      const acKey = item.acordao?.KEY || "Não Encontrado na Base";
      const acTitle = item.acordao?.TITULO || "Nenhum acórdão correspondente encontrado para este mapeamento";
      const acColegiado = item.acordao?.COLEGIADO || "";
      const acSessao = item.acordao?.DATASESSAO || "";

      excelTemplate += `
        <tr class="${rowClass}">
          <td style="mso-number-format:'\\@'; font-weight: bold;">${tceNum}</td>
          <td style="mso-number-format:'\\@';">${tcePA}</td>
          <td>${tceDebito}</td>
          <td>${tceMotivo}</td>
          <td style="mso-number-format:'\\@';">${tceTC}</td>
          <td style="mso-number-format:'\\@';">${mappingRef}</td>
          <td style="mso-number-format:'\\@';">${acKey}</td>
          <td>${acTitle}</td>
          <td>${acColegiado}</td>
          <td>${acSessao}</td>
        </tr>
      `;
    });

    excelTemplate += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORBITA_AECI_TCE_COM_ACORDAOS_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleComFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readComFileContent(file);
  };

  const readComFileContent = (file: File) => {
    setComImportMessage(null);
    const fileName = file.name.toLowerCase();
    if (!fileName.startsWith("comunicacoes") && !fileName.startsWith("comunicações")) {
      setComImportMessage(`Arquivo rejeitado! Para comunicações, o nome do arquivo deve obrigatoriamente começar com "comunicacoes" (ex: "comunicacoes.csv"). Você enviou: "${file.name}".`);
      return;
    }

    readAndDecodeFile(file, (text) => {
      if (text) {
        setComPasteContent(text);
        const parsed = parseCommunicationsCSV(text);
        setParsedComItems(parsed);
        setComImportMessage(`Arquivo lido com sucesso. Identificados ${parsed.length} ofícios/comunicações.`);
      }
    });
  };


  const handleExecuteComImport = async () => {
    if (!parsedComItems || parsedComItems.length === 0) {
      // If paste content exists but not parsed, parse it now
      const parsed = parseCommunicationsCSV(comPasteContent);
      if (parsed.length === 0) {
        setComImportMessage("Não foi possível identificar nenhuma comunicação válida no formato fornecido.");
        return;
      }
      setParsedComItems(parsed);
      setComImportMessage(`Identificadas ${parsed.length} comunicações na caixa de texto. Pronto para sincronizar.`);
      return;
    }

    setIsSavingCom(true);
    if (onImportComunicacoes) {
      const res = await onImportComunicacoes(parsedComItems);
      if (res && res.success) {
        setComImportMessage(`Sincronização concluída com sucesso! ${res.importedCount} novos registros adicionados e ${res.updatedCount} atualizados.`);
        setParsedComItems(null);
        setComPasteContent("");
        setTimeout(() => {
          setShowComImporter(false);
          setComImportMessage(null);
        }, 4000);
      } else {
        alert("Erro no processo de sincronização.");
      }
    }
    setIsSavingCom(false);
  };

  const triggerComEdit = (item: ComunicacaoDemand) => {
    setEditingComItem(item);
    setEditComDestinatario(item.DESTINATARIO);
    setEditComContato(item.CONTATO);
    setEditComUnidade(item.UNIDADE_EMITENTE);
    setEditComProcesso(item.PROCESSO);
    setEditComExpedicao(item.DATA_EXPEDICAO);
    setEditComResposta(item.DATA_RESPOSTA || "");
    setEditComCarece(item.CARECE_RESPOSTA !== false);
    setEditComUnidadeExecutora(item.UNIDADE_EXECUTORA || "");
    setEditComProcessoSei(item.PROCESSO_SEI || "");
    setEditComDestinacao(item.DESTINACAO || "RESPOSTA");
  };

  const saveComEdit = async () => {
    if (!editingComItem || !onUpdateComunicacao) return;

    setIsSavingCom(true);
    const updated: ComunicacaoDemand = {
      ...editingComItem,
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

    const success = await onUpdateComunicacao(updated);
    if (success) {
      setEditingComItem(null);
    } else {
      alert("Erro ao salvar alterações da comunicação.");
    }
    setIsSavingCom(false);
  };

  const toggleCareceResposta = async (item: ComunicacaoDemand) => {
    if (!onUpdateComunicacao) return;
    const updated: ComunicacaoDemand = {
      ...item,
      CARECE_RESPOSTA: item.CARECE_RESPOSTA === false ? true : false
    };
    await onUpdateComunicacao(updated);
  };

  // Open Edit Dialog
  const handleOpenEdit = (ac: AcordaoDemand) => {
    setSelectedAcordao(ac);
    setEditStatus(ac.STATUS_MONITORAMENTO);
    setEditResponsavel(ac.RESPONSAVEL_INTERNO || "");
    setEditPrazo(ac.PRAZO_LIMITE || "");
    setEditObs(ac.OBSERVACOES || "");
    setIsEditing(true);
  };

  // Save Edit Dialog
  const handleSaveEdit = async () => {
    if (!selectedAcordao) return;

    const updated: AcordaoDemand = {
      ...selectedAcordao,
      STATUS_MONITORAMENTO: editStatus,
      RESPONSAVEL_INTERNO: editResponsavel,
      PRAZO_LIMITE: editPrazo,
      OBSERVACOES: editObs
    };

    const success = await onUpdateAcordao(updated);
    if (success) {
      setSelectedAcordao(updated);
      setIsEditing(false);
    }
  };

  // RFC 4180 compliant CSV parser that handles multiline fields (critical for ACORDAO inteiro teor)
  // This parser reads character-by-character instead of splitting by newline first,
  // so quoted fields containing line breaks are preserved intact.
  const parseCSVRobust = (csvText: string, delimiter: string): string[][] => {
    const rows: string[][] = [];
    let currentField = "";
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"'; // escaped quote ""
          i++; // skip next quote
        } else if (char === '"') {
          // Check if this quote is followed by delimiter, newline, carriage return, or EOF
          const isEndOfField =
            nextChar === delimiter ||
            nextChar === '\r' ||
            nextChar === '\n' ||
            nextChar === undefined;

          if (isEndOfField) {
            inQuotes = false; // end of quoted field
          } else {
            currentField += '"'; // unescaped quote inside HTML or text field
          }
        } else {
          currentField += char; // preserve everything inside quotes, including newlines
        }
      } else {
        if (char === '"') {
          inQuotes = true; // start quoted field
        } else if (char === delimiter) {
          currentRow.push(currentField.trim());
          currentField = "";
        } else if (char === '\r' && nextChar === '\n') {
          currentRow.push(currentField.trim());
          if (currentRow.length > 0) rows.push(currentRow);
          currentRow = [];
          currentField = "";
          i++; // skip \n after \r
        } else if (char === '\n') {
          currentRow.push(currentField.trim());
          if (currentRow.length > 0) rows.push(currentRow);
          currentRow = [];
          currentField = "";
        } else {
          currentField += char;
        }
      }
    }
    // Push last field/row
    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f.length > 0)) rows.push(currentRow);
    }
    return rows;
  };

  // Fuzzy header matching: strips accents, spaces, underscores and special chars for comparison.
  // This fixes TIPOPROCESSO not matching when CSV has "TIPO PROCESSO", "TIPO_PROCESSO", "TIPO DE PROCESSO", etc.
  const normalizeHeaderName = (h: string): string => {
    return (h || "").toUpperCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
      .replace(/[^A-Z0-9]/g, ""); // remove spaces, underscores, special chars
  };

  const findHeaderIdx = (normalizedHeaders: string[], ...candidates: string[]): number => {
    // 1. Try exact matches first
    for (const candidate of candidates) {
      const cleanCandidate = normalizeHeaderName(candidate);
      const idx = normalizedHeaders.findIndex(h => h === cleanCandidate);
      if (idx !== -1) return idx;
    }
    // 2. Try partial/includes matches only as fallback
    for (const candidate of candidates) {
      const cleanCandidate = normalizeHeaderName(candidate);
      const idx = normalizedHeaders.findIndex(h => h.includes(cleanCandidate));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Trigger Portal da Transparência related docs checking
  const handleVerifyRessarcimentoDirect = async (docNum: string, ac: AcordaoDemand) => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      // Integração direta com API Docker local (Porta 8080)
      let response;
      try {
        response = await fetch("http://localhost:8080/api/siafi/consultar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: ac.KEY, cpf_cnpj: docNum })
        });
      } catch (dockerErr) {
        console.warn("API Docker em localhost:8080 não acessível. Tentando fallback local (server.ts).", dockerErr);
      }

      // Se a resposta for 404/500 ou der erro de rede, usar fallback
      if (!response || !response.ok) {
        response = await fetch("/api/acordaos/verificar-ressarcimento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: ac.KEY, documentoNumero: docNum })
        });
      }

      const data = await response.json();
      if (data.success) {
        setVerifyResult(data);
        const updated = data.updatedAcordaos ? data.updatedAcordaos.find((x: any) => x.KEY === ac.KEY) : ac;
        if (updated && onUpdateAcordao) {
          onUpdateAcordao(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyRessarcimento = async (ac: AcordaoDemand) => {
    if (!docVerifyInput.trim()) return;
    await handleVerifyRessarcimentoDirect(docVerifyInput, ac);
  };

  const handleSearchFavorecido = async (ac: AcordaoDemand) => {
    if (!favorecidoInput.trim()) return;
    setIsSearchingFavorecido(true);
    setFavorecidoDocsResult(null);
    try {
      const response = await fetch("/api/acordaos/verificar-ressarcimento-favorecido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: ac.KEY, codigoFavorecido: favorecidoInput })
      });
      const data = await response.json();
      if (data.success) {
        setFavorecidoDocsResult(data.docs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingFavorecido(false);
    }
  };

  const handleBatchProcessAi = async () => {
    // 1. Encontrar todos os acórdãos que ainda não possuem dossieRessarcimento
    // ou que possuem dossiê vazio (tentativa anterior falhou) E tem possível débito no texto
    const pendentes = acordaos.filter(ac => {
      const isMissing = !ac.aiAnalysisData?.dossieRessarcimento;
      const isEmpty = ac.aiAnalysisData?.dossieRessarcimento?.length === 0;
      const hasDebtText = /\b(condenar.*?em débito|tesouro nacional|recolhimento aos cofres)\b/.test(((ac.SUMARIO || "") + " " + (ac.ACORDAO || "")).toLowerCase());

      return isMissing || (isEmpty && hasDebtText);
    });

    if (pendentes.length === 0) {
      alert("Todos os Acórdãos já possuem Dossiê IA gerado!");
      return;
    }

    const confirmar = window.confirm(`Foram encontrados ${pendentes.length} Acórdãos pendentes de extração em lote.\n\nO processamento ocorrerá de forma instantânea através do nosso Agente Nativo local, sem limites ou bloqueios.\n\nDeseja iniciar?`);
    if (!confirmar) return;

    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: pendentes.length });

    for (let i = 0; i < pendentes.length; i++) {
      const ac = pendentes[i];
      setBatchProgress({ current: i + 1, total: pendentes.length });

      let success = false;
      let retryCount = 0;

      while (!success && retryCount < 5) {
        try {
          const response = await fetch(`/api/acordaos/${ac.KEY}/analisar-ressarcimento`, {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          });

          if (response.status === 429) {
            console.warn(`Rate limit hit on item ${i + 1}. Waiting 62 seconds before retry...`);
            await new Promise(r => setTimeout(r, 62000));
            retryCount++;
            continue;
          }

          const data = await response.json();

          if (data.success) {
            success = true;
            const updatedAc = { ...ac };
            if (!updatedAc.aiAnalysisData) updatedAc.aiAnalysisData = {} as any;
            (updatedAc.aiAnalysisData as any).dossieRessarcimento = data.dossie;
            if (data.checklist) {
              updatedAc.aiAnalysisData.determinacoes = data.checklist.determinacoes || [];
              updatedAc.aiAnalysisData.recomendacoes = data.checklist.recomendacoes || [];
              updatedAc.aiAnalysisData.darCiencia = data.checklist.darCiencia || [];
              updatedAc.aiAnalysisData.determinaArquivamento = !!data.checklist.determinaArquivamento;
            }
            const hasRessarcimento = data.dossie.some((r: any) => r.siafiEncontrados && r.siafiEncontrados.some((s: any) => s.confirmado === true));
            if (hasRessarcimento) {
              updatedAc.STATUS_MONITORAMENTO = "Cumprido";
              updatedAc.OBSERVACOES = "[Atualização Automática IA]: Ressarcimento identificado nos dados do SIAFI.";
            }

            // Call API directly to save without triggering full re-render on every loop
            await fetch("/api/acordaos/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedAc)
            });
          } else {
            console.error(`Falha no Acórdão ${ac.KEY}:`, data.error);
            if (data.error && data.error.includes("429")) {
              console.warn(`Rate limit hit on item ${i + 1}. Waiting 62 seconds before retry...`);
              await new Promise(r => setTimeout(r, 62000));
              retryCount++;
            } else {
              break; // Stop retry on non-429 error
            }
          }
        } catch (err) {
          console.error(`Erro ao processar lote no Acórdão ${ac.KEY}:`, err);
          alert(`Erro de conexão ao processar o item ${i + 1}. O lote foi pausado para evitar perda de dados.`);
          break; // Stop the retry on network error!
        }
      }

      // Evitar que o sistema faça logout por inatividade
      window.dispatchEvent(new Event('mousemove'));

      // Pequeno respiro pro React atualizar a barra de progresso
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
    }

    if (onSyncLocalAcordaos) {
      await onSyncLocalAcordaos();
    }

    setIsBatchProcessing(false);
    alert("✨ Processamento em Lote concluído com sucesso!");
  };

  const handleAnalyzeDossieAI = async (ac: AcordaoDemand) => {
    setIsAnalyzingAi(prev => ({ ...prev, [ac.KEY]: true }));
    try {
      const response = await fetch(`/api/acordaos/${ac.KEY}/analisar-ressarcimento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.success) {
        const updatedAc = { ...ac };
        if (!updatedAc.aiAnalysisData) updatedAc.aiAnalysisData = {} as any;
        (updatedAc.aiAnalysisData as any).dossieRessarcimento = data.dossie;

        if (data.checklist) {
          updatedAc.aiAnalysisData.determinacoes = data.checklist.determinacoes || [];
          updatedAc.aiAnalysisData.recomendacoes = data.checklist.recomendacoes || [];
          updatedAc.aiAnalysisData.darCiencia = data.checklist.darCiencia || [];
          updatedAc.aiAnalysisData.determinaArquivamento = !!data.checklist.determinaArquivamento;
        }

        // Se a IA encontrou pagamento, também muda o status (mesma lógica do backend)
        const hasRessarcimento = data.dossie.some((r: any) => r.siafiEncontrados && r.siafiEncontrados.some((s: any) => s.confirmado === true));
        if (hasRessarcimento) {
          updatedAc.STATUS_MONITORAMENTO = "Cumprido";
          updatedAc.OBSERVACOES = "[Atualização Automática IA]: Ressarcimento identificado nos dados do SIAFI.";
        }

        if (onUpdateAcordao) {
          await onUpdateAcordao(updatedAc);
        }
      } else {
        alert(data.error || "Falha na análise.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao comunicar com o servidor de Inteligência Artificial.");
    } finally {
      setIsAnalyzingAi(prev => ({ ...prev, [ac.KEY]: false }));
    }
  };



  // Helper to extract CPFs/CNPJs from the acórdão full text and interested list
  const getAcordaoIdentifiers = (ac: AcordaoDemand) => {
    const text = `${ac.ACORDAO || ""} ${ac.INTERESSADOS || ""}`;
    const cpfRegex = /(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\*\*\*\.\d{3}\.\d{3}-\*\*)/g;
    const cnpjRegex = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g;

    const cpfs = text.match(cpfRegex) || [];
    const cnpjs = text.match(cnpjRegex) || [];

    return Array.from(new Set([...cpfs, ...cnpjs]));
  };

  const isIdentifierInList = (input: string, list: string[]) => {
    const cleanInput = input.replace(/[^0-9]/g, "");
    if (!cleanInput) return false;

    for (const id of list) {
      const cleanId = id.replace(/[^0-9]/g, "");
      if (cleanId.length === cleanInput.length && cleanId === cleanInput) {
        return true;
      }
      if (id.includes("*")) {
        const middleDigits = cleanInput.slice(3, 9);
        if (cleanId === middleDigits) {
          return true;
        }
      }
    }
    return false;
  };

  // Trigger Local Sync Action
  const handleLocalSync = async () => {
    setIsSyncingLocal(true);
    setSyncLocalMessage(null);
    setLocalSyncReport(null);

    try {
      const res = await onSyncLocalAcordaos();
      if (res && res.success) {
        setSyncLocalMessage(res.message);
        setLocalSyncReport(res.report || []);
      } else {
        setSyncLocalMessage(res?.message || "Erro na sincronização local de acórdãos.");
      }
    } catch (err: any) {
      setSyncLocalMessage(`Falha na sincronização local: ${err.message || "Erro de rede"}`);
    } finally {
      setIsSyncingLocal(false);
    }
  };



  // Extract unique sorted list of years from the acórdãos
  const availableYears = Array.from(
    new Set(acordaos.map(ac => ac.ANOACORDAO).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  // Extract unique list of process types
  const availableTiposProcesso = Array.from(
    new Set(acordaos.map(ac => ac.TIPOPROCESSO).filter(Boolean))
  ).sort() as string[];

  const availableTceStatus = Array.from(
    new Set(tces.map(t => t.ESTADO_PROCESSO).filter(Boolean))
  ).sort() as string[];

  const hasValoresARessarcir = (ac: AcordaoDemand) => {
    if (ac.aiAnalysisData && ac.aiAnalysisData.temDebitoFinanceiro !== undefined) {
      return ac.aiAnalysisData.temDebitoFinanceiro;
    }
    if (tceMappings && tceMappings.length > 0) {
      const isMapped = tceMappings.some(m => m.ACORDAO_KEY && (
        (ac.NUMACORDAO && m.ACORDAO_KEY.includes(ac.NUMACORDAO.toString())) ||
        (ac.KEY && m.ACORDAO_KEY.includes(ac.KEY))
      ));
      if (isMapped) return true;
    }
    const textToScan = ((ac.SUMARIO || "") + " " + (ac.ACORDAO || "")).toLowerCase();
    return /\b(condenar.*?em débito|tesouro nacional|recolhimento aos cofres)\b/.test(textToScan);
  };

  const hasRecomendacoes = (ac: AcordaoDemand) => {
    if (ac.aiAnalysisData) return ac.aiAnalysisData.recomendacoes.length > 0 || ac.aiAnalysisData.determinacoes.length > 0;
    return !!ac.RECOMENDACOES_DETERMINACOES_UNIFICADO && ac.RECOMENDACOES_DETERMINACOES_UNIFICADO !== "Nenhuma recomendação ou determinação registrada.";
  };

  // Filter logic
  const filteredAcordaos = acordaos.filter(ac => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      ac.TITULO.toLowerCase().includes(term) ||
      (ac.PROC && ac.PROC.toLowerCase().includes(term)) ||
      (ac.INTERESSADOS && ac.INTERESSADOS.toLowerCase().includes(term)) ||
      (ac.ASSUNTO && ac.ASSUNTO.toLowerCase().includes(term)) ||
      (ac.NUMACORDAO && ac.NUMACORDAO.toString().includes(term));

    const matchesStatus = statusFilter === "TODOS" || ac.STATUS_MONITORAMENTO === statusFilter;
    const matchesColegiado = colegiadoFilter === "TODOS" || ac.COLEGIADO.toLowerCase() === colegiadoFilter.toLowerCase();
    const matchesAno = anoFilter === "TODOS" || (ac.ANOACORDAO && ac.ANOACORDAO.toString() === anoFilter);
    const matchesPrazo = prazoFilter === "TODOS" || (
      prazoFilter === "COM_PRAZO" ? !!ac.PRAZO_LIMITE : !ac.PRAZO_LIMITE
    );
    const matchesTipoProcesso = tipoProcessoFilter === "TODOS" || ac.TIPOPROCESSO === tipoProcessoFilter;

    const matchesRessarcimento = ressarcimentoFilter === "TODOS" ||
      (ressarcimentoFilter === "COM_VALORES" ? hasValoresARessarcir(ac) :
        (ressarcimentoFilter === "SEM_VALORES" ? !hasValoresARessarcir(ac) :
          (ressarcimentoFilter === "PENDENTE_REGULARIZACAO" ?
            (ac.aiAnalysisData?.dossieRessarcimento?.length > 0 && ac.STATUS_MONITORAMENTO !== "Cumprido") : false
          )
        )
      );

    const matchesRecomendacao = recomendacaoFilter === "TODOS" ||
      (recomendacaoFilter === "COM_RECOMENDACAO" ? hasRecomendacoes(ac) : !hasRecomendacoes(ac));

    return matchesSearch && matchesStatus && matchesColegiado && matchesAno && matchesPrazo && matchesTipoProcesso && matchesRessarcimento && matchesRecomendacao;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredAcordaos.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAcordaos = filteredAcordaos.slice(startIndex, startIndex + itemsPerPage);

  const setPageSafe = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // EXPORT EXCEL (Fully styled HTML-based spreadsheet structure for formal corporate looks)
  const handleExportExcel = () => {
    let excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; }
          th { background-color: #1351b4; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 11px; vertical-align: top; }
          .even { background-color: #f8fafc; }
          .system-title { font-size: 16px; font-weight: bold; color: #0f172a; }
          .system-subtitle { font-size: 11px; color: #64748b; margin-bottom: 15px; }
          .badge-andamento { background-color: #fef3c7; color: #92400e; padding: 2px 5px; border-radius: 4px; font-weight: bold; }
          .badge-concluido { background-color: #d1fae5; color: #065f46; padding: 2px 5px; border-radius: 4px; font-weight: bold; }
          .badge-atrasado { background-color: #fee2e2; color: #991b1b; padding: 2px 5px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="system-title">ÓRBITA-AECI — SISTEMA DE CONTROLE INTERNO</div>
        <div class="system-subtitle">Relatório de Monitoramento TCU — Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
        <table>
          <thead>
            <tr>
              <th>Identificador (KEY)</th>
              <th>Título</th>
              <th>Acórdão Nº</th>
              <th>Ano</th>
              <th>Ata Nº</th>
              <th>Colegiado</th>
              <th>Data Sessão</th>
              <th>Processo Nº</th>
              <th>Situação do Acórdão</th>
              <th>Assunto MTE</th>
              <th>Status Monitoramento</th>
              <th>Responsável Interno</th>
              <th>Prazo Limite</th>
            </tr>
          </thead>
          <tbody>
    `;

    filteredAcordaos.forEach((ac, idx) => {
      const rowClass = idx % 2 === 0 ? "even" : "";
      let statusStyleClass = "badge-andamento";
      if (ac.STATUS_MONITORAMENTO === "Cumprido") {
        statusStyleClass = "badge-concluido";
      } else if (ac.STATUS_MONITORAMENTO === "Atrasado") {
        statusStyleClass = "badge-atrasado";
      }

      // Strip potential html tags or weird spacing
      const rawAssunto = (ac.ASSUNTO || "").replace(/<[^>]*>/g, '').replace(/"/g, '&quot;').replace(/\s+/g, ' ');
      const rawTitulo = (ac.TITULO || "Sem Título").replace(/<[^>]*>/g, '').replace(/"/g, '&quot;');

      excelTemplate += `
        <tr class="${rowClass}">
          <td style="mso-number-format:'\\@'; font-weight: bold; color: #1e293b;">${ac.KEY || ""}</td>
          <td>${rawTitulo}</td>
          <td>${ac.NUMACORDAO || ""}</td>
          <td>${ac.ANOACORDAO || ""}</td>
          <td>${ac.NUMATA || ""}</td>
          <td>${ac.COLEGIADO || ""}</td>
          <td>${ac.DATASESSAO || ""}</td>
          <td style="mso-number-format:'\\@';">${ac.PROC || ""}</td>
          <td>${ac.SITUACAO || ""}</td>
          <td>${rawAssunto}</td>
          <td><span class="${statusStyleClass}">${ac.STATUS_MONITORAMENTO || ""}</span></td>
          <td>${ac.RESPONSAVEL_INTERNO || "Não Atribuído"}</td>
          <td>${ac.PRAZO_LIMITE || "Sem Limite"}</td>
        </tr>
      `;
    });

    excelTemplate += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ORBITA_AECI_TCU_COMPILADO_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXPORT PDF (Activates Helper modal specifically configured to address iFrame Sandbox block)
  const handleExportPDF = () => {
    setShowPrintModal(true);
    // Attempt standard background call safely
    try {
      window.print();
    } catch (e) {
      console.warn("Direct window.print was restricted by iFrame Sandbox permissions. Handled via modal instruction overlay.");
    }
  };

  // Build a highly-formatted text summary package of active records to place in clipboard
  const handleCopyReportText = () => {
    let reportText = `SISTEMA ÓRBITA-AECI — MINISTÉRIO DO TRABALHO E EMPREGO\n`;
    reportText += `RELATÓRIO CONSOLIDADO DE MONITORAMENTO DE ACÓRDÃOS — TCU\n`;
    reportText += `Documento Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n`;
    reportText += `================================================================================\n\n`;

    filteredAcordaos.forEach((ac, idx) => {
      reportText += `[REGISTRO ${idx + 1}] COBRANÇA CONTROLE INTERNO: ${ac.KEY || "S/D"}\n`;
      reportText += `  • TÍTULO: ${ac.TITULO || "Não especificado"}\n`;
      reportText += `  • ACÓRDÃO: Nº ${ac.NUMACORDAO || ""}/${ac.ANOACORDAO || ""} — ${ac.COLEGIADO || ""}\n`;
      reportText += `  • ATA E DATA: Ata Nº ${ac.NUMATA || ""} — Sessão de ${ac.DATASESSAO || "S/D"}\n`;
      reportText += `  • PROCESSO REGISTRADO: ${ac.PROC || "Não informado"}\n`;
      reportText += `  • SITUAÇÃO NO TCU: ${ac.SITUACAO || ""}\n`;
      reportText += `  • ASSUNTO NO MTE: ${(ac.ASSUNTO || "").replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')}\n`;
      reportText += `  • STATUS GESTÃO INTERNA: ${ac.STATUS_MONITORAMENTO || "Em Andamento"}\n`;
      reportText += `  • RESPONSÁVEL INTERNO: ${ac.RESPONSAVEL_INTERNO || "Não Designado"}\n`;
      reportText += `  • PRAZO PARA RESPOSTA: ${ac.PRAZO_LIMITE || "Não definido"}\n`;
      reportText += `--------------------------------------------------------------------------------\n\n`;
    });

    reportText += `\nFim do relatório. Total de itens listados: ${filteredAcordaos.length}.\n`;
    reportText += `AECI / Ministério do Trabalho e Emprego — ÓRBITA-AECI.`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopySuccessAlert(true);
      setTimeout(() => setCopySuccessAlert(false), 3000);
    }).catch(err => {
      console.error("Erro ao copiar relatório formatado para a área de transferência: ", err);
    });
  };

  return (
    <div className="space-y-6 font-sans">


      {(() => {
        // Dynamic calculations
        const tceYears = Array.from(new Set([
          ...tces.map(t => extractYearFromTceString(t.NUMERO_ANO_TCE)),
          ...tceMappings.map(m => extractYearFromTceString(m.NUMERO_ANO_TCE))
        ])).filter(yr => yr >= 1990 && yr <= 2035).sort((a, b) => b - a);

        const totalOriginalDebito = tces.reduce((sum, item) => {
          if (!item.DEBITO_ORIGINAL) return sum;
          const cleaned = item.DEBITO_ORIGINAL.replace(/[^\d\,]/g, "").replace(",", ".");
          const num = parseFloat(cleaned);
          return sum + (isNaN(num) ? 0 : num);
        }, 0);

        const formattedTotalDebito = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalOriginalDebito);

        const totalTceCount = tces.length;
        const totalMappedCount = tceMappings.length;

        // Year-specific statistics helper for TCE
        const tcesForSelectedYear = tces.filter(t => {
          const tYear = extractYearFromTceString(t.NUMERO_ANO_TCE);
          return tceSelectedYear === "TODOS" || tYear.toString() === tceSelectedYear;
        });

        // Sum updated debits dynamically
        const sumUpdatedDebito = tcesForSelectedYear.reduce((sum, item) => {
          if (!item.DEBITO_ATUALIZADO) return sum;
          const cleaned = item.DEBITO_ATUALIZADO.replace(/[R$\s.]/g, "").replace(",", ".");
          const num = parseFloat(cleaned);
          return sum + (isNaN(num) ? 0 : num);
        }, 0);

        const formattedSelectedYearDebito = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sumUpdatedDebito);

        // Count linked & pending for chosen year
        const mappedTcesForYear = tcesForSelectedYear.filter(t =>
          tceMappings.some(m => m.NUMERO_ANO_TCE?.toLowerCase() === t.NUMERO_ANO_TCE?.toLowerCase())
        );
        const linkedCount = mappedTcesForYear.length;
        const pendingTceCount = tcesForSelectedYear.length - linkedCount;

        // Filtered General Lists
        const filteredTces = tces.filter(t => {
          const tYear = extractYearFromTceString(t.NUMERO_ANO_TCE);
          const matchesYear = tceSelectedYear === "TODOS" || tYear.toString() === tceSelectedYear;
          const matchesSearch = !tceSearchTerm ||
            (t.NUMERO_ANO_TCE || "").toLowerCase().includes(tceSearchTerm.toLowerCase()) ||
            (t.PROCESSO_ADMINISTRATIVO || "").toLowerCase().includes(tceSearchTerm.toLowerCase()) ||
            (t.MOTIVO_INSTAURACAO || "").toLowerCase().includes(tceSearchTerm.toLowerCase()) ||
            (t.SUBMOTIVO_INSTAURACAO || "").toLowerCase().includes(tceSearchTerm.toLowerCase()) ||
            (t.TC || "").toLowerCase().includes(tceSearchTerm.toLowerCase());

          const matchesStatus = tceFilterStatus === "TODOS" || t.ESTADO_PROCESSO === tceFilterStatus;

          let matchesVinculacao = true;
          if (tceFilterVinculacao === "VINCULADOS") {
            matchesVinculacao = tceMappings.some(m => m.NUMERO_ANO_TCE?.toLowerCase() === t.NUMERO_ANO_TCE?.toLowerCase());
          } else if (tceFilterVinculacao === "NAO_VINCULADOS") {
            matchesVinculacao = !tceMappings.some(m => m.NUMERO_ANO_TCE?.toLowerCase() === t.NUMERO_ANO_TCE?.toLowerCase());
          }

          return matchesYear && matchesSearch && matchesStatus && matchesVinculacao;
        });

        // Resolve Mappings side-by-side
        const resolvedMappings = tceMappings.map(m => {
          const matchedTce = tces.find(t => t.NUMERO_ANO_TCE?.trim().toLowerCase() === m.NUMERO_ANO_TCE?.trim().toLowerCase());
          const matchedAc = findMatchedAcordao(m.ACORDAO_KEY);
          return {
            mapping: m,
            tce: matchedTce,
            acordao: matchedAc
          };
        });

        const filteredMappings = resolvedMappings.filter(rm => {
          const year = rm.tce
            ? extractYearFromTceString(rm.tce.NUMERO_ANO_TCE)
            : (rm.acordao?.ANOACORDAO || extractYearFromTceString(rm.mapping.NUMERO_ANO_TCE));
          const matchesYear = tceSelectedYear === "TODOS" || (year && year.toString() === tceSelectedYear);

          const tceStr = rm.tce ? `${rm.tce.NUMERO_ANO_TCE} ${rm.tce.PROCESSO_ADMINISTRATIVO} ${rm.tce.MOTIVO_INSTAURACAO}` : "";
          const acStr = rm.acordao ? `${rm.acordao.KEY} ${rm.acordao.TITULO} ${rm.acordao.NUMACORDAO}` : "";
          const refStr = rm.mapping.ACORDAO_KEY;
          const fullText = `${tceStr} ${acStr} ${refStr}`.toLowerCase();

          const matchesSearch = !tceSearchTerm || fullText.includes(tceSearchTerm.toLowerCase());

          let matchesStatus = true;
          if (tceFilterStatus !== "TODOS") {
            matchesStatus = rm.tce ? rm.tce.ESTADO_PROCESSO === tceFilterStatus : false;
          }

          let matchesVinculacao = true;
          if (tceFilterVinculacao === "LOCALIZADOS") {
            matchesVinculacao = !!rm.acordao;
          } else if (tceFilterVinculacao === "NAO_LOCALIZADOS") {
            matchesVinculacao = !rm.acordao;
          }

          return matchesYear && matchesSearch && matchesStatus && matchesVinculacao;
        });

        // Pagination calculations
        const totalTcePages = Math.ceil(filteredTces.length / tceItemsPerPage);
        const paginatedTce = filteredTces.slice((tceCurrentPage - 1) * tceItemsPerPage, tceCurrentPage * tceItemsPerPage);

        const totalMappingPages = Math.ceil(filteredMappings.length / tceItemsPerPage);
        const paginatedMappings = filteredMappings.slice((tceCurrentPage - 1) * tceItemsPerPage, tceCurrentPage * tceItemsPerPage);

        return (
          <div className="space-y-6 animate-fade-in no-print">

            {/* TWO ELEGANT PRIMARY NAVIGATION SWITCHERS (Bento Card Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setTceActiveSubTab("geral");
                  setTceCurrentPage(1);
                  setTceFilterVinculacao("TODOS");
                  setShowTceImporter(false);
                }}
                className={`p-6 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group ${tceActiveSubTab === "geral"
                  ? "bg-gradient-to-br from-[#003366] to-[#0b4d8c] text-white border-transparent shadow-md ring-4 ring-blue-500/10"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/55 shadow-2xs"
                  }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/10 rounded-full -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition duration-300"></div>
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl ${tceActiveSubTab === "geral" ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-700"}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#003366] group-hover:text-amber-500 text-base tracking-tight transition-colors duration-200" style={{ color: tceActiveSubTab === "geral" ? "white" : undefined }}>Instâncias de TCE (Geral)</h3>
                    <p className={`text-xs ${tceActiveSubTab === "geral" ? "text-slate-100/90" : "text-slate-500"}`}>
                      Visualização unificada de todas as {totalTceCount} instâncias gerais registradas no banco de dados.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setTceActiveSubTab("com-acordaos");
                  setTceCurrentPage(1);
                  setTceFilterVinculacao("TODOS");
                  setShowTceImporter(false);
                }}
                className={`p-6 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group ${tceActiveSubTab === "com-acordaos"
                  ? "bg-gradient-to-br from-[#1351b4] to-[#1a64df] text-white border-transparent shadow-md ring-4 ring-blue-500/10"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50/55 shadow-2xs"
                  }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/10 rounded-full -mr-10 -mt-10 pointer-events-none group-hover:scale-110 transition duration-300"></div>
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl ${tceActiveSubTab === "com-acordaos" ? "bg-white/10 text-white" : "bg-emerald-50 text-emerald-700"}`}>
                    <Merge className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-[#003366] group-hover:text-amber-500 text-base tracking-tight transition-colors duration-200" style={{ color: tceActiveSubTab === "com-acordaos" ? "white" : undefined }}>TCEs com Acórdãos TCU</h3>
                    <p className={`text-xs ${tceActiveSubTab === "com-acordaos" ? "text-slate-100/90" : "text-slate-500"}`}>
                      Visualização cruzada e mapeamento de {totalMappedCount} responsabilidades com acórdãos de condenação do TCU.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Dynamic Year Tabs & KPIs Bento Grid (Standardized UX) */}
            <div className="flex border-b border-slate-150 no-print overflow-x-auto gap-1 pb-1 pt-2">
              <button
                onClick={() => { setTceSelectedYear("TODOS"); setTceCurrentPage(1); }}
                className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${tceSelectedYear === "TODOS"
                  ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                  : "text-slate-400 hover:text-slate-700"
                  }`}
              >
                Todos os Anos
              </button>
              {tceYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => { setTceSelectedYear(yr.toString()); setTceCurrentPage(1); }}
                  className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${tceSelectedYear === yr.toString()
                    ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                    : "text-slate-400 hover:text-slate-700"
                    }`}
                >
                  Ano {yr} {yr === 2026 && <span className="bg-emerald-200 text-emerald-900 text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1">Ativo</span>}
                </button>
              ))}
            </div>

            {/* Statistics bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate block">Universo de TCE</span>
                  <h4 className="text-2xl font-black text-slate-900 truncate">{tcesForSelectedYear.length}</h4>
                  <p className="text-[10px] text-slate-500 truncate">Instâncias no ano ({tceSelectedYear === "TODOS" ? "Histórico Total" : tceSelectedYear})</p>
                </div>
                <div className="p-3 bg-blue-50 text-[#003366] rounded-xl shrink-0 ml-2">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate block">Débito Atualizado</span>
                  <h4 className="text-xl font-black text-slate-900 truncate" title={formattedSelectedYearDebito}>{formattedSelectedYearDebito}</h4>
                  <p className="text-[10px] text-slate-500 truncate">Montante acumulado no ano</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl shrink-0 ml-2">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate block">TCEs COM ACÓRDÃOS VINCULADOS</span>
                  <h4 className="text-2xl font-black text-emerald-700 truncate">{linkedCount}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold truncate">Vinculo com Acórdãos bem sucedidos</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl shrink-0 ml-2">
                  <Merge className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1 min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider truncate block">TCEs SEM ACÓRDAOS VINCULADOS</span>
                  <h4 className="text-2xl font-black text-rose-700 inline-flex items-center gap-1.5 animate-pulse font-sans truncate w-full">
                    {pendingTceCount}
                  </h4>
                  <p className="text-[10px] text-rose-600 font-semibold truncate">Aguardando vínculo</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl shrink-0 ml-2">
                  <FileWarning className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Contextual Importer Panel - Premium Bento Box Style */}
            {showTceImporter && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden no-print space-y-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 pointer-events-none opacity-40"></div>
                <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                      {tceActiveSubTab === "geral"
                        ? "Sincronização de Instâncias e Carga de TCE Geral"
                        : "Sincronização de Mapeamentos e Vínculos de Acórdãos"}
                    </h3>
                    <p className="text-xs text-slate-50 leading-relaxed max-w-4xl">
                      {tceActiveSubTab === "geral"
                        ? 'Arraste ou cole o conteúdo do arquivo CSV estruturado das TCEs gerais. O nome do arquivo físico deve iniciar com "tce" (ex: tces_geral.csv).'
                        : 'Arraste ou cole o arquivo de mapeamento de vínculos. Certifique-se de que o nome inclua as palavras "acordao" ou "mapping" (ex: tce_acordao_link.csv).'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTceImporter(false);
                      setTceImportMessage(null);
                      setParsedTceItems(null);
                      setParsedTceMappingItems(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Drag & Drop File Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOverTce(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragOverTce(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOverTce(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) readTceFileContent(file);
                    }}
                    onClick={() => document.getElementById("tce-file-import-input")?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition text-center cursor-pointer ${isDragOverTce
                      ? "border-[#003366] bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/55"
                      }`}
                  >
                    <input
                      type="file"
                      id="tce-file-import-input"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleTceFileChange}
                    />

                    <div className="p-3 bg-white rounded-full shadow-2xs mb-2 text-slate-500">
                      <FileUp className="w-6 h-6 text-[#003366]" />
                    </div>

                    <h4 className="text-xs font-bold text-slate-800">
                      {isDragOverTce ? "Pode soltar o arquivo!" : "Arraste um arquivo (.csv, .txt) ou clique aqui"}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                      Os dados da planilha serão processados localmente
                    </p>
                    <span className="mt-2 text-[9px] bg-[#003366] hover:bg-slate-900 text-white font-bold px-3 py-1 rounded-lg shadow-2xs">
                      {tceActiveSubTab === "geral" ? "Selecionar Planilha Geral" : "Selecionar Planilha Mapeamentos"}
                    </span>
                  </div>

                  {/* Textarea Area */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider mb-1 block">
                      Área de Texto para Colagem de Planilha
                    </label>
                    <textarea
                      placeholder={tceActiveSubTab === "geral"
                        ? "Cole os dados copiados do Excel das TCEs gerais..."
                        : "Cole os dados copiados do Excel do mapeamento TCE <=> Acórdão..."}
                      className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition"
                      value={tcePasteContent}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTcePasteContent(val);
                        if (val.trim()) {
                          if (val.toLowerCase().includes("acordao") || val.toLowerCase().includes("acórdão") || val.toLowerCase().includes("mapping")) {
                            const parsed = parseTceAcordaoMappingsCSV(val);
                            setParsedTceMappingItems(parsed);
                            setParsedTceItems(null);
                            setTceImportMessage(`Colagem identificada como planilha de mapeamento de acórdãos: ${parsed.length} itens parciais.`);
                          } else {
                            const parsed = parseTcesCSV(val);
                            setParsedTceItems(parsed);
                            setParsedTceMappingItems(null);
                            setTceImportMessage(`Colagem de instâncias gerais de TCE: ${parsed.length} itens parciais detectados.`);
                          }
                        }
                      }}
                      style={{ minHeight: "140px" }}
                    />
                  </div>
                </div>

                {tceImportMessage && (
                  <div className="p-3.5 bg-blue-50 border border-blue-100 text-[#003366] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#003366]" />
                    <span>{tceImportMessage}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 text-xs pt-1">
                  <button
                    onClick={() => {
                      setShowTceImporter(false);
                      setTceImportMessage(null);
                      setParsedTceItems(null);
                      setParsedTceMappingItems(null);
                    }}
                    className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 transition"
                  >
                    Mudar de Ideia
                  </button>
                  <button
                    onClick={handleExecuteTceImport}
                    disabled={isSavingTce || (!parsedTceItems && !parsedTceMappingItems)}
                    className="px-4 py-2 bg-[#003366] hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition duration-200"
                  >
                    {isSavingTce ? "Validando e Salvando..." : "Confirmar Sincronização no Banco"}
                  </button>
                </div>
              </div>
            )}

            {/* Edit TCE Modal Overlay */}
            {editingTceItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
                    <div>
                      <h3 className="text-base font-black text-[#003366] flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        Editar TCE: {editingTceItem.NUMERO_ANO_TCE}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Gerencie os detalhes e posicionamentos dessa Tomada de Contas Especial.</p>
                    </div>
                    <button
                      onClick={() => setEditingTceItem(null)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto custom-com-scroll-container space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Metadados Principais</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">SIAFI / Ressarcimento</label>
                          <label className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                            <input
                              type="checkbox"
                              checked={editTceSiafi}
                              onChange={(e) => setEditTceSiafi(e.target.checked)}
                              className="w-4 h-4 rounded text-[#003366] focus:ring-[#003366]"
                            />
                            <span className="text-xs font-semibold text-slate-700">Ressarcido no SIAFI</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">Último Posicionamento Técnico AECI</label>
                        <textarea
                          rows={4}
                          className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366] transition"
                          value={editTcePosicionamento}
                          onChange={(e) => setEditTcePosicionamento(e.target.value)}
                          placeholder="Adicione as últimas informações, andamento do processo ou parecer técnico..."
                        />
                        <p className="text-[10px] text-slate-500">Este texto será exibido como a última manifestação técnica nos cards de detalhes.</p>
                      </div>
                    </div>

                    <div className="h-px w-full bg-slate-100"></div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Merge className="w-3.5 h-3.5" />
                        Mapeamento Manual de Acórdão
                      </h4>
                      <p className="text-xs text-slate-600">Para vincular manualmente um Acórdão a esta TCE, digite a Chave do Acórdão (Ex: 1234/2023-Plenário).</p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Chave do Acórdão (Ex: 1234/2023-Plenário)"
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-[#1351b4]"
                          value={editTceAcordaoKey}
                          onChange={(e) => setEditTceAcordaoKey(e.target.value)}
                        />
                        <button
                          disabled={!editTceAcordaoKey.trim()}
                          onClick={async () => {
                            if (onAddTceMapping && editTceAcordaoKey.trim()) {
                              const ok = await onAddTceMapping(editingTceItem.NUMERO_ANO_TCE, editTceAcordaoKey.trim());
                              if (ok) {
                                alert("Mapeamento adicionado com sucesso!");
                                setEditTceAcordaoKey("");
                                if (onRefreshData) onRefreshData();
                              } else {
                                alert("Erro ao adicionar mapeamento. Verifique se o Acórdão existe.");
                              }
                            }
                          }}
                          className="px-4 py-2 bg-[#1351b4] hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          Vincular
                        </button>
                      </div>

                      {tceMappings.filter(m => m.NUMERO_ANO_TCE === editingTceItem.NUMERO_ANO_TCE).length > 0 && (
                        <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                            Vínculos Atuais
                          </div>
                          <ul className="divide-y divide-slate-100">
                            {tceMappings.filter(m => m.NUMERO_ANO_TCE === editingTceItem.NUMERO_ANO_TCE).map(m => (
                              <li key={m.ACORDAO_KEY} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                                <span className="font-mono text-[#003366] font-semibold">{m.ACORDAO_KEY}</span>
                                <button
                                  onClick={async () => {
                                    if (onDeleteTceMapping && confirm(`Remover o vínculo com o acórdão ${m.ACORDAO_KEY}?`)) {
                                      const ok = await onDeleteTceMapping(m.NUMERO_ANO_TCE, m.ACORDAO_KEY);
                                      if (ok && onRefreshData) {
                                        onRefreshData();
                                      }
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                                  title="Remover Vínculo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                    <button
                      onClick={() => setEditingTceItem(null)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        if (onUpdateTce) {
                          const updated = {
                            ...editingTceItem,
                            ULTIMO_POSICIONAMENTO: editTcePosicionamento,
                            SIAFI_RESSARCIDO: editTceSiafi
                          };
                          const ok = await onUpdateTce(updated);
                          if (ok) {
                            setEditingTceItem(null);
                          } else {
                            alert("Erro ao salvar informações da TCE.");
                          }
                        }
                      }}
                      className="px-5 py-2 bg-[#003366] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Row and Sync/Export Buttons */}
            <div className="bg-slate-100 p-2.5 rounded-2xl flex flex-col items-stretch md:flex-row md:items-center justify-between gap-3 shadow-3xs">
              <div className="flex gap-1.5 shrink-0">
                {syncLocalTceMessage && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 self-center">
                    {syncLocalTceMessage}
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLocalSyncTce}
                    disabled={isSyncingLocalTce}
                    className={`px-3.5 py-1.5 ${isSyncingLocalTce ? "bg-slate-800 text-white opacity-50" : "bg-[#003366] text-white hover:bg-[#002244]"} rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs`}
                    title="Sincronizar Arquivos Locais (data/tces)"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncingLocalTce ? "animate-spin" : ""}`} />
                    {isSyncingLocalTce ? "Sincronizando..." : "Sincronizar Arquivos Locais"}
                  </button>
                  {lastUpdateDate && (
                    <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                      Atualizado em: {lastUpdateDate}
                    </span>
                  )}
                </div>
              </div>
              {/* Real-time search and filter tools */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 grow max-w-xl self-end">
                <div className="relative grow">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Filtrar por nº, processo, culpado..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
                    value={tceSearchTerm}
                    onChange={(e) => {
                      setTceSearchTerm(e.target.value);
                      setTceCurrentPage(1);
                    }}
                  />
                </div>

                <select
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-[#003366] max-w-[150px]"
                  value={tceFilterStatus}
                  onChange={(e) => {
                    setTceFilterStatus(e.target.value);
                    setTceCurrentPage(1);
                  }}
                >
                  <option value="TODOS">Todas Situações</option>
                  {availableTceStatus.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-[#003366] max-w-[150px]"
                  value={tceFilterVinculacao}
                  onChange={(e) => {
                    setTceFilterVinculacao(e.target.value);
                    setTceCurrentPage(1);
                  }}
                >
                  {tceActiveSubTab === "geral" ? (
                    <>
                      <option value="TODOS">Todas Vinculações</option>
                      <option value="VINCULADOS">Apenas Vinculados</option>
                      <option value="NAO_VINCULADOS">Apenas Não Vinculados</option>
                    </>
                  ) : (
                    <>
                      <option value="TODOS">Todos Acórdãos Mapeados</option>
                      <option value="LOCALIZADOS">Acórdãos Localizados na Base</option>
                      <option value="NAO_LOCALIZADOS">Acórdãos Não Localizados</option>
                    </>
                  )}
                </select>

                <button
                  onClick={() => {
                    if (tceActiveSubTab === "geral") {
                      handleExportTcesExcel(filteredTces);
                    } else {
                      handleExportTcesAcordaosExcel(filteredMappings);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-sm cursor-pointer"
                >
                  <Download size={16} /> Excel
                </button>
              </div>
            </div>

            {/* ACTIVE TAB CONDITIONAL CONTENT */}
            {tceActiveSubTab === "geral" ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                {/* Status indicator rail */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 no-print">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#003366] animate-pulse"></span>
                    <span className="font-extrabold text-[#003366] uppercase tracking-wide">Instâncias de TCE (Geral): {filteredTces.length} registros</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Rolagem Vertical Contínua & Rolagem Lateral Ativas</span>
                </div>

                {/* TCE GENERAL LISTING TABLE */}
                <div className="overflow-x-auto overflow-y-auto max-h-[550px] custom-com-scroll-container bg-slate-50/20">
                  <table className="w-full text-left border-collapse table-auto text-xs min-w-[900px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                        <th className="p-4 w-8 no-print bg-slate-50"></th>
                        <th className="p-4 bg-slate-50">Nº / Ano (TCE)</th>
                        <th className="p-4 bg-slate-50">Processo TCU</th>
                        <th className="p-4 bg-slate-50">Assunto / Motivo da Instauração</th>
                        <th className="p-4 text-right bg-slate-50">Débito Atualizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredTces.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 font-sans">
                            Nenhuma tomada de conta especial corresponde aos filtros aplicados. Carregue novos dados via Planilha MTE.
                          </td>
                        </tr>
                      ) : (
                        filteredTces.map((tce, idx) => {
                          const tceId = tce.id || tce.NUMERO_ANO_TCE || `tce-${idx}`;
                          const isExpanded = tceExpandedId === tceId;
                          const hasMapping = tceMappings.some(m => m.NUMERO_ANO_TCE?.toLowerCase() === tce.NUMERO_ANO_TCE?.toLowerCase());

                          return (
                            <React.Fragment key={tceId}>
                              <tr className={`hover:bg-slate-50/55 transition duration-155 ${isExpanded ? "bg-slate-50/70" : ""}`}>
                                <td className="px-4 py-3.5 no-print">
                                  <button
                                    onClick={() => setTceExpandedId(isExpanded ? null : tceId)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition text-left"
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-450" />}
                                  </button>
                                </td>
                                <td className="px-5 py-3.5 font-bold text-slate-900">{tce.NUMERO_ANO_TCE}</td>
                                <td className="px-4 py-3.5 font-mono text-[11px] text-[#003366]">{tce.TC || "-"}</td>
                                <td className="px-4 py-3.5 max-w-xs truncate" title={tce.MOTIVO_INSTAURACAO}>
                                  <span className="font-semibold text-slate-900 block truncate">{tce.MOTIVO_INSTAURACAO}</span>
                                  <span className="text-[10px] text-slate-400 block truncate">{tce.SUBMOTIVO_INSTAURACAO}</span>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{tce.DEBITO_ATUALIZADO || "-"}</td>
                              </tr>

                              {/* Nested detail layout */}
                              {isExpanded && (
                                <tr className="bg-slate-50/55">
                                  <td colSpan={5} className="p-6 bg-slate-50 border-y border-slate-100 animate-fade-in text-xs">
                                    <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin space-y-5">

                                      {/* Top 4-column Meta Indicator Cards */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-1 relative group/card">
                                          <button
                                            onClick={() => {
                                              setEditingTceItem(tce);
                                              setEditTcePosicionamento(tce.ULTIMO_POSICIONAMENTO || "");
                                              setEditTceSiafi(tce.SIAFI_RESSARCIDO || false);
                                              setEditTceAcordaoKey("");
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="absolute top-2 right-2 text-slate-400 hover:text-[#003366] hover:bg-blue-50 p-1.5 rounded-lg transition opacity-0 group-hover/card:opacity-100"
                                            title="Editar TCE"
                                          >
                                            <Edit size={14} />
                                          </button>
                                          <span className="text-[9px] text-[#003366] font-black uppercase tracking-wider block pr-6">ID Registro / Chave</span>
                                          <span className="text-sm font-bold text-slate-800">{tce.NUMERO_ANO_TCE}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-1">
                                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Fase Processual</span>
                                          <span className="text-xs font-bold text-slate-700">{tce.ESTADO_PROCESSO || "Não Declarado"}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-1">
                                          <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Situação Atual</span>
                                          <span className="text-xs font-bold text-slate-700">{tce.SITUACAO_PROCESSO || "Não Declarada"}</span>
                                        </div>
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-1">
                                          <span className="text-[9px] text-[#1351b4] font-black uppercase tracking-wider block">Processo TCU</span>
                                          <span className="text-xs font-bold font-mono text-blue-900">{tce.TC || "Não Localizado"}</span>
                                        </div>
                                      </div>

                                      {/* Content Breakdown Layout */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                        {/* Process Identifiers */}
                                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-3xs space-y-3">
                                          <h5 className="text-[10px] font-black uppercase text-[#003366] border-b border-slate-100 pb-1.5">Identificadores e Prazos</h5>
                                          <div className="space-y-1.5 text-[11px] text-slate-600">
                                            <p><span className="font-bold text-slate-400">Processo MTE (PA):</span> <span className="font-mono text-slate-800">{tce.PROCESSO_ADMINISTRATIVO || "-"}</span></p>
                                            <p><span className="font-bold text-slate-400">Fato Gerador:</span> <span className="text-slate-800 font-medium">{tce.MOTIVO_INSTAURACAO || "-"}</span></p>
                                            <p><span className="font-bold text-slate-400">Enquadramento:</span> <span className="text-slate-600 block pl-2 border-l border-slate-100 mt-0.5">{tce.SUBMOTIVO_INSTAURACAO || "-"}</span></p>
                                          </div>
                                        </div>

                                        {/* Financial details */}
                                        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-3xs space-y-3">
                                          <h5 className="text-[10px] font-black uppercase text-[#003366] border-b border-slate-100 pb-1.5">Mapeamento de Valores</h5>
                                          <div className="space-y-1.5 text-[11px] text-slate-600 font-mono">
                                            <p><span className="font-bold font-sans text-slate-400">Débito Original:</span> <span className="text-slate-800 font-semibold">{tce.DEBITO_ORIGINAL || "R$ 0,00"}</span></p>
                                            <p><span className="font-bold font-sans text-slate-400">Débito Atualizado:</span> <span className="text-emerald-700 font-bold">{tce.DEBITO_ATUALIZADO || "-"}</span></p>
                                            <p><span className="font-bold font-sans text-slate-400">Data Atualização:</span> <span className="text-slate-600">{tce.DATA_ATUALIZACAO_DEBITO || "-"}</span></p>
                                            <p><span className="font-bold font-sans text-slate-400">Primeiro Julgamento:</span> <span className="text-slate-600 font-sans">{tce.PRIMEIRO_JULGAMENTO || "-"}</span></p>
                                            <p><span className="font-bold font-sans text-slate-400">Data Encerramento:</span> <span className="text-slate-600 font-sans">{tce.ENCERRAMENTO || "-"}</span></p>
                                          </div>
                                        </div>

                                        {/* Supervisor Technical Manifestation block */}
                                        <div className="bg-amber-50/15 p-4.5 rounded-2xl border border-amber-200/40 shadow-3xs space-y-2 col-span-1 md:col-span-1 flex flex-col justify-between">
                                          <div className="space-y-1.5">
                                            <h5 className="text-[10px] font-black uppercase text-amber-800">Último Posicionamento Técnico AECI</h5>
                                            <p className="text-[11px] text-slate-700 italic leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60 min-h-[70px]">
                                              “{tce.ULTIMO_POSICIONAMENTO || "Nenhum parecer técnico ou manifestação cadastrada de forma recente."}”
                                            </p>
                                          </div>
                                          <div className="text-[9px] text-slate-400 mt-2 font-mono flex items-center justify-between border-t border-amber-100/40 pt-2">
                                            <span>Estado TCU: <strong className="font-sans text-slate-600">{tce.ESTADO_PROCESSO || "Indefinido"}</strong></span>
                                            <span>Estado Mapeamento: <strong className="font-sans text-emerald-700">{hasMapping ? "Sincronizado" : "Pendente"}</strong></span>
                                          </div>
                                        </div>

                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                {/* Status indicator rail */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 no-print">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1351b4] animate-pulse"></span>
                    <span className="font-extrabold text-[#1351b4] uppercase tracking-wide">Mapeamentos TCE {"<=>"} Acórdão: {filteredMappings.length} registros</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Rolagem Vertical Contínua & Rolagem Lateral Ativas</span>
                </div>

                {/* MAPPED WITH ACORDAOS VIEW */}
                <div className="overflow-x-auto overflow-y-auto max-h-[550px] custom-com-scroll-container bg-slate-50/20">
                  <table className="w-full text-left border-collapse table-auto text-xs min-w-[1100px]">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                        <th className="p-4 w-8 no-print bg-slate-50"></th>
                        <th className="p-4 bg-slate-50">Nº TCE</th>
                        <th className="p-4 font-sans bg-slate-50">Processo TCU / Motivo</th>
                        <th className="p-4 bg-slate-50">Acórdão Mapeado (Referência)</th>
                        <th className="p-4 bg-slate-50">Chave Base Recente</th>
                        <th className="p-4 text-center bg-slate-50">Status Cruzamento</th>
                        <th className="p-4 pr-6 bg-slate-50">Colegiado / Data Sessão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredMappings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                            Nenhum mapeamento TCE {"<=>"} Acórdão corresponde aos termos digitados. Faça o upload do arquivo de sincronização de acórdãos TCU.
                          </td>
                        </tr>
                      ) : (
                        filteredMappings.map((item, idx) => {
                          const mappingId = `map-${item.mapping.NUMERO_ANO_TCE || idx}`;
                          const isExpanded = tceExpandedId === mappingId;
                          const isMatched = !!item.acordao;

                          return (
                            <React.Fragment key={idx}>
                              <tr className={`hover:bg-slate-50/55 transition duration-155 ${isExpanded ? "bg-slate-50/70" : ""}`}>
                                <td className="px-4 py-3.5 no-print">
                                  <button
                                    onClick={() => setTceExpandedId(isExpanded ? null : mappingId)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition text-left"
                                  >
                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-450" />}
                                  </button>
                                </td>
                                <td className="px-5 py-3.5 font-bold text-slate-900">{item.mapping.NUMERO_ANO_TCE}</td>
                                <td className="px-4 py-3.5 max-w-xs truncate">
                                  <span className="font-semibold text-slate-800 block truncate" title={item.tce?.MOTIVO_INSTAURACAO || "(Dados TCE Ausentes)"}>{item.tce?.MOTIVO_INSTAURACAO || "(Dados TCE Ausentes)"}</span>
                                  <span className="text-[10px] text-[#003366] font-mono block">{item.tce?.TC || "-"}</span>
                                </td>
                                <td className="px-4 py-3.5 font-semibold text-slate-900 italic text-[#1351b4]">{item.mapping.ACORDAO_KEY}</td>
                                <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">{item.acordao?.KEY || "Indefinida / Não Ingerido"}</td>
                                <td className="px-4 py-3.5 text-center">
                                  {isMatched ? (
                                    <span className="bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-wider px-2.2 py-0.5 rounded-full border border-emerald-200 inline-block text-center shadow-3xs">
                                      LOCALIZADO
                                    </span>
                                  ) : (
                                    <span className="bg-rose-50 text-rose-800 text-[9px] font-black uppercase tracking-wider px-2.2 py-0.5 rounded-full border border-rose-200 inline-block text-center" title="Importe este acórdão TCU no Monitoramento para completar os metadados do cruzamento">
                                      NÃO IMPORTADO
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 font-mono text-[11px] pr-6">
                                  {item.acordao ? `${item.acordao.COLEGIADO} • ${item.acordao.DATASESSAO}` : "-"}
                                </td>
                              </tr>

                              {/* Mapping Expanded Details */}
                              {isExpanded && (
                                <tr className="bg-slate-50/55">
                                  <td colSpan={7} className="p-6 bg-slate-50 border-y border-slate-100 animate-fade-in text-xs">
                                    <div className="max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                        {/* Left Panel: Complete TCE Data */}
                                        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-3xs space-y-4">
                                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <span className="bg-[#003366]/10 text-[#003366] text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                                              METADADOS COMPLETOS DA TCE
                                            </span>
                                            <span className="text-[10px] text-slate-400 hover:text-slate-600 font-mono">
                                              {item.tce?.TC || "-"}
                                            </span>
                                          </div>

                                          {item.tce ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-700">
                                              <div className="space-y-2">
                                                <p><span className="font-bold text-slate-400">Instância:</span> <span className="font-semibold text-slate-800">{item.tce.NUMERO_ANO_TCE}</span></p>
                                                <p><span className="font-bold text-slate-400">Processo MTE/PA:</span> <span className="font-mono text-slate-800">{item.tce.PROCESSO_ADMINISTRATIVO || "-"}</span></p>
                                                <p><span className="font-bold text-slate-400">Processo TCU:</span> <span className="font-mono text-slate-800">{item.tce.TC || "-"}</span></p>
                                                <p><span className="font-bold text-slate-400">Fato Gerador:</span> <span className="font-semibold text-slate-800">{item.tce.MOTIVO_INSTAURACAO || "-"}</span></p>
                                                <p><span className="font-bold text-slate-400">Submotivo:</span> <span className="text-slate-600 block pl-2 border-l border-slate-100 mt-0.5">{item.tce.SUBMOTIVO_INSTAURACAO || "-"}</span></p>
                                              </div>

                                              <div className="space-y-2">
                                                <p><span className="font-bold text-slate-400">Débito Original:</span> <span className="font-mono text-slate-800 font-semibold">{item.tce.DEBITO_ORIGINAL || "R$ 0,00"}</span></p>
                                                <p><span className="font-bold text-slate-400">Débito Atualizado:</span> <span className="font-mono text-slate-850 font-bold text-emerald-700">{item.tce.DEBITO_ATUALIZADO || "-"}</span></p>
                                                <p><span className="font-bold text-slate-400">Data Atualização:</span> <span className="text-slate-700 font-mono">{item.tce.DATA_ATUALIZACAO_DEBITO || "-"}</span></p>
                                                <p><span className="font-bold text-slate-400">Estado Processual:</span> <span className="font-semibold text-slate-800">{item.tce.ESTADO_PROCESSO || "-"}</span></p>
                                                <p><span className="font-bold text-slate-400">Situação Atual:</span> <span className="text-slate-600">{item.tce.SITUACAO_PROCESSO || "-"}</span></p>
                                              </div>

                                              <div className="col-span-1 md:col-span-2 space-y-1 bg-amber-50/20 p-3.5 rounded-xl border border-amber-200/40">
                                                <span className="text-[10px] font-bold text-amber-800 block uppercase">Último Posicionamento Técnico</span>
                                                <p className="italic text-slate-750 bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed text-[11px] min-h-[50px]">
                                                  {item.tce.ULTIMO_POSICIONAMENTO || "Nenhum parecer técnico recente cadastrado pelo supervisor."}
                                                </p>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="p-5 bg-slate-100/65 rounded-xl text-center text-slate-500 font-mono text-[11px] border border-dashed border-slate-200">
                                              Metadados gerais da TCE ausentes. Sincronize o arquivo de instâncias gerais de TCE para cruzar as informações completas.
                                            </div>
                                          )}
                                        </div>

                                        {/* Right Panel: Complete Acórdão Data */}
                                        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-3xs space-y-4">
                                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <span className="bg-[#1351b4]/10 text-[#1351b4] text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                                              DETALHES DO ACÓRDÃO TCU ASSOCIADO
                                            </span>
                                            <span className="text-[10px] font-bold text-[#1351b4] font-mono">
                                              {item.mapping.ACORDAO_KEY}
                                            </span>
                                          </div>

                                          {item.acordao ? (
                                            <div className="space-y-3.5 text-[11px] text-slate-700">
                                              <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Identificador Único</span>
                                                  <span className="font-mono text-slate-800 font-bold">{item.acordao.KEY}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Número / Colegiado</span>
                                                  <span className="font-semibold text-slate-800">Acórdão {item.acordao.NUMACORDAO}/{item.acordao.ANOACORDAO} — {item.acordao.COLEGIADO}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Ata & Sessão</span>
                                                  <span className="text-slate-800 font-medium">Ata {item.acordao.NUMATA || "S/N"} • {item.acordao.DATASESSAO || "S/D"}</span>
                                                </div>
                                                <div>
                                                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Autoridade Relatora</span>
                                                  <span className="text-slate-800 font-medium">{(item.acordao as any).RELATOR || "Não Especificado"}</span>
                                                </div>
                                              </div>

                                              <div className="border-t border-slate-100 pt-2.5 space-y-1">
                                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Assunto do Acórdão</span>
                                                <p className="text-slate-800 font-semibold">{item.acordao.ASSUNTO}</p>
                                              </div>

                                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Sumário de Julgamento (Jurisprudência)</span>
                                                <p className="text-slate-600 line-clamp-3 leading-relaxed mt-1 text-[11px]" title={item.acordao.TITULO}>
                                                  {item.acordao.TITULO}
                                                </p>
                                              </div>

                                              <div className="flex justify-end pt-2">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    handleViewFullText(item.acordao);
                                                  }}
                                                  className="px-4 py-2 bg-[#1351b4] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-3xs"
                                                >
                                                  <FileText className="w-4 h-4" />
                                                  Visualizar Inteiro Teor do Acórdão
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="p-5 bg-rose-50/20 border border-rose-100 rounded-xl space-y-3">
                                              <p className="text-[11px] text-slate-650 leading-relaxed">
                                                Este acórdão (<strong className="text-rose-800">{item.mapping.ACORDAO_KEY}</strong>) está mapeado para esta TCE, mas o teor oficial não foi localizado na base de dados do monitoramento de Acórdãos.
                                              </p>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (onNavigateToMonitoramento) {
                                                    onNavigateToMonitoramento(item.mapping.ACORDAO_KEY);
                                                  } else {
                                                    alert(`Por favor, acesse a aba "Monitoramento de Acórdãos" e busque por: ${item.mapping.ACORDAO_KEY}`);
                                                  }
                                                }}
                                                className="px-3.5 py-1.5 bg-[#003366] hover:bg-slate-900 text-white rounded-xl text-[10.5px] font-bold transition flex items-center gap-1.5 shadow-2xs"
                                              >
                                                <Search className="w-3.5 h-3.5" />
                                                Buscar e Importar Acórdão {item.mapping.ACORDAO_KEY}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="text-[10px] text-slate-400 text-center py-2 border-t border-slate-100 italic">
              Apoio Técnico Normativo: Corregedoria do Ministério do Trabalho e Emprego & Assessoria Especial de Controle Interno (AECI-MTE) • Acordo de Cooperação Técnica TCU
            </div>
          </div>
        );
      })()}
      {/* Print Sandbox Helper Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[100] no-print animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Relatório de Impressão (PDF)
                  </h3>
                  <p className="text-[10px] text-slate-500">Emissão de Relatório e Exportação Formal — AECI</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  Nota sobre visualização segura em Janelas Protegidas (iFrame)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Pelo sistema estar em ambiente de desenvolvimento interativo, o navegador pode restringir a geração direta de PDFs e popups de impressão internos do formulário.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed font-sans font-semibold">
                  💡 Para emitir o relatório oficial sem qualquer limitação técnica:
                </p>
                <ol className="list-decimal pl-5 text-[11px] text-slate-600 space-y-1 font-sans">
                  <li>Clique em <strong>"Abrir em nova aba"</strong> (no cabeçalho do portal) para isolar o sistema.</li>
                  <li>Use o botão <strong>"Tentar Acionar Impressora do Navegador"</strong> abaixo para salvar em PDF.</li>
                </ol>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => {
                    try {
                      window.print();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full py-3 px-4 bg-[#1351b4] hover:bg-[#0f4094] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Tentar Acionar Impressora do Navegador
                </button>

                <button
                  onClick={handleCopyReportText}
                  className={`w-full py-3 px-4 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border transition cursor-pointer ${copySuccessAlert
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  {copySuccessAlert ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Copiado com Sucesso! (Área de Transferência)
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-slate-500" />
                      Copiar Relatório Formatado (Para Word/Docs)
                    </>
                  )}
                </button>
              </div>

              {copySuccessAlert && (
                <p className="text-[10px] text-center text-emerald-700 font-bold bg-emerald-50/50 py-1.5 rounded-lg animate-pulse">
                  ✓ Texto formatado com as colunas estruturadas para colar no Bloco de Notas ou Word!
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Acórdão Text Modal Popup */}
      {fullTextAcordao && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-[100] no-print animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#1351b4] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider leading-none">
                    Acórdão {fullTextAcordao.NUMACORDAO}/{fullTextAcordao.ANOACORDAO} — {fullTextAcordao.COLEGIADO}
                  </h3>
                  <p className="text-[10px] text-blue-200 mt-1">Identificador Único: <span className="font-mono">{fullTextAcordao.KEY}</span> | Sessão de {fullTextAcordao.DATASESSAO}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFullTextAcordao(null);
                  setCopySuccessFullText(false);
                }}
                className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Info Panel */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider">Processo no TCU</span>
                <span className="text-xs text-slate-800 font-bold font-mono">{fullTextAcordao.PROC || "Não informado"}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider">Assunto Principal (MTE)</span>
                <span className="text-xs text-slate-700 font-semibold line-clamp-1">{fullTextAcordao.ASSUNTO || "Sem descrição"}</span>
              </div>
              <div className="flex justify-end items-center gap-2">

                <button
                  type="button"
                  onClick={() => {
                    const rawText = fullTextAcordao.ACORDAO || (fullTextAcordao as any).acordao || "O inteiro teor para este acórdão ainda não foi baixado.";
                    navigator.clipboard.writeText(rawText).then(() => {
                      setCopySuccessFullText(true);
                      setTimeout(() => setCopySuccessFullText(false), 2500);
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${copySuccessFullText
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                >
                  {copySuccessFullText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Copiar Inteiro Teor
                    </>
                  )}
                </button>
              </div>
            </div>



            {/* Modal Content Scroll Area */}
            <div className="p-6 overflow-y-auto bg-slate-950 text-slate-100 flex-1 font-mono text-[11.5px] whitespace-pre-line leading-relaxed scrollbar-thin">
              {fullTextAcordao.ACORDAO || (fullTextAcordao as any).acordao || "Este acórdão não possui a íntegra dos autos gravada."}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 font-sans">
                ÓRBITA-AECI — Assessoria Especial de Controle Interno
              </span>
              <button
                type="button"
                onClick={() => {
                  setFullTextAcordao(null);
                  setCopySuccessFullText(false);
                }}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
