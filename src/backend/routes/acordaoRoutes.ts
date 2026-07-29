import express from "express";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import {
  parsearCsvFiltrado,
  getComplementaryDataBulk,
  type AcordaoComplementar,
  type TargetAcordao,
} from "../utils/tcuCsvParser.js";
import { fetchAcordaoCompleto } from "../utils/tcuApi.js";
import {
  getAnoStatus,
  getAnoParaImportacaoAutomatica,
  calcularHashArquivo,
  iniciarImportacao,
  atualizarStatusImportacao,
  registrarErroImportacao,
  getStatusImportacoes,
  anoHistoricoJaImportado,
} from "../utils/importControl.js";
import { processSingleAcordao } from "../utils/backgroundProcessor.js";
import { GoogleGenAI } from "@google/genai";

const DATA_DIR = path.join(process.cwd(), "data");
const TCU_DIR = path.join(DATA_DIR, "tcu", "acordaos");
const MODULO = "TCU_ACORDAOS";

const router = express.Router();

// =========================================================================
// HELPER: Verifica se o inteiro teor está ausente ou inválido
// =========================================================================
function isTeorMissing(teorVal: any): boolean {
  if (!teorVal) return true;
  const str = String(teorVal).trim();
  return (
    str === "" ||
    str === "null" ||
    str === "undefined" ||
    str === "[]" ||
    str === "{}"
  );
}

