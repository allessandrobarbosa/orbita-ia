import express from "express";
import { pool } from "../db";
import fs from "fs";
import path from "path";
import { parseCsvStream } from "../utils/tcuUtils";
import { getInteiroTeorFromCache, getComplementaryDataBulk, ComplementaryData, TargetAcordao } from "../utils/tcuCsvParser";
import { enqueueAcordaosForAnalysis, processSingleAcordao } from "../utils/backgroundProcessor";
import { GoogleGenAI } from '@google/genai';

const DATA_DIR = path.join(process.cwd(), "data");

const router = express.Router();

router.post("/acordaos/sync-local", async (req, res) => {
  const TCU_DIR = path.join(process.cwd(), "data", "tcu", "acordaos");
  if (!fs.existsSync(TCU_DIR)) {
    return res.status(400).json({ success: false, message: "Diretório data/tcu/acordaos não encontrado." });
  }

  const files = fs.readdirSync(TCU_DIR);
  
  // Verifica se a tabela está vazia
  const countRes = await pool.query('SELECT COUNT(*) FROM tcu_acordaos');
  const isEmpty = parseInt(countRes.rows[0].count) === 0;

  const currentYear = new Date().getFullYear();
  
  const csvFiles = files.filter(f => {
    const isCsv = f.toLowerCase().endsWith(".csv") && !f.toLowerCase().includes("cache");
    if (!isCsv) return false;
    
    // Se a base está vazia, importa todos os anos. Senão, filtra pelo ano corrente.
    return isEmpty ? true : f.includes(currentYear.toString());
  });

  if (csvFiles.length === 0) {
    return res.json({ success: false, message: `Nenhum arquivo .csv encontrado na pasta data/tcu/acordaos/.` });
  }

  try {
    let imported = 0;
    let updated = 0;

    const isTeorMissing = (teorVal: any): boolean => {
      if (!teorVal) return true;
      const str = String(teorVal).trim();
      return str === '' || str === 'null' || str === 'undefined' || str === '[]' || str === '{}';
    };

    for (const file of csvFiles) {
      console.log(`[SYNC-LOCAL-ACORDAOS] Iniciando processamento do arquivo: ${file}`);
      console.time(`Processamento ${file}`);
      const filePath = path.join(TCU_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8'); // Arquivos de filtro são UTF-8 com BOM
      const lines = content.split('\n');
      console.log(`[SYNC-LOCAL-ACORDAOS] Encontradas ${lines.length} linhas em ${file}`);
      
      let skippedLines = 0;
      
      const parsedRows: any[] = [];
      const missingByYear = new Map<number, Set<string>>();
      const seenKeysInFile = new Set<string>();

      // PASSO 1: Lê as linhas, verifica no BD o que falta de inteiro teor
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          skippedLines++;
          continue;
        }
        
        const parts = line.split('""').map(p => p.replace(/"/g, ''));
        if (parts.length < 5) continue;
        
        const acordaoStr = parts[0];
        const match = acordaoStr.match(/(\d+)\/(\d{4})/);
        if (!match) continue;
        
        const numAcordao = Number(match[1]);
        const anoAcordao = Number(match[2]);
        const colegiado = parts[2]; // Colegiado
        
        // Use a composite temporary key for deduplication within the CSV
        const tempKey = `AC-${numAcordao}-${anoAcordao}-${colegiado}`;
        
        if (seenKeysInFile.has(tempKey)) {
          skippedLines++;
          continue;
        }
        seenKeysInFile.add(tempKey);
        
        const check = await pool.query(
          'SELECT key, acordao FROM tcu_acordaos WHERE num_acordao = $1 AND ano_acordao = $2 AND UPPER(colegiado) = UPPER($3)', 
          [numAcordao, anoAcordao, colegiado]
        );
        let teor = check.rows.length > 0 ? check.rows[0].acordao : null;
        
        parsedRows.push({
          numAcordao, anoAcordao, colegiado, tempKey, parts, 
          hasDb: check.rows.length > 0, 
          dbKey: check.rows.length > 0 ? check.rows[0].key : null,
          teor
        });

        if (isTeorMissing(teor)) {
          if (!missingByYear.has(anoAcordao)) missingByYear.set(anoAcordao, new Set());
          missingByYear.get(anoAcordao)!.add(JSON.stringify({ numAcordao: String(numAcordao), anoAcordao: String(anoAcordao), colegiado }));
        }
      }

      // PASSO 2: Carrega todos os teores ausentes em lote para evitar parsing lento do CSV
      const fetchedTeores = new Map<number, Map<string, ComplementaryData>>();
      for (const [ano, jsonSet] of missingByYear.entries()) {
        const targets: TargetAcordao[] = Array.from(jsonSet).map(j => JSON.parse(j));
        const mapForYear = await getComplementaryDataBulk(ano, targets);
        fetchedTeores.set(ano, mapForYear);
      }

      // PASSO 3: Insere ou atualiza os registros no BD
      for (const row of parsedRows) {
        const updatedAt = new Date().toLocaleString("pt-BR");
        
        // Defaults to what we had in DB (or parts if new)
        let compData: ComplementaryData | null = null;

        if (isTeorMissing(row.teor) && fetchedTeores.has(row.anoAcordao)) {
          const mapKey = `${row.numAcordao}-${row.colegiado.toUpperCase()}`;
          compData = fetchedTeores.get(row.anoAcordao)!.get(mapKey) || null;
        }

        if (row.hasDb) {
          if (compData) {
            await pool.query(`
              UPDATE tcu_acordaos SET
                colegiado = $2, data_sessao = $3,
                tipo_processo = $4, relator = $5,
                ultima_atualizacao = $6, acordao = $7,
                num_ata = $8, situacao = $9, proc = $10,
                acordaos_relacionados = $11, interessados = $12,
                entidade = $13, unidade_tecnica = $14,
                assunto = $15, sumario = $16, decisao = $17
              WHERE key = $1
            `, [
              row.dbKey, 
              row.parts[2], row.parts[1], row.parts[4], row.parts[5], updatedAt, 
              compData.acordao, compData.num_ata, compData.situacao, compData.proc,
              compData.acordaos_relacionados, compData.interessados, compData.entidade,
              compData.unidade_tecnica, compData.assunto, compData.sumario, compData.decisao
            ]);
          } else {
            // Se compData não existir e ele já tinha registro, tentamos pelo menos atualizar metadados básicos
            // Porém, se ele for um dos que a IA quebrou com "null", garantimos que não fique assim.
            await pool.query(`
              UPDATE tcu_acordaos SET
                colegiado = $2, data_sessao = $3,
                tipo_processo = $4, relator = $5,
                ultima_atualizacao = $6
              WHERE key = $1
            `, [
              row.dbKey, 
              row.parts[2], row.parts[1],
              row.parts[4], row.parts[5], updatedAt
            ]);
            
            // Corrige o "null" no banco se for o caso
            if (isTeorMissing(row.teor)) {
               await pool.query(`UPDATE tcu_acordaos SET acordao = NULL WHERE key = $1`, [row.dbKey]);
            }
          }
          updated++;
        } else {
          // If we don't have compData because it's somehow missing from API, provide defaults
          const fallbackTeor = compData?.acordao || row.teor || null;
          
          // Use API's native KEY if available, otherwise generate a composite fallback
          const finalKey = compData?.key || row.tempKey;
          
          await pool.query(`
            INSERT INTO tcu_acordaos (
              key, titulo, num_acordao, ano_acordao, colegiado, data_sessao,
              situacao, tipo_processo, relator, status_monitoramento, ultima_atualizacao, 
              acordao, num_ata, proc, acordaos_relacionados, interessados, 
              entidade, unidade_tecnica, assunto, sumario, decisao
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
              $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
            )
          `, [
            finalKey, `ACÓRDÃO ${row.numAcordao}/${row.anoAcordao} - ${row.parts[2].toUpperCase()}`, row.numAcordao, row.anoAcordao,
            row.parts[2], row.parts[1],
            compData?.situacao || "OFICIALIZADO", row.parts[4], row.parts[5],
            "Pendente", updatedAt, 
            fallbackTeor, compData?.num_ata || null, compData?.proc || null, compData?.acordaos_relacionados || null, 
            compData?.interessados || null, compData?.entidade || null, compData?.unidade_tecnica || row.parts[6] || null, 
            compData?.assunto || null, compData?.sumario || null, compData?.decisao || null
          ]);
          imported++;
        }
      }


      console.log(`[SYNC-LOCAL-ACORDAOS] Concluído processamento de ${file}. Linhas puladas: ${skippedLines}`);
      console.timeEnd(`Processamento ${file}`);
    }

    console.log(`[SYNC-LOCAL-ACORDAOS] Sincronização finalizada. Importados: ${imported}, Atualizados: ${updated}`);
    
    // Conforme solicitado pelo usuário, a IA não deve atuar de forma automática na sincronização local.
    // A extração e análise do inteiro teor via Gemini foi removida deste fluxo automático.

    res.json({ 
      success: true, 
      message: `Sincronização concluída (Ano ${currentYear}): ${imported} novos, ${updated} atualizados.`,
      report: [{ file: "Geral", imported, updated, skipped: 0 }]
    });
  } catch (err: any) {
    console.error("Erro na sincronizacao local:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});

router.get("/acordaos", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        key, titulo, num_acordao, ano_acordao, num_ata, colegiado, data_sessao, 
        situacao, proc, acordaos_relacionados, tipo_processo, interessados, 
        entidade, unidade_tecnica, relator, assunto, sumario, decisao, 
        recomendacoes, determinacoes, recomendacoes_determinacoes_unificado, 
        status_monitoramento, responsavel_interno, prazo_limite, observacoes, 
        ultima_atualizacao, ai_analysis_data
      FROM tcu_acordaos
    `);
    const mapped = result.rows.map(row => ({
      KEY: row.key,
      TITULO: row.titulo,
      NUMACORDAO: row.num_acordao,
      ANOACORDAO: row.ano_acordao,
      NUMATA: row.num_ata,
      COLEGIADO: row.colegiado,
      DATASESSAO: row.data_sessao,
      SITUACAO: row.situacao,
      PROC: row.proc,
      ACORDAOSRELACIONADOS: row.acordaos_relacionados,
      TIPOPROCESSO: row.tipo_processo,
      INTERESSADOS: row.interessados,
      ENTIDADE: row.entidade,
      UNIDADETECNICA: row.unidade_tecnica,
      RELATOR: row.relator,
      ASSUNTO: row.assunto,
      SUMARIO: row.sumario,
      ACORDAO: "", // Omitted to save bandwidth and memory
      DECISAO: row.decisao,
      RECOMENDACOES: row.recomendacoes,
      DETERMINACOES: row.determinacoes,
      RECOMENDACOES_DETERMINACOES_UNIFICADO: row.recomendacoes_determinacoes_unificado,
      STATUS_MONITORAMENTO: row.status_monitoramento,
      RESPONSAVEL_INTERNO: row.responsavel_interno,
      PRAZO_LIMITE: row.prazo_limite,
      OBSERVACOES: row.observacoes,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao,
      aiAnalysisData: row.ai_analysis_data
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching Acórdãos from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch Acórdãos." });
  }
});

function cleanTeor(rawTeor: string): string {
  if (!rawTeor) return "";
  let text = rawTeor;
  
  // Strip XML/HTML tags and replace with newlines to preserve spacing between sections
  text = text.replace(/<br\s*[\/]?>/gi, "\n");
  text = text.replace(/<p[^>]*>/gi, "\n\n");
  text = text.replace(/<\/p>/gi, "");
  // Substituir outras tags por quebra de linha para não juntar palavras
  text = text.replace(/<[^>]*>?/gm, "\n");
  
  // Remover múltiplas quebras de linha que foram geradas
  text = text.replace(/\n{3,}/g, "\n\n");
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, "\"");
  text = text.replace(/&#39;/g, "'");

  return text.trim();
}

router.get("/acordaos/:key/teor", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.query('SELECT acordao FROM tcu_acordaos WHERE key = $1', [key]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Acórdão não encontrado." });
    }
    const cleanText = cleanTeor(result.rows[0].acordao || "");
    res.json({ acordao: cleanText });
  } catch (err) {
    console.error("Error fetching teor from Postgres:", err);
    res.status(500).json({ error: "Failed to fetch teor." });
  }
});

router.post("/acordaos/update", async (req, res) => {
  try {
    const updated = req.body;
    const updatedAt = new Date().toLocaleString("pt-BR");
    
    const query = `
      UPDATE tcu_acordaos SET
        titulo = $2, num_acordao = $3, ano_acordao = $4, num_ata = $5,
        colegiado = $6, data_sessao = $7, situacao = $8, proc = $9,
        acordaos_relacionados = $10, tipo_processo = $11, interessados = $12,
        entidade = $13, unidade_tecnica = $14, relator = $15, assunto = $16,
        sumario = $17, acordao = $18, decisao = $19, recomendacoes = $20,
        determinacoes = $21, recomendacoes_determinacoes_unificado = $22, status_monitoramento = $23,
        responsavel_interno = $24, prazo_limite = $25, observacoes = $26,
        ultima_atualizacao = $27, ai_analysis_data = $28
      WHERE key = $1 RETURNING *
    `;
    
    const values = [
      updated.KEY, updated.TITULO, updated.NUMACORDAO, updated.ANOACORDAO,
      updated.NUMATA, updated.COLEGIADO, updated.DATASESSAO, updated.SITUACAO,
      updated.PROC, updated.ACORDAOSRELACIONADOS, updated.TIPOPROCESSO,
      updated.INTERESSADOS, updated.ENTIDADE, updated.UNIDADETECNICA,
      updated.RELATOR, updated.ASSUNTO, updated.SUMARIO, updated.ACORDAO,
      updated.DECISAO, updated.RECOMENDACOES, updated.DETERMINACOES,
      updated.RECOMENDACOES_DETERMINACOES_UNIFICADO, updated.STATUS_MONITORAMENTO,
      updated.RESPONSAVEL_INTERNO, updated.PRAZO_LIMITE, updated.OBSERVACOES,
      updatedAt, updated.aiAnalysisData ? JSON.stringify(updated.aiAnalysisData) : null
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rowCount && result.rowCount > 0) {
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Acórdão não encontrado no Postgres." });
    }
  } catch (err) {
    console.error("Error updating Acórdão in Postgres:", err);
    res.status(500).json({ error: "Failed to update Acórdão." });
  }
});

router.delete("/acordaos/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query('DELETE FROM tcu_acordaos WHERE key = $1', [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting Acórdão from Postgres:", err);
    res.status(500).json({ error: "Failed to delete Acórdão." });
  }
});

// ==========================================
// AI RESTORED ENDPOINTS
// ==========================================

router.post("/acordaos/:key/analisar-ressarcimento", async (req, res) => {
  try {
    const { key } = req.params;
    const result = await processSingleAcordao(key);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[AI Dossie API] Erro:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/acordaos/aprender", (req, res) => {
  const { tipo, palavra } = req.body;
  if (!tipo || !palavra) {
    return res.status(400).json({ error: "Faltam parâmetros tipo ou palavra." });
  }

  const DICT_PATH = path.join(DATA_DIR, "orbita_dictionary.json");
  try {
    let dict: any = {};
    if (fs.existsSync(DICT_PATH)) {
      dict = JSON.parse(fs.readFileSync(DICT_PATH, "utf-8"));
    }

    const key = `keywords${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    if (!dict[key]) {
      dict[key] = [];
    }

    const kw = palavra.toLowerCase().trim();
    if (!dict[key].includes(kw)) {
      dict[key].push(kw);
      fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2), "utf-8");
    }

    return res.json({ success: true, message: `Expressão '${kw}' aprendida com sucesso para ${tipo}!` });
  } catch (err: any) {
    console.error("Erro ao aprender nova palavra:", err);
    return res.status(500).json({ error: "Falha ao salvar no dicionário." });
  }
});

router.post("/acordaos/:key/auditoria-profunda", async (req, res) => {
  const { key } = req.params;
  
  try {
    const acResult = await pool.query('SELECT * FROM tcu_acordaos WHERE key = $1', [key]);
    if (acResult.rows.length === 0) {
      return res.status(404).json({ error: "Acórdão não encontrado." });
    }
    const acordao = acResult.rows[0];

    if (!acordao.acordao || acordao.acordao.trim() === "") {
      return res.status(400).json({ error: "Acórdão não encontrado ou sem inteiro teor." });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Chave da API do Gemini não configurada." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const textChunk = acordao.acordao.substring(0, 25000);

    const prompt = `
# ROLE E OBJETIVO
Você é o motor de extração semântica e análise de conformidade do sistema ÓRBITA. 
Responda às seguintes perguntas ou instruções do usuário com base no texto abaixo.

Texto do Acórdão:
"""
${textChunk}
"""

Pergunta do usuário:
${req.body.pergunta || 'Faça um resumo executivo deste Acórdão.'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { temperature: 0.2 }
    });

    return res.json({ success: true, analise: response.text });
  } catch (error: any) {
    console.error("[Auditoria Profunda] Erro:", error);
    return res.status(500).json({ error: "Falha na análise de inteligência artificial profunda." });
  }
});

export default router;
