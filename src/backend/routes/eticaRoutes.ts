import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/comissao-etica", (req, res) => res.json([]));

router.get("/etica/membros", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etica_membros');
    res.json(result.rows.map(r => ({
      ...r,
      dataInicioMandato: r.mandato_inicio,
      dataFimMandato: r.mandato_fim,
      atribuicao: r.cargo
    })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/etica/membros", async (req, res) => {
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

router.put("/etica/membros/:id", async (req, res) => {
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

router.delete("/etica/membros/:id", async (req, res) => {
  try {
    await pool.query("UPDATE etica_membros SET ativo = false WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// Reunioes
router.get("/etica/reunioes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etica_reunioes');
    res.json(result.rows.map(r => ({ 
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

router.post("/etica/reunioes", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_reunioes (id, tipo, data_hora, pauta, confirmacoes, notificado_agendamento, notificado_lembrete, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [b.id, b.tipo, b.dataHora, b.pauta, JSON.stringify(b.confirmacoes), b.notificadoAgendamento, b.notificadoLembrete, new Date().toISOString()]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/etica/reunioes/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_reunioes SET tipo=$1, data_hora=$2, pauta=$3, confirmacoes=$4, notificado_agendamento=$5, notificado_lembrete=$6, ultima_atualizacao=$7 WHERE id=$8",
      [b.tipo, b.dataHora, b.pauta, JSON.stringify(b.confirmacoes), b.notificadoAgendamento, b.notificadoLembrete, new Date().toISOString(), req.params.id]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/etica/reunioes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_reunioes WHERE id = $1", [req.params.id]);
    await pool.query("DELETE FROM etica_atas WHERE reuniao_id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// Atas
router.get("/etica/atas", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etica_atas');
    res.json(result.rows.map(r => ({ ...r, reuniaoId: r.reuniao_id, dataGeracao: r.data_geracao })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/etica/atas", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_atas (id, reuniao_id, relatos, decisoes, data_geracao, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET relatos=$3, decisoes=$4, ultima_atualizacao=$6",
      [b.id, b.reuniaoId, b.relatos, b.decisoes, b.dataGeracao, new Date().toISOString()]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

// Processos
router.get("/etica/processos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etica_processos');
    res.json(result.rows.map(r => ({ ...r, processoSei: r.processo_sei, dataInicio: r.data_inicio, dataFim: r.data_fim })));
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/etica/processos", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "INSERT INTO etica_processos (id, tipo, processo_sei, data_inicio, data_fim, resumo, responsavel, situacao, solicitante, assunto, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [b.id, b.tipo, b.processoSei, b.dataInicio, b.dataFim, b.resumo, b.responsavel, b.situacao, b.solicitante, b.assunto, new Date().toISOString()]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/etica/processos/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_processos SET tipo=$1, processo_sei=$2, data_inicio=$3, data_fim=$4, resumo=$5, responsavel=$6, situacao=$7, solicitante=$8, assunto=$9, ultima_atualizacao=$10 WHERE id=$11",
      [b.tipo, b.processoSei, b.dataInicio, b.dataFim, b.resumo, b.responsavel, b.situacao, b.solicitante, b.assunto, new Date().toISOString(), req.params.id]
    );
    res.json(b);
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/etica/processos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_processos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
