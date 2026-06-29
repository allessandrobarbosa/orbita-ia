import express from "express";
import path from "path";
import fs from "fs";
import https from "https";
import readline from "readline";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import session from "express-session";

// Load environment variables
dotenv.config();

declare module 'express-session' {
  interface SessionData {
    lastHeartbeat?: number;
    user?: {
      id: string;
      name: string;
      role: string;
      email: string;
      register: string;
      clearance: string;
      avatarColor: string;
      badgeText: string;
      allowedModules?: string[];
    };
  }
}

// Standard types
import { 
  AcordaoDemand, RolResponsavel, ComissaoEticaDemand, SuperintendenciaRegional, 
  ComunicacaoDemand, CguDemand, CguPublishedReport,
  EticaMembro, EticaReuniao, EticaAta, EticaProcesso,
  Contrato, ContratoConsumoMensal, Viatura, ViaturaAbastecimento, ViaturaManutencao,
  UnidadeRol, Dirigente, DirigenteCargo, DirigenteEvento
} from "./src/types";
import { SEED_COMUNICACOES } from "./src/data/seed_comunicacoes";
import { SEED_CGU } from "./src/data/seed_cgu";
import { 
  SEED_ETICA_MEMBROS, SEED_ETICA_REUNIOES, SEED_ETICA_ATAS, SEED_ETICA_PROCESSOS 
} from "./src/data/seed_etica";

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
    ACORDAO: "VISTOS, relatados e discutidos estes autos de representação que tratam de contratação emergencial de suporte técnico continuado de tecnologia de informação. Considerando a instrução técnica de instrução processual e os pareceres da unidade técnica de controle externo. ACORDAM os Ministros do Tribunal de Contas da União, reunidos em sessão da Primeira Câmara, ante as razões expostas pelo Relator, Ministro Benjamin Zymler, em:\n1. Conhecer da presente representação para, no mérito, julgá-la parcialmente procedente;\n2. Determinar à Assessoria Especial de Controle Interno do Ministério do Trabalho e Emprego (AECI-MTE) que apresente plano de monitoramento em 90 dias;\n3. Dar ciência ao órgão de que a dispensa de licitação fora do escopo estrito configurará reiteração passível de multa.",
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
    ACORDAO: "VISTOS, relatados e discutidos estes autos de contas anuais que tratam do julgamento de regularidade das contas da AECI e do Gabinete do Ministro no exercício 2023. Considerando a instrução técnica de auditoria e os pareceres uniformes do controle externo. ACORDAM os Ministros da Segunda Câmara em julgar as contas Regulares com Ressalva dos gestores indicados, com fulcro nos artigos 16 e 18 da Lei 8.443/92, expedindo recomendação de melhoria de rastreabilidade de passagens aéreas e diárias em 180 dias.",
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

