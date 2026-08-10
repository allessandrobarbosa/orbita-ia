import express from "express";
import { pool } from "../db.js";
import { 
  fetchContratosPncp, fetchDetalheContratoPncp, fetchArquivosContratoPncp, 
  fetchEmpenhosContratoPncp, fetchAditivosContratoPncp, fetchHistoricoContratoPncp,
  fetchAllContratosMte, fetchAllContratosSraParaMte 
} from "../services/pncpService.js";

const router = express.Router();




async function ensureContratosSchema() {
  try {
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS valor_mensal NUMERIC(15, 2) DEFAULT 0`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS valor_anual NUMERIC(15, 2) DEFAULT 0`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS status VARCHAR(100) DEFAULT 'Ativo'`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS uasg VARCHAR(50)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS link_pncp TEXT`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS modalidade VARCHAR(100)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS pncp_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS municipio VARCHAR(255)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS numero_processo VARCHAR(100)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS categoria_processo VARCHAR(100)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tipo_contrato VARCHAR(100)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS receita_despesa VARCHAR(50)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS data_assinatura VARCHAR(50)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS data_divulgacao_pncp VARCHAR(50)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS pncp_contratacao_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS fruto_adesao BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tem_remanejamento BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS fonte_dados VARCHAR(100)`);
    await pool.query(`ALTER TABLE contratos ADD COLUMN IF NOT EXISTS tipo_fornecedor VARCHAR(50)`);

    await pool.query(`ALTER TABLE contratos_empenhos ADD COLUMN IF NOT EXISTS indicador_emenda BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE contratos_empenhos ADD COLUMN IF NOT EXISTS situacao VARCHAR(100)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contratos_arquivos (
        id VARCHAR(255) PRIMARY KEY,
        contrato_id VARCHAR(255) REFERENCES contratos(id) ON DELETE CASCADE,
        nome_arquivo VARCHAR(255),
        tipo_documento VARCHAR(100),
        url_download TEXT,
        data_publicacao VARCHAR(50)
      )
    `);
  } catch (err) {
    console.error("Erro ao verificar schema de contratos:", err);
  }
}
ensureContratosSchema();

function mapContratoRow(r: any) {
  const vGlobal = parseFloat(r.valor_global) || 0;
  const vMensal = parseFloat(r.valor_mensal) || (parseFloat(r.valor_anual) ? parseFloat(r.valor_anual) / 12 : 0);
  return {
    id: r.id,
    numeroContrato: r.numero_contrato,
    empresa: r.empresa,
    cnpj: r.cnpj,
    objeto: r.objeto,
    valorGlobal: vGlobal,
    valorMensal: vMensal,
    dataInicio: r.data_inicio,
    dataFim: r.data_fim,
    uf: r.uf,
    modalidade: r.modalidade,
    pncpId: r.pncp_id,
    uasg: r.uasg,
    linkPncp: r.link_pncp,
    status: r.status,
    municipio: r.municipio,
    numeroProcesso: r.numero_processo,
    categoriaProcesso: r.categoria_processo,
    tipoContrato: r.tipo_contrato,
    receitaDespesa: r.receita_despesa,
    dataAssinatura: r.data_assinatura,
    dataDivulgacaoPncp: r.data_divulgacao_pncp,
    pncpContratacaoId: r.pncp_contratacao_id,
    frutoAdesao: Boolean(r.fruto_adesao),
    temRemanejamento: Boolean(r.tem_remanejamento),
    fonteDados: r.fonte_dados,
    tipoFornecedor: r.tipo_fornecedor
  };
}

router.get("/contratos", async (req, res) => {
  try {
    await ensureContratosSchema();
    const {
      page, limit, sort = "data_inicio", order = "DESC",
      numeroContrato, empresa, cnpj, objeto, modalidade, status, uf, origem, uasg, ano,
      periodoInicio, periodoFim, numeroProcesso, categoriaProcesso, faixaVencimento
    } = req.query;

    let q = "SELECT * FROM contratos WHERE 1=1";
    let params: any[] = [];
    let paramIdx = 1;

    if (numeroContrato) { q += ` AND numero_contrato ILIKE $${paramIdx++}`; params.push(`%${numeroContrato}%`); }
    if (empresa) { q += ` AND empresa ILIKE $${paramIdx++}`; params.push(`%${empresa}%`); }
    if (cnpj) { q += ` AND cnpj ILIKE $${paramIdx++}`; params.push(`%${cnpj}%`); }
    if (objeto) { q += ` AND objeto ILIKE $${paramIdx++}`; params.push(`%${objeto}%`); }
    if (modalidade) { q += ` AND modalidade ILIKE $${paramIdx++}`; params.push(`%${modalidade}%`); }
    if (status) { q += ` AND status ILIKE $${paramIdx++}`; params.push(`%${status}%`); }
    if (numeroProcesso) { q += ` AND numero_processo ILIKE $${paramIdx++}`; params.push(`%${numeroProcesso}%`); }
    if (categoriaProcesso) { q += ` AND categoria_processo ILIKE $${paramIdx++}`; params.push(`%${categoriaProcesso}%`); }
    if (origem && origem !== "TODAS") {
      if (origem === "MTE") {
        q += ` AND (numero_contrato ILIKE '%[MTE]%' OR uasg ILIKE '%MTE%')`;
      } else if (origem === "MGI") {
        q += ` AND (numero_contrato ILIKE '%[MGI]%' OR uasg ILIKE '%MGI%' OR uasg ILIKE '%SRA%')`;
      }
    }
    if (uf && uf !== "TODAS") {

      if (uf === "DF (SEDE)") {
        q += ` AND (uf = 'DF_SEDE' OR uf = 'DF')`;
      } else if (uf === "DF (SRTE)") {
        q += ` AND uf = 'DF_SRTE'`;
      } else {
        q += ` AND uf = $${paramIdx++}`; params.push(uf);
      }
    }
    if (uasg) { q += ` AND uasg ILIKE $${paramIdx++}`; params.push(`%${uasg}%`); }
    if (ano) { q += ` AND LEFT(data_inicio, 4) = $${paramIdx++}`; params.push(String(ano)); }
    if (periodoInicio) { q += ` AND data_inicio >= $${paramIdx++}`; params.push(periodoInicio); }
    if (periodoFim) { q += ` AND data_inicio <= $${paramIdx++}`; params.push(periodoFim); }

    if (faixaVencimento) {
      const condition = `
        CASE 
          WHEN data_fim IS NULL OR data_fim = '' THEN 'Sem Data Fim'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) < CURRENT_DATE THEN 'Vencidos'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) <= CURRENT_DATE + INTERVAL '30 days' THEN 'Até 30 dias (Crítico)'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) <= CURRENT_DATE + INTERVAL '90 days' THEN '31 a 90 dias (Atenção)'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) <= CURRENT_DATE + INTERVAL '180 days' THEN '91 a 180 dias (Planejamento)'
          ELSE 'Mais de 180 dias (Vigente)'
        END = $${paramIdx++}
      `;
      q += ` AND (${condition})`;
      params.push(faixaVencimento);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM (${q}) as sub`, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const validSortCols = ["data_inicio", "data_fim", "numero_contrato", "empresa", "valor_global", "valor_mensal", "uf", "status"];
    const sortCol = validSortCols.includes(String(sort)) ? String(sort) : "data_inicio";
    const sortOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

    q += ` ORDER BY ${sortCol} ${sortOrder}`;

    if (page || limit) {
      const p = Math.max(1, parseInt(String(page || 1), 10));
      const l = Math.max(1, parseInt(String(limit || 1000), 10));
      q += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
      params.push(l, (p - 1) * l);

      const result = await pool.query(q, params);
      return res.json({
        data: result.rows.map(mapContratoRow),
        total,
        page: p,
        limit: l
      });
    }

    const result = await pool.query(q, params);
    return res.json(result.rows.map(mapContratoRow));
  } catch (error) {
    console.error("Erro ao buscar contratos:", error);
    res.status(500).json({ error: "Erro ao buscar contratos" });
  }
});

