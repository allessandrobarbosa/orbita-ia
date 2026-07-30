const { Client } = require('pg');

// UFs and Capitals
const UFS_DATA = [
  { uf: 'AC', capital: 'Rio Branco' },
  { uf: 'AL', capital: 'Maceió' },
  { uf: 'AP', capital: 'Macapá' },
  { uf: 'AM', capital: 'Manaus' },
  { uf: 'BA', capital: 'Salvador' },
  { uf: 'CE', capital: 'Fortaleza' },
  { uf: 'DF', capital: 'Brasília' },
  { uf: 'ES', capital: 'Vitória' },
  { uf: 'GO', capital: 'Goiânia' },
  { uf: 'MA', capital: 'São Luís' },
  { uf: 'MT', capital: 'Cuiabá' },
  { uf: 'MS', capital: 'Campo Grande' },
  { uf: 'MG', capital: 'Belo Horizonte' },
  { uf: 'PA', capital: 'Belém' },
  { uf: 'PB', capital: 'João Pessoa' },
  { uf: 'PR', capital: 'Curitiba' },
  { uf: 'PE', capital: 'Recife' },
  { uf: 'PI', capital: 'Teresina' },
  { uf: 'RJ', capital: 'Rio de Janeiro' },
  { uf: 'RN', capital: 'Natal' },
  { uf: 'RS', capital: 'Porto Alegre' },
  { uf: 'RO', capital: 'Porto Velho' },
  { uf: 'RR', capital: 'Boa Vista' },
  { uf: 'SC', capital: 'Florianópolis' },
  { uf: 'SP', capital: 'São Paulo' },
  { uf: 'SE', capital: 'Aracaju' },
  { uf: 'TO', capital: 'Palmas' }
];

const getUfStateName = (uf) => {
  const ufNames = {
    AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
    DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
    MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
    PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
    SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins"
  };
  return ufNames[uf] || "";
};

const getMteCodeByUf = (uf) => {
  const codes = {
    AC: "46002", AL: "46003", AM: "46004", BA: "46005", CE: "46006",
    DF: "46007", ES: "46008", GO: "46009", MA: "46017", MT: "46027",
    MS: "46028", MG: "46013", PA: "46016", PB: "46018", PR: "46011",
    PE: "46014", PI: "46023", RN: "46019", RS: "46015", RJ: "46012",
    RO: "46024", RR: "46025", SC: "46020", SP: "46010", SE: "46021",
    TO: "46026", AP: "46030"
  };
  return codes[uf] || "XXXXX";
};

// ------------------------------------------------------------------
// Matchers (from SrteModule.tsx)
// ------------------------------------------------------------------
const isAcordaoRelated = (uf, capital, ac) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const textToSearch = ac._normalizedText || "";
  
  const hasUfPattern = textToSearch.includes(`srte-${ufLower}`) || 
                       textToSearch.includes(`srte/${ufLower}`) ||
                       textToSearch.includes(`srt-${ufLower}`) ||
                       textToSearch.includes(`srt/${ufLower}`);
                       
  const hasSuperintendencia = textToSearch.includes("superintendencia regional do trabalho") || 
                              textToSearch.includes("superintendencia do trabalho") || 
                              textToSearch.includes("gerencia regional do trabalho") ||
                              textToSearch.includes("srte");
                              
  const mentionsLocation = textToSearch.includes(capitalLower) || 
                           textToSearch.includes(`no estado d${ufLower === 'mg' || ufLower === 'go' ? 'e' : 'o'} ${ufLower}`) ||
                           textToSearch.includes(`srt-${ufLower}`) ||
                           textToSearch.includes(`srte-${ufLower}`);
                           
  return hasUfPattern || (hasSuperintendencia && mentionsLocation);
};

const isComunicacaoRelated = (uf, capital, com) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const stateNameLower = getUfStateName(uf).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedCapital = capitalLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedText = com._normalizedText || "";

  const hasUfPattern = normalizedText.includes(`srte-${ufLower}`) || 
                       normalizedText.includes(`srte/${ufLower}`) ||
                       normalizedText.includes(`srt-${ufLower}`) ||
                       normalizedText.includes(`srt/${ufLower}`);
                       
  const mentionsSuper = normalizedText.includes("superintendencia regional do trabalho") || 
                        normalizedText.includes("superintendencia do trabalho") ||
                        normalizedText.includes("gerencia regional do trabalho") ||
                        normalizedText.includes("srte");
                        
  const mentionsLocation = normalizedText.includes(normalizedCapital) || 
                            normalizedText.includes(stateNameLower) ||
                            normalizedText.includes(`no estado d${ufLower === 'mg' || ufLower === 'go' ? 'e' : 'o'} ${ufLower}`);
                            
  return hasUfPattern || (mentionsSuper && mentionsLocation);
};

