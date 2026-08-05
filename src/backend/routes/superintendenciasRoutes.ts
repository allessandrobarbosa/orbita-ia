import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// =============================================================================
// METADADOS DAS SRTEs — capital e estado para matching textual
// Inclui variações com e sem acento para cobrir inconsistências de encoding.
// =============================================================================
const SRTE_LOOKUP: { uf: string; mteCode: string; capital: string[]; state: string[] }[] = [
  { uf: "AC", mteCode: "46002", capital: ["rio branco"],                    state: ["acre"] },
  { uf: "AL", mteCode: "46003", capital: ["maceio", "maceió"],              state: ["alagoas"] },
  { uf: "AM", mteCode: "46004", capital: ["manaus"],                        state: ["amazonas"] },
  { uf: "AP", mteCode: "46030", capital: ["macapa", "macapá"],              state: ["amapa", "amapá"] },
  { uf: "BA", mteCode: "46005", capital: ["salvador"],                      state: ["bahia"] },
  { uf: "CE", mteCode: "46006", capital: ["fortaleza"],                     state: ["ceara", "ceará"] },
  { uf: "DF", mteCode: "46007", capital: ["brasilia", "brasília"],          state: ["distrito federal"] },
  { uf: "ES", mteCode: "46008", capital: ["vitoria", "vitória"],            state: ["espirito santo", "espírito santo"] },
  { uf: "GO", mteCode: "46009", capital: ["goiania", "goiânia"],            state: ["goias", "goiás"] },
  { uf: "MA", mteCode: "46017", capital: ["sao luis", "são luís", "são luis"], state: ["maranhao", "maranhão"] },
  { uf: "MG", mteCode: "46013", capital: ["belo horizonte"],                state: ["minas gerais"] },
  { uf: "MS", mteCode: "46028", capital: ["campo grande"],                  state: ["mato grosso do sul"] },
  { uf: "MT", mteCode: "46027", capital: ["cuiaba", "cuiabá"],              state: ["mato grosso"] },
  { uf: "PA", mteCode: "46016", capital: ["belem", "belém"],                state: ["para", "pará"] },
  { uf: "PB", mteCode: "46018", capital: ["joao pessoa", "joão pessoa"],    state: ["paraiba", "paraíba"] },
  { uf: "PE", mteCode: "46014", capital: ["recife"],                        state: ["pernambuco"] },
  { uf: "PI", mteCode: "46023", capital: ["teresina"],                      state: ["piaui", "piauí"] },
  { uf: "PR", mteCode: "46011", capital: ["curitiba"],                      state: ["parana", "paraná"] },
  { uf: "RJ", mteCode: "46012", capital: ["rio de janeiro"],                state: ["rio de janeiro"] },
  { uf: "RN", mteCode: "46019", capital: ["natal"],                         state: ["rio grande do norte"] },
  { uf: "RO", mteCode: "46024", capital: ["porto velho"],                   state: ["rondonia", "rondônia"] },
  { uf: "RR", mteCode: "46025", capital: ["boa vista"],                     state: ["roraima"] },
  { uf: "RS", mteCode: "46015", capital: ["porto alegre"],                  state: ["rio grande do sul"] },
  { uf: "SC", mteCode: "46020", capital: ["florianopolis", "florianópolis"], state: ["santa catarina"] },
  { uf: "SE", mteCode: "46021", capital: ["aracaju"],                       state: ["sergipe"] },
  { uf: "SP", mteCode: "46010", capital: ["sao paulo", "são paulo"],        state: ["sao paulo", "são paulo"] },
  { uf: "TO", mteCode: "46026", capital: ["palmas"],                        state: ["tocantins"] },
];

// =============================================================================
// AUTO-CRIAÇÃO DAS TABELAS DE CRUZAMENTO (idempotente)
// CORREÇÃO: unaccent em try-catch separado — falha de permissão não impede criação das tabelas.
// =============================================================================
let srteLinkingTablesReady = false;

