import express from "express";
import { pool } from "../db";

const router = express.Router();

router.get("/tces", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tces');
    // Map snake_case to camelCase/PascalCase as expected by frontend
    const mapped = result.rows.map(row => ({
      id: row.id,
      NUMERO_ANO_TCE: row.numero_ano_tce,
      PROCESSO_ADMINISTRATIVO: row.processo_administrativo,
      MOTIVO_INSTAURACAO: row.motivo_instauracao,
      SUBMOTIVO_INSTAURACAO: row.submotivo_instauracao,
      DEBITO_ORIGINAL: row.debito_original,
      DEBITO_ATUALIZADO: row.debito_atualizado,
      DATA_ATUALIZACAO_DEBITO: row.data_atualizacao_debito,
      ULTIMO_POSICIONAMENTO: row.ultimo_posicionamento,
      TC: row.tc,
      ESTADO_PROCESSO: row.estado_processo,
      SITUACAO_PROCESSO: row.situacao_processo,
      PRIMEIRO_JULGAMENTO: row.primeiro_julgamento,
      ENCERRAMENTO: row.encerramento,
      NUMERO_SIAFI: row.numero_siafi,
      SIAFI_RESSARCIDO: row.siafi_ressarcido,
      ANO: row.ano,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching TCEs from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch TCEs." });
  }
});

router.post("/tces/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = new Date().toLocaleString("pt-BR");
    
    // Note: Usually we would only update changed fields or do a full update.
    const query = `
      UPDATE tces SET
        numero_ano_tce = $2, processo_administrativo = $3, motivo_instauracao = $4,
        submotivo_instauracao = $5, debito_original = $6, debito_atualizado = $7,
        data_atualizacao_debito = $8, ultimo_posicionamento = $9, tc = $10,
        estado_processo = $11, situacao_processo = $12, primeiro_julgamento = $13,
        encerramento = $14, numero_siafi = $15, siafi_ressarcido = $16, ano = $17,
        ultima_atualizacao = $18
      WHERE id = $1 RETURNING *
    `;
    
    const values = [
      updated.id, updated.NUMERO_ANO_TCE, updated.PROCESSO_ADMINISTRATIVO, updated.MOTIVO_INSTAURACAO,
      updated.SUBMOTIVO_INSTAURACAO, updated.DEBITO_ORIGINAL, updated.DEBITO_ATUALIZADO,
      updated.DATA_ATUALIZACAO_DEBITO, updated.ULTIMO_POSICIONAMENTO, updated.TC,
      updated.ESTADO_PROCESSO, updated.SITUACAO_PROCESSO, updated.PRIMEIRO_JULGAMENTO,
      updated.ENCERRAMENTO, updated.NUMERO_SIAFI, updated.SIAFI_RESSARCIDO, updated.ANO,
      updatedAt
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "TCE não encontrada no Postgres." });
    }
  } catch (err) {
    console.error("Error updating TCE in Postgres:", err);
    res.status(500).json({ error: "Failed to update TCE." });
  }
});

router.delete("/tces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM tces WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting TCE from Postgres:", err);
    res.status(500).json({ error: "Failed to delete TCE." });
  }
});

