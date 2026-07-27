import fs from "fs";
import path from "path";
import { fetchAcordaoCompleto } from "./tcuApi";

function normalizeHeaderName(header: string): string {
  return header.toLowerCase()
    .replace(/[áàâã]/g, "a")
    .replace(/[éê]/g, "e")
    .replace(/[í]/g, "i")
    .replace(/[óôõ]/g, "o")
    .replace(/[úü]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

function parseCSVLine(line: string, delimiter: string = ","): string[] {
  const result: string[] = [];
  let currentVal = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && (i === 0 || line[i - 1] !== '\\')) {
      if (insideQuotes && line[i + 1] === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      result.push(currentVal.trim());
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  return result;
}

export async function getInteiroTeorFromCache(numAcordao: number, anoAcordao: number): Promise<string | null> {
  try {
    const cachePath = await fetchAcordaoCompleto(anoAcordao);
    if (!fs.existsSync(cachePath)) return null;

    console.log(`[getInteiroTeor] Parsing ${cachePath} for ${numAcordao}/${anoAcordao}...`);
    // Need to stream it because the file might be hundreds of megabytes
    // We'll just read line by line manually or chunk it
    const readline = require('readline');
    const fileStream = fs.createReadStream(cachePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers: string[] = [];
    let normHeaders: string[] = [];
    let colNum = -1;
    let colAno = -1;
    let colInteiro = -1;
    let isFirstLine = true;
    let foundInteiro: string | null = null;

    for await (const line of rl) {
      if (isFirstLine) {
        headers = parseCSVLine(line, ",");
        normHeaders = headers.map(normalizeHeaderName);
        colNum = normHeaders.indexOf("numacordao") !== -1 ? normHeaders.indexOf("numacordao") : normHeaders.indexOf("numero");
        colAno = normHeaders.indexOf("anoacordao") !== -1 ? normHeaders.indexOf("anoacordao") : normHeaders.indexOf("ano");
        colInteiro = normHeaders.indexOf("inteiroteor") !== -1 ? normHeaders.indexOf("inteiroteor") : normHeaders.indexOf("acordao");
        isFirstLine = false;
        
        if (colNum === -1 || colAno === -1 || colInteiro === -1) {
          console.log(`[getInteiroTeor] Could not find required columns. Headers: ${normHeaders.join(',')}`);
          rl.close();
          break;
        }
        continue;
      }

      if (!line.trim()) continue;
      
      const parts = parseCSVLine(line, ",");
      if (parts.length > colNum && parts.length > colAno) {
        if (parts[colNum] == String(numAcordao) && parts[colAno] == String(anoAcordao)) {
          console.log(`[getInteiroTeor] Found Inteiro Teor for ${numAcordao}/${anoAcordao}!`);
          foundInteiro = parts[colInteiro] || null;
          rl.close();
          break;
        }
      }
    }
    
    return foundInteiro;
  } catch (err) {
    console.error(`[getInteiroTeor] Error:`, err);
    return null;
  }
}