const isTceRelated = (uf, capital, tce) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const stateNameLower = getUfStateName(uf).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedCapital = capitalLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mteCode = getMteCodeByUf(uf);
  const normalizedText = tce._normalizedText || "";

  const hasUfPattern = normalizedText.includes(`srte-${ufLower}`) || 
                       normalizedText.includes(`srte/${ufLower}`) ||
                       normalizedText.includes(`srt-${ufLower}`) ||
                       normalizedText.includes(`srt/${ufLower}`) ||
                       normalizedText.includes(` ${ufLower} `) ||
                       normalizedText.includes(`/${ufLower}`);

  const matchesMteCode = tce.PROCESSO_ADMINISTRATIVO && tce.PROCESSO_ADMINISTRATIVO.replace(/\D/g, "").startsWith(mteCode);
                       
  const mentionsSuper = normalizedText.includes("superintendencia regional do trabalho") || 
                        normalizedText.includes("superintendencia do trabalho") ||
                        normalizedText.includes("gerencia regional do trabalho") ||
                        normalizedText.includes("srte");
                        
  const mentionsLocation = normalizedText.includes(normalizedCapital) || 
                            normalizedText.includes(stateNameLower);
                            
  return hasUfPattern || matchesMteCode || (mentionsSuper && mentionsLocation);
};

const isCguRelated = (uf, capital, cgu) => {
  const ufLower = uf.toLowerCase();
  const capitalLower = capital.toLowerCase();
  const stateNameLower = getUfStateName(uf).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedCapital = capitalLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedText = cgu._normalizedText || "";

  const hasUfPattern = normalizedText.includes(`srte-${ufLower}`) || 
                       normalizedText.includes(`srte/${ufLower}`) ||
                       normalizedText.includes(`srt-${ufLower}`) ||
                       normalizedText.includes(`srt/${ufLower}`) ||
                       normalizedText.includes(` ${ufLower} `) ||
                       normalizedText.includes(`/${ufLower}`);
                       
  const mentionsSuper = normalizedText.includes("superintendencia regional do trabalho") || 
                        normalizedText.includes("superintendencia do trabalho") ||
                        normalizedText.includes("gerencia regional do trabalho") ||
                        normalizedText.includes("srte");
                        
  const mentionsLocation = normalizedText.includes(normalizedCapital) || 
                            normalizedText.includes(stateNameLower);
                            
  return hasUfPattern || (mentionsSuper && mentionsLocation);
};

