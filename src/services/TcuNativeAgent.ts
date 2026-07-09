import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local onde o dicionário de aprendizado ficará salvo
const DICT_PATH = path.join(__dirname, '..', '..', 'data', 'orbita_dictionary.json');

// Carrega o dicionário
function loadDictionary() {
  try {
    if (fs.existsSync(DICT_PATH)) {
      const data = fs.readFileSync(DICT_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Erro ao carregar o dicionário:", err);
  }
  return {
    keywordsResponsaveis: [],
    keywordsDeterminacoes: [],
    keywordsRecomendacoes: [],
    keywordsDarCiencia: [],
    keywordsArquivamento: []
  };
}

export function extractTcuDataNativo(textoAcordao: string) {
  const dictionary = loadDictionary();
  const lowerText = textoAcordao.toLowerCase();
  
  const responsaveis: any[] = [];
  const determinacoes: string[] = [];
  const recomendacoes: string[] = [];
  const darCiencia: string[] = [];
  let determinaArquivamento = false;

  // Separa o texto em parágrafos / itens
  const paragraphs = textoAcordao.split(/\n+/);
  
  let inAcordamSection = false;
  const collectedDocs: Array<{ nome: string; cpf: string }> = [];
  const collectedValores: string[] = [];

  for (const p of paragraphs) {
    if (!p.trim()) continue;
    const pLower = p.toLowerCase();

    // Marcar quando entramos na seção de deliberação real
    if (pLower.includes("acordam os ministros") || pLower.includes("acordam os integrantes")) {
      inAcordamSection = true;
    }

    
    // --- EXTRAÇÃO DE CHECKLIST ---
    if (dictionary.keywordsDeterminacoes.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
      if (!determinacoes.includes(p)) determinacoes.push(p);
    }
    if (dictionary.keywordsRecomendacoes.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
      if (!recomendacoes.includes(p)) recomendacoes.push(p);
    }
    if (dictionary.keywordsDarCiencia.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
      if (!darCiencia.includes(p)) darCiencia.push(p);
    }
    if (!determinaArquivamento) {
      if (dictionary.keywordsArquivamento.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
        determinaArquivamento = true;
      }
    }

    // --- EXTRAÇÃO DE RESPONSÁVEIS E DÉBITO ---
    const isCondenacao = dictionary.keywordsResponsaveis.some((kw: string) => pLower.includes(kw.toLowerCase()));
    
    if (isCondenacao) {
      // Coleta todos os valores do parágrafo
      const valorMatches = p.match(/R\$\s*[\d\.,]+/g) || [];
      valorMatches.forEach((v: string) => collectedValores.push(v));

      const extractDocs = (regex: RegExp) => {
        let match;
        while ((match = regex.exec(p)) !== null) {
          const doc = match[0];
          let nome = "Responsável não identificado";
          
          const textBefore = p.substring(0, match.index);
          const words = textBefore.trim().split(" ");
          const capWords = [];
          for (let w = words.length - 1; w >= 0; w--) {
            const word = words[w].replace(/[^a-zA-ZáéíóúãõçÁÉÍÓÚÃÕÇ]/g, "");
            const wordLower = word.toLowerCase();
            if (wordLower === "cpf" || wordLower === "cnpj") continue;
            
            if (word && word[0] === word[0].toUpperCase() && word.length > 2) {
              capWords.unshift(word);
            } else if (capWords.length > 0) {
              break;
            }
          }
          if (capWords.length > 1) {
            nome = capWords.join(" ");
          }
          collectedDocs.push({ nome, cpf: doc });
        }
      };

      extractDocs(/\b(?:[Xx\*]{3}|\d{3})\.(?:[Xx\*]{3}|\d{3})\.(?:[Xx\*]{3}|\d{3})-(?:[Xx\*]{2}|\d{2})\b/g);
      extractDocs(/\b(?:[Xx\*]{2}|\d{2})\.(?:[Xx\*]{3}|\d{3})\.(?:[Xx\*]{3}|\d{3})\/\d{4}-(?:[Xx\*]{2}|\d{2})\b/g);
    }
  }

  // Consolidar responsáveis encontrados com o maior/primeiro valor encontrado
  if (collectedDocs.length > 0) {
    const mainValor = collectedValores.length > 0 ? collectedValores[0] : "";
    for (const d of collectedDocs) {
      if (!responsaveis.find((r: any) => r.cpf === d.cpf)) {
        responsaveis.push({
          nome: d.nome,
          cpf: d.cpf,
          valor: mainValor
        });
      }
    }
  } else if (collectedValores.length > 0) {
    responsaveis.push({
      nome: "Responsável não identificado",
      cpf: "",
      valor: collectedValores[0]
    });
  }

  return {
    responsaveis,
    checklist: {
      determinacoes,
      recomendacoes,
      darCiencia,
      determinaArquivamento
    }
  };
}
