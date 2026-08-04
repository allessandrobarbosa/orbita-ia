var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/data/seed_db.ts
var SEED_PROFILES;
var init_seed_db = __esm({
  "src/data/seed_db.ts"() {
    SEED_PROFILES = [
      {
        id: "alessandro",
        name: "Alessandro Barbosa",
        cpf: "416.526.491-15",
        phone: "(61) 2031-6261",
        unidade: "AECI",
        role: "Analista de Controle Interno Especial",
        email: "alessandro@trabalho.gov.br",
        register: "Matr\xEDcula: 1792381",
        clearance: "ADMIN",
        avatarColor: "bg-[#1351b4] text-white border-blue-400 ring-blue-500/30",
        pin: "Cmnsg@102030",
        password: "Cmnsg@102030",
        requiresPasswordChange: false,
        status: "ACTIVE",
        badgeText: "AECI - ADMIN"
      }
    ];
  }
});

// src/data/seed_comunicacoes.ts
var init_seed_comunicacoes = __esm({
  "src/data/seed_comunicacoes.ts"() {
  }
});

// src/data/seed_cgu.ts
var init_seed_cgu = __esm({
  "src/data/seed_cgu.ts"() {
  }
});

// src/data/seed_etica.ts
var init_seed_etica = __esm({
  "src/data/seed_etica.ts"() {
  }
});

// src/backend/db.ts
var import_fs, import_path, import_pg, import_dotenv, pool, DATA_DIR, DB_PATH, TCU_DIR;
var init_db = __esm({
  "src/backend/db.ts"() {
    import_fs = __toESM(require("fs"), 1);
    import_path = __toESM(require("path"), 1);
    import_pg = __toESM(require("pg"), 1);
    import_dotenv = __toESM(require("dotenv"), 1);
    init_seed_db();
    init_seed_comunicacoes();
    init_seed_cgu();
    init_seed_etica();
    import_dotenv.default.config();
    pool = new import_pg.default.Pool({
      connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
      max: 10,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 2e3
    });
    DATA_DIR = import_path.default.join(process.cwd(), "data");
    DB_PATH = import_path.default.join(DATA_DIR, "orbita_db.json");
    TCU_DIR = import_path.default.join(DATA_DIR, "tcu");
    if (!import_fs.default.existsSync(DATA_DIR)) {
      import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!import_fs.default.existsSync(TCU_DIR)) {
      import_fs.default.mkdirSync(TCU_DIR, { recursive: true });
    }
  }
});

