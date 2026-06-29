-- ============================================================================
-- MODELAGEM DE DADOS (DER) - POSTGRESQL
-- MÓDULO: DETALHES DA SRTE (CONTRATOS E FROTA)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. MÓDULO CONTRATOS
-- ----------------------------------------------------------------------------

-- Tabela principal de Contratos
CREATE TABLE contratos (
    id SERIAL PRIMARY KEY,
    srte_id VARCHAR(2) NOT NULL, -- Código UF da superintendência (ex: 'SP', 'RJ', 'AC')
    numero VARCHAR(50) NOT NULL, -- Identificador único do contrato (ex: '15/2024')
    tipo VARCHAR(100) NOT NULL, -- Tipo do serviço (ex: 'Vigilância', 'Limpeza', 'TI', 'Copa')
    fornecedor VARCHAR(150) NOT NULL, -- Razão social ou nome do fornecedor contratado
    valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total > 0), -- Valor global do contrato
    valor_mensal NUMERIC(15, 2) NOT NULL CHECK (valor_mensal > 0), -- Custo estimado de faturamento mensal
    inicio_vigencia DATE NOT NULL, -- Início da vigência do contrato
    fim_vigencia DATE NOT NULL, -- Término da vigência do contrato
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Encerrado', 'Suspenso')),
    objeto TEXT, -- Descrição detalhada do escopo ou serviços contratados
    
    -- Restrição para garantir consistência de vigência
    CONSTRAINT chk_datas CHECK (fim_vigencia >= inicio_vigencia)
);

-- Índices recomendados para otimização de consultas e relatórios
CREATE INDEX idx_contratos_srte_id ON contratos(srte_id);
CREATE INDEX idx_contratos_fim_vigencia ON contratos(fim_vigencia);

-- Histórico de Consumo/Faturamento Mensal
CREATE TABLE contratos_consumo_mensal (
    id SERIAL PRIMARY KEY,
    contrato_id INTEGER NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    mes_ano DATE NOT NULL, -- Salvo como o 1º dia do mês de referência (ex: '2026-05-01')
    valor NUMERIC(15, 2) NOT NULL CHECK (valor >= 0), -- Valor faturado no mês
    variacao_anterior NUMERIC(5, 2), -- Variação percentual calculada em relação ao mês anterior (ex: +5.40 ou -2.10)
    
    -- Restrição de unicidade para evitar lançamentos duplicados do mesmo contrato no mesmo mês
    CONSTRAINT uq_contrato_mes UNIQUE (contrato_id, mes_ano)
);

-- Índice para acelerar junções de faturamento e históricos
CREATE INDEX idx_consumo_contrato ON contratos_consumo_mensal(contrato_id);


-- ----------------------------------------------------------------------------
-- 2. MÓDULO FROTA
-- ----------------------------------------------------------------------------

-- Tabela de Cadastro de Veículos/Viaturas
CREATE TABLE viaturas (
    id SERIAL PRIMARY KEY,
    srte_id VARCHAR(2) NOT NULL, -- Código UF da superintendência (ex: 'SP', 'RJ')
    placa VARCHAR(7) NOT NULL UNIQUE, -- Placa do veículo (Formato Mercosul ou Tradicional)
    marca VARCHAR(50) NOT NULL, -- Fabricante (ex: 'Toyota', 'Chevrolet', 'Fiat')
    modelo VARCHAR(100) NOT NULL, -- Modelo do veículo (ex: 'Hilux', 'Spin', 'Cronos')
    ano_fabricacao INTEGER NOT NULL CHECK (ano_fabricacao >= 1990), -- Ano de fabricação
    chassi VARCHAR(17) NOT NULL UNIQUE, -- Número de chassi do veículo (padrão de 17 caracteres)
    renavam VARCHAR(11) NOT NULL UNIQUE, -- Código RENAVAM (padrão de 11 dígitos)
    alocacao VARCHAR(20) NOT NULL CHECK (alocacao IN ('Fiscalização', 'Administração')), -- Enum de alocação de uso
    km_atual INTEGER NOT NULL DEFAULT 0 CHECK (km_atual >= 0), -- Quilometragem registrada atualizada
    proxima_revisao_km INTEGER NOT NULL CHECK (proxima_revisao_km >= 0), -- Quilometragem prevista para a revisão
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Manutenção', 'Inativo', 'Baixado')),
    destinacao_baixa TEXT, -- Justificativa/destinação caso o veículo tenha status 'Baixado' (ex: 'Leilão', 'Devolvido')
    
    -- Restrição lógica para que a próxima revisão seja superior ou igual à quilometragem atual
    CONSTRAINT chk_revisao CHECK (proxima_revisao_km >= km_atual)
);

