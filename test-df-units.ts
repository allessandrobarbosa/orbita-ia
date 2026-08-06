import { fetchContratosPncp } from "./src/backend/services/pncpService.js";

async function run() {
  const mte = await fetchContratosPncp("74549|33375", "orgaos");
  const dfContracts = mte.filter(c => c.uf === 'DF');
  
  const map = new Map();
  dfContracts.forEach(c => {
    map.set(c.unidadeOrcamentaria?.nomeUnidade, (map.get(c.unidadeOrcamentaria?.nomeUnidade) || 0) + 1);
  });

  for (const [key, value] of map.entries()) {
    console.log(`Unidade: ${key} -> ${value} contratos`);
  }
}
run();
