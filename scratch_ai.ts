async function extractTcuDataWithAi(acordaoText: string, tceContext: any = null) {
  const hasGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && process.env.GEMINI_API_KEY.trim() !== "";
  const hasGroq = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "";

  if (!hasGemini && !hasGroq) {
    throw new Error("Nenhuma chave de IA configurada (Groq ou Gemini) para extrair os dados.");
  }
  
  let contextStr = "";
  if (tceContext) {
    contextStr = `
ATENÇÃO - DADOS DE REFERÊNCIA DA TCE (USE-OS PARA BALIZAR A ANÁLISE SE APLICÁVEL):
- Número da TCE: ${tceContext.numero_ano_tce || "N/A"}
- Número SIAFI da TCE: ${tceContext.numero_siafi || "N/A"}
`;
  }

  const promptText = `Você é um analista especialista do TCU.
Analise o inteiro teor do acórdão abaixo e responda EXCLUSIVAMENTE com base nas informações expressamente contidas no texto.
NÃO faça inferências, NÃO invente dados e NÃO misture conceitos.

${contextStr}

O retorno DEVE ser EXATAMENTE um objeto JSON estruturado da seguinte forma:
{
  "ha_determinacoes": true ou false,
  "determinacoes": ["Lista de determinações extraídas do texto" ou "Não há"],
  "ha_recomendacoes": true ou false,
  "recomendacoes": ["Lista de recomendações extraídas do texto" ou "Não há"],
  "ha_ressarcimento": true ou false,
  "responsaveis": [
    {
      "responsavel": "Nome completo",
      "cpf": "CPF ou CNPJ extraído (se houver)",
      "valor": "Valor original do ressarcimento/débito principal",
      "valor_multa": "Valor da multa, se houver (não confundir com débito)",
      "trecho_fonte": "Citação EXATA do acórdão que fundamenta esta extração"
    }
  ]
}
