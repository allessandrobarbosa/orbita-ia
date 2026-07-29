import fs from "fs";
import path from "path";
import readline from "readline";
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
    const fileStream = fs.createReadStream(cachePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers: string[] = [];
    let normHeaders: string[] = [];
    let colNum = -1;
    let colAno = -1;
    let colInteiro = -1;
    let isFirstLine = true;
    let foundInteiro: string | null = null;

    let currentLine = "";

    const processAccumulatedLine = (fullLine: string): boolean => {
      if (isFirstLine) {
        headers = parseCSVLine(fullLine, "|");
        normHeaders = headers.map(normalizeHeaderName);
        colNum = normHeaders.indexOf("numacordao") !== -1 ? normHeaders.indexOf("numacordao") : normHeaders.indexOf("numero");
        colAno = normHeaders.indexOf("anoacordao") !== -1 ? normHeaders.indexOf("anoacordao") : normHeaders.indexOf("ano");
        colInteiro = normHeaders.indexOf("inteiroteor") !== -1 ? normHeaders.indexOf("inteiroteor") : normHeaders.indexOf("acordao");
        isFirstLine = false;
        
        if (colNum === -1 || colAno === -1 || colInteiro === -1) {
          console.log(`[getInteiroTeor] Could not find required columns. Headers: ${normHeaders.join(',')}`);
          return true; // sinaliza para parar
        }
        return false;
      }

      if (!fullLine.trim()) return false;
      
      const parts = parseCSVLine(fullLine, "|");
      if (parts.length > colNum && parts.length > colAno) {
        if (parts[colNum] == String(numAcordao) && parts[colAno] == String(anoAcordao)) {
          console.log(`[getInteiroTeor] Found Inteiro Teor for ${numAcordao}/${anoAcordao}!`);
          
          const cleanStr = (str: string) => {
            if (!str) return str;
            try { return decodeURIComponent(escape(str)); } catch (e) { return str; }
          };
          
          foundInteiro = parts[colInteiro] ? cleanStr(parts[colInteiro]) : null;
          return true; // sinaliza para parar
        }
      }
      return false;
    };

    for await (const line of rl) {
      const isNewRow = line.startsWith('"ACORDAO-COMPLETO-') || line.startsWith('"KEY"|"TIPO"');

      if (isNewRow) {
        if (currentLine) {
          const shouldStop = processAccumulatedLine(currentLine);
          if (shouldStop) {
            rl.close();
            break;
          }
        }
        currentLine = line; // começa nova linha
      } else {
        if (currentLine) {
          currentLine += "\n" + line;
        }
      }
    }
    
    if (currentLine && !foundInteiro) {
      processAccumulatedLine(currentLine);
    }
    
    return foundInteiro;
  } catch (err) {
    console.error(`[getInteiroTeor] Error:`, err);
    return null;
  }
}

export interface ComplementaryData {
  key: string;
  acordao: string;
  num_ata: string;
  situacao: string;
  proc: string;
  acordaos_relacionados: string;
  interessados: string;
  entidade: string;
  unidade_tecnica: string;
  assunto: string;
  sumario: string;
  decisao: string;
}

export interface TargetAcordao {
  numAcordao: string;
  anoAcordao: string;
  colegiado: string;
}

