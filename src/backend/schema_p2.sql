
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
  ultima_atualizacao VARCHAR(50)
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
