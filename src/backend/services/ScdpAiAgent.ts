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
   * Avalia a viagem utilizando regras de negócio e (simulado) LLM
   */
  public async analyzeViagem(viagem: Viagem): Promise<{
    scoreRisco: string;
    justificativa: string;
    minutaSei?: string;
  }> {
    
    // Simulação da chamada ao LLM (Gemini) respeitando LGPD
    // Na implementação real, seria importado @google/genai 
    
    let score = "Baixo";
    let just = "Viagem apresenta justificativa consistente e de acordo com o cargo.";
    let minuta = undefined;

    // Regras heurísticas simples para complementar a IA
    if (viagem.motivo_viagem && viagem.motivo_viagem.length < 20) {
      score = "Médio";
      just = "Justificativa muito curta ou vaga.";
    }

    if (viagem.valor_total > 5000) {
      score = "Alto";
      just = "Valor expressivo, requer validação adicional de pertinência.";
      minuta = this.gerarMinutaSei(viagem);
    }

    return {
      scoreRisco: score,
      justificativa: just,
      minutaSei: minuta
    };
  }

  private gerarMinutaSei(viagem: Viagem): string {
    return `
MINUTA DE NOTIFICAÇÃO - SEI

À/Ao Senhor(a) ${viagem.nome_viajante}

Assunto: Esclarecimentos acerca da Prestação de Contas (SCDP) - Viagem para ${viagem.destino}

Prezado(a) Servidor(a),

Com fundamento no art. 6º do Decreto nº 5.992/2006, solicitamos esclarecimentos adicionais referentes à motivação e aos resultados alcançados na viagem realizada no período de ${viagem.data_inicio} a ${viagem.data_fim}, em virtude dos valores concedidos e da necessidade de conformidade na prestação de contas.

Solicita-se a apresentação de relatório circunstanciado no prazo de 5 (cinco) dias úteis.

Atenciosamente,
Assessoria Especial de Controle Interno
`;
  }
}

export const scdpAiAgent = new ScdpAiAgent();
