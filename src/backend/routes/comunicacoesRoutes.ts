import { Router } from "express";
import { pool } from "../db.js";
import fs from "fs";
import path from "path";

const router = Router();

// =====================================
// API: Sync Local Comunicacoes
// =====================================
router.post("/comunicacoes/sync-local", async (req, res) => {
  const COM_DIR = path.join(process.cwd(), "data", "tcu", "comunicacoes");
  if (!fs.existsSync(COM_DIR)) {
    return res.status(400).json({ success: false, message: "Diretório data/tcu/comunicacoes não encontrado." });
  }

  const files = fs.readdirSync(COM_DIR);
  const csvFiles = files.filter(f => f.toLowerCase().endsWith(".csv"));

  if (csvFiles.length === 0) {
    return res.json({ success: false, message: "Nenhum arquivo .csv encontrado na pasta data/tcu/comunicacoes/." });
  }

  try {
    let imported = 0;
    let updated = 0;
    const updatedAt = new Date().toLocaleString("pt-BR");

    for (const file of csvFiles) {
      const isPendente = file.toLowerCase().includes("pendente");
      const isRespondida = file.toLowerCase().includes("respondida") || file.toLowerCase().includes("encerrada");
      
      const filePath = path.join(COM_DIR, file);
      // Lê o CSV (considerando a mesma codificação base, ou utf8)
      // O módulo do TCU usa ISO-8859-1 geralmente, mas como estamos lendo localmente, utf8 é o padrão se eles salvarem do excel
      let content = fs.readFileSync(filePath, 'utf8');
      if (!content || content.trim().length < 10) continue;

      // Autodetect delimiter
      const firstLineEnd = content.indexOf('\n');
      const headerLine = firstLineEnd > 0 ? content.substring(0, firstLineEnd) : content;
      const semiCount = (headerLine.match(/;/g) || []).length;
      const commaCount = (headerLine.match(/,/g) || []).length;
      const tabCount = (headerLine.match(/\t/g) || []).length;
      let delimiter = ",";
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ";";
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = "t";

      // Parse CSV Robust (same logic as frontend)
      const rows: string[][] = [];
      let currentField = "";
      let currentRow: string[] = [];
      let inQuotes = false;
      for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];
        if (inQuotes) {
          if (char === '"' && nextChar === '"') { currentField += '"'; i++; }
          else if (char === '"') {
            const isEndOfField = nextChar === delimiter || nextChar === 'r' || nextChar === 'n' || nextChar === undefined;
            if (isEndOfField) inQuotes = false;
            else currentField += '"';
          } else { currentField += char; }
        } else {
          if (char === '"') inQuotes = true;
          else if (char === delimiter) { currentRow.push(currentField.trim()); currentField = ""; }
          else if (char === 'r' && nextChar === 'n') {
            currentRow.push(currentField.trim());
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = []; currentField = ""; i++;
          } else if (char === 'n') {
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

      // Process parsed rows
      for (let i = 0; i < rows.length; i++) {
        const fields = rows[i];
        if (fields.length < 5) continue;
        
        const comunicacao = fields[0] || "";
        const destinatario = fields[1] || "";
        const contato = fields[2] || "";
        const unidadeEmitente = fields[3] || "";
        const processo = fields[4] || "";
        const dataExpedicao = fields[5] || "";
        let dataResposta = fields[6] || "";

        // Ignorar headers
        if (comunicacao.toLowerCase().includes("comunicac") || destinatario.toLowerCase().includes("destinat")) continue;

        // Force DATA_RESPOSTA based on filename
        if (isPendente) {
          dataResposta = "";
        } else if (isRespondida && dataResposta.trim() === "") {
          // If the file is 'respondidas' but date is empty, force a generic date or just leave it.
          // Usually they have dates if they are in the respondidas report.
        }

        // Extract year
        let ano = 2026;
        const dateMatch = dataExpedicao.match(/\/(\d{4})/);
        if (dateMatch) ano = parseInt(dateMatch[1]);
        else {
          const nameMatch = comunicacao.match(/\/(\d{4})/);
          if (nameMatch) ano = parseInt(nameMatch[1]);
        }

        const numOnly = (comunicacao.match(/\d+[\.\d]*/) || [""])[0].replace(/\D/g, "");
        const key = `COM-${numOnly || Math.floor(Math.random() * 1000000)}-${ano}`;

        const checkResult = await pool.query('SELECT key FROM tcu_comunicacoes WHERE key = $1 OR (comunicacao = $2 AND ano = $3)', [key, comunicacao, ano.toString()]);
        
        const carece = true; // Por default as importadas carecem, ou ajustar se for o caso
        
        if (checkResult.rows.length > 0) {
          const existingKey = checkResult.rows[0].key;
          await pool.query(`
            UPDATE tcu_comunicacoes SET
              destinatario = $2, contato = $3, unidade_emitente = $4,
              processo = $5, data_expedicao = $6, data_resposta = $7,
              ultima_atualizacao = $8
            WHERE key = $1
          `, [existingKey, destinatario, contato, unidadeEmitente, processo, dataExpedicao, dataResposta, updatedAt]);
          updated++;
        } else {
          await pool.query(`
            INSERT INTO tcu_comunicacoes (
              key, comunicacao, destinatario, contato, unidade_emitente,
              processo, data_expedicao, data_resposta, ano, carece_resposta,
              ultima_atualizacao
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            key, comunicacao, destinatario, contato, unidadeEmitente,
            processo, dataExpedicao, dataResposta, ano.toString(), carece,
            updatedAt
          ]);
          imported++;
        }
      }
    }

    res.json({ 
      success: true, 
      message: `Sincronização local concluída: ${imported} novos, ${updated} atualizados.`,
      report: [{ file: "Geral", imported, updated, skipped: 0 }]
    });
  } catch (err: any) {
    console.error("Erro na sincronização local de comunicacoes:", err);
    res.status(500).json({ success: false, message: "Erro no servidor ao processar arquivos CSV." });
  }
});

// API: Get all comunicacoes
router.get("/comunicacoes", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tcu_comunicacoes');
    const mapped = result.rows.map(row => ({
      KEY: row.key,
      COMUNICACAO: row.comunicacao,
      DESTINATARIO: row.destinatario,
      CONTATO: row.contato,
      UNIDADE_EMITENTE: row.unidade_emitente,
      PROCESSO: row.processo,
      DATA_EXPEDICAO: row.data_expedicao,
      DATA_RESPOSTA: row.data_resposta,
      ANO: row.ano,
      CARECE_RESPOSTA: row.carece_resposta,
      PRAZO_DIAS: row.prazo_dias,
      RESPOSTA_ENVIADA_INTERNAMENTE: row.resposta_enviada_internamente,
      UNIDADE_EXECUTORA: row.unidade_executora,
      PROCESSO_SEI: row.processo_sei,
      DESTINACAO: row.destinacao,
      ULTIMA_ATUALIZACAO: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error fetching comunicacoes:", err);
    res.status(500).json({ error: "Failed to fetch comunicacoes." });
  }
});

// API: Update single comunicacao
router.post("/comunicacoes/update", async (req, res) => {
  try {
    const updated = req.body;
    updated.ULTIMA_ATUALIZACAO = new Date().toLocaleString("pt-BR");

    const checkResult = await pool.query('SELECT key FROM tcu_comunicacoes WHERE key = $1', [updated.KEY]);
    
    if (checkResult.rows.length > 0) {
      await pool.query(`
        UPDATE tcu_comunicacoes SET
          comunicacao = $2, destinatario = $3, contato = $4, unidade_emitente = $5,
          processo = $6, data_expedicao = $7, data_resposta = $8, ano = $9,
          carece_resposta = $10, prazo_dias = $11, resposta_enviada_internamente = $12,
          unidade_executora = $13, processo_sei = $14, destinacao = $15, ultima_atualizacao = $16
        WHERE key = $1
      `, [
        updated.KEY, updated.COMUNICACAO, updated.DESTINATARIO, updated.CONTATO,
        updated.UNIDADE_EMITENTE, updated.PROCESSO, updated.DATA_EXPEDICAO,
        updated.DATA_RESPOSTA, updated.ANO, updated.CARECE_RESPOSTA,
        updated.PRAZO_DIAS, updated.RESPOSTA_ENVIADA_INTERNAMENTE,
        updated.UNIDADE_EXECUTORA, updated.PROCESSO_SEI, updated.DESTINACAO,
        updated.ULTIMA_ATUALIZACAO
      ]);
      res.json({ success: true, item: updated });
    } else {
      res.status(404).json({ error: "Comunicação não encontrada." });
    }
  } catch (err) {
    console.error("Error updating comunicacao:", err);
    res.status(500).json({ error: "Failed to update comunicacao." });
  }
});

// API: Delete comunicacao
router.delete("/comunicacoes/:key", async (req, res) => {
  try {
    const { key } = req.params;
    await pool.query('DELETE FROM tcu_comunicacoes WHERE key = $1', [key]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting comunicacao:", err);
    res.status(500).json({ error: "Failed to delete comunicacao." });
  }
});

// API: Import comunicacoes
router.post("/comunicacoes/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato inválido." });
    }


    const updatedAt = new Date().toLocaleString("pt-BR");

// Bulk upsert for comunicação items
const batchSize = 500;
let importedCount = 0;
let updatedCount = 0;
for (let i = 0; i < items.length; i += batchSize) {
  const batch = items.slice(i, i + batchSize);
  // Ensure each item has a KEY
  batch.forEach(item => {
    if (!item.KEY) {
      item.KEY = `${item.COMUNICACAO}-${item.ANO}`;
    }
  });
  const values: string[] = [];
  const params: any[] = [];
  batch.forEach((item, idx) => {
    const base = idx * 16;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14}, $${base + 15}, $${base + 16})`);
    params.push(
      item.KEY,
      item.COMUNICACAO,
      item.DESTINATARIO,
      item.CONTATO,
      item.UNIDADE_EMITENTE,
      item.PROCESSO,
      item.DATA_EXPEDICAO,
      item.DATA_RESPOSTA,
      item.ANO,
      item.CARECE_RESPOSTA,
      item.PRAZO_DIAS,
      item.RESPOSTA_ENVIADA_INTERNAMENTE,
      item.UNIDADE_EXECUTORA,
      item.PROCESSO_SEI,
      item.DESTINACAO,
      updatedAt
    );
  });
  const query = `
    INSERT INTO tcu_comunicacoes (key, comunicacao, destinatario, contato, unidade_emitente,
      processo, data_expedicao, data_resposta, ano, carece_resposta,
      prazo_dias, resposta_enviada_internamente, unidade_executora,
      processo_sei, destinacao, ultima_atualizacao)
    VALUES ${values.join(',')}
    ON CONFLICT (key) DO UPDATE SET
      comunicacao = EXCLUDED.comunicacao,
      destinatario = EXCLUDED.destinatario,
      contato = EXCLUDED.contato,
      unidade_emitente = EXCLUDED.unidade_emitente,
      processo = EXCLUDED.processo,
      data_expedicao = EXCLUDED.data_expedicao,
      data_resposta = EXCLUDED.data_resposta,
      ano = EXCLUDED.ano,
      carece_resposta = EXCLUDED.carece_resposta,
      prazo_dias = EXCLUDED.prazo_dias,
      resposta_enviada_internamente = EXCLUDED.resposta_enviada_internamente,
      unidade_executora = EXCLUDED.unidade_executora,
      processo_sei = EXCLUDED.processo_sei,
      destinacao = EXCLUDED.destinacao,
      ultima_atualizacao = EXCLUDED.ultima_atualizacao
    RETURNING (xmax = 0) AS inserted;`;
  const result = await pool.query(query, params);
  result.rows.forEach(row => {
    if (row.inserted) importedCount++;
    else updatedCount++;
  });
}

    const totalResult = await pool.query('SELECT COUNT(*) FROM tcu_comunicacoes');
    
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: parseInt(totalResult.rows[0].count),
      items: [] 
    });
  } catch (err) {
    console.error("Error importing comunicacoes:", err);
    res.status(500).json({ error: "Failed to import comunicacoes." });
  }
});

export default router;
