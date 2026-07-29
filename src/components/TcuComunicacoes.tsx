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
  RefreshCw,
  Building2,
  ArrowLeftRight,
  Archive,
  Sparkles,
  Bot,
  Brain
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
  onClearOlderAcordaos?: () => Promise<any>;
  onResetDatabase?: () => Promise<any>;
  isLoading: boolean;
  onRefreshData?: () => Promise<void>;
}

export default function TcuComunicacoes({ 
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
  onClearOlderAcordaos,
  onResetDatabase,
  isLoading,
  onRefreshData
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
  const [isSyncingLocalCom, setIsSyncingLocalCom] = useState(false);
  const [syncLocalComMessage, setSyncLocalComMessage] = useState<string | null>(null);

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

  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);

  const fetchLastUpdateDate = async () => {
    try {
      const res = await fetch("/api/files/last-updates");
      if (res.ok) {
        const data = await res.json();
        if (data.data?.comunicacoes) setLastUpdateDate(data.data.comunicacoes);
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

  // TCE module states
  const [tceActiveSubTab, setTceActiveSubTab] = useState<"geral" | "com-acordaos">("geral");
  const [tceSelectedYear, setTceSelectedYear] = useState("TODOS");
  const [tceSearchTerm, setTceSearchTerm] = useState("");
  const [showTceImporter, setShowTceImporter] = useState(false);
  const [tcePasteContent, setTcePasteContent] = useState("");
  const [isDragOverTce, setIsDragOverTce] = useState(false);
  const [parsedTceItems, setParsedTceItems] = useState<TceDemand[] | null>(null);
  const [parsedTceMappingItems, setParsedTceMappingItems] = useState<TceAcordaoMapping[] | null>(null);
  const [isSavingTce, setIsSavingTce] = useState(false);
  const [tceImportMessage, setTceImportMessage] = useState<string | null>(null);
  const [tceExpandedId, setTceExpandedId] = useState<string | null>(null);
  const [tceCurrentPage, setTceCurrentPage] = useState(1);
  const tceItemsPerPage = 15;

  const [editingTceItem, setEditingTceItem] = useState<TceDemand | null>(null);
  const [editTcePosicionamento, setEditTcePosicionamento] = useState("");

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
        if (onRefreshData) onRefreshData();
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
            console.warn(`Rate limit hit on item ${i+1}. Waiting 62 seconds before retry...`);
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
            const hasRessarcimento = data.dossie.some((r:any) => r.siafiEncontrados && r.siafiEncontrados.some((s:any) => s.confirmado === true));
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
              console.warn(`Rate limit hit on item ${i+1}. Waiting 62 seconds before retry...`);
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
        const hasRessarcimento = data.dossie.some((r:any) => r.siafiEncontrados && r.siafiEncontrados.some((s:any) => s.confirmado === true));
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

  // Trigger Local Sync Action for Comunicacoes
  const handleLocalSyncCom = async () => {
    setIsSyncingLocalCom(true);
    setSyncLocalComMessage("Sincronizando comunicações locais...");
    try {
      const response = await fetch('/api/comunicacoes/sync-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const res = await response.json();
      if (res && res.success) {
        setSyncLocalComMessage(res.message);
        if (onRefreshData) await onRefreshData();
        setTimeout(() => setSyncLocalComMessage(null), 4000);
      } else {
        setSyncLocalComMessage(res?.message || "Erro na sincronização local de comunicações.");
        setTimeout(() => setSyncLocalComMessage(null), 4000);
      }
    } catch (err: any) {
      setSyncLocalComMessage(`Falha na sincronização local: ${err.message || "Erro de rede"}`);
      setTimeout(() => setSyncLocalComMessage(null), 4000);
    } finally {
      setIsSyncingLocalCom(false);
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
      
      

        <div className="space-y-6 animate-fade-in">



          {/* Core Analytics & Filtering */}
          {(() => {
            const allComs = comunicacoes || [];
            
            // Gather statistics on the fully loaded list of communications
            const currentYearInt = parseInt(comAnoFilter);
            const totalForSelectedYear = allComs.filter(x => comAnoFilter === "TODOS" || x.ANO === currentYearInt);
            const totalComsCount = totalForSelectedYear.length;
            const respondedCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false && typeof x.DATA_RESPOSTA === 'string' && x.DATA_RESPOSTA.trim() !== "").length;
            const pendingCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false && (typeof x.DATA_RESPOSTA !== 'string' || x.DATA_RESPOSTA.trim() === "")).length;
            const totalRequiredCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false).length;
            const responseRate = totalRequiredCount > 0 ? ((respondedCount / totalRequiredCount) * 100).toFixed(1) : "100.0";

            // Unidade Emitente counts for breakdown
            const emitentes: { [key: string]: number } = {};
            totalForSelectedYear.forEach(x => {
              const u = x.UNIDADE_EMITENTE || "OUTROS";
              emitentes[u] = (emitentes[u] || 0) + 1;
            });

            // Filtered Communications list
            const finalFiltered = totalForSelectedYear.filter(item => {
              const term = (comSearchTerm || "").toLowerCase();
              const matchesSearch = 
                (item.COMUNICACAO || "").toLowerCase().includes(term) ||
                (item.PROCESSO || "").toLowerCase().includes(term) ||
                (item.DESTINATARIO && item.DESTINATARIO.toLowerCase().includes(term)) ||
                (item.CONTATO && item.CONTATO.toLowerCase().includes(term)) ||
                (item.UNIDADE_EMITENTE && item.UNIDADE_EMITENTE.toLowerCase().includes(term));

              const matchesUnidade = comUnidadeFilter === "TODOS" || item.UNIDADE_EMITENTE === comUnidadeFilter;
              
              const carece = item.CARECE_RESPOSTA !== false;
              const hasResponse = !!item.DATA_RESPOSTA && item.DATA_RESPOSTA.trim() !== "";
              const matchesRespondido = 
                comRespondidoFilter === "TODOS" || 
                (comRespondidoFilter === "RESPONDIDO" && carece && hasResponse) ||
                (comRespondidoFilter === "PENDENTE" && carece && !hasResponse) ||
                (comRespondidoFilter === "NAO_EXIGIDO" && !carece);

              return matchesSearch && matchesUnidade && matchesRespondido;
            });

            // Recipient Statistics & Percentages
            const destinatarioStats = (() => {
              const statsMap: { [key: string]: { total: number; responded: number; pending: number; requireResponseTotal: number } } = {};
              
              totalForSelectedYear.forEach(com => {
                const dest = com.DESTINATARIO || "Geral / Não Especificado";
                if (!statsMap[dest]) {
                  statsMap[dest] = { total: 0, responded: 0, pending: 0, requireResponseTotal: 0 };
                }
                const carece = com.CARECE_RESPOSTA !== false;
                statsMap[dest].total++;
                if (carece) {
                  statsMap[dest].requireResponseTotal++;
                  if (com.DATA_RESPOSTA && com.DATA_RESPOSTA.trim() !== "") {
                    statsMap[dest].responded++;
                  } else {
                    statsMap[dest].pending++;
                  }
                }
              });

              return Object.entries(statsMap).map(([dest, info]) => {
                const pct = totalComsCount > 0 ? (info.total / totalComsCount) * 105 : 0; // scaled out of total
                const realPct = totalComsCount > 0 ? (info.total / totalComsCount) * 100 : 0;
                return {
                  unidade: dest,
                  total: info.total,
                  requireResponseTotal: info.requireResponseTotal,
                  responded: info.responded,
                  pending: info.pending,
                  percentage: realPct
                };
              }).sort((a, b) => b.total - a.total);
            })();

            // Dynamic year tabs
            const distinctYears = Array.from(new Set(allComs.map(x => x.ANO).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
            const uniqueUnidades = Array.from(new Set(allComs.map(x => x.UNIDADE_EMITENTE).filter(Boolean))).sort();

            const escapeXML = (str: string) => {
              return (str || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
            };

            const handleExportToExcel = () => {
              let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#1E293B"/>
   <Interior/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0F172A"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#003366" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Size="15" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Italic="1" ss:Size="10" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="SaneadoRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#15803D" ss:Size="10"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="PendenteRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#B45309" ss:Size="10"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="NaoExigidoRow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#475569" ss:Size="10"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="PctCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <NumberFormat ss:Format="0.0%"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Lote de Oficios">
  <Table ss:DefaultRowHeight="19">
   <Column ss:Width="130" />
   <Column ss:Width="80" />
   <Column ss:Width="200" />
   <Column ss:Width="160" />
   <Column ss:Width="120" />
   <Column ss:Width="120" />
   <Column ss:Width="120" />
   <Column ss:Width="100" />
   <Column ss:Width="90" />
   <Column ss:Width="90" />
   <Column ss:Width="130" />
   
   <Row ss:Height="28">
    <Cell ss:MergeAcross="10" ss:StyleID="Title">
     <Data ss:Type="String">MINISTÉRIO DO TRABALHO E EMPREGO — AECI</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="10" ss:StyleID="SubTitle">
     <Data ss:Type="String">Relatório Oficial de Ofícios e Respostas TCU • Filtro: ${comAnoFilter === "TODOS" ? "Histórico Completo" : `Ano ${comAnoFilter}`} • Exportado em: ${new Date().toLocaleString('pt-BR')}</Data>
    </Cell>
   </Row>
   <Row ss:Index="4" ss:Height="25" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Comunicação TCU</Data></Cell>
    <Cell><Data ss:Type="String">Emitente TCU</Data></Cell>
    <Cell><Data ss:Type="String">Destinatário MTE</Data></Cell>
    <Cell><Data ss:Type="String">Contato MTE</Data></Cell>
    <Cell><Data ss:Type="String">Processo TCU</Data></Cell>
    <Cell><Data ss:Type="String">Unidade Executora</Data></Cell>
    <Cell><Data ss:Type="String">Processo SEI</Data></Cell>
    <Cell><Data ss:Type="String">Destinação</Data></Cell>
    <Cell><Data ss:Type="String">Expedição</Data></Cell>
    <Cell><Data ss:Type="String">Resposta</Data></Cell>
    <Cell><Data ss:Type="String">Acompanhamento</Data></Cell>
   </Row>`;

              finalFiltered.forEach(item => {
                const carece = item.CARECE_RESPOSTA !== false;
                const hasResponse = !!item.DATA_RESPOSTA && item.DATA_RESPOSTA.trim() !== "";
                
                let stateText = "Não Precisa de Resposta";
                let rowStyle = "NaoExigidoRow";

                if (carece) {
                  stateText = hasResponse ? "Respondido" : "Aguardando Resposta";
                  rowStyle = hasResponse ? "SaneadoRow" : "PendenteRow";
                }

                xml += `
   <Row ss:Height="21">
    <Cell><Data ss:Type="String">${escapeXML(item.COMUNICACAO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.UNIDADE_EMITENTE)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DESTINATARIO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.CONTATO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.PROCESSO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.UNIDADE_EXECUTORA || "-")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.PROCESSO_SEI || "-")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DESTINACAO || "-")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DATA_EXPEDICAO)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(item.DATA_RESPOSTA || "-")}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${stateText}</Data></Cell>
   </Row>`;
              });

              xml += `
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Estatísticas Analíticas">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="280" />
   <Column ss:Width="95" />
   <Column ss:Width="95" />
   <Column ss:Width="95" />
   <Column ss:Width="110" />
   
   <Row ss:Height="28">
    <Cell ss:MergeAcross="4" ss:StyleID="Title">
     <Data ss:Type="String">IMPACTO DAS DEMANDAS POR DESTINATÁRIO (PARETO)</Data>
    </Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="4" ss:StyleID="SubTitle">
     <Data ss:Type="String">Participação das Unidades do MTE sobre o total de comunicações expedidas (${totalComsCount} ofícios no contexto) • Filtro: ${comAnoFilter}</Data>
    </Cell>
   </Row>
   <Row ss:Index="4" ss:Height="25" ss:StyleID="Header">
    <Cell><Data ss:Type="String">Unidade Destinatária</Data></Cell>
    <Cell><Data ss:Type="String">Ofícios Recebidos</Data></Cell>
    <Cell><Data ss:Type="String">Total Respondidos</Data></Cell>
    <Cell><Data ss:Type="String">Total Pendentes</Data></Cell>
    <Cell><Data ss:Type="String">% de Participação</Data></Cell>
   </Row>`;

              destinatarioStats.forEach(stat => {
                xml += `
   <Row ss:Height="21">
    <Cell><Data ss:Type="String">${escapeXML(stat.unidade)}</Data></Cell>
    <Cell><Data ss:Type="Number">${stat.total}</Data></Cell>
    <Cell><Data ss:Type="Number">${stat.responded}</Data></Cell>
    <Cell><Data ss:Type="Number">${stat.pending}</Data></Cell>
    <Cell ss:StyleID="PctCell"><Data ss:Type="Number">${(stat.percentage / 100).toFixed(4)}</Data></Cell>
   </Row>`;
              });

              xml += `
  </Table>
 </Worksheet>
</Workbook>`;

              const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `Relatorio_Comunicacoes_TCU_${comAnoFilter}_Formatado.xls`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            };

            return (
              <>
                {/* Statistics bento grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                  <div 
                    onClick={() => {
                      setComRespondidoFilter("TODOS");
                      setComSubTab("lista");
                    }}
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs hover:border-[#003366]/30 hover:bg-[#003366]/5 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Universo de Ofícios</span>
                      <h4 className="text-2xl font-black text-slate-900">{totalComsCount}</h4>
                     <p className="text-[10px] text-slate-500">Mapeados no ano ({comAnoFilter === "TODOS" ? "Histórico Total" : comAnoFilter})</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-[#003366] rounded-xl animate-fade-in">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setComRespondidoFilter("RESPONDIDO");
                      setComSubTab("lista");
                    }}
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Respondidos</span>
                      <h4 className="text-2xl font-black text-emerald-700">{respondedCount}</h4>
                      <p className="text-[10px] text-emerald-600 font-semibold">Ofícios com resposta salvas</p>
                    </div>
                    <div className="p-3 bg bg-emerald-50 text-emerald-700 rounded-xl animate-fade-in">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>

                  <div 
                    onClick={() => {
                      setComRespondidoFilter("PENDENTE");
                      setComSubTab("lista");
                    }}
                    className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs hover:border-amber-300 hover:bg-amber-50/50 transition cursor-pointer group"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider group-hover:text-amber-700 transition">Resposta Pendente</span>
                      <h4 className="text-2xl font-black text-amber-600 inline-flex items-center gap-1.5">
                        {pendingCount}
                        {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />}
                      </h4>
                      <p className="text-[10px] text-slate-500 group-hover:text-amber-800 transition">Aguardando instrução da assessoria</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl animate-fade-in group-hover:bg-amber-100 transition">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Índice de Resposta</span>
                      <h4 className="text-2xl font-black text-slate-900">{responseRate}%</h4>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 animate-fade-in">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${responseRate}%` }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-700 rounded-xl animate-fade-in">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Sub-emitters distribution badge rail */}
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 flex flex-wrap gap-2 items-center text-xs">
                  <span className="text-[10px] font-black text-[#003366] uppercase tracking-wider mr-1">Unidades Emitentes TCU:</span>
                  {Object.keys(emitentes).length === 0 ? (
                    <span className="text-slate-400 text-[11px]">Nenhuma unidade registrada neste período</span>
                  ) : (
                    Object.entries(emitentes).map(([unit, count]) => (
                      <span key={unit} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-slate-700 font-mono text-[10px] flex items-center gap-1">
                        <span>{unit}</span>
                        <span className="bg-[#003366] text-white px-1 rounded text-[9px] font-sans">{count}</span>
                      </span>
                    ))
                  )}
                </div>

                {/* Submodule View Selector: Tab Selection & Export */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/60 pb-1.5 pt-1.5 no-print">
                  <div className="flex gap-1.5 bg-slate-100/60 p-0.5 rounded-xl border border-slate-200/50">
                    <button
                      onClick={() => setComSubTab("lista")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 inline-flex items-center gap-1.5 ${
                        comSubTab === "lista"
                          ? "bg-white text-[#003366] shadow-sm font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Database className="w-3.5 h-3.5" />
                      Lote de Ofícios ({finalFiltered.length})
                    </button>
                    <button
                      onClick={() => setComSubTab("analytics")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 inline-flex items-center gap-1.5 ${
                        comSubTab === "analytics"
                          ? "bg-white text-[#003366] shadow-sm font-black"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Estatísticas por Destinatário ({destinatarioStats.length})
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {syncLocalComMessage && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        {syncLocalComMessage}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleLocalSyncCom}
                        disabled={isSyncingLocalCom}
                        className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#003366] rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-150 shadow-xs"
                        title="Sincronizar Arquivos Locais (data/comunicacoes)"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingLocalCom ? "animate-spin" : ""}`} />
                        {isSyncingLocalCom ? "Sincronizando..." : "Sincronizar Arquivos Locais"}
                      </button>
                      {lastUpdateDate && (
                        <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-1 rounded-lg font-medium whitespace-nowrap">
                          Atualizado em: {lastUpdateDate}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleExportToExcel}
                      disabled={finalFiltered.length === 0}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-sm cursor-pointer disabled:opacity-50"
                      title="Exportar dados e estatísticas para planilha Excel formatada com duas abas"
                    >
                      <Download size={16} /> Excel
                    </button>
                  </div>
                </div>

                {/* Sub Tab View 1: SCROLLABLE LIST OF OFICIOS */}
                {comSubTab === "lista" && (
                  <div className="space-y-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs transition duration-200">
                    
                    {/* Dynamic Year tabs */}
                    <div className="flex border-b border-slate-150 no-print overflow-x-auto gap-1 pb-1">
                      <button
                        onClick={() => { setComAnoFilter("TODOS"); }}
                        className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                          comAnoFilter === "TODOS"
                            ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        Todos os Anos
                      </button>
                      {distinctYears.map((yr) => (
                        <button
                          key={yr}
                          onClick={() => { setComAnoFilter(yr.toString()); }}
                          className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                            comAnoFilter === yr.toString()
                              ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                              : "text-slate-400 hover:text-slate-700"
                          }`}
                        >
                          Ano {yr} {yr === 2026 && <span className="bg-emerald-200 text-emerald-900 text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1">Ativo</span>}
                        </button>
                      ))}
                    </div>

                    {/* Filter Rail */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1 no-print">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar comunicação, processo, contato..."
                          value={comSearchTerm}
                          onChange={(e) => { setComSearchTerm(e.target.value); }}
                          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white bg-slate-50/55 transition text-xs"
                        />
                      </div>

                      <div>
                        <select
                          value={comUnidadeFilter}
                          onChange={(e) => { setComUnidadeFilter(e.target.value); }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white bg-slate-50/55 transition text-xs"
                        >
                          <option value="TODOS">Todas as Unidades Emitentes</option>
                          {uniqueUnidades.map(un => (
                            <option key={un} value={un}>{un}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={comRespondidoFilter}
                          onChange={(e) => { setComRespondidoFilter(e.target.value); }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-[#003366] focus:bg-white bg-slate-50/55 transition text-xs"
                        >
                          <option value="TODOS">Todos os Status de Resposta</option>
                          <option value="RESPONDIDO">Respondidos (Concluídos)</option>
                          <option value="PENDENTE">Pendentes (Não Respondidos)</option>
                          <option value="NAO_EXIGIDO">Não Precisa de Resposta</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end text-slate-400 font-mono text-[10px] pr-2">
                        Retornou {finalFiltered.length} registros • Rolagem vertical ativa
                      </div>
                    </div>

                    {/* Highly Formatted Scrollable list table - SCROLLABLE WITHOUT PAGES */}
                    <div className="overflow-y-auto max-h-[500px] rounded-xl border border-slate-200 mt-4 bg-slate-50/20">
                      <table className="w-full text-left border-collapse text-xs table-auto min-w-[1000px]">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                            <th className="p-4 text-center no-print bg-slate-50 w-10"></th>
                            <th className="p-4 bg-slate-50">Ofício / Comunicação</th>
                            <th className="p-4 bg-slate-50">Destinatário MTE</th>
                            <th className="p-4 text-center bg-slate-50">Processo</th>
                            <th className="p-4 text-center bg-slate-50">Expedição</th>
                            <th className="p-4 text-center bg-slate-50">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {finalFiltered.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-16 text-center text-slate-400 space-y-2">
                                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
                                <p className="font-bold text-slate-700">Nenhuma comunicação localizada</p>
                                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                                  Altere os termos de pesquisa ou use a barra de sincronização acima para importar dados deste ou de outros anos.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            finalFiltered.map((item) => {
                              const isExpanded = comExpandedRow === item.KEY;
                              const carece = item.CARECE_RESPOSTA !== false;
                              const hasResponse = !!item.DATA_RESPOSTA && item.DATA_RESPOSTA.trim() !== "";
                              
                              let situacaoText = "NÃO PRECISA DE RESPOSTA";
                              let situacaoStyle = "bg-slate-50 text-slate-600 border-slate-200";
                              let dotStyle = "bg-slate-450";
                              
                              if (carece) {
                                  if (hasResponse) {
                                    situacaoText = "RESPONDIDA";
                                    situacaoStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                                    dotStyle = "bg-emerald-500";
                                  } else {
                                    situacaoText = "PENDENTE";
                                    situacaoStyle = "bg-amber-50 text-amber-800 border-amber-200 animate-pulse";
                                    dotStyle = "bg-amber-500";
                                  }
                              }

                              return (
                                <React.Fragment key={item.KEY || `${item.COMUNICACAO}-${item.ANO}`}>
                                  {/* Row Item */}
                                  <tr className={`hover:bg-blue-50/15 border-b border-slate-100 transition duration-100 ${isExpanded ? "bg-slate-50/50" : ""}`}>
                                    
                                    {/* Expand toggle icon */}
                                    <td className="p-4 text-center no-print">
                                      <button 
                                        onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
                                        className="text-slate-400 hover:text-[#003366] hover:bg-slate-100 p-1.5 rounded-lg transition"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#003366] stroke-[2.5]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                    </td>

                                    {/* Ofício/Comunicação */}
                                    <td className="p-4 font-bold text-[#003366]">
                                      <span 
                                        className="cursor-pointer hover:underline text-xs"
                                        onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
                                      >
                                        {item.COMUNICACAO}
                                      </span>
                                    </td>

                                    {/* Destinatário */}
                                    <td className="p-4 font-semibold text-slate-800 truncate max-w-[280px]" title={item.DESTINATARIO}>
                                      {item.DESTINATARIO}
                                    </td>

                                    {/* Processo */}
                                    <td className="p-4 font-mono text-[10px] text-slate-600 text-center whitespace-nowrap">
                                      {item.PROCESSO || <span className="text-slate-350 italic">Não associado</span>}
                                    </td>

                                    {/* Expedição */}
                                    <td className="p-4 text-slate-500 text-center whitespace-nowrap font-mono font-medium">
                                      {item.DATA_EXPEDICAO}
                                    </td>

                                    {/* Situação */}
                                    <td className="p-4 text-center whitespace-nowrap">
                                      <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${situacaoStyle}`}>
                                        <span className={`w-1 h-1 rounded-full ${dotStyle}`} />
                                        {situacaoText}
                                      </span>
                                    </td>

                                  </tr>

                                  {/* Detail panel expansion */}
                                  {isExpanded && (
                                    <tr>
                                      <td colSpan={6} className="bg-slate-50/30 px-6 py-4.5 border-b border-slate-200 no-print">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          
                                          {/* Emitente block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <Database className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Emitente TCU</span>
                                              <span className="text-xs text-[#003366] font-bold block">{item.UNIDADE_EMITENTE}</span>
                                            </div>
                                          </div>

                                          {/* Contato block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <Users className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Contato Vinculado</span>
                                              <span className="text-xs text-slate-700 font-bold block truncate max-w-[200px]" title={item.CONTATO || "Alessandro Barbosa"}>
                                                {item.CONTATO || "Alessandro Barbosa"}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Data da Resposta / Ação Responder block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                              <div className={`p-2 rounded-lg ${hasResponse ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
                                                <Check className="w-4 h-4" />
                                              </div>
                                              <div>
                                                <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Data da Resposta</span>
                                                <span className="text-xs text-slate-800 font-mono font-bold block">
                                                  {hasResponse ? item.DATA_RESPOSTA : "Sem data registrada"}
                                                </span>
                                              </div>
                                            </div>

                                            <button
                                              onClick={() => triggerComEdit(item)}
                                              className="px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#003366] hover:bg-slate-900 text-white cursor-pointer transition shadow-2xs shrink-0"
                                              title="Editar resposta ou dados complementares desta comunicação"
                                            >
                                              Editar / Responder
                                            </button>
                                          </div>

                                          {/* Unidade Executora block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Unidade Executora</span>
                                              <span className="text-xs text-[#003366] font-bold block">
                                                {item.UNIDADE_EXECUTORA || <span className="text-slate-300 italic">Não informada</span>}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Processo SEI block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Processo SEI</span>
                                              <span className="text-xs text-slate-700 font-mono font-bold block">
                                                {item.PROCESSO_SEI || <span className="text-slate-300 italic">Não informado</span>}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Destinação block */}
                                          <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                              {item.DESTINACAO === "ARQUIVAMENTO" ? <Archive className="w-4 h-4 text-slate-500" /> : <ArrowLeftRight className="w-4 h-4 text-[#003366]" />}
                                            </div>
                                            <div>
                                              <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Destinação</span>
                                              <span className="text-xs text-slate-700 font-bold block">
                                                {item.DESTINACAO === "ARQUIVAMENTO" ? (
                                                  <span className="bg-slate-100 text-slate-700 border border-slate-200/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                                    Arquivamento
                                                  </span>
                                                ) : item.DESTINACAO === "RESPOSTA" ? (
                                                  <span className="bg-blue-50 text-blue-800 border border-blue-200/60 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                                    Resposta
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-300 italic">Não informada</span>
                                                )}
                                              </span>
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
                    
                    <div className="text-[10px] text-slate-400 italic text-right">
                      Dica: Use a rolagem lateral e vertical do próprio painel para navegar pelas linhas da tabela sem paginação.
                    </div>
                  </div>
                )}

                {/* Sub Tab View 2: RECIPIENT STATISTICS & DETAILS (PARETO) */}
                {comSubTab === "analytics" && (
                  <div className="space-y-6 animate-fade-in transition duration-200">
                    
                    <div className="space-y-2">
                      <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider block">
                        Volume Total de Comunicações por Unidades (Destinatários)
                      </h3>
                      
                      {/* Scrollable Grid representation of units with communications count */}
                      <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
                          {destinatarioStats.map((stat, idx) => {
                            const respRate = stat.requireResponseTotal > 0 ? ((stat.responded / stat.requireResponseTotal) * 100).toFixed(0) : (stat.total > 0 ? "100" : "0");
                            return (
                              <div key={idx} className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-3xs space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center translate-x-3 -translate-y-3">
                                  <span className="text-[11px] font-black text-slate-300">#{idx + 1}</span>
                                </div>
                                <div className="space-y-0.5 pr-4">
                                  <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase block truncate" title={stat.unidade}>
                                    {stat.unidade}
                                  </span>
                                  <h4 className="text-2xl font-black text-slate-900">
                                    {stat.total} <span className="text-xs font-normal text-slate-400">ofícios ({stat.percentage.toFixed(1)}%)</span>
                                  </h4>
                                </div>

                                <div className="grid grid-cols-2 text-[10px] text-slate-500 border-t border-slate-100 pt-2 font-mono">
                                  <div className="text-emerald-700 font-bold">✓ {stat.responded} Respondidos</div>
                                  <div className="border-l border-slate-100 pl-2 text-amber-700 font-bold">⚡ {stat.pending} Pendentes</div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
                                    <span>Índice de Resposta</span>
                                    <span>{respRate}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${respRate}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {destinatarioStats.length === 0 && (
                            <div className="col-span-4 p-8 text-center text-slate-400 bg-white border border-slate-200 rounded-2xl">
                              Aguardando sincronização de dados para cálculo de indicadores em tempo real.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed Pareto Distribution Table representation */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <h4 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                            Impacto por Destinatário & Participação Relativa
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Fórmula de Pareto: Ofícios Recebidos por unidade em relação ao total de comunicações enviadas em {comAnoFilter === "TODOS" ? "todos os anos" : `no ano ${comAnoFilter}`} ({totalComsCount} ofícios).
                          </p>
                        </div>
                        <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                          Unidade Ativas: {destinatarioStats.length}
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-mono text-[9px] uppercase tracking-wider">
                              <th className="p-3 font-bold">Unidade do Ministério do Trabalho (Destinatário)</th>
                              <th className="p-3 font-bold text-center w-[130px]">Ofícios Recebidos</th>
                              <th className="p-3 font-bold text-center w-[130px]">Demandam Resposta</th>
                              <th className="p-3 font-bold text-center w-[130px]">Respondidos</th>
                              <th className="p-3 font-bold text-center w-[130px]">Pendentes (Em Aberto)</th>
                              <th className="p-3 font-bold text-center w-[200px]">% de Representação no Órgão</th>
                              <th className="p-3 font-bold text-center w-[130px]">Índice de Conclusão</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {destinatarioStats.map((stat, idx) => {
                              const respPct = stat.requireResponseTotal > 0 ? (stat.responded / stat.requireResponseTotal) * 100 : (stat.total > 0 ? 100 : 0);
                              return (
                                <tr key={idx} className="hover:bg-slate-55/35 transition duration-100">
                                  <td className="p-3 text-slate-800 font-black flex items-center gap-2 text-[11px]">
                                    <span className="w-5 h-5 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-full flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span>{stat.unidade}</span>
                                  </td>
                                  <td className="p-3 text-center text-slate-900 font-mono font-bold text-sm">
                                    {stat.total}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-600">
                                    {stat.requireResponseTotal}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-emerald-700">
                                    {stat.responded}
                                  </td>
                                  <td className="p-3 text-center font-mono font-bold text-amber-700">
                                    {stat.pending}
                                  </td>
                                  <td className="p-3">
                                    <div className="space-y-1 max-w-[180px] mx-auto">
                                      <div className="flex justify-between font-mono text-[10px] font-bold text-slate-700">
                                        <span>{stat.percentage.toFixed(1)}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#003366] rounded-full" style={{ width: `${stat.percentage}%` }}></div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`px-2.5 py-1 rounded-sm font-bold text-[10px] font-mono ${
                                      respPct >= 90
                                        ? "bg-emerald-100 border border-emerald-200 text-emerald-800"
                                        : respPct >= 50
                                        ? "bg-amber-100 border border-amber-200 text-amber-800"
                                        : "bg-rose-100 border border-rose-200 text-rose-800"
                                    }`}>
                                      {respPct.toFixed(1)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {destinatarioStats.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                                  Sem dados acumulados para este filtro de período.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* Edit / Resposta Modal for Communication */}
          {editingComItem && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in no-print">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-100 p-6 pb-4 shrink-0">
                  <div>
                    <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Responder / Editar Comunicação</h3>
                    <p className="text-xs text-slate-400 font-bold">{editingComItem.COMUNICACAO} • Ano {editingComItem.ANO}</p>
                  </div>
                  <button onClick={() => setEditingComItem(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Body */}
                <div className="p-6 pt-4 pb-4 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  <div className="space-y-3.5 text-xs text-slate-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Unidade Emitente</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                          value={editComUnidade}
                          onChange={(e) => setEditComUnidade(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Processo Associado</label>
                        <input
                          type="text"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                          value={editComProcesso}
                          onChange={(e) => setEditComProcesso(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Destinatário</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        value={editComDestinatario}
                        onChange={(e) => setEditComDestinatario(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Contato de Referência</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        value={editComContato}
                        onChange={(e) => setEditComContato(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Unidade Executora</label>
                      <input
                        type="text"
                        placeholder="Ex: SECI"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                        value={editComUnidadeExecutora}
                        onChange={(e) => setEditComUnidadeExecutora(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Nº Processo SEI</label>
                      <input
                        type="text"
                        placeholder="Ex: 19973.100234/2026-99"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                        value={editComProcessoSei}
                        onChange={(e) => setEditComProcessoSei(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Destinação da Comunicação</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditComDestinacao("RESPOSTA")}
                          className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            editComDestinacao === "RESPOSTA"
                              ? "bg-[#003366] text-white border-[#003366] shadow-2xs"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          Resposta
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditComDestinacao("ARQUIVAMENTO")}
                          className={`flex-1 py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            editComDestinacao === "ARQUIVAMENTO"
                              ? "bg-slate-700 text-white border-slate-700 shadow-2xs"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200"
                          }`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                          Arquivamento
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Data de Expedição</label>
                        <input
                          type="text"
                          placeholder="DD/MM/AAAA"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center"
                          value={editComExpedicao}
                          onChange={(e) => setEditComExpedicao(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Data da Resposta</label>
                        <input
                          type="text"
                          placeholder="DD/MM/AAAA ou em branco se pendente"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-center font-bold bg-[#003366]/5 focus:bg-white text-slate-900 border-[#003366]/30"
                          value={editComResposta}
                          onChange={(e) => setEditComResposta(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="edit-com-carece"
                        checked={editComCarece}
                        onChange={(e) => setEditComCarece(e.target.checked)}
                        className="w-4 h-4 text-[#003366] border-slate-350 rounded-sm focus:ring-[#003366] cursor-pointer"
                      />
                      <label htmlFor="edit-com-carece" className="text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                        Esta comunicação carece/exige resposta oficial da assessoria
                      </label>
                    </div>

                    {editComCarece && editComExpedicao && (() => {
                      const [d, m, y] = editComExpedicao.split("/");
                      if (d && m && y && d.length === 2 && m.length === 2 && y.length === 4) {
                        const dtExpedicao = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                        if (!isNaN(dtExpedicao.getTime())) {
                          let dtReferencia = new Date(); // today
                          const resolved = editComResposta && editComResposta.trim() !== "";
                          if (resolved) {
                            const [rd, rm, ry] = editComResposta.split("/");
                            if (rd && rm && ry) {
                              dtReferencia = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd));
                            }
                          }
                          
                          const diffTime = dtReferencia.getTime() - dtExpedicao.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          
                          if (diffDays >= 0) {
                            return (
                              <div className={`p-3 mt-1 rounded-xl flex items-center justify-between border ${resolved ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div className="flex items-center gap-2">
                                  <Clock className={`w-4 h-4 ${resolved ? 'text-emerald-600' : 'text-amber-600'}`} />
                                  <span className={`text-[11px] font-black uppercase ${resolved ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {resolved ? "Comunicação Respondida" : "Contagem de Prazo / Tempo Decorrido"}
                                  </span>
                                </div>
                                <span className={`text-xs font-mono font-bold ${resolved ? 'text-emerald-800' : 'text-amber-800'}`}>
                                  {resolved ? `Respondido em ${diffDays} dias` : `${diffDays} dias em aberto`}
                                </span>
                              </div>
                            );
                          }
                        }
                      }
                      return null;
                    })()}

                    <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-150/70">
                      <a
                        href="https://processoeletronico.trabalho.gov.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[145px] py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[#003366] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-155 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Acessar SEI
                      </a>
                      <a
                        href="https://conecta-tcu.apps.tcu.gov.br/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[145px] py-2 px-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[#003366] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition duration-155 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Conecta TCU
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-slate-100 p-6 pt-4 shrink-0">
                  <button
                    onClick={() => setEditingComItem(null)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 transition text-xs font-bold"
                  >
                    Mudar Credencial & Cancelar
                  </button>
                  <button
                    onClick={saveComEdit}
                    disabled={isSavingCom}
                    className="px-4 py-2 bg-[#003366] text-white rounded-xl text-xs font-bold hover:bg-slate-900 disabled:opacity-50 transition"
                  >
                    {isSavingCom ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      
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
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                    copySuccessFullText
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
