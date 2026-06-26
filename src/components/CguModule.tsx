import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Building2,
  Calendar,
  Clock,
  Database,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FileUp,
  Filter,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  User,
  Activity,
  ArrowRightLeft
} from "lucide-react";
import { CguDemand, CguPublishedReport } from "../types";

interface CguModuleProps {
  cguDemands: CguDemand[];
  onUpdateCgu: (updated: CguDemand) => Promise<boolean>;
  onDeleteCgu: (id: string) => Promise<boolean>;
  onImportCgu: (items: CguDemand[]) => Promise<any>;
  isLoading: boolean;
  cguPublishedReports?: CguPublishedReport[];
  onImportCguReports?: (items: CguPublishedReport[]) => Promise<any>;
  onSyncCguReports?: () => Promise<any>;
  onDeleteCguReport?: (idTarefa: string) => Promise<boolean>;
}

interface GroupedReport {
  reportName: string;
  unidadeAuditada: string;
  categoria: string;
  demands: CguDemand[];
}

export default function CguModule({
  cguDemands = [],
  onUpdateCgu,
  onDeleteCgu,
  onImportCgu,
  isLoading,
  cguPublishedReports = [],
  onImportCguReports,
  onSyncCguReports,
  onDeleteCguReport
}: CguModuleProps) {
  // Submodule navigation state
  const [activeSubTab, setActiveSubTab] = useState<"demands" | "published">("demands");
  
  // Navigation section
  const [searchTerm, setSearchTerm] = useState("");
  const [anoFilter, setAnoFilter] = useState("TODOS");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [estadoFilter, setEstadoFilter] = useState("TODOS");
  const [unidadeFilter, setUnidadeFilter] = useState("TODOS");
  const [categoriaFilter, setCategoriaFilter] = useState("TODOS");
  const [prazoFilter, setPrazoFilter] = useState<"TODOS" | "ATRASADO" | "PROXIMO">("TODOS");

  // Published reports local states
  const [reportSearchTerm, setReportSearchTerm] = useState("");
  const [reportAnoFilter, setReportAnoFilter] = useState("TODOS");
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [showReportsImporter, setShowReportsImporter] = useState(false);
  const [isReadingReportsFile, setIsReadingReportsFile] = useState(false);
  const [isSavingReportsImport, setIsSavingReportsImport] = useState(false);
  const [reportsImportError, setReportsImportError] = useState<string | null>(null);
  const [reportsImportSuccessMessage, setReportsImportSuccessMessage] = useState<string | null>(null);
  const [parsedReportItems, setParsedReportItems] = useState<CguPublishedReport[] | null>(null);
  const [isReportsDragOver, setIsReportsDragOver] = useState(false);
  const [isSyncingReports, setIsSyncingReports] = useState(false);
  const [syncReportsSuccessMessage, setSyncReportsSuccessMessage] = useState<string | null>(null);
  const [syncReportsErrorMessage, setSyncReportsErrorMessage] = useState<string | null>(null);

  // Importer state
  const [showImporter, setShowImporter] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<CguDemand[] | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Table expansion (by reportName)
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  // Edit modal
  const [editingItem, setEditingItem] = useState<CguDemand | null>(null);
  const [editSituacao, setEditSituacao] = useState("");
  const [editEstado, setEditEstado] = useState("");
  const [editProvidencia, setEditProvidencia] = useState("");
  const [editResponsavel, setEditResponsavel] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Detail popup
  const [detailItem, setDetailItem] = useState<CguDemand | null>(null);

  // Dynamic extract years, categories, units, situations and states from data
  const availableYears = Array.from(
    new Set(
      cguDemands
        .map(x => x.ano)
        .filter((y): y is number => typeof y === "number" && !isNaN(y))
    )
  ).sort((a, b) => b - a);

  const availableCategories = Array.from(
    new Set(cguDemands.map(x => x.categoria || "OUTROS").filter(Boolean))
  ).sort();

  const availableUnits = Array.from(
    new Set(cguDemands.map(x => x.unidadeAuditada).filter(Boolean))
  ).sort();

  const availableSituations = Array.from(
    new Set(cguDemands.map(x => x.situacao).filter(Boolean))
  ).sort();

  const availableStates = Array.from(
    new Set(cguDemands.map(x => x.estado).filter(Boolean))
  ).sort();

  // Excel serial date to DD/MM/YYYY formatting helper
  const formatExcelDate = (val: any): string => {
    if (!val) return "";
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return "";
      const d = val.getDate();
      const m = val.getMonth() + 1;
      const y = val.getFullYear();
      return `${d < 10 ? "0" + d : d}/${m < 10 ? "0" + m : m}/${y}`;
    }
    if (typeof val === "number") {
      const date = new Date((val - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const d = date.getDate();
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        return `${d < 10 ? "0" + d : d}/${m < 10 ? "0" + m : m}/${y}`;
      }
    }
    const str = String(val).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
    }
    return str;
  };

  // Extract year from date string (supports DD/MM/YYYY and YYYY-MM-DD)
  const extractYear = (dateStr: string): number => {
    if (!dateStr) return new Date().getFullYear();
    const matchDmy = dateStr.match(/\/(\d{4})/);
    if (matchDmy) return parseInt(matchDmy[1]);
    const matchYmd = dateStr.match(/^(\d{4})/);
    if (matchYmd) return parseInt(matchYmd[1]);
    return new Date().getFullYear();
  };

  // Parse Title into Report Name and Recommendation Name
  const parseReportAndRec = (titulo: string) => {
    if (!titulo) return { reportName: "Não Informado", recName: "" };
    
    // Tenta separar por hífen ou travessão cercado de espaços primeiro
    let parts = titulo.split(/\s*[-–]\s*/);
    if (parts.length > 1) {
      const reportName = parts[0].trim() || "Não Informado";
      const recName = parts.slice(1).join(" - ").trim() || "Recomendação Única";
      return { reportName, recName };
    }

    // Tenta separar pelo espaço antes da palavra "Recomendação" ou "Recomendacao" ou "Recomendações"
    const recRegex = /\s+(?=Recomend[aã]c?[aã]o|Recomend[aã]c?[oõ]es)/i;
    parts = titulo.split(recRegex);
    if (parts.length > 1) {
      const reportName = parts[0].trim() || "Não Informado";
      const recName = parts.slice(1).join(" ").trim() || "Recomendação Única";
      return { reportName, recName };
    }

    // Fallback: se não encontrar nenhum divisor claro, tenta dividir no primeiro espaço que precede "Recomend"
    const recRegexFallback = /\s+(?=Recomend)/i;
    parts = titulo.split(recRegexFallback);
    if (parts.length > 1) {
      const reportName = parts[0].trim() || "Não Informado";
      const recName = parts.slice(1).join(" ").trim() || "Recomendação Única";
      return { reportName, recName };
    }

    // Último caso: não conseguiu separar
    return { reportName: titulo.trim(), recName: "Recomendação Única" };
  };

  // Helper function to extract report name and recommendation name with fallback grouping for simple titles (like INSS)
  const getCguReportAndRec = (d: CguDemand) => {
    let { reportName, recName } = parseReportAndRec(d.tituloTarefa);
    
    const cleanReport = reportName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const hasReportKeyword = /relatorio|auditoria|avaliacao/i.test(cleanReport);
    
    if (!hasReportKeyword && cleanReport.startsWith("recomend")) {
      recName = d.tituloTarefa;
      const unidade = d.unidadeAuditada ? d.unidadeAuditada.trim() : "Outros";
      reportName = `Recomendações da CGU — Unidade ${unidade}`;
    }
    
    return { reportName, recName };
  };

  // Get status of a deadline relative to today (helps highlight expiring)
  const getDeadlineStatus = (dataLimiteStr: string, situacao: string, estado: string): "ATRASADO" | "PROXIMO" | "REGULAR" | "SEM_PRAZO" => {
    const normalize = (str: string): string => {
      return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    const normSituacao = normalize(situacao);
    const normEstado = normalize(estado);

    // Critérios para considerar uma demanda em atraso ou vencimento próximo:
    // A situação deve ser "Em Análise" ou "Em Execução"
    const isSituacaoValida = normSituacao === "em analise" || normSituacao === "em execucao";

    // Estados de exclusão (onde NÃO deve ser computada como atrasada)
    const isEstadoExcluido = [
      "consolidada",
      "consolidado",
      "em analise pela unidade de auditoria",
      "concluida",
      "manifestacao enviada"
    ].includes(normEstado);

    // Situações de exclusão (onde NÃO deve ser computada como atrasada)
    const isSituacaoExcluida = [
      "concluida",
      "concluido",
      "cumprido",
      "manifestacao enviada",
      "fechada",
      "fechado",
      "recomendacao cancelada",
      "aberto"
    ].includes(normSituacao);

    if (!isSituacaoValida || isEstadoExcluido || isSituacaoExcluida) {
      return "REGULAR";
    }

    if (!dataLimiteStr) return "SEM_PRAZO";
    
    const parts = dataLimiteStr.split("/");
    if (parts.length === 3) {
      const limitDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      if (isNaN(limitDate.getTime())) return "SEM_PRAZO";
      
      const diffTime = limitDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return "ATRASADO";
      if (diffDays <= 15) return "PROXIMO"; // Expiry warning within 15 days
    }
    return "REGULAR";
  };

  // Robust Excel file parser using SheetJS
  const handleExcelUpload = (file: File) => {
    setImportError(null);
    setImportSuccessMessage(null);
    setParsedItems(null);

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportError("Formato de arquivo inválido. Por favor, envie um arquivo Excel (.xlsx).");
      return;
    }

    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonRows.length < 2) {
          setImportError("O arquivo Excel parece estar vazio ou não possui cabeçalhos na primeira linha.");
          setIsReadingFile(false);
          return;
        }

        const headers = jsonRows[0].map(h => String(h).trim());

        const normalizeHeader = (name: string): string => {
          return name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
        };

        const normalizedHeaders = headers.map(normalizeHeader);

        const findHeaderIndex = (keywords: string[]): number => {
          for (const kw of keywords) {
            const normKw = normalizeHeader(kw);
            for (let idx = 0; idx < normalizedHeaders.length; idx++) {
              if (normalizedHeaders[idx].includes(normKw)) {
                return idx;
              }
            }
          }
          return -1;
        };

        // Locate header indexes robustly
        const idxIdTarefa = findHeaderIndex(["id da tarefa", "idtarefa", "id", "tarefa"]);
        const idxSituacao = findHeaderIndex(["situacao", "status"]);
        const idxEstado = findHeaderIndex(["estado", "state"]);
        const idxTitulo = findHeaderIndex(["titulo da tarefa", "titulotarefa", "titulo"]);
        const idxDataInicio = findHeaderIndex(["data de inicio", "datainicio", "inicio"]);
        const idxDataFim = findHeaderIndex(["data de fim", "datafim", "fim"]);
        const idxDataLimite = findHeaderIndex(["data limite", "datalimite", "limite"]);
        const idxUnidadeAuditada = findHeaderIndex(["unidade auditada", "unidadeauditada"]);
        const idxUnidadesAuditoria = findHeaderIndex(["unidades de auditoria", "unidadesauditoria", "auditoria"]);
        const idxTextoMonitoramento = findHeaderIndex(["texto do monitoramento", "textomonitoramento", "monitoramento"]);
        const idxProvidencia = findHeaderIndex(["providencia", "providencias"]);
        const idxTipoUltimaManifestacao = findHeaderIndex(["tipo da ultima manifestacao", "tipodaultimamanifestacao", "tipo ultima manifestacao"]);
        const idxTextoUltimaManifestacao = findHeaderIndex(["texto da ultima manifestacao", "textodaultimamanifestacao", "texto ultima manifestacao"]);
        const idxDataUltimaManifestacao = findHeaderIndex(["data da ultima manifestacao", "datadaultimamanifestacao", "data ultima manifestacao"]);
        const idxTipoUltimoPosicionamento = findHeaderIndex(["tipo do ultimo posicionamento", "tipodoultimoposicionamento", "tipo ultimo posicionamento"]);
        const idxTextoUltimoPosicionamento = findHeaderIndex(["texto do ultimo posicionamento", "textodoultimoposicionamento", "texto ultimo posicionamento"]);
        const idxDataUltimoPosicionamento = findHeaderIndex(["data do ultimo posicionamento", "datadoultimoposicionamento", "data ultimo posicionamento"]);
        const idxCategoria = findHeaderIndex(["categoria"]);
        const idxDataLimiteInicial = findHeaderIndex(["data limite inicial", "datalimiteinicial"]);

        if (idxIdTarefa === -1 || idxTitulo === -1) {
          setImportError("Não foi possível identificar colunas críticas na primeira linha (Id da Tarefa, Título da Tarefa). Verifique a estrutura.");
          setIsReadingFile(false);
          return;
        }

        const parsedItems: CguDemand[] = [];

        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;

          const getVal = (colIdx: number): string => {
            if (colIdx === -1 || colIdx >= row.length) return "";
            return row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).trim() : "";
          };

          const getValDate = (colIdx: number): string => {
            if (colIdx === -1 || colIdx >= row.length) return "";
            return formatExcelDate(row[colIdx]);
          };

          const idTarefa = getVal(idxIdTarefa);
          if (!idTarefa) continue; // skip rows with empty IDs

          const dataInicioStr = getValDate(idxDataInicio);
          const parsedYear = extractYear(dataInicioStr);

          parsedItems.push({
            idTarefa,
            situacao: getVal(idxSituacao) || "Pendente",
            estado: getVal(idxEstado) || "Aberto",
            tituloTarefa: getVal(idxTitulo),
            dataInicio: dataInicioStr,
            dataFim: getValDate(idxDataFim),
            dataLimite: getValDate(idxDataLimite),
            unidadeAuditada: getVal(idxUnidadeAuditada),
            unidadesAuditoria: getVal(idxUnidadesAuditoria),
            textoMonitoramento: getVal(idxTextoMonitoramento),
            providencia: getVal(idxProvidencia),
            tipoUltimaManifestacao: getVal(idxTipoUltimaManifestacao),
            textoUltimaManifestacao: getVal(idxTextoUltimaManifestacao),
            dataUltimaManifestacao: getValDate(idxDataUltimaManifestacao),
            tipoUltimoPosicionamento: getVal(idxTipoUltimoPosicionamento),
            textoUltimoPosicionamento: getVal(idxTextoUltimoPosicionamento),
            dataUltimoPosicionamento: getValDate(idxDataUltimoPosicionamento),
            categoria: getVal(idxCategoria) || "OUTROS",
            dataLimiteInicial: getValDate(idxDataLimiteInicial),
            ano: parsedYear
          });
        }

        if (parsedItems.length === 0) {
          setImportError("Nenhum registro estrutural válido foi encontrado no arquivo.");
        } else {
          setParsedItems(parsedItems);
          setImportSuccessMessage(`${parsedItems.length} demandas CGU extraídas. Por favor, revise a pré-visualização técnica abaixo e clique em Salvar.`);
        }
      } catch (err) {
        console.error("Erro na leitura de Excel:", err);
        setImportError("Ocorreu uma falha no processador de arquivos Excel (.xlsx).");
      } finally {
        setIsReadingFile(false);
      }
    };
    reader.onerror = () => {
      setImportError("Falha na leitura do arquivo.");
      setIsReadingFile(false);
    };
    reader.readAsArrayBuffer(file);
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
      handleExcelUpload(file);
    }
  };

  const handleSaveImported = async () => {
    if (!parsedItems) return;
    setIsSavingImport(true);
    try {
      const res = await onImportCgu(parsedItems);
      if (res && res.success) {
        setImportSuccessMessage(`Importação salva! ${res.importedCount} criados, ${res.updatedCount} atualizados.`);
        setParsedItems(null);
        setTimeout(() => setShowImporter(false), 2500);
      } else {
        setImportError("Erro ao gravar demandas importadas no servidor.");
      }
    } catch (err) {
      console.error(err);
      setImportError("Falha de conexão com o banco de dados.");
    } finally {
      setIsSavingImport(false);
    }
  };

  const handleReportsExcelUpload = (file: File) => {
    setReportsImportError(null);
    setReportsImportSuccessMessage(null);
    setParsedReportItems(null);

    const isXlsx = file.name.toLowerCase().endsWith(".xlsx");
    const isCsv = file.name.toLowerCase().endsWith(".csv");

    if (!isXlsx && !isCsv) {
      setReportsImportError("Formato de arquivo inválido. Por favor, envie um arquivo Excel (.xlsx) ou CSV (.csv).");
      return;
    }

    setIsReadingReportsFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let jsonRows: any[][] = [];
        const arrayBuffer = e.target?.result as ArrayBuffer;

        if (isCsv) {
          // Dynamic encoding detection for CSV
          const bytes = new Uint8Array(arrayBuffer);
          const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
          let decodedText = "";
          try {
            decodedText = utf8Decoder.decode(bytes);
          } catch (err) {
            const latinDecoder = new TextDecoder("iso-8859-1");
            decodedText = latinDecoder.decode(bytes);
          }

          const workbook = XLSX.read(decodedText, { type: "string" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        } else {
          const data = new Uint8Array(arrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        }

        if (jsonRows.length < 2) {
          setReportsImportError("O arquivo enviado parece estar vazio ou não possui cabeçalhos na primeira linha.");
          setIsReadingReportsFile(false);
          return;
        }

        const headers = jsonRows[0].map(h => String(h).trim());

        const normalizeHeader = (name: string): string => {
          return name.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
        };

        const normalizedHeaders = headers.map(normalizeHeader);

        const findHeaderIndex = (keywords: string[]): number => {
          // 1. Exact match pass
          for (const kw of keywords) {
            const normKw = normalizeHeader(kw);
            for (let idx = 0; idx < normalizedHeaders.length; idx++) {
              if (normalizedHeaders[idx] === normKw) {
                return idx;
              }
            }
          }
          // 2. Starts with match pass
          for (const kw of keywords) {
            const normKw = normalizeHeader(kw);
            for (let idx = 0; idx < normalizedHeaders.length; idx++) {
              if (normalizedHeaders[idx].startsWith(normKw)) {
                return idx;
              }
            }
          }
          // 3. Substring match pass (fallback)
          for (const kw of keywords) {
            const normKw = normalizeHeader(kw);
            for (let idx = 0; idx < normalizedHeaders.length; idx++) {
              if (normalizedHeaders[idx].includes(normKw)) {
                return idx;
              }
            }
          }
          return -1;
        };

        // Locate header indexes based on standard CGU published report fields
        const idxIdTarefa = findHeaderIndex(["id da tarefa", "idtarefa", "tarefa", "id"]);
        const idxTituloRelatorio = findHeaderIndex(["titulo do relatorio", "titulorelatorio", "titulo", "relatorio", "nome do relatorio"]);
        const idxDataPublicacao = findHeaderIndex(["data de publicacao", "datapublicacao", "publicacao", "data"]);
        const idxIdAuditoria = findHeaderIndex(["id da auditoria", "idauditoria", "auditoria"]);
        const idxSiglaUnidadeAuditada = findHeaderIndex(["sigla da unidade auditada", "siglaunidadeauditada", "sigla auditada"]);
        const idxNomeUnidadeAuditada = findHeaderIndex(["nome da unidade auditada", "nomeunidadeauditada", "unidade auditada", "unidade"]);
        const idxSiglaOrgaoSuperior = findHeaderIndex(["sigla do orgao superior", "siglaorgaosuperior", "sigla superior", "orgao superior", "sigla orgao"]);
        const idxNomeOrgaoSuperior = findHeaderIndex(["orgaos", "orgao", "órgãos", "órgão", "nome do orgao superior", "nomeorgaosuperior", "orgao superior"]);
        const idxUf = findHeaderIndex(["uf", "estado"]);
        const idxMunicipio = findHeaderIndex(["municipio", "cidade"]);
        const idxTipoServico = findHeaderIndex(["tipo de servico", "tiposervico", "tipo servico", "servico"]);
        const idxLinhaAcao = findHeaderIndex(["linha de acao", "linhaacao", "linha acao"]);
        const idxGrupoAtividade = findHeaderIndex(["grupo de atividade", "grupoatividade", "grupo atividade", "atividade"]);
        const idxEdicaoPrograma = findHeaderIndex(["edicao programa sorteio / fef", "edicaoprograma", "fef"]);

        if (idxIdTarefa === -1 || idxTituloRelatorio === -1) {
          setReportsImportError("Não foi possível identificar as colunas críticas 'Id da Tarefa' e 'Título do Relatório' na primeira linha.");
          setIsReadingReportsFile(false);
          return;
        }

        const parsedReports: CguPublishedReport[] = [];

        // Normalize helper for unit audit target checks (e.g. MTE / MTP / INSS)
        const normalizeCheckText = (val: string): string => {
          return val.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        };

        let skippedNonMteCount = 0;

        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;

          const getVal = (colIdx: number): string => {
            if (colIdx === -1 || colIdx >= row.length) return "";
            return row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).trim() : "";
          };

          const getValDate = (colIdx: number): string => {
            if (colIdx === -1 || colIdx >= row.length) return "";
            return formatExcelDate(row[colIdx]);
          };

          const idTarefa = getVal(idxIdTarefa);
          if (!idTarefa) continue;

          const siglaAuditada = getVal(idxSiglaUnidadeAuditada);
          const nomeAuditada = getVal(idxNomeUnidadeAuditada);
          const siglaSuperior = getVal(idxSiglaOrgaoSuperior);
          const nomeSuperior = getVal(idxNomeOrgaoSuperior);
          const dataPublicacao = getValDate(idxDataPublicacao);

          // Filtering rule: must belong to MTE (Ministério do Trabalho e Emprego)
          // If the organ superior matches MTE/MTP, we immediately accept it.
          // Otherwise, fall back to checking the unit name.
          let isMte = false;
          
          if (idxNomeOrgaoSuperior !== -1 && nomeSuperior) {
            const normOrgao = normalizeCheckText(nomeSuperior);
            isMte = normOrgao.includes("trabalho") || 
                    normOrgao.includes("emprego") || 
                    normOrgao.includes("mte") || 
                    normOrgao.includes("mtp");
          } else {
            const otherOrgans = ['dnit','codevasf','incra','ufgd','ufpe','ifac','mgi','mec','caixa','mds','mtur','mpa','ceagesp','unifesp','fnde','prf','memp','mdic','mf','ms','midr','ufg','mps','turismo','saude','educacao','cgu','fazenda','planejamento','integracao','senac','sesi','inss'];
            const unitString = normalizeCheckText(`${nomeAuditada} ${siglaAuditada}`);
            const unitMatches = unitString.includes("trabalho") || 
                                unitString.includes("emprego") || 
                                unitString.includes("mte") || 
                                unitString.includes("mtp") ||
                                unitString.includes("srt") ||
                                unitString.includes("srte");
            const containsBlacklist = otherOrgans.some(b => unitString.includes(b));
            isMte = unitMatches && !containsBlacklist;
          }

          // Date filter: must be on or after 01/01/2023
          let dateOk = false;
          if (dataPublicacao) {
            const parts = dataPublicacao.split("/");
            if (parts.length === 3) {
              const d = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              const y = parseInt(parts[2], 10);
              const dateVal = new Date(y, m, d);
              if (!isNaN(dateVal.getTime())) {
                const start = new Date(2023, 0, 1);
                dateOk = dateVal >= start;
              }
            } else {
              const dateVal = new Date(dataPublicacao);
              if (!isNaN(dateVal.getTime())) {
                const start = new Date(2023, 0, 1);
                dateOk = dateVal >= start;
              }
            }
          }

          if (!isMte || !dateOk) {
            skippedNonMteCount++;
            continue;
          }

          parsedReports.push({
            idTarefa,
            tituloRelatorio: getVal(idxTituloRelatorio),
            dataPublicacao,
            idAuditoria: getVal(idxIdAuditoria) || idTarefa,
            siglaUnidadeAuditada: siglaAuditada || "MTE",
            nomeUnidadeAuditada: nomeAuditada || "Ministério do Trabalho e Emprego",
            siglaOrgaoSuperior: siglaSuperior || "MTE",
            nomeOrgaoSuperior: nomeSuperior || "Ministério do Trabalho e Emprego",
            uf: getVal(idxUf) || "DF",
            municipio: getVal(idxMunicipio) || "Brasília",
            tipoServico: getVal(idxTipoServico) || "Auditoria",
            linhaAcao: getVal(idxLinhaAcao),
            grupoAtividade: getVal(idxGrupoAtividade),
            edicaoPrograma: getVal(idxEdicaoPrograma)
          });
        }

        if (parsedReports.length === 0) {
          setReportsImportError(`Nenhum registro correspondente ao MTE dentro do período foi encontrado. (${skippedNonMteCount} registros de outros órgãos ou fora do período de 01/01/2023 até hoje foram ignorados).`);
        } else {
          setParsedReportItems(parsedReports);
          setReportsImportSuccessMessage(`${parsedReports.length} relatórios publicados do MTE carregados. (${skippedNonMteCount} registros de outros órgãos ou fora do período de 01/01/2023 até hoje foram filtrados e omitidos). Revise os dados e clique em Salvar.`);
        }
      } catch (err) {
        console.error("Erro na leitura do arquivo de relatórios:", err);
        setReportsImportError("Falha ao analisar o arquivo de relatórios da CGU.");
      } finally {
        setIsReadingReportsFile(false);
      }
    };
    reader.onerror = () => {
      setReportsImportError("Falha física na leitura do arquivo.");
      setIsReadingReportsFile(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveImportedReports = async () => {
    if (!parsedReportItems || !onImportCguReports) return;
    setIsSavingReportsImport(true);
    try {
      const res = await onImportCguReports(parsedReportItems);
      if (res && res.success) {
        setReportsImportSuccessMessage(`Importação concluída! ${res.importedCount} relatórios cadastrados, ${res.updatedCount} atualizados.`);
        setParsedReportItems(null);
        setTimeout(() => setShowReportsImporter(false), 2550);
      } else {
        setReportsImportError("Erro ao gravar relatórios importados no servidor.");
      }
    } catch (err) {
      console.error(err);
      setReportsImportError("Falha de conexão com o servidor de banco de dados.");
    } finally {
      setIsSavingReportsImport(false);
    }
  };

  const handleSyncReports = async () => {
    if (!onSyncCguReports) return;
    setIsSyncingReports(true);
    setSyncReportsSuccessMessage(null);
    setSyncReportsErrorMessage(null);
    try {
      const res = await onSyncCguReports();
      if (res && res.success) {
        setSyncReportsSuccessMessage(`Sincronização concluída com sucesso! ${res.importedCount} novos relatórios importados, ${res.updatedCount} atualizados.`);
      } else {
        setSyncReportsErrorMessage(res?.error || "Erro ao sincronizar relatórios com o portal da CGU.");
      }
    } catch (err) {
      console.error(err);
      setSyncReportsErrorMessage("Falha de conexão com o servidor de banco de dados.");
    } finally {
      setIsSyncingReports(false);
    }
  };

  // Filtering Logic
  // 1. Filtragem preliminar (antes do filtro de prazo interativo)
  const demandsBeforePrazoFilter = cguDemands.filter(d => {
    const matchYear = anoFilter === "TODOS" || String(d.ano) === anoFilter;
    const matchStatus = statusFilter === "TODOS" || d.situacao === statusFilter;
    const matchEstado = estadoFilter === "TODOS" || d.estado === estadoFilter;
    const matchUnidade = unidadeFilter === "TODOS" || d.unidadeAuditada === unidadeFilter;
    const matchCat = categoriaFilter === "TODOS" || d.categoria === categoriaFilter;
    
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      d.idTarefa.toLowerCase().includes(searchLower) ||
      d.tituloTarefa.toLowerCase().includes(searchLower) ||
      (d.unidadeAuditada && d.unidadeAuditada.toLowerCase().includes(searchLower)) ||
      (d.categoria && d.categoria.toLowerCase().includes(searchLower)) ||
      (d.textoMonitoramento && d.textoMonitoramento.toLowerCase().includes(searchLower));

    return matchYear && matchStatus && matchEstado && matchUnidade && matchCat && matchSearch;
  });

  // 2. Aplicação do filtro de prazo selecionado via painel de cards
  const filteredDemands = demandsBeforePrazoFilter.filter(d => {
    const ds = getDeadlineStatus(d.dataLimite, d.situacao, d.estado);
    return prazoFilter === "TODOS" ||
      (prazoFilter === "ATRASADO" && ds === "ATRASADO") ||
      (prazoFilter === "PROXIMO" && ds === "PROXIMO");
  });

  // Dynamically extract publication years from all MTE-only published reports
  const availableReportYears = Array.from(
    new Set(
      cguPublishedReports
        .filter(r => {
          const sup = (r.nomeOrgaoSuperior || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const unit = ((r.nomeUnidadeAuditada || "") + " " + (r.siglaUnidadeAuditada || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          let isMte = false;
          if (sup) {
            isMte = sup.includes("trabalho") || 
                    sup.includes("emprego") || 
                    sup.includes("mte") || 
                    sup.includes("mtp");
          } else {
            const otherOrgans = ['dnit','codevasf','incra','ufgd','ufpe','ifac','mgi','mec','caixa','mds','mtur','mpa','ceagesp','unifesp','fnde','prf','memp','mdic','mf','ms','midr','ufg','mps','turismo','saude','educacao','cgu','fazenda','planejamento','integracao','senac','sesi','inss'];
            const unitMatches = unit.includes("trabalho") || unit.includes("emprego") || unit.includes("mte") || unit.includes("mtp") || unit.includes("srt") || unit.includes("srte");
            const containsBlacklist = otherOrgans.some(b => unit.includes(b));
            isMte = unitMatches && !containsBlacklist;
          }
          return isMte;
        })
        .map(r => extractYear(r.dataPublicacao))
        .filter((y): y is number => typeof y === "number" && !isNaN(y))
    )
  ).sort((a, b) => b - a);

  const filteredReports = cguPublishedReports.filter(r => {
    // Safety check: must belong to MTE and not to any other public organ blacklist
    const sup = (r.nomeOrgaoSuperior || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const unit = ((r.nomeUnidadeAuditada || "") + " " + (r.siglaUnidadeAuditada || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let isMte = false;
    if (sup) {
      isMte = sup.includes("trabalho") || 
              sup.includes("emprego") || 
              sup.includes("mte") || 
              sup.includes("mtp");
    } else {
      const otherOrgans = ['dnit','codevasf','incra','ufgd','ufpe','ifac','mgi','mec','caixa','mds','mtur','mpa','ceagesp','unifesp','fnde','prf','memp','mdic','mf','ms','midr','ufg','mps','turismo','saude','educacao','cgu','fazenda','planejamento','integracao','senac','sesi','inss'];
      const unitMatches = unit.includes("trabalho") || unit.includes("emprego") || unit.includes("mte") || unit.includes("mtp") || unit.includes("srt") || unit.includes("srte");
      const containsBlacklist = otherOrgans.some(b => unit.includes(b));
      isMte = unitMatches && !containsBlacklist;
    }

    if (!isMte) {
      return false;
    }

    // 1. Year Filter
    if (reportAnoFilter !== "TODOS") {
      const year = extractYear(r.dataPublicacao);
      if (String(year) !== reportAnoFilter) {
        return false;
      }
    }

    // 2. Term Search Filter
    const sLower = reportSearchTerm.toLowerCase();
    return !reportSearchTerm ||
      r.idTarefa.toLowerCase().includes(sLower) ||
      (r.tituloRelatorio && r.tituloRelatorio.toLowerCase().includes(sLower)) ||
      (r.idAuditoria && r.idAuditoria.toLowerCase().includes(sLower)) ||
      (r.tipoServico && r.tipoServico.toLowerCase().includes(sLower)) ||
      (r.nomeUnidadeAuditada && r.nomeUnidadeAuditada.toLowerCase().includes(sLower)) ||
      (r.nomeOrgaoSuperior && r.nomeOrgaoSuperior.toLowerCase().includes(sLower)) ||
      (r.uf && r.uf.toLowerCase().includes(sLower)) ||
      (r.municipio && r.municipio.toLowerCase().includes(sLower));
  }).sort((a, b) => {
    const parseDateForSort = (str: string): number => {
      if (!str) return 0;
      const parts = str.split("/");
      if (parts.length === 3) {
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime() || 0;
      }
      return new Date(str).getTime() || 0;
    };
    return parseDateForSort(a.dataPublicacao) - parseDateForSort(b.dataPublicacao);
  });

  // Published reports statistics calculations
  const serviceCounts: Record<string, number> = {};
  filteredReports.forEach(r => {
    const s = r.tipoServico || "Não Informado";
    serviceCounts[s] = (serviceCounts[s] || 0) + 1;
  });
  const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);

  const superiorCounts: Record<string, number> = {};
  filteredReports.forEach(r => {
    const o = r.siglaOrgaoSuperior || r.nomeOrgaoSuperior || "Outros";
    superiorCounts[o] = (superiorCounts[o] || 0) + 1;
  });
  const topSuperiors = Object.entries(superiorCounts).sort((a, b) => b[1] - a[1]);

  const uniqueUfs = new Set(filteredReports.map(r => r.uf).filter(Boolean)).size;

  // Group filtered demands by Relatório
  const groupedReports: GroupedReport[] = [];
  filteredDemands.forEach(d => {
    const { reportName } = getCguReportAndRec(d);
    
    // Normalização robusta para comparar chaves de relatórios (remove nº, n.º, n°, no, etc.)
    const getReportKey = (name: string): string => {
      return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\bn[oº°\.]+/gi, "") // remove nº, n.º, n°, no, etc.
        .replace(/[^a-z0-9]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const dKey = getReportKey(reportName);
    let group = groupedReports.find(g => getReportKey(g.reportName) === dKey);
    if (!group) {
      group = {
        reportName,
        unidadeAuditada: d.unidadeAuditada || "MTE",
        categoria: d.categoria || "OUTROS",
        demands: []
      };
      groupedReports.push(group);
    }
    group.demands.push(d);
  });

  // Edit Modal triggers
  const startEdit = (item: CguDemand) => {
    setEditingItem(item);
    setEditSituacao(item.situacao || "Pendente");
    setEditEstado(item.estado || "Aberto");
    setEditProvidencia(item.providencia || "");
    setEditResponsavel((item as any).responsavelInterno || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    const updated: CguDemand = {
      ...editingItem,
      situacao: editSituacao,
      estado: editEstado,
      providencia: editProvidencia,
      // Store responsavelInterno dynamically in fields
      ...({ responsavelInterno: editResponsavel } as any)
    };

    const success = await onUpdateCgu(updated);
    if (success) {
      setEditingItem(null);
    }
    setIsSavingEdit(false);
  };

  // Exporter for CGU spreadsheet
  const handleExportExcel = () => {
    if (filteredDemands.length === 0) return;
    
    const sheetData = filteredDemands.map(d => ({
      "Id da Tarefa": d.idTarefa,
      "Situação": d.situacao,
      "Estado": d.estado,
      "Título da Tarefa": d.tituloTarefa,
      "Data de Início": d.dataInicio,
      "Data de Fim": d.dataFim,
      "Data Limite": d.dataLimite,
      "Unidade Auditada": d.unidadeAuditada,
      "Unidades de Auditoria": d.unidadesAuditoria,
      "Texto do Monitoramento": d.textoMonitoramento,
      "Providência": d.providencia,
      "Responsável Interno": (d as any).responsavelInterno || "",
      "Tipo da Última Manifestação": d.tipoUltimaManifestacao,
      "Texto da Última Manifestação": d.textoUltimaManifestacao,
      "Data da Última Manifestação": d.dataUltimaManifestacao,
      "Tipo do Último Posicionamento": d.tipoUltimoPosicionamento,
      "Texto do Último Posicionamento": d.textoUltimoPosicionamento,
      "Data do Último Posicionamento": d.dataUltimoPosicionamento,
      "Categoria": d.categoria,
      "Data Limite Inicial": d.dataLimiteInicial
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Demandas CGU");
    XLSX.writeFile(wb, `ORBITA_AECI_CGU_COMPILADO_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportReportsExcel = () => {
    if (filteredReports.length === 0) return;
    const sheetData = filteredReports.map(r => ({
      "Id da Tarefa": r.idTarefa,
      "Título do Relatório": r.tituloRelatorio,
      "Data de Publicação": r.dataPublicacao,
      "Id da Auditoria": r.idAuditoria,
      "Sigla da Unidade Auditada": r.siglaUnidadeAuditada,
      "Nome da Unidade Auditada": r.nomeUnidadeAuditada,
      "Sigla do Órgão Superior": r.siglaOrgaoSuperior,
      "Nome do Órgão Superior": r.nomeOrgaoSuperior,
      "UF": r.uf,
      "Município": r.municipio,
      "Tipo de Serviço": r.tipoServico,
      "Linha de Ação": r.linhaAcao,
      "Grupo de Atividade": r.grupoAtividade,
      "Edição Programa Sorteio / FEF": r.edicaoPrograma || ""
    }));

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatórios Publicados CGU");
    XLSX.writeFile(wb, `ORBITA_AECI_CGU_RELATORIOS_PUBLICADOS_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleOpenEcgAndCopy = (idTarefa: string, idAuditoria: string, titulo: string) => {
    // Copy idTarefa to clipboard
    navigator.clipboard.writeText(idTarefa).catch(() => {});
    setCopiedReportId(idTarefa);
    setTimeout(() => setCopiedReportId(null), 2000);

    // Build a safe filename from the report title
    const safeName = titulo
      ? titulo.replace(/[^a-zA-Z0-9\u00C0-\u024F\s\-_]/g, "").trim().substring(0, 80)
      : `Relatorio_CGU_${idAuditoria || idTarefa}`;

    // Open via proxy in a new tab — browser will display PDF inline
    const proxyUrl = `/api/cgu/reports/pdf/${encodeURIComponent(idTarefa)}?filename=${encodeURIComponent(safeName)}`;
    window.open(proxyUrl, "_blank", "noopener,noreferrer");
  };

  const handleSearchInPortal = (titulo: string) => {
    // Open the e-CGU advanced search page (portal uses dynamic JS so we can't pre-fill)
    window.open("https://eaud.cgu.gov.br/relatorios/pesquisa", "_blank");
  };

  // Detect if a report has a public PDF (idAuditoria is purely numeric)
  const isPublicReport = (idAuditoria: string): boolean => {
    return /^\d+$/.test(idAuditoria || "");
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Count states based on selected parameters
  const totalCount = filteredDemands.length;

  // Lista de demandas filtradas por tudo EXCETO o anoFilter e o prazoFilter (para acumular todos os anos)
  const demandsIgnoreYearAndPrazo = cguDemands.filter(d => {
    const matchStatus = statusFilter === "TODOS" || d.situacao === statusFilter;
    const matchEstado = estadoFilter === "TODOS" || d.estado === estadoFilter;
    const matchUnidade = unidadeFilter === "TODOS" || d.unidadeAuditada === unidadeFilter;
    const matchCat = categoriaFilter === "TODOS" || d.categoria === categoriaFilter;
    
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      d.idTarefa.toLowerCase().includes(searchLower) ||
      d.tituloTarefa.toLowerCase().includes(searchLower) ||
      (d.unidadeAuditada && d.unidadeAuditada.toLowerCase().includes(searchLower)) ||
      (d.categoria && d.categoria.toLowerCase().includes(searchLower)) ||
      (d.textoMonitoramento && d.textoMonitoramento.toLowerCase().includes(searchLower));

    return matchStatus && matchEstado && matchUnidade && matchCat && matchSearch;
  });
  
  // Contagens dos cards interativos de prazos (desvinculados da seleção de ano para mostrar o total de todos os anos)
  const atrasadasCount = demandsIgnoreYearAndPrazo.filter(d => {
    const ds = getDeadlineStatus(d.dataLimite, d.situacao, d.estado);
    return ds === "ATRASADO";
  }).length;

  const proximasCount = demandsIgnoreYearAndPrazo.filter(d => {
    const ds = getDeadlineStatus(d.dataLimite, d.situacao, d.estado);
    return ds === "PROXIMO";
  }).length;

  // Função interna de normalização para contagens textuais específicas
  const normStr = (str: string): string => {
    return (str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Recomendações suspensas (Situação = Suspenso ou Estado = Suspenso)
  const suspensasCount = demandsBeforePrazoFilter.filter(d => {
    return normStr(d.situacao) === "suspenso" || normStr(d.estado) === "suspenso";
  }).length;

  // Recomendações concluídas (Situação = Cumprido/Concluído/Resolvido ou Estado = Concluído/Concluída)
  const concluidasCount = demandsBeforePrazoFilter.filter(d => {
    const sNorm = normStr(d.situacao);
    const eNorm = normStr(d.estado);
    return ["cumprido", "concluido", "concluida", "resolvido"].includes(sNorm) || ["concluido", "concluida"].includes(eNorm);
  }).length;

  // Recomendações consolidadas (Estado = consolidada/consolidado)
  const consolidadasCount = demandsBeforePrazoFilter.filter(d => {
    return ["consolidada", "consolidado"].includes(normStr(d.estado));
  }).length;

  // Auditorias em andamento (Quantidade de relatórios únicos que possuem pelo menos uma recomendação ativa de monitoramento)
  const activeReports = new Set<string>();
  demandsBeforePrazoFilter.forEach(d => {
    const sNorm = normStr(d.situacao);
    const eNorm = normStr(d.estado);
    const isEmAndamento = (sNorm === "em analise" || sNorm === "em execucao" || sNorm === "pendente") && 
                          !["consolidada", "consolidado", "concluida", "concluido", "fechada", "fechado"].includes(eNorm);
    if (isEmAndamento) {
      const { reportName } = getCguReportAndRec(d);
      activeReports.add(reportName.toLowerCase().trim());
    }
  });
  const auditoriasEmAndamentoCount = activeReports.size;

  // Quantidade de EM ANALISE PELA UNIDADE AUDITADA (Estado)
  const emAnaliseAuditadaCount = demandsBeforePrazoFilter.filter(d => {
    return normStr(d.estado) === "em analise pela unidade auditada";
  }).length;

  // Quantidade de EM ANALISE PELA UNIDADE DE AUDITORIA (Estado)
  const emAnaliseAuditoriaCount = demandsBeforePrazoFilter.filter(d => {
    return normStr(d.estado) === "em analise pela unidade de auditoria" || normStr(d.estado) === "em analise pela unidade de auditora";
  }).length;

  // Total das duas com o nome EM MONITORAMENTO
  const emMonitoramentoCount = emAnaliseAuditadaCount + emAnaliseAuditoriaCount;

  // Total Geral de Recomendações (com base nos filtros HUD ativos, antes do filtro de prazo)
  const totalRecomendacoesCount = demandsBeforePrazoFilter.length;

  // Custom styling badging helper for Estado to avoid color confusion
  const getEstadoBadgeStyle = (estado: string): string => {
    const norm = (estado || "").toLowerCase().trim();
    
    if (norm.includes("auditoria") || norm.includes("auditora")) {
      // Em análise pela unidade de auditoria (Purple theme)
      return "bg-purple-50 text-purple-750 border-purple-200";
    }
    if (norm.includes("auditada")) {
      // Em análise pela unidade auditada (Sleek light blue/sky theme)
      return "bg-sky-50 text-sky-750 border-sky-200";
    }
    if (norm.includes("execucao")) {
      // Em execução (Amber theme)
      return "bg-amber-50 text-amber-700 border-amber-250";
    }
    if (norm.includes("fechado") || norm.includes("concluido")) {
      // Fechado (Neutral slate theme)
      return "bg-slate-100 text-slate-600 border-slate-200";
    }
    if (norm.includes("aberto")) {
      // Aberto (Soft green theme)
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Module Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print border-b border-slate-100 pb-4 border-dashed">
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-display flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#003366]" />
            Controladoria-Geral da União — CGU
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de Recomendações e Monitoramento de Auditorias</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {activeSubTab === "demands" ? (
            <button
              onClick={() => {
                setShowImporter(!showImporter);
                setImportError(null);
                setImportSuccessMessage(null);
                setParsedItems(null);
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 ${
                showImporter
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-[#003366] text-white hover:bg-[#002244] shadow-sm"
              }`}
            >
              <Plus className="w-4 h-4" />
              {showImporter ? "Ocultar Importador" : "Importar Planilha CGU (.xlsx)"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowReportsImporter(!showReportsImporter);
                  setReportsImportError(null);
                  setReportsImportSuccessMessage(null);
                  setParsedReportItems(null);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 ${
                  showReportsImporter
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-[#003366] text-white hover:bg-[#002244] shadow-sm"
                }`}
              >
                <Plus className="w-4 h-4" />
                {showReportsImporter ? "Ocultar Importador" : "Importar Relatórios CGU (.xlsx)"}
              </button>

              {onSyncCguReports && (
                <button
                  onClick={handleSyncReports}
                  disabled={isSyncingReports}
                  className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition duration-200 shadow-sm cursor-pointer`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingReports ? "animate-spin" : ""}`} />
                  {isSyncingReports ? "Sincronizando..." : "Sincronizar com Dados Abertos"}
                </button>
              )}
            </div>
          )}

          <button
            onClick={activeSubTab === "demands" ? handleExportExcel : handleExportReportsExcel}
            disabled={activeSubTab === "demands" ? filteredDemands.length === 0 : filteredReports.length === 0}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-50 hover:border-emerald-600 hover:text-emerald-700 transition duration-200 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 hover:bg-slate-50 hover:border-[#003366] hover:text-[#003366] transition duration-200 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Imprimir (PDF)
          </button>
        </div>
      </div>
      {/* CGU Submodules Navigation (TCU Pattern) */}
      <div className="no-print border border-slate-200 bg-white p-1 rounded-2xl flex flex-wrap gap-1 shadow-xs mb-6">
        {[
          { id: "demands", label: "Monitoramento de Demandas", desc: "Acompanhamento de Recomendações", icon: Database },
          { id: "published", label: "Relatórios Publicados", desc: "Relatórios Oficiais da CGU", icon: FileText }
        ].map((subSection) => {
          const SubIcon = subSection.icon;
          const isActive = activeSubTab === subSection.id;
          return (
            <button
              type="button"
              key={subSection.id}
              onClick={(e) => {
                e.preventDefault();
                setActiveSubTab(subSection.id as any);
              }}
              className={`flex-1 min-w-[200px] flex items-center justify-between gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-[#003366] text-white shadow-md shadow-blue-900/15"
                  : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <SubIcon className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-wide leading-none">{subSection.label}</span>
                  <span className="block text-[9px] opacity-75 mt-0.5 font-normal leading-none">{subSection.desc}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {/* Importer Section */}
      {activeSubTab === "demands" && showImporter && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden no-print animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 pointer-events-none opacity-40"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Upload do Relatório do Sistema CGU
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Selecione ou arraste o arquivo Excel (.xlsx) extraído diretamente do sistema CGU. O sistema executará o mapeamento inteligente de dados e identificará automaticamente as 19 colunas requeridas.
              </p>
            </div>
            <button onClick={() => setShowImporter(false)} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition text-center cursor-pointer ${
                  isDragOver
                    ? "border-[#003366] bg-blue-50/30"
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                }`}
                onClick={() => document.getElementById("xlsx-import-input")?.click()}
              >
                <input
                  type="file"
                  id="xlsx-import-input"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleExcelUpload(file);
                  }}
                />

                <div className="p-3 bg-white rounded-full shadow-2xs mb-2">
                  <FileUp className="w-6 h-6 text-[#003366]" />
                </div>

                <p className="text-xs font-bold text-slate-700">Clique para anexar ou arraste a planilha</p>
                <p className="text-[10px] text-slate-400 mt-1">Apenas formato Excel (.xlsx)</p>
              </div>

              {/* Status and feedback panel */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Log de Processamento</span>
                  
                  {isReadingFile && (
                    <div className="flex items-center gap-2 text-xs text-[#003366] font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Lendo e analisando colunas do Excel...
                    </div>
                  )}

                  {importError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex items-start gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{importError}</span>
                    </div>
                  )}

                  {importSuccessMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs flex items-start gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{importSuccessMessage}</span>
                    </div>
                  )}

                  {!isReadingFile && !importError && !importSuccessMessage && (
                    <p className="text-xs text-slate-400 leading-normal">
                      Aguardando planilha de dados. O processamento segmentará as demandas com base no ano da coluna <strong>Data de Início</strong>.
                    </p>
                  )}
                </div>

                {parsedItems && parsedItems.length > 0 && (
                  <button
                    onClick={handleSaveImported}
                    disabled={isSavingImport}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isSavingImport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Salvar e Atualizar Repositório ({parsedItems.length} Itens)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Preview Area */}
            {parsedItems && parsedItems.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden mt-3 max-h-56 overflow-y-auto">
                <div className="bg-slate-100 px-4 py-2 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                  Pré-visualização dos registros extraídos
                </div>
                <table className="w-full text-left text-[11px] border-collapse bg-white">
                  <thead className="bg-slate-50 text-slate-650 font-bold sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5">Tarefa</th>
                      <th className="px-3 py-1.5">Título</th>
                      <th className="px-3 py-1.5">Data Início</th>
                      <th className="px-3 py-1.5">Unidade</th>
                      <th className="px-3 py-1.5">Categoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                    {parsedItems.slice(0, 10).map((pi, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 font-bold text-[#003366]">{pi.idTarefa}</td>
                        <td className="px-3 py-1.5 font-sans truncate max-w-xs">{pi.tituloTarefa}</td>
                        <td className="px-3 py-1.5">{pi.dataInicio}</td>
                        <td className="px-3 py-1.5 font-sans">{pi.unidadeAuditada}</td>
                        <td className="px-3 py-1.5 font-sans">{pi.categoria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedItems.length > 10 && (
                  <div className="bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-400 font-sans border-t">
                    Exibindo 10 de {parsedItems.length} registros.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "published" && showReportsImporter && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden no-print animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 pointer-events-none opacity-40"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-[#003366] uppercase tracking-wide flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Upload do Arquivo de Relatórios Publicados CGU
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Selecione ou arraste o arquivo oficial (.csv ou .xlsx) contendo a relação de relatórios publicados da CGU. O sistema aplicará um filtro automático para selecionar apenas os registros referentes ao MTE.
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setShowReportsImporter(false); }}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drag Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsReportsDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsReportsDragOver(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsReportsDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleReportsExcelUpload(file);
                }}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition text-center cursor-pointer ${
                  isReportsDragOver
                    ? "border-[#003366] bg-blue-50/30"
                    : "border-slate-200 hover:border-slate-350 bg-slate-50/50"
                }`}
                onClick={() => document.getElementById("xlsx-reports-import-input")?.click()}
              >
                <input
                  type="file"
                  id="xlsx-reports-import-input"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleReportsExcelUpload(file);
                  }}
                />

                <div className="p-3 bg-white rounded-full shadow-2xs mb-2">
                  <FileUp className="w-6 h-6 text-[#003366]" />
                </div>

                <p className="text-xs font-bold text-slate-700">Clique para anexar ou arraste o arquivo de relatórios</p>
                <p className="text-[10px] text-slate-400 mt-1">Formatos suportados: Excel (.xlsx) ou CSV (.csv)</p>
              </div>

              {/* Status and feedback panel */}
              <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Log de Processamento</span>
                  
                  {isReadingReportsFile && (
                    <div className="flex items-center gap-2 text-xs text-[#003366] font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Filtrando e mapeando relatórios do MTE...
                    </div>
                  )}

                  {reportsImportError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs flex items-start gap-2 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{reportsImportError}</span>
                    </div>
                  )}

                  {reportsImportSuccessMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs flex items-start gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{reportsImportSuccessMessage}</span>
                    </div>
                  )}

                  {!isReadingReportsFile && !reportsImportError && !reportsImportSuccessMessage && (
                    <p className="text-xs text-slate-400 leading-normal">
                      Aguardando planilha de dados. Apenas linhas correspondentes ao Ministério do Trabalho e Emprego (MTE) serão salvas (registros do INSS serão filtrados e descartados).
                    </p>
                  )}
                </div>

                {parsedReportItems && parsedReportItems.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveImportedReports();
                    }}
                    disabled={isSavingReportsImport}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {isSavingReportsImport ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Salvar e Atualizar Relatórios ({parsedReportItems.length} Itens)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Preview Area */}
            {parsedReportItems && parsedReportItems.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden mt-3 max-h-56 overflow-y-auto">
                <div className="bg-slate-100 px-4 py-2 text-[9px] font-black uppercase text-slate-500 tracking-wider">
                  Pré-visualização dos relatórios extraídos
                </div>
                <table className="w-full text-left text-[11px] border-collapse bg-white">
                  <thead className="bg-slate-50 text-slate-650 font-bold sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5">Tarefa</th>
                      <th className="px-3 py-1.5">Título do Relatório</th>
                      <th className="px-3 py-1.5">Publicação</th>
                      <th className="px-3 py-1.5">Unidade Auditada</th>
                      <th className="px-3 py-1.5">Tipo de Serviço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                    {parsedReportItems.slice(0, 10).map((pi, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-1.5 font-bold text-[#003366]">{pi.idTarefa}</td>
                        <td className="px-3 py-1.5 font-sans truncate max-w-xs">{pi.tituloRelatorio}</td>
                        <td className="px-3 py-1.5">{pi.dataPublicacao}</td>
                        <td className="px-3 py-1.5 font-sans">{pi.nomeUnidadeAuditada}</td>
                        <td className="px-3 py-1.5 font-sans">{pi.tipoServico}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedReportItems.length > 10 && (
                  <div className="bg-slate-50 px-4 py-2 text-center text-[10px] text-slate-400 font-sans border-t">
                    Exibindo 10 de {parsedReportItems.length} registros.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "demands" ? (
        <>
          {/* Year Selection and KPIs Grid */}
          <div className="space-y-4 no-print">
        {/* Year selectors */}
        <div className="flex border-b border-slate-150 overflow-x-auto gap-1 pb-1">
          <button
            onClick={() => setAnoFilter("TODOS")}
            className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
              anoFilter === "TODOS"
                ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                : "text-slate-400 hover:text-slate-700"
            }`}
          >
            Todos os Anos
          </button>
          {availableYears.map(y => (
            <button
              key={y}
              onClick={() => setAnoFilter(String(y))}
              className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                anoFilter === String(y)
                  ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Ano {y} {y === 2026 && <span className="bg-emerald-200 text-emerald-950 text-[8px] px-1 py-0.5 rounded font-black uppercase ml-1">Ativo</span>}
            </button>
          ))}
        </div>

        {/* Dynamic Category Bento statistics Grid */}
        {(() => {
          const catCounts: Record<string, number> = {};
          filteredDemands.forEach(d => {
            const cat = d.categoria || "OUTROS";
            catCounts[cat] = (catCounts[cat] || 0) + 1;
          });

          // Style mapping for categories
          const getCatStyle = (cat: string) => {
            const lower = cat.toLowerCase();
            if (lower.includes("pessoal") || lower.includes("recursos")) {
              return { icon: User, colorClass: "bg-blue-50/70 border-blue-100 text-blue-800", border: "border-l-4 border-blue-500", text: "text-blue-950" };
            }
            if (lower.includes("contrato") || lower.includes("licitacao") || lower.includes("compra")) {
              return { icon: DollarSign, colorClass: "bg-amber-50/70 border-amber-100 text-amber-800", border: "border-l-4 border-amber-500", text: "text-amber-950" };
            }
            if (lower.includes("transparencia") || lower.includes("lai") || lower.includes("ouvidoria")) {
              return { icon: Eye, colorClass: "bg-teal-50/70 border-teal-100 text-teal-800", border: "border-l-4 border-teal-500", text: "text-teal-950" };
            }
            if (lower.includes("integridade") || lower.includes("etica") || lower.includes("compliance")) {
              return { icon: ShieldCheck, colorClass: "bg-red-50/70 border-red-100 text-red-800", border: "border-l-4 border-red-500", text: "text-red-950" };
            }
            return { icon: Activity, colorClass: "bg-slate-50 border-slate-200 text-slate-700", border: "border-l-4 border-slate-350", text: "text-slate-800" };
          };

          const topCategories = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);

          return (
            <div className="space-y-4">
              {/* Category Volumetry Bento Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Volumetria por Categoria ({anoFilter === "TODOS" ? "Histórico Completo" : `Ano ${anoFilter}`})
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{totalCount} Demandas Filtradas</span>
                </div>

                {topCategories.length === 0 ? (
                  <div className="bg-slate-50 text-center py-6 text-xs text-slate-400 border border-dashed rounded-xl">
                    Nenhuma categoria mapeada para os filtros selecionados.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {topCategories.slice(0, 6).map(cat => {
                      const style = getCatStyle(cat);
                      const Icon = style.icon;
                      const val = catCounts[cat];
                      const pct = totalCount > 0 ? ((val / totalCount) * 100).toFixed(0) : "0";

                      return (
                        <div
                          key={cat}
                          className={`bg-white border rounded-xl p-3 flex flex-col justify-between shadow-3xs hover:shadow-xs transition duration-200 ${style.border} ${style.text}`}
                          title={cat}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold text-slate-500 truncate select-raw">
                                {cat}
                              </span>
                              <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase font-mono">
                                CGU-AUDIT
                              </span>
                            </div>
                            <div className={`p-1.5 rounded-lg shrink-0 ${style.colorClass}`}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between mt-auto">
                            <h4 className="text-xl font-black text-slate-950">{val}</h4>
                            <span className="text-[8px] text-slate-450 font-bold">{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interactive Deadlines & Audit Control Dashboard */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Interactive Delay Filter Cards (col-span-4) */}
                <div className="xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Prazos Vencidos Card */}
                  <div
                    onClick={() => setPrazoFilter(prazoFilter === "ATRASADO" ? "TODOS" : "ATRASADO")}
                    className={`rounded-2xl p-4 flex flex-col justify-between shadow-3xs hover:shadow-xs transition duration-200 cursor-pointer select-none relative overflow-hidden border-2 ${
                      prazoFilter === "ATRASADO"
                        ? "bg-red-50/90 border-red-500 text-red-955 ring-2 ring-red-300/30 scale-[1.02]"
                        : "bg-white border-slate-200 hover:border-red-400 text-slate-900"
                    }`}
                    title="Clique para filtrar apenas demandas em atraso"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Prazos Vencidos</span>
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">CRÍTICO</span>
                      </div>
                      <div className={`p-2 rounded-xl ${prazoFilter === "ATRASADO" ? "bg-red-200 text-red-800 animate-pulse" : "bg-red-50 text-red-700 animate-pulse"}`}>
                        <ShieldAlert className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-auto">
                      <h4 className="text-2xl font-black text-slate-950">{atrasadasCount}</h4>
                      <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                        prazoFilter === "ATRASADO" ? "bg-red-650 text-white animate-pulse" : "text-red-650"
                      }`}>
                        {prazoFilter === "ATRASADO" ? "Filtro Ativo" : "Atrasado"}
                      </span>
                    </div>
                  </div>

                  {/* Vencimento Próximo Card */}
                  <div
                    onClick={() => setPrazoFilter(prazoFilter === "PROXIMO" ? "TODOS" : "PROXIMO")}
                    className={`rounded-2xl p-4 flex flex-col justify-between shadow-3xs hover:shadow-xs transition duration-200 cursor-pointer select-none relative overflow-hidden border-2 ${
                      prazoFilter === "PROXIMO"
                        ? "bg-amber-50/90 border-amber-500 text-amber-955 ring-2 ring-amber-300/30 scale-[1.02]"
                        : "bg-white border-slate-200 hover:border-amber-400 text-slate-900"
                    }`}
                    title="Clique para filtrar apenas demandas com prazo próximo (15 dias)"
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Vencimento Próximo</span>
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">ATENÇÃO (15d)</span>
                      </div>
                      <div className={`p-2 rounded-xl ${prazoFilter === "PROXIMO" ? "bg-amber-200 text-amber-800 animate-bounce" : "bg-amber-50 text-amber-700 animate-bounce"}`}>
                        <AlertTriangle className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mt-auto">
                      <h4 className="text-2xl font-black text-slate-950">{proximasCount}</h4>
                      <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                        prazoFilter === "PROXIMO" ? "bg-amber-650 text-white animate-pulse" : "text-amber-650"
                      }`}>
                        {prazoFilter === "PROXIMO" ? "Filtro Ativo" : "Urgente"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit & Recommendation Management Metrics (col-span-8) */}
                <div className="xl:col-span-8 bg-slate-50/50 border border-slate-200 rounded-2xl p-3 shadow-3xs">
                  <div className="px-1.5 pb-2 border-b border-slate-200/80 mb-2.5 flex items-center justify-between">
                    <span className="text-[9.5px] font-extrabold text-slate-450 uppercase tracking-widest">Controles de Monitoramento e Status</span>
                    <span className="text-[8.5px] font-mono font-bold text-slate-400">CGU-MTE PORTAL</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {/* Total de Recomendações */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-[#003366]">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Total de Recomendações</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{totalRecomendacoesCount}</h5>
                        <span className="text-[8px] text-[#003366] font-black font-mono">Cadastradas</span>
                      </div>
                    </div>

                    {/* Auditorias em Andamento */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-slate-400">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Auditorias em Andamento</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{auditoriasEmAndamentoCount}</h5>
                        <span className="text-[8px] text-slate-400 font-bold font-mono">Relatórios</span>
                      </div>
                    </div>

                    {/* Em Monitoramento (Total) */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-indigo-500">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Em Monitoramento</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{emMonitoramentoCount}</h5>
                        <span className="text-[8px] text-indigo-650 font-black font-mono">Ativas</span>
                      </div>
                    </div>

                    {/* Em Análise pela Unidade Auditada */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-sky-400">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Análise Unid. Auditada</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{emAnaliseAuditadaCount}</h5>
                        <span className="text-[8px] text-sky-650 font-bold font-mono">Auditada</span>
                      </div>
                    </div>

                    {/* Em Análise pela Unidade de Auditoria */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-purple-500">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Análise Unid. Auditoria</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{emAnaliseAuditoriaCount}</h5>
                        <span className="text-[8px] text-purple-650 font-bold font-mono">Auditoria</span>
                      </div>
                    </div>

                    {/* Recomendações Concluídas */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-emerald-500">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Recomendações Concluídas</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{concluidasCount}</h5>
                        <span className="text-[8px] text-emerald-650 font-bold font-mono">Concluído</span>
                      </div>
                    </div>

                    {/* Recomendações Consolidadas */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-teal-500">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Recs. Consolidadas</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{consolidadasCount}</h5>
                        <span className="text-[8px] text-teal-650 font-bold font-mono">Consolidado</span>
                      </div>
                    </div>

                    {/* Recomendações Suspensas */}
                    <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col justify-between shadow-3xs border-l-4 border-orange-400">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase leading-snug">Recomendações Suspensas</span>
                      <div className="flex items-baseline justify-between mt-1.5">
                        <h5 className="text-base font-black text-slate-950">{suspensasCount}</h5>
                        <span className="text-[8px] text-orange-650 font-bold font-mono">Suspenso</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filter HUD Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between no-print">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition text-slate-800"
            placeholder="Pesquisar termo ou Id..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Select filters */}
        <div className="flex flex-wrap gap-3 items-center">
          
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">Unidade Auditada:</span>
            <select
              className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
              value={unidadeFilter}
              onChange={(e) => setUnidadeFilter(e.target.value)}
            >
              <option value="TODOS">Todas Unidades</option>
              {availableUnits.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">Situação:</span>
            <select
              className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="TODOS">Todas Situações</option>
              {availableSituations.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">Estado:</span>
            <select
              className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="TODOS">Todos Estados</option>
              {availableStates.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">Categoria:</span>
            <select
              className="bg-slate-50 border border-slate-200 p-1.5 px-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
            >
              <option value="TODOS">Todas Categorias</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("TODOS");
              setEstadoFilter("TODOS");
              setUnidadeFilter("TODOS");
              setCategoriaFilter("TODOS");
              setAnoFilter("TODOS");
              setPrazoFilter("TODOS");
            }}
            className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Main Datagrid - Grouped by Report */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 no-print">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-extrabold text-[#003366] uppercase tracking-wide">
              Relatórios de Auditoria Monitorados: {groupedReports.length} Relatórios ({filteredDemands.length} Recomendações)
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">
            Visão agrupada por relatório com rolagem vertical contínua
          </span>
        </div>

        <div className="overflow-x-auto overflow-y-auto max-h-[550px] custom-com-scroll-container bg-slate-50/20">
          <table className="w-full text-left border-collapse table-auto text-xs min-w-[1100px]">
            <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs">
              <tr className="bg-slate-50 text-slate-705 font-bold uppercase tracking-wide text-[10px]">
                <th className="px-3 py-3 w-8 no-print bg-slate-100"></th>
                <th className="px-5 py-3 bg-slate-100">Relatório de Auditoria / Avaliação</th>
                <th className="px-4 py-3 bg-slate-100">Unidade Auditada</th>
                <th className="px-4 py-3 bg-slate-100">Categoria</th>
                <th className="px-4 py-3 bg-slate-100 text-center">Total de Recomendações</th>
                <th className="px-4 py-3 bg-slate-100 text-center">Status das Recomendações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-150">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                    Carregando registros e sincronizando com base de dados...
                  </td>
                </tr>
              ) : groupedReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                    Nenhum relatório de auditoria localizado com estes filtros.
                  </td>
                </tr>
              ) : (
                groupedReports.map(g => {
                  const isExpanded = expandedReport === g.reportName;
                  
                  // Calculate statuses count for consolidates
                  const countPendentes = g.demands.filter(d => d.situacao === "Pendente").length;
                  const countAnalise = g.demands.filter(d => d.situacao === "Em Análise").length;
                  const countCumpridas = g.demands.filter(d => d.situacao === "Cumprido" || d.situacao === "Concluído" || d.situacao === "Resolvido").length;
                  const countAtrasadas = g.demands.filter(d => {
                    const ds = getDeadlineStatus(d.dataLimite, d.situacao, d.estado);
                    return ds === "ATRASADO";
                  }).length;

                  return (
                    <React.Fragment key={g.reportName}>
                      {/* Group Header Row */}
                      <tr className={`hover:bg-slate-50/70 transition duration-150 ${isExpanded ? "bg-blue-50/15" : "bg-white"}`}>
                        <td className="px-3 py-3.5 no-print">
                          <button
                            onClick={() => setExpandedReport(isExpanded ? null : g.reportName)}
                            className="text-slate-500 hover:text-slate-800 p-1 rounded-lg transition"
                          >
                            {isExpanded ? <ChevronDown className="w-4.5 h-4.5 text-slate-700" /> : <ChevronRight className="w-4.5 h-4.5 text-slate-500" />}
                          </button>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className="font-black text-slate-900 cursor-pointer hover:underline text-xs"
                            onClick={() => setExpandedReport(isExpanded ? null : g.reportName)}
                          >
                            {g.reportName}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-850 font-bold">
                          {g.unidadeAuditada}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="bg-slate-100 border border-slate-200 text-slate-650 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase block truncate max-w-[180px]">
                            {g.categoria}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="bg-[#003366] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black">
                            {g.demands.length} recomendação(ões)
                          </span>
                        </td>

                        {/* Status bar/pills summary */}
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1 justify-center">
                            {countCumpridas > 0 && (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold" title="Cumpridos">
                                {countCumpridas} C
                              </span>
                            )}
                            {countAnalise > 0 && (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold" title="Em Análise">
                                {countAnalise} A
                              </span>
                            )}
                            {countPendentes > 0 && (
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-[9px] font-bold" title="Pendentes">
                                {countPendentes} P
                              </span>
                            )}
                            {countAtrasadas > 0 && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[9px] font-black animate-pulse" title="Atrasadas">
                                {countAtrasadas} X
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Nested Demands Sub-table (Expanded) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/50 p-0 border-b border-slate-250">
                            <div className="px-10 py-5 bg-slate-50/40 border-l-4 border-[#003366] space-y-3">
                              <span className="text-[10px] font-black uppercase text-[#003366] tracking-widest block">
                                Recomendações e Plano de Trabalho Vinculados
                              </span>
                              
                              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                                <table className="w-full text-left text-xs bg-white">
                                  <thead className="bg-slate-100 text-slate-650 font-bold uppercase tracking-wider text-[9px]">
                                    <tr>
                                      <th className="px-4 py-2 font-mono">ID Tarefa</th>
                                      <th className="px-4 py-2">Item da Recomendação</th>
                                      <th className="px-4 py-2">Prazo Limite</th>
                                      <th className="px-4 py-2">Responsável</th>
                                      <th className="px-4 py-2">Situação</th>
                                      <th className="px-4 py-2">Estado</th>
                                      <th className="px-4 py-2 text-center no-print w-28">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {g.demands.map(d => {
                                      const { recName } = getCguReportAndRec(d);
                                      const ds = getDeadlineStatus(d.dataLimite, d.situacao, d.estado);
                                      return (
                                        <tr key={d.idTarefa} className="hover:bg-blue-50/10">
                                          <td
                                            onClick={() => setDetailItem(d)}
                                            className="px-4 py-3 font-mono font-bold text-[#003366] text-[11px] cursor-pointer hover:underline"
                                            title="Clique para visualizar o Dossiê Completo"
                                          >
                                            {d.idTarefa}
                                          </td>
                                          <td
                                            onClick={() => setDetailItem(d)}
                                            className="px-4 py-3 font-semibold text-slate-800 text-xs max-w-sm font-sans whitespace-pre-line leading-relaxed cursor-pointer hover:text-[#003366] hover:underline"
                                            title="Clique para visualizar o Dossiê Completo"
                                          >
                                            {recName}
                                          </td>
                                          <td className="px-4 py-3">
                                            {ds === "ATRASADO" ? (
                                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-50 text-red-700 border border-red-200 animate-pulse">
                                                <ShieldAlert className="w-3 h-3 text-red-650" />
                                                {d.dataLimite}
                                              </span>
                                            ) : ds === "PROXIMO" ? (
                                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                                {d.dataLimite}
                                              </span>
                                            ) : (
                                              <span className="font-mono text-slate-600">{d.dataLimite || "—"}</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-3 text-slate-650 font-bold">
                                            {(d as any).responsavelInterno || "Não designado"}
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide text-center border ${
                                              d.situacao === "Cumprido" || d.situacao === "Concluído" || d.situacao === "Resolvido"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : d.situacao === "Em Análise"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : ds === "ATRASADO"
                                                ? "bg-red-50 text-red-700 border-red-200 animate-pulse font-black"
                                                : "bg-slate-50 text-slate-700 border-slate-200"
                                            }`}>
                                              {d.situacao || "Pendente"}
                                            </span>
                                          </td>
                                          
                                          {/* Refined Custom badging styles for Estado */}
                                          <td className="px-4 py-3">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide text-center border ${getEstadoBadgeStyle(d.estado)}`}>
                                              {d.estado || "Aberto"}
                                            </span>
                                          </td>

                                          <td className="px-4 py-3 text-center no-print">
                                            <div className="flex items-center justify-center gap-1.5">
                                              <button
                                                onClick={() => setDetailItem(d)}
                                                className="p-1 text-slate-500 hover:text-[#003366] hover:bg-blue-50 rounded"
                                                title="Visualizar Dossiê Completo"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => startEdit(d)}
                                                className="p-1 text-slate-500 hover:text-amber-705 hover:bg-amber-50 rounded"
                                                title="Editar Demanda"
                                              >
                                                <Edit className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={async () => {
                                                  if (window.confirm(`Deseja realmente remover a recomendação ${d.idTarefa}?`)) {
                                                    await onDeleteCgu(d.idTarefa);
                                                  }
                                                }}
                                                className="p-1 text-slate-500 hover:text-red-705 hover:bg-red-50 rounded"
                                                title="Excluir Recomendação"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
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

        {/* Dynamic Continuous Scroll Info Footer */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between no-print">
          <p className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-800">{filteredDemands.length}</span> de <span className="font-bold text-slate-800">{cguDemands.length}</span> recomendações em <span className="font-bold text-slate-800">{groupedReports.length}</span> relatórios
          </p>
          <span className="text-slate-450 font-mono text-[9px] uppercase tracking-wider">
            Visualização Hierárquica por Relatório • Rolagem Vertical Contínua
          </span>
        </div>
      </div>
        </>
      ) : (
        <>
          {/* Published Reports Bento Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-3xs border-l-4 border-blue-500">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Relatórios Mapeados</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 font-mono tracking-wider">Histórico</span>
                </div>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <h4 className="text-2xl font-black text-slate-950">{filteredReports.length}</h4>
                <span className="text-xs text-slate-500 font-semibold">no MTE</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-3xs border-l-4 border-emerald-500">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Principais Serviços</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 font-mono tracking-wider">Categoria</span>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-black text-slate-950 truncate" title={topServices[0]?.[0] || "Nenhum"}>
                  {topServices[0]?.[0] || "Nenhum"}
                </h4>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                  {topServices[0]?.[1] ? `${topServices[0][1]} relatórios` : "—"}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-3xs border-l-4 border-purple-500">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Principal Órgão</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 font-mono tracking-wider">Unidade Auditada</span>
                </div>
                <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-black text-slate-950 truncate" title={topSuperiors[0]?.[0] || "Nenhum"}>
                  {topSuperiors[0]?.[0] || "Nenhum"}
                </h4>
                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                  {topSuperiors[0]?.[1] ? `${topSuperiors[0][1]} relatórios` : "—"}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-3xs border-l-4 border-sky-500">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Abrangência Territorial</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 font-mono tracking-wider">Geográfico</span>
                </div>
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
                  <RefreshCw className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-4">
                <h4 className="text-2xl font-black text-slate-950">{uniqueUfs}</h4>
                <span className="text-xs text-slate-500 font-semibold">UFs do País</span>
              </div>
            </div>
          </div>

          {/* Year Selector for Published Reports */}
          <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-thin mt-6 mb-4 no-print">
            <button
              type="button"
              onClick={() => setReportAnoFilter("TODOS")}
              className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                reportAnoFilter === "TODOS"
                  ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Todos os Anos
            </button>
            {availableReportYears.map(y => (
              <button
                type="button"
                key={y}
                onClick={() => setReportAnoFilter(String(y))}
                className={`px-4 py-1.5 -mb-px text-[11px] font-black uppercase tracking-wider rounded-t-lg shrink-0 transition ${
                  reportAnoFilter === String(y)
                    ? "border-b-2 border-[#003366] text-[#003366] bg-slate-50"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                Ano {y}
              </button>
            ))}
          </div>

          {/* Filter HUD for Published Reports */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap gap-4 items-center justify-between no-print">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#003366] focus:bg-white focus:outline-hidden transition text-slate-800"
                placeholder="Pesquisar relatório, ID da tarefa ou tipo de serviço..."
                value={reportSearchTerm}
                onChange={(e) => setReportSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {reportSearchTerm && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setReportSearchTerm(""); }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-855 bg-slate-100 hover:bg-slate-200/60 rounded-xl transition"
                >
                  Limpar Filtro
                </button>
              )}
            </div>
          </div>

          {/* Sync status alerts */}
          {(syncReportsSuccessMessage || syncReportsErrorMessage) && (
            <div className="mb-4 no-print animate-fade-in">
              {syncReportsSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between gap-3 font-semibold shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{syncReportsSuccessMessage}</span>
                  </div>
                  <button onClick={() => setSyncReportsSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-750 font-bold shrink-0">X</button>
                </div>
              )}
              {syncReportsErrorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs flex items-center justify-between gap-3 font-semibold shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{syncReportsErrorMessage}</span>
                  </div>
                  <button onClick={() => setSyncReportsErrorMessage(null)} className="text-red-500 hover:text-red-750 font-bold shrink-0">X</button>
                </div>
              )}
            </div>
          )}

          {/* Main Datagrid for Published Reports */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-150 text-slate-500 font-mono text-[10px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 no-print">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#003366] animate-pulse"></span>
                <span className="font-extrabold text-[#003366] uppercase tracking-wide">
                  Lista de Relatórios CGU Publicados Filtrados: {filteredReports.length} Registros
                </span>
              </div>
              <span className="text-slate-450 font-mono text-[9px] uppercase tracking-wider">
                Visão detalhada com rolagem contínua sem paginação
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[550px] custom-com-scroll-container bg-slate-50/20">
              <table className="w-full text-left border-collapse table-auto text-xs min-w-[1000px]">
                <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-2xs">
                  <tr className="bg-slate-50 text-slate-705 font-bold uppercase tracking-wide text-[10px]">
                    <th className="px-5 py-3 bg-slate-100 font-mono w-32">ID Auditoria</th>
                    <th className="px-4 py-3 bg-slate-100">Título do Relatório</th>
                    <th className="px-4 py-3 bg-slate-100 w-36 text-center">Publicação</th>
                    <th className="px-4 py-3 bg-slate-100 w-44">Tipo de Serviço</th>
                    <th className="px-4 py-3 bg-slate-100 w-48">Unidade Auditada</th>
                    <th className="px-4 py-3 bg-slate-100 text-center no-print w-36">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-150 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                        Carregando registros e sincronizando com base de dados...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-sans">
                        Nenhum relatório publicado localizado.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map(r => (
                      <tr key={r.idTarefa} className="hover:bg-blue-50/10">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#003366] text-[11.5px]">
                          {r.idAuditoria || "—"}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800 text-xs leading-relaxed max-w-md break-words" title={r.tituloRelatorio}>
                          {r.tituloRelatorio}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-650 font-bold">
                          {r.dataPublicacao || "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block bg-slate-150 px-2 py-0.5 rounded text-[9.5px] font-black uppercase text-slate-700 tracking-wider">
                            {r.tipoServico || "Não Informado"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-650 font-medium">
                          {r.nomeUnidadeAuditada || "MTE"}
                        </td>
                        <td className="px-4 py-3.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPublicReport(r.idAuditoria) ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleOpenEcgAndCopy(r.idTarefa, r.idAuditoria, r.tituloRelatorio);
                                }}
                                className="px-2.5 py-1.5 bg-[#003366] hover:bg-[#002244] text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition duration-200 shadow-xs cursor-pointer"
                                title="Baixar o PDF do relatório no portal e-CGU"
                              >
                                {copiedReportId === r.idTarefa ? (
                                  <>
                                    <FileCheck className="w-3 h-3 text-emerald-300 animate-pulse" />
                                    <span>Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3 h-3" />
                                    <span>PDF</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span
                                className="px-2.5 py-1.5 bg-slate-200 text-slate-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-not-allowed"
                                title={`PDF restrito (${r.idAuditoria}) — use o Portal e-CGU`}
                              >
                                <Download className="w-3 h-3" />
                                <span>Restrito</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSearchInPortal(r.tituloRelatorio);
                              }}
                              className="px-2.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition duration-200 shadow-xs cursor-pointer"
                              title="Abrir pesquisa no Portal e-CGU"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Portal</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Scroll Info Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between no-print">
              <p className="text-xs text-slate-500 font-medium">
                Exibindo <span className="font-bold text-slate-800">{filteredReports.length}</span> relatórios publicados referentes ao MTE
              </p>
              <span className="text-slate-450 font-mono text-[9px] uppercase tracking-wider">
                Portal e-CGU Integrado • Rolagem Vertical Contínua
              </span>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal (Popup) */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden font-sans">
            <div className="bg-[#003366] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Ajuste de Fluxo de Demanda CGU</h3>
                  <p className="text-[10px] text-blue-100 font-mono mt-0.5">{editingItem.idTarefa}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {(() => {
                const { reportName, recName } = getCguReportAndRec(editingItem);
                return (
                  <>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Relatório Relacionado</span>
                      <p className="text-xs text-slate-900 font-black mt-0.5 leading-relaxed">{reportName}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider">Recomendação / Tarefa</span>
                      <p className="text-xs text-slate-650 font-semibold mt-0.5 leading-relaxed">{recName}</p>
                    </div>
                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Situação no Monitoramento:</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
                    value={editSituacao}
                    onChange={(e) => setEditSituacao(e.target.value)}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Cumprido">Cumprido</option>
                    <option value="Atrasado">Em Atraso</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estado do Processo:</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-800 focus:outline-hidden font-medium"
                    value={editEstado}
                    onChange={(e) => setEditEstado(e.target.value)}
                  >
                    <option value="Aberto">Aberto</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Suspenso">Suspenso</option>
                    <option value="Em análise pela unidade de auditoria">Em análise pela unidade de auditoria</option>
                    <option value="Em análise pela unidade auditada">Em análise pela unidade auditada</option>
                    <option value="Em execução">Em execução</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Designar Responsável AECI:</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-800 focus:outline-hidden"
                  placeholder="Nome do analista encarregado do acompanhamento..."
                  value={editResponsavel}
                  onChange={(e) => setEditResponsavel(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Providência Adotada / Plano de Ação MTE:</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-800 focus:outline-hidden font-sans"
                  placeholder="Insira detalhes das respostas, notas técnicas elaboradas, resoluções internas e SEI correspondentes..."
                  value={editProvidencia}
                  onChange={(e) => setEditProvidencia(e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Gravar Alteração
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dossiê Completo Detail Modal (Popup) */}
      {detailItem && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden font-sans">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#003366]" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Dossiê Técnico CGU</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Demanda: {detailItem.idTarefa}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-50 p-4.5 rounded-2xl border">
                {(() => {
                  const { reportName, recName } = getCguReportAndRec(detailItem);
                  return (
                    <>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">Relatório Relacionado</span>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">{reportName}</h4>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mt-3 mb-0.5">Recomendação</span>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed font-sans">{recName}</p>
                    </>
                  );
                })()}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 font-mono">
                    CAT: {detailItem.categoria}
                  </span>
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[9px] font-bold text-slate-600 font-mono">
                    ANO: {detailItem.ano}
                  </span>
                </div>
              </div>

              {/* Status and Dates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Início</span>
                  <span className="text-xs text-slate-800 font-semibold font-mono">{detailItem.dataInicio || "—"}</span>
                </div>
                <div className="bg-white border p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Limite Inicial</span>
                  <span className="text-xs text-slate-800 font-semibold font-mono">{detailItem.dataLimiteInicial || "—"}</span>
                </div>
                <div className="bg-white border p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Limite Atual</span>
                  <span className="text-xs text-slate-850 font-extrabold text-[#003366] font-mono">{detailItem.dataLimite || "—"}</span>
                </div>
                <div className="bg-white border p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Data Conclusão</span>
                  <span className="text-xs text-slate-800 font-semibold font-mono">{detailItem.dataFim || "Em aberto"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Unidade Auditada (MTE)</span>
                  <span className="text-xs text-slate-800 font-semibold">{detailItem.unidadeAuditada || "MTE"}</span>
                </div>
                <div className="bg-white border p-3 rounded-xl">
                  <span className="text-[9px] text-slate-400 block uppercase font-extrabold tracking-wider mb-0.5">Unidades de Auditoria (CGU)</span>
                  <span className="text-xs text-slate-800 font-semibold">{detailItem.unidadesAuditoria || "CGU"}</span>
                </div>
              </div>

              {/* Textos de Monitoramento e Providências */}
              <div className="space-y-3.5">
                <div className="bg-white border p-4.5 rounded-xl">
                  <span className="text-[9px] text-slate-450 block uppercase font-bold tracking-wider mb-1">Texto do Monitoramento / Encaminhamento da CGU</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">
                    {detailItem.textoMonitoramento || "Nenhum teor de monitoramento registrado."}
                  </p>
                </div>

                <div className="bg-white border border-blue-100 p-4.5 rounded-xl">
                  <span className="text-[9px] text-[#003366] block uppercase font-bold tracking-wider mb-1">Plano de Providências / Status de Cumprimento MTE</span>
                  <p className="text-xs text-slate-900 leading-relaxed font-sans font-semibold whitespace-pre-line">
                    {detailItem.providencia || "Aguardando envio de relatórios setoriais."}
                  </p>
                </div>
              </div>

              {/* Manifestação / Posicionamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border p-4 rounded-xl space-y-1.5">
                  <span className="text-[9.5px] font-black uppercase text-slate-450 tracking-wider">Última Manifestação MTE</span>
                  <div className="flex justify-between items-center text-[9.5px] font-mono font-bold text-slate-450 border-b border-slate-200/60 pb-1 mb-1">
                    <span>{detailItem.tipoUltimaManifestacao || "Ofício"}</span>
                    <span>{detailItem.dataUltimaManifestacao || "—"}</span>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-sans">{detailItem.textoUltimaManifestacao || "Sem registro."}</p>
                </div>

                <div className="bg-slate-50 border p-4 rounded-xl space-y-1.5">
                  <span className="text-[9.5px] font-black uppercase text-slate-450 tracking-wider">Último Posicionamento CGU</span>
                  <div className="flex justify-between items-center text-[9.5px] font-mono font-bold text-slate-450 border-b border-slate-200/60 pb-1 mb-1">
                    <span>{detailItem.tipoUltimoPosicionamento || "Nota Técnica"}</span>
                    <span>{detailItem.dataUltimoPosicionamento || "—"}</span>
                  </div>
                  <p className="text-[11px] text-slate-650 leading-relaxed font-sans">{detailItem.textoUltimoPosicionamento || "Sem registro."}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Fechar Dossiê
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
