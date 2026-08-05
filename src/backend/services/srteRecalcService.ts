/**
 * srteRecalcService.ts
 * Serviço de recálculo de vínculos SRTE — pode ser chamado por qualquer rota.
 * Executa em background (fire-and-forget) sem bloquear a resposta HTTP.
 */
import { pool } from "../db.js";

// ─── Estado compartilhado (in-memory, reiniciado com o servidor) ─────────────
export interface RecalcJobStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  source: string;
  progress: { uf: string; acordaos: number; comunicacoes: number; tces: number; cgu: number }[];
  error: string | null;
  totalUfs: number;
  processedUfs: number;
}

export let recalcJobStatus: RecalcJobStatus = {
  running: false,
  startedAt: null,
  finishedAt: null,
  source: "",
  progress: [],
  error: null,
  totalUfs: 27,
  processedUfs: 0,
};

// ─── Lookup de SRTEs ─────────────────────────────────────────────────────────
export const SRTE_LOOKUP: { uf: string; mteCode: string; capital: string[]; state: string[] }[] = [
  { uf: "AC", mteCode: "46002", capital: ["rio branco"],                     state: ["acre"] },
  { uf: "AL", mteCode: "46003", capital: ["maceio", "maceió"],               state: ["alagoas"] },
  { uf: "AM", mteCode: "46004", capital: ["manaus"],                         state: ["amazonas"] },
  { uf: "AP", mteCode: "46030", capital: ["macapa", "macapá"],               state: ["amapa", "amapá"] },
  { uf: "BA", mteCode: "46005", capital: ["salvador"],                       state: ["bahia"] },
  { uf: "CE", mteCode: "46006", capital: ["fortaleza"],                      state: ["ceara", "ceará"] },
  { uf: "DF", mteCode: "46007", capital: ["brasilia", "brasília"],           state: ["distrito federal"] },
  { uf: "ES", mteCode: "46008", capital: ["vitoria", "vitória"],             state: ["espirito santo", "espírito santo"] },
  { uf: "GO", mteCode: "46009", capital: ["goiania", "goiânia"],             state: ["goias", "goiás"] },
  { uf: "MA", mteCode: "46017", capital: ["sao luis", "são luís", "são luis"], state: ["maranhao", "maranhão"] },
  { uf: "MG", mteCode: "46013", capital: ["belo horizonte"],                 state: ["minas gerais"] },
  { uf: "MS", mteCode: "46028", capital: ["campo grande"],                   state: ["mato grosso do sul"] },
  { uf: "MT", mteCode: "46027", capital: ["cuiaba", "cuiabá"],               state: ["mato grosso"] },
  { uf: "PA", mteCode: "46016", capital: ["belem", "belém"],                 state: ["para", "pará"] },
  { uf: "PB", mteCode: "46018", capital: ["joao pessoa", "joão pessoa"],     state: ["paraiba", "paraíba"] },
  { uf: "PE", mteCode: "46014", capital: ["recife"],                         state: ["pernambuco"] },
  { uf: "PI", mteCode: "46023", capital: ["teresina"],                       state: ["piaui", "piauí"] },
  { uf: "PR", mteCode: "46011", capital: ["curitiba"],                       state: ["parana", "paraná"] },
  { uf: "RJ", mteCode: "46012", capital: ["rio de janeiro"],                 state: ["rio de janeiro"] },
  { uf: "RN", mteCode: "46019", capital: ["natal"],                          state: ["rio grande do norte"] },
  { uf: "RO", mteCode: "46024", capital: ["porto velho"],                    state: ["rondonia", "rondônia"] },
  { uf: "RR", mteCode: "46025", capital: ["boa vista"],                      state: ["roraima"] },
  { uf: "RS", mteCode: "46015", capital: ["porto alegre"],                   state: ["rio grande do sul"] },
  { uf: "SC", mteCode: "46020", capital: ["florianopolis", "florianópolis"], state: ["santa catarina"] },
  { uf: "SE", mteCode: "46021", capital: ["aracaju"],                        state: ["sergipe"] },
  { uf: "SP", mteCode: "46010", capital: ["sao paulo", "são paulo"],         state: ["sao paulo", "são paulo"] },
  { uf: "TO", mteCode: "46026", capital: ["palmas"],                         state: ["tocantins"] },
];

