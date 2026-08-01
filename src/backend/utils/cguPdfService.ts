import fetch from "node-fetch";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import fs from "fs";
import path from "path";

// Function implementation starts here
// ...
export async function getCguPdfText(reportId: string): Promise<string> {
  const url = `https://eaud.cgu.gov.br/relatorios/download/${reportId}`;
  
  console.log(`[CGU PDF Service] Baixando PDF de: ${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha no download. Status: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Opcional: salvar cache localmente para não bater no e-Aud toda hora
    const cacheDir = path.resolve(process.cwd(), "data", "cgu", "pdfs");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = path.join(cacheDir, `${reportId}.pdf`);
    fs.writeFileSync(cachePath, buffer);

    console.log(`[CGU PDF Service] Extraindo texto do PDF (${buffer.length} bytes)...`);
    const pdfData = await pdfParse(buffer);
    
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error("O PDF extraído parece estar vazio ou ser uma imagem (scaneado).");
    }

    return pdfData.text;
  } catch (error: any) {
    console.error(`[CGU PDF Service] Erro ao obter texto do relatório ${reportId}:`, error.message);
    throw error;
  }
}
