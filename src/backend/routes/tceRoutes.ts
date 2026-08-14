import express from "express";
import { pool } from "../db";
import { triggerSrteRecalcIfIdle } from "../services/srteRecalcService.js";

import fs from "fs";
import path from "path";


const router = express.Router();

router.get("/files/last-updates", (req, res) => {
  const getMostRecentDate = (dirPath: string): string | null => {
    try {
      if (!fs.existsSync(dirPath)) return null;
      const files = fs.readdirSync(dirPath).filter(f => f.toLowerCase().endsWith(".csv"));
      if (files.length === 0) return null;
      
      let maxTime = 0;
      for (const file of files) {
        const stat = fs.statSync(path.join(dirPath, file));
        if (stat.mtimeMs > maxTime) maxTime = stat.mtimeMs;
      }
      return maxTime > 0 ? new Date(maxTime).toLocaleString("pt-BR") : null;
    } catch {
      return null;
    }
  };

  const tcuAcordaos = getMostRecentDate(path.join(process.cwd(), "data", "tcu", "acordaos"));
  const tcuTces = getMostRecentDate(path.join(process.cwd(), "data", "tcu", "tces"));
  const tcuComs = getMostRecentDate(path.join(process.cwd(), "data", "tcu", "comunicacoes"));

  res.json({
    success: true,
    data: {
      acordaos: tcuAcordaos,
      tces: tcuTces,
      comunicacoes: tcuComs
    }
  });
});
// =====================================
// API: Sync Local TCEs
// =====================================
router.post("/tces/sync-local", async (req, res) => {
  const TCE_DIR = path.join(process.cwd(), "data", "tcu", "tces");
  if (!fs.existsSync(TCE_DIR)) {
    return res.status(400).json({ success: false, message: "Diretório data/tcu/tces não encontrado." });
  }

  const files = fs.readdirSync(TCE_DIR);
  const csvFiles = files.filter(f => f.toLowerCase().endsWith(".csv"));

  if (csvFiles.length === 0) {
    return res.json({ success: false, message: "Nenhum arquivo .csv encontrado na pasta data/tcu/tces/." });
  }

  try {
    let importedGeral = 0;
    let updatedGeral = 0;
    let importedMap = 0;
    let updatedMap = 0;
    const updatedAt = new Date().toLocaleString("pt-BR");

    const parseCSVRobust = (csvText: string, delimiter: string): string[][] => {
      let isDoubleQuoteDelimiter = false;
      const firstLineEnd = csvText.indexOf('\n');
      const headerLine = firstLineEnd > 0 ? csvText.substring(0, firstLineEnd) : csvText;
      const semiCount = (headerLine.match(/;/g) || []).length;
      const commaCount = (headerLine.match(/,/g) || []).length;
      const tabCount = (headerLine.match(/\t/g) || []).length;
      if (semiCount === 0 && commaCount === 0 && tabCount === 0 && csvText.includes('""')) {
        isDoubleQuoteDelimiter = true;
      }

      let rows: string[][] = [];
      if (isDoubleQuoteDelimiter) {
        rows = csvText.split(/\r?\n/).filter(l => l.trim()).map(l => l.split('""').map(p => p.replace(/^"|"$/g, "").trim()));
      } else {
        let currentField = "";
        let currentRow: string[] = [];
        let inQuotes = false;
        for (let i = 0; i < csvText.length; i++) {
          const char = csvText[i];
          const nextChar = csvText[i + 1];
          if (inQuotes) {
            if (char === '"' && nextChar === '"') { currentField += '"'; i++; }
            else if (char === '"') {
              const isEndOfField = nextChar === delimiter || nextChar === '\r' || nextChar === '\n' || nextChar === undefined;
              if (isEndOfField) inQuotes = false;
              else currentField += '"';
            } else { currentField += char; }
          } else {
            if (char === '"') inQuotes = true;
            else if (char === delimiter) { currentRow.push(currentField.trim()); currentField = ""; }
            else if (char === '\r' && nextChar === '\n') {
              currentRow.push(currentField.trim());
              if (currentRow.length > 0) rows.push(currentRow);
              currentRow = []; currentField = ""; i++;
            } else if (char === '\n') {
              currentRow.push(currentField.trim());
              if (currentRow.length > 0) rows.push(currentRow);
              currentRow = []; currentField = "";
            } else { currentField += char; }
          }
        }
        if (currentRow.length > 0 || currentField !== "") {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
        }
      }
      return rows;
    };

    const normalizeHeaderName = (str: string) => {
      if (!str) return "";
      return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    };

    const extractYearFromTceString = (str: string) => {
      if (!str) return 2026;
      const match = str.match(/(?:20|19)\d{2}/);
      if (match) return parseInt(match[0]);
      return 2026;
    };

    const fixExcelDateTce = (str: string | null | undefined): string => {
      if (!str) return "";
      const meses: Record<string, number> = {
        jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
        jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12
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
      const isMapping = file.toLowerCase().includes("acordao") || file.toLowerCase().includes("acórdão") || file.toLowerCase().includes("mapping");
      const filePath = path.join(TCE_DIR, file);
      
      let contentStr = fs.readFileSync(filePath, 'latin1');
      if (!contentStr || contentStr.trim().length < 10) continue;

      const firstLineEnd = contentStr.indexOf('\n');
      const headerLine = firstLineEnd > 0 ? contentStr.substring(0, firstLineEnd) : contentStr;
      const semiCount = (headerLine.match(/;/g) || []).length;
      const commaCount = (headerLine.match(/,/g) || []).length;
      const tabCount = (headerLine.match(/\t/g) || []).length;
      let delimiter = ",";
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = "\t";

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
        const normalizedHeaders = headers.map(normalizeHeaderName);

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
            const checkResult = await pool.query('SELECT 1 FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2', [tceVal, acordaoVal]);
            if (checkResult.rows.length === 0) {
              await pool.query('INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key) VALUES ($1, $2)', [tceVal, acordaoVal]);
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
        const normalizedHeaders = headers.map(normalizeHeaderName);
        
        const findIndexRobust = (keywords: string[], excludes?: string[]): number => {
          for (const kw of keywords) {
            const cleanKw = normalizeHeaderName(kw);
            const idx = normalizedHeaders.findIndex(ch => {
              if (!ch.includes(cleanKw)) return false;
              if (excludes) return !excludes.some(ex => ch.includes(normalizeHeaderName(ex)));
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

          const getFieldValue = (colIdx: number, fallback: string = "") => (colIdx !== -1 && colIdx < fields.length) ? (fields[colIdx] || fallback) : fallback;

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

          const checkResult = await pool.query('SELECT id FROM tcu_tce WHERE id = $1 OR numero_ano_tce = $2', [id, numeroAnoTce]);
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
              targetId, numeroAnoTce, pa, motivo, submotivo, debitoOrig, debitoAtual,
              dataAtual, posicionamento, tc, estado, situacao, julgamento, encerramento, ano
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
              id, numeroAnoTce, pa, motivo, submotivo, debitoOrig, debitoAtual,
              dataAtual, posicionamento, tc, estado, situacao, julgamento, encerramento, ano
            ]);
            importedGeral++;
          }
        }
      }
      console.log(`[SYNC-LOCAL-TCES] Concluído processamento de ${file}.`);
      console.timeEnd(`Processamento ${file}`);
    }

    console.log(`[SYNC-LOCAL-TCES] Sincronização finalizada. TCEs importadas: ${importedGeral}, Atualizadas: ${updatedGeral}. Mapeamentos inseridos: ${importedMap}.`);
    res.json({ 
      success: true, 
      message: `Sincronização concluída: ${importedGeral} TCEs novas, ${updatedGeral} atualizadas e ${importedMap} mapeamentos inseridos.`
    });
    // Dispara atualização dos vínculos SRTE
    setImmediate(() => triggerSrteRecalcIfIdle("IMPORT_TCE").catch(() => {}));
  } catch (err: any) {
    console.error("Erro na sincronização local de TCEs:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});

function cleanEncoding(text: string | null | undefined): string {
  if (!text) return "";
  let decoded = text;
  if (decoded.includes("Ã¢") || decoded.includes("Ã§") || decoded.includes("Ã£") || decoded.includes("Ã³") || decoded.includes("Ã")) {
    try {
      decoded = Buffer.from(decoded, 'binary').toString('utf8');
    } catch (e) {
      // fallback
    }
  }
  return decoded;
}

router.get("/tces", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tcu_tce');
    // Map snake_case to camelCase/PascalCase as expected by frontend
    const mapped = result.rows.map(row => ({
      id: row.id,
      NUMERO_ANO_TCE: cleanEncoding(row.numero_ano_tce),
      PROCESSO_ADMINISTRATIVO: cleanEncoding(row.processo_administrativo),
      MOTIVO_INSTAURACAO: cleanEncoding(row.motivo_instauracao),
      SUBMOTIVO_INSTAURACAO: cleanEncoding(row.submotivo_instauracao),
      DEBITO_ORIGINAL: cleanEncoding(row.debito_original),
      DEBITO_ATUALIZADO: cleanEncoding(row.debito_atualizado),
      DATA_ATUALIZACAO_DEBITO: cleanEncoding(row.data_atualizacao_debito),
      ULTIMO_POSICIONAMENTO: cleanEncoding(row.ultimo_posicionamento),
      TC: cleanEncoding(row.tc),
      ESTADO_PROCESSO: cleanEncoding(row.estado_processo),
      SITUACAO_PROCESSO: cleanEncoding(row.situacao_processo),
      PRIMEIRO_JULGAMENTO: cleanEncoding(row.primeiro_julgamento),
      ENCERRAMENTO: cleanEncoding(row.encerramento),
      NUMERO_SIAFI: cleanEncoding(row.numero_siafi),
      SIAFI_RESSARCIDO: cleanEncoding(row.siafi_ressarcido),
      ANO: row.ano,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching TCEs from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch TCEs." });
  }
});

router.post("/tces/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = new Date().toLocaleString("pt-BR");
    
    // Note: Usually we would only update changed fields or do a full update.
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
      updated.id, updated.NUMERO_ANO_TCE, updated.PROCESSO_ADMINISTRATIVO, updated.MOTIVO_INSTAURACAO,
      updated.SUBMOTIVO_INSTAURACAO, updated.DEBITO_ORIGINAL, updated.DEBITO_ATUALIZADO,
      updated.DATA_ATUALIZACAO_DEBITO, updated.ULTIMO_POSICIONAMENTO, updated.TC,
      updated.ESTADO_PROCESSO, updated.SITUACAO_PROCESSO, updated.PRIMEIRO_JULGAMENTO,
      updated.ENCERRAMENTO, updated.NUMERO_SIAFI, updated.SIAFI_RESSARCIDO, updated.ANO,
      updatedAt
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "TCE não encontrada no Postgres." });
    }
  } catch (err) {
    console.error("Error updating TCE in Postgres:", err);
    res.status(500).json({ error: "Failed to update TCE." });
  }
});

router.delete("/tces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tcu_tce WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting TCE from Postgres:", err);
    res.status(500).json({ error: "Failed to delete TCE." });
  }
});