// ─── Inicialização das tabelas ────────────────────────────────────────────────
export let srteLinkingTablesReady = false;

export async function ensureSrteLinkingTables(): Promise<void> {
  if (srteLinkingTablesReady) return;

  try { await pool.query(`CREATE EXTENSION IF NOT EXISTS unaccent`); } catch (_) {}

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_acordao (
        uf             VARCHAR(5)   NOT NULL,
        acordao_key    VARCHAR(255) NOT NULL,
        motivo_vinculo VARCHAR(50)  DEFAULT 'TEXTO',
        criado_em      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, acordao_key)
      )
    `);
    await pool.query(`ALTER TABLE srte_acordao ADD COLUMN IF NOT EXISTS motivo_vinculo VARCHAR(50) DEFAULT 'TEXTO'`);
    await pool.query(`ALTER TABLE srte_acordao ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
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
    await pool.query(`ALTER TABLE srte_comunicacao ADD COLUMN IF NOT EXISTS motivo_vinculo VARCHAR(50) DEFAULT 'DESTINATARIO'`);
    await pool.query(`ALTER TABLE srte_comunicacao ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_comunicacao_uf ON srte_comunicacao(uf)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_tce (
        uf             VARCHAR(5)   NOT NULL,
        tce_id         VARCHAR(255) NOT NULL,
        motivo_vinculo VARCHAR(50)  DEFAULT 'TEXTO',
        criado_em      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, tce_id)
      )
    `);
    await pool.query(`ALTER TABLE srte_tce ADD COLUMN IF NOT EXISTS motivo_vinculo VARCHAR(50) DEFAULT 'TEXTO'`);
    await pool.query(`ALTER TABLE srte_tce ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_tce_uf ON srte_tce(uf)`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS srte_cgu (
        uf             VARCHAR(5)   NOT NULL,
        cgu_id         VARCHAR(255) NOT NULL,
        motivo_vinculo VARCHAR(50)  DEFAULT 'UNIDADE',
        criado_em      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (uf, cgu_id)
      )
    `);
    await pool.query(`ALTER TABLE srte_cgu ADD COLUMN IF NOT EXISTS motivo_vinculo VARCHAR(50) DEFAULT 'UNIDADE'`);
    await pool.query(`ALTER TABLE srte_cgu ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_srte_cgu_uf ON srte_cgu(uf)`);

    await pool.query(`DROP VIEW IF EXISTS vw_srte_dashboard_metrics`);
    await pool.query(`
      CREATE VIEW vw_srte_dashboard_metrics AS
      SELECT
        s.uf,
        COUNT(DISTINCT sa.acordao_key)      AS demandas_tcu,
        COUNT(DISTINCT sc.comunicacao_key)  AS demandas_comunicacoes,
        COUNT(DISTINCT st.tce_id)           AS demandas_tces,
        COUNT(DISTINCT sg.cgu_id)           AS demandas_cgu
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
  }
}

// ─── Helpers de matching ──────────────────────────────────────────────────────
function buildLikeOrClause(field: string, patterns: string[], params: any[], startIdx: number): string {
  const clauses = patterns.map((p, i) => {
    params.push(p);
    return `${field} LIKE $${startIdx + i}`;
  });
  return `(${clauses.join(" OR ")})`;
}

function buildUfRegexClause(field: string, uf: string, params: any[], startIdx: number): string {
  params.push(`srte[^a-zA-Z0-9]?${uf}`);
  return `${field} ~* $${startIdx}`;
}

