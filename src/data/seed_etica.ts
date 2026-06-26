import { EticaMembro, EticaReuniao, EticaAta, EticaProcesso } from "../types";

export const SEED_ETICA_MEMBROS: EticaMembro[] = [
  {
    id: "MEM-001",
    nome: "Alessandro Barbosa Lourenço",
    cpf: "111.222.333-44",
    atribuicao: "Presidente",
    encargo: "Titular",
    dispositivoLegal: "Portaria MTE nº 104/2024",
    dataPublicacao: "2024-05-15",
    dataInicioMandato: "2024-05-15",
    dataFimMandato: "2027-05-15",
    mandato: "3 anos",
    matricula: "AECI-8409-G",
    telefone: "(61) 98765-4321",
    email: "alessandro.lourenco@trabalho.gov.br",
    ativo: true,
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "MEM-002",
    nome: "Maria Eunice Ramos",
    cpf: "222.333.444-55",
    atribuicao: "Membro",
    encargo: "Titular",
    dispositivoLegal: "Portaria MTE nº 104/2024",
    dataPublicacao: "2024-05-15",
    dataInicioMandato: "2024-05-15",
    dataFimMandato: "2026-05-15", // Mandato expirado há 1 mês
    mandato: "2 anos",
    matricula: "AECI-3301-A",
    telefone: "(61) 98888-1111",
    email: "maria.ramos@trabalho.gov.br",
    ativo: true,
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "MEM-003",
    nome: "Carlos Henrique Santos",
    cpf: "333.444.555-66",
    atribuicao: "Membro",
    encargo: "Suplente",
    dispositivoLegal: "Portaria MTE nº 205/2025",
    dataPublicacao: "2025-02-10",
    dataInicioMandato: "2025-02-10",
    dataFimMandato: "2027-02-10",
    mandato: "2 anos",
    matricula: "AECI-1029-F",
    telefone: "(61) 99111-2222",
    email: "carlos.henrique@trabalho.gov.br",
    ativo: true,
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "MEM-004",
    nome: "Ana Lúcia Rezende",
    cpf: "444.555.666-77",
    atribuicao: "Secretária-Executiva",
    encargo: "Titular",
    dispositivoLegal: "Portaria MTE nº 412/2025",
    dataPublicacao: "2025-08-01",
    dataInicioMandato: "2025-08-01",
    dataFimMandato: "2027-01-28", // 1 ano e 180 dias a partir de 01/08/2025
    mandato: "1 ano e 180 dias",
    matricula: "AECI-7744-X",
    telefone: "(61) 99333-4444",
    email: "ana.rezende@trabalho.gov.br",
    ativo: true,
    ultimaAtualizacao: "26/06/2026 10:00"
  }
];

export const SEED_ETICA_REUNIOES: EticaReuniao[] = [
  {
    id: "REU-001",
    tipo: "Ordinária",
    dataHora: "2026-07-10T14:30",
    pauta: "Julgamento de processos SECI pendentes, homologação de consultas e planejamento das campanhas de integridade no âmbito das Superintendências Regionais do Trabalho.",
    convidados: [
      {
        nome: "Alessandro Barbosa Lourenço",
        encargo: "Presidente",
        email: "alessandro.lourenco@trabalho.gov.br",
        telefone: "(61) 98765-4321"
      },
      {
        nome: "Maria Eunice Ramos",
        encargo: "Membro",
        email: "maria.ramos@trabalho.gov.br",
        telefone: "(61) 98888-1111"
      },
      {
        nome: "Ana Lúcia Rezende",
        encargo: "Secretária-Executiva",
        email: "ana.rezende@trabalho.gov.br",
        telefone: "(61) 99333-4444"
      },
      {
        nome: "Dr. Roberto de Almeida (Convidado Externo)",
        encargo: "Palestrante / Assessor",
        email: "roberto.almeida@cgu.gov.br",
        telefone: "(61) 99999-5555"
      }
    ],
    confirmacoes: {
      "alessandro.lourenco@trabalho.gov.br": "Confirmado",
      "maria.ramos@trabalho.gov.br": "Confirmado",
      "ana.rezende@trabalho.gov.br": "Confirmado",
      "roberto.almeida@cgu.gov.br": "Pendente"
    },
    notificadoAgendamento: true,
    notificadoLembrete: false,
    ultimaAtualizacao: "26/06/2026 10:00"
  }
];

export const SEED_ETICA_ATAS: EticaAta[] = [
  {
    id: "REU-001",
    reuniaoId: "REU-001",
    relatos: "Aos dez dias do mês de julho de 2026, reuniu-se ordinariamente a Comissão de Ética do Ministério do Trabalho e Emprego. O Presidente iniciou os trabalhos dando as boas-vindas a todos e submetendo a pauta sobre prevenção a conflitos de interesse ao escrutínio da mesa. Discutiu-se a necessidade de intensificar campanhas de conscientização nas SRTEs.",
    decisoes: "Deliberou-se, por unanimidade, pela aprovação do voto da relatora Maria Eunice Ramos no âmbito do processo SECI 19973.102345/2026-88. Determinou-se o agendamento de palestra com a CGU para o mês subsequente.",
    dataGeracao: "2026-07-10",
    ultimaAtualizacao: "26/06/2026 10:00"
  }
];

export const SEED_ETICA_PROCESSOS: EticaProcesso[] = [
  {
    id: "PRC-001",
    tipo: "SECI",
    processoSei: "19973.102345/2026-88",
    dataInicio: "2026-06-20", // 6 dias atrás (SLA ok)
    resumo: "Consulta sobre exercício de docência concomitante em instituição de ensino privada de âmbito regional.",
    responsavel: "Maria Eunice Ramos",
    situacao: "Deferido",
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "PRC-002",
    tipo: "SECI",
    processoSei: "19973.102456/2026-99",
    dataInicio: "2026-06-25", // 1 dia atrás (SLA ok)
    resumo: "Pedido de autorização para exercer atividade privada de consultoria estratégica em análise de mercado de trabalho.",
    responsavel: "Alessandro Barbosa Lourenço",
    situacao: "Em Análise",
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "PRC-003",
    tipo: "SECI",
    processoSei: "19973.100999/2026-22",
    dataInicio: "2026-06-01", // 25 dias atrás (SLA Estourado!)
    resumo: "Consulta sobre liberação para ministrar palestra remunerada contratada por concessionária de serviço público federal.",
    responsavel: "Carlos Henrique Santos",
    situacao: "Em Análise",
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "PRC-004",
    tipo: "Consulta",
    processoSei: "19973.200111/2026-15",
    dataInicio: "2026-04-10",
    dataFim: "2026-04-20",
    solicitante: "Superintendência Regional do Trabalho de São Paulo (SRTb-SP)",
    assunto: "Consulta sobre recebimento de brindes corporativos e materiais promocionais em feiras institucionais por auditores fiscais.",
    situacao: "Respondida",
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "PRC-005",
    tipo: "Ético",
    processoSei: "19973.300555/2026-01",
    dataInicio: "2026-05-02",
    situacao: "Em Andamento",
    ultimaAtualizacao: "26/06/2026 10:00"
  },
  {
    id: "PRC-006",
    tipo: "Ético",
    processoSei: "19973.300122/2025-99",
    dataInicio: "2025-11-12",
    dataFim: "2025-12-18",
    situacao: "Arquivado",
    ultimaAtualizacao: "26/06/2026 10:00"
  }
];
