const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Add import
if (!content.includes('rolLegacyRoutes')) {
  content = content.replace(
    'import viaturasRoutes from "./src/backend/routes/viaturasRoutes.js";',
    'import viaturasRoutes from "./src/backend/routes/viaturasRoutes.js";\nimport rolLegacyRoutes from "./src/backend/routes/rolLegacyRoutes.js";'
  );
}

// 2. Add app.use
if (!content.includes('app.use("/api/rol-responsaveis", rolLegacyRoutes);')) {
  content = content.replace(
    'app.use("/api", viaturasRoutes);',
    'app.use("/api", viaturasRoutes);\n  app.use("/api/rol-responsaveis", rolLegacyRoutes);'
  );
}

fs.writeFileSync('server.ts', content);
console.log("Injected rolLegacyRoutes");