// ─── Funções de vinculação por tipo ──────────────────────────────────────────
async function vincularAcordaos(uf: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_acordao WHERE uf = $1`, [uf]);
  const allText = `(titulo || ' ' || COALESCE(interessados,'') || ' ' || COALESCE(assunto,'') || ' ' || COALESCE(sumario,'') || ' ' || COALESCE(decisao,''))`;
  const lowerText = `LOWER(${allText})`;

  let p1: any[] = [uf];
  await pool.query(`
    INSERT INTO srte_acordao (uf, acordao_key, motivo_vinculo)
    SELECT $1, key, 'UF_PATTERN'
    FROM tcu_acordaos WHERE ${buildUfRegexClause(allText, uf, p1, 2)}
    ON CONFLICT (uf, acordao_key) DO NOTHING
  `, p1);

  const ctxPatterns = ['%srte%', '%superintend%', '%gerencia regional%', '%gerência regional%'];
  const locPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];
  for (const loc of locPatterns) {
    let p2: any[] = [uf, loc];
    const ctx = buildLikeOrClause(lowerText, ctxPatterns, p2, 3);
    await pool.query(`
      INSERT INTO srte_acordao (uf, acordao_key, motivo_vinculo)
      SELECT $1, key, 'LOCALIZACAO' FROM tcu_acordaos
      WHERE ${lowerText} LIKE $2 AND ${ctx}
      ON CONFLICT (uf, acordao_key) DO NOTHING
    `, p2);
  }
  const r = await pool.query(`SELECT COUNT(*) FROM srte_acordao WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

async function vincularComunicacoes(uf: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_comunicacao WHERE uf = $1`, [uf]);
  const destText = `(COALESCE(destinatario,'') || ' ' || COALESCE(comunicacao,''))`;
  const lowerDest = `LOWER(COALESCE(destinatario,'') || ' ' || COALESCE(comunicacao,'') || ' ' || COALESCE(contato,'') || ' ' || COALESCE(processo,''))`;

  let p1: any[] = [uf];
  await pool.query(`
    INSERT INTO srte_comunicacao (uf, comunicacao_key, motivo_vinculo)
    SELECT $1, key, 'DESTINATARIO_UF' FROM tcu_comunicacoes
    WHERE ${buildUfRegexClause(destText, uf, p1, 2)}
    ON CONFLICT (uf, comunicacao_key) DO NOTHING
  `, p1);

  const locPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];
  for (const loc of locPatterns) {
    await pool.query(`
      INSERT INTO srte_comunicacao (uf, comunicacao_key, motivo_vinculo)
      SELECT $1, key, 'LOCALIZACAO' FROM tcu_comunicacoes
      WHERE ${lowerDest} LIKE $2
      ON CONFLICT (uf, comunicacao_key) DO NOTHING
    `, [uf, loc]);
  }
  const r = await pool.query(`SELECT COUNT(*) FROM srte_comunicacao WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

async function vincularTces(uf: string, mteCode: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_tce WHERE uf = $1`, [uf]);

  await pool.query(`
    INSERT INTO srte_tce (uf, tce_id, motivo_vinculo)
    SELECT $1, id, 'CODIGO_MTE' FROM tcu_tce
    WHERE REGEXP_REPLACE(COALESCE(processo_administrativo,''), '[^0-9]', '', 'g') LIKE $2
    ON CONFLICT (uf, tce_id) DO NOTHING
  `, [uf, `${mteCode}%`]);

  const allText = `(COALESCE(numero_ano_tce,'') || ' ' || COALESCE(processo_administrativo,'') || ' ' || COALESCE(motivo_instauracao,'') || ' ' || COALESCE(submotivo_instauracao,'') || ' ' || COALESCE(ultimo_posicionamento,''))`;
  let p2: any[] = [uf];
  await pool.query(`
    INSERT INTO srte_tce (uf, tce_id, motivo_vinculo)
    SELECT $1, id, 'UF_PATTERN' FROM tcu_tce
    WHERE ${buildUfRegexClause(allText, uf, p2, 2)}
    ON CONFLICT (uf, tce_id) DO NOTHING
  `, p2);

  const motivoText = `LOWER(COALESCE(motivo_instauracao,'') || ' ' || COALESCE(submotivo_instauracao,'') || ' ' || COALESCE(ultimo_posicionamento,''))`;
  const ctxPatterns = ['%srte%', '%superintend%', '%ministerio do trabalho%', '%ministério do trabalho%'];
  const locPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];
  for (const loc of locPatterns) {
    let p3: any[] = [uf, loc];
    const ctx = buildLikeOrClause(motivoText, ctxPatterns, p3, 3);
    await pool.query(`
      INSERT INTO srte_tce (uf, tce_id, motivo_vinculo)
      SELECT $1, id, 'LOCALIZACAO' FROM tcu_tce
      WHERE ${motivoText} LIKE $2 AND ${ctx}
      ON CONFLICT (uf, tce_id) DO NOTHING
    `, p3);
  }
  const r = await pool.query(`SELECT COUNT(*) FROM srte_tce WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}

async function vincularCgu(uf: string, capitals: string[], states: string[]): Promise<number> {
  await pool.query(`DELETE FROM srte_cgu WHERE uf = $1`, [uf]);

  // ── Texto completo: todos os campos de conteúdo concatenados ─────────────
  const fullText = `(
    COALESCE(unidade_auditada,'')         || ' ' ||
    COALESCE(unidades_auditoria,'')       || ' ' ||
    COALESCE(titulo_tarefa,'')            || ' ' ||
    COALESCE(texto_monitoramento,'')      || ' ' ||
    COALESCE(providencia,'')              || ' ' ||
    COALESCE(texto_ultima_manifestacao,'')|| ' ' ||
    COALESCE(texto_ultimo_posicionamento,'')
  )`;
  const lowerFull = `LOWER(${fullText})`;

  // ── NÍVEL 1: Match direto pelo campo 'estado' (ex: "SP", "São Paulo") ────
  await pool.query(`
    INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
    SELECT $1, id_tarefa, 'ESTADO'
    FROM cgu_demands
    WHERE LOWER(COALESCE(estado,'')) = $2
       OR UPPER(COALESCE(estado,'')) = $3
    ON CONFLICT (uf, cgu_id) DO NOTHING
  `, [uf, uf.toLowerCase(), uf]);

  // ── NÍVEL 2: Menção explícita a SRTE/Superintendência no texto completo ──
  // Ex: "SRTE/SP", "Superintendência Regional do Trabalho em São Paulo"
  const srteTerms = [
    `%srte${uf.toLowerCase()}%`,
    `%srte/${uf.toLowerCase()}%`,
    `%srte-${uf.toLowerCase()}%`,
    `%superintend%trabalho%`,
    `%superintend%emprego%`,
    `%gerencia regional%trabalho%`,
    `%gerência regional%trabalho%`,
  ];
  for (const term of srteTerms) {
    await pool.query(`
      INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
      SELECT $1, id_tarefa, 'SRTE_EXPLICITO'
      FROM cgu_demands
      WHERE ${lowerFull} LIKE $2
      ON CONFLICT (uf, cgu_id) DO NOTHING
    `, [uf, term]);
  }

  // ── NÍVEL 3: Regex UF em unidade_auditada ou unidades_auditoria ──────────
  const unidadeText = `(COALESCE(unidade_auditada,'') || ' ' || COALESCE(unidades_auditoria,''))`;
  let p3: any[] = [uf];
  await pool.query(`
    INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
    SELECT $1, id_tarefa, 'UNIDADE_UF'
    FROM cgu_demands
    WHERE ${buildUfRegexClause(unidadeText, uf, p3, 2)}
    ON CONFLICT (uf, cgu_id) DO NOTHING
  `, p3);

  // ── NÍVEL 4: Nome da capital/estado + contexto de auditoria/trabalho ─────
  // Combinação: localização E termos que indicam relação com trabalho/MTE
  const ctxPatterns = [
    '%ministerio do trabalho%', '%ministério do trabalho%',
    '%mte%', '%srte%', '%superintend%', '%fiscal%trabalho%',
    '%auditoria%fiscal%', '%inspecao%trabalho%', '%inspeção%trabalho%',
    '%caged%', '%rais%', '%sine%', '%fgts%',
  ];
  const locPatterns = [...capitals.map(c => `%${c}%`), ...states.map(s => `%${s}%`)];
  for (const loc of locPatterns) {
    let p4: any[] = [uf, loc];
    const ctx = buildLikeOrClause(lowerFull, ctxPatterns, p4, 3);
    await pool.query(`
      INSERT INTO srte_cgu (uf, cgu_id, motivo_vinculo)
      SELECT $1, id_tarefa, 'LOCALIZACAO_CONTEXTO'
      FROM cgu_demands
      WHERE ${lowerFull} LIKE $2 AND ${ctx}
      ON CONFLICT (uf, cgu_id) DO NOTHING
    `, p4);
  }

  const r = await pool.query(`SELECT COUNT(*) FROM srte_cgu WHERE uf = $1`, [uf]);
  return parseInt(r.rows[0].count);
}


// ─── Runner interno do job ────────────────────────────────────────────────────
async function runRecalcJob(): Promise<void> {
  console.log(`[SRTE-RECALC] ═══ Iniciando recálculo (fonte: ${recalcJobStatus.source}) ═══`);
  console.time("[SRTE-RECALC] Tempo total");

  for (const srte of SRTE_LOOKUP) {
    const { uf, mteCode, capital, state } = srte;
    try {
      const [a, c, t, g] = await Promise.all([
        vincularAcordaos(uf, capital, state),
        vincularComunicacoes(uf, capital, state),
        vincularTces(uf, mteCode, capital, state),
        vincularCgu(uf, capital, state),
      ]);

      const novoStatus = a >= 3 || (a + g) >= 8 ? "Crítico"
                       : a >= 1 || (a + g) >= 4 ? "Atenção"
                       : "Regular";

      await pool.query(
        `UPDATE superintendencias SET status_geral = $1 WHERE uf = $2`,
        [novoStatus, uf]
      );

      recalcJobStatus.progress.push({ uf, acordaos: a, comunicacoes: c, tces: t, cgu: g });
      recalcJobStatus.processedUfs++;
      console.log(`[SRTE-RECALC] ${uf}: acórdãos=${a}, comunicações=${c}, TCEs=${t}, CGU=${g}, status=${novoStatus}`);
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
}

// ─── Função pública: dispara recálculo se não estiver rodando ─────────────────
export async function triggerSrteRecalcIfIdle(source: string = "MANUAL"): Promise<void> {
  if (recalcJobStatus.running) {
    console.log(`[SRTE-RECALC] Já em andamento. Trigger '${source}' ignorado.`);
    return;
  }

  await ensureSrteLinkingTables();
  if (!srteLinkingTablesReady) {
    console.warn(`[SRTE-RECALC] Tabelas não prontas. Trigger '${source}' cancelado.`);
    return;
  }

  recalcJobStatus = {
    running: true,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    source,
    progress: [],
    error: null,
    totalUfs: SRTE_LOOKUP.length,
    processedUfs: 0,
  };

  // Fire-and-forget — não bloqueia o caller
  runRecalcJob().catch(err => {
    console.error("[SRTE-RECALC] Erro crítico:", err);
    recalcJobStatus.running = false;
    recalcJobStatus.error = err.message;
    recalcJobStatus.finishedAt = new Date().toISOString();
  });
}
