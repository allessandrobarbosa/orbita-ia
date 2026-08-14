# MINISTERIO DO TRABALHO E EMPREGO
## Assessoria Especial de Controle Interno - AECI/MTE

---

# SISTEMA ORBITA-AECI
### Plataforma Integrada de Monitoramento e Controle Interno - Versao 3.0.0

**DOCUMENTO:** DTS/AECI-001/2026 | **DATA:** 14/08/2026 | **VERSAO:** 3.0.0 | **STATUS:** Aprovado

---

**ANALISTA DE SISTEMAS RESPONSAVEL PELA IDEALIZACAO E CRIACAO**

| Campo | Dado |
|---|---|
| Nome | ALESSANDRO BARBOSA LOURENCO |
| Matricula SIAPE | 1792381 |
| Unidade | Assessoria Especial de Controle Interno - AECI |
| Orgao | Ministerio do Trabalho e Emprego - MTE |
| E-mail Institucional | alessandro@trabalho.gov.br |
| Contato | (61) 2031-6261 |

---

# INDICE

1. Apresentacao Institucional
2. Visao Geral do Sistema
3. Arquitetura Tecnica
4. Linguagens e Tecnologias
5. Banco de Dados e MER (PostgreSQL)
6. Modulos do Sistema
   - 6.1 Dashboard - Painel de Controle
   - 6.2 Modulo TCU (Acordaos e Comunicacoes)
   - 6.3 Modulo CGU - Monitoramento de Recomendacoes
   - 6.4 Modulo Etica - Comissao de Etica
   - 6.5 Modulo ROL - Rol de Responsaveis
   - 6.6 Modulo SRTE - Superintendencias Regionais
   - 6.7 Modulo BI e IA - Inteligencia Artificial
   - 6.8 Modulo TCE - Tomada de Contas Especial
   - 6.9 Modulo de Contratos Administrativos
   - 6.10 Modulo de Frota (Viaturas)
   - 6.11 Modulo SCDP (Diarias e Passagens)
7. Seguranca e Controle de Acesso
8. Metodologia de Desenvolvimento
9. APIs e Integracoes Externas
10. Processos e Procedimentos Operacionais
11. Infraestrutura e Implantacao (Deployment)
12. Requisitos Nao-Funcionais e Qualidade
13. Estrutura de Arquivos
14. Glossario
15. Referencias Normativas

---

## 1. APRESENTACAO INSTITUCIONAL

O **Sistema ORBITA-AECI** foi idealizado e desenvolvido pela **Assessoria Especial de Controle Interno (AECI)** do **Ministerio do Trabalho e Emprego (MTE)**, com o objetivo de centralizar, automatizar e otimizar os processos de monitoramento, controle interno e governanca institucional do Ministerio.

A plataforma tem como missao prover instrumentos tecnologicos que permitam a AECI exercer com eficiencia sua funcao precipua de assessorar o Ministro de Estado no cumprimento dos controles internos exigidos pelos orgaos de fiscalizacao externa - Tribunal de Contas da Uniao (TCU) e Controladoria-Geral da Uniao (CGU) -, alem de apoiar a gestao etica, o monitoramento das Superintendencias Regionais do Trabalho e Emprego (SRTEs) e o acompanhamento do Rol de Responsaveis, conforme determinacoes legais.

---

## 2. VISAO GERAL DO SISTEMA

### 2.1 Identificacao do Sistema

| Atributo | Valor |
|---|---|
| Nome | ORBITA-AECI |
| Subtitulo | Plataforma Integrada de Monitoramento e Controle Interno |
| Versao Atual | 3.0.0 |
| Ambiente | Intranet / Uso Interno |
| Modelo de Implantacao | Servidor local Node.js + Express (Modular) + PostgreSQL + SPA React |
| Protocolo | HTTP (intranet) / HTTPS (producao) |
| Porta padrao | 3001 |

### 2.2 Objetivos do Sistema

