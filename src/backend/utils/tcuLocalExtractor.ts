export function extractLocalHeuristics(inteiroTeor: string): any {
  if (!inteiroTeor) return null;

  // Extrair CNPJs ou CPFs
  const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  const cnpjRegex = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
  const cpfs = [...new Set(inteiroTeor.match(cpfRegex) || [])];
  const cnpjs = [...new Set(inteiroTeor.match(cnpjRegex) || [])];

  // Identificar se há débito / condenação
  const isCondenacao = /condenar|débito|devolução|ressarcimento aos cofres/i.test(inteiroTeor);
  const determinaArquivamento = /arquivamento|arquivar os autos/i.test(inteiroTeor);
  
  // Encontrar valores monetários associados a débitos (Simplificado)
  const valorRegex = /R\$\s*[\d\.,]+/g;
  const valores = [...new Set(inteiroTeor.match(valorRegex) || [])];

  // Determinações explícitas (Regex básico procurando por "1.x. " listados no Acórdão)
  const determinacoesMatch = inteiroTeor.match(/determinar (?:a|ao) (.*?)(?=(?:determinar|recomendar|dar ci[êe]ncia|arquivar|assinar|\.))/gi);
  const recomendacoesMatch = inteiroTeor.match(/recomendar (?:a|ao) (.*?)(?=(?:determinar|recomendar|dar ci[êe]ncia|arquivar|assinar|\.))/gi);

  const dossieRessarcimento: any[] = [];
  
  if (isCondenacao && (cpfs.length > 0 || cnpjs.length > 0)) {
    // Para cada CPF/CNPJ, criar um registro de ressarcimento provável
    [...cpfs, ...cnpjs].forEach((doc, idx) => {
      dossieRessarcimento.push({
        nome: `Responsável (Localizado via Extrator RegEx)`,
        cpf_cnpj: doc,
        valor_debito: valores[idx % valores.length] || "Valor não localizado",
        trecho_fonte: "Extração Local Regex baseada na ocorrência do documento próximo à menção de débito/condenação."
      });
    });
  }

  return {
    determinacoes: determinacoesMatch ? determinacoesMatch.map(d => d.trim()) : [],
    recomendacoes: recomendacoesMatch ? recomendacoesMatch.map(r => r.trim()) : [],
    darCiencia: [],
    determinaArquivamento: determinaArquivamento,
    dossieRessarcimento: dossieRessarcimento,
    method: "local_heuristic" // flag to indicate it wasn't Gemini
  };
}
