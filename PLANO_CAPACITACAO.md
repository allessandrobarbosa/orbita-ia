# ETAPA 11 - PLANO DE CAPACITAÇÃO TÉCNICA E TRANSFERÊNCIA DE CONHECIMENTO

Com base na arquitetura atual identificada e na arquitetura alvo proposta, este documento detalha o Plano de Capacitação Técnica e Transferência de Conhecimento para a equipe responsável pelo desenvolvimento, sustentação e evolução do sistema Órbita-AECI.

## OBJETIVOS

- Reduzir riscos durante a migração tecnológica.
- Preparar a equipe para manutenção da nova arquitetura.
- Reduzir dependência de conhecimento específico de indivíduos.
- Promover padronização de práticas de desenvolvimento.
- Garantir autonomia da equipe após a conclusão da migração.

## LEVANTAMENTO DE COMPETÊNCIAS

### Competências Atualmente Necessárias
Com base no histórico do projeto legado:
- **Linguagens e Frameworks:** C# (ASP.NET), PHP (Laravel), JavaScript/TypeScript (Angular legado).
- **Banco de Dados:** Sistemas de banco de dados relacionais padrão, modelagem convencional.
- **Ferramentas e Processos:** Git básico, processos de deploy convencionais.

### Competências Necessárias para a Arquitetura Alvo

#### Backend
- Java
- Spring Boot
- Padrões REST
- OpenAPI / Swagger
- JPA / Hibernate
- Segurança com OAuth2 e JWT

#### PHP
- Laravel
- Eloquent ORM
- Filas e Jobs
- APIs REST

#### C#
- .NET
- ASP.NET Core
- Entity Framework

#### Frontend
- Angular
- TypeScript
- RxJS
- State Management (NgRx, etc.)

#### Vue.js
- Composition API
- Pinia
- Vue Router

#### Banco de Dados
- PostgreSQL
- Modelagem Relacional
- Performance e Indexação
- Procedures e Views
- Backup e Recuperação

#### DevOps
- Git e controle de versão avançado
- Azure DevOps e GitHub
- CI/CD
- Docker
- Kubernetes
- Observabilidade (Logs, Métricas, Traces)

#### Segurança
- OWASP (Top 10)
- OAuth2 e OpenID Connect
- LGPD
- Auditoria de Sistemas e Dados

---

## MATRIZ DE CAPACITAÇÃO

A classificação de níveis utiliza a escala: **Básico, Intermediário, Avançado**.

| Competência | Nível Atual Estimado | Nível Necessário | Gap | Prioridade |
|------------|----------------------|------------------|-----|------------|
| Java / Spring Boot | Básico | Avançado | Alto | Alta |
| JPA / Hibernate | Básico | Intermediário | Médio | Alta |
| Padrões REST / OpenAPI | Intermediário | Avançado | Médio | Alta |
| Angular / TypeScript / RxJS | Intermediário | Avançado | Médio | Alta |
| Vue.js (Pinia, Router) | Básico | Intermediário | Médio | Média |
| PostgreSQL e Tuning | Intermediário | Avançado | Médio | Alta |
| Docker / Kubernetes | Básico | Intermediário | Médio | Alta |
| CI/CD (Azure DevOps/GitHub) | Intermediário | Avançado | Baixo | Média |
| Segurança / OWASP / OAuth2 | Básico | Intermediário | Médio | Alta |
| Observabilidade | Básico | Intermediário | Médio | Média |
| PHP / Laravel (Manutenção) | Intermediário | Avançado | Baixo | Baixa |
| C# / .NET Core (Manutenção) | Intermediário | Avançado | Baixo | Baixa |

---

## PLANO DE TREINAMENTO

### 1. Spring Boot e Java Avançado
- **Conteúdo Recomendado:** Injeção de dependências, Spring Data JPA, Spring Security, criação de APIs RESTful, Testes Unitários/Integração.
- **Carga Horária Estimada:** 40h
- **Nível de Complexidade:** Alto
- **Pré-Requisitos:** Lógica de programação OO.
- **Ordem Recomendada de Aprendizado:** 1 (Essencial)

### 2. Ecossistema Angular e TypeScript
- **Conteúdo Recomendado:** Arquitetura baseada em componentes, módulos, RxJS (Observables, Subjects), State Management, testes end-to-end e unitários.
- **Carga Horária Estimada:** 35h
- **Nível de Complexidade:** Médio/Alto
- **Pré-Requisitos:** Conhecimento intermediário em JavaScript/TypeScript.
- **Ordem Recomendada de Aprendizado:** 2 (Essencial)

### 3. Banco de Dados: PostgreSQL
- **Conteúdo Recomendado:** DDL e DML avançados, views, procedures, estratégias de indexação, tuning de queries e políticas de backup.
- **Carga Horária Estimada:** 20h
- **Nível de Complexidade:** Médio
- **Pré-Requisitos:** Conhecimento básico em SQL e modelagem de dados.
- **Ordem Recomendada de Aprendizado:** 3 (Essencial)

