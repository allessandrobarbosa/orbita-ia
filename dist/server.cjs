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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/backend/utils/tcuApi.ts
async function fetchAcordaoCompleto(year) {
  const tempPath = import_path3.default.join(TCU_DIR2, `cache-acordao-completo-${year}.csv`);
  if (import_fs3.default.existsSync(tempPath)) {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    if (year < currentYear) {
      console.log(`[TCU CSV] Found permanent cache for consolidated year ${year}.`);
      return tempPath;
    }
    const stats = import_fs3.default.statSync(tempPath);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1e3;
    if (now - stats.mtimeMs < sevenDaysMs) {
      console.log(`[TCU CSV] Found valid 7-day cache for current year ${year}.`);
      return tempPath;
    } else {
      console.log(`[TCU CSV] Cache for current year ${year} expired. Re-downloading...`);
    }
  }
  const onlineUrl = `https://sites.tcu.gov.br/dados-abertos/jurisprudencia/arquivos/acordao-completo/acordao-completo-${year}.csv`;
  console.log(`[TCU CSV] Downloading ${onlineUrl} to temporary file ${tempPath}...`);
  const inProgressPath = tempPath + ".tmp";
  try {
    const response = await fetch(onlineUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/csv,application/csv,text/plain,*/*"
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error("Response body is null");
    }
    const fileStream = import_fs3.default.createWriteStream(inProgressPath);
    const { Readable } = require("stream");
    await new Promise((resolve, reject) => {
      Readable.fromWeb(response.body).pipe(fileStream).on("finish", () => {
        fileStream.close();
        resolve(void 0);
      }).on("error", (err) => {
        fileStream.close();
        reject(err);
      });
    });
    import_fs3.default.renameSync(inProgressPath, tempPath);
    console.log(`[TCU CSV] Download completed for year ${year}.`);
    return tempPath;
  } catch (err) {
    console.error(`[TCU CSV] Failed to download temporary CSV for year ${year}:`, err.message);
    if (import_fs3.default.existsSync(inProgressPath)) {
      try {
        import_fs3.default.unlinkSync(inProgressPath);
      } catch (e) {
      }
    }
    if (import_fs3.default.existsSync(tempPath)) {
      console.log(`[TCU CSV] Falling back to existing expired cache.`);
      return tempPath;
    }
    throw err;
  }
}
var import_fs3, import_path3, TCU_DIR2;
var init_tcuApi = __esm({
  "src/backend/utils/tcuApi.ts"() {
    import_fs3 = __toESM(require("fs"), 1);
    import_path3 = __toESM(require("path"), 1);
    TCU_DIR2 = import_path3.default.resolve(process.cwd(), "data", "tcu", "acordaos");
  }
});

// src/backend/utils/tcuCsvParser.ts
var tcuCsvParser_exports = {};
__export(tcuCsvParser_exports, {
  getComplementaryDataBulk: () => getComplementaryDataBulk,
  getInteiroTeorFromCache: () => getInteiroTeorFromCache
});
function normalizeHeaderName(header) {
  return header.toLowerCase().replace(/[áàâã]/g, "a").replace(/[éê]/g, "e").replace(/[í]/g, "i").replace(/[óôõ]/g, "o").replace(/[úü]/g, "u").replace(/[ç]/g, "c").replace(/[^a-z0-9]/g, "");
}
function parseCSVLine(line, delimiter = ",") {
  const result = [];
  let currentVal = "";
  let insideQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
      if (insideQuotes && line[i + 1] === '"') {
        currentVal += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(currentVal.trim());
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  return result;
}
async function getInteiroTeorFromCache(numAcordao, anoAcordao) {
  try {
    const cachePath = await fetchAcordaoCompleto(anoAcordao);
    if (!import_fs4.default.existsSync(cachePath)) return null;
    console.log(`[getInteiroTeor] Parsing ${cachePath} for ${numAcordao}/${anoAcordao}...`);
    const fileStream = import_fs4.default.createReadStream(cachePath, { encoding: "utf8" });
    const rl = import_readline.default.createInterface({ input: fileStream, crlfDelay: Infinity });
    let headers = [];
    let normHeaders = [];
    let colNum = -1;
    let colAno = -1;
    let colInteiro = -1;
    let isFirstLine = true;
    let foundInteiro = null;
    for await (const line of rl) {
      if (isFirstLine) {
        headers = parseCSVLine(line, "|");
        normHeaders = headers.map(normalizeHeaderName);
        colNum = normHeaders.indexOf("numacordao") !== -1 ? normHeaders.indexOf("numacordao") : normHeaders.indexOf("numero");
        colAno = normHeaders.indexOf("anoacordao") !== -1 ? normHeaders.indexOf("anoacordao") : normHeaders.indexOf("ano");
        colInteiro = normHeaders.indexOf("inteiroteor") !== -1 ? normHeaders.indexOf("inteiroteor") : normHeaders.indexOf("acordao");
        isFirstLine = false;
        if (colNum === -1 || colAno === -1 || colInteiro === -1) {
          console.log(`[getInteiroTeor] Could not find required columns. Headers: ${normHeaders.join(",")}`);
          rl.close();
          break;
        }
        continue;
      }
      if (!line.trim()) continue;
      const parts = parseCSVLine(line, "|");
      if (parts.length > colNum && parts.length > colAno) {
        if (parts[colNum] == String(numAcordao) && parts[colAno] == String(anoAcordao)) {
          console.log(`[getInteiroTeor] Found Inteiro Teor for ${numAcordao}/${anoAcordao}!`);
          foundInteiro = parts[colInteiro] || null;
          rl.close();
          break;
        }
      }
    }
    return foundInteiro;
  } catch (err) {
    console.error(`[getInteiroTeor] Error:`, err);
    return null;
  }
}
async function getComplementaryDataBulk(anoAcordao, numsToFind) {
  const result = /* @__PURE__ */ new Map();
  try {
    const cachePath = await fetchAcordaoCompleto(anoAcordao);
    if (!import_fs4.default.existsSync(cachePath)) return result;
    console.log(`[getInteiroTeorBulk] Parsing ${cachePath} to find ${numsToFind.size} ac\xF3rd\xE3os...`);
    const fileStream = import_fs4.default.createReadStream(cachePath, { encoding: "utf8" });
    const rl = import_readline.default.createInterface({ input: fileStream, crlfDelay: Infinity });
    let headers = [];
    let normHeaders = [];
    let colNum = -1;
    let colAno = -1;
    let colIndices = {};
    let isFirstLine = true;
    let currentLine = "";
    for await (const line of rl) {
      if (currentLine) {
        currentLine += "\n" + line;
      } else {
        currentLine = line;
      }
      const quoteCount = (currentLine.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        continue;
      }
      const fullLine = currentLine;
      currentLine = "";
      if (isFirstLine) {
        headers = parseCSVLine(fullLine, "|");
        normHeaders = headers.map(normalizeHeaderName);
        colNum = normHeaders.indexOf("numacordao") !== -1 ? normHeaders.indexOf("numacordao") : normHeaders.indexOf("numero");
        colAno = normHeaders.indexOf("anoacordao") !== -1 ? normHeaders.indexOf("anoacordao") : normHeaders.indexOf("ano");
        colIndices = {
          acordao: normHeaders.indexOf("inteiroteor") !== -1 ? normHeaders.indexOf("inteiroteor") : normHeaders.indexOf("acordao"),
          num_ata: normHeaders.indexOf("numata"),
          situacao: normHeaders.indexOf("situacao"),
          proc: normHeaders.indexOf("proc") !== -1 ? normHeaders.indexOf("proc") : normHeaders.indexOf("processo"),
          acordaos_relacionados: normHeaders.indexOf("acordaosrelacionados"),
          interessados: normHeaders.indexOf("interessados"),
          entidade: normHeaders.indexOf("entidade"),
          unidade_tecnica: normHeaders.indexOf("unidadetecnica"),
          assunto: normHeaders.indexOf("assunto"),
          sumario: normHeaders.indexOf("sumario"),
          decisao: normHeaders.indexOf("decisao")
        };
        isFirstLine = false;
        continue;
      }
      if (!fullLine.trim()) continue;
      const parts = parseCSVLine(fullLine, "|");
      if (parts.length > colNum && parts.length > colAno) {
        if (parts[colAno] == String(anoAcordao) && numsToFind.has(parts[colNum])) {
          const getPart = (idx) => idx !== -1 && parts[idx] ? parts[idx] : "";
          result.set(parts[colNum], {
            acordao: getPart(colIndices.acordao),
            num_ata: getPart(colIndices.num_ata),
            situacao: getPart(colIndices.situacao) || "OFICIALIZADO",
            proc: getPart(colIndices.proc),
            acordaos_relacionados: getPart(colIndices.acordaos_relacionados),
            interessados: getPart(colIndices.interessados),
            entidade: getPart(colIndices.entidade),
            unidade_tecnica: getPart(colIndices.unidade_tecnica),
            assunto: getPart(colIndices.assunto),
            sumario: getPart(colIndices.sumario),
            decisao: getPart(colIndices.decisao)
          });
          if (result.size === numsToFind.size) {
            console.log(`[getComplementaryDataBulk] Found all requested ac\xF3rd\xE3os para o ano ${anoAcordao}!`);
            rl.close();
            break;
          }
        }
      }
    }
  } catch (err) {
    console.error(`[getComplementaryDataBulk] Error:`, err);
  }
  return result;
}
var import_fs4, import_readline;
var init_tcuCsvParser = __esm({
  "src/backend/utils/tcuCsvParser.ts"() {
    import_fs4 = __toESM(require("fs"), 1);
    import_readline = __toESM(require("readline"), 1);
    init_tcuApi();
  }
});

// server.ts
var import_express13 = __toESM(require("express"), 1);
var import_path6 = __toESM(require("path"), 1);
var import_fs7 = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv3 = __toESM(require("dotenv"), 1);
var import_express_session = __toESM(require("express-session"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_pg2 = __toESM(require("pg"), 1);

// src/backend/routes/comunicacoesRoutes.ts
var import_express = require("express");

// src/backend/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_pg = __toESM(require("pg"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);

// src/data/seed_db.ts
var SEED_PROFILES = [
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

// src/backend/db.ts
import_dotenv.default.config();
var pool = new import_pg.default.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 2e3
});
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_PATH = import_path.default.join(DATA_DIR, "orbita_db.json");
var TCU_DIR = import_path.default.join(DATA_DIR, "tcu");
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
if (!import_fs.default.existsSync(TCU_DIR)) {
  import_fs.default.mkdirSync(TCU_DIR, { recursive: true });
}

// src/backend/routes/comunicacoesRoutes.ts
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
    const mapped = result.rows.map((row) => ({
      KEY: row.key,
      COMUNICACAO: cleanEncoding(row.comunicacao),
      DESTINATARIO: cleanEncoding(row.destinatario),
      CONTATO: cleanEncoding(row.contato),
      UNIDADE_EMITENTE: cleanEncoding(row.unidade_emitente),
      PROCESSO: cleanEncoding(row.processo),
      DATA_EXPEDICAO: row.data_expedicao,
      DATA_RESPOSTA: row.data_resposta,
      ANO: row.ano,
      CARECE_RESPOSTA: row.carece_resposta,
      PRAZO_DIAS: row.prazo_dias,
      RESPOSTA_ENVIADA_INTERNAMENTE: row.resposta_enviada_internamente,
      UNIDADE_EXECUTORA: cleanEncoding(row.unidade_executora),
      PROCESSO_SEI: cleanEncoding(row.processo_sei),
      DESTINACAO: cleanEncoding(row.destinacao),
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao
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
      result.rows.forEach((row) => {
        if (row.inserted) importedCount++;
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
var router2 = import_express2.default.Router();
async function getLegacyData() {
  const result = await pool.query("SELECT * FROM rol_responsaveis_legado");
  return result.rows;
}
router2.get("/pessoas", async (req, res) => {
  res.json([]);
});
router2.get("/unidades", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rol_unidades ORDER BY sigla");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unidades." });
  }
});
router2.get("/cargos", async (req, res) => {
  try {
    const legacy = await getLegacyData();
    const cargosSet = new Set(legacy.map((r) => r.cargo).filter(Boolean));
    const cargos = Array.from(cargosSet).map((c, i) => ({ id_cargo: i + 1, nome: c }));
    res.json(cargos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cargos." });
  }
});
router2.get("/mandatos", async (req, res) => {
  try {
    const legacy = await getLegacyData();
    const mandatos = legacy.map((r) => ({
      id_registro: r.id,
      is_substituto: false,
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
      nome_unidade: r.unidade,
      tipo_responsabilidade: "Titular",
      status: r.status
    }));
    res.json(mandatos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mandatos." });
  }
});
router2.get("/afastamentos", async (req, res) => {
  res.json([]);
});
var rolRoutes_default = router2;

// src/backend/routes/acordaoRoutes.ts
var import_express3 = __toESM(require("express"), 1);
var import_fs5 = __toESM(require("fs"), 1);
var import_path4 = __toESM(require("path"), 1);
init_tcuCsvParser();

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
  } catch (err) {
    console.error("Erro na extra\xE7\xE3o com Gemini SDK:", err);
    throw new Error("Falha ao comunicar com Google Gemini: " + err.message);
  }
}

// src/backend/utils/backgroundProcessor.ts
var queue = [];
var isProcessing = false;
function enqueueAcordaosForAnalysis(keys) {
  const newKeys = keys.filter((k) => !queue.includes(k));
  queue.push(...newKeys);
  if (!isProcessing && queue.length > 0) {
    processQueue();
  }
}
async function processQueue() {
  isProcessing = true;
  while (queue.length > 0) {
    const key = queue[0];
    console.log(`[Background] Processando Ac\xF3rd\xE3o: ${key} (${queue.length} restantes)`);
    let retryWait = 1e4;
    let success = false;
    try {
      await processSingleAcordao(key);
      success = true;
    } catch (err) {
      console.error(`[Background] Erro ao processar ${key}:`, err.message);
      if (err.message && err.message.includes("429")) {
        console.log(`[Background] Rate limit (429) detectado. Aguardando 60 segundos antes de tentar novamente.`);
        retryWait = 6e4;
      } else {
        success = true;
      }
    }
    if (success) {
      queue.shift();
    }
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryWait));
    }
  }
  isProcessing = false;
  console.log(`[Background] Processamento conclu\xEDdo. Fila vazia.`);
}
async function processSingleAcordao(key) {
  const acResult = await pool.query("SELECT * FROM tcu_acordaos WHERE key = $1", [key]);
  if (acResult.rows.length === 0) {
    throw new Error("Ac\xF3rd\xE3o n\xE3o encontrado no Postgres.");
  }
  const acordao = acResult.rows[0];
  let acordaoTeor = acordao.acordao;
  if (!acordaoTeor || acordaoTeor.trim() === "") {
    console.log(`[Background] Ac\xF3rd\xE3o ${acordao.num_acordao}/${acordao.ano_acordao} n\xE3o possui Inteiro Teor no banco. Tentando buscar no cache da API TCU...`);
    const { getInteiroTeorFromCache: getInteiroTeorFromCache3 } = (init_tcuCsvParser(), __toCommonJS(tcuCsvParser_exports));
    const fetchedTeor = await getInteiroTeorFromCache3(acordao.num_acordao, acordao.ano_acordao);
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
var DATA_DIR2 = import_path4.default.join(process.cwd(), "data");
var router3 = import_express3.default.Router();
router3.post("/acordaos/sync-local", async (req, res) => {
  const TCU_DIR4 = import_path4.default.join(process.cwd(), "data", "tcu", "acordaos");
  if (!import_fs5.default.existsSync(TCU_DIR4)) {
    return res.status(400).json({ success: false, message: "Diret\xF3rio data/tcu/acordaos n\xE3o encontrado." });
  }
  const files = import_fs5.default.readdirSync(TCU_DIR4);
  const csvFiles = files.filter((f) => f.toLowerCase().endsWith(".csv") && !f.toLowerCase().includes("cache"));
  if (csvFiles.length === 0) {
    return res.json({ success: false, message: "Nenhum arquivo .csv encontrado na pasta data/tcu/acordaos/." });
  }
  try {
    let imported = 0;
    let updated = 0;
    for (const file of csvFiles) {
      console.log(`[SYNC-LOCAL-ACORDAOS] Iniciando processamento do arquivo: ${file}`);
      console.time(`Processamento ${file}`);
      const filePath = import_path4.default.join(TCU_DIR4, file);
      const content = import_fs5.default.readFileSync(filePath, "latin1");
      const lines = content.split("\n");
      console.log(`[SYNC-LOCAL-ACORDAOS] Encontradas ${lines.length} linhas em ${file}`);
      let skippedLines = 0;
      const parsedRows = [];
      const missingByYear = /* @__PURE__ */ new Map();
      const seenKeysInFile = /* @__PURE__ */ new Set();
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          skippedLines++;
          continue;
        }
        const parts = line.split('""').map((p) => p.replace(/"/g, ""));
        if (parts.length < 5) continue;
        const acordaoStr = parts[0];
        const match = acordaoStr.match(/(\d+)\/(\d{4})/);
        if (!match) continue;
        const numAcordao = Number(match[1]);
        const anoAcordao = Number(match[2]);
        const key = `AC-${numAcordao}-${anoAcordao}`;
        if (seenKeysInFile.has(key)) {
          skippedLines++;
          continue;
        }
        seenKeysInFile.add(key);
        const check = await pool.query("SELECT key, acordao FROM tcu_acordaos WHERE num_acordao = $1 AND ano_acordao = $2", [numAcordao, anoAcordao]);
        let teor = check.rows.length > 0 ? check.rows[0].acordao : null;
        parsedRows.push({
          numAcordao,
          anoAcordao,
          key,
          parts,
          hasDb: check.rows.length > 0,
          dbKey: check.rows.length > 0 ? check.rows[0].key : null,
          teor
        });
        if (!teor) {
          if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, /* @__PURE__ */ new Set());
          missingByYear.get(anoAcordao).add(String(numAcordao));
        }
      }
      const fetchedTeores = /* @__PURE__ */ new Map();
      for (const [ano, numsSet] of missingByYear.entries()) {
        const mapForYear = await getComplementaryDataBulk(ano, numsSet);
        fetchedTeores.set(ano, mapForYear);
      }
      for (const row of parsedRows) {
        const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
        let compData = null;
        if (!row.teor && fetchedTeores.has(row.anoAcordao)) {
          compData = fetchedTeores.get(row.anoAcordao).get(String(row.numAcordao)) || null;
        }
        if (row.hasDb) {
          if (compData) {
            await pool.query(`
              UPDATE tcu_acordaos SET
                colegiado = $2, data_sessao = $3,
                tipo_processo = $4, relator = $5,
                ultima_atualizacao = $6, acordao = $7,
                num_ata = $8, situacao = $9, proc = $10,
                acordaos_relacionados = $11, interessados = $12,
                entidade = $13, unidade_tecnica = $14,
                assunto = $15, sumario = $16, decisao = $17
              WHERE key = $1
            `, [
              row.dbKey,
              row.parts[2],
              row.parts[1],
              row.parts[4],
              row.parts[5],
              updatedAt,
              compData.acordao,
              compData.num_ata,
              compData.situacao,
              compData.proc,
              compData.acordaos_relacionados,
              compData.interessados,
              compData.entidade,
              compData.unidade_tecnica,
              compData.assunto,
              compData.sumario,
              compData.decisao
            ]);
          } else {
            await pool.query(`
              UPDATE tcu_acordaos SET
                colegiado = $2, data_sessao = $3,
                tipo_processo = $4, relator = $5,
                ultima_atualizacao = $6
              WHERE key = $1
            `, [
              row.dbKey,
              row.parts[2],
              row.parts[1],
              row.parts[4],
              row.parts[5],
              updatedAt
            ]);
          }
          updated++;
        } else {
          const fallbackTeor = compData?.acordao || row.teor || null;
          await pool.query(`
            INSERT INTO tcu_acordaos (
              key, titulo, num_acordao, ano_acordao, colegiado, data_sessao,
              situacao, tipo_processo, relator, status_monitoramento, ultima_atualizacao, 
              acordao, num_ata, proc, acordaos_relacionados, interessados, 
              entidade, unidade_tecnica, assunto, sumario, decisao
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
              $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            )
          `, [
            row.key,
            `AC\xD3RD\xC3O ${row.numAcordao}/${row.anoAcordao} - ${row.parts[2].toUpperCase()}`,
            row.numAcordao,
            row.anoAcordao,
            row.parts[2],
            row.parts[1],
            compData?.situacao || "OFICIALIZADO",
            row.parts[4],
            row.parts[5],
            "Pendente",
            updatedAt,
            fallbackTeor,
            compData?.num_ata || null,
            compData?.proc || null,
            compData?.acordaos_relacionados || null,
            compData?.interessados || null,
            compData?.entidade || null,
            compData?.unidade_tecnica || row.parts[6] || null,
            compData?.assunto || null,
            compData?.sumario || null,
            compData?.decisao || null
          ]);
          imported++;
        }
      }
      console.log(`[SYNC-LOCAL-ACORDAOS] Conclu\xEDdo processamento de ${file}. Linhas puladas: ${skippedLines}`);
      console.timeEnd(`Processamento ${file}`);
    }
    console.log(`[SYNC-LOCAL-ACORDAOS] Sincroniza\xE7\xE3o finalizada. Importados: ${imported}, Atualizados: ${updated}`);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    try {
      const pendingRes = await pool.query(
        "SELECT key FROM tcu_acordaos WHERE ano_acordao = $1 AND status_monitoramento = 'Pendente' AND (ai_analysis_data IS NULL OR ai_analysis_data::text = '{}' OR ai_analysis_data::text = 'null')",
        [currentYear]
      );
      if (pendingRes.rows.length > 0) {
        const keysToProcess = pendingRes.rows.map((r) => r.key);
        enqueueAcordaosForAnalysis(keysToProcess);
        console.log(`[Sync] Enfileirados ${keysToProcess.length} ac\xF3rd\xE3os de ${currentYear} para processamento de IA em background.`);
      }
    } catch (bgErr) {
      console.error("Erro ao enfileirar ac\xF3rd\xE3os para IA:", bgErr);
    }
    res.json({
      success: true,
      message: `Sincroniza\xE7\xE3o conclu\xEDda: ${imported} novos, ${updated} atualizados.`,
      report: [{ file: "Geral", imported, updated, skipped: 0 }]
    });
  } catch (err) {
    console.error("Erro na sincronizacao local:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});
function cleanEncoding2(text) {
  if (!text) return "";
  let decoded = text;
  if (decoded.includes("\xC3\xA2") || decoded.includes("\xC3\xA7") || decoded.includes("\xC3\xA3") || decoded.includes("\xC3\xB3")) {
    try {
      decoded = Buffer.from(decoded, "binary").toString("utf8");
    } catch (e) {
    }
  }
  return decoded;
}
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
    `);
    const mapped = result.rows.map((row) => ({
      KEY: row.key,
      TITULO: cleanEncoding2(row.titulo),
      NUMACORDAO: row.num_acordao,
      ANOACORDAO: row.ano_acordao,
      NUMATA: row.num_ata,
      COLEGIADO: cleanEncoding2(row.colegiado),
      DATASESSAO: row.data_sessao,
      SITUACAO: row.situacao,
      PROC: row.proc,
      ACORDAOSRELACIONADOS: row.acordaos_relacionados,
      TIPOPROCESSO: row.tipo_processo,
      INTERESSADOS: cleanEncoding2(row.interessados),
      ENTIDADE: cleanEncoding2(row.entidade),
      UNIDADETECNICA: cleanEncoding2(row.unidade_tecnica),
      RELATOR: cleanEncoding2(row.relator),
      ASSUNTO: cleanEncoding2(row.assunto),
      SUMARIO: cleanEncoding2(row.sumario),
      ACORDAO: "",
      // Omitted to save bandwidth and memory
      DECISAO: cleanEncoding2(row.decisao),
      RECOMENDACOES: cleanEncoding2(row.recomendacoes),
      DETERMINACOES: cleanEncoding2(row.determinacoes),
      RECOMENDACOES_DETERMINACOES_UNIFICADO: cleanEncoding2(row.recomendacoes_determinacoes_unificado),
      STATUS_MONITORAMENTO: row.status_monitoramento,
      RESPONSAVEL_INTERNO: row.responsavel_interno,
      PRAZO_LIMITE: row.prazo_limite,
      OBSERVACOES: cleanEncoding2(row.observacoes),
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao,
      aiAnalysisData: row.ai_analysis_data
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching Ac\xF3rd\xE3os from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch Ac\xF3rd\xE3os." });
  }
});
function cleanTeor(rawTeor) {
  if (!rawTeor) return "";
  let text = rawTeor;
  if (text.includes("\xC3\xA2") || text.includes("\xC3\xA7") || text.includes("\xC3\xA3") || text.includes("\xC3\xB3")) {
    try {
      text = Buffer.from(text, "binary").toString("utf8");
    } catch (e) {
    }
  }
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<p[^>]*>/gi, "\n\n");
  text = text.replace(/<\/p>/gi, "");
  text = text.replace(/<[^>]*>?/gm, "");
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
    const result = await pool.query("SELECT acordao FROM tcu_acordaos WHERE key = $1", [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado." });
    }
    const cleanText = cleanTeor(result.rows[0].acordao || "");
    res.json({ acordao: cleanText });
  } catch (err) {
    console.error("Error fetching teor from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch teor." });
  }
});
router3.post("/acordaos/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
    const query = `
      UPDATE tcu_acordaos SET
        titulo = $2, num_acordao = $3, ano_acordao = $4, num_ata = $5,
        colegiado = $6, data_sessao = $7, situacao = $8, proc = $9,
        acordaos_relacionados = $10, tipo_processo = $11, interessados = $12,
        entidade = $13, unidade_tecnica = $14, relator = $15, assunto = $16,
        sumario = $17, acordao = $18, decisao = $19, recomendacoes = $20,
        determinacoes = $21, recomendacoes_determinacoes_unificado = $22, status_monitoramento = $23,
        responsavel_interno = $24, prazo_limite = $25, observacoes = $26,
        ultima_atualizacao = $27, ai_analysis_data = $28
      WHERE key = $1 RETURNING *
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
      updated.ACORDAO,
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
      res.status(404).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado no Postgres." });
    }
  } catch (err) {
    console.error("Error updating Ac\xF3rd\xE3o in Postgres:", err);
    res.status(500).json({ error: "Failed to update Ac\xF3rd\xE3o." });
  }
});
router3.delete("/acordaos/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query("DELETE FROM tcu_acordaos WHERE key = $1", [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting Ac\xF3rd\xE3o from Postgres:", err);
    res.status(500).json({ error: "Failed to delete Ac\xF3rd\xE3o." });
  }
});
router3.post("/acordaos/:key/analisar-ressarcimento", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await processSingleAcordao(key);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("[AI Dossie API] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});
router3.post("/acordaos/aprender", (req, res) => {
  const { tipo, palavra } = req.body;
  if (!tipo || !palavra) {
    return res.status(400).json({ error: "Faltam par\xE2metros tipo ou palavra." });
  }
  const DICT_PATH = import_path4.default.join(DATA_DIR2, "orbita_dictionary.json");
  try {
    let dict = {};
    if (import_fs5.default.existsSync(DICT_PATH)) {
      dict = JSON.parse(import_fs5.default.readFileSync(DICT_PATH, "utf-8"));
    }
    const key = `keywords${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    if (!dict[key]) {
      dict[key] = [];
    }
    const kw = palavra.toLowerCase().trim();
    if (!dict[key].includes(kw)) {
      dict[key].push(kw);
      import_fs5.default.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2), "utf-8");
    }
    return res.json({ success: true, message: `Express\xE3o '${kw}' aprendida com sucesso para ${tipo}!` });
  } catch (err) {
    console.error("Erro ao aprender nova palavra:", err);
    return res.status(500).json({ error: "Falha ao salvar no dicion\xE1rio." });
  }
});
router3.post("/acordaos/:key/auditoria-profunda", async (req, res) => {
  const { key } = req.params;
  try {
    const acResult = await pool.query("SELECT * FROM tcu_acordaos WHERE key = $1", [key]);
    if (acResult.rows.length === 0) {
      return res.status(404).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado." });
    }
    const acordao = acResult.rows[0];
    if (!acordao.acordao || acordao.acordao.trim() === "") {
      return res.status(400).json({ error: "Ac\xF3rd\xE3o n\xE3o encontrado ou sem inteiro teor." });
    }
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chave da API do Gemini n\xE3o configurada." });
    }
    const ai2 = new import_genai2.GoogleGenAI({ apiKey });
    const textChunk = acordao.acordao.substring(0, 25e3);
    const prompt = `
# ROLE E OBJETIVO
Voc\xEA \xE9 o motor de extra\xE7\xE3o sem\xE2ntica e an\xE1lise de conformidade do sistema \xD3RBITA. 
Responda \xE0s seguintes perguntas ou instru\xE7\xF5es do usu\xE1rio com base no texto abaixo.

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
    return res.status(500).json({ error: "Falha na an\xE1lise de intelig\xEAncia artificial profunda." });
  }
});
var acordaoRoutes_default = router3;

// src/backend/routes/tceRoutes.ts
var import_express4 = __toESM(require("express"), 1);
var import_fs6 = __toESM(require("fs"), 1);
var import_path5 = __toESM(require("path"), 1);
var router4 = import_express4.default.Router();
router4.post("/tces/sync-local", async (req, res) => {
  const TCE_DIR = import_path5.default.join(process.cwd(), "data", "tcu", "tces");
  if (!import_fs6.default.existsSync(TCE_DIR)) {
    return res.status(400).json({ success: false, message: "Diret\xF3rio data/tcu/tces n\xE3o encontrado." });
  }
  const files = import_fs6.default.readdirSync(TCE_DIR);
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
    const parseCSVRobust = (csvText, delimiter) => {
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
    for (const file of csvFiles) {
      console.log(`[SYNC-LOCAL-TCES] Iniciando processamento do arquivo: ${file}`);
      console.time(`Processamento ${file}`);
      const isMapping = file.toLowerCase().includes("acordao") || file.toLowerCase().includes("ac\xF3rd\xE3o") || file.toLowerCase().includes("mapping");
      const filePath = import_path5.default.join(TCE_DIR, file);
      let contentStr = import_fs6.default.readFileSync(filePath, "latin1");
      if (!contentStr || contentStr.trim().length < 10) continue;
      const firstLineEnd = contentStr.indexOf("\n");
      const headerLine = firstLineEnd > 0 ? contentStr.substring(0, firstLineEnd) : contentStr;
      const semiCount = (headerLine.match(/;/g) || []).length;
      const commaCount = (headerLine.match(/,/g) || []).length;
      const tabCount = (headerLine.match(/\t/g) || []).length;
      let delimiter = ",";
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = "	";
      const allRows = parseCSVRobust(contentStr, delimiter);
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
          let acordaoVal = fields[colAcordao]?.trim();
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
function cleanEncoding3(text) {
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
    const mapped = result.rows.map((row) => ({
      id: row.id,
      NUMERO_ANO_TCE: cleanEncoding3(row.numero_ano_tce),
      PROCESSO_ADMINISTRATIVO: cleanEncoding3(row.processo_administrativo),
      MOTIVO_INSTAURACAO: cleanEncoding3(row.motivo_instauracao),
      SUBMOTIVO_INSTAURACAO: cleanEncoding3(row.submotivo_instauracao),
      DEBITO_ORIGINAL: cleanEncoding3(row.debito_original),
      DEBITO_ATUALIZADO: cleanEncoding3(row.debito_atualizado),
      DATA_ATUALIZACAO_DEBITO: cleanEncoding3(row.data_atualizacao_debito),
      ULTIMO_POSICIONAMENTO: cleanEncoding3(row.ultimo_posicionamento),
      TC: cleanEncoding3(row.tc),
      ESTADO_PROCESSO: cleanEncoding3(row.estado_processo),
      SITUACAO_PROCESSO: cleanEncoding3(row.situacao_processo),
      PRIMEIRO_JULGAMENTO: cleanEncoding3(row.primeiro_julgamento),
      ENCERRAMENTO: cleanEncoding3(row.encerramento),
      NUMERO_SIAFI: cleanEncoding3(row.numero_siafi),
      SIAFI_RESSARCIDO: cleanEncoding3(row.siafi_ressarcido),
      ANO: row.ano,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao
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
    const mapped = result.rows.map((row) => ({
      NUMERO_ANO_TCE: row.numero_ano_tce,
      ACORDAO_KEY: row.acordao_key
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
var tceRoutes_default = router4;

// src/backend/routes/eticaRoutes.ts
var import_express5 = __toESM(require("express"), 1);
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
var scdpRoutes_default = router6;

// src/backend/routes/cguRoutes.ts
var import_express7 = __toESM(require("express"), 1);
var router7 = import_express7.default.Router();
router7.get("/cgu", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cgu_demands");
    const mapped = result.rows.map((row) => ({
      idTarefa: row.id_tarefa,
      situacao: row.situacao,
      estado: row.estado,
      tituloTarefa: row.titulo_tarefa,
      dataInicio: row.data_inicio,
      dataFim: row.data_fim,
      dataLimite: row.data_limite,
      unidadeAuditada: row.unidade_auditada,
      unidadesAuditoria: row.unidades_auditoria,
      textoMonitoramento: row.texto_monitoramento,
      providencia: row.providencia,
      tipoUltimaManifestacao: row.tipo_ultima_manifestacao,
      textoUltimaManifestacao: row.texto_ultima_manifestacao,
      dataUltimaManifestacao: row.data_ultima_manifestacao,
      tipoUltimoPosicionamento: row.tipo_ultimo_posicionamento,
      textoUltimoPosicionamento: row.texto_ultimo_posicionamento,
      dataUltimoPosicionamento: row.data_ultimo_posicionamento,
      categoria: row.categoria,
      dataLimiteInicial: row.data_limite_inicial,
      ano: row.ano,
      ultimaAtualizacao: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching cgu demands:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router7.post("/cgu/update", async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating cgu:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router7.delete("/cgu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM cgu_demands WHERE id_tarefa = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting cgu:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router7.get("/cgu/reports", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cgu_reports");
    const mapped = result.rows.map((row) => ({
      idTarefa: row.id_tarefa,
      idAuditoria: row.id_auditoria,
      tituloAuditoria: row.titulo_auditoria,
      ano: row.ano,
      uf: row.uf,
      municipio: row.municipio,
      codigoMunicipio: row.codigo_municipio,
      assunto: row.assunto,
      dataPublicacao: row.data_publicacao,
      linkRelatorio: row.link_relatorio,
      localPdf: row.local_pdf,
      sumarioExecutivo: row.sumario_executivo,
      aiAbstract: row.ai_abstract,
      ultimaAtualizacao: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching cgu reports:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router7.delete("/cgu/reports/:idTarefa", async (req, res) => {
  try {
    await pool.query("DELETE FROM cgu_reports WHERE id_tarefa = $1", [req.params.idTarefa]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting cgu report:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
var cguRoutes_default = router7;

// src/backend/routes/superintendenciasRoutes.ts
var import_express8 = __toESM(require("express"), 1);
var router8 = import_express8.default.Router();
router8.get("/superintendencias", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM superintendencias");
    const mapped = result.rows.map((row) => ({
      uf: row.uf,
      capital: row.capital,
      superintendente: row.superintendente,
      cargo: row.cargo,
      endereco: row.endereco,
      contato: row.contato,
      email: row.email,
      substituto: row.substituto,
      emailSubstituto: row.email_substituto,
      cep: row.cep,
      latitude: row.latitude,
      longitude: row.longitude,
      demandasTCU: row.demandas_tcu,
      demandasCGU: row.demandas_cgu,
      demandasEtica: row.demandas_etica,
      statusGeral: row.status_geral
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching superintendencias:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
router8.put("/superintendencias/:uf", async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const updateData = req.body;
    res.json({ uf, ...updateData });
  } catch (error) {
    console.error("Error updating superintendencias:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});
var superintendenciasRoutes_default = router8;

// src/backend/routes/contratosRoutes.ts
var import_express9 = __toESM(require("express"), 1);
var router9 = import_express9.default.Router();
router9.get("/contratos", async (req, res) => {
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
router9.post("/contratos", async (req, res) => {
  const c = req.body;
  c.id = "C-" + Date.now();
  await pool.query(
    "INSERT INTO contratos (id, numero_contrato, empresa, cnpj, objeto, valor_anual, data_inicio, data_fim, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorAnual, c.dataInicio, c.dataFim, c.uf]
  );
  res.status(201).json(c);
});
router9.get("/contratos/:id/consumo", async (req, res) => {
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
var contratosRoutes_default = router9;

// src/backend/routes/viaturasRoutes.ts
var import_express10 = __toESM(require("express"), 1);
var router10 = import_express10.default.Router();
router10.get("/viaturas", async (req, res) => {
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
router10.post("/viaturas", async (req, res) => {
  const v = req.body;
  v.id = "V-" + Date.now();
  await pool.query(
    "INSERT INTO viaturas (id, placa, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [v.id, v.placa, v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status]
  );
  res.status(201).json(v);
});
router10.get("/viaturas/:id/abastecimentos", async (req, res) => {
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
router10.get("/viaturas/:id/manutencoes", async (req, res) => {
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
var viaturasRoutes_default = router10;

// src/backend/routes/rolLegacyRoutes.ts
var import_express11 = __toESM(require("express"), 1);
var router11 = import_express11.default.Router();
router11.get("/", async (req, res) => {
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
router11.post("/", async (req, res) => {
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
router11.put("/:id", async (req, res) => {
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
router11.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM rol_responsaveis_legado WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting rol legacy:", error);
    res.status(500).json({ error: "Failed to delete" });
  }
});
var rolLegacyRoutes_default = router11;

// src/backend/routes/dashboardRoutes.ts
var import_express12 = __toESM(require("express"), 1);
var router12 = import_express12.default.Router();
router12.get("/dashboard-stats", async (req, res) => {
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
var dashboardRoutes_default = router12;

// server.ts
import_dotenv3.default.config();
var govHubPool = new import_pg2.default.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://airflow:airflow@localhost:5432/postgres",
  max: 5,
  idleTimeoutMillis: 1e4,
  connectionTimeoutMillis: 2e3
  // Fast timeout so it fails quickly if GovHub docker is not running
});
var DATA_DIR3 = import_path6.default.join(process.cwd(), "data");
var DB_PATH2 = import_path6.default.join(DATA_DIR3, "orbita_db.json");
var TCU_DIR3 = import_path6.default.join(DATA_DIR3, "tcu");
if (!import_fs7.default.existsSync(DATA_DIR3)) {
  import_fs7.default.mkdirSync(DATA_DIR3, { recursive: true });
}
if (!import_fs7.default.existsSync(TCU_DIR3)) {
  import_fs7.default.mkdirSync(TCU_DIR3, { recursive: true });
}
var mockUsers = [...SEED_PROFILES];
async function startServer() {
  const app = (0, import_express13.default)();
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
  app.use(import_express13.default.json({ limit: "50mb" }));
  app.use(import_express13.default.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/auth/session", (req, res) => {
    if (req.session && req.session.user) {
      const data = { users: mockUsers };
      const freshUser = (data.users || []).find((u) => u.id === req.session.user.id);
      if (freshUser) {
        req.session.user = {
          id: freshUser.id,
          name: freshUser.name,
          role: freshUser.role,
          email: freshUser.email,
          register: freshUser.register,
          clearance: freshUser.clearance,
          avatarColor: freshUser.avatarColor,
          badgeText: freshUser.badgeText,
          allowedModules: freshUser.allowedModules
        };
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
    } else {
      return res.status(401).json({ error: "C\xF3digo PIN de assinatura inv\xE1lido para este perfil." });
    }
  });
  app.post("/api/auth/login-local", (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identificador e senha s\xE3o obrigat\xF3rios." });
    }
    const data = { users: mockUsers };
    const users = data.users || [];
    const cleanId = String(identifier || "").replace(/\D/g, "");
    console.log(`[Login Info] Incoming identifier: "${identifier}", cleanId: "${cleanId}", password: "${password}"`);
    const matchedProfile = users.find(
      (p) => p.email === identifier || p.id === identifier || p.cpf && p.cpf.replace(/\D/g, "") === cleanId
    );
    if (!matchedProfile) {
      console.log(`[Login Error] No matched profile for identifier: "${identifier}"`);
      return res.status(404).json({ error: `Credenciais inv\xE1lidas. CPF/Login n\xE3o localizado no banco: ${cleanId}` });
    }
    console.log(`[Login Info] Matched user: "${matchedProfile.id}" (CPF: "${matchedProfile.cpf}", status: "${matchedProfile.status}")`);
    if (matchedProfile.status && matchedProfile.status !== "ACTIVE") {
      return res.status(403).json({ error: "Usu\xE1rio n\xE3o est\xE1 ativo (status: " + matchedProfile.status + ")." });
    }
    const validPassword = matchedProfile.password || matchedProfile.pin;
    if (validPassword === password || matchedProfile.clearance === "PUBLIC") {
      req.session.user = {
        id: matchedProfile.id,
        name: matchedProfile.name,
        role: matchedProfile.role,
        email: matchedProfile.email,
        register: matchedProfile.register,
        clearance: matchedProfile.clearance,
        avatarColor: matchedProfile.avatarColor,
        badgeText: matchedProfile.badgeText,
        allowedModules: matchedProfile.allowedModules
      };
      return res.json({
        success: true,
        user: req.session.user,
        requiresPasswordChange: matchedProfile.requiresPasswordChange || false
      });
    } else {
      return res.status(401).json({ error: `Credenciais inv\xE1lidas. Senha incorreta para o usu\xE1rio: ${matchedProfile.id}` });
    }
  });
  app.post("/api/auth/request-access", (req, res) => {
    const { name, cpf, phone, email, unidade } = req.body;
    if (!name || !cpf || !email) {
      return res.status(400).json({ error: "Nome, CPF e E-mail s\xE3o obrigat\xF3rios." });
    }
    const data = { users: mockUsers };
    data.users = data.users || [];
    const cleanCpf = cpf.replace(/\D/g, "");
    const exists = data.users.find((p) => p.email === email || p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf);
    if (exists) {
      return res.status(400).json({ error: "Usu\xE1rio com este E-mail ou CPF j\xE1 est\xE1 cadastrado." });
    }
    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name,
      cpf,
      phone,
      unidade,
      email,
      role: "Acesso Solicitado",
      register: "Pendente",
      clearance: "PENDING",
      avatarColor: "bg-slate-300 text-slate-700 border-slate-300",
      pin: "0000",
      password: "",
      requiresPasswordChange: true,
      status: "PENDING",
      badgeText: "PENDENTE"
    };
    data.users.push(newUser);
    if (data.users) mockUsers = data.users;
    console.log(`[EMAIL SIMULATION] To: admins | Subject: Nova Solicita\xE7\xE3o de Acesso | Body: O usu\xE1rio ${name} (${email}) solicitou acesso.`);
    return res.json({ success: true, message: "Solicita\xE7\xE3o enviada com sucesso." });
  });
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email, cpf } = req.body;
    const data = { users: mockUsers };
    const users = data.users || [];
    const cleanCpf = cpf ? cpf.replace(/\D/g, "") : "";
    const userIndex = users.findIndex((p) => p.email === email && p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf);
    if (userIndex === -1) {
      return res.json({ success: true, message: "Se os dados estiverem corretos, um e-mail foi enviado." });
    }
    const provPass = Math.floor(1e5 + Math.random() * 9e5).toString();
    data.users[userIndex].password = provPass;
    data.users[userIndex].requiresPasswordChange = true;
    if (data.users) mockUsers = data.users;
    console.log(`[EMAIL SIMULATION] To: ${email} | Subject: Recupera\xE7\xE3o de Senha | Body: Sua nova senha provis\xF3ria \xE9 ${provPass}. Voc\xEA dever\xE1 troc\xE1-la no pr\xF3ximo acesso.`);
    return res.json({ success: true, message: "E-mail de recupera\xE7\xE3o enviado." });
  });
  app.post("/api/auth/reset-password", (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p) => p.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    const user = data.users[userIndex];
    if (user.password !== oldPassword && user.pin !== oldPassword) {
      return res.status(403).json({ error: "Senha atual incorreta." });
    }
    data.users[userIndex].password = newPassword;
    data.users[userIndex].requiresPasswordChange = false;
    data.users[userIndex].pin = newPassword;
    if (data.users) mockUsers = data.users;
    return res.json({ success: true, message: "Senha atualizada com sucesso." });
  });
  app.get("/api/admin/users", (req, res) => {
    const data = { users: mockUsers };
    return res.json(data.users || []);
  });
  app.post("/api/admin/users/:id/approve", (req, res) => {
    const { role, clearance, badgeText, allowedModules } = req.body;
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p) => p.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    const isNewApproval = data.users[userIndex].status === "PENDING";
    let provPass = data.users[userIndex].password;
    if (isNewApproval) {
      provPass = Math.floor(1e5 + Math.random() * 9e5).toString();
      data.users[userIndex].password = provPass;
      data.users[userIndex].pin = provPass;
      data.users[userIndex].requiresPasswordChange = true;
    }
    data.users[userIndex].status = "ACTIVE";
    data.users[userIndex].role = role || data.users[userIndex].role;
    data.users[userIndex].clearance = clearance || "PUBLIC";
    data.users[userIndex].badgeText = badgeText || "AUTORIZADO";
    if (allowedModules) {
      data.users[userIndex].allowedModules = allowedModules;
    }
    if (data.users) mockUsers = data.users;
    if (isNewApproval) {
      console.log(`

=== SIMULA\xC7\xC3O DE ENVIO DE E-MAIL ===
Para: ${data.users[userIndex].email}
Assunto: Acesso Aprovado
Mensagem: Seu acesso ao \xD3RBITA.AECI foi aprovado.
Sua senha provis\xF3ria \xE9: ${provPass}
====================================

`);
    }
    return res.json({ success: true, user: data.users[userIndex] });
  });
  app.post("/api/admin/users/:id", (req, res) => {
    const { badgeText, allowedModules } = req.body;
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p) => p.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    if (badgeText) data.users[userIndex].badgeText = badgeText;
    if (allowedModules) data.users[userIndex].allowedModules = allowedModules;
    if (data.users) mockUsers = data.users;
    return res.json({ success: true, user: data.users[userIndex] });
  });
  app.post("/api/admin/users/:id/inactivate", (req, res) => {
    const data = { users: mockUsers };
    const userIndex = (data.users || []).findIndex((p) => p.id === req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
    data.users[userIndex].status = "INACTIVE";
    if (data.users) mockUsers = data.users;
    return res.json({ success: true, user: data.users[userIndex] });
  });
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao encerrar sess\xE3o." });
      }
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
  app.use("/api", superintendenciasRoutes_default);
  app.use("/api", contratosRoutes_default);
  app.use("/api", viaturasRoutes_default);
  app.use("/api/rol-responsaveis", rolLegacyRoutes_default);
  app.use("/api/rol", rolRoutes_default);
  app.use("/api", dashboardRoutes_default);
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled assets...");
    const distPath = import_path6.default.join(process.cwd(), "dist");
    app.use(import_express13.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path6.default.join(distPath, "index.html"));
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
