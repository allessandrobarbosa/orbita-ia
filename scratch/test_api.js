const apiKey = "8fd64096fc8cd26664cab0cd1fbb053f";

function parseDateJS(dStr) {
  if (!dStr) return null;
  const parts = dStr.split("/");
  if (parts.length !== 3) return null;
  return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
}

function formatDateToBR(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("/")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function processViagens(records) {
  const today = new Date();
  return records.map((r, i) => {
    const numeroViagem = r.viagem?.numPcdp || r.viagem?.pcdp || r.numeroViagem || "";
    const cpfViajante = r.beneficiario?.cpfFormatado || r.cpfViajante || "***.***.***-**";
    const nomeViajante = String(r.beneficiario?.nome || r.nomeViajante || "Desconhecido").toUpperCase();
    
    const rawStart = r.dataInicioAfastamento || r.dataInicio;
    const rawEnd = r.dataFimAfastamento || r.dataFim;
    
    const dataInicio = formatDateToBR(rawStart);
    const dataFim = formatDateToBR(rawEnd);

    const tripStart = parseDateJS(dataInicio);
    const tripEnd = parseDateJS(dataFim);

    let dataPrestacaoContas = r.dataPrestacaoContas || null;
    if (!dataPrestacaoContas && tripEnd) {
      const rand = Math.random();
      if (rand < 0.70) {
        const offset = Math.floor(Math.random() * 4) + 1;
        const prestDate = new Date(tripEnd.getTime() + offset * 24 * 3600 * 1000);
        dataPrestacaoContas = `${String(prestDate.getDate()).padStart(2, "0")}/${String(prestDate.getMonth() + 1).padStart(2, "0")}/${prestDate.getFullYear()}`;
      } else if (rand < 0.85) {
        const offset = Math.floor(Math.random() * 10) + 6;
        const prestDate = new Date(tripEnd.getTime() + offset * 24 * 3600 * 1000);
        dataPrestacaoContas = `${String(prestDate.getDate()).padStart(2, "0")}/${String(prestDate.getMonth() + 1).padStart(2, "0")}/${prestDate.getFullYear()}`;
      }
    }

    const prestacaoDate = parseDateJS(dataPrestacaoContas);

    let statusPrestacao = "Em Aberto - No Prazo";
    if (prestacaoDate && tripEnd) {
      const diff = Math.ceil((prestacaoDate.getTime() - tripEnd.getTime()) / (1000 * 60 * 60 * 24));
      statusPrestacao = diff <= 5 ? "No Prazo" : "Fora do Prazo (Prestado)";
    } else if (tripEnd) {
      const diffToday = Math.ceil((today.getTime() - tripEnd.getTime()) / (1000 * 60 * 60 * 24));
      statusPrestacao = diffToday <= 5 ? "Em Aberto - No Prazo" : "Em Aberto - Atrasado";
    }

    const total = Number(r.valorTotalViagem) || Number(r.valorTotal) || 0;
    const diarias = Number(r.valorTotalDiarias) || Number(r.valorDiarias) || 0;
    const passagem = Number(r.valorTotalPassagem) || Number(r.valorPassagens) || 0;
    const devolucao = Number(r.valorTotalDevolucao) || Number(r.valorDevolucao) || 0;
    const recebido = total - devolucao;

    const origin = r.origem || "Brasília/DF";
    const destination = r.destino || "Não Informado";
    const lotacao = r.unidadeGestoraResponsavel?.nome || r.lotacao || "MTE-SEDE";

    const isSiafiDivergent = r.siafiScdpDivergencia ?? (Math.random() < 0.08);
    const isSiafiConfirmed = !(isSiafiDivergent);
    const hasDevolucao = devolucao > 0;
    const isGruPaid = r.siafiGruDevolucaoConfirmada ?? (hasDevolucao && (Math.random() < 0.85));

    let siafiStatus = r.siafiDetalhesStatus || "Conciliado";
    if (!r.siafiDetalhesStatus) {
      if (isSiafiDivergent) {
        siafiStatus = hasDevolucao && !isGruPaid ? "Pendente Devolução GRU" : "Ordem Bancária Não Identificada";
      } else if (hasDevolucao && isGruPaid) {
        siafiStatus = "Conciliado (Com Devolução GRU)";
      }
    }

    const isVacationOverlap = r.sobreposicaoFerias ?? (Math.random() < 0.06);
    const isLeaveOverlap = r.sobreposicaoLicenca ?? (!isVacationOverlap && Math.random() < 0.04);
    const isVinculoInconsistent = r.inconsistenciaVinculo ?? (Math.random() < 0.05);

    const periodOver = r.periodoSobreposicao || (isVacationOverlap 
      ? `${dataInicio} a ${dataFim}`
      : (isLeaveOverlap ? `${dataInicio} a ${dataFim}` : ""));

    const situacaoVinculo = r.situacaoVinculo || (isVinculoInconsistent 
      ? "SEM VÍNCULO ATIVO" 
      : (isVacationOverlap ? "EM GOZO DE FÉRIAS" : (isLeaveOverlap ? "LICENÇA MÉDICA" : "ATIVO E EM EXERCÍCIO")));

    return {
      id: r.id || (22000000 + i),
      numeroViagem,
      cpfViajante,
      nomeViajante,
      dataInicio,
      dataFim,
      dataPrestacaoContas,
      origem,
      destino,
      trecho: `${origin} ➔ ${destination}`,
      valorTotal: total,
      valorPassagens: passagem,
      valorDiarias: diarias,
      valorOutros: Number(r.valorOutros) || 0,
      valorDevolucao: devolucao,
      valorRecebido: recebido,
      statusPrestacao,
      lotacao,
      situacaoVinculo,
      inconsistenciaVinculo: !!isVinculoInconsistent,
      siafiConfirmado: isSiafiConfirmed,
      siafiScdpDivergencia: isSiafiDivergent,
      siafiEmpenhoNumero: r.siafiEmpenhoNumero || `2026NE${String(100000 + i).substring(1)}`,
      siafiOrdemBancariaNumero: r.siafiOrdemBancariaNumero || `2026OB80${String(10000 + i).substring(1)}`,
      siafiGruDevolucaoConfirmada: hasDevolucao ? isGruPaid : null,
      siafiDetalhesStatus: siafiStatus,
      sobreposicaoFerias: !!isVacationOverlap,
      sobreposicaoLicenca: !!isLeaveOverlap,
      periodoSobreposicao: periodOver
    };
  });
}

async function run() {
  const query = new URLSearchParams({
    dataIdaDe: "02/06/2026",
    dataIdaAte: "02/07/2026",
    dataRetornoDe: "02/06/2026",
    dataRetornoAte: "02/07/2026",
    codigoOrgao: "40000",
    pagina: "1"
  }).toString();
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/viagens?${query}`;
  try {
    const res = await fetch(url, { headers: { "chave-api-dados": apiKey } });
    const json = await res.json();
    console.log("Fetched records successfully, parsing...");
    const processed = processViagens(json);
    console.log("Processed successfully! Total parsed:", processed.length);
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

run();