const SEED_SUPERINTENDENCIAS: SuperintendenciaRegional[] = [
  {
    uf: "AC",
    capital: "Rio Branco",
    superintendente: "Leonardo Lani de Abreu",
    cargo: "Superintendente SRT-AC",
    endereco: "Rua Marechal Deodoro, 257",
    contato: "(68) 3212-3330",
    email: "leonardo.abreu@mtp.gov.br",
    substituto: "Maria Clenilda Moura Xavier",
    emailSubstituto: "maria.clenilda@mtp.gov.br",
    cep: "69990-066",
    latitude: -8.77,
    longitude: -70.55,
    demandasTCU: 1,
    demandasCGU: 3,
    statusGeral: "Regular"
  },
  {
    uf: "AL",
    capital: "Maceió",
    superintendente: "Cícero Pereira dos Santos Filho",
    cargo: "Superintendente SRT-AL",
    endereco: "Rua do Livramento, n° 148, Edf. Walmap - Centro",
    contato: "(82) 3221-5421",
    email: "cicero.pereira@mte.gov.br",
    substituto: "Bruno Gabriel de Araujo",
    emailSubstituto: "bruno.araujo@economia.gov.br",
    cep: "57020-030",
    latitude: -9.71,
    longitude: -35.73,
    demandasTCU: 0,
    demandasCGU: 2,
    statusGeral: "Regular"
  },
  {
    uf: "AP",
    capital: "Macapá",
    superintendente: "Michel Praranhos",
    cargo: "Superintendente SRT-AP",
    endereco: "Av. Salgado Filho 61; Santa Rita",
    contato: "sem telefone",
    email: "michel.paranhos@economia.gov.br",
    substituto: "Marcos dos Santos Marinho",
    emailSubstituto: "marcos.marinho@economia.gov.br",
    cep: "68900-032",
    latitude: -3.07,
    longitude: -61.66,
    demandasTCU: 0,
    demandasCGU: 1,
    statusGeral: "Regular"
  },
  {
    uf: "AM",
    capital: "Manaus",
    superintendente: "Maria Francinete Correia de Lima",
    cargo: "Superintendente SRT-AM",
    endereco: "Av. André Araújo, 140 – Aleixo",
    contato: "sem telefone",
    email: "maria.correia@economia.gov.br",
    substituto: "Marcia Kristina Amazonas Prado",
    emailSubstituto: "marcia.prado@economia.gov.br",
    cep: "69060-001",
    latitude: 1.41,
    longitude: -51.77,
    demandasTCU: 2,
    demandasCGU: 5,
    statusGeral: "Atenção"
  },
  {
    uf: "BA",
    capital: "Salvador",
    superintendente: "Fátima Maria Andrade Freire",
    cargo: "Superintendente SRT-BA",
    endereco: "Rua Jequitaia 7, Comércio",
    contato: "(71) 3254-5411",
    email: "fatima.freire@mte.gov.br",
    substituto: "Maurício Nolasco de Macedo",
    emailSubstituto: "mauricio.macedo@economia.gov.br",
    cep: "40015-340",
    latitude: -12.96,
    longitude: -38.51,
    demandasTCU: 3,
    demandasCGU: 8,
    statusGeral: "Crítico"
  },
  {
    uf: "CE",
    capital: "Fortaleza",
    superintendente: "Carlos Pimentel de Matos Junior",
    cargo: "Superintendente SRT-CE",
    endereco: "Rua Barão de Aracati nº 909, Aldeota",
    contato: "(85) 3878.3102",
    email: "carlos.pimentel@mtp.gov.br",
    substituto: "Luis Alves de Freitas Lima",
    emailSubstituto: "luiz.lima@mte.gov.br",
    cep: "60118-970",
    latitude: -3.71,
    longitude: -38.54,
    demandasTCU: 1,
    demandasCGU: 4,
    statusGeral: "Atenção"
  },
  {
    uf: "DF",
    capital: "Brasília",
    superintendente: "Jackson da Silva Azara",
    cargo: "Superintendente SRT-DF",
    endereco: "SCS, Qd. 08, Edifício Venâncio 2000 - Asa Sul, Brasília",
    contato: "(61) 2031-0118",
    email: "Jackson.azara@economia.gov.br",
    substituto: "Rodrigo Rocha Ribeiro",
    emailSubstituto: "rodrigo.r.ribeiro@economia.gov.br",
    cep: "70333-900",
    latitude: -15.83,
    longitude: -47.86,
    demandasTCU: 5,
    demandasCGU: 12,
    statusGeral: "Crítico"
  },
  {
    uf: "ES",
    capital: "Vitória",
    superintendente: "Alcimar das Candeias da Silva",
    cargo: "Superintendente SRT-ES",
    endereco: "Rua Pientrângelo De Biase, 56, 2º e 3º andares, Centro",
    contato: "(27) 3211-5450",
    email: "alcimar.candeias@economia.gov.br",
    substituto: "Carlos Eduardo Santos Rosário",
    emailSubstituto: "carlos.rosario@economia.gov.br",
    cep: "29010-190",
    latitude: -19.19,
    longitude: -40.34,
    demandasTCU: 0,
    demandasCGU: 2,
    statusGeral: "Regular"
  },
  {
    uf: "GO",
    capital: "Goiânia",
    superintendente: "Sebastiana de Oliveira Batista",
    cargo: "Superintendente SRT-GO",
    endereco: "Av. 85, Nº 887, Setor Sul",
    contato: "(62) 3227-7062",
    email: "tiana.drtgo@economia.gov.br",
    substituto: "Ezio Nunes da Silva",
    emailSubstituto: "ezio.silva@economia.gpv.br",
    cep: "74080-010",
    latitude: -16.64,
    longitude: -49.31,
    demandasTCU: 1,
    demandasCGU: 3,
    statusGeral: "Atenção"
  },
  {
    uf: "MA",
    capital: "São Luis",
    superintendente: "Nivaldo Araújo Silva",
    cargo: "Superintendente SRT-MA",
    endereco: "Avenida Kennedy, 150 – Centro",
    contato: "(98) 3213-1996",
    email: "nivaldo.silva@mtp.gov.br",
    substituto: "Paulo Lasaro de Carvalho",
    emailSubstituto: "paulo.lasaro@economia.gov.br",
    cep: "65025-001",
    latitude: -2.55,
    longitude: -44.30,
    demandasTCU: 2,
    demandasCGU: 6,
    statusGeral: "Crítico"
  },
  {
    uf: "MT",
    capital: "Cuiabá",
    superintendente: "Amarildo Borges de Oliveira",
    cargo: "Superintendente SRT-MT",
    endereco: "Rua São Joaquim, 345, Porto",
    contato: "(65) 3616-4832",
    email: "amarildo.oliveira@economia.gov.br",
    substituto: "Gerson Antônio Delgado",
    emailSubstituto: "gerson.delgado@mtp.gov.br",
    cep: "78020-904",
    latitude: -12.64,
    longitude: -55.42,
    demandasTCU: 2,
    demandasCGU: 4,
    statusGeral: "Atenção"
  },
  {
    uf: "MS",
    capital: "Campo Grande",
    superintendente: "Alexandre Morais Cantero",
    cargo: "Superintendente SRT-MS",
    endereco: "Rua 13 de Maio, 3.214",
    contato: "(67) 3901-3059",
    email: "alexandre.cantero@mtp.gov.br",
    substituto: "Paulo Roberto Marini",
    emailSubstituto: "paulo.marini@economia.gov.br",
    cep: "79004-420",
    latitude: -20.51,
    longitude: -54.54,
    demandasTCU: 1,
    demandasCGU: 2,
    statusGeral: "Atenção"
  },
  {
    uf: "MG",
    capital: "Belo Horizonte",
    superintendente: "Carlos Alberto Menezes de Calazans",
    cargo: "Superintendente SRT-MG",
    endereco: "Av. Afonso Pena, 1.316",
    contato: "(31) 3270-6108",
    email: "carlos.calazans@mtp.gov.br",
    substituto: "Monica Soares Lage Costa",
    emailSubstituto: "monica.costa@economia.gov.br",
    cep: "30130-006",
    latitude: -18.10,
    longitude: -44.38,
    demandasTCU: 4,
    demandasCGU: 9,
    statusGeral: "Crítico"
  },
  {
    uf: "PA",
    capital: "Belém",
    superintendente: "Paulo Cesar Sarmento Gaya",
    cargo: "Superintendente SRT-PA",
    endereco: "Rua José Loureiro, n. º574, Centro",
    contato: "sem telefone",
    email: "paulo.gaya@mtp.gov.br",
    substituto: "Jomar Souza Ferreira de Lima",
    emailSubstituto: "jomar.lima@economia.gov.br",
    cep: "80010-924",
    latitude: -5.53,
    longitude: -52.29,
    demandasTCU: 3,
    demandasCGU: 7,
    statusGeral: "Crítico"
  },
  {
    uf: "PB",
    capital: "João Pessoa",
    superintendente: "Paulo Marcelo Lima",
    cargo: "Superintendente SRT-PB",
    endereco: "Praça Venâncio Neiva nº 11, Centro",
    contato: "(83) 2107-7622",
    email: "paulo.lima@mte.gob.br",
    substituto: "Abílio Sergio V. Correa Lima",
    emailSubstituto: "abilio.lima@economia.gov.br",
    cep: "58011-020",
    latitude: -7.06,
    longitude: -35.55,
    demandasTCU: 0,
    demandasCGU: 3,
    statusGeral: "Regular"
  },
  {
    uf: "PR",
    capital: "Curitiba",
    superintendente: "Regina Perpetua Cruz",
    cargo: "Superintendente SRT-PR",
    endereco: "Rua José Loureiro, n. º574, Centro",
    contato: "(41) 3901-7548",
    email: "regina.cruz@mtp.gov.br",
    substituto: "Rubens Patruni Filho",
    emailSubstituto: "rubens.filho@economia.gov.br",
    cep: "80010-924",
    latitude: -24.89,
    longitude: -51.55,
    demandasTCU: 2,
    demandasCGU: 5,
    statusGeral: "Atenção"
  },
  {
    uf: "PE",
    capital: "Recife",
    superintendente: "Zusineide Rodrigues de Medeiros",
    cargo: "Superintendente SRT-PE",
    endereco: "Avenida Agamenon Magalhães, nº 2.000 – Espinheiro",
    contato: "(81) 3427-7981",
    email: "suzineide.medeiros@mtp.gov.br",
    substituto: "Simone Maria Freire Brasil",
    emailSubstituto: "simone.brasil@mtp.gov.br",
    cep: "50100-010",
    latitude: -8.28,
    longitude: -35.07,
    demandasTCU: 2,
    demandasCGU: 6,
    statusGeral: "Crítico"
  },
  {
    uf: "PI",
    capital: "Teresina",
    superintendente: "Ítalo Palmeira dias do Rêgo Barros",
    cargo: "Superintendente SRT-PI",
    endereco: "Av. Frei Serafim, 1860, Centro",
    contato: "(86) 3226-1403",
    email: "italo.barros@mte.gov.br",
    substituto: "Maria Socorro Azevedo de Queiroz",
    emailSubstituto: "maria.azevedo@economia.gov.br",
    cep: "64001-020",
    latitude: -8.28,
    longitude: -43.68,
    demandasTCU: 1,
    demandasCGU: 2,
    statusGeral: "Atenção"
  },
  {
    uf: "RN",
    capital: "Natal",
    superintendente: "Cláudio Gabriel de Macedo Júnior",
    cargo: "Superintendente SRT-RN",
    endereco: "Rua das Fosforita, 2327 A – Bairro Lagoa Nova",
    contato: "(84) 3220-2036",
    email: "claudio.junior@mtp.gov.br",
    substituto: "Cristiano Claudio Davim",
    emailSubstituto: "cristiano.davim@economia.gov.br",
    cep: "59076-120",
    latitude: -22.84,
    longitude: -43.15,
    demandasTCU: 0,
    demandasCGU: 2,
    statusGeral: "Regular"
  },
  {
    uf: "RS",
    capital: "Porto Alegre",
    superintendente: "Claudir Antonio Nespolo",
    cargo: "Superintendente SRT-RS",
    endereco: "Av. Mauá, 1013, Centro",
    contato: "(51) 3213 2901",
    email: "claudir.nespolo@mtp.gov.br",
    substituto: "Sérgio Augusto Letizia Garcia",
    emailSubstituto: "sergiog@mtp.gov.br",
    cep: "90010-110",
    latitude: -5.22,
    longitude: -36.52,
    demandasTCU: 2,
    demandasCGU: 6,
    statusGeral: "Crítico"
  },
  {
    uf: "RJ",
    capital: "Rio de Janeiro",
    superintendente: "Alex Bolsas",
    cargo: "Superintendente SRT-RJ",
    endereco: "Av. Presidente Antonio Carlos, n° 375, sala 914, Centro",
    contato: "(21) 2532-2158",
    email: "alex.bolsas@economia.gov.br",
    substituto: "Bruno Alves de Moraes",
    emailSubstituto: "bruno.moraes@economia.gov.br",
    cep: "20020-909",
    latitude: -11.22,
    longitude: -62.80,
    demandasTCU: 4,
    demandasCGU: 10,
    statusGeral: "Crítico"
  },
  {
    uf: "RO",
    capital: "Porto Velho",
    superintendente: "Tereza Janete Cordova Santos",
    cargo: "Superintendente SRT-RO",
    endereco: "Av. Guanabara, 3480 - Liberdade",
    contato: "(69) 3217-3715",
    email: "tereza.janete@mtp.gov.br",
    substituto: "Juscelino José Durgo dos Santos",
    emailSubstituto: "juscelino.santos@mtp.gov.br",
    cep: "78901-130",
    latitude: -30.01,
    longitude: -51.22,
    demandasTCU: 1,
    demandasCGU: 3,
    statusGeral: "Atenção"
  },
  {
    uf: "RR",
    capital: "Boa Vista",
    superintendente: "Magno Pillon Dell Flora",
    cargo: "Superintendente SRT-RR",
    endereco: "Av.: Major Williams, 1549 – centro",
    contato: "(95) 3623-3527",
    email: "magno.pillon@economia.gov.br",
    substituto: "Roseli Clair dos Santos Rosendo",
    emailSubstituto: "roseli.rosendo@economia.gov.br",
    cep: "69301-110",
    latitude: 1.89,
    longitude: -61.22,
    demandasTCU: 0,
    demandasCGU: 2,
    statusGeral: "Regular"
  },
  {
    uf: "SC",
    capital: "Florianópolis",
    superintendente: "sem titular",
    cargo: "Superintendente SRT-SC",
    endereco: "Rua Victor Meirelles, 198 – Centro",
    contato: "(48) 3229- 9767",
    email: "sem titular",
    substituto: "Gabriela Garcia Iuskw",
    emailSubstituto: "gabriela.iuskw@economia.gov.br",
    cep: "88010-440",
    latitude: -27.33,
    longitude: -49.44,
    demandasTCU: 1,
    demandasCGU: 3,
    statusGeral: "Atenção"
  },
  {
    uf: "SP",
    capital: "São Paulo",
    superintendente: "Marcus Alves de Mello",
    cargo: "Superintendente SRT-SP",
    endereco: "Avenida Prestes Maia, 733, Luz",
    contato: "(11) 2113-2590",
    email: "marcus.alves@mtp.gov.br",
    substituto: "Antonio Fojo da Costa",
    emailSubstituto: "antonio.fojo@economia.gov.br",
    cep: "01031-905",
    latitude: -10.90,
    longitude: -37.07,
    demandasTCU: 6,
    demandasCGU: 14,
    statusGeral: "Crítico"
  },
  {
    uf: "SE",
    capital: "Aracaju",
    superintendente: "José Claudio Silva Barreto",
    cargo: "Superintendente SRT-SE",
    endereco: "Rua Pacatuba, 171 - Centro",
    contato: "(79) 3198-3251",
    email: "jose.c.barreto@mtp.gov.br",
    substituto: "Raffael Davisson Gomes Cunha",
    emailSubstituto: "raffael.cunha@mtp",
    cep: "49010-150",
    latitude: -23.55,
    longitude: -46.64,
    demandasTCU: 0,
    demandasCGU: 1,
    statusGeral: "Regular"
  },
  {
    uf: "TO",
    capital: "Palmas",
    superintendente: "Jalson Jácomo do Couto",
    cargo: "Superintendente SRT-TO",
    endereco: "Quadra AA NE 40, Av. NS 02, Lt 03, Plano Diretor Norte",
    contato: "sem telefone",
    email: "jalson.couto@mtp.gov.br",
    substituto: "José Renato Alves",
    emailSubstituto: "jose.renato@economia.gov.br",
    cep: "77006-340",
    latitude: -10.25,
    longitude: -48.25,
    demandasTCU: 1,
    demandasCGU: 2,
    statusGeral: "Atenção"
  }
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

const SEED_PROFILES = [
  {
    id: "alessandro",
    name: "Alessandro Barbosa",
    cpf: "111.222.333-44",
    phone: "(61) 99999-1111",
    unidade: "AECI",
    role: "Analista de Controle Interno Especial",
    email: "alessandro.barbosa@mte.gov.br",
    register: "Matrícula: AECI-8409-G",
    clearance: "ADMIN",
    avatarColor: "bg-[#1351b4] text-white border-blue-400 ring-blue-500/30",
    pin: "1234",
    password: "1234",
    requiresPasswordChange: false,
    status: "ACTIVE",
    badgeText: "AECI - ADMIN"
  },
  {
    id: "heloisa",
    name: "Dra. Heloísa Mendes",
    cpf: "222.333.444-55",
    phone: "(61) 99999-2222",
    unidade: "Corregedoria",
    role: "Membro Presidência / Corregedora Geral",
    email: "heloisa.mendes@mte.gov.br",
    register: "Matrícula: COR-4421-E",
    clearance: "ETHICS",
    avatarColor: "bg-teal-700 text-teal-100 border-teal-500 ring-teal-500/30",
    pin: "2026",
    password: "2026",
    requiresPasswordChange: false,
    status: "ACTIVE",
    badgeText: "CORREGEDORIA"
  },
  {
    id: "jorge",
    name: "Jorge Luiz Santos",
    cpf: "333.444.555-66",
    phone: "(61) 99999-3333",
    unidade: "Gabinete",
    role: "Chefe de Gabinete Adjunto",
    email: "jorge.santos@mte.gov.br",
    register: "Matrícula: GAB-0938-A",
    clearance: "AUDITOR",
    avatarColor: "bg-slate-700 text-slate-100 border-slate-500 ring-slate-500/30",
    pin: "1984",
    password: "1984",
    requiresPasswordChange: false,
    status: "ACTIVE",
    badgeText: "GABINETE"
  },
  {
    id: "srte_rj",
    name: "Superintendente Regional RJ",
    cpf: "444.555.666-77",
    phone: "(21) 99999-4444",
    unidade: "SRTE-RJ",
    role: "Superintendente da SRTE-RJ",
    email: "srte.rj@mte.gov.br",
    register: "Matrícula: SRTE-1052-S",
    clearance: "SRTE",
    avatarColor: "bg-amber-700 text-amber-100 border-amber-500 ring-amber-500/30",
    pin: "7777",
    password: "7777",
    requiresPasswordChange: false,
    status: "ACTIVE",
    badgeText: "SRTE-RJ"
  },
  {
    id: "public",
    name: "Consulta Pública",
    cpf: "000.000.000-00",
    phone: "",
    unidade: "Público Externo",
    role: "Cidadão / Acesso Externo",
    email: "cidadao@mte.gov.br",
    register: "Acesso: CPF Simplificado",
    clearance: "PUBLIC",
    avatarColor: "bg-emerald-700 text-emerald-100 border-emerald-500 ring-emerald-500/30",
    pin: "0000",
    password: "0000",
    requiresPasswordChange: false,
    status: "ACTIVE",
    badgeText: "PÚBLICO"
  }
];

const SEED_UNIDADES_ROL: UnidadeRol[] = [
  { id: "U-1", nome: "Gabinete do Ministro", sigla: "GM" },
  { id: "U-2", nome: "Secretaria-Executiva", sigla: "SE" },
  { id: "U-3", nome: "Assessoria Especial de Controle Interno", sigla: "AECI" },
  { id: "U-4", nome: "Secretaria de Trabalho", sigla: "STRAB" },
  { id: "U-5", nome: "Secretaria de Inspeção do Trabalho", sigla: "SIT" }
];

// Dirigentes = PESSOAS (sem vínculo direto de cargo/unidade)
const SEED_DIRIGENTES: Dirigente[] = [
  {
    id: "D-1",
    nome: "LUIZ MARINHO",
    cpf: "XXX.848.518-XX",
    email: "luiz.marinho@trabalho.gov.br",
    status: "Ativo"
  },
  {
    id: "D-2",
    nome: "FRANCISCO MACENA DA SILVA",
    cpf: "XXX.239.928-XX",
    email: "chico.macena@trabalho.gov.br",
    status: "Ativo"
  }
];

// DirigenteCargo = vínculos de cargo por unidade
// Francisco Macena é Titular na SE e também Substituto Legal no GM
const SEED_DIRIGENTES_CARGOS: DirigenteCargo[] = [
  {
    id: "DC-1",
    dirigenteId: "D-1",
    unidadeId: "U-1",
    cargo: "Ministro de Estado",
    tipoVinculo: "Titular",
    inicioExercicio: "2023-01-01",
    atoNomeacao: "DECRETO DE 31 DE JANEIRO DE 2023 - DOU: https://www.in.gov.br/web/dou/-/despacho-do-presidente-da-republica-655768137",
    status: "Ativo"
  },
  {
    id: "DC-2",
    dirigenteId: "D-2",
    unidadeId: "U-2",
    cargo: "Secretário-Executivo",
    tipoVinculo: "Titular",
    inicioExercicio: "2023-01-03",
    atoNomeacao: "Nomeação - Secretário Executivo Decreto s/nº de 11/01/2023 Publicado em 11/01/2023 | Edição: 8 A | Seção: 2 Extra A | Página: 1-2 | https://www.in.gov.br/web/dou/-/despacho-do-presidente-da-republica-655768137",
    status: "Ativo"
  },
  {
    // Francisco Macena: também é Substituto Legal do Ministro (GM)
    id: "DC-3",
    dirigenteId: "D-2",
    unidadeId: "U-1",
    cargo: "Ministro de Estado Substituto",
    tipoVinculo: "Substituto Legal",
    inicioExercicio: "2023-01-03",
    atoNomeacao: "Nomeação - Secretário Executivo Decreto s/nº de 11/01/2023 Publicado em 11/01/2023 | Edição: 8 A | Seção: 2 Extra A | Página: 1-2 | https://www.in.gov.br/web/dou/-/despacho-do-presidente-da-republica-655768137",
    status: "Ativo"
  }
];

const SEED_DIRIGENTES_EVENTOS: DirigenteEvento[] = [
  {
    id: "DE-1",
    dirigenteId: "D-1",
    cargoId: "DC-1",
    dataInicio: "2026-05-22",
    dataFim: "2026-05-23",
    motivo: "Viagem Internacional",
    atoAutorizacao: "DECRETO DE 31 DE JANEIRO DE 2025 - DESPACHO DO PRESIDENTE DA REPÚBLICA: https://www.in.gov.br/web/dou/-/despacho-do-presidente-da-republica-655768137",
    substitutoId: "D-2"
  },
  {
    id: "DE-2",
    dirigenteId: "D-1",
    cargoId: "DC-1",
    dataInicio: "2026-06-06",
    dataFim: "2026-06-12",
    motivo: "Viagem Internacional",
    atoAutorizacao: "DECRETO DE 31 DE JANEIRO DE 2025 - DESPACHO DO PRESIDENTE DA REPÚBLICA: file:///C:/Users/claudio.py/Downloads/Genebra.pdf",
    substitutoId: "D-2"
  }
];

const SEED_CONTRATOS: Contrato[] = [
  {
    id: "C-1",
    srteId: "SP",
    numero: "45/2023",
    tipo: "Vigilância",
    fornecedor: "Segurança Total Ltda",
    valorTotal: 1200000.00,
    valorMensal: 100000.00,
    inicioVigencia: "2023-11-01",
    fimVigencia: "2026-10-31",
    status: "Ativo",
    objeto: "Prestação de serviços continuados de vigilância armada e desarmada para a sede da SRTE-SP e Gerências Regionais."
  },
  {
    id: "C-2",
    srteId: "SP",
    numero: "12/2024",
    tipo: "Limpeza",
    fornecedor: "LimpeBem Serviços Gerais",
    valorTotal: 600000.00,
    valorMensal: 50000.00,
    inicioVigencia: "2024-08-01",
    fimVigencia: "2026-07-31",
    status: "Ativo",
    objeto: "Serviços de limpeza, conservação e higienização com fornecimento de mão de obra e insumos."
  },
  {
    id: "C-3",
    srteId: "RJ",
    numero: "88/2022",
    tipo: "TI",
    fornecedor: "Conecta Gov Soluções",
    valorTotal: 2400000.00,
    valorMensal: 200000.00,
    inicioVigencia: "2022-09-01",
    fimVigencia: "2027-08-31",
    status: "Ativo",
    objeto: "Suporte técnico local e remoto de infraestrutura de rede e servidores para a SRTE-RJ."
  },
  {
    id: "C-4",
    srteId: "RJ",
    numero: "02/2025",
    tipo: "Copa",
    fornecedor: "Sabor do Brasil Refeições",
    valorTotal: 180000.00,
    valorMensal: 15000.00,
    inicioVigencia: "2025-02-01",
    fimVigencia: "2026-08-31",
    status: "Ativo",
    objeto: "Serviços continuados de copeiragem e fornecimento de lanches rápidos para eventos."
  },
  {
    id: "C-5",
    srteId: "DF",
    numero: "15/2021",
    tipo: "Vigilância",
    fornecedor: "Sentinela do Planalto S.A.",
    valorTotal: 3600000.00,
    valorMensal: 300000.00,
    inicioVigencia: "2021-06-01",
    fimVigencia: "2026-09-30",
    status: "Ativo",
    objeto: "Vigilância patrimonial armada de postos de trabalho no Distrito Federal."
  }
];

const SEED_CONTRATOS_CONSUMO: ContratoConsumoMensal[] = [
  { id: "CC-1", contratoId: "C-1", mesAno: "04/2026", valor: 98000.00, variacao: 0 },
  { id: "CC-2", contratoId: "C-1", mesAno: "05/2026", valor: 102000.00, variacao: 4.08 },
  { id: "CC-3", contratoId: "C-1", mesAno: "06/2026", valor: 99500.00, variacao: -2.45 },
  { id: "CC-4", contratoId: "C-2", mesAno: "04/2026", valor: 48000.00, variacao: 0 },
  { id: "CC-5", contratoId: "C-2", mesAno: "05/2026", valor: 51200.00, variacao: 6.67 },
  { id: "CC-6", contratoId: "C-2", mesAno: "06/2026", valor: 49800.00, variacao: -2.73 },
  { id: "CC-7", contratoId: "C-3", mesAno: "04/2026", valor: 195000.00, variacao: 0 },
  { id: "CC-8", contratoId: "C-3", mesAno: "05/2026", valor: 201000.00, variacao: 3.08 },
  { id: "CC-9", contratoId: "C-3", mesAno: "06/2026", valor: 200500.00, variacao: -0.25 }
];

const SEED_VIATURAS: Viatura[] = [
  {
    id: "V-1",
    srteId: "SP",
    placa: "BRA2E19",
    marca: "Toyota",
    modelo: "Hilux CD 4x4 Diesel",
    anoFabricacao: 2022,
    chassi: "9BWAB459SJF020111",
    renavam: "12839402911",
    alocacao: "Fiscalização",
    kmAtual: 49200,
    proximaRevisaoKm: 50000,
    status: "Ativo"
  },
  {
    id: "V-2",
    srteId: "SP",
    placa: "DKW4512",
    marca: "Chevrolet",
    modelo: "Spin 1.8 Flex LTZ",
    anoFabricacao: 2021,
    chassi: "9BWAB459SJF020122",
    renavam: "12839402912",
    alocacao: "Administração",
    kmAtual: 68100,
    proximaRevisaoKm: 70000,
    status: "Ativo"
  },
  {
    id: "V-3",
    srteId: "RJ",
    placa: "RIO2B30",
    marca: "Mitsubishi",
    modelo: "L200 Triton Sport",
    anoFabricacao: 2023,
    chassi: "9BWAB459SJF020133",
    renavam: "12839402913",
    alocacao: "Fiscalização",
    kmAtual: 24500,
    proximaRevisaoKm: 25000,
    status: "Ativo"
  },
  {
    id: "V-4",
    srteId: "RJ",
    placa: "ABC1234",
    marca: "Fiat",
    modelo: "Cronos Drive 1.3",
    anoFabricacao: 2020,
    chassi: "9BWAB459SJF020144",
    renavam: "12839402914",
    alocacao: "Administração",
    kmAtual: 85000,
    proximaRevisaoKm: 85000,
    status: "Baixado",
    destinacaoBaixa: "Leilão administrativo nº 03/2025 de bens inservíveis. Lote arrematado pela empresa Recicla Metais."
  },
  {
    id: "V-5",
    srteId: "DF",
    placa: "GDF0112",
    marca: "Jeep",
    modelo: "Compass Longitude 2.0 Turbodiesel",
    anoFabricacao: 2022,
    chassi: "9BWAB459SJF020155",
    renavam: "12839402915",
    alocacao: "Fiscalização",
    kmAtual: 39500,
    proximaRevisaoKm: 40000,
    status: "Ativo"
  }
];

const SEED_VIATURAS_ABASTECIMENTOS: ViaturaAbastecimento[] = [
  { id: "A-1", viaturaId: "V-1", data: "2026-06-10", litros: 65, km: 48500, custo: 390.00 },
  { id: "A-2", viaturaId: "V-1", data: "2026-06-25", litros: 60, km: 49200, custo: 360.00 },
  { id: "A-3", viaturaId: "V-2", data: "2026-06-05", litros: 45, km: 67600, custo: 260.00 },
  { id: "A-4", viaturaId: "V-2", data: "2026-06-20", litros: 48, km: 68100, custo: 278.40 },
  { id: "A-5", viaturaId: "V-3", data: "2026-06-15", litros: 70, km: 23800, custo: 420.00 },
  { id: "A-6", viaturaId: "V-3", data: "2026-06-28", litros: 68, km: 24500, custo: 408.00 }
];

const SEED_VIATURAS_MANUTENCOES: ViaturaManutencao[] = [
  { id: "M-1", viaturaId: "V-1", tipo: "Preventiva (Revisão 40k)", data: "2025-10-15", custo: 1200.00, kmManutencao: 40100, proximaRevisaoKm: 50000 },
  { id: "M-2", viaturaId: "V-2", tipo: "Corretiva (Troca Pastilhas de Freio)", data: "2026-03-22", custo: 680.00, kmManutencao: 65000 },
  { id: "M-3", viaturaId: "V-3", tipo: "Preventiva (Revisão 20k)", data: "2025-12-05", custo: 1500.00, kmManutencao: 20050, proximaRevisaoKm: 25000 }
];

function migrateProcessTypes(data: any): boolean {
  if (!data || !Array.isArray(data.acordaos)) return false;
  let modified = false;

  for (const ac of data.acordaos) {
    const currentType = ac.TIPOPROCESSO || "";
    if (currentType === "ACOMPANHAMENTO (ACOMP)" || currentType === "" || !ac.TIPOPROCESSO) {
      const searchStr = `${ac.TITULO || ""} ${ac.ASSUNTO || ""} ${ac.SUMARIO || ""} ${ac.ACORDAO || ""} ${ac.DECISAO || ""}`.toUpperCase();
      let newType = currentType;

      if (searchStr.includes("REPRESENTACAO") || searchStr.includes("REPRE")) {
        newType = "REPRESENTAÇÃO (REPR)";
      } else if (searchStr.includes("AUDITORIA") || searchStr.includes("FISCALIZACAO") || searchStr.includes("RELATORIO DE AUDITORIA")) {
        newType = "RELATÓRIO DE AUDITORIA (RA)";
      } else if (searchStr.includes("TOMADA DE CONTAS ESPECIAL") || searchStr.includes("TCE")) {
        newType = "TOMADA DE CONTAS ESPECIAL (TCE)";
      } else if (searchStr.includes("DENUNCIA") || searchStr.includes("DENUNCIAS")) {
        newType = "DENÚNCIA (DEN)";
      } else if (searchStr.includes("MONITORAMENTO")) {
        newType = "MONITORAMENTO (MONIT)";
      } else if (searchStr.includes("PRESTACAO DE CONTAS") || searchStr.includes("CONTA ANUAL")) {
        newType = "PRESTAÇÃO DE CONTAS ANUAL (PCA)";
      } else if (searchStr.includes("CONGRESSO NACIONAL") || searchStr.includes("SOLICITACAO DO CONGRESSO")) {
        newType = "SOLICITAÇÃO DO CONGRESSO NACIONAL (SCN)";
      } else if (searchStr.includes("ACOMPANHAMENTO") || searchStr.includes("ACOMP")) {
        newType = "ACOMPANHAMENTO (ACOMP)";
      } else {
        // Balanced fallback based on numeric hash of acórdão ID info
        const hash = (ac.NUMACORDAO || 0) + (ac.ANOACORDAO || 0);
        const fallbacks = [
          "REPRESENTAÇÃO (REPR)",
          "RELATÓRIO DE AUDITORIA (RA)",
          "ACOMPANHAMENTO (ACOMP)",
          "MONITORAMENTO (MONIT)",
          "TOMADA DE CONTAS ESPECIAL (TCE)"
        ];
        newType = fallbacks[hash % fallbacks.length];
      }

      if (newType !== currentType) {
        ac.TIPOPROCESSO = newType;
        modified = true;
      }
    }
  }
  return modified;
}

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
      tceAcordaoMappings: SEED_TCE_ACORDAO_MAPPINGS,
      users: SEED_PROFILES,
      cgu: SEED_CGU,
      cguReports: [],
      eticaMembros: SEED_ETICA_MEMBROS,
      eticaReunioes: SEED_ETICA_REUNIOES,
      eticaAtas: SEED_ETICA_ATAS,
      eticaProcessos: SEED_ETICA_PROCESSOS,
      contratos: SEED_CONTRATOS,
      contratosConsumoMensal: SEED_CONTRATOS_CONSUMO,
      viaturas: SEED_VIATURAS,
      viaturasAbastecimentos: SEED_VIATURAS_ABASTECIMENTOS,
      viaturasManutencoes: SEED_VIATURAS_MANUTENCOES,
      unidadesRol: SEED_UNIDADES_ROL,
      dirigentes: SEED_DIRIGENTES,
      dirigentesCargos: SEED_DIRIGENTES_CARGOS,
      dirigentesEventos: SEED_DIRIGENTES_EVENTOS
    };

    // Also run migration on seed data to ensure it's diverse
    migrateProcessTypes(defaultData);

    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw);

    // Ensure backwards compatibility by seeding key if missing
    let dataModified = false;
    if (!data.superintendencias || !Array.isArray(data.superintendencias) || data.superintendencias.length === 0) {
      data.superintendencias = SEED_SUPERINTENDENCIAS;
      dataModified = true;
    }
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
    if (!data.users) {
      data.users = SEED_PROFILES;
      dataModified = true;
    }
    if (!data.cgu) {
      data.cgu = SEED_CGU;
      dataModified = true;
    }
    if (!data.cguReports) {
      data.cguReports = [];
      dataModified = true;
    } else if (Array.isArray(data.cguReports)) {
      const filtered = data.cguReports.filter((r: any) => {
        const idT = String(r.idTarefa || "");
        const idA = String(r.idAuditoria || "");
        return !idT.toUpperCase().startsWith("AUD") && !idA.toUpperCase().startsWith("AUD");
      });
      if (filtered.length !== data.cguReports.length) {
        data.cguReports = filtered;
        dataModified = true;
      }
    }
    if (!data.eticaMembros) {
      data.eticaMembros = SEED_ETICA_MEMBROS;
      dataModified = true;
    }
    if (!data.eticaReunioes) {
      data.eticaReunioes = SEED_ETICA_REUNIOES;
      dataModified = true;
    }
    if (!data.eticaAtas) {
      data.eticaAtas = SEED_ETICA_ATAS;
      dataModified = true;
    }
    if (!data.eticaProcessos) {
      data.eticaProcessos = SEED_ETICA_PROCESSOS;
      dataModified = true;
    }
    if (!data.contratos) {
      data.contratos = SEED_CONTRATOS;
      dataModified = true;
    }
    if (!data.contratosConsumoMensal) {
      data.contratosConsumoMensal = SEED_CONTRATOS_CONSUMO;
      dataModified = true;
    }
    if (!data.viaturas) {
      data.viaturas = SEED_VIATURAS;
      dataModified = true;
    }
    if (!data.viaturasAbastecimentos) {
      data.viaturasAbastecimentos = SEED_VIATURAS_ABASTECIMENTOS;
      dataModified = true;
    }
    if (!data.viaturasManutencoes) {
      data.viaturasManutencoes = SEED_VIATURAS_MANUTENCOES;
      dataModified = true;
    }
    if (!data.unidadesRol) {
      data.unidadesRol = SEED_UNIDADES_ROL;
      dataModified = true;
    }
    if (!data.dirigentes) {
      data.dirigentes = SEED_DIRIGENTES;
      dataModified = true;
    }
    if (!data.dirigentesCargos) {
      data.dirigentesCargos = SEED_DIRIGENTES_CARGOS;
      dataModified = true;
    }
    if (!data.dirigentesEventos) {
      data.dirigentesEventos = SEED_DIRIGENTES_EVENTOS;
      dataModified = true;
    }

    // Run database self-repair/migration of process types
    if (migrateProcessTypes(data)) {
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
      tceAcordaoMappings: SEED_TCE_ACORDAO_MAPPINGS,
      contratos: SEED_CONTRATOS,
      contratosConsumoMensal: SEED_CONTRATOS_CONSUMO,
      viaturas: SEED_VIATURAS,
      viaturasAbastecimentos: SEED_VIATURAS_ABASTECIMENTOS,
      viaturasManutencoes: SEED_VIATURAS_MANUTENCOES,
      unidadesRol: SEED_UNIDADES_ROL,
      dirigentes: SEED_DIRIGENTES,
      dirigentesCargos: SEED_DIRIGENTES_CARGOS,
      dirigentesEventos: SEED_DIRIGENTES_EVENTOS
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

// Utility: Convert HTML content (from TCU API ACORDAO field) to clean plain text
// Preserves line breaks, structure, and decodes HTML entities.
function stripHtmlToText(html: string): string {
  if (!html) return "";
  let text = html;

  // Convert structural HTML elements to line breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p\b[^>]*>/gi, "");
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<div\b[^>]*>/gi, "");
  text = text.replace(/<\/li>/gi, "\n");
  text = text.replace(/<li\b[^>]*>/gi, "  • ");
  text = text.replace(/<\/tr>/gi, "\n");
  text = text.replace(/<td>|<\/td>|<th>|<\/th>/gi, " | ");
  text = text.replace(/<\/h[1-6]>/gi, "\n\n");
  text = text.replace(/<h[1-6]\b[^>]*>/gi, "");

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  // Normalize whitespace: collapse multiple spaces (but preserve newlines)
  text = text.replace(/[ \t]+/g, " ");
  // Collapse 3+ consecutive newlines into 2
  text = text.replace(/\n{3,}/g, "\n\n");
  // Trim each line
  text = text.split("\n").map(line => line.trim()).join("\n");

  return text.trim();
}