-- Índices recomendados
CREATE INDEX idx_viaturas_srte_id ON viaturas(srte_id);
CREATE INDEX idx_viaturas_placa ON viaturas(placa);

-- Tabela de Registros de Abastecimento de Combustível
CREATE TABLE viaturas_abastecimentos (
    id SERIAL PRIMARY KEY,
    viatura_id INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    data_abastecimento DATE NOT NULL, -- Data do abastecimento
    litros NUMERIC(6, 2) NOT NULL CHECK (litros > 0), -- Quantidade de litros abastecidos
    km_abastecimento INTEGER NOT NULL CHECK (km_abastecimento >= 0), -- Km registrado no painel
    custo NUMERIC(10, 2) NOT NULL CHECK (custo > 0) -- Valor pago em R$
);

CREATE INDEX idx_abastecimentos_viatura ON viaturas_abastecimentos(viatura_id);

-- Tabela de Histórico de Manutenções das Viaturas
CREATE TABLE viaturas_manutencoes (
    id SERIAL PRIMARY KEY,
    viatura_id INTEGER NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL, -- Tipo de manutenção realizada (ex: 'Preventiva', 'Corretiva')
    data_manutencao DATE NOT NULL, -- Data da manutenção
    custo NUMERIC(10, 2) NOT NULL CHECK (custo >= 0), -- Custo total em R$
    km_manutencao INTEGER NOT NULL CHECK (km_manutencao >= 0), -- Km no momento da manutenção
    proxima_revisao_km INTEGER, -- Km previsto para revisão estipulado na manutenção
    
    -- Restrição de quilometragem da revisão
    CONSTRAINT chk_revisao_manutencao CHECK (proxima_revisao_km >= km_manutencao)
);

CREATE INDEX idx_manutencoes_viatura ON viaturas_manutencoes(viatura_id);

-- ----------------------------------------------------------------------------
-- 3. MÓDULO ROL DE RESPONSÁVEIS (IN 84/2020 TCU)
-- ----------------------------------------------------------------------------

-- Cadastro de Unidades Administrativas (ex: Gabinete do Ministro, Secretaria-Executiva)
CREATE TABLE unidades_rol (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    sigla VARCHAR(20) NOT NULL UNIQUE
);

-- Dirigentes = PESSOAS (sem vínculo direto a cargo/unidade — um por CPF)
CREATE TABLE dirigentes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,    -- Mascarado na UI (ex: XXX.848.518-XX)
    email VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(10) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'))
);

-- Vínculos de Cargo — um dirigente pode ter múltiplos vínculos:
-- Ex: Secretário-Executivo é Titular na SE e Substituto Legal no GM (Ministério)
CREATE TABLE dirigentes_cargos (
    id SERIAL PRIMARY KEY,
    dirigente_id INTEGER NOT NULL REFERENCES dirigentes(id) ON DELETE CASCADE,
    unidade_id INTEGER NOT NULL REFERENCES unidades_rol(id) ON DELETE CASCADE,
    cargo VARCHAR(100) NOT NULL,                      -- ex: Ministro de Estado, Secretário-Executivo
    tipo_vinculo VARCHAR(20) NOT NULL DEFAULT 'Titular'
        CHECK (tipo_vinculo IN ('Titular', 'Substituto Legal')),
    inicio_exercicio DATE NOT NULL,
    fim_exercicio DATE,                               -- NULL = vigente
    ato_nomeacao VARCHAR(255) NOT NULL,               -- Link DOU / Portaria de nomeação
    ato_exoneracao VARCHAR(255),                      -- Link DOU / Portaria de exoneração
    status VARCHAR(10) NOT NULL DEFAULT 'Ativo'
        CHECK (status IN ('Ativo', 'Encerrado')),
    CONSTRAINT uq_cargo_unidade UNIQUE (dirigente_id, unidade_id, tipo_vinculo, inicio_exercicio)
);

