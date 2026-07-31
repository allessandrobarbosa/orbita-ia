import https from "https";
import { pool } from "../db.js";
import { 
  iniciarImportacao, 
  atualizarStatusImportacao, 
  registrarErroImportacao 
} from "./importControl.js";
import dotenv from "dotenv";

dotenv.config();

const CGU_URL = "https://dadosabertos-download.cgu.gov.br/Auditorias/Auditorias.csv";
const MODULO_AUDITORIAS = "CGU_AUDITORIAS_PUB";

const parseCSVRobust = (csvText: string, delimiter: string): string[][] => {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') { currentField += '"'; i++; }
      else if (char === '"') {
        const isEndOfField = nextChar === delimiter || nextChar === '\r' || nextChar === '\n' || nextChar === undefined;
        if (isEndOfField) inQuotes = false;
        else currentField += '"';
      } else { currentField += char; }
    } else {
      if (char === '"') inQuotes = true;
      else if (char === delimiter) { currentRow.push(currentField.trim()); currentField = ""; }
      else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = []; currentField = ""; i++;
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) rows.push(currentRow);
        currentRow = []; currentField = "";
      } else { currentField += char; }
    }
  }
  if (currentRow.length > 0 || currentField !== "") {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }
  return rows;
};

const normalizeHeaderName = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "");
};

const downloadFile = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Falha no download. Status: ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.setEncoding('latin1');
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
};

