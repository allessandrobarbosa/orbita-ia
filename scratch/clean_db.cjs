const fs = require("fs");
const path = require("path");

const DB_PATHS = [
  path.join(__dirname, "../data/orbita_db.json"),
  path.join(__dirname, "../orbita-ia/data/orbita_db.json")
];

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

for (const dbPath of DB_PATHS) {
  if (!fs.existsSync(dbPath)) {
    console.log("Database file not found at:", dbPath);
    continue;
  }

  try {
    const raw = fs.readFileSync(dbPath, "utf-8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);
    
    const originalCount = data.acordaos ? data.acordaos.length : 0;
    
    if (data.acordaos) {
      data.acordaos = data.acordaos.filter(ac => {
        return isMteRelevant(ac);
      });
    }
    
    const newCount = data.acordaos ? data.acordaos.length : 0;
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Success for ${dbPath}! Removed ${originalCount - newCount} non-MTE acórdãos. Current count: ${newCount}`);
  } catch (err) {
    console.error("Error cleaning database at " + dbPath + ":", err);
  }
}
