import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/superintendencias", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.*, 
        v.demandas_tcu as view_tcu, 
        v.demandas_cgu as view_cgu,
        v.demandas_comunicacoes,
        v.demandas_tces,
        (SELECT json_agg(acordao_key) FROM srte_acordao WHERE uf = s.uf) as acordao_ids,
        (SELECT json_agg(comunicacao_key) FROM srte_comunicacao WHERE uf = s.uf) as comunicacao_ids,
        (SELECT json_agg(tce_id) FROM srte_tce WHERE uf = s.uf) as tce_ids,
        (SELECT json_agg(cgu_id) FROM srte_cgu WHERE uf = s.uf) as cgu_ids
      FROM superintendencias s
      LEFT JOIN vw_srte_dashboard_metrics v ON s.uf = v.uf
    `);
    const mapped = result.rows.map(row => ({
      uf: row.uf,
      capital: row.capital,
      superintendente: row.superintendente,
      cargo: row.cargo,
      endereco: row.endereco,
      contato: row.contato,
      email: row.email,
      substituto: row.substituto,
      emailSubstituto: row.email_substituto,
      cep: row.cep,
      latitude: row.latitude,
      longitude: row.longitude,
      demandasTCU: parseInt(row.view_tcu) || 0,
      demandasCGU: parseInt(row.view_cgu) || 0,
      demandasComunicacoes: parseInt(row.demandas_comunicacoes) || 0,
      demandasTces: parseInt(row.demandas_tces) || 0,
      demandasEtica: row.demandas_etica,
      statusGeral: row.status_geral,
      acordaoIds: row.acordao_ids || [],
      comunicacaoIds: row.comunicacao_ids || [],
      tceIds: row.tce_ids || [],
      cguIds: row.cgu_ids || []
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching superintendencias:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.put("/superintendencias/:uf", async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const updateData = req.body;
    
    await pool.query(`
      UPDATE superintendencias 
      SET 
        superintendente = $1,
        endereco = $2,
        contato = $3,
        email = $4,
        substituto = $5,
        email_substituto = $6,
        cep = $7,
        status_geral = $8
      WHERE uf = $9
    `, [
      updateData.superintendente,
      updateData.endereco,
      updateData.contato,
      updateData.email,
      updateData.substituto,
      updateData.emailSubstituto,
      updateData.cep,
      updateData.statusGeral,
      uf
    ]);
    
    res.json({ success: true, uf, ...updateData });
  } catch (error) {
    console.error("Error updating superintendencias:", error);
    res.status(500).json({ error: "Erro interno ao atualizar a superintendência" });
  }
});

export default router;