export const runImportCguAuditorias = async (usuarioId: string = "SISTEMA") => {
  console.log("[CGU] Iniciando rotina de importação de Auditorias...");
  const unidadeAlvo = process.env.CGU_SIGLA_UNIDADE_AUDITADA;
  if (!unidadeAlvo) {
    console.error("[CGU] A variável de ambiente CGU_SIGLA_UNIDADE_AUDITADA não está configurada.");
    return { error: "Variável CGU_SIGLA_UNIDADE_AUDITADA não configurada." };
  }

  let importControlId: number | null = null;
  let t0 = performance.now();

  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_AUDITORIAS,
      ano_referencia: new Date().getFullYear(),
      tipo_arquivo: "CSV_REMOTO",
      url_fonte: CGU_URL,
      nome_arquivo: "Auditorias.csv",
      forcado_por_usuario: usuarioId,
    });

    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });

    const csvData = await downloadFile(CGU_URL);
    if (!csvData || csvData.trim().length === 0) {
      throw new Error("Arquivo CSV baixado está vazio.");
    }

    const firstLineEnd = csvData.indexOf('\n');
    const headerLine = firstLineEnd > 0 ? csvData.substring(0, firstLineEnd) : csvData;
    let delimiter = ";";
    if ((headerLine.match(/,/g) || []).length > (headerLine.match(/;/g) || []).length) {
      delimiter = ",";
    }

    const rows = parseCSVRobust(csvData, delimiter);
    if (rows.length < 2) {
      throw new Error("O arquivo não contém linhas de dados válidas.");
    }

    const headers = rows[0].map(h => normalizeHeaderName(h || ""));

    const getIndex = (names: string[]) => {
      for (const n of names) {
        const i = headers.findIndex(h => h.includes(n));
        if (i !== -1) return i;
      }
      return -1;
    };

    const idxIdTarefa = getIndex(["idtarefa", "tarefa"]);
    const idxTituloRelatorio = getIndex(["titulorelatorio", "titulo"]);
    const idxDataPublicacao = getIndex(["datapublicacao", "data"]);
    const idxIdAuditoria = getIndex(["idauditoria", "auditoria"]);
    const idxSiglaUnidade = getIndex(["siglaunidadeauditada", "siglaunidade"]);
    const idxNomeUnidade = getIndex(["nomeunidadeauditada", "nomeunidade"]);
    const idxSiglaOrgaoSup = getIndex(["siglaorgaosuperior"]);
    const idxNomeOrgaoSup = getIndex(["nomeorgaosuperior"]);
    const idxUf = getIndex(["uf", "estado"]);
    const idxMunicipio = getIndex(["municipio"]);
    const idxTipoServico = getIndex(["tiposervico"]);
    const idxLinhaAcao = getIndex(["linhaacao"]);
    const idxGrupoAtividade = getIndex(["grupoatividade"]);
    const idxEdicaoFef = getIndex(["edicaoprogramasorteiofef", "fef"]);
    const idxUrl = getIndex(["origemcguurlrelatorio", "url"]);

    if (idxIdTarefa === -1 || idxIdAuditoria === -1) {
      throw new Error("Colunas obrigatórias (IdTarefa, IdAuditoria) não encontradas no CSV.");
    }

    const client = await pool.connect();
    
    let lidos = 0;
    let inseridos = 0;
    let atualizados = 0;
    let errosCount = 0;
    let ignorados = 0;

    try {
      await client.query("BEGIN");

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < headers.length * 0.5) continue;

        const siglaUnidade = idxSiglaUnidade !== -1 ? row[idxSiglaUnidade]?.trim() : "";
        lidos++;

        if (siglaUnidade.toUpperCase() !== unidadeAlvo.toUpperCase()) {
          ignorados++;
          continue;
        }

        const idTarefa = row[idxIdTarefa]?.trim();
        const idAuditoria = row[idxIdAuditoria]?.trim();
        
        if (!idTarefa || !idAuditoria) {
          ignorados++;
          continue;
        }

        const parseDate = (dStr: string) => {
          if (!dStr) return null;
          const parts = dStr.split("/");
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;
          }
          return null;
        };

        const titulo = idxTituloRelatorio !== -1 ? row[idxTituloRelatorio]?.trim() : null;
        const dtPub = idxDataPublicacao !== -1 ? parseDate(row[idxDataPublicacao]?.trim()) : null;
        const nomeUnidade = idxNomeUnidade !== -1 ? row[idxNomeUnidade]?.trim() : null;
        const siglaOrgSup = idxSiglaOrgaoSup !== -1 ? row[idxSiglaOrgaoSup]?.trim() : null;
        const nomeOrgSup = idxNomeOrgaoSup !== -1 ? row[idxNomeOrgaoSup]?.trim() : null;
        const uf = idxUf !== -1 ? row[idxUf]?.trim() : null;
        const municipio = idxMunicipio !== -1 ? row[idxMunicipio]?.trim() : null;
        const tipoServico = idxTipoServico !== -1 ? row[idxTipoServico]?.trim() : null;
        const linhaAcao = idxLinhaAcao !== -1 ? row[idxLinhaAcao]?.trim() : null;
        const grupoAtividade = idxGrupoAtividade !== -1 ? row[idxGrupoAtividade]?.trim() : null;
        const edicaoFef = idxEdicaoFef !== -1 ? row[idxEdicaoFef]?.trim() : null;
        const urlRel = idxUrl !== -1 ? row[idxUrl]?.trim() : null;

        try {
          await client.query("SAVEPOINT import_auditoria");
          
          const result = await client.query(`
            INSERT INTO cgu_auditorias (
              id_tarefa, titulo_relatorio, data_publicacao, id_auditoria,
              sigla_unidade_auditada, nome_unidade_auditada, sigla_orgao_superior, nome_orgao_superior,
              uf, municipio, tipo_servico, linha_acao, grupo_atividade, edicao_programa_sorteio_fef,
              origem_cgu_url_relatorio, data_importacao
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP
            )
            ON CONFLICT (id_auditoria, id_tarefa) DO UPDATE SET
              titulo_relatorio = EXCLUDED.titulo_relatorio,
              data_publicacao = EXCLUDED.data_publicacao,
              nome_unidade_auditada = EXCLUDED.nome_unidade_auditada,
              sigla_orgao_superior = EXCLUDED.sigla_orgao_superior,
              nome_orgao_superior = EXCLUDED.nome_orgao_superior,
              uf = EXCLUDED.uf,
              municipio = EXCLUDED.municipio,
              tipo_servico = EXCLUDED.tipo_servico,
              linha_acao = EXCLUDED.linha_acao,
              grupo_atividade = EXCLUDED.grupo_atividade,
              edicao_programa_sorteio_fef = EXCLUDED.edicao_programa_sorteio_fef,
              origem_cgu_url_relatorio = EXCLUDED.origem_cgu_url_relatorio,
              data_importacao = CURRENT_TIMESTAMP
            RETURNING xmax;
          `, [
            idTarefa, titulo, dtPub, idAuditoria, siglaUnidade, nomeUnidade,
            siglaOrgSup, nomeOrgSup, uf, municipio, tipoServico, linhaAcao,
            grupoAtividade, edicaoFef, urlRel
          ]);
          
          if (result.rows[0].xmax === 0) {
            inseridos++;
          } else {
            atualizados++;
          }
          await client.query("RELEASE SAVEPOINT import_auditoria");
        } catch (dbErr: any) {
          await client.query("ROLLBACK TO SAVEPOINT import_auditoria");
          errosCount++;
          console.error(`Erro inserindo auditoria ${idAuditoria}-${idTarefa}:`, dbErr.message);
        }
      }

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }

    let t1 = performance.now();
    await atualizarStatusImportacao({
      id: importControlId,
      status: "CONCLUIDO",
      tamanho_bytes: csvData.length,
      quantidade_linhas_csv: lidos,
      quantidade_inseridos: inseridos,
      quantidade_atualizados: atualizados,
      quantidade_ignorados: ignorados,
      quantidade_erros: errosCount,
    });
    
    console.log(`[CGU] Importação concluída. Lidos: ${lidos}, Inseridos: ${inseridos}, Atualizados: ${atualizados}, Ignorados: ${ignorados}, Erros: ${errosCount}. Tempo: ${((t1-t0)/1000).toFixed(1)}s`);

    return { 
      success: true, 
      lidos, inseridos, atualizados, ignorados, erros: errosCount,
      tempo_segundos: ((t1-t0)/1000).toFixed(1)
    };

  } catch (err: any) {
    if (importControlId) {
      await registrarErroImportacao(importControlId, err.message, err.stack);
    }
    console.error("[CGU] Erro fatal na importação de auditorias", err);
    return { error: err.message };
  }
};
