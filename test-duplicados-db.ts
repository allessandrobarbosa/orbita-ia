import { fetchContratosPncp } from "./src/backend/services/pncpService.js";

async function run() {
  const mte = await fetchContratosPncp("74549|33375", "orgaos");
  
  const map = new Map();
  const duplicadosNum = [];
  mte.forEach(c => {
    if (map.has(c.numeroContrato)) {
      duplicadosNum.push(c);
    } else {
      map.set(c.numeroContrato, c);
    }
  });

  console.log("Qtd de numero_contrato duplicados:", duplicadosNum.length);
  if (duplicadosNum.length > 0) {
    console.log("Exemplo de duplicados por numero_contrato:");
    duplicadosNum.slice(0, 3).forEach(d => {
      console.log(`Numero: ${d.numeroContrato}, PNCP ID: ${d.id}`);
    });
  }
}
run();
