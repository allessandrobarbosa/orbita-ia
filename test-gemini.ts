import * as fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const db = JSON.parse(fs.readFileSync('./data/orbita_db.json', 'utf8'));
const ac = db.acordaos.find((x: any) => x.KEY === 'AC-862-2026-PL');

const promptText = `Você é um analista experiente do TCU. Leia atentamente o inteiro teor do acórdão abaixo e extraia as seguintes informações no formato JSON EXATO estipulado, e nada mais.

O JSON DEVE ter a seguinte estrutura:
{
  "responsaveis": [
    {
      "nome": "Nome da pessoa física ou jurídica condenada",
      "cpf": "CPF ou CNPJ extraído do texto, com pontuação",
      "valor": "Valor do débito/multa (ex: R$ 1.500,00)"
    }
  ],
  "checklist": {
    "determinacoes": ["Lista de determinações curtas e concisas"],
    "recomendacoes": ["Lista de recomendações curtas e concisas"],
    "darCiencia": ["Lista das ciências dadas curtas e concisas"],
    "determinaArquivamento": true ou false
  }
}

Regras:
1. "responsaveis": Extraia quem foi condenado em débito, a pagar multa ou aplicar ressarcimento, bem como os valores. Se não houver, retorne [].
2. "checklist": Sintetize e resuma as determinações (itens que iniciam com 'determinar...'), recomendações (itens que iniciam com 'recomendar...') e os itens de 'dar ciência' de forma concisa. Se não houver, retorne [].
3. "determinaArquivamento": Retorne true apenas se o Acórdão determinar explicitamente o arquivamento dos autos.
4. Responda APENAS com o JSON, sem nenhum bloco de markdown extra (sem \`\`\`json).

Texto do Acórdão:
${ac.ACORDAO.slice(0, 15000)}`;

ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: promptText
}).then(r => console.log(r.text));