// =========================================================================
// HELPER: Normaliza colegiado para comparação
// =========================================================================
function normalizarColegiado(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

// =========================================================================
// POST /acordaos/sync-local
// ETL principal: importa acórdãos dos CSVs filtrados e enriquece com dados
// completos do TCU (inteiro teor). Respeita regras de ano histórico/corrente.
// =========================================================================
router.post("/acordaos/sync-local", async (req, res) => {
  // Parâmetro opcional para forçar reprocessamento de histórico
  const forcarReprocessamento = req.body?.forcarAno
    ? parseInt(req.body.forcarAno, 10)
    : null;
  const usuarioId: string = (req as any).session?.user?.id ?? "SISTEMA";

  if (!fs.existsSync(TCU_DIR)) {
    return res.status(400).json({
      success: false,
      message: "Diretório data/tcu/acordaos não encontrado.",
    });
  }

  const hoje = new Date();
  const anoCorrente = getAnoParaImportacaoAutomatica(hoje);

  // Lista todos os CSVs filtrados disponíveis (ex: Acórdãos2026.csv)
  const arquivos = fs.readdirSync(TCU_DIR).filter((f) => {
    return (
      f.toLowerCase().endsWith(".csv") &&
      !f.toLowerCase().includes("cache") &&
      !f.toLowerCase().endsWith(".tmp")
    );
  });

  if (arquivos.length === 0) {
    return res.json({
      success: false,
      message: "Nenhum arquivo .csv filtrado encontrado em data/tcu/acordaos/.",
    });
  }

  // Verifica se a tabela está vazia (carga inicial)
  const countResult = await pool.query("SELECT COUNT(*) FROM tcu_acordaos");
  const estaVazia = parseInt(countResult.rows[0].count, 10) === 0;

  // Determina quais arquivos processar
  const arquivosParaProcessar = arquivos.filter((arquivo) => {
    // Extrai o ano do nome do arquivo
    const matchAno = arquivo.match(/(\d{4})/);
    if (!matchAno) return false;
    const anoArquivo = parseInt(matchAno[1], 10);

    // Reprocessamento manual explícito
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
        `[SYNC] Arquivo ${arquivo} ignorado: ano histórico (já importado anteriormente).`
      );
      return false;
    }

    if (status === "corrente") {
      return true; // Sempre atualiza o ano corrente
    }

    // Se a base estiver vazia, importa todos os anos disponíveis
    return estaVazia;
  });

  if (arquivosParaProcessar.length === 0) {
    return res.json({
      success: true,
      message: `Nenhum arquivo elegível para processamento. O ano corrente (${anoCorrente}) ainda não possui arquivo disponível ou todos os históricos já foram importados.`,
      report: [],
    });
  }

  // Inicia processamento em background para não travar o HTTP response
  const reportGeral: any[] = [];
  let totalImportados = 0;
  let totalAtualizados = 0;

  // Registra início da importação de todos os arquivos ANTES de responder
  const pendingTasks: { arquivo: string; anoArquivo: number; ehHistorico: boolean; importControlId: number }[] = [];
  for (const arquivo of arquivosParaProcessar) {
    const matchAno = arquivo.match(/(\d{4})/);
    if (!matchAno) continue;
    const anoArquivo = parseInt(matchAno[1], 10);
    const statusAno = getAnoStatus(anoArquivo, hoje);
    const ehHistorico = statusAno === "historico";

    const importControlId = await iniciarImportacao({
      modulo: MODULO,
      ano_referencia: anoArquivo,
      tipo_arquivo: "FILTRADO_LOCAL",
      nome_arquivo: arquivo,
      forcado_por_usuario: forcarReprocessamento ? usuarioId : undefined,
    });

    pendingTasks.push({ arquivo, anoArquivo, ehHistorico, importControlId });
  }

  res.json({
    success: true,
    message: `Sincronização iniciada em background para ${arquivosParaProcessar.length} arquivo(s). Consulte /api/acordaos/import-status para acompanhar.`,
    arquivos: arquivosParaProcessar,
  });

  // Processamento assíncrono após o response
  (async () => {
    for (const task of pendingTasks) {
      const { arquivo, anoArquivo, ehHistorico, importControlId } = task;

      try {
        const filePath = path.join(TCU_DIR, arquivo);

        await atualizarStatusImportacao({
          id: importControlId,
          status: "PROCESSANDO",
        });

        console.log(`\n[SYNC] ═══ Iniciando: ${arquivo} (ano ${anoArquivo}) ═══`);
        console.time(`[SYNC] Tempo total ${arquivo}`);

        // ─────────────────────────────────────────────
        // PASSO 1: Lê o CSV filtrado com encoding correto
        // ─────────────────────────────────────────────
        const acordaosFiltrados = parsearCsvFiltrado(filePath);
        const hash = calcularHashArquivo(filePath);

        await atualizarStatusImportacao({
          id: importControlId,
          status: "PROCESSANDO",
          hash_arquivo: hash,
          quantidade_linhas_csv: acordaosFiltrados.length,
        });

        // ─────────────────────────────────────────────
        // PASSO 2: Consulta o banco em lote (elimina N+1)
        // ─────────────────────────────────────────────
        const numerosDoArquivo = acordaosFiltrados.map((a) => a.numAcordao);
        const existentesResult = await pool.query(
          `SELECT key, num_acordao, ano_acordao, colegiado, acordao
           FROM tcu_acordaos
           WHERE num_acordao = ANY($1) AND ano_acordao = $2`,
          [numerosDoArquivo, anoArquivo]
        );

        // Indexa existentes por "numAcordao-COLEGIADO_NORM"
        const existentesMap = new Map<string, any>();
        for (const row of existentesResult.rows) {
          const chave = `${row.num_acordao}-${normalizarColegiado(row.colegiado)}`;
          existentesMap.set(chave, row);
        }

        // ─────────────────────────────────────────────
        // PASSO 3: Identifica quais precisam de inteiro teor
        // ─────────────────────────────────────────────
        const seenKeys = new Set<string>();
        const linhasValidas: typeof acordaosFiltrados = [];
        const alvosParaBuscarTeor: TargetAcordao[] = [];

        for (const ac of acordaosFiltrados) {
          const chave = `${ac.numAcordao}-${normalizarColegiado(ac.colegiado)}`;

          // Deduplicação intra-arquivo
          if (seenKeys.has(chave)) continue;
          seenKeys.add(chave);

          linhasValidas.push(ac);

          const existente = existentesMap.get(chave);
          if (!existente || isTeorMissing(existente.acordao)) {
            alvosParaBuscarTeor.push({
              numAcordao: String(ac.numAcordao),
              anoAcordao: String(ac.anoAcordao),
              colegiado: ac.colegiado,
            });
          }
        }

        // ─────────────────────────────────────────────
        // PASSO 4: Baixa CSV completo e busca teores em lote
        // ─────────────────────────────────────────────
        let teoresMap = new Map<string, AcordaoComplementar>();

        if (alvosParaBuscarTeor.length > 0) {
          console.log(`[SYNC] Buscando teores: ${alvosParaBuscarTeor.length} acórdãos sem inteiro teor...`);

          await atualizarStatusImportacao({
            id: importControlId,
            status: "BAIXANDO",
          });

          const cachePath = await fetchAcordaoCompleto(anoArquivo, ehHistorico);

          await atualizarStatusImportacao({
            id: importControlId,
            status: "PROCESSANDO",
          });

          teoresMap = await getComplementaryDataBulk(cachePath, alvosParaBuscarTeor);
        }

        // ─────────────────────────────────────────────
        // PASSO 5: Persiste no banco com transação
        // ─────────────────────────────────────────────
        let inseridos = 0;
        let atualizados = 0;
        let ignorados = 0;
        let erros = 0;
        const updatedAt = new Date().toISOString();

        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          for (const ac of linhasValidas) {
            try {
              const chave = `${ac.numAcordao}-${normalizarColegiado(ac.colegiado)}`;
              const existente = existentesMap.get(chave);
              const compData = teoresMap.get(chave) ?? null;

              if (existente) {
                // ── UPDATE ──
                if (compData) {
                  // Tem dados complementares: atualiza tudo
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
                      compData.decisao,
                    ]
                  );
                } else {
                  // Sem dados complementares: atualiza só metadados básicos
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
                      updatedAt,
                    ]
                  );
                }
                atualizados++;
              } else {
                // ── INSERT ──
                // A key oficial vem do CSV completo; usa fallback composto se não disponível
                const finalKey =
                  compData?.key ||
                  `AC-${ac.numAcordao}-${ac.anoAcordao}-${normalizarColegiado(ac.colegiado)}`;

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
                    `ACÓRDÃO ${ac.numAcordao}/${ac.anoAcordao} - ${(ac.colegiado || "").toUpperCase()}`,
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
                    compData?.decisao ?? null,
                  ]
                );
                inseridos++;
              }
            } catch (errItem: any) {
              console.error(
                `[SYNC] Erro ao processar acórdão ${ac.numAcordao}/${ac.anoAcordao}:`,
                errItem.message
              );
              erros++;
            }
          }

          await client.query("COMMIT");
        } catch (errTx: any) {
          await client.query("ROLLBACK");
          throw errTx;
        } finally {
          client.release();
        }

        totalImportados += inseridos;
        totalAtualizados += atualizados;

        // ─────────────────────────────────────────────
        // PASSO 6: Registra conclusão na tabela de controle
        // ─────────────────────────────────────────────
        await atualizarStatusImportacao({
          id: importControlId,
          status: erros > 0 && inseridos + atualizados === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
          quantidade_inseridos: inseridos,
          quantidade_atualizados: atualizados,
          quantidade_ignorados: ignorados,
          quantidade_erros: erros,
          eh_historico: ehHistorico,
          observacoes: `Arquivo: ${arquivo}. Encoding detectado automaticamente.`,
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
          erros,
        });
      } catch (errArquivo: any) {
        console.error(`[SYNC] Erro fatal no arquivo ${arquivo}:`, errArquivo);
        if (importControlId) {
          await registrarErroImportacao(importControlId, errArquivo);
        }
        reportGeral.push({
          arquivo,
          erro: errArquivo.message,
        });
      }
    }

    console.log(
      `\n[SYNC] ═══ Sincronização concluída. Total: ${totalImportados} inseridos, ${totalAtualizados} atualizados ═══`
    );
  })().catch((err) => {
    console.error("[SYNC] Erro crítico no processamento em background:", err);
  });
});

