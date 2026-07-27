import express from "express";
import { pool } from "../db";

const router = express.Router();

router.get("/acordaos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tcu_acordaos');
    const mapped = result.rows.map(row => ({
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
      ACORDAO: row.acordao,
      DECISAO: row.decisao,
      RECOMENDACOES: row.recomendacoes,
      DETERMINACOES: row.determinacoes,
      RECOMENDACOES_DETERMINACOES_UNIFICADO: row.recomendacoes_determinacoes_unificado,
      STATUS_MONITORAMENTO: row.status_monitoramento,
      RESPONSAVEL_INTERNO: row.responsavel_interno,
      PRAZO_LIMITE: row.prazo_limite,
      OBSERVACOES: row.observacoes,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao,
      aiAnalysisData: row.ai_analysis_data
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching Acórdãos from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch Acórdãos." });
  }
});

router.post("/acordaos/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = new Date().toLocaleString("pt-BR");
    
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
      updated.KEY, updated.TITULO, updated.NUMACORDAO, updated.ANOACORDAO,
      updated.NUMATA, updated.COLEGIADO, updated.DATASESSAO, updated.SITUACAO,
      updated.PROC, updated.ACORDAOSRELACIONADOS, updated.TIPOPROCESSO,
      updated.INTERESSADOS, updated.ENTIDADE, updated.UNIDADETECNICA,
      updated.RELATOR, updated.ASSUNTO, updated.SUMARIO, updated.ACORDAO,
      updated.DECISAO, updated.RECOMENDACOES, updated.DETERMINACOES,
      updated.RECOMENDACOES_DETERMINACOES_UNIFICADO, updated.STATUS_MONITORAMENTO,
      updated.RESPONSAVEL_INTERNO, updated.PRAZO_LIMITE, updated.OBSERVACOES,
      updatedAt, updated.aiAnalysisData ? JSON.stringify(updated.aiAnalysisData) : null
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Acórdão não encontrado no Postgres." });
    }
  } catch (err) {
    console.error("Error updating Acórdão in Postgres:", err);
    res.status(500).json({ error: "Failed to update Acórdão." });
  }
});

router.delete("/acordaos/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query('DELETE FROM tcu_acordaos WHERE key = $1', [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting Acórdão from Postgres:", err);
    res.status(500).json({ error: "Failed to delete Acórdão." });
  }
});

export default router;
