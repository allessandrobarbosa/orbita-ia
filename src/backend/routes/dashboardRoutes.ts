import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/dashboard-stats", async (req, res) => {
  try {
    const qAcordaos = await pool.query('SELECT COUNT(*) FROM tcu_acordaos');
    const qTces = await pool.query('SELECT COUNT(*) FROM tcu_tce');
    const qComunicacoes = await pool.query('SELECT COUNT(*) FROM tcu_comunicacoes');
    const qCgu = await pool.query('SELECT COUNT(*) FROM cgu_demands');
    const qCguReports = await pool.query('SELECT COUNT(*) FROM cgu_reports');
    
    // Quick simple sum of all stats to keep dashboard working
    res.json({
      acordaosCount: parseInt(qAcordaos.rows[0].count),
      tceCount: parseInt(qTces.rows[0].count),
      comunicacoesCount: parseInt(qComunicacoes.rows[0].count),
      cguCount: parseInt(qCgu.rows[0].count),
      cguReportsCount: parseInt(qCguReports.rows[0].count)
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.json({
      acordaosCount: 0,
      tceCount: 0,
      comunicacoesCount: 0,
      cguCount: 0,
      cguReportsCount: 0
    });
  }
});

export default router;
