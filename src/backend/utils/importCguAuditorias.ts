import fetch from "node-fetch";
import { pool } from "../db.js";
import { 
  iniciarImportacao, 
  atualizarStatusImportacao, 
  registrarErroImportacao 
} from "./importControl.js";

const CGU_API_BASE = "https://eaud.cgu.gov.br/api/relatorios/pesquisa";
const MODULO_AUDITORIAS = "CGU_AUDITORIAS_PUB";

// Converte DD/MM/YYYY para YYYY-MM-DDT00:00:00Z
const parseDataPub = (dStr: string) => {
  if (!dStr) return null;
  const parts = dStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;
  }
  return null;
};

export const runImportCguAuditorias = async (usuarioId: string = "SISTEMA") => {
  console.log("[CGU] Iniciando sincronização via API do e-Aud...");
  const hoje = new Date();
  const dataFim = `${String(hoje.getDate()).padStart(2, '0')}/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
  
  const queryParams = new URLSearchParams({
    colunaOrdenacao: "dataPublicacao",
    direcaoOrdenacao: "DESC",
    tamanhoPagina: "1000",
    offset: "0",
    dataPublicacaoInicio: "01/01/2022",
    dataPublicacaoFim: dataFim,
    idsUnidadesOrgao: "868"
  });

  const url = `${CGU_API_BASE}?${queryParams.toString()}`;

  let importControlId: number | null = null;
  let t0 = performance.now();

  try {
    importControlId = await iniciarImportacao({
      modulo: MODULO_AUDITORIAS,
      ano_referencia: hoje.getFullYear(),
      tipo_arquivo: "API_JSON",
      url_fonte: url,
      nome_arquivo: "eaud_api.json",
      forcado_por_usuario: usuarioId,
    });

    await atualizarStatusImportacao({ id: importControlId, status: "PROCESSANDO" });

    console.log(`[CGU] Buscando relatórios na API: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Falha na API da CGU. Status: ${res.status}`);
    }

    const data = await res.json();
    const relatorios = data.data || [];
    
    console.log(`[CGU] Recebidos ${relatorios.length} relatórios da API.`);

    const client = await pool.connect();
    
    let lidos = relatorios.length;
    let inseridos = 0;
    let atualizados = 0;
    let errosCount = 0;
    let ignorados = 0;

    try {
      await client.query("BEGIN");

      for (const item of relatorios) {
        const idTarefa = String(item.id);
        const idAuditoria = String(item.numRelatorioPesquisaExterna);
        
        if (!idTarefa || !idAuditoria) {
          ignorados++;
          continue;
        }

        const titulo = item.titulo || null;
        const dtPub = parseDataPub(item.dataPublicacao) || null;
        const siglaUnidade = item.unidadesAuditadas || null; 
        const nomeUnidade = null;
        const siglaOrgSup = "MTE";
        const nomeOrgSup = "Ministério do Trabalho e Emprego";
        
        // As vezes localidades é Brasília/DF, DF, etc. Vamos jogar em municipio e UF
        let uf = null;
        let municipio = item.localidades || null;
        if (municipio && municipio.includes("/")) {
          const parts = municipio.split("/");
          uf = parts[parts.length - 1].trim();
        }

        const tipoServico = item.tipoServico || null;
        const linhaAcao = item.linhaAcao || null;
        const grupoAtividade = item.grupoAtividade || null;
        const edicaoFef = null; // API não traz, mas podemos deixar nulo
        const urlRel = `https://eaud.cgu.gov.br/relatorios/download/${idTarefa}`;

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
              sigla_unidade_auditada = EXCLUDED.sigla_unidade_auditada,
              nome_unidade_auditada = EXCLUDED.nome_unidade_auditada,
              sigla_orgao_superior = EXCLUDED.sigla_orgao_superior,
              nome_orgao_superior = EXCLUDED.nome_orgao_superior,
              uf = EXCLUDED.uf,
              municipio = EXCLUDED.municipio,
              tipo_servico = EXCLUDED.tipo_servico,
              linha_acao = EXCLUDED.linha_acao,
              grupo_atividade = EXCLUDED.grupo_atividade,
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
      tamanho_bytes: 0,
      quantidade_linhas_csv: lidos,
      quantidade_inseridos: inseridos,
      quantidade_atualizados: atualizados,
      quantidade_ignorados: ignorados,
      quantidade_erros: errosCount,
    });
    
    console.log(`[CGU] Importação concluída via API. Lidos: ${lidos}, Inseridos: ${inseridos}, Atualizados: ${atualizados}, Erros: ${errosCount}. Tempo: ${((t1-t0)/1000).toFixed(1)}s`);

    return { 
      success: true, 
      lidos, inseridos, atualizados, ignorados, erros: errosCount,
      tempo_segundos: ((t1-t0)/1000).toFixed(1)
    };

  } catch (err: any) {
    if (importControlId) {
      await registrarErroImportacao(importControlId, err.message, err.stack);
    }
    console.error("[CGU] Erro fatal na sincronia de auditorias via API", err);
    return { error: err.message };
  }
};
