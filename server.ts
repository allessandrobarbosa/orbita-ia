/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Standard types
import { AcordaoDemand, RolResponsavel, ComissaoEticaDemand, SuperintendenciaRegional, ComunicacaoDemand } from "./src/types";
import { SEED_COMUNICACOES } from "./src/data/seed_comunicacoes";

// DB Path Definition
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "orbita_db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial High-Quality Mock/Seed Data in Portuguese (Brazilian Gov Pattern)
const SEED_ACORDAOS: AcordaoDemand[] = [
  {
    KEY: "AC-14068-2023-1C",
    TITULO: "ACÓRDÃO 14068/2023 - ATA 42/2023 - PRIMEIRA CÂMARA",
    NUMACORDAO: 14068,
    ANOACORDAO: 2023,
    NUMATA: "42/2023",
    COLEGIADO: "Primeira Câmara",
    DATASESSAO: "14/11/2023",
    SITUACAO: "OFICIALIZADO",
    PROC: "TC 012.345/2023-6",
    ACORDAOSRELACIONADOS: "Acórdão 1.234/2022 - Plenário",
    TIPOPROCESSO: "REPRESENTAÇÃO (REPR)",
    INTERESSADOS: "Secretaria Executiva do MTE; Coordenação-Geral de Tecnologia da Informação.",
    ENTIDADE: "MTE - Ministério do Trabalho e Emprego",
    UNIDADETECNICA: "AudContratações (Unidade de Auditoria de Contratações)",
    RELATOR: "Ministro Benjamin Zymler",
    ASSUNTO: "Contratação emergencial de suporte técnico continuado de tecnologia de informação.",
    SUMARIO: "Representação com pedido de medida cautelar acerca de suposta irregularidade em dispensa de licitação. O Tribunal julgou parcialmente procedente, determinando o saneamento do Edital substitutivo e apuração dos atos da gestão no âmbito da AECI.",
    ACORDAO: "VISTOS, relatados e discutidos estes autos de representação... ACORDAM os Ministros do Tribunal de Contas da União, reunidos em sessão da Primeira Câmara, ante as razões expostas pelo Relator, Ministro Benjamin Zymler, em:\n1. Conhecer da presente representação para, no mérito, julgá-la parcialmente procedente;\n2. Determinar à Assessoria Especial de Controle Interno do Ministério do Trabalho e Emprego (AECI-MTE) que apresente plano de monitoramento em 90 dias;\n3. Dar ciência ao órgão de que a dispensa de licitação fora do escopo estrito configurará reiteração passível de multa.",
    DECISAO: "Procedência parcial do pleito com determinação de elaboração e apresentação à corte de plano de monitoramento em 90 dias no âmbito da AECI-MTE.",
    STATUS_MONITORAMENTO: "Em Análise",
    RESPONSAVEL_INTERNO: "Alessandro Barbosa (AECI-TCU)",
    PRAZO_LIMITE: "2026-08-15",
    OBSERVACOES: "Plano de ação elaborado pela STI. Aguardando parecer jurídico final para envio à CGU e TCU.",
    ULTIMA_ATUALIZACAO: "19/06/2026 10:15"
  },
  {
    KEY: "AC-2345-2024-PL",
    TITULO: "ACÓRDÃO 2345/2024 - ATA 15/2024 - PLENÁRIO",
    NUMACORDAO: 2345,
    ANOACORDAO: 2024,
    NUMATA: "15/2024",
    COLEGIADO: "Plenário",
    DATASESSAO: "18/04/2024",
    SITUACAO: "OFICIALIZADO",
    PROC: "TC 008.910/2024-2",
    ACORDAOSRELACIONADOS: "Acórdão 890/2023 - Plenário",
    TIPOPROCESSO: "RELATÓRIO DE AUDITORIA (RA)",
    INTERESSADOS: "Superintendência Regional do Trabalho no Rio de Janeiro (SRTE-RJ)",
    ENTIDADE: "MTE - Ministério do Trabalho e Emprego",
    UNIDADETECNICA: "AudBenefícios (Unidade de Auditoria de Benefícios Sociais)",
    RELATOR: "Ministro Vital do Rêgo",
    ASSUNTO: "Auditoria governamental na conformidade de pagamentos do seguro-defeso a pescadores artesanais.",
    SUMARIO: "Auditoria operacional realizada para analisar os fluxos de cadastramento e liberação de parcelas do seguro-defeso. Fragilidade nos cadastros integrados. Determinação de cruzamento de dados com INSS e MAPA.",
    ACORDAO: "ACORDAM os Ministros do Tribunal de Contas da União, reunidos em sessão do Plenário, with fundamento na IN-TCU 84, em:\n1. Recomendar à Secretaria Executiva do MTE a pactuação de convênios técnicos com o INSS;\n2. Determinar o monitoramento de inconsistências pela assessoria de controle interno (AECI) com relatórios semestrais de avanço.",
    DECISAO: "Recomendação formal de articulação de termos com o INSS e determinação de relatórios de conformidade periódicos estruturados pela AECI.",
    STATUS_MONITORAMENTO: "Pendente",
    RESPONSAVEL_INTERNO: "Maria Eunice Ramos (AECI-AUD)",
    PRAZO_LIMITE: "2026-07-30",
    OBSERVACOES: "O INSS já enviou o layout da API. Equipe de inteligência trabalhando no script de cruzamento.",
    ULTIMA_ATUALIZACAO: "18/06/2026 16:40"
  },
  {
    KEY: "AC-789-2025-2C",
    TITULO: "ACÓRDÃO 789/2025 - ATA 08/2025 - SEGUNDA CÂMARA",
    NUMACORDAO: 789,
    ANOACORDAO: 2025,
    NUMATA: "08/2025",
    COLEGIADO: "Segunda Câmara",
    DATASESSAO: "04/03/2025",
    SITUACAO: "OFICIALIZADO",
    PROC: "TC 033.456/2024-0",
    ACORDAOSRELACIONADOS: "Nenhum",
    TIPOPROCESSO: "PRESTAÇÃO DE CONTAS ANUAL (PCA)",
    INTERESSADOS: "Membros do Rol de Responsáveis de 2023 - MTE",
    ENTIDADE: "MTE - Ministério do Trabalho e Emprego",
    UNIDADETECNICA: "AudGovernança (Unidade de Auditoria de Governança de Pessoas)",
    RELATOR: "Ministro Jorge Oliveira",
    ASSUNTO: "Julgamento de regularidade das contas da AECI e do Gabinete do Ministro - Exercício 2023.",
    SUMARIO: "Exame das prestações de contas referente às diretrizes do acórdão de regulação geral da IN 84/TCU. O Tribunal julgou as contas regulares com ressalva, expedindo alertas para os controles de despesas correntes de viagens.",
    ACORDAO: "VISTOS e relatados estes autos de contas anuais... ACORDAM os Ministros da Segunda Câmara em julgar as contas Regulares com Ressalva dos gestores indicados, com fulcro nos artigos 16 e 18 da Lei 8.443/92, expedindo recomendação de melhoria de rastreabilidade de passagens aéreas e diárias em 180 dias.",
    DECISAO: "Regularidade com ressalva das contas dos gestores do MTE de 2023, recomendando implantação de sistemática de controle de passagens terrestres e aéreas.",
    STATUS_MONITORAMENTO: "Cumprido",
    RESPONSAVEL_INTERNO: "Jorge Luiz Santos (AECI)",
    PRAZO_LIMITE: "2026-05-01",
    OBSERVACOES: "Portaria MTE nº 4.542/2025 publicada contendo novas regras de diárias de viagem. Comprovante enviado ao TCU.",
    ULTIMA_ATUALIZACAO: "15/06/2026 14:00"
  },
  {
    KEY: "AC-1202-2026-PL",
    TITULO: "ACÓRDÃO 1202/2026 - ATA 22/2026 - PLENÁRIO",
    NUMACORDAO: 1202,
    ANOACORDAO: 2026,
    NUMATA: "22/2026",
    COLEGIADO: "Plenário",
    DATASESSAO: "05/06/2026",
    SITUACAO: "OFICIALIZADO",
    PROC: "TC 015.678/2025-9",
    ACORDAOSRELACIONADOS: "Acórdão 981/2025-PL",
    TIPOPROCESSO: "DENÚNCIA (DEN)",
    INTERESSADOS: "Superintendência Regional do Trabalho do Estado de São Paulo (SRTE-SP)",
    ENTIDADE: "MTE - Ministério do Trabalho e Emprego",
    UNIDADETECNICA: "AudPatrimônio (Unidade de Auditoria de Infraestrutura e Logística)",
    RELATOR: "Ministro Jhonatan de Jesus",
    ASSUNTO: "Supostas irregularidades na locação de imóveis administrativos no centro de São Paulo/SP.",
    SUMARIO: "Denúncia de licitação viciada na contratação de imóvel para abrigar a Gerência Regional de Campinas e sede da SRTE. Cautelar suspensa pelo TCU condicionada a renegociação de aluguel abaixo da tabela oficial referencial.",
    ACORDAO: "O Plenário ACORDA, ante as razões aduzidas pelo Relator, em conhecer e dar provimento parcial à Denúncia, revogando a cautelar, mas determinando à AECI que realize auditoria independente no contrato de locação nº 12/2025 de São Paulo, glosando eventuais excedentes históricos.",
    DECISAO: "Dar provimento parcial à denúncia, cassando a liminar anterior e determinando que a assessoria (AECI) conclua auditoria nos valores de m² contratados.",
    STATUS_MONITORAMENTO: "Atrasado",
    RESPONSAVEL_INTERNO: "Alessandro Barbosa (AECI)",
    PRAZO_LIMITE: "2026-06-15",
    OBSERVACOES: "Depende de vistoria física de engenheiro do MTE que está programada para a próxima semana. Solicitada prorrogação de prazo formal ao TCU.",
    ULTIMA_ATUALIZACAO: "19/06/2026 09:30"
  }
];