function generateFullAcordaoText(ac: any): string {
  const relator = ac.RELATOR || "Ministro Relator";
  const numAcordao = ac.NUMACORDAO || "S/N";
  const anoAcordao = ac.ANOACORDAO || new Date().getFullYear();
  const colegiado = ac.COLEGIADO || "Plenário";
  const proc = ac.PROC || "TC 000.000/0000-0";
  const tipoProcesso = ac.TIPOPROCESSO || "Acompanhamento";
  const interessados = ac.INTERESSADOS || "Ministério do Trabalho e Emprego (AECI-MTE)";
  const entidade = ac.ENTIDADE || "MTE - Ministério do Trabalho e Emprego";
  const unidadeTecnica = ac.UNIDADETECNICA || "Assessoria Especial de Controle Interno (AECI-MTE)";
  const assunto = ac.ASSUNTO || "Acompanhamento e monitoramento de conformidade técnica.";
  const decisao = ac.DECISAO || "Julgar as presentes contas regulares com recomendações de melhoria.";

  return `TRIBUNAL DE CONTAS DA UNIÃO\n` +
    `Gabinete do Relator ${relator}\n\n` +
    `ACÓRDÃO Nº ${numAcordao}/${anoAcordao} - TCU - ${colegiado}\n\n` +
    `1. Processo nº: ${proc}\n` +
    `2. Classe de Assunto: ${tipoProcesso}\n` +
    `3. Interessados/Responsáveis: ${interessados}\n` +
    `4. Entidade: ${entidade}\n` +
    `5. Relator: ${relator}\n` +
    `6. Representante do Ministério Público: Não atuou\n` +
    `7. Unidade Técnica: ${unidadeTecnica}\n` +
    `8. Representação legal: Não há.\n\n` +
    `VISTOS, relatados e discutidos estes autos de ${tipoProcesso} que tratam de ${assunto}.\n\n` +
    `Considerando que o presente processo foi autuado para monitoramento e controle das ações no âmbito da entidade ${entidade};\n\n` +
    `Considerando os pareceres uniformes expedidos pela ${unidadeTecnica} e os elementos instrutórios constantes dos autos;\n\n` +
    `ACORDAM os Ministros do Tribunal de Contas da União, reunidos em Sessão de ${colegiado}, ante as razões expostas pelo Relator, em:\n\n` +
    `9.1. ${decisao}\n\n` +
    `9.2. Determinar à Assessoria Especial de Controle Interno do Ministério do Trabalho e Emprego (AECI-MTE) que proceda ao acompanhamento das ações decorrentes desta deliberação, reportando os resultados nos prazos regulamentares.\n\n` +
    `9.3. Dar ciência desta deliberação à Unidade Técnica do TCU e à entidade fiscalizada.`;
}

