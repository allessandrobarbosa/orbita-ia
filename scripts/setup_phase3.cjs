const fs = require('fs');
const { execSync } = require('child_process');

const schemaSql = `
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
`;

fs.appendFileSync('src/backend/schema.sql', schemaSql);

try {
  execSync('docker exec data-application-gov-hub-postgres-1 psql -U postgres -d postgres -c "' + schemaSql.replace(/"/g, '\\"') + '"', { stdio: 'inherit' });
  console.log("Schema for Contratos and Viaturas created.");
} catch (e) {
  console.log("Error running schema:", e.message);
}