1. Centralizar o monitoramento de acordaos do TCU, recomendacoes da CGU, processos eticos e comunicacoes oficiais.
2. Automatizar a coleta de dados da API publica do TCU e da API do modulo de monitoramento da CGU de forma resiliente.
3. Garantir rastreabilidade de todas as demandas externas com status, prazos, responsaveis e historico de atualizacoes.
4. Manter o Rol de Responsaveis atualizado com cronologia precisa de exercicio, afastamentos e substituicoes, conforme a Instrucao Normativa TCU n 84/2020.
5. Apoiar a Comissao de Etica com ferramentas de gestao de processos.
6. Monitorar as SRTEs e cruzar os vinculos (linking) de responsabilidade sobre Acordaos e Comunicacoes.
7. Realizar a Gestao de Contratos Administrativos das Superintendencias.
8. Monitorar e registrar o historico da Frota Veicular (Viaturas, Abastecimentos e Manutencoes).
9. Controlar as passagens e viagens emitidas pelo SCDP.
10. Gerar analises com Inteligencia Artificial por meio da API Google Gemini para sintese de documentos, previsoes de risco e respostas automatizadas.

### 2.3 Perfis de Usuarios

| Perfil | Clearance | Modulos Acessiveis |
|---|---|---|
| Administrador AECI | ADMIN | Todos os modulos + administracao de usuarios |
| Comissao de Etica | ETHICS | Dashboard, Etica, BI e IA |
| Auditor TCU | AUDITOR | Dashboard, TCU, ROL, TCE, SCDP, BI e IA |
| Gestor SRTE | SRTE | Dashboard, SRTE, Contratos, Frota, BI e IA |
| Acesso Publico | PUBLIC | Dashboard somente leitura |

---

## 3. ARQUITETURA TECNICA

### 3.1 Diagrama de Arquitetura

```
+------------------------------------------------------------+
|                  CLIENTE (Navegador)                       |
|  +------------------------------------------------------+  |
|  |      React 19 + TypeScript (SPA)                     |  |
|  |  App.tsx -> Dashboard / TCU / CGU / Etica / ROL /    |  |
|  |             SRTE / Contratos / Viaturas / SCDP       |  |
|  +---------------------------+--------------------------+  |
+---------------------------|----------------------------+
                            | HTTP (Fetch API)
                            v
+------------------------------------------------------------+
|               SERVIDOR (Node.js / Express)                 |
|  Express.js REST API + Vite Dev Server + Session Store     |
|  +-- Auth Routes   (/api/auth/*)                           |
|  +-- TCU Routes    (/api/acordaos/*, /api/tce/*)           |
|  +-- CGU Routes    (/api/cgu/*)                            |
|  +-- Etica Routes  (/api/etica/*)                          |
|  +-- ROL Routes    (/api/unidades-rol, /api/dirigentes/)   |
|  +-- SRTE Routes   (/api/srte/*)                           |
|  +-- Contratos     (/api/contratos/*)                      |
|  +-- Viaturas      (/api/viaturas/*)                       |
|  +-- SCDP          (/api/scdp/*)                           |
|  +-- AI Routes     (/api/ai/*)                             |
|  Persistencia: PostgreSQL (GovHub) + connect-pg-simple     |
+------------------------------------------------------------+
             |                        |                 ^
             v                        v                 | (POST)
+--------------------+   +-----------------------------+ +-------------------+
| API TCU (externa)  |   | API Google Gemini (externa) | | PNCP / SIAFI      |
| Downloads com Pipe |   | @google/genai v2.4.0        | | Integracoes       |
+--------------------+   +-----------------------------+ +-------------------+
```

### 3.2 Padrao Arquitetural

O sistema adota o padrao **BFF (Backend for Frontend)**:
- **Frontend**: SPA React comunicando-se via REST API com o servidor local.
- **Backend**: Servidor Express modularizado em TypeScript (separado por domínios em `src/backend/routes/`).
- **Persistencia**: Todos os modulos operam de forma nativa no PostgreSQL (GovHub DB) gerenciado por um pool de conexões (pg). O armazenamento de sessoes é persistido via `connect-pg-simple`.

