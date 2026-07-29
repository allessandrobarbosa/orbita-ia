/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractLocalHeuristics } from "../utils/tcuLocalExtractor";

import React, { useState, useRef } from "react";
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

export default function TcuMonitoramento({ 
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
  
  // Robust Portuguese Text Repair function (Now bypassed since ETL cleans at root)
  const sanitizePortugueseText = (text: string | undefined | null): string => {
    return text || "";
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
  const [processingAiKey, setProcessingAiKey] = useState<string | null>(null);
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

  const [isLoadingTeor, setIsLoadingTeor] = useState(false);
  const handleViewFullText = async (ac: AcordaoDemand, silent?: boolean) => {
    if (!silent) setFullTextAcordao(ac);
    if (!ac.ACORDAO) {
      setIsLoadingTeor(true);
      try {
        const res = await fetch(`/api/acordaos/${ac.KEY}/teor`);
        if (res.ok) {
          const data = await res.json();
          if (data.acordao) {
            if (!silent) setFullTextAcordao({ ...ac, ACORDAO: data.acordao });
            return data;
          } else if (!silent) {
            // Also update state if it is truly empty, so it doesn't try to fetch again next time
            setFullTextAcordao({ ...ac, ACORDAO: "" });
          }
        }
      } catch (e) {
        console.error("Failed to fetch full text", e);
      } finally {
        setIsLoadingTeor(false);
      }
    }
    return { acordao: ac.ACORDAO };
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
  const handleSingleProcessAi = async (ac: AcordaoDemand) => {
    setProcessingAiKey(ac.KEY);
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
        const hasRessarcimento = data.dossie.some((r:any) => r.siafiEncontrados && r.siafiEncontrados.some((s:any) => s.confirmado === true));
        if (hasRessarcimento) {
          updatedAc.STATUS_MONITORAMENTO = "Cumprido";
          updatedAc.OBSERVACOES = "[Atualização Automática IA]: Ressarcimento identificado nos dados do SIAFI.";
        }
        
        if (onUpdateAcordao) {
          await onUpdateAcordao(updatedAc);
        } else {
          await fetch("/api/acordaos/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedAc)
          });
        }
        
        alert("Dossiê gerado com sucesso!");
      } else {
        alert("Falha ao gerar dossiê: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao processar o Acórdão.");
    } finally {
      setProcessingAiKey(null);
    }
  };

  const abortBatchRef = useRef(false);

  const handleBatchProcessAi = async () => {
    const pendentes = acordaos.filter(a => {
      if (a.STATUS_MONITORAMENTO === "Cumprido" || a.STATUS_MONITORAMENTO === "Atrasado") return false;
      const dossie = a.aiAnalysisData?.dossieRessarcimento;
      if (!dossie || dossie.length === 0) return true;
      if (dossie[0].status === "pendente") return true;
      return false;
    });

    if (pendentes.length === 0) {
      alert("Todos os Acórdãos já possuem Dossiê IA gerado!");
      return;
    }

    const confirmar = window.confirm(`Foram encontrados ${pendentes.length} Acórdãos pendentes de extração em lote.\n\nO processamento ocorrerá de forma instantânea através do nosso Agente Nativo local, sem limites ou bloqueios.\n\nDeseja iniciar?`);
    if (!confirmar) return;

    abortBatchRef.current = false;
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: pendentes.length });
    
    let wasAborted = false;

    for (let i = 0; i < pendentes.length; i++) {
      if (abortBatchRef.current) {
        wasAborted = true;
        break;
      }
      
      const ac = pendentes[i];
      setBatchProgress({ current: i + 1, total: pendentes.length });
      
      let success = false;
      let retryCount = 0;
      
      while (!success && retryCount < 5) {
        if (abortBatchRef.current) {
          wasAborted = true;
          break;
        }
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
            
            await fetch("/api/acordaos/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedAc)
            });
          } else {
            console.error(`Falha no Acórdão ${ac.KEY}:`, data.error);
            if ((data.error && data.error.includes("429")) || (data.details && data.details.includes("429"))) {
              console.warn(`Rate limit hit on item ${i+1}. Waiting 62 seconds before retry...`);
              await new Promise(r => setTimeout(r, 62000));
              retryCount++;
            } else {
              break; 
            }
          }
        } catch (err) {
          console.error(`Erro ao processar lote no Acórdão ${ac.KEY}:`, err);
          alert(`Erro de conexão ao processar o item ${i + 1}. O lote foi pausado para evitar perda de dados.`);
          wasAborted = true;
          break; 
        }
      }
      
      if (wasAborted) break;

      window.dispatchEvent(new Event('mousemove'));
      if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
    }

    if (onSyncLocalAcordaos) {
      await onSyncLocalAcordaos();
    }
    
    setIsBatchProcessing(false);
    if (wasAborted) {
      alert("Processamento em Lote foi abortado/interrompido.");
    } else {
      alert("✨ Processamento em Lote concluído com sucesso!");
    }
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
        if (onRefreshData) await onRefreshData();
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

  const hasValoresARessarcir = (ac: AcordaoDemand) => {
    if (ac.aiAnalysisData) {
      if (ac.aiAnalysisData.ha_ressarcimento !== undefined) {
        return ac.aiAnalysisData.ha_ressarcimento;
      }
      if (Array.isArray(ac.aiAnalysisData.dossieRessarcimento)) {
        return ac.aiAnalysisData.dossieRessarcimento.length > 0;
      }
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
      (ac.KEY && ac.KEY.toLowerCase().includes(term)) ||
      (ac.NUMACORDAO && ac.ANOACORDAO && `${ac.NUMACORDAO}/${ac.ANOACORDAO}`.includes(term)) ||
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
        (ressarcimentoFilter === "SEM_VALORES" ? (ac.aiAnalysisData && !hasValoresARessarcir(ac)) :
          (ressarcimentoFilter === "PENDENTE_REGULARIZACAO" ? 
            (ac.aiAnalysisData?.dossieRessarcimento?.length > 0 && ac.STATUS_MONITORAMENTO !== "Cumprido") :
            (ressarcimentoFilter === "SEM_LEITURA_IA" ? !ac.aiAnalysisData : false)
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
      


          {processErrors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-800 font-bold text-sm">Atenção: Inconsistência no processamento de dados</h3>
                <p className="text-red-700 text-xs mt-1">
                  Encontramos erros ao processar as Recomendações e Determinações de {processErrors.length} acórdão(s).
                </p>
                <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                  {processErrors.slice(0, 5).map(err => (
                    <li key={err.id}>Acórdão ID/Key: <span className="font-semibold">{err.id}</span> - {err.error}</li>
                  ))}
                  {processErrors.length > 5 && (
                    <li>... e mais {processErrors.length - 5} acórdão(s).</li>
                  )}
                </ul>
              </div>
            </div>
          )}

      {/* TCU Acórdão Importer Section - Premium Bento Box */}
      {showImporter && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 pointer-events-none opacity-40"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                Painel de Importação e Carga do TCU
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                O sistema realiza a sincronização automática de acórdãos lendo os arquivos consolidados e atualizando o inteiro teor das decisões.
              </p>
            </div>
            <button onClick={() => setShowImporter(false)} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 relative z-10">
            {/* Sincronização Local Incremental - Premium Card */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#003366] uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className={`w-4 h-4 text-[#003366] ${isSyncingLocal ? "animate-spin" : ""}`} />
                  Sincronização Automática via Planilhas Locais
                </h4>
                <p className="text-[11px] text-slate-500 max-w-[650px] leading-relaxed">
                  Para maior segurança e controle de dados, salve as planilhas completas obtidas no TCU (ex: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">Acórdãos2026.csv</code>) dentro da pasta segura <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">data/tcu/acordaos/</code> do projeto.
                </p>
                <p className="text-[10px] text-slate-400">
                  O sistema fará a leitura local em lote de forma otimizada para atualizar os teores das decisões sem depender da conexão externa do TCU.
                </p>
              </div>
              <button
                id="btn-sync-local"
                onClick={handleLocalSync}
                disabled={isSyncingLocal}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition duration-200 cursor-pointer"
              >
                {isSyncingLocal ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Sincronizar Arquivos Locais
                  </>
                )}
              </button>
            </div>

            {syncLocalMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="space-y-1">
                  <span>{syncLocalMessage}</span>
                  {localSyncReport && localSyncReport.length > 0 && (
                    <div className="mt-2 text-[10px] text-emerald-700 font-mono space-y-1">
                      {localSyncReport.map((rep: any, idx: number) => (
                        <div key={idx}>
                          • {rep.file}: {rep.imported} importados, {rep.updated} atualizados, {rep.skipped} ignorados.
                          {rep.error && <span className="text-rose-600"> (Erro: {rep.error})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Dynamic Year Tabs & KPIs Bento Grid (Standardized UX) */}
      {(() => {
        const acordaosForSelectedYear = acordaos.filter(ac => {
          return anoFilter === "TODOS" || (ac.ANOACORDAO && ac.ANOACORDAO.toString() === anoFilter);
        });
        const totalAcordaosCount = acordaosForSelectedYear.length;
        const cumpridosCount = acordaosForSelectedYear.filter(ac => ac.STATUS_MONITORAMENTO === "Cumprido").length;
        const emAnaliseCount = acordaosForSelectedYear.filter(ac => ac.STATUS_MONITORAMENTO === "Em Análise" || ac.STATUS_MONITORAMENTO === "Pendente" || !ac.STATUS_MONITORAMENTO).length;
        const atrasadosCount = acordaosForSelectedYear.filter(ac => {
          return ac.STATUS_MONITORAMENTO === "Atrasado" || (ac.STATUS_MONITORAMENTO !== "Cumprido" && ac.PRAZO_LIMITE && new Date(ac.PRAZO_LIMITE).getTime() < Date.now());
        }).length;

        return (
          <div className="space-y-4 no-print">
            {/* Dynamic Year tabs */}
            <div className="flex border-b border-slate-150 no-print overflow-x-auto gap-1 pb-1">
              <button
                onClick={() => { setAnoFilter("TODOS"); setCurrentPage(1); }}
                className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                  anoFilter === "TODOS"
                    ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Todos os Anos
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => { setAnoFilter(yr.toString()); setCurrentPage(1); }}
                  className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                    anoFilter === yr.toString()
                      ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  Ano {yr} {yr === 2026 && <span className="bg-emerald-200 text-emerald-900 text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1">Ativo</span>}
                </button>
              ))}
            </div>

            {/* Statistics bento grid - Grouped dynamically by TIPOPROCESSO from data */}
            {(() => {
              const normalizeProcessType = (raw: string): string => {
                const norm = (raw || "").trim().toUpperCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, ""); // strip accents
                
                if (norm.includes("MONITORAMENTO E OUTROS")) return "MONITORAMENTO E OUTROS";
                if (norm.includes("RELATORIO DE ACOMPANHAMENTO")) return "RELATÓRIO DE ACOMPANHAMENTO";
                if (norm.includes("RELATORIO DE AUDITORIA") || norm.includes("RELATORIO DE AUDIT") || norm.includes("AUDITORIA") || norm === "RA") return "RELATÓRIO DE AUDITORIA";
                if (norm.includes("ACOMPANHAMENTO") || norm === "ACOMP") return "ACOMPANHAMENTO";
                if (norm.includes("MONITORAMENTO") || norm === "MONIT" || norm === "MON") return "MONITORAMENTO";
                if (norm.includes("TOMADA DE CONTAS ESPECIAL") || norm === "TCE" || norm.includes("TOMADA DE CONTAS")) return "TOMADA DE CONTAS ESPECIAL";
                if (norm.includes("JULGAMENTO DE TCE") || norm.includes("JULGAMENTO DE TC")) return "JULGAMENTO DE TCE";
                if (norm.includes("REPRESENTACAO") || norm === "REPR" || norm.includes("REPRE")) return "REPRESENTAÇÃO";
                if (norm.includes("DENUNCIA") || norm === "DEN" || norm.includes("DENUNCIAS")) return "DENÚNCIAS";
                if (norm.includes("CONGRESSO") || norm === "SCN" || norm.includes("SOLICITACOES")) return "SOLICITAÇÕES DO CONGRESSO NACIONAL";
                
                return "E OUTROS";
              };

              const standardCategories = [
                { id: "ACOMPANHAMENTO", label: "Acompanhamento", short: "ACOMP", icon: Database, colorClass: "bg-blue-50/70 border-blue-100 text-blue-800", textClass: "text-[#003366] border-l-4 border-blue-500", desc: "Acompanhamentos de gestão" },
                { id: "MONITORAMENTO", label: "Monitoramento", short: "MONIT", icon: Clock, colorClass: "bg-teal-50/70 border-teal-100 text-teal-800", textClass: "text-teal-950 border-l-4 border-teal-500", desc: "Monitoramento de deliberações" },
                { id: "RELATÓRIO DE AUDITORIA", label: "Relatório de Auditoria", short: "RA / AUDIT", icon: BarChart3, colorClass: "bg-amber-50/70 border-amber-100 text-amber-800", textClass: "text-amber-950 border-l-4 border-amber-500", desc: "Fiscalizações por Relatório de Auditoria" },
                { id: "RELATÓRIO DE ACOMPANHAMENTO", label: "Relatório de Acompanhamento", short: "REL-ACOMP", icon: FileCheck, colorClass: "bg-indigo-50/70 border-indigo-100 text-indigo-800", textClass: "text-indigo-950 border-l-4 border-indigo-500", desc: "Relatórios de acompanhamento formal" },
                { id: "MONITORAMENTO E OUTROS", label: "Monitoramento e Outros", short: "MON-OUT", icon: Activity, colorClass: "bg-cyan-50/70 border-cyan-100 text-cyan-800", textClass: "text-cyan-950 border-l-4 border-cyan-500", desc: "Monitoramentos combinados" },
                { id: "TOMADA DE CONTAS ESPECIAL", label: "Tomada de Contas Especial", short: "TCE", icon: DollarSign, colorClass: "bg-rose-50/70 border-rose-100 text-rose-800", textClass: "text-rose-950 border-l-4 border-rose-500", desc: "Tomadas de Contas Especiais" },
                { id: "REPRESENTAÇÃO", label: "Representação", short: "REPR", icon: FileText, colorClass: "bg-sky-50/70 border-sky-100 text-sky-800", textClass: "text-sky-950 border-l-4 border-sky-500", desc: "Representações ao Tribunal" },
                { id: "JULGAMENTO DE TCE", label: "Julgamento de TCE", short: "JULG-TCE", icon: Scale, colorClass: "bg-violet-50/70 border-violet-100 text-violet-800", textClass: "text-violet-950 border-l-4 border-violet-500", desc: "Julgamento de Tomada de Contas" },
                { id: "DENÚNCIAS", label: "Denúncias", short: "DEN", icon: AlertCircle, colorClass: "bg-red-50/70 border-red-100 text-red-800", textClass: "text-red-950 border-l-4 border-red-500", desc: "Canais de denúncias recebidas" },
                { id: "SOLICITAÇÕES DO CONGRESSO NACIONAL", label: "Solicitações do Congresso Nacional", short: "SCN", icon: Landmark, colorClass: "bg-emerald-50/70 border-emerald-100 text-emerald-800", textClass: "text-emerald-950 border-l-4 border-emerald-500", desc: "Demandas do poder legislativo" },
                { id: "E OUTROS", label: "E Outros", short: "OUTROS", icon: LayoutGrid, colorClass: "bg-slate-50 border-slate-200 text-slate-700", textClass: "text-slate-850 border-l-4 border-slate-350", desc: "Demais classes processuais" }
              ];

              // Filter counts relative to the selected year filter (acordaosForSelectedYear)
              const counts: Record<string, number> = {
                "ACOMPANHAMENTO": 0,
                "MONITORAMENTO": 0,
                "RELATÓRIO DE AUDITORIA": 0,
                "RELATÓRIO DE ACOMPANHAMENTO": 0,
                "MONITORAMENTO E OUTROS": 0,
                "TOMADA DE CONTAS ESPECIAL": 0,
                "REPRESENTAÇÃO": 0,
                "JULGAMENTO DE TCE": 0,
                "DENÚNCIAS": 0,
                "SOLICITAÇÕES DO CONGRESSO NACIONAL": 0,
                "E OUTROS": 0
              };

              acordaosForSelectedYear.forEach(ac => {
                const normalized = normalizeProcessType(ac.TIPOPROCESSO || "");
                counts[normalized] = (counts[normalized] || 0) + 1;
              });

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volumetria por Tipo de Processo ({anoFilter})</span>
                    <span className="text-xs text-slate-500 font-semibold">{acordaosForSelectedYear.length} Acórdãos Filtrados</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 no-print">
                    {standardCategories.map((cat) => {
                      const Icon = cat.icon;
                      const countValue = counts[cat.id] || 0;
                      return (
                        <div 
                          key={cat.id} 
                          className={`bg-white border rounded-xl p-3 flex flex-col justify-between shadow-3xs hover:shadow-xs transition-all duration-200 cursor-default group relative overflow-hidden ${cat.textClass}`}
                          title={`${cat.label} - ${cat.desc}`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-slate-500 truncate group-hover:text-slate-800 transition-colors select-raw select-all">
                                {cat.label}
                              </span>
                              <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                {cat.short}
                              </span>
                            </div>
                            <div className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-105 duration-200 ${cat.colorClass}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                          </div>
                          
                          <div className="flex items-baseline justify-between mt-auto">
                            <h4 className="text-xl font-black text-slate-950">
                              {countValue}
                            </h4>
                            <span className="text-[8px] text-slate-400 font-bold">
                              {acordaosForSelectedYear.length > 0 ? `${((countValue / acordaosForSelectedYear.length) * 100).toFixed(0)}%` : "0%"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* Filters HUD - Bento Card layout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm no-print mb-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Action Buttons and Search */}
          <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center w-full">
            <div className="flex flex-wrap gap-2 items-center">
              <button 
                id="btn-importer-toggle"
                onClick={handleLocalSync}
                disabled={isSyncingLocal}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 ${
                  isSyncingLocal 
                    ? "bg-slate-800 text-white shadow-xs opacity-50" 
                    : "bg-[#003366] text-white hover:bg-[#0f4396] shadow-sm"
                }`}
              >
                {isSyncingLocal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {isSyncingLocal ? "Sincronizando..." : "Sincronizar Arquivos Locais"}
              </button>

              <button 
                  id="btn-export-excel"
                  onClick={handleExportExcel}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 bg-green-600 text-white hover:bg-green-700 transition shadow-sm cursor-pointer"
                >
                  <Download size={16} /> Excel
                </button>
            </div>

            <div className="relative w-full xl:w-[300px] shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="txt-search-acordao"
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition text-slate-800"
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Bottom Row: Dynamic Filters */}
          <div className="flex flex-wrap gap-4 items-center w-full bg-slate-50/50 p-2 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-550 shrink-0">Situação:</span>
              <select
                id="select-filter-status"
                className="bg-white border border-slate-200 p-1.5 px-2 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="TODOS">Todos</option>
                <option value="Pendente">Pendentes</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Cumprido">Cumpridos</option>
                <option value="Atrasado">Em Atraso</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-550 shrink-0">Colegiado:</span>
              <select
                id="select-filter-colegiado"
                className="bg-white border border-slate-200 p-1.5 px-2 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium"
                value={colegiadoFilter}
                onChange={(e) => { setColegiadoFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="TODOS">Todos</option>
                <option value="Plenário">Plenário</option>
                <option value="Primeira Câmara">1ª Câmara</option>
                <option value="Segunda Câmara">2ª Câmara</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-550 shrink-0">Ressarcimento:</span>
              <select
                id="select-filter-ressarcimento"
                className="bg-white border border-slate-200 p-1.5 px-2 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium"
                value={ressarcimentoFilter}
                onChange={(e) => { setRessarcimentoFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="TODOS">Todos</option>
                <option value="COM_VALORES">Com Débito Exigido</option>
                <option value="SEM_VALORES">Sem Débito Exigido</option>
                <option value="PENDENTE_REGULARIZACAO">Débito Pendente de Pgto.</option>
                <option value="SEM_LEITURA_IA">Pendente de Leitura IA</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-550 shrink-0">Recomendações:</span>
              <select
                id="select-filter-recomendacao"
                className="bg-white border border-slate-200 p-1.5 px-2 rounded-lg text-xs text-slate-800 focus:outline-hidden font-medium max-w-[200px] truncate"
                value={recomendacaoFilter}
                onChange={(e) => { setRecomendacaoFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="TODOS">Todas</option>
                <option value="COM_RECOMENDACAO">Possui Determinação/Recomendação</option>
                <option value="SEM_RECOMENDACAO">Sem Ações</option>
              </select>
            </div>

            <button
              id="btn-clear-filters"
              className="ml-auto text-xs text-[#003366] hover:text-[#001f3f] underline font-bold px-2 py-1 shrink-0"
              onClick={() => { setSearchTerm(""); setStatusFilter("TODOS"); setColegiadoFilter("TODOS"); setAnoFilter("TODOS"); setRessarcimentoFilter("TODOS"); setRecomendacaoFilter("TODOS"); }}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>
{/* Main Datagrid - Bento Rounded Table wrapping */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
        
        {/* Status indicator rail */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[10px] flex flex-col sm:flex-row items-add sm:items-center justify-between gap-1 no-print">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-extrabold text-[#003366] uppercase tracking-wide">Monitoramento de Acórdãos: {filteredAcordaos.length} registros</span>
          </div>
          <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Rolagem Vertical Contínua & Rolagem Lateral Ativas</span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[550px] custom-com-scroll-container bg-slate-50/20">
          <table className="w-full text-left border-collapse table-auto text-xs min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs">
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black tracking-wider text-slate-500">
                <th className="p-4 w-8 no-print bg-slate-100"></th>
                <th className="p-4 bg-slate-100">Título do Acórdão</th>
                <th className="p-4 bg-slate-100 font-sans">Processo TCU</th>
                <th className="p-4 bg-slate-100">Sessão / Data</th>
                <th className="p-4 bg-slate-100">Status / Resumo</th>
                <th className="p-4 text-center bg-slate-100">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading && filteredAcordaos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-sans">
                    Sincronizando dados com repositório remoto da AECI...
                  </td>
                </tr>
              ) : filteredAcordaos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 font-sans">
                    Nenhum acórdão localizado com os filtros inseridos.
                  </td>
                </tr>
              ) : (
                filteredAcordaos.map((ac, idx) => {
                  const uniqueKey = ac.KEY; // Removed -idx to prevent row collapse on updates
                  const isExpanded = expandedRow === uniqueKey;
                  const isLate = ac.STATUS_MONITORAMENTO === "Atrasado" || (ac.STATUS_MONITORAMENTO !== "Cumprido" && new Date(ac.PRAZO_LIMITE).getTime() < Date.now());
                  const hasFullText = !!(ac.ACORDAO || (ac as any).acordao);
                  const currentFullText = (ac.ACORDAO || (ac as any).acordao || "").trim();

                  return (
                    <React.Fragment key={uniqueKey}>
                      
                      {/* Row Item */}
                      <tr 
                        className={`hover:bg-slate-50/50 transition duration-150 cursor-pointer ${isExpanded ? "bg-slate-50/70" : ""}`}
                        onClick={async () => {
                          const willExpand = !isExpanded;
                          setExpandedRow(willExpand ? uniqueKey : null);
                          setDocVerifyInput("");
                          setVerifyResult(null);
                          setFavorecidoInput("");
                          setFavorecidoDocsResult(null);
                          setSearchMode("documento");

                          if (willExpand && !ac.aiAnalysisData?.dossieRessarcimento) {
                            try {
                              const fullTextData = await handleViewFullText(ac, true);
                              const teor = fullTextData?.acordao || currentFullText || "";
                              if (teor) {
                                const result = extractLocalHeuristics(teor);
                                await onUpdateAcordao({ ...ac, aiAnalysisData: result });
                              }
                            } catch (e) {
                              console.error("Auto extraction error:", e);
                            }
                          }
                        }}
                      >
                        
                        {/* Expand toggle icon */}
                        <td className="p-4 no-print">
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const willExpand = !isExpanded;
                              setExpandedRow(willExpand ? uniqueKey : null);
                              setDocVerifyInput("");
                              setVerifyResult(null);
                              setFavorecidoInput("");
                              setFavorecidoDocsResult(null);
                              setSearchMode("documento");

                              if (willExpand && !ac.aiAnalysisData?.dossieRessarcimento) {
                                try {
                                  const fullTextData = await handleViewFullText(ac, true);
                                  const teor = fullTextData?.acordao || currentFullText || "";
                                  if (teor) {
                                    const result = extractLocalHeuristics(teor);
                                    await onUpdateAcordao({ ...ac, aiAnalysisData: result });
                                  }
                                } catch (err) {
                                  console.error("Auto extraction error:", err);
                                }
                              }
                            }}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition text-left"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-450" />}
                          </button>
                        </td>

                        {/* Title & Colegiado details */}
                        <td className="p-4">
                          <div>
                            <span 
                              className="font-extrabold text-[#003366] cursor-pointer hover:underline text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : ac.KEY);
                                setDocVerifyInput("");
                                setVerifyResult(null);
                                setFavorecidoInput("");
                                setFavorecidoDocsResult(null);
                                setSearchMode("documento");
                              }}
                            >
                              {ac.TITULO.split(" - ")[0]}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              Colegiado: {ac.COLEGIADO} | Ata: {ac.NUMATA}
                            </span>
                          </div>
                        </td>

                        {/* Process ID */}
                        <td className="p-4">
                          <code className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] text-slate-750 font-medium">
                            {ac.PROC}
                          </code>
                        </td>

                        {/* Session Date */}
                        <td className="p-4 text-slate-600 font-mono text-[11px]">{ac.DATASESSAO}</td>

                        {/* Status / Resumo */}
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ac.STATUS_MONITORAMENTO === "Cumprido" ? "bg-emerald-100 text-emerald-800" :
                            isLate ? "bg-red-100 text-red-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {ac.STATUS_MONITORAMENTO || "Pendente"}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="p-4 text-center">
                          <button 
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold transition"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRow(isExpanded ? null : uniqueKey);
                            }}
                          >
                            Detalhes
                          </button>
                        </td>

                      </tr>

                      {/* Detail panel expansion */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/25 px-8 py-6 border-b border-slate-200">
                            <div className="space-y-4">
                              
                              {/* Internal monitoring values annotations */}
                              <div className="flex flex-wrap gap-4">
                                <div className="bg-white border border-slate-200/80 p-3 px-4 rounded-xl shadow-3xs flex items-center gap-3 min-w-[245px]">
                                  <div className="p-2 bg-blue-50 text-[#003366] rounded-lg">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Prazo de Resposta</span>
                                    <span className="text-xs text-[#003366] font-mono font-bold block">
                                      {(() => {
                                        const dateStr = ac.PRAZO_LIMITE;
                                        if (!dateStr) return "Sem limite definido";
                                        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
                                        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
                                        if (match) {
                                          return `${match[3]}/${match[2]}/${match[1]}`;
                                        }
                                        return dateStr;
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Meta fields breakdown */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white border p-3 rounded-xl shadow-2xs flex flex-col">
                                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5 shrink-0">Tipo Processo</span>
                                  <div className="text-xs text-slate-800 font-semibold max-h-24 overflow-y-auto scrollbar-thin pr-1 block break-words">{ac.TIPOPROCESSO || "Não especificado"}</div>
                                </div>
                                <div className="bg-white border p-3 rounded-xl shadow-2xs flex flex-col">
                                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5 shrink-0">Entidade Interessada</span>
                                  <div className="text-xs text-slate-800 font-semibold max-h-24 overflow-y-auto scrollbar-thin pr-1 block break-words">{ac.ENTIDADE || "MTE"}</div>
                                </div>
                                <div className="bg-white border p-3 rounded-xl shadow-2xs flex flex-col">
                                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5 shrink-0">Acórdãos Relacionados</span>
                                  <div className="text-xs text-slate-800 font-mono max-h-24 overflow-y-auto scrollbar-thin pr-1 block break-words">{ac.ACORDAOSRELACIONADOS || "Nenhum"}</div>
                                </div>
                              </div>

                              <div className="bg-white p-4.5 rounded-xl border">
                                <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider">Tema Principal / Assunto</span>
                                <p className="text-xs text-[#003366] mt-1 leading-relaxed font-black">{ac.ASSUNTO || "Sem descrição de assunto."}</p>
                              </div>

                              <div className="bg-white p-4.5 rounded-xl border">
                                <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider">Resumo / Sumário (Jurisprudência TCU)</span>
                                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-sans">{ac.SUMARIO || "Não informado."}</p>
                              </div>

                              {/* Recomendações e Determinações (Unificadas / IA) */}
                              {ac.aiAnalysisData ? (
                                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                                    <FileCheck className="w-4 h-4 text-[#1351b4]" />
                                    <span className="text-[10px] text-[#1351b4] block uppercase font-extrabold tracking-wider">
                                      Checklist Extraído do Acórdão
                                    </span>
                                    {ac.aiAnalysisData.method === 'local_heuristic' && (
                                      <span className="ml-auto text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">EXTRAÇÃO LOCAL (REGEX)</span>
                                    )}
                                  </div>
                                  <div className="space-y-4">
                                    {(Array.isArray(ac.aiAnalysisData.determinacoes) && ac.aiAnalysisData.determinacoes.length > 0) && (
                                      <div>
                                        <span className="text-[9px] font-bold text-rose-700 uppercase mb-1 block tracking-widest">Determinações</span>
                                        <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1 font-medium">
                                          {ac.aiAnalysisData.determinacoes.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {(Array.isArray(ac.aiAnalysisData.recomendacoes) && ac.aiAnalysisData.recomendacoes.length > 0) && (
                                      <div>
                                        <span className="text-[9px] font-bold text-orange-700 uppercase mb-1 block tracking-widest">Recomendações</span>
                                        <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1 font-medium">
                                          {ac.aiAnalysisData.recomendacoes.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {(Array.isArray(ac.aiAnalysisData.darCiencia) && ac.aiAnalysisData.darCiencia.length > 0) && (
                                      <div>
                                        <span className="text-[9px] font-bold text-blue-700 uppercase mb-1 block tracking-widest">Dar Ciência</span>
                                        <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1 font-medium">
                                          {ac.aiAnalysisData.darCiencia.map((item: string, idx: number) => <li key={idx}>{item}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                    {ac.aiAnalysisData.determinaArquivamento && (
                                      <div className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 px-2 py-1 rounded text-[10px] font-bold uppercase mt-2">
                                        ✓ Determina Arquivamento
                                      </div>
                                    )}
                                    {(!Array.isArray(ac.aiAnalysisData.determinacoes) || ac.aiAnalysisData.determinacoes.length === 0) && 
                                     (!Array.isArray(ac.aiAnalysisData.recomendacoes) || ac.aiAnalysisData.recomendacoes.length === 0) && 
                                     (!Array.isArray(ac.aiAnalysisData.darCiencia) || ac.aiAnalysisData.darCiencia.length === 0) && 
                                     !ac.aiAnalysisData.determinaArquivamento && (
                                      <span className="text-xs text-slate-500">Nenhuma ação técnica identificada neste documento.</span>
                                    )}
                                  </div>
                                </div>
                              ) : (ac.RECOMENDACOES_DETERMINACOES_UNIFICADO || ac.RECOMENDACOES || ac.DETERMINACOES) && (
                                <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                                    <FileCheck className="w-4 h-4 text-[#1351b4]" />
                                    <span className="text-[10px] text-[#1351b4] block uppercase font-extrabold tracking-wider">
                                      Recomendações e Determinações
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap mt-2">
                                    {ac.RECOMENDACOES_DETERMINACOES_UNIFICADO || "Nenhuma recomendação ou determinação registrada."}
                                  </div>
                                </div>
                              )}

                              {/* Document content */}
                              <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                <div className="text-[10px] text-[#1351b4] uppercase font-extrabold tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                                  <FileText className="w-4 h-4" />
                                  <span>Texto Completo do Acórdão</span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                  <span className="text-xs text-slate-600 font-medium">O documento original pode ser visualizado na íntegra.</span>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewFullText(ac);
                                    }}
                                    className="text-[11px] text-white font-bold bg-[#1351b4] hover:bg-blue-800 px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer font-sans"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" /> Ler Inteiro Teor
                                  </button>
                                </div>
                              </div>

                              {/* Verification Panel (SIAFI / Portal da Transparência) */}
                              <div className={`p-4.5 rounded-xl border space-y-3 no-print transition-all duration-300 ${hasValoresARessarcir(ac) ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-slate-200 shadow-sm"}`}>
                                {hasValoresARessarcir(ac) && (
                                  <div className="flex items-center gap-1.5 mb-2 bg-orange-100 text-orange-800 w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                    <AlertCircle className="w-3.5 h-3.5" /> Possível Débito ao Tesouro Nacional
                                  </div>
                                )}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="text-[10px] text-[#1351b4] uppercase font-black tracking-wider flex items-center gap-1.5">
                                    <Scale className="w-4 h-4" />
                                    Dossiê de Ressarcimento (SIAFI / Extração)
                                  </span>
                                  <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono font-bold">
                                    CONCILIAÇÃO
                                  </span>
                                </div>
                                

                                  <div className="pt-2">
                                  {!ac.aiAnalysisData?.dossieRessarcimento ? (
                                    <div className="text-xs text-slate-500 italic flex flex-col gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                      <span>Nenhum dossiê extraído. Clique abaixo para extrair dados localmente via RegEx.</span>
                                      <div className="flex gap-2 mt-1">
                                        <button 
                                          type="button"
                                          onClick={async (e) => { 
                                            e.stopPropagation(); 
                                            try {
                                              const fullTextData = await handleViewFullText(ac, true);
                                              const teor = fullTextData?.acordao || currentFullText || "";
                                              if (teor) {
                                                const result = extractLocalHeuristics(teor);
                                                await onUpdateAcordao({ ...ac, aiAnalysisData: result });
                                              }
                                            } catch (err) {
                                              console.error("Erro na extração local:", err);
                                            }
                                          }}
                                          className="text-[11px] font-bold bg-[#1351b4] text-white hover:bg-blue-800 transition px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"
                                        >
                                          <Search className="w-3.5 h-3.5" /> Extrair Dados Localmente (RegEx)
                                        </button>
                                      </div>
                                    </div>
                                  ) : Array.isArray(ac.aiAnalysisData.dossieRessarcimento) && ac.aiAnalysisData.dossieRessarcimento.length === 0 ? (
                                    <div className="text-xs text-slate-600 italic">O extrator local não identificou condenação em débito ou devolução de valores no inteiro teor deste acórdão.</div>
                                  ) : Array.isArray(ac.aiAnalysisData.dossieRessarcimento) ? (
                                    <div className="space-y-3">
                                      {ac.aiAnalysisData.dossieRessarcimento.map((resp: any, i: number) => (
                                        <div key={i} className="bg-white p-2.5 rounded border border-[#1351b4]/20 shadow-sm text-xs">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <div className="font-bold text-slate-800">{resp.nome}</div>
                                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">CPF/CNPJ Identificado: {resp.cpf_cnpj || resp.cpf || "Não extraído"}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                              <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-100">
                                                Débito: {resp.valor_debito || resp.valor}
                                              </div>
                                              {resp.valor_atualizado && resp.valor_atualizado !== "Não há" && (
                                                <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                                                  Atualizado: {resp.valor_atualizado}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {resp.trecho_fonte && (
                                            <div className="mb-3 bg-slate-50 p-2 rounded border border-slate-200 text-[10px] text-slate-600 italic">
                                              <span className="font-bold block not-italic text-slate-400 mb-0.5">Evidência Extraída do Acórdão:</span>
                                              "{resp.trecho_fonte}"
                                            </div>
                                          )}
                                          
                                          <div className="mt-2 pt-2 border-t border-slate-100">
                                            <span className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Resultado da Busca no SIAFI</span>
                                              {!Array.isArray(resp.siafiEncontrados) || resp.siafiEncontrados.length === 0 ? (
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-slate-400"/> Nenhum registro correspondente encontrado no SIAFI com este Nome/CPF.</div>
                                              ) : (
                                                <div className="space-y-1.5">
                                                  {resp.siafiEncontrados.map((s: any, sIdx: number) => (
                                                    <div key={sIdx} className="flex items-center justify-between bg-slate-50 p-1.5 rounded text-[10px]">
                                                      <div>
                                                        <div className="font-mono text-slate-700">{s.cpf_beneficiario || "CPF Omitido"}</div>
                                                        <div className="text-slate-500">{s.status_descricao || "Status Indisponível"}</div>
                                                      </div>
                                                      <div>
                                                        {s.confirmado ? (
                                                          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-1"><Check className="w-3 h-3"/> GRU Confirmada</span>
                                                        ) : (
                                                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">Pendente / Outro</span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                              </div>

                              {/* Operating values annotations */}
                              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
                                <div className="space-y-1">
                                  <span className="text-[9px] text-slate-550 uppercase font-black tracking-wider">Observações de Acompanhamento (AECI)</span>
                                  <p className="text-xs text-slate-805 italic font-medium">“{ac.OBSERVACOES || "Sem observações cadastradas para este acórdão."}”</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleOpenEdit(ac)}
                                    className="px-4 py-2 bg-white border border-blue-250 text-[#003366] hover:bg-blue-50 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition shadow-2xs cursor-pointer font-sans"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Editar Notas e Prazos
                                  </button>
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

        {/* Footer Info Control with continuous scroll metrics */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 no-print">
          <div>
            Exibindo todos os <strong className="text-slate-800 font-bold">{filteredAcordaos.length}</strong> acórdãos mapeados • <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Filtros ativados com rolagem vertical infinita (páginas desativadas)</span>
          </div>
          
          <button
            onClick={() => {
              const scrollEl = document.querySelector(".custom-com-scroll-container");
              if (scrollEl) {
                scrollEl.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[#003366] font-black rounded-lg transition text-xs shadow-3xs"
          >
            Voltar ao Topo ↑
          </button>
        </div>

      </div>
      {isEditing && selectedAcordao && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 shadow-xl font-sans no-print">
          <div className="bg-white rounded-lg w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="gov-header px-5 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-blue-800 uppercase font-mono font-bold">{selectedAcordao.KEY}</span>
                <h3 className="text-sm font-bold font-display text-[#003366]">{selectedAcordao.TITULO}</h3>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-[#003366]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              
              {/* Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status do Monitoramento Interno:</label>
                <select
                  id="modal-edit-status"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-hidden"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Cumprido">Cumprido</option>
                  <option value="Atrasado">Atrasado (Fora do Prazo)</option>
                </select>
              </div>

              {/* Responsavel */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assessor Responsável (Interno):</label>
                <input
                  id="modal-edit-responsavel"
                  type="text"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-hidden"
                  placeholder="Nome do analista ou assessoria designada"
                  value={editResponsavel}
                  onChange={(e) => setEditResponsavel(e.target.value)}
                />
              </div>

              {/* Prazo */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Prazo Limite para Atendimento ao TCU:</label>
                <input
                  id="modal-edit-prazo"
                  type="date"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono text-slate-800 focus:outline-hidden"
                  value={editPrazo}
                  onChange={(e) => setEditPrazo(e.target.value)}
                />
              </div>

              {/* Observacoes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Histórico de Observações e Providências:</label>
                <textarea
                  id="modal-edit-observacoes"
                  className="w-full h-24 bg-slate-50 border border-slate-300 rounded p-2 text-xs text-slate-800 focus:outline-hidden"
                  placeholder="Registre as tratativas, link para processos SEI ou impedimentos técnicos para atendimento do acórdão..."
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                ></textarea>
              </div>

            </div>

            <div className="bg-slate-50 px-5 py-3.5 flex justify-end gap-2 border-t text-xs">
              <button
                id="btn-modal-cancel"
                onClick={() => setIsEditing(false)}
                className="px-4 py-1.5 font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                id="btn-modal-save"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold rounded shadow-xs transition"
              >
                Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PRINT-ONLY EMBEDDED DUST SHEETS */}
      <div className="hidden print-only">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase text-slate-900">Ministério do Trabalho e Emprego</h1>
          <h2 className="text-lg font-bold text-slate-700">AECI - Assessoria Especial de Controle Interno</h2>
          <h3 className="text-md text-slate-600 mt-2">Relatório de Monitoramento Sistemático de Demandas - TCU</h3>
          <p className="text-xs text-slate-500 mt-1">Extraído em: {new Date().toLocaleString("pt-BR")} | Usuário: Alessandro Barbosa (AECI)</p>
        </div>

        <table className="w-full text-xs text-left border border-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-300 text-slate-800 font-bold">
              <th className="p-2 border">Título / Código</th>
              <th className="p-2 border">Processo</th>
              <th className="p-2 border">Sessão</th>
              <th className="p-2 border">Responsável</th>
              <th className="p-2 border">Prazo</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Assunto</th>
            </tr>
          </thead>
          <tbody>
            {filteredAcordaos.map(ac => (
              <tr key={ac.KEY} className="border-b">
                <td className="p-2 border font-bold">{ac.TITULO.split(" - ")[0]}</td>
                <td className="p-2 border font-mono">{ac.PROC}</td>
                <td className="p-2 border">{ac.DATASESSAO}</td>
                <td className="p-2 border">{ac.RESPONSAVEL_INTERNO || "AECI"}</td>
                <td className="p-2 border font-mono font-bold">{new Date(ac.PRAZO_LIMITE + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                <td className="p-2 border font-bold">{ac.STATUS_MONITORAMENTO}</td>
                <td className="p-2 border text-slate-600">{ac.ASSUNTO}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
              {isLoadingTeor ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>Baixando o inteiro teor do acórdão do banco de dados...</span>
                </div>
              ) : (
                fullTextAcordao.ACORDAO || (fullTextAcordao as any).acordao || "Este acórdão não possui a íntegra dos autos gravada."
              )}
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
