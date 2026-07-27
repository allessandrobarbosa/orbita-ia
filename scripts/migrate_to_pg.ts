import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup ES modules compat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://airflow:airflow@localhost:5432/postgres",
});

const DB_PATH = path.join(__dirname, '../data/orbita_db.json');
const SCHEMA_PATH = path.join(__dirname, '../src/backend/schema.sql');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Iniciando migração de banco de dados (JSON -> PostgreSQL)...");
    
    // 1. Criar Schema
    console.log("Executando schema.sql...");
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    await client.query(schemaSql);
    console.log("Tabelas criadas com sucesso.");

    // 2. Ler JSON
    console.log("Lendo data/orbita_db.json...");
    if (!fs.existsSync(DB_PATH)) {
        throw new Error("Arquivo orbita_db.json não encontrado.");
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8').replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);

    // 3. Iniciar Transação
    await client.query('BEGIN');

    // === MIGRAÇÃO TCU ===
    console.log(`Migrando ${data.acordaos?.length || 0} Acórdãos...`);
    for (const ac of (data.acordaos || [])) {
      await client.query(`
        INSERT INTO tcu_acordaos (
          key, titulo, num_acordao, ano_acordao, num_ata, colegiado, data_sessao,
          situacao, proc, acordaos_relacionados, tipo_processo, interessados,
          entidade, unidade_tecnica, relator, assunto, sumario, acordao, decisao,
          recomendacoes, determinacoes, recomendacoes_determinacoes_unificado,
          status_monitoramento, responsavel_interno, prazo_limite, observacoes,
          ultima_atualizacao, ai_analysis_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
        ) ON CONFLICT (key) DO NOTHING
      `, [
        ac.KEY, ac.TITULO, ac.NUMACORDAO, ac.ANOACORDAO, ac.NUMATA, ac.COLEGIADO, ac.DATASESSAO,
        ac.SITUACAO, ac.PROC, ac.ACORDAOSRELACIONADOS, ac.TIPOPROCESSO, ac.INTERESSADOS,
        ac.ENTIDADE, ac.UNIDADETECNICA, ac.RELATOR, ac.ASSUNTO, ac.SUMARIO, ac.ACORDAO, ac.DECISAO,
        ac.RECOMENDACOES, ac.DETERMINACOES, ac.RECOMENDACOES_DETERMINACOES_UNIFICADO,
        ac.STATUS_MONITORAMENTO, ac.RESPONSAVEL_INTERNO, ac.PRAZO_LIMITE, ac.OBSERVACOES,
        ac.ULTIMA_ATUALIZACAO,
        ac.aiAnalysisData ? JSON.stringify(ac.aiAnalysisData) : null
      ]);
    }

    console.log(`Migrando ${data.comunicacoes?.length || 0} Comunicações...`);
    for (const c of (data.comunicacoes || [])) {
      await client.query(`
        INSERT INTO tcu_comunicacoes (
          key, comunicacao, destinatario, contato, unidade_emitente, processo,
          data_expedicao, data_resposta, ano, carece_resposta, prazo_dias,
          resposta_enviada_internamente, unidade_executora, processo_sei, destinacao,
          ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (key) DO NOTHING
      `, [
        c.KEY, c.COMUNICACAO, c.DESTINATARIO, c.CONTATO, c.UNIDADE_EMITENTE, c.PROCESSO,
        c.DATA_EXPEDICAO, c.DATA_RESPOSTA, c.ANO, c.CARECE_RESPOSTA, c.PRAZO_DIAS,
        c.RESPOSTA_ENVIADA_INTERNAMENTE, c.UNIDADE_EXECUTORA, c.PROCESSO_SEI, c.DESTINACAO,
        c.ULTIMA_ATUALIZACAO
      ]);
    }

    console.log(`Migrando ${data.tces?.length || 0} TCEs...`);
    for (const t of (data.tces || [])) {
      await client.query(`
        INSERT INTO tcu_tce (
          id, numero_ano_tce, processo_administrativo, motivo_instauracao, submotivo_instauracao,
          debito_original, debito_atualizado, data_atualizacao_debito, ultimo_posicionamento,
          tc, estado_processo, situacao_processo, primeiro_julgamento, encerramento,
          numero_siafi, siafi_ressarcido, ano
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) ON CONFLICT (id) DO NOTHING
      `, [
        t.id, t.NUMERO_ANO_TCE, t.PROCESSO_ADMINISTRATIVO, t.MOTIVO_INSTAURACAO, t.SUBMOTIVO_INSTAURACAO,
        t.DEBITO_ORIGINAL, t.DEBITO_ATUALIZADO, t.DATA_ATUALIZACAO_DEBITO, t.ULTIMO_POSICIONAMENTO,
        t.TC, t.ESTADO_PROCESSO, t.SITUACAO_PROCESSO, t.PRIMEIRO_JULGAMENTO, t.ENCERRAMENTO,
        t.NUMERO_SIAFI, t.SIAFI_RESSARCIDO, t.ANO
      ]);
    }

    console.log(`Migrando ${data.tceAcordaoMappings?.length || 0} Mapeamentos TCE x Acórdão...`);
    for (const m of (data.tceAcordaoMappings || [])) {
      await client.query(`
        INSERT INTO tcu_tce_acordao_mapping (numero_ano_tce, acordao_key)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [m.NUMERO_ANO_TCE, m.ACORDAO_KEY]);
    }


    // === MIGRAÇÃO ROL ===
    console.log(`Migrando ${data.unidadesRol?.length || 0} Unidades do ROL...`);
    for (const u of (data.unidadesRol || [])) {
      await client.query(`
        INSERT INTO rol_unidades (id, nome, sigla)
        VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING
      `, [u.id, u.nome, u.sigla]);
    }

    console.log(`Migrando ${data.dirigentes?.length || 0} Dirigentes...`);
    for (const d of (data.dirigentes || [])) {
      await client.query(`
        INSERT INTO rol_dirigentes (id, nome, cpf, email, status)
        VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING
      `, [d.id, d.nome, d.cpf, d.email, d.status]);
    }

    console.log(`Migrando ${data.dirigentesCargos?.length || 0} Cargos de Dirigentes...`);
    for (const dc of (data.dirigentesCargos || [])) {
      await client.query(`
        INSERT INTO rol_dirigentes_cargos (
          id, dirigente_id, unidade_id, cargo, tipo_vinculo, 
          inicio_exercicio, fim_exercicio, ato_nomeacao, ato_exoneracao, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING
      `, [
        dc.id, dc.dirigenteId, dc.unidadeId, dc.cargo, dc.tipoVinculo,
        dc.inicioExercicio, dc.fimExercicio, dc.atoNomeacao, dc.atoExoneracao, dc.status
      ]);
    }

    console.log(`Migrando ${data.dirigentesEventos?.length || 0} Eventos (Afastamentos)...`);
    for (const de of (data.dirigentesEventos || [])) {
      await client.query(`
        INSERT INTO rol_dirigentes_eventos (
          id, dirigente_id, cargo_id, data_inicio, data_fim, 
          motivo, ato_autorizacao, substituto_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING
      `, [
        de.id, de.dirigenteId, de.cargoId, de.dataInicio, de.dataFim,
        de.motivo, de.atoAutorizacao, de.substitutoId || null
      ]);
    }

    console.log(`Migrando ${data.rolResponsaveis?.length || 0} Rol (Legado)...`);
    for (const rl of (data.rolResponsaveis || [])) {
      await client.query(`
        INSERT INTO rol_responsaveis_legado (
          id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status, observacoes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING
      `, [
        rl.id, rl.nome, rl.cpf, rl.cargo, rl.unidade, rl.inicioExercicio, rl.fimExercicio, 
        rl.atoNomeacao, rl.status, rl.observacoes
      ]);
    }

    
    // === MIGRAÇÃO COMUNICAÇÕES ===
    console.log(`Migrando ${data.comunicacoes?.length || 0} Comunicações (Ofícios)...`);
    for (const c of (data.comunicacoes || [])) {
      await client.query(`
        INSERT INTO comunicacoes_demands (
          key, comunicacao, destinatario, contato, unidade_emitente, processo,
          data_expedicao, data_resposta, ano, carece_resposta, prazo_dias,
          resposta_enviada_internamente, unidade_executora, processo_sei, destinacao,
          ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (key) DO NOTHING
      `, [
        c.KEY, c.COMUNICACAO, c.DESTINATARIO, c.CONTATO, c.UNIDADE_EMITENTE, c.PROCESSO,
        c.DATA_EXPEDICAO, c.DATA_RESPOSTA, c.ANO, c.CARECE_RESPOSTA, c.PRAZO_DIAS,
        c.RESPOSTA_ENVIADA_INTERNAMENTE, c.UNIDADE_EXECUTORA, c.PROCESSO_SEI, c.DESTINACAO,
        c.ULTIMA_ATUALIZACAO
      ]);
    }

    // === MIGRAÇÃO CGU ===
    console.log(`Migrando ${data.cgu?.length || 0} Demandas da CGU...`);
    for (const cgu of (data.cgu || [])) {
      await client.query(`
        INSERT INTO cgu_demands (
          id_tarefa, situacao, estado, titulo_tarefa, data_inicio, data_fim, data_limite,
          unidade_auditada, unidades_auditoria, texto_monitoramento, providencia,
          tipo_ultima_manifestacao, texto_ultima_manifestacao, data_ultima_manifestacao,
          tipo_ultimo_posicionamento, texto_ultimo_posicionamento, data_ultimo_posicionamento,
          categoria, data_limite_inicial, ano, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) ON CONFLICT (id_tarefa) DO NOTHING
      `, [
        cgu.idTarefa, cgu.situacao, cgu.estado, cgu.tituloTarefa, cgu.dataInicio, cgu.dataFim, cgu.dataLimite,
        cgu.unidadeAuditada, cgu.unidadesAuditoria, cgu.textoMonitoramento, cgu.providencia,
        cgu.tipoUltimaManifestacao, cgu.textoUltimaManifestacao, cgu.dataUltimaManifestacao,
        cgu.tipoUltimoPosicionamento, cgu.textoUltimoPosicionamento, cgu.dataUltimoPosicionamento,
        cgu.categoria, cgu.dataLimiteInicial, cgu.ano, cgu.ultimaAtualizacao
      ]);
    }

    console.log(`Migrando ${data.cguReports?.length || 0} Relatórios da CGU...`);
    for (const rep of (data.cguReports || [])) {
      await client.query(`
        INSERT INTO cgu_reports (
          id_tarefa, id_auditoria, titulo_auditoria, ano, uf, municipio, codigo_municipio,
          assunto, data_publicacao, link_relatorio, local_pdf, sumario_executivo, ai_abstract, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) ON CONFLICT (id_tarefa) DO NOTHING
      `, [
        rep.idTarefa, rep.idAuditoria, rep.tituloAuditoria, rep.ano, rep.uf, rep.municipio, rep.codigoMunicipio,
        rep.assunto, rep.dataPublicacao, rep.linkRelatorio, rep.localPdf, rep.sumarioExecutivo, rep.aiAbstract, rep.ultimaAtualizacao
      ]);
    }

    // === MIGRAÇÃO SUPERINTENDÊNCIAS ===
    console.log(`Migrando ${data.superintendencias?.length || 0} Superintendências...`);
    for (const srte of (data.superintendencias || [])) {
      await client.query(`
        INSERT INTO superintendencias (
          uf, capital, superintendente, cargo, endereco, contato, email, substituto, email_substituto,
          cep, latitude, longitude, demandas_tcu, demandas_cgu, demandas_etica, status_geral
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (uf) DO NOTHING
      `, [
        srte.uf, srte.capital, srte.superintendente, srte.cargo, srte.endereco, srte.contato, srte.email, srte.substituto, srte.emailSubstituto,
        srte.cep, srte.latitude, srte.longitude, srte.demandasTCU, srte.demandasCGU, srte.demandasEtica, srte.statusGeral
      ]);
    }

    // === MIGRAÇÃO ETICA ===
    console.log(`Migrando Etica...`);
    for (const p of (data.eticaProcessos || [])) {
      await client.query(`
        INSERT INTO etica_processos (
          id, tipo, processo_sei, data_inicio, data_fim, resumo, responsavel, situacao, solicitante, assunto, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING
      `, [p.id, p.tipo, p.processoSei, p.dataInicio, p.dataFim, p.resumo, p.responsavel, p.situacao, p.solicitante, p.assunto, p.ultimaAtualizacao]);
    }

    for (const r of (data.eticaReunioes || [])) {
      await client.query(`
        INSERT INTO etica_reunioes (
          id, tipo, data_hora, pauta, confirmacoes, notificado_agendamento, notificado_lembrete, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING
      `, [r.id, r.tipo, r.dataHora, r.pauta, JSON.stringify(r.confirmacoes || {}), r.notificadoAgendamento, r.notificadoLembrete, r.ultimaAtualizacao]);
      
      for (const c of (r.convidados || [])) {
        await client.query(`
          INSERT INTO etica_convidados (reuniao_id, nome, encargo, email, telefone)
          VALUES ($1, $2, $3, $4, $5)
        `, [r.id, c.nome, c.encargo, c.email, c.telefone]);
      }
    }

    for (const a of (data.eticaAtas || [])) {
      await client.query(`
        INSERT INTO etica_atas (
          id, reuniao_id, relatos, decisoes, data_geracao, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING
      `, [a.id, a.reuniaoId, a.relatos, a.decisoes, a.dataGeracao, a.ultimaAtualizacao]);
    }

    
    // === MIGRAÇÃO SCDP ===
    console.log(`Migrando ${data.viagensScdp?.length || 0} Viagens SCDP...`);
    for (const v of (data.viagensScdp || [])) {
      await client.query(`
        INSERT INTO scdp_viagens (
          id, nome_viajante, cpf_viajante, siape_viajante, email_viajante, data_inicio, data_fim,
          destino, motivo_viagem, valor_passagem, valor_diarias, siafi_gru_devolucao_confirmada,
          siafi_detalhes_status, siafi_confirmado, siafi_scdp_divergencia, ultima_atualizacao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (id) DO NOTHING
      `, [
        v.id, v.nomeViajante, v.cpfViajante, v.siapeViajante, v.emailViajante, v.dataInicio, v.dataFim,
        v.destino, v.motivoViagem, v.valorPassagem, v.valorDiarias, v.siafiGruDevolucaoConfirmada,
        v.siafiDetalhesStatus, v.siafiConfirmado, v.siafiScdpDivergencia, v.ultimaAtualizacao
      ]);
    }

    
    // === MIGRAÇÃO CONTRATOS ===
    console.log(`Migrando ${data.contratos?.length || 0} Contratos...`);
    for (const c of (data.contratos || [])) {
      await client.query(`
        INSERT INTO contratos (id, numero_contrato, empresa, cnpj, objeto, valor_anual, data_inicio, data_fim, uf)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorAnual, c.dataInicio, c.dataFim, c.uf]);
    }
    
    console.log(`Migrando ${data.contratosConsumoMensal?.length || 0} Consumos de Contratos...`);
    for (const c of (data.contratosConsumoMensal || [])) {
      await client.query(`
        INSERT INTO contratos_consumo_mensal (id, contrato_id, mes, valor_consumido, fatura_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [c.id, c.contratoId, c.mes, c.valorConsumido, c.faturaUrl]);
    }

    // === MIGRAÇÃO VIATURAS ===
    console.log(`Migrando ${data.viaturas?.length || 0} Viaturas...`);
    for (const v of (data.viaturas || [])) {
      await client.query(`
        INSERT INTO viaturas (id, placa, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [v.id, v.placa, v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status]);
    }

    console.log(`Migrando ${data.viaturasAbastecimentos?.length || 0} Abastecimentos de Viaturas...`);
    for (const a of (data.viaturasAbastecimentos || [])) {
      await client.query(`
        INSERT INTO viaturas_abastecimentos (id, viatura_id, data_abastecimento, km, litros, valor_total, posto)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [a.id, a.viaturaId, a.dataAbastecimento, a.km, a.litros, a.valorTotal, a.posto]);
    }

    console.log(`Migrando ${data.viaturasManutencoes?.length || 0} Manutenções de Viaturas...`);
    for (const m of (data.viaturasManutencoes || [])) {
      await client.query(`
        INSERT INTO viaturas_manutencoes (id, viatura_id, data_manutencao, tipo_manutencao, descricao, km_manutencao, valor, proxima_revisao_km)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [m.id, m.viaturaId, m.dataManutencao, m.tipoManutencao, m.descricao, m.kmManutencao, m.valor, m.proximaRevisaoKm]);
    }

    await client.query('COMMIT');
    console.log("=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("ERRO DURANTE MIGRAÇÃO. Rollback realizado.", err);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
