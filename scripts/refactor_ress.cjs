const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const ressOld = `    const db = loadDatabase();
    const idx = db.acordaos.findIndex((x: any) => x.KEY === key);
    if (idx !== -1) {
      const gruDoc = relatedDocs.find((d: any) => d.fase.includes("Recolhimento") || d.documento.includes("GRU"));
      if (gruDoc) {
        db.acordaos[idx].STATUS_MONITORAMENTO = "Cumprido";
        db.acordaos[idx].PRAZO_LIMITE = ""; 
        db.acordaos[idx].OBSERVACOES = \`[Conciliado via Portal da Transparência]: Ressarcimento comprovado através do documento \${gruDoc.documento} no valor de R$ \${Number(gruDoc.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em \${gruDoc.data}.\`;
        db.acordaos[idx].ULTIMA_ATUALIZACAO = new Date().toLocaleString("pt-BR");
        saveDatabase(db);
      }
    }`;

const ressNew = `    const gruDoc = relatedDocs.find((d: any) => d.fase.includes("Recolhimento") || d.documento.includes("GRU"));
    if (gruDoc) {
      const obs = \`[Conciliado via Portal da Transparência]: Ressarcimento comprovado através do documento \${gruDoc.documento} no valor de R$ \${Number(gruDoc.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em \${gruDoc.data}.\`;
      await pool.query(
        "UPDATE acordaos SET status_monitoramento = $1, prazo_limite = $2, observacoes = $3, ultima_atualizacao = $4 WHERE key = $5",
        ["Cumprido", "", obs, new Date().toLocaleString("pt-BR"), key]
      );
    }`;

content = content.replace(ressOld, ressNew);

fs.writeFileSync('server.ts', content);
console.log("Replaced verificar-ressarcimento endpoint logic in server.ts");
