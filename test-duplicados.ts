import { fetchContratosPncp } from "./src/backend/services/pncpService.js";

async function run() {
  const mte = await fetchContratosPncp("74549|33375", "orgaos");
  console.log("Total recebido:", mte.length);
  
  const map = new Map();
  const duplicados = [];
  mte.forEach(c => {
    if (map.has(c.id)) {
      duplicados.push(c);
    } else {
      map.set(c.id, c);
    }
  });

  console.log("Unicos:", map.size);
  console.log("Qtd Duplicados (filtrados):", duplicados.length);
  
  if (duplicados.length > 0) {
    console.log("Exemplos de contratos perdidos na desduplicação:");
    duplicados.slice(0, 3).forEach(d => {
      console.log(`ID: ${d.id}, Numero: ${d.numeroContrato}, Objeto: ${d.objeto.substring(0,50)}...`);
      // Find the original one that was kept
      const original = map.get(d.id);
      console.log(` -> Conflitou com: Numero: ${original.numeroContrato}, Objeto: ${original.objeto.substring(0,50)}...`);
    });
  }
}
run();
