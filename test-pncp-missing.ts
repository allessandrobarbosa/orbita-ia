import fetch from "node-fetch";

async function run() {
  const url = "https://pncp.gov.br/api/search/?orgaos=74549%7C33375&tipos_documento=contrato&pagina=1&tam_pagina=100&status=vigente";
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    console.log("Total PNCP:", data.items?.length);
    
    // Contagem de numero_controle_pncp duplicados
    const map = new Map();
    const duplicados = [];
    
    data.items?.forEach((item: any) => {
      const id = item.numero_controle_pncp || String(item.id || Date.now());
      if (map.has(id)) {
        duplicados.push(item);
      } else {
        map.set(id, item);
      }
    });
    
    console.log("Unicos:", map.size);
    console.log("Duplicados count:", duplicados.length);
    console.log("Exemplo de duplicado:", duplicados.length > 0 ? {
      numero_controle: duplicados[0].numero_controle_pncp,
      titulo: duplicados[0].title,
      orgao: duplicados[0].orgao_nome
    } : "Nenhum");

  } catch (err) {
    console.error(err);
  }
}
run();