// =========================================================================
// GET /acordaos/import-status
// Retorna o status das importações registradas na tabela de controle.
// =========================================================================
router.get("/acordaos/import-status", async (req, res) => {
  try {
    const status = await getStatusImportacoes();
    res.json({ success: true, data: status });
  } catch (err: any) {
    console.error("[IMPORT-STATUS] Erro:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// GET /acordaos
// Lista todos os acórdãos (sem o campo acordao para economizar banda).
// =========================================================================
router.get("/acordaos", async (req, res) => {
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

    const mapped = result.rows.map((row) => ({
      KEY: row.key,
      TITULO: row.titulo,
      NUMACORDAO: row.num_acordao,
      ANOACORDAO: row.ano_acordao,
      NUMATA: row.num_ata,
      COLEGIADO: row.colegiado,
      DATASESSAO: row.data_sessao,
      SITUACAO: row.situacao,
      PROC: row.proc,
      ACORDAOSRELACIONADOS: row.acordaos_relacionados,
      TIPOPROCESSO: row.tipo_processo,
      INTERESSADOS: row.interessados,
      ENTIDADE: row.entidade,
      UNIDADETECNICA: row.unidade_tecnica,
      RELATOR: row.relator,
      ASSUNTO: row.assunto,
      SUMARIO: row.sumario,
      ACORDAO: "", // Omitido intencionalmente para economizar banda — use GET /acordaos/:key/teor
      DECISAO: row.decisao,
      RECOMENDACOES: row.recomendacoes,
      DETERMINACOES: row.determinacoes,
      RECOMENDACOES_DETERMINACOES_UNIFICADO: row.recomendacoes_determinacoes_unificado,
      STATUS_MONITORAMENTO: row.status_monitoramento,
      RESPONSAVEL_INTERNO: row.responsavel_interno,
      PRAZO_LIMITE: row.prazo_limite,
      OBSERVACOES: row.observacoes,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao,
      aiAnalysisData: row.ai_analysis_data,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("Erro ao buscar Acórdãos:", err);
    res.status(500).json({ error: "Falha ao buscar Acórdãos." });
  }
});

// =========================================================================
// GET /acordaos/:key/teor
// Retorna o inteiro teor de um acórdão específico (com limpeza de HTML).
// =========================================================================
function limparTeor(rawTeor: string): string {
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

router.get("/acordaos/:key/teor", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query(
      "SELECT acordao FROM tcu_acordaos WHERE key = $1",
      [key]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Acórdão não encontrado." });
    }
    const cleanText = limparTeor(result.rows[0].acordao || "");
    res.json({ acordao: cleanText });
  } catch (err) {
    console.error("Erro ao buscar inteiro teor:", err);
    res.status(500).json({ error: "Falha ao buscar inteiro teor." });
  }
});

// =========================================================================
// POST /acordaos/update
// Atualiza um acórdão existente.
// =========================================================================
router.post("/acordaos/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = new Date().toISOString();

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
      updated.aiAnalysisData ? JSON.stringify(updated.aiAnalysisData) : null,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Acórdão não encontrado." });
    }
  } catch (err) {
    console.error("Erro ao atualizar Acórdão:", err);
    res.status(500).json({ error: "Falha ao atualizar Acórdão." });
  }
});

// =========================================================================
// DELETE /acordaos/:key
// =========================================================================
router.delete("/acordaos/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query("DELETE FROM tcu_acordaos WHERE key = $1", [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao excluir Acórdão:", err);
    res.status(500).json({ error: "Falha ao excluir Acórdão." });
  }
});

