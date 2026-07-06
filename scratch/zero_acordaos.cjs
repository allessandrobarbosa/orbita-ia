const fs = require("fs");
const path = require("path");

const DB_PATHS = [
  path.join(__dirname, "../data/orbita_db.json"),
  path.join(__dirname, "../orbita-ia/data/orbita_db.json")
];

for (const dbPath of DB_PATHS) {
  if (!fs.existsSync(dbPath)) {
    console.log("Database file not found at:", dbPath);
    continue;
  }

  try {
    const raw = fs.readFileSync(dbPath, "utf-8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw);
    
    const originalCount = data.acordaos ? data.acordaos.length : 0;
    
    data.acordaos = [];
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`Success for ${dbPath}! Zeroed acordaos array (removed ${originalCount} items).`);
  } catch (err) {
    console.error("Error clearing acordaos at " + dbPath + ":", err);
  }
}
