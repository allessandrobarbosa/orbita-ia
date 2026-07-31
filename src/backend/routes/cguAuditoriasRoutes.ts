import express from "express";
import { pool } from "../db.js";
import { runImportCguAuditorias } from "../utils/importCguAuditorias.js";

const router = express.Router();

// GET /cgu/auditorias
router.get("/cgu/auditorias", async (req, res) => {
  try {
    const { 
      page = "1", limit = "10", sort = "data_publicacao", order = "DESC",
      periodoInicio, periodoFim, idAuditoria, tituloRelatorio, tipoServico, uf, municipio, grupoAtividade
    } = req.query;

    let q = "SELECT * FROM cgu_auditorias WHERE 1=1";
    let params: any[] = [];
    let paramIdx = 1;

    if (idAuditoria) { q += ` AND id_auditoria ILIKE $${paramIdx++}`; params.push(`%${idAuditoria}%`); }
    if (tituloRelatorio) { q += ` AND titulo_relatorio ILIKE $${paramIdx++}`; params.push(`%${tituloRelatorio}%`); }
    if (tipoServico) { q += ` AND tipo_servico ILIKE $${paramIdx++}`; params.push(`%${tipoServico}%`); }
    if (uf) { q += ` AND uf = $${paramIdx++}`; params.push(uf); }
    if (municipio) { q += ` AND municipio ILIKE $${paramIdx++}`; params.push(`%${municipio}%`); }
    if (grupoAtividade) { q += ` AND grupo_atividade ILIKE $${paramIdx++}`; params.push(`%${grupoAtividade}%`); }
    if (periodoInicio) { q += ` AND data_publicacao >= $${paramIdx++}`; params.push(periodoInicio); }
    if (periodoFim) { q += ` AND data_publicacao <= $${paramIdx++}`; params.push(periodoFim); }

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

// GET /cgu/auditorias-dashboard
router.get("/cgu/auditorias-dashboard", async (req, res) => {
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
        SUM(CASE WHEN estado ILIKE '%Pendente%' THEN 1 ELSE 0 END) as total_pendencias,
        SUM(CASE WHEN estado ILIKE '%Concluído%' OR estado ILIKE '%Atendido%' THEN 1 ELSE 0 END) as total_concluidos
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

// GET /cgu/auditorias/:id_tarefa
router.get("/cgu/auditorias/:id_tarefa", async (req, res) => {
  try {
    const { id_tarefa } = req.params;
    const audRes = await pool.query("SELECT * FROM cgu_auditorias WHERE id_tarefa = $1 LIMIT 1", [id_tarefa]);
    
    if (audRes.rows.length === 0) {
      return res.status(404).json({ error: "Auditoria não encontrada." });
    }

    const auditoria = audRes.rows[0];

    // Busca dossiê de monitoramento relacionando tanto por id_tarefa quanto extração parcial de titulo_tarefa (usando id_auditoria)
    const demRes = await pool.query(`
      SELECT * FROM cgu_demands 
      WHERE id_tarefa = $1 
         OR (titulo_tarefa IS NOT NULL AND titulo_tarefa ILIKE $2)
    `, [id_tarefa, \`%\${auditoria.id_auditoria}%\`]);

    const monitoramentos = demRes.rows;

    res.json({ auditoria, monitoramentos });
  } catch (error) {
    console.error("Erro ao obter detalhes da auditoria:", error);
    res.status(500).json({ error: "Erro interno ao detalhar auditoria." });
  }
});

// POST /cgu/auditorias/sync
router.post("/cgu/auditorias/sync", async (req, res) => {
  const usuarioId = (req as any).session?.user?.id ?? "SISTEMA";
  const result = await runImportCguAuditorias(usuarioId);
  if (result.error) {
    return res.status(500).json(result);
  }
  res.json(result);
});

export default router;
