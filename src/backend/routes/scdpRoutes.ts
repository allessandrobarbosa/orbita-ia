import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/scdp/viagens", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scdp_viagens');
    
    // Convert snake_case to camelCase for the frontend
    const mapped = result.rows.map(r => ({
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

router.post("/scdp/viagens/:id/confirm-gru", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE scdp_viagens SET siafi_gru_devolucao_confirmada = true, siafi_detalhes_status = $1, siafi_confirmado = true WHERE id = $2 RETURNING *",
      ["Conciliado (Com Devolução GRU)", id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Viagem não encontrada no Postgres." });
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

export default router;
