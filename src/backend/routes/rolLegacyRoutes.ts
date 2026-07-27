import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rol_responsaveis_legado');
    const mapped = result.rows.map(r => ({
      id: r.id,
      nome: r.nome,
      cpf: r.cpf,
      cargo: r.cargo,
      unidade: r.unidade,
      inicioExercicio: r.inicio_exercicio,
      fimExercicio: r.fim_exercicio,
      atoNomeacao: r.ato_nomeacao,
      status: r.status,
      observacoes: r.observacoes
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching rol legacy:", error);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

router.post("/", async (req, res) => {
  try {
    const v = req.body;
    v.id = "rol_" + Date.now();
    await pool.query(
      "INSERT INTO rol_responsaveis_legado (id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
      [v.id, v.nome, v.cpf, v.cargo, v.unidade, v.inicioExercicio, v.fimExercicio, v.atoNomeacao, v.status, v.observacoes]
    );
    res.status(201).json(v);
  } catch (error) {
    console.error("Error creating rol legacy:", error);
    res.status(500).json({ error: "Failed to create" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const v = req.body;
    await pool.query(
      "UPDATE rol_responsaveis_legado SET nome=$1, cpf=$2, cargo=$3, unidade=$4, inicio_exercicio=$5, fim_exercicio=$6, ato_nomeacao=$7, status=$8, observacoes=$9 WHERE id=$10",
      [v.nome, v.cpf, v.cargo, v.unidade, v.inicioExercicio, v.fimExercicio, v.atoNomeacao, v.status, v.observacoes, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating rol legacy:", error);
    res.status(500).json({ error: "Failed to update" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM rol_responsaveis_legado WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting rol legacy:", error);
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
