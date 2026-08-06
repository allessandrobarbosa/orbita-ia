import fetch from "node-fetch";

async function run() {
  const url = "https://pncp.gov.br/api/search/?q=SUPERINTENDENCIA+REGIONAL+DO+TRABALHO+DISTRITO+FEDERAL&tipos_documento=contrato&pagina=1&tam_pagina=10";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    console.log("Total:", data.items?.length);
    if (data.items?.length > 0) {
      data.items.slice(0, 3).forEach((item: any) => {
        console.log("Orgao:", item.orgao_nome, "CNPJ:", item.orgao_cnpj, "Orgao ID:", item.orgao_id);
      });
    }
  } catch (err) {
    console.error(err);
  }
}
run();
