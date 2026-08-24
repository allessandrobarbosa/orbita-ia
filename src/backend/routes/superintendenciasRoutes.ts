import express from "express";
import { pool } from "../db.js";
import {
  ensureSrteLinkingTables,
  srteLinkingTablesReady,
  triggerSrteRecalcIfIdle,
  recalcJobStatus,
  SRTE_LOOKUP,
} from "../services/srteRecalcService.js";

const router = express.Router();

// =============================================================================
// GET /superintendencias
// =============================================================================
router.get("/superintendencias", async (req, res) => {
  await ensureSrteLinkingTables();

  try {
    const result = await pool.query(`
      SELECT
        s.*,
        COALESCE(v.demandas_tcu, 0)            AS view_tcu,
        COALESCE(v.demandas_cgu, 0)             AS view_cgu,
        COALESCE(v.demandas_comunicacoes, 0)    AS demandas_comunicacoes,
        COALESCE(v.demandas_tces, 0)            AS demandas_tces,
        COALESCE(v.contratos_ativos, 0)         AS contratos_ativos,
        COALESCE(v.despesa_mensal_contratos, 0) AS despesa_mensal_contratos,
        (SELECT json_agg(acordao_key)    FROM srte_acordao     WHERE uf = s.uf) AS acordao_ids,
        (SELECT json_agg(comunicacao_key) FROM srte_comunicacao WHERE uf = s.uf) AS comunicacao_ids,
        (SELECT json_agg(tce_id)         FROM srte_tce          WHERE uf = s.uf) AS tce_ids,
        (SELECT json_agg(cgu_id)         FROM srte_cgu          WHERE uf = s.uf) AS cgu_ids,
        (SELECT json_agg(json_build_object(
          'id', id,
          'numero', numero_contrato,
          'empresa', empresa,
          'objeto', objeto,
          'valorMensal', valor_mensal,
          'status', status
        )) FROM contratos WHERE uf = s.uf) AS contratos_list
      FROM superintendencias s
      LEFT JOIN vw_srte_dashboard_metrics v ON s.uf = v.uf
    `);

    const mapped = result.rows.map(row => ({
      uf:                   row.uf,
      capital:              row.capital,
      superintendente:      row.superintendente,
      cargo:                row.cargo,
      endereco:             row.endereco,
      contato:              row.contato,
      email:                row.email,
      substituto:           row.substituto,
      emailSubstituto:      row.email_substituto,
      cep:                  row.cep,
      latitude:             row.latitude,
      longitude:            row.longitude,
      demandasTCU:          parseInt(row.view_tcu)              || 0,
      demandasCGU:          parseInt(row.view_cgu)              || 0,
      demandasComunicacoes: parseInt(row.demandas_comunicacoes) || 0,
      demandasTces:         parseInt(row.demandas_tces)         || 0,
      contratosAtivos:      parseInt(row.contratos_ativos)      || 0,
      despesaMensalContratos: parseFloat(row.despesa_mensal_contratos) || 0,
      demandasEtica:        row.demandas_etica,
      statusGeral:          row.status_geral,
      acordaoIds:           row.acordao_ids     || [],
      comunicacaoIds:       row.comunicacao_ids || [],
      tceIds:               row.tce_ids         || [],
      cguIds:               row.cgu_ids         || [],
      contratosList:        row.contratos_list  || [],
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error fetching superintendencias:", error);
    res.status(500).json({ error: "Erro interno ao buscar superintendências." });
  }
});

// =============================================================================
// PUT /superintendencias/:uf
// =============================================================================
router.put("/superintendencias/:uf", async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const d  = req.body;
    await pool.query(`
      UPDATE superintendencias
      SET superintendente  = $1, endereco = $2, contato = $3, email = $4,
          substituto       = $5, email_substituto = $6, cep = $7, status_geral = $8
      WHERE uf = $9
    `, [d.superintendente, d.endereco, d.contato, d.email,
        d.substituto, d.emailSubstituto, d.cep, d.statusGeral, uf]);
    res.json({ success: true, uf, ...d });
  } catch (error) {
    console.error("Error updating superintendencias:", error);
    res.status(500).json({ error: "Erro interno ao atualizar a superintendência." });
  }
});

// =============================================================================
// POST /srte/recalcular-vinculos — Dispara recálculo manual
// =============================================================================
router.post("/srte/recalcular-vinculos", async (req, res) => {
  if (recalcJobStatus.running) {
    return res.status(409).json({
      success: false,
      message: "Recálculo já em andamento. Aguarde a conclusão.",
      status: recalcJobStatus,
    });
  }

  res.status(202).json({
    success: true,
    message: `Recálculo iniciado para ${SRTE_LOOKUP.length} SRTEs.`,
    startedAt: new Date().toISOString(),
  });

  // Inicia após enviar o response
  triggerSrteRecalcIfIdle("MANUAL").catch(err =>
    console.error("[SRTE] Erro ao iniciar recálculo manual:", err)
  );
});

// =============================================================================
// GET /srte/recalcular-vinculos/status
// =============================================================================
router.get("/srte/recalcular-vinculos/status", (_req, res) => {
  res.json({ success: true, status: recalcJobStatus });
});

// =============================================================================
// GET /api/srte/diagnostico/:uf — Diagnóstico de dados para debugging
// =============================================================================
router.get("/srte/diagnostico/:uf", async (req, res) => {
  const uf = req.params.uf.toUpperCase();
  const srte = SRTE_LOOKUP.find(s => s.uf === uf);
  if (!srte) return res.status(404).json({ error: `UF "${uf}" não encontrada.` });

  try {
    const [tables, acordaos, comunicacoes, tces, cgu, vinculos] = await Promise.all([
      pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('srte_acordao','srte_comunicacao','srte_tce','srte_cgu')`),
      pool.query(`SELECT key, titulo, interessados, assunto FROM tcu_acordaos LIMIT 3`).catch(() => ({ rows: [] })),
      pool.query(`SELECT key, comunicacao, destinatario FROM tcu_comunicacoes LIMIT 3`).catch(() => ({ rows: [] })),
      pool.query(`SELECT id, numero_ano_tce, processo_administrativo, motivo_instauracao FROM tcu_tce LIMIT 3`).catch(() => ({ rows: [] })),
      pool.query(`SELECT id_tarefa, estado, unidade_auditada FROM cgu_demands LIMIT 3`).catch(() => ({ rows: [] })),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM srte_acordao     WHERE uf = $1) AS acordaos,
          (SELECT COUNT(*) FROM srte_comunicacao WHERE uf = $1) AS comunicacoes,
          (SELECT COUNT(*) FROM srte_tce          WHERE uf = $1) AS tces,
          (SELECT COUNT(*) FROM srte_cgu          WHERE uf = $1) AS cgu
      `, [uf]).catch(() => ({ rows: [{}] })),
    ]);

    res.json({
      uf, srteMetadata: srte,
      tablesExisting: tables.rows.map((r: any) => r.table_name),
      vinculosAtuais: vinculos.rows[0],
      amostras: { acordaos: acordaos.rows, comunicacoes: comunicacoes.rows, tces: tces.rows, cgu: cgu.rows },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
