import { pool, initDatabaseSchema } from "./db.js";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";
import { fetchAllContratosMte, fetchAllContratosSraParaMte, fetchDetalheContratoPncp, fetchArquivosContratoPncp } from "./services/pncpService.js";

async function runFullSync() {
  await initDatabaseSchema();
  console.log("=== INICIANDO SINCRONIZAÇÃO COMPLETA DE DADOS REAIS ===");

  // 1. TCEs Reais a partir do data/tcu/tces/tce.csv
  try {
    const tcePath = path.join(process.cwd(), "data", "tcu", "tces", "tce.csv");
    if (fs.existsSync(tcePath)) {
      console.log("[TCE] Importando dados reais de data/tcu/tces/tce.csv...");
      const content = fs.readFileSync(tcePath, "latin1");
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      if (lines.length > 1) {
        const header = lines[0].split(";").map(h => h.replace(/^"|"$/g, "").trim());
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";").map(c => c.replace(/^"|"$/g, "").trim());
          if (!cols[0]) continue;
          
          const numAno = cols[0];
          const procAdm = cols[1] || "";
          const motivo = cols[2] || "";
          const submotivo = cols[3] || "";
          const debOrig = cols[4] || "";
          const debAtual = cols[5] || "";
          const dataAtualDeb = cols[6] || "";
          const ultPos = cols[7] || "";
          const tc = cols[8] || "";
          const estProc = cols[9] || "";
          const sitProc = cols[10] || "";
          const primJulg = cols[11] || "";
          const encer = cols[12] || "";
          const numSiafi = cols[13] || "";
          const siafiRess = cols[14] === "SIM" || cols[14] === "true" || cols[14] === "1";
          const anoMatch = numAno.match(/\/(\d{4})/);
          const ano = anoMatch ? parseInt(anoMatch[1], 10) : 2024;

          await pool.query(
            `INSERT INTO tcu_tce (
              id, numero_ano_tce, processo_administrativo, motivo_instauracao, submotivo_instauracao,
              debito_original, debito_atualizado, data_atualizacao_debito, ultimo_posicionamento, tc,
              estado_processo, situacao_processo, primeiro_julgamento, encerramento, numero_siafi, siafi_ressarcido, ano
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (id) DO UPDATE SET
              numero_ano_tce = EXCLUDED.numero_ano_tce,
              processo_administrativo = EXCLUDED.processo_administrativo,
              motivo_instauracao = EXCLUDED.motivo_instauracao,
              submotivo_instauracao = EXCLUDED.submotivo_instauracao,
              debito_original = EXCLUDED.debito_original,
              debito_atualizado = EXCLUDED.debito_atualizado,
              data_atualizacao_debito = EXCLUDED.data_atualizacao_debito,
              ultimo_posicionamento = EXCLUDED.ultimo_posicionamento,
              tc = EXCLUDED.tc,
              estado_processo = EXCLUDED.estado_processo,
              situacao_processo = EXCLUDED.situacao_processo,
              primeiro_julgamento = EXCLUDED.primeiro_julgamento,
              encerramento = EXCLUDED.encerramento,
              numero_siafi = EXCLUDED.numero_siafi,
              siafi_ressarcido = EXCLUDED.siafi_ressarcido,
              ano = EXCLUDED.ano`,
            [
              numAno, numAno, procAdm, motivo, submotivo,
              debOrig, debAtual, dataAtualDeb, ultPos, tc,
              estProc, sitProc, primJulg, encer, numSiafi, siafiRess, ano
            ]
          );
          count++;
        }
        console.log(`[TCE] Concluído: ${count} registros reais importados.`);
      }
    }
  } catch (err) {
    console.error("[TCE] Erro na importação:", err);
  }

  // 2. CGU Monitoramentos Reais
  try {
    const cguMonPath = path.join(process.cwd(), "data", "cgu", "monitoramentos", "monitoramentos.xlsx");
    if (fs.existsSync(cguMonPath)) {
      console.log("[CGU] Importando dados reais de data/cgu/monitoramentos/monitoramentos.xlsx...");
      const buf = fs.readFileSync(cguMonPath);
      const wb = XLSX.read(buf, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      let count = 0;
      for (const r of rows) {
        const idTarefa = String(r["ID Tarefa"] || r["Id Tarefa"] || r["id_tarefa"] || r["ID"] || `CGU-${count + 1}`);
        const situacao = String(r["Situação"] || r["Situacao"] || r["situacao"] || "Em Andamento");
        const estado = String(r["Estado"] || r["estado"] || "Aberto");
        const titulo = String(r["Título da Tarefa"] || r["Titulo"] || r["titulo_tarefa"] || "Demanda CGU");
        const dtInicio = String(r["Data Início"] || r["data_inicio"] || "");
        const dtFim = String(r["Data Fim"] || r["data_fim"] || "");
        const dtLimite = String(r["Data Limite"] || r["data_limite"] || "");
        const unAuditada = String(r["Unidade Auditada"] || r["unidade_auditada"] || "");
        const unAuditoria = String(r["Unidades de Auditoria"] || r["unidades_auditoria"] || "");
        const txtMon = String(r["Texto de Monitoramento"] || r["texto_monitoramento"] || "");
        const prov = String(r["Providência"] || r["providencia"] || "");
        const tpUltMan = String(r["Tipo Última Manifestação"] || r["tipo_ultima_manifestacao"] || "");
        const txtUltMan = String(r["Texto Última Manifestação"] || r["texto_ultima_manifestacao"] || "");
        const dtUltMan = String(r["Data Última Manifestação"] || r["data_ultima_manifestacao"] || "");
        const tpUltPos = String(r["Tipo Último Posicionamento"] || r["tipo_ultimo_posicionamento"] || "");
        const txtUltPos = String(r["Texto Último Posicionamento"] || r["texto_ultimo_posicionamento"] || "");
        const dtUltPos = String(r["Data Último Posicionamento"] || r["data_ultimo_posicionamento"] || "");
        const cat = String(r["Categoria"] || r["categoria"] || "");
        const ano = parseInt(String(r["Ano"] || r["ano"] || (dtInicio.match(/\d{4}/) ? dtInicio.match(/\d{4}/)![0] : "2024")), 10) || 2024;
        const processoSei = String(r["Processo SEI"] || r["processo_sei"] || "");

        await pool.query(
          `INSERT INTO cgu_demands (
            id_tarefa, situacao, estado, titulo_tarefa, data_inicio, data_fim, data_limite, unidade_auditada,
            unidades_auditoria, texto_monitoramento, providencia, tipo_ultima_manifestacao, texto_ultima_manifestacao,
            data_ultima_manifestacao, tipo_ultimo_posicionamento, texto_ultimo_posicionamento, data_ultimo_posicionamento,
            categoria, data_limite_inicial, ano, ultima_atualizacao, processo_sei
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id_tarefa) DO UPDATE SET
            situacao = EXCLUDED.situacao,
            estado = EXCLUDED.estado,
            titulo_tarefa = EXCLUDED.titulo_tarefa,
            data_inicio = EXCLUDED.data_inicio,
            data_fim = EXCLUDED.data_fim,
            data_limite = EXCLUDED.data_limite,
            unidade_auditada = EXCLUDED.unidade_auditada,
            unidades_auditoria = EXCLUDED.unidades_auditoria,
            texto_monitoramento = EXCLUDED.texto_monitoramento,
            providencia = EXCLUDED.providencia,
            tipo_ultima_manifestacao = EXCLUDED.tipo_ultima_manifestacao,
            texto_ultima_manifestacao = EXCLUDED.texto_ultima_manifestacao,
            data_ultima_manifestacao = EXCLUDED.data_ultima_manifestacao,
            tipo_ultimo_posicionamento = EXCLUDED.tipo_ultimo_posicionamento,
            texto_ultimo_posicionamento = EXCLUDED.texto_ultimo_posicionamento,
            data_ultimo_posicionamento = EXCLUDED.data_ultimo_posicionamento,
            categoria = EXCLUDED.categoria,
            ano = EXCLUDED.ano,
            ultima_atualizacao = EXCLUDED.ultima_atualizacao,
            processo_sei = EXCLUDED.processo_sei`,
          [
            idTarefa, situacao, estado, titulo, dtInicio, dtFim, dtLimite, unAuditada,
            unAuditoria, txtMon, prov, tpUltMan, txtUltMan,
            dtUltMan, tpUltPos, txtUltPos, dtUltPos,
            cat, dtLimite, ano, new Date().toISOString(), processoSei
          ]
        );
        count++;
      }
      console.log(`[CGU] Concluído: ${count} demandas reais de monitoramento importadas.`);
    }
  } catch (err) {
    console.error("[CGU] Erro na importação:", err);
  }

  // 3. Rol de Responsáveis (DIRIGENTES, UNIDADES, CARGOS, AFASTAMENTOS)
  try {
    const dirPath = path.join(process.cwd(), "data", "DIRIGENTES.csv");
    if (fs.existsSync(dirPath)) {
      console.log("[ROL] Importando dirigentes reais de data/DIRIGENTES.csv...");
      const content = fs.readFileSync(dirPath, "latin1");
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      if (lines.length > 1) {
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";").map(c => c.replace(/^"|"$/g, "").trim());
          if (!cols[0]) continue;
          const id = `dir_${i}`;
          const nome = cols[0] || "";
          const cpf = cols[1] || "";
          const cargo = cols[2] || "";
          const unidade = cols[3] || "";
          const dtInicio = cols[4] || "";
          const dtFim = cols[5] || "";
          const atoNomeacao = cols[6] || "";
          const status = (!dtFim || dtFim.trim() === "") ? "Ativo" : "Histórico";

          await pool.query(
            `INSERT INTO rol_responsaveis_legado (
              id, nome, cpf, cargo, unidade, inicio_exercicio, fim_exercicio, ato_nomeacao, status, observacoes, is_substituto
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              nome = EXCLUDED.nome,
              cpf = EXCLUDED.cpf,
              cargo = EXCLUDED.cargo,
              unidade = EXCLUDED.unidade,
              inicio_exercicio = EXCLUDED.inicio_exercicio,
              fim_exercicio = EXCLUDED.fim_exercicio,
              ato_nomeacao = EXCLUDED.ato_nomeacao,
              status = EXCLUDED.status`,
            [id, nome, cpf, cargo, unidade, dtInicio, dtFim, atoNomeacao, status, "", false]
          );
          count++;
        }
        console.log(`[ROL] Concluído: ${count} dirigentes reais importados.`);
      }
    }
  } catch (err) {
    console.error("[ROL] Erro na importação:", err);
  }

  // 4. Contratos Oficiais PNCP (MTE e SRA)
  try {
    console.log("[CONTRATOS] Buscando contratos reais da API do PNCP (MTE e SRA/MGI)...");
    const mte = await fetchAllContratosMte();
    const sra = await fetchAllContratosSraParaMte();
    const todos = [...mte, ...sra];
    const unicos = new Map();
    todos.forEach(c => unicos.set(c.id, c));
    const lista = Array.from(unicos.values());

    let count = 0;
    for (const p of lista) {
      let cnpj = p.orgaoEntidade?.cnpj;
      let ano = p.anoContrato;
      let sequencial = p.numero_sequencial;

      if (!sequencial || !cnpj || !ano) {
        const match = String(p.id).match(/(\d{14})-1-(\d+)\/(\d{4})/);
        if (match) {
          cnpj = cnpj || match[1];
          sequencial = sequencial || parseInt(match[2], 10);
          ano = ano || match[3];
        }
      }

      let finalUf = p.uf || "DF";
      if (finalUf === "DF") {
        const unidadeName = (p.unidadeOrcamentaria?.nomeUnidade || p.orgaoEntidade?.razaoSocial || "").toUpperCase();
        finalUf = (unidadeName.includes("SUPERINTEND") || unidadeName.includes("SRTE")) ? "DF_SRTE" : "DF_SEDE";
      }

      const orgaoTag = (p.orgaoEntidade?.cnpj === "00489828000155" || cnpj === "00489828000155") ? "[MGI]" : "[MTE]";
      const numContrato = `${orgaoTag} ${p.numeroContrato || p.numeroContratoEmpenho || p.id}`;

      await pool.query(
        `INSERT INTO contratos (
          id, numero_contrato, empresa, cnpj, objeto, valor_global, valor_mensal, valor_anual,
          data_inicio, data_fim, uf, modalidade, pncp_id, uasg, link_pncp, status,
          municipio, numero_processo, categoria_processo, tipo_contrato, receita_despesa,
          data_assinatura, data_divulgacao_pncp, pncp_contratacao_id, fruto_adesao, tem_remanejamento, fonte_dados, tipo_fornecedor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
        ON CONFLICT (id) DO UPDATE SET
          numero_contrato = EXCLUDED.numero_contrato,
          empresa = EXCLUDED.empresa,
          cnpj = EXCLUDED.cnpj,
          objeto = EXCLUDED.objeto,
          valor_global = EXCLUDED.valor_global,
          valor_mensal = EXCLUDED.valor_mensal,
          valor_anual = EXCLUDED.valor_anual,
          data_inicio = EXCLUDED.data_inicio,
          data_fim = EXCLUDED.data_fim,
          uf = EXCLUDED.uf,
          modalidade = EXCLUDED.modalidade,
          status = EXCLUDED.status,
          link_pncp = EXCLUDED.link_pncp`,
        [
          p.id,
          numContrato,
          p.nomeRazaoSocialFornecedor || p.orgaoSubrogado?.razaoSocial || "Fornecedor PNCP",
          p.niFornecedor || "",
          p.objetoContrato || "",
          p.valorGlobal || p.valorInicial || 0,
          p.valorParcela || (p.valorGlobal ? p.valorGlobal / 12 : 0),
          p.valorAcumulado || p.valorGlobal || 0,
          p.dataVigenciaInicio || "",
          p.dataVigenciaFim || "",
          finalUf,
          p.modalidadeNome || "Dispensa / Pregão",
          p.id,
          p.unidadeOrcamentaria?.codigoUnidade || p.orgaoEntidade?.cnpj || "",
          `https://pncp.gov.br/app/contratos/${cnpj}/${ano}/${sequencial}`,
          "Ativo",
          p.unidadeOrcamentaria?.nomeUnidade || "",
          p.numeroProcesso || "",
          p.categoriaProcesso || "",
          p.tipoContrato || "Contrato",
          "Despesa",
          p.dataAssinatura || "",
          p.dataDivulgacaoPncp || "",
          p.contratacaoPncpId || "",
          false,
          false,
          "PNCP Oficial",
          "PJ"
        ]
      );
      count++;
    }
    console.log(`[CONTRATOS] Concluído: ${count} contratos reais do PNCP sincronizados.`);
  } catch (err) {
    console.error("[CONTRATOS] Erro na sincronização com PNCP:", err);
  }

  console.log("=== SINCRONIZAÇÃO COMPLETA FINALIZADA COM SUCESSO ===");
  process.exit(0);
}

runFullSync().catch(e => {
  console.error("Erro geral no script:", e);
  process.exit(1);
});