// src/backend/utils/tcuCsvParser.ts
var tcuCsvParser_exports = {};
__export(tcuCsvParser_exports, {
  getComplementaryDataBulk: () => getComplementaryDataBulk,
  lerArquivoComEncoding: () => lerArquivoComEncoding,
  parsearCsvFiltrado: () => parsearCsvFiltrado,
  parsearLinhaCsvRobusta: () => parsearLinhaCsvRobusta
});
function detectarEncoding(buffer) {
  if (buffer[0] === 239 && buffer[1] === 187 && buffer[2] === 191) {
    return "utf8";
  }
  const amostra = buffer.slice(0, Math.min(2e3, buffer.length));
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(amostra);
    if (decoded.includes("\xE3") || decoded.includes("\xE7") || decoded.includes("\xEA") || decoded.includes("\xF3")) {
      return "utf8";
    }
    return "utf8";
  } catch {
    return "latin1";
  }
}
function lerArquivoComEncoding(filePath) {
  const buffer = import_fs3.default.readFileSync(filePath);
  const encoding = detectarEncoding(buffer);
  console.log(`[CSV-ENCODING] Arquivo: ${import_path3.default.basename(filePath)} \u2192 Encoding detectado: ${encoding}`);
  if (encoding === "utf8") {
    let content = buffer.toString("utf8");
    if (content.charCodeAt(0) === 65279) {
      content = content.substring(1);
    }
    return content;
  }
  return new TextDecoder("windows-1252").decode(buffer);
}
function parsearCsvFiltrado(filePath) {
  const content = lerArquivoComEncoding(filePath);
  const linhas = content.split(/\r?\n/);
  const resultados = [];
  for (let i = 2; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    const partes = linha.split('""').map((p) => p.replace(/^"|"$/g, "").trim());
    if (partes.length < 2) continue;
    const colAcordao = partes[0] ?? "";
    const match = colAcordao.match(/(\d+)\/(\d{4})/);
    if (!match) continue;
    const numAcordao = parseInt(match[1], 10);
    const anoAcordao = parseInt(match[2], 10);
    if (isNaN(numAcordao) || isNaN(anoAcordao)) continue;
    resultados.push({
      numAcordao,
      anoAcordao,
      dataSessao: partes[1] ?? "",
      colegiado: partes[2] ?? "",
      processo: partes[3] ?? "",
      tipoProcesso: partes[4] ?? "",
      relator: partes[5] ?? "",
      unidadeTecnica: partes[6] ?? ""
    });
  }
  console.log(`[CSV-FILTRADO] Arquivo: ${import_path3.default.basename(filePath)} \u2192 ${resultados.length} ac\xF3rd\xE3os extra\xEDdos`);
  return resultados;
}
function parsearLinhaCsvRobusta(linha, delimitador = ",") {
  const resultado = [];
  let valorAtual = "";
  let dentroDeAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        valorAtual += '"';
        i++;
      } else {
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
function normalizarNomeColuna(header) {
  return header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}
function normalizarColegiado(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
}
async function getComplementaryDataBulk(cachePath, targets) {
  const resultado = /* @__PURE__ */ new Map();
  if (!import_fs3.default.existsSync(cachePath)) {
    console.warn(`[CSV-COMPLETO] Arquivo n\xE3o encontrado: ${cachePath}`);
    return resultado;
  }
  if (targets.length === 0) return resultado;
  const indiceBusca = /* @__PURE__ */ new Map();
  for (const t of targets) {
    const chave = `${t.numAcordao}-${normalizarColegiado(t.colegiado)}`;
    indiceBusca.set(chave, t);
  }
  console.log(`[CSV-COMPLETO] Iniciando parse de ${import_path3.default.basename(cachePath)} para ${targets.length} alvos...`);
  const { createReadStream } = await import("fs");
  const readline = await import("readline");
  const fileStream = createReadStream(cachePath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  let cabecalhoProcessado = false;
  let colIndices = {};
  let colKey = -1, colNum = -1, colAno = -1, colColegiado = -1;
  let linhaAtual = "";
  let totalProcessadas = 0;
  let encontrados = 0;
  const processarLinhaAcumulada = (linhaCompleta) => {
    if (!cabecalhoProcessado) {
      const headers = parsearLinhaCsvRobusta(linhaCompleta, "|");
      const normHeaders = headers.map(normalizarNomeColuna);
      colKey = normHeaders.indexOf("key");
      colNum = normHeaders.findIndex((h) => h === "numacordao" || h === "numero");
      colAno = normHeaders.findIndex((h) => h === "anoacordao" || h === "ano");
      colColegiado = normHeaders.indexOf("colegiado");
      colIndices = {
        acordao: normHeaders.indexOf("acordao"),
        relatorio: normHeaders.indexOf("relatorio"),
        voto: normHeaders.indexOf("voto"),
        num_ata: normHeaders.indexOf("numata"),
        situacao: normHeaders.indexOf("situacao"),
        proc: normHeaders.findIndex((h) => h === "proc" || h === "processo"),
        acordaos_relacionados: normHeaders.indexOf("acordaosrelacionados"),
        interessados: normHeaders.indexOf("interessados"),
        entidade: normHeaders.indexOf("entidade"),
        unidade_tecnica: normHeaders.indexOf("unidadetecnica"),
        assunto: normHeaders.indexOf("assunto"),
        sumario: normHeaders.indexOf("sumario"),
        decisao: normHeaders.indexOf("decisao"),
        relator: normHeaders.indexOf("relator")
      };
      cabecalhoProcessado = true;
      console.log(`[CSV-COMPLETO] Cabe\xE7alho processado. Colunas mapeadas: ${Object.keys(colIndices).length}`);
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
    const getParte = (idx) => idx !== -1 && partes[idx] ? partes[idx].trim() : "";
    const txtAcordao = getParte(colIndices.acordao);
    const txtRelatorio = getParte(colIndices.relatorio);
    const txtVoto = getParte(colIndices.voto);
    const txtDecisao = getParte(colIndices.decisao);
    let inteiroteor = "";
    if (txtRelatorio) inteiroteor += "RELAT\xD3RIO:\n" + txtRelatorio + "\n\n";
    if (txtVoto) inteiroteor += "VOTO:\n" + txtVoto + "\n\n";
    if (txtAcordao) inteiroteor += "AC\xD3RD\xC3O:\n" + txtAcordao + "\n\n";
    if (txtDecisao && txtDecisao !== txtAcordao)
      inteiroteor += "DECIS\xC3O:\n" + txtDecisao + "\n\n";
    const teorFinal = inteiroteor.trim() || txtAcordao;
    const existing = resultado.get(chaveRow);
    if (!existing || teorFinal.length > (existing.acordao?.length ?? 0)) {
      resultado.set(chaveRow, {
        key: getParte(colKey),
        numAcordao: rowNum,
        anoAcordao: partes[colAno] ?? "",
        colegiado: partes[colColegiado] ?? "",
        acordao: teorFinal,
        num_ata: getParte(colIndices.num_ata),
        situacao: getParte(colIndices.situacao) || "OFICIALIZADO",
        proc: getParte(colIndices.proc),
        acordaos_relacionados: getParte(colIndices.acordaos_relacionados),
        interessados: getParte(colIndices.interessados),
        entidade: getParte(colIndices.entidade),
        unidade_tecnica: getParte(colIndices.unidade_tecnica),
        assunto: getParte(colIndices.assunto),
        sumario: getParte(colIndices.sumario),
        decisao: txtDecisao,
        relator: getParte(colIndices.relator)
      });
      encontrados++;
    }
    return encontrados >= indiceBusca.size;
  };
  for await (const linha of rl) {
    const isNovoRegistro = linha.startsWith('"ACORDAO-COMPLETO-') || linha.startsWith('"KEY"|"TIPO"');
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
  if (linhaAtual) {
    processarLinhaAcumulada(linhaAtual);
  }
  console.log(
    `[CSV-COMPLETO] Parse conclu\xEDdo. Alvos: ${targets.length} | Encontrados: ${resultado.size} | Linhas processadas: ${totalProcessadas}`
  );
  return resultado;
}
var import_fs3, import_path3, TCU_DIR2;
var init_tcuCsvParser = __esm({
  "src/backend/utils/tcuCsvParser.ts"() {
    import_fs3 = __toESM(require("fs"), 1);
    import_path3 = __toESM(require("path"), 1);
    TCU_DIR2 = import_path3.default.resolve(process.cwd(), "data", "tcu", "acordaos");
  }
});

// src/backend/utils/importControl.ts
var importControl_exports = {};
__export(importControl_exports, {
  anoHistoricoJaImportado: () => anoHistoricoJaImportado,
  atualizarStatusImportacao: () => atualizarStatusImportacao,
  calcularHashArquivo: () => calcularHashArquivo,
  getAnoParaImportacaoAutomatica: () => getAnoParaImportacaoAutomatica,
  getAnoStatus: () => getAnoStatus,
  getStatusImportacoes: () => getStatusImportacoes,
  getUltimaImportacao: () => getUltimaImportacao,
  iniciarImportacao: () => iniciarImportacao,
  registrarErroImportacao: () => registrarErroImportacao
});
function getAnoStatus(ano, hoje = /* @__PURE__ */ new Date()) {
  const anoCorrente = hoje.getFullYear();
  if (ano > anoCorrente) {
    return "futuro";
  }
  const dataFechamento = new Date(ano + 1, 1, 1);
  if (hoje >= dataFechamento) {
    return "historico";
  }
  return "corrente";
}
function getAnoParaImportacaoAutomatica(hoje = /* @__PURE__ */ new Date()) {
  return hoje.getFullYear();
}
function calcularHashArquivo(filePath) {
  const buffer = import_fs5.default.readFileSync(filePath);
  return import_crypto.default.createHash("sha256").update(buffer).digest("hex");
}
async function iniciarImportacao(params) {
  const result = await pool.query(
    `INSERT INTO tcu_import_control
       (modulo, ano_referencia, tipo_arquivo, url_fonte, nome_arquivo,
        status, forcado_por_usuario, data_inicio)
     VALUES ($1, $2, $3, $4, $5, 'INICIADO', $6, NOW())
     RETURNING id`,
    [
      params.modulo,
      params.ano_referencia,
      params.tipo_arquivo,
      params.url_fonte ?? null,
      params.nome_arquivo ?? null,
      params.forcado_por_usuario ?? null
    ]
  );
  return result.rows[0].id;
}
async function atualizarStatusImportacao(params) {
  const isFinal = params.status === "CONCLUIDO" || params.status === "ERRO" || params.status === "PARCIAL";
  await pool.query(
    `UPDATE tcu_import_control SET
       status                    = $2,
       tamanho_bytes             = COALESCE($3, tamanho_bytes),
       hash_arquivo              = COALESCE($4, hash_arquivo),
       quantidade_linhas_csv     = COALESCE($5, quantidade_linhas_csv),
       quantidade_inseridos      = COALESCE($6, quantidade_inseridos),
       quantidade_atualizados    = COALESCE($7, quantidade_atualizados),
       quantidade_ignorados      = COALESCE($8, quantidade_ignorados),
       quantidade_erros          = COALESCE($9, quantidade_erros),
       eh_historico              = COALESCE($10, eh_historico),
       data_fechamento_historico = COALESCE($11, data_fechamento_historico),
       erro_detalhe              = COALESCE($12, erro_detalhe),
       observacoes               = COALESCE($13, observacoes),
       data_fim                  = CASE WHEN $14 THEN NOW() ELSE data_fim END
     WHERE id = $1`,
    [
      params.id,
      params.status,
      params.tamanho_bytes ?? null,
      params.hash_arquivo ?? null,
      params.quantidade_linhas_csv ?? null,
      params.quantidade_inseridos ?? null,
      params.quantidade_atualizados ?? null,
      params.quantidade_ignorados ?? null,
      params.quantidade_erros ?? null,
      params.eh_historico ?? null,
      params.data_fechamento_historico ?? null,
      params.erro_detalhe ?? null,
      params.observacoes ?? null,
      isFinal
    ]
  );
}
async function registrarErroImportacao(id, erro) {
  const detalhe = typeof erro === "string" ? erro : `${erro.message}
${erro.stack ?? ""}`;
  await atualizarStatusImportacao({
    id,
    status: "ERRO",
    erro_detalhe: detalhe.substring(0, 5e3)
    // limita tamanho
  });
}
async function getStatusImportacoes() {
  const result = await pool.query(`SELECT * FROM vw_import_status`);
  return result.rows;
}
async function getUltimaImportacao(modulo, ano_referencia) {
  const result = await pool.query(
    `SELECT * FROM tcu_import_control
     WHERE modulo = $1 AND ano_referencia = $2
     ORDER BY id DESC LIMIT 1`,
    [modulo, ano_referencia]
  );
  return result.rows[0] ?? null;
}
async function anoHistoricoJaImportado(modulo, ano_referencia) {
  const ultima = await getUltimaImportacao(modulo, ano_referencia);
  if (!ultima) return false;
  return ultima.status === "CONCLUIDO" && ultima.eh_historico === true;
}
var import_crypto, import_fs5;
var init_importControl = __esm({
  "src/backend/utils/importControl.ts"() {
    init_db();
    import_crypto = __toESM(require("crypto"), 1);
    import_fs5 = __toESM(require("fs"), 1);
  }
});

// server.ts
var import_express14 = __toESM(require("express"), 1);
var import_path9 = __toESM(require("path"), 1);
var import_fs10 = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv4 = __toESM(require("dotenv"), 1);
var import_express_session = __toESM(require("express-session"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_pg2 = __toESM(require("pg"), 1);

// src/backend/routes/comunicacoesRoutes.ts
var import_express = require("express");
init_db();
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var router = (0, import_express.Router)();
router.post("/comunicacoes/sync-local", async (req, res) => {
  const COM_DIR = import_path2.default.join(process.cwd(), "data", "tcu", "comunicacoes");
  if (!import_fs2.default.existsSync(COM_DIR)) {
    return res.status(400).json({ success: false, message: "Diret\xF3rio data/tcu/comunicacoes n\xE3o encontrado." });
  }
  const files = import_fs2.default.readdirSync(COM_DIR);
  const csvFiles = files.filter((f) => f.toLowerCase().endsWith(".csv"));
  if (csvFiles.length === 0) {
    return res.json({ success: false, message: "Nenhum arquivo .csv encontrado na pasta data/tcu/comunicacoes/." });
  }
  try {
    let imported = 0;
    let updated = 0;
    const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    console.log("[SYNC-LOCAL] Iniciando sincroniza\xE7\xE3o de comunica\xE7\xF5es...");
    for (const file of csvFiles) {
      console.log(`[SYNC-LOCAL-COM] Iniciando processamento do arquivo: ${file}`);
      console.time(`Processamento ${file}`);
      const isPendente = file.toLowerCase().includes("pendente");
      const isRespondida = file.toLowerCase().includes("respondida") || file.toLowerCase().includes("encerrada");
      const filePath = import_path2.default.join(COM_DIR, file);
      let content = import_fs2.default.readFileSync(filePath, "latin1");
      if (!content || content.trim().length < 10) continue;
      const firstLineEnd = content.indexOf("\n");
      const headerLine = firstLineEnd > 0 ? content.substring(0, firstLineEnd) : content;
      const semiCount = (headerLine.match(/;/g) || []).length;
      const commaCount = (headerLine.match(/,/g) || []).length;
      const tabCount = (headerLine.match(/\t/g) || []).length;
      let delimiter = ",";
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = "	";
      const rows = [];
      let currentField = "";
      let currentRow = [];
      let inQuotes = false;
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];
        if (inQuotes) {
          if (char === '"' && nextChar === '"') {
            currentField += '"';
            i++;
          } else if (char === '"') {
            const isEndOfField = nextChar === delimiter || nextChar === "\r" || nextChar === "\n" || nextChar === void 0;
            if (isEndOfField) inQuotes = false;
            else currentField += '"';
          } else {
            currentField += char;
          }
        } else {
          if (char === '"') inQuotes = true;
          else if (char === delimiter) {
            currentRow.push(currentField.trim());
            currentField = "";
          } else if (char === "\r" && nextChar === "\n") {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentField = "";
            i++;
          } else if (char === "\n") {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentField = "";
          } else {
            currentField += char;
          }
        }
      }
      if (currentRow.length > 0 || currentField !== "") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
      }
      for (let i = 0; i < rows.length; i++) {
        const fields = rows[i];
        if (fields.length < 5) continue;
        const comunicacao = fields[0] || "";
        const destinatario = fields[1] || "";
        const contato = fields[2] || "";
        const unidadeEmitente = fields[3] || "";
        const processo = fields[4] || "";
        const dataExpedicao = fields[5] || "";
        let dataResposta = "";
        let prazoDias = "";
        if (isPendente) {
          prazoDias = fields[6] || "";
          dataResposta = "";
        } else {
          dataResposta = fields[6] || "";
          prazoDias = "";
        }
        if (comunicacao.toLowerCase().includes("comunicac") || destinatario.toLowerCase().includes("destinat")) continue;
        const carece = isPendente;
        let ano = 2026;
        const dateMatch = dataExpedicao.match(/\/(\d{4})/);
        if (dateMatch) ano = parseInt(dateMatch[1]);
        else {
          const nameMatch = comunicacao.match(/\/(\d{4})/);
          if (nameMatch) ano = parseInt(nameMatch[1]);
        }
        const numOnly = (comunicacao.match(/\d+[\.\d]*/) || [""])[0].replace(/\D/g, "");
        const key = `COM-${numOnly || Math.floor(Math.random() * 1e6)}-${ano}`;
        const checkResult = await pool.query("SELECT key FROM tcu_comunicacoes WHERE key = $1 OR (comunicacao = $2 AND ano = $3)", [key, comunicacao, ano.toString()]);
        if (checkResult.rows.length > 0) {
          const existingKey = checkResult.rows[0].key;
          await pool.query(`
            UPDATE tcu_comunicacoes SET
              destinatario = $2, contato = $3, unidade_emitente = $4,
              processo = $5, data_expedicao = $6, data_resposta = $7,
              prazo_dias = $8, carece_resposta = $9, ultima_atualizacao = $10
            WHERE key = $1
          `, [existingKey, destinatario, contato, unidadeEmitente, processo, dataExpedicao, dataResposta, prazoDias, carece, updatedAt]);
          updated++;
        } else {
          await pool.query(`
            INSERT INTO tcu_comunicacoes (
              key, comunicacao, destinatario, contato, unidade_emitente,
              processo, data_expedicao, data_resposta, ano, carece_resposta,
              prazo_dias, ultima_atualizacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            key,
            comunicacao,
            destinatario,
            contato,
            unidadeEmitente,
            processo,
            dataExpedicao,
            dataResposta,
            ano.toString(),
            carece,
            prazoDias,
            updatedAt
          ]);
          imported++;
        }
      }
      console.log(`[SYNC-LOCAL-COM] Conclu\xEDdo processamento de ${file}. Importados totais at\xE9 agora: ${imported}, Atualizados: ${updated}`);
      console.timeEnd(`Processamento ${file}`);
    }
    console.log(`[SYNC-LOCAL-COM] Sincroniza\xE7\xE3o finalizada. Total Importados: ${imported}, Atualizados: ${updated}`);
    res.json({
      success: true,
      message: `Sincroniza\xE7\xE3o local conclu\xEDda: ${imported} novos, ${updated} atualizados.`,
      report: [{ file: "Geral", imported, updated, skipped: 0 }]
    });
  } catch (err) {
    console.error("Erro na sincroniza\xE7\xE3o local de comunicacoes:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});
function cleanEncoding(text) {
  if (!text) return "";
  let decoded = text;
  if (decoded.includes("\xC3\xA2") || decoded.includes("\xC3\xA7") || decoded.includes("\xC3\xA3") || decoded.includes("\xC3\xB3") || decoded.includes("\xC3")) {
    try {
      decoded = Buffer.from(decoded, "binary").toString("utf8");
    } catch (e) {
    }
  }
  return decoded;
}
router.get("/comunicacoes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tcu_comunicacoes");
    const mapped = result.rows.map((row2) => ({
      KEY: row2.key,
      COMUNICACAO: cleanEncoding(row2.comunicacao),
      DESTINATARIO: cleanEncoding(row2.destinatario),
      CONTATO: cleanEncoding(row2.contato),
      UNIDADE_EMITENTE: cleanEncoding(row2.unidade_emitente),
      PROCESSO: cleanEncoding(row2.processo),
      DATA_EXPEDICAO: row2.data_expedicao,
      DATA_RESPOSTA: row2.data_resposta,
      ANO: row2.ano,
      CARECE_RESPOSTA: row2.carece_resposta,
      PRAZO_DIAS: row2.prazo_dias,
      RESPOSTA_ENVIADA_INTERNAMENTE: row2.resposta_enviada_internamente,
      UNIDADE_EXECUTORA: cleanEncoding(row2.unidade_executora),
      PROCESSO_SEI: cleanEncoding(row2.processo_sei),
      DESTINACAO: cleanEncoding(row2.destinacao),
      ULTIMA_ATUALIZACAO: row2.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching comunicacoes:", err);
    res.status(500).json({ error: "Failed to fetch comunicacoes." });
  }
});
router.post("/comunicacoes/update", async (req, res) => {
  try {
    const updated = req.body;
    updated.ULTIMA_ATUALIZACAO = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    const checkResult = await pool.query("SELECT key FROM tcu_comunicacoes WHERE key = $1", [updated.KEY]);
    if (checkResult.rows.length > 0) {
      await pool.query(`
        UPDATE tcu_comunicacoes SET
          comunicacao = $2, destinatario = $3, contato = $4, unidade_emitente = $5,
          processo = $6, data_expedicao = $7, data_resposta = $8, ano = $9,
          carece_resposta = $10, prazo_dias = $11, resposta_enviada_internamente = $12,
          unidade_executora = $13, processo_sei = $14, destinacao = $15, ultima_atualizacao = $16
        WHERE key = $1
      `, [
        updated.KEY,
        updated.COMUNICACAO,
        updated.DESTINATARIO,
        updated.CONTATO,
        updated.UNIDADE_EMITENTE,
        updated.PROCESSO,
        updated.DATA_EXPEDICAO,
        updated.DATA_RESPOSTA,
        updated.ANO,
        updated.CARECE_RESPOSTA,
        updated.PRAZO_DIAS,
        updated.RESPOSTA_ENVIADA_INTERNAMENTE,
        updated.UNIDADE_EXECUTORA,
        updated.PROCESSO_SEI,
        updated.DESTINACAO,
        updated.ULTIMA_ATUALIZACAO
      ]);
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Comunica\xE7\xE3o n\xE3o encontrada." });
    }
  } catch (err) {
    console.error("Error updating comunicacao:", err);
    res.status(500).json({ error: "Failed to update comunicacao." });
  }
});
router.delete("/comunicacoes/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query("DELETE FROM tcu_comunicacoes WHERE key = $1", [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting comunicacao:", err);
    res.status(500).json({ error: "Failed to delete comunicacao." });
  }
});
router.post("/comunicacoes/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato inv\xE1lido." });
    }
    const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    const batchSize = 500;
    let importedCount = 0;
    let updatedCount = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      batch.forEach((item) => {
        if (!item.KEY) {
          item.KEY = `${item.COMUNICACAO}-${item.ANO}`;
        }
      });
      const values = [];
      const params = [];
      batch.forEach((item, idx) => {
        const base = idx * 16;
        values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`);
        params.push(
          item.KEY,
          item.COMUNICACAO,
          item.DESTINATARIO,
          item.CONTATO,
          item.UNIDADE_EMITENTE,
          item.PROCESSO,
          item.DATA_EXPEDICAO,
          item.DATA_RESPOSTA,
          item.ANO,
          item.CARECE_RESPOSTA,
          item.PRAZO_DIAS,
          item.RESPOSTA_ENVIADA_INTERNAMENTE,
          item.UNIDADE_EXECUTORA,
          item.PROCESSO_SEI,
          item.DESTINACAO,
          updatedAt
        );
      });
      const query = `
        INSERT INTO tcu_comunicacoes (key, comunicacao, destinatario, contato, unidade_emitente,
          processo, data_expedicao, data_resposta, ano, carece_resposta,
          prazo_dias, resposta_enviada_internamente, unidade_executora,
          processo_sei, destinacao, ultima_atualizacao)
        VALUES ${values.join(",")}
        ON CONFLICT (key) DO UPDATE SET
          comunicacao = EXCLUDED.comunicacao,
          destinatario = EXCLUDED.destinatario,
          contato = EXCLUDED.contato,
          unidade_emitente = EXCLUDED.unidade_emitente,
          processo = EXCLUDED.processo,
          data_expedicao = EXCLUDED.data_expedicao,
          data_resposta = EXCLUDED.data_resposta,
          ano = EXCLUDED.ano,
          carece_resposta = EXCLUDED.carece_resposta,
          prazo_dias = EXCLUDED.prazo_dias,
          resposta_enviada_internamente = EXCLUDED.resposta_enviada_internamente,
          unidade_executora = EXCLUDED.unidade_executora,
          processo_sei = EXCLUDED.processo_sei,
          destinacao = EXCLUDED.destinacao,
          ultima_atualizacao = EXCLUDED.ultima_atualizacao
        RETURNING (xmax = 0) AS inserted;`;
      const result = await pool.query(query, params);
      result.rows.forEach((row2) => {
        if (row2.inserted) importedCount++;
        else updatedCount++;
      });
    }
    const totalResult = await pool.query("SELECT COUNT(*) FROM tcu_comunicacoes");
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: []
    });
  } catch (err) {
    console.error("Error importing comunicacoes:", err);
    res.status(500).json({ error: "Failed to import comunicacoes." });
  }
});
var comunicacoesRoutes_default = router;

// src/backend/routes/rolRoutes.ts
var import_express2 = __toESM(require("express"), 1);
init_db();
var router2 = import_express2.default.Router();
async function getLegacyData() {
  const result = await pool.query("SELECT * FROM rol_responsaveis_legado ORDER BY nome ASC");
  return result.rows;
}
router2.get("/pessoas", async (req, res) => {
  res.json([]);
});
router2.get("/unidades", async (req, res) => {
  try {
    const result = await pool.query("SELECT nome as id_unidade, nome, sigla FROM rol_unidades ORDER BY sigla");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unidades." });
  }
});
router2.get("/cargos", async (req, res) => {
  try {
    const result = await pool.query("SELECT nome as id_cargo, nome FROM rol_cargos ORDER BY nome");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cargos." });
  }
});
router2.get("/mandatos", async (req, res) => {
  try {
    const legacy = await getLegacyData();
    const mandatos = legacy.map((r) => {
      const isSub = r.is_substituto || r.cargo && r.cargo.toLowerCase().includes("substitut");
      return {
        id_registro: r.id,
        is_substituto: isSub,
        id_original: r.id,
        data_inicio: r.inicio_exercicio,
        data_fim: r.fim_exercicio,
        ato_nomeacao: r.ato_nomeacao,
        ato_exoneracao: null,
        id_pessoa: r.id,
        nome_completo: r.nome,
        cpf: r.cpf,
        email: "",
        id_cargo: r.cargo,
        nome_cargo: r.cargo,
        id_unidade: r.unidade,
        sigla_unidade: r.unidade,
        // We can leave this as the name for now, frontend displays it
        nome_unidade: r.unidade,
        tipo_responsabilidade: isSub ? "Substituto" : "Titular",
        status: !r.fim_exercicio || r.fim_exercicio.trim() === "" ? "Vigente" : "Hist\xF3rico"
      };
    });
    res.json(mandatos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mandatos." });
  }
});
router2.put("/dirigentes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, cpf, id_cargo, id_unidade, data_inicio, data_fim, ato_nomeacao, ato_exoneracao, is_substituto } = req.body;
    await pool.query(
      `UPDATE rol_responsaveis_legado SET 
        nome = $1, cpf = $2, cargo = $3, unidade = $4, inicio_exercicio = $5, fim_exercicio = $6, ato_nomeacao = $7, is_substituto = $8 
       WHERE id = $9`,
      [nome_completo, cpf, id_cargo, id_unidade, data_inicio, data_fim, ato_nomeacao, is_substituto, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update dirigente." });
  }
});
router2.get("/afastamentos", async (req, res) => {
  res.json([]);
});
var rolRoutes_default = router2;

// src/backend/routes/acordaoRoutes.ts
var import_express3 = __toESM(require("express"), 1);
init_db();
var import_fs6 = __toESM(require("fs"), 1);
var import_path5 = __toESM(require("path"), 1);
init_tcuCsvParser();

// src/backend/utils/tcuApi.ts
var import_fs4 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
var TCU_DIR3 = import_path4.default.resolve(process.cwd(), "data", "tcu", "acordaos");
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
function garantirDiretorio() {
  if (!import_fs4.default.existsSync(TCU_DIR3)) {
    import_fs4.default.mkdirSync(TCU_DIR3, { recursive: true });
  }
}
async function fetchAcordaoCompleto(year, ehHistorico = false) {
  garantirDiretorio();
  const tempPath = import_path4.default.join(TCU_DIR3, `cache-acordao-completo-${year}.csv`);
  const inProgressPath = tempPath + ".tmp";
  if (import_fs4.default.existsSync(tempPath)) {
    if (ehHistorico) {
      console.log(`[TCU-CSV] Cache hist\xF3rico encontrado para ${year}. Reutilizando.`);
      return tempPath;
    }
    const stats = import_fs4.default.statSync(tempPath);
    const idadeMs = Date.now() - stats.mtimeMs;
    if (idadeMs < CACHE_TTL_MS) {
      const horas = Math.round(idadeMs / 36e5 * 10) / 10;
      console.log(`[TCU-CSV] Cache v\xE1lido para ${year} (${horas}h). Reutilizando.`);
      return tempPath;
    }
    console.log(`[TCU-CSV] Cache expirado para ${year} (>${CACHE_TTL_MS / 36e5}h). Re-baixando...`);
  }
  const url = `https://sites.tcu.gov.br/dados-abertos/jurisprudencia/arquivos/acordao-completo/acordao-completo-${year}.csv`;
  console.log(`[TCU-CSV] Baixando: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/csv,application/csv,text/plain,*/*"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error("Response body est\xE1 vazio.");
    }
    const { Readable } = await import("stream");
    const fileStream = import_fs4.default.createWriteStream(inProgressPath);
    await new Promise((resolve, reject) => {
      Readable.fromWeb(response.body).pipe(fileStream).on("finish", () => {
        fileStream.close();
        resolve();
      }).on("error", (err) => {
        fileStream.close();
        reject(err);
      });
    });
    import_fs4.default.renameSync(inProgressPath, tempPath);
    const stats = import_fs4.default.statSync(tempPath);
    const tamanhoMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`[TCU-CSV] Download conclu\xEDdo: ${year} (${tamanhoMB} MB)`);
    return tempPath;
  } catch (err) {
    console.error(`[TCU-CSV] Falha no download para ${year}:`, err.message);
    if (import_fs4.default.existsSync(inProgressPath)) {
      try {
        import_fs4.default.unlinkSync(inProgressPath);
      } catch {
      }
    }
    if (import_fs4.default.existsSync(tempPath)) {
      console.warn(`[TCU-CSV] Usando cache expirado como fallback para ${year}.`);
      return tempPath;
    }
    throw err;
  }
}

// src/backend/routes/acordaoRoutes.ts
init_importControl();

// src/backend/utils/backgroundProcessor.ts
init_db();

// src/backend/utils/aiUtils.ts
var import_genai = require("@google/genai");
var import_dotenv2 = __toESM(require("dotenv"), 1);
import_dotenv2.default.config();
var ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });
async function extractTcuDataWithGemini(acordaoText, tceContext) {
  const prompt = `
Voc\xEA \xE9 um especialista em auditoria e controle do TCU.
Extraia as seguintes informa\xE7\xF5es do Ac\xF3rd\xE3o fornecido em formato JSON ESTRITO.

Objetivos de Extra\xE7\xE3o:
1. "responsaveis": Lista de pessoas ou empresas condenadas a ressarcir o er\xE1rio (d\xE9bito) ou pagar multa.
   Para cada respons\xE1vel, extraia:
   - "nome": Nome completo ou Raz\xE3o Social
   - "cpf_cnpj": Apenas os n\xFAmeros, se houver
   - "valor_debito": Valor da condena\xE7\xE3o (em R$ ou string)
   - "tipo": "PF" ou "PJ"
   - "numero_siafi": Se mencionado no texto que h\xE1 uma TCE (Tomada de Contas Especial) ou n\xFAmero SIAFI espec\xEDfico atrelado a esse respons\xE1vel/objeto, extraia-o.

2. "determinacoes": Lista de strings contendo as determina\xE7\xF5es emitidas no ac\xF3rd\xE3o.
3. "recomendacoes": Lista de strings contendo as recomenda\xE7\xF5es emitidas no ac\xF3rd\xE3o.
4. "ha_ressarcimento": Booleano (true/false) indicando se h\xE1 condena\xE7\xE3o em d\xE9bito (ressarcimento) no ac\xF3rd\xE3o.

${tceContext ? `Contexto adicional da TCE relacionada (use para cruzar dados): ${JSON.stringify(tceContext)}` : ""}

Texto do Ac\xF3rd\xE3o:
"""
${acordaoText.substring(0, 3e4)}
"""

Retorne APENAS um JSON v\xE1lido. Exemplo de estrutura esperada:
{
  "responsaveis": [
    { "nome": "Jo\xE3o da Silva", "cpf_cnpj": "12345678900", "valor_debito": "15000.00", "tipo": "PF", "numero_siafi": "123456" }
  ],
  "determinacoes": ["Determinar \xE0 unidade X que fa\xE7a Y"],
  "recomendacoes": [],
  "ha_ressarcimento": true
}
`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }
    const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Erro na extra\xE7\xE3o via Gemini (TCU):", error);
    throw error;
  }
}
async function extractCguDossieWithGemini(pdfText) {
  const prompt = `
Voc\xEA \xE9 um especialista em auditoria governamental da CGU (Controladoria-Geral da Uni\xE3o).
Sua tarefa \xE9 analisar o Relat\xF3rio de Auditoria fornecido e extrair um Dossi\xEA Estruturado.

Como as recomenda\xE7\xF5es/determina\xE7\xF5es j\xE1 s\xE3o acompanhadas por outro sistema, seu objetivo principal \xE9 focar em extrair as constata\xE7\xF5es (achados de auditoria), as conclus\xF5es gerais e o escopo.

Extraia as seguintes informa\xE7\xF5es em formato JSON ESTRITO:
1. "resumo": Um resumo executivo de 1 a 2 par\xE1grafos sobre o que foi auditado e a conclus\xE3o geral.
2. "escopo": O que foi o alvo da auditoria (ex: avalia\xE7\xE3o de pol\xEDticas p\xFAblicas, folhas de pagamento, contratos, etc).
3. "constatacoes": Lista de objetos, onde cada um representa um achado (problema/irregularidade) apontado pela CGU. Cada objeto deve ter:
   - "titulo": T\xEDtulo ou descri\xE7\xE3o curta do achado.
   - "descricao": Explica\xE7\xE3o detalhada do que ocorreu.
   - "risco_impacto": Qual o risco ou impacto gerado (se mencionado, ex: "Alto", "R$ 1.000,00 de preju\xEDzo", "Risco \xE0 seguran\xE7a").

Texto do Relat\xF3rio:
"""
${pdfText.substring(0, 6e4)}
"""

Retorne APENAS um JSON v\xE1lido. Exemplo de estrutura esperada:
{
  "resumo": "A auditoria avaliou o programa X e concluiu que...",
  "escopo": "Contratos de presta\xE7\xE3o de servi\xE7o do programa X no exerc\xEDcio de 2023.",
  "constatacoes": [
    {
      "titulo": "Pagamentos indevidos a fornecedores",
      "descricao": "Foram identificados pagamentos em duplicidade...",
      "risco_impacto": "Preju\xEDzo financeiro de R$ 50.000,00"
    }
  ]
}
`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA.");
    const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Erro na extra\xE7\xE3o via Gemini (CGU):", error);
    throw error;
  }
}

// src/backend/utils/backgroundProcessor.ts
async function processSingleAcordao(key) {
  const acResult = await pool.query("SELECT * FROM tcu_acordaos WHERE key = $1", [key]);
  if (acResult.rows.length === 0) {
    throw new Error("Ac\xF3rd\xE3o n\xE3o encontrado no Postgres.");
  }
  const acordao = acResult.rows[0];
  let acordaoTeor = acordao.acordao;
  if (!acordaoTeor || acordaoTeor.trim() === "") {
    console.log(`[Background] Ac\xF3rd\xE3o ${acordao.num_acordao}/${acordao.ano_acordao} n\xE3o possui Inteiro Teor no banco. Tentando buscar no cache da API TCU...`);
    const { getInteiroTeorFromCache } = await Promise.resolve().then(() => (init_tcuCsvParser(), tcuCsvParser_exports));
    const fetchedTeor = await getInteiroTeorFromCache(acordao.num_acordao, acordao.ano_acordao);
    if (fetchedTeor) {
      console.log(`[Background] Atualizando Inteiro Teor no banco para ${key}...`);
      await pool.query("UPDATE tcu_acordaos SET acordao = $1 WHERE key = $2", [fetchedTeor, key]);
      acordaoTeor = fetchedTeor;
    } else {
      throw new Error("Este ac\xF3rd\xE3o n\xE3o possui o Inteiro Teor para ser analisado e n\xE3o foi poss\xEDvel encontrar no cache/API do TCU.");
    }
  }
  const aiResultJson = await extractTcuDataWithGemini(acordaoTeor);
  const dossieResponsaveis = aiResultJson.responsaveis || [];
  const newAiData = acordao.ai_analysis_data ? typeof acordao.ai_analysis_data === "string" ? JSON.parse(acordao.ai_analysis_data) : acordao.ai_analysis_data : {};
  newAiData.dossieRessarcimento = dossieResponsaveis;
  newAiData.determinacoes = aiResultJson.determinacoes || [];
  newAiData.recomendacoes = aiResultJson.recomendacoes || [];
  newAiData.ha_ressarcimento = aiResultJson.ha_ressarcimento;
  let status_monitoramento = acordao.status_monitoramento;
  let observacoes = acordao.observacoes || "";
  await pool.query(`
    UPDATE tcu_acordaos 
    SET ai_analysis_data = $1, status_monitoramento = $2, observacoes = $3 
    WHERE key = $4
  `, [JSON.stringify(newAiData), status_monitoramento, observacoes, key]);
  return {
    dossie: dossieResponsaveis,
    checklist: {
      determinacoes: aiResultJson.determinacoes || [],
      recomendacoes: aiResultJson.recomendacoes || [],
      ha_ressarcimento: aiResultJson.ha_ressarcimento
    }
  };
}

// src/backend/routes/acordaoRoutes.ts
var import_genai2 = require("@google/genai");
var DATA_DIR2 = import_path5.default.join(process.cwd(), "data");
var TCU_DIR4 = import_path5.default.join(DATA_DIR2, "tcu", "acordaos");
var MODULO = "TCU_ACORDAOS";
var router3 = import_express3.default.Router();
function isTeorMissing(teorVal) {
  if (!teorVal) return true;
  const str = String(teorVal).trim();
  return str === "" || str === "null" || str === "undefined" || str === "[]" || str === "{}";
}
function normalizarColegiado2(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
}
router3.post("/acordaos/sync-local", async (req, res) => {
  const forcarReprocessamento = req.body?.forcarAno ? parseInt(req.body.forcarAno, 10) : null;
  const usuarioId = req.session?.user?.id ?? "SISTEMA";
  if (!import_fs6.default.existsSync(TCU_DIR4)) {
    return res.status(400).json({
      success: false,
      message: "Diret\xF3rio data/tcu/acordaos n\xE3o encontrado."
    });
  }
  const hoje = /* @__PURE__ */ new Date();
  const anoCorrente = getAnoParaImportacaoAutomatica(hoje);
  const arquivos = import_fs6.default.readdirSync(TCU_DIR4).filter((f) => {
    return f.toLowerCase().endsWith(".csv") && !f.toLowerCase().includes("cache") && !f.toLowerCase().endsWith(".tmp");
  });
  if (arquivos.length === 0) {
    return res.json({
      success: false,
      message: "Nenhum arquivo .csv filtrado encontrado em data/tcu/acordaos/."
    });
  }
  const countResult = await pool.query("SELECT COUNT(*) FROM tcu_acordaos");
  const estaVazia = parseInt(countResult.rows[0].count, 10) === 0;
  const arquivosParaProcessar = arquivos.filter((arquivo) => {
    const matchAno = arquivo.match(/(\d{4})/);
    if (!matchAno) return false;
    const anoArquivo = parseInt(matchAno[1], 10);
    if (forcarReprocessamento && anoArquivo === forcarReprocessamento) {
      return true;
    }
    const status = getAnoStatus(anoArquivo, hoje);
    if (status === "futuro") {
      console.log(`[SYNC] Arquivo ${arquivo} ignorado: ano futuro.`);
      return false;
    }
    if (status === "historico" && !estaVazia) {
      console.log(
        `[SYNC] Arquivo ${arquivo} ignorado: ano hist\xF3rico (j\xE1 importado anteriormente).`
      );
      return false;
    }
    if (status === "corrente") {
      return true;
    }
    return estaVazia;
  });
  if (arquivosParaProcessar.length === 0) {
    return res.json({
      success: true,
      message: `Nenhum arquivo eleg\xEDvel para processamento. O ano corrente (${anoCorrente}) ainda n\xE3o possui arquivo dispon\xEDvel ou todos os hist\xF3ricos j\xE1 foram importados.`,
      report: []
    });
  }
  const reportGeral = [];
  let totalImportados = 0;
  let totalAtualizados = 0;
  const pendingTasks = [];
  for (const arquivo of arquivosParaProcessar) {
    const matchAno = arquivo.match(/(\d{4})/);
    if (!matchAno) continue;
    const anoArquivo = parseInt(matchAno[1], 10);
    const statusAno2 = getAnoStatus(anoArquivo, hoje);
    const ehHistorico = statusAno2 === "historico";
    const importControlId = await iniciarImportacao({
      modulo: MODULO,
      ano_referencia: anoArquivo,
      tipo_arquivo: "FILTRADO_LOCAL",
      nome_arquivo: arquivo,
      forcado_por_usuario: forcarReprocessamento ? usuarioId : void 0
    });
    pendingTasks.push({ arquivo, anoArquivo, ehHistorico, importControlId });
  }
  res.json({
    success: true,
    message: `Sincroniza\xE7\xE3o iniciada em background para ${arquivosParaProcessar.length} arquivo(s). Consulte /api/acordaos/import-status para acompanhar.`,
    arquivos: arquivosParaProcessar
  });
  (async () => {
    for (const task of pendingTasks) {
      const { arquivo, anoArquivo, ehHistorico, importControlId } = task;
      try {
        const filePath = import_path5.default.join(TCU_DIR4, arquivo);
        await atualizarStatusImportacao({
          id: importControlId,
          status: "PROCESSANDO"
        });
        console.log(`
[SYNC] \u2550\u2550\u2550 Iniciando: ${arquivo} (ano ${anoArquivo}) \u2550\u2550\u2550`);
        console.time(`[SYNC] Tempo total ${arquivo}`);
        const acordaosFiltrados = parsearCsvFiltrado(filePath);
        const hash = calcularHashArquivo(filePath);
        await atualizarStatusImportacao({
          id: importControlId,
          status: "PROCESSANDO",
          hash_arquivo: hash,
          quantidade_linhas_csv: acordaosFiltrados.length
        });
        const numerosDoArquivo = acordaosFiltrados.map((a) => a.numAcordao);
        const existentesResult = await pool.query(
          `SELECT key, num_acordao, ano_acordao, colegiado, acordao
           FROM tcu_acordaos
           WHERE num_acordao = ANY($1) AND ano_acordao = $2`,
          [numerosDoArquivo, anoArquivo]
        );
        const existentesMap = /* @__PURE__ */ new Map();
        for (const row2 of existentesResult.rows) {
          const chave = `${row2.num_acordao}-${normalizarColegiado2(row2.colegiado)}`;
          existentesMap.set(chave, row2);
        }
        const seenKeys = /* @__PURE__ */ new Set();
        const linhasValidas = [];
        const alvosParaBuscarTeor = [];
        for (const ac of acordaosFiltrados) {
          const chave = `${ac.numAcordao}-${normalizarColegiado2(ac.colegiado)}`;
          if (seenKeys.has(chave)) continue;
          seenKeys.add(chave);
          linhasValidas.push(ac);
          const existente = existentesMap.get(chave);
          if (!existente || isTeorMissing(existente.acordao)) {
            alvosParaBuscarTeor.push({
              numAcordao: String(ac.numAcordao),
              anoAcordao: String(ac.anoAcordao),
              colegiado: ac.colegiado
            });
          }
        }
        let teoresMap = /* @__PURE__ */ new Map();
        if (alvosParaBuscarTeor.length > 0) {
          console.log(`[SYNC] Buscando teores: ${alvosParaBuscarTeor.length} ac\xF3rd\xE3os sem inteiro teor...`);
          await atualizarStatusImportacao({
            id: importControlId,
            status: "BAIXANDO"
          });
          const cachePath = await fetchAcordaoCompleto(anoArquivo, ehHistorico);
          await atualizarStatusImportacao({
            id: importControlId,
            status: "PROCESSANDO"
          });
          teoresMap = await getComplementaryDataBulk(cachePath, alvosParaBuscarTeor);
        }
        let inseridos = 0;
        let atualizados = 0;
        let ignorados = 0;
        let erros = 0;
        const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          for (const ac of linhasValidas) {
            try {
              const chave = `${ac.numAcordao}-${normalizarColegiado2(ac.colegiado)}`;
              const existente = existentesMap.get(chave);
              const compData = teoresMap.get(chave) ?? null;
              if (existente) {
                if (compData) {
                  await client.query(
                    `UPDATE tcu_acordaos SET
                       colegiado             = $2,
                       data_sessao           = $3,
                       tipo_processo         = $4,
                       relator               = $5,
                       ultima_atualizacao    = $6,
                       acordao               = $7,
                       num_ata               = $8,
                       situacao              = $9,
                       proc                  = $10,
                       acordaos_relacionados = $11,
                       interessados          = $12,
                       entidade              = $13,
                       unidade_tecnica       = $14,
                       assunto               = $15,
                       sumario               = $16,
                       decisao               = $17
                     WHERE key = $1`,
                    [
                      existente.key,
                      ac.colegiado,
                      ac.dataSessao,
                      ac.tipoProcesso,
                      ac.relator,
                      updatedAt,
                      compData.acordao,
                      compData.num_ata,
                      compData.situacao,
                      compData.proc,
                      compData.acordaos_relacionados,
                      compData.interessados,
                      compData.entidade,
                      compData.unidade_tecnica || ac.unidadeTecnica,
                      compData.assunto,
                      compData.sumario,
                      compData.decisao
                    ]
                  );
                } else {
                  await client.query(
                    `UPDATE tcu_acordaos SET
                       colegiado          = $2,
                       data_sessao        = $3,
                       tipo_processo      = $4,
                       relator            = $5,
                       ultima_atualizacao = $6
                     WHERE key = $1`,
                    [
                      existente.key,
                      ac.colegiado,
                      ac.dataSessao,
                      ac.tipoProcesso,
                      ac.relator,
                      updatedAt
                    ]
                  );
                }
                atualizados++;
              } else {
                const finalKey = compData?.key || `AC-${ac.numAcordao}-${ac.anoAcordao}-${normalizarColegiado2(ac.colegiado)}`;
                await client.query(
                  `INSERT INTO tcu_acordaos (
                     key, titulo, num_acordao, ano_acordao, colegiado, data_sessao,
                     situacao, tipo_processo, relator, status_monitoramento, ultima_atualizacao,
                     acordao, num_ata, proc, acordaos_relacionados, interessados,
                     entidade, unidade_tecnica, assunto, sumario, decisao
                   ) VALUES (
                     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                     $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
                   )
                   ON CONFLICT (key) DO UPDATE SET
                     colegiado          = EXCLUDED.colegiado,
                     data_sessao        = EXCLUDED.data_sessao,
                     tipo_processo      = EXCLUDED.tipo_processo,
                     relator            = EXCLUDED.relator,
                     acordao            = COALESCE(EXCLUDED.acordao, tcu_acordaos.acordao),
                     num_ata            = COALESCE(EXCLUDED.num_ata, tcu_acordaos.num_ata),
                     proc               = COALESCE(EXCLUDED.proc, tcu_acordaos.proc),
                     interessados       = COALESCE(EXCLUDED.interessados, tcu_acordaos.interessados),
                     assunto            = COALESCE(EXCLUDED.assunto, tcu_acordaos.assunto),
                     sumario            = COALESCE(EXCLUDED.sumario, tcu_acordaos.sumario),
                     decisao            = COALESCE(EXCLUDED.decisao, tcu_acordaos.decisao),
                     ultima_atualizacao = EXCLUDED.ultima_atualizacao`,
                  [
                    finalKey,
                    `AC\xD3RD\xC3O ${ac.numAcordao}/${ac.anoAcordao} - ${(ac.colegiado || "").toUpperCase()}`,
                    ac.numAcordao,
                    ac.anoAcordao,
                    ac.colegiado,
                    ac.dataSessao,
                    compData?.situacao || "OFICIALIZADO",
                    ac.tipoProcesso,
                    compData?.relator || ac.relator,
                    "Pendente",
                    updatedAt,
                    compData?.acordao ?? null,
                    compData?.num_ata ?? null,
                    compData?.proc ?? ac.processo ?? null,
                    compData?.acordaos_relacionados ?? null,
                    compData?.interessados ?? null,
                    compData?.entidade ?? null,
                    compData?.unidade_tecnica ?? ac.unidadeTecnica ?? null,
                    compData?.assunto ?? null,
                    compData?.sumario ?? null,
                    compData?.decisao ?? null
                  ]
                );
                inseridos++;
              }
            } catch (errItem) {
              console.error(
                `[SYNC] Erro ao processar ac\xF3rd\xE3o ${ac.numAcordao}/${ac.anoAcordao}:`,
                errItem.message
              );
              erros++;
            }
          }
          await client.query("COMMIT");
        } catch (errTx) {
          await client.query("ROLLBACK");
          throw errTx;
        } finally {
          client.release();
        }
        totalImportados += inseridos;
        totalAtualizados += atualizados;
        await atualizarStatusImportacao({
          id: importControlId,
          status: erros > 0 && inseridos + atualizados === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
          quantidade_inseridos: inseridos,
          quantidade_atualizados: atualizados,
          quantidade_ignorados: ignorados,
          quantidade_erros: erros,
          eh_historico: ehHistorico,
          observacoes: `Arquivo: ${arquivo}. Encoding detectado automaticamente.`
        });
        console.timeEnd(`[SYNC] Tempo total ${arquivo}`);
        console.log(
          `[SYNC] ${arquivo}: inseridos=${inseridos}, atualizados=${atualizados}, erros=${erros}`
        );
        reportGeral.push({
          arquivo,
          ano: anoArquivo,
          status: statusAno,
          inseridos,
          atualizados,
          erros
        });
      } catch (errArquivo) {
        console.error(`[SYNC] Erro fatal no arquivo ${arquivo}:`, errArquivo);
        if (importControlId) {
          await registrarErroImportacao(importControlId, errArquivo);
        }
        reportGeral.push({
          arquivo,
          erro: errArquivo.message
        });
      }
    }
    console.log(
      `
[SYNC] \u2550\u2550\u2550 Sincroniza\xE7\xE3o conclu\xEDda. Total: ${totalImportados} inseridos, ${totalAtualizados} atualizados \u2550\u2550\u2550`
    );
  })().catch((err) => {
    console.error("[SYNC] Erro cr\xEDtico no processamento em background:", err);
  });
});
router3.get("/acordaos/import-status", async (req, res) => {
  try {
    const status = await getStatusImportacoes();
    res.json({ success: true, data: status });
  } catch (err) {
    console.error("[IMPORT-STATUS] Erro:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router3.get("/acordaos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        key, titulo, num_acordao, ano_acordao, num_ata, colegiado, data_sessao,
        situacao, proc, acordaos_relacionados, tipo_processo, interessados,
        entidade, unidade_tecnica, relator, assunto, sumario, decisao,
        recomendacoes, determinacoes, recomendacoes_determinacoes_unificado,
        status_monitoramento, responsavel_interno, prazo_limite, observacoes,
        ultima_atualizacao, ai_analysis_data
      FROM tcu_acordaos
      ORDER BY ano_acordao DESC, num_acordao DESC
    `);
    const mapped = result.rows.map((row2) => ({
      KEY: row2.key,
      TITULO: row2.titulo,
      NUMACORDAO: row2.num_acordao,
      ANOACORDAO: row2.ano_acordao,
      NUMATA: row2.num_ata,
      COLEGIADO: row2.colegiado,
      DATASESSAO: row2.data_sessao,
      SITUACAO: row2.situacao,
      PROC: row2.proc,
      ACORDAOSRELACIONADOS: row2.acordaos_relacionados,
      TIPOPROCESSO: row2.tipo_processo,
      INTERESSADOS: row2.interessados,
      ENTIDADE: row2.entidade,
      UNIDADETECNICA: row2.unidade_tecnica,
      RELATOR: row2.relator,
      ASSUNTO: row2.assunto,
      SUMARIO: row2.sumario,
      ACORDAO: "",
      // Omitido intencionalmente para economizar banda — use GET /acordaos/:key/teor
      DECISAO: row2.decisao,
      RECOMENDACOES: row2.recomendacoes,
      DETERMINACOES: row2.determinacoes,
      RECOMENDACOES_DETERMINACOES_UNIFICADO: row2.recomendacoes_determinacoes_unificado,
      STATUS_MONITORAMENTO: row2.status_monitoramento,
      RESPONSAVEL_INTERNO: row2.responsavel_interno,
      PRAZO_LIMITE: row2.prazo_limite,
      OBSERVACOES: row2.observacoes,
      ULTIMA_ATUALIZACAO: row2.ultima_atualizacao,
      aiAnalysisData: row2.ai_analysis_data
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Erro ao buscar Ac\xF3rd\xE3os:", err);
    res.status(500).json({ error: "Falha ao buscar Ac\xF3rd\xE3os." });
  }
});
function limparTeor(rawTeor) {
  if (!rawTeor) return "";
  let text = rawTeor;
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<p[^>]*>/gi, "\n\n");
  text = text.replace(/<\/p>/gi, "");
  text = text.replace(/<[^>]*>?/gm, "\n");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  return text.trim();
}
router3.get("/acordaos/:key/teor", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      "SELECT acordao FROM tcu_acordaos WHERE key = $1",
      [key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado." });
    }
    const cleanText = limparTeor(result.rows[0].acordao || "");
    res.json({ acordao: cleanText });
  } catch (err) {
    console.error("Erro ao buscar inteiro teor:", err);
    res.status(500).json({ error: "Falha ao buscar inteiro teor." });
  }
});
router3.post("/acordaos/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const query = `
      UPDATE tcu_acordaos SET
        titulo = $2, num_acordao = $3, ano_acordao = $4, num_ata = $5,
        colegiado = $6, data_sessao = $7, situacao = $8, proc = $9,
        acordaos_relacionados = $10, tipo_processo = $11, interessados = $12,
        entidade = $13, unidade_tecnica = $14, relator = $15, assunto = $16,
        sumario = $17, decisao = $18, recomendacoes = $19,
        determinacoes = $20, recomendacoes_determinacoes_unificado = $21,
        status_monitoramento = $22, responsavel_interno = $23,
        prazo_limite = $24, observacoes = $25,
        ultima_atualizacao = $26, ai_analysis_data = $27
      WHERE key = $1
      RETURNING key
    `;
    const values = [
      updated.KEY,
      updated.TITULO,
      updated.NUMACORDAO,
      updated.ANOACORDAO,
      updated.NUMATA,
      updated.COLEGIADO,
      updated.DATASESSAO,
      updated.SITUACAO,
      updated.PROC,
      updated.ACORDAOSRELACIONADOS,
      updated.TIPOPROCESSO,
      updated.INTERESSADOS,
      updated.ENTIDADE,
      updated.UNIDADETECNICA,
      updated.RELATOR,
      updated.ASSUNTO,
      updated.SUMARIO,
      updated.DECISAO,
      updated.RECOMENDACOES,
      updated.DETERMINACOES,
      updated.RECOMENDACOES_DETERMINACOES_UNIFICADO,
      updated.STATUS_MONITORAMENTO,
      updated.RESPONSAVEL_INTERNO,
      updated.PRAZO_LIMITE,
      updated.OBSERVACOES,
      updatedAt,
      updated.aiAnalysisData ? JSON.stringify(updated.aiAnalysisData) : null
    ];
    const result = await pool.query(query, values);
    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado." });
    }
  } catch (err) {
    console.error("Erro ao atualizar Ac\xF3rd\xE3o:", err);
    res.status(500).json({ error: "Falha ao atualizar Ac\xF3rd\xE3o." });
  }
});
router3.delete("/acordaos/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query("DELETE FROM tcu_acordaos WHERE key = $1", [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir Ac\xF3rd\xE3o:", err);
    res.status(500).json({ error: "Falha ao excluir Ac\xF3rd\xE3o." });
  }
});
router3.post("/acordaos/:key/analisar-ressarcimento", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await processSingleAcordao(key);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[AI] Erro na an\xE1lise de ressarcimento:", err.message);
    res.status(500).json({ error: err.message });
  }
});
router3.post("/acordaos/:key/auditoria-profunda", async (req, res) => {
  const { key } = req.params;
  try {
    const acResult = await pool.query(
      "SELECT * FROM tcu_acordaos WHERE key = $1",
      [key]
    );
    if (acResult.rows.length === 0) {
      return res.status(404).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado." });
    }
    const acordao = acResult.rows[0];
    if (!acordao.acordao || acordao.acordao.trim() === "") {
      return res.status(400).json({ error: "Ac\xF3rd\xE3o sem inteiro teor. Execute a sincroniza\xE7\xE3o primeiro." });
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chave da API do Gemini n\xE3o configurada." });
    }
    const ai2 = new import_genai2.GoogleGenAI({ apiKey });
    const textChunk = acordao.acordao.substring(0, 25e3);
    const prompt = `
# ROLE E OBJETIVO
Voc\xEA \xE9 o motor de extra\xE7\xE3o sem\xE2ntica do sistema \xD3RBITA.
Responda \xE0 pergunta do usu\xE1rio com base no texto do Ac\xF3rd\xE3o abaixo.

Texto do Ac\xF3rd\xE3o:
"""
${textChunk}
"""

Pergunta do usu\xE1rio:
${req.body.pergunta || "Fa\xE7a um resumo executivo deste Ac\xF3rd\xE3o."}
`;
    const response = await ai2.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.2 }
    });
    return res.json({ success: true, analise: response.text });
  } catch (error) {
    console.error("[Auditoria Profunda] Erro:", error);
    return res.status(500).json({ error: "Falha na an\xE1lise de intelig\xEAncia artificial." });
  }
});
router3.post("/acordaos/aprender", (req, res) => {
  const { tipo, palavra } = req.body;
  if (!tipo || !palavra) {
    return res.status(400).json({ error: "Faltam par\xE2metros tipo ou palavra." });
  }
  const DICT_PATH = import_path5.default.join(DATA_DIR2, "orbita_dictionary.json");
  try {
    let dict = {};
    if (import_fs6.default.existsSync(DICT_PATH)) {
      dict = JSON.parse(import_fs6.default.readFileSync(DICT_PATH, "utf-8"));
    }
    const key = `keywords${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    if (!dict[key]) dict[key] = [];
    const kw = palavra.toLowerCase().trim();
    if (!dict[key].includes(kw)) {
      dict[key].push(kw);
      import_fs6.default.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2), "utf-8");
    }
    return res.json({
      success: true,
      message: `Express\xE3o '${kw}' aprendida para ${tipo}!`
    });
  } catch (err) {
    console.error("Erro ao aprender nova palavra:", err);
    return res.status(500).json({ error: "Falha ao salvar no dicion\xE1rio." });
  }
});
var acordaoRoutes_default = router3;

