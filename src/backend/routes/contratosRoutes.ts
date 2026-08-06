import express from "express";
import { pool } from "../db.js";
import { fetchContratosPncp, fetchDetalheContratoPncp } from "../services/pncpService.js";

const router = express.Router();

function mapContratoRow(r: any) {
  return {
    id: r.id,
    numeroContrato: r.numero_contrato,
    empresa: r.empresa,
    cnpj: r.cnpj,
    objeto: r.objeto,
    valorGlobal: parseFloat(r.valor_global) || 0,
    valorMensal: parseFloat(r.valor_mensal) || 0,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim,
    uf: r.uf,
    modalidade: r.modalidade,
    pncpId: r.pncp_id,
    uasg: r.uasg,
    linkPncp: r.link_pncp,
    status: r.status
  };
}

router.get("/contratos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contratos ORDER BY data_inicio DESC");
    res.json(result.rows.map(mapContratoRow));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contratos" });
  }
});

router.get("/contratos/srte/:uf", async (req, res) => {
  try {
    const { uf } = req.params;
    const result = await pool.query("SELECT * FROM contratos WHERE uf = $1 ORDER BY data_inicio DESC", [uf.toUpperCase()]);
    res.json(result.rows.map(mapContratoRow));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contratos por UF" });
  }
});

router.post("/contratos", async (req, res) => {
  try {
    const c = req.body;
    c.id = c.id || "C-" + Date.now();
    await pool.query(
      `INSERT INTO contratos (
        id, numero_contrato, empresa, cnpj, objeto, valor_global, valor_mensal, data_inicio, data_fim, uf, modalidade, pncp_id, uasg, link_pncp, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorGlobal || 0, c.valorMensal || 0, 
        c.dataInicio, c.dataFim, c.uf, c.modalidade || '', c.pncpId || '', c.uasg || '', c.linkPncp || '', c.status || 'Ativo'
      ]
    );
    res.status(201).json(c);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar contrato" });
  }
});

router.put("/contratos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    await pool.query(
      `UPDATE contratos SET 
        numero_contrato = $1, empresa = $2, cnpj = $3, objeto = $4, 
        valor_global = $5, valor_mensal = $6, data_inicio = $7, data_fim = $8, 
        uf = $9, modalidade = $10, pncp_id = $11, uasg = $12, link_pncp = $13, status = $14
      WHERE id = $15`,
      [
        c.numeroContrato, c.empresa, c.cnpj, c.objeto, 
        c.valorGlobal || 0, c.valorMensal || 0, c.dataInicio, c.dataFim, 
        c.uf, c.modalidade || '', c.pncpId || '', c.uasg || '', c.linkPncp || '', c.status || 'Ativo', id
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar contrato" });
  }
});

router.delete("/contratos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM contratos WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar contrato" });
  }
});

// SINCRONIZAÇÃO PNCP
router.post("/contratos/sync-pncp", async (req, res) => {
  try {
    const { cnpjOrgao, uf } = req.body;
    let contratosPncp: any[] = [];
    if (cnpjOrgao) {
      contratosPncp = await fetchContratosPncp(cnpjOrgao);
    } else {
      // MTE (ID Órgãos PNCP: 74549 = MINISTÉRIO DO TRABALHO, 33375 = MINISTÉRIO DO TRABALHO E EMPREGO)
      const mte = await fetchContratosPncp("74549|33375", "orgaos");
      
      const todos = [...mte];
      const unicosMap = new Map();
      todos.forEach(c => unicosMap.set(c.id, c));
      contratosPncp = Array.from(unicosMap.values());
    }
    let imported = 0;
    for (const p of contratosPncp) {
      // Verifica se já existe apenas pelo PNCP ID
      const exist = await pool.query("SELECT id FROM contratos WHERE pncp_id = $1", [p.id]);
      if (exist.rows.length === 0) {
        
        // Como a Busca API não traz o fornecedor, precisamos buscar agora usando o número sequencial!
        let fornecedorNome = "Não informado";
        let fornecedorCnpj = "";
        if (p.orgaoEntidade?.cnpj && p.anoContrato && p.numero_sequencial) {
          const detalhe = await fetchDetalheContratoPncp(p.orgaoEntidade.cnpj, p.anoContrato, p.numero_sequencial);
          fornecedorNome = detalhe.nome;
          fornecedorCnpj = detalhe.cnpj;
        }

        let finalUf = p.uf || req.body.uf || 'DF';
        if (finalUf === 'DF') {
           const unidadeName = (p.unidadeOrcamentaria?.nomeUnidade || p.orgaoEntidade?.razaoSocial || "").toUpperCase();
           if (unidadeName.includes("SUPERINTEND") || unidadeName.includes("SRTE")) {
             finalUf = 'DF_SRTE';
           } else {
             finalUf = 'DF_SEDE';
           }
        }

        const id = "C-PNCP-" + p.id;
        await pool.query(
          `INSERT INTO contratos (
            id, numero_contrato, empresa, cnpj, objeto, valor_global, data_inicio, data_fim, uf, modalidade, pncp_id, link_pncp, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            id, p.numeroContrato, fornecedorNome, fornecedorCnpj, p.objeto || "Objeto não informado",
            p.valorGlobal, p.dataInicioVigencia, p.dataFimVigencia, finalUf, 'Sincronizado', String(p.id),
            `https://pncp.gov.br/app/contratos/${p.orgaoEntidade?.cnpj}/${p.anoContrato}/${p.numero_sequencial}`, 'Ativo'
          ]
        );
        imported++;
      }
    }
    res.json({ success: true, imported, total: contratosPncp.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro na sincronização" });
  }
});