export async function getComplementaryDataBulk(anoAcordao: number, targets: TargetAcordao[]): Promise<Map<string, ComplementaryData>> {
  const result = new Map<string, ComplementaryData>();
  try {
    const cachePath = await fetchAcordaoCompleto(anoAcordao);
    if (!fs.existsSync(cachePath)) return result;

    console.log(`[getInteiroTeorBulk] Parsing ${cachePath} to find ${targets.length} acórdãos...`);
    const fileStream = fs.createReadStream(cachePath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const normalizeColegiado = (str: string) => {
      if (!str) return "";
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
    };

    const cleanStr = (str: string) => {
      if (!str) return str;
      try {
        return decodeURIComponent(escape(str));
      } catch (e) {
        return str;
      }
    };

    let headers: string[] = [];
    let normHeaders: string[] = [];
    let colKey = -1;
    let colNum = -1;
    let colAno = -1;
    let colColegiado = -1;
    
    // We create a map for all columns dynamically based on headers
    let colIndices: Record<string, number> = {};

    let isFirstLine = true;
    let currentLine = "";

    const processAccumulatedLine = (fullLine: string) => {
      if (isFirstLine) {
        headers = parseCSVLine(fullLine, "|");
        normHeaders = headers.map(normalizeHeaderName);
        
        colKey = normHeaders.indexOf("key");
        colNum = normHeaders.indexOf("numacordao") !== -1 ? normHeaders.indexOf("numacordao") : normHeaders.indexOf("numero");
        colAno = normHeaders.indexOf("anoacordao") !== -1 ? normHeaders.indexOf("anoacordao") : normHeaders.indexOf("ano");
        colColegiado = normHeaders.indexOf("colegiado");
        
        colIndices = {
          acordao: normHeaders.indexOf("acordao"),
          relatorio: normHeaders.indexOf("relatorio"),
          voto: normHeaders.indexOf("voto"),
          num_ata: normHeaders.indexOf("numata"),
          situacao: normHeaders.indexOf("situacao"),
          proc: normHeaders.indexOf("proc") !== -1 ? normHeaders.indexOf("proc") : normHeaders.indexOf("processo"),
          acordaos_relacionados: normHeaders.indexOf("acordaosrelacionados"),
          interessados: normHeaders.indexOf("interessados"),
          entidade: normHeaders.indexOf("entidade"),
          unidade_tecnica: normHeaders.indexOf("unidadetecnica"),
          assunto: normHeaders.indexOf("assunto"),
          sumario: normHeaders.indexOf("sumario"),
          decisao: normHeaders.indexOf("decisao")
        };
        
        isFirstLine = false;
        return;
      }

      if (!fullLine.trim()) return;
      
      const parts = parseCSVLine(fullLine, "|");
      if (parts.length > colNum && parts.length > colAno && parts.length > colColegiado) {
        if (parts[colAno] == String(anoAcordao)) {
          const rowNum = parts[colNum];
          const rowCol = parts[colColegiado] ? normalizeColegiado(cleanStr(parts[colColegiado])) : "";
          
          // Check if this matches any target
          const target = targets.find(t => t.numAcordao === rowNum && normalizeColegiado(t.colegiado) === rowCol);
          
          if (target) {
            const getPart = (idx: number) => (idx !== -1 && parts[idx]) ? cleanStr(parts[idx]) : "";
            
            // O "Inteiro Teor" no TCU é a junção do Relatório, Voto e Acórdão/Decisão
            const txtAcordao = getPart(colIndices.acordao);
            const txtRelatorio = getPart(colIndices.relatorio);
            const txtVoto = getPart(colIndices.voto);
            const txtDecisao = getPart(colIndices.decisao);
            
            let fullTeor = "";
            if (txtRelatorio) fullTeor += "RELATÓRIO:\n" + txtRelatorio + "\n\n";
            if (txtVoto) fullTeor += "VOTO:\n" + txtVoto + "\n\n";
            if (txtAcordao) fullTeor += "ACÓRDÃO:\n" + txtAcordao + "\n\n";
            if (txtDecisao && txtDecisao !== txtAcordao) fullTeor += "DECISÃO:\n" + txtDecisao + "\n\n";
            
            const newAcordao = fullTeor.trim() || txtAcordao;
            
            const mapKey = `${target.numAcordao}-${target.colegiado.toUpperCase()}`;
            const existing = result.get(mapKey);
            
            if (!existing || newAcordao.length > (existing.acordao?.length || 0)) {
              result.set(mapKey, {
                key: getPart(colKey),
                acordao: newAcordao,
                num_ata: getPart(colIndices.num_ata),
                situacao: getPart(colIndices.situacao) || "OFICIALIZADO",
                proc: getPart(colIndices.proc),
                acordaos_relacionados: getPart(colIndices.acordaos_relacionados),
                interessados: getPart(colIndices.interessados),
                entidade: getPart(colIndices.entidade),
                unidade_tecnica: getPart(colIndices.unidade_tecnica),
                assunto: getPart(colIndices.assunto),
                sumario: getPart(colIndices.sumario),
                decisao: getPart(colIndices.decisao)
              });
            }
          }
        }
      }
    };

    for await (const line of rl) {
      const isNewRow = line.startsWith('"ACORDAO-COMPLETO-') || line.startsWith('"KEY"|"TIPO"');

      if (isNewRow) {
        if (currentLine) {
          processAccumulatedLine(currentLine);
        }
        currentLine = line; // inicia o novo chunk
      } else {
        if (currentLine) {
          currentLine += "\n" + line; // acumula linhas internas
        }
      }
    }
    
    // Processa a última linha pendente
    if (currentLine) {
      processAccumulatedLine(currentLine);
    }
  } catch (err) {
    console.error(`[getComplementaryDataBulk] Error:`, err);
  }
  return result;
}

