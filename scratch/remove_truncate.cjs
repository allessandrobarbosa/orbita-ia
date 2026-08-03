const fs = require('fs');
const path = require('path');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace 'truncate max-w-[xxx]' with 'break-words max-w-[xxx]'
  content = content.replace(/truncate\s+max-w-\[\d+px\]/g, (match) => match.replace('truncate', 'break-words whitespace-normal'));
  // Replace just 'truncate' in spans or div
  content = content.replace(/truncate/g, 'break-words whitespace-normal');
  // Replace 'whitespace-nowrap'
  content = content.replace(/whitespace-nowrap/g, 'whitespace-normal break-words');

  if (original !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', path.basename(filePath));
  }
};

fixFile(path.join(__dirname, '../src/components/TcuComunicacoes.tsx'));
fixFile(path.join(__dirname, '../src/components/TcuMonitoramento.tsx'));
