const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/orbita_db.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

if (data.comunicacoes) {
  let count = 0;
  data.comunicacoes.forEach(com => {
    if (com.DATA_RESPOSTA && com.DATA_RESPOSTA.trim() !== '') {
      if (com.CARECE_RESPOSTA !== true) {
        com.CARECE_RESPOSTA = true;
        count++;
      }
    }
  });

  if (count > 0) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Atualizou CARECE_RESPOSTA=true para ${count} comunicações.`);
  } else {
    console.log('Nenhuma comunicação precisava ser atualizada.');
  }
} else {
  console.log('comunicacoes não encontrado no DB.');
}
