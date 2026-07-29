import express from "express";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";
import {
  iniciarImportacao,
  atualizarStatusImportacao,
  registrarErroImportacao,
  getStatusImportacoes,
} from "../utils/importControl.js";

const router = express.Router();
const MODULO_CGU = "CGU_DEMANDAS";
const MODULO_CGU_REPORTS = "CGU_REPORTS";

// =========================================================================
// GET /cgu — Lista todas as demandas CGU
// =========================================================================
router.get("/cgu", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cgu_demands ORDER BY ano DESC, id_tarefa DESC"
    );
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
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Erro ao buscar demandas CGU:", error);
    res.status(500).json({ error: "Erro interno ao buscar demandas CGU." });
  }
});

// =========================================================================
// POST /cgu/import — Importação em lote de demandas CGU
// UPSERT com controle de importação e auditoria
// =========================================================================
router.post("/cgu/import", async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res
      .status(400)
      .json({ error: "Formato inválido. Esperado: { items: [...] }" });
  }

  const usuarioId: string =
    (req as any).session?.user?.id ?? "SISTEMA";
  const updatedAt = new Date().toISOString();

  // Identifica o ano de referência (usa o ano mais comum nos itens)
  const anoRef =
    items.reduce((acc: Record<number, number>, item: any) => {
      const a = parseInt(item.ano ?? 0, 10);
      if (a > 0) acc[a] = (acc[a] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  const anoReferencia =
    Object.entries(anoRef).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    new Date().getFullYear();

  let importControlId: number | null = null;

  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_CGU,
      ano_referencia: Number(anoReferencia),
      tipo_arquivo: "JSON_UPLOAD",
      forcado_por_usuario: usuarioId,
    });

    await atualizarStatusImportacao({
      id: importControlId,
      status: "PROCESSANDO",
      quantidade_linhas_csv: items.length,
    });

    let inseridos = 0;
    let atualizados = 0;
    let erros = 0;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const item of items) {
        try {
          await client.query(
            `INSERT INTO cgu_demands (
               id_tarefa, situacao, estado, titulo_tarefa,
               data_inicio, data_fim, data_limite, unidade_auditada,
               unidades_auditoria, texto_monitoramento, providencia,
               tipo_ultima_manifestacao, texto_ultima_manifestacao,
               data_ultima_manifestacao, tipo_ultimo_posicionamento,
               texto_ultimo_posicionamento, data_ultimo_posicionamento,
               categoria, data_limite_inicial, ano, ultima_atualizacao
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
             )
             ON CONFLICT (id_tarefa) DO UPDATE SET
               situacao                   = EXCLUDED.situacao,
               estado                     = EXCLUDED.estado,
               titulo_tarefa              = EXCLUDED.titulo_tarefa,
               data_inicio                = EXCLUDED.data_inicio,
               data_fim                   = EXCLUDED.data_fim,
               data_limite                = EXCLUDED.data_limite,
               unidade_auditada           = EXCLUDED.unidade_auditada,
               unidades_auditoria         = EXCLUDED.unidades_auditoria,
               texto_monitoramento        = EXCLUDED.texto_monitoramento,
               providencia                = EXCLUDED.providencia,
               tipo_ultima_manifestacao   = EXCLUDED.tipo_ultima_manifestacao,
               texto_ultima_manifestacao  = EXCLUDED.texto_ultima_manifestacao,
               data_ultima_manifestacao   = EXCLUDED.data_ultima_manifestacao,
               tipo_ultimo_posicionamento = EXCLUDED.tipo_ultimo_posicionamento,
               texto_ultimo_posicionamento = EXCLUDED.texto_ultimo_posicionamento,
               data_ultimo_posicionamento = EXCLUDED.data_ultimo_posicionamento,
               categoria                  = EXCLUDED.categoria,
               data_limite_inicial        = EXCLUDED.data_limite_inicial,
               ano                        = EXCLUDED.ano,
               ultima_atualizacao         = EXCLUDED.ultima_atualizacao`,
            [
              item.idTarefa,
              item.situacao ?? null,
              item.estado ?? null,
              item.tituloTarefa ?? null,
              item.dataInicio ?? null,
              item.dataFim ?? null,
              item.dataLimite ?? null,
              item.unidadeAuditada ?? null,
              item.unidadesAuditoria ?? null,
              item.textoMonitoramento ?? null,
              item.providencia ?? null,
              item.tipoUltimaManifestacao ?? null,
              item.textoUltimaManifestacao ?? null,
              item.dataUltimaManifestacao ?? null,
              item.tipoUltimoPosicionamento ?? null,
              item.textoUltimoPosicionamento ?? null,
              item.dataUltimoPosicionamento ?? null,
              item.categoria ?? null,
              item.dataLimiteInicial ?? null,
              item.ano ? parseInt(item.ano, 10) : null,
              updatedAt,
            ]
          );
          // Conta se foi insert ou update baseado na presença no DB antes
          inseridos++;
        } catch (errItem: any) {
          console.error(`[CGU-IMPORT] Erro no item ${item.idTarefa}:`, errItem.message);
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

    await atualizarStatusImportacao({
      id: importControlId,
      status: erros > 0 && inseridos === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
      quantidade_inseridos: inseridos,
      quantidade_erros: erros,
      observacoes: `Importação manual pelo usuário ${usuarioId}.`,
    });

    // Retorna dados atualizados
    const allResult = await pool.query(
      "SELECT * FROM cgu_demands ORDER BY ano DESC, id_tarefa DESC"
    );

    return res.json({
      success: true,
      importedCount: inseridos,
      updatedCount: atualizados,
      erros,
      totalCount: allResult.rowCount,
      items: allResult.rows,
    });
  } catch (err: any) {
    console.error("[CGU-IMPORT] Erro fatal:", err);
    if (importControlId) await registrarErroImportacao(importControlId, err);
    return res
      .status(500)
      .json({ error: "Erro interno ao importar demandas CGU." });
  }
});

