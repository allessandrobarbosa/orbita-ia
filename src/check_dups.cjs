const fs = require('fs');
const lines = fs.readFileSync('../data/tcu/acordaos/Acórdãos2026.csv', 'latin1').split(/\r?\n/);
const map = new Map();
let duplicateCount = 0;

for(let i=2; i<lines.length; i++){
  if(!lines[i].trim()) continue;
  const partes = lines[i].split('""').map(p=>p.replace(/^"|"$/g, '').trim());
  if(partes.length<2) continue;
  
  const match = partes[0].match(/(\d+)\/(\d{4})/);
  if(!match) continue;
  
  const chave = match[1];
  if(map.has(chave)) {
    console.log('DUPLICATA:', chave);
    console.log(' Original processo:', map.get(chave)[3], ' Relator:', map.get(chave)[5]);
    console.log(' Nova processo:', partes[3], ' Relator:', partes[5]);
    console.log(' Diferencas encontradas:');
    let diferencas = false;
    for(let j=0; j<partes.length; j++){
      if(map.get(chave)[j] !== partes[j]){
         console.log(`  Col ${j}: "${map.get(chave)[j]}" -> "${partes[j]}"`);
         diferencas = true;
      }
    }
    if(!diferencas) console.log('  EXATAMENTE IGUAIS');
    duplicateCount++;
  } else {
    map.set(chave, partes);
  }
}
console.log('Total duplicatas:', duplicateCount);
