# MINISTERIO DO TRABALHO E EMPREGO
## Assessoria Especial de Controle Interno - AECI/MTE

---

# SISTEMA ORBITA-AECI
### Plataforma Integrada de Monitoramento e Controle Interno - Versao 2.6.0

**DOCUMENTO:** DTS/AECI-001/2026 | **DATA:** 29/06/2026 | **VERSAO:** 2.6.0 | **STATUS:** Aprovado

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
5. Banco de Dados e MER
6. Modulos do Sistema
   - 6.1 Dashboard - Painel de Controle
   - 6.2 Modulo TCU - Monitoramento de Acordaos
   - 6.3 Modulo CGU - Monitoramento de Recomendacoes
   - 6.4 Modulo Etica - Comissao de Etica
   - 6.5 Modulo ROL - Rol de Responsaveis
   - 6.6 Modulo SRTE - Superintendencias Regionais
   - 6.7 Modulo BI e IA - Inteligencia Artificial
7. Seguranca e Controle de Acesso
8. Metodologia de Desenvolvimento
9. APIs e Integracoes Externas
10. Processos e Procedimentos Operacionais
11. Estrutura de Arquivos
12. Glossario
13. Referencias Normativas

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
| Versao Atual | 2.6.0 |
| Ambiente | Intranet / Uso Interno |
| Modelo de Implantacao | Servidor local Node.js + SPA React |
| Protocolo | HTTP (intranet) / HTTPS (producao) |
| Porta padrao | 3001 |

### 2.2 Objetivos do Sistema

1. Centralizar o monitoramento de acordaos do TCU, recomendacoes da CGU, processos eticos e comunicacoes oficiais em um unico painel integrado.
2. Automatizar a coleta de dados da API publica do TCU e da API do modulo de monitoramento da CGU.
3. Garantir rastreabilidade de todas as demandas externas com status, prazos, responsaveis e historico de atualizacoes.
4. Manter o Rol de Responsaveis atualizado com cronologia precisa de exercicio, afastamentos e substituicoes, conforme a Instrucao Normativa TCU n 84/2020.
5. Apoiar a Comissao de Etica com ferramentas de gestao de membros, reunioes, atas e processos.
6. Monitorar as SRTEs com controle de contratos, frota de viaturas, abastecimentos e manutencoes.
7. Gerar analises com Inteligencia Artificial por meio da API Google Gemini para sintese de documentos, previsoes de risco e respostas automatizadas.

### 2.3 Perfis de Usuarios

| Perfil | Clearance | Modulos Acessiveis |
|---|---|---|
| Administrador AECI | ADMIN | Todos os modulos + administracao de usuarios |
| Comissao de Etica | ETHICS | Dashboard, Etica, BI e IA |
| Auditor TCU | AUDITOR | Dashboard, TCU, ROL, BI e IA |
| Gestor SRTE | SRTE | Dashboard, SRTE, BI e IA |
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
|  |            SRTE / BiModule                           |  |
|  +---------------------------+--------------------------+  |
+---------------------------|----------------------------+
                            | HTTP (Fetch API)
                            v
