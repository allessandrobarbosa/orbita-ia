/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Estrutura de Extração Semântica IA
export interface AiAnalysisData {
  temDebitoFinanceiro?: boolean; // deprecated
  valoresRestituir?: string | null; // deprecated
  ha_ressarcimento?: boolean;
  dossieRessarcimento?: any[];
  recomendacoes: string[];
  determinacoes: string[];
  darCiencia: string[];
  determinaArquivamento: boolean;
}

// TCU Acórdão Demand Item (combining Government Data elements and Internal Action items)
export interface AcordaoDemand {
  // Fields from TCU's official data dictionary (as in image)
  KEY: string; // unique identifier
  TITULO: string; // TIPO NUMERO/ANO ATA NUMERO/ANO - COLEGIADO
  NUMACORDAO: number;
  ANOACORDAO: number;
  NUMATA: string; // ATA NUM/ANO
  COLEGIADO: string;
  DATASESSAO: string; // DD/MM/AAAA
  SITUACAO: string; // oficializado, sigiloso, etc.
  PROC: string; // processo
  ACORDAOSRELACIONADOS?: string;
  TIPOPROCESSO?: string;
  INTERESSADOS?: string;
  ENTIDADE?: string;
  UNIDADETECNICA?: string;
  RELATOR?: string;
  ASSUNTO?: string;
  SUMARIO?: string;
  ACORDAO?: string; // full text
  DECISAO?: string;
  RECOMENDACOES?: string;
  DETERMINACOES?: string;
  RECOMENDACOES_DETERMINACOES_UNIFICADO?: string;

  // Operational internal monitoring fields
  STATUS_MONITORAMENTO: 'Pendente' | 'Em Análise' | 'Cumprido' | 'Atrasado';
  RESPONSAVEL_INTERNO: string;
  PRAZO_LIMITE: string; // YYYY-MM-DD
  OBSERVACOES: string;
  ULTIMA_ATUALIZACAO: string; // YYYY-MM-DD HH:MM

  // AI Extracted Semantic Metadata
  aiAnalysisData?: AiAnalysisData;
}

// Rol de Responsáveis (IN 84 do TCU)
export interface RolResponsavel {
  id: string;
  nome: string;
  cpf: string; // Masked
  cargo: string;
  unidade: string;
  inicioExercicio: string; // YYYY-MM-DD
  fimExercicio: string; // YYYY-MM-DD or 'Vigente'
  atoNomeacao: string;
  status: 'Vigente' | 'Encerrado' | 'Suspenso';
  observacoes?: string;
}

// Comissão de Ética
export interface ComissaoEticaDemand {
  id: string;
  protocolo: string; // e.g. ETICA-2026-001
  dataClassificacao: string; // YYYY-MM-DD
  descricao: string;
  envolvidos: string;
  orgaoOrigem: string;
  relator: string;
  status: 'Triagem' | 'Apuração Preliminar' | 'Processo Ético' | 'Concluído' | 'Arquivado';
  recomendacoes?: string;
}

export interface EticaMembro {
  id: string;
  nome: string;
  cpf: string;
  atribuicao: 'Presidente' | 'Membro' | 'Secretária-Executiva';
  encargo: 'Titular' | 'Suplente';
  dispositivoLegal: string; // Portaria / Ato
  dataPublicacao: string; // YYYY-MM-DD
  dataInicioMandato: string; // YYYY-MM-DD (as requested by user to help calculate elapsed time)
  dataFimMandato: string; // YYYY-MM-DD (calculated or explicit absolute date)
  mandato: string; // ex: "3 anos", "1 ano e 40 dias"
  matricula: string;
  telefone: string;
  email: string;
  ativo: boolean; // soft delete / desativação
  ultimaAtualizacao?: string;
}

export interface EticaConvidado {
  nome: string;
  encargo: string;
  email: string;
  telefone: string;
}

export interface EticaReuniao {
  id: string;
  tipo: 'Ordinária' | 'Extraordinária';
  dataHora: string; // YYYY-MM-DDTHH:MM
  pauta: string;
  convidados: EticaConvidado[];
  confirmacoes: Record<string, 'Pendente' | 'Confirmado' | 'Recusado'>; // keyed by email
  notificadoAgendamento: boolean;
  notificadoLembrete: boolean;
  ultimaAtualizacao?: string;
}

export interface EticaAta {
  id: string; // Identical to reuniaoId (1:1)
  reuniaoId: string;
  relatos: string;
  decisoes: string;
  dataGeracao: string; // YYYY-MM-DD
  ultimaAtualizacao?: string;
}

export interface EticaProcesso {
  id: string;
  tipo: 'SECI' | 'Consulta' | 'Ético';
  processoSei: string; // e.g. "19973.100203/2026-11"
  dataInicio: string; // YYYY-MM-DD (for grouping by year)
  dataFim?: string; // YYYY-MM-DD
  resumo?: string; // SECI
  responsavel?: string; // SECI
  situacao: string; // SECI: "Deferido" | "Indeferido" | ... ; Ético: "Arquivado" | "Em Andamento"
  solicitante?: string; // Consulta
  assunto?: string; // Consulta
  ultimaAtualizacao?: string;
}


