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
    console.error("Erro ao buscar membros da ética:", error);
    res.status(500).json({ error: "Erro interno ao buscar membros" });
  }
});

router.post("/etica/membros", async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    await pool.query(
      "INSERT INTO etica_membros (id, nome, cpf, email, cargo, mandato_inicio, mandato_fim, status, ativo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [id, b.nome, b.cpf, b.email, b.atribuicao, b.dataInicioMandato, b.dataFimMandato, b.status || "Ativo", b.ativo !== false]
    );
    res.json({ ...b, id });
  } catch (error) {
    console.error("Erro ao cadastrar membro da ética:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar membro" });
  }
});

router.put("/etica/membros/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_membros SET nome=$1, cpf=$2, email=$3, cargo=$4, mandato_inicio=$5, mandato_fim=$6, status=$7, ativo=$8 WHERE id=$9",
      [b.nome, b.cpf, b.email, b.atribuicao, b.dataInicioMandato, b.dataFimMandato, b.status || "Ativo", b.ativo !== false, req.params.id]
    );
    res.json(b);
  } catch (error) {
    console.error("Erro ao atualizar membro da ética:", error);
    res.status(500).json({ error: "Erro interno ao atualizar membro" });
  }
});

router.delete("/etica/membros/:id", async (req, res) => {
  try {
    await pool.query("UPDATE etica_membros SET ativo = false WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao inativar membro da ética:", error);
    res.status(500).json({ error: "Erro interno ao inativar membro" });
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
    console.error("Erro ao buscar reuniões da ética:", error);
    res.status(500).json({ error: "Erro interno ao buscar reuniões" });
  }
});

router.post("/etica/reunioes", async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || `REU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    await pool.query(
      "INSERT INTO etica_reunioes (id, tipo, data_hora, pauta, confirmacoes, notificado_agendamento, notificado_lembrete, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [id, b.tipo, b.dataHora, b.pauta, JSON.stringify(b.confirmacoes || {}), b.notificadoAgendamento || false, b.notificadoLembrete || false, new Date().toISOString()]
    );
    res.json({ ...b, id });
  } catch (error) {
    console.error("Erro ao cadastrar reunião da ética:", error);
    res.status(500).json({ error: "Erro interno ao agendar reunião" });
  }
});

router.put("/etica/reunioes/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_reunioes SET tipo=$1, data_hora=$2, pauta=$3, confirmacoes=$4, notificado_agendamento=$5, notificado_lembrete=$6, ultima_atualizacao=$7 WHERE id=$8",
      [b.tipo, b.dataHora, b.pauta, JSON.stringify(b.confirmacoes || {}), b.notificadoAgendamento || false, b.notificadoLembrete || false, new Date().toISOString(), req.params.id]
    );
    res.json(b);
  } catch (error) {
    console.error("Erro ao atualizar reunião da ética:", error);
    res.status(500).json({ error: "Erro interno ao atualizar reunião" });
  }
});

router.delete("/etica/reunioes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_reunioes WHERE id = $1", [req.params.id]);
    await pool.query("DELETE FROM etica_atas WHERE reuniao_id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover reunião da ética:", error);
    res.status(500).json({ error: "Erro interno ao remover reunião" });
  }
});

// Atas
router.get("/etica/atas", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etica_atas');
    res.json(result.rows.map(r => ({ ...r, reuniaoId: r.reuniao_id, dataGeracao: r.data_geracao })));
  } catch (error) {
    console.error("Erro ao buscar atas da ética:", error);
    res.status(500).json({ error: "Erro interno ao buscar atas" });
  }
});

router.post("/etica/atas", async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || `ATA-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    await pool.query(
      "INSERT INTO etica_atas (id, reuniao_id, relatos, decisoes, data_geracao, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET relatos=$3, decisoes=$4, ultima_atualizacao=$6",
      [id, b.reuniaoId, b.relatos, b.decisoes, b.dataGeracao, new Date().toISOString()]
    );
    res.json({ ...b, id });
  } catch (error) {
    console.error("Erro ao salvar ata da ética:", error);
    res.status(500).json({ error: "Erro interno ao salvar ata" });
  }
});

// Processos
router.get("/etica/processos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM etica_processos');
    res.json(result.rows.map(r => ({ ...r, processoSei: r.processo_sei, dataInicio: r.data_inicio, dataFim: r.data_fim })));
  } catch (error) {
    console.error("Erro ao buscar processos da ética:", error);
    res.status(500).json({ error: "Erro interno ao buscar processos" });
  }
});

router.post("/etica/processos", async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || `PRC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    await pool.query(
      "INSERT INTO etica_processos (id, tipo, processo_sei, data_inicio, data_fim, resumo, responsavel, situacao, solicitante, assunto, ultima_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
      [id, b.tipo, b.processoSei, b.dataInicio, b.dataFim || null, b.resumo || null, b.responsavel || null, b.situacao, b.solicitante || null, b.assunto || null, new Date().toISOString()]
    );
    res.json({ ...b, id });
  } catch (error) {
    console.error("Erro ao cadastrar processo da ética:", error);
    res.status(500).json({ error: "Erro interno ao cadastrar processo" });
  }
});

router.put("/etica/processos/:id", async (req, res) => {
  try {
    const b = req.body;
    await pool.query(
      "UPDATE etica_processos SET tipo=$1, processo_sei=$2, data_inicio=$3, data_fim=$4, resumo=$5, responsavel=$6, situacao=$7, solicitante=$8, assunto=$9, ultima_atualizacao=$10 WHERE id=$11",
      [b.tipo, b.processoSei, b.dataInicio, b.dataFim || null, b.resumo || null, b.responsavel || null, b.situacao, b.solicitante || null, b.assunto || null, new Date().toISOString(), req.params.id]
    );
    res.json(b);
  } catch (error) {
    console.error("Erro ao atualizar processo da ética:", error);
    res.status(500).json({ error: "Erro interno ao atualizar processo" });
  }
});

router.delete("/etica/processos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_processos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover processo da ética:", error);
    res.status(500).json({ error: "Erro interno ao remover processo" });
  }
});

// ROTA PARA LIMPAR A BASE DA COMISSÃO DE ÉTICA
router.post("/etica/reset", async (req, res) => {
  try {
    await pool.query("DELETE FROM etica_atas");
    await pool.query("DELETE FROM etica_convidados");
    await pool.query("DELETE FROM etica_reunioes");
    await pool.query("DELETE FROM etica_processos");
    await pool.query("DELETE FROM etica_membros");
    res.json({ success: true, message: "Base da comissão de ética zerada com sucesso." });
  } catch (error) {
    console.error("Erro ao zerar base da comissão de ética:", error);
    res.status(500).json({ error: "Erro ao zerar base da comissão de ética" });
  }
});

export default router;
