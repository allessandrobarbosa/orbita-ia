
import fs from "fs";
import path from "path";
import * as Seeds from "../../data/seed_db";
import { SEED_CGU } from "../../data/seed_cgu";
import { SEED_COMUNICACOES } from "../../data/seed_comunicacoes";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "orbita_db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class StorageManager {
  private static instance: StorageManager;
  private dbData: any = null;

  private constructor() {}

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  public getDbPath(): string {
    return DB_PATH;
  }

  public loadDatabase(): any {
    if (!fs.existsSync(DB_PATH)) {
      const defaultData = {
        acordaos: Seeds.SEED_ACORDAOS,
        comunicacoes: SEED_COMUNICACOES,
        rolResponsaveis: Seeds.SEED_ROL_RESPONSAVEIS,
        comissaoEtica: Seeds.SEED_COMISSAO_ETICA,
        superintendencias: Seeds.SEED_SUPERINTENDENCIAS,
        tces: Seeds.SEED_TCES,
        tceAcordaoMappings: Seeds.SEED_TCE_ACORDAO_MAPPINGS,
        users: Seeds.SEED_PROFILES,
        cgu: SEED_CGU,
        cguReports: [],
        eticaMembros: [],
        eticaReunioes: [],
        eticaAtas: [],
        eticaProcessos: [],
        contratos: Seeds.SEED_CONTRATOS,
        contratosConsumoMensal: Seeds.SEED_CONTRATOS_CONSUMO,
        viaturas: Seeds.SEED_VIATURAS,
        viaturasAbastecimentos: Seeds.SEED_VIATURAS_ABASTECIMENTOS,
        viaturasManutencoes: Seeds.SEED_VIATURAS_MANUTENCOES,
        unidadesRol: Seeds.SEED_UNIDADES_ROL,
        dirigentes: Seeds.SEED_DIRIGENTES,
        dirigentesCargos: Seeds.SEED_DIRIGENTES_CARGOS,
        dirigentesEventos: Seeds.SEED_DIRIGENTES_EVENTOS
      };

      this.saveDatabase(defaultData);
      this.dbData = defaultData;
      return defaultData;
    }

    try {
      const raw = fs.readFileSync(DB_PATH, "utf-8").replace(/^\uFEFF/, "");
      const parsed = JSON.parse(raw);
      
      // Auto-heal empty arrays for newly added seeds if they are empty
      if (!parsed.cgu || parsed.cgu.length === 0) parsed.cgu = SEED_CGU;
      if (!parsed.tces || parsed.tces.length === 0) parsed.tces = Seeds.SEED_TCES;
      if (!parsed.tceAcordaoMappings || parsed.tceAcordaoMappings.length === 0) parsed.tceAcordaoMappings = Seeds.SEED_TCE_ACORDAO_MAPPINGS;
      if (!parsed.comunicacoes || parsed.comunicacoes.length === 0) parsed.comunicacoes = SEED_COMUNICACOES;
      if (!parsed.superintendencias || parsed.superintendencias.length === 0) parsed.superintendencias = Seeds.SEED_SUPERINTENDENCIAS;
      if (!parsed.comissaoEtica || parsed.comissaoEtica.length === 0) parsed.comissaoEtica = Seeds.SEED_COMISSAO_ETICA;
      if (!parsed.users || parsed.users.length === 0) parsed.users = Seeds.SEED_PROFILES;
      if (!parsed.contratos || parsed.contratos.length === 0) parsed.contratos = Seeds.SEED_CONTRATOS;
      if (!parsed.contratosConsumoMensal || parsed.contratosConsumoMensal.length === 0) parsed.contratosConsumoMensal = Seeds.SEED_CONTRATOS_CONSUMO;
      if (!parsed.viaturas || parsed.viaturas.length === 0) parsed.viaturas = Seeds.SEED_VIATURAS;
      if (!parsed.viaturasAbastecimentos || parsed.viaturasAbastecimentos.length === 0) parsed.viaturasAbastecimentos = Seeds.SEED_VIATURAS_ABASTECIMENTOS;
      if (!parsed.unidadesRol || parsed.unidadesRol.length === 0) parsed.unidadesRol = Seeds.SEED_UNIDADES_ROL;
      if (!parsed.dirigentes || parsed.dirigentes.length === 0) parsed.dirigentes = Seeds.SEED_DIRIGENTES;
      if (!parsed.dirigentesCargos || parsed.dirigentesCargos.length === 0) parsed.dirigentesCargos = Seeds.SEED_DIRIGENTES_CARGOS;
      if (!parsed.dirigentesEventos || parsed.dirigentesEventos.length === 0) parsed.dirigentesEventos = Seeds.SEED_DIRIGENTES_EVENTOS;

      this.dbData = parsed;
      this.saveDatabase(this.dbData); // Save the healed DB
      
      return this.dbData;
    } catch (err) {
      console.error("StorageManager: Error reading DB:", err);
      return null;
    }
  }

  public saveDatabase(data: any): void {
    try {
      this.dbData = data;
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("StorageManager: Failed to save DB:", err);
    }
  }
}