// CONSUMO MENSAL
router.get("/contratos/:id/consumo", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contratos_consumo_mensal WHERE contrato_id = $1 ORDER BY mes DESC", [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, contratoId: r.contrato_id, mes: r.mes, 
      valorConsumido: parseFloat(r.valor_consumido) || 0, faturaUrl: r.fatura_url
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar consumo" }); }
});

router.post("/contratos/:id/consumo", async (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    c.id = c.id || "CC-" + Date.now();
    await pool.query(
      "INSERT INTO contratos_consumo_mensal (id, contrato_id, mes, valor_consumido, fatura_url) VALUES ($1, $2, $3, $4, $5)",
      [c.id, id, c.mes, c.valorConsumido || 0, c.faturaUrl || '']
    );
    res.status(201).json(c);
  } catch (error) { res.status(500).json({ error: "Erro ao criar consumo" }); }
});

router.delete("/contratos/consumo/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contratos_consumo_mensal WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao deletar consumo" }); }
});

// FISCAIS
router.get("/contratos/:id/fiscais", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contratos_fiscais WHERE contrato_id = $1", [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, contratoId: r.contrato_id, nome: r.nome, cpf: r.cpf,
      tipo: r.tipo, portariaDesignacao: r.portaria_designacao, dataInicio: r.data_inicio, dataFim: r.data_fim, status: r.status
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar fiscais" }); }
});

router.post("/contratos/:id/fiscais", async (req, res) => {
  try {
    const { id } = req.params;
    const f = req.body;
    f.id = f.id || "CF-" + Date.now();
    await pool.query(
      "INSERT INTO contratos_fiscais (id, contrato_id, nome, cpf, tipo, portaria_designacao, data_inicio, data_fim, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [f.id, id, f.nome, f.cpf, f.tipo, f.portariaDesignacao, f.dataInicio, f.dataFim, f.status || 'Ativo']
    );
    res.status(201).json(f);
  } catch (error) { res.status(500).json({ error: "Erro ao adicionar fiscal" }); }
});

router.delete("/contratos/fiscais/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contratos_fiscais WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao remover fiscal" }); }
});

// ADITIVOS
router.get("/contratos/:id/aditivos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contratos_aditivos WHERE contrato_id = $1", [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, contratoId: r.contrato_id, numero: r.numero, tipo: r.tipo,
      valorAdicionado: parseFloat(r.valor_adicionado) || 0, novaDataFim: r.nova_data_fim, justificativa: r.justificativa, dataAssinatura: r.data_assinatura
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar aditivos" }); }
});

router.post("/contratos/:id/aditivos", async (req, res) => {
  try {
    const { id } = req.params;
    const a = req.body;
    a.id = a.id || "CA-" + Date.now();
    await pool.query(
      "INSERT INTO contratos_aditivos (id, contrato_id, numero, tipo, valor_adicionado, nova_data_fim, justificativa, data_assinatura) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [a.id, id, a.numero, a.tipo, a.valorAdicionado || 0, a.novaDataFim, a.justificativa, a.dataAssinatura]
    );
    res.status(201).json(a);
  } catch (error) { res.status(500).json({ error: "Erro ao adicionar aditivo" }); }
});

router.delete("/contratos/aditivos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contratos_aditivos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao remover aditivo" }); }
});

// EMPENHOS
router.get("/contratos/:id/empenhos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contratos_empenhos WHERE contrato_id = $1", [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, contratoId: r.contrato_id, numeroEmpenho: r.numero_empenho, valorEmpenhado: parseFloat(r.valor_empenhado) || 0,
      dataEmissao: r.data_emissao, ptres: r.ptres, fonteRecurso: r.fonte_recurso
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar empenhos" }); }
});

router.post("/contratos/:id/empenhos", async (req, res) => {
  try {
    const { id } = req.params;
    const e = req.body;
    e.id = e.id || "CE-" + Date.now();
    await pool.query(
      "INSERT INTO contratos_empenhos (id, contrato_id, numero_empenho, valor_empenhado, data_emissao, ptres, fonte_recurso) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [e.id, id, e.numeroEmpenho, e.valorEmpenhado || 0, e.dataEmissao, e.ptres, e.fonteRecurso]
    );
    res.status(201).json(e);
  } catch (error) { res.status(500).json({ error: "Erro ao adicionar empenho" }); }
});

router.delete("/contratos/empenhos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contratos_empenhos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao remover empenho" }); }
});

export default router;
