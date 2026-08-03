const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../src/backend/routes/acordaoRoutes.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The query needs to include acordao, or values needs to remove it.
// Wait, the DB table probably has an 'acordao' column for the full text.
// Let's add acordao =  and shift the rest.
content = content.replace(
  'sumario = , decisao = , recomendacoes = ,',
  'sumario = , acordao = , decisao = , recomendacoes = ,'
);
content = content.replace(
  'determinacoes = , recomendacoes_determinacoes_unificado = ,',
  'determinacoes = , recomendacoes_determinacoes_unificado = ,'
);
content = content.replace(
  'status_monitoramento = , responsavel_interno = ,',
  'status_monitoramento = , responsavel_interno = ,'
);
content = content.replace(
  'prazo_limite = , observacoes = ,',
  'prazo_limite = , observacoes = ,'
);
content = content.replace(
  'ultima_atualizacao = , ai_analysis_data = ',
  'ultima_atualizacao = , ai_analysis_data = '
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed acordaoRoutes.ts');
