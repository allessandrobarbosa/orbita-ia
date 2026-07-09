-- Schema de Banco de Dados SQLite para o Sistema ÓRBITA-AECI
-- Armazenamento estruturado de acórdãos do TCU, Rol de Responsáveis e dados de integridade governamental.
-- Projetado para conformidade com o dicionário de dados do TCU e otimização de buscas.

PRAGMA foreign_keys = ON;

-- 1. Tabela de Acórdãos do TCU
CREATE TABLE IF NOT EXISTS acordaos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,           -- Identificador único (ex: AC-14068-2023-1C)
    titulo TEXT NOT NULL,               -- Título completo do Acórdão
    numero_acordao INTEGER NOT NULL,    -- 'NUMACORDAO' do dicionário de dados do TCU
    ano_acordao INTEGER NOT NULL,       -- 'ANOACORDAO' do dicionário de dados do TCU
    numero_ata TEXT,                    -- 'NUMATA' (Ata Num/Ano)
    colegiado TEXT,                     -- 'COLEGIADO' (ex: Plenário, Primeira Câmara)
    data_sessao TEXT,                   -- 'DATASESSAO' (dd/mm/aaaa)
    situacao_atual TEXT,                -- 'SITUACAO' (ex: Oficializado, Sigiloso)
    numero_processo TEXT,               -- 'PROC' (ex: TC 012.345/2023-6)
    acordao_relacionado TEXT,           -- 'ACORDAOSRELACIONADOS'
    tipo_processo TEXT,                 -- 'TIPOPROCESSO' (ex: Representação, Auditoria)
    interessados TEXT,                  -- 'INTERESSADOS' (gestores ou órgãos públicos)
    entidade TEXT,                      -- 'ENTIDADE' (ex: Ministério do Trabalho e Emprego)
    assunto TEXT,                       -- 'ASSUNTO' (descritivo sumário da matéria)
    sumario TEXT,                       -- 'SUMARIO' (resumo resumido do julgamento)
    acordao_integra TEXT,               -- 'ACORDAO' (texto completo da deliberação)
    
    -- Campos operacionais de monitoramento interno da Assessoria Especial (AECI)
    status_monitoramento TEXT CHECK(status_monitoramento IN ('Pendente', 'Em Análise', 'Cumprido', 'Atrasado')) DEFAULT 'Pendente',
    responsavel_interno TEXT,           -- Identificação do analista da AECI encarregado
    prazo_limite TEXT,                  -- Data limite para atendimento (aaaa-mm-dd)
    observacoes TEXT,                   -- Notas e histórico de acompanhamento interno
    ultima_atualizacao TEXT             -- Data/Hora da última modificação
);

-- Índices otimizados para busca de Acórdãos
CREATE INDEX IF NOT EXISTS idx_acordaos_num_ano ON acordaos(numero_acordao, ano_acordao);
CREATE INDEX IF NOT EXISTS idx_acordaos_processo ON acordaos(numero_processo);
CREATE INDEX IF NOT EXISTS idx_acordaos_status ON acordaos(status_monitoramento);
CREATE INDEX IF NOT EXISTS idx_acordaos_responsavel ON acordaos(responsavel_interno);


-- 2. Tabela de Rol de Responsáveis (IN-TCU 84)
CREATE TABLE IF NOT EXISTS rol_responsaveis (
    id TEXT PRIMARY KEY,                 -- ID do Responsável (ex: R-1)
    nome TEXT NOT NULL,                 -- Nome completo do gestor
    cpf TEXT NOT NULL,                  -- CPF (armazenado de forma mascarada/segura)
    cargo TEXT NOT NULL,                -- Cargo ou função ocupada
    unidade TEXT NOT NULL,              -- Unidade administrativa (ex: Secretaria-Executiva)
    inicio_exercicio TEXT,              -- Data de início de atividade (aaaa-mm-dd)
    fim_exercicio TEXT,                 -- Data de término ou 'Vigente'
    ato_nomeacao TEXT,                  -- Portaria ou ato presidencial correspondente
    status TEXT CHECK(status IN ('Vigente', 'Encerrado', 'Suspenso')) DEFAULT 'Vigente',
    observacoes TEXT
);