---

## 4. LINGUAGENS E TECNOLOGIAS

### 4.1 Stack Principal

| Camada | Tecnologia | Versao | Finalidade |
|---|---|---|---|
| Frontend | React | 19.0.1 | Renderizacao de componentes reativos |
| Frontend | TypeScript | 5.8.2 | Tipagem estatica em todo o projeto |
| Frontend | Vite | 6.2.3 | Bundler e servidor de desenvolvimento |
| Frontend | TailwindCSS | 4.1.14 | Sistema de estilos utilitarios |
| Backend | Node.js | >= 18 | Runtime JavaScript do servidor |
| Backend | Express.js | 4.21.2 | Framework HTTP REST API |
| Backend | bcrypt | 5.1.1 | Hash e seguranca de senhas |
| Banco de Dados | PostgreSQL | >= 13 | Persistencia principal de dados relacionais |
| Banco de Dados | pg & connect-pg-simple | latest | Pool de conexao e sessoes |
| IA | @google/genai | 2.4.0 | Integracao com Google Gemini |
| Build | esbuild | 0.25.0 | Empacotamento do servidor para producao |

---

## 5. BANCO DE DADOS E MER

### 5.1 Estrategia de Persistencia

O ORBITA-AECI utiliza o banco de dados PostgreSQL (GovHub DB) como mecanismo de persistência principal para **100% dos modulos**. A conexão é gerenciada por um pool do `pg` e as sessões de usuários são armazenadas nativamente com `connect-pg-simple`. Os esquemas de dados foram consolidados atraves de tres arquivos principais de migracao: `schema.sql`, `schema_p2.sql` e `schema_srte_linking.sql`.

### 5.2 Tabelas e Agrupamentos (MER PostgreSQL)

**A. Controle Externo (TCU e CGU):**
- `tcu_acordaos`: Cadastro principal dos acordaos TCU.
- `tcu_comunicacoes`: Oficios e comunicacoes expedidas.
- `tcu_tce`: Tomadas de Contas Especiais.
- `tcu_tce_acordao_mapping`: Tabela associativa (N:N) entre TCEs e Acordaos.
- `cgu_demands`: Recomendacoes da CGU.
- `cgu_reports`: Relatorios emitidos pela CGU.
- `cgu_auditorias`: Registros de auditorias realizadas.

**B. Rol de Responsaveis (IN 84/2020):**
- `rol_unidades`: Unidades jurisdicionadas.
- `rol_dirigentes`: Cadastro unico de dirigentes.
- `rol_dirigentes_cargos`: Vinculos e exercicio cronologico dos dirigentes nas unidades.
- `rol_dirigentes_eventos`: Afastamentos, ferias e substituicoes em linha do tempo.

**C. Administracao SRTE (Superintendencias, Contratos e Frota):**
- `superintendencias`: Cadastro base das 27 SRTEs.
- `contratos`, `contratos_fiscais`, `contratos_aditivos`, `contratos_empenhos`, `contratos_consumo_mensal`: Gestao financeira e vigencia dos contratos administrativos (Limpeza, Seguranca, etc).
- `viaturas`, `viaturas_abastecimentos`, `viaturas_manutencoes`: Gestao veicular da frota.
- `frota_condutores`, `frota_diario_bordo`, `frota_infracoes`: Controle de condutores e transito.

**D. Viagens (SCDP) e Etica:**
- `scdp_viagens`: Viagens extraidas do sistema SCDP.
- `etica_processos`, `etica_reunioes`, `etica_atas`, `etica_convidados`: Gestao de etica.

**E. Linking Institucional (Cruzamento Relacional):**
- `srte_acordao`, `srte_comunicacao`, `srte_tce`, `srte_cgu`: Tabelas associativas que ligam as demandas de controle externo (TCU/CGU) as respectivas SRTEs que deverao responde-las.

---

