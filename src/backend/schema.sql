-- =========================================================================
-- ORBITA-AECI: PostgreSQL Schema
-- Criação das tabelas para módulos TCU e ROL de Responsáveis
-- =========================================================================

-- Extensão para UUID se necessário (opcional, mas recomendado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MÓDULO: TCU (Monitoramento de Acórdãos)
-- ==========================================

CREATE TABLE IF NOT EXISTS tcu_acordaos (
    key VARCHAR(255) PRIMARY KEY,
    titulo TEXT NOT NULL,
    num_acordao INTEGER,
    ano_acordao INTEGER,
    num_ata VARCHAR(255),
    colegiado VARCHAR(255),
    data_sessao VARCHAR(50),
    situacao VARCHAR(255),
    proc VARCHAR(255),
    acordaos_relacionados TEXT,
    tipo_processo VARCHAR(255),
    interessados TEXT,
    entidade TEXT,
    unidade_tecnica VARCHAR(255),
    relator VARCHAR(255),
    assunto TEXT,
    sumario TEXT,
    acordao TEXT,
    decisao TEXT,
    recomendacoes TEXT,
    determinacoes TEXT,
    recomendacoes_determinacoes_unificado TEXT,
    
    status_monitoramento VARCHAR(50) DEFAULT 'Pendente',
    responsavel_interno VARCHAR(255),
    prazo_limite VARCHAR(50),
    observacoes TEXT,
    ultima_atualizacao VARCHAR(50),
    
    ai_analysis_data JSONB
);

CREATE TABLE IF NOT EXISTS tcu_comunicacoes (
    key VARCHAR(255) PRIMARY KEY,
    comunicacao TEXT NOT NULL,
    destinatario TEXT,
    contato TEXT,
    unidade_emitente VARCHAR(255),
    processo VARCHAR(255),
    data_expedicao VARCHAR(50),
    data_resposta VARCHAR(50),
    ano INTEGER,
    carece_resposta BOOLEAN DEFAULT FALSE,
    prazo_dias VARCHAR(50),
    resposta_enviada_internamente BOOLEAN DEFAULT FALSE,
    unidade_executora VARCHAR(255),
    processo_sei VARCHAR(255),
    destinacao VARCHAR(255),
    ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tcu_tce (
    id VARCHAR(255) PRIMARY KEY,
    numero_ano_tce VARCHAR(255) NOT NULL,
    processo_administrativo VARCHAR(255),
    motivo_instauracao TEXT,
    submotivo_instauracao TEXT,
    debito_original VARCHAR(255),
    debito_atualizado VARCHAR(255),
    data_atualizacao_debito VARCHAR(50),
    ultimo_posicionamento TEXT,
    tc VARCHAR(255),
    estado_processo VARCHAR(255),
    situacao_processo VARCHAR(255),
    primeiro_julgamento VARCHAR(255),
    encerramento VARCHAR(255),
    numero_siafi VARCHAR(255),
    siafi_ressarcido BOOLEAN DEFAULT FALSE,
    ano INTEGER
);

CREATE TABLE IF NOT EXISTS tcu_tce_acordao_mapping (
    numero_ano_tce VARCHAR(255) NOT NULL,
    acordao_key VARCHAR(255) NOT NULL,
    PRIMARY KEY (numero_ano_tce, acordao_key)
);

-- Índices de Alta Performance (TCU)
CREATE INDEX IF NOT EXISTS idx_tcu_acordaos_num_ano ON tcu_acordaos(num_acordao, ano_acordao);
CREATE INDEX IF NOT EXISTS idx_tcu_acordaos_colegiado ON tcu_acordaos(colegiado);
CREATE INDEX IF NOT EXISTS idx_tcu_acordaos_status ON tcu_acordaos(status_monitoramento);
CREATE INDEX IF NOT EXISTS idx_tcu_comunicacoes_ano ON tcu_comunicacoes(ano);
CREATE INDEX IF NOT EXISTS idx_tcu_comunicacoes_proc ON tcu_comunicacoes(processo);
CREATE INDEX IF NOT EXISTS idx_tcu_tce_numero_ano ON tcu_tce(numero_ano_tce);

-- ==========================================
-- 2. MÓDULO: ROL (Rol de Responsáveis - IN 84/2020 TCU)
-- ==========================================

CREATE TABLE IF NOT EXISTS rol_unidades (
    id VARCHAR(255) PRIMARY KEY,
    nome TEXT NOT NULL,
    sigla VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS rol_dirigentes (
    id VARCHAR(255) PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf VARCHAR(50),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS rol_dirigentes_cargos (
    id VARCHAR(255) PRIMARY KEY,
    dirigente_id VARCHAR(255) REFERENCES rol_dirigentes(id) ON DELETE CASCADE,
    unidade_id VARCHAR(255) REFERENCES rol_unidades(id) ON DELETE CASCADE,
    cargo TEXT NOT NULL,
    tipo_vinculo VARCHAR(50) NOT NULL,
    inicio_exercicio VARCHAR(50) NOT NULL,
    fim_exercicio VARCHAR(50),
    ato_nomeacao TEXT,
    ato_exoneracao TEXT,
    status VARCHAR(50) DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS rol_dirigentes_eventos (
    id VARCHAR(255) PRIMARY KEY,
    dirigente_id VARCHAR(255) REFERENCES rol_dirigentes(id) ON DELETE CASCADE,
    cargo_id VARCHAR(255) REFERENCES rol_dirigentes_cargos(id) ON DELETE CASCADE,
    data_inicio VARCHAR(50) NOT NULL,
    data_fim VARCHAR(50) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    ato_autorizacao TEXT,
    substituto_id VARCHAR(255) REFERENCES rol_dirigentes(id) ON DELETE SET NULL
);

-- Tabela Legada/Simples para retrocompatibilidade se necessário
CREATE TABLE IF NOT EXISTS rol_responsaveis_legado (
    id VARCHAR(255) PRIMARY KEY,
    nome TEXT,
    cpf VARCHAR(50),
    cargo TEXT,
    unidade TEXT,
    inicio_exercicio VARCHAR(50),
    fim_exercicio VARCHAR(50),
    ato_nomeacao TEXT,
    status VARCHAR(50),
    observacoes TEXT
);

-- MÓDULO CGU
CREATE TABLE IF NOT EXISTS cgu_demands (
  id_tarefa VARCHAR(255) PRIMARY KEY,
  situacao VARCHAR(255),
  estado VARCHAR(255),
  titulo_tarefa TEXT,
  data_inicio VARCHAR(50),
  data_fim VARCHAR(50),
  data_limite VARCHAR(50),
  unidade_auditada VARCHAR(255),
  unidades_auditoria VARCHAR(255),
  texto_monitoramento TEXT,
  providencia TEXT,
  tipo_ultima_manifestacao VARCHAR(255),
  texto_ultima_manifestacao TEXT,
  data_ultima_manifestacao VARCHAR(50),
  tipo_ultimo_posicionamento VARCHAR(255),
  texto_ultimo_posicionamento TEXT,
  data_ultimo_posicionamento VARCHAR(50),
  categoria VARCHAR(255),
  data_limite_inicial VARCHAR(50),
  ano INTEGER,
  ultima_atualizacao VARCHAR(50),
  processo_sei VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS cgu_reports (
  id_tarefa VARCHAR(255) PRIMARY KEY,
  id_auditoria VARCHAR(255),
  titulo_auditoria TEXT,
  ano INTEGER,
  uf VARCHAR(10),
  municipio VARCHAR(255),
  codigo_municipio VARCHAR(50),
  assunto TEXT,
  data_publicacao VARCHAR(50),
  link_relatorio TEXT,
  local_pdf TEXT,
  sumario_executivo TEXT,
  ai_abstract TEXT,
  ultima_atualizacao VARCHAR(50)
);

-- MÓDULO SUPERINTENDÊNCIAS
CREATE TABLE IF NOT EXISTS superintendencias (
  uf VARCHAR(5) PRIMARY KEY,
  capital VARCHAR(255),
  superintendente VARCHAR(255),
  cargo VARCHAR(255),
  endereco TEXT,
  contato VARCHAR(255),
  email VARCHAR(255),
  substituto VARCHAR(255),
  email_substituto VARCHAR(255),
  cep VARCHAR(20),
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  demandas_tcu INTEGER DEFAULT 0,
  demandas_cgu INTEGER DEFAULT 0,
  demandas_etica INTEGER DEFAULT 0,
  status_geral VARCHAR(50)
);

-- MÓDULO ETICA
CREATE TABLE IF NOT EXISTS etica_processos (
  id VARCHAR(255) PRIMARY KEY,
  tipo VARCHAR(50),
  processo_sei VARCHAR(255),
  data_inicio VARCHAR(50),
  data_fim VARCHAR(50),
  resumo TEXT,
  responsavel VARCHAR(255),
  situacao VARCHAR(255),
  solicitante VARCHAR(255),
  assunto TEXT,
  ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS etica_reunioes (
  id VARCHAR(255) PRIMARY KEY,
  tipo VARCHAR(50),
  data_hora VARCHAR(50),
  pauta TEXT,
  confirmacoes JSONB,
  notificado_agendamento BOOLEAN,
  notificado_lembrete BOOLEAN,
  ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS etica_convidados (
  id SERIAL PRIMARY KEY,
  reuniao_id VARCHAR(255) REFERENCES etica_reunioes(id) ON DELETE CASCADE,
  nome VARCHAR(255),
  encargo VARCHAR(255),
  email VARCHAR(255),
  telefone VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS etica_atas (
  id VARCHAR(255) PRIMARY KEY,
  reuniao_id VARCHAR(255) REFERENCES etica_reunioes(id) ON DELETE CASCADE,
  relatos TEXT,
  decisoes TEXT,
  data_geracao VARCHAR(50),
  ultima_atualizacao VARCHAR(50)
);

-- MÓDULO COMUNICAÇÕES
CREATE TABLE IF NOT EXISTS comunicacoes_demands (
  key VARCHAR(255) PRIMARY KEY,
  comunicacao VARCHAR(255),
  destinatario VARCHAR(255),
  contato VARCHAR(255),
  unidade_emitente VARCHAR(255),
  processo VARCHAR(255),
  data_expedicao VARCHAR(50),
  data_resposta VARCHAR(50),
  ano INTEGER,
  carece_resposta BOOLEAN,
  prazo_dias VARCHAR(50),
  resposta_enviada_internamente BOOLEAN,
  unidade_executora VARCHAR(255),
  processo_sei VARCHAR(255),
  destinacao VARCHAR(255),
  ultima_atualizacao VARCHAR(50)
);

-- MÓDULO SCDP
CREATE TABLE IF NOT EXISTS scdp_viagens (
  id VARCHAR(255) PRIMARY KEY,
  nome_viajante VARCHAR(255),
  cpf_viajante VARCHAR(50),
  siape_viajante VARCHAR(50),
  email_viajante VARCHAR(255),
  data_inicio VARCHAR(50),
  data_fim VARCHAR(50),
  destino VARCHAR(255),
  motivo_viagem TEXT,
  valor_passagem NUMERIC(15, 2),
  valor_diarias NUMERIC(15, 2),
  siafi_gru_devolucao_confirmada BOOLEAN,
  siafi_detalhes_status VARCHAR(255),
  siafi_confirmado BOOLEAN,
  siafi_scdp_divergencia BOOLEAN,
  ultima_atualizacao VARCHAR(50)
);

-- MÓDULO CONTRATOS
CREATE TABLE IF NOT EXISTS contratos (
  id VARCHAR(255) PRIMARY KEY,
  numero_contrato VARCHAR(255),
  empresa VARCHAR(255),
  cnpj VARCHAR(50),
  objeto TEXT,
  valor_anual NUMERIC(15, 2),
  data_inicio VARCHAR(50),
  data_fim VARCHAR(50),
  uf VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS contratos_consumo_mensal (
  id VARCHAR(255) PRIMARY KEY,
  contrato_id VARCHAR(255),
  mes VARCHAR(50),
  valor_consumido NUMERIC(15, 2),
  fatura_url TEXT
);

-- MÓDULO VIATURAS
CREATE TABLE IF NOT EXISTS viaturas (
  id VARCHAR(255) PRIMARY KEY,
  placa VARCHAR(50),
  modelo VARCHAR(255),
  ano INT,
  tipo VARCHAR(100),
  uf VARCHAR(10),
  km_atual INT,
  proxima_revisao_km INT,
  status VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS viaturas_abastecimentos (
  id VARCHAR(255) PRIMARY KEY,
  viatura_id VARCHAR(255),
  data_abastecimento VARCHAR(50),
  km INT,
  litros NUMERIC(15, 2),
  valor_total NUMERIC(15, 2),
  posto VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS viaturas_manutencoes (
  id VARCHAR(255) PRIMARY KEY,
  viatura_id VARCHAR(255),
  data_manutencao VARCHAR(50),
  tipo_manutencao VARCHAR(255),
  descricao TEXT,
  km_manutencao INT,
  valor NUMERIC(15, 2),
  proxima_revisao_km INT
);
