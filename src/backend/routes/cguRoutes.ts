import express from "express";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import {
  iniciarImportacao,
  atualizarStatusImportacao,
  registrarErroImportacao,
} from "../utils/importControl.js";
import { extractCguDossieWithGemini } from "../utils/aiUtils.js";
import { getCguPdfText } from "../utils/cguPdfService.js";
import { triggerSrteRecalcIfIdle } from "../services/srteRecalcService.js";

const router = express.Router();
const MODULO_CGU = "CGU_DEMANDAS";
const MODULO_CGU_REPORTS = "CGU_REPORTS";

const parseCSVRobust = (csvText: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
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
  return rows;
};

const normalizeHeaderName = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
};

// =========================================================================
// Helper para ler e dar parse em arquivos (CSV ou XLSX)
// =========================================================================
const parseFileContents = (filePath: string): string[][] => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls") {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // XLSX returns an array of arrays when { header: 1 } is used.
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    // Convert everything to string
    return rawData.map(row => row.map(cell => (cell != null ? String(cell).trim() : "")));
  } else if (ext === ".csv") {
    let contentStr = fs.readFileSync(filePath, 'latin1');
    if (!contentStr || contentStr.trim().length < 10) return [];

    const firstLineEnd = contentStr.indexOf('\n');
    const headerLine = firstLineEnd > 0 ? contentStr.substring(0, firstLineEnd) : contentStr;
    let delimiter = ";";
    if ((headerLine.match(/,/g) || []).length > (headerLine.match(/;/g) || []).length) {
      delimiter = ",";
    }

    return parseCSVRobust(contentStr, delimiter);
  }
  return [];
};