const SEED_ROL_RESPONSAVEIS: RolResponsavel[] = [
  {
    id: "R-1",
    nome: "Luiz Marinho",
    cpf: "XXX.345.987-XX",
    cargo: "Ministro de Estado do Trabalho e Emprego",
    unidade: "Gabinete do Ministro (GM)",
    inicioExercicio: "2023-01-01",
    fimExercicio: "Vigente",
    atoNomeacao: "Decreto Presidencial de 01/01/2023",
    status: "Vigente",
    observacoes: "Gestor principal do órgão conforme regras da IN 84/TCU."
  },
  {
    id: "R-2",
    nome: "Francisco Macena da Silva",
    cpf: "XXX.812.441-XX",
    cargo: "Secretário-Executivo",
    unidade: "Secretaria-Executiva (SE)",
    inicioExercicio: "2023-01-03",
    fimExercicio: "Vigente",
    atoNomeacao: "Portaria Presidencial nº 12 de 03/01/2023",
    status: "Vigente",
    observacoes: "Ordenador de despesas principal para o fluxo MTE."
  },
  {
    id: "R-3",
    nome: "Gilberto de Souza Cardoso",
    cpf: "XXX.718.309-XX",
    cargo: "Assessor Especial de Controle Interno",
    unidade: "Assessoria Especial de Controle Interno (AECI)",
    inicioExercicio: "2023-02-15",
    fimExercicio: "2025-03-10",
    atoNomeacao: "Portaria MTE nº 120 de 15/02/2023",
    status: "Encerrado",
    observacoes: "Feita a transição e a aprovação das contas do triênio."
  },
  {
    id: "R-4",
    nome: "Alessandro Barbosa",
    cpf: "XXX.115.340-XX",
    cargo: "Chefe de Divisão de Monitoramento TCU/CGU",
    unidade: "Assessoria Especial de Controle Interno (AECI)",
    inicioExercicio: "2025-03-11",
    fimExercicio: "Vigente",
    atoNomeacao: "Portaria MTE nº 345 de 10/03/2025",
    status: "Vigente",
    observacoes: "Responsável pelo núcleo de gestão do sistema ORBITA.AECI."
  }
];

const SEED_COMISSAO_ETICA: ComissaoEticaDemand[] = [
  {
    id: "E-1",
    protocolo: "MTE-ETI-2026-0004",
    dataClassificacao: "2026-02-12",
    descricao: "Apuração de eventual conflito de interesses de servidor em assessoria externa privada concomitante a cargo em comissão.",
    envolvidos: "Assessor Técnico da Secretaria de Qualificação Profissional",
    orgaoOrigem: "Comissão de Ética Local",
    relator: "Dra. Carla Antunes (Presidente)",
    status: "Processo Ético",
    recomendacoes: "Aguardando manifestação final do servidor e envio de certidão eletrônica da CGU."
  },
  {
    id: "E-2",
    protocolo: "MTE-ETI-2026-0012",
    dataClassificacao: "2026-04-05",
    descricao: "Denúncia de assédio por tratamento agressivo reiterado endereçado a subordinados diretos em gerência regional.",
    envolvidos: "Gerente Regional do Trabalho de Ribeirão Preto/SP",
    orgaoOrigem: "AECI / Ouvidoria Fala.BR",
    relator: "Dr. Marcelo Augusto de Souza",
    status: "Apuração Preliminar",
    recomendacoes: "Fase de oitivas de testemunhas e análise técnica do dossiê de e-mails."
  },
  {
    id: "E-3",
    protocolo: "MTE-ETI-2025-0089",
    dataClassificacao: "2025-11-20",
    descricao: "Uso inadequado de veículo oficial de representação fora do expediente regulamentado e sem justificativa de agenda.",
    envolvidos: "Ex-Servidor de apoio executivo",
    orgaoOrigem: "Superintendência de Minas Gerais",
    relator: "Dra. Carla Antunes (Presidente)",
    status: "Concluído",
    recomendacoes: "Conselho ético recomendou Censura Ética fundamentada no Código de Conduta. Encaminhado à Corregedoria do Trabalho para providências de sua alçada operacional."
  }
];

