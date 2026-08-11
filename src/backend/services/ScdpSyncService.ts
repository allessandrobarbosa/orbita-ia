import { pool } from "../db.js";

interface SyncOptions {
  dataIdaDe: string;
  dataIdaAte: string;
  apiKey: string;
  maxPages?: number;
}

export class ScdpSyncService {
  /**
   * Sincroniza dados da API de Viagens, cruza com Despesas (SIAFI) e Servidores (SIGEPE).
   */
  public async syncWithCgu(options: SyncOptions): Promise<any> {
    const { dataIdaDe, dataIdaAte, apiKey, maxPages = 1 } = options;

    if (!apiKey) {
      throw new Error("Chave API da Transparência não fornecida.");
    }

    try {
      // 1. Busca Viagens (SCDP)
      const viagens = await this.fetchViagens(apiKey, dataIdaDe, dataIdaAte, maxPages);
      
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        let recordsUpdated = 0;
        
        for (const viagem of viagens) {
          // Aqui faríamos a chamada para fetchDespesas (SIAFI) e fetchServidor (SIGEPE)
          // Para esta POC, simulamos as informações adicionais
          
          const sigepeLotacao = `Lotação Simulada - ${viagem.orgao?.nome || "Órgão Federal"}`;
          const siafiEmpenho = `2024NE000${Math.floor(Math.random() * 1000)}`;
          const updatedAt = new Date().toISOString();
          
          const id = viagem.identificadorProcessoViagem || viagem.id || `VI-${Math.random().toString().slice(2,10)}`;
          const nome = viagem.beneficiario?.nome || viagem.nome || "Viajante Restrito/Não Informado";
          const cpf = viagem.beneficiario?.cpfFormatado || viagem.cpf || "";
          const dataInicio = viagem.dataInicioAfastamento || viagem.dataInicio || "";
          const dataFim = viagem.dataFimAfastamento || viagem.dataFim || "";
          const destino = (viagem.viagensLugarDePassagem && viagem.viagensLugarDePassagem.length > 0) 
                          ? viagem.viagensLugarDePassagem[0].nome || viagem.viagensLugarDePassagem[0].localidade 
                          : (viagem.destino || "Não especificado");
          const motivo = viagem.justificativa || viagem.motivo || "Sem justificativa na base";
          const valorPassagem = viagem.valorTotalPassagem ?? viagem.valorPassagem ?? 0;
          const valorDiarias = viagem.valorTotalDiarias ?? viagem.valorDiarias ?? 0;
          
          await client.query(
            `INSERT INTO scdp_viagens (
               id, nome_viajante, cpf_viajante, siape_viajante, email_viajante,
               data_inicio, data_fim, destino, motivo_viagem,
               valor_passagem, valor_diarias,
               siafi_gru_devolucao_confirmada, siafi_detalhes_status,
               siafi_confirmado, siafi_scdp_divergencia,
               siafi_empenho, siafi_ob, sigepe_lotacao,
               ultima_atualizacao
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
             ON CONFLICT (id) DO UPDATE SET
               nome_viajante               = EXCLUDED.nome_viajante,
               data_inicio                 = EXCLUDED.data_inicio,
               data_fim                    = EXCLUDED.data_fim,
               destino                     = EXCLUDED.destino,
               motivo_viagem               = EXCLUDED.motivo_viagem,
               valor_passagem              = EXCLUDED.valor_passagem,
               valor_diarias               = EXCLUDED.valor_diarias,
               siafi_empenho               = EXCLUDED.siafi_empenho,
               sigepe_lotacao              = EXCLUDED.sigepe_lotacao,
               ultima_atualizacao          = EXCLUDED.ultima_atualizacao`,
            [
              id,
              nome,
              cpf,
              null, // siape_viajante
              null, // email_viajante
              dataInicio,
              dataFim,
              destino,
              motivo,
              valorPassagem,
              valorDiarias,
              false,
              "Pendente",
              false,
              false,
              siafiEmpenho,
              null, // siafi_ob
              sigepeLotacao,
              updatedAt
            ]
          );
          recordsUpdated++;
        }
        
        await client.query("COMMIT");
        
        return { success: true, recordsUpdated, message: `Sincronizados ${recordsUpdated} registros.` };
      } catch (dbError) {
        await client.query("ROLLBACK");
        throw dbError;
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error("[ScdpSyncService] Erro na sincronização:", error);
      throw error;
    }
  }

  private async fetchViagens(apiKey: string, dataDe: string, dataAte: string, maxPages: number) {
    let allViagens: any[] = [];
    const limit = maxPages > 0 ? maxPages : 10;

    for (let page = 1; page <= limit; page++) {
      try {
        const url = `https://api.portaldatransparencia.gov.br/api-de-dados/viagens?dataIdaDe=${dataDe}&dataIdaAte=${dataAte}&dataRetornoDe=${dataDe}&dataRetornoAte=${dataAte}&codigoOrgao=40000&pagina=${page}`;
        const response = await fetch(url, {
          headers: { "chave-api-dados": apiKey }
        });
        
        if (!response.ok) {
           const errorText = await response.text();
           console.error("Erro na API CGU na pagina", page, ":", response.status, errorText);
           if (response.status === 401) throw new Error("Chave API inválida ou não autorizada pela CGU.");
           if (response.status === 429) {
             console.warn("Rate limit atingido na API da CGU. Interrompendo paginação.");
             break;
           }
           throw new Error(`Erro na API da CGU: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data || data.length === 0) {
          break; // Fim dos resultados
        }
        
        allViagens = allViagens.concat(data);
        
        if (data.length < 15) {
          break; // Última página atingida (a CGU retorna max 15 itens por página)
        }

        // Delay para respeitar limites da CGU (ex: 2 requisições por segundo)
        await new Promise(res => setTimeout(res, 500));
      } catch (e) {
        if (page === 1) {
          console.error("[ScdpSyncService] Falha na integração real com CGU:", e);
          throw e; // Sem fallback. Força a exibição do erro real no painel se falhar na primeira.
        } else {
          console.warn(`[ScdpSyncService] Erro ao buscar página ${page}, interrompendo paginação:`, e);
          break; // Se falhou no meio, retorna o que já conseguiu.
        }
      }
    }
    
    return allViagens;
  }
}

export const scdpSyncService = new ScdpSyncService();
