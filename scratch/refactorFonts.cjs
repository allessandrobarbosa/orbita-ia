const fs = require('fs');

const files = [
  'src/components/TcuMonitoramento.tsx',
  'src/components/TcuTCE.tsx',
  'src/components/TcuComunicacoes.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace extrabold + deep blue with semibold + slate
  content = content.replace(/font-extrabold text-\[#003366\]/g, 'font-semibold text-slate-700');
  
  // Replace all other extrabolds with bold
  content = content.replace(/font-extrabold/g, 'font-bold');
  
  // Remove font-mono
  content = content.replace(/font-mono/g, '');
  
  // Clean up multiple spaces left by removing font-mono
  content = content.replace(/ +/g, ' ');

  // Update text sizes for better readability
  // text-[9px] -> text-[10px]
  content = content.replace(/text-\[9px\]/g, 'text-[10px]');
  
  // text-[10px] -> text-xs
  content = content.replace(/text-\[10px\]/g, 'text-xs');
  
  // text-[11px] -> text-sm
  content = content.replace(/text-\[11px\]/g, 'text-sm');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated', file);
});
