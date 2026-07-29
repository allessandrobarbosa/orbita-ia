export function extractLocalHeuristics(rawTeor: string): any {
  if (!rawTeor) return null;

  const inteiroTeor = rawTeor;

  // Extrair CNPJs ou CPFs
  const cpfRegex = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  const cnpjRegex = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g;
  const cpfs = [...new Set(inteiroTeor.match(cpfRegex) || [])];
  const cnpjs = [...new Set(inteiroTeor.match(cnpjRegex) || [])];

  // Extrair SIAFI, SIAPE, SICONV
  const siafiRegex = /(?:SIAFI|siafi)\s*(?:nº|nr|n\.)?\s*(\d{6,8})/gi;
  const siapeRegex = /(?:SIAPE|siape)\s*(?:nº|nr|n\.)?\s*(\d{6,8})/gi;
  const siconvRegex = /(?:SICONV|siconv|Convênio)\s*(?:nº|nr|n\.)?\s*(\d{5,7})/gi;

  const siafiMatches = [...inteiroTeor.matchAll(siafiRegex)].map(m => m[1]);
  const siapeMatches = [...inteiroTeor.matchAll(siapeRegex)].map(m => m[1]);
  const siconvMatches = [...inteiroTeor.matchAll(siconvRegex)].map(m => m[1]);

  const sistemasConciliacao = [];
  if (siafiMatches.length > 0) sistemasConciliacao.push(`SIAFI: ${[...new Set(siafiMatches)].join(', ')}`);
  if (siapeMatches.length > 0) sistemasConciliacao.push(`SIAPE: ${[...new Set(siapeMatches)].join(', ')}`);
  if (siconvMatches.length > 0) sistemasConciliacao.push(`SICONV: ${[...new Set(siconvMatches)].join(', ')}`);

  // Identificar se há débito / condenação
  const isCondenacao = /condenar|débito|devolução|ressarcimento aos cofres/i.test(inteiroTeor);
  const determinaArquivamento = /arquivamento|arquivar os autos/i.test(inteiroTeor);
  
  // Encontrar valores monetários associados a débitos
  const valorRegex = /R\$\s*[\d\.,]+/g;
  const valores = [...new Set(inteiroTeor.match(valorRegex) || [])];

  // Identificar multas
  const multaMatch = /multa(?:.*?)(?:no valor de|em)\s*(R\$\s*[\d\.,]+)/i.exec(inteiroTeor);
  const valorMulta = multaMatch ? multaMatch[1] : null;

  // Determinações explícitas e Recomendações
  const determinacoesMatch = inteiroTeor.match(/determinar (?:a|ao) (.*?)(?=(?:determinar|recomendar|dar ci[êe]ncia|arquivar|assinar|\.))/gi);
  const recomendacoesMatch = inteiroTeor.match(/recomendar (?:a|ao) (.*?)(?=(?:determinar|recomendar|dar ci[êe]ncia|arquivar|assinar|\.))/gi);
  const darCienciaMatch = inteiroTeor.match(/dar ci[êe]ncia (?:a|ao) (.*?)(?=(?:determinar|recomendar|dar ci[êe]ncia|arquivar|assinar|\.))/gi);

  const dossieRessarcimento: any[] = [];
  
  if (isCondenacao && (cpfs.length > 0 || cnpjs.length > 0)) {
    // Para cada CPF/CNPJ, criar um registro de ressarcimento provável
    [...cpfs, ...cnpjs].forEach((doc, idx) => {
      let trecho = "Extração Local Regex: Indícios de condenação no Acórdão associado a este documento.";
      if (sistemasConciliacao.length > 0) {
        trecho += ` Conciliação Sugerida: ${sistemasConciliacao.join(' | ')}`;
      }
      if (valorMulta && idx === 0) {
        trecho += ` (Multa identificada: ${valorMulta})`;
      }

      dossieRessarcimento.push({
        nome: `Responsável (CPF/CNPJ Identificado)`,
        cpf_cnpj: doc,
        valor_debito: valores[idx % valores.length] || "Valor a apurar",
        trecho_fonte: trecho
      });
    });
  }

  return {
    determinacoes: determinacoesMatch ? determinacoesMatch.map(d => d.trim()) : [],
    recomendacoes: recomendacoesMatch ? recomendacoesMatch.map(r => r.trim()) : [],
    darCiencia: darCienciaMatch ? darCienciaMatch.map(d => d.trim()) : [],
    determinaArquivamento: determinaArquivamento,
    dossieRessarcimento: dossieRessarcimento,
    method: "local_heuristic"
  };
}
