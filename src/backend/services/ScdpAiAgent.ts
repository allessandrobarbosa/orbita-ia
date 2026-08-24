import { analyzeScdpViagemWithGemini } from "../utils/aiUtils.js";

interface Viagem {
  id: string;
  nome_viajante: string;
  data_inicio: string;
  data_fim: string;
  destino: string;
  motivo_viagem: string;
  valor_total: number;
}

export class ScdpAiAgent {
  /**
   * Avalia a viagem utilizando a API do Gemini e regras de negócio como fallback.
   */
  public async analyzeViagem(viagem: Viagem): Promise<{
    scoreRisco: string;
    justificativa: string;
    minutaSei?: string;
  }> {
    try {
      console.log(`[ScdpAiAgent] Analisando viagem ${viagem.id} via Gemini...`);
      const res = await analyzeScdpViagemWithGemini(viagem);
      
      let minuta: string | undefined = undefined;
      if (res.scoreRisco === "Alto" || res.sugereNotificacao) {
        minuta = this.gerarMinutaSei(viagem);
      }

      return {
        scoreRisco: res.scoreRisco,
        justificativa: res.justificativa,
        minutaSei: minuta
      };
    } catch (error) {
      console.warn("[ScdpAiAgent] Falha na chamada da API Gemini. Utilizando fallback de heurísticas locais.", error);
      
      let score = "Baixo";
      let just = "Viagem apresenta justificativa consistente e de acordo com o cargo.";
      let minuta = undefined;

      // Regras heurísticas locais para fallback
      if (viagem.motivo_viagem && viagem.motivo_viagem.length < 20) {
        score = "Médio";
        just = "Justificativa muito curta ou vaga (Análise de Fallback).";
      }

      if (viagem.valor_total > 5000) {
        score = "Alto";
        just = "Valor expressivo, requer validação adicional de pertinência (Análise de Fallback).";
        minuta = this.gerarMinutaSei(viagem);
      }

      return {
        scoreRisco: score,
        justificativa: just,
        minutaSei: minuta
      };
    }
  }

  private gerarMinutaSei(viagem: Viagem): string {
    const formatDate = (dateStr?: string) => {
      if (!dateStr) return "—";
      const cleanDate = dateStr.split("T")[0];
      const parts = cleanDate.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    };

    return `
MINUTA DE NOTIFICAÇÃO - SEI

À/Ao Senhor(a) ${viagem.nome_viajante}

Assunto: Esclarecimentos acerca da Prestação de Contas (SCDP) - Viagem para ${viagem.destino}

Prezado(a) Servidor(a),

Com fundamento no art. 6º do Decreto nº 5.992/2006, solicitamos esclarecimentos adicionais referentes à motivação e aos resultados alcançados na viagem realizada no período de ${formatDate(viagem.data_inicio)} a ${formatDate(viagem.data_fim)}, em virtude dos valores concedidos e da necessidade de conformidade na prestação de contas.

Solicita-se a apresentação de relatório circunstanciado no prazo de 5 (cinco) dias úteis.

Atenciosamente,
Assessoria Especial de Controle Interno
`;
  }
}

export const scdpAiAgent = new ScdpAiAgent();
