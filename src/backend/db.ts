import fs from "fs";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Trata desconexões ou reinícios do servidor PostgreSQL sem derrubar a aplicação Node.js
pool.on("error", (err) => {
  console.error("Conexão do PostgreSQL encerrada ou reconectando:", err.message);
});

export async function initDatabaseSchema() {
  try {
    const schemaPath = path.join(process.cwd(), "src", "backend", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf-8");
      await pool.query(sql);
      console.log("[DB] Schema PostgreSQL inicializado/verificado com sucesso.");
    }
    
    // Garante colunas de tabelas pré-existentes
    await pool.query(`ALTER TABLE rol_responsaveis_legado ADD COLUMN IF NOT EXISTS is_substituto BOOLEAN DEFAULT FALSE`);
    await pool.query(`ALTER TABLE etica_membros ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE`);
    await pool.query(`ALTER TABLE scdp_viagens ADD COLUMN IF NOT EXISTS cargo VARCHAR(255)`);
    await pool.query(`ALTER TABLE scdp_viagens ADD COLUMN IF NOT EXISTS situacao VARCHAR(255)`);
    await pool.query(`ALTER TABLE scdp_viagens ADD COLUMN IF NOT EXISTS viagem_urgente VARCHAR(50)`);
    await pool.query(`ALTER TABLE scdp_viagens ADD COLUMN IF NOT EXISTS justificativa_urgencia TEXT`);
    await pool.query(`ALTER TABLE scdp_viagens ADD COLUMN IF NOT EXISTS orgao_solicitante VARCHAR(255)`);
    await pool.query(`ALTER TABLE scdp_viagens ADD COLUMN IF NOT EXISTS orgao_superior VARCHAR(255)`);

    // Auto-seed para tabelas vazias (Superintendências, Rol, Contratos, etc.)
    await autoSeedIfEmpty();
  } catch (err) {
    console.error("[DB] Erro ao inicializar schema do PostgreSQL:", err);
  }
}

