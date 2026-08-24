import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Inicializar SDK do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });

export async function extractTcuDataWithGemini(acordaoText: string, tceContext?: any): Promise<any> {
  const prompt = `
Você é um especialista em auditoria e controle do TCU.
Extraia as seguintes informações do Acórdão fornecido em formato JSON ESTRITO.

Objetivos de Extração:
1. "responsaveis": Lista de pessoas ou empresas condenadas a ressarcir o erário (débito) ou pagar multa.
   Para cada responsável, extraia:
   - "nome": Nome completo ou Razão Social
   - "cpf_cnpj": Apenas os números, se houver
   - "valor_debito": Valor da condenação (em R$ ou string)
   - "tipo": "PF" ou "PJ"
   - "numero_siafi": Se mencionado no texto que há uma TCE (Tomada de Contas Especial) ou número SIAFI específico atrelado a esse responsável/objeto, extraia-o.

2. "determinacoes": Lista de strings contendo as determinações emitidas no acórdão.
3. "recomendacoes": Lista de strings contendo as recomendações emitidas no acórdão.
4. "ha_ressarcimento": Booleano (true/false) indicando se há condenação em débito (ressarcimento) no acórdão.

${tceContext ? `Contexto adicional da TCE relacionada (use para cruzar dados): ${JSON.stringify(tceContext)}` : ''}

Texto do Acórdão:
"""
${acordaoText.substring(0, 30000)}
"""

Retorne APENAS um JSON válido. Exemplo de estrutura esperada:
{
  "responsaveis": [
    { "nome": "João da Silva", "cpf_cnpj": "12345678900", "valor_debito": "15000.00", "tipo": "PF", "numero_siafi": "123456" }
  ],
  "determinacoes": ["Determinar à unidade X que faça Y"],
  "recomendacoes": [],
  "ha_ressarcimento": true
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }
    
    // Limpar markdown de JSON se houver
    const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Erro na extração via Gemini (TCU):", error);
    throw error;
  }
}

export async function extractCguDossieWithGemini(pdfText: string): Promise<any> {
  const prompt = `
Você é um especialista em auditoria governamental da CGU (Controladoria-Geral da União).
Sua tarefa é analisar o Relatório de Auditoria fornecido e extrair um Dossiê Estruturado.

Como as recomendações/determinações já são acompanhadas por outro sistema, seu objetivo principal é focar em extrair as constatações (achados de auditoria), as conclusões gerais e o escopo.

Extraia as seguintes informações em formato JSON ESTRITO:
1. "resumo": Um resumo executivo de 1 a 2 parágrafos sobre o que foi auditado e a conclusão geral.
2. "escopo": O que foi o alvo da auditoria (ex: avaliação de políticas públicas, folhas de pagamento, contratos, etc).
3. "constatacoes": Lista de objetos, onde cada um representa um achado (problema/irregularidade) apontado pela CGU. Cada objeto deve ter:
   - "titulo": Título ou descrição curta do achado.
   - "descricao": Explicação detalhada do que ocorreu.
   - "risco_impacto": Qual o risco ou impacto gerado (se mencionado, ex: "Alto", "R$ 1.000,00 de prejuízo", "Risco à segurança").

Texto do Relatório:
"""
${pdfText.substring(0, 60000)}
"""

Retorne APENAS um JSON válido. Exemplo de estrutura esperada:
{
  "resumo": "A auditoria avaliou o programa X e concluiu que...",
  "escopo": "Contratos de prestação de serviço do programa X no exercício de 2023.",
  "constatacoes": [
    {
      "titulo": "Pagamentos indevidos a fornecedores",
      "descricao": "Foram identificados pagamentos indevidos...",
      "risco_impacto": "Prejuízo financeiro de R$ 50.000,00"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA.");
    
    const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Erro na extração via Gemini (CGU):", error);
    throw error;
  }
}

export async function analyzeScdpViagemWithGemini(viagem: {
  id: string;
  nome_viajante: string;
  data_inicio: string;
  data_fim: string;
  destino: string;
  motivo_viagem: string;
  valor_total: number;
}): Promise<{
  scoreRisco: 'Baixo' | 'Médio' | 'Alto';
  justificativa: string;
  sugereNotificacao: boolean;
}> {
  const prompt = `
Você é um auditor de controle interno especializado na auditoria de Diárias e Passagens (SCDP) do Governo Federal Brasileiro.
Sua missão é analisar uma solicitação de viagem sob a ótica da economicidade, razoabilidade e moralidade administrativa (Decreto nº 5.992/2006 e diretrizes da CGU).

Analise os dados desta viagem e forneça uma avaliação de risco em formato JSON ESTRITO.

Dados da Viagem:
- ID/Processo: ${viagem.id}
- Viajante: ${viagem.nome_viajante}
- Período: ${viagem.data_inicio} até ${viagem.data_fim}
- Destino: ${viagem.destino}
- Motivo da Viagem: "${viagem.motivo_viagem}"
- Valor Total (Passagens + Diárias): R$ ${viagem.valor_total.toFixed(2)}

Critérios de Risco a Considerar:
1. **Justificativa Insuficiente**: Motivos vagos, extremamente curtos (ex: "A serviço", "Reunião de trabalho", "Viagem administrativa") ou sem detalhes mínimos sobre a agenda geram Risco Médio ou Alto.
2. **Valor Elevado**: Viagens com custo desproporcional ou muito alto (geralmente acima de R$ 5.000,00) merecem maior escrutínio (Risco Médio ou Alto).
3. **Incoerência de Destino/Motivo**: Incompatibilidade visível entre o cargo/viajante, o destino e o motivo apresentado.
4. **Viagem em Finais de Semana**: Viagens iniciadas ou finalizadas em finais de semana ou feriados que não tenham justificativa de relevância evidente geram maior risco de desconformidade.

Retorne APENAS um JSON válido. Exemplo de estrutura esperada:
{
  "scoreRisco": "Baixo", // Deve ser exatamente "Baixo", "Médio" ou "Alto"
  "justificativa": "Análise detalhada do auditor explicando os motivos do risco ou a conformidade da solicitação...",
  "sugereNotificacao": false // true se houver indício forte de irregularidade ou falta grave de informação que justifique intimar o servidor (notificação/minuta SEI)
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Resposta vazia da IA.");
    }

    const cleanText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(cleanText);

    // Validações básicas de tipo para evitar quebras no frontend
    const score = result.scoreRisco;
    const finalScore = (score === 'Baixo' || score === 'Médio' || score === 'Alto') ? score : 'Baixo';

    return {
      scoreRisco: finalScore,
      justificativa: result.justificativa || "Viagem analisada.",
      sugereNotificacao: !!result.sugereNotificacao
    };
  } catch (error) {
    console.error("Erro na análise via Gemini (SCDP):", error);
    throw error;
  }
}