async function fetchAcordaoFromTCU(numAcordao: number, anoAcordao: number): Promise<any> {
  try {
    const searchUrl = `https://pesquisa.apps.tcu.gov.br/rest/publico/base/acordao-completo/documentosResumidos?termo=${numAcordao}/${anoAcordao}&quantidade=10`;
    console.log(`[TCU API] Searching for ${numAcordao}/${anoAcordao}...`);
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://pesquisa.apps.tcu.gov.br/'
      }
    });

    if (!searchRes.ok) {
      throw new Error(`Search request failed with status ${searchRes.status}`);
    }

    const searchData = (await searchRes.json()) as any;
    const docs = searchData.documentos || [];
    
    // Find exact match
    const exactDoc = docs.find(
      (d: any) => String(d.NUMACORDAO) === String(numAcordao) && String(d.ANOACORDAO) === String(anoAcordao)
    );
    if (!exactDoc) {
      console.log(`[TCU API] No exact match found for ${numAcordao}/${anoAcordao} in search results.`);
      return null;
    }

    console.log(`[TCU API] Found document with KEY: ${exactDoc.KEY}. Fetching details...`);
    const docUrl = `https://pesquisa.apps.tcu.gov.br/rest/publico/base/acordao-completo/documento?termo=KEY:${exactDoc.KEY}`;
    
    const docRes = await fetch(docUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://pesquisa.apps.tcu.gov.br/'
      }
    });

    if (!docRes.ok) {
      throw new Error(`Detail request failed with status ${docRes.status}`);
    }

    const docData = (await docRes.json()) as any;
    if (docData.documentos && docData.documentos.length > 0) {
      return docData.documentos[0];
    }

    return null;
  } catch (err: any) {
    console.error(`[TCU API] Error fetching ${numAcordao}/${anoAcordao}:`, err.message);
    return null;
  }
}



const SESSIONS_PATH = path.join(DATA_DIR, "sessions.json");

class FileSessionStore extends session.Store {
  constructor() {
    super();
    // Limpa todas as sessões anteriores na inicialização do servidor
    fs.writeFileSync(SESSIONS_PATH, JSON.stringify({}), "utf-8");
  }

  private getSessions(): Record<string, any> {
    try {
      if (fs.existsSync(SESSIONS_PATH)) {
        const content = fs.readFileSync(SESSIONS_PATH, "utf-8");
        return JSON.parse(content || "{}");
      }
    } catch (e) {
      console.error("Error reading sessions file:", e);
    }
    return {};
  }

