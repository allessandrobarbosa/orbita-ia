-- Schema PostgreSQL para o Órbita (MTE/CGU)
-- Banco de dados estruturado para a Fase 3 da migração

-- 1. Usuários e Perfis
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    register VARCHAR(50),
    clearance VARCHAR(50),
    avatar_color VARCHAR(20),
    badge_text VARCHAR(50),
    allowed_modules JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Acórdãos do TCU
CREATE TABLE IF NOT EXISTS acordaos (
    key VARCHAR(100) PRIMARY KEY,
    titulo TEXT,
    num_acordao INTEGER,
    ano_acordao INTEGER,
    num_ata VARCHAR(50),
    colegiado VARCHAR(100),
    data_sessao VARCHAR(50),
    situacao VARCHAR(100),
    proc VARCHAR(100),
    acordaos_relacionados TEXT,
    tipo_processo VARCHAR(200),
    interessados TEXT,
    entidade TEXT,
    unidade_tecnica VARCHAR(200),
    relator VARCHAR(200),
    assunto TEXT,
    sumario TEXT,
    acordao TEXT,
    decisao TEXT,
    recomendacoes TEXT,
    determinacoes TEXT,
    rec_det_unificado TEXT,
    status_monitoramento VARCHAR(50),
    responsavel_interno VARCHAR(100),
    prazo_limite VARCHAR(50),
    observacoes TEXT,
    ultima_atualizacao VARCHAR(50),
    ai_analysis_data JSONB
);

