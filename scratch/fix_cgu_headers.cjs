const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/components/CguAuditoriasList.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'ID Auditoria',
  'Auditoria'
);
content = content.replace(
  'ID Auditoria', // in case it appears multiple times, but there is one in table header and one in filter label
  'Auditoria'
);
// Replace in table header specifically
content = content.replace(
  /<th className="p-4 font-semibold">\s*Auditoria\s*<\/th>/g,
  '<th className="p-4 font-semibold whitespace-nowrap w-[100px]">\n                  Auditoria\n                </th>'
);
content = content.replace(
  /<th className="p-4 font-semibold">\s*Publicado em\s*<\/th>/g,
  '<th className="p-4 font-semibold whitespace-nowrap w-[120px]">\n                  Publicação\n                </th>'
);
content = content.replace(
  /<th className="p-4 font-semibold">\s*Recomendações\s*<\/th>/g,
  '<th className="p-4 font-semibold text-center w-[130px]">\n                  Recomendações\n                </th>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed CguAuditoriasList.tsx');
