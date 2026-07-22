-- =========================================================================
-- 0. DROPS PARA REINICIALIZAÇÃO LIMPA
-- =========================================================================
DROP TABLE IF EXISTS atos_administrativos CASCADE;
DROP TABLE IF EXISTS afastamentos CASCADE;
DROP TABLE IF EXISTS exercicios_substituicao CASCADE;
DROP TABLE IF EXISTS designacoes_substituicao CASCADE;
DROP TABLE IF EXISTS mandato_atribuicoes CASCADE;
DROP TABLE IF EXISTS mandatos CASCADE;
DROP TABLE IF EXISTS documento_vinculos CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS funcoes_responsabilidade CASCADE;
DROP TABLE IF EXISTS tipos_responsabilidade CASCADE;
DROP TABLE IF EXISTS cargos CASCADE;
DROP TABLE IF EXISTS unidades CASCADE;
DROP TABLE IF EXISTS pessoas CASCADE;
DROP TABLE IF EXISTS auditoria_log CASCADE;

-- =========================================================================
-- 1. TABELAS DE DOMÍNIO E ESTRUTURA ORGANIZACIONAL
-- =========================================================================

CREATE TABLE IF NOT EXISTS pessoas (
    id_pessoa SERIAL PRIMARY KEY,
    nome_completo TEXT NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unidades (
    id_unidade SERIAL PRIMARY KEY,
    sigla TEXT NOT NULL,
    nome TEXT NOT NULL,
    id_unidade_pai INTEGER REFERENCES unidades(id_unidade),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cargos (
    id_cargo SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS tipos_responsabilidade (
    id_tipo SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS funcoes_responsabilidade (
    id_funcao SERIAL PRIMARY KEY,
    id_cargo INTEGER NOT NULL REFERENCES cargos(id_cargo),
    id_unidade INTEGER NOT NULL REFERENCES unidades(id_unidade),
    id_tipo_responsabilidade_padrao INTEGER REFERENCES tipos_responsabilidade(id_tipo),
    ativo BOOLEAN DEFAULT TRUE,
    UNIQUE (id_cargo, id_unidade)
);

-- =========================================================================
-- 2. GESTÃO DOCUMENTAL E ATOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS atos_administrativos (
    id_ato SERIAL PRIMARY KEY,
    numero TEXT NOT NULL,
    ano INTEGER NOT NULL,
    tipo_ato TEXT NOT NULL,
    data_publicacao DATE,
    ementa TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documentos (
    id_documento SERIAL PRIMARY KEY,
    tipo_documento TEXT,
    nome_arquivo TEXT NOT NULL,
    hash_arquivo TEXT NOT NULL,
    caminho_storage TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documento_vinculos (
    id_vinculo SERIAL PRIMARY KEY,
    id_documento INTEGER NOT NULL REFERENCES documentos(id_documento),
    entidade_tipo TEXT NOT NULL,
    entidade_id INTEGER NOT NULL
);

-- =========================================================================
-- 3. VÍNCULOS JURÍDICOS E EXERCÍCIOS
-- =========================================================================

CREATE TABLE IF NOT EXISTS mandatos (
    id_mandato SERIAL PRIMARY KEY,
    id_pessoa INTEGER NOT NULL REFERENCES pessoas(id_pessoa),
    id_funcao INTEGER NOT NULL REFERENCES funcoes_responsabilidade(id_funcao),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    id_ato_nomeacao INTEGER REFERENCES atos_administrativos(id_ato),
    id_ato_exoneracao INTEGER REFERENCES atos_administrativos(id_ato),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_datas_mandato CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE TABLE IF NOT EXISTS mandato_atribuicoes (
    id_atribuicao SERIAL PRIMARY KEY,
    id_mandato INTEGER NOT NULL REFERENCES mandatos(id_mandato),
    id_tipo_responsabilidade INTEGER NOT NULL REFERENCES tipos_responsabilidade(id_tipo),
    id_ato_delegacao INTEGER REFERENCES atos_administrativos(id_ato),
    data_inicio DATE NOT NULL,
    data_fim DATE
);

CREATE TABLE IF NOT EXISTS designacoes_substituicao (
    id_designacao SERIAL PRIMARY KEY,
    id_pessoa INTEGER NOT NULL REFERENCES pessoas(id_pessoa),
    id_funcao INTEGER NOT NULL REFERENCES funcoes_responsabilidade(id_funcao),
    ordem_substituicao INTEGER DEFAULT 1,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    id_ato_designacao INTEGER REFERENCES atos_administrativos(id_ato),
    id_ato_revogacao INTEGER REFERENCES atos_administrativos(id_ato),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS afastamentos (
    id_afastamento SERIAL PRIMARY KEY,
    id_mandato INTEGER NOT NULL REFERENCES mandatos(id_mandato),
    motivo TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_datas_afastamento CHECK (data_fim >= data_inicio)
);

CREATE TABLE IF NOT EXISTS exercicios_substituicao (
    id_exercicio SERIAL PRIMARY KEY,
    id_afastamento INTEGER NOT NULL REFERENCES afastamentos(id_afastamento),
    id_designacao INTEGER NOT NULL REFERENCES designacoes_substituicao(id_designacao),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_datas_exercicio CHECK (data_fim >= data_inicio)
);

-- =========================================================================
-- 4. TRILHA DE AUDITORIA E TRIGGERS
-- =========================================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_auditoria SERIAL PRIMARY KEY,
    tabela_nome TEXT NOT NULL,
    registro_id INTEGER NOT NULL,
    operacao TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    ip_origem TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION func_auditoria_trigger() RETURNS TRIGGER AS $$
DECLARE
    v_usuario_id VARCHAR;
    v_json_new JSONB;
    v_json_old JSONB;
    v_id INTEGER;
BEGIN
    BEGIN
        v_usuario_id := current_setting('app.usuario_logado_id', true);
    EXCEPTION WHEN OTHERS THEN
        v_usuario_id := 'SISTEMA';
    END;

    IF v_usuario_id IS NULL OR v_usuario_id = '' THEN
        v_usuario_id := 'SISTEMA';
    END IF;

    IF (TG_OP = 'DELETE') THEN
        v_json_old := row_to_json(OLD)::jsonb;
        v_id := COALESCE((v_json_old->>'id_pessoa')::INT, (v_json_old->>'id_mandato')::INT, (v_json_old->>'id_designacao')::INT, (v_json_old->>'id_unidade')::INT, (v_json_old->>'id_cargo')::INT, 0);
        
        INSERT INTO auditoria_log (tabela_nome, registro_id, operacao, usuario_id, dados_anteriores)
        VALUES (TG_TABLE_NAME, v_id, 'DELETE', v_usuario_id, v_json_old);
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        v_json_old := row_to_json(OLD)::jsonb;
        v_json_new := row_to_json(NEW)::jsonb;
        v_id := COALESCE((v_json_new->>'id_pessoa')::INT, (v_json_new->>'id_mandato')::INT, (v_json_new->>'id_designacao')::INT, (v_json_new->>'id_unidade')::INT, (v_json_new->>'id_cargo')::INT, 0);
        
        INSERT INTO auditoria_log (tabela_nome, registro_id, operacao, usuario_id, dados_anteriores, dados_novos)
        VALUES (TG_TABLE_NAME, v_id, 'UPDATE', v_usuario_id, v_json_old, v_json_new);
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        v_json_new := row_to_json(NEW)::jsonb;
        v_id := COALESCE((v_json_new->>'id_pessoa')::INT, (v_json_new->>'id_mandato')::INT, (v_json_new->>'id_designacao')::INT, (v_json_new->>'id_unidade')::INT, (v_json_new->>'id_cargo')::INT, 0);
        
        INSERT INTO auditoria_log (tabela_nome, registro_id, operacao, usuario_id, dados_novos)
        VALUES (TG_TABLE_NAME, v_id, 'INSERT', v_usuario_id, v_json_new);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_pessoas ON pessoas;
CREATE TRIGGER trg_auditoria_pessoas AFTER INSERT OR UPDATE OR DELETE ON pessoas FOR EACH ROW EXECUTE PROCEDURE func_auditoria_trigger();

DROP TRIGGER IF EXISTS trg_auditoria_mandatos ON mandatos;
CREATE TRIGGER trg_auditoria_mandatos AFTER INSERT OR UPDATE OR DELETE ON mandatos FOR EACH ROW EXECUTE PROCEDURE func_auditoria_trigger();

DROP TRIGGER IF EXISTS trg_auditoria_designacoes_substituicao ON designacoes_substituicao;
CREATE TRIGGER trg_auditoria_designacoes_substituicao AFTER INSERT OR UPDATE OR DELETE ON designacoes_substituicao FOR EACH ROW EXECUTE PROCEDURE func_auditoria_trigger();

-- =========================================================================
-- 5. ÍNDICES DE PERFORMANCE
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_pessoas_cpf ON pessoas(cpf);
CREATE INDEX IF NOT EXISTS idx_mandatos_datas ON mandatos(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_mandatos_pessoa ON mandatos(id_pessoa);
CREATE INDEX IF NOT EXISTS idx_afastamentos_datas ON afastamentos(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_documento_vinculos ON documento_vinculos(entidade_tipo, entidade_id);
