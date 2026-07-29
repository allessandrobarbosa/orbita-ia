import { getComplementaryDataBulk } from '../src/backend/utils/tcuCsvParser.js';
async function check() { 
  const alvos = ['7073-primeiracamara']; 
  const cachePath = 'data/tcu/acordaos/cache-acordao-completo-2025.csv';
  const cacheResult = await getComplementaryDataBulk(cachePath, alvos); 
  console.log(cacheResult.get('7073-primeiracamara') ? 'Found' : 'Not found'); 
  console.log(cacheResult.get('7073-primeiracamara')); 
} 
check();
