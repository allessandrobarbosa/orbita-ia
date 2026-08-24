import express from "express";
import { pool } from "../db.js";
import { scdpSyncService } from "../services/ScdpSyncService.js";
import { scdpAiAgent } from "../services/ScdpAiAgent.js";

const router = express.Router();

router.get("/scdp/viagens", async (req, res) => {
  try {
    const { dataIdaDe, dataIdaAte, maxPages, forceRefresh } = req.query;
    const apiKey = req.headers["chave-api-dados"] as string;

    // Se solicitado forceRefresh, sincroniza via Datalake para fugir do rate limit
    if (forceRefresh === "true") {
      // Baixa os dados consolidados do ano inteiro (2024)
      await scdpSyncService.syncViaDatalake("2024");
    }

    const result = await pool.query('SELECT * FROM scdp_viagens ORDER BY data_inicio DESC');
    
    // Mapeamento para o frontend
    const mapped = result.rows.map(r => ({
      id: r.id,
      numeroViagem: r.id,
      nomeViajante: r.nome_viajante,
      cpfViajante: r.cpf_viajante,
      siapeViajante: r.siape_viajante,
      emailViajante: r.email_viajante,
      destino: r.destino,
      motivoViagem: r.motivo_viagem,
      cargo: r.cargo,
      situacao: r.situacao,
      viagemUrgente: r.viagem_urgente,
      justificativaUrgencia: r.justificativa_urgencia,
      orgaoSolicitante: r.orgao_solicitante,
      orgaoSuperior: r.orgao_superior,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      valorPassagem: parseFloat(r.valor_passagem) || 0,
      valorDiarias: parseFloat(r.valor_diarias) || 0,
      valorTotal: (parseFloat(r.valor_passagem) || 0) + (parseFloat(r.valor_diarias) || 0),
      statusPrestacao: r.status_prestacao || (r.siafi_gru_devolucao_confirmada ? "No Prazo" : "Pendente"),
      scoreRiscoIa: r.score_risco_ia,
      justificativaIa: r.justificativa_ia,
      siafiGruDevolucaoConfirmada: r.siafi_gru_devolucao_confirmada,
      siafiDetalhesStatus: r.siafi_detalhes_status,
      siafiConfirmado: r.siafi_confirmado,
      siafiScdpDivergencia: r.siafi_scdp_divergencia,
      siafiEmpenho: r.siafi_empenho,
      siafiOb: r.siafi_ob,
      sigepeLotacao: r.sigepe_lotacao,
      sobreposicaoFerias: r.sobreposicao_ferias,
      sobreposicaoLicenca: r.sobreposicao_licenca,
      inconsistenciaVinculo: r.inconsistencia_vinculo
    }));
    
    res.json({ success: true, data: mapped, isSimulated: !apiKey });
  } catch (error) {
    console.error("Error fetching SCDP trips:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

const handleAnalyze = async (req: any, res: any) => {
  try {
    const id = req.params.subId ? `${req.params.id}/${req.params.subId}` : req.params.id;
    const result = await pool.query('SELECT * FROM scdp_viagens WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Viagem não encontrada." });
    }
    
    const r = result.rows[0];
    const analise = await scdpAiAgent.analyzeViagem({
      id: r.id,
      nome_viajante: r.nome_viajante,
      data_inicio: r.data_inicio,
      data_fim: r.data_fim,
      destino: r.destino,
      motivo_viagem: r.motivo_viagem,
      valor_total: (parseFloat(r.valor_passagem) || 0) + (parseFloat(r.valor_diarias) || 0)
    });
    
    await pool.query(
      "UPDATE scdp_viagens SET score_risco_ia = $1, justificativa_ia = $2 WHERE id = $3",
      [analise.scoreRisco, analise.justificativa, id]
    );

    res.json({ success: true, analise });
  } catch (error) {
    console.error("Erro na análise IA:", error);
    res.status(500).json({ error: "Erro interno" });
  }
};

const handleConfirmGru = async (req: any, res: any) => {
  try {
    const id = req.params.subId ? `${req.params.id}/${req.params.subId}` : req.params.id;
    const result = await pool.query(
      "UPDATE scdp_viagens SET siafi_gru_devolucao_confirmada = true, siafi_detalhes_status = $1, siafi_confirmado = true WHERE id = $2 RETURNING *",
      ["Conciliado (Com Devolução GRU)", id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Viagem não encontrada." });
    return res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    console.error("Error confirming GRU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
};

router.post("/scdp/viagens/:id/analyze", handleAnalyze);
router.post("/scdp/viagens/:id/:subId/analyze", handleAnalyze);

router.post("/scdp/viagens/:id/confirm-gru", handleConfirmGru);
router.post("/scdp/viagens/:id/:subId/confirm-gru", handleConfirmGru);

// Importação Local (Fallback) mantida para compatibilidade
router.post("/scdp/import-local-files", async (req, res) => {
  res.json({ success: true, message: "Importação via planilhas deprecada. Utilize sincronização via API da CGU com chave." });
});

router.get("/scdp/import-status", async (req, res) => {
  res.json({ success: true, data: [] });
});

export default router;
