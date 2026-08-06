import fetch from "node-fetch";
import fs from "fs";

async function run() {
  const url = "https://pncp.gov.br/api/search/?orgaos=74549%7C33375&tipos_documento=contrato&pagina=1&tam_pagina=2&status=vigente";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    fs.writeFileSync("pncp_response.json", JSON.stringify(data, null, 2));
    console.log("Salvo em pncp_response.json");
  } catch (err) {
    console.error(err);
  }
}
run();
