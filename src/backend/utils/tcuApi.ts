import fs from "fs";
import path from "path";

const TCU_DIR = path.resolve(process.cwd(), "data", "tcu", "acordaos");

// TTL do cache para o ano corrente (24 horas em ms)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Garante que o diretório de cache existe.
 */
function garantirDiretorio(): void {
  if (!fs.existsSync(TCU_DIR)) {
    fs.mkdirSync(TCU_DIR, { recursive: true });
  }
}

/**
 * Baixa e armazena localmente o arquivo CSV completo do TCU para um dado ano.
 * Estratégia de cache inteligente:
 *   - Anos históricos: mantém cache permanente (sem re-download automático).
 *   - Ano corrente: re-baixa se o cache tiver mais de 24 horas.
 *
 * @param year      - Ano do arquivo a baixar
 * @param ehHistorico - Se true, não re-baixa mesmo que o cache seja antigo
 * @returns Caminho local do arquivo CSV
 */
export async function fetchAcordaoCompleto(
  year: number,
  ehHistorico: boolean = false
): Promise<string> {
  garantirDiretorio();

  const tempPath    = path.join(TCU_DIR, `cache-acordao-completo-${year}.csv`);
  const inProgressPath = tempPath + ".tmp";

  // Verifica se já existe cache local
  if (fs.existsSync(tempPath)) {
    if (ehHistorico) {
      // Anos históricos: nunca re-baixar automaticamente
      console.log(`[TCU-CSV] Cache histórico encontrado para ${year}. Reutilizando.`);
      return tempPath;
    }

    // Ano corrente: verificar TTL de 24 horas
    const stats = fs.statSync(tempPath);
    const idadeMs = Date.now() - stats.mtimeMs;

    if (idadeMs < CACHE_TTL_MS) {
      const horas = Math.round(idadeMs / 3600000 * 10) / 10;
      console.log(`[TCU-CSV] Cache válido para ${year} (${horas}h). Reutilizando.`);
      return tempPath;
    }

    console.log(`[TCU-CSV] Cache expirado para ${year} (>${CACHE_TTL_MS / 3600000}h). Re-baixando...`);
  }

  const url = `https://sites.tcu.gov.br/dados-abertos/jurisprudencia/arquivos/acordao-completo/acordao-completo-${year}.csv`;
  console.log(`[TCU-CSV] Baixando: ${url}`);

  // Download atômico: escreve em .tmp e renomeia ao concluir
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/csv,application/csv,text/plain,*/*",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body está vazio.");
    }

    const { Readable } = await import("stream");
    const { pipeline } = await import("stream/promises");
    const fileStream = fs.createWriteStream(inProgressPath);

    try {
      await pipeline(
        Readable.fromWeb(response.body as any),
        fileStream
      );
    } catch (err) {
      fileStream.close();
      if (fs.existsSync(inProgressPath)) {
        fs.unlinkSync(inProgressPath);
      }
      throw err;
    }

    fs.renameSync(inProgressPath, tempPath);

    const stats = fs.statSync(tempPath);
    const tamanhoMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log(`[TCU-CSV] Download concluído: ${year} (${tamanhoMB} MB)`);

    return tempPath;
  } catch (err: any) {
    console.error(`[TCU-CSV] Falha no download para ${year}:`, err.message);

    // Limpa arquivo temporário corrompido
    if (fs.existsSync(inProgressPath)) {
      try {
        fs.unlinkSync(inProgressPath);
      } catch {}
    }

    // Fallback: usa cache existente mesmo que expirado
    if (fs.existsSync(tempPath)) {
      console.warn(`[TCU-CSV] Usando cache expirado como fallback para ${year}.`);
      return tempPath;
    }

    throw err;
  }
}