## 6. MODULOS DO SISTEMA

### 6.1 Dashboard - Painel de Controle
Painel de visao executiva com indicadores consolidados de todas as demandas ativas no banco de dados relacional. Exibe alertas de prazo e mapa de SRTEs.

### 6.2 Modulo TCU (Acordaos e Comunicacoes)
Modulo central de monitoramento das deliberacoes do TCU.
- **Importacao via API TCU**: Download e streaming resiliente (stream/promises pipeline) para processamento local de grandes volumes de dados. Evita erros de "Socket Closed" durante o fluxo.
- **Importacao via CSV**: Planilha local (`tcuCsvParser`) com detecção automática do delimitador (ponto-e-vírgula do Excel ou aspas duplas nativas do sistema TCU) com processamento assíncrono.
- **Controle em Background**: Utiliza a tabela `tcu_import_control` para rastrear o status de importacoes longas sem travar o cliente web.

### 6.3 Modulo CGU - Monitoramento de Recomendacoes
Gestao de recomendacoes, relatorios e auditorias publicadas pela CGU com suporte a importacao de planilhas.

### 6.4 Modulo Etica - Comissao de Etica
Gestao de membros, mandatos, atas estruturadas e controle do rito processual SECI/Consultas Eticas.

### 6.5 Modulo ROL - Rol de Responsaveis
Processador de linha do tempo cronologica (Titular > Afastamento > Substituto > Retorno) operando integralmente nas tabelas relacionais do PostgreSQL para adequacao a IN 84/2020.

### 6.6 Modulo SRTE - Superintendencias Regionais
Painel que consolida e lista todas as 27 Superintendencias Regionais e expoe a arvore de relacionamentos com Acordaos, Comunicacoes, TCEs e Auditorias da CGU que estao na responsabilidade de cada unidade.

### 6.7 Modulo BI e IA - Inteligencia Artificial
Integracao com Google Gemini para leitura de acordaos, relatorios CGU e atas de reuniao para extracao automatica de contextos, prazos ocultos e resumos de decisoes.

### 6.8 Modulo TCE - Tomada de Contas Especial
Monitoramento dedicado as Tomadas de Contas Especiais geradas pelo MTE e TCU, mantendo vinculo hierarquico e estrutural com os Acordaos originarios. Possui o mesmo sistema de autodetecção de parser de CSV (`;` ou `""`) que o módulo de Acórdãos.

### 6.9 Modulo de Contratos Administrativos
Sistema completo de execucao contratual (Limpeza, Seguranca, Transporte). Acompanha vigencias, aditivos, empenhos lancados e realiza tracking historico do consumo mensal financeiro.

### 6.10 Modulo de Frota (Viaturas)
Modulo para gestao de viaturas alocadas as unidades administrativas. Permite lancamento de manutencoes preventivas/corretivas, controle de abastecimentos (combustivel e quilometragem), gestao de diarios de bordo e vinculo de condutores as eventuais infracoes de transito.

### 6.11 Modulo SCDP (Diarias e Passagens)
Submodulo para integracao e prestacao de contas das diárias e passagens autorizadas no Sistema de Concessao de Diarias e Passagens (SCDP) pelas diversas unidades de gestao.

---

## 7. SEGURANCA E CONTROLE DE ACESSO

### 7.1 Fluxo de Login e Autenticacao
- O usuario se autentica com CPF ou e-mail institucional.
- A senha e submetida e validada no backend utilizando hashes do `bcrypt`.
- A sessao e persistida de forma nativa no PostgreSQL usando `connect-pg-simple`, eliminando a volatilidade de arquivos JSON locais.

### 7.2 Funcionalidades de Seguranca
| Controle | Implementacao |
|---|---|
| Autenticacao | Bcrypt para seguranca de senhas. Gestao de recuperacao de senhas provisorias gerenciada pelo `emailService.ts`. |
| Autorizacao | Middleware em todas as rotas da API validando a sessao PostgreSQL. |
| Timeout | Inatividade superior a 10 minutos desconecta o usuario automaticamente no front-end. |
| Clearance | Enum de niveis (ADMIN, ETHICS, AUDITOR, SRTE, PUBLIC, PENDING). |

