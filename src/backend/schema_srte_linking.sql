-- =============================================================================
-- ORBITA-AECI: Tabelas de Cruzamento SRTE ↔ Demandas
-- Motor de vinculação: Acórdãos TCU, Comunicações, TCEs e CGU por SRTE/UF
-- =============================================================================

-- Extensão para normalização de acentos em buscas textuais
CREATE EXTENSION IF NOT EXISTS unaccent;

-- -----------------------------------------------------------------------------
-- 1. Tabela de vínculos SRTE ↔ Acórdão TCU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS srte_acordao (
  uf            VARCHAR(5)   NOT NULL,
  acordao_key   VARCHAR(255) NOT NULL,
  motivo_vinculo VARCHAR(50)  DEFAULT 'TEXTO',
  criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uf, acordao_key)
);
CREATE INDEX IF NOT EXISTS idx_srte_acordao_uf  ON srte_acordao(uf);
CREATE INDEX IF NOT EXISTS idx_srte_acordao_key ON srte_acordao(acordao_key);

-- -----------------------------------------------------------------------------
-- 2. Tabela de vínculos SRTE ↔ Comunicação (Ofício)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS srte_comunicacao (
  uf              VARCHAR(5)   NOT NULL,
  comunicacao_key VARCHAR(255) NOT NULL,
  motivo_vinculo  VARCHAR(50)  DEFAULT 'DESTINATARIO',
  criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uf, comunicacao_key)
);
CREATE INDEX IF NOT EXISTS idx_srte_comunicacao_uf  ON srte_comunicacao(uf);

-- -----------------------------------------------------------------------------
-- 3. Tabela de vínculos SRTE ↔ TCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS srte_tce (
  uf            VARCHAR(5)   NOT NULL,
  tce_id        VARCHAR(255) NOT NULL,
  motivo_vinculo VARCHAR(50)  DEFAULT 'TEXTO',
  criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uf, tce_id)
);
CREATE INDEX IF NOT EXISTS idx_srte_tce_uf ON srte_tce(uf);

-- -----------------------------------------------------------------------------
-- 4. Tabela de vínculos SRTE ↔ Demanda CGU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS srte_cgu (
  uf            VARCHAR(5)   NOT NULL,
  cgu_id        VARCHAR(255) NOT NULL,
  motivo_vinculo VARCHAR(50)  DEFAULT 'UNIDADE',
  criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (uf, cgu_id)
);
CREATE INDEX IF NOT EXISTS idx_srte_cgu_uf ON srte_cgu(uf);

-- -----------------------------------------------------------------------------
-- 5. View de Métricas do Dashboard SRTE (usada em superintendenciasRoutes.ts)
--    Conta quantas demandas de cada tipo cada SRTE possui via JOIN nas tabelas
--    de vínculo acima. Substituição da contagem manual ineficiente.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_srte_dashboard_metrics AS
SELECT
  s.uf,
  COUNT(DISTINCT sa.acordao_key)     AS demandas_tcu,
  COUNT(DISTINCT sc.comunicacao_key) AS demandas_comunicacoes,
  COUNT(DISTINCT st.tce_id)          AS demandas_tces,
  COUNT(DISTINCT sg.cgu_id)          AS demandas_cgu
FROM superintendencias s
LEFT JOIN srte_acordao   sa ON sa.uf = s.uf
LEFT JOIN srte_comunicacao sc ON sc.uf = s.uf
LEFT JOIN srte_tce       st ON st.uf = s.uf
LEFT JOIN srte_cgu       sg ON sg.uf = s.uf
GROUP BY s.uf;
