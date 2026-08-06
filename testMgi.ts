import { fetchContratosPncp } from './src/backend/services/pncpService.js';

async function run() {
  console.log("Buscando contratos do MGI pelo CNPJ...");
  const mgiContratos = await fetchContratosPncp("00489828000155", "q");
  
  if (mgiContratos.length === 0) {
    console.log("Nenhum contrato retornado para o MGI.");
    return;
  }
  
  // Pegar o orgaoEntidade.id do primeiro contrato
  const mgiId = mgiContratos[0]?.orgaoEntidade?.cnpj;
  console.log(`CNPJ do MGI no contrato: ${mgiId}`);
  
  // Vamos buscar UGs únicas que contenham SRA
  const ugs = new Map();
  for (const c of mgiContratos) {
    const nome = c.unidadeOrcamentaria?.nomeUnidade || "";
    if (nome.includes("SRA") || nome.includes("SUPERINTENDENCIA REGIONAL DE ADMINISTRACAO") || nome.includes("S.R.A")) {
      ugs.set(c.unidadeOrcamentaria.codigoUnidade, nome.trim());
    }
  }
  
  console.log(`\nForam encontrados ${mgiContratos.length} contratos do MGI na busca geral.`);
  console.log("UGs de SRA extraídas:");
  ugs.forEach((nome, codigo) => {
    console.log(`{ nome: "${nome}", codigo: "${codigo}" },`);
  });
}

run().catch(console.error);
