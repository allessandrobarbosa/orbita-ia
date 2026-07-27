const fs = require('fs');
const { execSync } = require('child_process');

// 1. Create the schema append for SCDP
const schemaSql = `
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
`;

fs.appendFileSync('src/backend/schema.sql', schemaSql);

// Execute schema in postgres
try {
  execSync('docker exec data-application-gov-hub-postgres-1 psql -U postgres -d postgres -c "' + schemaSql.replace(/"/g, '\\"') + '"', { stdio: 'inherit' });
  console.log("SCDP schema created in database.");
} catch (e) {
  console.log("Error executing schema in docker, maybe it should be run manually or via migrate script:", e.message);
}

// 2. Append migration logic to migrate_to_pg.ts
let migrateContent = fs.readFileSync('scripts/migrate_to_pg.ts', 'utf8');

const injectionPoint = "await client.query('COMMIT');";
const scdpMigration = `
    // === MIGRAÇÃO SCDP ===
    console.log(\`Migrando \${data.viagensScdp?.length || 0} Viagens SCDP...\`);
    for (const v of (data.viagensScdp || [])) {
      await client.query(\`
        INSERT INTO scdp_viagens (
          id, nome_viajante, cpf_viajante, siape_viajante, email_viajante, data_inicio, data_fim,
          destino, motivo_viagem, valor_passagem, valor_diarias, siafi_gru_devolucao_confirmada,
          siafi_detalhes_status, siafi_confirmado, siafi_scdp_divergencia, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (id) DO NOTHING
      \`, [
        v.id, v.nomeViajante, v.cpfViajante, v.siapeViajante, v.emailViajante, v.dataInicio, v.dataFim,
        v.destino, v.motivoViagem, v.valorPassagem, v.valorDiarias, v.siafiGruDevolucaoConfirmada,
        v.siafiDetalhesStatus, v.siafiConfirmado, v.siafiScdpDivergencia, v.ultimaAtualizacao
      ]);
    }
`;

if (!migrateContent.includes('MIGRAÇÃO SCDP')) {
  migrateContent = migrateContent.replace(injectionPoint, scdpMigration + "\n    " + injectionPoint);
  fs.writeFileSync('scripts/migrate_to_pg.ts', migrateContent);
  console.log("Migration script updated for SCDP.");
} else {
  console.log("SCDP migration logic already exists in migrate_to_pg.ts");
}