---

## 8. METODOLOGIA DE DESENVOLVIMENTO

O projeto adotou as premissas do Design System Gov.br:
- **Cor primaria**: #003366 (Azul Gov.br)
- **Tipografia**: Família Inter
- **Experiência de Uso**: SPA baseada em React (Vite) para nao haver recarregamento de pagina durante operacoes complexas.

---

## 9. APIS E INTEGRACOES EXTERNAS

### 9.1 Integracao de Dados do TCU (Acordaos)
A aplicação aplica **sincronização incremental assincrona**. Os arquivos `CSV` locais no diretorio de dados sofrem leitura inteligente usando streams robustas (`stream/promises pipeline`) e deteccao inteligente de formato.
- Se o formato conter `,` ou `;` ele o divide automaticamente.
- Se for exportacao legada com aspas coladas do TCU (`""Campo""""Campo2""`), ele processa via Expressao Regular nativa, salvando diretamente na tabela PostgreSQL de controle `tcu_import_control`.

### 9.2 Inteligencia Artificial (Gemini)
Utilizacao do pacote oficial `@google/genai` utilizando o modelo `gemini-2.5-flash-preview-05-20` integrado às demandas governamentais.

---

## 10. PROCESSOS E PROCEDIMENTOS OPERACIONAIS

### 10.1 Manutencao de Background
O acompanhamento de importacoes pesadas (milhares de Acordaos ou TCEs) agora e assincrono. O usuario pode acionar o botao de sincronizacao e navegar normalmente pelo sistema enquanto os *Workers* no backend leem, validam e inserem os dados relacionalmente no PostgreSQL.

### 10.2 Inicializacao e Setup de Banco
Os mapeamentos necessarios se encontram nos arquivos `schema.sql`, `schema_p2.sql` e `schema_srte_linking.sql`. Basta roda-los no SGDB para preparar completamente a aplicacao para operacao limpa.

---

## 11. INFRAESTRUTURA E IMPLANTACAO (DEPLOYMENT)

### 11.1 Requisitos Minimos de Hardware
- **Servidor de Aplicacao**: 2 vCPUs, 4GB RAM (Recomendado 8GB para processamento de rotinas de IA e grandes lotes de CSV).
- **Servidor de Banco de Dados**: PostgreSQL 13 ou superior, 4 vCPUs, 8GB RAM, Disco SSD de 50GB.
- **Sistema Operacional**: Ubuntu Server 22.04 LTS ou Windows Server 2019/2022.

### 11.2 Variaveis de Ambiente (.env)
A aplicacao exige a criacao de um arquivo `.env` na raiz do projeto com as seguintes chaves obrigatorias para operar em producao:
- `GOVHUB_DATABASE_URL`: String de conexao do PostgreSQL (ex: `postgres://user:pass@host:5432/dbname`).
- `GEMINI_API_KEY`: Chave de acesso a API do Google Gemini.
- `PORT`: Porta de exposicao do servico (padrao 3001).

### 11.3 Estrategia de Implantacao (Producao)
1. **Build do Frontend**: O comando `npm run build` deve ser executado para gerar os arquivos estaticos otimizados.
2. **Execucao do Backend**: O servidor Node.js deve ser gerenciado por um orquestrador de processos como o **PM2** (ex: `pm2 start server.ts --interpreter tsx --name orbita-backend`) ou containerizado via Docker.
3. **Proxy Reverso**: Recomenda-se o uso de NGINX ou IIS para proxy reverso, terminacao SSL/TLS (HTTPS) e compressao.

---

## 12. REQUISITOS NAO-FUNCIONAIS E QUALIDADE

