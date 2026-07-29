import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// Helper to get legacy data
async function getLegacyData() {
  const result = await pool.query('SELECT * FROM rol_responsaveis_legado ORDER BY nome ASC');
  return result.rows;
}

router.get("/pessoas", async (req, res) => { res.json([]); });

router.get("/unidades", async (req, res) => {
  try {
    const result = await pool.query('SELECT nome as id_unidade, nome, sigla FROM rol_unidades ORDER BY sigla');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unidades." });
  }
});

router.get("/cargos", async (req, res) => {
  try {
    const result = await pool.query('SELECT nome as id_cargo, nome FROM rol_cargos ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cargos." });
  }
});

router.get("/mandatos", async (req, res) => {
  try {
    const legacy = await getLegacyData();
    const mandatos = legacy.map(r => {
      const isSub = r.is_substituto || (r.cargo && r.cargo.toLowerCase().includes("substitut"));
      return {
        id_registro: r.id,
        is_substituto: isSub,
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
        sigla_unidade: r.unidade, // We can leave this as the name for now, frontend displays it
        nome_unidade: r.unidade,
        tipo_responsabilidade: isSub ? "Substituto" : "Titular",
        status: (!r.fim_exercicio || r.fim_exercicio.trim() === '') ? "Vigente" : "Histórico"
      };
    });
    res.json(mandatos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mandatos." });
  }
});

router.put("/dirigentes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, cpf, id_cargo, id_unidade, data_inicio, data_fim, ato_nomeacao, ato_exoneracao, is_substituto } = req.body;
    
    await pool.query(
      `UPDATE rol_responsaveis_legado SET 
        nome = $1, cpf = $2, cargo = $3, unidade = $4, inicio_exercicio = $5, fim_exercicio = $6, ato_nomeacao = $7, is_substituto = $8 
       WHERE id = $9`,
      [nome_completo, cpf, id_cargo, id_unidade, data_inicio, data_fim, ato_nomeacao, is_substituto, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update dirigente." });
  }
});

router.get("/afastamentos", async (req, res) => {
  res.json([]);
});

export default router;
