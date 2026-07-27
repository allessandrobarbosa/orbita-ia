import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Helper to get legacy data
async function getLegacyData() {
  const result = await pool.query('SELECT * FROM rol_responsaveis_legado');
  return result.rows;
}

router.get("/pessoas", async (req, res) => { res.json([]); });

router.get("/unidades", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rol_unidades ORDER BY sigla');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unidades." });
  }
});

router.get("/cargos", async (req, res) => {
  try {
    const legacy = await getLegacyData();
    const cargosSet = new Set(legacy.map(r => r.cargo).filter(Boolean));
    const cargos = Array.from(cargosSet).map((c, i) => ({ id_cargo: i+1, nome: c }));
    res.json(cargos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cargos." });
  }
});

router.get("/mandatos", async (req, res) => {
  try {
    const legacy = await getLegacyData();
    const mandatos = legacy.map(r => ({
      id_registro: r.id,
      is_substituto: false,
      id_original: r.id,
      data_inicio: r.inicio_exercicio,
      data_fim: r.fim_exercicio,
      ato_nomeacao: r.ato_nomeacao,
      ato_exoneracao: null,
      id_pessoa: r.id,
      nome_completo: r.nome,
      cpf: r.cpf,
      email: "",
      id_cargo: r.cargo,
      nome_cargo: r.cargo,
      id_unidade: r.unidade,
      sigla_unidade: r.unidade,
      nome_unidade: r.unidade,
      tipo_responsabilidade: "Titular",
      status: r.status
    }));
    res.json(mandatos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mandatos." });
  }
});

router.get("/afastamentos", async (req, res) => {
  res.json([]);
});

export default router;
