import { pool } from "./src/backend/db";
import fs from "fs";

// Simple CSV parser
function parseCSV(content: string) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const parts = line.split(';');
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = parts[i] ? parts[i].trim().replace(/"/g, '') : null;
    });
    return obj;
  });
}

async function importRol() {
  try {
    const unidadesCSV = fs.readFileSync("data/UNIDADES.csv", "latin1");
    const dirigentesCSV = fs.readFileSync("data/DIRIGENTES.csv", "latin1");
    const cargosCSV = fs.readFileSync("data/CARGOS.csv", "latin1");

    const unidades = parseCSV(unidadesCSV);
    const dirigentes = parseCSV(dirigentesCSV);
    const cargos = parseCSV(cargosCSV);

    for (const u of unidades) {
      if (u.ID && u.NOME) {
        await pool.query(`INSERT INTO rol_unidades (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [u.ID, u.NOME]);
      }
    }

    for (const d of dirigentes) {
      if (d.ID && d.NOME) {
        await pool.query(`INSERT INTO rol_dirigentes (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [d.ID, d.NOME]);
      }
    }

    for (const c of cargos) {
      if (c.ID && c.DIRIGENTE_ID && c.UNIDADE_ID && c.CARGO) {
        await pool.query(`INSERT INTO rol_dirigentes_cargos (id, dirigente_id, unidade_id, cargo, tipo_vinculo, inicio_exercicio) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`, [c.ID, c.DIRIGENTE_ID, c.UNIDADE_ID, c.CARGO, c.TIPO_VINCULO || "Titular", c.INICIO_EXERCICIO || ""]);
      }
    }

    console.log("Rol responsaveis imported successfully.");
  } catch (e) {
    console.error("Error importing Rol:", e);
  } finally {
    pool.end();
  }
}

importRol();
