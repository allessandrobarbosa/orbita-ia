async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/scdp/viagens?forceRefresh=true", {
      method: "GET",
      headers: { "chave-api-dados": "invalid_key" }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text);
  } catch (e) {
    console.error(e);
  }
}
run();
