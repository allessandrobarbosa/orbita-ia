import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject the new route imports
imports = """import cguRoutes from "./src/backend/routes/cguRoutes.js";
import superintendenciasRoutes from "./src/backend/routes/superintendenciasRoutes.js";
import contratosRoutes from "./src/backend/routes/contratosRoutes.js";
import viaturasRoutes from "./src/backend/routes/viaturasRoutes.js";
import dashboardRoutes from "./src/backend/routes/dashboardRoutes.js";"""

if 'import contratosRoutes' not in content:
    content = content.replace(
        'import superintendenciasRoutes from "./src/backend/routes/superintendenciasRoutes.js";',
        imports
    )

# 2. Inject app.use
uses = """  app.use("/api", cguRoutes);
  app.use("/api", superintendenciasRoutes);
  app.use("/api", contratosRoutes);
  app.use("/api", viaturasRoutes);
  app.use("/api", dashboardRoutes);"""

if 'app.use("/api", contratosRoutes);' not in content:
    content = content.replace(
        '  app.use("/api", cguRoutes);\n  app.use("/api", superintendenciasRoutes);',
        uses
    )

# 3. Delete the remaining routes
endpoints = [
  "/api/dashboard-stats",
  "/api/contratos",
  "/api/contratos/srte/:uf",
  "/api/contratos/:id",
  "/api/contratos/:id/consumo",
  "/api/contratos/consumo/:id",
  "/api/viaturas",
  "/api/viaturas/srte/:uf",
  "/api/viaturas/:id",
  "/api/viaturas/:id/abastecimentos",
  "/api/viaturas/:id/manutencoes"
]

for path in endpoints:
    escaped = re.escape(path)
    pattern = r'app\.(get|post|put|delete)\("' + escaped + r'".*?(?=\n\s*app\.(get|post|put|delete)\(|\n\s*// ===|\n\s*if \(process\.env)'
    content = re.sub(pattern, '', content, flags=re.DOTALL)

# 4. Remove loadDatabase, saveDatabase, migrateProcessTypes, getSiapeAndEmail, parseCsvStream, downloadTempCsv, isMteRelevant, extractDeadlineWithAI, seed imports...
# To be safe, we'll just delete from "function migrateProcessTypes" to "function startServer"
start_idx = content.find('function migrateProcessTypes')
end_idx = content.find('async function startServer')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + "\n" + content[end_idx:]

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished final clean up of server.ts")
