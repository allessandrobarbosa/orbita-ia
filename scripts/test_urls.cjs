const urls = [
  '/api/acordaos',
  '/api/comunicacoes',
  '/api/rol-responsaveis',
  '/api/comissao-etica',
  '/api/superintendencias',
  '/api/dashboard-stats',
  '/api/tces',
  '/api/tce-mappings',
  '/api/cgu',
  '/api/cgu/reports',
  '/api/etica/membros',
  '/api/etica/reunioes',
  '/api/etica/atas',
  '/api/etica/processos'
];

async function checkUrls() {
  for (const url of urls) {
    try {
      const res = await fetch(`http://localhost:3000${url}`);
      console.log(`${url}: ${res.status}`);
      if (res.status === 200) {
        const txt = await res.text();
        if (txt.startsWith('<!DOCTYPE html>')) {
          console.log(`  ERROR: Returned HTML instead of JSON!`);
        } else {
          console.log(`  OK: JSON length ${txt.length}`);
        }
      }
    } catch (e) {
      console.error(`${url}: ERROR ${e.message}`);
    }
  }
}

checkUrls();