router.post("/tces/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importação inválido para TCE." });
    }

    let importedCount = 0;
    let updatedCount = 0;
    const updatedAt = new Date().toLocaleString("pt-BR");

    for (const item of items) {
      // Upsert logic
      const checkResult = await pool.query('SELECT id FROM tcu_tce WHERE id = $1 OR numero_ano_tce = $2', [item.id, item.NUMERO_ANO_TCE]);
      
      if (checkResult.rows.length > 0) {
        // Update
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
          targetId, item.NUMERO_ANO_TCE, item.PROCESSO_ADMINISTRATIVO, item.MOTIVO_INSTAURACAO,
          item.SUBMOTIVO_INSTAURACAO, item.DEBITO_ORIGINAL, item.DEBITO_ATUALIZADO,
          item.DATA_ATUALIZACAO_DEBITO, item.ULTIMO_POSICIONAMENTO, item.TC,
          item.ESTADO_PROCESSO, item.SITUACAO_PROCESSO, item.PRIMEIRO_JULGAMENTO,
          item.ENCERRAMENTO, item.NUMERO_SIAFI, item.SIAFI_RESSARCIDO, item.ANO,
          updatedAt
        ]);
        updatedCount++;
      } else {
        // Insert
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
          item.id, item.NUMERO_ANO_TCE, item.PROCESSO_ADMINISTRATIVO, item.MOTIVO_INSTAURACAO,
          item.SUBMOTIVO_INSTAURACAO, item.DEBITO_ORIGINAL, item.DEBITO_ATUALIZADO,
          item.DATA_ATUALIZACAO_DEBITO, item.ULTIMO_POSICIONAMENTO, item.TC,
          item.ESTADO_PROCESSO, item.SITUACAO_PROCESSO, item.PRIMEIRO_JULGAMENTO,
          item.ENCERRAMENTO, item.NUMERO_SIAFI, item.SIAFI_RESSARCIDO, item.ANO
        ]);
        importedCount++;
      }
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM tcu_tce');
    
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: [] // Avoid sending back entire DB on import to save bandwidth
    });
  } catch (err) {
    console.error("Error importing TCEs in Postgres:", err);
    res.status(500).json({ error: "Failed to import TCEs." });
  }
});

