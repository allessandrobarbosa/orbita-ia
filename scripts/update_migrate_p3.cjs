const fs = require('fs');

let migrateContent = fs.readFileSync('scripts/migrate_to_pg.ts', 'utf8');
const injectionPoint = "await client.query('COMMIT');";

const p3Migration = `
    // === MIGRAÇÃO CONTRATOS ===
    console.log(\`Migrando \${data.contratos?.length || 0} Contratos...\`);
    for (const c of (data.contratos || [])) {
      await client.query(\`
        INSERT INTO contratos (id, numero_contrato, empresa, cnpj, objeto, valor_anual, data_inicio, data_fim, uf)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      \`, [c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorAnual, c.dataInicio, c.dataFim, c.uf]);
    }
    
    console.log(\`Migrando \${data.contratosConsumoMensal?.length || 0} Consumos de Contratos...\`);
    for (const c of (data.contratosConsumoMensal || [])) {
      await client.query(\`
        INSERT INTO contratos_consumo_mensal (id, contrato_id, mes, valor_consumido, fatura_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      \`, [c.id, c.contratoId, c.mes, c.valorConsumido, c.faturaUrl]);
    }

    // === MIGRAÇÃO VIATURAS ===
    console.log(\`Migrando \${data.viaturas?.length || 0} Viaturas...\`);
    for (const v of (data.viaturas || [])) {
      await client.query(\`
        INSERT INTO viaturas (id, placa, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      \`, [v.id, v.placa, v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status]);
    }

    console.log(\`Migrando \${data.viaturasAbastecimentos?.length || 0} Abastecimentos de Viaturas...\`);
    for (const a of (data.viaturasAbastecimentos || [])) {
      await client.query(\`
        INSERT INTO viaturas_abastecimentos (id, viatura_id, data_abastecimento, km, litros, valor_total, posto)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      \`, [a.id, a.viaturaId, a.dataAbastecimento, a.km, a.litros, a.valorTotal, a.posto]);
    }

    console.log(\`Migrando \${data.viaturasManutencoes?.length || 0} Manutenções de Viaturas...\`);
    for (const m of (data.viaturasManutencoes || [])) {
      await client.query(\`
        INSERT INTO viaturas_manutencoes (id, viatura_id, data_manutencao, tipo_manutencao, descricao, km_manutencao, valor, proxima_revisao_km)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      \`, [m.id, m.viaturaId, m.dataManutencao, m.tipoManutencao, m.descricao, m.kmManutencao, m.valor, m.proximaRevisaoKm]);
    }
`;

if (!migrateContent.includes('MIGRAÇÃO CONTRATOS')) {
  migrateContent = migrateContent.replace(injectionPoint, p3Migration + "\n    " + injectionPoint);
  fs.writeFileSync('scripts/migrate_to_pg.ts', migrateContent);
  console.log("Updated migrate_to_pg.ts with Phase 3 migrations.");
} else {
  console.log("Already updated migrate_to_pg.ts");
}
