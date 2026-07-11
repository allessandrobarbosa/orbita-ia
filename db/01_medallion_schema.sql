-- ==========================================
-- ARQUITETURA MEDALLION - MTE ÓRBITA
-- ==========================================

-- 1. CAMADA BRONZE (RAW)
-- Guarda os dados exatamente como vieram das fontes (TCU, CGU, SIAFI)
CREATE TABLE IF NOT EXISTS bronze_tcu_acordaos (
    id SERIAL PRIMARY KEY,
    num_acordao VARCHAR(50),
    ano_acordao INTEGER,
    colegiado VARCHAR(50),
    texto_integral TEXT,
    data_sessao DATE,
    url_fonte VARCHAR(255),
    data_ingestao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bronze_siafi_ob (
    id SERIAL PRIMARY KEY,
    numero_ob VARCHAR(50),
    valor DECIMAL(15,2),
    data_emissao DATE,
    cpf_cnpj_favorecido VARCHAR(20),
    dados_brutos JSONB,
    data_ingestao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 2. CAMADA SILVER (QUALIFIED)
-- Dados extraídos, limpos e qualificados (ex: usando IA)
CREATE TABLE IF NOT EXISTS silver_tcu_alertas (
    id SERIAL PRIMARY KEY,
    fk_acordao_bronze INTEGER REFERENCES bronze_tcu_acordaos(id),
    servidor_cpf VARCHAR(14),
    nome_identificado VARCHAR(255),
    valor_dano DECIMAL(15,2),
    prazo_ressarcimento DATE,
    nivel_confianca_ia DECIMAL(5,2), -- % de confiança da Groq/Gemini
    is_validado_humano BOOLEAN DEFAULT FALSE,
    data_extracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 3. CAMADA GOLD (ANALYTICS & BUSINESS)
-- Tabelas prontas para consumo do PowerBI e outras APIs (Dossiês)
CREATE TABLE IF NOT EXISTS gold_dossie_ressarcimento (
    id_dossie SERIAL PRIMARY KEY,
    fk_alerta_silver INTEGER REFERENCES silver_tcu_alertas(id),
    fk_ob_bronze INTEGER REFERENCES bronze_siafi_ob(id),
    status_cobranca VARCHAR(50) DEFAULT 'PENDENTE', -- PENDENTE, RESSARCIDO, JUDICIALIZADO
    montante_atualizado DECIMAL(15,2),
    unidade_responsavel VARCHAR(100),
    data_consolidacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- VIEWS OTIMIZADAS PARA O POWERBI
CREATE OR REPLACE VIEW view_pbi_dossies_ativos AS
SELECT 
    d.id_dossie,
    s.nome_identificado AS servidor,
    s.servidor_cpf AS cpf,
    d.montante_atualizado AS valor_devido,
    d.status_cobranca,
    d.unidade_responsavel,
    b.num_acordao || '/' || b.ano_acordao AS acordao_origem,
    b.url_fonte AS link_tcu
FROM gold_dossie_ressarcimento d
JOIN silver_tcu_alertas s ON d.fk_alerta_silver = s.id
JOIN bronze_tcu_acordaos b ON s.fk_acordao_bronze = b.id
WHERE d.status_cobranca != 'RESSARCIDO';
