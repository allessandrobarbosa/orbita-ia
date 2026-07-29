import path from 'path';
import { getComplementaryDataBulk } from './src/backend/utils/tcuCsvParser.js';

async function test() {
  const cachePath = path.join(process.cwd(), 'data', 'tcu', 'acordaos', 'cache-acordao-completo-2023.csv');
  const alvos = [{ numAcordao: '14068', anoAcordao: '2023', colegiado: 'Primeira Câmara' }];
  const teoresMap = await getComplementaryDataBulk(cachePath, alvos);
  console.log('Result:', teoresMap.get('14068-PRIMEIRACAMARA')?.acordao?.length);
}
test();
