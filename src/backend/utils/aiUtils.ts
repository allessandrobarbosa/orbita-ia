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
      "descricao": "Foram identificados pagamentos em duplicidade...",
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
