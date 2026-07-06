const apiKey = "8fd64096fc8cd26664cab0cd1fbb053f";

async function run() {
  for (let page = 1; page <= 15; page++) {
    const query = new URLSearchParams({
      dataIdaDe: "01/01/2026",
      dataIdaAte: "31/01/2026",
      dataRetornoDe: "01/01/2026",
      dataRetornoAte: "31/01/2026",
      codigoOrgao: "40000",
      pagina: String(page)
    }).toString();
    const url = `https://api.portaldatransparencia.gov.br/api-de-dados/viagens?${query}`;
    try {
      const res = await fetch(url, { headers: { "chave-api-dados": apiKey } });
      const json = await res.json();
      if (!json || json.length === 0) break;
      const sarah = json.find(r => r.beneficiario?.nome?.includes("SARAH"));
      if (sarah) {
        console.log(`Found Sarah on page ${page}! Full record:`);
        console.log(JSON.stringify(sarah, null, 2));
        return;
      }
    } catch (err) {
      console.error("Failed on page", page, err);
    }
  }
  console.log("Sarah not found in the first 15 pages.");
}

run();
