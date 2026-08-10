# Plano de Refatoração: Transparência Pública (TCU IN 84)

Este documento propõe uma arquitetura moderna, segura e eficaz para substituir o atual modelo de publicação de dados de transparência (planilhas manuais e Power BI) no site do Ministério, integrando diretamente com a base de dados do sistema Órbita.

*Nota: Este plano deve ser executado após a finalização de todos os módulos gerenciais internos necessários no Órbita.*

## Contexto e Desafio Atual
Atualmente, o Ministério disponibiliza informações de Licitações, Contratos, Despesas, etc., usando processos manuais (planilhas) e painéis do Power BI. O objetivo é modernizar este processo usando a inteligência de dados já centralizada no Órbita, automatizando fluxos e respeitando padrões governamentais.

---

## Decisões Arquiteturais Consolidadas

### 1. Formatos de Exportação (Dados Abertos)
A IN 84 exige múltiplos formatos para facilitar o acesso à informação. O Órbita automatizará a exportação dos dados consolidados para os seguintes formatos:
*   `.csv` (ideal para análise de dados)
*   `.json` (ideal para integração entre sistemas)
*   **`.odt` (OpenDocument Text):** Conforme definido, os relatórios textuais e tabulares também serão gerados no formato aberto ODT. O backend Node.js utilizará bibliotecas para gerar e hospedar esses documentos estáticos.

### 2. Integração com gov.br
A visualização pública não será um subdomínio avulso, mas sim um **elemento injetado diretamente na página oficial** (`/acesso-a-informacao/transparencia-e-prestacao-de-contas`).
*   **Abordagem Micro Frontend / Widget:** O projeto React que criaremos fará o build de um artefato estático (um bundle JavaScript/CSS encapsulado) que será inserido diretamente no CMS da página do Ministério. Isso garante que a experiência ocorra dentro do portal oficial sem depender de iframes e respeitando o ambiente nativo.

### 3. Gestão de Conteúdo (Textos Fixos)
Para gerenciar os textos regulatórios e descritivos da página sem a necessidade de desenvolvedores a cada mudança de instrução normativa, adotaremos:
*   Um pequeno módulo de CMS integrado ao backend atual do Órbita.
*   Gestores usarão o próprio painel gerencial do Órbita para editar os "textos de apoio", e a API entregará esse conteúdo para o widget público no gov.br.

### 4. Padrão Visual MGI
O micro frontend injetado no gov.br usará estritamente os componentes do **Design System Gov.br (@govbr-ds/core)**, assegurando conformidade total com acessibilidade (e-MAG) e identidade visual.

---

## Proposta de Arquitetura: Camadas

### 1. Camada de Preparação (ETL / Backend Órbita)
*   **Rotina Automatizada (Jobs):** Rotinas noturnas (cron) no backend do Órbita consolidam os dados de Contratos, Licitações e Despesas.
*   **Geração de Arquivos:** Processamento e criação de arquivos CSV, JSON e ODT enviados para uma pasta pública no servidor.

### 2. Camada de Disponibilização (API Pública)
*   **API Read-Only:** Endpoints dedicados (`/api/public/*`) com *rate-limiting* para leitura dos dados e dos textos do CMS, garantindo que o Órbita interno fique isolado.

### 3. Camada de Visualização (Micro Frontend Gov.br)
*   Componente React encapsulado que consome a API Pública e renderiza as tabelas interativas na página do Ministério.

---

## Estrutura de Arquivos Planejada (Future Work)

#### Backend (Node.js/Express)
*   `src/backend/routes/public/transparencyRoutes.ts` (API de Leitura)
*   `src/backend/routes/public/contentRoutes.ts` (API de Textos do CMS)
*   `src/backend/services/transparencyExportService.ts` (Gerador noturno de CSV/JSON/ODT)

#### Frontend (Micro-App Público)
*   `src/public-widget/` (Aplicação React empacotada como Widget injetável, com dependências do MGI instaladas).