// Communications (Ofícios) Demand Item
export interface ComunicacaoDemand {
  KEY: string; // Unique identifier ofício
  COMUNICACAO: string; // Ofício name/code, e.g. "Ofício 066.981/2022"
  DESTINATARIO: string; // Destinatário entity
  CONTATO: string; // Contact person
  UNIDADE_EMITENTE: string; // Issuer unit, e.g. "SEPROC"
  PROCESSO: string; // Process number
  DATA_EXPEDICAO: string; // DD/MM/YYYY
  DATA_RESPOSTA: string; // DD/MM/YYYY or filled
  ANO: number; // Year extracted ofício (e.g. 2022, 2023, etc)
  CARECE_RESPOSTA?: boolean; // If this communication requires a response
  PRAZO_DIAS?: string; // Deadline in days
  RESPOSTA_ENVIADA_INTERNAMENTE?: boolean; // Manual flag for response sent
  UNIDADE_EXECUTORA?: string; // Executor Unit (SECI, AECI, etc.)
  PROCESSO_SEI?: string; // SEI process number
  DESTINACAO?: "ARQUIVAMENTO" | "RESPOSTA" | string; // Goal / target action of communication
  ULTIMA_ATUALIZACAO?: string; // Metadata time
}

// Superintendências Regionais (26 UF + DF)
export interface SuperintendenciaRegional {
  uf: string;
  capital: string;
  superintendente: string;
  cargo: string;
  endereco: string;
  contato: string;
  email: string;
  substituto?: string;
  emailSubstituto?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  demandasTCU: number;
  demandasCGU: number;
  demandasEtica?: number;
  statusGeral: 'Regular' | 'Atenção' | 'Crítico';
}

// Tomada de Contas Especial (TCE)
export interface TceDemand {
  id: string; // unique identifier (usually NUMERO_ANO_TCE)
  NUMERO_ANO_TCE: string; // "NUMERO/ANO(TCE)"
  PROCESSO_ADMINISTRATIVO: string; // "PROCESSO ADMINISTRATIVO"
  MOTIVO_INSTAURACAO: string; // "MOTIVO DA INSTAURAÇÃO"
  SUBMOTIVO_INSTAURACAO: string; // "SUBMOTIVO DA INSTAURAÇÃO"
  DEBITO_ORIGINAL: string; // "DEBITO ORIGINAL"
  DEBITO_ATUALIZADO: string; // "DEBITO ATUALIZADO COM JUROS"
  DATA_ATUALIZACAO_DEBITO: string; // "DATA DA ATUALIZAÇÃO DO DEBITO"
  ULTIMO_POSICIONAMENTO: string; // "ULTIMO POSICIONAMENTO SUPERVISOR"
  TC: string; // "TC"
  ESTADO_PROCESSO: string; // "ESTADO DO PROCESSO"
  SITUACAO_PROCESSO: string; // "SITUACAO DO PROCESSO"
  PRIMEIRO_JULGAMENTO: string; // "PRIMEIRO JULGAMENTO"
  ENCERRAMENTO: string; // "ENCERRAMENTO"
  NUMERO_SIAFI?: string; // "Nº SIAFI"
  SIAFI_RESSARCIDO?: boolean; // Mock for SIAFI status
  ANO: number; // For filtering, parsed from NUMERO_ANO_TCE
}

// TCE com Acórdão mapping
export interface TceAcordaoMapping {
  NUMERO_ANO_TCE: string;
  ACORDAO_KEY: string; // reference to the Acórdão (e.g. "1234/2023")
}

// CGU Demand Item
export interface CguDemand {
  idTarefa: string; // Id da Tarefa
  situacao: string; // Situação (e.g. Pendente, Em Análise, Cumprido, Atrasado)
  estado: string; // Estado
  tituloTarefa: string; // Título da Tarefa
  dataInicio: string; // Data de Início
  dataFim: string; // Data de Fim
  dataLimite: string; // Data Limite
  unidadeAuditada: string; // Unidade Auditada
  unidadesAuditoria: string; // Unidades de Auditoria
  textoMonitoramento: string; // Texto do Monitoramento
  providencia: string; // Providência
  tipoUltimaManifestacao: string; // Tipo da Última Manifestação
  textoUltimaManifestacao: string; // Texto da Última Manifestação
  dataUltimaManifestacao: string; // Data da Última Manifestação
  tipoUltimoPosicionamento: string; // Tipo do Último Posicionamento
  textoUltimoPosicionamento: string; // Texto do Último Posicionamento
  dataUltimoPosicionamento: string; // Data do Último Posicionamento
  categoria: string; // Categoria
  dataLimiteInicial: string; // Data Limite Inicial
  ano: number; // Parsed from Data de Início
  ultimaAtualizacao?: string; // YYYY-MM-DD HH:MM
}