// =========================================================================
// GET /cgu/files/last-updates
// =========================================================================
router.get("/cgu/files/last-updates", (req, res) => {
  const getMostRecentDate = (dirPath: string): string | null => {
    try {
      if (!fs.existsSync(dirPath)) return null;
      const files = fs.readdirSync(dirPath).filter(f => {
        const ext = f.toLowerCase();
        return ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls");
      });
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

  const mon = getMostRecentDate(path.join(process.cwd(), "data", "cgu", "monitoramentos"));
  const rel = getMostRecentDate(path.join(process.cwd(), "data", "cgu", "relatorios"));

  res.json({
    success: true,
    data: {
      monitoramentos: mon,
      relatorios: rel
    }
  });
});

// =========================================================================
// PATCH /cgu/:id — Atualiza o Processo SEI de uma demanda
// =========================================================================
router.patch("/cgu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { processoSei } = req.body;
    await pool.query(
      "UPDATE cgu_demands SET processo_sei = $1, ultima_atualizacao = $2 WHERE id_tarefa = $3",
      [processoSei, new Date().toISOString(), id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar processo SEI da demanda CGU:", error);
    res.status(500).json({ error: "Erro interno ao atualizar processo SEI." });
  }
});

// =========================================================================
// GET /cgu — Lista todas as demandas CGU
// =========================================================================
router.get("/cgu", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cgu_demands ORDER BY ano DESC, id_tarefa DESC");
    const mapped = result.rows.map((row) => ({
      idTarefa:                  row.id_tarefa,
      situacao:                  row.situacao,
      estado:                    row.estado,
      tituloTarefa:              row.titulo_tarefa,
      dataInicio:                row.data_inicio,
      dataFim:                   row.data_fim,
      dataLimite:                row.data_limite,
      unidadeAuditada:           row.unidade_auditada,
      unidadesAuditoria:         row.unidades_auditoria,
      textoMonitoramento:        row.texto_monitoramento,
      providencia:               row.providencia,
      tipoUltimaManifestacao:    row.tipo_ultima_manifestacao,
      textoUltimaManifestacao:   row.texto_ultima_manifestacao,
      dataUltimaManifestacao:    row.data_ultima_manifestacao,
      tipoUltimoPosicionamento:  row.tipo_ultimo_posicionamento,
      textoUltimoPosicionamento: row.texto_ultimo_posicionamento,
      dataUltimoPosicionamento:  row.data_ultimo_posicionamento,
      categoria:                 row.categoria,
      dataLimiteInicial:         row.data_limite_inicial,
      ano:                       row.ano,
      ultimaAtualizacao:         row.ultima_atualizacao,
      processoSei:               row.processo_sei,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Erro ao buscar demandas CGU:", error);
    res.status(500).json({ error: "Erro interno ao buscar demandas CGU." });
  }
});

// =========================================================================
// POST /cgu/sync-local/monitoramentos
// =========================================================================
router.post("/cgu/sync-local/monitoramentos", async (req, res) => {
  const MON_DIR = path.join(process.cwd(), "data", "cgu", "monitoramentos");
  if (!fs.existsSync(MON_DIR)) {
    return res.status(404).json({ error: `Diretório não encontrado: ${MON_DIR}` });
  }

  const validFiles = fs.readdirSync(MON_DIR).filter(f => {
    const ext = f.toLowerCase();
    return ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls");
  });
  
  if (validFiles.length === 0) {
    return res.status(404).json({ error: "Nenhum arquivo CSV ou XLSX encontrado em data/cgu/monitoramentos." });
  }

  const usuarioId = (req as any).session?.user?.id ?? "SISTEMA";
  const updatedAt = new Date().toISOString();
  let importControlId: number | null = null;
  let totalProcessado = 0;
  let erros = 0;
  let inseridos = 0;

  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_CGU,
      ano_referencia: new Date().getFullYear(),
      tipo_arquivo: "CSV_LOCAL",
      forcado_por_usuario: usuarioId,
    });

    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });

    for (const file of validFiles) {
      const filePath = path.join(MON_DIR, file);
      
      const allRows = parseFileContents(filePath);
      if (allRows.length < 2) continue;

      const headers = allRows[0].map(h => normalizeHeaderName(h || ""));
      
      const getIndex = (names: string[]) => {
        for (const n of names) {
          const i = headers.findIndex(h => h.includes(n));
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
          const row = allRows[i];
          if (!row || row.length < headers.length * 0.5) continue; // Skip empty rows
          
          const id = row[idxIdTarefa]?.trim();
          if (!id) continue;
          
          totalProcessado++;
          const situacao = idxSituacao !== -1 ? row[idxSituacao]?.trim() : null;
          const estado = idxEstado !== -1 ? row[idxEstado]?.trim() : null;
          const titulo = idxTitulo !== -1 ? row[idxTitulo]?.trim() : null;
          const dtInicio = idxInicio !== -1 ? row[idxInicio]?.trim() : null;
          const dtFim = idxFim !== -1 ? row[idxFim]?.trim() : null;
          const dtLimite = idxLimite !== -1 ? row[idxLimite]?.trim() : null;
          const uniAuditada = idxUnidadeAuditada !== -1 ? row[idxUnidadeAuditada]?.trim() : null;
          const unisAuditoria = idxUnidadesAuditoria !== -1 ? row[idxUnidadesAuditoria]?.trim() : null;
          const txtMon = idxTextoMon !== -1 ? row[idxTextoMon]?.trim() : null;
          const prov = idxProv !== -1 ? row[idxProv]?.trim() : null;
          const cat = idxCat !== -1 ? row[idxCat]?.trim() : null;
          const anoStr = idxAno !== -1 ? row[idxAno]?.trim() : null;
          const anoVal = anoStr ? parseInt(anoStr.match(/\d{4}/)?.[0] || "0") : null;

          const tipoManif = idxTipoManif !== -1 ? row[idxTipoManif]?.trim() : null;
          const txtManif = idxTextoManif !== -1 ? row[idxTextoManif]?.trim() : null;
          const dtManif = idxDataManif !== -1 ? row[idxDataManif]?.trim() : null;
          const tipoPos = idxTipoPos !== -1 ? row[idxTipoPos]?.trim() : null;
          const txtPos = idxTextoPos !== -1 ? row[idxTextoPos]?.trim() : null;
          const dtPos = idxDataPos !== -1 ? row[idxDataPos]?.trim() : null;
          const dtLimiteIni = idxLimiteIni !== -1 ? row[idxLimiteIni]?.trim() : null;

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
          } catch(e: any) {
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
      quantidade_erros: erros,
    });

    res.json({ success: true, importedCount: inseridos, erros });
    // Dispara atualização dos vínculos SRTE após importação CGU
    setImmediate(() => triggerSrteRecalcIfIdle("IMPORT_CGU").catch(() => {}));
  } catch (err: any) {
    if (importControlId) await registrarErroImportacao(importControlId, err);
    console.error("Erro no processamento de monitoramentos CGU", err);
    res.status(500).json({ error: "Erro interno ao importar monitoramentos CGU. Detalhes: " + String(err) + " - " + String(err?.stack) });
  }
});

