import fs from "fs";
import path from "path";
import https from "https";

const TCU_DIR = path.resolve(process.cwd(), "data", "tcu", "acordaos");

export async function fetchAcordaoCompleto(year: number): Promise<string> {
  const tempPath = path.join(TCU_DIR, `cache-acordao-completo-${year}.csv`);
  
  if (fs.existsSync(tempPath)) {
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
      console.log(`[TCU CSV] Found permanent cache for consolidated year ${year}.`);
      return tempPath;
    }
    
    // For current year, check if older than 7 days
    const stats = fs.statSync(tempPath);
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now - stats.mtimeMs < sevenDaysMs) {
      console.log(`[TCU CSV] Found valid 7-day cache for current year ${year}.`);
      return tempPath;
    } else {
      console.log(`[TCU CSV] Cache for current year ${year} expired. Re-downloading...`);
    }
  }

  const onlineUrl = `https://sites.tcu.gov.br/dados-abertos/jurisprudencia/arquivos/acordao-completo/acordao-completo-${year}.csv`;
  console.log(`[TCU CSV] Downloading ${onlineUrl} to temporary file ${tempPath}...`);
  
  const inProgressPath = tempPath + ".tmp";
  try {
    const response = await fetch(onlineUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,application/csv,text/plain,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const fileStream = fs.createWriteStream(inProgressPath);
    const { Readable } = require('stream');
    
    await new Promise((resolve, reject) => {
      Readable.fromWeb(response.body as any)
        .pipe(fileStream)
        .on("finish", () => {
          fileStream.close();
          resolve(undefined);
        })
        .on("error", (err: any) => {
          fileStream.close();
          reject(err);
        });
    });
    
    fs.renameSync(inProgressPath, tempPath);
    console.log(`[TCU CSV] Download completed for year ${year}.`);
    return tempPath;
  } catch (err: any) {
    console.error(`[TCU CSV] Failed to download temporary CSV for year ${year}:`, err.message);
    if (fs.existsSync(inProgressPath)) {
      try { fs.unlinkSync(inProgressPath); } catch (e) {}
    }
    if (fs.existsSync(tempPath)) {
      console.log(`[TCU CSV] Falling back to existing expired cache.`);
      return tempPath;
    }
    throw err;
  }
}
