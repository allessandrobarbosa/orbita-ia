import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/viaturas", async (req, res) => {
  const result = await pool.query('SELECT * FROM viaturas');
  const mapped = result.rows.map(r => ({
    id: r.id, placa: r.placa, modelo: r.modelo, ano: r.ano, 
    tipo: r.tipo, uf: r.uf, kmAtual: r.km_atual, 
    proximaRevisaoKm: r.proxima_revisao_km, status: r.status
  }));
  res.json(mapped);
});

router.post("/viaturas", async (req, res) => {
  const v = req.body;
  v.id = "V-" + Date.now();
  await pool.query(
    "INSERT INTO viaturas (id, placa, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [v.id, v.placa, v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status]
  );
  res.status(201).json(v);
});

router.get("/viaturas/:id/abastecimentos", async (req, res) => {
  const result = await pool.query('SELECT * FROM viaturas_abastecimentos WHERE viatura_id = $1', [req.params.id]);
  const mapped = result.rows.map(r => ({
    id: r.id, viaturaId: r.viatura_id, dataAbastecimento: r.data_abastecimento, 
    km: r.km, litros: parseFloat(r.litros) || 0, valorTotal: parseFloat(r.valor_total) || 0, posto: r.posto
  }));
  res.json(mapped);
});

router.get("/viaturas/:id/manutencoes", async (req, res) => {
  const result = await pool.query('SELECT * FROM viaturas_manutencoes WHERE viatura_id = $1', [req.params.id]);
  const mapped = result.rows.map(r => ({
    id: r.id, viaturaId: r.viatura_id, dataManutencao: r.data_manutencao, 
    tipoManutencao: r.tipo_manutencao, descricao: r.descricao, 
    kmManutencao: r.km_manutencao, valor: parseFloat(r.valor) || 0, proximaRevisaoKm: r.proxima_revisao_km
  }));
  res.json(mapped);
});

export default router;
