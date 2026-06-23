/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

  // Operational internal monitoring fields
  STATUS_MONITORAMENTO: 'Pendente' | 'Em Análise' | 'Cumprido' | 'Atrasado';
  RESPONSAVEL_INTERNO: string;
  PRAZO_LIMITE: string; // YYYY-MM-DD
  OBSERVACOES: string;
  ULTIMA_ATUALIZACAO: string; // YYYY-MM-DD HH:MM
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
  demandasTCU: number;
  demandasCGU: number;
  demandasEtica: number;
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
  ANO: number; // For filtering, parsed from NUMERO_ANO_TCE
}

// TCE com Acórdão mapping
export interface TceAcordaoMapping {
  NUMERO_ANO_TCE: string;
  ACORDAO_REF: string; // reference to the Acórdão (e.g. "1234/2023")
}

