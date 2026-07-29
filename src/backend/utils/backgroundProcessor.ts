import { pool } from "../db";
import { extractTcuDataWithGemini } from "./aiUtils";

// Fila na memória para processar acórdãos pendentes (evitar rate limit da API)
const queue: string[] = [];
let isProcessing = false;

// Retorna o status da fila (opcional, para exibir no frontend)
export function getQueueStatus() {
  return {
    isProcessing,
    queueLength: queue.length
  };
}

// Adiciona itens à fila e inicia processamento se não estiver rodando
export function enqueueAcordaosForAnalysis(keys: string[]) {
  // Filtra chaves que já estão na fila para evitar duplicidade
  const newKeys = keys.filter(k => !queue.includes(k));
  queue.push(...newKeys);
  
  if (!isProcessing && queue.length > 0) {
    processQueue();
  }
}

// Processador assíncrono em segundo plano
async function processQueue() {
  isProcessing = true;
  
  while (queue.length > 0) {
    const key = queue[0]; // Pega o primeiro da fila
    console.log(`[Background] Processando Acórdão: ${key} (${queue.length} restantes)`);
    
    let retryWait = 10000; // Default 10 seconds delay
    let success = false;
    
    try {
      // O processamento interno chama a IA e atualiza o banco
      await processSingleAcordao(key);
      success = true;
    } catch (err: any) {
      console.error(`[Background] Erro ao processar ${key}:`, err.message);
      
      if (err.message && err.message.includes("429")) {
        console.log(`[Background] Rate limit (429) detectado. Removendo da fila temporariamente para não bloquear a extração do Inteiro Teor.`);
        // Remove da fila para permitir que os outros acórdãos tenham seu Inteiro Teor salvo no banco
        success = true; 
        retryWait = 2000;
      } else {
        // Erro fatal (ex: TypeError, etc) - remove da fila
        success = true; 
      }
    }
    
    // Remove o item processado da fila apenas se não for rate limit
    if (success) {
      queue.shift();
    }
    
    // Respeitar Rate Limit da API do Gemini (ex: esperar 10 segundos entre cada chamada)
    if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, retryWait));
    }
  }
  
  isProcessing = false;
  console.log(`[Background] Processamento concluído. Fila vazia.`);
}

export async function processSingleAcordao(key: string) {
  // 1. Fetch Acórdão from PostgreSQL
  const acResult = await pool.query('SELECT * FROM tcu_acordaos WHERE key = $1', [key]);
  if (acResult.rows.length === 0) {
    throw new Error("Acórdão não encontrado no Postgres.");
  }
  const acordao = acResult.rows[0];

  let acordaoTeor = acordao.acordao;

  if (!acordaoTeor || acordaoTeor.trim() === "") {
    console.log(`[Background] Acórdão ${acordao.num_acordao}/${acordao.ano_acordao} não possui Inteiro Teor no banco. Tentando buscar no cache da API TCU...`);
    // Usando importação dinâmica para contornar o require no ES Module
    const { getInteiroTeorFromCache } = await import('./tcuCsvParser.js');
    const fetchedTeor = await getInteiroTeorFromCache(acordao.num_acordao, acordao.ano_acordao);
    if (fetchedTeor) {
      console.log(`[Background] Atualizando Inteiro Teor no banco para ${key}...`);
      await pool.query('UPDATE tcu_acordaos SET acordao = $1 WHERE key = $2', [fetchedTeor, key]);
      acordaoTeor = fetchedTeor;
    } else {
      throw new Error("Este acórdão não possui o Inteiro Teor para ser analisado e não foi possível encontrar no cache/API do TCU.");
    }
  }

  // 2. Extração via IA
  // O contexto do TCE (tceContext) pode ser buscado aqui se implementado no BD
  const aiResultJson = await extractTcuDataWithGemini(acordaoTeor);

  // 3. Simular ou Preparar a Conciliação com SIAFI (A conciliação real pode ser feita em outra rotina)
  // Como o usuário pediu para a IA apenas separar os dados necessários, o cruzamento do SIAFI será o próximo passo da pipeline
  const dossieResponsaveis = aiResultJson.responsaveis || [];
  
  const newAiData = acordao.ai_analysis_data ? 
    (typeof acordao.ai_analysis_data === 'string' ? JSON.parse(acordao.ai_analysis_data) : acordao.ai_analysis_data) 
    : {};
  
  newAiData.dossieRessarcimento = dossieResponsaveis;
  newAiData.determinacoes = aiResultJson.determinacoes || [];
  newAiData.recomendacoes = aiResultJson.recomendacoes || [];
  newAiData.ha_ressarcimento = aiResultJson.ha_ressarcimento;

  let status_monitoramento = acordao.status_monitoramento;
  let observacoes = acordao.observacoes || "";

  // Se a IA não identificar nenhum ressarcimento ou multa, e não houver determinações, podemos arquivar? Depende da regra.
  
  await pool.query(`
    UPDATE tcu_acordaos 
    SET ai_analysis_data = $1, status_monitoramento = $2, observacoes = $3 
    WHERE key = $4
  `, [JSON.stringify(newAiData), status_monitoramento, observacoes, key]);
  
  return {
    dossie: dossieResponsaveis,
    checklist: {
      determinacoes: aiResultJson.determinacoes || [],
      recomendacoes: aiResultJson.recomendacoes || [],
      ha_ressarcimento: aiResultJson.ha_ressarcimento
    }
  };
}
