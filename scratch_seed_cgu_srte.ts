import { pool } from "./src/backend/db.js";
import { SEED_CGU } from "./src/data/seed_cgu.js";
import { SEED_SUPERINTENDENCIAS } from "./src/data/seed_db.js";

async function run() {
  try {
    // 1. CGU Demands
    for (const d of SEED_CGU) {
      await pool.query(
        `INSERT INTO cgu_demands (
          id_tarefa, situacao, estado, titulo_tarefa, data_inicio, data_fim, data_limite,
          unidade_auditada, unidades_auditoria, texto_monitoramento, providencia,
          tipo_ultima_manifestacao, texto_ultima_manifestacao, data_ultima_manifestacao,
          tipo_ultimo_posicionamento, texto_ultimo_posicionamento, data_ultimo_posicionamento,
          categoria, data_limite_inicial, ano, ultima_atualizacao
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT (id_tarefa) DO NOTHING`,
        [
          d.idTarefa, d.situacao, d.estado, d.tituloTarefa, d.dataInicio, d.dataFim, d.dataLimite,
          d.unidadeAuditada, d.unidadesAuditoria, d.textoMonitoramento, d.providencia,
          d.tipoUltimaManifestacao, d.textoUltimaManifestacao, d.dataUltimaManifestacao,
          d.tipoUltimoPosicionamento, d.textoUltimoPosicionamento, d.dataUltimoPosicionamento,
          d.categoria, d.dataLimiteInicial, d.ano, d.ultimaAtualizacao
        ]
      );
    }
    console.log("CGU Demands seeded.");

    // 2. Superintendências
    for (const s of SEED_SUPERINTENDENCIAS) {
      await pool.query(
        `INSERT INTO superintendencias (
          uf, capital, superintendente, cargo, endereco, contato, email, substituto,
          email_substituto, cep, latitude, longitude, demandas_tcu, demandas_cgu, demandas_etica, status_geral
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (uf) DO NOTHING`,
        [
          s.uf, s.capital, s.superintendente, s.cargo, s.endereco, s.contato, s.email, s.substituto,
          s.emailSubstituto, s.cep, s.latitude, s.longitude, s.demandasTCU, s.demandasCGU, 0, s.statusGeral
        ]
      );
    }
    console.log("Superintendencias seeded.");

  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    pool.end();
  }
}

run();
