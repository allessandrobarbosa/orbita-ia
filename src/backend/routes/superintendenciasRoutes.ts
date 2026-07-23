import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/superintendencias", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM superintendencias');
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
      demandasTCU: row.demandas_tcu,
      demandasCGU: row.demandas_cgu,
      demandasEtica: row.demandas_etica,
      statusGeral: row.status_geral
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
    
    // In a full implementation, you would dynamically update the fields in postgres.
    // For now, this is a mock implementation returning success
    res.json({ uf, ...updateData });
  } catch (error) {
    console.error("Error updating superintendencias:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