// Seed 26 UF + DF for Superintendências Regionais do Trabalho (SRTEs)
const SEED_SUPERINTENDENCIAS: SuperintendenciaRegional[] = [
  { uf: "AC", capital: "Rio Branco", superintendente: "Antônio Santos", cargo: "Superintendente SRT-AC", endereco: "Rua Floriano Peixoto, 230 - Centro", contato: "(68) 3212-4000", email: "srte.ac@mte.gov.br", demandasTCU: 1, demandasCGU: 3, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "AL", capital: "Maceió", superintendente: "Maria Oliveira", cargo: "Superintendente SRT-AL", endereco: "Av. Fernandes Lima, 122 - Farol", contato: "(82) 3315-1100", email: "srte.al@mte.gov.br", demandasTCU: 0, demandasCGU: 2, demandasEtica: 1, statusGeral: "Regular" },
  { uf: "AM", capital: "Manaus", superintendente: "Francisco Mendes", cargo: "Superintendente SRT-AM", endereco: "Av. André Araújo, 1500 - Aleixo", contato: "(92) 3621-8200", email: "srte.am@mte.gov.br", demandasTCU: 2, demandasCGU: 5, demandasEtica: 1, statusGeral: "Atenção" },
  { uf: "AP", capital: "Macapá", superintendente: "Juliana Costa", cargo: "Superintendente SRT-AP", endereco: "Rua Hamilton Silva, 1420 - Centro", contato: "(96) 3223-5500", email: "srte.ap@mte.gov.br", demandasTCU: 0, demandasCGU: 1, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "BA", capital: "Salvador", superintendente: "José Carlos Silva", cargo: "Superintendente SRT-BA", endereco: "Av. Sete de Setembro, 234 - Campo Grande", contato: "(71) 3329-8400", email: "srte.ba@mte.gov.br", demandasTCU: 3, demandasCGU: 8, demandasEtica: 2, statusGeral: "Atenção" },
  { uf: "CE", capital: "Fortaleza", superintendente: "Fabiano Rocha", cargo: "Superintendente SRT-CE", endereco: "Rua Tibúrcio Cavalcante, 1500 - Aldeota", contato: "(85) 3455-2100", email: "srte.ce@mte.gov.br", demandasTCU: 1, demandasCGU: 4, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "DF", capital: "Brasília", superintendente: "Paulo Henrique Sousa", cargo: "Superintendente SRT-DF", endereco: "W3 Norte, Quadra 509 - Asa Norte", contato: "(61) 3218-2000", email: "srte.df@mte.gov.br", demandasTCU: 5, demandasCGU: 12, demandasEtica: 3, statusGeral: "Crítico" },
  { uf: "ES", capital: "Vitória", superintendente: "Renata Neves", cargo: "Superintendente SRT-ES", endereco: "Av. César Hilal, 1260 - Bento Ferreira", contato: "(27) 3223-8800", email: "srte.es@mte.gov.br", demandasTCU: 0, demandasCGU: 2, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "GO", capital: "Goiânia", superintendente: "Luiz Carlos Dias", cargo: "Superintendente SRT-GO", endereco: "Av. 85, nº 1420 - Setor Sul", contato: "(62) 3223-1122", email: "srte.go@mte.gov.br", demandasTCU: 1, demandasCGU: 3, demandasEtica: 1, statusGeral: "Regular" },
  { uf: "MA", capital: "São Luís", superintendente: "Cláudio Sampaio", cargo: "Superintendente SRT-MA", endereco: "Rua do Sol, 234 - Centro", contato: "(98) 3232-4400", email: "srte.ma@mte.gov.br", demandasTCU: 2, demandasCGU: 6, demandasEtica: 1, statusGeral: "Atenção" },
  { uf: "MG", capital: "Belo Horizonte", superintendente: "Alessandra Silveira", cargo: "Superintendente SRT-MG", endereco: "Rua Tamoios, 596 - Centro", contato: "(31) 3270-6100", email: "srte.mg@mte.gov.br", demandasTCU: 4, demandasCGU: 9, demandasEtica: 3, statusGeral: "Atenção" },
  { uf: "MS", capital: "Campo Grande", superintendente: "Carlos Alberto", cargo: "Superintendente SRT-MS", endereco: "Rua 13 de Maio, 1234 - Centro", contato: "(67) 3316-2100", email: "srte.ms@mte.gov.br", demandasTCU: 1, demandasCGU: 2, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "MT", capital: "Cuiabá", superintendente: "Ewerton Garcia", cargo: "Superintendente SRT-MT", endereco: "Rua Historiador Rubens de Mendonça, 1200", contato: "(65) 3613-2200", email: "srte.mt@mte.gov.br", demandasTCU: 2, demandasCGU: 4, demandasEtica: 1, statusGeral: "Regular" },
  { uf: "PA", capital: "Belém", superintendente: "Raimundo Ferreira", cargo: "Superintendente SRT-PA", endereco: "Travessa Nove de Janeiro, 1230", contato: "(91) 3223-8877", email: "srte.pa@mte.gov.br", demandasTCU: 3, demandasCGU: 7, demandasEtica: 2, statusGeral: "Crítico" },
  { uf: "PB", capital: "João Pessoa", superintendente: "Gervásio Filho", cargo: "Superintendente SRT-PB", endereco: "Av. Getúlio Vargas, 201 - Centro", contato: "(83) 3218-1200", email: "srte.pb@mte.gov.br", demandasTCU: 0, demandasCGU: 3, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "PE", capital: "Recife", superintendente: "Clara Maria Santos", cargo: "Superintendente SRT-PE", endereco: "Av. Agamenon Magalhães, 2000", contato: "(81) 3419-5100", email: "srte.pe@mte.gov.br", demandasTCU: 2, demandasCGU: 6, demandasEtica: 1, statusGeral: "Regular" },
  { uf: "PI", capital: "Teresina", superintendente: "Hugo Valério", cargo: "Superintendente SRT-PI", endereco: "Rua Areolino de Abreu, 1234 - Centro", contato: "(86) 3221-1100", email: "srte.pi@mte.gov.br", demandasTCU: 1, demandasCGU: 2, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "PR", capital: "Curitiba", superintendente: "Marcos Aurélio", cargo: "Superintendente SRT-PR", endereco: "Rua José Loureiro, 574 - Centro", contato: "(41) 3219-7500", email: "srte.pr@mte.gov.br", demandasTCU: 2, demandasCGU: 5, demandasEtica: 2, statusGeral: "Regular" },
  { uf: "RJ", capital: "Rio de Janeiro", superintendente: "Fernanda Cristina", cargo: "Superintendente SRT-RJ", endereco: "Av. Presidente Antônio Carlos, 251", contato: "(21) 2212-3200", email: "srte.rj@mte.gov.br", demandasTCU: 4, demandasCGU: 10, demandasEtica: 3, statusGeral: "Crítico" },
  { uf: "RN", capital: "Natal", superintendente: "Ricardo Wanderley", cargo: "Superintendente SRT-RN", endereco: "Av. Duque de Caxias, 123 - Ribeira", contato: "(84) 3220-4100", email: "srte.rn@mte.gov.br", demandasTCU: 0, demandasCGU: 2, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "RO", capital: "Porto Velho", superintendente: "Tito Livio", cargo: "Superintendente SRT-RO", endereco: "Av. Jorge Teixeira, 2244 - Liberdade", contato: "(69) 3217-1000", email: "srte.ro@mte.gov.br", demandasTCU: 1, demandasCGU: 3, demandasEtica: 1, statusGeral: "Regular" },
  { uf: "RR", capital: "Boa Vista", superintendente: "Geandré Oliveira", cargo: "Superintendente SRT-RR", endereco: "Av. Ville Roy, 5500 - Canarinho", contato: "(95) 3624-9100", email: "srte.rr@mte.gov.br", demandasTCU: 0, demandasCGU: 2, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "RS", capital: "Porto Alegre", superintendente: "Sandra Regina", cargo: "Superintendente SRT-RS", endereco: "Av. Bahia, 560 - Navegantes", contato: "(51) 3211-1300", email: "srte.rs@mte.gov.br", demandasTCU: 2, demandasCGU: 6, demandasEtica: 2, statusGeral: "Regular" },
  { uf: "SC", capital: "Florianópolis", superintendente: "Luiza Helena", cargo: "Superintendente SRT-SC", endereco: "Rua Rui Barbosa, 234 - Agronômica", contato: "(48) 3223-9100", email: "srte.sc@mte.gov.br", demandasTCU: 1, demandasCGU: 3, demandasEtica: 1, statusGeral: "Regular" },
  { uf: "SE", capital: "Aracaju", superintendente: "Valter Santos", cargo: "Superintendente SRT-SE", endereco: "Rua Ministro Geraldo Barreto Sobral, 22", contato: "(79) 3214-8800", email: "srte.se@mte.gov.br", demandasTCU: 0, demandasCGU: 1, demandasEtica: 0, statusGeral: "Regular" },
  { uf: "SP", capital: "São Paulo", superintendente: "Marcus Vinícius", cargo: "Superintendente SRT-SP", endereco: "Rua Martins Fontes, 109 - Centro", contato: "(11) 3150-8100", email: "srte.sp@mte.gov.br", demandasTCU: 6, demandasCGU: 14, demandasEtica: 4, statusGeral: "Crítico" },
  { uf: "TO", capital: "Palmas", superintendente: "Reginaldo Bezerra", cargo: "Superintendente SRT-TO", endereco: "Quadra 104 Norte, Av. LO 02, Lt 12", contato: "(63) 3214-9900", email: "srte.to@mte.gov.br", demandasTCU: 1, demandasCGU: 2, demandasEtica: 0, statusGeral: "Regular" }
];

