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
  Archive
} from "lucide-react";
import { AcordaoDemand, ComunicacaoDemand, TceDemand, TceAcordaoMapping } from "../types";

interface TcuModuleProps {
  acordaos: AcordaoDemand[];
  onUpdateAcordao: (updated: AcordaoDemand) => Promise<boolean>;
  onDeleteAcordao: (key: string) => Promise<boolean>;
  onImportAcordaos: (listOrItems: string[] | any[]) => Promise<any>;
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
}

export default function TcuModule({ 
  acordaos: rawAcordaos, 
  onUpdateAcordao, 
  onDeleteAcordao, 
  onImportAcordaos,
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
  isLoading 
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

  // Pure sanitized memory collections to auto-repair previous session corruptions transparently
  const acordaos = React.useMemo(() => {
    return rawAcordaos.map(ac => ({
      ...ac,
      TITULO: sanitizePortugueseText(ac.TITULO),
      ASSUNTO: sanitizePortugueseText(ac.ASSUNTO),
      SUMARIO: sanitizePortugueseText(ac.SUMARIO),
      ACORDAO: sanitizePortugueseText(ac.ACORDAO)
    }));
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
    return rawTces.map(t => ({
      ...t,
      MOTIVO_INSTAURACAO: sanitizePortugueseText(t.MOTIVO_INSTAURACAO),
      SUBMOTIVO_INSTAURACAO: sanitizePortugueseText(t.SUBMOTIVO_INSTAURACAO),
      ULTIMO_POSICIONAMENTO: sanitizePortugueseText(t.ULTIMO_POSICIONAMENTO),
      DEBITO_ORIGINAL: formatCurrencyBRL(t.DEBITO_ORIGINAL),
      DEBITO_ATUALIZADO: formatCurrencyBRL(t.DEBITO_ATUALIZADO)
    }));
  }, [rawTces]);

  const comunicacoes = React.useMemo(() => {
    return rawComunicacoes.map(c => ({
      ...c,
      DESTINATARIO: sanitizePortugueseText(c.DESTINATARIO),
      CONTATO: sanitizePortugueseText(c.CONTATO),
      UNIDADE_EMITENTE: sanitizePortugueseText(c.UNIDADE_EMITENTE)
    }));
  }, [rawComunicacoes]);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [tcuActiveSection, setTcuActiveSection] = useState<"monitoramento" | "comunicacoes" | "tce">("monitoramento");

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
    setCurrentPage(1);
    setTceCurrentPage(1);
    setComCurrentPage(1);
  }, [tcuActiveSection]);

  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [colegiadoFilter, setColegiadoFilter] = useState("TODOS");
  const [anoFilter, setAnoFilter] = useState("TODOS");
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
  const [pasteContent, setPasteContent] = useState("");
  const [importResults, setImportResults] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [acordaoImportMessage, setAcordaoImportMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copySuccessAlert, setCopySuccessAlert] = useState(false);
  const [fullTextAcordao, setFullTextAcordao] = useState<AcordaoDemand | null>(null);
  const [copySuccessFullText, setCopySuccessFullText] = useState(false);

  // Trace / Sync audit logs states
  const [showSyncLogModal, setShowSyncLogModal] = useState(false);

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

  // File Upload and drag-and-drop parsing handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFileContent(file);
  };

  const readFileContent = (file: File) => {
    setAcordaoImportMessage(null);
    const fileName = file.name.toLowerCase();
    if (!fileName.startsWith("acordaos") && !fileName.startsWith("acórdãos")) {
      setAcordaoImportMessage(`Arquivo rejeitado! Para acórdãos, o nome do arquivo deve obrigatoriamente começar com "acordaos" (ex: acordaos.csv). Você enviou: "${file.name}".`);
      setIsReadingFile(false);
      return;
    }

    setIsReadingFile(true);
    readAndDecodeFile(
      file,
      (text) => {
        if (text) {
          setPasteContent((prev) => {
            if (prev.trim()) {
              return prev + "\n" + text;
            }
            return text;
          });
        }
      },
      () => {
        setIsReadingFile(false);
      }
    );
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFileContent(file);
    }
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
          ACORDAO_REF: acordaoVal
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
      const mappingRef = item.mapping.ACORDAO_REF;
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

  // Helper to parse CSV formatted Acórdãos base file with RFC 4180 multiline support
  const parseAcordaosCSV = (csvText: string): any[] => {
    if (!csvText || csvText.trim().length < 10) return [];

    // Detect delimiter from the first line (header)
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

    // Parse entire CSV with multiline support
    const allRows = parseCSVRobust(csvText, delimiter);
    if (allRows.length < 2) return [];

    // Extract and normalize headers
    const rawHeaders = allRows[0].map(h => h.replace(/^["']|["']$/g, "").trim().toUpperCase());
    const normalizedHeaders = rawHeaders.map(normalizeHeaderName);

    // Map important indices using fuzzy matching for robustness
    const idxNum = findHeaderIdx(normalizedHeaders, "NUMACORDAO", "NUM ACORDAO", "NUMEROACORDAO");
    const idxAno = findHeaderIdx(normalizedHeaders, "ANOACORDAO", "ANO ACORDAO");
    const idxAta = findHeaderIdx(normalizedHeaders, "NUMATA", "NUM ATA", "NUMEROATA");
    const idxColegiado = findHeaderIdx(normalizedHeaders, "COLEGIADO");
    const idxSessao = findHeaderIdx(normalizedHeaders, "DATASESSAO", "DATA SESSAO", "DATA DA SESSAO");
    const idxRelator = findHeaderIdx(normalizedHeaders, "RELATOR");
    const idxSituacao = findHeaderIdx(normalizedHeaders, "SITUACAO");
    const idxProc = findHeaderIdx(normalizedHeaders, "PROC", "PROCESSO");
    const idxRelacionados = findHeaderIdx(normalizedHeaders, "ACORDAOSRELACIONADOS", "ACORDAOS RELACIONADOS");
    const idxTipo = findHeaderIdx(normalizedHeaders, "TIPOPROCESSO", "TIPO PROCESSO", "TIPO DE PROCESSO", "TIPO_PROCESSO", "TIPODEPROCESSO", "TIPO", "CLASSE", "CLASSEPROCESSO", "CLASSE PROCESSO", "CLASSE_PROCESSO", "NMCLASSE", "NM_CLASSE", "NATUREZA", "NATUREZAPROCESSO", "NATUREZA DO PROCESSO", "NATUREZA_PROCESSO");
    const idxEntidade = findHeaderIdx(normalizedHeaders, "ENTIDADE");
    const idxUT = findHeaderIdx(normalizedHeaders, "UNIDADETECNICA", "UNIDADE TECNICA");
    const idxAssunto = findHeaderIdx(normalizedHeaders, "ASSUNTO");
    const idxAcordaoDoc = findHeaderIdx(normalizedHeaders, "INTEIROTEOR", "INTEIRO TEOR", "TEXTO", "ACORDAO");
    const idxDecisaoDoc = findHeaderIdx(normalizedHeaders, "DECISAO");
    const idxInteressados = findHeaderIdx(normalizedHeaders, "INTERESSADOS", "INTERESSADO");
    const idxSumario = findHeaderIdx(normalizedHeaders, "SUMARIO", "SUMÁRIO");
    const idxTitulo = findHeaderIdx(normalizedHeaders, "TITULO");

    // If both NUMACORDAO and ANOACORDAO indices are missing, look for a reference/code column (like 'Acórdão' containing '7321/2025')
    let idxRef = -1;
    if (idxNum === -1 || idxAno === -1) {
      idxRef = findHeaderIdx(normalizedHeaders, "ACORDAO", "ACORDAOREF", "REFERENCIA", "TITULO", "KEY", "CODIGO");
      if (idxRef === -1) {
        return [];
      }
    }

    const items: any[] = [];

    // Helper to get a clean field value from a row
    const getField = (row: string[], idx: number): string | undefined => {
      if (idx < 0 || idx >= row.length) return undefined;
      const val = row[idx]?.replace(/^["']|["']$/g, "").trim();
      return val || undefined;
    };

    const maxIdxToCheck = Math.max(idxNum, idxAno, idxRef);

    for (let i = 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.length < maxIdxToCheck + 1) continue;

      let numAcordaoVal = 0;
      let anoAcordaoVal = 0;

      if (idxNum !== -1 && idxAno !== -1) {
        numAcordaoVal = parseInt(getField(row, idxNum)?.replace(/[^\d]/g, "") || "0");
        anoAcordaoVal = parseInt(getField(row, idxAno)?.replace(/[^\d]/g, "") || "0");
      } else if (idxRef !== -1) {
        const refVal = getField(row, idxRef) || "";
        const match = refVal.match(/(\d+)[\/\-](\d{4})/);
        if (match) {
          numAcordaoVal = parseInt(match[1]);
          anoAcordaoVal = parseInt(match[2]);
        }
      }

      if (!numAcordaoVal || !anoAcordaoVal) continue;

      const item: any = {
        NUMACORDAO: numAcordaoVal,
        ANOACORDAO: anoAcordaoVal,
        NUMATA: getField(row, idxAta),
        COLEGIADO: getField(row, idxColegiado),
        DATASESSAO: getField(row, idxSessao),
        RELATOR: getField(row, idxRelator),
        SITUACAO: getField(row, idxSituacao),
        PROC: getField(row, idxProc),
        ACORDAOSRELACIONADOS: getField(row, idxRelacionados),
        TIPOPROCESSO: getField(row, idxTipo),
        ENTIDADE: getField(row, idxEntidade),
        UNIDADETECNICA: getField(row, idxUT),
        ASSUNTO: getField(row, idxAssunto),
        ACORDAO: getField(row, idxAcordaoDoc),
        DECISAO: getField(row, idxDecisaoDoc),
        INTERESSADOS: getField(row, idxInteressados),
        SUMARIO: getField(row, idxSumario),
        TITULO: getField(row, idxTitulo)
      };

      items.push(item);
    }

    return items;
  };

  // Trigger Import Action
  const handleRunImport = async () => {
    if (!pasteContent.trim()) return;
    setIsImporting(true);
    setImportResults(null);
    setAcordaoImportMessage(null);

    // Try parsing as CSV first!
    const parsedCSVItems = parseAcordaosCSV(pasteContent);

    let res: any = null;
    let totalItemsProcessed = 0;

    if (parsedCSVItems.length > 0) {
      totalItemsProcessed = parsedCSVItems.length;
      res = await onImportAcordaos(parsedCSVItems);
    } else {
      // Split input on newline or commas/semicolons of keys
      const items = pasteContent
        .split(/[\n,;]+/)
        .map(x => x.trim())
        .filter(x => x.length > 0);

      if (items.length === 0) {
        setIsImporting(false);
        return;
      }
      totalItemsProcessed = items.length;
      res = await onImportAcordaos(items);
    }

    if (res && res.results) {
      setImportResults(res.results);
      setPasteContent(""); // Clear paste area after success
      
      const successCount = res.results.filter((r: any) => r.status === "imported" || r.status === "success").length;
      const updatedCount = res.results.filter((r: any) => r.status === "updated").length;
      const cachedCount = res.results.filter((r: any) => r.status === "cached").length;
      const errorCount = res.results.filter((r: any) => r.status === "error").length;
      
      setAcordaoImportMessage(
        `Cruzamento finalizado com sucesso! Dos ${totalItemsProcessed} acórdãos processados: ` +
        `${successCount} novos inseridos, ${updatedCount} reconciliados/atualizados, ` +
        `${cachedCount} sem alterações (banco atualizado) e ${errorCount} falhas de processamento.`
      );

      // Auto-close import area after 5 seconds
      setTimeout(() => {
        setShowImporter(false);
        setAcordaoImportMessage(null);
      }, 5000);
    } else {
      setAcordaoImportMessage(res?.error || "Erro ao conectar ao importador de jurisprudência. Verifique o console para mais detalhes.");
    }
    setIsImporting(false);
  };

  const getAuditLogTxt = (): string => {
    if (!importResults) return "";
    
    // Calculate stats
    const totalCount = importResults.length;
    const successCount = importResults.filter((r: any) => r.status === "imported").length;
    const updatedCount = importResults.filter((r: any) => r.status === "updated" || r.status === "success").length;
    const cachedCount = importResults.filter((r: any) => r.status === "cached").length;
    const errorCount = importResults.filter((r: any) => r.status === "error").length;

    let log = "======================================================================\n";
    log += "     RELATÓRIO OFICIAL DE AUDITORIA, CRAWLER E CONCILIAÇÃO DE DADOS   \n";
    log += "               ÓRBITA-AECI - MINISTÉRIO DO TRABALHO E EMPREGO         \n";
    log += "======================================================================\n";
    log += `Data/Hora da Execução  : ${new Date().toLocaleString("pt-BR")}\n`;
    log += "Serviço Responsável    : Assessoria Especial de Controle Interno (AECI)\n";
    log += `Protocolo de Carga     : CGU-MTE-SYNC-${Date.now().toString().substring(5)}\n`;
    log += "----------------------------------------------------------------------\n";
    log += "RESUMO DO PROCESSAMENTO:\n";
    log += `- Total de Entradas Submetidas  : ${totalCount}\n`;
    log += `- Acórdãos Novos Importados     : ${successCount}\n`;
    log += `- Acórdãos Atualizados          : ${updatedCount}\n`;
    log += `- Registros já Cadastrados      : ${cachedCount}\n`;
    log += `- Erros / Desvios de Rastreamento: ${errorCount}\n`;
    log += "----------------------------------------------------------------------\n\n";
    log += "DETALHAMENTO DO RASTREAMENTO (RASTREAMENTO DE JURISPRUDÊNCIA / TRACING LINE-BY-LINE):\n";
    
    importResults.forEach((res: any, idx: number) => {
      const lineNum = String(idx + 1).padStart(3, "0");
      let prefix = "[SUCESSO]";
      if (res.status === "error") prefix = "[FALHA  ]";
      if (res.status === "cached") prefix = "[IGNORADO]";
      
      log += `${lineNum} | ${prefix} Entrada original: "${res.input}"\n`;
      log += `      -> Status: ${res.status.toUpperCase()}\n`;
      log += `      -> Mensagem do Sistema MTE: ${res.message}\n`;
      if (res.parsedNumero || res.parsedAno) {
        log += `      -> Parâmetros Extraídos: Nº ${res.parsedNumero || "Não extraído"} / Ano: ${res.parsedAno || "Não extraído"}\n`;
      }
      log += "----------------------------------------------------------------------\n";
    });
    
    log += "\n[FIM DO ARQUIVO DE LOG - ÓRBITA-AECI INTERNAL AUDITING ENGINE]";
    return log;
  };



  // Extract unique sorted list of years from the acórdãos
  const availableYears = Array.from(
    new Set(acordaos.map(ac => ac.ANOACORDAO).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

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

    return matchesSearch && matchesStatus && matchesColegiado && matchesAno;
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
      
      {/* Module Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print border-b border-slate-100 pb-4 border-dashed">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#003366]" />
            Tribunal de Contas da União — TCU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Acompanhamento de Acórdãos e Monitoramento de Processos</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {tcuActiveSection === "monitoramento" && (
            <>
              <button 
                id="btn-importer-toggle"
                onClick={() => { setShowImporter(!showImporter); setImportResults(null); }}
                className={`px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 ${
                  showImporter 
                    ? "bg-slate-800 text-white shadow-xs" 
                    : "bg-[#003366] text-white hover:bg-slate-900 shadow-sm"
                }`}
              >
                <Plus className="w-4 h-4" />
                {showImporter ? "Ocultar Importador" : "Importar Acórdãos do TCU"}
              </button>

              <button 
                id="btn-export-excel"
                onClick={handleExportExcel}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-50 hover:border-emerald-600 hover:text-emerald-700 transition duration-200 shadow-xs"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
            </>
          )}

          {tcuActiveSection === "comunicacoes" && (
            <button
              onClick={() => {
                setShowComImporter(!showComImporter);
                setParsedComItems(null);
                setComImportMessage(null);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 ${
                showComImporter
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-[#003366] text-white hover:bg-slate-900 shadow-sm"
              }`}
            >
              <Plus className="w-4 h-4" />
              {showComImporter ? "Ocultar Sincronizador" : "Sincronizar Arquivo (CSV)"}
            </button>
          )}
        </div>
      </div>

      {/* TCU Submodules Navigation */}
      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs mb-6">
        {[
          { id: "monitoramento", label: "Monitoramento", desc: "Acompanhamento de Acórdãos", icon: Database, isDev: false },
          { id: "comunicacoes", label: "Comunicações", desc: "Recepção de Ofícios & Notificações", icon: MessageSquare, isDev: false },
          { id: "tce", label: "Tomada de Contas Especial (TCE)", desc: "Apurar Danos ao Erário", icon: FileWarning, isDev: false },
        ].map((subSection) => {
          const SubIcon = subSection.icon;
          const isActive = tcuActiveSection === subSection.id;
          return (
            <button
              key={subSection.id}
              onClick={() => {
                setTcuActiveSection(subSection.id as any);
                setSelectedAcordao(null);
                setIsEditing(false);
              }}
              className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SubIcon className={`w-5 h-5 ${isActive ? "text-blue-200" : "text-slate-400"}`} />
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wide leading-none">{subSection.label}</span>
                  <span className="block text-[9px] opacity-75 mt-0.5 font-normal leading-none">{subSection.desc}</span>
                </div>
              </div>
              {subSection.isDev && (
                <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide leading-none ${
                  isActive ? "bg-amber-400 text-slate-900 animate-pulse" : "bg-slate-100 text-slate-500"
                }`}>
                  Breve
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tcuActiveSection === "monitoramento" && (
        <>

      {/* TCU Acórdão Importer Section - Premium Bento Box */}
      {showImporter && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 pointer-events-none opacity-40"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                Importação Direta de Jurisprudência (Dados Abertos)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Insira ou cole a lista de acórdãos conforme constam na planilha do TCU. O ORBITA processará a cadeia de texto, isolará o número e ano e captará os dados detalhados na API. 
                <span className="font-extrabold text-[#003366] bg-slate-100 px-1.5 py-0.5 rounded ml-1 font-mono">Exemplo: 14068/2023-1C ou 2345/2024-PL</span>
              </p>
            </div>
            <button onClick={() => setShowImporter(false)} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag & Drop File Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition text-center cursor-pointer ${
                  isDragOver 
                    ? "border-[#003366] bg-blue-50/50" 
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/55"
                }`}
                onClick={() => document.getElementById("file-import-input")?.click()}
              >
                <input 
                  type="file" 
                  id="file-import-input" 
                  accept=".txt,.csv" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                
                <div className="p-3 bg-white rounded-full shadow-2xs mb-2 text-slate-500">
                  <FileUp className="w-6 h-6 text-[#003366]" />
                </div>
                
                <h4 className="text-xs font-bold text-slate-800">
                  {isReadingFile ? "Lendo arquivo..." : "Arraste um arquivo (.txt, .csv) ou clique"}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                  O arquivo será lido localmente e adicionado à lista para processamento
                </p>
                <span className="mt-2 text-[9px] bg-[#003366] hover:bg-slate-900 text-white font-bold px-3 py-1 rounded-lg shadow-2xs">
                  Selecionar Arquivo
                </span>
              </div>

              {/* Textarea View of Content */}
              <div className="flex flex-col">
                <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider mb-1 block">
                  Códigos de Acórdãos a Importar
                </label>
                <textarea
                  id="txt-importer-input"
                  className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition"
                  placeholder="Selecione um arquivo ou cole os acórdãos diretamente aqui (ex: 14068/2023-1C ou 2345/2024-PL)"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  style={{ minHeight: "140px" }}
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                id="btn-clear-importer"
                onClick={() => setPasteContent("")}
                className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 transition"
              >
                Limpar Campo
              </button>
              <button
                id="btn-execute-import"
                onClick={handleRunImport}
                disabled={isImporting || !pasteContent.trim()}
                className="px-4 py-2 bg-[#003366] hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 transition duration-200"
              >
                {isImporting ? "Iniciando Rastreamento..." : "Processar e Sincronizar da API TCU"}
              </button>
            </div>

            {acordaoImportMessage && (
              <div className="p-3.5 bg-blue-50 border border-blue-100 text-[#003366] rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#003366]" />
                <span>{acordaoImportMessage}</span>
              </div>
            )}

            {/* Import Feedback Report */}
            {importResults && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-[#003366] uppercase tracking-wider">
                      Relatório de Carga Automatizada:
                    </h4>
                    <p className="text-[9px] text-slate-500 mt-0.5">Sincronização processada localmente e integrada ao painel secundário.</p>
                  </div>
                  <button
                    onClick={() => setShowSyncLogModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-250 hover:bg-slate-105 text-[#003366] font-extrabold rounded-lg text-[10px] transition shadow-3xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#003366]" />
                    <span>Ver Log de Auditoria & Erros ({importResults.filter((r: any) => r.status === "error").length} falhas)</span>
                  </button>
                </div>
                
                <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
                  {importResults.map((res: any, i: number) => {
                    const isErr = res.status === "error";
                    const isCached = res.status === "cached";
                    return (
                      <div key={i} className="flex items-center justify-between text-xs py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isErr ? "bg-rose-500 animate-pulse" : isCached ? "bg-sky-550 text-sky-800" : "bg-emerald-500"
                          }`} />
                          <span className="font-mono text-slate-800 font-bold">{res.input}</span>
                          <span className="text-slate-500 text-[11px]">{res.message}</span>
                        </div>
                        {res.item && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ano: {res.parsedAno} | Nº {res.parsedNumero}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Audit Log Modal Viewport */}
      {showSyncLogModal && importResults && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[99999] animate-fade-in text-slate-900 select-all-normal">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-[#003366] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200">
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-tight font-sans">
                    Log Oficial de Conciliação e Rastreamento
                  </h3>
                  <code className="text-[9px] text-slate-300 block leading-none mt-0.5 tracking-wider font-mono">
                    SINC-TCU-AUDIT-REPORT
                  </code>
                </div>
              </div>
              <button 
                onClick={() => setShowSyncLogModal(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions for log */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                Filtrado por: <strong className="text-[#003366] font-bold">Todos os Registros Submetidos</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const txt = getAuditLogTxt();
                    navigator.clipboard.writeText(txt);
                    alert("Copiado com sucesso para a área de transferência!");
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-250 text-slate-700 font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiar Texto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const txt = getAuditLogTxt();
                    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `LOG-SYNC-TCU-${new Date().toISOString().slice(0,10)}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-white" /> Baixar Log (.TXT)
                </button>
              </div>
            </div>

            {/* Monospace Code Editor Log Viewer */}
            <div className="p-5 bg-slate-950 font-mono text-emerald-400 text-xs overflow-hidden">
              <div className="max-h-[380px] overflow-y-auto space-y-0.5 leading-relaxed antialiased pr-2 custom-terminal scrollbar-thin select-text">
                <pre className="whitespace-pre-wrap font-mono tracking-tight text-left">{getAuditLogTxt()}</pre>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-150 flex items-center justify-between">
              <p className="text-[9.5px] text-slate-400 leading-normal max-w-md">
                Gerado automaticamente pelo motor de sincronização Órbita-AECI. Para reportar falhas críticas no rastreador do TCU, envie o log acima para STI.
              </p>
              <button
                type="button"
                onClick={() => setShowSyncLogModal(false)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-black rounded-lg text-xs transition cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
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
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        
        {/* Search */}
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="txt-search-acordao"
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition text-slate-800"
            placeholder="Pesquisar por Título, Nº, Processo ou Assunto..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Dynamic Filters Selection */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-550">Situação:</span>
            <select
              id="select-filter-status"
              className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Pendente">Pendentes</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Cumprido">Cumpridos</option>
              <option value="Atrasado">Em Atraso</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-550">Colegiado:</span>
            <select
              id="select-filter-colegiado"
              className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
              value={colegiadoFilter}
              onChange={(e) => { setColegiadoFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="TODOS">Todos Colegiados</option>
              <option value="Plenário">Plenário</option>
              <option value="Primeira Câmara">1ª Câmara</option>
              <option value="Segunda Câmara">2ª Câmara</option>
            </select>
          </div>

          <button
            id="btn-reset-filters"
            onClick={() => { setSearchTerm(""); setStatusFilter("TODOS"); setColegiadoFilter("TODOS"); setAnoFilter("TODOS"); }}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
          >
            Limpar Filtros
          </button>
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
              <tr className="bg-slate-50 text-slate-705 font-bold uppercase tracking-wide text-[10px]">
                <th className="px-4 py-3 w-8 no-print bg-slate-100"></th>
                <th className="px-5 py-3 bg-slate-100">Título do Acórdão</th>
                <th className="px-4 py-3 bg-slate-100 font-sans">Processo TCU</th>
                <th className="px-4 py-3 bg-slate-100">Sessão / Data</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
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
                filteredAcordaos.map((ac) => {
                  const isExpanded = expandedRow === ac.KEY;
                  const isLate = ac.STATUS_MONITORAMENTO === "Atrasado" || (ac.STATUS_MONITORAMENTO !== "Cumprido" && new Date(ac.PRAZO_LIMITE).getTime() < Date.now());
                  const hasFullText = !!(ac.ACORDAO || (ac as any).acordao);
                  const currentFullText = (ac.ACORDAO || (ac as any).acordao || "").trim();

                  return (
                    <React.Fragment key={ac.KEY}>
                      
                      {/* Row Item */}
                      <tr className={`hover:bg-slate-50/50 transition duration-150 ${isExpanded ? "bg-slate-50/70" : ""}`}>
                        
                        {/* Expand toggle icon */}
                        <td className="px-4 py-3.5 no-print">
                          <button 
                            onClick={() => setExpandedRow(isExpanded ? null : ac.KEY)}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition text-left"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-600" /> : <ChevronRight className="w-4 h-4 text-slate-450" />}
                          </button>
                        </td>

                        {/* Title & Colegiado details */}
                        <td className="px-5 py-3.5">
                          <div>
                            <span 
                              className="font-extrabold text-[#003366] cursor-pointer hover:underline text-xs"
                              onClick={() => setExpandedRow(isExpanded ? null : ac.KEY)}
                            >
                              {ac.TITULO.split(" - ")[0]}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              Colegiado: {ac.COLEGIADO} | Ata: {ac.NUMATA}
                            </span>
                          </div>
                        </td>

                        {/* Process ID */}
                        <td className="px-4 py-3.5">
                          <code className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-[10px] text-slate-750 font-medium">
                            {ac.PROC}
                          </code>
                        </td>

                        {/* Session Date */}
                        <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{ac.DATASESSAO}</td>

                      </tr>

                      {/* Detail panel expansion */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-slate-50/25 px-8 py-6 border-b border-slate-200">
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
                                <div className="bg-white border p-3 rounded-xl shadow-2xs">
                                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Tipo Processo</span>
                                  <span className="text-xs text-slate-800 font-semibold">{ac.TIPOPROCESSO || "Não especificado"}</span>
                                </div>
                                <div className="bg-white border p-3 rounded-xl shadow-2xs">
                                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Entidade Interessada</span>
                                  <span className="text-xs text-slate-800 font-semibold">{ac.ENTIDADE || "MTE"}</span>
                                </div>
                                <div className="bg-white border p-3 rounded-xl shadow-2xs">
                                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Acórdãos Relacionados</span>
                                  <span className="text-xs text-slate-800 font-mono">{ac.ACORDAOSRELACIONADOS || "Nenhum"}</span>
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

                              {/* Document content */}
                              <div className="space-y-1">
                                <div className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider flex justify-between items-center mb-1">
                                  <span>Texto Completo do Acórdão</span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      type="button"
                                      onClick={() => setFullTextAcordao(ac)}
                                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border border-blue-200 font-sans"
                                    >
                                      <ExternalLink className="w-3 h-3" /> Visualizar em Tela Cheia (Popup)
                                    </button>
                                    <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">INTEGRA_DOS_AUTOS</span>
                                  </div>
                                </div>
                                <div className="relative group max-h-52 overflow-y-auto bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] whitespace-pre-line leading-relaxed scrollbar-thin border border-slate-950/20">
                                  {currentFullText || "O inteiro teor para este acórdão ainda não foi baixado."}
                                  {currentFullText && (
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent h-12 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        type="button"
                                        onClick={() => setFullTextAcordao(ac)}
                                        className="bg-[#1351b4] text-white hover:bg-blue-700 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md transition flex items-center gap-1 cursor-pointer font-sans"
                                      >
                                        <ExternalLink className="w-3 h-3" /> Expandir para Leitura Completa
                                      </button>
                                    </div>
                                  )}
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
            
            <div className="gov-header px-5 py-4 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] text-blue-200 uppercase font-mono">{selectedAcordao.KEY}</span>
                <h3 className="text-sm font-bold font-display">{selectedAcordao.TITULO}</h3>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-white hover:text-slate-200">
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
      </>
      )}

      {/* Comunicações Section - Fully Loaded Module with CSV Sync, Stats & CRUD */}
      {tcuActiveSection === "comunicacoes" && (
        <div className="space-y-6 animate-fade-in">

          {/* Importer Panel */}
          {showComImporter && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm no-print space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide">
                    Sincronizador Inteligente Year-over-Year
                  </h3>
                  <p className="text-xs text-slate-500 max-w-3xl">
                    Arraste ou selecione a planilha de qualquer ano (formato CSV separado por ponto e vírgula). O sistema analisará o lote, identificará o ano correspondente das expedições e unificará no banco consolidado, protegendo edições locais existentes.
                  </p>
                </div>
                <button
                  onClick={() => setShowComImporter(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOverCom(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragOverCom(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverCom(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) readComFileContent(file);
                  }}
                  onClick={() => document.getElementById("com-file-input")?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition text-center cursor-pointer ${
                    isDragOverCom
                      ? "border-[#003366] bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  <input
                    type="file"
                    id="com-file-input"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleComFileChange}
                  />
                  <div className="p-3 bg-white rounded-full shadow-2xs mb-2">
                    <Upload className="w-6 h-6 text-[#003366]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Soltar arquivo CSV aqui, ou clique para navegar
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Aceita planilha com Comunicação;Destinatário;Contato;Unidade Emitente;Processo;Data de Expedição;Data da Resposta
                  </p>
                </div>

                {/* Paste Area / Preview Area */}
                <div className="flex flex-col space-y-2">
                  <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">
                    Carga Manual ou Visualização das Linhas Lido
                  </label>
                  <textarea
                    className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition"
                    placeholder="Cole as linhas separadas por ponto e vírgula aqui caso não tenha o arquivo físico no dispositivo..."
                    value={comPasteContent}
                    onChange={(e) => {
                      setComPasteContent(e.target.value);
                      setParsedComItems(null);
                    }}
                    style={{ minHeight: "120px" }}
                  ></textarea>
                </div>
              </div>

              {comImportMessage && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 text-[#003366] rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{comImportMessage}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 text-xs">
                {comPasteContent.trim() && !parsedComItems && (
                  <button
                    onClick={() => {
                      const items = parseCommunicationsCSV(comPasteContent);
                      setParsedComItems(items);
                      setComImportMessage(`Identificados ${items.length} ofícios/comunicações na caixa de texto. Pronto para sincronizar.`);
                    }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 bg-white rounded-xl hover:bg-slate-50 font-bold transition"
                  >
                    Analisar Texto
                  </button>
                )}

                {parsedComItems && parsedComItems.length > 0 && (
                  <button
                    onClick={handleExecuteComImport}
                    disabled={isSavingCom}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-55 transition inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    {isSavingCom ? "Salvando no Banco..." : `Confirmar Sincronização (${parsedComItems.length} itens)`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Core Analytics & Filtering */}
          {(() => {
            const allComs = comunicacoes || [];
            
            // Gather statistics on the fully loaded list of communications
            const currentYearInt = parseInt(comAnoFilter);
            const totalForSelectedYear = allComs.filter(x => comAnoFilter === "TODOS" || x.ANO === currentYearInt);
            const totalComsCount = totalForSelectedYear.length;
            const respondedCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false && !!x.DATA_RESPOSTA && x.DATA_RESPOSTA.trim() !== "").length;
            const pendingCount = totalForSelectedYear.filter(x => x.CARECE_RESPOSTA !== false && (!x.DATA_RESPOSTA || x.DATA_RESPOSTA.trim() === "")).length;
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
              const term = comSearchTerm.toLowerCase();
              const matchesSearch = 
                item.COMUNICACAO.toLowerCase().includes(term) ||
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
              const statsMap: { [key: string]: { total: number; responded: number; pending: number } } = {};
              
              totalForSelectedYear.forEach(com => {
                const dest = com.DESTINATARIO || "Geral / Não Especificado";
                if (!statsMap[dest]) {
                  statsMap[dest] = { total: 0, responded: 0, pending: 0 };
                }
                const carece = com.CARECE_RESPOSTA !== false;
                statsMap[dest].total++;
                if (carece) {
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
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Universo de Ofícios</span>
                      <h4 className="text-2xl font-black text-slate-900">{totalComsCount}</h4>
                     <p className="text-[10px] text-slate-500">Mapeados no ano ({comAnoFilter === "TODOS" ? "Histórico Total" : comAnoFilter})</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-[#003366] rounded-xl animate-fade-in">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Respondidos</span>
                      <h4 className="text-2xl font-black text-emerald-700">{respondedCount}</h4>
                      <p className="text-[10px] text-emerald-600 font-semibold">Ofícios com resposta salvas</p>
                    </div>
                    <div className="p-3 bg bg-emerald-50 text-emerald-700 rounded-xl animate-fade-in">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resposta Pendente</span>
                      <h4 className="text-2xl font-black text-amber-600 inline-flex items-center gap-1.5">
                        {pendingCount}
                        {pendingCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />}
                      </h4>
                      <p className="text-[10px] text-slate-500">Aguardando instrução da assessoria</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl animate-fade-in">
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
                    <button
                      onClick={handleExportToExcel}
                      disabled={finalFiltered.length === 0}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 disabled:opacity-50 transition duration-150 shadow-xs"
                      title="Exportar dados e estatísticas para planilha Excel formatada com duas abas"
                    >
                      <Download className="w-4 h-4" />
                      Exportar para Excel (.xlsx)
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
                      <table className="w-full text-left border-collapse text-[10.5px] table-auto">
                        <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs font-mono text-[8px] uppercase tracking-wider text-slate-500">
                          <tr>
                            <th className="p-2.5 font-extrabold bg-slate-100 w-10 text-center no-print"></th>
                            <th className="p-2.5 font-extrabold bg-slate-100">Ofício / Comunicação</th>
                            <th className="p-2.5 font-extrabold bg-slate-100">Destinatário MTE</th>
                            <th className="p-2.5 font-extrabold bg-slate-100 text-center">Processo</th>
                            <th className="p-2.5 font-extrabold bg-slate-100 text-center">Expedição</th>
                            <th className="p-2.5 font-extrabold bg-slate-100 text-center">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
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
                                    <td className="p-2.5 text-center no-print">
                                      <button 
                                        onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
                                        className="text-slate-400 hover:text-[#003366] hover:bg-slate-100 p-1.5 rounded-lg transition"
                                      >
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#003366] stroke-[2.5]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                    </td>

                                    {/* Ofício/Comunicação */}
                                    <td className="p-2.5 font-bold text-[#003366]">
                                      <span 
                                        className="cursor-pointer hover:underline text-xs"
                                        onClick={() => setComExpandedRow(isExpanded ? null : item.KEY)}
                                      >
                                        {item.COMUNICACAO}
                                      </span>
                                    </td>

                                    {/* Destinatário */}
                                    <td className="p-2.5 font-semibold text-slate-800 truncate max-w-[280px]" title={item.DESTINATARIO}>
                                      {item.DESTINATARIO}
                                    </td>

                                    {/* Processo */}
                                    <td className="p-2.5 font-mono text-[10px] text-slate-600 text-center whitespace-nowrap">
                                      {item.PROCESSO || <span className="text-slate-350 italic">Não associado</span>}
                                    </td>

                                    {/* Expedição */}
                                    <td className="p-2.5 text-slate-500 text-center whitespace-nowrap font-mono font-medium">
                                      {item.DATA_EXPEDICAO}
                                    </td>

                                    {/* Situação */}
                                    <td className="p-2.5 text-center whitespace-nowrap">
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
                            const respRate = stat.total > 0 ? ((stat.responded / stat.total) * 100).toFixed(0) : "0";
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
                              <th className="p-3 font-bold text-center w-[130px]">Respondidos</th>
                              <th className="p-3 font-bold text-center w-[130px]">Pendentes (Em Aberto)</th>
                              <th className="p-3 font-bold text-center w-[200px]">% de Representação no Órgão</th>
                              <th className="p-3 font-bold text-center w-[130px]">Índice de Conclusão</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {destinatarioStats.map((stat, idx) => {
                              const respPct = stat.total > 0 ? (stat.responded / stat.total) * 100 : 0;
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
                                <td colSpan={6} className="p-12 text-center text-slate-400 italic">
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
              <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Responder / Editar Comunicação</h3>
                    <p className="text-xs text-slate-400 font-bold">{editingComItem.COMUNICACAO} • Ano {editingComItem.ANO}</p>
                  </div>
                  <button onClick={() => setEditingComItem(null)} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>

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
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
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
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      value={editComUnidadeExecutora}
                      onChange={(e) => setEditComUnidadeExecutora(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider block">Nº Processo SEI</label>
                    <input
                      type="text"
                      placeholder="Ex: 19973.100234/2026-99"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
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

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
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
      )}

      {/* TCE Section - Dual Fronts (Gerais / Com Acórdãos) */}
      {tcuActiveSection === "tce" && (() => {
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
          return matchesYear && matchesSearch;
        });

        // Resolve Mappings side-by-side
        const resolvedMappings = tceMappings.map(m => {
          const matchedTce = tces.find(t => t.NUMERO_ANO_TCE?.trim().toLowerCase() === m.NUMERO_ANO_TCE?.trim().toLowerCase());
          const matchedAc = findMatchedAcordao(m.ACORDAO_REF);
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
          const refStr = rm.mapping.ACORDAO_REF;
          const fullText = `${tceStr} ${acStr} ${refStr}`.toLowerCase();
          
          const matchesSearch = !tceSearchTerm || fullText.includes(tceSearchTerm.toLowerCase());
          return matchesYear && matchesSearch;
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
                  setShowTceImporter(false);
                }}
                className={`p-6 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group ${
                  tceActiveSubTab === "geral"
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
                  setShowTceImporter(false);
                }}
                className={`p-6 rounded-3xl text-left border transition-all duration-300 relative overflow-hidden group ${
                  tceActiveSubTab === "com-acordaos"
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
                className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                  tceSelectedYear === "TODOS"
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
                  className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                    tceSelectedYear === yr.toString()
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
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Universo de TCE</span>
                  <h4 className="text-2xl font-black text-slate-900">{tcesForSelectedYear.length}</h4>
                  <p className="text-[10px] text-slate-500">Instâncias no ano ({tceSelectedYear === "TODOS" ? "Histórico Total" : tceSelectedYear})</p>
                </div>
                <div className="p-3 bg-blue-50 text-[#003366] rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Débito Atualizado</span>
                  <h4 className="text-xl font-black text-slate-900 truncate max-w-[170px]" title={formattedSelectedYearDebito}>{formattedSelectedYearDebito}</h4>
                  <p className="text-[10px] text-slate-500">Montante acumulado no ano</p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TCEs Vinculadas</span>
                  <h4 className="text-2xl font-black text-emerald-700">{linkedCount}</h4>
                  <p className="text-[10px] text-emerald-600 font-semibold">Cruzamentos bem sucedidos</p>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Merge className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TCEs Pendentes</span>
                  <h4 className="text-2xl font-black text-rose-700 inline-flex items-center gap-1.5 animate-pulse font-sans">
                    {pendingTceCount}
                  </h4>
                  <p className="text-[10px] text-rose-600 font-semibold">Aguardando vínculo</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
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
                    <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
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
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center transition text-center cursor-pointer ${
                      isDragOverTce
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

            {/* Editing Supervisor Position Box */}
            {editingTceItem && (
              <div className="bg-amber-50/50 border border-amber-200 p-6 rounded-3xl space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase text-[#003366] tracking-wider">
                    Atualizar Posicionamento de Supervisor — {editingTceItem.NUMERO_ANO_TCE}
                  </h4>
                  <button onClick={() => setEditingTceItem(null)} className="text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Texto do Último Posicionamento:</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-800"
                    value={editTcePosicionamento}
                    onChange={(e) => setEditTcePosicionamento(e.target.value)}
                    placeholder="Adicione as últimas informações ou andamento do processo federal..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingTceItem(null)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs text-slate-600"
                  >
                    Mudar de Ideia
                  </button>
                  <button
                    onClick={async () => {
                      if (onUpdateTce) {
                        const updated = { ...editingTceItem, ULTIMO_POSICIONAMENTO: editTcePosicionamento };
                        const ok = await onUpdateTce(updated);
                        if (ok) {
                          setEditingTceItem(null);
                        } else {
                          alert("Erro ao salvar posicionamento.");
                        }
                      }
                    }}
                    className="px-4 py-1.5 bg-[#003366] hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Salvar Novo Parecer
                  </button>
                </div>
              </div>
            )}

            {/* Filter Row and Contextual Importer Button */}
            <div className="bg-slate-100 p-2.5 rounded-2xl flex flex-col items-stretch md:flex-row md:items-center justify-between gap-3 shadow-3xs">
              <div className="flex gap-1.5 shrink-0">
                <button
                  id="btn-tce-importer-toggle"
                  onClick={() => {
                    setShowTceImporter(!showTceImporter);
                    setTceImportMessage(null);
                    setParsedTceItems(null);
                    setParsedTceMappingItems(null);
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 ${
                    showTceImporter
                      ? "bg-slate-800 text-white shadow-xs"
                      : "bg-[#003366] text-white hover:bg-[#002244] shadow-sm"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {showTceImporter 
                    ? "Ocultar Importador" 
                    : tceActiveSubTab === "geral" 
                      ? "Sincronizar Planilha Geral" 
                      : "Sincronizar Mapeamentos de Acórdãos"}
                </button>
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

                <button
                  onClick={() => {
                    if (tceActiveSubTab === "geral") {
                      handleExportTcesExcel(filteredTces);
                    } else {
                      handleExportTcesAcordaosExcel(filteredMappings);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  XLSX
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
                    <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs">
                      <tr className="bg-slate-50 text-slate-705 font-bold uppercase tracking-wide text-[10px]">
                        <th className="px-4 py-3 w-8 no-print bg-slate-100"></th>
                        <th className="px-5 py-3 bg-slate-100">Nº / Ano (TCE)</th>
                        <th className="px-4 py-3 bg-slate-100">Processo TCU</th>
                        <th className="px-4 py-3 bg-slate-100">Assunto / Motivo da Instauração</th>
                        <th className="px-4 py-3 bg-slate-100 text-right">Débito Atualizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTces.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 font-sans">
                            Nenhuma tomada de conta especial corresponde aos filtros aplicados. Carregue novos dados via Planilha MTE.
                          </td>
                        </tr>
                      ) : (
                        filteredTces.map((tce, idx) => {
                          const isExpanded = tceExpandedId === tce.id;
                          const hasMapping = tceMappings.some(m => m.NUMERO_ANO_TCE?.toLowerCase() === tce.NUMERO_ANO_TCE?.toLowerCase());

                          return (
                            <React.Fragment key={tce.id}>
                              <tr className={`hover:bg-slate-50/55 transition duration-155 ${isExpanded ? "bg-slate-50/70" : ""}`}>
                                <td className="px-4 py-3.5 no-print">
                                  <button
                                    onClick={() => setTceExpandedId(isExpanded ? null : tce.id)}
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
                                        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-3xs space-y-1">
                                          <span className="text-[9px] text-[#003366] font-black uppercase tracking-wider block">ID Registro / Chave</span>
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
                    <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs">
                      <tr className="bg-slate-50 text-slate-705 font-bold uppercase tracking-wide text-[10px]">
                        <th className="px-4 py-3 w-8 no-print bg-slate-100"></th>
                        <th className="px-5 py-3 bg-slate-100">Nº TCE</th>
                        <th className="px-4 py-3 bg-slate-100 font-sans">Processo TCU / Motivo</th>
                        <th className="px-4 py-3 bg-slate-100">Acórdão Mapeado (Referência)</th>
                        <th className="px-4 py-3 bg-slate-100">Chave Base Recente</th>
                        <th className="px-4 py-3 bg-slate-100 text-center">Status Cruzamento</th>
                        <th className="px-4 py-3 bg-slate-100 pr-6">Colegiado / Data Sessão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMappings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 font-sans">
                            Nenhum mapeamento TCE {"<=>"} Acórdão corresponde aos termos digitados. Faça o upload do arquivo de sincronização de acórdãos TCU.
                          </td>
                        </tr>
                      ) : (
                        filteredMappings.map((item, idx) => {
                          const isExpanded = tceExpandedId === `map-${item.mapping.NUMERO_ANO_TCE}`;
                          const isMatched = !!item.acordao;

                          return (
                            <React.Fragment key={idx}>
                              <tr className={`hover:bg-slate-50/55 transition duration-155 ${isExpanded ? "bg-slate-50/70" : ""}`}>
                                <td className="px-4 py-3.5 no-print">
                                  <button
                                    onClick={() => setTceExpandedId(isExpanded ? null : `map-${item.mapping.NUMERO_ANO_TCE}`)}
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
                                <td className="px-4 py-3.5 font-semibold text-slate-900 italic text-[#1351b4]">{item.mapping.ACORDAO_REF}</td>
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
                                            {item.mapping.ACORDAO_REF}
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
                                                onClick={() => setFullTextAcordao(item.acordao)}
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
                                              Este acórdão (<strong className="text-rose-800">{item.mapping.ACORDAO_REF}</strong>) está mapeado para esta TCE, mas o teor oficial ou seus metadados ainda não foram importados para o Repositório AECI.
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setTcuActiveSection("monitoramento");
                                                setSearchTerm(item.mapping.ACORDAO_REF);
                                                window.scrollTo({ top: 300, behavior: "smooth" });
                                              }}
                                              className="px-3.5 py-1.5 bg-[#003366] hover:bg-slate-900 text-white rounded-xl text-[10.5px] font-bold transition flex items-center gap-1.5 shadow-2xs"
                                            >
                                              <Search className="w-3.5 h-3.5" />
                                              Buscar e Importar Acórdão {item.mapping.ACORDAO_REF}
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-100 no-print animate-fade-in">
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
                  className={`w-full py-3 px-4 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 border transition cursor-pointer ${
                    copySuccessAlert
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
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-100 no-print animate-fade-in text-slate-800">
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