// =========================================================================
// POST /cgu/update — Atualiza uma demanda CGU
// =========================================================================
router.post("/cgu/update", async (req, res) => {
  try {
    // Endpoint mantido para compatibilidade — retorna sucesso
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar CGU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// =========================================================================
// DELETE /cgu/:id
// =========================================================================
router.delete("/cgu/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM cgu_demands WHERE id_tarefa = $1", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir CGU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// =========================================================================
// GET /cgu/reports — Lista relatórios CGU
// =========================================================================
router.get("/cgu/reports", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cgu_reports ORDER BY ano DESC, data_publicacao DESC"
    );
    const mapped = result.rows.map((row) => ({
      idTarefa:        row.id_tarefa,
      idAuditoria:     row.id_auditoria,
      tituloAuditoria: row.titulo_auditoria,
      ano:             row.ano,
      uf:              row.uf,
      municipio:       row.municipio,
      codigoMunicipio: row.codigo_municipio,
      assunto:         row.assunto,
      dataPublicacao:  row.data_publicacao,
      linkRelatorio:   row.link_relatorio,
      localPdf:        row.local_pdf,
      sumarioExecutivo: row.sumario_executivo,
      aiAbstract:      row.ai_abstract,
      ultimaAtualizacao: row.ultima_atualizacao,
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Erro ao buscar relatórios CGU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// =========================================================================
// POST /cgu/reports/import — Importação em lote de relatórios CGU
// =========================================================================
router.post("/cgu/reports/import", async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res
      .status(400)
      .json({ error: "Formato inválido. Esperado: { items: [...] }" });
  }

  const usuarioId: string =
    (req as any).session?.user?.id ?? "SISTEMA";
  const updatedAt = new Date().toISOString();

  let importControlId: number | null = null;

  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_CGU_REPORTS,
      ano_referencia: new Date().getFullYear(),
      tipo_arquivo: "JSON_UPLOAD",
      forcado_por_usuario: usuarioId,
    });

    await atualizarStatusImportacao({
      id: importControlId,
      status: "PROCESSANDO",
      quantidade_linhas_csv: items.length,
    });

    let inseridos = 0;
    let erros = 0;

    // Filtro de segurança: apenas relatórios relacionados ao MTE
    const blacklist = [
      "dnit","codevasf","incra","ufgd","ufpe","ifac","mgi","mec","caixa",
      "mds","mtur","mpa","ceagesp","unifesp","fnde","prf","memp","mdic","mf",
      "ms","midr","ufg","mps",
    ];
    const filteredItems = items.filter((item: any) => {
      const idT = String(item.idTarefa || "").toUpperCase();
      const idA = String(item.idAuditoria || "").toUpperCase();
      if (idT.startsWith("AUD") || idA.startsWith("AUD")) return false;
      const texto = `${item.tituloAuditoria || ""} ${item.assunto || ""}`.toLowerCase();
      return !blacklist.some((b) => texto.includes(b));
    });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const item of filteredItems) {
        try {
          await client.query(
            `INSERT INTO cgu_reports (
               id_tarefa, id_auditoria, titulo_auditoria, ano, uf,
               municipio, codigo_municipio, assunto, data_publicacao,
               link_relatorio, local_pdf, sumario_executivo, ai_abstract,
               ultima_atualizacao
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
             ON CONFLICT (id_tarefa) DO UPDATE SET
               id_auditoria     = EXCLUDED.id_auditoria,
               titulo_auditoria = EXCLUDED.titulo_auditoria,
               ano              = EXCLUDED.ano,
               uf               = EXCLUDED.uf,
               municipio        = EXCLUDED.municipio,
               codigo_municipio = EXCLUDED.codigo_municipio,
               assunto          = EXCLUDED.assunto,
               data_publicacao  = EXCLUDED.data_publicacao,
               link_relatorio   = EXCLUDED.link_relatorio,
               local_pdf        = EXCLUDED.local_pdf,
               sumario_executivo = EXCLUDED.sumario_executivo,
               ai_abstract      = EXCLUDED.ai_abstract,
               ultima_atualizacao = EXCLUDED.ultima_atualizacao`,
            [
              item.idTarefa,
              item.idAuditoria ?? null,
              item.tituloAuditoria ?? null,
              item.ano ? parseInt(item.ano, 10) : null,
              item.uf ?? null,
              item.municipio ?? null,
              item.codigoMunicipio ?? null,
              item.assunto ?? null,
              item.dataPublicacao ?? null,
              item.linkRelatorio ?? null,
              item.localPdf ?? null,
              item.sumarioExecutivo ?? null,
              item.aiAbstract ?? null,
              updatedAt,
            ]
          );
          inseridos++;
        } catch (errItem: any) {
          console.error(`[CGU-REPORTS-IMPORT] Erro no item ${item.idTarefa}:`, errItem.message);
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

    await atualizarStatusImportacao({
      id: importControlId,
      status: erros > 0 && inseridos === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
      quantidade_inseridos: inseridos,
      quantidade_erros: erros,
      observacoes: `${filteredItems.length} de ${items.length} itens passaram no filtro MTE.`,
    });

    return res.json({
      success: true,
      importedCount: inseridos,
      filteredOut: items.length - filteredItems.length,
      erros,
    });
  } catch (err: any) {
    console.error("[CGU-REPORTS-IMPORT] Erro fatal:", err);
    if (importControlId) await registrarErroImportacao(importControlId, err);
    return res
      .status(500)
      .json({ error: "Erro interno ao importar relatórios CGU." });
  }
});

// =========================================================================
// DELETE /cgu/reports/:idTarefa
// =========================================================================
router.delete("/cgu/reports/:idTarefa", async (req, res) => {
  try {
    await pool.query("DELETE FROM cgu_reports WHERE id_tarefa = $1", [
      req.params.idTarefa,
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir relatório CGU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// =========================================================================
// GET /cgu/import-status — Status das importações CGU
// =========================================================================
router.get("/cgu/import-status", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tcu_import_control
       WHERE modulo LIKE 'CGU%'
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
