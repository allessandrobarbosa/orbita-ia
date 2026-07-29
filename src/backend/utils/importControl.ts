import { pool } from "../db.js";
import crypto from "crypto";
import fs from "fs";

export type ImportStatus =
  | "INICIADO"
  | "BAIXANDO"
  | "PROCESSANDO"
  | "CONCLUIDO"
  | "ERRO"
  | "PARCIAL";

export type AnoStatus = "historico" | "corrente" | "futuro";

// =========================================================================
// REGRAS DE NEGÓCIO — CONTROLE ANUAL (SEM ANOS FIXOS)
// =========================================================================

/**
 * Determina o status de um ano específico com base na data atual.
 *
 * Regras:
 * - Ano CORRENTE: ano atual, elegível para atualização até 31/01 do ano seguinte.
 *   A partir de 01/02 do ano seguinte passa automaticamente para HISTÓRICO.
 * - Ano HISTÓRICO: não deve ser reprocessado automaticamente.
 * - Ano FUTURO: ignorado.
 */
export function getAnoStatus(ano: number, hoje: Date = new Date()): AnoStatus {
  const anoCorrente = hoje.getFullYear();

  if (ano > anoCorrente) {
    return "futuro";
  }

  // Data de encerramento: 01/02 do ano seguinte ao ano em questão
  // Ex: 2026 permanece "corrente" até 31/01/2027. A partir de 01/02/2027 -> "historico"
  const dataFechamento = new Date(ano + 1, 1, 1); // mês 1 = fevereiro (0-indexed)

  if (hoje >= dataFechamento) {
    return "historico";
  }

  // Se o ano é o corrente ou o anterior mas ainda não fechou
  return "corrente";
}

/**
 * Retorna o ano corrente para importação automática.
 * Considera a regra de encerramento: se hoje for 01/02 do ano seguinte
 * ao ano em questão, o ano corrente passa a ser o novo ano do calendário.
 */
export function getAnoParaImportacaoAutomatica(hoje: Date = new Date()): number {
  return hoje.getFullYear();
}

/**
 * Calcula o hash SHA-256 de um arquivo em disco.
 * Usado para detectar se o arquivo foi alterado na fonte oficial.
 */
export function calcularHashArquivo(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// =========================================================================
// FUNÇÕES DE CONTROLE DE IMPORTAÇÃO
// =========================================================================

export interface IniciarImportacaoParams {
  modulo: string;
  ano_referencia: number;
  tipo_arquivo: string;
  url_fonte?: string;
  nome_arquivo?: string;
  forcado_por_usuario?: string;
}

/**
 * Registra o início de uma operação de importação.
 * Retorna o ID do registro criado.
 */
export async function iniciarImportacao(
  params: IniciarImportacaoParams
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO tcu_import_control
       (modulo, ano_referencia, tipo_arquivo, url_fonte, nome_arquivo,
        status, forcado_por_usuario, data_inicio)
     VALUES ($1, $2, $3, $4, $5, 'INICIADO', $6, NOW())
     RETURNING id`,
    [
      params.modulo,
      params.ano_referencia,
      params.tipo_arquivo,
      params.url_fonte ?? null,
      params.nome_arquivo ?? null,
      params.forcado_por_usuario ?? null,
    ]
  );
  return result.rows[0].id;
}

export interface AtualizarStatusImportacaoParams {
  id: number;
  status: ImportStatus;
  tamanho_bytes?: number;
  hash_arquivo?: string;
  quantidade_linhas_csv?: number;
  quantidade_inseridos?: number;
  quantidade_atualizados?: number;
  quantidade_ignorados?: number;
  quantidade_erros?: number;
  eh_historico?: boolean;
  data_fechamento_historico?: Date;
  erro_detalhe?: string;
  observacoes?: string;
}

/**
 * Atualiza o status e os contadores de uma importação em andamento.
 */
export async function atualizarStatusImportacao(
  params: AtualizarStatusImportacaoParams
): Promise<void> {
  const isFinal =
    params.status === "CONCLUIDO" ||
    params.status === "ERRO" ||
    params.status === "PARCIAL";

  await pool.query(
    `UPDATE tcu_import_control SET
       status                    = $2,
       tamanho_bytes             = COALESCE($3, tamanho_bytes),
       hash_arquivo              = COALESCE($4, hash_arquivo),
       quantidade_linhas_csv     = COALESCE($5, quantidade_linhas_csv),
       quantidade_inseridos      = COALESCE($6, quantidade_inseridos),
       quantidade_atualizados    = COALESCE($7, quantidade_atualizados),
       quantidade_ignorados      = COALESCE($8, quantidade_ignorados),
       quantidade_erros          = COALESCE($9, quantidade_erros),
       eh_historico              = COALESCE($10, eh_historico),
       data_fechamento_historico = COALESCE($11, data_fechamento_historico),
       erro_detalhe              = COALESCE($12, erro_detalhe),
       observacoes               = COALESCE($13, observacoes),
       data_fim                  = CASE WHEN $14 THEN NOW() ELSE data_fim END
     WHERE id = $1`,
    [
      params.id,
      params.status,
      params.tamanho_bytes ?? null,
      params.hash_arquivo ?? null,
      params.quantidade_linhas_csv ?? null,
      params.quantidade_inseridos ?? null,
      params.quantidade_atualizados ?? null,
      params.quantidade_ignorados ?? null,
      params.quantidade_erros ?? null,
      params.eh_historico ?? null,
      params.data_fechamento_historico ?? null,
      params.erro_detalhe ?? null,
      params.observacoes ?? null,
      isFinal,
    ]
  );
}

/**
 * Registra erro fatal em uma importação.
 */
export async function registrarErroImportacao(
  id: number,
  erro: Error | string
): Promise<void> {
  const detalhe =
    typeof erro === "string" ? erro : `${erro.message}\n${erro.stack ?? ""}`;
  await atualizarStatusImportacao({
    id,
    status: "ERRO",
    erro_detalhe: detalhe.substring(0, 5000), // limita tamanho
  });
}

// =========================================================================
// CONSULTAS DE STATUS
// =========================================================================

/**
 * Retorna a última importação registrada para cada combinação módulo+ano.
 */
export async function getStatusImportacoes(): Promise<any[]> {
  const result = await pool.query(`SELECT * FROM vw_import_status`);
  return result.rows;
}

/**
 * Retorna a última importação de um módulo e ano específicos.
 */
export async function getUltimaImportacao(
  modulo: string,
  ano_referencia: number
): Promise<any | null> {
  const result = await pool.query(
    `SELECT * FROM tcu_import_control
     WHERE modulo = $1 AND ano_referencia = $2
     ORDER BY id DESC LIMIT 1`,
    [modulo, ano_referencia]
  );
  return result.rows[0] ?? null;
}

/**
 * Verifica se um ano histórico já foi completamente importado
 * e não precisa de nova importação automática.
 */
export async function anoHistoricoJaImportado(
  modulo: string,
  ano_referencia: number
): Promise<boolean> {
  const ultima = await getUltimaImportacao(modulo, ano_referencia);
  if (!ultima) return false;
  return ultima.status === "CONCLUIDO" && ultima.eh_historico === true;
}
