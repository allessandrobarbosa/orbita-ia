const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

if (!content.includes('app.use("/api", comunicacoesRoutes);')) {
  content = content.replace(
    'app.use("/api", acordaoRoutes);',
    'app.use("/api", acordaoRoutes);\n  app.use("/api", comunicacoesRoutes);'
  );
}

if (!content.includes('app.use("/api/rol", rolRoutes);')) {
  content = content.replace(
    'app.use("/api/rol-responsaveis", rolLegacyRoutes);',
    'app.use("/api/rol-responsaveis", rolLegacyRoutes);\n  app.use("/api/rol", rolRoutes);'
  );
}

fs.writeFileSync('server.ts', content);
console.log("Injected missing mounts!");
