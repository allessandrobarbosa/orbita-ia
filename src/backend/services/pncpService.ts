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

export async function fetchContratosPncpPorUG(cnpjOrgao: string, codigoUg: string): Promise<PncpContrato[]> {
  try {
    let allItems: any[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const orgaoEncoded = encodeURIComponent(cnpjOrgao).replace(/%20/g, '+');
      const ugEncoded = encodeURIComponent(codigoUg).replace(/%20/g, '+');
      
      // Busca combinada: orgaos={cnpj} e q={ug} otimiza a indexação do PNCP
      const url = `https://pncp.gov.br/api/search/?orgaos=${orgaoEncoded}&q=${ugEncoded}&tipos_documento=contrato&ordenacao=-data&pagina=${currentPage}&tam_pagina=50&status=vigente`;
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
        console.warn(`[PNCP] Falha ao buscar página ${currentPage} da UG ${codigoUg}. Retornando contratos obtidos até o momento.`);
        break;
      }

      const data = await response.json() as any;
      const items = data.items || [];
      
      // Filtro rigoroso local para garantir que a UG seja exatamente a solicitada,
      // pois o parâmetro 'q' é de busca livre e pode trazer falsos positivos.
      const itensFiltrados = items.filter((item: any) => String(item.unidade_codigo) === String(codigoUg));
      allItems = allItems.concat(itensFiltrados);
      
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
        cnpj: item.orgao_cnpj || cnpjOrgao,
        razaoSocial: item.orgao_nome || ""
      },
      numero_sequencial: item.numero_sequencial
    }));

  } catch (error) {
    console.error(`Erro ao buscar contratos (Órgão: ${cnpjOrgao}, UG: ${codigoUg}):`, error);
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

export const UgsMte = [
  { nome: "MTE-SEDE", codigo: "400045" },
  { nome: "SRTE/AC", codigo: "400060" },
  { nome: "SRTE/AL", codigo: "400061" },
  { nome: "SRTE/AP", codigo: "400086" },
  { nome: "SRTE/AM", codigo: "400062" },
  { nome: "SRTE/BA", codigo: "400063" },
  { nome: "SRTE/CE", codigo: "400064" },
  { nome: "SRTE/DF", codigo: "400065" },
  { nome: "SRTE/ES", codigo: "400066" },
  { nome: "SRTE/GO", codigo: "400067" },
  { nome: "SRTE/MA", codigo: "400069" },
  { nome: "SRTE/MT", codigo: "400068" },
  { nome: "SRTE/MS", codigo: "400070" },
  { nome: "SRTE/MG", codigo: "400071" },
  { nome: "SRTE/PA", codigo: "400073" },
  { nome: "SRTE/PB", codigo: "400075" },
  { nome: "SRTE/PE", codigo: "400072" },
  { nome: "SRTE/PI", codigo: "400085" },
  { nome: "SRTE/PR", codigo: "400074" },
  { nome: "SRTE/RJ", codigo: "400077" },
  { nome: "SRTE/RN", codigo: "400078" },
  { nome: "SRTE/RS", codigo: "400079" },
  { nome: "SRTE/RO", codigo: "400080" },
  { nome: "SRTE/RR", codigo: "400087" },
  { nome: "SRTE/SC", codigo: "400081" },
  { nome: "SRTE/SP", codigo: "400082" },
  { nome: "SRTE/SE", codigo: "400083" },
  { nome: "SRTE/TO", codigo: "400084" }
];

export async function fetchAllContratosMte(): Promise<PncpContrato[]> {
  // O parâmetro 'orgaos' na API de busca (search) do PNCP espera o ID interno do órgão, não o CNPJ!
  const pncpIdsMte = "74549|33375";
  let todosContratos: PncpContrato[] = [];

  console.log(`Iniciando busca centralizada de TODOS os contratos do MTE (IDs PNCP: ${pncpIdsMte})...`);

  try {
    // 1. Busca todos os contratos vigentes do MTE de uma única vez no PNCP
    const todosContratosMte = await fetchContratosPncp(pncpIdsMte, "orgaos");
    console.log(`> O PNCP retornou ${todosContratosMte.length} contratos vigentes para o MTE inteiro.`);

    // 2. Filtra e categoriza pelas nossas 28 UGs em memória (MUITO MAIS RÁPIDO E CONFIÁVEL)
    for (const ug of UgsMte) {
      const contratosDaUg = todosContratosMte.filter(c => String(c.unidadeOrcamentaria?.codigoUnidade) === String(ug.codigo));
      
      if (contratosDaUg.length > 0) {
        const contratosAjustados = contratosDaUg.map(contrato => {
          contrato.unidadeOrcamentaria.nomeUnidade = ug.nome;
          return contrato;
        });
        todosContratos = todosContratos.concat(contratosAjustados);
        console.log(`> Encontrados ${contratosAjustados.length} contratos para a UG: ${ug.nome} (${ug.codigo}).`);
      } else {
        console.log(`> Nenhum contrato vigente listado para a UG: ${ug.nome} (${ug.codigo}).`);
      }
    }
  } catch (e) {
    console.error(`Erro ao buscar lote completo do MTE:`, e);
  }

  console.log(`Busca concluída! Total de contratos retidos (pertencentes às UGs da lista): ${todosContratos.length}`);
  return todosContratos;
}

export async function fetchAllContratosSraParaMte(): Promise<PncpContrato[]> {
  const cnpjMgi = "00489828000155";
  let contratosValidos: PncpContrato[] = [];

  console.log(`Iniciando busca de contratos geridos pelas SRAs do MGI (CNPJ ${cnpjMgi}) para o MTE...`);

  try {
    // Busca contratos usando o CNPJ do MGI como termo de busca livre (q)
    // Isso evita o erro de ID interno e busca todas as menções a este órgão
    const contratosMgi = await fetchContratosPncp(cnpjMgi, "q");
    console.log(`> A busca livre pelo CNPJ do MGI retornou ${contratosMgi.length} resultados.`);

    // Palavras-chave que indicam que o contrato, gerido pelo MGI, pertence ao MTE
    const palavrasChaveMte = ["SRTE", "MINISTERIO DO TRABALHO", "TRABALHO E EMPREGO", "SUPERINTENDENCIA REGIONAL DO TRABALHO"];

    for (const contrato of contratosMgi) {
      const objeto = (contrato.objeto || "").toUpperCase();
      const nomeUnidade = (contrato.unidadeOrcamentaria?.nomeUnidade || "").toUpperCase();
      
      // Verifica se o contrato menciona o MTE/SRTE
      const pertenceAoMte = palavrasChaveMte.some(palavra => objeto.includes(palavra) || nomeUnidade.includes(palavra));

      if (pertenceAoMte) {
        // Tenta descobrir o estado baseado na sigla SRA/UF ou SRTE/UF no texto
        let ufContrato = "DF";
        const ufMatch = objeto.match(/SRTE[\/\-\s]([A-Z]{2})/i) || nomeUnidade.match(/SRA[\/\-\s]([A-Z]{2})/i);
        
        if (ufMatch && ufMatch[1]) {
           ufContrato = ufMatch[1].toUpperCase();
        }

        // Renomeia a unidade orçamentária para ficar claro no painel que é um contrato da SRA
        contrato.unidadeOrcamentaria = contrato.unidadeOrcamentaria || {};
        contrato.unidadeOrcamentaria.nomeUnidade = `SRA/${ufContrato} (MGI p/ MTE)`;
        
        contratosValidos.push(contrato);
      }
    }

    console.log(`> Filtragem concluída: ${contratosValidos.length} contratos do MGI foram identificados como sendo para SRTEs.`);
  } catch (e) {
    console.error(`Erro ao buscar contratos da SRA/MGI:`, e);
  }

  return contratosValidos;
}
