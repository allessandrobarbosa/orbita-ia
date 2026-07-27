import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/contratos", async (req, res) => {
  const result = await pool.query('SELECT * FROM contratos');
  const mapped = result.rows.map(r => ({
    id: r.id, numeroContrato: r.numero_contrato, empresa: r.empresa, cnpj: r.cnpj, 
    objeto: r.objeto, valorAnual: parseFloat(r.valor_anual) || 0, dataInicio: r.data_inicio, 
    dataFim: r.data_fim, uf: r.uf
  }));
  res.json(mapped);
});

router.post("/contratos", async (req, res) => {
  const c = req.body;
  c.id = "C-" + Date.now();
  await pool.query(
    "INSERT INTO contratos (id, numero_contrato, empresa, cnpj, objeto, valor_anual, data_inicio, data_fim, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorAnual, c.dataInicio, c.dataFim, c.uf]
  );
  res.status(201).json(c);
});

router.get("/contratos/:id/consumo", async (req, res) => {
  const result = await pool.query('SELECT * FROM contratos_consumo_mensal WHERE contrato_id = $1', [req.params.id]);
  const mapped = result.rows.map(r => ({
    id: r.id, contratoId: r.contrato_id, mes: r.mes, 
    valorConsumido: parseFloat(r.valor_consumido) || 0, faturaUrl: r.fatura_url
  }));
  res.json(mapped);
});

export default router;