CREATE INDEX IF NOT EXISTS idx_rol_nome ON rol_responsaveis(nome);
CREATE INDEX IF NOT EXISTS idx_rol_status ON rol_responsaveis(status);


-- 3. Tabela de Comunicações do TCU (Ofícios de Notificação)
CREATE TABLE IF NOT EXISTS comunicacoes (
    key TEXT PRIMARY KEY,               -- Identificador único do ofício
    comunicacao TEXT NOT NULL,          -- Nome/código (ex: Ofício 066.981/2022)
    destinatario TEXT,                  -- Unidade ou gestor destinatário
    contato TEXT,                       -- Pessoa ou setor responsável
    unidade_emitente TEXT,              -- Setor do TCU emitente (ex: SEPROC)
    processo TEXT,                      -- Processo conexo no TCU (TC)
    data_expedicao TEXT,                -- 'DATA_EXPEDICAO' (dd/mm/aaaa)
    data_resposta TEXT,                 -- 'DATA_RESPOSTA' (dd/mm/aaaa ou nulo)
    ano INTEGER,                        -- Ano associado ao Ofício
    ultima_atualizacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_comunicacoes_proc ON comunicacoes(processo);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_expedicao ON comunicacoes(data_expedicao);


-- 4. Tabela de Tomadas de Contas Especiais (TCE)
CREATE TABLE IF NOT EXISTS tces (
    id TEXT PRIMARY KEY,                 -- Identificador (ex: TCE 001/2023)
    numero_ano_tce TEXT UNIQUE NOT NULL, -- Código completo do processo de TCE
    processo_administrativo TEXT,       -- Processo no âmbito do Ministério do Trabalho e Emprego
    motivo_instauracao TEXT,            -- Motivação legal da instauração
    submotivo_instauracao TEXT,         -- Detalhamento exato da inconsistência
    debito_original TEXT,               -- Valor do dano histórico apurado
    debito_atualizado TEXT,             -- Valor atualizado com incidência de encargos
    data_atualizacao_debito TEXT,       -- Data base de atualização do crédito
    ultimo_posicionamento TEXT,         -- Última manifestação técnica cadastrada
    tc TEXT,                            -- Número do processo externo encaminhado ao TCU
    estado_processo TEXT,               -- Estado (ex: Citado, Instauração, Julgado)
    situacao_processo TEXT,             -- Situação de trâmite atual
    primeiro_julgamento TEXT,           -- Primeiro marcador deliberativo obtido
    encerramento TEXT,                  -- Status de arquivamento ou condenação definitiva
    ano INTEGER,                        -- Ano do fato ou autuação
    ultima_atualizacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_tces_tc ON tces(tc);


-- 5. Tabela de Mapeamento entre TCE e Acórdãos TCU Conexos
CREATE TABLE IF NOT EXISTS tce_acordao_mappings (
    numero_ano_tce TEXT NOT NULL,
    acordao_ref TEXT NOT NULL,          -- Referência do Acórdão (ex: 14068/2023)
    PRIMARY KEY (numero_ano_tce, acordao_ref),
    FOREIGN KEY (numero_ano_tce) REFERENCES tces(numero_ano_tce) ON DELETE CASCADE
);


-- 6. Tabela da Comissão de Ética do MTE  
CREATE TABLE IF NOT EXISTS comissao_etica (
    id TEXT PRIMARY KEY,                 -- ID identificador (ex: E-1)
    protocolo TEXT UNIQUE NOT NULL,      -- Protocolo e-Origem ou Fala.BR (ex: MTE-ETI-2026-0004)
    data_classificacao TEXT NOT NULL,    -- Data de autuação (aaaa-mm-dd)
    descricao TEXT NOT NULL,            -- Detalhamento do fato ético denunciado
    envolvidos TEXT,                    -- Servidores ou profissionais relacionados
    orgao_origem TEXT,                  -- Setor de denúncia ou procedência
    relator TEXT,                       -- Nome do conselheiro relator
    status TEXT CHECK(status IN ('Triagem', 'Apuração Preliminar', 'Processo Ético', 'Concluído', 'Arquivado')) DEFAULT 'Triagem',
    recomendacoes TEXT                  -- Medida ou sanção sugerida pela comissão
);

CREATE INDEX IF NOT EXISTS idx_etica_status ON comissao_etica(status);


-- 7. Tabela de Superintendências Regionais do Trabalho (SRTEs)
CREATE TABLE IF NOT EXISTS superintendencias (
    uf TEXT PRIMARY KEY,                -- Unidade Federativa (ex: SP, RJ, DF)
    capital TEXT NOT NULL,              -- Capital do Estado
    superintendente TEXT,               -- Nome completo do Superintendente
    cargo TEXT,                         -- Cargo formal ocupado
    endereco TEXT,                      -- Logradouro da Superintendência Regional
    contato TEXT,                       -- Telefone / Atendimento
    email TEXT,                         -- E-mail institucional de contato
    demandas_tcu INTEGER DEFAULT 0,     -- Volumetria de demandas do TCU na UF
    demandas_cgu INTEGER DEFAULT 0,     -- Volumetria de demandas da CGU na UF
    demandas_etica INTEGER DEFAULT 0,   -- Volumetria de demandas de Ética na UF
    status_geral TEXT CHECK(status_geral IN ('Regular', 'Atenção', 'Crítico')) DEFAULT 'Regular'
);


-- 8. Busca Otimizada por Texto Completo (Full-Text Search FTS5) para os Acórdãos do TCU
-- Permite que a assessoria da AECI realize buscas semânticas ultravelozes em ementas, sumários e íntegras.
CREATE VIRTUAL TABLE IF NOT EXISTS acordaos_fts USING fts5(
    key,
    titulo,
    numero_processo,
    assunto,
    sumario,
    acordao_integra,
    content='acordaos',
    content_rowid='id'
);

-- Triggers (Gatilhos) para manter o índice de busca FTS5 sempre sincronizado de forma automática
CREATE TRIGGER IF NOT EXISTS tgr_acordaos_ai AFTER INSERT ON acordaos BEGIN
    INSERT INTO acordaos_fts(rowid, key, titulo, numero_processo, assunto, sumario, acordao_integra)
    VALUES (new.id, new.key, new.titulo, new.numero_processo, new.assunto, new.sumario, new.acordao_integra);
END;

CREATE TRIGGER IF NOT EXISTS tgr_acordaos_ad AFTER DELETE ON acordaos BEGIN
    INSERT INTO acordaos_fts(acordaos_fts, rowid, key, titulo, numero_processo, assunto, sumario, acordao_integra)
    VALUES('delete', old.id, old.key, old.titulo, old.numero_processo, old.assunto, old.sumario, old.acordao_integra);
END;

CREATE TRIGGER IF NOT EXISTS tgr_acordaos_au AFTER UPDATE ON acordaos BEGIN
    INSERT INTO acordaos_fts(acordaos_fts, rowid, key, titulo, numero_processo, assunto, sumario, acordao_integra)
    VALUES('delete', old.id, old.key, old.titulo, old.numero_processo, old.assunto, old.sumario, old.acordao_integra);
    INSERT INTO acordaos_fts(rowid, key, titulo, numero_processo, assunto, sumario, acordao_integra)
    VALUES (new.id, new.key, new.titulo, new.numero_processo, new.assunto, new.sumario, new.acordao_integra);
END;
