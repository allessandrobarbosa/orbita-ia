import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Setup ES modules compat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.GOVHUB_DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres",
});

const DATA_DIR = path.join(__dirname, '../data/tcu/acordaos');

// Clean mojibake text
function cleanEncoding(text: string | null | undefined): string {
  if (!text) return "";
  let decoded = text;
  if (decoded.includes("Ã")) {
    try {
      decoded = Buffer.from(decoded, 'binary').toString('utf8');
    } catch (e) {
      // fallback
    }
  }
  return decoded;
}

// Custom CSV parser since CSVs might be huge (streaming)
async function importAcordaos(cacheFilePath: string, filterFilePath: string) {
  const client = await pool.connect();
  let count = 0;
  let inserted = 0;
  let skipped = 0;

  try {
    // 1. Build a set of allowed keys from the filter file
    const allowedKeys = new Set<string>();
    try {
      const filterContent = fs.readFileSync(filterFilePath, 'utf8');
      const matches = [...filterContent.matchAll(/"(\d+)\/(\d{4})-[12A-Z]{1,3}"/g)];
      for (const m of matches) {
        allowedKeys.add(`${m[1]}-${m[2]}`); // num-ano
      }
      console.log(`Filtro carregado de ${path.basename(filterFilePath)}: ${allowedKeys.size} Acórdãos válidos (MTE).`);
    } catch (err) {
      console.error(`Falha ao ler o arquivo de filtro ${filterFilePath}. Abortando importação deste ano.`);
      return;
    }

    if (allowedKeys.size === 0) {
      console.log(`Nenhum Acórdão encontrado no arquivo de filtro. Pulando.`);
      return;
    }

    console.log(`Lendo cache pesado: ${path.basename(cacheFilePath)}...`);
    const fileStream = fs.createReadStream(cacheFilePath, { encoding: 'latin1' }); // Fix encoding issue
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers: string[] = [];
    let isFirstLine = true;
    let accumulatedLine = "";

    for await (const line of rl) {
      accumulatedLine += (accumulatedLine ? "\n" : "") + line;
      const quoteCount = (accumulatedLine.match(/"/g) || []).length;
      
      if (quoteCount % 2 !== 0) {
        continue; // Wait for closing quote
      }
      
      const fullLine = accumulatedLine;
      accumulatedLine = ""; // Reset for next record

      if (isFirstLine) {
        // Headers are separated by | and quoted
        headers = fullLine.split('|').map(h => h.trim().replace(/^"|"$/g, ''));
        isFirstLine = false;
        continue;
      }

      count++;
      
      // Because texts might contain pipes inside quotes, a simple split('|') might break.
      // But the cache uses | as delimiter. Let's use a regex to split by | only outside quotes:
      // However, TCU cache files rarely have | inside quotes. 
      // If we just use fullLine.split('|') it might be risky, but let's stick to what was there.
      const rawValues = fullLine.split(/\|(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const values = rawValues.map(v => v.trim().replace(/^"|"$/g, ''));

      // Map to object
      const record: any = {};
      headers.forEach((h, idx) => {
        let val = values[idx] !== undefined ? values[idx] : "";
        record[h] = cleanEncoding(val);
      });

      // Insert logic via UPSERT
      const key = record['KEY'] || record['key'] || record['Key'];
      const num = parseInt(record['NUMACORDAO'] || record['num_acordao']);
      const ano = parseInt(record['ANOACORDAO'] || record['ano_acordao']);
      
      if (!key) continue;

      // Filter by allowed MTE keys (num-ano)
      if (!allowedKeys.has(`${num}-${ano}`)) {
        skipped++;
        continue;
      }

      try {
        await client.query(`
          INSERT INTO tcu_acordaos (
            key, titulo, num_acordao, ano_acordao, num_ata, colegiado, data_sessao,
            situacao, proc, acordaos_relacionados, tipo_processo, interessados,
            entidade, unidade_tecnica, relator, assunto, sumario, acordao, decisao,
            recomendacoes, determinacoes, recomendacoes_determinacoes_unificado,
            ultima_atualizacao
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23
          ) ON CONFLICT (key) DO UPDATE SET
            titulo = EXCLUDED.titulo,
            colegiado = EXCLUDED.colegiado,
            acordaos_relacionados = EXCLUDED.acordaos_relacionados,
            tipo_processo = EXCLUDED.tipo_processo,
            interessados = EXCLUDED.interessados,
            entidade = EXCLUDED.entidade,
            unidade_tecnica = EXCLUDED.unidade_tecnica,
            relator = EXCLUDED.relator,
            assunto = EXCLUDED.assunto,
            sumario = EXCLUDED.sumario,
            acordao = CASE WHEN EXCLUDED.acordao IS NOT NULL AND EXCLUDED.acordao <> '' THEN EXCLUDED.acordao ELSE tcu_acordaos.acordao END,
            decisao = EXCLUDED.decisao,
            recomendacoes = EXCLUDED.recomendacoes,
            determinacoes = EXCLUDED.determinacoes,
            recomendacoes_determinacoes_unificado = EXCLUDED.recomendacoes_determinacoes_unificado,
            ultima_atualizacao = EXCLUDED.ultima_atualizacao
        `, [
          key,
          record['TITULO'] || record['titulo'],
          parseInt(record['NUMACORDAO'] || record['num_acordao']) || null,
          parseInt(record['ANOACORDAO'] || record['ano_acordao']) || null,
          record['NUMATA'] || record['num_ata'],
          record['COLEGIADO'] || record['colegiado'],
          record['DATASESSAO'] || record['data_sessao'],
          record['SITUACAO'] || record['situacao'],
          record['PROC'] || record['proc'],
          record['ACORDAOSRELACIONADOS'] || record['acordaos_relacionados'],
          record['TIPOPROCESSO'] || record['tipo_processo'],
          record['INTERESSADOS'] || record['interessados'],
          record['ENTIDADE'] || record['entidade'],
          record['UNIDADETECNICA'] || record['unidade_tecnica'],
          record['RELATOR'] || record['relator'],
          record['ASSUNTO'] || record['assunto'],
          record['SUMARIO'] || record['sumario'],
          record['ACORDAO'] || record['acordao'],
          record['DECISAO'] || record['decisao'],
          record['RECOMENDACOES'] || record['recomendacoes'],
          record['DETERMINACOES'] || record['determinacoes'],
          record['RECOMENDACOES_DETERMINACOES_UNIFICADO'] || record['recomendacoes_determinacoes_unificado'],
          new Date().toISOString()
        ]);
        inserted++;
      } catch (err: any) {
        // console.error(`Erro ao inserir o Acórdão ${key}: ${err.message}`);
      }
    }
  } catch (err: any) {
    console.error(`Erro geral na leitura do arquivo ${cacheFilePath}: ${err.message}`);
  } finally {
    client.release();
    console.log(`Processamento concluído. Lidos (Total Cache): ${count}, Ignorados (Não MTE): ${skipped}, Inseridos/Atualizados: ${inserted}`);
  }
}

async function run() {
  const isFullImport = process.argv.includes('--full');
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  const targetYears: number[] = [];
  if (isFullImport) {
    // Determine all available years in data dir (e.g. 2018-2026)
    const files = fs.readdirSync(DATA_DIR);
    files.forEach(file => {
      const match = file.match(/cache-acordao-completo-(\d{4})\.csv/);
      if (match) targetYears.push(parseInt(match[1]));
    });
  } else {
    targetYears.push(currentYear);
    // If we are in January, also pull last year (giving a 30-day window)
    if (currentMonth === 1) {
      targetYears.push(currentYear - 1);
    }
  }

  // Deduplicate and sort
  const yearsToProcess = [...new Set(targetYears)].sort();
  console.log('=== INICIANDO ETL ÓRBITA TCU ===');
  console.log(`Modo: ${isFullImport ? 'COMPLETA (Histórico)' : 'DIÁRIA (Atualização incremental)'}`);

  if (isFullImport) {
    const client = await pool.connect();
    try {
      console.log('Modo completo detectado. Limpando tabela (TRUNCATE) para reimportação total...');
      await client.query('TRUNCATE tcu_acordaos;');
      console.log('Tabela tcu_acordaos limpa com sucesso.');
    } catch (err: any) {
      console.error(`Erro ao tentar limpar a tabela: ${err.message}`);
    } finally {
      client.release();
    }
  }

  console.log(`Anos alvos identificados: ${yearsToProcess.join(', ')}`);

  for (const year of yearsToProcess) {
    const files = fs.readdirSync(DATA_DIR);
    const cacheFile = files.find(f => f.includes(year.toString()) && f.startsWith('cache-acordao-completo'));
    const filterFile = files.find(f => f.includes(year.toString()) && f.startsWith('Acórdãos'));
    
    if (cacheFile && filterFile) {
      await importAcordaos(path.join(DATA_DIR, cacheFile), path.join(DATA_DIR, filterFile));
      
      // Delete the file after processing to free up space (unless full import was requested)
      if (!isFullImport) {
        fs.unlinkSync(path.join(DATA_DIR, cacheFile));
        console.log(`[LIMPEZA] Arquivo ${cacheFile} excluído para liberar espaço em disco.`);
      }
    } else {
      console.warn(`[AVISO] Faltando arquivos para o ano ${year}. Cache: ${!!cacheFile}, Filtro MTE: ${!!filterFile}`);
    }
  }

  pool.end();
  console.log(`\n=== ETL FINALIZADA ===\n`);
}

run();
