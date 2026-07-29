import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/scdp/viagens", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scdp_viagens');
    
    // Convert snake_case to camelCase for the frontend
    const mapped = result.rows.map(r => ({
      id: r.id,
      nomeViajante: r.nome_viajante,
      cpfViajante: r.cpf_viajante,
      siapeViajante: r.siape_viajante,
      emailViajante: r.email_viajante,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      destino: r.destino,
      motivoViagem: r.motivo_viagem,
      valorPassagem: parseFloat(r.valor_passagem) || 0,
      valorDiarias: parseFloat(r.valor_diarias) || 0,
      siafiGruDevolucaoConfirmada: r.siafi_gru_devolucao_confirmada,
      siafiDetalhesStatus: r.siafi_detalhes_status,
      siafiConfirmado: r.siafi_confirmado,
      siafiScdpDivergencia: r.siafi_scdp_divergencia,
      ultimaAtualizacao: r.ultima_atualizacao
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching SCDP trips:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/scdp/viagens/:id/confirm-gru", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE scdp_viagens SET siafi_gru_devolucao_confirmada = true, siafi_detalhes_status = $1, siafi_confirmado = true WHERE id = $2 RETURNING *",
      ["Conciliado (Com Devolução GRU)", id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Viagem não encontrada no Postgres." });
    }

    const r = result.rows[0];
    const mapped = {
      id: r.id,
      nomeViajante: r.nome_viajante,
      cpfViajante: r.cpf_viajante,
      siapeViajante: r.siape_viajante,
      emailViajante: r.email_viajante,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      destino: r.destino,
      motivoViagem: r.motivo_viagem,
      valorPassagem: parseFloat(r.valor_passagem) || 0,
      valorDiarias: parseFloat(r.valor_diarias) || 0,
      siafiGruDevolucaoConfirmada: r.siafi_gru_devolucao_confirmada,
      siafiDetalhesStatus: r.siafi_detalhes_status,
      siafiConfirmado: r.siafi_confirmado,
      siafiScdpDivergencia: r.siafi_scdp_divergencia,
      ultimaAtualizacao: r.ultima_atualizacao
    };

    return res.json({ success: true, item: mapped });
  } catch (error) {
    console.error("Error confirming GRU:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

// =========================================================================
// POST /scdp/import-local-files
// Importa viagens de planilhas locais para o PostgreSQL com controle de
// importação e auditoria. Substitui a lógica legada baseada em JSON.
// =========================================================================
router.post("/scdp/import-local-files", async (req, res) => {
  try {
    const { iniciarImportacao, atualizarStatusImportacao, registrarErroImportacao } =
      await import("../utils/importControl.js");

    const { items } = req.body ?? {};
    const updatedAt = new Date().toISOString();
    const usuarioId: string = (req as any).session?.user?.id ?? "SISTEMA";

    const importControlId = await iniciarImportacao({
      modulo: "SCDP_VIAGENS",
      ano_referencia: new Date().getFullYear(),
      tipo_arquivo: "JSON_UPLOAD",
      forcado_por_usuario: usuarioId,
    });

    // Se não foram enviados itens no body, apenas retorna os dados atuais do DB
    if (!items || !Array.isArray(items) || items.length === 0) {
      await atualizarStatusImportacao({
        id: importControlId,
        status: "CONCLUIDO",
        quantidade_inseridos: 0,
        observacoes: "Nenhum item recebido. Retornando dados existentes.",
      });

      const result = await pool.query(
        "SELECT * FROM scdp_viagens ORDER BY data_inicio DESC"
      );
      return res.json({
        success: true,
        recordsUpdated: 0,
        message: "Nenhum dado novo para importar.",
        data: result.rows,
      });
    }

    await atualizarStatusImportacao({
      id: importControlId,
      status: "PROCESSANDO",
      quantidade_linhas_csv: items.length,
    });

    let recordsUpdated = 0;
    let erros = 0;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const item of items) {
        try {
          await client.query(
            `INSERT INTO scdp_viagens (
               id, nome_viajante, cpf_viajante, siape_viajante, email_viajante,
               data_inicio, data_fim, destino, motivo_viagem,
               valor_passagem, valor_diarias,
               siafi_gru_devolucao_confirmada, siafi_detalhes_status,
               siafi_confirmado, siafi_scdp_divergencia, ultima_atualizacao
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             ON CONFLICT (id) DO UPDATE SET
               nome_viajante               = EXCLUDED.nome_viajante,
               data_inicio                 = EXCLUDED.data_inicio,
               data_fim                    = EXCLUDED.data_fim,
               destino                     = EXCLUDED.destino,
               motivo_viagem               = EXCLUDED.motivo_viagem,
               valor_passagem              = EXCLUDED.valor_passagem,
               valor_diarias               = EXCLUDED.valor_diarias,
               siafi_scdp_divergencia      = EXCLUDED.siafi_scdp_divergencia,
               ultima_atualizacao          = EXCLUDED.ultima_atualizacao`,
            [
              item.id,
              item.nomeViajante ?? null,
              item.cpfViajante ?? null,
              item.siapeViajante ?? null,
              item.emailViajante ?? null,
              item.dataInicio ?? null,
              item.dataFim ?? null,
              item.destino ?? null,
              item.motivoViagem ?? null,
              item.valorPassagem ?? 0,
              item.valorDiarias ?? 0,
              item.siafiGruDevolucaoConfirmada ?? false,
              item.siafiDetalhesStatus ?? null,
              item.siafiConfirmado ?? false,
              item.siafiScdpDivergencia ?? false,
              updatedAt,
            ]
          );
          recordsUpdated++;
        } catch (errItem: any) {
          console.error(`[SCDP-IMPORT] Erro no item ${item.id}:`, errItem.message);
          erros++;
        }
      }

      await client.query("COMMIT");
    } catch (errTx: any) {
      await client.query("ROLLBACK");
      throw errTx;
    } finally {
      client.release();
    }

    await atualizarStatusImportacao({
      id: importControlId,
      status: erros > 0 && recordsUpdated === 0 ? "ERRO" : erros > 0 ? "PARCIAL" : "CONCLUIDO",
      quantidade_inseridos: recordsUpdated,
      quantidade_erros: erros,
      observacoes: `Importação manual pelo usuário ${usuarioId}.`,
    });

    return res.json({
      success: true,
      recordsUpdated,
      message: `${recordsUpdated} viagem(ns) importada(s) com sucesso.`,
    });
  } catch (err: any) {
    console.error("[SCDP-IMPORT] Erro fatal:", err);
    return res.status(500).json({ error: "Erro interno ao importar viagens SCDP." });
  }
});

// =========================================================================
// GET /scdp/import-status — Status das importações SCDP
// =========================================================================
router.get("/scdp/import-status", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM tcu_import_control
       WHERE modulo = 'SCDP_VIAGENS'
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
