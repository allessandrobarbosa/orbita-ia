const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Inject imports if not present
if (!content.includes('import scdpRoutes')) {
  content = content.replace(
    'import tceRoutes from "./src/backend/routes/tceRoutes.js";',
    'import tceRoutes from "./src/backend/routes/tceRoutes.js";\nimport eticaRoutes from "./src/backend/routes/eticaRoutes.js";\nimport scdpRoutes from "./src/backend/routes/scdpRoutes.js";'
  );
}

// 2. Inject app.use if not present
if (!content.includes('app.use("/api", scdpRoutes)')) {
  content = content.replace(
    'app.use("/api", tceRoutes);',
    'app.use("/api", tceRoutes);\napp.use("/api", eticaRoutes);\napp.use("/api", scdpRoutes);'
  );
}

// Write it back to ensure we have the routes registered
fs.writeFileSync('server.ts', content);
console.log("Registered Etica and SCDP routes.");

// Now we need to start stripping out the old endpoints. 
// However, since it is very complex, we can use a simpler approach: finding the start and end indices of the blocks to delete.

// We will delete the block from `app.get("/api/etica/membros"` to the end of `app.post("/api/scdp/viagens/:id/confirm-gru"`
// Let's do a substring deletion.

const startStr = 'app.get("/api/etica/membros"';
const endStr = 'app.post("/api/scdp/viagens/:id/confirm-gru"';

const startIndex = content.indexOf(startStr);
const endIndexTemp = content.indexOf(endStr);

if (startIndex !== -1 && endIndexTemp !== -1) {
  // Find the closing bracket of the confirm-gru endpoint
  // We'll just look for the next router definition or a specific marker
  const afterEndStr = content.indexOf('app.', endIndexTemp + 20);
  
  if (afterEndStr !== -1) {
    const beforePart = content.substring(0, startIndex);
    const afterPart = content.substring(afterEndStr);
    content = beforePart + afterPart;
    fs.writeFileSync('server.ts', content);
    console.log("Deleted old Etica and SCDP endpoints successfully.");
  } else {
    console.log("Could not find the end of the SCDP block.");
  }
} else {
  console.log("Endpoints not found or already deleted.");
}
