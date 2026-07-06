const apiKey = "8fd64096fc8cd26664cab0cd1fbb053f";

async function run() {
  const query = new URLSearchParams({
    dataIdaDe: "01/01/2026",
    dataIdaAte: "31/01/2026",
    dataRetornoDe: "01/01/2026",
    dataRetornoAte: "31/01/2026",
    codigoOrgao: "40000",
    pagina: "1"
  }).toString();
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/viagens?${query}`;
  try {
    const res = await fetch(url, { headers: { "chave-api-dados": apiKey } });
    const json = await res.json();
    const sarah = json.find(r => r.beneficiario?.nome?.includes("SARAH"));
    if (sarah) {
      console.log("Found Sarah! Full record:");
      console.log(JSON.stringify(sarah, null, 2));
    } else {
      console.log("Sarah not found on page 1. Printing first record instead:");
      console.log(JSON.stringify(json[0], null, 2));
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
