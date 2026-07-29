-- =========================================================================
-- ORBITA-AECI: Tabela de Controle de Importações TCU
-- Versão 2.0 — Rastreabilidade e Auditoria de Cargas
-- =========================================================================

-- Tabela de controle de importação dos CSVs do TCU
-- Registra cada operação de importação para fins de auditoria e rastreabilidade
CREATE TABLE IF NOT EXISTS tcu_import_control (
    id                        BIGSERIAL PRIMARY KEY,
    modulo                    VARCHAR(50)  NOT NULL DEFAULT 'TCU_ACORDAOS',
    ano_referencia            INTEGER      NOT NULL,
    tipo_arquivo              VARCHAR(50)  NOT NULL DEFAULT 'ACORDAO_COMPLETO',
    -- ACORDAO_COMPLETO = cache-acordao-completo-{ano}.csv (dados abertos TCU)
    -- FILTRADO_LOCAL   = Acórdãos{ano}.csv (exportado do portal do órgão)
    url_fonte                 TEXT,
    nome_arquivo              TEXT,
    tamanho_bytes             BIGINT,
    hash_arquivo              TEXT,          -- SHA-256 do arquivo baixado
    quantidade_linhas_csv     INTEGER,
    quantidade_inseridos      INTEGER        DEFAULT 0,
    quantidade_atualizados    INTEGER        DEFAULT 0,
    quantidade_ignorados      INTEGER        DEFAULT 0,
    quantidade_erros          INTEGER        DEFAULT 0,
    status                    VARCHAR(50)   NOT NULL DEFAULT 'INICIADO',
    -- INICIADO | BAIXANDO | PROCESSANDO | CONCLUIDO | ERRO | PARCIAL
    eh_historico              BOOLEAN        DEFAULT FALSE,
    data_fechamento_historico DATE,          -- Preenchido quando o ano passa para histórico
    forcado_por_usuario       TEXT,          -- NULL = automático; id do usuário se manual
    data_inicio               TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    data_fim                  TIMESTAMP,
    erro_detalhe              TEXT,          -- Stack trace em caso de falha
    observacoes               TEXT,
    created_at                TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Índices de performance e consulta
CREATE INDEX IF NOT EXISTS idx_import_control_ano     ON tcu_import_control(ano_referencia);
CREATE INDEX IF NOT EXISTS idx_import_control_modulo  ON tcu_import_control(modulo);
CREATE INDEX IF NOT EXISTS idx_import_control_status  ON tcu_import_control(status);
CREATE INDEX IF NOT EXISTS idx_import_control_data    ON tcu_import_control(data_inicio DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION fn_update_import_control_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_import_control_updated_at ON tcu_import_control;
CREATE TRIGGER trg_import_control_updated_at
    BEFORE UPDATE ON tcu_import_control
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_import_control_timestamp();

-- View auxiliar: últimas importações por módulo/ano
CREATE OR REPLACE VIEW vw_import_status AS
SELECT
    modulo,
    ano_referencia,
    eh_historico,
    status,
    quantidade_inseridos,
    quantidade_atualizados,
    quantidade_erros,
    data_inicio,
    data_fim,
    EXTRACT(EPOCH FROM (data_fim - data_inicio))::INTEGER AS duracao_segundos,
    CASE
        WHEN data_fim IS NULL THEN NULL
        ELSE ROUND(EXTRACT(EPOCH FROM (data_fim - data_inicio)) / 60, 1)
    END AS duracao_minutos,
    forcado_por_usuario,
    observacoes
FROM tcu_import_control
WHERE id IN (
    SELECT MAX(id)
    FROM tcu_import_control
    GROUP BY modulo, ano_referencia
)
ORDER BY modulo, ano_referencia DESC;