// API 2.8: TCE com Acórdão mappings (Mapeamentos)
router.get("/tce-mappings", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tcu_tce_acordao_mapping');
    const mapped = result.rows.map(row => ({
      NUMERO_ANO_TCE: row.numero_ano_tce,
      ACORDAO_KEY: row.acordao_key
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching TCE mappings:", err);
    res.status(500).json({ error: "Failed to fetch TCE mappings." });
  }
});

router.post("/tce-mappings/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de mapeamento inválido." });
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const checkResult = await pool.query(
        'SELECT 1 FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2', 
        [item.NUMERO_ANO_TCE, item.ACORDAO_KEY]
      );
      
      if (checkResult.rows.length === 0) {
        await pool.query(
          'INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key) VALUES ($1, $2)',
          [item.NUMERO_ANO_TCE, item.ACORDAO_KEY]
        );
        importedCount++;
      }
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM tcu_tce_acordao_mapping');

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

router.post("/tce-mappings/add", async (req, res) => {
  try {
    const { NUMERO_ANO_TCE, ACORDAO_KEY } = req.body;
    
    // Check if it already exists
    const checkResult = await pool.query(
      'SELECT 1 FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2', 
      [NUMERO_ANO_TCE, ACORDAO_KEY]
    );
    
    if (checkResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key) VALUES ($1, $2)',
        [NUMERO_ANO_TCE, ACORDAO_KEY]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error adding TCE mapping:", err);
    res.status(500).json({ error: "Failed to add TCE mapping." });
  }
});

router.post("/tce-mappings/delete", async (req, res) => {
  try {
    const { NUMERO_ANO_TCE, ACORDAO_KEY } = req.body;
    
    await pool.query(
      'DELETE FROM tcu_tce_acordao_mapping WHERE numero_ano_tce = $1 AND acordao_key = $2',
      [NUMERO_ANO_TCE, ACORDAO_KEY]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting TCE mapping:", err);
    res.status(500).json({ error: "Failed to delete TCE mapping." });
  }
});

export default router;
