import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// API: Get all comunicacoes
router.get("/comunicacoes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM comunicacoes');
    const mapped = result.rows.map(row => ({
      KEY: row.key,
      COMUNICACAO: row.comunicacao,
      DESTINATARIO: row.destinatario,
      CONTATO: row.contato,
      UNIDADE_EMITENTE: row.unidade_emitente,
      PROCESSO: row.processo,
      DATA_EXPEDICAO: row.data_expedicao,
      DATA_RESPOSTA: row.data_resposta,
      ANO: row.ano,
      CARECE_RESPOSTA: row.carece_resposta,
      PRAZO_DIAS: row.prazo_dias,
      RESPOSTA_ENVIADA_INTERNAMENTE: row.resposta_enviada_internamente,
      UNIDADE_EXECUTORA: row.unidade_executora,
      PROCESSO_SEI: row.processo_sei,
      DESTINACAO: row.destinacao,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching comunicacoes:", err);
    res.status(500).json({ error: "Failed to fetch comunicacoes." });
  }
});

// API: Update single comunicacao
router.post("/comunicacoes/update", async (req, res) => {
  try {
    const updated = req.body;
    updated.ULTIMA_ATUALIZACAO = new Date().toLocaleString("pt-BR");

    const checkResult = await pool.query('SELECT key FROM comunicacoes WHERE key = $1', [updated.KEY]);
    
    if (checkResult.rows.length > 0) {
      await pool.query(`
        UPDATE comunicacoes SET
          comunicacao = $2, destinatario = $3, contato = $4, unidade_emitente = $5,
          processo = $6, data_expedicao = $7, data_resposta = $8, ano = $9,
          carece_resposta = $10, prazo_dias = $11, resposta_enviada_internamente = $12,
          unidade_executora = $13, processo_sei = $14, destinacao = $15, ultima_atualizacao = $16
        WHERE key = $1
      `, [
        updated.KEY, updated.COMUNICACAO, updated.DESTINATARIO, updated.CONTATO,
        updated.UNIDADE_EMITENTE, updated.PROCESSO, updated.DATA_EXPEDICAO,
        updated.DATA_RESPOSTA, updated.ANO, updated.CARECE_RESPOSTA,
        updated.PRAZO_DIAS, updated.RESPOSTA_ENVIADA_INTERNAMENTE,
        updated.UNIDADE_EXECUTORA, updated.PROCESSO_SEI, updated.DESTINACAO,
        updated.ULTIMA_ATUALIZACAO
      ]);
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Comunicação não encontrada." });
    }
  } catch (err) {
    console.error("Error updating comunicacao:", err);
    res.status(500).json({ error: "Failed to update comunicacao." });
  }
});

// API: Delete comunicacao
router.delete("/comunicacoes/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query('DELETE FROM comunicacoes WHERE key = $1', [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting comunicacao:", err);
    res.status(500).json({ error: "Failed to delete comunicacao." });
  }
});

// API: Import comunicacoes
router.post("/comunicacoes/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato inválido." });
    }

    let importedCount = 0;
    let updatedCount = 0;
    const updatedAt = new Date().toLocaleString("pt-BR");

    for (const item of items) {
      if (!item.KEY) {
        item.KEY = `${item.COMUNICACAO}-${item.ANO}`; 
      }
      
      const checkResult = await pool.query(
        'SELECT key FROM comunicacoes WHERE key = $1 OR (comunicacao = $2 AND ano = $3)',
        [item.KEY, item.COMUNICACAO, item.ANO]
      );
      
      if (checkResult.rows.length > 0) {
        const targetKey = checkResult.rows[0].key;
        await pool.query(`
          UPDATE comunicacoes SET
            comunicacao = $2, destinatario = $3, contato = $4, unidade_emitente = $5,
            processo = $6, data_expedicao = $7, data_resposta = $8, ano = $9,
            carece_resposta = $10, prazo_dias = $11, resposta_enviada_internamente = $12,
            unidade_executora = $13, processo_sei = $14, destinacao = $15, ultima_atualizacao = $16
          WHERE key = $1
        `, [
          targetKey, item.COMUNICACAO, item.DESTINATARIO, item.CONTATO,
          item.UNIDADE_EMITENTE, item.PROCESSO, item.DATA_EXPEDICAO,
          item.DATA_RESPOSTA, item.ANO, item.CARECE_RESPOSTA,
          item.PRAZO_DIAS, item.RESPOSTA_ENVIADA_INTERNAMENTE,
          item.UNIDADE_EXECUTORA, item.PROCESSO_SEI, item.DESTINACAO,
          updatedAt
        ]);
        updatedCount++;
      } else {
        await pool.query(`
          INSERT INTO comunicacoes (
            key, comunicacao, destinatario, contato, unidade_emitente,
            processo, data_expedicao, data_resposta, ano, carece_resposta,
            prazo_dias, resposta_enviada_internamente, unidade_executora,
            processo_sei, destinacao, ultima_atualizacao
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
          )
        `, [
          item.KEY, item.COMUNICACAO, item.DESTINATARIO, item.CONTATO,
          item.UNIDADE_EMITENTE, item.PROCESSO, item.DATA_EXPEDICAO,
          item.DATA_RESPOSTA, item.ANO, item.CARECE_RESPOSTA,
          item.PRAZO_DIAS, item.RESPOSTA_ENVIADA_INTERNAMENTE,
          item.UNIDADE_EXECUTORA, item.PROCESSO_SEI, item.DESTINACAO,
          updatedAt
        ]);
        importedCount++;
      }
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM comunicacoes');
    
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: [] 
    });
  } catch (err) {
    console.error("Error importing comunicacoes:", err);
    res.status(500).json({ error: "Failed to import comunicacoes." });
  }
});

export default router;
