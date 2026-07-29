import fs from "fs";
import path from "path";

const TCU_DIR = path.resolve(process.cwd(), "data", "tcu", "acordaos");

// =========================================================================
// DETECÇÃO AUTOMÁTICA DE ENCODING
// =========================================================================

/**
 * Detecta automaticamente o encoding de um buffer de texto.
 *
 * O arquivo Acórdãos{ANO}.csv exportado do portal TCU vem geralmente em
 * Windows-1252 (ANSI/Latin-1). Alguns ambientes podem converter para UTF-8.
 * Esta função detecta a presença de bytes inválidos em UTF-8 para determinar
 * qual encoding usar.
 *
 * @param buffer - Buffer com os primeiros bytes do arquivo
 * @returns 'utf8' ou 'latin1'
 */
function detectarEncoding(buffer: Buffer): BufferEncoding {
  // Verifica se o arquivo começa com BOM UTF-8
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return "utf8";
  }

  // Tenta decodificar os primeiros 2000 bytes como UTF-8 estritamente
  const amostra = buffer.slice(0, Math.min(2000, buffer.length));
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(amostra);
    // Se decodificou sem erro E contém caracteres acentuados comuns em pt-BR,
    // é seguro dizer que é UTF-8
    if (decoded.includes("ã") || decoded.includes("ç") || decoded.includes("ê") || decoded.includes("ó")) {
      return "utf8";
    }
    return "utf8";
  } catch {
    // Falhou na decodificação UTF-8 estrita — é Latin1/Windows-1252
    return "latin1";
  }
}

/**
 * Lê um arquivo com detecção automática de encoding.
 * Converte Windows-1252 para string JavaScript nativamente.
 */
export function lerArquivoComEncoding(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  const encoding = detectarEncoding(buffer);

  console.log(`[CSV-ENCODING] Arquivo: ${path.basename(filePath)} → Encoding detectado: ${encoding}`);

  if (encoding === "utf8") {
    // Remove BOM se presente
    let content = buffer.toString("utf8");
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.substring(1);
    }
    return content;
  }

  // Latin1/Windows-1252: usa TextDecoder para converter corretamente
  return new TextDecoder("windows-1252").decode(buffer);
}

// =========================================================================
// PARSER DO CSV FILTRADO LOCAL (Acórdãos{ANO}.csv)
// =========================================================================
// Formato: exportação do portal TCU com campos entre aspas duplas e
// separados por "" (aspas duplas como delimitador entre campos).
// Linha 0: metadados ("Parâmetros de pesquisa:""Ano - 2026")
// Linha 1: cabeçalho
// Linha 2+: dados

export interface AcordaoFiltrado {
  numAcordao: number;
  anoAcordao: number;
  dataSessao: string;
  colegiado: string;
  processo: string;
  tipoProcesso: string;
  relator: string;
  unidadeTecnica: string;
}

/**
 * Parseia o CSV filtrado local (Acórdãos{ANO}.csv) com detecção de encoding.
 * Retorna os acórdãos extraídos do arquivo.
 */
export function parsearCsvFiltrado(filePath: string): AcordaoFiltrado[] {
  const content = lerArquivoComEncoding(filePath);
  const linhas = content.split(/\r?\n/);
  const resultados: AcordaoFiltrado[] = [];

  // Linha 0 = parâmetros de pesquisa (ignorar)
  // Linha 1 = cabeçalho (ignorar - já sabemos o formato)
  // Linha 2+ = dados

  for (let i = 2; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    // O separador real no CSV filtrado do TCU é: cada campo está entre aspas
    // e os campos são separados por vírgula (ou por "" dependendo da exportação).
    // Vamos usar o parser CSV robusto que lida com ambos os casos.
    const partes = parsearLinhaCsvRobusta(linha);

    if (partes.length < 2) continue;

    // Coluna 0: "NUMACORDAO/ANO" (ex: "4092/2026-1C" ou "1234/2026")
    const colAcordao = partes[0] ?? "";
    const match = colAcordao.match(/(\d+)\/(\d{4})/);
    if (!match) continue;

    const numAcordao = parseInt(match[1], 10);
    const anoAcordao = parseInt(match[2], 10);

    if (isNaN(numAcordao) || isNaN(anoAcordao)) continue;

    resultados.push({
      numAcordao,
      anoAcordao,
      dataSessao:     partes[1] ?? "",
      colegiado:      partes[2] ?? "",
      processo:       partes[3] ?? "",
      tipoProcesso:   partes[4] ?? "",
      relator:        partes[5] ?? "",
      unidadeTecnica: partes[6] ?? "",
    });
  }

  console.log(`[CSV-FILTRADO] Arquivo: ${path.basename(filePath)} → ${resultados.length} acórdãos extraídos`);
  return resultados;
}

