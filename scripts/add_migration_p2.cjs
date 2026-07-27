const fs = require('fs');

let content = fs.readFileSync('scripts/migrate_to_pg.ts', 'utf8');

const injectionPoint = "await client.query('COMMIT');";
const p2Logic = `
    // === MIGRAÇÃO COMUNICAÇÕES ===
    console.log(\`Migrando \${data.comunicacoes?.length || 0} Comunicações (Ofícios)...\`);
    for (const c of (data.comunicacoes || [])) {
      await client.query(\`
        INSERT INTO comunicacoes_demands (
          key, comunicacao, destinatario, contato, unidade_emitente, processo,
          data_expedicao, data_resposta, ano, carece_resposta, prazo_dias,
          resposta_enviada_internamente, unidade_executora, processo_sei, destinacao,
          ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (key) DO NOTHING
      \`, [
        c.KEY, c.COMUNICACAO, c.DESTINATARIO, c.CONTATO, c.UNIDADE_EMITENTE, c.PROCESSO,
        c.DATA_EXPEDICAO, c.DATA_RESPOSTA, c.ANO, c.CARECE_RESPOSTA, c.PRAZO_DIAS,
        c.RESPOSTA_ENVIADA_INTERNAMENTE, c.UNIDADE_EXECUTORA, c.PROCESSO_SEI, c.DESTINACAO,
        c.ULTIMA_ATUALIZACAO
      ]);
    }

    // === MIGRAÇÃO CGU ===
    console.log(\`Migrando \${data.cgu?.length || 0} Demandas da CGU...\`);
    for (const cgu of (data.cgu || [])) {
      await client.query(\`
        INSERT INTO cgu_demands (
          id_tarefa, situacao, estado, titulo_tarefa, data_inicio, data_fim, data_limite,
          unidade_auditada, unidades_auditoria, texto_monitoramento, providencia,
          tipo_ultima_manifestacao, texto_ultima_manifestacao, data_ultima_manifestacao,
          tipo_ultimo_posicionamento, texto_ultimo_posicionamento, data_ultimo_posicionamento,
          categoria, data_limite_inicial, ano, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (id_tarefa) DO NOTHING
      \`, [
        cgu.idTarefa, cgu.situacao, cgu.estado, cgu.tituloTarefa, cgu.dataInicio, cgu.dataFim, cgu.dataLimite,
        cgu.unidadeAuditada, cgu.unidadesAuditoria, cgu.textoMonitoramento, cgu.providencia,
        cgu.tipoUltimaManifestacao, cgu.textoUltimaManifestacao, cgu.dataUltimaManifestacao,
        cgu.tipoUltimoPosicionamento, cgu.textoUltimoPosicionamento, cgu.dataUltimoPosicionamento,
        cgu.categoria, cgu.dataLimiteInicial, cgu.ano, cgu.ultimaAtualizacao
      ]);
    }

    console.log(\`Migrando \${data.cguReports?.length || 0} Relatórios da CGU...\`);
    for (const rep of (data.cguReports || [])) {
      await client.query(\`
        INSERT INTO cgu_reports (
          id_tarefa, id_auditoria, titulo_auditoria, ano, uf, municipio, codigo_municipio,
          assunto, data_publicacao, link_relatorio, local_pdf, sumario_executivo, ai_abstract, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) ON CONFLICT (id_tarefa) DO NOTHING
      \`, [
        rep.idTarefa, rep.idAuditoria, rep.tituloAuditoria, rep.ano, rep.uf, rep.municipio, rep.codigoMunicipio,
        rep.assunto, rep.dataPublicacao, rep.linkRelatorio, rep.localPdf, rep.sumarioExecutivo, rep.aiAbstract, rep.ultimaAtualizacao
      ]);
    }

    // === MIGRAÇÃO SUPERINTENDÊNCIAS ===
    console.log(\`Migrando \${data.superintendencias?.length || 0} Superintendências...\`);
    for (const srte of (data.superintendencias || [])) {
      await client.query(\`
        INSERT INTO superintendencias (
          uf, capital, superintendente, cargo, endereco, contato, email, substituto, email_substituto,
          cep, latitude, longitude, demandas_tcu, demandas_cgu, demandas_etica, status_geral
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (uf) DO NOTHING
      \`, [
        srte.uf, srte.capital, srte.superintendente, srte.cargo, srte.endereco, srte.contato, srte.email, srte.substituto, srte.emailSubstituto,
        srte.cep, srte.latitude, srte.longitude, srte.demandasTCU, srte.demandasCGU, srte.demandasEtica, srte.statusGeral
      ]);
    }

    // === MIGRAÇÃO ETICA ===
    console.log(\`Migrando Etica...\`);
    for (const p of (data.eticaProcessos || [])) {
      await client.query(\`
        INSERT INTO etica_processos (
          id, tipo, processo_sei, data_inicio, data_fim, resumo, responsavel, situacao, solicitante, assunto, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING
      \`, [p.id, p.tipo, p.processoSei, p.dataInicio, p.dataFim, p.resumo, p.responsavel, p.situacao, p.solicitante, p.assunto, p.ultimaAtualizacao]);
    }

    for (const r of (data.eticaReunioes || [])) {
      await client.query(\`
        INSERT INTO etica_reunioes (
          id, tipo, data_hora, pauta, confirmacoes, notificado_agendamento, notificado_lembrete, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING
      \`, [r.id, r.tipo, r.dataHora, r.pauta, JSON.stringify(r.confirmacoes || {}), r.notificadoAgendamento, r.notificadoLembrete, r.ultimaAtualizacao]);
      
      for (const c of (r.convidados || [])) {
        await client.query(\`
          INSERT INTO etica_convidados (reuniao_id, nome, encargo, email, telefone)
          VALUES ($1, $2, $3, $4, $5)
        \`, [r.id, c.nome, c.encargo, c.email, c.telefone]);
      }
    }

    for (const a of (data.eticaAtas || [])) {
      await client.query(\`
        INSERT INTO etica_atas (
          id, reuniao_id, relatos, decisoes, data_geracao, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING
      \`, [a.id, a.reuniaoId, a.relatos, a.decisoes, a.dataGeracao, a.ultimaAtualizacao]);
    }
`;

content = content.replace(injectionPoint, p2Logic + "\n    " + injectionPoint);

fs.writeFileSync('scripts/migrate_to_pg.ts', content);
console.log("Migration script updated.");
