const apiKey = "8fd64096fc8cd26664cab0cd1fbb053f";

async function test() {
  const url = `https://api.portaldatransparencia.gov.br/api-de-dados/servidores?orgaoServidorLotacao=38000&pagina=1`;
  try {
    const res = await fetch(url, {
      headers: { "chave-api-dados": apiKey }
    });
    const json = await res.json();
    console.log("Full First Record:", JSON.stringify(json[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