// =========================================================================
// GET /cgu/reports — Lista relatórios CGU
// =========================================================================
router.get("/cgu/reports", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cgu_reports ORDER BY ano DESC, data_publicacao DESC");
    const mapped = result.rows.map((row) => ({
      idTarefa:        row.id_tarefa,
      idAuditoria:     row.id_auditoria,
      tituloAuditoria: row.titulo_auditoria,
      ano:             row.ano,
      unidadeAuditada: row.unidade_auditada,
      categoria:       row.categoria,
      link:            row.link,
      dataPublicacao:  row.data_publicacao,
      ultimaAtualizacao: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar relatórios da CGU." });
  }
});

// =========================================================================
// POST /cgu/sync-local/relatorios
// =========================================================================
router.post("/cgu/sync-local/relatorios", async (req, res) => {
  const REL_DIR = path.join(process.cwd(), "data", "cgu", "relatorios");
  if (!fs.existsSync(REL_DIR)) {
    return res.status(404).json({ error: `Diretório não encontrado: ${REL_DIR}` });
  }

  const validFiles = fs.readdirSync(REL_DIR).filter(f => {
    const ext = f.toLowerCase();
    return ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls");
  });

  if (validFiles.length === 0) {
    return res.status(404).json({ error: "Nenhum arquivo CSV ou XLSX encontrado em data/cgu/relatorios." });
  }

  const usuarioId = (req as any).session?.user?.id ?? "SISTEMA";
  const updatedAt = new Date().toISOString();
  let importControlId: number | null = null;
  let totalProcessado = 0;
  let erros = 0;
  let inseridos = 0;

  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_CGU_REPORTS,
      ano_referencia: new Date().getFullYear(),
      tipo_arquivo: "CSV_LOCAL",
      forcado_por_usuario: usuarioId,
    });

    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });

    for (const file of validFiles) {
      const filePath = path.join(REL_DIR, file);
      
      const allRows = parseFileContents(filePath);
      if (allRows.length < 2) continue;

      const headers = allRows[0].map(h => normalizeHeaderName(h || ""));
      const getIndex = (names: string[]) => {
        for (const n of names) {
          const i = headers.findIndex(h => h.includes(n));
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
          const row = allRows[i];
          if (!row || row.length < headers.length * 0.5) continue;
          
          const id = (idxIdTarefa !== -1 ? row[idxIdTarefa]?.trim() : null) || (idxIdAuditoria !== -1 ? row[idxIdAuditoria]?.trim() : `REL-${Date.now()}-${i}`);
          if (!id) continue;
          
          totalProcessado++;
          const idAud = idxIdAuditoria !== -1 ? row[idxIdAuditoria]?.trim() : null;
          const tit = idxTitulo !== -1 ? row[idxTitulo]?.trim() : null;
          const anoStr = idxAno !== -1 ? row[idxAno]?.trim() : null;
          const anoVal = anoStr ? parseInt(anoStr.match(/\d{4}/)?.[0] || "0") : null;
          const uni = idxUni !== -1 ? row[idxUni]?.trim() : null;
          const cat = idxCat !== -1 ? row[idxCat]?.trim() : null;
          const lnk = idxLink !== -1 ? row[idxLink]?.trim() : null;
          const dtPub = idxDataPub !== -1 ? row[idxDataPub]?.trim() : null;

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
          } catch(e: any) {
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
      quantidade_erros: erros,
    });

    res.json({ success: true, importedCount: inseridos, erros });
  } catch (err: any) {
    if (importControlId) await registrarErroImportacao(importControlId, err);
    console.error("Erro no processamento de relatórios CGU", err);
    res.status(500).json({ error: "Erro interno ao importar relatórios CGU. Detalhes: " + String(err) + " - " + String(err?.stack) });
  }
});

// =========================================================================
// POST /cgu/update — Atualiza uma demanda CGU
// =========================================================================
router.post("/cgu/update", async (req, res) => {
  try {
    const { idTarefa, processoSei } = req.body;
    if (idTarefa) {
      await pool.query(
        "UPDATE cgu_demands SET processo_sei = $1, ultima_atualizacao = $2 WHERE id_tarefa = $3",
        [processoSei, new Date().toISOString(), idTarefa]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Erro no update CGU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/cgu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM cgu_demands WHERE id_tarefa = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// =========================================================================
// POST /cgu/auditorias/:id/dossie — Gera o Dossiê via IA a partir do PDF
// =========================================================================
router.post("/cgu/auditorias/:id/dossie", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Verificar se a auditoria existe
    const auditRes = await pool.query("SELECT * FROM cgu_auditorias WHERE id_auditoria = $1 LIMIT 1", [id]);
    if (auditRes.rowCount === 0) {
      return res.status(404).json({ error: "Auditoria não encontrada." });
    }

    const auditoria = auditRes.rows[0];

    // Se já tiver dossiê, retorna
    if (auditoria.dossie_ia) {
      return res.json({ success: true, dossie: JSON.parse(auditoria.dossie_ia) });
    }

    // 2. Baixar e extrair texto do PDF
    const pdfText = await getCguPdfText(auditoria.id_tarefa);

    // 3. Passar pelo Gemini
    const dossie = await extractCguDossieWithGemini(pdfText);

    // 4. Salvar no banco
    await pool.query("UPDATE cgu_auditorias SET dossie_ia = $1 WHERE id_auditoria = $2", [JSON.stringify(dossie), id]);

    res.json({ success: true, dossie });
  } catch (error: any) {
    console.error(`Erro ao gerar dossiê para auditoria ${id}:`, error);
    res.status(500).json({ error: "Erro ao processar PDF com a IA.", details: error.message });
  }
});

export default router;
