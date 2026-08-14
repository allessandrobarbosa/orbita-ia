const fs = require('fs');

function parsearLinhaCsvRobusta(linha, delimitador = ";") {
  const resultado = [];
  let valorAtual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (char === '"') {
      if (dentroDeAspas && linha[i + 1] === '"') {
        valorAtual += '"';
        i++;
      } else {
        dentroDeAspas = !dentroDeAspas;
      }
    } else if (char === delimitador && !dentroDeAspas) {
      resultado.push(valorAtual.trim());
      valorAtual = "";
    } else {
      valorAtual += char;
    }
  }
  resultado.push(valorAtual.trim());
  return resultado;
}

const lines = fs.readFileSync('../data/tcu/acordaos/Acórdãos2026.csv', 'latin1').split(/\r?\n/);
const map = new Map();
let duplicateCount = 0;
let parsedCount = 0;

for(let i=2; i<lines.length; i++){
  const linha = lines[i].trim();
  if(!linha) continue;
  
  let partes = parsearLinhaCsvRobusta(linha, ";");
  if(partes.length < 2) partes = linha.split('""').map(p=>p.replace(/^"|"$/g, '').trim());
  if(partes.length < 2) continue;
  
  const match = partes[0].match(/(\d+)\/(\d{4})/);
  if(!match) continue;
  parsedCount++;
  
  const chave = match[1]+'-'+partes[2];
  if(map.has(chave)) duplicateCount++;
  map.set(chave, partes);
}
console.log('Parsed:', parsedCount, 'Duplicates:', duplicateCount);