// CGU Published Report Item
export interface CguPublishedReport {
  idTarefa: string; // Id da Tarefa
  tituloRelatorio: string; // Título do Relatório
  dataPublicacao: string; // Data de Publicação
  idAuditoria: string; // Id da Auditoria
  siglaUnidadeAuditada: string; // Sigla da Unidade Auditada
  nomeUnidadeAuditada: string; // Nome da Unidade Auditada
  siglaOrgaoSuperior: string; // Sigla do Órgão Superior
  nomeOrgaoSuperior: string; // Nome do Órgão Superior
  uf: string; // UF
  municipio: string; // Município
  tipoServico: string; // Tipo de Serviço
  linhaAcao: string; // Linha de Ação
  grupoAtividade: string; // Grupo de Atividade
  edicaoPrograma?: string; // Edição Programa Sorteio / FEF
  ultimaAtualizacao?: string; // YYYY-MM-DD HH:MM
}

// Interfaces para Gestão de Contratos e Consumo (SRTE)
export interface Contrato {
  id: string;
  srteId: string; // Referência para SuperintendenciaRegional.uf (ex: 'RJ', 'SP')
  numero: string; // Ex: '12/2024'
  tipo: string; // Ex: 'Vigilância', 'Limpeza', 'TI'
  fornecedor: string;
  valorTotal: number;
  valorMensal: number;
  inicioVigencia: string; // YYYY-MM-DD
  fimVigencia: string; // YYYY-MM-DD
  status: "Ativo" | "Encerrado" | "Suspenso";
  objeto: string;
}

export interface ContratoConsumoMensal {
  id: string;
  contratoId: string;
  mesAno: string; // MM/YYYY
  valor: number;
  variacao: number; // percentual de variação em relação ao mês anterior (ex: 5.4 ou -2.1)
}

// Interfaces para Gestão de Frota (SRTE)
export interface Viatura {
  id: string;
  srteId: string; // Referência para SuperintendenciaRegional.uf (ex: 'RJ', 'SP')
  placa: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  chassi: string;
  renavam: string;
  alocacao: "Fiscalização" | "Administração";
  kmAtual: number;
  proximaRevisaoKm: number;
  status: "Ativo" | "Manutenção" | "Inativo" | "Baixado";
  destinacaoBaixa?: string; // Preenchido se status for 'Baixado'
}

export interface ViaturaAbastecimento {
  id: string;
  viaturaId: string;
  data: string; // YYYY-MM-DD
  litros: number;
  km: number;
  custo: number;
}

export interface ViaturaManutencao {
  id: string;
  viaturaId: string;
  tipo: string; // Ex: 'Preventiva', 'Corretiva'
  data: string; // YYYY-MM-DD
  custo: number;
  kmManutencao: number;
  proximaRevisaoKm?: number;
}

// ======================================================
// Interfaces para Rol de Responsáveis (IN 84/2020 TCU)
// ======================================================

export interface UnidadeRol {
  id: string;
  nome: string;
  sigla: string;
}

// Dirigente = PESSOA (independente de cargo ou unidade)
export interface Dirigente {
  id: string;
  nome: string;
  cpf: string;   // Mascarado na UI (ex: XXX.848.518-XX)
  email: string;
  status: "Ativo" | "Inativo";
}

// DirigenteCargo = vínculo entre PESSOA e UNIDADE, com cargo e atos legais
// Um dirigente pode ter múltiplos cargos (titular em SE + substituto no GM)
export interface DirigenteCargo {
  id: string;
  dirigenteId: string;             // FK → Dirigente
  unidadeId: string;               // FK → UnidadeRol
  cargo: string;                   // ex: Ministro de Estado, Secretário-Executivo
  tipoVinculo: "Titular" | "Substituto Legal";  // como foi designado nesta unidade
  inicioExercicio: string;         // YYYY-MM-DD
  fimExercicio?: string;           // YYYY-MM-DD vazio = vigente
  atoNomeacao: string;             // Link DOU / Portaria de nomeação
  atoExoneracao?: string;          // Link DOU / Portaria de exoneração (quando encerrado)
  status: "Ativo" | "Encerrado";
}

export interface DirigenteEvento {
  id: string;
  dirigenteId: string;             // FK → Dirigente (Titular afastado)
  cargoId: string;                 // FK → DirigenteCargo (qual cargo está sendo substituído)
  dataInicio: string;              // YYYY-MM-DD
  dataFim: string;                 // YYYY-MM-DD
  motivo: "Férias" | "Licença Médica" | "Viagem Internacional" | "Exoneração";
  atoAutorizacao: string;          // Link DOU ou atestado médico
  substitutoId?: string;           // FK → Dirigente (substituto que assumiu)
}





