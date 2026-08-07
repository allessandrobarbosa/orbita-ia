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

    if (data.viagensScdp && Array.isArray(data.viagensScdp)) {
      data.viagensScdp.forEach((item: any) => {
        let modified = false;
        if (!item.siapeViajante) {
          item.siapeViajante = getSiapeAndEmail(item.nomeViajante).siape;
          modified = true;
        }
        if (!item.emailViajante || item.emailViajante.includes("@mte.gov.br")) {
          item.emailViajante = getSiapeAndEmail(item.nomeViajante).email;
          modified = true;
        }
        if (!item.motivoViagem) {
          item.motivoViagem = "Fiscalização em campo de denúncias trabalhistas e verificação de conformidade de jornadas.";
          modified = true;
        }
        if (modified) {
          dataModified = true;
        }
      });
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