async function autoSeedIfEmpty() {
  try {
    // 1. Superintendências
    const supsCount = await pool.query("SELECT COUNT(*) FROM superintendencias");
    if (parseInt(supsCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando tabela superintendencias com dados iniciais...");
      for (const s of Seeds.SEED_SUPERINTENDENCIAS) {
        await pool.query(
          `INSERT INTO superintendencias (
            uf, capital, superintendente, cargo, endereco, contato, email, substituto, email_substituto, cep, latitude, longitude, status_geral
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (uf) DO NOTHING`,
          [s.uf, s.capital, s.superintendente, s.cargo, s.endereco, s.contato, s.email, s.substituto, s.emailSubstituto, s.cep, s.latitude, s.longitude, s.statusGeral || 'Regular']
        );
      }
    }

    // 2. Rol de Responsáveis Legado
    const rolCount = await pool.query("SELECT COUNT(*) FROM rol_responsaveis_legado");
    if (parseInt(rolCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando rol_responsaveis_legado...");
      for (const r of Seeds.SEED_ROL_RESPONSAVEIS) {
        await pool.query(
          `INSERT INTO rol_responsaveis_legado (
            id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status, observacoes, is_substituto
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
          [r.id, r.nome, r.cpf, r.cargo, r.unidade, r.inicioExercicio, r.fimExercicio, r.atoNomeacao, r.status, r.observacoes, false]
        );
      }
    }

    // 3. Membros Ética
    const eticaCount = await pool.query("SELECT COUNT(*) FROM etica_membros");
    if (parseInt(eticaCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando etica_membros...");
      for (const m of SEED_ETICA_MEMBROS) {
        await pool.query(
          `INSERT INTO etica_membros (id, nome, cpf, email, cargo, mandato_inicio, mandato_fim, status, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
          [m.id, m.nome, m.cpf, m.email, m.atribuicao, m.dataInicioMandato, m.dataFimMandato, m.status, m.ativo]
        );
      }
    }

    // 4. Contratos
    const contCount = await pool.query("SELECT COUNT(*) FROM contratos");
    if (parseInt(contCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando contratos...");
      for (const c of Seeds.SEED_CONTRATOS) {
        await pool.query(
          `INSERT INTO contratos (
            id, numero_contrato, empresa, cnpj, objeto, valor_global, valor_mensal, valor_anual, data_inicio, data_fim, uf, modalidade, status, uasg, link_pncp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (id) DO NOTHING`,
          [c.id, c.numeroContrato, c.empresa, c.cnpj, c.objeto, c.valorGlobal, c.valorMensal || 0, c.valorAnual || 0, c.dataInicio, c.dataFim, c.uf, c.modalidade, c.status, c.uasg, c.linkPncp]
        );
      }
    }

    // 5. Viaturas
    const viatCount = await pool.query("SELECT COUNT(*) FROM viaturas");
    if (parseInt(viatCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando viaturas...");
      for (const v of Seeds.SEED_VIATURAS) {
        await pool.query(
          `INSERT INTO viaturas (
            id, placa, marca, modelo, ano, tipo, uf, km_atual, proxima_revisao_km, status, categoria, renavam_chassi, numero_motor, alocacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (id) DO NOTHING`,
          [v.id, v.placa, v.marca, v.modelo, v.ano, v.tipo, v.uf, v.kmAtual, v.proximaRevisaoKm, v.status, v.categoria, v.renavamChassi, v.numeroMotor, v.alocacao]
        );
      }
    }

    // 6. TCU Acórdãos (se tabela estiver vazia)
    const acCount = await pool.query("SELECT COUNT(*) FROM tcu_acordaos");
    if (parseInt(acCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando tcu_acordaos com seeds...");
      for (const a of Seeds.SEED_ACORDAOS) {
        await pool.query(
          `INSERT INTO tcu_acordaos (
            key, titulo, num_acordao, ano_acordao, num_ata, colegiado, data_sessao, situacao, proc,
            acordaos_relacionados, tipo_processo, interessados, entidade, unidade_tecnica, relator,
            assunto, sumario, acordao, decisao, status_monitoramento, responsavel_interno, prazo_limite, observacoes, ultima_atualizacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (key) DO NOTHING`,
          [
            a.KEY, a.TITULO, a.NUMACORDAO, a.ANOACORDAO, a.NUMATA, a.COLEGIADO, a.DATASESSAO, a.SITUACAO, a.PROC,
            a.ACORDAOSRELACIONADOS, a.TIPOPROCESSO, a.INTERESSADOS, a.ENTIDADE, a.UNIDADETECNICA, a.RELATOR,
            a.ASSUNTO, a.SUMARIO, a.ACORDAO, a.DECISAO, a.STATUS_MONITORAMENTO, a.RESPONSAVEL_INTERNO, a.PRAZO_LIMITE,
            a.OBSERVACOES, a.ULTIMA_ATUALIZACAO
          ]
        );
      }
    }

    // 7. TCU Comunicações (se tabela estiver vazia)
    const comCount = await pool.query("SELECT COUNT(*) FROM tcu_comunicacoes");
    if (parseInt(comCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando tcu_comunicacoes com seeds...");
      for (const c of SEED_COMUNICACOES) {
        await pool.query(
          `INSERT INTO tcu_comunicacoes (
            key, comunicacao, destinatario, contato, unidade_emitente, processo, data_expedicao, data_resposta, ano,
            carece_resposta, prazo_dias, resposta_enviada_internamente, unidade_executora, processo_sei, destinacao, ultima_atualizacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (key) DO NOTHING`,
          [
            c.KEY, c.COMUNICACAO, c.DESTINATARIO, c.CONTATO, c.UNIDADEEMITENTE, c.PROCESSO, c.DATAEXPEDICAO, c.DATARESPOSTA,
            c.ANO, (c as any).CARECERSPOSTA ?? (c as any).careceResposta ?? false, c.PRAZODIAS, (c as any).RESPOSTAENVIADAINTERNAMENTE ?? (c as any).respostaEnviadaInternamente ?? false, c.UNIDADEEXECUTORA,
            c.PROCESSOSEI, c.DESTINACAO, c.ULTIMA_ATUALIZACAO
          ]
        );
      }
    }

    // 8. TCU TCEs (se tabela estiver vazia)
    const tceCount = await pool.query("SELECT COUNT(*) FROM tcu_tce");
    if (parseInt(tceCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando tcu_tce com seeds...");
      for (const t of Seeds.SEED_TCES) {
        const numAnoTce = t.numeroAnoTce || t.NUMERO_ANO_TCE || t.id;
        const procAdm = t.processoAdministrativo || t.PROCESSO_ADMINISTRATIVO || null;
        const motivo = t.motivoInstauracao || t.MOTIVO_INSTAURACAO || null;
        const submotivo = t.submotivoInstauracao || t.SUBMOTIVO_INSTAURACAO || null;
        const debOrig = t.debitoOriginal || t.DEBITO_ORIGINAL || null;
        const debAtual = t.debitoAtualizado || t.DEBITO_ATUALIZADO || null;
        const dataAtualDeb = t.dataAtualizacaoDebito || t.DATA_ATUALIZACAO_DEBITO || null;
        const ultPos = t.ultimoPosicionamento || t.ULTIMO_POSICIONAMENTO || null;
        const tc = t.tc || t.TC || null;
        const estProc = t.estadoProcesso || t.ESTADO_PROCESSO || null;
        const sitProc = t.situacaoProcesso || t.SITUACAO_PROCESSO || null;
        const primJulg = t.primeiroJulgamento || t.PRIMEIRO_JULGAMENTO || null;
        const encer = t.encerramento || t.ENCERRAMENTO || null;
        const numSiafi = t.numeroSiafi || t.NUMERO_SIAFI || null;
        const siafiRess = t.siafiRessarcido || t.SIAFI_RESSARCIDO || false;
        const ano = t.ano || t.ANO || (numAnoTce ? parseInt(numAnoTce.split("/")[1], 10) : 2023) || 2023;

        await pool.query(
          `INSERT INTO tcu_tce (
            id, numero_ano_tce, processo_administrativo, motivo_instauracao, submotivo_instauracao,
            debito_original, debito_atualizado, data_atualizacao_debito, ultimo_posicionamento, tc,
            estado_processo, situacao_processo, primeiro_julgamento, encerramento, numero_siafi, siafi_ressarcido, ano
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (id) DO NOTHING`,
          [
            t.id, numAnoTce, procAdm, motivo, submotivo,
            debOrig, debAtual, dataAtualDeb, ultPos, tc,
            estProc, sitProc, primJulg, encer, numSiafi, siafiRess, ano
          ]
        );
      }
    }

    // 9. CGU Demandas (se tabela estiver vazia)
    const cguCount = await pool.query("SELECT COUNT(*) FROM cgu_demands");
    if (parseInt(cguCount.rows[0].count, 10) === 0) {
      console.log("[DB] Populando cgu_demands com seeds...");
      for (const cg of SEED_CGU) {
        await pool.query(
          `INSERT INTO cgu_demands (
            id_tarefa, situacao, estado, titulo_tarefa, data_inicio, data_fim, data_limite, unidade_auditada,
            unidades_auditoria, texto_monitoramento, providencia, tipo_ultima_manifestacao, texto_ultima_manifestacao,
            data_ultima_manifestacao, tipo_ultimo_posicionamento, texto_ultimo_posicionamento, data_ultimo_posicionamento,
            categoria, data_limite_inicial, ano, ultima_atualizacao, processo_sei
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id_tarefa) DO NOTHING`,
          [
            cg.idTarefa, cg.situacao, cg.estado, cg.tituloTarefa, cg.dataInicio, cg.dataFim, cg.dataLimite, cg.unidadeAuditada,
            cg.unidadesAuditoria, cg.textoMonitoramento, cg.providencia, cg.tipoUltimaManifestacao, cg.textoUltimaManifestacao,
            cg.dataUltimaManifestacao, cg.tipoUltimoPosicionamento, cg.textoUltimoPosicionamento, cg.dataUltimoPosicionamento,
            cg.categoria, cg.dataLimiteInicial, cg.ano, cg.ultimaAtualizacao, cg.processoSei || null
          ]
        );
      }
    }
  } catch (seedErr) {
    console.error("[DB] Erro no auto-seeding:", seedErr);
  }
}
initDatabaseSchema();

import * as Seeds from "../data/seed_db";
import { SEED_COMUNICACOES } from "../data/seed_comunicacoes";
import { SEED_CGU } from "../data/seed_cgu";
import { 
  SEED_ETICA_MEMBROS, SEED_ETICA_REUNIOES, SEED_ETICA_ATAS, SEED_ETICA_PROCESSOS 
} from "../data/seed_etica";

// DB Path Definition
export const DATA_DIR = path.join(process.cwd(), "data");
export const DB_PATH = path.join(DATA_DIR, "orbita_db.json");
export const TCU_DIR = path.join(DATA_DIR, "tcu");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TCU_DIR)) {
  fs.mkdirSync(TCU_DIR, { recursive: true });
}

export function getSiapeAndEmail(nameStr: string) {
  const name = String(nameStr || "").toUpperCase();
  if (name.includes("SARAH DE MATTOS OLIVEIRA")) {
    return { siape: "1540928", email: "sarah.oliveira@trabalho.gov.br" };
  }
  if (name.includes("CASSIANO HILARIO LUCK GONCALVES")) {
    return { siape: "2390105", email: "cassiano.goncalves@trabalho.gov.br" };
  }
  if (name.includes("JOSE CLAUDIO SILVA BARRETO")) {
    return { siape: "1827491", email: "jose.barreto@trabalho.gov.br" };
  }
  if (name.includes("JOAO ANTUNES SOARES")) {
    return { siape: "1192834", email: "joao.soares@trabalho.gov.br" };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const cleanHash = Math.abs(hash);
  const siape = String(1000000 + (cleanHash % 900000));
  const parts = name.toLowerCase().split(" ").filter(p => p.length > 2);
  const firstName = parts[0] || "viajante";
  const lastName = parts[parts.length - 1] || "servidor";
  return { siape, email: `${firstName}.${lastName}@trabalho.gov.br` };
}

export function migrateProcessTypes(data: any): boolean {
  if (!data || !Array.isArray(data.acordaos)) return false;
  let modified = false;

  for (const ac of data.acordaos) {
    const currentType = ac.TIPOPROCESSO || "";
    if (currentType === "ACOMPANHAMENTO (ACOMP)" || currentType === "" || !ac.TIPOPROCESSO) {
      const searchStr = `${ac.TITULO || ""} ${ac.ASSUNTO || ""} ${ac.SUMARIO || ""} ${ac.ACORDAO || ""} ${ac.DECISAO || ""}`.toUpperCase();
      let newType = currentType;

      if (searchStr.includes("REPRESENTACAO") || searchStr.includes("REPRE")) {
        newType = "REPRESENTAÇÃO (REPR)";
      } else if (searchStr.includes("AUDITORIA") || searchStr.includes("FISCALIZACAO") || searchStr.includes("RELATORIO DE AUDITORIA")) {
        newType = "RELATÓRIO DE AUDITORIA (RA)";
      } else if (searchStr.includes("TOMADA DE CONTAS ESPECIAL") || searchStr.includes("TCE")) {
        newType = "TOMADA DE CONTAS ESPECIAL (TCE)";
      } else if (searchStr.includes("DENUNCIA") || searchStr.includes("DENUNCIAS")) {
        newType = "DENÚNCIA (DEN)";
      } else if (searchStr.includes("MONITORAMENTO")) {
        newType = "MONITORAMENTO (MONIT)";
      } else if (searchStr.includes("PRESTACAO DE CONTAS") || searchStr.includes("CONTA ANUAL")) {
        newType = "PRESTAÇÃO DE CONTAS ANUAL (PCA)";
      } else if (searchStr.includes("CONGRESSO NACIONAL") || searchStr.includes("SOLICITACAO DO CONGRESSO")) {
        newType = "SOLICITAÇÃO DO CONGRESSO NACIONAL (SCN)";
      } else if (searchStr.includes("ACOMPANHAMENTO") || searchStr.includes("ACOMP")) {
        newType = "ACOMPANHAMENTO (ACOMP)";
      } else {
        const hash = (ac.NUMACORDAO || 0) + (ac.ANOACORDAO || 0);
        const fallbacks = [
          "REPRESENTAÇÃO (REPR)",
          "RELATÓRIO DE AUDITORIA (RA)",
          "ACOMPANHAMENTO (ACOMP)",
          "MONITORAMENTO (MONIT)",
          "TOMADA DE CONTAS ESPECIAL (TCE)"
        ];
        newType = fallbacks[hash % fallbacks.length];
      }

      if (newType !== currentType) {
        ac.TIPOPROCESSO = newType;
        modified = true;
      }
    }
  }
  return modified;
}

let cachedDb: any = null;

export function loadDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      acordaos: [],
      comunicacoes: [],
      rolResponsaveis: [],
      comissaoEtica: [],
      superintendencias: [],
      tces: [],
      tceAcordaoMappings: [],
      users: Seeds.SEED_PROFILES, // Manter perfis para não bloquear o login
      cgu: [],
      cguReports: [],
      eticaMembros: [],
      eticaReunioes: [],
      eticaAtas: [],
      eticaProcessos: [],
      contratos: [],
      contratosConsumoMensal: [],
      viaturas: [],
      viaturasAbastecimentos: [],
      viaturasManutencoes: [],
      unidadesRol: [],
      dirigentes: [],
      dirigentesCargos: [],
      dirigentesEventos: []
    };

    migrateProcessTypes(defaultData);
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    cachedDb = defaultData;
    return defaultData;
  }
  
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);

    let dataModified = false;
    if (!data.superintendencias || !Array.isArray(data.superintendencias) || data.superintendencias.length === 0) {
      data.superintendencias = Seeds.SEED_SUPERINTENDENCIAS;
      dataModified = true;
    }
    if (!data.comunicacoes || data.comunicacoes.length === 0) {
      data.comunicacoes = SEED_COMUNICACOES;
      dataModified = true;
    }
    if (!data.tces || data.tces.length === 0) {
      data.tces = Seeds.SEED_TCES;
      dataModified = true;
    }
    if (!data.tceAcordaoMappings || data.tceAcordaoMappings.length === 0) {
      data.tceAcordaoMappings = Seeds.SEED_TCE_ACORDAO_MAPPINGS;
      dataModified = true;
    }
    if (!data.users || data.users.length === 0) {
      data.users = Seeds.SEED_PROFILES;
      dataModified = true;
    }
    if (!data.cgu || data.cgu.length === 0) {
      data.cgu = SEED_CGU;
      dataModified = true;
    }
    if (!data.cguReports) {
      data.cguReports = [];
      dataModified = true;
    } else if (Array.isArray(data.cguReports)) {
      const filtered = data.cguReports.filter((r: any) => {
        const idT = String(r.idTarefa || "");
        const idA = String(r.idAuditoria || "");
        return !idT.toUpperCase().startsWith("AUD") && !idA.toUpperCase().startsWith("AUD");
      });
      if (filtered.length !== data.cguReports.length) {
        data.cguReports = filtered;
        dataModified = true;
      }
    }
    if (!data.eticaMembros) {
      data.eticaMembros = SEED_ETICA_MEMBROS;
      dataModified = true;
    }
    if (!data.eticaReunioes) {
      data.eticaReunioes = SEED_ETICA_REUNIOES;
      dataModified = true;
    }
    if (!data.eticaAtas) {
      data.eticaAtas = SEED_ETICA_ATAS;
      dataModified = true;
    }
    if (!data.eticaProcessos) {
      data.eticaProcessos = SEED_ETICA_PROCESSOS;
      dataModified = true;
    }
    if (!data.contratos) {
      data.contratos = Seeds.SEED_CONTRATOS;
      dataModified = true;
    }
    if (!data.contratosConsumoMensal) {
      data.contratosConsumoMensal = Seeds.SEED_CONTRATOS_CONSUMO;
      dataModified = true;
    }
    if (!data.viaturas) {
      data.viaturas = Seeds.SEED_VIATURAS;
      dataModified = true;
    }
    if (!data.viaturasAbastecimentos) {
      data.viaturasAbastecimentos = Seeds.SEED_VIATURAS_ABASTECIMENTOS;
      dataModified = true;
    }
    if (!data.viaturasManutencoes) {
      data.viaturasManutencoes = Seeds.SEED_VIATURAS_MANUTENCOES;
      dataModified = true;
    }
    if (!data.unidadesRol) {
      data.unidadesRol = Seeds.SEED_UNIDADES_ROL;
      dataModified = true;
    }
    if (!data.dirigentes) {
      data.dirigentes = Seeds.SEED_DIRIGENTES;
      dataModified = true;
    }
    if (!data.dirigentesCargos) {
      data.dirigentesCargos = Seeds.SEED_DIRIGENTES_CARGOS;
      dataModified = true;
    }
    if (!data.dirigentesEventos) {
      data.dirigentesEventos = Seeds.SEED_DIRIGENTES_EVENTOS;
      dataModified = true;
    }

    if (migrateProcessTypes(data)) {
      dataModified = true;
    }



    if (dataModified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
    cachedDb = data;
    return data;
  } catch (err) {
    console.error("Error reading database fallback to seed:", err);
    return {
      acordaos: [],
      comunicacoes: [],
      rolResponsaveis: [],
      comissaoEtica: [],
      superintendencias: [],
      tces: [],
      tceAcordaoMappings: [],
      users: Seeds.SEED_PROFILES,
      cgu: [],
      cguReports: [],
      eticaMembros: [],
      eticaReunioes: [],
      eticaAtas: [],
      eticaProcessos: [],
      contratos: [],
      contratosConsumoMensal: [],
      viaturas: [],
      viaturasAbastecimentos: [],
      viaturasManutencoes: [],
      unidadesRol: [],
      dirigentes: [],
      dirigentesCargos: [],
      dirigentesEventos: []
    };
  }
}

export function saveDatabase(data: any) {
  try {
    cachedDb = data;
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database file:", err);
  }
}
