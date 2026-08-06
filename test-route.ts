import { fetchContratosPncp } from "./src/backend/services/pncpService.js";

async function run() {
  const mte = await fetchContratosPncp("74549|33375", "orgaos");
  console.log("MTE length:", mte.length);
  
  const mgi = await fetchContratosPncp("00489828000155", "q");
  console.log("MGI length:", mgi.length);
}
run();
