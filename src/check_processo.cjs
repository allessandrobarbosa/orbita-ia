const fs = require('fs');
const lines = fs.readFileSync('../data/tcu/acordaos/Acórdãos2026.csv', 'latin1').split(/\r?\n/);
const map = new Map();

for(let i=2; i<lines.length; i++){
  if(!lines[i].trim()) continue;
  const partes = lines[i].split('""').map(p=>p.replace(/^"|"$/g, '').trim());
  if(partes.length<2) continue;
  
  const match = partes[0].match(/(\d+)\/(\d{4})/);
  if(!match) continue;
  
  const chave = match[1]+'-'+partes[2];
  if(map.has(chave)) {
    console.log('DUPLICATA:', chave);
    console.log(' Original processo:', map.get(chave)[3]);
    console.log(' Nova processo:    ', partes[3]);
  } else {
    map.set(chave, partes);
  }
}
