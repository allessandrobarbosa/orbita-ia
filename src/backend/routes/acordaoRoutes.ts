import express from "express";
import { pool } from "../db";
import fs from "fs";
import path from "path";
import { parseCsvStream } from "../utils/tcuUtils";
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
  const csvFiles = files.filter(f => f.toLowerCase().endsWith(".csv"));

  if (csvFiles.length === 0) {
    return res.json({ success: false, message: "Nenhum arquivo .csv encontrado na pasta data/tcu/acordaos/." });
  }

  try {
    let imported = 0;
    let updated = 0;

    for (const file of csvFiles) {
      const filePath = path.join(TCU_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('n');
      
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split('""').map(p => p.replace(/"/g, ''));
        if (parts.length < 5) continue;
        
        // parts[0] is Acórdão, e.g. "3651/2026-1C"
        // parts[1] is Data da sessão
        // parts[2] is Colegiado
        // parts[3] is Processo
        // parts[4] is Tipo de processo
        // parts[5] is Relator
        // parts[6] is Unidade técnica
        
        const acordaoStr = parts[0];
        const match = acordaoStr.match(/(\d+)\/(\d{4})/);
        if (!match) continue;
        
        const numAcordao = Number(match[1]);
        const anoAcordao = Number(match[2]);
        
        const key = `AC-${numAcordao}-${anoAcordao}`;
        const check = await pool.query('SELECT key FROM tcu_acordaos WHERE num_acordao = $1 AND ano_acordao = $2', [numAcordao, anoAcordao]);
        const updatedAt = new Date().toLocaleString("pt-BR");
        
        if (check.rows.length > 0) {
          await pool.query(`
            UPDATE tcu_acordaos SET
              colegiado = $2, data_sessao = $3,
              tipo_processo = $4, relator = $5,
              ultima_atualizacao = $6
            WHERE key = $1
          `, [
            check.rows[0].key, 
            parts[2], parts[1],
            parts[4], parts[5], updatedAt
          ]);
          updated++;
        } else {
          await pool.query(`
            INSERT INTO tcu_acordaos (
              key, titulo, num_acordao, ano_acordao, colegiado, data_sessao,
              situacao, tipo_processo, relator, status_monitoramento, ultima_atualizacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            key, `ACÓRDÃO ${numAcordao}/${anoAcordao} - ${parts[2].toUpperCase()}`, numAcordao, anoAcordao,
            parts[2], parts[1],
            "OFICIALIZADO", parts[4], parts[5],
            "Pendente", updatedAt
          ]);
          imported++;
        }
      }
    }

    // Enfileirar apenas do ano corrente (estáticos de anos anteriores não são atualizados via IA na importação)
    const currentYear = new Date().getFullYear();
    try {
      const pendingRes = await pool.query(
        "SELECT key FROM tcu_acordaos WHERE ano_acordao = $1 AND status_monitoramento = 'Pendente' AND (ai_analysis_data IS NULL OR ai_analysis_data::text = '{}' OR ai_analysis_data::text = 'null')", 
        [currentYear]
      );
      if (pendingRes.rows.length > 0) {
        const keysToProcess = pendingRes.rows.map(r => r.key);
        enqueueAcordaosForAnalysis(keysToProcess);
        console.log(`[Sync] Enfileirados ${keysToProcess.length} acórdãos de ${currentYear} para processamento de IA em background.`);
      }
    } catch (bgErr) {
      console.error("Erro ao enfileirar acórdãos para IA:", bgErr);
    }

    res.json({ 
      success: true, 
      message: `Sincronização concluída: ${imported} novos, ${updated} atualizados.`,
      report: [{ file: "Geral", imported, updated, skipped: 0 }]
    });
  } catch (err: any) {
    console.error("Erro na sincronizacao local:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});

router.get("/acordaos", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tcu_acordaos');
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
      ACORDAO: row.acordao,
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