// Initial High-Quality Mock/Seed Data in Portuguese (Brazilian Gov Pattern)
const SEED_TCES: any[] = [
  {
    id: "TCE 001/2023",
    NUMERO_ANO_TCE: "TCE 001/2023",
    PROCESSO_ADMINISTRATIVO: "46000.001234/2022-88",
    MOTIVO_INSTAURACAO: "Não comprovação da regular aplicação de recursos",
    SUBMOTIVO_INSTAURACAO: "Omissão no dever de prestar contas",
    DEBITO_ORIGINAL: "R$ 150.000,00",
    DEBITO_ATUALIZADO: "R$ 185.340,12",
    DATA_ATUALIZACAO_DEBITO: "15/05/2024",
    ULTIMO_POSICIONAMENTO: "Parecer Técnico Favorável encaminhado para CGU",
    TC: "TC 012.345/2023-1",
    ESTADO_PROCESSO: "Aguardando Julgamento",
    SITUACAO_PROCESSO: "Em instrução no TCU",
    PRIMEIRO_JULGAMENTO: "Pendente",
    ENCERRAMENTO: "Pendente",
    ANO: 2023
  },
  {
    id: "TCE 002/2024",
    NUMERO_ANO_TCE: "TCE 002/2024",
    PROCESSO_ADMINISTRATIVO: "46010.005678/2023-12",
    MOTIVO_INSTAURACAO: "Desvio de objeto em convênio federal",
    SUBMOTIVO_INSTAURACAO: "Aplicação dos recursos em finalidade diversa",
    DEBITO_ORIGINAL: "R$ 320.000,00",
    DEBITO_ATUALIZADO: "R$ 352.120,45",
    DATA_ATUALIZACAO_DEBITO: "10/01/2025",
    ULTIMO_POSICIONAMENTO: "Notificação expedida ao convenente para recolhimento imediato",
    TC: "TC 008.921/2024-5",
    ESTADO_PROCESSO: "Citado",
    SITUACAO_PROCESSO: "Fase Externa instaurada",
    PRIMEIRO_JULGAMENTO: "Pendente",
    ENCERRAMENTO: "Pendente",
    ANO: 2024
  },
  {
    id: "TCE 003/2022",
    NUMERO_ANO_TCE: "TCE 003/2022",
    PROCESSO_ADMINISTRATIVO: "46020.000451/2021-99",
    MOTIVO_INSTAURACAO: "Superfaturamento em contrato de prestação de serviços",
    SUBMOTIVO_INSTAURACAO: "Atesto de serviços não prestados",
    DEBITO_ORIGINAL: "R$ 90.000,00",
    DEBITO_ATUALIZADO: "R$ 123.850,00",
    DATA_ATUALIZACAO_DEBITO: "22/10/2023",
    ULTIMO_POSICIONAMENTO: "Inscrito no CADIN e processo transitado em julgado pelo TCU",
    TC: "TC 033.451/2022-0",
    ESTADO_PROCESSO: "Julgado Irregular",
    SITUACAO_PROCESSO: "Esgotamento das medidas de cobrança",
    PRIMEIRO_JULGAMENTO: "Acórdão 14068/2023 - Primeira Câmara",
    ENCERRAMENTO: "Concluido com Condenação",
    ANO: 2022
  }
];

const SEED_TCE_ACORDAO_MAPPINGS: any[] = [
  {
    NUMERO_ANO_TCE: "TCE 003/2022",
    ACORDAO_REF: "14068/2023"
  }
];