async function ensureSrteLinkingTables(): Promise<void> {
  if (srteLinkingTablesReady) return;

  // Tenta instalar unaccent — não crítico, segue sem ela se falhar
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    console.log("[SRTE] Extensão unaccent disponível.");
  } catch (_extErr: any) {
    console.warn("[SRTE] unaccent não disponível (sem permissão). Matching sem normalização de acentos.");
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_acordao (
        uf            VARCHAR(5)   NOT NULL,
        acordao_key   VARCHAR(255) NOT NULL,
        motivo_vinculo VARCHAR(50)  DEFAULT 'TEXTO',
        criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, acordao_key)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_acordao_uf  ON srte_acordao(uf)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_acordao_key ON srte_acordao(acordao_key)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_comunicacao (
        uf              VARCHAR(5)   NOT NULL,
        comunicacao_key VARCHAR(255) NOT NULL,
        motivo_vinculo  VARCHAR(50)  DEFAULT 'DESTINATARIO',
        criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, comunicacao_key)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_comunicacao_uf ON srte_comunicacao(uf)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_tce (
        uf            VARCHAR(5)   NOT NULL,
        tce_id        VARCHAR(255) NOT NULL,
        motivo_vinculo VARCHAR(50)  DEFAULT 'TEXTO',
        criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, tce_id)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_tce_uf ON srte_tce(uf)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_cgu (
        uf            VARCHAR(5)   NOT NULL,
        cgu_id        VARCHAR(255) NOT NULL,
        motivo_vinculo VARCHAR(50)  DEFAULT 'UNIDADE',
        criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, cgu_id)
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_cgu_uf ON srte_cgu(uf)`);

    await pool.query(`
      CREATE OR REPLACE VIEW vw_srte_dashboard_metrics AS
      SELECT
        s.uf,
        COUNT(DISTINCT sa.acordao_key)     AS demandas_tcu,
        COUNT(DISTINCT sc.comunicacao_key) AS demandas_comunicacoes,
        COUNT(DISTINCT st.tce_id)          AS demandas_tces,
        COUNT(DISTINCT sg.cgu_id)          AS demandas_cgu
      FROM superintendencias s
      LEFT JOIN srte_acordao     sa ON sa.uf = s.uf
      LEFT JOIN srte_comunicacao sc ON sc.uf = s.uf
      LEFT JOIN srte_tce         st ON st.uf = s.uf
      LEFT JOIN srte_cgu         sg ON sg.uf = s.uf
      GROUP BY s.uf
    `);

    srteLinkingTablesReady = true;
    console.log("[SRTE] Tabelas de cruzamento inicializadas com sucesso.");
  } catch (err: any) {
    console.error("[SRTE] Erro ao criar tabelas de cruzamento:", err.message);
    // Não lança — deixa o endpoint principal tentar continuar com fallback
  }
}

// =============================================================================
// HELPERS — Gera cláusula WHERE com ORs explícitos para matching de texto.
// Substitui LIKE ANY($arr::text[]) que tinha problemas de serialização de arrays.
// =============================================================================

/**
 * Gera cláusula SQL de LIKE com ORs explícitos para evitar problemas com
 * passagem de arrays do Node.js para o PostgreSQL.
 * Retorna: (field LIKE $N OR field LIKE $N+1 ...)
 * Os parâmetros são adicionados em `params` a partir do índice `startIdx`.
 */
function buildLikeOrClause(field: string, patterns: string[], params: any[], startIdx: number): string {
  const clauses = patterns.map((p, i) => {
    params.push(p);
    return `${field} LIKE $${startIdx + i}`;
  });
  return `(${clauses.join(" OR ")})`;
}

/**
 * Gera cláusula regex ~* (case-insensitive) para o padrão srte[sep]UF.
 * Ex: "SRTE/SP", "SRTE-SP", "SRTE SP", "SRTE.SP", "srte/sp" etc.
 * Muito mais robusto que LIKE para esse caso de uso.
 */
function buildUfRegexClause(field: string, uf: string, params: any[], startIdx: number): string {
  // ~* = case-insensitive regex em PostgreSQL
  // [^a-zA-Z0-9]? = separador opcional entre SRTE e UF (/, -, espaço, ponto, etc.)
  const regexPattern = `srte[^a-zA-Z0-9]?${uf}`;
  params.push(regexPattern);
  return `${field} ~* $${startIdx}`;
}

// =============================================================================
// MOTOR — ACÓRDÃOS TCU
// =============================================================================
async function vincularAcordaos(uf: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_acordao WHERE uf = $1`, [uf]);

  const textField = `LOWER(
    COALESCE(titulo,'') || ' ' ||
    COALESCE(interessados,'') || ' ' ||
    COALESCE(assunto,'') || ' ' ||
    COALESCE(sumario,'') || ' ' ||
    COALESCE(decisao,'')
  )`;

  // ── Fase 1: Regex UF — "SRTE/SP", "SRTE-SP", "SRT/SP" etc.
  let params1: any[] = [uf];
  const regexClause = buildUfRegexClause(
    `(titulo || ' ' || COALESCE(interessados,'') || ' ' || COALESCE(assunto,'') || ' ' || COALESCE(sumario,'') || ' ' || COALESCE(decisao,''))`,
    uf,
    params1,
    2
  );
  await pool.query(`
    INSERT INTO srte_acordao (uf, acordao_key, motivo_vinculo)
    SELECT $1, key, 'UF_PATTERN'
    FROM tcu_acordaos
    WHERE ${regexClause}
    ON CONFLICT (uf, acordao_key) DO NOTHING
  `, params1);

  // ── Fase 2: Contextual — menção a "srte" ou "superintendência" + localização
  // Contexto: o documento menciona SRTE ou superintendência de alguma forma
  const contextField = `LOWER(COALESCE(titulo,'') || ' ' || COALESCE(interessados,'') || ' ' || COALESCE(assunto,'') || ' ' || COALESCE(sumario,''))`;
  const contextPatterns = [
    '%srte%',
    '%superintend%',  // cobre superintendência, superintendência regional etc. com ou sem acento
    '%gerencia regional%',
    '%gerência regional%',
  ];

  const locationPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];

  for (const locPat of locationPatterns) {
    let params2: any[] = [uf, locPat];
    const ctxClause = buildLikeOrClause(contextField, contextPatterns, params2, 3);
    await pool.query(`
      INSERT INTO srte_acordao (uf, acordao_key, motivo_vinculo)
      SELECT $1, key, 'LOCALIZACAO'
      FROM tcu_acordaos
      WHERE ${contextField} LIKE $2
        AND ${ctxClause}
      ON CONFLICT (uf, acordao_key) DO NOTHING
    `, params2);
  }

  const r = await pool.query(`SELECT COUNT(*) FROM srte_acordao WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

// =============================================================================
// MOTOR — COMUNICAÇÕES (OFÍCIOS)
// =============================================================================
async function vincularComunicacoes(uf: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_comunicacao WHERE uf = $1`, [uf]);

  const destField = `LOWER(COALESCE(destinatario,'') || ' ' || COALESCE(comunicacao,'') || ' ' || COALESCE(contato,'') || ' ' || COALESCE(processo,''))`;

  // ── Fase 1: Regex UF no destinatário — modo mais confiável para comunicações
  let params1: any[] = [uf];
  const regexClause = buildUfRegexClause(
    `(COALESCE(destinatario,'') || ' ' || COALESCE(comunicacao,''))`,
    uf,
    params1,
    2
  );
  await pool.query(`
    INSERT INTO srte_comunicacao (uf, comunicacao_key, motivo_vinculo)
    SELECT $1, key, 'DESTINATARIO_UF'
    FROM tcu_comunicacoes
    WHERE ${regexClause}
    ON CONFLICT (uf, comunicacao_key) DO NOTHING
  `, params1);

  // ── Fase 2: Localização (capital ou estado) no campo destinatário
  const locationPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];
  for (const locPat of locationPatterns) {
    let params2: any[] = [uf, locPat];
    await pool.query(`
      INSERT INTO srte_comunicacao (uf, comunicacao_key, motivo_vinculo)
      SELECT $1, key, 'LOCALIZACAO'
      FROM tcu_comunicacoes
      WHERE ${destField} LIKE $2
      ON CONFLICT (uf, comunicacao_key) DO NOTHING
    `, params2);
  }

  const r = await pool.query(`SELECT COUNT(*) FROM srte_comunicacao WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

// =============================================================================
// MOTOR — TCEs (TOMADAS DE CONTAS ESPECIAIS)
// =============================================================================
async function vincularTces(uf: string, mteCode: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_tce WHERE uf = $1`, [uf]);

  // ── Fase 1: Código MTE no processo administrativo
  // Remove não-dígitos e verifica o prefixo numérico.
  // Compatível com 46010, 19955 e qualquer outro código MTE.
  await pool.query(`
    INSERT INTO srte_tce (uf, tce_id, motivo_vinculo)
    SELECT $1, id, 'CODIGO_MTE'
    FROM tcu_tce
    WHERE REGEXP_REPLACE(COALESCE(processo_administrativo,''), '[^0-9]', '', 'g') LIKE $2
    ON CONFLICT (uf, tce_id) DO NOTHING
  `, [uf, `${mteCode}%`]);

  // ── Fase 2: Regex UF em campos textuais
  const textAllFields = `(COALESCE(numero_ano_tce,'') || ' ' || COALESCE(processo_administrativo,'') || ' ' || COALESCE(motivo_instauracao,'') || ' ' || COALESCE(submotivo_instauracao,'') || ' ' || COALESCE(ultimo_posicionamento,''))`;
  let params2: any[] = [uf];
  const regexClause = buildUfRegexClause(textAllFields, uf, params2, 2);
  await pool.query(`
    INSERT INTO srte_tce (uf, tce_id, motivo_vinculo)
    SELECT $1, id, 'UF_PATTERN'
    FROM tcu_tce
    WHERE ${regexClause}
    ON CONFLICT (uf, tce_id) DO NOTHING
  `, params2);

  // ── Fase 3: Localização + contexto MTE nos campos textuais
  const textMotivo = `LOWER(COALESCE(motivo_instauracao,'') || ' ' || COALESCE(submotivo_instauracao,'') || ' ' || COALESCE(ultimo_posicionamento,''))`;
  const contextPatterns = [
    '%srte%', '%superintend%',
    '%ministerio do trabalho%', '%ministério do trabalho%', '%mte%',
  ];
  const locationPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];

  for (const locPat of locationPatterns) {
    let params3: any[] = [uf, locPat];
    const ctxClause = buildLikeOrClause(textMotivo, contextPatterns, params3, 3);
    await pool.query(`
      INSERT INTO srte_tce (uf, tce_id, motivo_vinculo)
      SELECT $1, id, 'LOCALIZACAO'
      FROM tcu_tce
      WHERE ${textMotivo} LIKE $2
        AND ${ctxClause}
      ON CONFLICT (uf, tce_id) DO NOTHING
    `, params3);
  }

  const r = await pool.query(`SELECT COUNT(*) FROM srte_tce WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

// =============================================================================
// MOTOR — DEMANDAS CGU
// =============================================================================
async function vincularCgu(uf: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_cgu WHERE uf = $1`, [uf]);

  // ── Fase 1: Campo estado da CGU (mais direto e confiável)
  // O campo estado é a UF ou o nome do estado — tentamos ambos
  const ufLower = uf.toLowerCase();
  await pool.query(`
    INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
    SELECT $1, id_tarefa, 'ESTADO'
    FROM cgu_demands
    WHERE LOWER(COALESCE(estado,'')) = $2
       OR LOWER(COALESCE(estado,'')) = $3
    ON CONFLICT (uf, cgu_id) DO NOTHING
  `, [uf, ufLower, uf]);

  // ── Fase 2: Regex UF na unidade auditada
  let params2: any[] = [uf];
  const regexClause = buildUfRegexClause(
    `(COALESCE(unidade_auditada,'') || ' ' || COALESCE(unidades_auditoria,''))`,
    uf, params2, 2
  );
  await pool.query(`
    INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
    SELECT $1, id_tarefa, 'UNIDADE_UF'
    FROM cgu_demands
    WHERE ${regexClause}
    ON CONFLICT (uf, cgu_id) DO NOTHING
  `, params2);

  // ── Fase 3: Localização (capital ou estado) nos campos de texto
  const textField = `LOWER(COALESCE(unidade_auditada,'') || ' ' || COALESCE(unidades_auditoria,'') || ' ' || COALESCE(titulo_tarefa,''))`;
  const locationPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];
  for (const locPat of locationPatterns) {
    await pool.query(`
      INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
      SELECT $1, id_tarefa, 'LOCALIZACAO'
      FROM cgu_demands
      WHERE ${textField} LIKE $2
      ON CONFLICT (uf, cgu_id) DO NOTHING
    `, [uf, locPat]);
  }

  const r = await pool.query(`SELECT COUNT(*) FROM srte_cgu WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

// =============================================================================
// STATUS DO JOB EM MEMÓRIA
// =============================================================================
let recalcJobStatus: {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  progress: { uf: string; acordaos: number; comunicacoes: number; tces: number; cgu: number }[];
  error: string | null;
  totalUfs: number;
  processedUfs: number;
} = {
  running: false,
  startedAt: null,
  finishedAt: null,
  progress: [],
  error: null,
  totalUfs: SRTE_LOOKUP.length,
  processedUfs: 0,
};

// =============================================================================
// GET /superintendencias
// =============================================================================
router.get("/superintendencias", async (req, res) => {
  await ensureSrteLinkingTables();

  try {
    const result = await pool.query(`
      SELECT
        s.*,
        COALESCE(v.demandas_tcu, 0)            AS view_tcu,
        COALESCE(v.demandas_cgu, 0)             AS view_cgu,
        COALESCE(v.demandas_comunicacoes, 0)    AS demandas_comunicacoes,
        COALESCE(v.demandas_tces, 0)            AS demandas_tces,
        (SELECT json_agg(acordao_key)    FROM srte_acordao     WHERE uf = s.uf) AS acordao_ids,
        (SELECT json_agg(comunicacao_key) FROM srte_comunicacao WHERE uf = s.uf) AS comunicacao_ids,
        (SELECT json_agg(tce_id)         FROM srte_tce          WHERE uf = s.uf) AS tce_ids,
        (SELECT json_agg(cgu_id)         FROM srte_cgu          WHERE uf = s.uf) AS cgu_ids
      FROM superintendencias s
      LEFT JOIN vw_srte_dashboard_metrics v ON s.uf = v.uf
    `);

    const mapped = result.rows.map(row => ({
      uf:                   row.uf,
      capital:              row.capital,
      superintendente:      row.superintendente,
      cargo:                row.cargo,
      endereco:             row.endereco,
      contato:              row.contato,
      email:                row.email,
      substituto:           row.substituto,
      emailSubstituto:      row.email_substituto,
      cep:                  row.cep,
      latitude:             row.latitude,
      longitude:            row.longitude,
      demandasTCU:          parseInt(row.view_tcu)              || 0,
      demandasCGU:          parseInt(row.view_cgu)              || 0,
      demandasComunicacoes: parseInt(row.demandas_comunicacoes) || 0,
      demandasTces:         parseInt(row.demandas_tces)         || 0,
      demandasEtica:        row.demandas_etica,
      statusGeral:          row.status_geral,
      acordaoIds:           row.acordao_ids     || [],
      comunicacaoIds:       row.comunicacao_ids || [],
      tceIds:               row.tce_ids         || [],
      cguIds:               row.cgu_ids         || [],
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error fetching superintendencias:", error);
    res.status(500).json({ error: "Erro interno ao buscar superintendências." });
  }
});

// =============================================================================
// PUT /superintendencias/:uf
// =============================================================================
router.put("/superintendencias/:uf", async (req, res) => {
  try {
    const uf = req.params.uf.toUpperCase();
    const d  = req.body;
    await pool.query(`
      UPDATE superintendencias
      SET superintendente  = $1, endereco = $2, contato = $3, email = $4,
          substituto       = $5, email_substituto = $6, cep = $7, status_geral = $8
      WHERE uf = $9
    `, [d.superintendente, d.endereco, d.contato, d.email,
        d.substituto, d.emailSubstituto, d.cep, d.statusGeral, uf]);
    res.json({ success: true, uf, ...d });
  } catch (error) {
    console.error("Error updating superintendencias:", error);
    res.status(500).json({ error: "Erro interno ao atualizar a superintendência." });
  }
});

// =============================================================================
// POST /srte/recalcular-vinculos — Motor de cruzamento. Resposta IMEDIATA (202).
// =============================================================================
router.post("/srte/recalcular-vinculos", async (req, res) => {
  if (recalcJobStatus.running) {
    return res.status(409).json({
      success: false,
      message: "Recálculo já em andamento. Aguarde a conclusão.",
      status: recalcJobStatus,
    });
  }

  await ensureSrteLinkingTables();

  if (!srteLinkingTablesReady) {
    return res.status(500).json({
      success: false,
      message: "Não foi possível inicializar as tabelas de cruzamento. Verifique os logs do servidor.",
    });
  }

  recalcJobStatus = {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    progress: [],
    error: null,
    totalUfs: SRTE_LOOKUP.length,
    processedUfs: 0,
  };

  res.status(202).json({
    success: true,
    message: `Recálculo iniciado para ${SRTE_LOOKUP.length} SRTEs. Use GET /api/srte/recalcular-vinculos/status para acompanhar.`,
    startedAt: recalcJobStatus.startedAt,
  });

  // ─── Processamento assíncrono após o response ────────────────────────────
  (async () => {
    console.log("[SRTE-RECALC] ═══ Iniciando recálculo de vínculos ═══");
    console.time("[SRTE-RECALC] Tempo total");

    for (const srte of SRTE_LOOKUP) {
      const { uf, mteCode, capital, state } = srte;
      try {
        console.log(`[SRTE-RECALC] Processando: ${uf}...`);

        const [acordaosCount, comunicacoesCount, tcesCount, cguCount] = await Promise.all([
          vincularAcordaos(uf, capital, state),
          vincularComunicacoes(uf, capital, state),
          vincularTces(uf, mteCode, capital, state),
          vincularCgu(uf, capital, state),
        ]);

        const novoStatus = acordaosCount >= 3 || (acordaosCount + cguCount) >= 8
          ? "Crítico"
          : acordaosCount >= 1 || (acordaosCount + cguCount) >= 4
          ? "Atenção"
          : "Regular";

        await pool.query(
          `UPDATE superintendencias SET status_geral = $1 WHERE uf = $2`,
          [novoStatus, uf]
        );

        recalcJobStatus.progress.push({ uf, acordaos: acordaosCount, comunicacoes: comunicacoesCount, tces: tcesCount, cgu: cguCount });
        recalcJobStatus.processedUfs++;

        console.log(`[SRTE-RECALC] ${uf}: acórdãos=${acordaosCount}, comunicações=${comunicacoesCount}, TCEs=${tcesCount}, CGU=${cguCount}, status=${novoStatus}`);
      } catch (err: any) {
        console.error(`[SRTE-RECALC] ❌ Erro ao processar ${uf}:`, err.message);
        recalcJobStatus.progress.push({ uf, acordaos: 0, comunicacoes: 0, tces: 0, cgu: 0 });
        recalcJobStatus.processedUfs++;
      }
    }

    recalcJobStatus.running = false;
    recalcJobStatus.finishedAt = new Date().toISOString();
    console.timeEnd("[SRTE-RECALC] Tempo total");
    console.log("[SRTE-RECALC] ═══ Recálculo concluído ═══");
  })().catch(err => {
    console.error("[SRTE-RECALC] Erro crítico:", err);
    recalcJobStatus.running = false;
    recalcJobStatus.error = err.message;
    recalcJobStatus.finishedAt = new Date().toISOString();
  });
});

// =============================================================================
// GET /srte/recalcular-vinculos/status
// =============================================================================
router.get("/srte/recalcular-vinculos/status", (_req, res) => {
  res.json({ success: true, status: recalcJobStatus });
});

// =============================================================================
// GET /api/srte/diagnostico/:uf
// Endpoint de diagnóstico: mostra amostras de dados e por que o matching falha.
// Útil para debugar a associação de documentos a uma SRTE específica.
// =============================================================================
router.get("/srte/diagnostico/:uf", async (req, res) => {
  const uf = req.params.uf.toUpperCase();
  const srte = SRTE_LOOKUP.find(s => s.uf === uf);
  if (!srte) {
    return res.status(404).json({ error: `UF "${uf}" não encontrada no lookup.` });
  }

  try {
    const [
      tablesResult,
      acordaosSample,
      comunicacoesSample,
      tcesSample,
      cguSample,
      vinculados,
    ] = await Promise.all([
      // Verifica se as tabelas existem
      pool.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('srte_acordao','srte_comunicacao','srte_tce','srte_cgu','superintendencias')
      `),
      // 3 primeiros acórdãos para inspeção
      pool.query(`SELECT key, titulo, interessados, assunto FROM tcu_acordaos LIMIT 3`).catch(() => ({ rows: [] })),
      // 3 primeiras comunicações
      pool.query(`SELECT key, comunicacao, destinatario FROM tcu_comunicacoes LIMIT 3`).catch(() => ({ rows: [] })),
      // 3 primeiras TCEs
      pool.query(`SELECT id, numero_ano_tce, processo_administrativo, motivo_instauracao FROM tcu_tce LIMIT 3`).catch(() => ({ rows: [] })),
      // 3 primeiras demandas CGU
      pool.query(`SELECT id_tarefa, estado, unidade_auditada, titulo_tarefa FROM cgu_demands LIMIT 3`).catch(() => ({ rows: [] })),
      // Vínculos já registrados para este UF
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM srte_acordao     WHERE uf = $1) AS acordaos,
          (SELECT COUNT(*) FROM srte_comunicacao WHERE uf = $1) AS comunicacoes,
          (SELECT COUNT(*) FROM srte_tce          WHERE uf = $1) AS tces,
          (SELECT COUNT(*) FROM srte_cgu          WHERE uf = $1) AS cgu
      `, [uf]).catch(() => ({ rows: [{ acordaos: 'erro', comunicacoes: 'erro', tces: 'erro', cgu: 'erro' }] })),
    ]);

    res.json({
      uf,
      srteMetadata: srte,
      tablesExisting: tablesResult.rows.map((r: any) => r.table_name),
      vinculosAtuais: vinculados.rows[0],
      amostras: {
        acordaos: acordaosSample.rows,
        comunicacoes: comunicacoesSample.rows,
        tces: tcesSample.rows,
        cgu: cguSample.rows,
      },
      hint: "Compare os campos de 'amostras' com srteMetadata.capital e srteMetadata.state para ver se o padrão UF aparece nos dados reais.",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
