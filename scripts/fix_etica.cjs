const fs = require('fs');

let content = fs.readFileSync('src/backend/routes/eticaRoutes.ts', 'utf8');

if (!content.includes('/comissao-etica')) {
  content = content.replace(
    'router.get("/etica/membros"',
    'router.get("/comissao-etica", (req, res) => res.json([]));\n\nrouter.get("/etica/membros"'
  );
  fs.writeFileSync('src/backend/routes/eticaRoutes.ts', content);
  console.log("Injected fake comissao-etica endpoint");
} else {
  console.log("Already has comissao-etica");
}