CREATE INDEX idx_cargos_dirigente ON dirigentes_cargos(dirigente_id);
CREATE INDEX idx_cargos_unidade ON dirigentes_cargos(unidade_id);

-- Eventos de Gestão: Afastamentos, Impedimentos e Substituições
-- Vinculado ao cargo específico que está sendo substituído
CREATE TABLE dirigentes_eventos (
    id SERIAL PRIMARY KEY,
    dirigente_id INTEGER NOT NULL REFERENCES dirigentes(id) ON DELETE CASCADE,  -- Titular afastado
    cargo_id INTEGER NOT NULL REFERENCES dirigentes_cargos(id) ON DELETE CASCADE, -- Qual cargo está sendo substituído
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    motivo VARCHAR(50) NOT NULL
        CHECK (motivo IN ('Férias', 'Licença Médica', 'Viagem Internacional', 'Exoneração')),
    ato_autorizacao VARCHAR(255) NOT NULL,            -- Link do DOU ou atestado médico
    substituto_id INTEGER REFERENCES dirigentes(id) ON DELETE SET NULL, -- Substituto designado
    CONSTRAINT chk_datas_evento CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_eventos_dirigente ON dirigentes_eventos(dirigente_id);
CREATE INDEX idx_eventos_cargo ON dirigentes_eventos(cargo_id);
CREATE INDEX idx_eventos_substituto ON dirigentes_eventos(substituto_id);



-- Cadastro de Unidades Administrativas (ex: Gabinete, Secretaria-Executiva, SRTEs)
CREATE TABLE unidades_rol (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    sigla VARCHAR(20) NOT NULL UNIQUE
);

-- Cadastro de Dirigentes e Ordenadores
CREATE TABLE dirigentes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE, -- Mascarado na UI (ex: XXX.848.518-XX)
    email VARCHAR(100) NOT NULL UNIQUE,
    cargo_responsabilidade VARCHAR(100) NOT NULL, -- ex: 'Ministro de Estado', 'Secretário Executivo'
    unidade_id INTEGER NOT NULL REFERENCES unidades_rol(id) ON DELETE CASCADE,
    inicio_exercicio DATE NOT NULL,
    fim_exercicio DATE, -- NULL se for 'Vigente'
    status VARCHAR(10) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'))
);

CREATE INDEX idx_dirigentes_unidade ON dirigentes(unidade_id);

-- Histórico de Eventos de Gestão (Afastamentos, Impedimentos e Substituições)
CREATE TABLE dirigentes_eventos (
    id SERIAL PRIMARY KEY,
    dirigente_id INTEGER NOT NULL REFERENCES dirigentes(id) ON DELETE CASCADE, -- Titular afastado
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    motivo VARCHAR(50) NOT NULL CHECK (motivo IN ('Férias', 'Licença Médica', 'Viagem Internacional', 'Exoneração')),
    ato_autorizacao VARCHAR(255) NOT NULL, -- Link do DOU ou atestado médico
    substituto_id INTEGER REFERENCES dirigentes(id) ON DELETE SET NULL, -- Substituto que assumiu
    CONSTRAINT chk_datas_evento CHECK (data_fim >= data_inicio)
);

CREATE INDEX idx_eventos_dirigente ON dirigentes_eventos(dirigente_id);
CREATE INDEX idx_eventos_substituto ON dirigentes_eventos(substituto_id);

