import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser';

async function runTest() {
  const result = await getComplementaryDataBulk(2026, [
    { numAcordao: "862", anoAcordao: "2026", colegiado: "Plenário" }
  ]);
  console.log("RESULT KEYS:", Array.from(result.keys()));
  console.log("RESULT DATA:", result.get("862-PLENÁRIO"));
}

runTest();