+------------------------------------------------------------+
|               SERVIDOR (Node.js / TSX)                    |
|  Express.js REST API + Vite Dev Server + Session Store     |
|  server.ts (monolitico - 3.815 linhas, 149 KB)            |
|  +-- Auth Routes   (/api/auth/*)                          |
|  +-- TCU Routes    (/api/acordaos/*)                      |
|  +-- CGU Routes    (/api/cgu/*)                           |
|  +-- Etica Routes  (/api/etica/*)                         |
|  +-- ROL Routes    (/api/unidades-rol, /api/dirigentes/)  |
|  +-- SRTE Routes   (/api/srte/*, /api/contratos/*)        |
|  +-- AI Routes     (/api/ai/*)                            |
|  +-- Admin Routes  (/api/admin/*)                         |
|  Persistencia: data/orbita_db.json + data/sessions.json   |
+------------------------------------------------------------+
             |                        |
             v                        v
+--------------------+   +-----------------------------+
| API TCU (externa)  |   | API Google Gemini (externa) |
| pesquisa.apps.tcu  |   | @google/genai v2.4.0        |
| .gov.br/rest/      |   | gemini-2.5-flash            |
+--------------------+   +-----------------------------+
```

### 3.2 Padrao Arquitetural

O sistema adota o padrao **BFF (Backend for Frontend)**:
- **Frontend**: SPA React comunicando-se via REST API com o servidor local
- **Backend**: Servidor Express monolitico em TypeScript com toda logica de negocio
- **Persistencia**: JSON local (orbita_db.json) com suporte experimental a SQLite

---

## 4. LINGUAGENS E TECNOLOGIAS

### 4.1 Stack Principal

| Camada | Tecnologia | Versao | Finalidade |
|---|---|---|---|
| Frontend | React | 19.0.1 | Renderizacao de componentes reativos |
| Frontend | TypeScript | 5.8.2 | Tipagem estatica em todo o projeto |
| Frontend | Vite | 6.2.3 | Bundler e servidor de desenvolvimento |
| Frontend | TailwindCSS | 4.1.14 | Sistema de estilos utilitarios |
| Frontend | Lucide React | 0.546.0 | Biblioteca de icones SVG |
| Frontend | Motion | 12.23.24 | Animacoes e transicoes de UI |
| Backend | Node.js | >= 18 | Runtime JavaScript do servidor |
| Backend | Express.js | 4.21.2 | Framework HTTP REST API |
| Backend | TSX | 4.21.0 | Execucao direta de TypeScript em Node |
| Backend | express-session | 1.19.0 | Gerenciamento de sessoes HTTP |
| Backend | dotenv | 17.2.3 | Variaveis de ambiente |
| Banco de Dados | JSON (orbita_db.json) | N/A | Persistencia principal |
| Banco de Dados | SQLite3 | 6.0.1 | Suporte alternativo de persistencia |
| IA | @google/genai | 2.4.0 | Integracao com Google Gemini |
| Dados | XLSX | 0.18.5 | Importacao e exportacao de planilhas |
| Build | esbuild | 0.25.0 | Empacotamento do servidor para producao |

---

## 5. BANCO DE DADOS E MER

### 5.1 Estrategia de Persistencia

O ORBITA-AECI utiliza banco de dados no formato JSON (data/orbita_db.json) com leitura e escrita sincronas via Node.js fs. O arquivo data/schema.sql documenta o MER normativo para migracao futura para PostgreSQL.

### 5.2 Diagrama Entidade-Relacionamento (MER)

MODULO TCU / COMUNICACOES / CGU:
```
  +------------------+   +--------------------+   +-----------------+
  |   acordaos       |   |   comunicacoes     |   |  cgu_demandas   |
  +------------------+   +--------------------+   +-----------------+
  | KEY (PK)         |   | KEY (PK)           |   | idTarefa (PK)   |
  | NUMACORDAO       |   | COMUNICACAO        |   | situacao        |
  | ANOACORDAO       |   | DESTINATARIO       |   | tituloTarefa    |
  | TITULO           |   | UNIDADE_EMITENTE   |   | dataInicio      |
  | COLEGIADO        |   | DATA_EXPEDICAO     |   | dataFim         |
  | DATASESSAO       |   | DATA_RESPOSTA      |   | dataLimite      |
  | RELATOR/ASSUNTO  |   | CARECE_RESPOSTA    |   | providencia     |
  | STATUS_MONIT.    |   | DESTINACAO / ANO   |   | categoria / ano |
  | PRAZO_LIMITE     |   +--------------------+   +-----------------+
  | RESPONSAVEL_INT  |
  +------------------+
```
ROL DE RESPONSAVEIS (IN TCU 84/2020):
```
  +--------------+  1:N  +------------------+  N:1  +----------------+
  |  dirigentes  |-------|dirigentes_cargos  |-------|  unidades_rol  |
  +--------------+       +------------------+       +----------------+
  | id (PK)      |       | id (PK)          |       | id (PK)        |
  | nome/cpf     |       | dirigente_id(FK) |       | nome / sigla   |
  | email/status |       | unidade_id (FK)  |       +----------------+
  +------+-------+       | cargo            |
         |               | tipo_vinculo     |
         | 1:N           | inicio_exercicio |
         v               | fim_exercicio    |
  +------------------+   | ato_nomeacao     |
  |dirigentes_eventos|   +------------------+
  +------------------+
  | id (PK)          |
  | dirigente_id(FK) | -> titular afastado
  | cargo_id (FK)    |
  | data_inicio/fim  |
  | motivo           |
  | ato_autorizacao  |
  | substituto_id(FK)| -> dirigentes (substituto)
  +------------------+
```
SRTE - CONTRATOS E FROTA:
```
  +------------------+  1:N  +---------------------+
  |     contratos    |-------|contratos_consumo_    |
  +------------------+       |    mensal            |
  | id (PK)          |       +---------------------+
  | srte_id / numero |       | contrato_id (FK)    |
  | tipo/fornecedor  |       | mes_ano / valor     |
  | valor_total      |       | variacao_anterior   |
  | inicio/fim_vig.  |       +---------------------+
  | status / objeto  |

  +------------------+  1:N  +---------------------------+
  |     viaturas     |-------|viaturas_abastecimentos    |
  +------------------+       | viatura_id(FK)            |
  | id (PK)          |  1:N  | data/litros/km/custo      |
  | srte_id / placa  |-------|viaturas_manutencoes       |
  | marca/modelo/ano |       | tipo/data/custo/km        |
  | chassi/renavam   |       +---------------------------+
  | km_atual/status  |
  +------------------+
```
ETICA - COMISSAO DE ETICA:
```
  +----------------+  1:1  +------------------+
  | etica_reunioes |-------|   etica_atas     |
  +----------------+       +------------------+
  | id(PK)/tipo    |       | reuniao_id(FK1:1)|
  | dataHora/pauta |       | relatos/decisoes |
  | convidados JSON|       | dataGeracao      |
  +----------------+       +------------------+

  +----------------+       +------------------+
  | etica_membros  |       | etica_processos  |
  +----------------+       +------------------+
  | nome/cpf       |       | tipo(SECI/Cons.) |
  | atribuicao     |       | processoSei      |
  | encargo/mandato|       | situacao/resumo  |
  +----------------+       +------------------+
```
### 5.3 Colecoes do Banco de Dados JSON

| Colecao | Descricao |
|---|---|
| acordaos | Acordaos do TCU monitorados |
| comunicacoes | Oficios e comunicacoes oficiais |
| cguDemandas | Recomendacoes da CGU |
| cguRelatorios | Relatorios publicados pela CGU |
| eticaMembros | Membros da Comissao de Etica |
| eticaReunioes | Reunioes da Comissao de Etica |
| eticaAtas | Atas das reunioes |
| eticaProcessos | Processos eticos (SECI/Consulta) |
| unidadesRol | Unidades do Rol de Responsaveis |
| dirigentes | Dirigentes cadastrados |
| dirigentesCargos | Vinculos cargo-unidade |
| dirigentesEventos | Afastamentos e substituicoes |
| contratos | Contratos das SRTEs |
| contratosConsumo | Historico de consumo mensal |
| viaturas | Frota de viaturas |
| viaturasAbastecimentos | Registros de abastecimento |
| viaturasManutencoes | Historico de manutencoes |
| users | Usuarios do sistema |

---

## 6. MODULOS DO SISTEMA

### 6.1 Dashboard - Painel de Controle

Arquivo: src/components/DashboardOverview.tsx
Acesso: Todos os perfis autenticados

Painel de visao executiva com indicadores consolidados de todas as demandas ativas.

| Funcionalidade | Descricao |
|---|---|
| Contadores de demandas | Total de acordaos TCU, recomendacoes CGU, processos eticos e comunicacoes |
| Alertas de prazo | Indicacao visual de itens proximos ao vencimento ou atrasados |
| Mapa das SRTEs | Distribuicao geografica das Superintendencias Regionais por status |
| Acesso rapido | Links diretos para cada modulo do sistema |

---

### 6.2 Modulo TCU - Monitoramento de Acordaos

Arquivo: src/components/TcuModule.tsx (260 KB - maior modulo do sistema)
Acesso: ADMIN, AUDITOR

Modulo central de monitoramento das deliberacoes do TCU dirigidas ao MTE.

| Funcionalidade | Descricao |
|---|---|
| Listagem de Acordaos | Tabela com filtros por ano, colegiado, relator e status |
| Importacao via API TCU | Busca automatica em pesquisa.apps.tcu.gov.br |
| Importacao via CSV/XLSX | Planilha com cruzamento automatico de metadados via API |
| Visualizacao detalhada | Texto completo, decisao, interessados e processo SEI |
| Monitoramento de prazo | Controle de PRAZO_LIMITE, STATUS e RESPONSAVEL_INTERNO |
| Comunicacoes vinculadas | Sub-modulo de oficios vinculados a cada acordao |
| TCE | Sub-modulo de Tomada de Contas Especial com importacao de planilha |
| Integracao IA | Sintese automatica e sugestao de providencias via Gemini |
| Correcao de encoding | fixMojibake() com mapa Windows-1252 para API TCU |

**Endpoints REST:**

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | /api/acordaos | Lista todos os acordaos |
| POST | /api/acordaos/update | Atualiza um acordao |
| DELETE | /api/acordaos/:key | Remove um acordao |
| POST | /api/acordaos/import | Importa acordaos via lista ou CSV |
| GET | /api/comunicacoes | Lista as comunicacoes |
| POST | /api/comunicacoes/save | Salva/atualiza uma comunicacao |
| DELETE | /api/comunicacoes/:key | Remove uma comunicacao |

**Algoritmo fixMojibake:** A API do TCU usa Solr e retorna texto Windows-1252 interpretado como Unicode. O algoritmo mapeia os codepoints de volta aos bytes originais e decodifica como UTF-8. Resultado: "ACORDAO" em lugar de "ACÃ"RDÃƒO".

---

### 6.3 Modulo CGU - Monitoramento de Recomendacoes

Arquivo: src/components/CguModule.tsx (141 KB)
Acesso: ADMIN, AUDITOR

| Funcionalidade | Descricao |
|---|---|
| Gestao de Recomendacoes | Cadastro, edicao e acompanhamento com filtros multiplos |
| Relatorios Publicados | Sub-modulo de relatorios da CGU com importacao via XLSX |
| Posicionamentos | Registro do ultimo posicionamento e tipo de manifestacao |
| Providencias | Campo de providencias adotadas pela unidade auditada |
| Importacao CSV/XLSX | Planilha exportada do sistema de monitoramento CGU |

**Endpoints REST:**

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | /api/cgu | Lista todas as demandas CGU |
| POST | /api/cgu/save | Salva/atualiza uma demanda CGU |
| DELETE | /api/cgu/:id | Remove uma demanda CGU |
| POST | /api/cgu/import | Importa planilha de demandas CGU |
| GET | /api/cgu/relatorios | Lista relatorios publicados |
| POST | /api/cgu/relatorios/import | Importa planilha de relatorios |

---

### 6.4 Modulo Etica - Comissao de Etica

Arquivo: src/components/EticaModule.tsx (125 KB)
Acesso: ADMIN, ETHICS

**6.4.1 Gestao de Membros:** Nome, CPF, atribuicao (Presidente/Membro/Secretaria-Executiva), encargo (Titular/Suplente), mandato com calculo automatico, dispositivo legal, status ativo/inativo.

**6.4.2 Gestao de Reunioes:** Reunioes ordinarias e extraordinarias com pauta, lista de convidados, controle de confirmacoes, notificacoes e calendario cronologico.

**6.4.3 Atas de Reunioes:** Estrutura de ata (relatos + decisoes) vinculada 1:1 com reuniao, geracao de texto formal para assinatura.

**6.4.4 Processos Eticos e SECI:** SECI (triagem de denuncias), consultas eticas externas, processos formais com numero SEI e situacao.

**Endpoints REST:**

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET/POST | /api/etica/membros | Lista / Cria membro |
| PUT/DELETE | /api/etica/membros/:id | Atualiza / Remove membro |
| GET/POST | /api/etica/reunioes | Lista / Cria reuniao |
| PUT | /api/etica/reunioes/:id | Atualiza reuniao |
| GET/POST | /api/etica/atas | Lista / Cria-atualiza ata |
| GET/POST | /api/etica/processos | Lista / Cria processo |
| PUT/DELETE | /api/etica/processos/:id | Atualiza / Remove processo |

---

### 6.5 Modulo ROL - Rol de Responsaveis

Arquivo: src/components/RolModule.tsx (62 KB)
Acesso: ADMIN, AUDITOR

Implementacao do Rol de Responsaveis conforme Art. 7 da IN TCU n 84/2020.

**Modelo de Dados:**
  Dirigente (Pessoa) -1:N- DirigenteCargo (Vinculo) -N:1- UnidadeRol
                                   |
                                  1:N
                                   |
                         DirigenteEvento (Afastamento)
                                   |
                          -N:1- Dirigente (Substituto)

**Algoritmo de Linha do Tempo Cronologica:**
  Para cada cargo ordenado por inicioExercicio:
    cursor = cargo.inicioExercicio
    Para cada evento ordenado por dataInicio:
      1. LINHA exercicio:    cursor -> evento.dataInicio (titular em exercicio)
      2. LINHA afastamento:  evento.dataInicio -> evento.dataFim (titular afastado)
      3. LINHA substituto:   evento.dataInicio -> evento.dataFim (substituto em exercicio)
         Motivo = "{evento.motivo} do Titular"
      cursor = evento.dataFim
    Linha final exercicio: cursor -> cargo.fimExercicio (ou "Vigente")

| Aba | Nome | Funcionalidades |
|---|---|---|
| 1 | Cadastro de Afastamentos | Linha do tempo cronologica + CRUD de afastamentos |
| 2 | Cadastro de Dirigentes | Gestao de pessoas, CPF mascarado, cargos vinculados |
| 3 | Cadastro de Unidades | Gestao de unidades administrativas |

| Tipo | Visual | Dados |
|---|---|---|
| exercicio | Branco/Cinza | Titular em exercicio, periodo |
| afastamento | Ambar | Titular afastado, motivo |
| substituto | Azul | Substituto em exercicio, Motivo do Titular |

**Endpoints REST:**

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET/POST | /api/unidades-rol | Lista / Cria unidade |
| PUT/DELETE | /api/unidades-rol/:id | Atualiza / Remove |
| GET/POST | /api/dirigentes | Lista / Cria dirigente |
| PUT/DELETE | /api/dirigentes/:id | Atualiza / Remove |
| GET/POST | /api/dirigentes/cargos | Lista / Cria vinculo cargo |
| PUT/DELETE | /api/dirigentes/cargos/:id | Atualiza / Remove vinculo |
| GET/POST | /api/dirigentes/eventos | Lista / Registra afastamento |
| PUT/DELETE | /api/dirigentes/eventos/:id | Atualiza / Remove afastamento |

---

### 6.6 Modulo SRTE - Superintendencias Regionais

Arquivos: SrteModule.tsx (45 KB) + SRTEDetailView.tsx (87 KB)
Acesso: ADMIN, SRTE

Gestao das 27 SRTEs (uma por UF) com visao consolidada e detalhamento de contratos e frota.

**Visao Geral:**
- Mapa georreferenciado por status (Regular/Atencao/Critico)
- Tabela com superintendente, contato e indicadores por UF
- Classificacao automatica por volume de demandas TCU e CGU

**Gestao de Contratos:**
- Numero, tipo (Vigilancia/Limpeza/TI/Copa), fornecedor, vigencia e objeto
- Controle financeiro: valor total e mensal por contrato
- Status Ativo / Encerrado / Suspenso com alertas de vencimento
- Historico de consumo mensal com variacao percentual
- Grafico de evolucao temporal do consumo

**Gestao de Frota:**
- Placa, marca, modelo, ano, chassi, RENAVAM e alocacao (Fiscalizacao/Administracao)
- Controle de km atual e km da proxima revisao
- Status: Ativo / Manutencao / Inativo / Baixado (com destinacao)
- Registro de abastecimentos (data, litros, km, custo)
- Historico de manutencoes preventivas e corretivas
- Alertas visuais de revisao programada proxima

**Endpoints REST:**

| Metodo | Endpoint | Descricao |
|---|---|---|
| GET | /api/srte | Lista todas as SRTEs |
| GET/POST | /api/contratos | Lista / Cria contrato |
| PUT/DELETE | /api/contratos/:id | Atualiza / Remove contrato |
| GET/POST | /api/contratos/:id/consumo | Lista / Registra consumo |
| GET/POST | /api/viaturas | Lista / Cadastra viatura |
| PUT/DELETE | /api/viaturas/:id | Atualiza / Remove viatura |
| GET/POST | /api/viaturas/:id/abastecimentos | Lista / Registra abastecimento |
| GET/POST | /api/viaturas/:id/manutencoes | Lista / Registra manutencao |

---

### 6.7 Modulo BI e IA - Inteligencia Artificial

Arquivo: src/components/BiModule.tsx (60 KB)
Acesso: ADMIN, ETHICS, AUDITOR, SRTE

Modulo de Business Intelligence integrado ao Google Gemini (gemini-2.5-flash-preview-05-20).

| Funcionalidade | Descricao |
|---|---|
| Sintese de Acordao | Resume texto completo de acordao TCU em linguagem executiva |
| Analise de Risco | Classifica demandas por nivel de risco (prazo + status) |
| Sugestao de Providencias | Propoe acoes concretas para atendimento de recomendacoes |
| Chat Assistente | Interface conversacional sobre controle interno |
| Geracao de Minutas | Auxilia elaboracao de oficios e notas tecnicas |
| Analise de Planilhas | Interpretacao de dados importados via XLSX |

**Configuracao:**
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = "gemini-2.5-flash-preview-05-20";
  config: { thinkingConfig: { thinkingBudget: 0 } }  // modo rapido

| Metodo | Endpoint | Descricao |
|---|---|---|
| POST | /api/ai/analyze | Analise geral de conteudo |
| POST | /api/ai/summarize | Sintese de documento |
| POST | /api/ai/chat | Chat conversacional |
| POST | /api/ai/suggest | Sugestao de providencias |

---

## 7. SEGURANCA E CONTROLE DE ACESSO

### 7.1 Fluxo de Login e Autenticacao

  1. Usuario informa CPF/E-mail + Senha
  2. Servidor verifica credenciais (orbita_db.json -> users[])
  3. Sessao criada com 24h de expiracao (express-session)
  4. Cookie connect.sid enviado ao cliente
  5. Heartbeat a cada 10s mantém a sessao ativa
  6. Ausencia de heartbeat por > 25s -> sessao destruida (fechamento de aba)
  7. Inatividade > 10 minutos -> logout automatico por timer no frontend

### 7.2 Controles Implementados

| Controle | Implementacao |
|---|---|
| Autenticacao | Senha verificada no servidor. Fluxo gov.br (OAuth 2.0) planejado |
| Autorizacao | Middleware de sessao em todos os endpoints protegidos |
| Clearance por modulo | Enum com 6 niveis: ADMIN, ETHICS, AUDITOR, SRTE, PUBLIC, PENDING |
| Timeout inatividade | 10 minutos sem interacao -> logout automatico |
| Timeout fechamento | Heartbeat 10s; 25s sem heartbeat -> sessao destruida |
| CPF mascarado | Exibido como XXX.xxx.xxx-XX em toda a interface |
| Bloqueio de tela | Tela de bloqueio quando sessao expira, sem perda de contexto |
| Modulos restritos | Campo allowedModules restringe acesso por modulo na sessao |

### 7.3 Hierarquia de Clearance

  ADMIN   -> Acesso total: todos os modulos + administracao de usuarios
  ETHICS  -> Modulos: Dashboard, Etica, BI e IA
  AUDITOR -> Modulos: Dashboard, TCU, ROL, BI e IA
  SRTE    -> Modulos: Dashboard, SRTE, BI e IA
  PUBLIC  -> Modulo: Dashboard (somente leitura)
  PENDING -> Acesso negado ate aprovacao manual pelo administrador

---

## 8. METODOLOGIA DE DESENVOLVIMENTO

### 8.1 Abordagem

O projeto foi desenvolvido com Desenvolvimento Agil (iteracoes curtas, entregas incrementais):

1. Levantamento de requisitos direto com o servidor Alessandro Barbosa Lourenco
2. Prototipacao rapida visual de cada modulo
3. Desenvolvimento incremental com validacao continua do usuario
4. Padrao Gov.br: identidade visual com paleta oficial (#003366, #1351b4, #FFFFFF)

### 8.2 Design System Gov.br

| Elemento | Padrao Adotado |
|---|---|
| Cor primaria | #003366 (Azul Gov.br) |
| Cor secundaria | #1351b4 (Azul medio) |
| Tipografia | Inter (Google Fonts) / sistema sans-serif |
| Icones | Lucide React (linha uniforme) |
| Cards | border-slate-200, rounded-2xl, shadow-sm |
| Navegacao | Pills horizontais/verticais, ativo em #003366 |
| Tabelas | Cabecalho bg-[#003366] text-white, linhas alternadas |
| Botao primario | bg-[#003366] text-white rounded-xl |
| Badges de status | Verde (ativo), ambar (atencao), vermelho (critico) |

---

## 9. APIS E INTEGRACOES EXTERNAS

### 9.1 API Publica do TCU

| Atributo | Valor |
|---|---|
| URL Base | https://pesquisa.apps.tcu.gov.br/rest/publico/base/acordao-completo/ |
| Autenticacao | Publica (sem token) |
| Formato | JSON |
| Encoding | Windows-1252 (corrigido pelo fixMojibake() no servidor) |

Endpoints utilizados:
  GET /documentosResumidos?termo={num}/{ano}&quantidade=10  -> Busca acordao
  GET /documento?termo=KEY:{key}                            -> Detalhes completos

### 9.2 Google Gemini AI

| Atributo | Valor |
|---|---|
| SDK | @google/genai v2.4.0 |
| Modelo | gemini-2.5-flash-preview-05-20 |
| Autenticacao | Chave de API via variavel GEMINI_API_KEY |
| Configuracao | thinkingBudget: 0 (modo rapido) |

### 9.3 Integracoes Futuras Planejadas

| Sistema | Status | Observacao |
|---|---|---|
| gov.br OAuth 2.0 | Planejado | CLIENT_ID, CLIENT_SECRET e REDIRECT_URI necessarios |
| API CGU | A confirmar | Importacao automatica do sistema Ativa-CGU |
| SEI (MTE) | A confirmar | Vinculacao automatica de processos SEI |
| Portal da Transparencia | A confirmar | Consulta de dados abertos |

---

## 10. PROCESSOS E PROCEDIMENTOS OPERACIONAIS

### 10.1 Inicializacao do Sistema
  1. npm run dev -> Inicia servidor Node.js + Vite na porta 3001
  2. Banco de dados carregado de data/orbita_db.json
  3. Sessoes limpas em data/sessions.json (a cada reinicio)
  4. Sistema disponivel em: http://localhost:3001

### 10.2 Login e Autenticacao
  1. Usuario acessa a tela de login
  2. Informa credenciais (CPF/E-mail + Senha)
  3. POST /api/auth/login-local -> servidor verifica credenciais
  4. Sessao criada, cookie connect.sid enviado
  5. Frontend inicia heartbeat a cada 10s
  6. Timer de inatividade de 10 minutos iniciado
  7. Qualquer acao do usuario (mouse/teclado) reseta o timer
  8. Fechamento da aba -> sessao destruida em 25s
  9. Inatividade > 10 min -> logout automatico com aviso

### 10.3 Importacao de Acordaos TCU

MODO A (Via planilha XLSX):
  1. Upload do arquivo XLSX com lista de acordaos
  2. Sistema parseia linhas (NUMACORDAO, ANOACORDAO obrigatorios)
  3. Para cada acordao:
     a. Texto valido na planilha -> usa texto da planilha
     b. Texto vazio -> consulta API publica do TCU
     c. API sem resposta -> gera texto simulado estruturado
  4. Dados salvos em orbita_db.json com log de resultados

MODO B (Via codigo):
  1. Usuario digita "Numero/Ano" (ex: 14068/2023)
  2. Sistema consulta API TCU e retorna dados completos
  3. Acordao salvo e exibido na listagem

### 10.4 Monitoramento de Prazo
  1. hoje > PRAZO_LIMITE -> status "Atrasado" (vermelho)
  2. PRAZO_LIMITE - hoje < 30 dias -> alerta amarelo
  3. Dashboard exibe contadores de atrasados e proximos
  4. Usuario atualiza status via modal de edicao
  5. Sistema registra ULTIMA_ATUALIZACAO com timestamp

### 10.5 Registro de Afastamento (Modulo ROL)
  1. Acessar "Cadastro de Afastamentos" -> "Registrar Afastamento"
  2. Selecionar: Dirigente -> Cargo -> Motivo (Ferias/Viagem/etc.)
  3. Informar: Data Inicio, Data Fim, Substituto, Ato de Autorizacao
  4. Sistema salva DirigenteEvento no banco
  5. Algoritmo recalcula linha do tempo automaticamente
  6. Tabela cronologica atualizada em tempo real

### 10.6 Backup dos Dados
  Procedimento recomendado (a ser automatizado):
  1. Copiar data/orbita_db.json diariamente
  2. Nomear: orbita_db_YYYYMMDD.json
  3. Armazenar em pasta de backup versionada
  4. Reter ultimas 30 copias diarias

---

## 11. ESTRUTURA DE ARQUIVOS
```
  orbita-projeto/
  +-- server.ts                Backend Node.js/Express (3.815 linhas, 149 KB)
  +-- package.json             Dependencias e scripts npm
  +-- tsconfig.json            Configuracao TypeScript
  +-- vite.config.ts           Configuracao Vite + proxy API
  +-- index.html               HTML raiz da SPA
  +-- .env.example             Modelo de variaveis de ambiente
  |
  +-- src/
  |   +-- App.tsx              Roteamento e autenticacao (2.505 linhas)
  |   +-- main.tsx             Ponto de entrada React
  |   +-- types.ts             Interfaces TypeScript (340 linhas)
  |   +-- index.css            Estilos globais e tokens CSS
  |   |
  |   +-- components/
  |   |   +-- DashboardOverview.tsx  Painel executivo (8,8 KB)
  |   |   +-- TcuModule.tsx          Modulo TCU (260 KB)
  |   |   +-- CguModule.tsx          Modulo CGU (141 KB)
  |   |   +-- EticaModule.tsx        Modulo Etica (125 KB)
  |   |   +-- RolModule.tsx          Modulo ROL (62 KB)
  |   |   +-- SrteModule.tsx         Lista SRTEs (45 KB)
  |   |   +-- SRTEDetailView.tsx     Detalhes SRTE (87 KB)
  |   |   +-- BiModule.tsx           BI e IA (60 KB)
  |   |
  |   +-- data/
  |       +-- seed_comunicacoes.ts   Dados iniciais comunicacoes
  |       +-- seed_cgu.ts            Dados iniciais CGU
  |       +-- seed_etica.ts          Dados iniciais Etica
  |
  +-- data/
  |   +-- orbita_db.json         Banco de dados principal (JSON)
  |   +-- sessions.json          Sessoes ativas (volatil)
  |   +-- schema.sql             MER normativo PostgreSQL
  |   +-- tcu_schema.sql         Schema especifico TCU
  |   +-- orbita_db.sqlite       Banco SQLite (experimental)
  |
  +-- assets/
  +-- ORBITA_DOCUMENTACAO_TECNICA.md  Este documento
```
---

## 12. GLOSSARIO

| Termo | Definicao |
|---|---|
| AECI | Assessoria Especial de Controle Interno do MTE |
| Acordao | Deliberacao colegiada do TCU, vinculante para o orgao fiscalizado |
| BFF | Backend for Frontend - backend otimizado para servir um frontend especifico |
| CGU | Controladoria-Geral da Uniao - controle interno do Poder Executivo Federal |
| Clearance | Nivel de autorizacao de acesso de um usuario no sistema |
| DOU | Diario Oficial da Uniao |
| Heartbeat | Sinal periodico enviado pelo cliente para manter a sessao ativa |
| IN 84/2020 | Instrucao Normativa TCU n 84/2020 - Regulamenta o Rol de Responsaveis |
| LGPD | Lei Geral de Protecao de Dados Pessoais (Lei n 13.709/2018) |
| MER | Modelo Entidade-Relacionamento - representacao grafica do banco de dados |
| Mojibake | Texto corrompido por mapeamento incorreto de codificacao de caracteres |
| MTE | Ministerio do Trabalho e Emprego |
| ROL | Rol de Responsaveis - registro de dirigentes conforme IN TCU 84/2020 |
| SECI | Secretaria de Controle Etico Interno - sub-orgao da Comissao de Etica |
| SEI | Sistema Eletronico de Informacoes do Governo Federal |
| SPA | Single Page Application - aplicacao web de pagina unica |
| SRTE | Superintendencia Regional do Trabalho e Emprego |
| TCE | Tomada de Contas Especial - procedimento para apuracao de dano ao erario |
| TCU | Tribunal de Contas da Uniao - controle externo do Congresso Nacional |
| Windows-1252 | Codificacao de caracteres legado do Windows, incompativel com UTF-8 |

---

## 13. REFERENCIAS NORMATIVAS

| Documento | Descricao |
|---|---|
| IN TCU n 84/2020 | Dispoe sobre o Rol de Responsaveis das entidades sob jurisdicao do TCU |
| IN TCU n 85/2022 | Dispoe sobre o processo de prestacao de contas anual |
| Lei n 13.460/2017 | Dispoe sobre participacao, protecao e defesa dos direitos do usuario |
| Lei n 12.527/2011 | Lei de Acesso a Informacao (LAI) |
| Lei n 13.709/2018 | Lei Geral de Protecao de Dados Pessoais (LGPD) |
| Decreto n 9.203/2017 | Politica de governanca da Administracao Publica Federal |
| Design System Gov.br | Sistema de design visual do Governo Federal Brasileiro |
| Resolucao CFC n 1.135/2008 | NBC T 16.8 - Controle Interno |

---

**Documento elaborado por:**

| Campo | Dado |
|---|---|
| Analista Responsavel | ALESSANDRO BARBOSA LOURENCO |
| Matricula SIAPE | 1792381 |
| Unidade | AECI / MTE |
| Data de Elaboracao | 29 de junho de 2026 |
| Versao do Documento | 1.0 |

---

Este documento e de uso interno da Assessoria Especial de Controle Interno do Ministerio do Trabalho e Emprego. Sua reproducao total ou parcial deve ser autorizada pelo responsavel tecnico identificado neste documento.

ORBITA-AECI v2.6.0 - MTE/AECI - Brasilia-DF - 2026