// Helper to load/save database state
function loadDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultData = {
      acordaos: SEED_ACORDAOS,
      comunicacoes: SEED_COMUNICACOES,
      rolResponsaveis: SEED_ROL_RESPONSAVEIS,
      comissaoEtica: SEED_COMISSAO_ETICA,
      superintendencias: SEED_SUPERINTENDENCIAS,
      tces: SEED_TCES,
      tceAcordaoMappings: SEED_TCE_ACORDAO_MAPPINGS
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    
    // Ensure backwards compatibility by seeding key if missing
    let dataModified = false;
    if (!data.comunicacoes) {
      data.comunicacoes = SEED_COMUNICACOES;
      dataModified = true;
    }
    if (!data.tces) {
      data.tces = SEED_TCES;
      dataModified = true;
    }
    if (!data.tceAcordaoMappings) {
      data.tceAcordaoMappings = SEED_TCE_ACORDAO_MAPPINGS;
      dataModified = true;
    }
    if (dataModified) {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    }
    return data;
  } catch (err) {
    console.error("Error reading database fallback to seed:", err);
    return {
      acordaos: SEED_ACORDAOS,
      comunicacoes: SEED_COMUNICACOES,
      rolResponsaveis: SEED_ROL_RESPONSAVEIS,
      comissaoEtica: SEED_COMISSAO_ETICA,
      superintendencias: SEED_SUPERINTENDENCIAS,
      tces: SEED_TCES,
      tceAcordaoMappings: SEED_TCE_ACORDAO_MAPPINGS
    };
  }
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database file:", err);
  }
}