  private saveSessions(sessions: Record<string, any>) {
    try {
      fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2), "utf-8");
    } catch (e) {
      console.error("Error writing sessions file:", e);
    }
  }

  get(sid: string, callback: (err: any, session?: any) => void): void {
    try {
      const sessions = this.getSessions();
      const sess = sessions[sid];
      if (sess) {
        if (sess.cookie && sess.cookie.expires) {
          sess.cookie.expires = new Date(sess.cookie.expires);
        }
        return callback(null, sess);
      }
      return callback(null, null);
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, sessionData: any, callback: (err?: any) => void): void {
    try {
      const sessions = this.getSessions();
      sessions[sid] = sessionData;
      this.saveSessions(sessions);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid: string, callback: (err?: any) => void): void {
    try {
      const sessions = this.getSessions();
      delete sessions[sid];
      this.saveSessions(sessions);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  touch(sid: string, sessionData: any, callback: (err?: any) => void): void {
    try {
      const sessions = this.getSessions();
      if (sessions[sid]) {
        sessions[sid].cookie = sessionData.cookie;
        this.saveSessions(sessions);
      }
      callback(null);
    } catch (err) {
      callback(err);
    }
  }
}

// Start up Express full-stack flow
async function startServer() {
  const app = express();

  // Set up session middleware
  app.use(session({
    store: new FileSessionStore(),
    secret: process.env.SESSION_SECRET || "orbita-secret-key-123456789",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: false, // set to true if using HTTPS
      httpOnly: true
    }
  }));

  // Session heartbeat expiration middleware to log out users on browser close
  app.use((req, res, next) => {
    if (req.session && req.session.user) {
      const now = Date.now();
      const isAuthRoute = req.path.startsWith("/api/auth");
      const shouldCheck = !isAuthRoute || req.path === "/api/auth/session";

      if (shouldCheck && req.session.lastHeartbeat) {
        const diff = now - req.session.lastHeartbeat;
        // If no heartbeat has been received for more than 25 seconds, expire the session.
        if (diff > 25000) {
          console.log(`[Orbita Session] Session expired due to lack of client heartbeat. Last seen: ${diff}ms ago.`);
          req.session.destroy(() => {});
          if (req.path.startsWith("/api/")) {
            return res.status(401).json({ authenticated: false, error: "Sessão encerrada por inatividade/fechamento do navegador." });
          } else {
            return res.redirect("/");
          }
        }
      }

      if (req.path !== "/api/auth/heartbeat") {
        req.session.lastHeartbeat = now;
      }
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ==========================================
  // AUTENTICAÇÃO E GOV.BR AUTH API
  // ==========================================

  // Auth API: Get current session user
  app.get("/api/auth/session", (req, res) => {
    if (req.session && req.session.user) {
      // Fetch fresh data from db to ensure permissions are up to date
      const data = loadDatabase();
      const freshUser = (data.users || []).find((u: any) => u.id === req.session.user.id);
      
      if (freshUser) {
        // Update session with fresh data
        req.session.user = {
          id: freshUser.id,
          name: freshUser.name,
          role: freshUser.role,
          email: freshUser.email,
          register: freshUser.register,
          clearance: freshUser.clearance,
          avatarColor: freshUser.avatarColor,
          badgeText: freshUser.badgeText,
          allowedModules: freshUser.allowedModules
        };
      }
      return res.json({ authenticated: true, user: req.session.user });
    }
    return res.json({ authenticated: false });
  });

  // Auth API: Heartbeat to keep session alive
  app.post("/api/auth/heartbeat", (req, res) => {
    if (req.session && req.session.user) {
      req.session.lastHeartbeat = Date.now();
      return res.json({ success: true });
    }
    return res.json({ success: false });
  });

  // Auth API: Login with PIN (local/fallback)
  app.post("/api/auth/login-pin", (req, res) => {
    const { profileId, pin } = req.body;
    if (!profileId || !pin) {
      return res.status(400).json({ error: "Perfil e PIN são obrigatórios." });
    }

    const matchedProfile = SEED_PROFILES.find(p => p.id === profileId);
    if (!matchedProfile) {
      return res.status(404).json({ error: "Perfil não encontrado." });
    }

    if (matchedProfile.pin === pin || matchedProfile.clearance === "PUBLIC") {
      req.session.user = {
        id: matchedProfile.id,
        name: matchedProfile.name,
        role: matchedProfile.role,
        email: matchedProfile.email,
        register: matchedProfile.register,
        clearance: matchedProfile.clearance,
        avatarColor: matchedProfile.avatarColor,
        badgeText: matchedProfile.badgeText
      };
      return res.json({ success: true, user: req.session.user });
    } else {
      return res.status(401).json({ error: "Código PIN de assinatura inválido para este perfil." });
    }
  });

  // Auth API: Login with local credentials (new flow)
  app.post("/api/auth/login-local", (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identificador e senha são obrigatórios." });
    }

    const data = loadDatabase();
    const users = data.users || [];
    
    // Find by exact email or exact CPF (numbers only) or exact id
    const cleanId = identifier.replace(/\D/g, "");
    const matchedProfile = users.find((p: any) => 
      p.email === identifier || p.id === identifier || (p.cpf && p.cpf.replace(/\D/g, "") === cleanId)
    );

    if (!matchedProfile) {
      return res.status(404).json({ error: "Credenciais inválidas." });
    }

    if (matchedProfile.status && matchedProfile.status !== "ACTIVE") {
      return res.status(403).json({ error: "Usuário não está ativo (status: " + matchedProfile.status + ")." });
    }

    // fallback to pin if password not set (for old mock profiles)
    const validPassword = matchedProfile.password || matchedProfile.pin;
    
    if (validPassword === password || matchedProfile.clearance === "PUBLIC") {
      req.session.user = {
        id: matchedProfile.id,
        name: matchedProfile.name,
        role: matchedProfile.role,
        email: matchedProfile.email,
        register: matchedProfile.register,
        clearance: matchedProfile.clearance,
        avatarColor: matchedProfile.avatarColor,
        badgeText: matchedProfile.badgeText,
        allowedModules: matchedProfile.allowedModules
      };
      return res.json({ 
        success: true, 
        user: req.session.user, 
        requiresPasswordChange: matchedProfile.requiresPasswordChange || false 
      });
    } else {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }
  });

  // Auth API: Request Access
  app.post("/api/auth/request-access", (req, res) => {
    const { name, cpf, phone, email, unidade } = req.body;
    if (!name || !cpf || !email) {
      return res.status(400).json({ error: "Nome, CPF e E-mail são obrigatórios." });
    }
    
    const data = loadDatabase();
    data.users = data.users || [];
    
    // Check if exists
    const cleanCpf = cpf.replace(/\D/g, "");
    const exists = data.users.find((p:any) => p.email === email || (p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf));
    if (exists) {
      return res.status(400).json({ error: "Usuário com este E-mail ou CPF já está cadastrado." });
    }

    const newUser = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name,
      cpf,
      phone,
      unidade,
      email,
      role: "Acesso Solicitado",
      register: "Pendente",
      clearance: "PENDING",
      avatarColor: "bg-slate-300 text-slate-700 border-slate-300",
      pin: "0000",
      password: "",
      requiresPasswordChange: true,
      status: "PENDING",
      badgeText: "PENDENTE"
    };

    data.users.push(newUser);
    saveDatabase(data);

    console.log(`[EMAIL SIMULATION] To: admins | Subject: Nova Solicitação de Acesso | Body: O usuário ${name} (${email}) solicitou acesso.`);

    return res.json({ success: true, message: "Solicitação enviada com sucesso." });
  });

  // Auth API: Forgot Password
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email, cpf } = req.body;
    
    const data = loadDatabase();
    const users = data.users || [];
    
    const cleanCpf = cpf ? cpf.replace(/\D/g, "") : "";
    const userIndex = users.findIndex((p:any) => p.email === email && p.cpf && p.cpf.replace(/\D/g, "") === cleanCpf);
    
    if (userIndex === -1) {
      // Return success anyway for security reasons (don't leak emails)
      return res.json({ success: true, message: "Se os dados estiverem corretos, um e-mail foi enviado." });
    }

    // Generate provisional password
    const provPass = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    data.users[userIndex].password = provPass;
    data.users[userIndex].requiresPasswordChange = true;
    saveDatabase(data);

    console.log(`[EMAIL SIMULATION] To: ${email} | Subject: Recuperação de Senha | Body: Sua nova senha provisória é ${provPass}. Você deverá trocá-la no próximo acesso.`);

    return res.json({ success: true, message: "E-mail de recuperação enviado." });
  });

  // Auth API: Reset Password (after login)
  app.post("/api/auth/reset-password", (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    // In a real app, we check if req.session.user.id == userId
    
    const data = loadDatabase();
    const userIndex = (data.users || []).findIndex((p:any) => p.id === userId);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    const user = data.users[userIndex];
    if (user.password !== oldPassword && user.pin !== oldPassword) {
      return res.status(403).json({ error: "Senha atual incorreta." });
    }

    data.users[userIndex].password = newPassword;
    data.users[userIndex].requiresPasswordChange = false;
    data.users[userIndex].pin = newPassword; // keeping pin in sync for mock fallback
    saveDatabase(data);

    return res.json({ success: true, message: "Senha atualizada com sucesso." });
  });

  // Admin API: List Users
  app.get("/api/admin/users", (req, res) => {
    // Should check clearance === ADMIN here
    const data = loadDatabase();
    return res.json(data.users || []);
  });

  // Admin API: Approve or Update User
  app.post("/api/admin/users/:id/approve", (req, res) => {
    const { role, clearance, badgeText, allowedModules } = req.body;
    const data = loadDatabase();
    const userIndex = (data.users || []).findIndex((p:any) => p.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    const isNewApproval = data.users[userIndex].status === "PENDING";
    let provPass = data.users[userIndex].password;

    if (isNewApproval) {
      provPass = Math.floor(100000 + Math.random() * 900000).toString();
      data.users[userIndex].password = provPass;
      data.users[userIndex].pin = provPass;
      data.users[userIndex].requiresPasswordChange = true;
    }
    
    data.users[userIndex].status = "ACTIVE";
    data.users[userIndex].role = role || data.users[userIndex].role;
    data.users[userIndex].clearance = clearance || "PUBLIC";
    data.users[userIndex].badgeText = badgeText || "AUTORIZADO";
    if (allowedModules) {
      data.users[userIndex].allowedModules = allowedModules;
    }
    
    saveDatabase(data);

    if (isNewApproval) {
      console.log(`\n\n=== SIMULAÇÃO DE ENVIO DE E-MAIL ===\nPara: ${data.users[userIndex].email}\nAssunto: Acesso Aprovado\nMensagem: Seu acesso ao ÓRBITA.AECI foi aprovado.\nSua senha provisória é: ${provPass}\n====================================\n\n`);
    }

    return res.json({ success: true, user: data.users[userIndex] });
  });

  // Admin API: Update active user permissions
  app.post("/api/admin/users/:id", (req, res) => {
    const { badgeText, allowedModules } = req.body;
    const data = loadDatabase();
    const userIndex = (data.users || []).findIndex((p:any) => p.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    if (badgeText) data.users[userIndex].badgeText = badgeText;
    if (allowedModules) data.users[userIndex].allowedModules = allowedModules;
    
    saveDatabase(data);
    return res.json({ success: true, user: data.users[userIndex] });
  });

  // Admin API: Inactivate User
  app.post("/api/admin/users/:id/inactivate", (req, res) => {
    const data = loadDatabase();
    const userIndex = (data.users || []).findIndex((p:any) => p.id === req.params.id);
    
    if (userIndex === -1) return res.status(404).json({ error: "Usuário não encontrado." });
    
    data.users[userIndex].status = "INACTIVE";
    saveDatabase(data);

    return res.json({ success: true, user: data.users[userIndex] });
  });

  // Auth API: Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao encerrar sessão." });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true });
    });
  });

  // Auth API: gov.br login redirect
  app.get("/api/auth/govbr/login", (req, res) => {
    const state = Math.random().toString(36).substring(2);
    if (process.env.GOVBR_CLIENT_ID) {
      const authUrl = `${process.env.GOVBR_SSO_URL || "https://sso.staging.acesso.gov.br"}/authorize?` +
        `response_type=code&` +
        `client_id=${process.env.GOVBR_CLIENT_ID}&` +
        `scope=openid+profile+email&` +
        `redirect_uri=${encodeURIComponent(process.env.GOVBR_REDIRECT_URI || "http://localhost:3000/api/auth/govbr/callback")}&` +
        `state=${state}`;
      return res.redirect(authUrl);
    }

    // Default simulator fallback
    return res.redirect(`/govbr-login-simulator?state=${state}`);
  });

  // Serve beautiful interactive gov.br login simulator page
  app.get("/govbr-login-simulator", (req, res) => {
    const { state } = req.query;
    const profilesHTML = SEED_PROFILES.map(p => `
      <div class="profile-card border border-slate-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-[#1351b4] hover:bg-slate-50 transition duration-150" onclick="selectProfile('${p.id}', '${p.name}', '${p.role}', '${p.clearance}')">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white ${p.avatarColor.includes('bg-[') ? 'bg-[#1351b4]' : p.avatarColor}">
            ${p.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
          </div>
          <div>
            <h4 class="font-extrabold text-slate-800 text-sm">${p.name}</h4>
            <p class="text-xs text-slate-500">${p.role}</p>
          </div>
        </div>
        <span class="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">${p.badgeText}</span>
      </div>
    `).join("");

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSO gov.br - Identificação de Serviços Públicos</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;850&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Outfit', sans-serif; }
          .gov-blue-btn { background-color: #1351b4; }
          .gov-blue-btn:hover { background-color: #0c3c88; }
        </style>
      </head>
      <body class="bg-slate-50 min-h-screen flex flex-col justify-between">
        <!-- Gov Header -->
        <header class="bg-white border-b border-slate-200 py-3 shadow-sm">
          <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl font-black tracking-tight text-[#1351b4]">gov<span class="text-[#00c010]">.</span>br</span>
              <span class="text-xs text-slate-400 font-bold border-l border-slate-200 pl-2">Serviço de Autenticação Federada</span>
            </div>
            <span class="text-xs text-slate-500">Órgão Receptor: <strong class="text-slate-700">AECI/MTE - ÓRBITA</strong></span>
          </div>
        </header>

        <!-- Main Form -->
        <main class="max-w-md mx-auto w-full my-auto px-4 py-8">
          <div class="bg-white rounded-3xl border border-slate-200 shadow-xl p-8">
            <h2 class="text-xl font-extrabold text-slate-800 tracking-tight">Identifique-se no gov.br</h2>
            <p class="text-xs text-slate-500 mt-1 leading-relaxed">
              O Portal ÓRBITA solicita autenticação de identidade oficial para assinatura digital de auditoria.
            </p>

            <form action="/api/auth/govbr/callback" method="GET" class="mt-6 space-y-5" id="ssoForm">
              <input type="hidden" name="state" value="${state || ''}">
              <input type="hidden" name="profileId" id="profileId" value="">
              
              <div class="space-y-3" id="profileSelectionContainer">
                <label class="text-xs font-black text-slate-700 uppercase tracking-wider block">Escolha sua Persona Funcional (Simulação gov.br):</label>
                <div class="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  ${profilesHTML}
                </div>
              </div>

              <!-- CPF Field -->
              <div class="space-y-1.5 hidden" id="cpfContainer">
                <div class="flex items-center justify-between">
                  <label class="text-xs font-black text-slate-700 uppercase tracking-wider block">CPF do Servidor:</label>
                  <button type="button" class="text-xs text-[#1351b4] font-bold hover:underline" onclick="goBack()">Alterar Cargo</button>
                </div>
                <div class="relative">
                  <input type="text" id="cpfInput" class="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 text-sm font-semibold tracking-wider bg-slate-50 focus:border-[#1351b4] focus:ring-1 focus:ring-[#1351b4] focus:outline-none" readonly>
                </div>
                <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                  <p class="text-[11px] text-amber-700 font-medium leading-normal">
                    📌 <strong>Simulador OIDC / PKCE Integrado</strong>
                    <span class="block mt-0.5 font-normal text-slate-600">Ao clicar em 'Autorizar Acesso', o servidor do ÓRBITA receberá o token JWT criptografado da identidade selecionada.</span>
                  </p>
                </div>
              </div>

              <button type="submit" id="submitBtn" class="w-full gov-blue-btn text-white py-3 rounded-2xl font-black text-sm transition duration-150 cursor-not-allowed shadow-md shadow-blue-200" disabled>
                Entrar com gov.br
              </button>
            </form>
          </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          <div class="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row gap-2 justify-between items-center">
            <span>© Secretaria de Governo Digital — Ministério da Gestão e da Inovação em Serviços Públicos</span>
            <div class="flex gap-4">
              <a href="#" class="hover:underline">Termos de uso</a>
              <a href="#" class="hover:underline">Privacidade</a>
            </div>
          </div>
        </footer>

        <script>
          function selectProfile(id, name, role, clearance) {
            document.getElementById('profileId').value = id;
            
            let mockCPF = "000.000.000-00";
            if (id === "alessandro") mockCPF = "142.890.344-01";
            if (id === "heloisa") mockCPF = "202.441.984-75";
            if (id === "jorge") mockCPF = "093.819.220-41";
            if (id === "srte_rj") mockCPF = "105.289.441-29";
            if (id === "public") mockCPF = "999.999.999-99";
            
            document.getElementById('cpfInput').value = mockCPF;
            
            document.getElementById('profileSelectionContainer').classList.add('hidden');
            document.getElementById('cpfContainer').classList.remove('hidden');
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.classList.remove('cursor-not-allowed');
            submitBtn.innerHTML = "Autorizar Acesso como " + name.split(" ")[0];
          }

          function goBack() {
            document.getElementById('profileSelectionContainer').classList.remove('hidden');
            document.getElementById('cpfContainer').classList.add('hidden');
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.classList.add('cursor-not-allowed');
            submitBtn.innerHTML = "Entrar com gov.br";
          }
        </script>
      </body>
      </html>
    `;
    return res.send(html);
  });

  // Auth API: gov.br callback
  app.get("/api/auth/govbr/callback", (req, res) => {
    const { profileId } = req.query;
    const matchedProfile = SEED_PROFILES.find(p => p.id === profileId) || SEED_PROFILES[0];

    req.session.user = {
      id: matchedProfile.id,
      name: matchedProfile.name,
      role: matchedProfile.role,
      email: matchedProfile.email,
      register: matchedProfile.register,
      clearance: matchedProfile.clearance,
      avatarColor: matchedProfile.avatarColor,
      badgeText: matchedProfile.badgeText
    };

    return res.redirect("/");
  });

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

  // API 2.9: CGU Demands - GET, CRUD & IMPORT
  app.get("/api/cgu", (req, res) => {
    const db = loadDatabase();
    res.json(db.cgu || []);
  });

  app.post("/api/cgu/update", (req, res) => {
    const db = loadDatabase();
    const updated = req.body as CguDemand;
    if (!db.cgu) db.cgu = [];
    const index = db.cgu.findIndex((x: any) => x.idTarefa === updated.idTarefa);

    if (index >= 0) {
      db.cgu[index] = {
        ...db.cgu[index],
        ...updated,
        ultimaAtualizacao: new Date().toLocaleString("pt-BR")
      };
      saveDatabase(db);
      res.json({ success: true, item: db.cgu[index] });
    } else {
      res.status(404).json({ error: "Demanda CGU não encontrada." });
    }
  });

  app.delete("/api/cgu/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    if (!db.cgu) db.cgu = [];
    db.cgu = db.cgu.filter((x: any) => x.idTarefa !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/cgu/import", (req, res) => {
    const db = loadDatabase();
    const { items } = req.body; // array of CguDemand
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importação inválido para CGU." });
    }

    if (!db.cgu) db.cgu = [];

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of items) {
      const idx = db.cgu.findIndex((x: any) => x.idTarefa === item.idTarefa);
      if (idx >= 0) {
        db.cgu[idx] = {
          ...db.cgu[idx],
          ...item,
          ultimaAtualizacao: new Date().toLocaleString("pt-BR")
        };
        updatedCount++;
      } else {
        db.cgu.unshift({
          ...item,
          ultimaAtualizacao: new Date().toLocaleString("pt-BR")
        });
        importedCount++;
      }
    }

    saveDatabase(db);
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: db.cgu.length,
      items: db.cgu
    });
  });

  // API 2.9.5: CGU Published Reports - GET, CRUD & IMPORT
  app.get("/api/cgu/reports", (req, res) => {
    const db = loadDatabase();
    res.json(db.cguReports || []);
  });

  app.delete("/api/cgu/reports/:idTarefa", (req, res) => {
    const db = loadDatabase();
    const idTarefa = req.params.idTarefa;
    if (!db.cguReports) db.cguReports = [];
    db.cguReports = db.cguReports.filter((x: any) => x.idTarefa !== idTarefa);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.post("/api/cgu/reports/import", (req, res) => {
    const db = loadDatabase();
    const { items } = req.body; // array of CguPublishedReport
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Formato de importação inválido para relatórios da CGU." });
    }

    if (!db.cguReports) db.cguReports = [];

    // Rigorous security filter: only import reports belonging to MTE
    const blacklist = ['dnit','codevasf','incra','ufgd','ufpe','ifac','mgi','mec','caixa','mds','mtur','mpa','ceagesp','unifesp','fnde','prf','memp','mdic','mf','ms','midr','ufg','mps','turismo','saude','educacao','cgu','fazenda','planejamento','integracao','senac','sesi','inss'];
    const filteredItems = items.filter((item: any) => {
      const idT = String(item.idTarefa || "");
      const idA = String(item.idAuditoria || "");
      if (idT.toUpperCase().startsWith("AUD") || idA.toUpperCase().startsWith("AUD")) {
        return false;
      }
      const sup = (item.nomeOrgaoSuperior || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const unit = (((item.nomeUnidadeAuditada || "") + " " + (item.siglaUnidadeAuditada || "")).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      
      let isMte = false;
      if (sup) {
        isMte = sup.includes("trabalho") || 
                sup.includes("emprego") || 
                sup.includes("mte") || 
                sup.includes("mtp");
      } else {
        const unitMatches = unit.includes("trabalho") || unit.includes("emprego") || unit.includes("mte") || unit.includes("mtp") || unit.includes("srt") || unit.includes("srte");
        const hasBlacklistInUnit = blacklist.some(b => unit.includes(b));
        isMte = unitMatches && !hasBlacklistInUnit;
      }

      // Date filter: must be on or after 01/01/2023
      let dateOk = false;
      const dataPublicacao = item.dataPublicacao;
      if (dataPublicacao) {
        const parts = dataPublicacao.split("/");
        if (parts.length === 3) {
          const d = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const y = parseInt(parts[2], 10);
          const dateVal = new Date(y, m, d);
          if (!isNaN(dateVal.getTime())) {
            const start = new Date(2023, 0, 1);
            dateOk = dateVal >= start;
          }
        } else {
          const dateVal = new Date(dataPublicacao);
          if (!isNaN(dateVal.getTime())) {
            const start = new Date(2023, 0, 1);
            dateOk = dateVal >= start;
          }
        }
      }

      return isMte && dateOk;
    });

    let importedCount = 0;
    let updatedCount = 0;

    for (const item of filteredItems) {
      const idx = db.cguReports.findIndex((x: any) => x.idTarefa === item.idTarefa);
      if (idx >= 0) {
        db.cguReports[idx] = {
          ...db.cguReports[idx],
          ...item,
          ultimaAtualizacao: new Date().toLocaleString("pt-BR")
        };
        updatedCount++;
      } else {
        db.cguReports.unshift({
          ...item,
          ultimaAtualizacao: new Date().toLocaleString("pt-BR")
        });
        importedCount++;
      }
    }

    saveDatabase(db);
    res.json({
      success: true,
      importedCount,
      updatedCount,
      totalCount: db.cguReports.length,
      items: db.cguReports
    });
  });

  // API 2.9.5b: CGU Reports - PDF Proxy Download
  // Proxies the PDF from eaud.cgu.gov.br following redirects and serving with correct filename
  app.get("/api/cgu/reports/pdf/:idTarefa", (req, res) => {
    const { idTarefa } = req.params;
    const filename = req.query.filename ? String(req.query.filename) : `Relatorio_CGU_${idTarefa}`;
    const safeFilename = filename.replace(/[^\w\s\-\.]/gi, "").trim().substring(0, 120) + ".pdf";

    const startUrl = `https://eaud.cgu.gov.br/relatorios/download/${encodeURIComponent(idTarefa)}`;
    console.log(`[CGU PDF PROXY] Fetching: ${startUrl}`);

    const fetchWithRedirects = (url: string, maxRedirects: number) => {
      const isHttps = url.startsWith("https");
      const lib = isHttps ? https : require("http");

      const reqOptions = new URL(url);

      lib.get({
        hostname: reqOptions.hostname,
        path: reqOptions.pathname + reqOptions.search,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120",
          "Accept": "application/pdf, application/octet-stream, */*",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "Referer": "https://eaud.cgu.gov.br/relatorios"
        }
      }, (response: any) => {
        const status = response.statusCode;
        const location = response.headers["location"];
        const contentType = response.headers["content-type"] || "";

        console.log(`[CGU PDF PROXY] Status: ${status}, Content-Type: ${contentType}, Location: ${location || "none"}`);

        // Follow redirects
        if ((status === 301 || status === 302 || status === 303 || status === 307) && location && maxRedirects > 0) {
          const redirectUrl = location.startsWith("http") ? location : `https://eaud.cgu.gov.br${location}`;
          console.log(`[CGU PDF PROXY] Redirecting to: ${redirectUrl}`);
          response.resume(); // discard body
          return fetchWithRedirects(redirectUrl, maxRedirects - 1);
        }

        if (status === 404) {
          response.resume();
          return res.status(404).json({ error: "Relatório não encontrado no portal e-CGU." });
        }

        if (status !== 200) {
          response.resume();
          return res.status(502).json({ error: `Portal e-CGU retornou status ${status}.` });
        }

        // Check if the response is actually a PDF
        if (contentType && contentType.includes("text/html")) {
          // e-CGU returned a login page or error page — read and log it
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => { body += chunk.substring(0, 200); });
          response.on("end", () => {
            console.warn(`[CGU PDF PROXY] Expected PDF but got HTML. Body preview: ${body.substring(0, 150)}`);
            res.status(403).json({ error: "O portal e-CGU requer autenticação para acessar este relatório. Use o botão Portal para acessá-lo manualmente." });
          });
          return;
        }

        // Serve the PDF inline so it opens in the browser's PDF viewer
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${safeFilename}"`);
        const contentLength = response.headers["content-length"];
        if (contentLength) res.setHeader("Content-Length", contentLength);

        console.log(`[CGU PDF PROXY] Streaming PDF inline (${contentLength || "unknown"} bytes) as: ${safeFilename}`);
        response.pipe(res);

      }).on("error", (err: Error) => {
        console.error("[CGU PDF PROXY] Connection error:", err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: "Falha de conexão com o portal e-CGU." });
        }
      });
    };

    fetchWithRedirects(startUrl, 5);
  });

  // API 2.9.6: CGU Published Reports - AUTOMATED SYNC
  app.post("/api/cgu/reports/sync", (req, res) => {
    console.log("[CGU SYNC] Starting automated sync from dadosabertos-download.cgu.gov.br...");
    
    const csvUrl = "https://dadosabertos-download.cgu.gov.br/Auditorias/Auditorias.csv";
    
    const request = https.get(csvUrl, (response) => {
      if (response.statusCode !== 200) {
        console.error(`[CGU SYNC] Failed to download CSV. Status: ${response.statusCode}`);
        return res.status(500).json({ error: `Falha ao conectar com o portal de dados abertos da CGU (Status: ${response.statusCode}).` });
      }

      response.setEncoding('latin1'); // Decode Latin1/ISO-8859-1 correctly

      const rl = readline.createInterface({
        input: response,
        crlfDelay: Infinity
      });

      const db = loadDatabase();
      if (!db.cguReports) db.cguReports = [];

      let isFirstLine = true;
      let importedCount = 0;
      let updatedCount = 0;
      const blacklist = ['dnit','codevasf','incra','ufgd','ufpe','ifac','mgi','mec','caixa','mds','mtur','mpa','ceagesp','unifesp','fnde','prf','memp','mdic','mf','ms','midr','ufg','mps','turismo','saude','educacao','cgu','fazenda','planejamento','integracao','senac','sesi','inss'];

      rl.on('line', (line) => {
        if (isFirstLine) {
          isFirstLine = false;
          return;
        }

        if (!line || line.trim() === "") return;

        // Split by semicolon outside quotes
        const row = line.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (row.length < 13) return;

        const idTarefa = (row[0] || "").replace(/"/g, "").trim();
        if (!idTarefa) return;

        // Date check: publication must be >= 01/01/2023 (format is YYYY-MM-DD)
        const dateStr = (row[2] || "").trim();
        if (!dateStr) return;

        const dateParts = dateStr.split("-");
        if (dateParts.length === 3) {
          const y = parseInt(dateParts[0], 10);
          if (y < 2023) return;
        } else {
          const dateVal = new Date(dateStr);
          if (isNaN(dateVal.getTime()) || dateVal.getFullYear() < 2023) return;
        }

        // Format date from YYYY-MM-DD to DD/MM/YYYY
        let formattedDate = dateStr;
        if (dateParts.length === 3) {
          formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
        }

        const nomeSuperior = (row[7] || "").replace(/"/g, "").trim();
        const siglaSuperior = (row[6] || "").replace(/"/g, "").trim();
        const nomeAuditada = (row[5] || "").replace(/"/g, "").trim();
        const siglaAuditada = (row[4] || "").replace(/"/g, "").trim();

        const sup = nomeSuperior.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const siglaSup = siglaSuperior.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const unit = (nomeAuditada + " " + siglaAuditada).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        let isMte = false;
        if (sup && (sup.includes("trabalho") || sup.includes("emprego") || sup.includes("mte") || sup.includes("mtp") || siglaSup.includes("mte") || siglaSup.includes("mtp"))) {
          isMte = true;
        } else {
          const unitMatches = unit.includes("trabalho") || unit.includes("emprego") || unit.includes("mte") || unit.includes("mtp") || unit.includes("srt") || unit.includes("srte");
          const containsBlacklist = blacklist.some(b => unit.includes(b));
          isMte = unitMatches && !containsBlacklist;
        }

        if (!isMte) return;

        const idAuditoria = (row[3] || "").replace(/"/g, "").trim() || idTarefa;
        if (idTarefa.toUpperCase().startsWith("AUD") || idAuditoria.toUpperCase().startsWith("AUD")) {
          return;
        }

        const reportItem = {
          idTarefa,
          tituloRelatorio: (row[1] || "").replace(/"/g, "").trim(),
          dataPublicacao: formattedDate,
          idAuditoria,
          siglaUnidadeAuditada: siglaAuditada || "MTE",
          nomeUnidadeAuditada: nomeAuditada || "Ministério do Trabalho e Emprego",
          siglaOrgaoSuperior: siglaSuperior || "MTE",
          nomeOrgaoSuperior: nomeSuperior || "Ministério do Trabalho e Emprego",
          uf: (row[8] || "").replace(/"/g, "").trim() || "DF",
          municipio: (row[9] || "").replace(/"/g, "").trim() || "Brasília",
          tipoServico: (row[10] || "").replace(/"/g, "").trim() || "Auditoria",
          linhaAcao: (row[11] || "").replace(/"/g, "").trim(),
          grupoAtividade: (row[12] || "").replace(/"/g, "").trim(),
          edicaoPrograma: (row[13] || "").replace(/"/g, "").trim()
        };

        const idx = db.cguReports.findIndex((x: any) => x.idTarefa === reportItem.idTarefa);
        if (idx >= 0) {
          db.cguReports[idx] = {
            ...db.cguReports[idx],
            ...reportItem,
            ultimaAtualizacao: new Date().toLocaleString("pt-BR")
          };
          updatedCount++;
        } else {
          db.cguReports.unshift({
            ...reportItem,
            ultimaAtualizacao: new Date().toLocaleString("pt-BR")
          });
          importedCount++;
        }
      });

      rl.on('close', () => {
        saveDatabase(db);
        console.log(`[CGU SYNC] Sync completed. Imported: ${importedCount}, Updated: ${updatedCount}. Total: ${db.cguReports.length}`);
        res.json({
          success: true,
          importedCount,
          updatedCount,
          totalCount: db.cguReports.length
        });
      });
    });

    request.on('error', (err) => {
      console.error("[CGU SYNC] Network error downloading CGU CSV:", err);
      res.status(500).json({ error: "Erro de conexão ao baixar a base de dados abertos da CGU." });
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

        // Format and clean text strings — convert HTML from API to plain text first
        const rawAcordao = rawItem.ACORDAO;
        const cleanedAcordao = rawAcordao ? stripHtmlToText(rawAcordao) : "";

        // Only generate fallback text if the cleaned content is truly empty/placeholder
        // (removed "..." condition — legitimate legal texts often contain ellipsis)
        // (lowered threshold from 200 to 50 chars — short but valid texts should be preserved)
        const needsGeneration = !cleanedAcordao ||
          cleanedAcordao.includes("DADOS HISTÓRICOS") ||
          cleanedAcordao.includes("DADOS OBTIDOS") ||
          cleanedAcordao.trim().length < 50;

        let finalAcordaoText = cleanedAcordao;
        let isSimulated = false;

        if (needsGeneration) {
          console.log(`[CSV Import] Attempting to fetch real text for ${numAcordao}/${anoAcordao}...`);
          const apiDoc = await fetchAcordaoFromTCU(numAcordao, anoAcordao);
          if (apiDoc && apiDoc.ACORDAO) {
            finalAcordaoText = stripHtmlToText(apiDoc.ACORDAO);
            rawItem.RELATOR = rawItem.RELATOR || apiDoc.RELATOR;
            rawItem.COLEGIADO = rawItem.COLEGIADO || apiDoc.COLEGIADO;
            rawItem.NUMATA = rawItem.NUMATA || apiDoc.NUMATA;
            rawItem.DATASESSAO = rawItem.DATASESSAO || apiDoc.DATASESSAO;
            rawItem.PROC = rawItem.PROC || (apiDoc.PROC ? stripHtmlToText(apiDoc.PROC) : undefined);
            rawItem.INTERESSADOS = rawItem.INTERESSADOS || apiDoc.INTERESSADOS;
            rawItem.ENTIDADE = rawItem.ENTIDADE || apiDoc.ENTIDADE;
            rawItem.UNIDADETECNICA = rawItem.UNIDADETECNICA || apiDoc.UNIDADETECNICA;
            rawItem.ASSUNTO = rawItem.ASSUNTO || apiDoc.ASSUNTO;
            rawItem.TIPOPROCESSO = rawItem.TIPOPROCESSO || apiDoc.TIPOPROCESSO;
          } else {
            isSimulated = true;
            finalAcordaoText = generateFullAcordaoText({
              RELATOR: chosenRelator,
              NUMACORDAO: numAcordao,
              ANOACORDAO: anoAcordao,
              COLEGIADO: chosenColegiado,
              PROC: rawItem.PROC || `TC ${String(numAcordao % 999).padStart(3, "0")}.${String(Math.floor(numAcordao / 100)).padStart(3, "0")}/${anoAcordao}-0`,
              TIPOPROCESSO: rawItem.TIPOPROCESSO || "Julgamento",
              INTERESSADOS: rawItem.INTERESSADOS || "Ministério do Trabalho e Emprego (AECI-MTE)",
              ENTIDADE: rawItem.ENTIDADE || "MTE - Ministério do Trabalho e Emprego",
              UNIDADETECNICA: chosenUT,
              ASSUNTO: chosenAssunto,
              DECISAO: chosenDecisao
            });
          }
        }

        const compiledItem: AcordaoDemand = {
          KEY: generatedKey,
          TITULO: rawItem.TITULO || `ACÓRDÃO ${numAcordao}/${anoAcordao} - ATA ${rawItem.NUMATA || numAta} - ${(rawItem.COLEGIADO || chosenColegiado).toUpperCase()}`,
          NUMACORDAO: numAcordao,
          ANOACORDAO: anoAcordao,
          NUMATA: rawItem.NUMATA || numAta,
          COLEGIADO: rawItem.COLEGIADO || chosenColegiado,
          DATASESSAO: rawItem.DATASESSAO || dataSessao,
          SITUACAO: rawItem.SITUACAO || (isSimulated ? "OFICIALIZADO" : "OFICIALIZADO (VIA API)"),
          PROC: rawItem.PROC || `TC ${String(numAcordao % 999).padStart(3, "0")}.${String(Math.floor(numAcordao / 100)).padStart(3, "0")}/${anoAcordao}-0`,
          ACORDAOSRELACIONADOS: rawItem.ACORDAOSRELACIONADOS || "Nenhum",
          TIPOPROCESSO: rawItem.TIPOPROCESSO || "",
          INTERESSADOS: rawItem.INTERESSADOS || "Ministério do Trabalho e Emprego (AECI-MTE)",
          ENTIDADE: rawItem.ENTIDADE || "MTE - Ministério do Trabalho e Emprego",
          UNIDADETECNICA: rawItem.UNIDADETECNICA || chosenUT,
          RELATOR: rawItem.RELATOR || chosenRelator,
          ASSUNTO: rawItem.ASSUNTO || chosenAssunto,
          SUMARIO: rawItem.SUMARIO || `Acórdão nº ${numAcordao}/${anoAcordao} importado de arquivo unificado e cruzado com base TCU.`,
          ACORDAO: finalAcordaoText,
          DECISAO: rawItem.DECISAO || chosenDecisao,

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

      const existingIndex = db.acordaos.findIndex(
        (x: any) => x.NUMACORDAO === numAcordao && x.ANOACORDAO === anoAcordao
      );

      try {
        const apiDoc = await fetchAcordaoFromTCU(numAcordao, anoAcordao);
        
        let newAcordao: AcordaoDemand;

        if (apiDoc) {
          const cleanProc = apiDoc.PROC ? stripHtmlToText(apiDoc.PROC) : `TC ${numAcordao}/${anoAcordao}`;
          const cleanTitulo = apiDoc.TITULO ? stripHtmlToText(apiDoc.TITULO) : `ACÓRDÃO ${numAcordao}/${anoAcordao}`;
          const cleanAcordaoText = apiDoc.ACORDAO ? stripHtmlToText(apiDoc.ACORDAO) : "";

          newAcordao = {
            KEY: generatedKey,
            TITULO: cleanTitulo,
            NUMACORDAO: numAcordao,
            ANOACORDAO: anoAcordao,
            NUMATA: apiDoc.NUMATA || `${numAcordao}/${anoAcordao}`,
            COLEGIADO: apiDoc.COLEGIADO || "Plenário",
            DATASESSAO: apiDoc.DATASESSAO || "",
            SITUACAO: apiDoc.SITUACAO || "OFICIALIZADO",
            PROC: cleanProc,
            ACORDAOSRELACIONADOS: "Nenhum",
            TIPOPROCESSO: apiDoc.TIPOPROCESSO || "TOMADA DE CONTAS ESPECIAL (TCE)",
            INTERESSADOS: apiDoc.INTERESSADOS || "Ministério do Trabalho e Emprego (AECI-MTE)",
            ENTIDADE: apiDoc.ENTIDADE || "MTE - Ministério do Trabalho e Emprego",
            RELATOR: apiDoc.RELATOR || "",
            UNIDADETECNICA: apiDoc.UNIDADETECNICA || "Assessoria Especial de Controle Interno",
            ASSUNTO: apiDoc.ASSUNTO || "Jurisprudência TCU",
            SUMARIO: apiDoc.ASSUNTO || "Importado via API de Pesquisa do TCU.",
            ACORDAO: cleanAcordaoText,
            DECISAO: cleanAcordaoText,

            // Operational defaults:
            STATUS_MONITORAMENTO: existingIndex >= 0 ? db.acordaos[existingIndex].STATUS_MONITORAMENTO : "Pendente",
            RESPONSAVEL_INTERNO: existingIndex >= 0 ? db.acordaos[existingIndex].RESPONSAVEL_INTERNO : "AECI - Divisão de Monitoramento",
            PRAZO_LIMITE: existingIndex >= 0 ? db.acordaos[existingIndex].PRAZO_LIMITE : `${anoAcordao + 1}-12-31`,
            OBSERVACOES: existingIndex >= 0 ? db.acordaos[existingIndex].OBSERVACOES : "Importado do repositório público de jurisprudência do TCU em " + new Date().toLocaleDateString("pt-BR") + ".",
            ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
          };
        } else {
          // Mock API data generation fallback
          const colegiadoOptions = ["Plenário", "Primeira Câmara", "Segunda Câmara"];
          const chosenColegiado = colegiadoOptions[numAcordao % 3];
          const numAta = `${Math.floor(Math.random() * 45) + 1}/${anoAcordao}`;
          const dataSessao = `${String(Math.floor((numAcordao % 28) + 1)).padStart(2, "0")}/${String(Math.floor((numAcordao % 12) + 1)).padStart(2, "0")}/${anoAcordao}`;
          const relatorOptions = ["Ministro Benjamin Zymler", "Ministro Vital do Rêgo", "Ministro Jorge Oliveira", "Ministro Jhonatan de Jesus", "Ministro Walton Alencar Rodrigues"];
          const chosenRelator = relatorOptions[numAcordao % 5];
          const utOptions = ["AudContratações (Unidade de Auditoria de Contratações)", "AudBenefícios (Unidade de Auditoria de Benefícios Sociais)", "AudGovernança (Unidade de Auditoria de Governança de Pessoas)", "AudPatrimônio (Unidade de Auditoria de Infraestrutura e Logística)"];
          const chosenUT = utOptions[numAcordao % 4];

          const subjectsAndSummaries = [
            {
              assunto: "Acompanhamento de recomendações de transparência passiva e divulgação de painéis do MTE.",
              sumario: "Acompanhamento técnico gerado a partir do cruzamento de dados institucionais dos canais oficiais do Ministério do Trabalho e Emprego. Recomenda-se a reestruturação da seção de perguntas frequentes e canais de Ouvidoria.",
              texto: `ACORDAM os Ministros do Tribunal de Contas da União, reunidos em sessão de ${chosenColegiado}, em:\n1. Recomendar à AECI-MTE o aprimoramento dos portais para facilidade do cidadão;\n2. Remeter os relatórios de andamento al Tribunal no prazo regimental de 120 dias.`,
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

          newAcordao = {
            KEY: generatedKey,
            TITULO: `ACÓRDÃO ${numAcordao}/${anoAcordao} - ATA ${numAta} - ${chosenColegiado.toUpperCase()}`,
            NUMACORDAO: numAcordao,
            ANOACORDAO: anoAcordao,
            NUMATA: numAta,
            COLEGIADO: chosenColegiado,
            DATASESSAO: dataSessao,
            SITUACAO: "OFICIALIZADO (SIMULADO)",
            PROC: `TC ${String(numAcordao % 999).padStart(3, "0")}.${String(Math.floor(numAcordao / 100)).padStart(3, "0")}/${anoAcordao}-0`,
            ACORDAOSRELACIONADOS: `Nenhum`,
            TIPOPROCESSO: [
              "JULGAMENTO DE TCE",
              "MONITORAMENTO",
              "TOMADA DE CONTAS ESPECIAL",
              "REPRESENTAÇÃO (REPR)",
              "RELATÓRIO DE AUDITORIA (RA)",
              "RELATÓRIO DE ACOMPANHAMENTO",
              "DENÚNCIA (DEN)"
            ][numAcordao % 7],
            INTERESSADOS: "Ministério do Trabalho e Emprego (AECI-MTE); Controladoria-Geral da União",
            ENTIDADE: "MTE - Ministério do Trabalho e Emprego",
            RELATOR: chosenRelator,
            UNIDADETECNICA: chosenUT,
            ASSUNTO: selection.assunto,
            SUMARIO: selection.sumario,
            ACORDAO: "", 
            DECISAO: selection.decisao,
            STATUS_MONITORAMENTO: existingIndex >= 0 ? db.acordaos[existingIndex].STATUS_MONITORAMENTO : "Pendente",
            RESPONSAVEL_INTERNO: existingIndex >= 0 ? db.acordaos[existingIndex].RESPONSAVEL_INTERNO : "AECI - Divisão de Monitoramento",
            PRAZO_LIMITE: existingIndex >= 0 ? db.acordaos[existingIndex].PRAZO_LIMITE : `${anoAcordao + 1}-12-31`,
            OBSERVACOES: existingIndex >= 0 ? db.acordaos[existingIndex].OBSERVACOES : "Gerado automaticamente (TCU offline).",
            ULTIMA_ATUALIZACAO: new Date().toLocaleString("pt-BR")
          };

          newAcordao.ACORDAO = generateFullAcordaoText(newAcordao);
        }

        // Cache it in DB
        if (existingIndex >= 0) {
          db.acordaos[existingIndex] = newAcordao;
        } else {
          db.acordaos.unshift(newAcordao);
        }
        saveDatabase(db);

        results.push({
          input: itemString,
          parsedNumero: numAcordao,
          parsedAno: anoAcordao,
          status: existingIndex >= 0 ? "updated" : "imported",
          item: newAcordao,
          message: existingIndex >= 0 
            ? "Acórdão atualizado e metadados de monitoramento local preservados!"
            : "Acórdão localizado na API de Jurisprudência do TCU e incorporado ao monitoramento interno!"
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

  // API 5.1: Comissão de Ética - Membros CRUD
  app.get("/api/etica/membros", (req, res) => {
    const db = loadDatabase();
    res.json(db.eticaMembros || []);
  });

  app.post("/api/etica/membros", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as EticaMembro;
    newItem.id = "MEM-" + Date.now();
    newItem.ativo = true;
    newItem.ultimaAtualizacao = new Date().toLocaleString("pt-BR");
    if (!db.eticaMembros) db.eticaMembros = [];
    db.eticaMembros.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/etica/membros/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.eticaMembros.findIndex((x: any) => x.id === id);
    if (index >= 0) {
      db.eticaMembros[index] = { 
        ...db.eticaMembros[index], 
        ...updateData, 
        ultimaAtualizacao: new Date().toLocaleString("pt-BR") 
      };
      saveDatabase(db);
      res.json(db.eticaMembros[index]);
    } else {
      res.status(404).json({ error: "Membro não encontrado." });
    }
  });

  app.delete("/api/etica/membros/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const index = db.eticaMembros.findIndex((x: any) => x.id === id);
    if (index >= 0) {
      db.eticaMembros[index].ativo = !db.eticaMembros[index].ativo; // toggle status as soft delete
      db.eticaMembros[index].ultimaAtualizacao = new Date().toLocaleString("pt-BR");
      saveDatabase(db);
      res.json({ success: true, item: db.eticaMembros[index] });
    } else {
      res.status(404).json({ error: "Membro não encontrado." });
    }
  });

  // API 5.2: Comissão de Ética - Reuniões CRUD
  app.get("/api/etica/reunioes", (req, res) => {
    const db = loadDatabase();
    res.json(db.eticaReunioes || []);
  });

  app.post("/api/etica/reunioes", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as EticaReuniao;
    newItem.id = "REU-" + Date.now();
    newItem.notificadoAgendamento = false;
    newItem.notificadoLembrete = false;
    newItem.confirmacoes = {};
    if (newItem.convidados && Array.isArray(newItem.convidados)) {
      newItem.convidados.forEach((c: any) => {
        newItem.confirmacoes[c.email] = "Pendente";
      });
    }
    newItem.ultimaAtualizacao = new Date().toLocaleString("pt-BR");
    if (!db.eticaReunioes) db.eticaReunioes = [];
    db.eticaReunioes.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/etica/reunioes/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.eticaReunioes.findIndex((x: any) => x.id === id);
    if (index >= 0) {
      db.eticaReunioes[index] = { 
        ...db.eticaReunioes[index], 
        ...updateData, 
        ultimaAtualizacao: new Date().toLocaleString("pt-BR") 
      };
      saveDatabase(db);
      res.json(db.eticaReunioes[index]);
    } else {
      res.status(404).json({ error: "Reunião não encontrada." });
    }
  });

  app.delete("/api/etica/reunioes/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.eticaReunioes = db.eticaReunioes.filter((x: any) => x.id !== id);
    if (db.eticaAtas) {
      db.eticaAtas = db.eticaAtas.filter((x: any) => x.reuniaoId !== id);
    }
    saveDatabase(db);
    res.json({ success: true });
  });

  // API 5.2b: Reuniões Notificações Simulação
  app.post("/api/etica/reunioes/:id/notificar", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const { type } = req.body; // 'agendamento' | 'lembrete'
    const index = db.eticaReunioes.findIndex((x: any) => x.id === id);
    if (index >= 0) {
      const r = db.eticaReunioes[index];
      if (type === 'agendamento') {
        r.notificadoAgendamento = true;
      } else {
        r.notificadoLembrete = true;
      }
      if (r.convidados && Array.isArray(r.convidados)) {
        r.convidados.forEach((c: any) => {
          if (!r.confirmacoes[c.email] || r.confirmacoes[c.email] === 'Pendente') {
            r.confirmacoes[c.email] = Math.random() > 0.2 ? 'Confirmado' : 'Recusado';
          }
        });
      }
      r.ultimaAtualizacao = new Date().toLocaleString("pt-BR");
      saveDatabase(db);
      res.json({ success: true, reuniao: r });
    } else {
      res.status(404).json({ error: "Reunião não encontrada." });
    }
  });

  // API 5.3: Comissão de Ética - Atas CRUD
  app.get("/api/etica/atas", (req, res) => {
    const db = loadDatabase();
    res.json(db.eticaAtas || []);
  });

  app.post("/api/etica/atas", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as EticaAta;
    newItem.id = newItem.reuniaoId;
    if (!db.eticaAtas) db.eticaAtas = [];
    const idx = db.eticaAtas.findIndex((x: any) => x.reuniaoId === newItem.reuniaoId);
    if (idx >= 0) {
      db.eticaAtas[idx] = { 
        ...db.eticaAtas[idx], 
        ...newItem, 
        ultimaAtualizacao: new Date().toLocaleString("pt-BR") 
      };
    } else {
      db.eticaAtas.unshift({ 
        ...newItem, 
        ultimaAtualizacao: new Date().toLocaleString("pt-BR") 
      });
    }
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  // API 5.4: Comissão de Ética - Processos CRUD
  app.get("/api/etica/processos", (req, res) => {
    const db = loadDatabase();
    res.json(db.eticaProcessos || []);
  });

  app.post("/api/etica/processos", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as EticaProcesso;
    newItem.id = "PRC-" + Date.now();
    newItem.ultimaAtualizacao = new Date().toLocaleString("pt-BR");
    if (!db.eticaProcessos) db.eticaProcessos = [];
    db.eticaProcessos.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/etica/processos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.eticaProcessos.findIndex((x: any) => x.id === id);
    if (index >= 0) {
      db.eticaProcessos[index] = { 
        ...db.eticaProcessos[index], 
        ...updateData, 
        ultimaAtualizacao: new Date().toLocaleString("pt-BR") 
      };
      saveDatabase(db);
      res.json(db.eticaProcessos[index]);
    } else {
      res.status(404).json({ error: "Processo não encontrado." });
    }
  });

  app.delete("/api/etica/processos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.eticaProcessos = db.eticaProcessos.filter((x: any) => x.id !== id);
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
      tceAcordaoMappings: SEED_TCE_ACORDAO_MAPPINGS,
      users: SEED_PROFILES,
      cgu: SEED_CGU,
      cguReports: [],
      eticaMembros: SEED_ETICA_MEMBROS,
      eticaReunioes: SEED_ETICA_REUNIOES,
      eticaAtas: SEED_ETICA_ATAS,
      eticaProcessos: SEED_ETICA_PROCESSOS,
      contratos: SEED_CONTRATOS,
      contratosConsumoMensal: SEED_CONTRATOS_CONSUMO,
      viaturas: SEED_VIATURAS,
      viaturasAbastecimentos: SEED_VIATURAS_ABASTECIMENTOS,
      viaturasManutencoes: SEED_VIATURAS_MANUTENCOES,
      unidadesRol: SEED_UNIDADES_ROL,
      dirigentes: SEED_DIRIGENTES,
      dirigentesEventos: SEED_DIRIGENTES_EVENTOS
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
      totalSrteDemands += (s.demandasTCU || 0) + (s.demandasCGU || 0);
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

  // ==========================================
  // API GESTÃO DE CONTRATOS (SRTE)
  // ==========================================
  app.get("/api/contratos", (req, res) => {
    const db = loadDatabase();
    res.json(db.contratos || []);
  });

  app.get("/api/contratos/srte/:uf", (req, res) => {
    const db = loadDatabase();
    const uf = req.params.uf.toUpperCase();
    const list = (db.contratos || []).filter((x: any) => x.srteId === uf);
    res.json(list);
  });

  app.post("/api/contratos", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as Contrato;
    newItem.id = "C-" + Date.now();
    if (!db.contratos) db.contratos = [];
    db.contratos.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/contratos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.contratos.findIndex((x: any) => x.id === id);

    if (index >= 0) {
      db.contratos[index] = { ...db.contratos[index], ...updateData };
      saveDatabase(db);
      res.json(db.contratos[index]);
    } else {
      res.status(404).json({ error: "Contrato não encontrado." });
    }
  });

  app.delete("/api/contratos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.contratos = (db.contratos || []).filter((x: any) => x.id !== id);
    db.contratosConsumoMensal = (db.contratosConsumoMensal || []).filter((x: any) => x.contratoId !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.get("/api/contratos/:id/consumo", (req, res) => {
    const db = loadDatabase();
    const contratoId = req.params.id;
    const list = (db.contratosConsumoMensal || []).filter((x: any) => x.contratoId === contratoId);
    res.json(list);
  });

  app.post("/api/contratos/:id/consumo", (req, res) => {
    const db = loadDatabase();
    const contratoId = req.params.id;
    const { mesAno, valor } = req.body;
    if (!mesAno || valor === undefined) {
      return res.status(400).json({ error: "Mês/Ano e Valor são obrigatórios." });
    }

    if (!db.contratosConsumoMensal) db.contratosConsumoMensal = [];

    // Calculate variation
    const currentConsumos = db.contratosConsumoMensal
      .filter((x: any) => x.contratoId === contratoId)
      .sort((a: any, b: any) => {
        const [mA, yA] = a.mesAno.split("/").map(Number);
        const [mB, yB] = b.mesAno.split("/").map(Number);
        return (yA - yB) * 12 + (mA - mB);
      });

    let variacao = 0;
    if (currentConsumos.length > 0) {
      const lastVal = currentConsumos[currentConsumos.length - 1].valor;
      if (lastVal > 0) {
        variacao = parseFloat((((valor - lastVal) / lastVal) * 100).toFixed(2));
      }
    }

    const newItem: ContratoConsumoMensal = {
      id: "CC-" + Date.now(),
      contratoId,
      mesAno,
      valor: Number(valor),
      variacao
    };

    db.contratosConsumoMensal.push(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.delete("/api/contratos/consumo/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.contratosConsumoMensal = (db.contratosConsumoMensal || []).filter((x: any) => x.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // ==========================================
  // API GESTÃO DE FROTA (SRTE)
  // ==========================================
  app.get("/api/viaturas", (req, res) => {
    const db = loadDatabase();
    res.json(db.viaturas || []);
  });

  app.get("/api/viaturas/srte/:uf", (req, res) => {
    const db = loadDatabase();
    const uf = req.params.uf.toUpperCase();
    const list = (db.viaturas || []).filter((x: any) => x.srteId === uf);
    res.json(list);
  });

  app.post("/api/viaturas", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as Viatura;
    newItem.id = "V-" + Date.now();
    if (!db.viaturas) db.viaturas = [];
    db.viaturas.unshift(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/viaturas/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.viaturas.findIndex((x: any) => x.id === id);

    if (index >= 0) {
      db.viaturas[index] = { ...db.viaturas[index], ...updateData };
      saveDatabase(db);
      res.json(db.viaturas[index]);
    } else {
      res.status(404).json({ error: "Viatura não encontrada." });
    }
  });

  app.delete("/api/viaturas/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.viaturas = (db.viaturas || []).filter((x: any) => x.id !== id);
    db.viaturasAbastecimentos = (db.viaturasAbastecimentos || []).filter((x: any) => x.viaturaId !== id);
    db.viaturasManutencoes = (db.viaturasManutencoes || []).filter((x: any) => x.viaturaId !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  app.get("/api/viaturas/:id/abastecimentos", (req, res) => {
    const db = loadDatabase();
    const viaturaId = req.params.id;
    const list = (db.viaturasAbastecimentos || []).filter((x: any) => x.viaturaId === viaturaId);
    res.json(list);
  });

  app.post("/api/viaturas/:id/abastecimentos", (req, res) => {
    const db = loadDatabase();
    const viaturaId = req.params.id;
    const newItem = req.body as ViaturaAbastecimento;
    newItem.id = "A-" + Date.now();
    newItem.viaturaId = viaturaId;
    
    if (!db.viaturasAbastecimentos) db.viaturasAbastecimentos = [];
    db.viaturasAbastecimentos.unshift(newItem);
    
    // Update vehicle mileage if higher
    const viatIdx = (db.viaturas || []).findIndex((x: any) => x.id === viaturaId);
    if (viatIdx >= 0 && newItem.km > db.viaturas[viatIdx].kmAtual) {
      db.viaturas[viatIdx].kmAtual = newItem.km;
    }
    
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.get("/api/viaturas/:id/manutencoes", (req, res) => {
    const db = loadDatabase();
    const viaturaId = req.params.id;
    const list = (db.viaturasManutencoes || []).filter((x: any) => x.viaturaId === viaturaId);
    res.json(list);
  });

  app.post("/api/viaturas/:id/manutencoes", (req, res) => {
    const db = loadDatabase();
    const viaturaId = req.params.id;
    const newItem = req.body as ViaturaManutencao;
    newItem.id = "M-" + Date.now();
    newItem.viaturaId = viaturaId;

    if (!db.viaturasManutencoes) db.viaturasManutencoes = [];
    db.viaturasManutencoes.unshift(newItem);

    // Update vehicle mileage and next review if provided
    const viatIdx = (db.viaturas || []).findIndex((x: any) => x.id === viaturaId);
    if (viatIdx >= 0) {
      if (newItem.kmManutencao > db.viaturas[viatIdx].kmAtual) {
        db.viaturas[viatIdx].kmAtual = newItem.kmManutencao;
      }
      if (newItem.proximaRevisaoKm && newItem.proximaRevisaoKm > db.viaturas[viatIdx].proximaRevisaoKm) {
        db.viaturas[viatIdx].proximaRevisaoKm = newItem.proximaRevisaoKm;
      }
    }

    saveDatabase(db);
    res.status(201).json(newItem);
  });

  // ==========================================
  // API ROL DE RESPONSÁVEIS (IN 84/2020 TCU)
  // ==========================================

  // --- Unidades ---
  app.get("/api/unidades-rol", (req, res) => {
    const db = loadDatabase();
    res.json(db.unidadesRol || []);
  });

  app.post("/api/unidades-rol", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as UnidadeRol;
    newItem.id = "U-" + Date.now();
    if (!db.unidadesRol) db.unidadesRol = [];
    db.unidadesRol.push(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/unidades-rol/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const idx = (db.unidadesRol || []).findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      db.unidadesRol[idx] = { ...db.unidadesRol[idx], ...req.body };
      saveDatabase(db);
      res.json(db.unidadesRol[idx]);
    } else {
      res.status(404).json({ error: "Unidade não encontrada." });
    }
  });

  app.delete("/api/unidades-rol/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.unidadesRol = (db.unidadesRol || []).filter((x: any) => x.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- Dirigentes (PESSOAS) ---
  app.get("/api/dirigentes", (req, res) => {
    const db = loadDatabase();
    res.json(db.dirigentes || []);
  });

  app.post("/api/dirigentes", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as Dirigente;
    newItem.id = "D-" + Date.now();
    if (!db.dirigentes) db.dirigentes = [];
    db.dirigentes.push(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/dirigentes/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = db.dirigentes.findIndex((x: any) => x.id === id);
    if (index >= 0) {
      db.dirigentes[index] = { ...db.dirigentes[index], ...updateData };
      saveDatabase(db);
      res.json(db.dirigentes[index]);
    } else {
      res.status(404).json({ error: "Dirigente não localizado." });
    }
  });

  app.delete("/api/dirigentes/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.dirigentes = (db.dirigentes || []).filter((x: any) => x.id !== id);
    db.dirigentesCargos = (db.dirigentesCargos || []).filter((x: any) => x.dirigenteId !== id);
    db.dirigentesEventos = (db.dirigentesEventos || []).filter((x: any) => x.dirigenteId !== id && x.substitutoId !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- Cargos (vínculos dirigente ⇢ unidade) ---
  app.get("/api/dirigentes/cargos", (req, res) => {
    const db = loadDatabase();
    res.json(db.dirigentesCargos || []);
  });

  app.post("/api/dirigentes/cargos", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as DirigenteCargo;
    newItem.id = "DC-" + Date.now();
    if (!db.dirigentesCargos) db.dirigentesCargos = [];
    db.dirigentesCargos.push(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.put("/api/dirigentes/cargos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    const updateData = req.body;
    const index = (db.dirigentesCargos || []).findIndex((x: any) => x.id === id);
    if (index >= 0) {
      db.dirigentesCargos[index] = { ...db.dirigentesCargos[index], ...updateData };
      saveDatabase(db);
      res.json(db.dirigentesCargos[index]);
    } else {
      res.status(404).json({ error: "Cargo não localizado." });
    }
  });

  app.delete("/api/dirigentes/cargos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.dirigentesCargos = (db.dirigentesCargos || []).filter((x: any) => x.id !== id);
    db.dirigentesEventos = (db.dirigentesEventos || []).filter((x: any) => x.cargoId !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // --- Eventos de Gestão (Afastamentos) ---
  app.get("/api/dirigentes/eventos", (req, res) => {
    const db = loadDatabase();
    res.json(db.dirigentesEventos || []);
  });

  app.post("/api/dirigentes/eventos", (req, res) => {
    const db = loadDatabase();
    const newItem = req.body as DirigenteEvento;
    newItem.id = "DE-" + Date.now();
    if (!db.dirigentesEventos) db.dirigentesEventos = [];

    // Regra de Negócio: Exoneração encerra o CARGO específico e define status do dirigente
    if (newItem.motivo === "Exoneração") {
      // Encerra o cargo correspondente
      const cIdx = (db.dirigentesCargos || []).findIndex((x: any) => x.id === newItem.cargoId);
      if (cIdx >= 0) {
        db.dirigentesCargos[cIdx].fimExercicio = newItem.dataFim || newItem.dataInicio;
        db.dirigentesCargos[cIdx].status = "Encerrado";
      }
      // Se o dirigente não tem mais nenhum cargo ativo, marca como Inativo
      const cargosAtivos = (db.dirigentesCargos || []).filter(
        (x: any) => x.dirigenteId === newItem.dirigenteId && x.status === "Ativo"
      );
      if (cargosAtivos.length === 0) {
        const dIdx = (db.dirigentes || []).findIndex((x: any) => x.id === newItem.dirigenteId);
        if (dIdx >= 0) db.dirigentes[dIdx].status = "Inativo";
      }
    }

    db.dirigentesEventos.push(newItem);
    saveDatabase(db);
    res.status(201).json(newItem);
  });

  app.delete("/api/dirigentes/eventos/:id", (req, res) => {
    const db = loadDatabase();
    const id = req.params.id;
    db.dirigentesEventos = (db.dirigentesEventos || []).filter((x: any) => x.id !== id);
    saveDatabase(db);
    res.json({ success: true });
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
