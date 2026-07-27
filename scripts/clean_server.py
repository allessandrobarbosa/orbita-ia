import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

endpoints = [
  "/api/rol-responsaveis",
  "/api/acordaos",
  "/api/acordaos/update",
  "/api/acordaos/:key",
  "/api/tces",
  "/api/tces/update",
  "/api/tces/:id",
  "/api/webhooks/importacao",
  "/api/tces/import",
  "/api/tce-mappings",
  "/api/tce-mappings/import",
  "/api/cgu",
  "/api/cgu/update",
  "/api/cgu/:id",
  "/api/cgu/import",
  "/api/cgu/reports",
  "/api/cgu/reports/:idTarefa",
  "/api/cgu/reports/import",
  "/api/cgu/reports/pdf/:idTarefa",
  "/api/cgu/reports/sync",
  "/api/acordaos/import",
  "/api/acordaos/sync-local",
  "/api/acordaos/verificar-ressarcimento-favorecido",
  "/api/acordaos/verificar-ressarcimento",
  "/api/acordaos/:key/analisar-ressarcimento",
  "/api/comissao-etica",
  "/api/comissao-etica/:id",
  "/api/unidades-rol",
  "/api/unidades-rol/:id",
  "/api/dirigentes",
  "/api/dirigentes/:id",
  "/api/dirigentes/cargos",
  "/api/dirigentes/cargos/:id",
  "/api/dirigentes/eventos",
  "/api/dirigentes/eventos/:id"
]

original_len = len(content)

for path in endpoints:
    escaped_path = re.escape(path)
    # Match app.get("PATH", (req, res) => { ... }) up to next app.METHOD or end of file comments
    pattern = r'app\.(get|post|put|delete)\("' + escaped_path + r'".*?(?=\n\s*app\.(get|post|put|delete)\(|\n\s*// ===|\n\s*if \(process\.env)'
    content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Cleaned up server.ts. Removed {original_len - len(content)} characters.")
