import fetch from "node-fetch";

async function run() {
  const url = "https://pncp.gov.br/api/search/?q=00489828000155&tipos_documento=contrato&ordenacao=-data&pagina=1&tam_pagina=1";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    console.log("MGI Orgao ID:", data.items[0].orgao_id);
    console.log("MGI CNPJ:", data.items[0].orgao_cnpj);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