// src/backend/routes/tceRoutes.ts
var import_express4 = __toESM(require("express"), 1);
init_db();
var import_fs7 = __toESM(require("fs"), 1);
var import_path6 = __toESM(require("path"), 1);
var router4 = import_express4.default.Router();
router4.get("/files/last-updates", (req, res) => {
  const getMostRecentDate = (dirPath) => {
    try {
      if (!import_fs7.default.existsSync(dirPath)) return null;
      const files = import_fs7.default.readdirSync(dirPath).filter((f) => f.toLowerCase().endsWith(".csv"));
      if (files.length === 0) return null;
      let maxTime = 0;
      for (const file of files) {
        const stat = import_fs7.default.statSync(import_path6.default.join(dirPath, file));
        if (stat.mtimeMs > maxTime) maxTime = stat.mtimeMs;
      }
      return maxTime > 0 ? new Date(maxTime).toLocaleString("pt-BR") : null;
    } catch {
      return null;
    }
  };
  const tcuAcordaos = getMostRecentDate(import_path6.default.join(process.cwd(), "data", "tcu", "acordaos"));
  const tcuTces = getMostRecentDate(import_path6.default.join(process.cwd(), "data", "tcu", "tces"));
  const tcuComs = getMostRecentDate(import_path6.default.join(process.cwd(), "data", "tcu", "comunicacoes"));
  res.json({
    success: true,
    data: {
      acordaos: tcuAcordaos,
      tces: tcuTces,
      comunicacoes: tcuComs
    }
  });
});
router4.post("/tces/sync-local", async (req, res) => {
  const TCE_DIR = import_path6.default.join(process.cwd(), "data", "tcu", "tces");
  if (!import_fs7.default.existsSync(TCE_DIR)) {
    return res.status(400).json({ success: false, message: "Diret\xF3rio data/tcu/tces n\xE3o encontrado." });
  }
  const files = import_fs7.default.readdirSync(TCE_DIR);
  const csvFiles = files.filter((f) => f.toLowerCase().endsWith(".csv"));
  if (csvFiles.length === 0) {
    return res.json({ success: false, message: "Nenhum arquivo .csv encontrado na pasta data/tcu/tces/." });
  }
  try {
    let importedGeral = 0;
    let updatedGeral = 0;
    let importedMap = 0;
    let updatedMap = 0;
    const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    const parseCSVRobust2 = (csvText, delimiter) => {
      const rows = [];
      let currentField = "";
      let currentRow = [];
      let inQuotes = false;
      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        if (inQuotes) {
          if (char === '"' && nextChar === '"') {
            currentField += '"';
            i++;
          } else if (char === '"') {
            const isEndOfField = nextChar === delimiter || nextChar === "\r" || nextChar === "\n" || nextChar === void 0;
            if (isEndOfField) inQuotes = false;
            else currentField += '"';
          } else {
            currentField += char;
          }
        } else {
          if (char === '"') inQuotes = true;
          else if (char === delimiter) {
            currentRow.push(currentField.trim());
            currentField = "";
          } else if (char === "\r" && nextChar === "\n") {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentField = "";
            i++;
          } else if (char === "\n") {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            currentField = "";
          } else {
            currentField += char;
          }
        }
      }
      if (currentRow.length > 0 || currentField !== "") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
      }
      return rows;
    };
    const normalizeHeaderName2 = (str) => {
      if (!str) return "";
      return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    };
    const extractYearFromTceString = (str) => {
      if (!str) return 2026;
      const match = str.match(/(?:20|19)\d{2}/);
      if (match) return parseInt(match[0]);
      return 2026;
    };
    const fixExcelDateTce = (str) => {
      if (!str) return "";
      const meses = {
        jan: 1,
        fev: 2,
        mar: 3,
        abr: 4,
        mai: 5,
        jun: 6,
        jul: 7,
        ago: 8,
        set: 9,
        out: 10,
        nov: 11,
        dez: 12
      };
      const match = str.trim().toLowerCase().match(/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/(\d{2})$/);
      if (match) {
        const month = meses[match[1]];
        const year = "20" + match[2];
        return `${month}/${year}`;
      }
      return str.trim();
    };
    for (const file of csvFiles) {
      console.log(`[SYNC-LOCAL-TCES] Iniciando processamento do arquivo: ${file}`);
      console.time(`Processamento ${file}`);
      const isMapping = file.toLowerCase().includes("acordao") || file.toLowerCase().includes("ac\xF3rd\xE3o") || file.toLowerCase().includes("mapping");
      const filePath = import_path6.default.join(TCE_DIR, file);
      let contentStr = import_fs7.default.readFileSync(filePath, "latin1");
      if (!contentStr || contentStr.trim().length < 10) continue;
      const firstLineEnd = contentStr.indexOf("\n");
      const headerLine = firstLineEnd > 0 ? contentStr.substring(0, firstLineEnd) : contentStr;
      const semiCount = (headerLine.match(/;/g) || []).length;
      const commaCount = (headerLine.match(/,/g) || []).length;
      const tabCount = (headerLine.match(/\t/g) || []).length;
      let delimiter = ",";
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = "	";
      const allRows = parseCSVRobust2(contentStr, delimiter);
      if (allRows.length < 2) continue;
      if (isMapping) {
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(allRows.length, 5); i++) {
          const rowJoined = allRows[i].join(" ").toLowerCase();
          if (rowJoined.includes("acordao") || rowJoined.includes("acrdo") || rowJoined.includes("tce") || rowJoined.includes("sess") || rowJoined.includes("descr")) {
            headerRowIdx = i;
            break;
          }
        }
        const headers = allRows[headerRowIdx];
        const normalizedHeaders = headers.map(normalizeHeaderName2);
        let colTCE = -1;
        let colAcordao = -1;
        for (let i = 0; i < normalizedHeaders.length; i++) {
          const ch = normalizedHeaders[i];
          if (ch === "tce" || ch.includes("tce") || ch.includes("numero") || ch.includes("numeroano") || ch.includes("processo")) colTCE = i;
          if (ch.includes("acord") || ch.includes("acr") || ch.includes("desc") || ch.includes("depoiment")) colAcordao = i;
        }
        if (colTCE === -1) colTCE = normalizedHeaders.length - 1;
        if (colAcordao === -1) colAcordao = Math.min(2, normalizedHeaders.length - 1);
        const startRowIdx = headerRowIdx + 1;
        for (let i = startRowIdx; i < allRows.length; i++) {
          const fields = allRows[i];
          if (fields.length < 2) continue;
          let tceVal = fields[colTCE]?.trim();
          tceVal = fixExcelDateTce(tceVal);
          const acordaoVal = fields[colAcordao]?.trim();
          if (tceVal && acordaoVal) {
            tceVal = tceVal.replace(/\|/g, "/");
            const checkResult = await pool.query("SELECT 1 FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2", [tceVal, acordaoVal]);
            if (checkResult.rows.length === 0) {
              await pool.query("INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key) VALUES ($1, $2)", [tceVal, acordaoVal]);
              importedMap++;
            }
          }
        }
      } else {
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(allRows.length, 5); i++) {
          const rowJoined = allRows[i].join(" ").toLowerCase();
          if (rowJoined.includes("processo") || rowJoined.includes("tce") || rowJoined.includes("motivo") || rowJoined.includes("debito") || rowJoined.includes("dbito") || rowJoined.includes("instaur")) {
            headerRowIdx = i;
            break;
          }
        }
        const headers = allRows[headerRowIdx];
        const normalizedHeaders = headers.map(normalizeHeaderName2);
        const findIndexRobust = (keywords, excludes) => {
          for (const kw of keywords) {
            const cleanKw = normalizeHeaderName2(kw);
            const idx = normalizedHeaders.findIndex((ch) => {
              if (!ch.includes(cleanKw)) return false;
              if (excludes) return !excludes.some((ex) => ch.includes(normalizeHeaderName2(ex)));
              return true;
            });
            if (idx !== -1) return idx;
          }
          return -1;
        };
        const colNumeroAno = findIndexRobust(["nmeroano", "numeroano", "numero", "ano"]);
        const colPA = findIndexRobust(["processoadministrativo", "pa", "processoadm"]);
        const colMotivo = findIndexRobust(["motivodainstauracao", "motivo"]);
        const colSubmotivo = findIndexRobust(["submotivodainstauracao", "submotivo"]);
        const colDebitoOrig = findIndexRobust(["debitooriginal", "debitoorig"]);
        const colDebitoAtual = findIndexRobust(["debitoatualizado", "atualizado"]);
        const colDataAtual = findIndexRobust(["dataatualizacao", "data_atualizacao"]);
        const colPosicionamento = findIndexRobust(["ultimoposicionamento", "posicionamento"]);
        const colTC = normalizedHeaders.indexOf("tc");
        const colEstado = findIndexRobust(["estadoprocesso", "estado"]);
        const colSituacao = findIndexRobust(["situacaoprocesso", "situacao"]);
        const colJulgamento = findIndexRobust(["primeirojulgamento", "julgamento"]);
        const colEncerramento = normalizedHeaders.indexOf("encerramento");
        const startRowIdx = headerRowIdx + 1;
        for (let i = startRowIdx; i < allRows.length; i++) {
          const fields = allRows[i];
          if (fields.length < 5) continue;
          const getFieldValue = (colIdx, fallback = "") => colIdx !== -1 && colIdx < fields.length ? fields[colIdx] || fallback : fallback;
          let numeroAnoTce = getFieldValue(colNumeroAno !== -1 ? colNumeroAno : 0, `TCE ${i}`);
          numeroAnoTce = fixExcelDateTce(numeroAnoTce);
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
          const id = numeroAnoTce;
          const checkResult = await pool.query("SELECT id FROM tcu_tce WHERE id = $1 OR numero_ano_tce = $2", [id, numeroAnoTce]);
          if (checkResult.rows.length > 0) {
            const targetId = checkResult.rows[0].id;
            await pool.query(`
              UPDATE tcu_tce SET
                numero_ano_tce = $2, processo_administrativo = $3, motivo_instauracao = $4,
                submotivo_instauracao = $5, debito_original = $6, debito_atualizado = $7,
                data_atualizacao_debito = $8, ultimo_posicionamento = $9, tc = $10,
                estado_processo = $11, situacao_processo = $12, primeiro_julgamento = $13,
                encerramento = $14, ano = $15
              WHERE id = $1
            `, [
              targetId,
              numeroAnoTce,
              pa,
              motivo,
              submotivo,
              debitoOrig,
              debitoAtual,
              dataAtual,
              posicionamento,
              tc,
              estado,
              situacao,
              julgamento,
              encerramento,
              ano
            ]);
            updatedGeral++;
          } else {
            await pool.query(`
              INSERT INTO tcu_tce (
                id, numero_ano_tce, processo_administrativo, motivo_instauracao,
                submotivo_instauracao, debito_original, debito_atualizado, data_atualizacao_debito,
                ultimo_posicionamento, tc, estado_processo, situacao_processo, primeiro_julgamento,
                encerramento, ano
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            `, [
              id,
              numeroAnoTce,
              pa,
              motivo,
              submotivo,
              debitoOrig,
              debitoAtual,
              dataAtual,
              posicionamento,
              tc,
              estado,
              situacao,
              julgamento,
              encerramento,
              ano
            ]);
            importedGeral++;
          }
        }
      }
      console.log(`[SYNC-LOCAL-TCES] Conclu\xEDdo processamento de ${file}.`);
      console.timeEnd(`Processamento ${file}`);
    }
    console.log(`[SYNC-LOCAL-TCES] Sincroniza\xE7\xE3o finalizada. TCEs importadas: ${importedGeral}, Atualizadas: ${updatedGeral}. Mapeamentos inseridos: ${importedMap}.`);
    res.json({
      success: true,
      message: `Sincroniza\xE7\xE3o conclu\xEDda: ${importedGeral} TCEs novas, ${updatedGeral} atualizadas e ${importedMap} mapeamentos inseridos.`
    });
  } catch (err) {
    console.error("Erro na sincroniza\xE7\xE3o local de TCEs:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});
function cleanEncoding2(text) {
  if (!text) return "";
  let decoded = text;
  if (decoded.includes("\xC3\xA2") || decoded.includes("\xC3\xA7") || decoded.includes("\xC3\xA3") || decoded.includes("\xC3\xB3") || decoded.includes("\xC3")) {
    try {
      decoded = Buffer.from(decoded, "binary").toString("utf8");
    } catch (e) {
    }
  }
  return decoded;
}
router4.get("/tces", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tcu_tce");
    const mapped = result.rows.map((row2) => ({
      id: row2.id,
      NUMERO_ANO_TCE: cleanEncoding2(row2.numero_ano_tce),
      PROCESSO_ADMINISTRATIVO: cleanEncoding2(row2.processo_administrativo),
      MOTIVO_INSTAURACAO: cleanEncoding2(row2.motivo_instauracao),
      SUBMOTIVO_INSTAURACAO: cleanEncoding2(row2.submotivo_instauracao),
      DEBITO_ORIGINAL: cleanEncoding2(row2.debito_original),
      DEBITO_ATUALIZADO: cleanEncoding2(row2.debito_atualizado),
      DATA_ATUALIZACAO_DEBITO: cleanEncoding2(row2.data_atualizacao_debito),
      ULTIMO_POSICIONAMENTO: cleanEncoding2(row2.ultimo_posicionamento),
      TC: cleanEncoding2(row2.tc),
      ESTADO_PROCESSO: cleanEncoding2(row2.estado_processo),
      SITUACAO_PROCESSO: cleanEncoding2(row2.situacao_processo),
      PRIMEIRO_JULGAMENTO: cleanEncoding2(row2.primeiro_julgamento),
      ENCERRAMENTO: cleanEncoding2(row2.encerramento),
      NUMERO_SIAFI: cleanEncoding2(row2.numero_siafi),
      SIAFI_RESSARCIDO: cleanEncoding2(row2.siafi_ressarcido),
      ANO: row2.ano,
      ULTIMA_ATUALIZACAO: row2.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching TCEs from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch TCEs." });
  }
});
router4.post("/tces/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    const query = `
      UPDATE tcu_tce SET
        numero_ano_tce = $2, processo_administrativo = $3, motivo_instauracao = $4,
        submotivo_instauracao = $5, debito_original = $6, debito_atualizado = $7,
        data_atualizacao_debito = $8, ultimo_posicionamento = $9, tc = $10,
        estado_processo = $11, situacao_processo = $12, primeiro_julgamento = $13,
        encerramento = $14, numero_siafi = $15, siafi_ressarcido = $16, ano = $17,
        ultima_atualizacao = $18
      WHERE id = $1 RETURNING *
    `;
    const values = [
      updated.id,
      updated.NUMERO_ANO_TCE,
      updated.PROCESSO_ADMINISTRATIVO,
      updated.MOTIVO_INSTAURACAO,
      updated.SUBMOTIVO_INSTAURACAO,
      updated.DEBITO_ORIGINAL,
      updated.DEBITO_ATUALIZADO,
      updated.DATA_ATUALIZACAO_DEBITO,
      updated.ULTIMO_POSICIONAMENTO,
      updated.TC,
      updated.ESTADO_PROCESSO,
      updated.SITUACAO_PROCESSO,
      updated.PRIMEIRO_JULGAMENTO,
      updated.ENCERRAMENTO,
      updated.NUMERO_SIAFI,
      updated.SIAFI_RESSARCIDO,
      updated.ANO,
      updatedAt
    ];
    const result = await pool.query(query, values);
    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "TCE n\xE3o encontrada no Postgres." });
    }
  } catch (err) {
    console.error("Error updating TCE in Postgres:", err);
    res.status(500).json({ error: "Failed to update TCE." });
  }
});
router4.delete("/tces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM tcu_tce WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting TCE from Postgres:", err);
    res.status(500).json({ error: "Failed to delete TCE." });
  }
});
router4.post("/tces/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importa\xE7\xE3o inv\xE1lido para TCE." });
    }
    let importedCount = 0;
    let updatedCount = 0;
    const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    for (const item of items) {
      const checkResult = await pool.query("SELECT id FROM tcu_tce WHERE id = $1 OR numero_ano_tce = $2", [item.id, item.NUMERO_ANO_TCE]);
      if (checkResult.rows.length > 0) {
        const targetId = checkResult.rows[0].id;
        await pool.query(`
          UPDATE tcu_tce SET
            numero_ano_tce = $2, processo_administrativo = $3, motivo_instauracao = $4,
            submotivo_instauracao = $5, debito_original = $6, debito_atualizado = $7,
            data_atualizacao_debito = $8, ultimo_posicionamento = $9, tc = $10,
            estado_processo = $11, situacao_processo = $12, primeiro_julgamento = $13,
            encerramento = $14, numero_siafi = $15, siafi_ressarcido = $16, ano = $17,
            ultima_atualizacao = $18
          WHERE id = $1
        `, [
          targetId,
          item.NUMERO_ANO_TCE,
          item.PROCESSO_ADMINISTRATIVO,
          item.MOTIVO_INSTAURACAO,
          item.SUBMOTIVO_INSTAURACAO,
          item.DEBITO_ORIGINAL,
          item.DEBITO_ATUALIZADO,
          item.DATA_ATUALIZACAO_DEBITO,
          item.ULTIMO_POSICIONAMENTO,
          item.TC,
          item.ESTADO_PROCESSO,
          item.SITUACAO_PROCESSO,
          item.PRIMEIRO_JULGAMENTO,
          item.ENCERRAMENTO,
          item.NUMERO_SIAFI,
          item.SIAFI_RESSARCIDO,
          item.ANO,
          updatedAt
        ]);
        updatedCount++;
      } else {
        await pool.query(`
          INSERT INTO tcu_tce (
            id, numero_ano_tce, processo_administrativo, motivo_instauracao,
            submotivo_instauracao, debito_original, debito_atualizado, data_atualizacao_debito,
            ultimo_posicionamento, tc, estado_processo, situacao_processo, primeiro_julgamento,
            encerramento, numero_siafi, siafi_ressarcido, ano
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          )
        `, [
          item.id,
          item.NUMERO_ANO_TCE,
          item.PROCESSO_ADMINISTRATIVO,
          item.MOTIVO_INSTAURACAO,
          item.SUBMOTIVO_INSTAURACAO,
          item.DEBITO_ORIGINAL,
          item.DEBITO_ATUALIZADO,
          item.DATA_ATUALIZACAO_DEBITO,
          item.ULTIMO_POSICIONAMENTO,
          item.TC,
          item.ESTADO_PROCESSO,
          item.SITUACAO_PROCESSO,
          item.PRIMEIRO_JULGAMENTO,
          item.ENCERRAMENTO,
          item.NUMERO_SIAFI,
          item.SIAFI_RESSARCIDO,
          item.ANO
        ]);
        importedCount++;
      }
    }
    const totalResult = await pool.query("SELECT COUNT(*) FROM tcu_tce");
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: []
      // Avoid sending back entire DB on import to save bandwidth
    });
  } catch (err) {
    console.error("Error importing TCEs in Postgres:", err);
    res.status(500).json({ error: "Failed to import TCEs." });
  }
});
router4.get("/tce-mappings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tcu_tce_acordao_mapping");
    const mapped = result.rows.map((row2) => ({
      NUMERO_ANO_TCE: row2.numero_ano_tce,
      ACORDAO_KEY: row2.acordao_key
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching TCE mappings:", err);
    res.status(500).json({ error: "Failed to fetch TCE mappings." });
  }
});
router4.post("/tce-mappings/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de mapeamento inv\xE1lido." });
    }
    let importedCount = 0;
    let updatedCount = 0;
    for (const item of items) {
      const checkResult = await pool.query(
        "SELECT 1 FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2",
        [item.NUMERO_ANO_TCE, item.ACORDAO_KEY]
      );
      if (checkResult.rows.length === 0) {
        await pool.query(
          "INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key) VALUES ($1, $2)",
          [item.NUMERO_ANO_TCE, item.ACORDAO_KEY]
        );
        importedCount++;
      }
    }
    const totalResult = await pool.query("SELECT COUNT(*) FROM tcu_tce_acordao_mapping");
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: []
    });
  } catch (err) {
    console.error("Error importing TCE mappings:", err);
    res.status(500).json({ error: "Failed to import TCE mappings." });
  }
});
router4.post("/tce-mappings/add", async (req, res) => {
  try {
    const { NUMERO_ANO_TCE, ACORDAO_KEY } = req.body;
    const checkResult = await pool.query(
      "SELECT 1 FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2",
      [NUMERO_ANO_TCE, ACORDAO_KEY]
    );
    if (checkResult.rows.length === 0) {
      await pool.query(
        "INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key) VALUES ($1, $2)",
        [NUMERO_ANO_TCE, ACORDAO_KEY]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error adding TCE mapping:", err);
    res.status(500).json({ error: "Failed to add TCE mapping." });
  }
});
router4.post("/tce-mappings/delete", async (req, res) => {
  try {
    const { NUMERO_ANO_TCE, ACORDAO_KEY } = req.body;
    await pool.query(
      "DELETE FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2",
      [NUMERO_ANO_TCE, ACORDAO_KEY]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting TCE mapping:", err);
    res.status(500).json({ error: "Failed to delete TCE mapping." });
  }
});
var tceRoutes_default = router4;

// src/backend/routes/eticaRoutes.ts
var import_express5 = __toESM(require("express"), 1);
init_db();
var router5 = import_express5.default.Router();
router5.get("/comissao-etica", (req, res) => res.json([]));
router5.get("/etica/membros", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM etica_membros");
    res.json(result.rows.map((r) => ({
      ...r,
      dataInicioMandato: r.mandato_inicio,
      dataFimMandato: r.mandato_fim,
      atribuicao: r.cargo
    })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.post("/etica/membros", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_membros (id, nome, cpf, email, cargo, mandato_inicio, mandato_fim, status, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [b.id, b.nome, b.cpf, b.email, b.atribuicao, b.dataInicioMandato, b.dataFimMandato, b.status, b.ativo]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.put("/etica/membros/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_membros SET nome=$1, cpf=$2, email=$3, cargo=$4, mandato_inicio=$5, mandato_fim=$6, status=$7, ativo=$8 WHERE id=$9",
      [b.nome, b.cpf, b.email, b.atribuicao, b.dataInicioMandato, b.dataFimMandato, b.status, b.ativo, req.params.id]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.delete("/etica/membros/:id", async (req, res) => {
  try {
    await pool.query("UPDATE etica_membros SET ativo = false WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.get("/etica/reunioes", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM etica_reunioes");
    res.json(result.rows.map((r) => ({
      ...r,
      confirmacoes: r.confirmacoes || {},
      dataHora: r.data_hora,
      notificadoAgendamento: r.notificado_agendamento,
      notificadoLembrete: r.notificado_lembrete
    })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.post("/etica/reunioes", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_reunioes (id, tipo, data_hora, pauta, confirmacoes, notificado_agendamento, notificado_lembrete, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [b.id, b.tipo, b.dataHora, b.pauta, JSON.stringify(b.confirmacoes), b.notificadoAgendamento, b.notificadoLembrete, (/* @__PURE__ */ new Date()).toISOString()]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.put("/etica/reunioes/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_reunioes SET tipo=$1, data_hora=$2, pauta=$3, confirmacoes=$4, notificado_agendamento=$5, notificado_lembrete=$6, ultima_atualizacao=$7 WHERE id=$8",
      [b.tipo, b.dataHora, b.pauta, JSON.stringify(b.confirmacoes), b.notificadoAgendamento, b.notificadoLembrete, (/* @__PURE__ */ new Date()).toISOString(), req.params.id]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.delete("/etica/reunioes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_reunioes WHERE id = $1", [req.params.id]);
    await pool.query("DELETE FROM etica_atas WHERE reuniao_id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.get("/etica/atas", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM etica_atas");
    res.json(result.rows.map((r) => ({ ...r, reuniaoId: r.reuniao_id, dataGeracao: r.data_geracao })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.post("/etica/atas", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_atas (id, reuniao_id, relatos, decisoes, data_geracao, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET relatos=$3, decisoes=$4, ultima_atualizacao=$6",
      [b.id, b.reuniaoId, b.relatos, b.decisoes, b.dataGeracao, (/* @__PURE__ */ new Date()).toISOString()]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.get("/etica/processos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM etica_processos");
    res.json(result.rows.map((r) => ({ ...r, processoSei: r.processo_sei, dataInicio: r.data_inicio, dataFim: r.data_fim })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.post("/etica/processos", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_processos (id, tipo, processo_sei, data_inicio, data_fim, resumo, responsavel, situacao, solicitante, assunto, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [b.id, b.tipo, b.processoSei, b.dataInicio, b.dataFim, b.resumo, b.responsavel, b.situacao, b.solicitante, b.assunto, (/* @__PURE__ */ new Date()).toISOString()]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.put("/etica/processos/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_processos SET tipo=$1, processo_sei=$2, data_inicio=$3, data_fim=$4, resumo=$5, responsavel=$6, situacao=$7, solicitante=$8, assunto=$9, ultima_atualizacao=$10 WHERE id=$11",
      [b.tipo, b.processoSei, b.dataInicio, b.dataFim, b.resumo, b.responsavel, b.situacao, b.solicitante, b.assunto, (/* @__PURE__ */ new Date()).toISOString(), req.params.id]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router5.delete("/etica/processos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_processos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
var eticaRoutes_default = router5;

// src/backend/routes/scdpRoutes.ts
var import_express6 = __toESM(require("express"), 1);
init_db();
var router6 = import_express6.default.Router();
router6.get("/scdp/viagens", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM scdp_viagens");
    const mapped = result.rows.map((r) => ({
      id: r.id,
      nomeViajante: r.nome_viajante,
      cpfViajante: r.cpf_viajante,
      siapeViajante: r.siape_viajante,
      emailViajante: r.email_viajante,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      destino: r.destino,
      motivoViagem: r.motivo_viagem,
      valorPassagem: parseFloat(r.valor_passagem) || 0,
      valorDiarias: parseFloat(r.valor_diarias) || 0,
      siafiGruDevolucaoConfirmada: r.siafi_gru_devolucao_confirmada,
      siafiDetalhesStatus: r.siafi_detalhes_status,
      siafiConfirmado: r.siafi_confirmado,
      siafiScdpDivergencia: r.siafi_scdp_divergencia,
      ultimaAtualizacao: r.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching SCDP trips:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router6.post("/scdp/viagens/:id/confirm-gru", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE scdp_viagens SET siafi_gru_devolucao_confirmada = true, siafi_detalhes_status = $1, siafi_confirmado = true WHERE id = $2 RETURNING *",
      ["Conciliado (Com Devolu\xE7\xE3o GRU)", id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Viagem n\xE3o encontrada no Postgres." });
    }
    const r = result.rows[0];
    const mapped = {
      id: r.id,
      nomeViajante: r.nome_viajante,
      cpfViajante: r.cpf_viajante,
      siapeViajante: r.siape_viajante,
      emailViajante: r.email_viajante,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      destino: r.destino,
      motivoViagem: r.motivo_viagem,
      valorPassagem: parseFloat(r.valor_passagem) || 0,
      valorDiarias: parseFloat(r.valor_diarias) || 0,
      siafiGruDevolucaoConfirmada: r.siafi_gru_devolucao_confirmada,
      siafiDetalhesStatus: r.siafi_detalhes_status,
      siafiConfirmado: r.siafi_confirmado,
      siafiScdpDivergencia: r.siafi_scdp_divergencia,
      ultimaAtualizacao: r.ultima_atualizacao
    };
    return res.json({ success: true, item: mapped });
  } catch (error) {
    console.error("Error confirming GRU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router6.post("/scdp/import-local-files", async (req, res) => {
  try {
    const { iniciarImportacao: iniciarImportacao2, atualizarStatusImportacao: atualizarStatusImportacao2, registrarErroImportacao: registrarErroImportacao2 } = await Promise.resolve().then(() => (init_importControl(), importControl_exports));
    const { items } = req.body ?? {};
    const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const usuarioId = req.session?.user?.id ?? "SISTEMA";
    const importControlId = await iniciarImportacao2({
      modulo: "SCDP_VIAGENS",
      ano_referencia: (/* @__PURE__ */ new Date()).getFullYear(),
      tipo_arquivo: "JSON_UPLOAD",
      forcado_por_usuario: usuarioId
    });
    if (!items || !Array.isArray(items) || items.length === 0) {
      await atualizarStatusImportacao2({
        id: importControlId,
        status: "CONCLUIDO",
        quantidade_inseridos: 0,
        observacoes: "Nenhum item recebido. Retornando dados existentes."
      });
      const result = await pool.query(
        "SELECT * FROM scdp_viagens ORDER BY data_inicio DESC"
      );
      return res.json({
        success: true,
        recordsUpdated: 0,
        message: "Nenhum dado novo para importar.",
        data: result.rows
      });
    }
    await atualizarStatusImportacao2({
      id: importControlId,
      status: "PROCESSANDO",
      quantidade_linhas_csv: items.length
    });
    let recordsUpdated = 0;
    let erros = 0;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of items) {
        try {
          await client.query(
            `INSERT INTO scdp_viagens (
               id, nome_viajante, cpf_viajante, siape_viajante, email_viajante,
               data_inicio, data_fim, destino, motivo_viagem,
               valor_passagem, valor_diarias,
               siafi_gru_devolucao_confirmada, siafi_detalhes_status,
               siafi_confirmado, siafi_scdp_divergencia, ultima_atualizacao
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             ON CONFLICT (id) DO UPDATE SET
               nome_viajante               = EXCLUDED.nome_viajante,
               data_inicio                 = EXCLUDED.data_inicio,
               data_fim                    = EXCLUDED.data_fim,
               destino                     = EXCLUDED.destino,
               motivo_viagem               = EXCLUDED.motivo_viagem,
               valor_passagem              = EXCLUDED.valor_passagem,
               valor_diarias               = EXCLUDED.valor_diarias,
               siafi_scdp_divergencia      = EXCLUDED.siafi_scdp_divergencia,
               ultima_atualizacao          = EXCLUDED.ultima_atualizacao`,
            [
              item.id,
              item.nomeViajante ?? null,
              item.cpfViajante ?? null,
              item.siapeViajante ?? null,
              item.emailViajante ?? null,
              item.dataInicio ?? null,
              item.dataFim ?? null,
              item.destino ?? null,
              item.motivoViagem ?? null,
              item.valorPassagem ?? 0,
              item.valorDiarias ?? 0,
              item.siafiGruDevolucaoConfirmada ?? false,
              item.siafiDetalhesStatus ?? null,
              item.siafiConfirmado ?? false,
              item.siafiScdpDivergencia ?? false,
              updatedAt
            ]
          );
          recordsUpdated++;
        } catch (errItem) {
          console.error(`[SCDP-IMPORT] Erro no item ${item.id}:`, errItem.message);
          erros++;
        }
      }
      await client.query("COMMIT");
    } catch (errTx) {
      await client.query("ROLLBACK");
      throw errTx;
    } finally {
      client.release();
    }
    await atualizarStatusImportacao2({
      id: importControlId,
      status: erros > 0 && recordsUpdated === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
      quantidade_inseridos: recordsUpdated,
      quantidade_erros: erros,
      observacoes: `Importa\xE7\xE3o manual pelo usu\xE1rio ${usuarioId}.`
    });
    return res.json({
      success: true,
      recordsUpdated,
      message: `${recordsUpdated} viagem(ns) importada(s) com sucesso.`
    });
  } catch (err) {
    console.error("[SCDP-IMPORT] Erro fatal:", err);
    return res.status(500).json({ error: "Erro interno ao importar viagens SCDP." });
  }
});
router6.get("/scdp/import-status", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tcu_import_control
       WHERE modulo = 'SCDP_VIAGENS'
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
var scdpRoutes_default = router6;

// src/backend/routes/cguRoutes.ts
var import_express7 = __toESM(require("express"), 1);
init_db();
var import_fs9 = __toESM(require("fs"), 1);
var import_path8 = __toESM(require("path"), 1);
var XLSX = __toESM(require("xlsx"), 1);
init_importControl();

// src/backend/utils/cguPdfService.ts
var import_node_fetch = __toESM(require("node-fetch"), 1);
var import_module = require("module");
var import_fs8 = __toESM(require("fs"), 1);
var import_path7 = __toESM(require("path"), 1);
var import_meta = {};
var require2 = (0, import_module.createRequire)(import_meta.url);
var pdfParse = require2("pdf-parse");
async function getCguPdfText(reportId) {
  const url = `https://eaud.cgu.gov.br/relatorios/download/${reportId}`;
  console.log(`[CGU PDF Service] Baixando PDF de: ${url}`);
  try {
    const response = await (0, import_node_fetch.default)(url);
    if (!response.ok) {
      throw new Error(`Falha no download. Status: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cacheDir = import_path7.default.resolve(process.cwd(), "data", "cgu", "pdfs");
    if (!import_fs8.default.existsSync(cacheDir)) {
      import_fs8.default.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = import_path7.default.join(cacheDir, `${reportId}.pdf`);
    import_fs8.default.writeFileSync(cachePath, buffer);
    console.log(`[CGU PDF Service] Extraindo texto do PDF (${buffer.length} bytes)...`);
    const pdfData = await pdfParse(buffer);
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error("O PDF extra\xEDdo parece estar vazio ou ser uma imagem (scaneado).");
    }
    return pdfData.text;
  } catch (error) {
    console.error(`[CGU PDF Service] Erro ao obter texto do relat\xF3rio ${reportId}:`, error.message);
    throw error;
  }
}

// src/backend/routes/cguRoutes.ts
var router7 = import_express7.default.Router();
var MODULO_CGU = "CGU_DEMANDAS";
var MODULO_CGU_REPORTS = "CGU_REPORTS";
var parseCSVRobust = (csvText, delimiter) => {
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        const isEndOfField = nextChar === delimiter || nextChar === "\r" || nextChar === "\n" || nextChar === void 0;
        if (isEndOfField) inQuotes = false;
        else currentField += '"';
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }
  if (currentRow.length > 0 || currentField !== "") {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
};
var normalizeHeaderName = (str) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
};
var parseFileContents = (filePath) => {
  const ext = import_path8.default.extname(filePath).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls") {
    const buffer = import_fs9.default.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    return rawData.map((row2) => row2.map((cell) => cell != null ? String(cell).trim() : ""));
  } else if (ext === ".csv") {
    let contentStr = import_fs9.default.readFileSync(filePath, "latin1");
    if (!contentStr || contentStr.trim().length < 10) return [];
    const firstLineEnd = contentStr.indexOf("\n");
    const headerLine = firstLineEnd > 0 ? contentStr.substring(0, firstLineEnd) : contentStr;
    let delimiter = ";";
    if ((headerLine.match(/,/g) || []).length > (headerLine.match(/;/g) || []).length) {
      delimiter = ",";
    }
    return parseCSVRobust(contentStr, delimiter);
  }
  return [];
};
router7.get("/cgu/files/last-updates", (req, res) => {
  const getMostRecentDate = (dirPath) => {
    try {
      if (!import_fs9.default.existsSync(dirPath)) return null;
      const files = import_fs9.default.readdirSync(dirPath).filter((f) => {
        const ext = f.toLowerCase();
        return ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls");
      });
      if (files.length === 0) return null;
      let maxTime = 0;
      for (const file of files) {
        const stat = import_fs9.default.statSync(import_path8.default.join(dirPath, file));
        if (stat.mtimeMs > maxTime) maxTime = stat.mtimeMs;
      }
      return maxTime > 0 ? new Date(maxTime).toLocaleString("pt-BR") : null;
    } catch {
      return null;
    }
  };
  const mon = getMostRecentDate(import_path8.default.join(process.cwd(), "data", "cgu", "monitoramentos"));
  const rel = getMostRecentDate(import_path8.default.join(process.cwd(), "data", "cgu", "relatorios"));
  res.json({
    success: true,
    data: {
      monitoramentos: mon,
      relatorios: rel
    }
  });
});
router7.patch("/cgu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { processoSei } = req.body;
    await pool.query(
      "UPDATE cgu_demands SET processo_sei = $1, ultima_atualizacao = $2 WHERE id_tarefa = $3",
      [processoSei, (/* @__PURE__ */ new Date()).toISOString(), id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar processo SEI da demanda CGU:", error);
    res.status(500).json({ error: "Erro interno ao atualizar processo SEI." });
  }
});
router7.get("/cgu", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cgu_demands ORDER BY ano DESC, id_tarefa DESC");
    const mapped = result.rows.map((row2) => ({
      idTarefa: row2.id_tarefa,
      situacao: row2.situacao,
      estado: row2.estado,
      tituloTarefa: row2.titulo_tarefa,
      dataInicio: row2.data_inicio,
      dataFim: row2.data_fim,
      dataLimite: row2.data_limite,
      unidadeAuditada: row2.unidade_auditada,
      unidadesAuditoria: row2.unidades_auditoria,
      textoMonitoramento: row2.texto_monitoramento,
      providencia: row2.providencia,
      tipoUltimaManifestacao: row2.tipo_ultima_manifestacao,
      textoUltimaManifestacao: row2.texto_ultima_manifestacao,
      dataUltimaManifestacao: row2.data_ultima_manifestacao,
      tipoUltimoPosicionamento: row2.tipo_ultimo_posicionamento,
      textoUltimoPosicionamento: row2.texto_ultimo_posicionamento,
      dataUltimoPosicionamento: row2.data_ultimo_posicionamento,
      categoria: row2.categoria,
      dataLimiteInicial: row2.data_limite_inicial,
      ano: row2.ano,
      ultimaAtualizacao: row2.ultima_atualizacao,
      processoSei: row2.processo_sei
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Erro ao buscar demandas CGU:", error);
    res.status(500).json({ error: "Erro interno ao buscar demandas CGU." });
  }
});
router7.post("/cgu/sync-local/monitoramentos", async (req, res) => {
  const MON_DIR = import_path8.default.join(process.cwd(), "data", "cgu", "monitoramentos");
  if (!import_fs9.default.existsSync(MON_DIR)) {
    return res.status(404).json({ error: `Diret\xF3rio n\xE3o encontrado: ${MON_DIR}` });
  }
  const validFiles = import_fs9.default.readdirSync(MON_DIR).filter((f) => {
    const ext = f.toLowerCase();
    return ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls");
  });
  if (validFiles.length === 0) {
    return res.status(404).json({ error: "Nenhum arquivo CSV ou XLSX encontrado em data/cgu/monitoramentos." });
  }
  const usuarioId = req.session?.user?.id ?? "SISTEMA";
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  let importControlId = null;
  let totalProcessado = 0;
  let erros = 0;
  let inseridos = 0;
  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_CGU,
      ano_referencia: (/* @__PURE__ */ new Date()).getFullYear(),
      tipo_arquivo: "CSV_LOCAL",
      forcado_por_usuario: usuarioId
    });
    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });
    for (const file of validFiles) {
      const filePath = import_path8.default.join(MON_DIR, file);
      const allRows = parseFileContents(filePath);
      if (allRows.length < 2) continue;
      const headers = allRows[0].map((h) => normalizeHeaderName(h || ""));
      const getIndex = (names) => {
        for (const n of names) {
          const i = headers.findIndex((h) => h.includes(n));
          if (i !== -1) return i;
        }
        return -1;
      };
      const idxIdTarefa = getIndex(["idtarefa", "tarefa", "id"]);
      const idxSituacao = getIndex(["situacao"]);
      const idxEstado = getIndex(["estado"]);
      const idxTitulo = getIndex(["titulo"]);
      const idxInicio = getIndex(["datainicio", "inicio"]);
      const idxFim = getIndex(["datafim", "fim"]);
      const idxLimite = getIndex(["datalimite", "limite"]);
      const idxUnidadeAuditada = getIndex(["unidadeauditada", "auditada"]);
      const idxUnidadesAuditoria = getIndex(["unidadesauditoria", "auditoria"]);
      const idxTextoMon = getIndex(["textomonitoramento", "monitoramento"]);
      const idxProv = getIndex(["providencia"]);
      const idxCat = getIndex(["categoria"]);
      const idxAno = getIndex(["ano"]);
      const idxTipoManif = getIndex(["tipoultimamanifestacao", "tipodaultimamanifestacao", "tipomanifestacao"]);
      const idxTextoManif = getIndex(["textoultimamanifestacao", "textodaultimamanifestacao", "textomanifestacao"]);
      const idxDataManif = getIndex(["dataultimamanifestacao", "datadaultimamanifestacao", "datamanifestacao"]);
      const idxTipoPos = getIndex(["tipoultimoposicionamento", "tipodoultimoposicionamento", "tipoposicionamento"]);
      const idxTextoPos = getIndex(["textoultimoposicionamento", "textodoultimoposicionamento", "textoposicionamento"]);
      const idxDataPos = getIndex(["dataultimoposicionamento", "datadoultimoposicionamento", "dataposicionamento"]);
      const idxLimiteIni = getIndex(["datalimiteinicial", "limiteinicial"]);
      if (idxIdTarefa === -1) {
        console.warn("Arquivo sem ID de Tarefa ignorado:", file);
        continue;
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (let i = 1; i < allRows.length; i++) {
          const row2 = allRows[i];
          if (!row2 || row2.length < headers.length * 0.5) continue;
          const id = row2[idxIdTarefa]?.trim();
          if (!id) continue;
          totalProcessado++;
          const situacao = idxSituacao !== -1 ? row2[idxSituacao]?.trim() : null;
          const estado = idxEstado !== -1 ? row2[idxEstado]?.trim() : null;
          const titulo = idxTitulo !== -1 ? row2[idxTitulo]?.trim() : null;
          const dtInicio = idxInicio !== -1 ? row2[idxInicio]?.trim() : null;
          const dtFim = idxFim !== -1 ? row2[idxFim]?.trim() : null;
          const dtLimite = idxLimite !== -1 ? row2[idxLimite]?.trim() : null;
          const uniAuditada = idxUnidadeAuditada !== -1 ? row2[idxUnidadeAuditada]?.trim() : null;
          const unisAuditoria = idxUnidadesAuditoria !== -1 ? row2[idxUnidadesAuditoria]?.trim() : null;
          const txtMon = idxTextoMon !== -1 ? row2[idxTextoMon]?.trim() : null;
          const prov = idxProv !== -1 ? row2[idxProv]?.trim() : null;
          const cat = idxCat !== -1 ? row2[idxCat]?.trim() : null;
          const anoStr = idxAno !== -1 ? row2[idxAno]?.trim() : null;
          const anoVal = anoStr ? parseInt(anoStr.match(/\d{4}/)?.[0] || "0") : null;
          const tipoManif = idxTipoManif !== -1 ? row2[idxTipoManif]?.trim() : null;
          const txtManif = idxTextoManif !== -1 ? row2[idxTextoManif]?.trim() : null;
          const dtManif = idxDataManif !== -1 ? row2[idxDataManif]?.trim() : null;
          const tipoPos = idxTipoPos !== -1 ? row2[idxTipoPos]?.trim() : null;
          const txtPos = idxTextoPos !== -1 ? row2[idxTextoPos]?.trim() : null;
          const dtPos = idxDataPos !== -1 ? row2[idxDataPos]?.trim() : null;
          const dtLimiteIni = idxLimiteIni !== -1 ? row2[idxLimiteIni]?.trim() : null;
          try {
            await client.query("SAVEPOINT import_row");
            await client.query(`
              INSERT INTO cgu_demands (
                id_tarefa, situacao, estado, titulo_tarefa,
                data_inicio, data_fim, data_limite, unidade_auditada,
                unidades_auditoria, texto_monitoramento, providencia,
                categoria, ano, ultima_atualizacao,
                tipo_ultima_manifestacao, texto_ultima_manifestacao, data_ultima_manifestacao,
                tipo_ultimo_posicionamento, texto_ultimo_posicionamento, data_ultimo_posicionamento,
                data_limite_inicial
              ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
                $15,$16,$17,$18,$19,$20,$21
              )
              ON CONFLICT (id_tarefa) DO UPDATE SET
                situacao = EXCLUDED.situacao,
                estado = EXCLUDED.estado,
                titulo_tarefa = EXCLUDED.titulo_tarefa,
                data_inicio = EXCLUDED.data_inicio,
                data_fim = EXCLUDED.data_fim,
                data_limite = EXCLUDED.data_limite,
                unidade_auditada = EXCLUDED.unidade_auditada,
                unidades_auditoria = EXCLUDED.unidades_auditoria,
                texto_monitoramento = EXCLUDED.texto_monitoramento,
                providencia = EXCLUDED.providencia,
                categoria = EXCLUDED.categoria,
                ano = EXCLUDED.ano,
                ultima_atualizacao = EXCLUDED.ultima_atualizacao,
                tipo_ultima_manifestacao = EXCLUDED.tipo_ultima_manifestacao,
                texto_ultima_manifestacao = EXCLUDED.texto_ultima_manifestacao,
                data_ultima_manifestacao = EXCLUDED.data_ultima_manifestacao,
                tipo_ultimo_posicionamento = EXCLUDED.tipo_ultimo_posicionamento,
                texto_ultimo_posicionamento = EXCLUDED.texto_ultimo_posicionamento,
                data_ultimo_posicionamento = EXCLUDED.data_ultimo_posicionamento,
                data_limite_inicial = EXCLUDED.data_limite_inicial
            `, [id, situacao, estado, titulo, dtInicio, dtFim, dtLimite, uniAuditada, unisAuditoria, txtMon, prov, cat, anoVal, updatedAt, tipoManif, txtManif, dtManif, tipoPos, txtPos, dtPos, dtLimiteIni]);
            await client.query("RELEASE SAVEPOINT import_row");
            inseridos++;
          } catch (e) {
            await client.query("ROLLBACK TO SAVEPOINT import_row");
            console.error("CGU Sync Error row:", id, "error:", e.message);
            erros++;
          }
        }
        await client.query("COMMIT");
      } catch (errTx) {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    }
    await atualizarStatusImportacao({
      id: importControlId,
      status: erros > 0 && inseridos === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
      quantidade_inseridos: inseridos,
      quantidade_erros: erros
    });
    res.json({ success: true, importedCount: inseridos, erros });
  } catch (err) {
    if (importControlId) await registrarErroImportacao(importControlId, err);
    console.error("Erro no processamento de monitoramentos CGU", err);
    res.status(500).json({ error: "Erro interno ao importar monitoramentos CGU. Detalhes: " + String(err) + " - " + String(err?.stack) });
  }
});
router7.get("/cgu/reports", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cgu_reports ORDER BY ano DESC, data_publicacao DESC");
    const mapped = result.rows.map((row2) => ({
      idTarefa: row2.id_tarefa,
      idAuditoria: row2.id_auditoria,
      tituloAuditoria: row2.titulo_auditoria,
      ano: row2.ano,
      unidadeAuditada: row2.unidade_auditada,
      categoria: row2.categoria,
      link: row2.link,
      dataPublicacao: row2.data_publicacao,
      ultimaAtualizacao: row2.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar relat\xF3rios da CGU." });
  }
});
router7.post("/cgu/sync-local/relatorios", async (req, res) => {
  const REL_DIR = import_path8.default.join(process.cwd(), "data", "cgu", "relatorios");
  if (!import_fs9.default.existsSync(REL_DIR)) {
    return res.status(404).json({ error: `Diret\xF3rio n\xE3o encontrado: ${REL_DIR}` });
  }
  const validFiles = import_fs9.default.readdirSync(REL_DIR).filter((f) => {
    const ext = f.toLowerCase();
    return ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls");
  });
  if (validFiles.length === 0) {
    return res.status(404).json({ error: "Nenhum arquivo CSV ou XLSX encontrado em data/cgu/relatorios." });
  }
  const usuarioId = req.session?.user?.id ?? "SISTEMA";
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  let importControlId = null;
  let totalProcessado = 0;
  let erros = 0;
  let inseridos = 0;
  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_CGU_REPORTS,
      ano_referencia: (/* @__PURE__ */ new Date()).getFullYear(),
      tipo_arquivo: "CSV_LOCAL",
      forcado_por_usuario: usuarioId
    });
    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });
    for (const file of validFiles) {
      const filePath = import_path8.default.join(REL_DIR, file);
      const allRows = parseFileContents(filePath);
      if (allRows.length < 2) continue;
      const headers = allRows[0].map((h) => normalizeHeaderName(h || ""));
      const getIndex = (names) => {
        for (const n of names) {
          const i = headers.findIndex((h) => h.includes(n));
          if (i !== -1) return i;
        }
        return -1;
      };
      const idxIdTarefa = getIndex(["idtarefa", "tarefa", "id"]);
      const idxIdAuditoria = getIndex(["idauditoria", "auditoria"]);
      const idxTitulo = getIndex(["titulo", "auditoria"]);
      const idxAno = getIndex(["ano"]);
      const idxUni = getIndex(["unidadeauditada", "auditada"]);
      const idxCat = getIndex(["categoria"]);
      const idxLink = getIndex(["link", "url"]);
      const idxDataPub = getIndex(["datapublicacao", "publicacao"]);
      if (idxIdTarefa === -1 && idxIdAuditoria === -1) {
        continue;
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        for (let i = 1; i < allRows.length; i++) {
          const row2 = allRows[i];
          if (!row2 || row2.length < headers.length * 0.5) continue;
          const id = (idxIdTarefa !== -1 ? row2[idxIdTarefa]?.trim() : null) || (idxIdAuditoria !== -1 ? row2[idxIdAuditoria]?.trim() : `REL-${Date.now()}-${i}`);
          if (!id) continue;
          totalProcessado++;
          const idAud = idxIdAuditoria !== -1 ? row2[idxIdAuditoria]?.trim() : null;
          const tit = idxTitulo !== -1 ? row2[idxTitulo]?.trim() : null;
          const anoStr = idxAno !== -1 ? row2[idxAno]?.trim() : null;
          const anoVal = anoStr ? parseInt(anoStr.match(/\d{4}/)?.[0] || "0") : null;
          const uni = idxUni !== -1 ? row2[idxUni]?.trim() : null;
          const cat = idxCat !== -1 ? row2[idxCat]?.trim() : null;
          const lnk = idxLink !== -1 ? row2[idxLink]?.trim() : null;
          const dtPub = idxDataPub !== -1 ? row2[idxDataPub]?.trim() : null;
          try {
            await client.query("SAVEPOINT import_row_rel");
            await client.query(`
              INSERT INTO cgu_reports (
                id_tarefa, id_auditoria, titulo_auditoria, ano,
                unidade_auditada, categoria, link, data_publicacao, ultima_atualizacao
              ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9
              )
              ON CONFLICT (id_tarefa) DO UPDATE SET
                id_auditoria = EXCLUDED.id_auditoria,
                titulo_auditoria = EXCLUDED.titulo_auditoria,
                ano = EXCLUDED.ano,
                unidade_auditada = EXCLUDED.unidade_auditada,
                categoria = EXCLUDED.categoria,
                link = EXCLUDED.link,
                data_publicacao = EXCLUDED.data_publicacao,
                ultima_atualizacao = EXCLUDED.ultima_atualizacao
            `, [id, idAud, tit, anoVal, uni, cat, lnk, dtPub, updatedAt]);
            await client.query("RELEASE SAVEPOINT import_row_rel");
            inseridos++;
          } catch (e) {
            await client.query("ROLLBACK TO SAVEPOINT import_row_rel");
            console.error("CGU Sync Report Error row:", id, "error:", e.message);
            erros++;
          }
        }
        await client.query("COMMIT");
      } catch (errTx) {
        await client.query("ROLLBACK");
      } finally {
        client.release();
      }
    }
    await atualizarStatusImportacao({
      id: importControlId,
      status: erros > 0 && inseridos === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
      quantidade_inseridos: inseridos,
      quantidade_erros: erros
    });
    res.json({ success: true, importedCount: inseridos, erros });
  } catch (err) {
    if (importControlId) await registrarErroImportacao(importControlId, err);
    console.error("Erro no processamento de relat\xF3rios CGU", err);
    res.status(500).json({ error: "Erro interno ao importar relat\xF3rios CGU. Detalhes: " + String(err) + " - " + String(err?.stack) });
  }
});
router7.post("/cgu/update", async (req, res) => {
  try {
    const { idTarefa, processoSei } = req.body;
    if (idTarefa) {
      await pool.query(
        "UPDATE cgu_demands SET processo_sei = $1, ultima_atualizacao = $2 WHERE id_tarefa = $3",
        [processoSei, (/* @__PURE__ */ new Date()).toISOString(), idTarefa]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro no update CGU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router7.delete("/cgu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM cgu_demands WHERE id_tarefa = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});
router7.post("/cgu/auditorias/:id/dossie", async (req, res) => {
  const { id } = req.params;
  try {
    const auditRes = await pool.query("SELECT * FROM cgu_auditorias WHERE id_auditoria = $1 LIMIT 1", [id]);
    if (auditRes.rowCount === 0) {
      return res.status(404).json({ error: "Auditoria n\xE3o encontrada." });
    }
    const auditoria = auditRes.rows[0];
    if (auditoria.dossie_ia) {
      return res.json({ success: true, dossie: JSON.parse(auditoria.dossie_ia) });
    }
    const pdfText = await getCguPdfText(auditoria.id_tarefa);
    const dossie = await extractCguDossieWithGemini(pdfText);
    await pool.query("UPDATE cgu_auditorias SET dossie_ia = $1 WHERE id_auditoria = $2", [JSON.stringify(dossie), id]);
    res.json({ success: true, dossie });
  } catch (error) {
    console.error(`Erro ao gerar dossi\xEA para auditoria ${id}:`, error);
    res.status(500).json({ error: "Erro ao processar PDF com a IA.", details: error.message });
  }
});
var cguRoutes_default = router7;

// src/backend/routes/cguAuditoriasRoutes.ts
var import_express8 = __toESM(require("express"), 1);
var import_node_fetch3 = __toESM(require("node-fetch"), 1);
init_db();

// src/backend/utils/importCguAuditorias.ts
var import_node_fetch2 = __toESM(require("node-fetch"), 1);
init_db();
init_importControl();
var CGU_API_BASE = "https://eaud.cgu.gov.br/api/relatorios/pesquisa";
var MODULO_AUDITORIAS = "CGU_AUDITORIAS_PUB";
var parseDataPub = (dStr) => {
  if (!dStr) return null;
  const parts = dStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;
  }
  return null;
};
var runImportCguAuditorias = async (usuarioId = "SISTEMA") => {
  console.log("[CGU] Iniciando sincroniza\xE7\xE3o via API do e-Aud...");
  const hoje = /* @__PURE__ */ new Date();
  const dataFim = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
  const queryParams = new URLSearchParams({
    colunaOrdenacao: "dataPublicacao",
    direcaoOrdenacao: "DESC",
    tamanhoPagina: "1000",
    offset: "0",
    dataPublicacaoInicio: "01/01/2022",
    dataPublicacaoFim: dataFim,
    idsUnidadesOrgao: "868"
  });
  const url = `${CGU_API_BASE}?${queryParams.toString()}`;
  let importControlId = null;
  let t0 = performance.now();
  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_AUDITORIAS,
      ano_referencia: hoje.getFullYear(),
      tipo_arquivo: "API_JSON",
      url_fonte: url,
      nome_arquivo: "eaud_api.json",
      forcado_por_usuario: usuarioId
    });
    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });
    console.log(`[CGU] Buscando relat\xF3rios na API: ${url}`);
    const res = await (0, import_node_fetch2.default)(url);
    if (!res.ok) {
      throw new Error(`Falha na API da CGU. Status: ${res.status}`);
    }
    const data = await res.json();
    const relatorios = data.data || [];
    console.log(`[CGU] Recebidos ${relatorios.length} relat\xF3rios da API.`);
    const client = await pool.connect();
    let lidos = relatorios.length;
    let inseridos = 0;
    let atualizados = 0;
    let errosCount = 0;
    let ignorados = 0;
    try {
      await client.query("BEGIN");
      for (const item of relatorios) {
        const idTarefa = String(item.id);
        const idAuditoria = String(item.numRelatorioPesquisaExterna);
        if (!idTarefa || !idAuditoria) {
          ignorados++;
          continue;
        }
        const titulo = item.titulo || null;
        const dtPub = parseDataPub(item.dataPublicacao) || null;
        const siglaUnidade = item.unidadesAuditadas || null;
        const nomeUnidade = null;
        const siglaOrgSup = "MTE";
        const nomeOrgSup = "Minist\xE9rio do Trabalho e Emprego";
        let uf = null;
        let municipio = item.localidades || null;
        if (municipio && municipio.includes("/")) {
          const parts = municipio.split("/");
          uf = parts[parts.length - 1].trim().substring(0, 10);
        }
        const tipoServico = item.tipoServico || null;
        const linhaAcao = item.linhaAcao || null;
        const grupoAtividade = item.grupoAtividade || null;
        const edicaoFef = null;
        const urlRel = `https://eaud.cgu.gov.br/relatorios/download/${idTarefa}`;
        try {
          await client.query("SAVEPOINT import_auditoria");
          const result = await client.query(`
            INSERT INTO cgu_auditorias (
              id_tarefa, titulo_relatorio, data_publicacao, id_auditoria,
              sigla_unidade_auditada, nome_unidade_auditada, sigla_orgao_superior, nome_orgao_superior,
              uf, municipio, tipo_servico, linha_acao, grupo_atividade, edicao_programa_sorteio_fef,
              origem_cgu_url_relatorio, data_importacao
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP
            )
            ON CONFLICT (id_auditoria, id_tarefa) DO UPDATE SET
              titulo_relatorio = EXCLUDED.titulo_relatorio,
              data_publicacao = EXCLUDED.data_publicacao,
              sigla_unidade_auditada = EXCLUDED.sigla_unidade_auditada,
              nome_unidade_auditada = EXCLUDED.nome_unidade_auditada,
              sigla_orgao_superior = EXCLUDED.sigla_orgao_superior,
              nome_orgao_superior = EXCLUDED.nome_orgao_superior,
              uf = EXCLUDED.uf,
              municipio = EXCLUDED.municipio,
              tipo_servico = EXCLUDED.tipo_servico,
              linha_acao = EXCLUDED.linha_acao,
              grupo_atividade = EXCLUDED.grupo_atividade,
              origem_cgu_url_relatorio = EXCLUDED.origem_cgu_url_relatorio,
              data_importacao = CURRENT_TIMESTAMP
            RETURNING xmax;
          `, [
            idTarefa,
            titulo,
            dtPub,
            idAuditoria,
            siglaUnidade,
            nomeUnidade,
            siglaOrgSup,
            nomeOrgSup,
            uf,
            municipio,
            tipoServico,
            linhaAcao,
            grupoAtividade,
            edicaoFef,
            urlRel
          ]);
          if (result.rows[0].xmax === 0) {
            inseridos++;
          } else {
            atualizados++;
          }
          await client.query("RELEASE SAVEPOINT import_auditoria");
        } catch (dbErr) {
          await client.query("ROLLBACK TO SAVEPOINT import_auditoria");
          errosCount++;
          console.error(`Erro inserindo auditoria ${idAuditoria}-${idTarefa}:`, dbErr.message);
        }
      }
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
    let t1 = performance.now();
    await atualizarStatusImportacao({
      id: importControlId,
      status: "CONCLUIDO",
      tamanho_bytes: 0,
      quantidade_linhas_csv: lidos,
      quantidade_inseridos: inseridos,
      quantidade_atualizados: atualizados,
      quantidade_ignorados: ignorados,
      quantidade_erros: errosCount
    });
    console.log(`[CGU] Importa\xE7\xE3o conclu\xEDda via API. Lidos: ${lidos}, Inseridos: ${inseridos}, Atualizados: ${atualizados}, Erros: ${errosCount}. Tempo: ${((t1 - t0) / 1e3).toFixed(1)}s`);
    return {
      success: true,
      lidos,
      inseridos,
      atualizados,
      ignorados,
      erros: errosCount,
      tempo_segundos: ((t1 - t0) / 1e3).toFixed(1)
    };
  } catch (err) {
    if (importControlId) {
      await registrarErroImportacao(importControlId, err);
    }
    console.error("[CGU] Erro fatal na sincronia de auditorias via API", err);
    return { error: err.message };
  }
};

// src/backend/routes/cguAuditoriasRoutes.ts
var router8 = import_express8.default.Router();
router8.get("/cgu/auditorias", async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      sort = "data_publicacao",
      order = "DESC",
      periodoInicio,
      periodoFim,
      idAuditoria,
      tituloRelatorio,
      tipoServico,
      uf,
      municipio,
      grupoAtividade,
      ano
    } = req.query;
    let q = "SELECT * FROM cgu_auditorias WHERE 1=1";
    let params = [];
    let paramIdx = 1;
    if (idAuditoria) {
      q += ` AND id_auditoria ILIKE $${paramIdx++}`;
      params.push(`%${idAuditoria}%`);
    }
    if (tituloRelatorio) {
      q += ` AND titulo_relatorio ILIKE $${paramIdx++}`;
      params.push(`%${tituloRelatorio}%`);
    }
    if (tipoServico) {
      q += ` AND tipo_servico ILIKE $${paramIdx++}`;
      params.push(`%${tipoServico}%`);
    }
    if (uf) {
      q += ` AND uf = $${paramIdx++}`;
      params.push(uf);
    }
    if (municipio) {
      q += ` AND municipio ILIKE $${paramIdx++}`;
      params.push(`%${municipio}%`);
    }
    if (grupoAtividade) {
      q += ` AND grupo_atividade ILIKE $${paramIdx++}`;
      params.push(`%${grupoAtividade}%`);
    }
    if (periodoInicio) {
      q += ` AND data_publicacao >= $${paramIdx++}`;
      params.push(periodoInicio);
    }
    if (periodoFim) {
      q += ` AND data_publicacao <= $${paramIdx++}`;
      params.push(periodoFim);
    }
    if (ano) {
      q += ` AND EXTRACT(YEAR FROM data_publicacao) = $${paramIdx++}`;
      params.push(ano);
    }
    const countRes = await pool.query(`SELECT COUNT(*) FROM (${q}) as sub`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const validSortCols = ["data_publicacao", "id_auditoria", "titulo_relatorio", "sigla_unidade_auditada", "tipo_servico", "linha_acao"];
    const sortCol = validSortCols.includes(String(sort)) ? String(sort) : "data_publicacao";
    const sortOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    q += ` ORDER BY ${sortCol} ${sortOrder}`;
    const p = Math.max(1, parseInt(String(page), 10));
    const l = Math.max(1, parseInt(String(limit), 10));
    q += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(l, (p - 1) * l);
    const result = await pool.query(q, params);
    res.json({
      data: result.rows,
      total,
      page: p,
      limit: l
    });
  } catch (error) {
    console.error("Erro ao listar auditorias:", error);
    res.status(500).json({ error: "Erro interno ao listar auditorias." });
  }
});
router8.get("/cgu/auditorias-dashboard", async (req, res) => {
  try {
    const totalRes = await pool.query("SELECT COUNT(*) FROM cgu_auditorias");
    const total = parseInt(totalRes.rows[0].count, 10);
    const monitoramentoStats = await pool.query(`
      SELECT 
        SUM(CASE WHEN d.id_tarefa IS NOT NULL THEN 1 ELSE 0 END) as com_monitoramento,
        SUM(CASE WHEN d.id_tarefa IS NULL THEN 1 ELSE 0 END) as sem_monitoramento
      FROM cgu_auditorias a
      LEFT JOIN (SELECT DISTINCT id_tarefa FROM cgu_demands) d ON a.id_tarefa = d.id_tarefa
    `);
    const { com_monitoramento, sem_monitoramento } = monitoramentoStats.rows[0];
    const statsDemandas = await pool.query(`
      SELECT 
        COUNT(*) as total_recomendacoes,
        SUM(CASE WHEN estado ILIKE '%Pendente%' OR estado ILIKE '%Manifesta\xE7\xE3o%' THEN 1 ELSE 0 END) as total_pendencias,
        SUM(CASE WHEN estado ILIKE '%Conclu\xEDdo%' OR estado ILIKE '%Atendido%' THEN 1 ELSE 0 END) as total_concluidos,
        SUM(CASE WHEN estado ILIKE '%Cancelada%' OR estado ILIKE '%Cancelado%' THEN 1 ELSE 0 END) as total_cancelados,
        SUM(CASE WHEN estado ILIKE '%Em An\xE1lise pela Unidade Auditada%' THEN 1 ELSE 0 END) as total_analise_auditada,
        SUM(CASE WHEN estado ILIKE '%Em An\xE1lise pela Unidade de Auditoria%' THEN 1 ELSE 0 END) as total_analise_auditoria
      FROM cgu_demands
    `);
    const anoRes = await pool.query(`
      SELECT EXTRACT(YEAR FROM data_publicacao) as ano, COUNT(*) as count 
      FROM cgu_auditorias 
      WHERE data_publicacao IS NOT NULL
      GROUP BY ano ORDER BY ano ASC
    `);
    const tipoServicoRes = await pool.query(`
      SELECT tipo_servico, COUNT(*) as count 
      FROM cgu_auditorias 
      WHERE tipo_servico IS NOT NULL
      GROUP BY tipo_servico ORDER BY count DESC LIMIT 10
    `);
    res.json({
      total,
      comMonitoramento: parseInt(com_monitoramento || "0"),
      semMonitoramento: parseInt(sem_monitoramento || "0"),
      statsDemandas: statsDemandas.rows[0],
      graficoAnos: anoRes.rows,
      graficoTipos: tipoServicoRes.rows
    });
  } catch (error) {
    console.error("Erro no dashboard CGU:", error);
    res.status(500).json({ error: "Erro interno no dashboard." });
  }
});
router8.get("/cgu/auditorias/:id_tarefa", async (req, res) => {
  try {
    const { id_tarefa } = req.params;
    const audRes = await pool.query("SELECT * FROM cgu_auditorias WHERE id_tarefa = $1 LIMIT 1", [id_tarefa]);
    if (audRes.rows.length === 0) {
      return res.status(404).json({ error: "Auditoria n\xE3o encontrada." });
    }
    const auditoria = audRes.rows[0];
    const demRes = await pool.query(`
      SELECT * FROM cgu_demands 
      WHERE id_tarefa = $1 
         OR (titulo_tarefa IS NOT NULL AND titulo_tarefa ILIKE $2)
    `, [id_tarefa, `%${auditoria.id_auditoria}%`]);
    const monitoramentos = demRes.rows.map((row2) => ({
      idTarefa: row2.id_tarefa,
      situacao: row2.situacao,
      estado: row2.estado,
      tituloTarefa: row2.titulo_tarefa,
      dataInicio: row2.data_inicio,
      dataFim: row2.data_fim,
      dataLimite: row2.data_limite,
      unidadeAuditada: row2.unidade_auditada,
      unidadesAuditoria: row2.unidades_auditoria,
      textoMonitoramento: row2.texto_monitoramento,
      providencia: row2.providencia,
      tipoUltimaManifestacao: row2.tipo_ultima_manifestacao,
      textoUltimaManifestacao: row2.texto_ultima_manifestacao,
      dataUltimaManifestacao: row2.data_ultima_manifestacao,
      tipoUltimoPosicionamento: row2.tipo_ultimo_posicionamento,
      textoUltimoPosicionamento: row2.texto_ultimo_posicionamento,
      dataUltimoPosicionamento: row2.data_ultimo_posicionamento,
      categoria: row2.categoria,
      dataLimiteInicial: row2.data_limite_inicial,
      ano: row2.ano,
      ultimaAtualizacao: row2.ultima_atualizacao,
      processoSei: row2.processo_sei
    }));
    res.json({ auditoria, monitoramentos });
  } catch (error) {
    console.error("Erro ao obter detalhes da auditoria:", error);
    res.status(500).json({ error: "Erro interno ao detalhar auditoria." });
  }
});
router8.get("/cgu/pdf/view/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://eaud.cgu.gov.br/relatorios/download/${id}`;
    console.log(`[CGU PDF Proxy] Baixando PDF para visualiza\xE7\xE3o: ${url}`);
    const response = await (0, import_node_fetch3.default)(url);
    if (!response.ok) {
      return res.status(response.status).send(`Falha ao obter PDF da CGU: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Relatorio_CGU_${id}.pdf"`);
    res.send(buffer);
  } catch (error) {
    console.error("Erro no proxy de PDF:", error);
    res.status(500).send("Erro interno ao carregar o PDF.");
  }
});
router8.post("/cgu/auditorias/sync", async (req, res) => {
  const usuarioId = req.session?.user?.id ?? "SISTEMA";
  const result = await runImportCguAuditorias(usuarioId);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
});
var cguAuditoriasRoutes_default = router8;

// src/backend/routes/superintendenciasRoutes.ts
var import_express9 = __toESM(require("express"), 1);
init_db();
var router9 = import_express9.default.Router();
router9.get("/superintendencias", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*, 
        v.demandas_tcu as view_tcu, 
        v.demandas_cgu as view_cgu,
        v.demandas_comunicacoes,
        v.demandas_tces,
        (SELECT json_agg(acordao_key) FROM srte_acordao WHERE uf = s.uf) as acordao_ids,
        (SELECT json_agg(comunicacao_key) FROM srte_comunicacao WHERE uf = s.uf) as comunicacao_ids,
        (SELECT json_agg(tce_id) FROM srte_tce WHERE uf = s.uf) as tce_ids,
        (SELECT json_agg(cgu_id) FROM srte_cgu WHERE uf = s.uf) as cgu_ids
      FROM superintendencias s
      LEFT JOIN vw_srte_dashboard_metrics v ON s.uf = v.uf
    `);
    const mapped = result.rows.map((row2) => ({
      uf: row2.uf,
      capital: row2.capital,
      superintendente: row2.superintendente,
      cargo: row2.cargo,
      endereco: row2.endereco,
      contato: row2.contato,
      email: row2.email,
      substituto: row2.substituto,
      emailSubstituto: row2.email_substituto,
      cep: row2.cep,
      latitude: row2.latitude,
      longitude: row2.longitude,
      demandasTCU: parseInt(row2.view_tcu) || 0,
      demandasCGU: parseInt(row2.view_cgu) || 0,
      demandasComunicacoes: parseInt(row2.demandas_comunicacoes) || 0,
      demandasTces: parseInt(row2.demandas_tces) || 0,
      demandasEtica: row2.demandas_etica,
      statusGeral: row2.status_geral,
      acordaoIds: row2.acordao_ids || [],
      comunicacaoIds: row2.comunicacao_ids || [],
      tceIds: row2.tce_ids || [],
      cguIds: row2.cgu_ids || []
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching superintendencias:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router9.put("/superintendencias/:uf", async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const updateData = req.body;
    await pool.query(`
      UPDATE superintendencias 
      SET 
        superintendente = $1,
        endereco = $2,
        contato = $3,
        email = $4,
        substituto = $5,
        email_substituto = $6,
        cep = $7,
        status_geral = $8
      WHERE uf = $9
    `, [
      updateData.superintendente,
      updateData.endereco,
      updateData.contato,
      updateData.email,
      updateData.substituto,
      updateData.emailSubstituto,
      updateData.cep,
      updateData.statusGeral,
      uf
    ]);
    res.json({ success: true, uf, ...updateData });
  } catch (error) {
    console.error("Error updating superintendencias:", error);
    res.status(500).json({ error: "Erro interno ao atualizar a superintend\xEAncia" });
  }
});
var superintendenciasRoutes_default = router9;

// src/backend/routes/contratosRoutes.ts
var import_express10 = __toESM(require("express"), 1);
init_db();
var router10 = import_express10.default.Router();
router10.get("/contratos", async (req, res) => {
  const result = await pool.query("SELECT * FROM contratos");
  const mapped = result.rows.map((r) => ({
    id: r.id,
    numeroContrato: r.numero_contrato,
    empresa: r.empresa,
    cnpj: r.cnpj,
    objeto: r.objeto,
    valorAnual: parseFloat(r.valor_anual) || 0,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim,
    uf: r.uf
  }));
  res.json(mapped);
});
router10.post("/contratos", async (req, res) => {
  const c = req.body;
  c.id = "C-" + Date.now();
  await pool.query(
    "INSERT INTO contratos (id, numero_contrato, empresa, cnpj, objeto, valor_anual, data_inicio, data_fim, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorAnual, c.dataInicio, c.dataFim, c.uf]
  );
  res.status(201).json(c);
});
router10.get("/contratos/:id/consumo", async (req, res) => {
  const result = await pool.query("SELECT * FROM contratos_consumo_mensal WHERE contrato_id = $1", [req.params.id]);
  const mapped = result.rows.map((r) => ({
    id: r.id,
    contratoId: r.contrato_id,
    mes: r.mes,
    valorConsumido: parseFloat(r.valor_consumido) || 0,
    faturaUrl: r.fatura_url
  }));
  res.json(mapped);
});
var contratosRoutes_default = router10;

// src/backend/routes/viaturasRoutes.ts
var import_express11 = __toESM(require("express"), 1);
init_db();
var router11 = import_express11.default.Router();
router11.get("/viaturas", async (req, res) => {
  const result = await pool.query("SELECT * FROM viaturas");
  const mapped = result.rows.map((r) => ({
    id: r.id,
    placa: r.placa,
    modelo: r.modelo,
    ano: r.ano,
    tipo: r.tipo,
    uf: r.uf,
    kmAtual: r.km_atual,
    proximaRevisaoKm: r.proxima_revisao_km,
    status: r.status
  }));
  res.json(mapped);
});
router11.post("/viaturas", async (req, res) => {
  const v = req.body;
  v.id = "V-" + Date.now();
  await pool.query(
    "INSERT INTO viaturas (id, placa, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [v.id, v.placa, v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status]
  );
  res.status(201).json(v);
});
router11.get("/viaturas/:id/abastecimentos", async (req, res) => {
  const result = await pool.query("SELECT * FROM viaturas_abastecimentos WHERE viatura_id = $1", [req.params.id]);
  const mapped = result.rows.map((r) => ({
    id: r.id,
    viaturaId: r.viatura_id,
    dataAbastecimento: r.data_abastecimento,
    km: r.km,
    litros: parseFloat(r.litros) || 0,
    valorTotal: parseFloat(r.valor_total) || 0,
    posto: r.posto
  }));
  res.json(mapped);
});
router11.get("/viaturas/:id/manutencoes", async (req, res) => {
  const result = await pool.query("SELECT * FROM viaturas_manutencoes WHERE viatura_id = $1", [req.params.id]);
  const mapped = result.rows.map((r) => ({
    id: r.id,
    viaturaId: r.viatura_id,
    dataManutencao: r.data_manutencao,
    tipoManutencao: r.tipo_manutencao,
    descricao: r.descricao,
    kmManutencao: r.km_manutencao,
    valor: parseFloat(r.valor) || 0,
    proximaRevisaoKm: r.proxima_revisao_km
  }));
  res.json(mapped);
});
var viaturasRoutes_default = router11;

// src/backend/routes/rolLegacyRoutes.ts
var import_express12 = __toESM(require("express"), 1);
init_db();
var router12 = import_express12.default.Router();
router12.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rol_responsaveis_legado");
    const mapped = result.rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      cpf: r.cpf,
      cargo: r.cargo,
      unidade: r.unidade,
      inicioExercicio: r.inicio_exercicio,
      fimExercicio: r.fim_exercicio,
      atoNomeacao: r.ato_nomeacao,
      status: r.status,
      observacoes: r.observacoes
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching rol legacy:", error);
    res.status(500).json({ error: "Failed to fetch" });
  }
});
router12.post("/", async (req, res) => {
  try {
    const v = req.body;
    v.id = "rol_" + Date.now();
    await pool.query(
      "INSERT INTO rol_responsaveis_legado (id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [v.id, v.nome, v.cpf, v.cargo, v.unidade, v.inicioExercicio, v.fimExercicio, v.atoNomeacao, v.status, v.observacoes]
    );
    res.status(201).json(v);
  } catch (error) {
    console.error("Error creating rol legacy:", error);
    res.status(500).json({ error: "Failed to create" });
  }
});
router12.put("/:id", async (req, res) => {
  try {
    const v = req.body;
    await pool.query(
      "UPDATE rol_responsaveis_legado SET nome=$1, cpf=$2, cargo=$3, unidade=$4, inicio_exercicio=$5, fim_exercicio=$6, ato_nomeacao=$7, status=$8, observacoes=$9 WHERE id=$10",
      [v.nome, v.cpf, v.cargo, v.unidade, v.inicioExercicio, v.fimExercicio, v.atoNomeacao, v.status, v.observacoes, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating rol legacy:", error);
    res.status(500).json({ error: "Failed to update" });
  }
});
router12.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM rol_responsaveis_legado WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting rol legacy:", error);
    res.status(500).json({ error: "Failed to delete" });
  }
});
var rolLegacyRoutes_default = router12;

// src/backend/routes/dashboardRoutes.ts
var import_express13 = __toESM(require("express"), 1);
init_db();
var router13 = import_express13.default.Router();
router13.get("/dashboard-stats", async (req, res) => {
  try {
    const qAcordaos = await pool.query("SELECT COUNT(*) FROM tcu_acordaos");
    const qTces = await pool.query("SELECT COUNT(*) FROM tcu_tce");
    const qComunicacoes = await pool.query("SELECT COUNT(*) FROM tcu_comunicacoes");
    const qCgu = await pool.query("SELECT COUNT(*) FROM cgu_demands");
    const qCguReports = await pool.query("SELECT COUNT(*) FROM cgu_reports");
    res.json({
      acordaosCount: parseInt(qAcordaos.rows[0].count),
      tceCount: parseInt(qTces.rows[0].count),
      comunicacoesCount: parseInt(qComunicacoes.rows[0].count),
      cguCount: parseInt(qCgu.rows[0].count),
      cguReportsCount: parseInt(qCguReports.rows[0].count)
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.json({
      acordaosCount: 0,
      tceCount: 0,
      comunicacoesCount: 0,
      cguCount: 0,
      cguReportsCount: 0
    });
  }
});
var dashboardRoutes_default = router13;

// src/backend/userService.ts
init_db();
var import_bcrypt = __toESM(require("bcrypt"), 1);
init_seed_db();
var BCRYPT_ROUNDS = 12;
var CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS orbita_users (
    id                       VARCHAR(50)  PRIMARY KEY,
    name                     VARCHAR(255) NOT NULL,
    cpf                      VARCHAR(14),
    siape                    VARCHAR(10),
    phone                    VARCHAR(25),
    email                    VARCHAR(255) UNIQUE NOT NULL,
    role                     VARCHAR(255),
    unidade                  VARCHAR(255),
    unidade_sigla            VARCHAR(50),
    clearance                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    allowed_modules          TEXT[]       NOT NULL DEFAULT '{}',
    avatar_color             VARCHAR(120) NOT NULL DEFAULT 'bg-slate-500 text-white',
    password_hash            VARCHAR(255),
    requires_password_change BOOLEAN      NOT NULL DEFAULT TRUE,
    status                   VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    badge_text               VARCHAR(100) NOT NULL DEFAULT 'PENDENTE',
    justificativa            TEXT,
    requested_at             TIMESTAMPTZ  DEFAULT NOW(),
    approved_at              TIMESTAMPTZ,
    approved_by              VARCHAR(50),
    last_password_change     TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_orbita_users_cpf    ON orbita_users (cpf);
  CREATE INDEX IF NOT EXISTS idx_orbita_users_siape  ON orbita_users (siape);
  CREATE INDEX IF NOT EXISTS idx_orbita_users_email  ON orbita_users (email);
  CREATE INDEX IF NOT EXISTS idx_orbita_users_status ON orbita_users (status);
`;
async function initUsersTable() {
  try {
    await pool.query(CREATE_TABLE_SQL);
    console.log("[UserService] Tabela orbita_users pronta.");
    await migrateAdminSeed();
  } catch (err) {
    console.error("[UserService] Erro ao inicializar tabela de usu\xE1rios:", err);
    throw err;
  }
}
async function migrateAdminSeed() {
  for (const seed of SEED_PROFILES) {
    const exists = await pool.query(
      "SELECT id FROM orbita_users WHERE id = $1",
      [seed.id]
    );
    if (exists.rows.length === 0) {
      const rawPassword = seed.password || seed.pin || "Orbita@2026";
      const hash = await import_bcrypt.default.hash(rawPassword, BCRYPT_ROUNDS);
      await pool.query(
        `INSERT INTO orbita_users
          (id, name, cpf, siape, phone, email, role, unidade, clearance, allowed_modules,
           avatar_color, password_hash, requires_password_change, status, badge_text,
           requested_at, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())`,
        [
          seed.id,
          seed.name,
          seed.cpf || null,
          seed.siape || null,
          seed.phone || null,
          seed.email,
          seed.role,
          seed.unidade || "AECI",
          seed.clearance,
          seed.allowedModules || [],
          seed.avatarColor,
          hash,
          false,
          seed.status || "ACTIVE",
          seed.badgeText
        ]
      );
      console.log(`[UserService] Admin seed migrado para PostgreSQL: ${seed.id}`);
    }
  }
}
function rowToUser(row2) {
  return {
    id: row2.id,
    name: row2.name,
    cpf: row2.cpf,
    siape: row2.siape,
    phone: row2.phone,
    email: row2.email,
    role: row2.role,
    unidade: row2.unidade,
    unidade_sigla: row2.unidade_sigla,
    clearance: row2.clearance,
    allowed_modules: row2.allowed_modules || [],
    avatar_color: row2.avatar_color,
    password_hash: row2.password_hash,
    requires_password_change: row2.requires_password_change,
    status: row2.status,
    badge_text: row2.badge_text,
    justificativa: row2.justificativa,
    requested_at: row2.requested_at,
    approved_at: row2.approved_at,
    approved_by: row2.approved_by,
    last_password_change: row2.last_password_change,
    created_at: row2.created_at,
    updated_at: row2.updated_at
  };
}
async function findUserByIdentifier(identifier) {
  const cleanId = identifier.replace(/\D/g, "");
  const result = await pool.query(
    `SELECT * FROM orbita_users
     WHERE id = $1
        OR email = $1
        OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2
     LIMIT 1`,
    [identifier, cleanId]
  );
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}
async function findUserBySiapeAndCpf(siape, cpf) {
  const cleanCpf = cpf.replace(/\D/g, "");
  const result = await pool.query(
    `SELECT * FROM orbita_users
     WHERE siape = $1
       AND REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2
       AND status = 'ACTIVE'
     LIMIT 1`,
    [siape.trim(), cleanCpf]
  );
  return result.rows.length > 0 ? rowToUser(result.rows[0]) : null;
}
async function userExistsByEmailOrCpf(email, cpf) {
  const cleanCpf = cpf.replace(/\D/g, "");
  const result = await pool.query(
    `SELECT id FROM orbita_users
     WHERE email = $1
        OR REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $2
     LIMIT 1`,
    [email, cleanCpf]
  );
  return result.rows.length > 0;
}
async function listAllUsers() {
  const result = await pool.query(
    `SELECT * FROM orbita_users ORDER BY
       CASE status WHEN 'PENDING' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END,
       created_at DESC`
  );
  return result.rows.map(rowToUser);
}
async function createPendingUser(data) {
  const id = "usr_" + Math.random().toString(36).substring(2, 11);
  const result = await pool.query(
    `INSERT INTO orbita_users
      (id, name, cpf, siape, phone, email, role, unidade, unidade_sigla,
       justificativa, clearance, status, badge_text, avatar_color,
       password_hash, requires_password_change, requested_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'PENDING','PENDING','PENDENTE',
             'bg-slate-400 text-white', NULL, TRUE, NOW())
     RETURNING *`,
    [
      id,
      data.name,
      data.cpf,
      data.siape || null,
      data.phone || null,
      data.email,
      data.role || "N\xE3o informado",
      data.unidade || null,
      data.unidadeSigla || null,
      data.justificativa || null
    ]
  );
  return rowToUser(result.rows[0]);
}
async function approveUser(id, payload, approvedById, tempPassword) {
  const hash = await import_bcrypt.default.hash(tempPassword, BCRYPT_ROUNDS);
  const result = await pool.query(
    `UPDATE orbita_users SET
       status = 'ACTIVE',
       clearance = $1,
       role = COALESCE($2, role),
       badge_text = COALESCE($3, badge_text),
       allowed_modules = $4,
       password_hash = $5,
       requires_password_change = TRUE,
       approved_at = NOW(),
       approved_by = $6,
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      payload.clearance || "PUBLIC",
      payload.role || null,
      payload.badgeText || null,
      payload.allowedModules || [],
      hash,
      approvedById,
      id
    ]
  );
  return rowToUser(result.rows[0]);
}
async function updateUser(id, payload) {
  const result = await pool.query(
    `UPDATE orbita_users SET
       name = COALESCE($1, name),
       email = COALESCE($2, email),
       siape = COALESCE($3, siape),
       role = COALESCE($4, role),
       unidade = COALESCE($5, unidade),
       clearance = COALESCE($6, clearance),
       badge_text = COALESCE($7, badge_text),
       allowed_modules = COALESCE($8, allowed_modules),
       updated_at = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      payload.name || null,
      payload.email || null,
      payload.siape || null,
      payload.role || null,
      payload.unidade || null,
      payload.clearance || null,
      payload.badgeText || null,
      payload.allowedModules || null,
      id
    ]
  );
  return rowToUser(result.rows[0]);
}
async function inactivateUser(id) {
  await pool.query(
    "UPDATE orbita_users SET status = 'INACTIVE', updated_at = NOW() WHERE id = $1",
    [id]
  );
}
async function reactivateUser(id) {
  await pool.query(
    "UPDATE orbita_users SET status = 'ACTIVE', updated_at = NOW() WHERE id = $1",
    [id]
  );
}
async function updatePassword(id, newPasswordPlain) {
  const hash = await import_bcrypt.default.hash(newPasswordPlain, BCRYPT_ROUNDS);
  await pool.query(
    `UPDATE orbita_users SET
       password_hash = $1,
       requires_password_change = FALSE,
       last_password_change = NOW(),
       updated_at = NOW()
     WHERE id = $2`,
    [hash, id]
  );
}
async function setProvisionalPassword(id, tempPasswordPlain) {
  const hash = await import_bcrypt.default.hash(tempPasswordPlain, BCRYPT_ROUNDS);
  await pool.query(
    `UPDATE orbita_users SET
       password_hash = $1,
       requires_password_change = TRUE,
       updated_at = NOW()
     WHERE id = $2`,
    [hash, id]
  );
}
async function verifyPassword(user, plainPassword) {
  if (!user.password_hash) return false;
  return import_bcrypt.default.compare(plainPassword, user.password_hash);
}
function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$!%&";
  const all = upper + lower + digits + symbols;
  const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const password = [
    rand(upper),
    rand(upper),
    rand(lower),
    rand(lower),
    rand(digits),
    rand(digits),
    rand(symbols),
    ...Array.from({ length: 5 }, () => rand(all))
  ];
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  return password.join("");
}
function userToSessionFormat(user) {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    email: user.email,
    register: user.siape ? `SIAPE: ${user.siape}` : user.unidade || "",
    clearance: user.clearance,
    avatarColor: user.avatar_color,
    badgeText: user.badge_text,
    allowedModules: user.allowed_modules
  };
}

