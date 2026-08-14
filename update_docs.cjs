const fs = require('fs');
const path = require('path');

const filePath = path.join('c:\\Projetos\\orbita-projeto', 'ORBITA_DOCUMENTACAO_TECNICA.md');
let content = fs.readFileSync(filePath, 'utf8');

// Update Version
content = content.replace(/Versao 2\.6\.0/g, 'Versao 2.7.0');
content = content.replace(/VERSAO:\*\* 2\.6\.0/g, 'VERSAO:** 2.7.0');
content = content.replace(/v2\.6\.0/g, 'v2.7.0');

// Update Architecture Diagram & Description
content = content.replace(/Servidor local Node\.js \+ SPA React/g, 'Servidor local Node.js + Express (Modular) + PostgreSQL + SPA React');

content = content.replace(
/Express\.js REST API \+ Vite Dev Server \+ Session Store     \|\n\|  server\.ts \(monolitico, 4\.491 linhas, 183 KB\)/g,
`Express.js REST API + Vite Dev Server + Session Store (PG)  |
|  server.ts (Ponto de entrada) + src/backend/routes/* (Modular)`
);

content = content.replace(
/Persistencia: data\/orbita_db\.json \+ data\/sessions\.json   \|/g,
`Persistencia: PostgreSQL (GovHub) + connect-pg-simple        |`
);

content = content.replace(
/- \*\*Backend\*\*: Servidor Express monolitico em TypeScript com toda logica de negocio\n- \*\*Persistencia\*\*: JSON local \(orbita_db\.json\) com suporte experimental a SQLite/g,
`- **Backend**: Servidor Express modularizado em TypeScript (separado por domínios em src/backend/routes/)\n- **Persistencia**: PostgreSQL (GovHub DB) com pool de conexões (pg) e armazenamento de sessões (connect-pg-simple)`
);

// Update Stack
content = content.replace(
/\| Banco de Dados \| JSON \(orbita_db\.json\) \| N\/A \| Persistencia principal \|\n\| Banco de Dados \| SQLite3 \| 6\.0\.1 \| Suporte alternativo de persistencia \|/g,
`| Banco de Dados | PostgreSQL | >= 13 | Persistencia principal de dados relacionais |\n| Backend | bcrypt | 5.1.1 | Hash e seguranca de senhas |\n| Backend | pg & connect-pg-simple | latest | Pool de conexao e sessoes |`
);

// Update Database Strategy
content = content.replace(
/O ORBITA-AECI utiliza banco de dados no formato JSON \(data\/orbita_db\.json\) com leitura e escrita sincronas via Node\.js fs\. O arquivo data\/schema\.sql documenta o MER normativo para migracao futura para PostgreSQL\./g,
`O ORBITA-AECI utiliza o banco de dados PostgreSQL (GovHub DB) como mecanismo de persistência principal. A conexão é gerenciada por um pool do \`pg\` e as sessões de usuários são armazenadas nativamente com \`connect-pg-simple\`. O esquema legado em JSON e os mapeamentos originais em \`schema.sql\` representam os artefatos da transição concluída.`
);

content = content.replace(
/### 5\.3 Colecoes do Banco de Dados JSON\n\n\| Colecao \| Descricao \|/g,
`### 5.3 Tabelas do Banco de Dados PostgreSQL\n\n| Tabela | Descricao |`
);

// Add API/Import resilient info
content = content.replace(
/\| Importacao via API TCU \| Busca automatica em pesquisa\.apps\.tcu\.gov\.br \|/g,
`| Importacao via API TCU | Download e streaming resiliente (stream/promises pipeline) para processamento local de grandes volumes de dados |`
);

content = content.replace(
/\| Importacao via CSV\/XLSX \| Planilha com cruzamento automatico de metadados via API \|/g,
`| Importacao via CSV/XLSX | Planilha local (tcuCsvParser) com detecção automática do delimitador (ponto-e-vírgula ou aspas nativas do TCU) e processamento assíncrono em background |`
);

// Security update
content = content.replace(
/\| Autenticacao \| Senha verificada no servidor\. Fluxo gov\.br \(OAuth 2\.0\) planejado \|/g,
`| Autenticacao | Senha validada usando hashes do \`bcrypt\`. Fluxo gov.br (OAuth 2.0) planejado |`
);

// File Structure update
content = content.replace(
/\+-- server\.ts                Backend Node\.js\/Express \(3\.815 linhas, 149 KB\)/g,
`+-- server.ts                Ponto de entrada Express (29 KB)\n  |   +-- src/backend/           Logica modular\n  |       +-- routes/          (acordaoRoutes, tceRoutes, etc)\n  |       +-- services/        (userService, emailService, etc)\n  |       +-- utils/           (tcuCsvParser, tcuApi com pipeline)\n  |       +-- db.ts            Conexão PostgreSQL`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Documentacao atualizada com sucesso!');
