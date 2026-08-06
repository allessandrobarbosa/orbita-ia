import fetch from "node-fetch";
import fs from "fs";

async function run() {
  const url = "https://pncp.gov.br/api/search/?q=&tipos_documento=contrato&ordenacao=-data&pagina=1&tam_pagina=2&orgaos=33375&status=vigente";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    fs.writeFileSync("pncp-search-result.json", JSON.stringify(data, null, 2));
    console.log("Saved to pncp-search-result.json");
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
