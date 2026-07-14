import { pool } from "../db";

export async function upsertAcordao(item: any): Promise<void> {
  const checkResult = await pool.query('SELECT key, status_monitoramento, responsavel_interno, prazo_limite, observacoes FROM acordaos WHERE num_acordao = $1 AND ano_acordao = $2', [item.NUMACORDAO, item.ANOACORDAO]);

  const updatedAt = new Date().toLocaleString("pt-BR");

  if (checkResult.rows.length > 0) {
    const existing = checkResult.rows[0];
    await pool.query(`
      UPDATE acordaos SET
        titulo = $2, num_ata = $3, colegiado = $4, data_sessao = $5,
        situacao = $6, proc = $7, acordaos_relacionados = $8, tipo_processo = $9,
        interessados = $10, entidade = $11, unidade_tecnica = $12, relator = $13,
        assunto = $14, sumario = $15, acordao = $16, decisao = $17,
        ultima_atualizacao = $18
      WHERE key = $1
    `, [
      existing.key, item.TITULO, item.NUMATA, item.COLEGIADO, item.DATASESSAO,
      item.SITUACAO, item.PROC, item.ACORDAOSRELACIONADOS, item.TIPOPROCESSO,
      item.INTERESSADOS, item.ENTIDADE, item.UNIDADETECNICA, item.RELATOR,
      item.ASSUNTO, item.SUMARIO, item.ACORDAO, item.DECISAO, updatedAt
    ]);
  } else {
    await pool.query(`
      INSERT INTO acordaos (
        key, titulo, num_acordao, ano_acordao, num_ata, colegiado, data_sessao,
        situacao, proc, acordaos_relacionados, tipo_processo, interessados,
        entidade, unidade_tecnica, relator, assunto, sumario, acordao, decisao,
        status_monitoramento, responsavel_interno, prazo_limite, observacoes, ultima_atualizacao
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
    `, [
      item.KEY, item.TITULO, item.NUMACORDAO, item.ANOACORDAO, item.NUMATA, item.COLEGIADO, item.DATASESSAO,
      item.SITUACAO, item.PROC, item.ACORDAOSRELACIONADOS, item.TIPOPROCESSO, item.INTERESSADOS,
      item.ENTIDADE, item.UNIDADETECNICA, item.RELATOR, item.ASSUNTO, item.SUMARIO, item.ACORDAO, item.DECISAO,
      item.STATUS_MONITORAMENTO, item.RESPONSAVEL_INTERNO, item.PRAZO_LIMITE, item.OBSERVACOES, updatedAt
    ]);
  }
}

export async function checkAcordaoExists(numAcordao: number, anoAcordao: number): Promise<any> {
  const result = await pool.query('SELECT * FROM acordaos WHERE num_acordao = $1 AND ano_acordao = $2', [numAcordao, anoAcordao]);
  return result.rows.length > 0 ? result.rows[0] : null;
}
