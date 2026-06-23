/**
 * Script de Migração e Sincronização JSON -> SQLite para o Sistema ÓRBITA-AECI
 * Utiliza o módulo nativo C++ de alto desempenho 'node:sqlite' integrado ao Node 22+.
 * Isso evita totalmente falhas de GLIBC ou compilação C++ externa no container.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Caminhos dos arquivos
const DATA_DIR = path.join(__dirname);
const SCHEMA_PATH = path.join(DATA_DIR, 'tcu_schema.sql');
const JSON_DB_PATH = path.join(DATA_DIR, 'orbita_db.json');
const SQLITE_DB_PATH = path.join(DATA_DIR, 'orbita_db.sqlite');

console.log('=== INICIANDO MIGRAÇÃO COM ENGINE NATIVO NODE:SQLITE ===');
console.log(`Diretório de dados: ${DATA_DIR}`);

// 1. Verificar arquivos necessários
if (!fs.existsSync(SCHEMA_PATH)) {
  console.error(`Erro: Arquivo do schema SQL não localizado em: ${SCHEMA_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(JSON_DB_PATH)) {
  console.error(`Erro: Arquivo JSON de origem não localizado em: ${JSON_DB_PATH}`);
  process.exit(1);
}

// Ler dados JSON
let jsonData;
try {
  const rawData = fs.readFileSync(JSON_DB_PATH, 'utf-8');
  jsonData = JSON.parse(rawData);
  console.log('✓ Arquivo JSON de origem lido com sucesso.');
} catch (e) {
  console.error(`Erro ao decodificar o JSON: ${e.message}`);
  process.exit(1);
}

// Remover banco antigo se houver
if (fs.existsSync(SQLITE_DB_PATH)) {
  try {
    fs.unlinkSync(SQLITE_DB_PATH);
    console.log('✓ Banco de dados SQLite preexistente removido para re-inicialização limpa.');
  } catch (e) {
    console.warn(`Aviso: Não foi possível deletar o arquivo SQLite antigo: ${e.message}`);
  }
}

// 2. Conectar e criar o Banco de Dados com 'node:sqlite'
let db;
try {
  db = new DatabaseSync(SQLITE_DB_PATH);
  console.log('✓ Conectado com sucesso ao banco relacional SQLite nativo.');
} catch (e) {
  console.error(`Falha ao carregar DatabaseSync (Sua versão do Node.js pode não suportar node:sqlite nativamente): ${e.message}`);
  process.exit(1);
}

// Configurar chaves estrangeiras
db.exec('PRAGMA foreign_keys = ON;');

// Aplicar o schema DDL
try {
  const ddlContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(ddlContent);
  console.log('✓ Estrutura de tabelas e índices criada com êxito (Schema Aplicado).');
  console.log('✓ Motor de Busca Otimizada por Texto Completo (FTS5) ativado e sincronizado.');
} catch (e) {
  console.error(`Erro ao aplicar o schema DDL: ${e.message}`);
  process.exit(1);
}

// Iniciar a migração
try {
  db.exec('BEGIN TRANSACTION;');
  console.log('\n--- Gravação de Dados nas Tabelas Estruturadas ---');

  // ACÓRDÃOS
  if (jsonData.acordaos && Array.isArray(jsonData.acordaos)) {
    const insertAcordao = db.prepare(`
      INSERT INTO acordaos (
        key, titulo, numero_acordao, ano_acordao, numero_ata, colegiado, data_sessao,
        situacao_atual, numero_processo, acordao_relacionado, tipo_processo, interessados,
        entidade, assunto, sumario, acordao_integra, status_monitoramento,
        responsavel_interno, prazo_limite, observacoes, ultima_atualizacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jsonData.acordaos.forEach(a => {
      insertAcordao.run(
        a.KEY || `AC-${a.NUMACORDAO}-${a.ANOACORDAO}`,
        a.TITULO || '',
        a.NUMACORDAO || 0,
        a.ANOACORDAO || 2026,
        a.NUMATA || '',
        a.COLEGIADO || '',
        a.DATASESSAO || '',
        a.SITUACAO || '',
        a.PROC || '',
        a.ACORDAOSRELACIONADOS || '',
        a.TIPOPROCESSO || '',
        a.INTERESSADOS || '',
        a.ENTIDADE || '',
        a.ASSUNTO || '',
        a.SUMARIO || '',
        a.ACORDAO || '',
        a.STATUS_MONITORAMENTO || 'Pendente',
        a.RESPONSAVEL_INTERNO || '',
        a.PRAZO_LIMIT_MTE || a.PRAZO_LIMITE || '',
        a.OBSERVACOES || '',
        a.ULTIMA_ATUALIZACAO || ''
      );
    });
    console.log(`✓ Acórdãos Migrados: ${jsonData.acordaos.length}`);
  }

  // ROL DE RESPONSÁVEIS
  if (jsonData.rolResponsaveis && Array.isArray(jsonData.rolResponsaveis)) {
    const insertRol = db.prepare(`
      INSERT INTO rol_responsaveis (
        id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jsonData.rolResponsaveis.forEach(r => {
      insertRol.run(
        r.id,
        r.nome || '',
        r.cpf || '',
        r.cargo || '',
        r.unidade || '',
        r.inicioExercicio || '',
        r.fimExercicio || '',
        r.atoNomeacao || '',
        r.status || 'Vigente',
        r.observacoes || ''
      );
    });
    console.log(`✓ Membros do Rol de Responsáveis Migrados: ${jsonData.rolResponsaveis.length}`);
  }

  // COMUNICAÇÕES (OFÍCIOS)
  if (jsonData.comunicacoes && Array.isArray(jsonData.comunicacoes)) {
    const insertCom = db.prepare(`
      INSERT INTO comunicacoes (
        key, comunicacao, destinatario, contato, unidade_emitente, processo, data_expedicao, data_resposta, ano, ultima_atualizacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jsonData.comunicacoes.forEach(c => {
      insertCom.run(
        c.KEY,
        c.COMUNICACAO || '',
        c.DESTINATARIO || '',
        c.CONTATO || '',
        c.UNIDADE_EMITENTE || '',
        c.PROCESSO || '',
        c.DATA_EXPEDICAO || '',
        c.DATA_RESPOSTA || '',
        c.ANO || 2026,
        c.ULTIMA_ATUALIZACAO || ''
      );
    });
    console.log(`✓ Ofícios de Comunicação Migrados: ${jsonData.comunicacoes.length}`);
  }

  // TCES
  if (jsonData.tces && Array.isArray(jsonData.tces)) {
    const insertTce = db.prepare(`
      INSERT INTO tces (
        id, numero_ano_tce, processo_administrativo, motivo_instauracao, submotivo_instauracao,
        debito_original, debito_atualizado, data_atualizacao_debito, ultimo_posicionamento,
        tc, estado_processo, situacao_processo, primeiro_julgamento, encerramento, ano, ultima_atualizacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jsonData.tces.forEach(t => {
      insertTce.run(
        t.id || t.NUMERO_ANO_TCE,
        t.NUMERO_ANO_TCE || '',
        t.PROCESSO_ADMINISTRATIVO || '',
        t.MOTIVO_INSTAURACAO || '',
        t.SUBMOTIVO_INSTAURACAO || '',
        t.DEBITO_ORIGINAL || '',
        t.DEBITO_ATUALIZADO || '',
        t.DATA_ATUALIZACAO_DEBITO || '',
        t.ULTIMO_POSICIONAMENTO || '',
        t.TC || '',
        t.ESTADO_PROCESSO || '',
        t.SITUACAO_PROCESSO || '',
        t.PRIMEIRO_JULGAMENTO || '',
        t.ENCERRAMENTO || '',
        t.ANO || 2026,
        t.ULTIMA_ATUALIZACAO || ''
      );
    });
    console.log(`✓ Tomadas de Contas Especiais (TCE) Migradas: ${jsonData.tces.length}`);
  }

  // MAPEAMENTOS TCE - ACORDAOS
  if (jsonData.tceAcordaoMappings && Array.isArray(jsonData.tceAcordaoMappings)) {
    const insertMap = db.prepare(`
      INSERT OR IGNORE INTO tce_acordao_mappings (
        numero_ano_tce, acordao_ref
      ) VALUES (?, ?)
    `);

    jsonData.tceAcordaoMappings.forEach(m => {
      insertMap.run(m.NUMERO_ANO_TCE, m.ACORDAO_REF);
    });
    console.log(`✓ Mapeamentos TCE-Acórdão Migrados: ${jsonData.tceAcordaoMappings.length}`);
  }

  // COMISSÃO DE ÉTICA
  if (jsonData.comissaoEtica && Array.isArray(jsonData.comissaoEtica)) {
    const insertEtica = db.prepare(`
      INSERT INTO comissao_etica (
        id, protocolo, data_classificacao, descricao, envolvidos, orgao_origem, relator, status, recomendacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jsonData.comissaoEtica.forEach(e => {
      insertEtica.run(
        e.id,
        e.protocolo || '',
        e.dataClassificacao || '',
        e.descricao || '',
        e.envolvidos || '',
        e.orgaoOrigem || '',
        e.relator || '',
        e.status || 'Triagem',
        e.recomendacoes || ''
      );
    });
    console.log(`✓ Demandas da Comissão de Ética Migradas: ${jsonData.comissaoEtica.length}`);
  }

  // SUPERINTENDÊNCIAS REGIONAIS
  if (jsonData.superintendencias && Array.isArray(jsonData.superintendencias)) {
    const insertSupe = db.prepare(`
      INSERT INTO superintendencias (
        uf, capital, superintendente, cargo, endereco, contato, email, demandas_tcu, demandas_cgu, demandas_etica, status_geral
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    jsonData.superintendencias.forEach(s => {
      insertSupe.run(
        s.uf,
        s.capital || '',
        s.superintendente || '',
        s.cargo || '',
        s.endereco || '',
        s.contato || '',
        s.email || '',
        s.demandasTCU || 0,
        s.demandasCGU || 0,
        s.demandasEtica || 0,
        s.statusGeral || 'Regular'
      );
    });
    console.log(`✓ Superintendências Regionais Migradas: ${jsonData.superintendencias.length}`);
  }

  db.exec('COMMIT;');
  console.log('\n✓ TODAS AS TRANSAÇÕES FORAM GRAVADAS COM SEGURANÇA!');
  console.log('✓ Banco de dados relacional SQLite nativo gerado com sucesso: data/orbita_db.sqlite.');
  console.log('\n=== MIGRAÇÃO NATIVA FINALIZADA COM SUCESSO ===');
} catch (e) {
  db.exec('ROLLBACK;');
  console.error(`Erro crítico durante a transação de migração: ${e.message}`);
  process.exit(1);
}
