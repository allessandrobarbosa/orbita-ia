import express from "express";
import { pool } from "../db";

const router = express.Router();

// 1. Pessoas (Dirigentes)
router.get("/pessoas", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pessoas ORDER BY nome_completo');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pessoas." });
  }
});

router.post("/pessoas", async (req, res) => {
  try {
    const { nome_completo, cpf, email } = req.body;
    const result = await pool.query(
      'INSERT INTO pessoas (nome_completo, cpf, email) VALUES ($1, $2, $3) RETURNING *',
      [nome_completo, cpf, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create pessoa." });
  }
});

router.put("/pessoas/:id", async (req, res) => {
  try {
    const { nome_completo, cpf, email } = req.body;
    const result = await pool.query(
      'UPDATE pessoas SET nome_completo = $1, cpf = $2, email = $3 WHERE id_pessoa = $4 RETURNING *',
      [nome_completo, cpf, email, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update pessoa." });
  }
});

// 2. Unidades
router.get("/unidades", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM unidades ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unidades." });
  }
});

router.post("/unidades", async (req, res) => {
  try {
    const { id_unidade_pai, sigla, nome } = req.body;
    const result = await pool.query(
      'INSERT INTO unidades (id_unidade_pai, sigla, nome) VALUES ($1, $2, $3) RETURNING *',
      [id_unidade_pai || null, sigla, nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create unidade." });
  }
});

router.put("/unidades/:id", async (req, res) => {
  try {
    const { id_unidade_pai, sigla, nome } = req.body;
    const result = await pool.query(
      'UPDATE unidades SET id_unidade_pai = $1, sigla = $2, nome = $3 WHERE id_unidade = $4 RETURNING *',
      [id_unidade_pai || null, sigla, nome, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update unidade." });
  }
});

// 3. Cargos
router.get("/cargos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cargos ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cargos." });
  }
});

router.post("/cargos", async (req, res) => {
  try {
    const { nome } = req.body;
    const result = await pool.query(
      'INSERT INTO cargos (nome) VALUES ($1) RETURNING *',
      [nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create cargo." });
  }
});

router.put("/cargos/:id", async (req, res) => {
  try {
    const { nome } = req.body;
    const result = await pool.query(
      'UPDATE cargos SET nome = $1 WHERE id_cargo = $2 RETURNING *',
      [nome, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update cargo." });
  }
});

// 4. Mandatos (Visão Agregada)
router.get("/mandatos", async (req, res) => {
  try {
    const query = `
      SELECT * FROM (
        SELECT 
          'T_' || m.id_mandato as id_registro,
          false as is_substituto,
          m.id_mandato as id_original,
          m.data_inicio, m.data_fim, 
          m.id_ato_nomeacao, an.numero as ato_nomeacao,
          m.id_ato_exoneracao, ae.numero as ato_exoneracao,
          p.id_pessoa, p.nome_completo, p.cpf, p.email,
          c.id_cargo, c.nome as nome_cargo, u.id_unidade, u.sigla as sigla_unidade, u.nome as nome_unidade,
          tr.nome as tipo_responsabilidade
        FROM mandatos m
        JOIN pessoas p ON m.id_pessoa = p.id_pessoa
        JOIN funcoes_responsabilidade fr ON m.id_funcao = fr.id_funcao
        JOIN cargos c ON fr.id_cargo = c.id_cargo
        JOIN unidades u ON fr.id_unidade = u.id_unidade
        LEFT JOIN tipos_responsabilidade tr ON fr.id_tipo_responsabilidade_padrao = tr.id_tipo
        LEFT JOIN atos_administrativos an ON m.id_ato_nomeacao = an.id_ato
        LEFT JOIN atos_administrativos ae ON m.id_ato_exoneracao = ae.id_ato

        UNION ALL

        SELECT 
          'S_' || ds.id_designacao as id_registro,
          true as is_substituto,
          ds.id_designacao as id_original,
          ds.data_inicio, ds.data_fim, 
          ds.id_ato_designacao as id_ato_nomeacao, an.numero as ato_nomeacao,
          ds.id_ato_revogacao as id_ato_exoneracao, ae.numero as ato_exoneracao,
          p.id_pessoa, p.nome_completo, p.cpf, p.email,
          c.id_cargo, c.nome as nome_cargo, u.id_unidade, u.sigla as sigla_unidade, u.nome as nome_unidade,
          tr.nome as tipo_responsabilidade
        FROM designacoes_substituicao ds
        JOIN pessoas p ON ds.id_pessoa = p.id_pessoa
        JOIN funcoes_responsabilidade fr ON ds.id_funcao = fr.id_funcao
        JOIN cargos c ON fr.id_cargo = c.id_cargo
        JOIN unidades u ON fr.id_unidade = u.id_unidade
        LEFT JOIN tipos_responsabilidade tr ON fr.id_tipo_responsabilidade_padrao = tr.id_tipo
        LEFT JOIN atos_administrativos an ON ds.id_ato_designacao = an.id_ato
        LEFT JOIN atos_administrativos ae ON ds.id_ato_revogacao = ae.id_ato
      ) t
      ORDER BY 
        sigla_unidade ASC, 
        CASE WHEN data_fim IS NULL OR data_fim >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
        is_substituto ASC,
        nome_completo ASC,
        data_inicio DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch mandatos." });
  }
});

router.put("/mandatos/:id", async (req, res) => {
  try {
    const { data_inicio, data_fim } = req.body;
    const result = await pool.query(
      'UPDATE mandatos SET data_inicio = $1, data_fim = $2 WHERE id_mandato = $3 RETURNING *',
      [data_inicio, data_fim || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update mandato." });
  }
});

// 5. Afastamentos
router.get("/afastamentos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, es.id_designacao 
      FROM afastamentos a 
      LEFT JOIN exercicios_substituicao es ON a.id_afastamento = es.id_afastamento 
      ORDER BY a.data_inicio DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch afastamentos." });
  }
});

router.post("/afastamentos", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id_mandato, motivo, data_inicio, data_fim, id_designacao } = req.body;
    
    // Extrai o ID numérico se vier do frontend como 'T_123' ou 'S_456'
    const id_mandato_num = typeof id_mandato === 'string' ? id_mandato.split('_')[1] : id_mandato;
    const id_designacao_num = typeof id_designacao === 'string' ? id_designacao.split('_')[1] : id_designacao;

    const result = await client.query(
      'INSERT INTO afastamentos (id_mandato, motivo, data_inicio, data_fim) VALUES ($1, $2, $3, $4) RETURNING *',
      [id_mandato_num, motivo, data_inicio, data_fim || null]
    );
    const novoAfastamento = result.rows[0];

    if (id_designacao_num) {
      await client.query(
        'INSERT INTO exercicios_substituicao (id_afastamento, id_designacao, data_inicio, data_fim) VALUES ($1, $2, $3, $4)',
        [novoAfastamento.id_afastamento, id_designacao_num, data_inicio, data_fim || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...novoAfastamento, id_designacao: id_designacao_num });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to create afastamento." });
  } finally {
    client.release();
  }
});

router.put("/afastamentos/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { id_mandato, motivo, data_inicio, data_fim, id_designacao } = req.body;
    const id_afastamento = req.params.id;
    
    const id_mandato_num = typeof id_mandato === 'string' ? id_mandato.split('_')[1] : id_mandato;
    const id_designacao_num = typeof id_designacao === 'string' ? id_designacao.split('_')[1] : id_designacao;

    const result = await client.query(
      'UPDATE afastamentos SET id_mandato = $1, motivo = $2, data_inicio = $3, data_fim = $4 WHERE id_afastamento = $5 RETURNING *',
      [id_mandato_num, motivo, data_inicio, data_fim || null, id_afastamento]
    );

    // Atualiza ou insere o exercicio_substituicao
    await client.query('DELETE FROM exercicios_substituicao WHERE id_afastamento = $1', [id_afastamento]);
    if (id_designacao_num) {
      await client.query(
        'INSERT INTO exercicios_substituicao (id_afastamento, id_designacao, data_inicio, data_fim) VALUES ($1, $2, $3, $4)',
        [id_afastamento, id_designacao_num, data_inicio, data_fim || null]
      );
    }

    await client.query("COMMIT");
    res.json({ ...result.rows[0], id_designacao: id_designacao_num });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to update afastamento." });
  } finally {
    client.release();
  }
});

// 6. Unified Cadastro de Dirigentes (Creates Pessoa + Mandato in one transaction)
router.post("/dirigentes", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { nome_completo, cpf, email, id_cargo, id_unidade, data_inicio, data_fim, is_substituto, ato_nomeacao, ato_exoneracao } = req.body;
    
    // 1. Check or Create Pessoa
    let id_pessoa;
    const pCheck = await client.query('SELECT id_pessoa FROM pessoas WHERE cpf = $1', [cpf]);
    if (pCheck.rows.length > 0) {
      id_pessoa = pCheck.rows[0].id_pessoa;
      await client.query('UPDATE pessoas SET nome_completo = $1, email = $2 WHERE id_pessoa = $3', [nome_completo, email, id_pessoa]);
    } else {
      const pInsert = await client.query(
        'INSERT INTO pessoas (nome_completo, cpf, email) VALUES ($1, $2, $3) RETURNING id_pessoa',
        [nome_completo, cpf, email]
      );
      id_pessoa = pInsert.rows[0].id_pessoa;
    }

    // 2. Check or Create Funcao de Responsabilidade
    let id_funcao;
    const fCheck = await client.query('SELECT id_funcao FROM funcoes_responsabilidade WHERE id_cargo = $1 AND id_unidade = $2', [id_cargo, id_unidade]);
    if (fCheck.rows.length > 0) {
      id_funcao = fCheck.rows[0].id_funcao;
    } else {
      const fInsert = await client.query('INSERT INTO funcoes_responsabilidade (id_cargo, id_unidade) VALUES ($1, $2) RETURNING id_funcao', [id_cargo, id_unidade]);
      id_funcao = fInsert.rows[0].id_funcao;
    }

    // 3. Handle Atos
    const handleAto = async (numeroAto: string | null) => {
      if (!numeroAto) return null;
      const chk = await client.query('SELECT id_ato FROM atos_administrativos WHERE numero = $1', [numeroAto]);
      if (chk.rows.length > 0) return chk.rows[0].id_ato;
      const ins = await client.query('INSERT INTO atos_administrativos (numero, ano, tipo_ato) VALUES ($1, extract(year from current_date), $2) RETURNING id_ato', [numeroAto, 'Portaria/Ato']);
      return ins.rows[0].id_ato;
    };
    
    const id_ato_nom = await handleAto(ato_nomeacao);
    const id_ato_exo = await handleAto(ato_exoneracao);

    // 4. Create Mandato ou Designacao
    let resultInsert;
    if (is_substituto) {
      resultInsert = await client.query(
        'INSERT INTO designacoes_substituicao (id_pessoa, id_funcao, data_inicio, data_fim, id_ato_designacao, id_ato_revogacao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id_pessoa, id_funcao, data_inicio, data_fim || null, id_ato_nom, id_ato_exo]
      );
    } else {
      resultInsert = await client.query(
        'INSERT INTO mandatos (id_pessoa, id_funcao, data_inicio, data_fim, id_ato_nomeacao, id_ato_exoneracao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id_pessoa, id_funcao, data_inicio, data_fim || null, id_ato_nom, id_ato_exo]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(resultInsert.rows[0]);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error creating dirigente", err);
    let errMsg = err.message || "Failed to create dirigente unificado.";
    if (err.message && err.message.includes("check_datas_mandato")) errMsg = "A Data de Fim (Exoneração) não pode ser anterior à Data de Início.";
    res.status(400).json({ error: errMsg });
  } finally {
    client.release();
  }
});

router.put("/dirigentes/:id_registro", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { nome_completo, cpf, email, id_cargo, id_unidade, data_inicio, data_fim, is_substituto, ato_nomeacao, ato_exoneracao } = req.body;
    
    // Parse ID "T_123" ou "S_123"
    const [tipo, id_original] = req.params.id_registro.split('_');

    // Fetch id_pessoa
    let id_pessoa;
    if (tipo === 'S') {
      const dCheck = await client.query('SELECT id_pessoa FROM designacoes_substituicao WHERE id_designacao = $1', [id_original]);
      if (dCheck.rows.length === 0) throw new Error("Designacao not found");
      id_pessoa = dCheck.rows[0].id_pessoa;
    } else {
      const mCheck = await client.query('SELECT id_pessoa FROM mandatos WHERE id_mandato = $1', [id_original]);
      if (mCheck.rows.length === 0) throw new Error("Mandato not found");
      id_pessoa = mCheck.rows[0].id_pessoa;
    }

    // 1. Update or Merge Pessoa
    const pCheck = await client.query('SELECT id_pessoa FROM pessoas WHERE cpf = $1', [cpf]);
    if (pCheck.rows.length > 0 && pCheck.rows[0].id_pessoa !== id_pessoa) {
      // O CPF já pertence a outra pessoa (ex: o usuário está unificando cadastros duplicados do csv)
      id_pessoa = pCheck.rows[0].id_pessoa;
      await client.query('UPDATE pessoas SET nome_completo = $1, email = $2 WHERE id_pessoa = $3', [nome_completo, email, id_pessoa]);
    } else {
      // O CPF está livre ou já é da própria pessoa
      await client.query('UPDATE pessoas SET nome_completo = $1, cpf = $2, email = $3 WHERE id_pessoa = $4', [nome_completo, cpf, email, id_pessoa]);
    }

    // Validação de Negócio: Não pode ter dois mandatos ativos ao mesmo tempo
    if (!data_fim) {
      if (tipo === 'S') {
        const activeCheck = await client.query('SELECT id_designacao FROM designacoes_substituicao WHERE id_pessoa = $1 AND data_fim IS NULL AND id_designacao != $2', [id_pessoa, id_original]);
        if (activeCheck.rows.length > 0) throw new Error("Este dirigente já possui uma designação de substituição ativa.");
      } else {
        const activeCheck = await client.query('SELECT id_mandato FROM mandatos WHERE id_pessoa = $1 AND data_fim IS NULL AND id_mandato != $2', [id_pessoa, id_original]);
        if (activeCheck.rows.length > 0) throw new Error("Este dirigente já possui um mandato ativo.");
      }
    }

    // 2. Check or Create Funcao de Responsabilidade
    let id_funcao;
    const fCheck = await client.query('SELECT id_funcao FROM funcoes_responsabilidade WHERE id_cargo = $1 AND id_unidade = $2', [id_cargo, id_unidade]);
    if (fCheck.rows.length > 0) {
      id_funcao = fCheck.rows[0].id_funcao;
    } else {
      const fInsert = await client.query('INSERT INTO funcoes_responsabilidade (id_cargo, id_unidade) VALUES ($1, $2) RETURNING id_funcao', [id_cargo, id_unidade]);
      id_funcao = fInsert.rows[0].id_funcao;
    }

    // 3. Handle Atos
    const handleAto = async (numeroAto) => {
      if (!numeroAto) return null;
      const chk = await client.query('SELECT id_ato FROM atos_administrativos WHERE numero = $1', [numeroAto]);
      if (chk.rows.length > 0) return chk.rows[0].id_ato;
      const ins = await client.query('INSERT INTO atos_administrativos (numero, ano, tipo_ato) VALUES ($1, extract(year from current_date), $2) RETURNING id_ato', [numeroAto, 'Portaria/Ato']);
      return ins.rows[0].id_ato;
    };
    
    const id_ato_nom = await handleAto(ato_nomeacao);
    const id_ato_exo = await handleAto(ato_exoneracao);

    // 4. Update Mandato or Designacao (ou migrar entre eles)
    let resultUpdate;

    if (tipo === 'S' && !is_substituto) {
      // Migrando de Substituto (S) para Titular (T)
      resultUpdate = await client.query(
        'INSERT INTO mandatos (id_pessoa, id_funcao, data_inicio, data_fim, id_ato_nomeacao, id_ato_exoneracao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id_pessoa, id_funcao, data_inicio, data_fim || null, id_ato_nom, id_ato_exo]
      );
      await client.query('DELETE FROM designacoes_substituicao WHERE id_designacao = $1', [id_original]);
    } else if (tipo === 'T' && is_substituto) {
      // Migrando de Titular (T) para Substituto (S)
      resultUpdate = await client.query(
        'INSERT INTO designacoes_substituicao (id_pessoa, id_funcao, data_inicio, data_fim, id_ato_designacao, id_ato_revogacao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id_pessoa, id_funcao, data_inicio, data_fim || null, id_ato_nom, id_ato_exo]
      );
      await client.query('DELETE FROM mandatos WHERE id_mandato = $1', [id_original]);
    } else {
      // Mantendo na mesma tabela (apenas atualizando)
      if (tipo === 'S') {
        resultUpdate = await client.query(
          'UPDATE designacoes_substituicao SET id_pessoa = $1, id_funcao = $2, data_inicio = $3, data_fim = $4, id_ato_designacao = $5, id_ato_revogacao = $6 WHERE id_designacao = $7 RETURNING *',
          [id_pessoa, id_funcao, data_inicio, data_fim || null, id_ato_nom, id_ato_exo, id_original]
        );
      } else {
        resultUpdate = await client.query(
          'UPDATE mandatos SET id_pessoa = $1, id_funcao = $2, data_inicio = $3, data_fim = $4, id_ato_nomeacao = $5, id_ato_exoneracao = $6 WHERE id_mandato = $7 RETURNING *',
          [id_pessoa, id_funcao, data_inicio, data_fim || null, id_ato_nom, id_ato_exo, id_original]
        );
      }
    }

    await client.query("COMMIT");
    res.json(resultUpdate.rows[0]);
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error updating dirigente", err);
    let errMsg = err.message || "Failed to update dirigente unificado.";
    if (err.message && err.message.includes("check_datas_mandato")) errMsg = "A Data de Fim (Exoneração) não pode ser anterior à Data de Início.";
    if (err.message && err.message.includes("violates foreign key constraint")) errMsg = "Não é possível alterar entre Titular e Substituto pois existem Afastamentos atrelados a este registro. Exclua os afastamentos primeiro.";
    res.status(400).json({ error: errMsg });
  } finally {
    client.release();
  }
});

router.delete("/dirigentes/:id_registro", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const [tipo, id_original] = req.params.id_registro.split('_');

    if (tipo === 'S') {
      await client.query('DELETE FROM exercicios_substituicao WHERE id_designacao = $1', [id_original]);
      await client.query('DELETE FROM designacoes_substituicao WHERE id_designacao = $1', [id_original]);
    } else {
      await client.query('DELETE FROM exercicios_substituicao WHERE id_afastamento IN (SELECT id_afastamento FROM afastamentos WHERE id_mandato = $1)', [id_original]);
      await client.query('DELETE FROM afastamentos WHERE id_mandato = $1', [id_original]);
      await client.query('DELETE FROM mandato_atribuicoes WHERE id_mandato = $1', [id_original]);
      await client.query('DELETE FROM mandatos WHERE id_mandato = $1', [id_original]);
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error deleting dirigente", err);
    res.status(500).json({ error: "Erro ao excluir o dirigente." });
  } finally {
    client.release();
  }
});

router.delete("/afastamentos/:id_afastamento", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('DELETE FROM exercicios_substituicao WHERE id_afastamento = $1', [req.params.id_afastamento]);
    await client.query('DELETE FROM afastamentos WHERE id_afastamento = $1', [req.params.id_afastamento]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error deleting afastamento", err);
    res.status(500).json({ error: "Erro ao excluir afastamento." });
  } finally {
    client.release();
  }
});

export default router;