// =========================================================================
// PARSER GENÉRICO DE LINHA CSV (com suporte a aspas)
// =========================================================================

/**
 * Parseia uma linha CSV com suporte a campos entre aspas e
 * aspas duplas escapadas ("").
 * Suporta tanto vírgula quanto ponto-e-vírgula como delimitador.
 */
export function parsearLinhaCsvRobusta(
  linha: string,
  delimitador: string = ","
): string[] {
  const resultado: string[] = [];
  let valorAtual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];

    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        // Aspas dupla escapada: "" → "
        valorAtual += '"';
        i++;
      } else {
        // Abre ou fecha campo entre aspas
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (char === delimitador && !dentroDeAspas) {
      resultado.push(valorAtual.trim());
      valorAtual = "";
    } else {
      valorAtual += char;
    }
  }

  resultado.push(valorAtual.trim());
  return resultado;
}

// =========================================================================
// PARSER DO CSV COMPLETO DO TCU (cache-acordao-completo-{ANO}.csv)
// =========================================================================
// Formato: separador pipe "|", campos entre aspas, 33 colunas.
// Registros multi-linha começam com "ACORDAO-COMPLETO-" ou "KEY"|"TIPO".

export interface AcordaoComplementar {
  key:              string;
  numAcordao:       string;
  anoAcordao:       string;
  colegiado:        string;
  acordao:          string; // Inteiro teor consolidado (ACORDAO + RELATORIO + VOTO)
  num_ata:          string;
  situacao:         string;
  proc:             string;
  acordaos_relacionados: string;
  interessados:     string;
  entidade:         string;
  unidade_tecnica:  string;
  assunto:          string;
  sumario:          string;
  decisao:          string;
  relator:          string;
}

export interface TargetAcordao {
  numAcordao: string;
  anoAcordao: string;
  colegiado:  string;
}