### 4. DevOps (Docker e Kubernetes)
- **Conteúdo Recomendado:** Criação de Dockerfiles, docker-compose, orquestração com K8s (Pods, Deployments, Services), conceitos de resiliência.
- **Carga Horária Estimada:** 30h
- **Nível de Complexidade:** Alto
- **Pré-Requisitos:** Conhecimentos básicos de redes e sistemas Linux.
- **Ordem Recomendada de Aprendizado:** 4 (Importante)

### 5. Segurança da Informação
- **Conteúdo Recomendado:** OWASP Top 10, autenticação e autorização modernas (OAuth2/OIDC, JWT), práticas de desenvolvimento seguro, LGPD e logs de auditoria.
- **Carga Horária Estimada:** 15h
- **Nível de Complexidade:** Médio
- **Pré-Requisitos:** Conhecimentos sobre a web e protocolos HTTP.
- **Ordem Recomendada de Aprendizado:** 5 (Importante)

### 6. Frontend Complementar: Vue.js
- **Conteúdo Recomendado:** Composition API avançada, Pinia para gerenciamento de estado global e Vue Router.
- **Carga Horária Estimada:** 20h
- **Nível de Complexidade:** Baixo/Médio
- **Pré-Requisitos:** JavaScript Moderno.
- **Ordem Recomendada de Aprendizado:** 6 (Complementar)

### 7. Sustentação e Evolução: Laravel e .NET
- **Conteúdo Recomendado:** Boas práticas de modernização nestes ecossistemas, Eloquent ORM, Entity Framework, APIs e filas.
- **Carga Horária Estimada:** 20h
- **Nível de Complexidade:** Médio
- **Pré-Requisitos:** Experiência com as stacks legadas.
- **Ordem Recomendada de Aprendizado:** 7 (Complementar)

---

## TRILHAS DE APRENDIZAGEM

### Desenvolvedores Backend
1. Java e Spring Boot (Essencial)
2. APIs REST e Documentação OpenAPI (Essencial)
3. PostgreSQL e JPA/Hibernate (Essencial)
4. Laravel e/ou .NET Core (Complementar para equipes de migração/sustentação)

### Desenvolvedores Frontend
1. TypeScript e Boas práticas de UX (Essencial)
2. Angular: Módulos, RxJS e State Management (Essencial)
3. Vue.js: Composition API e Pinia (Complementar/Aplicações Específicas)

### Administradores de Banco
1. PostgreSQL (Essencial)
2. Performance, Tuning e Indexação (Essencial)
3. Modelagem Relacional para Microserviços (Importante)
4. Auditoria, Backup e Recuperação (Essencial)

### DevOps
1. Docker e Containerização (Essencial)
2. Kubernetes (Essencial)
3. Integração e Entrega Contínuas (CI/CD) - Azure DevOps/GitHub (Importante)
4. Observabilidade (Métricas e Traces) (Importante)

### Gestores Técnicos
1. Arquitetura de Software e Migração de Sistemas (Essencial)
2. Governança de TI e Melhores Práticas (Importante)
3. Gestão de Projetos de Modernização Ágil (Essencial)
4. Gestão de Riscos e Conformidade (LGPD) (Essencial)

---

## PLANO DE TRANSFERÊNCIA DE CONHECIMENTO

Estratégias recomendadas para assegurar a internalização do aprendizado e a redução da dependência tecnológica isolada:

- **Documentação Contínua:** Utilizar repositórios de código para versionar a arquitetura (ex: diagramas C4 em Markdown) e gerar documentação de APIs automaticamente com Swagger.
- **Sessões Técnicas Periódicas (Tech Talks):** Encontros quinzenais para apresentação de soluções implementadas pela equipe de desenvolvimento e desafios superados.
- **Workshops Internos:** Sessões mão na massa focadas na resolução de problemas comuns na nova arquitetura, conduzidas por especialistas.
- **Code Review Estruturado:** Instituir obrigatoriedade de revisão de código, unindo profissionais juniores a seniores, focando em qualidade e aprendizado mútuo.
- **Pair Programming:** Utilizar programação em pares em componentes críticos da nova arquitetura (ex: configuração inicial de segurança JWT ou CI/CD pipeline).
- **Comunidades de Prática (CoP):** Criar fóruns informais na empresa focados em temas transversais (Ex: "Guilda de Angular" ou "Guilda de Backend") para promover debates contínuos.
- **Base de Conhecimento Corporativa:** Centralização de tutoriais, FAQs de infraestrutura e guias de troubleshooting em uma wiki de fácil acesso aos novos membros (Onboarding Tecnológico).