// GET /contratos/dashboard
router.get("/contratos-dashboard", async (req, res) => {
  try {
    await ensureContratosSchema();
    const totalRes = await pool.query("SELECT COUNT(*) FROM contratos");
    const total = parseInt(totalRes.rows[0].count, 10);

    const statsRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IS NULL OR status != 'Encerrado' THEN valor_global ELSE 0 END), 0) as valor_global_ativo,
        COALESCE(SUM(CASE WHEN status IS NULL OR status != 'Encerrado' THEN COALESCE(valor_mensal, valor_anual / 12, 0) ELSE 0 END), 0) as valor_mensal_ativo,
        COALESCE(SUM(CASE WHEN status = 'Ativo' OR status IS NULL THEN 1 ELSE 0 END), 0) as ativos,
        COALESCE(SUM(CASE WHEN status = 'Suspenso' THEN 1 ELSE 0 END), 0) as suspensos,
        COALESCE(SUM(CASE WHEN status = 'Encerrado' THEN 1 ELSE 0 END), 0) as encerrados
      FROM contratos
    `);

    const anoRes = await pool.query(`
      SELECT 
        CASE 
          WHEN data_inicio ~ '^\\d{4}' THEN LEFT(data_inicio, 4)
          WHEN data_inicio ~ '\\d{4}$' THEN RIGHT(data_inicio, 4)
          ELSE 'Outros'
        END as ano, 
        COUNT(*) as count 
      FROM contratos 
      WHERE data_inicio IS NOT NULL AND data_inicio != ''
      GROUP BY ano 
      ORDER BY ano ASC
    `);

    const ufRes = await pool.query(`
      SELECT uf, COUNT(*) as count 
      FROM contratos 
      WHERE uf IS NOT NULL AND uf != ''
      GROUP BY uf ORDER BY count DESC LIMIT 10
    `);

    const topFornecedoresRes = await pool.query(`
      SELECT empresa, COUNT(*) as count, SUM(valor_global) as total_valor 
      FROM contratos 
      WHERE empresa IS NOT NULL AND empresa != ''
      GROUP BY empresa ORDER BY total_valor DESC LIMIT 5
    `);

    const vencimentoRes = await pool.query(`
      SELECT 
        CASE 
          WHEN data_fim IS NULL OR data_fim = '' THEN 'Sem Data Fim'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) < CURRENT_DATE THEN 'Vencidos'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) <= CURRENT_DATE + INTERVAL '30 days' THEN 'Até 30 dias (Crítico)'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) <= CURRENT_DATE + INTERVAL '90 days' THEN '31 a 90 dias (Atenção)'
          WHEN (
            CASE 
              WHEN data_fim ~ '^\\d{4}-\\d{2}-\\d{2}' THEN data_fim::date
              WHEN data_fim ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_date(data_fim, 'DD/MM/YYYY')
              ELSE NULL
            END
          ) <= CURRENT_DATE + INTERVAL '180 days' THEN '91 a 180 dias (Planejamento)'
          ELSE 'Mais de 180 dias (Vigente)'
        END as faixa_vencimento,
        COUNT(*) as count,
        COALESCE(SUM(valor_global), 0) as total_valor
      FROM contratos
      WHERE status IS NULL OR status != 'Encerrado'
      GROUP BY faixa_vencimento
      ORDER BY count DESC
    `);

    const modalidadeRes = await pool.query(`
      SELECT 
        COALESCE(NULLIF(modalidade, ''), 'Não Informada') as modalidade,
        COUNT(*) as count,
        COALESCE(SUM(valor_global), 0) as total_valor
      FROM contratos
      GROUP BY modalidade
      ORDER BY count DESC
      LIMIT 6
    `);

    const tipoServicoRes = await pool.query(`
      SELECT 
        CASE 
          WHEN LOWER(COALESCE(objeto, '')) ~ 'tecnologia|software|dataprev|serpro|sistema|ti\\b|computad|internet|nuvem|telecom|suporte' THEN 'TI & Tecnologia'
          WHEN LOWER(COALESCE(objeto, '')) ~ 'vigil|limpeza|portaria|recep|conservac|terceiriz|mao de obra|postes' THEN 'Mão de Obra / Terceirizados'
          WHEN LOWER(COALESCE(objeto, '')) ~ 'manuten|predial|ar condic|elevador|reforma|engenhar|eletric' THEN 'Manutenção & Engenharia'
          WHEN LOWER(COALESCE(objeto, '')) ~ 'aluguel|locac|imovel|impressor|veic' THEN 'Locações (Imóveis/Equip)'
          WHEN LOWER(COALESCE(objeto, '')) ~ 'consultor|capacit|treinam|auditor|laudo|tecnico' THEN 'Serviços Técnicos / Consultoria'
          ELSE 'Outros Serviços / Bens'
        END as tipo_servico,
        COUNT(*) as count,
        COALESCE(SUM(valor_global), 0) as total_valor
      FROM contratos
      GROUP BY tipo_servico
      ORDER BY count DESC
    `);

    res.json({
      total,
      valorGlobalAtivo: parseFloat(statsRes.rows[0].valor_global_ativo) || 0,
      valorMensalAtivo: parseFloat(statsRes.rows[0].valor_mensal_ativo) || 0,
      ativos: parseInt(statsRes.rows[0].ativos, 10),
      suspensos: parseInt(statsRes.rows[0].suspensos, 10),
      encerrados: parseInt(statsRes.rows[0].encerrados, 10),
      graficoAnos: anoRes.rows,
      graficoUf: ufRes.rows,
      topFornecedores: topFornecedoresRes.rows,
      graficoVencimento: vencimentoRes.rows,
      graficoModalidade: modalidadeRes.rows,
      graficoTipoServico: tipoServicoRes.rows
    });

  } catch (error) {
    console.error("Erro no dashboard de contratos:", error);
    res.status(500).json({ error: "Erro interno no dashboard de contratos." });
  }
});

// GET /contratos/:id/dossie
router.get("/contratos/:id/dossie", async (req, res) => {
  try {
    await ensureContratosSchema();
    const { id } = req.params;
    const cRes = await pool.query("SELECT * FROM contratos WHERE id = $1 LIMIT 1", [id]);
    if (cRes.rows.length === 0) {
      return res.status(404).json({ error: "Contrato não encontrado." });
    }
    const contrato = mapContratoRow(cRes.rows[0]);

    let fiscaisRes = await pool.query("SELECT * FROM contratos_fiscais WHERE contrato_id = $1", [id]);
    let aditivosRes = await pool.query("SELECT * FROM contratos_aditivos WHERE contrato_id = $1 ORDER BY data_assinatura DESC", [id]);
    let empenhosRes = await pool.query("SELECT * FROM contratos_empenhos WHERE contrato_id = $1 ORDER BY data_emissao DESC", [id]);
    let consumoRes = await pool.query("SELECT * FROM contratos_consumo_mensal WHERE contrato_id = $1 ORDER BY mes DESC", [id]);
    let arquivosRes = await pool.query("SELECT * FROM contratos_arquivos WHERE contrato_id = $1 ORDER BY data_publicacao DESC", [id]);

    // Busca automática sob demanda no PNCP caso empenhos, aditivos ou arquivos estejam vazios no banco
    if (contrato.pncpId || contrato.linkPncp) {
      let cnpj = "";
      let ano = "";
      let sequencial = "";
      const match = String(contrato.pncpId || "").match(/(\d{14})-1-(\d+)\/(\d{4})/);
      if (match) {
        cnpj = match[1];
        sequencial = match[2];
        ano = match[3];
      } else if (contrato.linkPncp) {
        const linkMatch = String(contrato.linkPncp).match(/contratos\/(\d{14})\/(\d{4})\/(\d+)/);
        if (linkMatch) {
          cnpj = linkMatch[1];
          ano = linkMatch[2];
          sequencial = linkMatch[3];
        }
      }

      if (cnpj && ano && sequencial) {
        let updatedDb = false;

        if (empenhosRes.rows.length === 0) {
          const empenhosPncp = await fetchEmpenhosContratoPncp(cnpj, ano, sequencial);
          for (const emp of empenhosPncp) {
            const empId = `EMP-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            await pool.query(
              "INSERT INTO contratos_empenhos (id, contrato_id, numero_empenho, valor_empenhado, data_emissao, ptres, fonte_recurso, indicador_emenda, situacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
              [empId, id, emp.numeroEmpenho, emp.valorEmpenhado, emp.dataEmissao, emp.ptres, emp.fonteRecurso, Boolean(emp.indicadorEmenda), emp.situacao]
            );
            updatedDb = true;
          }
        }

        if (aditivosRes.rows.length === 0) {
          const aditivosPncp = await fetchAditivosContratoPncp(cnpj, ano, sequencial);
          for (const adt of aditivosPncp) {
            const adtId = `ADT-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            await pool.query(
              "INSERT INTO contratos_aditivos (id, contrato_id, numero, tipo, valor_adicionado, nova_data_fim, justificativa, data_assinatura) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
              [adtId, id, adt.numero, adt.tipo, adt.valorAdicionado, adt.novaDataFim, adt.justificativa, adt.dataAssinatura]
            );
            updatedDb = true;
          }
        }

        if (arquivosRes.rows.length === 0) {
          const arquivosPncp = await fetchArquivosContratoPncp(cnpj, ano, sequencial);
          for (const arq of arquivosPncp) {
            const arqId = `ARQ-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            await pool.query(
              "INSERT INTO contratos_arquivos (id, contrato_id, nome_arquivo, tipo_documento, url_download, data_publicacao) VALUES ($1, $2, $3, $4, $5, $6)",
              [arqId, id, arq.nomeArquivo, arq.tipoDocumento, arq.urlDownload, arq.dataPublicacao]
            );
            updatedDb = true;
          }
        }

        if (updatedDb) {
          aditivosRes = await pool.query("SELECT * FROM contratos_aditivos WHERE contrato_id = $1 ORDER BY data_assinatura DESC", [id]);
          empenhosRes = await pool.query("SELECT * FROM contratos_empenhos WHERE contrato_id = $1 ORDER BY data_emissao DESC", [id]);
          arquivosRes = await pool.query("SELECT * FROM contratos_arquivos WHERE contrato_id = $1 ORDER BY data_publicacao DESC", [id]);
        }

        const historicoPncp = await fetchHistoricoContratoPncp(cnpj, ano, sequencial);

        return res.json({
          contrato,
          fiscais: fiscaisRes.rows.map(r => ({
            id: r.id, contratoId: r.contrato_id, nome: r.nome, cpf: r.cpf,
            tipo: r.tipo, portariaDesignacao: r.portaria_designacao, dataInicio: r.data_inicio, dataFim: r.data_fim, status: r.status
          })),
          aditivos: aditivosRes.rows.map(r => ({
            id: r.id, contratoId: r.contrato_id, numero: r.numero, tipo: r.tipo,
            valorAdicionado: parseFloat(r.valor_adicionado) || 0, novaDataFim: r.nova_data_fim, justificativa: r.justificativa, dataAssinatura: r.data_assinatura
          })),
          empenhos: empenhosRes.rows.map(r => ({
            id: r.id, contratoId: r.contrato_id, numeroEmpenho: r.numero_empenho, valorEmpenhado: parseFloat(r.valor_empenhado) || 0,
            dataEmissao: r.data_emissao, ptres: r.ptres, fonteRecurso: r.fonte_recurso, indicadorEmenda: Boolean(r.indicador_emenda), situacao: r.situacao
          })),
          consumos: consumoRes.rows.map(r => ({
            id: r.id, contratoId: r.contrato_id, mes: r.mes,
            valorConsumido: parseFloat(r.valor_consumido) || 0, faturaUrl: r.fatura_url
          })),
          arquivos: arquivosRes.rows.map(r => ({
            id: r.id, contratoId: r.contrato_id, nomeArquivo: r.nome_arquivo, tipoDocumento: r.tipo_documento,
            urlDownload: r.url_download, dataPublicacao: r.data_publicacao
          })),
          historico: historicoPncp
        });
      }
    }

    res.json({
      contrato,
      fiscais: fiscaisRes.rows.map(r => ({
        id: r.id, contratoId: r.contrato_id, nome: r.nome, cpf: r.cpf,
        tipo: r.tipo, portariaDesignacao: r.portaria_designacao, dataInicio: r.data_inicio, dataFim: r.data_fim, status: r.status
      })),
      aditivos: aditivosRes.rows.map(r => ({
        id: r.id, contratoId: r.contrato_id, numero: r.numero, tipo: r.tipo,
        valorAdicionado: parseFloat(r.valor_adicionado) || 0, novaDataFim: r.nova_data_fim, justificativa: r.justificativa, dataAssinatura: r.data_assinatura
      })),
      empenhos: empenhosRes.rows.map(r => ({
        id: r.id, contratoId: r.contrato_id, numeroEmpenho: r.numero_empenho, valorEmpenhado: parseFloat(r.valor_empenhado) || 0,
        dataEmissao: r.data_emissao, ptres: r.ptres, fonteRecurso: r.fonte_recurso, indicadorEmenda: Boolean(r.indicador_emenda), situacao: r.situacao
      })),
      consumos: consumoRes.rows.map(r => ({
        id: r.id, contratoId: r.contrato_id, mes: r.mes,
        valorConsumido: parseFloat(r.valor_consumido) || 0, faturaUrl: r.fatura_url
      })),
      arquivos: arquivosRes.rows.map(r => ({
        id: r.id, contratoId: r.contrato_id, nomeArquivo: r.nome_arquivo, tipoDocumento: r.tipo_documento,
        urlDownload: r.url_download, dataPublicacao: r.data_publicacao
      })),
      historico: []
    });

  } catch (error) {
    console.error("Erro ao gerar dossiê do contrato:", error);
    res.status(500).json({ error: "Erro ao gerar dossiê do contrato" });
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
    await ensureContratosSchema();
    const c = req.body;
    c.id = c.id || "C-" + Date.now();
    await pool.query(
      `INSERT INTO contratos (
        id, numero_contrato, empresa, cnpj, objeto, valor_global, valor_mensal, data_inicio, data_fim, uf, modalidade, pncp_id, uasg, link_pncp, status,
        municipio, numero_processo, categoria_processo, tipo_contrato, receita_despesa, data_assinatura, data_divulgacao_pncp, pncp_contratacao_id, fruto_adesao, tem_remanejamento, fonte_dados, tipo_fornecedor
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
      [
        c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorGlobal || 0, c.valorMensal || 0, 
        c.dataInicio, c.dataFim, c.uf, c.modalidade || '', c.pncpId || '', c.uasg || '', c.linkPncp || '', c.status || 'Ativo',
        c.municipio || '', c.numeroProcesso || '', c.categoriaProcesso || '', c.tipoContrato || '', c.receitaDespesa || 'Despesa',
        c.dataAssinatura || '', c.dataDivulgacaoPncp || '', c.pncpContratacaoId || '', Boolean(c.frutoAdesao), Boolean(c.temRemanejamento),
        c.fonteDados || '', c.tipoFornecedor || ''
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
    await ensureContratosSchema();
    const { id } = req.params;
    const c = req.body;
    await pool.query(
      `UPDATE contratos SET 
        numero_contrato = $1, empresa = $2, cnpj = $3, objeto = $4, 
        valor_global = $5, valor_mensal = $6, data_inicio = $7, data_fim = $8, 
        uf = $9, modalidade = $10, pncp_id = $11, uasg = $12, link_pncp = $13, status = $14,
        municipio = $15, numero_processo = $16, categoria_processo = $17, tipo_contrato = $18,
        receita_despesa = $19, data_assinatura = $20, data_divulgacao_pncp = $21, pncp_contratacao_id = $22,
        fruto_adesao = $23, tem_remanejamento = $24, fonte_dados = $25, tipo_fornecedor = $26
      WHERE id = $27`,
      [
        c.numeroContrato, c.empresa, c.cnpj, c.objeto, 
        c.valorGlobal || 0, c.valorMensal || 0, c.dataInicio, c.dataFim, 
        c.uf, c.modalidade || '', c.pncpId || '', c.uasg || '', c.linkPncp || '', c.status || 'Ativo',
        c.municipio || '', c.numeroProcesso || '', c.categoriaProcesso || '', c.tipoContrato || '',
        c.receitaDespesa || 'Despesa', c.dataAssinatura || '', c.dataDivulgacaoPncp || '', c.pncpContratacaoId || '',
        Boolean(c.frutoAdesao), Boolean(c.temRemanejamento), c.fonteDados || '', c.tipoFornecedor || '', id
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

// ROTA PARA LIMPAR A BASE DE CONTRATOS
router.post("/contratos/reset", async (req, res) => {
  try {
    await ensureContratosSchema();
    await pool.query("DELETE FROM contratos_arquivos");
    await pool.query("DELETE FROM contratos_fiscais");
    await pool.query("DELETE FROM contratos_aditivos");
    await pool.query("DELETE FROM contratos_empenhos");
    await pool.query("DELETE FROM contratos_consumo_mensal");
    await pool.query("DELETE FROM contratos");
    res.json({ success: true, message: "Base de contratos zerada com sucesso." });
  } catch (error) {
    console.error("Erro ao zerar base de contratos:", error);
    res.status(500).json({ error: "Erro ao zerar base de contratos" });
  }
});

// SINCRONIZAÇÃO PNCP COM METADADOS EXPANDIDOS, REFRESH/UPSERT E ARQUIVOS
router.post("/contratos/sync-pncp", async (req, res) => {
  try {
    await ensureContratosSchema();
    const { cnpjOrgao, uf } = req.body;
    let contratosPncp: any[] = [];
    if (cnpjOrgao) {
      contratosPncp = await fetchContratosPncp(cnpjOrgao);
    } else {
      const mte = await fetchAllContratosMte();
      const sraParaMte = await fetchAllContratosSraParaMte();
      
      const todos = [...mte, ...sraParaMte];
      const unicosMap = new Map();
      todos.forEach(c => unicosMap.set(c.id, c));
      contratosPncp = Array.from(unicosMap.values());
    }

    let imported = 0;
    let updated = 0;

    for (const p of contratosPncp) {
      let detalhe: any = { nome: "Não informado", cnpj: "" };
      let arquivosPncp: any[] = [];

      let cnpj = p.orgaoEntidade?.cnpj;
      let ano = p.anoContrato;
      let sequencial = p.numero_sequencial;

      // Extração robusta a partir do ID de Controle PNCP (ex: 00489828000155-1-000501/2026)
      if (!sequencial || !cnpj || !ano) {
        const match = String(p.id).match(/(\d{14})-1-(\d+)\/(\d{4})/);
        if (match) {
          cnpj = cnpj || match[1];
          sequencial = sequencial || parseInt(match[2], 10);
          ano = ano || match[3];
        }
      }

      let empenhosPncp: any[] = [];
      let aditivosPncp: any[] = [];

      if (cnpj && ano && sequencial) {
        detalhe = await fetchDetalheContratoPncp(cnpj, ano, sequencial);
        arquivosPncp = await fetchArquivosContratoPncp(cnpj, ano, sequencial);
        empenhosPncp = await fetchEmpenhosContratoPncp(cnpj, ano, sequencial);
        aditivosPncp = await fetchAditivosContratoPncp(cnpj, ano, sequencial);
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

      const orgaoTag = (p.orgaoEntidade?.cnpj === "00489828000155" || cnpj === "00489828000155") ? "[MGI]" : "[MTE]";
      const numeroContratoComTag = `${orgaoTag} ${p.numeroContrato}`;
      const nomeUnidadeGestora = p.unidadeOrcamentaria?.nomeUnidade || "";
      const linkPncp = `https://pncp.gov.br/app/contratos/${cnpj || '00489828000155'}/${ano}/${sequencial}`;

      const exist = await pool.query("SELECT id FROM contratos WHERE pncp_id = $1", [p.id]);
      let targetContractId = "";

      if (exist.rows.length === 0) {
        const id = "C-PNCP-" + p.id;
        targetContractId = id;
        await pool.query(
          `INSERT INTO contratos (
            id, numero_contrato, empresa, cnpj, objeto, valor_global, valor_mensal, data_inicio, data_fim, uf, modalidade, pncp_id, uasg, link_pncp, status,
            municipio, numero_processo, categoria_processo, tipo_contrato, receita_despesa, data_assinatura, data_divulgacao_pncp, pncp_contratacao_id, fruto_adesao, tem_remanejamento, fonte_dados, tipo_fornecedor
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)`,
          [
            id, numeroContratoComTag, detalhe.nome || "Não informado", detalhe.cnpj || "", p.objeto || "Objeto não informado",
            p.valorGlobal, (p.valorGlobal ? p.valorGlobal / 12 : 0), p.dataInicioVigencia, p.dataFimVigencia, finalUf, 'Sincronizado', String(p.id), nomeUnidadeGestora,
            linkPncp, 'Ativo',
            detalhe.municipio || "", detalhe.numeroProcesso || "", detalhe.categoriaProcesso || "", detalhe.tipoContrato || "",
            detalhe.receitaDespesa || "Despesa", detalhe.dataAssinatura || p.dataAssinatura || "", detalhe.dataDivulgacaoPncp || "",
            detalhe.pncpContratacaoId || "", Boolean(detalhe.frutoAdesao), Boolean(detalhe.temRemanejamento),
            detalhe.fonteDados || "Contratos.gov.br", detalhe.tipoPessoaFornecedor || ""
          ]
        );
        imported++;
      } else {
        targetContractId = exist.rows[0].id;
        await pool.query(
          `UPDATE contratos SET 
            empresa = CASE WHEN $1 <> '' AND $1 <> 'Não informado' THEN $1 ELSE empresa END,
            cnpj = CASE WHEN $2 <> '' THEN $2 ELSE cnpj END,
            objeto = CASE WHEN $3 <> '' THEN $3 ELSE objeto END,
            valor_global = COALESCE($4, valor_global),
            valor_mensal = COALESCE($5, valor_mensal),
            data_inicio = CASE WHEN $6 <> '' THEN $6 ELSE data_inicio END,
            data_fim = CASE WHEN $7 <> '' THEN $7 ELSE data_fim END,
            uasg = CASE WHEN $8 <> '' THEN $8 ELSE uasg END,
            link_pncp = CASE WHEN $9 <> '' THEN $9 ELSE link_pncp END,
            municipio = CASE WHEN $10 <> '' THEN $10 ELSE municipio END,
            numero_processo = CASE WHEN $11 <> '' THEN $11 ELSE numero_processo END,
            categoria_processo = CASE WHEN $12 <> '' THEN $12 ELSE categoria_processo END,
            tipo_contrato = CASE WHEN $13 <> '' THEN $13 ELSE tipo_contrato END,
            receita_despesa = CASE WHEN $14 <> '' THEN $14 ELSE receita_despesa END,
            data_assinatura = CASE WHEN $15 <> '' THEN $15 ELSE data_assinatura END,
            data_divulgacao_pncp = CASE WHEN $16 <> '' THEN $16 ELSE data_divulgacao_pncp END,
            pncp_contratacao_id = CASE WHEN $17 <> '' THEN $17 ELSE pncp_contratacao_id END,
            fruto_adesao = $18,
            tem_remanejamento = $19,
            fonte_dados = CASE WHEN $20 <> '' THEN $20 ELSE fonte_dados END,
            tipo_fornecedor = CASE WHEN $21 <> '' THEN $21 ELSE tipo_fornecedor END
          WHERE id = $22`,
          [
            detalhe.nome || "", detalhe.cnpj || "", p.objeto || "",
            p.valorGlobal, (p.valorGlobal ? p.valorGlobal / 12 : null), p.dataInicioVigencia || "", p.dataFimVigencia || "",
            nomeUnidadeGestora || "", linkPncp || "", detalhe.municipio || "", detalhe.numeroProcesso || "", detalhe.categoriaProcesso || "",
            detalhe.tipoContrato || "", detalhe.receitaDespesa || "", detalhe.dataAssinatura || p.dataAssinatura || "", detalhe.dataDivulgacaoPncp || "",
            detalhe.pncpContratacaoId || "", Boolean(detalhe.frutoAdesao), Boolean(detalhe.temRemanejamento),
            detalhe.fonteDados || "", detalhe.tipoPessoaFornecedor || "", targetContractId
          ]
        );
        updated++;
      }

      // Insere arquivos que ainda não estejam na tabela
      for (const arq of arquivosPncp) {
        const arqExist = await pool.query("SELECT id FROM contratos_arquivos WHERE contrato_id = $1 AND nome_arquivo = $2", [targetContractId, arq.nomeArquivo]);
        if (arqExist.rows.length === 0) {
          const arqId = `ARQ-${targetContractId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          await pool.query(
            "INSERT INTO contratos_arquivos (id, contrato_id, nome_arquivo, tipo_documento, url_download, data_publicacao) VALUES ($1, $2, $3, $4, $5, $6)",
            [arqId, targetContractId, arq.nomeArquivo, arq.tipoDocumento, arq.urlDownload, arq.dataPublicacao]
          );
        }
      }

      // Insere empenhos do PNCP que ainda não estejam na tabela
      for (const emp of empenhosPncp) {
        const empExist = await pool.query("SELECT id FROM contratos_empenhos WHERE contrato_id = $1 AND numero_empenho = $2", [targetContractId, emp.numeroEmpenho]);
        if (empExist.rows.length === 0) {
          const empId = `EMP-${targetContractId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          await pool.query(
            "INSERT INTO contratos_empenhos (id, contrato_id, numero_empenho, valor_empenhado, data_emissao, ptres, fonte_recurso, indicador_emenda, situacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [empId, targetContractId, emp.numeroEmpenho, emp.valorEmpenhado, emp.dataEmissao, emp.ptres, emp.fonteRecurso, Boolean(emp.indicadorEmenda), emp.situacao]
          );
        }
      }

      // Insere aditivos do PNCP que ainda não estejam na tabela
      for (const adt of aditivosPncp) {
        const adtExist = await pool.query("SELECT id FROM contratos_aditivos WHERE contrato_id = $1 AND numero = $2", [targetContractId, adt.numero]);
        if (adtExist.rows.length === 0) {
          const adtId = `ADT-${targetContractId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          await pool.query(
            "INSERT INTO contratos_aditivos (id, contrato_id, numero, tipo, valor_adicionado, nova_data_fim, justificativa, data_assinatura) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [adtId, targetContractId, adt.numero, adt.tipo, adt.valorAdicionado, adt.novaDataFim, adt.justificativa, adt.dataAssinatura]
          );
        }
      }

    }
    res.json({ success: true, imported, updated, total: contratosPncp.length });
  } catch (error) {
    console.error("Erro na sincronização PNCP:", error);
    res.status(500).json({ error: "Erro na sincronização" });
  }
});



// ARQUIVOS DO CONTRATO
router.get("/contratos/:id/arquivos", async (req, res) => {
  try {
    await ensureContratosSchema();
    const result = await pool.query("SELECT * FROM contratos_arquivos WHERE contrato_id = $1 ORDER BY data_publicacao DESC", [req.params.id]);
    res.json(result.rows.map(r => ({
      id: r.id, contratoId: r.contrato_id, nomeArquivo: r.nome_arquivo, 
      tipoDocumento: r.tipo_documento, urlDownload: r.url_download, dataPublicacao: r.data_publicacao
    })));
  } catch (error) { res.status(500).json({ error: "Erro ao buscar arquivos do contrato" }); }
});

router.post("/contratos/:id/arquivos", async (req, res) => {
  try {
    await ensureContratosSchema();
    const { id } = req.params;
    const a = req.body;
    a.id = a.id || "ARQ-" + Date.now();
    await pool.query(
      "INSERT INTO contratos_arquivos (id, contrato_id, nome_arquivo, tipo_documento, url_download, data_publicacao) VALUES ($1, $2, $3, $4, $5, $6)",
      [a.id, id, a.nomeArquivo, a.tipoDocumento || 'Documento', a.urlDownload || '', a.dataPublicacao || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(a);
  } catch (error) { res.status(500).json({ error: "Erro ao adicionar arquivo ao contrato" }); }
});

router.delete("/contratos/arquivos/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM contratos_arquivos WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: "Erro ao deletar arquivo" }); }
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
