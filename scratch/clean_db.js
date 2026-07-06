const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../data/orbita_db.json");

function isMteRelevant(record) {
  if (!record) return false;
  if (record.filteredOut) return false;
  
  const textToSearch = [
    record.ENTIDADE,
    record.INTERESSADOS,
    record.UNIDADETECNICA,
    record.ASSUNTO,
    record.SUMARIO,
    record.ACORDAO,
    record.DECISAO,
    record.TITULO,
    record.PROC
  ].filter(Boolean).join(" ").toLowerCase();

  return (
    textToSearch.includes("trabalho") ||
    textToSearch.includes("mte") ||
    textToSearch.includes("aeci") ||
    textToSearch.includes("srte")
  );
}

if (!fs.existsSync(DB_PATH)) {
  console.error("Database file not found at:", DB_PATH);
  process.exit(1);
}

try {
  const raw = fs.readFileSync(DB_PATH, "utf-8").replace(/^\uFEFF/, "");
  const data = JSON.parse(raw);
  
  const originalCount = data.acordaos ? data.acordaos.length : 0;
  
  if (data.acordaos) {
    data.acordaos = data.acordaos.filter(ac => {
      const relevant = isMteRelevant(ac);
      if (!relevant) {
        console.log(`Removing non-MTE Acórdão: ${ac.NUMACORDAO}/${ac.ANOACORDAO} (${ac.TITULO})`);
      }
      return relevant;
    });
  }
  
  const newCount = data.acordaos ? data.acordaos.length : 0;
  
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Success! Cleaned database. Removed ${originalCount - newCount} non-MTE acórdãos. Current count: ${newCount}`);
} catch (err) {
  console.error("Error cleaning database:", err);
}
