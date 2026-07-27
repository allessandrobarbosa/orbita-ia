const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/components/TcuMonitoramento.tsx');
let code = fs.readFileSync(p, 'utf8');

const startIdx = code.indexOf('{/* TCU Acórdão Importer Section - Premium Bento Box */}');
const endIdx = code.indexOf('{/* Dynamic Year Tabs & KPIs Bento Grid (Standardized UX) */}');

if (startIdx !== -1 && endIdx !== -1) {
  const importerBlock = code.substring(startIdx, endIdx);
  code = code.substring(0, startIdx) + code.substring(endIdx);
  
  const hudEndStr = '{/* Main Datagrid - Bento Rounded Table wrapping */}';
  const hudEndIdx = code.indexOf(hudEndStr);
  
  if (hudEndIdx !== -1) {
    code = code.substring(0, hudEndIdx) + importerBlock + '\n      ' + code.substring(hudEndIdx);
    fs.writeFileSync(p, code, 'utf8');
    console.log('Moved importer block successfully!');
  } else {
    console.log('Could not find HUD end marker.');
  }
} else {
  console.log('Could not find importer block.');
}