function normalizarNomeColuna(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizarColegiado(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

/**
 * Lê o CSV completo do TCU em streaming e retorna os dados complementares
 * para os acórdãos solicitados (busca em lote para evitar múltiplas leituras).
 *
 * @param cachePath - Caminho do arquivo cache-acordao-completo-{ano}.csv
 * @param targets   - Lista de acórdãos a localizar no CSV
 * @returns Map com chave "{numAcordao}-{COLEGIADO}" → dados complementares
 */
export async function getComplementaryDataBulk(
  cachePath: string,
  targets: TargetAcordao[]
): Promise<Map<string, AcordaoComplementar>> {
  const resultado = new Map<string, AcordaoComplementar>();

  if (!fs.existsSync(cachePath)) {
    console.warn(`[CSV-COMPLETO] Arquivo não encontrado: ${cachePath}`);
    return resultado;
  }

  if (targets.length === 0) return resultado;

  // Cria um índice de busca rápida: "numAcordao-COLEGIADO_NORMALIZADO" → TargetAcordao
  const indiceBusca = new Map<string, TargetAcordao>();
  for (const t of targets) {
    const chave = `${t.numAcordao}-${normalizarColegiado(t.colegiado)}`;
    indiceBusca.set(chave, t);
  }

  console.log(`[CSV-COMPLETO] Iniciando parse de ${path.basename(cachePath)} para ${targets.length} alvos...`);

  const { createReadStream } = await import("fs");
  const readline = await import("readline");

  const fileStream = createReadStream(cachePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let cabecalhoProcessado = false;
  let colIndices: Record<string, number> = {};
  let colKey = -1, colNum = -1, colAno = -1, colColegiado = -1;
  let linhaAtual = "";
  let totalProcessadas = 0;
  let encontrados = 0;

  const processarLinhaAcumulada = (linhaCompleta: string): boolean => {
    if (!cabecalhoProcessado) {
      // Processa cabeçalho
      const headers = parsearLinhaCsvRobusta(linhaCompleta, "|");
      const normHeaders = headers.map(normalizarNomeColuna);

      colKey       = normHeaders.indexOf("key");
      colNum       = normHeaders.findIndex(h => h === "numacordao" || h === "numero");
      colAno       = normHeaders.findIndex(h => h === "anoacordao" || h === "ano");
      colColegiado = normHeaders.indexOf("colegiado");

      colIndices = {
        acordao:               normHeaders.indexOf("acordao"),
        relatorio:             normHeaders.indexOf("relatorio"),
        voto:                  normHeaders.indexOf("voto"),
        num_ata:               normHeaders.indexOf("numata"),
        situacao:              normHeaders.indexOf("situacao"),
        proc:                  normHeaders.findIndex(h => h === "proc" || h === "processo"),
        acordaos_relacionados: normHeaders.indexOf("acordaosrelacionados"),
        interessados:          normHeaders.indexOf("interessados"),
        entidade:              normHeaders.indexOf("entidade"),
        unidade_tecnica:       normHeaders.indexOf("unidadetecnica"),
        assunto:               normHeaders.indexOf("assunto"),
        sumario:               normHeaders.indexOf("sumario"),
        decisao:               normHeaders.indexOf("decisao"),
        relator:               normHeaders.indexOf("relator"),
      };

      cabecalhoProcessado = true;
      console.log(`[CSV-COMPLETO] Cabeçalho processado. Colunas mapeadas: ${Object.keys(colIndices).length}`);
      return false;
    }

    if (!linhaCompleta.trim()) return false;

    const partes = parsearLinhaCsvRobusta(linhaCompleta, "|");
    if (partes.length <= Math.max(colNum, colAno, colColegiado)) return false;

    const rowNum = partes[colNum] ?? "";
    const rowColegiado = normalizarColegiado(partes[colColegiado] ?? "");
    const chaveRow = `${rowNum}-${rowColegiado}`;

    const target = indiceBusca.get(chaveRow);
    if (!target) return false;

    totalProcessadas++;

    const getParte = (idx: number): string =>
      idx !== -1 && partes[idx] ? partes[idx].trim() : "";

    // Consolida inteiro teor: RELATÓRIO + VOTO + ACÓRDÃO (campos distintos no CSV)
    const txtAcordao  = getParte(colIndices.acordao);
    const txtRelatorio = getParte(colIndices.relatorio);
    const txtVoto     = getParte(colIndices.voto);
    const txtDecisao  = getParte(colIndices.decisao);

    let inteiroteor = "";
    if (txtRelatorio) inteiroteor += "RELATÓRIO:\n" + txtRelatorio + "\n\n";
    if (txtVoto)      inteiroteor += "VOTO:\n"      + txtVoto      + "\n\n";
    if (txtAcordao)   inteiroteor += "ACÓRDÃO:\n"   + txtAcordao   + "\n\n";
    if (txtDecisao && txtDecisao !== txtAcordao)
                      inteiroteor += "DECISÃO:\n"   + txtDecisao   + "\n\n";
    const teorFinal = inteiroteor.trim() || txtAcordao;

    const existing = resultado.get(chaveRow);
    if (!existing || teorFinal.length > (existing.acordao?.length ?? 0)) {
      resultado.set(chaveRow, {
        key:                   getParte(colKey),
        numAcordao:            rowNum,
        anoAcordao:            partes[colAno] ?? "",
        colegiado:             partes[colColegiado] ?? "",
        acordao:               teorFinal,
        num_ata:               getParte(colIndices.num_ata),
        situacao:              getParte(colIndices.situacao) || "OFICIALIZADO",
        proc:                  getParte(colIndices.proc),
        acordaos_relacionados: getParte(colIndices.acordaos_relacionados),
        interessados:          getParte(colIndices.interessados),
        entidade:              getParte(colIndices.entidade),
        unidade_tecnica:       getParte(colIndices.unidade_tecnica),
        assunto:               getParte(colIndices.assunto),
        sumario:               getParte(colIndices.sumario),
        decisao:               txtDecisao,
        relator:               getParte(colIndices.relator),
      });
      encontrados++;
    }

    // Para se já encontrou todos os alvos
    return encontrados >= indiceBusca.size;
  };

  for await (const linha of rl) {
    // O CSV completo do TCU tem registros multi-linha.
    // Cada novo registro começa com "ACORDAO-COMPLETO-" ou com o cabeçalho "KEY"|"TIPO"
    const isNovoRegistro =
      linha.startsWith('"ACORDAO-COMPLETO-') ||
      linha.startsWith('"KEY"|"TIPO"');

    if (isNovoRegistro) {
      if (linhaAtual) {
        const parar = processarLinhaAcumulada(linhaAtual);
        if (parar) {
          rl.close();
          break;
        }
      }
      linhaAtual = linha;
    } else {
      if (linhaAtual) {
        linhaAtual += "\n" + linha;
      }
    }
  }

  // Processa última linha pendente
  if (linhaAtual) {
    processarLinhaAcumulada(linhaAtual);
  }

  console.log(
    `[CSV-COMPLETO] Parse concluído. Alvos: ${targets.length} | Encontrados: ${resultado.size} | Linhas processadas: ${totalProcessadas}`
  );

  return resultado;
}