// =========================================================================
// POST /acordaos/:key/analisar-ressarcimento
// =========================================================================
router.post("/acordaos/:key/analisar-ressarcimento", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await processSingleAcordao(key);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[AI] Erro na análise de ressarcimento:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================================
// POST /acordaos/:key/auditoria-profunda
// =========================================================================
router.post("/acordaos/:key/auditoria-profunda", async (req, res) => {
  const { key } = req.params;

  try {
    const acResult = await pool.query(
      "SELECT * FROM tcu_acordaos WHERE key = $1",
      [key]
    );
    if (acResult.rows.length === 0) {
      return res.status(404).json({ error: "Acórdão não encontrado." });
    }
    const acordao = acResult.rows[0];

    if (!acordao.acordao || acordao.acordao.trim() === "") {
      return res
        .status(400)
        .json({ error: "Acórdão sem inteiro teor. Execute a sincronização primeiro." });
    }

    const apiKey =
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Chave da API do Gemini não configurada." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const textChunk = acordao.acordao.substring(0, 25000);

    const prompt = `
# ROLE E OBJETIVO
Você é o motor de extração semântica do sistema ÓRBITA.
Responda à pergunta do usuário com base no texto do Acórdão abaixo.

Texto do Acórdão:
"""
${textChunk}
"""

Pergunta do usuário:
${req.body.pergunta || "Faça um resumo executivo deste Acórdão."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.2 },
    });

    return res.json({ success: true, analise: response.text });
  } catch (error: any) {
    console.error("[Auditoria Profunda] Erro:", error);
    return res
      .status(500)
      .json({ error: "Falha na análise de inteligência artificial." });
  }
});

// =========================================================================
// POST /acordaos/aprender
// =========================================================================
router.post("/acordaos/aprender", (req, res) => {
  const { tipo, palavra } = req.body;
  if (!tipo || !palavra) {
    return res.status(400).json({ error: "Faltam parâmetros tipo ou palavra." });
  }

  const DICT_PATH = path.join(DATA_DIR, "orbita_dictionary.json");
  try {
    let dict: any = {};
    if (fs.existsSync(DICT_PATH)) {
      dict = JSON.parse(fs.readFileSync(DICT_PATH, "utf-8"));
    }

    const key = `keywords${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    if (!dict[key]) dict[key] = [];

    const kw = palavra.toLowerCase().trim();
    if (!dict[key].includes(kw)) {
      dict[key].push(kw);
      fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2), "utf-8");
    }

    return res.json({
      success: true,
      message: `Expressão '${kw}' aprendida para ${tipo}!`,
    });
  } catch (err: any) {
    console.error("Erro ao aprender nova palavra:", err);
    return res
      .status(500)
      .json({ error: "Falha ao salvar no dicionário." });
  }
});

export default router;
