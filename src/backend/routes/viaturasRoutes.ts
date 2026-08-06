import express from "express";
import { pool } from "../db.js";

const router = express.Router();

function mapViaturaRow(r: any) {
  return {
    id: r.id, placa: r.placa, marca: r.marca, modelo: r.modelo, ano: r.ano, 
    tipo: r.tipo, uf: r.uf, kmAtual: r.km_atual, proximaRevisaoKm: r.proxima_revisao_km, 
    status: r.status, categoria: r.categoria, renavamChassi: r.renavam_chassi, 
    numeroMotor: r.numero_motor, alocacao: r.alocacao, destinacaoBaixa: r.destinacao_baixa
  };
}

router.get("/viaturas", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM viaturas ORDER BY ano DESC');
    res.json(result.rows.map(mapViaturaRow));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar viaturas" }); }
});

router.get("/viaturas/srte/:uf", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM viaturas WHERE uf = $1 ORDER BY ano DESC', [req.params.uf.toUpperCase()]);
    res.json(result.rows.map(mapViaturaRow));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar viaturas por UF" }); }
});

router.post("/viaturas", async (req, res) => {
  try {
    const v = req.body;
    v.id = v.id || "V-" + Date.now();
    await pool.query(
      `INSERT INTO viaturas (
        id, placa, marca, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status, categoria, renavam_chassi, numero_motor, alocacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        v.id, v.placa, v.marca || '', v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, 
        v.status, v.categoria || 'Terrestre', v.renavamChassi || '', v.numeroMotor || '', v.alocacao || ''
      ]
    );
    res.status(201).json(v);
  } catch (error) { res.status(500).json({ error: "Erro ao criar viatura" }); }
});

router.put("/viaturas/:id", async (req, res) => {
  try {
    const v = req.body;
    await pool.query(
      `UPDATE viaturas SET 
        placa = $1, marca = $2, modelo = $3, ano = $4, tipo = $5, uf = $6, km_atual = $7, proxima_revisao_km = $8, status = $9, 
        categoria = $10, renavam_chassi = $11, numero_motor = $12, alocacao = $13, destinacao_baixa = $14
      WHERE id = $15`,
      [
        v.placa, v.marca || '', v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status, 
        v.categoria || 'Terrestre', v.renavamChassi || '', v.numeroMotor || '', v.alocacao || '', v.destinacaoBaixa || '', req.params.id
      ]
    );
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao atualizar viatura" }); }
});

router.delete("/viaturas/:id", async (req, res) => {
  try {
    await pool.query('DELETE FROM viaturas WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao deletar viatura" }); }
});

// CONDUTORES
router.get("/viaturas/condutores/srte/:uf", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM frota_condutores WHERE uf = $1', [req.params.uf.toUpperCase()]);
    res.json(result.rows.map(r => ({
      id: r.id, uf: r.uf, nome: r.nome, cpf: r.cpf, cnhCategoria: r.cnh_categoria, cnhVencimento: r.cnh_vencimento, 
      arraisAmadorVencimento: r.arrais_amador_vencimento, status: r.status
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar condutores" }); }
});

router.post("/viaturas/condutores", async (req, res) => {
  try {
    const c = req.body;
    c.id = c.id || "FC-" + Date.now();
    await pool.query(
      "INSERT INTO frota_condutores (id, uf, nome, cpf, cnh_categoria, cnh_vencimento, arrais_amador_vencimento, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [c.id, c.uf, c.nome, c.cpf, c.cnhCategoria, c.cnhVencimento, c.arraisAmadorVencimento, c.status || 'Ativo']
    );
    res.status(201).json(c);
  } catch (error) { res.status(500).json({ error: "Erro ao criar condutor" }); }
});

router.delete("/viaturas/condutores/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM frota_condutores WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao deletar condutor" }); }
});

// DIÁRIO DE BORDO
router.get("/viaturas/:id/diario-bordo", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, c.nome as condutor_nome 
      FROM frota_diario_bordo d 
      LEFT JOIN frota_condutores c ON d.condutor_id = c.id
      WHERE d.viatura_id = $1 ORDER BY d.data_saida DESC
    `, [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, viaturaId: r.viatura_id, condutorId: r.condutor_id, condutorNome: r.condutor_nome,
      dataSaida: r.data_saida, dataChegada: r.data_chegada, odometroSaida: r.odometro_saida, 
      odometroChegada: r.odometro_chegada, missaoDestino: r.missao_destino, observacoes: r.observacoes
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar diário" }); }
});

router.post("/viaturas/:id/diario-bordo", async (req, res) => {
  try {
    const d = req.body;
    d.id = d.id || "DB-" + Date.now();
    await pool.query(
      "INSERT INTO frota_diario_bordo (id, viatura_id, condutor_id, data_saida, data_chegada, odometro_saida, odometro_chegada, missao_destino, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [d.id, req.params.id, d.condutorId, d.dataSaida, d.dataChegada, d.odometroSaida, d.odometroChegada, d.missaoDestino, d.observacoes]
    );
    res.status(201).json(d);
  } catch (error) { res.status(500).json({ error: "Erro ao registrar diário" }); }
});

// INFRAÇÕES
router.get("/viaturas/:id/infracoes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.nome as condutor_nome 
      FROM frota_infracoes i 
      LEFT JOIN frota_condutores c ON i.condutor_id = c.id
      WHERE i.viatura_id = $1 ORDER BY i.data_infracao DESC
    `, [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, viaturaId: r.viatura_id, condutorId: r.condutor_id, condutorNome: r.condutor_nome,
      dataInfracao: r.data_infracao, tipoInfracao: r.tipo_infracao, valor: parseFloat(r.valor) || 0,
      statusPagamento: r.status_pagamento, prazoRecurso: r.prazo_recurso
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar infrações" }); }
});

router.post("/viaturas/:id/infracoes", async (req, res) => {
  try {
    const i = req.body;
    i.id = i.id || "FI-" + Date.now();
    await pool.query(
      "INSERT INTO frota_infracoes (id, viatura_id, condutor_id, data_infracao, tipo_infracao, valor, status_pagamento, prazo_recurso) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [i.id, req.params.id, i.condutorId, i.dataInfracao, i.tipoInfracao, i.valor || 0, i.statusPagamento, i.prazoRecurso]
    );
    res.status(201).json(i);
  } catch (error) { res.status(500).json({ error: "Erro ao registrar infração" }); }
});

// ABASTECIMENTOS
router.get("/viaturas/:id/abastecimentos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM viaturas_abastecimentos WHERE viatura_id = $1 ORDER BY data_abastecimento DESC', [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, viaturaId: r.viatura_id, dataAbastecimento: r.data_abastecimento, 
      km: r.km, litros: parseFloat(r.litros) || 0, valorTotal: parseFloat(r.valor_total) || 0, posto: r.posto
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar abastecimentos" }); }
});

router.post("/viaturas/:id/abastecimentos", async (req, res) => {
  try {
    const a = req.body;
    a.id = a.id || "VA-" + Date.now();
    await pool.query(
      "INSERT INTO viaturas_abastecimentos (id, viatura_id, data_abastecimento, km, litros, valor_total, posto) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [a.id, req.params.id, a.dataAbastecimento, a.km, a.litros, a.valorTotal, a.posto]
    );
    res.status(201).json(a);
  } catch (error) { res.status(500).json({ error: "Erro ao adicionar abastecimento" }); }
});

router.delete("/viaturas/abastecimentos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM viaturas_abastecimentos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao deletar abastecimento" }); }
});

// MANUTENÇÕES
router.get("/viaturas/:id/manutencoes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM viaturas_manutencoes WHERE viatura_id = $1 ORDER BY data_manutencao DESC', [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, viaturaId: r.viatura_id, dataManutencao: r.data_manutencao, 
      tipoManutencao: r.tipo_manutencao, descricao: r.descricao, 
      kmManutencao: r.km_manutencao, valor: parseFloat(r.valor) || 0, proximaRevisaoKm: r.proxima_revisao_km
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar manutenções" }); }
});

router.post("/viaturas/:id/manutencoes", async (req, res) => {
  try {
    const m = req.body;
    m.id = m.id || "VM-" + Date.now();
    await pool.query(
      "INSERT INTO viaturas_manutencoes (id, viatura_id, data_manutencao, tipo_manutencao, descricao, km_manutencao, valor, proxima_revisao_km) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [m.id, req.params.id, m.dataManutencao, m.tipoManutencao, m.descricao, m.kmManutencao, m.valor || 0, m.proximaRevisaoKm]
    );
    res.status(201).json(m);
  } catch (error) { res.status(500).json({ error: "Erro ao adicionar manutenção" }); }
});

router.delete("/viaturas/manutencoes/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM viaturas_manutencoes WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao deletar manutenção" }); }
});

export default router;
