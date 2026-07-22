import { pool } from './src/backend/db.js';
const q = `
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

      ORDER BY 
        sigla_unidade ASC, 
        CASE WHEN data_fim IS NULL OR data_fim >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
        is_substituto ASC,
        nome_completo ASC,
        data_inicio DESC
`;
pool.query(q)
  .then(()=>console.log('SQL is valid'))
  .catch(e => console.error('SQL ERROR:', e))
  .finally(() => pool.end());
