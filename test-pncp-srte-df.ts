import fetch from "node-fetch";

async function run() {
  const url = "https://pncp.gov.br/api/consulta/v1/orgaos/37115367001302";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    console.log("Orgao da SRTE DF:", data);
  } catch (err) {
    console.error(err);
  }
}
run();
