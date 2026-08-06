import fetch from "node-fetch";

const CHAVE_API_DADOS = "8fd64096fc8cd26664cab0cd1fbb053f";

export interface TransparenciaContrato {
  id: number;
  numero: string;
  objeto: string;
  dataInicioVigencia: string;
  dataFimVigencia: string;
  valorInicial: string;
  valorFinal: string;
  fornecedor: {
    cnpjFormatado: string;
    nome: string;
  };
  orgaoSuperior: {
    codigoSIAFI: string;
    nome: string;
  };
}

export interface PncpContrato {
  id: string;
  numeroContrato: string;
  anoContrato: number;
  receitaDespesa: string;
  objeto: string;
  uf: string;
  dataAssinatura: string;
  dataInicioVigencia: string;
  dataFimVigencia: string;
  valorInicial: number;
  valorGlobal: number;
  fornecedorNome: string;
  fornecedorCnpjCpf: string;
  orgaoEntidade: {
    cnpj: string;
    razaoSocial: string;
  };
  unidadeOrcamentaria: {
    codigoUnidade: string;
    nomeUnidade: string;
  };
}

export async function fetchContratosTransparencia(codigoSiafiOrgao: string = "38000", pagina: number = 1): Promise<TransparenciaContrato[]> {
  try {
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/contratos?codigoOrgao=${codigoSiafiOrgao}&pagina=${pagina}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "chave-api-dados": CHAVE_API_DADOS,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Portal da Transparência: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TransparenciaContrato[];
  } catch (error) {
    console.error("Erro ao buscar contratos na Transparência:", error);
    return [];
  }
}

export async function fetchContratosPncp(termoBusca: string = "37115367000160", tipoBusca: 'q' | 'orgaos' = 'q'): Promise<PncpContrato[]> {
  try {
    let allItems: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const queryEncoded = encodeURIComponent(termoBusca).replace(/%20/g, '+');
      const param = tipoBusca === 'orgaos' ? `orgaos=${queryEncoded}` : `q=${queryEncoded}`;
      const url = `https://pncp.gov.br/api/search/?${param}&tipos_documento=contrato&ordenacao=-data&pagina=${currentPage}&tam_pagina=50&status=vigente`;
      let response: any;
      let attempt = 0;
      const maxAttempts = 5;
      let success = false;
      
      while (attempt < maxAttempts) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
          response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" },
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (response.ok) {
            success = true;
            break;
          }
          attempt++;
          await new Promise(res => setTimeout(res, 3000 * attempt));
        } catch (e: any) {
          clearTimeout(timeout);
          attempt++;
          await new Promise(res => setTimeout(res, 3000 * attempt));
        }
      }

      if (!success) {
        console.warn(`[PNCP] Falha ao buscar página ${currentPage} de ${termoBusca}. Retornando contratos obtidos até o momento.`);
        break; // Sai do loop e retorna allItems que já conseguiu
      }

      const data = await response.json() as any;
      const items = data.items || [];
      allItems = allItems.concat(items);
      
      const totalRegistros = data.total || 0;
      totalPages = Math.ceil(totalRegistros / 50);
      currentPage++;

      // Limite de segurança para evitar loops infinitos (20 páginas)
      if (currentPage > 20) break;
      
    } while (currentPage <= totalPages);
    
    // Mapeia o retorno da API de Busca para a nossa interface interna
    return allItems.map((item: any) => ({
      id: item.numero_controle_pncp || String(item.id || Date.now()),
      numeroContrato: item.title ? item.title.replace("Contrato nº ", "") : "S/N",
      anoContrato: item.ano || item.data_assinatura?.split('-')[0],
      receitaDespesa: "Despesa",
      objeto: item.description || "",
      uf: item.uf || "DF",
      dataAssinatura: item.data_assinatura,
      dataInicioVigencia: item.data_inicio_vigencia,
      dataFimVigencia: item.data_fim_vigencia,
      valorInicial: item.valor_global,
      valorGlobal: item.valor_global,
      fornecedorNome: "Buscando...",
      fornecedorCnpjCpf: "",
      unidadeOrcamentaria: {
        codigoUnidade: item.unidade_codigo || "",
        nomeUnidade: item.unidade_nome || item.orgao_nome || ""
      },
      orgaoEntidade: {
        cnpj: item.orgao_cnpj || (tipoBusca === 'q' ? termoBusca : ""),
        razaoSocial: item.orgao_nome || ""
      },
      numero_sequencial: item.numero_sequencial
    }));

  } catch (error) {
    console.error(`Erro ao buscar contratos (Busca: ${termoBusca}):`, error);
    return [];
  }
}

export async function fetchDetalheContratoPncp(cnpjOrgao: string, ano: string, sequencial: string): Promise<{nome: string, cnpj: string}> {
  try {
    const url = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpjOrgao}/contratos/${ano}/${sequencial}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) return { nome: "Não informado", cnpj: "" };
    const data = await response.json() as any;
    return {
      nome: data.nomeRazaoSocialFornecedor || "Não informado",
      cnpj: data.niFornecedor || ""
    };
  } catch (e) {
    return { nome: "Erro ao buscar fornecedor", cnpj: "" };
  }
}
function extractUf(nome: string): string {
  const ufMatches = nome.match(/NO ESTADO D[OEA]\s+([A-Z]{2})\b/i) || nome.match(/\b([A-Z]{2})\b/);
  if (ufMatches && ufMatches[1] && ufMatches[1].length === 2 && ufMatches[1].toUpperCase() !== 'DO' && ufMatches[1].toUpperCase() !== 'DA') {
    return ufMatches[1].toUpperCase();
  }
  return "DF";
}
