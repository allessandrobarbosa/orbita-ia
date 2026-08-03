const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/components/TcuTCE.tsx',
  'src/components/TcuMonitoramento.tsx',
  'src/components/TcuComunicacoes.tsx',
  'src/components/SrteModule.tsx',
  'src/components/SRTEDetailView.tsx',
  'src/components/ScdpModule.tsx',
  'src/components/RolModule.tsx',
  'src/components/RolReportsModal.tsx',
  'src/components/EticaModule.tsx',
  'src/components/CguDemandsTable.tsx',
  'src/components/BiModule.tsx'
];

// Target classes
const TABLE_CLASSES = 'w-full text-left border-collapse';
const THEAD_CLASSES = 'bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm';
const TBODY_CLASSES = 'divide-y divide-slate-100';

const TR_CLASSES = 'hover:bg-[#1351b4]/5 transition-colors group';
const TD_CLASSES = 'p-4 text-xs text-slate-700';

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - Not found`);
    return;
  }
  
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Replace <thead> class
  content = content.replace(/<thead[^>]*className="[^"]*"[^>]*>/g, (match) => {
    return `<thead className="${THEAD_CLASSES}">`;
  });
  content = content.replace(/<thead>/g, `<thead className="${THEAD_CLASSES}">`);
  
  // Clean up nested <tr className="..."> inside thead which is no longer needed since thead has sticky top-0
  content = content.replace(/(<thead[^>]*>)\s*<tr[^>]*className="[^"]*"[^>]*>/g, '$1\n            <tr>');

  // 2. Fix <th> tags to match standard padding
  content = content.replace(/<th[^>]*className="([^"]*)"/g, (match, classes) => {
    // Keep 'cursor-pointer', 'w-*', 'text-center' if they exist, but replace colors, fonts, hover
    let newClasses = ['p-4'];
    if (classes.includes('cursor-pointer')) newClasses.push('cursor-pointer', 'hover:bg-slate-100', 'transition-colors');
    if (classes.includes('text-center')) newClasses.push('text-center');
    if (classes.includes('w-8')) newClasses.push('w-8');
    if (classes.includes('w-12')) newClasses.push('w-12');
    if (classes.includes('no-print')) newClasses.push('no-print');
    
    return `<th className="${newClasses.join(' ')}"`;
  });
  content = content.replace(/<th>/g, `<th className="p-4">`);

  // 3. Update <tbody> classes
  content = content.replace(/<tbody[^>]*className="[^"]*"[^>]*>/g, `<tbody className="${TBODY_CLASSES}">`);
  content = content.replace(/<tbody>/g, `<tbody className="${TBODY_CLASSES}">`);

  // 4. Update table row hover classes for TRs that have hover effects (excluding expanded row content wrappers)
  content = content.replace(/<tr[^>]*className="([^"]*hover:[^"]*)"/g, (match, classes) => {
    // Check if it has conditional class logic
    if (match.includes('{') || match.includes('}')) {
       // Just replace the background hover and remove other colors
       let cleaned = match.replace(/hover:bg-\[[^\]]+\]/g, 'hover:bg-[#1351b4]/5');
       return cleaned;
    }
    return `<tr className="${TR_CLASSES}">`;
  });

  // 5. Update TD padding
  content = content.replace(/<td[^>]*className="([^"]*)"/g, (match, classes) => {
    // if td has colSpan, we usually don't want to mess with it too much, just make sure it's not overly padded or wrong text color
    if (match.includes('colSpan')) {
       return match;
    }
    
    // standardize normal td classes
    let newClasses = ['p-4', 'text-xs', 'text-slate-700'];
    if (classes.includes('text-center')) newClasses.push('text-center');
    if (classes.includes('text-right')) newClasses.push('text-right');
    if (classes.includes('align-middle')) newClasses.push('align-middle');
    if (classes.includes('truncate')) newClasses.push('truncate');
    if (classes.includes('max-w-xs')) newClasses.push('max-w-xs');
    if (classes.includes('no-print')) newClasses.push('no-print');
    if (classes.includes('font-bold') || classes.includes('font-semibold')) newClasses.push('font-semibold');
    
    return `<td className="${newClasses.join(' ')}"`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Standardized tables in ${file}`);
  } else {
    console.log(`No changes needed in ${file}`);
  }
});