### 12.1 Desempenho e Escalabilidade
- **Processamento Assincrono**: Arquivos CSV gigantes sao processados via `pipeline streams` e `workers` assincronos para evitar vazamento de memoria no Node.js.
- **Tempo de Resposta**: Endpoints transacionais no banco relacional devem retornar em menos de 300ms. A chamada a Inteligencia Artificial (Gemini) possui tolerância elástica de timeout (ate 15s).

### 12.2 Estrategia de Backup e Disaster Recovery (DR)
- **Rotina de Backup**: Deve ser configurado um *cronjob* diario no servidor de banco de dados executando o `pg_dump`.
- **Retencao**: Os backups comprimidos devem ser retidos por 30 dias localmente e replicados (offsite) para um *storage* secundario do ministerio.
- **Restauracao**: O tempo estimado para restauracao total (RTO) do sistema a partir de um servidor cru nao deve exceder 2 horas.

---

## 13. ESTRUTURA DE ARQUIVOS
```
  orbita-projeto/
  +-- server.ts                Ponto de entrada Express (29 KB)
  |   +-- src/backend/         Logica modular da API
  |       +-- routes/          (acordaoRoutes, tceRoutes, contratosRoutes, viaturasRoutes, scdpRoutes, etc)
  |       +-- services/        (userService, emailService, etc)
  |       +-- utils/           (tcuCsvParser, importCguAuditorias, tcuApi com pipeline)
  |       +-- db.ts            Conexão PostgreSQL (pool)
  |       +-- schema*.sql      Scripts de banco de dados
  +-- package.json             Dependencias
  +-- vite.config.ts           Configuracao React (Vite)
  +-- .env                     Conexões GOVHUB_DATABASE_URL
  |
  +-- src/
  |   +-- App.tsx              Roteamento React
  |   +-- index.css            Estilos e tokens CSS
  |   +-- components/          (Todos os modulos e views modulares)
  |
  +-- data/
      +-- tcu/                 Arquivos CSV e relatorios offline do TCU
      +-- cgu/                 Planilhas de demandas da CGU
  |
  +-- ORBITA_DOCUMENTACAO_TECNICA.md  Este documento
```

---

## 14. GLOSSARIO

| Termo | Definicao |
|---|---|
| AECI | Assessoria Especial de Controle Interno do MTE |
| BFF | Backend for Frontend - backend otimizado para servir um frontend especifico |
| ROL | Rol de Responsaveis - registro cronologico obrigatório de dirigentes (IN TCU 84/2020) |
| SCDP | Sistema de Concessao de Diarias e Passagens |
| SECI | Secretaria de Controle Etico Interno |
| SRTE | Superintendencia Regional do Trabalho e Emprego |
| TCE | Tomada de Contas Especial |
| TCU | Tribunal de Contas da Uniao |
| CGU | Controladoria-Geral da Uniao |

---

## 15. REFERENCIAS NORMATIVAS

| Documento | Descricao |
|---|---|
| IN TCU n 84/2020 | Dispoe sobre o Rol de Responsaveis das entidades sob jurisdicao do TCU |
| IN TCU n 85/2022 | Dispoe sobre o processo de prestacao de contas anual |
| Lei n 13.460/2017 | Dispoe sobre participacao, protecao e defesa dos direitos do usuario |
| Design System Gov.br | Sistema de design visual do Governo Federal Brasileiro |
| Resolucao CFC n 1.135/2008 | NBC T 16.8 - Controle Interno |

---

**Documento elaborado por:**

| Campo | Dado |
|---|---|
| Analista Responsavel | ALESSANDRO BARBOSA LOURENCO |
| Matricula SIAPE | 1792381 |
| Unidade | AECI / MTE |
| Data de Elaboracao | 14 de agosto de 2026 |
| Versao do Documento | 3.0.0 |

---

Este documento e de uso interno da Assessoria Especial de Controle Interno do Ministerio do Trabalho e Emprego. Sua reproducao total ou parcial deve ser autorizada pelo responsavel tecnico identificado neste documento.

ORBITA-AECI v3.0.0 - MTE/AECI - Brasilia-DF - 2026