router.post("/tces/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importação inválido para TCE." });
    }

    let importedCount = 0;
    let updatedCount = 0;
    const updatedAt = new Date().toLocaleString("pt-BR");

    for (const item of items) {
      // Upsert logic
      const checkResult = await pool.query('SELECT id FROM tces WHERE id = $1 OR numero_ano_tce = $2', [item.id, item.NUMERO_ANO_TCE]);
      
      if (checkResult.rows.length > 0) {
        // Update
        const targetId = checkResult.rows[0].id;
        await pool.query(`
          UPDATE tces SET
            numero_ano_tce = $2, processo_administrativo = $3, motivo_instauracao = $4,
            submotivo_instauracao = $5, debito_original = $6, debito_atualizado = $7,
            data_atualizacao_debito = $8, ultimo_posicionamento = $9, tc = $10,
            estado_processo = $11, situacao_processo = $12, primeiro_julgamento = $13,
            encerramento = $14, numero_siafi = $15, siafi_ressarcido = $16, ano = $17,
            ultima_atualizacao = $18
          WHERE id = $1
        `, [
          targetId, item.NUMERO_ANO_TCE, item.PROCESSO_ADMINISTRATIVO, item.MOTIVO_INSTAURACAO,
          item.SUBMOTIVO_INSTAURACAO, item.DEBITO_ORIGINAL, item.DEBITO_ATUALIZADO,
          item.DATA_ATUALIZACAO_DEBITO, item.ULTIMO_POSICIONAMENTO, item.TC,
          item.ESTADO_PROCESSO, item.SITUACAO_PROCESSO, item.PRIMEIRO_JULGAMENTO,
          item.ENCERRAMENTO, item.NUMERO_SIAFI, item.SIAFI_RESSARCIDO, item.ANO,
          updatedAt
        ]);
        updatedCount++;
      } else {
        // Insert
        await pool.query(`
          INSERT INTO tces (
            id, numero_ano_tce, processo_administrativo, motivo_instauracao,
            submotivo_instauracao, debito_original, debito_atualizado, data_atualizacao_debito,
            ultimo_posicionamento, tc, estado_processo, situacao_processo, primeiro_julgamento,
            encerramento, numero_siafi, siafi_ressarcido, ano, ultima_atualizacao
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
          )
        `, [
          item.id, item.NUMERO_ANO_TCE, item.PROCESSO_ADMINISTRATIVO, item.MOTIVO_INSTAURACAO,
          item.SUBMOTIVO_INSTAURACAO, item.DEBITO_ORIGINAL, item.DEBITO_ATUALIZADO,
          item.DATA_ATUALIZACAO_DEBITO, item.ULTIMO_POSICIONAMENTO, item.TC,
          item.ESTADO_PROCESSO, item.SITUACAO_PROCESSO, item.PRIMEIRO_JULGAMENTO,
          item.ENCERRAMENTO, item.NUMERO_SIAFI, item.SIAFI_RESSARCIDO, item.ANO,
          updatedAt
        ]);
        importedCount++;
      }
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM tces');
    
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: [] // Avoid sending back entire DB on import to save bandwidth
    });
  } catch (err) {
    console.error("Error importing TCEs in Postgres:", err);
    res.status(500).json({ error: "Failed to import TCEs." });
  }
});

// API 2.8: TCE com Acórdão mappings (Mapeamentos)
router.get("/tce-mappings", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tce_mappings');
    const mapped = result.rows.map(row => ({
      id: row.id,
      NUMERO_ANO_TCE: row.numero_ano_tce,
      ACORDAO_KEY: row.acordao_key,
      TIPO_RELACIONAMENTO: row.tipo_relacionamento,
      NOTAS: row.notas
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching TCE mappings:", err);
    res.status(500).json({ error: "Failed to fetch TCE mappings." });
  }
});

router.post("/tce-mappings/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de mapeamento inválido." });
    }

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const checkResult = await pool.query(
        'SELECT id FROM tce_mappings WHERE numero_ano_tce = $1 AND acordao_key = $2', 
        [item.NUMERO_ANO_TCE, item.ACORDAO_KEY]
      );
      
      if (checkResult.rows.length > 0) {
        await pool.query(
          'UPDATE tce_mappings SET tipo_relacionamento = $3, notas = $4 WHERE id = $1',
          [checkResult.rows[0].id, item.TIPO_RELACIONAMENTO, item.NOTAS]
        );
        updatedCount++;
      } else {
        await pool.query(
          'INSERT INTO tce_mappings (numero_ano_tce, acordao_key, tipo_relacionamento, notas) VALUES ($1, $2, $3, $4)',
          [item.NUMERO_ANO_TCE, item.ACORDAO_KEY, item.TIPO_RELACIONAMENTO, item.NOTAS]
        );
        importedCount++;
      }
    }

    const totalResult = await pool.query('SELECT COUNT(*) FROM tce_mappings');

    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: [] 
    });
  } catch (err) {
    console.error("Error importing TCE mappings:", err);
    res.status(500).json({ error: "Failed to import TCE mappings." });
  }
});

export default router;