-- 3. Tomada de Contas Especial (TCE)
CREATE TABLE IF NOT EXISTS tces (
    id VARCHAR(100) PRIMARY KEY,
    numero_ano_tce VARCHAR(100),
    processo_administrativo VARCHAR(200),
    motivo_instauracao TEXT,
    submotivo_instauracao TEXT,
    debito_original VARCHAR(100),
    debito_atualizado VARCHAR(100),
    data_atualizacao_debito VARCHAR(50),
    ultimo_posicionamento TEXT,
    tc VARCHAR(100),
    estado_processo VARCHAR(100),
    situacao_processo VARCHAR(100),
    primeiro_julgamento TEXT,
    encerramento TEXT,
    numero_siafi VARCHAR(100),
    siafi_ressarcido BOOLEAN,
    ano INTEGER,
    ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS tce_mappings (
    id SERIAL PRIMARY KEY,
    numero_ano_tce VARCHAR(100),
    acordao_key VARCHAR(100),
    tipo_relacionamento VARCHAR(100),
    notas TEXT,
    UNIQUE(numero_ano_tce, acordao_key)
);

-- 4. Comunicações (Ofícios)
CREATE TABLE IF NOT EXISTS comunicacoes (
    key VARCHAR(100) PRIMARY KEY,
    comunicacao VARCHAR(200),
    destinatario VARCHAR(200),
    contato VARCHAR(200),
    unidade_emitente VARCHAR(100),
    processo VARCHAR(100),
    data_expedicao VARCHAR(50),
    data_resposta VARCHAR(50),
    ano INTEGER,
    carece_resposta BOOLEAN,
    prazo_dias VARCHAR(50),
    resposta_enviada_internamente BOOLEAN,
    unidade_executora VARCHAR(100),
    processo_sei VARCHAR(100),
    destinacao VARCHAR(100),
    ultima_atualizacao VARCHAR(50)
);

-- 5. Demandas CGU
CREATE TABLE IF NOT EXISTS cgu_demands (
    id_tarefa VARCHAR(100) PRIMARY KEY,
    situacao VARCHAR(100),
    estado VARCHAR(100),
    titulo_tarefa TEXT,
    data_inicio VARCHAR(50),
    data_fim VARCHAR(50),
    data_limite VARCHAR(50),
    unidade_auditada VARCHAR(200),
    unidades_auditoria VARCHAR(200),
    texto_monitoramento TEXT,
    providencia TEXT,
    tipo_ultima_manifestacao VARCHAR(100),
    texto_ultima_manifestacao TEXT,
    data_ultima_manifestacao VARCHAR(50),
    tipo_ultimo_posicionamento VARCHAR(100),
    texto_ultimo_posicionamento TEXT,
    data_ultimo_posicionamento VARCHAR(50),
    categoria VARCHAR(100),
    data_limite_inicial VARCHAR(50),
    ano INTEGER,
    ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS cgu_reports (
    id VARCHAR(100) PRIMARY KEY,
    id_tarefa VARCHAR(100),
    id_auditoria VARCHAR(100),
    titulo_auditoria TEXT,
    ano INTEGER,
    uf VARCHAR(2),
    municipio VARCHAR(200),
    codigo_municipio VARCHAR(20),
    assunto TEXT,
    data_publicacao VARCHAR(50),
    link_relatorio TEXT,
    local_pdf VARCHAR(255),
    sumario_executivo TEXT,
    ai_abstract TEXT,
    ultima_atualizacao VARCHAR(50)
);

-- 6. Rol de Responsáveis
CREATE TABLE IF NOT EXISTS rol_responsaveis (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(200),
    cpf VARCHAR(20),
    cargo VARCHAR(100),
    unidade VARCHAR(100),
    inicio_exercicio VARCHAR(50),
    fim_exercicio VARCHAR(50),
    ato_nomeacao VARCHAR(100),
    status VARCHAR(50),
    observacoes TEXT
);

CREATE TABLE IF NOT EXISTS unidades_rol (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(200),
    sigla VARCHAR(50),
    ug VARCHAR(50),
    natureza VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dirigentes (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(200),
    cpf VARCHAR(20),
    situacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS dirigentes_cargos (
    id VARCHAR(100) PRIMARY KEY,
    dirigente_id VARCHAR(100),
    cargo VARCHAR(100),
    unidade_id VARCHAR(100),
    data_inicio VARCHAR(50),
    data_fim VARCHAR(50),
    ato_nomeacao VARCHAR(100)
);

-- 7. Superintendências
CREATE TABLE IF NOT EXISTS superintendencias (
    uf VARCHAR(2) PRIMARY KEY,
    capital VARCHAR(100),
    superintendente VARCHAR(200),
    cargo VARCHAR(100),
    endereco TEXT,
    contato VARCHAR(100),
    email VARCHAR(100),
    substituto VARCHAR(200),
    email_substituto VARCHAR(100),
    cep VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    demandas_tcu INTEGER,
    demandas_cgu INTEGER,
    demandas_etica INTEGER,
    status_geral VARCHAR(50)
);

-- 8. Ética
CREATE TABLE IF NOT EXISTS etica_membros (
    id VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(200),
    cpf VARCHAR(20),
    atribuicao VARCHAR(100),
    encargo VARCHAR(50),
    dispositivo_legal VARCHAR(100),
    data_publicacao VARCHAR(50),
    data_inicio_mandato VARCHAR(50),
    data_fim_mandato VARCHAR(50),
    mandato VARCHAR(50),
    matricula VARCHAR(50),
    telefone VARCHAR(50),
    email VARCHAR(100),
    ativo BOOLEAN,
    ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS etica_reunioes (
    id VARCHAR(100) PRIMARY KEY,
    tipo VARCHAR(50),
    data_hora VARCHAR(50),
    pauta TEXT,
    convidados JSONB,
    confirmacoes JSONB,
    notificado_agendamento BOOLEAN,
    notificado_lembrete BOOLEAN,
    ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS etica_atas (
    id VARCHAR(100) PRIMARY KEY,
    reuniao_id VARCHAR(100),
    relatos TEXT,
    decisoes TEXT,
    data_geracao VARCHAR(50),
    ultima_atualizacao VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS etica_processos (
    id VARCHAR(100) PRIMARY KEY,
    tipo VARCHAR(50),
    processo_sei VARCHAR(100),
    data_inicio VARCHAR(50),
    data_fim VARCHAR(50),
    resumo TEXT,
    responsavel VARCHAR(200),
    situacao VARCHAR(100),
    solicitante VARCHAR(200),
    assunto TEXT,
    ultima_atualizacao VARCHAR(50)
);

-- 9. Contratos e Viaturas
CREATE TABLE IF NOT EXISTS contratos (
    id VARCHAR(100) PRIMARY KEY,
    numero VARCHAR(50),
    empresa VARCHAR(200),
    cnpj VARCHAR(20),
    objeto TEXT,
    valor_mensal DECIMAL(12,2),
    data_inicio VARCHAR(50),
    data_fim VARCHAR(50),
    gestor VARCHAR(200),
    fiscal VARCHAR(200),
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS contratos_consumo (
    id VARCHAR(100) PRIMARY KEY,
    contrato_id VARCHAR(100),
    mes_ano VARCHAR(20),
    valor_gasto DECIMAL(12,2),
    sla_cumprido BOOLEAN,
    glosa DECIMAL(12,2),
    observacoes TEXT
);

CREATE TABLE IF NOT EXISTS viaturas (
    placa VARCHAR(20) PRIMARY KEY,
    modelo VARCHAR(100),
    marca VARCHAR(100),
    ano INTEGER,
    chassi VARCHAR(100),
    renavam VARCHAR(50),
    lotacao VARCHAR(100),
    status VARCHAR(50),
    hodometro_atual INTEGER
);

CREATE TABLE IF NOT EXISTS viaturas_abastecimentos (
    id VARCHAR(100) PRIMARY KEY,
    placa VARCHAR(20),
    data VARCHAR(50),
    litros DECIMAL(8,2),
    valor_total DECIMAL(8,2),
    motorista VARCHAR(200),
    hodometro INTEGER,
    posto VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS viaturas_manutencoes (
    id VARCHAR(100) PRIMARY KEY,
    placa VARCHAR(20),
    data_inicio VARCHAR(50),
    data_fim VARCHAR(50),
    tipo VARCHAR(50),
    descricao TEXT,
    valor DECIMAL(10,2),
    oficina VARCHAR(200)
);

-- 10. SCDP (Sistema de Concessão de Diárias e Passagens)
CREATE TABLE IF NOT EXISTS scdp_viagens (
    pcdp VARCHAR(100) PRIMARY KEY,
    solicitacao VARCHAR(100),
    nome_viajante VARCHAR(200),
    siape_viajante VARCHAR(50),
    email_viajante VARCHAR(150),
    cpf_viajante VARCHAR(20),
    cargo_viajante VARCHAR(100),
    orgao_solicitante VARCHAR(100),
    unidade_solicitante VARCHAR(100),
    motivo_viagem TEXT,
    origem VARCHAR(100),
    destino VARCHAR(100),
    data_inicio VARCHAR(50),
    data_fim VARCHAR(50),
    diarias DECIMAL(8,2),
    valor_diarias DECIMAL(10,2),
    valor_passagens DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    status VARCHAR(50),
    tipo_viagem VARCHAR(50),
    meio_transporte VARCHAR(50)
);