// src/backend/emailService.ts
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_dotenv3 = __toESM(require("dotenv"), 1);
import_dotenv3.default.config();
var ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "alessandro.lourenco@trabalho.gov.br";
var SMTP_FROM = process.env.SMTP_FROM || '"\xD3RBITA.AECI" <noreply@trabalho.gov.br>';
var APP_URL = process.env.APP_URL || "http://localhost:3000";
function createTransporter() {
  if (!process.env.SMTP_HOST) {
    return null;
  }
  return import_nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { rejectUnauthorized: false }
    // necessário para alguns exchanges gov
  });
}
async function sendEmail(to, subject, html) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("\n" + "\u2550".repeat(70));
    console.log(`\u{1F4E7}  EMAIL SIMULADO (configure SMTP_HOST no .env para envio real)`);
    console.log("\u2550".repeat(70));
    console.log(`Para:     ${to}`);
    console.log(`Assunto:  ${subject}`);
    console.log(`Remetente: ${SMTP_FROM}`);
    console.log("\u2500".repeat(70));
    const text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n{3,}/g, "\n\n").trim();
    console.log(text);
    console.log("\u2550".repeat(70) + "\n");
    return;
  }
  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html
  });
  console.log(`[Email] Enviado para: ${to} | Assunto: ${subject}`);
}
function baseTemplate(title, content) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header gov.br -->
        <tr>
          <td style="background:linear-gradient(135deg,#1351b4 0%,#003366 100%);padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                    \xD3RBITA<span style="color:#fbbf24;">.</span>AECI
                  </div>
                  <div style="font-size:10px;color:#93c5fd;font-weight:700;letter-spacing:2px;margin-top:2px;text-transform:uppercase;">
                    Assessoria Especial de Controle Interno \u2014 MTE
                  </div>
                </td>
                <td align="right">
                  <div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:8px 14px;display:inline-block;">
                    <div style="font-size:18px;font-weight:900;color:#ffffff;">gov<span style="color:#00c010;">.</span>br</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- T\xEDtulo -->
        <tr>
          <td style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:20px 32px;">
            <h1 style="margin:0;font-size:16px;font-weight:800;color:#1e293b;letter-spacing:-0.3px;">${title}</h1>
          </td>
        </tr>

        <!-- Conte\xFAdo -->
        <tr>
          <td style="padding:28px 32px;color:#334155;font-size:14px;line-height:1.7;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;">
              Este \xE9 um e-mail autom\xE1tico do sistema \xD3RBITA.AECI \u2014 Minist\xE9rio do Trabalho e Emprego.<br>
              N\xE3o responda a este e-mail. Em caso de d\xFAvidas, entre em contato com a AECI.
            </p>
            <p style="margin:8px 0 0;font-size:10px;color:#cbd5e1;">
              \xA9 2026 Rep\xFAblica Federativa do Brasil
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
async function sendAccessRequestNotification(user) {
  const content = `
    <p>Uma nova solicita\xE7\xE3o de acesso ao <strong>\xD3RBITA.AECI</strong> foi recebida e aguarda sua an\xE1lise.</p>
    
    <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:16px 0;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">
          Dados do Solicitante
        </td>
      </tr>
      ${row("Nome Completo", user.name)}
      ${row("E-mail", user.email)}
      ${row("CPF", user.cpf || "\u2014")}
      ${row("SIAPE", user.siape || "\u2014")}
      ${row("Cargo/Fun\xE7\xE3o", user.role || "\u2014")}
      ${row("Unidade", user.unidade || "\u2014")}
    </table>

    ${user.justificativa ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin:16px 0;">
      <div style="font-size:11px;font-weight:800;color:#78350f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
        Justificativa de Acesso
      </div>
      <p style="margin:0;font-size:13px;color:#451a03;">${user.justificativa}</p>
    </div>` : ""}

    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}" 
         style="background:#1351b4;color:#ffffff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;letter-spacing:0.3px;">
        Abrir Painel do Administrador
      </a>
    </div>

    <p style="font-size:12px;color:#64748b;margin-top:16px;">
      Acesse o painel, v\xE1 em <strong>Administra\xE7\xE3o e Usu\xE1rios</strong> e aprove ou recuse a solicita\xE7\xE3o.
    </p>
  `;
  await sendEmail(
    ADMIN_EMAIL,
    `[\xD3RBITA.AECI] Nova Solicita\xE7\xE3o de Acesso \u2014 ${user.name}`,
    baseTemplate("Nova Solicita\xE7\xE3o de Acesso", content)
  );
}
async function sendAccessApprovedEmail(user, tempPassword) {
  const content = `
    <p>Ol\xE1, <strong>${user.name}</strong>!</p>
    <p>Sua solicita\xE7\xE3o de acesso ao sistema <strong>\xD3RBITA.AECI</strong> foi <strong style="color:#16a34a;">aprovada</strong>.</p>

    <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
      <div style="font-size:11px;font-weight:800;color:#14532d;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
        Senha Provis\xF3ria de Acesso
      </div>
      <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:900;color:#1351b4;letter-spacing:3px;background:#ffffff;border:1px solid #bfdbfe;border-radius:6px;padding:10px 20px;display:inline-block;">
        ${tempPassword}
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#166534;">
        \u26A0\uFE0F Esta senha \xE9 <strong>provis\xF3ria</strong> e dever\xE1 ser trocada no primeiro acesso.
      </p>
    </div>

    <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:16px 0;">
      <tr style="background:#f8fafc;">
        <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #e2e8f0;">
          Seus Dados de Acesso
        </td>
      </tr>
      ${row("Identificador de Login", user.cpf ? user.cpf.replace(/\D/g, "") : user.email)}
      ${row("N\xEDvel de Acesso", user.badgeText || "\u2014")}
      ${row("Unidade", user.unidade || "\u2014")}
    </table>

    <p><strong>Como acessar:</strong></p>
    <ol style="margin:0;padding-left:20px;color:#334155;font-size:13px;line-height:2;">
      <li>Acesse o sistema em <a href="${APP_URL}" style="color:#1351b4;">${APP_URL}</a></li>
      <li>Informe seu CPF no campo de identifica\xE7\xE3o</li>
      <li>Use a senha provis\xF3ria acima</li>
      <li>Voc\xEA ser\xE1 solicitado a criar uma nova senha permanente</li>
    </ol>

    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;margin:20px 0;">
      <p style="margin:0;font-size:12px;color:#78350f;">
        \u{1F512} <strong>Seguran\xE7a:</strong> Nunca compartilhe sua senha. O \xD3RBITA.AECI e a AECI jamais solicitar\xE3o sua senha por e-mail ou telefone.
      </p>
    </div>
  `;
  await sendEmail(
    user.email,
    "[\xD3RBITA.AECI] Seu acesso foi aprovado \u2014 Senha Provis\xF3ria",
    baseTemplate("Acesso ao \xD3RBITA.AECI Aprovado", content)
  );
}
async function sendPasswordResetEmail(user, tempPassword) {
  const content = `
    <p>Ol\xE1, <strong>${user.name}</strong>!</p>
    <p>Recebemos uma solicita\xE7\xE3o de recupera\xE7\xE3o de senha para sua conta no <strong>\xD3RBITA.AECI</strong>.</p>

    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:10px;padding:20px 24px;margin:20px 0;text-align:center;">
      <div style="font-size:11px;font-weight:800;color:#7c2d12;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
        Nova Senha Provis\xF3ria
      </div>
      <div style="font-family:'Courier New',monospace;font-size:22px;font-weight:900;color:#1351b4;letter-spacing:3px;background:#ffffff;border:1px solid #fed7aa;border-radius:6px;padding:10px 20px;display:inline-block;">
        ${tempPassword}
      </div>
      <p style="margin:10px 0 0;font-size:12px;color:#9a3412;">
        \u26A0\uFE0F Esta senha \xE9 <strong>provis\xF3ria</strong> e dever\xE1 ser trocada no pr\xF3ximo acesso.
      </p>
    </div>

    <p style="font-size:13px;color:#475569;">
      Se voc\xEA <strong>n\xE3o solicitou</strong> a recupera\xE7\xE3o de senha, ignore este e-mail e sua senha anterior permanecer\xE1 ativa. Em caso de suspeita de acesso indevido, entre em contato com a AECI imediatamente.
    </p>

    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}" 
         style="background:#1351b4;color:#ffffff;font-weight:800;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;">
        Acessar o Sistema
      </a>
    </div>
  `;
  await sendEmail(
    user.email,
    "[\xD3RBITA.AECI] Recupera\xE7\xE3o de Senha \u2014 Senha Provis\xF3ria",
    baseTemplate("Recupera\xE7\xE3o de Senha", content)
  );
}
function row(label, value) {
  return `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#475569;width:40%;white-space:nowrap;">${label}</td>
      <td style="padding:10px 16px;font-size:13px;color:#1e293b;font-weight:500;">${value}</td>
    </tr>`;
}

// server.ts
init_seed_db();
import_dotenv4.default.config();
var govHubPool = new import_pg2.default.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://airflow:airflow@localhost:5432/postgres",
  max: 5,
  idleTimeoutMillis: 1e4,
  connectionTimeoutMillis: 2e3
  // Fast timeout so it fails quickly if GovHub docker is not running
});
var DATA_DIR3 = import_path9.default.join(process.cwd(), "data");
var DB_PATH2 = import_path9.default.join(DATA_DIR3, "orbita_db.json");
var TCU_DIR5 = import_path9.default.join(DATA_DIR3, "tcu");
if (!import_fs10.default.existsSync(DATA_DIR3)) {
  import_fs10.default.mkdirSync(DATA_DIR3, { recursive: true });
}
if (!import_fs10.default.existsSync(TCU_DIR5)) {
  import_fs10.default.mkdirSync(TCU_DIR5, { recursive: true });
}
async function startServer() {
  const app = (0, import_express14.default)();
  try {
    await initUsersTable();
  } catch (err) {
    console.error("[Server] Falha ao inicializar tabela de usu\xE1rios. O servidor continuar\xE1, mas o login pode n\xE3o funcionar.", err);
  }
  app.use((0, import_compression.default)());
  app.use((0, import_express_session.default)({
    store: new import_express_session.default.MemoryStore(),
    secret: process.env.SESSION_SECRET || "orbita-secret-key-123456789",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false,
      // set to true if using HTTPS
      httpOnly: true
    }
  }));
  app.use((req, res, next) => {
    if (req.session && req.session.user) {
      const now = Date.now();
      const isAuthRoute = req.path.startsWith("/api/auth");
      const shouldCheck = !isAuthRoute || req.path === "/api/auth/session";
      if (shouldCheck && req.session.lastHeartbeat) {
        const diff = now - req.session.lastHeartbeat;
        if (diff > 12e4) {
          console.log(`[Orbita Session] Session expired due to lack of client heartbeat. Last seen: ${diff}ms ago.`);
          req.session.destroy(() => {
          });
          if (req.path.startsWith("/api/")) {
            return res.status(401).json({ authenticated: false, error: "Sess\xE3o encerrada por inatividade/fechamento do navegador." });
          } else {
            return res.redirect("/");
          }
        }
      }
      if (req.path !== "/api/auth/heartbeat") {
        req.session.lastHeartbeat = now;
      }
    }
    next();
  });
  app.use(import_express14.default.json({ limit: "50mb" }));
  app.use(import_express14.default.urlencoded({ limit: "50mb", extended: true }));
  const requireAdmin = (req, res, next) => {
    if (!req.session?.user || req.session.user.clearance !== "ADMIN") {
      return res.status(403).json({ error: "Acesso restrito a administradores." });
    }
    next();
  };
  app.get("/api/auth/session", async (req, res) => {
    if (req.session && req.session.user) {
      try {
        const freshUser = await findUserByIdentifier(req.session.user.id);
        if (freshUser && freshUser.status === "ACTIVE") {
          req.session.user = userToSessionFormat(freshUser);
        }
      } catch (e) {
      }
      return res.json({ authenticated: true, user: req.session.user });
    }
    return res.json({ authenticated: false });
  });
  app.post("/api/auth/heartbeat", (req, res) => {
    if (req.session && req.session.user) {
      req.session.lastHeartbeat = Date.now();
      return res.json({ success: true });
    }
    return res.json({ success: false });
  });
  app.post("/api/auth/login-pin", (req, res) => {
    const { profileId, pin } = req.body;
    if (!profileId || !pin) {
      return res.status(400).json({ error: "Perfil e PIN s\xE3o obrigat\xF3rios." });
    }
    const matchedProfile = SEED_PROFILES.find((p) => p.id === profileId);
    if (!matchedProfile) {
      return res.status(404).json({ error: "Perfil n\xE3o encontrado." });
    }
    if (matchedProfile.pin === pin || matchedProfile.clearance === "PUBLIC") {
      req.session.user = {
        id: matchedProfile.id,
        name: matchedProfile.name,
        role: matchedProfile.role,
        email: matchedProfile.email,
        register: matchedProfile.register,
        clearance: matchedProfile.clearance,
        avatarColor: matchedProfile.avatarColor,
        badgeText: matchedProfile.badgeText
      };
      return res.json({ success: true, user: req.session.user });
    }
    return res.status(401).json({ error: "C\xF3digo PIN de assinatura inv\xE1lido para este perfil." });
  });
  app.post("/api/auth/login-local", async (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identificador e senha s\xE3o obrigat\xF3rios." });
    }
    const cleanId = String(identifier).replace(/\D/g, "");
    const maskedId = cleanId.length >= 6 ? `${cleanId.substring(0, 3)}***${cleanId.slice(-2)}` : "***";
    console.log(`[Auth] Login attempt \u2014 identifier: ${maskedId}`);
    try {
      const user = await findUserByIdentifier(identifier);
      if (!user) {
        console.log(`[Auth] Login failed \u2014 user not found: ${maskedId}`);
        return res.status(401).json({ error: "Credenciais inv\xE1lidas. Verifique o CPF e a senha informados." });
      }
      if (user.status !== "ACTIVE") {
        return res.status(403).json({ error: "Usu\xE1rio n\xE3o est\xE1 ativo (status: " + user.status + ")." });
      }
      const valid = await verifyPassword(user, password);
      if (!valid) {
        console.log(`[Auth] Login failed \u2014 wrong password for user: ${user.id}`);
        return res.status(401).json({ error: "Credenciais inv\xE1lidas. Senha incorreta." });
      }
      console.log(`[Auth] Login OK \u2014 user: ${user.id}`);
      req.session.user = userToSessionFormat(user);
      return res.json({
        success: true,
        user: req.session.user,
        requiresPasswordChange: user.requires_password_change
      });
    } catch (err) {
      console.error("[Auth] Erro no login:", err);
      return res.status(500).json({ error: "Erro interno ao processar login." });
    }
  });
  app.post("/api/auth/request-access", async (req, res) => {
    const { name, cpf, siape, phone, email, role, unidade, unidadeSigla, justificativa } = req.body;
    if (!name || !cpf || !email) {
      return res.status(400).json({ error: "Nome, CPF e E-mail s\xE3o obrigat\xF3rios." });
    }
    try {
      const exists = await userExistsByEmailOrCpf(email, cpf);
      if (exists) {
        return res.status(400).json({ error: "J\xE1 existe um cadastro com este E-mail ou CPF." });
      }
      const newUser = await createPendingUser({ name, cpf, siape, phone, email, role, unidade, unidadeSigla, justificativa });
      sendAccessRequestNotification({ name, email, cpf, siape, role, unidade, justificativa }).catch(
        (e) => console.error("[Email] Falha ao notificar admin:", e)
      );
      return res.json({ success: true, message: "Solicita\xE7\xE3o enviada com sucesso. O administrador ser\xE1 notificado." });
    } catch (err) {
      console.error("[Auth] Erro ao solicitar acesso:", err);
      return res.status(500).json({ error: "Erro ao registrar solicita\xE7\xE3o de acesso." });
    }
  });
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { cpf, siape } = req.body;
    const genericMsg = "Se os dados estiverem corretos, um e-mail ser\xE1 enviado em instantes.";
    if (!cpf || !siape) {
      return res.json({ success: true, message: genericMsg });
    }
    try {
      const user = await findUserBySiapeAndCpf(siape, cpf);
      if (!user) {
        return res.json({ success: true, message: genericMsg });
      }
      const tempPass = generateTempPassword();
      await setProvisionalPassword(user.id, tempPass);
      sendPasswordResetEmail({ name: user.name, email: user.email }, tempPass).catch(
        (e) => console.error("[Email] Falha ao enviar e-mail de recupera\xE7\xE3o:", e)
      );
      return res.json({ success: true, message: genericMsg });
    } catch (err) {
      console.error("[Auth] Erro ao recuperar senha:", err);
      return res.json({ success: true, message: genericMsg });
    }
  });
  app.post("/api/auth/reset-password", async (req, res) => {
    if (!req.session?.user) return res.status(401).json({ error: "N\xE3o autenticado." });
    const { userId, oldPassword, newPassword } = req.body;
    if (req.session.user.id !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    try {
      const user = await findUserByIdentifier(userId);
      if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
      const valid = await verifyPassword(user, oldPassword);
      if (!valid) return res.status(403).json({ error: "Senha atual incorreta." });
      await updatePassword(userId, newPassword);
      return res.json({ success: true, message: "Senha atualizada com sucesso." });
    } catch (err) {
      console.error("[Auth] Erro ao resetar senha:", err);
      return res.status(500).json({ error: "Erro interno ao atualizar senha." });
    }
  });
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await listAllUsers();
      return res.json(users.map((u) => {
        const { password_hash, ...safe } = u;
        return safe;
      }));
    } catch (err) {
      return res.status(500).json({ error: "Erro ao listar usu\xE1rios." });
    }
  });
  app.post("/api/admin/users/:id/approve", requireAdmin, async (req, res) => {
    const { role, clearance, badgeText, allowedModules } = req.body;
    const adminId = req.session.user.id;
    try {
      const tempPass = generateTempPassword();
      const updated = await approveUser(
        req.params.id,
        { role, clearance: clearance || "PUBLIC", badgeText, allowedModules },
        adminId,
        tempPass
      );
      sendAccessApprovedEmail(
        { name: updated.name, email: updated.email, cpf: updated.cpf, unidade: updated.unidade, badgeText: updated.badge_text },
        tempPass
      ).catch((e) => console.error("[Email] Falha ao enviar aprova\xE7\xE3o:", e));
      const { password_hash, ...safe } = updated;
      return res.json({ success: true, user: safe });
    } catch (err) {
      console.error("[Admin] Erro ao aprovar usu\xE1rio:", err);
      return res.status(500).json({ error: "Erro ao aprovar usu\xE1rio." });
    }
  });
  app.post("/api/admin/users/:id", requireAdmin, async (req, res) => {
    const { badgeText, allowedModules, clearance, role, name, email, siape, unidade } = req.body;
    try {
      const user = await findUserByIdentifier(req.params.id);
      if (!user) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
      const updated = await updateUser(
        req.params.id,
        { role, clearance, badgeText, allowedModules, name, email, siape, unidade }
      );
      const { password_hash, ...safe } = updated;
      return res.json({ success: true, user: safe });
    } catch (err) {
      console.error("[Admin] Erro ao atualizar usu\xE1rio:", err);
      return res.status(500).json({ error: "Erro ao atualizar usu\xE1rio." });
    }
  });
  app.post("/api/admin/users/:id/inactivate", requireAdmin, async (req, res) => {
    try {
      await inactivateUser(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao inativar usu\xE1rio." });
    }
  });
  app.post("/api/admin/users/:id/reactivate", requireAdmin, async (req, res) => {
    try {
      await reactivateUser(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Erro ao reativar usu\xE1rio." });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Erro ao encerrar sess\xE3o." });
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });
  app.get("/api/auth/govbr/login", (req, res) => {
    const state = Math.random().toString(36).substring(2);
    if (process.env.GOVBR_CLIENT_ID) {
      const authUrl = `${process.env.GOVBR_SSO_URL || "https://sso.staging.acesso.gov.br"}/authorize?response_type=code&client_id=${process.env.GOVBR_CLIENT_ID}&scope=openid+profile+email&redirect_uri=${encodeURIComponent(process.env.GOVBR_REDIRECT_URI || "http://localhost:3000/api/auth/govbr/callback")}&state=${state}`;
      return res.redirect(authUrl);
    }
    return res.redirect(`/govbr-login-simulator?state=${state}`);
  });
  app.get("/govbr-login-simulator", (req, res) => {
    const { state } = req.query;
    const profilesHTML = SEED_PROFILES.map((p) => `
      <div class="profile-card border border-slate-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#1351b4] hover:bg-slate-50 transition duration-150" onclick="selectProfile('${p.id}', '${p.name}', '${p.role}', '${p.clearance}')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white ${p.avatarColor.includes("bg-[") ? "bg-[#1351b4]" : p.avatarColor}">
            ${p.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
          </div>
          <div>
            <h4 class="font-extrabold text-slate-800 text-sm">${p.name}</h4>
            <p class="text-xs text-slate-500">${p.role}</p>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">${p.badgeText}</span>
      </div>
    `).join("");
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSO gov.br - Identifica\xE7\xE3o de Servi\xE7os P\xFAblicos</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;850&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; }
          .gov-blue-btn { background-color: #1351b4; }
          .gov-blue-btn:hover { background-color: #0c3c88; }
        </style>
      </head>
      <body class="bg-slate-50 min-h-screen flex flex-col justify-between">
        <!-- Gov Header -->
        <header class="bg-white border-b border-slate-200 py-3 shadow-sm">
          <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black tracking-tight text-[#1351b4]">gov<span class="text-[#00c010]">.</span>br</span>
              <span class="text-xs text-slate-400 font-bold border-l border-slate-200 pl-2">Servi\xE7o de Autentica\xE7\xE3o Federada</span>
            </div>
            <span class="text-xs text-slate-500">\xD3rg\xE3o Receptor: <strong class="text-slate-700">AECI/MTE - \xD3RBITA</strong></span>
          </div>
        </header>

        <!-- Main Form -->
        <main class="max-w-md mx-auto w-full my-auto px-4 py-8">
          <div class="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">Identifique-se no gov.br</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              O Portal \xD3RBITA solicita autentica\xE7\xE3o de identidade oficial para assinatura digital de auditoria.
            </p>

            <form action="/api/auth/govbr/callback" method="GET" class="mt-6 space-y-5" id="ssoForm">
              <input type="hidden" name="state" value="${state || ""}">
              <input type="hidden" name="profileId" id="profileId" value="">
              
              <div class="space-y-3" id="profileSelectionContainer">
                <label class="text-xs font-black text-slate-700 uppercase tracking-wider block">Escolha sua Persona Funcional (Simula\xE7\xE3o gov.br):</label>
                <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  ${profilesHTML}
                </div>
              </div>

              <!-- CPF Field -->
              <div class="space-y-1.5 hidden" id="cpfContainer">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-black text-slate-700 uppercase tracking-wider block">CPF do Servidor:</label>
                  <button type="button" class="text-xs text-[#1351b4] font-bold hover:underline" onclick="goBack()">Alterar Cargo</button>
                </div>
                <div class="relative">
                  <input type="text" id="cpfInput" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold tracking-wider bg-slate-50 focus:border-[#1351b4] focus:ring-1 focus:ring-[#1351b4] focus:outline-none" readonly>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                  <p class="text-[11px] text-amber-700 font-medium leading-normal">
                    \u{1F4CC} <strong>Simulador OIDC / PKCE Integrado</strong>
                    <span class="block mt-0.5 font-normal text-slate-600">Ao clicar em 'Autorizar Acesso', o servidor do \xD3RBITA receber\xE1 o token JWT criptografado da identidade selecionada.</span>
                  </p>
                </div>
              </div>

              <button type="submit" id="submitBtn" class="w-full gov-blue-btn text-white py-3 rounded-2xl font-black text-sm transition duration-150 cursor-not-allowed shadow-md shadow-blue-200" disabled>
                Entrar com gov.br
              </button>
            </form>
          </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
            <span>\xA9 Secretaria de Governo Digital \u2014 Minist\xE9rio da Gest\xE3o e da Inova\xE7\xE3o em Servi\xE7os P\xFAblicos</span>
            <div class="flex gap-4">
              <a href="#" class="hover:underline">Termos de uso</a>
              <a href="#" class="hover:underline">Privacidade</a>
            </div>
          </div>
        </footer>

        <script>
          function selectProfile(id, name, role, clearance) {
            document.getElementById('profileId').value = id;
            
            let mockCPF = "000.000.000-00";
            if (id === "alessandro") mockCPF = "416.526.491-15";
            
            document.getElementById('cpfInput').value = mockCPF;
            
            document.getElementById('profileSelectionContainer').classList.add('hidden');
            document.getElementById('cpfContainer').classList.remove('hidden');
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.classList.remove('cursor-not-allowed');
            submitBtn.innerHTML = "Autorizar Acesso como " + name.split(" ")[0];
          }

          function goBack() {
            document.getElementById('profileSelectionContainer').classList.remove('hidden');
            document.getElementById('cpfContainer').classList.add('hidden');
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.classList.add('cursor-not-allowed');
            submitBtn.innerHTML = "Entrar com gov.br";
          }
        </script>
      </body>
      </html>
    `;
    return res.send(html);
  });
  app.get("/api/auth/govbr/callback", (req, res) => {
    const { profileId } = req.query;
    const matchedProfile = SEED_PROFILES.find((p) => p.id === profileId) || SEED_PROFILES[0];
    req.session.user = {
      id: matchedProfile.id,
      name: matchedProfile.name,
      role: matchedProfile.role,
      email: matchedProfile.email,
      register: matchedProfile.register,
      clearance: matchedProfile.clearance,
      avatarColor: matchedProfile.avatarColor,
      badgeText: matchedProfile.badgeText
    };
    return res.redirect("/");
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "ORBITA.AECI", localTime: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.use("/api", acordaoRoutes_default);
  app.use("/api", comunicacoesRoutes_default);
  app.use("/api", tceRoutes_default);
  app.use("/api", eticaRoutes_default);
  app.use("/api", scdpRoutes_default);
  app.use("/api", cguRoutes_default);
  app.use("/api", cguAuditoriasRoutes_default);
  app.use("/api", superintendenciasRoutes_default);
  app.use("/api", contratosRoutes_default);
  app.use("/api", viaturasRoutes_default);
  app.use("/api/rol-responsaveis", rolLegacyRoutes_default);
  app.use("/api/rol", rolRoutes_default);
  app.use("/api", dashboardRoutes_default);
  setInterval(() => {
    runImportCguAuditorias("SISTEMA_AGENDADO").catch(console.error);
  }, 6048e5);
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled assets...");
    const distPath = import_path9.default.join(process.cwd(), "dist");
    app.use(import_express14.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path9.default.join(distPath, "index.html"));
    });
  }
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ORBITA.AECI server is running successfully on port ${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Critical error starting ORBITA.AECI Express backend:", err);
});
//# sourceMappingURL=server.cjs.map
