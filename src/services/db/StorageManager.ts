
import fs from "fs";
import path from "path";
import * as Seeds from "../../data/seed_db";

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
        comunicacoes: [],
        rolResponsaveis: Seeds.SEED_ROL_RESPONSAVEIS,
        comissaoEtica: [],
        superintendencias: [],
        tces: [],
        tceAcordaoMappings: [],
        users: [],
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
        viaturasManutencoes: Seeds.SEED_VIATURAS_MANUTENCOES,
        unidadesRol: [],
        dirigentes: [],
        dirigentesCargos: [],
        dirigentesEventos: []
      };

      this.saveDatabase(defaultData);
      this.dbData = defaultData;
      return defaultData;
    }

    try {
      const raw = fs.readFileSync(DB_PATH, "utf-8").replace(/^\uFEFF/, "");
      this.dbData = JSON.parse(raw);
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
