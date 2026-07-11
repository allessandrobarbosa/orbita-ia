const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const DB_PATH = path.join('c:\\Projetos\\orbita-projeto', 'data', 'orbita_db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const ac = db.acordaos.find(a => a.ACORDAO && a.ACORDAO.includes('João Alberto Martins Silva'));

if (!ac) {
  console.log("Acordao not found!");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: "MY_GEMINI_API_KEY" }); // wait, I don't have the API key in the script. I'll need to use process.env.GEMINI_API_KEY

async function run() {
  const contents = `Você é um auditor sênior do TCU. Leia atentamente o inteiro teor do acórdão abaixo e extraia as informações no formato JSON EXATO estipulado, e nada mais.

O JSON DEVE ter a seguinte estrutura:
{
  "responsaveis": [
    {
      "nome": "NOME DO RESPONSÁVEL. Obrigatório. Nunca deixe em branco se houver condenação. Ex: João Alberto Martins Silva, Indesi Brasil.",
      "cpf": "CPF ou CNPJ extraído do texto, com pontuação (se houver)",
      "valor": "Montante total. DEVE SOMAR todos os valores de débito originais (frequentemente listados em tabelas ASCII contendo Data e Valor) E todas as multas aplicadas."
    }
  ],
  "checklist": {
    "determinacoes": ["Lista de determinações curtas e concisas"],
    "recomendacoes": ["Lista de recomendações curtas e concisas"],
    "darCiencia": ["Lista das ciências dadas curtas e concisas"],
    "determinaArquivamento": true ou false
  }
}

Regras ABSOLUTAS:
1. O NOME DO RESPONSÁVEL sempre aparece ANTES ou DEPOIS dos valores. Exemplo: "julgar irregulares as contas do sr. [NOME DO RESPONSÁVEL], condenando-o ao pagamento das quantias abaixo discriminadas:" seguido de uma tabela. O nome DEVE ser extraído. NUNCA retorne "Responsável não identificado" se houver um nome no parágrafo da condenação.
2. VALORES EM TABELA: Preste extrema atenção em tabelas delimitadas por barras ( | ). Se houver uma tabela com datas e valores (ex: | 18/12/2025 | | 26.674,00 |), você DEVE extrair esse valor (26.674,00) e somá-lo.
3. MULTAS: Se houver multa aplicada (ex: "aplicar ao sr. [NOME] multa no valor de R$ 3.000,00"), esse valor DEVE ser somado ao valor do débito da tabela. O valor final no JSON deve refletir a soma ou listar ambos.
4. Só retorne "responsaveis": [] se tiver certeza ABSOLUTA que não há condenação de débito nem multa.
5. Responda APENAS com o JSON válido, sem \`\`\`json.

Texto do Acórdão:
${ac.ACORDAO.slice(0, 15000)}`;

  require('dotenv').config({path: path.join('c:\\Projetos\\orbita-projeto', '.env')});
  const aiReal = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await aiReal.models.generateContent({
    model: "gemini-2.5-flash",
    contents
  });
  
  console.log("RESPONSE FROM AI:");
  console.log(response.text);
}

run().catch(console.error);
