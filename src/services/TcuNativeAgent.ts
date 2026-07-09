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

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i].trim();
    if (!p) continue;
    const pLower = p.toLowerCase();

    // Marcar quando entramos na seção de deliberação real
    if (pLower.includes("acordam os ministros") || pLower.includes("acordam os integrantes")) {
      inAcordamSection = true;
    }

    // --- EXTRAÇÃO DO CHECKLIST ---
    if (inAcordamSection) {
      // Determinações
      if (dictionary.keywordsDeterminacoes.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
        if (/^9\.\d+/.test(p) || /^\d+\./.test(p) || pLower.startsWith("determinar")) {
          determinacoes.push(p);
        }
      }
      
      // Recomendações
      if (dictionary.keywordsRecomendacoes.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
        if (/^9\.\d+/.test(p) || /^\d+\./.test(p) || pLower.startsWith("recomendar")) {
          recomendacoes.push(p);
        }
      }
      
      // Dar Ciência
      if (dictionary.keywordsDarCiencia.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
        if (/^9\.\d+/.test(p) || /^\d+\./.test(p) || pLower.startsWith("dar ciência")) {
          darCiencia.push(p);
        }
      }

      // Arquivamento
      if (dictionary.keywordsArquivamento.some((kw: string) => pLower.includes(kw.toLowerCase()))) {
        determinaArquivamento = true;
      }
    }

    // --- EXTRAÇÃO DE RESPONSÁVEIS E DÉBITO ---
    // Checa se o parágrafo menciona condenação/ressarcimento
    const isCondenacao = dictionary.keywordsResponsaveis.some((kw: string) => pLower.includes(kw.toLowerCase()));
    
    if (isCondenacao) {
      // Extrair valores (ex: R$ 1.500,00)
      const valorMatch = p.match(/R\$\s*[\d\.,]+/g);
      const valorStr = valorMatch ? valorMatch[0] : "";
      
      // Extrair CPF (ex: 111.222.333-44)
      const cpfMatch = p.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
      // Extrair CNPJ (ex: 11.222.333/0001-44)
      const cnpjMatch = p.match(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/);
      
      const doc = cpfMatch ? cpfMatch[0] : (cnpjMatch ? cnpjMatch[0] : "");

      // Tentar pegar o nome (heurística simples: texto em caixa alta antes do CPF ou após a palavra "responsabilidade de")
      let nome = "Responsável não identificado";
      if (doc) {
        // Pega as palavras ao redor do documento (geralmente é o nome)
        const parts = p.split(doc);
        if (parts[0]) {
          const words = parts[0].trim().split(" ");
          // Pega as últimas 3 a 4 palavras antes do CPF/CNPJ que iniciam com maiúscula
          const capWords = [];
          for (let w = words.length - 1; w >= 0; w--) {
            const word = words[w].replace(/[^a-zA-ZáéíóúãõçÁÉÍÓÚÃÕÇ]/g, "");
            if (word && word[0] === word[0].toUpperCase() && word.length > 2) {
              capWords.unshift(word);
            } else if (capWords.length > 0) {
              break; // Parar se encontrar uma palavra minúscula (ex: "do", "de")
            }
          }
          if (capWords.length > 1) {
            nome = capWords.join(" ");
          }
        }
      }

      if (valorStr || doc) {
        // Evitar duplicidade básica
        const exists = responsaveis.find(r => r.cpf === doc && r.valor === valorStr);
        if (!exists) {
          responsaveis.push({
            nome,
            cpf: doc,
            valor: valorStr
          });
        }
      }
    }
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
