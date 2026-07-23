import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/cgu", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cgu_demands');
    const mapped = result.rows.map(row => ({
      idTarefa: row.id_tarefa,
      situacao: row.situacao,
      estado: row.estado,
      tituloTarefa: row.titulo_tarefa,
      dataInicio: row.data_inicio,
      dataFim: row.data_fim,
      dataLimite: row.data_limite,
      unidadeAuditada: row.unidade_auditada,
      unidadesAuditoria: row.unidades_auditoria,
      textoMonitoramento: row.texto_monitoramento,
      providencia: row.providencia,
      tipoUltimaManifestacao: row.tipo_ultima_manifestacao,
      textoUltimaManifestacao: row.texto_ultima_manifestacao,
      dataUltimaManifestacao: row.data_ultima_manifestacao,
      tipoUltimoPosicionamento: row.tipo_ultimo_posicionamento,
      textoUltimoPosicionamento: row.texto_ultimo_posicionamento,
      dataUltimoPosicionamento: row.data_ultimo_posicionamento,
      categoria: row.categoria,
      dataLimiteInicial: row.data_limite_inicial,
      ano: row.ano,
      ultimaAtualizacao: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching cgu demands:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/cgu/update", async (req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating cgu:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/cgu/:id", async (req, res) => {
  try {
    await pool.query('DELETE FROM cgu_demands WHERE id_tarefa = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting cgu:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/cgu/reports", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cgu_reports');
    const mapped = result.rows.map(row => ({
      idTarefa: row.id_tarefa,
      idAuditoria: row.id_auditoria,
      tituloAuditoria: row.titulo_auditoria,
      ano: row.ano,
      uf: row.uf,
      municipio: row.municipio,
      codigoMunicipio: row.codigo_municipio,
      assunto: row.assunto,
      dataPublicacao: row.data_publicacao,
      linkRelatorio: row.link_relatorio,
      localPdf: row.local_pdf,
      sumarioExecutivo: row.sumario_executivo,
      aiAbstract: row.ai_abstract,
      ultimaAtualizacao: row.ultima_atualizacao
    }));
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching cgu reports:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/cgu/reports/:idTarefa", async (req, res) => {
  try {
    await pool.query('DELETE FROM cgu_reports WHERE id_tarefa = $1', [req.params.idTarefa]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting cgu report:", error);
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
