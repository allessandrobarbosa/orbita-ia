const fs = require('fs');
const lines = fs.readFileSync('data/tcu/acordaos/cache-acordao-completo-2026.csv', 'utf8').split('\n');
function parsearLinhaCsvRobusta(linha, delimitador = ',') {
  const resultado = [];
  let valorAtual = '';
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
      valorAtual = '';
    } else {
      valorAtual += char;
    }
  }
  resultado.push(valorAtual.trim());
  return resultado;
}

for (let i = 1; i <= 3; i++) {
  const parsed = parsearLinhaCsvRobusta(lines[i], '|');
  console.log('Row', i, 'Num:', parsed[3], 'Colegiado:', parsed[6], 'Acordao length:', parsed[23] ? parsed[23].length : 0);
}
