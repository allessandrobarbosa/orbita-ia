const fs = require('fs');
const lines = fs.readFileSync('../data/tcu/acordaos/Acórdãos2026.csv', 'latin1').split(/\r?\n/);
let matchCount = 0;
let pushedCount = 0;
for(let i=2; i<lines.length; i++){
  const linha = lines[i].trim();
  if(!linha) continue;
  
  if (linha.match(/^"*\d+\/\d{4}/)) matchCount++;

  const partes = linha.split('""').map(p=>p.replace(/^"|"$/g, '').trim());
  if(partes.length < 2) {
     if(linha.match(/^"*\d+\/\d{4}/)) console.log("Skipped parts<2:", linha);
     continue;
  }
  const match = partes[0].match(/(\d+)\/(\d{4})/);
  if(!match) {
     if(linha.match(/^"*\d+\/\d{4}/)) console.log("Skipped !match:", linha);
     continue;
  }
  pushedCount++;
}
console.log('matchCount:', matchCount, 'pushedCount:', pushedCount);
