import { pool } from "./src/backend/db";
import fs from "fs";
import crypto from "crypto";

function cleanHeader(h: string) {
  return h.trim().replace(/"/g, '').replace(/ï»¿/g, '').replace(/^\uFEFF/, '');
}

function parseCSV(content: string) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(cleanHeader);
  return lines.slice(1).map(line => {
    const parts = line.split(';');
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = parts[i] ? parts[i].trim().replace(/"/g, '') : null;
    });
    return obj;
  });
}

async function importRolLegacy() {
  try {
    const unidadesCSV = fs.readFileSync("data/UNIDADES.csv", "utf8");
    const unidadesData = parseCSV(unidadesCSV);

    await pool.query('TRUNCATE TABLE rol_unidades CASCADE');
    const unidadeMap: Record<string, string> = {}; // map sigla to nome

    for (let i = 0; i < unidadesData.length; i++) {
      const u = unidadesData[i];
      if (u.NOME && u.SIGLA_UNIDADE) {
        const id = `U-${i + 1}`;
        await pool.query(
          `INSERT INTO rol_unidades (id, nome, sigla) VALUES ($1, $2, $3)`,
          [id, u.NOME, u.SIGLA_UNIDADE]
        );
        unidadeMap[u.SIGLA_UNIDADE] = u.NOME;
      }
    }
    console.log("Rol unidades imported successfully!");

    const cargosCSV = fs.readFileSync("data/CARGOS.csv", "utf8");
    const cargosData = parseCSV(cargosCSV);
    
    await pool.query('TRUNCATE TABLE rol_cargos CASCADE');
    for (let i = 0; i < cargosData.length; i++) {
      const c = cargosData[i];
      if (c.NOME_CARGO) {
        const id = `C-${i + 1}`;
        await pool.query(
          `INSERT INTO rol_cargos (id, nome) VALUES ($1, $2)`,
          [id, c.NOME_CARGO]
        );
      }
    }
    console.log("Rol cargos imported successfully!");

    const dirigentesCSV = fs.readFileSync("data/DIRIGENTES.csv", "utf8");
    const dirigentes = parseCSV(dirigentesCSV);

    await pool.query('TRUNCATE TABLE rol_responsaveis_legado');

    for (const d of dirigentes) {
      if (d.NOME_DIRIGENTE) {
        const id = crypto.randomUUID();
        const status = (!d.DATA_FIM_EXERCICIO || d.DATA_FIM_EXERCICIO.trim() === '') ? "Vigente" : "Histórico";
        
        // We set the full name of the unit if available, otherwise fallback to sigla
        const nomeUnidade = unidadeMap[d.SIGLA_UNIDADE] || d.SIGLA_UNIDADE;

        await pool.query(
          `INSERT INTO rol_responsaveis_legado 
          (id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id, d.NOME_DIRIGENTE, d.CPF, d.NOME_CARGO, nomeUnidade,
            d.DATA_INICIO_EXERCICIO, d.DATA_FIM_EXERCICIO, d.ATO_NOMEACAO, status
          ]
        );
      }
    }
    console.log("Rol responsaveis legado imported successfully!");
  } catch (e) {
    console.error("Error importing:", e);
  } finally {
    pool.end();
  }
}

importRolLegacy();
