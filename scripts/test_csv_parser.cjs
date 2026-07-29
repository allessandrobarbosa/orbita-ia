const fs = require('fs');

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

const line = fs.readFileSync('data/tcu/acordaos/cache-acordao-completo-2026.csv', 'utf8').split('\n')[0];
const parsed = parsearLinhaCsvRobusta(line, '|');
const normalized = parsed.map(x => x.toLowerCase().replace(/[^a-z0-9]/g, ''));
console.log(normalized);

const indexOfAcordao = normalized.indexOf('acordao');
console.log("Index of ACORDAO:", indexOfAcordao);