// ------------------------------------------------------------------
// Main migration script
// ------------------------------------------------------------------
async function run() {
  const connectionString = process.env.GOVHUB_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log("Connected to PostgreSQL.");

    // 1. Create junction tables
    console.log("Creating junction tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS srte_acordao (
        uf VARCHAR(2) NOT NULL,
        acordao_key VARCHAR(255) NOT NULL,
        PRIMARY KEY (uf, acordao_key)
      );
      CREATE TABLE IF NOT EXISTS srte_comunicacao (
        uf VARCHAR(2) NOT NULL,
        comunicacao_key VARCHAR(255) NOT NULL,
        PRIMARY KEY (uf, comunicacao_key)
      );
      CREATE TABLE IF NOT EXISTS srte_tce (
        uf VARCHAR(2) NOT NULL,
        tce_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (uf, tce_id)
      );
      CREATE TABLE IF NOT EXISTS srte_cgu (
        uf VARCHAR(2) NOT NULL,
        cgu_id VARCHAR(255) NOT NULL,
        PRIMARY KEY (uf, cgu_id)
      );
    `);
    
    // Clean old data for idempotency
    await client.query(`TRUNCATE TABLE srte_acordao; TRUNCATE TABLE srte_comunicacao; TRUNCATE TABLE srte_tce; TRUNCATE TABLE srte_cgu;`);

    // 2. Fetch and normalize Acórdãos
    console.log("Processing Acórdãos...");
    const resAc = await client.query(`SELECT key, titulo, interessados, assunto, sumario, acordao, decisao FROM tcu_acordaos`);
    const acordaos = resAc.rows.map(ac => ({
      key: ac.key,
      _normalizedText: `${ac.titulo || ""} ${ac.interessados || ""} ${ac.assunto || ""} ${ac.sumario || ""} ${ac.acordao || ""} ${ac.decisao || ""}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }));

    // 3. Fetch and normalize Comunicações
    // Note: the table seems to be 'comunicacoes_demands' or 'tcu_comunicacoes'. Looking at check_pg_tables output, we'll try tcu_comunicacoes first.
    console.log("Processing Comunicações...");
    let resCom;
    try {
      resCom = await client.query(`SELECT key, destinatario, contato, comunicacao FROM tcu_comunicacoes`);
    } catch(e) {
      resCom = await client.query(`SELECT key, destinatario, contato, comunicacao FROM comunicacoes_demands`);
    }
    const comunicacoes = resCom.rows.map(com => ({
      key: com.key,
      _normalizedText: `${com.destinatario || ""} ${com.contato || ""} ${com.comunicacao || ""}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }));

    // 4. Fetch and normalize TCEs
    console.log("Processing TCEs...");
    const resTce = await client.query(`SELECT id, numero_ano_tce, processo_administrativo, motivo_instauracao, submotivo_instauracao, ultimo_posicionamento FROM tcu_tce`);
    const tces = resTce.rows.map(tce => ({
      id: tce.id || tce.numero_ano_tce,
      PROCESSO_ADMINISTRATIVO: tce.processo_administrativo, // Needed for isTceRelated
      _normalizedText: `${tce.numero_ano_tce || ""} ${tce.processo_administrativo || ""} ${tce.motivo_instauracao || ""} ${tce.submotivo_instauracao || ""} ${tce.ultimo_posicionamento || ""}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }));

    // 5. Fetch and normalize CGU Demands
    console.log("Processing CGU Demands...");
    const resCgu = await client.query(`SELECT id_tarefa, titulo_tarefa, unidade_auditada, texto_monitoramento, providencia FROM cgu_demands`);
    const cguDemands = resCgu.rows.map(cgu => ({
      id_tarefa: cgu.id_tarefa,
      _normalizedText: `${cgu.titulo_tarefa || ""} ${cgu.unidade_auditada || ""} ${cgu.texto_monitoramento || ""} ${cgu.providencia || ""}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }));

    // 6. Match and Insert
    console.log("Running matching algorithms and inserting relations...");
    for (const srte of UFS_DATA) {
      // Acordaos
      const relatedAc = acordaos.filter(ac => isAcordaoRelated(srte.uf, srte.capital, ac));
      for (const ac of relatedAc) {
        await client.query(`INSERT INTO srte_acordao (uf, acordao_key) VALUES ($1, $2)`, [srte.uf, ac.key]);
      }
      
      // Comunicacoes
      const relatedCom = comunicacoes.filter(com => isComunicacaoRelated(srte.uf, srte.capital, com));
      for (const com of relatedCom) {
        await client.query(`INSERT INTO srte_comunicacao (uf, comunicacao_key) VALUES ($1, $2)`, [srte.uf, com.key]);
      }

      // TCEs
      const relatedTce = tces.filter(tce => isTceRelated(srte.uf, srte.capital, tce));
      for (const tce of relatedTce) {
        await client.query(`INSERT INTO srte_tce (uf, tce_id) VALUES ($1, $2)`, [srte.uf, tce.id]);
      }

      // CGU
      const relatedCgu = cguDemands.filter(cgu => isCguRelated(srte.uf, srte.capital, cgu));
      for (const cgu of relatedCgu) {
        await client.query(`INSERT INTO srte_cgu (uf, cgu_id) VALUES ($1, $2)`, [srte.uf, cgu.id_tarefa]);
      }
    }
    
    console.log("Matching finished.");

    // 7. Create View
    console.log("Creating View vw_srte_dashboard_metrics...");
    await client.query(`
      CREATE OR REPLACE VIEW vw_srte_dashboard_metrics AS
      SELECT 
        uf.uf,
        (SELECT COUNT(*) FROM srte_acordao sa WHERE sa.uf = uf.uf) as demandas_tcu,
        (SELECT COUNT(*) FROM srte_cgu sc WHERE sc.uf = uf.uf) as demandas_cgu,
        (SELECT COUNT(*) FROM srte_comunicacao scom WHERE scom.uf = uf.uf) as demandas_comunicacoes,
        (SELECT COUNT(*) FROM srte_tce stce WHERE stce.uf = uf.uf) as demandas_tces
      FROM (
        SELECT 'AC' as uf UNION ALL SELECT 'AL' UNION ALL SELECT 'AP' UNION ALL SELECT 'AM' UNION ALL 
        SELECT 'BA' UNION ALL SELECT 'CE' UNION ALL SELECT 'DF' UNION ALL SELECT 'ES' UNION ALL 
        SELECT 'GO' UNION ALL SELECT 'MA' UNION ALL SELECT 'MT' UNION ALL SELECT 'MS' UNION ALL 
        SELECT 'MG' UNION ALL SELECT 'PA' UNION ALL SELECT 'PB' UNION ALL SELECT 'PR' UNION ALL 
        SELECT 'PE' UNION ALL SELECT 'PI' UNION ALL SELECT 'RJ' UNION ALL SELECT 'RN' UNION ALL 
        SELECT 'RS' UNION ALL SELECT 'RO' UNION ALL SELECT 'RR' UNION ALL SELECT 'SC' UNION ALL 
        SELECT 'SP' UNION ALL SELECT 'SE' UNION ALL SELECT 'TO'
      ) uf;
    `);

    console.log("View created successfully.");
    console.log("Migration completed.");

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

run();