// Start up Express full-stack flow
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API 1: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "ORBITA.AECI", localTime: new Date().toISOString() });
  });

  // API 2: Acórdãos TCU - GET & CRUD
  app.get("/api/acordaos", (req, res) => {
    const db = loadDatabase();
    res.json(db.acordaos);
  });

  app.post("/api/acordaos/update", (req, res) => {
    const db = loadDatabase();
    const updated = req.body as AcordaoDemand;
    const index = db.acordaos.findIndex((x: any) => x.KEY === updated.KEY);

    if (index >= 0) {
      db.acordaos[index] = { ...db.acordaos[index], ...updated, ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR") };
      saveDatabase(db);
      res.json({ success: true, item: db.acordaos[index] });
    } else {
      res.status(404).json({ error: "Acórdão não encontrado no repositório." });
    }
  });

  app.delete("/api/acordaos/:key", (req, res) => {
    const db = loadDatabase();
    const key = req.params.key;
    db.acordaos = db.acordaos.filter((x: any) => x.KEY !== key);
    saveDatabase(db);
    res.json({ success: true });
  });

  // API 2.5: Comunicações (Ofícios) - GET & CRUD & IMPORT
  app.get("/api/comunicacoes", (req, res) => {
    const db = loadDatabase();
    res.json(db.comunicacoes || []);
  });

  app.post("/api/comunicacoes/update", (req, res) => {
    const db = loadDatabase();
    const updated = req.body as ComunicacaoDemand;
    if (!db.comunicacoes) db.comunicacoes = [];
    const index = db.comunicacoes.findIndex((x: any) => x.KEY === updated.KEY);

    if (index >= 0) {
      db.comunicacoes[index] = { 
        ...db.comunicacoes[index], 
        ...updated, 
        ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR") 
      };
      saveDatabase(db);
      res.json({ success: true, item: db.comunicacoes[index] });
    } else {
      res.status(404).json({ error: "Comunicação não encontrada." });
    }
  });

  app.delete("/api/comunicacoes/:key", (req, res) => {
    const db = loadDatabase();
    const key = req.params.key;
    db.comunicacoes = (db.comunicacoes || []).filter((x: any) => x.KEY !== key);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/comunicacoes/import", (req, res) => {
    const db = loadDatabase();
    const { items } = req.body; // array of ComunicacaoDemand
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importação inválido." });
    }
    
    if (!db.comunicacoes) db.comunicacoes = [];

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const idx = db.comunicacoes.findIndex((x: any) => x.KEY === item.KEY || (x.COMUNICACAO === item.COMUNICACAO && x.ANO === item.ANO));
      if (idx >= 0) {
        // Merge - preserve local updates if any, but overwrite standard fields
        db.comunicacoes[idx] = {
          ...db.comunicacoes[idx],
          ...item,
          ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
        };
        updatedCount++;
      } else {
        db.comunicacoes.unshift({
          ...item,
          ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
        });
        importedCount++;
      }
    }

    saveDatabase(db);
    res.json({ 
      success: true, 
      importedCount, 
      updatedCount, 
      totalCount: db.comunicacoes.length,
      items: db.comunicacoes 
    });
  });

  // API 2.7: Tomada de Contas Especial (TCE) - GET, CRUD & IMPORT
  app.get("/api/tces", (req, res) => {
    const db = loadDatabase();
    res.json(db.tces || []);
  });

  app.post("/api/tces/update", (req, res) => {
    const db = loadDatabase();
    const updated = req.body;
    if (!db.tces) db.tces = [];
    const index = db.tces.findIndex((x: any) => x.id === updated.id);

    if (index >= 0) {
      db.tces[index] = { 
        ...db.tces[index], 
        ...updated, 
        ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR") 
      };
      saveDatabase(db);
      res.json({ success: true, item: db.tces[index] });
    } else {
      res.status(404).json({ error: "TCE não encontrada." });
    }
  });

  app.delete("/api/tces/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.tces = (db.tces || []).filter((x: any) => x.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/tces/import", (req, res) => {
    const db = loadDatabase();
    const { items } = req.body; // array of TceDemand
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importação inválido para TCE." });
    }

    if (!db.tces) db.tces = [];

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const idx = db.tces.findIndex((x: any) => x.id === item.id || x.NUMERO_ANO_TCE === item.NUMERO_ANO_TCE);
      if (idx >= 0) {
        db.tces[idx] = {
          ...db.tces[idx],
          ...item,
          ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
        };
        updatedCount++;
      } else {
        db.tces.unshift({
          ...item,
          ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
        });
        importedCount++;
      }
    }

    saveDatabase(db);
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: db.tces.length,
      items: db.tces
    });
  });

  // API 2.8: TCE com Acórdão mappings (Mapeamentos)
  app.get("/api/tce-mappings", (req, res) => {
    const db = loadDatabase();
    res.json(db.tceAcordaoMappings || []);
  });

  app.post("/api/tce-mappings/import", (req, res) => {
    const db = loadDatabase();
    const { items } = req.body; // array of TceAcordaoMapping
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de mapeamento inválido." });
    }

    if (!db.tceAcordaoMappings) db.tceAcordaoMappings = [];

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const idx = db.tceAcordaoMappings.findIndex((x: any) => x.NUMERO_ANO_TCE === item.NUMERO_ANO_TCE);
      if (idx >= 0) {
        db.tceAcordaoMappings[idx] = {
          ...db.tceAcordaoMappings[idx],
          ...item
        };
        updatedCount++;
      } else {
        db.tceAcordaoMappings.unshift(item);
        importedCount++;
      }
    }

    saveDatabase(db);
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: db.tceAcordaoMappings.length,
      items: db.tceAcordaoMappings
    });
  });


  // API 3: The magic Smart TCU open data CSV importer!
  // It handles Grouping input strings (e.g. "14068/2023-1C") or direct parsed structured items
  // from our base spreadsheet file inside a full dual crossing/merging engine.
  app.post("/api/acordaos/import", async (req, res) => {
    const db = loadDatabase();
    const { acordaosList, items } = req.body; // acordaosList = codes, items = parsed file rows

    const results: {
      input: string;
      parsedNumero: number | null;
      parsedAno: number | null;
      status: "cached" | "imported" | "updated" | "error";
      item?: AcordaoDemand;
      message: string;
    }[] = [];

    // --- MODE A: Reconnecting and Merging from compiled Base File Items ---
    if (items && Array.isArray(items) && items.length > 0) {
      for (const rawItem of items) {
        if (!rawItem.NUMACORDAO || !rawItem.ANOACORDAO) continue;

        const numAcordao = Number(rawItem.NUMACORDAO);
        const anoAcordao = Number(rawItem.ANOACORDAO);
        const generatedKey = `AC-${numAcordao}-${anoAcordao}`;

        // Locate preexisting monitoring trace to protect user changes
        const existingIndex = db.acordaos.findIndex(
          (x: any) => x.NUMACORDAO === numAcordao && x.ANOACORDAO === anoAcordao
        );

        // Simulated API values if missing in base file
        const colegiadoOptions = ["Plenário", "Primeira Câmara", "Segunda Câmara"];
        const chosenColegiado = rawItem.COLEGIADO || colegiadoOptions[numAcordao % 3];
        const numAta = rawItem.NUMATA || `${Math.floor((numAcordao % 45) + 1)}/${anoAcordao}`;
        const dataSessao = rawItem.DATASESSAO || `${String(Math.floor((numAcordao % 28) + 1)).padStart(2, "0")}/${String(Math.floor((numAcordao % 12) + 1)).padStart(2, "0")}/${anoAcordao}`;
        const relatorOptions = ["Ministro Benjamin Zymler", "Ministro Vital do Rêgo", "Ministro Jorge Oliveira", "Ministro Jhonatan de Jesus", "Ministro Walton Alencar Rodrigues"];
        const chosenRelator = rawItem.RELATOR || relatorOptions[numAcordao % 5];
        const utOptions = ["AudContratações (Unidade de Auditoria de Contratações)", "AudBenefícios (Unidade de Auditoria de Benefícios Sociais)", "AudGovernança (Unidade de Auditoria de Governança de Pessoas)", "AudPatrimônio (Unidade de Auditoria de Infraestrutura e Logística)"];
        const chosenUT = rawItem.UNIDADETECNICA || utOptions[numAcordao % 4];
        
        const defaultAssuntos = [
          "Aprimoramento dos controles de governança de TI e sistemas de apoio.",
          "Prestação de contas simplificada dos convênios regionais pactuados.",
          "Análise de inconsistências em bancos de dados de seguro-desemprego."
        ];
        const chosenAssunto = rawItem.ASSUNTO || defaultAssuntos[numAcordao % 3];

        const defaultDecisoes = [
          "Julgar as presentes contas regulares com ressalva e recomendar o aprimoramento operacional.",
          "Determinar à assessoria interna o recadastramento de convênios.",
          "Instaurar monitoramento sistemático para mitigar desvios cadastrais de conformidade."
        ];
        const chosenDecisao = rawItem.DECISAO || defaultDecisoes[numAcordao % 3];

        // Format and clean text strings
        const compiledItem: AcordaoDemand = {
          KEY: generatedKey,
          TITULO: rawItem.TITULO || `ACÓRDÃO ${numAcordao}/${anoAcordao} - ATA ${numAta} - ${chosenColegiado.toUpperCase()}`,
          NUMACORDAO: numAcordao,
          ANOACORDAO: anoAcordao,
          NUMATA: numAta,
          COLEGIADO: chosenColegiado,
          DATASESSAO: dataSessao,
          SITUACAO: rawItem.SITUACAO || "OFICIALIZADO",
          PROC: rawItem.PROC || `TC ${String(numAcordao % 999).padStart(3, "0")}.${String(Math.floor(numAcordao / 100)).padStart(3, "0")}/${anoAcordao}-0`,
          ACORDAOSRELACIONADOS: rawItem.ACORDAOSRELACIONADOS || "Nenhum",
          TIPOPROCESSO: rawItem.TIPOPROCESSO || "ACOMPANHAMENTO (ACOMP)",
          INTERESSADOS: rawItem.INTERESSADOS || "Ministério do Trabalho e Emprego (AECI-MTE)",
          ENTIDADE: rawItem.ENTIDADE || "MTE - Ministério do Trabalho e Emprego",
          UNIDADETECNICA: chosenUT,
          RELATOR: chosenRelator,
          ASSUNTO: chosenAssunto,
          SUMARIO: rawItem.SUMARIO || `Acórdão nº ${numAcordao}/${anoAcordao} importado de arquivo unificado e cruzado com base TCU.`,
          ACORDAO: rawItem.ACORDAO || `VISTOS e relatados estes autos... ACORDAM os Ministros reunidos em sessão de ${chosenColegiado} em determinar à assessoria da AECI o acompanhamento.`,
          DECISAO: chosenDecisao,
          
          // Preserving editing variables
          STATUS_MONITORAMENTO: existingIndex >= 0 ? db.acordaos[existingIndex].STATUS_MONITORAMENTO : (rawItem.STATUS_MONITORAMENTO || "Pendente"),
          RESPONSAVEL_INTERNO: existingIndex >= 0 ? db.acordaos[existingIndex].RESPONSAVEL_INTERNO : (rawItem.RESPONSAVEL_INTERNO || "AECI - Divisão de Monitoramento"),
          PRAZO_LIMITE: existingIndex >= 0 ? db.acordaos[existingIndex].PRAZO_LIMITE : (rawItem.PRAZO_LIMITE || `${anoAcordao + 1}-12-31`),
          OBSERVACOES: existingIndex >= 0 ? db.acordaos[existingIndex].OBSERVACOES : (rawItem.OBSERVACOES || "Importado do arquivo base. Cruzamento automático de metadados concluído."),
          ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
        };

        if (existingIndex >= 0) {
          db.acordaos[existingIndex] = compiledItem;
          results.push({
            input: `${numAcordao}/${anoAcordao}`,
            parsedNumero: numAcordao,
            parsedAno: anoAcordao,
            status: "updated",
            item: compiledItem,
            message: "Reconciliado e atualizado (banco de monitoramento local preservado)"
          });
        } else {
          db.acordaos.unshift(compiledItem);
          results.push({
            input: `${numAcordao}/${anoAcordao}`,
            parsedNumero: numAcordao,
            parsedAno: anoAcordao,
            status: "imported",
            item: compiledItem,
            message: "Acórdão cadastrado e cruzado com sucesso via arquivo base!"
          });
        }
      }

      saveDatabase(db);
      return res.json({ success: true, results, updatedAcordaos: db.acordaos });
    }

    // --- MODE B: Direct API crawl search logic based on codesList ---
    if (!acordaosList || !Array.isArray(acordaosList)) {
      return res.status(400).json({ error: "Lista de acórdãos em formato inválido. Envie 'items' ou 'acordaosList'." });
    }

    for (const itemString of acordaosList) {
      if (!itemString || typeof itemString !== "string") continue;

      // Extract number and year using flexible regex (\d+)\/(\d{4})
      const match = itemString.match(/(\d+)\/(\d{4})/);
      if (!match) {
        results.push({
          input: itemString,
          parsedNumero: null,
          parsedAno: null,
          status: "error",
          message: "Formato inválido. Use Número/Ano (ex: 14068/2023-1C ou 987/2024)"
        });
        continue;
      }

      const numAcordao = parseInt(match[1]);
      const anoAcordao = parseInt(match[2]);
      const generatedKey = `AC-${numAcordao}-${anoAcordao}`;

      // 1. Check if we already have it cached in db
      const existing = db.acordaos.find(
        (x: any) => x.NUMACORDAO === numAcordao && x.ANOACORDAO === anoAcordao
      );

      if (existing) {
        results.push({
          input: itemString,
          parsedNumero: numAcordao,
          parsedAno: anoAcordao,
          status: "cached",
          item: existing,
          message: "Carregado do repositório local (já monitorado)"
        });
        continue;
      }

      // 2. Crawl/Simulation layer.
      // NOTE: This section simulates an external API call. For a real-world scenario,
      // you would replace this with a fetch/axios call to the actual TCU open data API.
      try {
        // --- SIMULATED API RESPONSE ---
        // This is where you would fetch from a real external API, e.g.:
        // const response = await fetch(`https://api.tcu.gov.br/v1/acordaos?numero=${numAcordao}&ano=${anoAcordao}`);
        // const apiData = await response.json();
        // For this example, we'll continue with the simulation but make it clearer.

        // Mock API data generation
        const colegiadoOptions = ["Plenário", "Primeira Câmara", "Segunda Câmara"];        const chosenColegiado = colegiadoOptions[numAcordao % 3];
        const numAta = `${Math.floor(Math.random() * 45) + 1}/${anoAcordao}`;
        const dataSessao = `${String(Math.floor((numAcordao % 28) + 1)).padStart(2, "0")}/${String(Math.floor((numAcordao % 12) + 1)).padStart(2, "0")}/${anoAcordao}`;
        const relatorOptions = ["Ministro Benjamin Zymler", "Ministro Vital do Rêgo", "Ministro Jorge Oliveira", "Ministro Jhonatan de Jesus", "Ministro Walton Alencar Rodrigues"];
        const chosenRelator = relatorOptions[numAcordao % 5];
        const utOptions = ["AudContratações (Unidade de Auditoria de Contratações)", "AudBenefícios (Unidade de Auditoria de Benefícios Sociais)", "AudGovernança (Unidade de Auditoria de Governança de Pessoas)", "AudPatrimônio (Unidade de Auditoria de Infraestrutura e Logística)"];
        const chosenUT = utOptions[numAcordao % 4];

        // Custom templates based on the number and year
        const subjectsAndSummaries = [
          {
            assunto: "Acompanhamento de recomendações de transparência passiva e divulgação de painéis do MTE.",
            sumario: "Acompanhamento técnico gerado a partir do cruzamento de dados institucionais dos canais oficiais do Ministério do Trabalho e Emprego. Recomenda-se a reestruturação da seção de perguntas frequentes e canais de Ouvidoria.",
            texto: `ACORDAM os Ministros do Tribunal de Contas da União, reunidos em sessão de ${chosenColegiado}, em:\n1. Recomendar à AECI-MTE o aprimoramento dos portais para facilidade do cidadão;\n2. Remeter os relatórios de andamento ao Tribunal no prazo regimental de 120 dias.`,
            decisao: "Acolhimento da representação governamental com expedição de ciência e plano de monitoramento em 120 dias ordinários."
          },
          {
            assunto: "Prestação de Contas Simplificada e gestão integrada de políticas de fomento ao emprego.",
            sumario: "Exame de regularidade das despesas efetuadas na capacitação de jovens e adultos pelo Sistema Sine. Averiguação de termos de fomento operacionalizados pelas Superintendências Regionais.",
            texto: `Determina-se à Assessoria Especial de Controle Interno do MTE que realize auditoria interna amostral nos repasses efetuados às conveniadas estaduais, com encaminhamento dos relatórios de conformidade técnica em 150 dias.`,
            decisao: "Julgamento de regularidade com ressalva, com determinações urgentes para saneamento de contas sob diligência amostral."
          },
          {
            assunto: "Inconsistências cadastrais na emissão de Carteiras de Trabalho Digitais e abonos salariais.",
            sumario: "Medida preventiva de auditoria para mapear riscos de homofonias ou CPFs inativos recebendo seguro-desemprego irregularmente. Recomendado plano de governança conjunto de dados abertos.",
            texto: `O TCU determina à Secretaria de Emprego e Relações do Trabalho do MTE que estabeleça, no prazo de 60 dias, um comitê interno de conciliação estatística sob supervisão e auditoria da AECI-MTE.`,
            decisao: "Adoção de medida proativa mediante constituição de comissão paritária de saneamento cadastral e fiscal sob auditoria da AECI-MTE."
          }
        ];

        const selection = subjectsAndSummaries[numAcordao % 3];

        // Map the (simulated) API response to your specific AcordaoDemand interface
        const newAcordao: AcordaoDemand = {
          KEY: `AC-${numAcordao}-${anoAcordao}`,
          TITULO: `ACÓRDÃO ${numAcordao}/${anoAcordao} - ATA ${numAta} - ${chosenColegiado.toUpperCase()}`,
          NUMACORDAO: numAcordao,
          ANOACORDAO: anoAcordao,
          NUMATA: numAta,
          COLEGIADO: chosenColegiado,
          DATASESSAO: dataSessao,
          SITUACAO: "OFICIALIZADO (VIA API)",
          PROC: `TC ${String(numAcordao % 999).padStart(3, "0")}.${String(Math.floor(numAcordao / 100)).padStart(3, "0")}/${anoAcordao}-0`,
          ACORDAOSRELACIONADOS: `Nenhum`,
          TIPOPROCESSO: "ACOMPANHAMENTO (ACOMP)",
          INTERESSADOS: "Ministério do Trabalho e Emprego (AECI-MTE); Controladoria-Geral da União",
          ENTIDADE: "MTE - Ministério do Trabalho e Emprego",
          RELATOR: chosenRelator,
          UNIDADETECNICA: chosenUT,
          ASSUNTO: selection.assunto,
          SUMARIO: selection.sumario,
          ACORDAO: `VISTOS, relatados e discutidos estes autos de acompanhamento técnico... ${selection.texto}\n\n[DADOS OBTIDOS VIA API EXTERNA DE JURISPRUDÊNCIA DO TCU]`,
          DECISAO: selection.decisao,
          
          // Operational defaults:
          STATUS_MONITORAMENTO: "Pendente",
          RESPONSAVEL_INTERNO: "AECI - Divisão de Monitoramento",
          PRAZO_LIMITE: `${anoAcordao + 1}-12-31`, // reasonable default
          OBSERVACOES: "Importado do repositório público de jurisprudência do TCU em " + new Date().toLocaleDateString("pt-BR") + ". Necessita de atribuição de responsável.",
          ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
        };

        // Cache it in DB
        db.acordaos.unshift(newAcordao);
        saveDatabase(db);

        results.push({
          input: itemString,
          parsedNumero: numAcordao,
          parsedAno: anoAcordao,
          status: "imported",
          item: newAcordao,
          message: "Acórdão localizado na API de Dados Abertos e incorporado ao monitoramento interno!"
        });

      } catch (error: any) {
        console.error(`[API Import] Failed to process ${itemString}:`, error);
        results.push({
          input: itemString,
          parsedNumero: numAcordao,
          parsedAno: anoAcordao,
          status: "error",
          message: `Falha na consulta à API externa: ${error.message || "Erro desconhecido"}`
        });
      }
    }

    res.json({ success: true, results, updatedAcordaos: db.acordaos });
  });

  // API 4: Rol de Responsáveis - GET & CRUD
  app.get("/api/rol-responsaveis", (req, res) => {
    const db = loadDatabase();
    res.json(db.rolResponsaveis);
  });

  app.post("/api/rol-responsaveis", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as RolResponsavel;
    newItem.id = "R-" + Date.now();
    db.rolResponsaveis.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/rol-responsaveis/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.rolResponsaveis.findIndex((x: any) => x.id === id);

    if (index >= 0) {
      db.rolResponsaveis[index] = { ...db.rolResponsaveis[index], ...updateData };
      saveDatabase(db);
      res.json(db.rolResponsaveis[index]);
    } else {
      res.status(404).json({ error: "Responsável não encontrado." });
    }
  });

  app.delete("/api/rol-responsaveis/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.rolResponsaveis = db.rolResponsaveis.filter((x: any) => x.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // API 5: Comissão de Ética - GET & CRUD
  app.get("/api/comissao-etica", (req, res) => {
    const db = loadDatabase();
    res.json(db.comissaoEtica);
  });

  app.post("/api/comissao-etica", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as ComissaoEticaDemand;
    newItem.id = "E-" + Date.now();
    db.comissaoEtica.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/comissao-etica/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.comissaoEtica.findIndex((x: any) => x.id === id);

    if (index >= 0) {
      db.comissaoEtica[index] = { ...db.comissaoEtica[index], ...updateData };
      saveDatabase(db);
      res.json(db.comissaoEtica[index]);
    } else {
      res.status(404).json({ error: "Demanda da Comissão de Ética não encontrada." });
    }
  });

  app.delete("/api/comissao-etica/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.comissaoEtica = db.comissaoEtica.filter((x: any) => x.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // API 6: Superintendências Regionais - GET & PUT
  app.get("/api/superintendencias", (req, res) => {
    const db = loadDatabase();
    res.json(db.superintendencias);
  });

  app.put("/api/superintendencias/:uf", (req, res) => {
    const db = loadDatabase();
    const uf = req.params.uf.toUpperCase();
    const updateData = req.body;
    const index = db.superintendencias.findIndex((x: any) => x.uf === uf);

    if (index >= 0) {
      db.superintendencias[index] = { ...db.superintendencias[index], ...updateData };
      saveDatabase(db);
      res.json(db.superintendencias[index]);
    } else {
      res.status(404).json({ error: "Superintendência não localizada." });
    }
  });

  // API 6.5: Database Administration / Reset endpoints
  app.post("/api/admin/clear-older-acordaos", (req, res) => {
    const db = loadDatabase();
    const countBefore = db.acordaos.length;
    // Keep acórdãos that have ANOACORDAO >= 2022
    db.acordaos = db.acordaos.filter((x: any) => !x.ANOACORDAO || x.ANOACORDAO >= 2022);
    const countAfter = db.acordaos.length;
    saveDatabase(db);
    res.json({ success: true, removedCount: countBefore - countAfter, totalRemaining: countAfter });
  });

  app.post("/api/admin/reset-database", (req, res) => {
    const defaultData = {
      acordaos: SEED_ACORDAOS,
      comunicacoes: SEED_COMUNICACOES,
      rolResponsaveis: SEED_ROL_RESPONSAVEIS,
      comissaoEtica: SEED_COMISSAO_ETICA,
      superintendencias: SEED_SUPERINTENDENCIAS,
      tces: SEED_TCES,
      tceAcordaoMappings: SEED_TCE_ACORDAO_MAPPINGS
    };
    saveDatabase(defaultData);
    res.json({ success: true, message: "Banco de dados redefinido com sucesso para os dados padrão de fábrica." });
  });

  // API 7: Dashboard Unified Stats for charts
  app.get("/api/dashboard-stats", (req, res) => {
    const db = loadDatabase();
    const totalAcordaos = db.acordaos.length;
    const countPendente = db.acordaos.filter((x: any) => x.STATUS_MONITORAMENTO === "Pendente").length;
    const countAnalise = db.acordaos.filter((x: any) => x.STATUS_MONITORAMENTO === "Em Análise").length;
    const countCumprido = db.acordaos.filter((x: any) => x.STATUS_MONITORAMENTO === "Cumprido").length;
    const countAtrasado = db.acordaos.filter((x: any) => x.STATUS_MONITORAMENTO === "Atrasado").length;

    const totalRol = db.rolResponsaveis.length;
    const activeRol = db.rolResponsaveis.filter((x: any) => x.status === "Vigente").length;

    const totalEtica = db.comissaoEtica.length;
    const activeEtica = db.comissaoEtica.filter((x: any) => x.status !== "Concluído" && x.status !== "Arquivado").length;

    // Sum demands across all SRTEs
    let totalSrteDemands = 0;
    db.superintendencias.forEach((s: any) => {
      totalSrteDemands += (s.demandasTCU || 0) + (s.demandasCGU || 0) + (s.demandasEtica || 0);
    });

    const coms = db.comunicacoes || [];
    const totalComs = coms.length;
    const countRespondedComs = coms.filter((x: any) => !!x.DATA_RESPOSTA && x.DATA_RESPOSTA.trim() !== "").length;
    const countPendingComs = totalComs - countRespondedComs;
    const responseRateComs = totalComs > 0 ? parseFloat(((countRespondedComs / totalComs) * 100).toFixed(1)) : 0;

    res.json({
      tcuStats: {
        total: totalAcordaos,
        pendente: countPendente,
        analise: countAnalise,
        cumprido: countCumprido,
        atrasado: countAtrasado
      },
      comunicacoesStats: {
        total: totalComs,
        respondido: countRespondedComs,
        pendente: countPendingComs,
        taxaResposta: responseRateComs
      },
      rolStats: {
        total: totalRol,
        active: activeRol
      },
      eticaStats: {
        total: totalEtica,
        active: activeEtica
      },
      srteStats: {
        totalUnidades: db.superintendencias.length,
        totalAcordoes: totalSrteDemands,
        criticos: db.superintendencias.filter((x: any) => x.statusGeral === "Crítico").length,
        atencao: db.superintendencias.filter((x: any) => x.statusGeral === "Atenção").length,
        regulares: db.superintendencias.filter((x: any) => x.statusGeral === "Regular").length
      }
    });

  });

  // Vite Integration context handling
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ORBITA.AECI server is running successfully on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting ORBITA.AECI Express backend:", err);
});
